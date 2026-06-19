from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import require_active_user
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=schemas.OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    return crud.create_order(db, payload)


@router.get("", response_model=schemas.PaginatedOrders)
def list_orders(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_active_user),
):
    return crud.list_orders(db, status_filter=status, page=page, limit=limit)


@router.get("/{order_id}", response_model=schemas.OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    return crud.get_order(db, order_id)


@router.patch("/{order_id}/status", response_model=schemas.OrderRead)
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    return crud.update_order_status(db, order_id, payload)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    crud.delete_order(db, order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
