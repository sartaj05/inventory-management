# run_migration.py
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE products 
          ADD COLUMN IF NOT EXISTS description VARCHAR(500),
          ADD COLUMN IF NOT EXISTS category VARCHAR(100);
    """))
    conn.execute(text("""
        ALTER TABLE orders
          ADD COLUMN IF NOT EXISTS notes VARCHAR(500),
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    """))
    conn.execute(text("""
        DO $$ BEGIN
          CREATE TYPE orderstatus AS ENUM ('pending', 'fulfilled', 'cancelled');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))
    conn.execute(text("""
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS status orderstatus NOT NULL DEFAULT 'pending';
    """))
    conn.commit()
    print("Migration done!")