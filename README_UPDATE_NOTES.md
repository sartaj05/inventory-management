# Updated Assessment Code Notes

Use these files to strengthen your submission before sharing the GitHub link.

## Added / Updated

1. `backend/app/config.py`
   - Production `SECRET_KEY` validation.
   - Prevents using default development secret in production.

2. `backend/app/main.py`
   - Added `/health/db` database health check.
   - Added basic security headers.
   - Updated API version to `2.1.0`.

3. `backend/start.sh` and `backend/Dockerfile`
   - Production start using Gunicorn + Uvicorn worker.
   - Uses `$PORT`, which is safer for cloud deployment.
   - Adds Docker health check.
   - Runs container as non-root user.

4. `frontend/nginx.conf`
   - Required by your frontend Dockerfile.
   - Adds React SPA fallback: `try_files $uri /index.html`.
   - Adds frontend security headers.

5. `.dockerignore`
   - Added for backend and frontend.
   - Required for cleaner Docker builds.

6. `.env.example`
   - Use this instead of committing real `.env`.

7. `backend/seed.py`
   - Creates demo admin, products, and customers.
   - Demo login: `demo@example.com / Demo@12345`.

8. `backend/tests/test_api.py`
   - Added auth dependency override so protected routes can be tested.

9. `render.yaml`
   - Added `SECRET_KEY`, health check path, and production variables.

10. `.github/workflows/backend-tests.yml`
   - Adds CI test workflow for GitHub.

## Commands

```bash
cp .env.example .env
docker compose up --build
```

Seed demo data:

```bash
docker compose exec backend python seed.py
```

Run tests locally:

```bash
cd backend
pytest tests/ -v
```
