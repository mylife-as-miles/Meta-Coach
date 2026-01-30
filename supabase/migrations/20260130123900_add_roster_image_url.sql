-- Add image_url column to roster table for player profile images
-- Run this in Supabase SQL Editor

ALTER TABLE roster ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment for documentation
COMMENT ON COLUMN roster.image_url IS 'Player profile image URL fetched from GRID or Gemini AI search';
