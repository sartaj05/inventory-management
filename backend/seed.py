"""Seed demo data for local assessment review.
Run from backend folder:
    python seed.py
"""
from decimal import Decimal

from app.auth import hash_password
from app.database import SessionLocal, init_db
from app import models


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        demo_email = "demo@example.com"
        user = db.query(models.User).filter(models.User.email == demo_email).first()
        if not user:
            db.add(
                models.User(
                    full_name="Demo Admin",
                    email=demo_email,
                    hashed_password=hash_password("Demo@12345"),
                    role="admin",
                    is_active=True,
                )
            )

        products = [
            {"name": "Wireless Keyboard", "sku": "KB-001", "description": "Compact wireless keyboard", "price": Decimal("1299.00"), "quantity": 25, "category": "Electronics"},
            {"name": "USB Mouse", "sku": "MS-001", "description": "Ergonomic optical mouse", "price": Decimal("499.00"), "quantity": 50, "category": "Electronics"},
            {"name": "Notebook Pack", "sku": "NB-001", "description": "Pack of 5 notebooks", "price": Decimal("250.00"), "quantity": 4, "category": "Stationery"},
            {"name": "Office Chair", "sku": "CHR-001", "description": "Mesh back office chair", "price": Decimal("5499.00"), "quantity": 8, "category": "Furniture"},
        ]
        for item in products:
            exists = db.query(models.Product).filter(models.Product.sku == item["sku"]).first()
            if not exists:
                db.add(models.Product(**item))

        customers = [
            {"full_name": "Rahul Sharma", "email": "rahul@example.com", "phone": "9876543210", "address": "Delhi"},
            {"full_name": "Priya Verma", "email": "priya@example.com", "phone": "9123456780", "address": "Noida"},
        ]
        for item in customers:
            exists = db.query(models.Customer).filter(models.Customer.email == item["email"]).first()
            if not exists:
                db.add(models.Customer(**item))

        db.commit()
        print("Seed data created successfully.")
        print("Demo login: demo@example.com / Demo@12345")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
