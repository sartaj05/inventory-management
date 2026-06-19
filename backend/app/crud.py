import math
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.config import settings


def _conflict_from_integrity_error(error: IntegrityError) -> HTTPException:
    text = str(error.orig).lower()
    if "products_sku" in text or "sku" in text:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product SKU already exists.")
    if "customers_email" in text or "email" in text:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Customer email already exists.")
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Database constraint violation.")


# ─────────────────────────── Products ───────────────────────────

def create_product(db: Session, payload: schemas.ProductCreate) -> models.Product:
    product = models.Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError as error:
        db.rollback()
        raise _conflict_from_integrity_error(error)


def list_products(
    db: Session,
    q: str | None = None,
    category: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> schemas.PaginatedProducts:
    query = db.query(models.Product)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(models.Product.name.ilike(keyword), models.Product.sku.ilike(keyword))
        )
    if category:
        query = query.filter(models.Product.category.ilike(f"%{category.strip()}%"))

    total = query.count()
    pages = max(1, math.ceil(total / limit))
    items = query.order_by(models.Product.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return schemas.PaginatedProducts(items=items, total=total, page=page, limit=limit, pages=pages)


def get_product(db: Session, product_id: int) -> models.Product:
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


def update_product(db: Session, product_id: int, payload: schemas.ProductUpdate) -> models.Product:
    product = get_product(db, product_id)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return product
    for field, value in update_data.items():
        setattr(product, field, value)
    try:
        db.commit()
        db.refresh(product)
        return product
    except IntegrityError as error:
        db.rollback()
        raise _conflict_from_integrity_error(error)


def delete_product(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    db.delete(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product cannot be deleted because it is linked with existing orders.",
        )


# ─────────────────────────── Customers ───────────────────────────

def create_customer(db: Session, payload: schemas.CustomerCreate) -> models.Customer:
    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
        return customer
    except IntegrityError as error:
        db.rollback()
        raise _conflict_from_integrity_error(error)


def list_customers(
    db: Session,
    q: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> schemas.PaginatedCustomers:
    query = db.query(models.Customer)
    if q:
        keyword = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Customer.full_name.ilike(keyword),
                models.Customer.email.ilike(keyword),
                models.Customer.phone.ilike(keyword),
            )
        )
    total = query.count()
    pages = max(1, math.ceil(total / limit))
    items = query.order_by(models.Customer.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return schemas.PaginatedCustomers(items=items, total=total, page=page, limit=limit, pages=pages)


def get_customer(db: Session, customer_id: int) -> models.Customer:
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")
    return customer


def update_customer(db: Session, customer_id: int, payload: schemas.CustomerUpdate) -> models.Customer:
    customer = get_customer(db, customer_id)
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        return customer
    for field, value in update_data.items():
        setattr(customer, field, value)
    try:
        db.commit()
        db.refresh(customer)
        return customer
    except IntegrityError as error:
        db.rollback()
        raise _conflict_from_integrity_error(error)


def delete_customer(db: Session, customer_id: int) -> None:
    customer = get_customer(db, customer_id)
    db.delete(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer cannot be deleted because existing orders are linked to this customer.",
        )


# ─────────────────────────── Orders ───────────────────────────

def create_order(db: Session, payload: schemas.OrderCreate) -> models.Order:
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found.")

    requested_quantities: dict[int, int] = {}
    for item in payload.items:
        requested_quantities[item.product_id] = requested_quantities.get(item.product_id, 0) + item.quantity

    product_ids = list(requested_quantities.keys())
    products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )

    if len(products) != len(product_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more products were not found.")

    product_map = {product.id: product for product in products}

    for product_id, quantity in requested_quantities.items():
        product = product_map[product_id]
        if product.quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {quantity}.",
            )

    total_amount = Decimal("0.00")
    order = models.Order(
        customer_id=payload.customer_id,
        total_amount=total_amount,
        status=models.OrderStatus.pending,
        notes=payload.notes,
    )
    db.add(order)
    db.flush()

    for product_id, quantity in requested_quantities.items():
        product = product_map[product_id]
        unit_price = product.price
        line_total = unit_price * quantity
        total_amount += line_total
        product.quantity -= quantity
        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=product_id,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    order.total_amount = total_amount

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise _conflict_from_integrity_error(error)

    return get_order(db, order.id)


def list_orders(
    db: Session,
    status_filter: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> schemas.PaginatedOrders:
    query = db.query(models.Order).options(
        selectinload(models.Order.customer),
        selectinload(models.Order.items).selectinload(models.OrderItem.product),
    )
    if status_filter:
        query = query.filter(models.Order.status == status_filter)

    total = query.count()
    pages = max(1, math.ceil(total / limit))
    items = query.order_by(models.Order.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return schemas.PaginatedOrders(items=items, total=total, page=page, limit=limit, pages=pages)


def get_order(db: Session, order_id: int) -> models.Order:
    order = (
        db.query(models.Order)
        .options(
            selectinload(models.Order.customer),
            selectinload(models.Order.items).selectinload(models.OrderItem.product),
        )
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return order


def update_order_status(db: Session, order_id: int, payload: schemas.OrderStatusUpdate) -> models.Order:
    order = (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    # If cancelling a non-cancelled order, restore stock
    if payload.status == models.OrderStatus.cancelled and order.status != models.OrderStatus.cancelled:
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                product.quantity += item.quantity

    # If un-cancelling back to pending/fulfilled, re-deduct stock
    elif order.status == models.OrderStatus.cancelled and payload.status != models.OrderStatus.cancelled:
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                if product.quantity < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock to reactivate order for '{product.name}'.",
                    )
                product.quantity -= item.quantity

    order.status = payload.status
    db.commit()
    return get_order(db, order_id)


def delete_order(db: Session, order_id: int) -> None:
    order = (
        db.query(models.Order)
        .options(selectinload(models.Order.items))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    if order.status != models.OrderStatus.cancelled:
        for item in order.items:
            product = db.get(models.Product, item.product_id)
            if product:
                product.quantity += item.quantity

    db.delete(order)
    db.commit()


# ─────────────────────────── Dashboard ───────────────────────────

def dashboard_summary(db: Session) -> schemas.DashboardSummary:
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()

    total_inventory_units = db.query(func.coalesce(func.sum(models.Product.quantity), 0)).scalar() or 0
    total_inventory_value = (
        db.query(func.coalesce(func.sum(models.Product.price * models.Product.quantity), 0)).scalar()
        or Decimal("0.00")
    )
    total_sales_amount = (
        db.query(func.coalesce(func.sum(models.Order.total_amount), 0))
        .filter(models.Order.status != models.OrderStatus.cancelled)
        .scalar()
        or Decimal("0.00")
    )

    pending_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.pending).count()
    fulfilled_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.fulfilled).count()
    cancelled_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.cancelled).count()

    low_stock_products = (
        db.query(models.Product)
        .filter(models.Product.quantity <= settings.low_stock_threshold)
        .order_by(models.Product.quantity.asc(), models.Product.name.asc())
        .all()
    )

    return schemas.DashboardSummary(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_inventory_units=total_inventory_units,
        total_inventory_value=total_inventory_value,
        total_sales_amount=total_sales_amount,
        low_stock_count=len(low_stock_products),
        low_stock_products=low_stock_products,
        pending_orders=pending_orders,
        fulfilled_orders=fulfilled_orders,
        cancelled_orders=cancelled_orders,
    )
