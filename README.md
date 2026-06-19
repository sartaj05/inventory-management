# 📦 Inventory & Order Management System

A full-stack, production-ready Inventory & Order Management System built with **FastAPI**, **React**, and **PostgreSQL** — fully containerized with Docker.

---

## 🚀 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Python 3.12, FastAPI 0.115          |
| Frontend    | React 18, Vite 5                    |
| Database    | PostgreSQL 16                       |
| Container   | Docker, Docker Compose              |
| Deploy (BE) | Render.com                          |
| Deploy (FE) | Vercel                              |

---

## ✨ Features

### Backend
- **Products** — CRUD with SKU uniqueness, category, description, pagination
- **Customers** — CRUD with email uniqueness, address, pagination
- **Orders** — Create/cancel with automatic stock management, status tracking (pending → fulfilled → cancelled)
- **Dashboard** — Summary stats: inventory value, sales revenue, low stock alerts, order status breakdown
- Pagination on all list endpoints (`?page=1&limit=20`)
- Full input validation via Pydantic v2
- Proper HTTP status codes and structured error messages

### Frontend
- Responsive sidebar layout (desktop + mobile)
- Live badge alerts for low stock & pending orders
- Product search + category filter
- Customer search
- Order status filter (All / Pending / Fulfilled / Cancelled)
- Inline order status updates (Fulfill / Cancel / Reactivate)
- Estimated order total before submit
- Pagination on all tables

---

## 🏃 Quick Start (Docker Compose)

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/inventory-management.git
cd inventory-management

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your preferred passwords

# 3. Start all services
docker compose up --build

# Frontend → http://localhost
# Backend API → http://localhost:8000
# API Docs → http://localhost:8000/docs
```

---

## 💻 Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create a local .env with:
# DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/inventory_db

uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install

# Create .env.local:
# VITE_API_URL=http://localhost:8000

npm run dev
# → http://localhost:5173
```

---

## 🌐 Deployment

### Backend → Render.com
1. New Web Service → connect GitHub repo
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`
6. Create a free Render PostgreSQL database and copy the `DATABASE_URL`

### Frontend → Vercel
1. New Project → connect GitHub repo
2. Root Directory: `frontend`
3. Set `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy

### Docker Hub (image submission)
```bash
docker build -t yourdockerhub/inventory-backend ./backend
docker push yourdockerhub/inventory-backend
```

---

## 📋 API Reference

> All business APIs are protected with JWT authentication.  
> First login/register, then send token as:
> `Authorization: Bearer <access_token>`

| Method | Endpoint                      | Description                       |
|--------|-------------------------------|-----------------------------------|
| POST   | /auth/register                | Register a new user               |
| POST   | /auth/login                   | Login and receive JWT token       |
| GET    | /auth/me                      | Get logged-in user profile        |
| GET    | /products                     | List products (paginated)         |
| POST   | /products                     | Create product                    |
| GET    | /products/{id}                | Get product details               |
| PUT    | /products/{id}                | Update product                    |
| DELETE | /products/{id}                | Delete product                    |
| GET    | /customers                    | List customers (paginated)        |
| POST   | /customers                    | Create customer                   |
| GET    | /customers/{id}               | Get customer details              |
| PUT    | /customers/{id}               | Update customer                   |
| DELETE | /customers/{id}               | Delete customer                   |
| GET    | /orders                       | List orders (paginated)           |
| POST   | /orders                       | Create order                      |
| GET    | /orders/{id}                  | Get order details                 |
| PATCH  | /orders/{id}/status           | Update order status               |
| DELETE | /orders/{id}                  | Delete order and restore stock    |
| GET    | /dashboard/summary            | Dashboard summary stats           |
| GET    | /docs                         | Swagger API documentation         |
| GET    | /health                       | Health check                      |

---

## 📁 Project Structure

```
inventory-management/
├── backend/
│   ├── app/
│   │   ├── routers/         # products, customers, orders, dashboard
│   │   ├── config.py
│   │   ├── crud.py          # all DB operations
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   └── schemas.py       # Pydantic v2 schemas
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboard, ProductManager, CustomerManager, OrderManager
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── styles.css
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## 🔧 Business Rules

- Product SKU must be **unique** (auto-uppercased)
- Customer email must be **unique**
- Product quantity **cannot go negative**
- Orders **cannot be placed** if stock is insufficient
- Creating an order **automatically reduces** product stock
- Cancelling an order **automatically restores** product stock
- Total order amount is **calculated by the backend**
