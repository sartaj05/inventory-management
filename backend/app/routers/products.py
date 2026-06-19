from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.auth import require_active_user
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=schemas.ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    return crud.create_product(db, payload)


@router.get("", response_model=schemas.PaginatedProducts)
def list_products(
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_active_user),
):
    return crud.list_products(db, q=q, category=category, page=page, limit=limit)


@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    return crud.get_product(db, product_id)


@router.put("/{product_id}", response_model=schemas.ProductRead)
def update_product(product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    return crud.update_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(require_active_user)):
    crud.delete_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
