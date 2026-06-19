from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import require_active_user, require_admin_user
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("", response_model=schemas.CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    return crud.create_customer(db, payload)


@router.get("", response_model=schemas.PaginatedCustomers)
def list_customers(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_active_user),
):
    return crud.list_customers(db, q=q, page=page, limit=limit)


@router.get("/{customer_id}", response_model=schemas.CustomerRead)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_active_user),
):
    return crud.get_customer(db, customer_id)


@router.put("/{customer_id}", response_model=schemas.CustomerRead)
def update_customer(
    customer_id: int,
    payload: schemas.CustomerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    return crud.update_customer(db, customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin_user),
):
    crud.delete_customer(db, customer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)