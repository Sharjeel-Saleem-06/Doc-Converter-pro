-- ============================================
-- DocConverter Pro - Database Migration Script
-- This script adds missing fields and improves history tracking
-- ============================================

-- Run this in Supabase SQL Editor

-- Add converted_file_name to store the output filename
ALTER TABLE conversion_history 
ADD COLUMN IF NOT EXISTS converted_file_name TEXT;

-- Add processing_time_ms to track how long conversion took
ALTER TABLE conversion_history 
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- Add metadata JSONB field for storing additional conversion info
ALTER TABLE conversion_history 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Create index for better performance on metadata queries
CREATE INDEX IF NOT EXISTS idx_history_metadata ON conversion_history USING GIN (metadata);

-- Update existing records to have empty metadata if null
UPDATE conversion_history SET metadata = '{}'::jsonb WHERE metadata IS NULL;

-- Create a function to clean old history (older than 90 days)
CREATE OR REPLACE FUNCTION clean_old_history()
RETURNS void AS $$
BEGIN
  DELETE FROM conversion_history 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean old history automatically
-- (This requires pg_cron extension - uncomment if you want to use it)
-- SELECT cron.schedule('clean-old-history', '0 0 * * 0', 'SELECT clean_old_history()');

SELECT 'Database migration completed successfully! History table updated.' as status;
