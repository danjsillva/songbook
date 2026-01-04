-- Add BPM and notes fields to setlist_songs table
ALTER TABLE setlist_songs ADD COLUMN bpm INTEGER;
ALTER TABLE setlist_songs ADD COLUMN notes TEXT;
