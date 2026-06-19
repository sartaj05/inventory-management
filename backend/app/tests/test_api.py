"""
Pytest tests for the Inventory & Order Management API.

Run with:
    python -m pytest app/tests -v

Uses SQLite test.db for tests.
Do not commit backend/test.db.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.auth import require_active_user
from app.models import User


# ── Use SQLite file DB for tests ────────────────────────────────
TEST_DB_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
)

TestingSession = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def override_require_active_user():
    return User(
        id=1,
        full_name="Test Admin",
        email="test@example.com",
        role="admin",
        is_active=True,
    )


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[require_active_user] = override_require_active_user

client = TestClient(app)


# ════════════════════════════════════════════════════════════════
#  Helpers
# ════════════════════════════════════════════════════════════════

def create_product(
    name="Test Product",
    sku="SKU-001",
    price=100.0,
    quantity=50,
):
    return client.post(
        "/products",
        json={
            "name": name,
            "sku": sku,
            "price": price,
            "quantity": quantity,
        },
    )


def create_customer(
    name="Rahul Sharma",
    email="rahul@test.com",
    phone="9876543210",
):
    return client.post(
        "/customers",
        json={
            "full_name": name,
            "email": email,
            "phone": phone,
        },
    )


# ════════════════════════════════════════════════════════════════
#  Product Tests
# ════════════════════════════════════════════════════════════════

class TestProducts:

    def test_create_product_success(self):
        res = create_product()

        assert res.status_code == 201

        data = res.json()

        assert data["name"] == "Test Product"
        assert data["sku"] == "SKU-001"
        assert data["id"] is not None

    def test_sku_is_uppercased(self):
        res = client.post(
            "/products",
            json={
                "name": "Widget",
                "sku": "wgt-99",
                "price": 50,
                "quantity": 10,
            },
        )

        assert res.status_code == 201
        assert res.json()["sku"] == "WGT-99"

    def test_duplicate_sku_returns_409(self):
        create_product(sku="DUPE-001")

        res = create_product(
            name="Another Product",
            sku="DUPE-001",
        )

        assert res.status_code == 409
        assert "SKU" in res.json()["detail"]

    def test_negative_price_rejected(self):
        res = client.post(
            "/products",
            json={
                "name": "Bad",
                "sku": "BAD-1",
                "price": -10,
                "quantity": 5,
            },
        )

        assert res.status_code == 422

    def test_negative_quantity_rejected(self):
        res = client.post(
            "/products",
            json={
                "name": "Bad",
                "sku": "BAD-2",
                "price": 10,
                "quantity": -1,
            },
        )

        assert res.status_code == 422

    def test_list_products_paginated(self):
        create_product(sku="P-001")
        create_product(name="Product 2", sku="P-002")

        res = client.get("/products?page=1&limit=10")

        assert res.status_code == 200

        data = res.json()

        assert "items" in data
        assert "total" in data
        assert data["total"] >= 2

    def test_get_product_by_id(self):
        created = create_product().json()

        res = client.get(f"/products/{created['id']}")

        assert res.status_code == 200
        assert res.json()["id"] == created["id"]

    def test_get_product_not_found(self):
        res = client.get("/products/99999")

        assert res.status_code == 404

    def test_update_product(self):
        pid = create_product().json()["id"]

        res = client.put(
            f"/products/{pid}",
            json={"price": 200.0},
        )

        assert res.status_code == 200
        assert float(res.json()["price"]) == 200.0

    def test_delete_product(self):
        pid = create_product(sku="DEL-001").json()["id"]

        res = client.delete(f"/products/{pid}")

        assert res.status_code == 204
        assert client.get(f"/products/{pid}").status_code == 404

    def test_search_product_by_name(self):
        create_product(name="Laptop Pro", sku="LAP-001")
        create_product(name="Wireless Mouse", sku="MOU-001")

        res = client.get("/products?q=laptop")

        assert res.status_code == 200

        items = res.json()["items"]

        assert any("Laptop" in p["name"] for p in items)


# ════════════════════════════════════════════════════════════════
#  Customer Tests
# ════════════════════════════════════════════════════════════════

class TestCustomers:

    def test_create_customer_success(self):
        res = create_customer()

        assert res.status_code == 201
        assert res.json()["email"] == "rahul@test.com"

    def test_email_is_lowercased(self):
        res = client.post(
            "/customers",
            json={
                "full_name": "Alice",
                "email": "ALICE@TEST.COM",
                "phone": "1234567",
            },
        )

        assert res.status_code == 201
        assert res.json()["email"] == "alice@test.com"

    def test_duplicate_email_returns_409(self):
        create_customer(email="dupe@test.com")

        res = client.post(
            "/customers",
            json={
                "full_name": "Other",
                "email": "dupe@test.com",
                "phone": "9999999",
            },
        )

        assert res.status_code == 409

    def test_invalid_email_rejected(self):
        res = client.post(
            "/customers",
            json={
                "full_name": "Bad",
                "email": "not-an-email",
                "phone": "1234567",
            },
        )

        assert res.status_code == 422

    def test_list_customers_paginated(self):
        create_customer(email="c1@test.com")
        create_customer(name="Jane", email="c2@test.com")

        res = client.get("/customers?page=1&limit=10")

        assert res.status_code == 200
        assert res.json()["total"] >= 2

    def test_update_customer(self):
        cid = create_customer().json()["id"]

        res = client.put(
            f"/customers/{cid}",
            json={"full_name": "Rahul Updated"},
        )

        assert res.status_code == 200
        assert res.json()["full_name"] == "Rahul Updated"

    def test_delete_customer(self):
        cid = create_customer(email="del@test.com").json()["id"]

        res = client.delete(f"/customers/{cid}")

        assert res.status_code == 204


# ════════════════════════════════════════════════════════════════
#  Order Tests
# ════════════════════════════════════════════════════════════════

class TestOrders:

    def _setup(self):
        product = create_product(
            sku="ORD-P1",
            quantity=20,
        ).json()

        customer = create_customer(
            email="order@test.com",
        ).json()

        return product, customer

    def test_create_order_success(self):
        product, customer = self._setup()

        res = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 5,
                    }
                ],
            },
        )

        assert res.status_code == 201

        data = res.json()

        assert float(data["total_amount"]) == float(product["price"]) * 5
        assert data["status"] == "pending"

    def test_get_order_by_id_with_items(self):
        product, customer = self._setup()

        order = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 2,
                    }
                ],
                "notes": "Urgent delivery",
            },
        ).json()

        res = client.get(f"/orders/{order['id']}")

        assert res.status_code == 200

        data = res.json()

        assert data["id"] == order["id"]
        assert data["customer"]["id"] == customer["id"]
        assert data["customer"]["email"] == customer["email"]
        assert data["items"][0]["product"]["id"] == product["id"]
        assert data["items"][0]["product"]["sku"] == product["sku"]
        assert data["items"][0]["quantity"] == 2
        assert data["notes"] == "Urgent delivery"

    def test_order_reduces_stock(self):
        product, customer = self._setup()

        client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 3,
                    }
                ],
            },
        )

        updated = client.get(f"/products/{product['id']}").json()

        assert updated["quantity"] == 17

    def test_insufficient_stock_rejected(self):
        product, customer = self._setup()

        res = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 999,
                    }
                ],
            },
        )

        assert res.status_code == 400
        assert "Insufficient" in res.json()["detail"]

    def test_invalid_customer_rejected(self):
        product = create_product(
            sku="ORD-P2",
            quantity=10,
        ).json()

        res = client.post(
            "/orders",
            json={
                "customer_id": 99999,
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 1,
                    }
                ],
            },
        )

        assert res.status_code == 404

    def test_delete_order_restores_stock(self):
        product, customer = self._setup()

        order = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 5,
                    }
                ],
            },
        ).json()

        client.delete(f"/orders/{order['id']}")

        updated = client.get(f"/products/{product['id']}").json()

        assert updated["quantity"] == 20

    def test_update_order_status_to_fulfilled(self):
        product, customer = self._setup()

        order = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 2,
                    }
                ],
            },
        ).json()

        res = client.patch(
            f"/orders/{order['id']}/status",
            json={"status": "fulfilled"},
        )

        assert res.status_code == 200
        assert res.json()["status"] == "fulfilled"

    def test_cancel_order_restores_stock(self):
        product, customer = self._setup()

        order = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 4,
                    }
                ],
            },
        ).json()

        client.patch(
            f"/orders/{order['id']}/status",
            json={"status": "cancelled"},
        )

        updated = client.get(f"/products/{product['id']}").json()

        assert updated["quantity"] == 20

    def test_list_orders_with_status_filter(self):
        product, customer = self._setup()

        order = client.post(
            "/orders",
            json={
                "customer_id": customer["id"],
                "items": [
                    {
                        "product_id": product["id"],
                        "quantity": 1,
                    }
                ],
            },
        ).json()

        client.patch(
            f"/orders/{order['id']}/status",
            json={"status": "fulfilled"},
        )

        res = client.get("/orders?status=fulfilled")

        assert res.status_code == 200
        assert all(o["status"] == "fulfilled" for o in res.json()["items"])


# ════════════════════════════════════════════════════════════════
#  Dashboard Tests
# ════════════════════════════════════════════════════════════════

class TestDashboard:

    def test_dashboard_summary_structure(self):
        res = client.get("/dashboard/summary")

        assert res.status_code == 200

        data = res.json()

        for key in [
            "total_products",
            "total_customers",
            "total_orders",
            "low_stock_count",
            "total_inventory_value",
            "total_sales_amount",
            "pending_orders",
            "fulfilled_orders",
            "cancelled_orders",
        ]:
            assert key in data, f"Missing key: {key}"

    def test_low_stock_detection(self):
        client.post(
            "/products",
            json={
                "name": "Low Item",
                "sku": "LOW-001",
                "price": 10,
                "quantity": 2,
            },
        )

        res = client.get("/dashboard/summary")

        assert res.json()["low_stock_count"] >= 1