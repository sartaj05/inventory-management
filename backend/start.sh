#!/bin/sh
set -e

alembic upgrade head || echo "Alembic migration skipped or not configured."

exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${WEB_CONCURRENCY:-1}