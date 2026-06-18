# Inventory & Order Management System

Production-ready assessment project using:

- React frontend
- FastAPI backend
- PostgreSQL database
- Docker + Docker Compose
- Environment variable configuration
- Public deployment ready

## Main Features

### Products
- Add product
- View product list
- Update product
- Delete product
- Unique SKU validation
- Quantity cannot be negative

### Customers
- Add customer
- View customer list
- Delete customer
- Unique email validation

### Orders
- Create order with one or more products
- Backend calculates total amount
- Inventory is reduced automatically
- Order is blocked if stock is insufficient
- Delete/cancel order restores stock

### Dashboard
- Total products
- Total customers
- Total orders
- Low stock products

## System Design Flow

```text
User Browser
   |
   v
React Frontend
   |
   | REST API calls
   v
FastAPI Backend
   |
   | SQLAlchemy ORM
   v
PostgreSQL Database
```

## Database Design

```text
products
- id
- name
- sku unique
- price
- quantity
- created_at
- updated_at

customers
- id
- full_name
- email unique
- phone
- created_at

orders
- id
- customer_id FK
- total_amount
- created_at

order_items
- id
- order_id FK
- product_id FK
- quantity
- unit_price
- line_total
```

## Run Locally with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger API Docs: http://localhost:8000/docs

## Run Backend Without Docker

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

For Linux/macOS:

```bash
source .venv/bin/activate
```

## Run Frontend Without Docker

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Health
```http
GET /health
```

### Products
```http
POST /products
GET /products
GET /products/{id}
PUT /products/{id}
DELETE /products/{id}
```

### Customers
```http
POST /customers
GET /customers
GET /customers/{id}
DELETE /customers/{id}
```

### Orders
```http
POST /orders
GET /orders
GET /orders/{id}
DELETE /orders/{id}
```

### Dashboard
```http
GET /dashboard/summary
```

## Example Order Payload

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 2,
      "quantity": 1
    }
  ]
}
```

## Deployment Recommendation

Recommended free-friendly deployment:

- Backend: Render Web Service
- Database: Render PostgreSQL
- Frontend: Vercel

### Backend Deployment on Render

1. Push this project to GitHub.
2. Create PostgreSQL database on Render.
3. Create new Web Service from GitHub.
4. Set root directory: `backend`
5. Use Docker deployment or use:
   - Build Command: `pip install -r requirements.txt`
   - Start Command:
     ```bash
     gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2
     ```
6. Add environment variables:
   - `DATABASE_URL`
   - `CORS_ORIGINS`
   - `LOW_STOCK_THRESHOLD`

Example `CORS_ORIGINS` after frontend deployment:

```text
https://your-frontend.vercel.app
```

### Frontend Deployment on Vercel

1. Import GitHub repository in Vercel.
2. Set root directory: `frontend`
3. Build command:
   ```bash
   npm run build
   ```
4. Output directory:
   ```text
   dist
   ```
5. Add environment variable:
   ```text
   VITE_API_URL=https://your-backend.onrender.com
   ```

## Docker Hub Backend Image

Build backend image:

```bash
docker build -t your-dockerhub-username/inventory-backend:1.0 ./backend
```

Login:

```bash
docker login
```

Push:

```bash
docker push your-dockerhub-username/inventory-backend:1.0
```

Submit this URL:

```text
https://hub.docker.com/r/your-dockerhub-username/inventory-backend
```

## GitHub Commit Plan

Use small professional commits:

```bash
git init
git add .
git commit -m "chore: initialize inventory management project"

git add backend
git commit -m "feat: add FastAPI backend with product customer and order APIs"

git add frontend
git commit -m "feat: add React frontend for dashboard and management screens"

git add Dockerfile docker-compose.yml .dockerignore .env.example README.md .gitignore
git commit -m "chore: add Docker Compose and deployment configuration"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-order-management.git
git push -u origin main
```

## Assessment Submission Items

Submit:

1. GitHub repository link
2. Docker Hub backend image link
3. Frontend hosted URL
4. Backend API hosted URL
