#!/bin/sh
set -e

# FastAPI lifespan creates tables for assessment/demo.
# If Alembic is configured later, replace this with: alembic upgrade head

exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${WEB_CONCURRENCY:-1} \
  --timeout 120
