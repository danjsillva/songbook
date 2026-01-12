-- Migration: Add created_by to songs and setlists
-- Tracks which user created each song/setlist

ALTER TABLE songs ADD COLUMN created_by TEXT;
ALTER TABLE setlists ADD COLUMN created_by TEXT;
