-- 001 — Multi-segment tracking columns for activities
-- Apply on production DB:  psql $DATABASE_URL -f 001_add_segment_columns.sql

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS walk_km  DECIMAL(8, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bike_km  DECIMAL(8, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bus_km   DECIMAL(8, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS car_km   DECIMAL(8, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS segments JSONB;
