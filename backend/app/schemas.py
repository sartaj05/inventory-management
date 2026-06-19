from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import OrderStatus


# ─────────────────────────── Products ───────────────────────────

class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    sku: str = Field(..., min_length=2, max_length=80)
    description: Optional[str] = Field(None, max_length=500)
    price: Decimal = Field(..., gt=0)
    quantity: int = Field(..., ge=0)
    category: Optional[str] = Field(None, max_length=100)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str) -> str:
        return value.strip().upper()


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    sku: Optional[str] = Field(None, min_length=2, max_length=80)
    description: Optional[str] = Field(None, max_length=500)
    price: Optional[Decimal] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)
    category: Optional[str] = Field(None, max_length=100)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: Optional[str]) -> Optional[str]:
        return " ".join(value.strip().split()) if value else value

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().upper() if value else value


class ProductRead(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────── Customers ───────────────────────────

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=30)
    address: Optional[str] = Field(None, max_length=300)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return value.strip()


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, min_length=7, max_length=30)
    address: Optional[str] = Field(None, max_length=300)

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: Optional[str]) -> Optional[str]:
        return " ".join(value.strip().split()) if value else value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[str]) -> Optional[str]:
        return value.strip().lower() if value else value


class CustomerRead(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────── Orders ───────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    items: list[OrderItemCreate] = Field(..., min_length=1)
    notes: Optional[str] = Field(None, max_length=500)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    product: ProductRead

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    status: OrderStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    customer: CustomerRead
    items: list[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────── Dashboard ───────────────────────────

class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_inventory_units: int
    total_inventory_value: Decimal
    total_sales_amount: Decimal
    low_stock_count: int
    low_stock_products: list[ProductRead]
    pending_orders: int
    fulfilled_orders: int
    cancelled_orders: int


# ─────────────────────────── Pagination ───────────────────────────

class PaginatedProducts(BaseModel):
    items: list[ProductRead]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedCustomers(BaseModel):
    items: list[CustomerRead]
    total: int
    page: int
    limit: int
    pages: int


class PaginatedOrders(BaseModel):
    items: list[OrderRead]
    total: int
    page: int
    limit: int
    pages: int
