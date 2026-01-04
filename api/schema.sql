-- Tabela principal de músicas
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  original_key TEXT,
  bpm INTEGER,
  youtube_url TEXT,
  content TEXT NOT NULL,
  plain_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_viewed_at INTEGER
);

-- Índices para ordenação
CREATE INDEX IF NOT EXISTS idx_songs_created_at ON songs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
CREATE INDEX IF NOT EXISTS idx_songs_last_viewed ON songs(last_viewed_at DESC);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
  title,
  artist,
  plain_text,
  content='songs',
  content_rowid='rowid'
);

-- Triggers para manter FTS sincronizado
CREATE TRIGGER IF NOT EXISTS songs_ai AFTER INSERT ON songs BEGIN
  INSERT INTO songs_fts(rowid, title, artist, plain_text)
  VALUES (NEW.rowid, NEW.title, NEW.artist, NEW.plain_text);
END;

CREATE TRIGGER IF NOT EXISTS songs_ad AFTER DELETE ON songs BEGIN
  INSERT INTO songs_fts(songs_fts, rowid, title, artist, plain_text)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.artist, OLD.plain_text);
END;

CREATE TRIGGER IF NOT EXISTS songs_au AFTER UPDATE ON songs BEGIN
  INSERT INTO songs_fts(songs_fts, rowid, title, artist, plain_text)
  VALUES ('delete', OLD.rowid, OLD.title, OLD.artist, OLD.plain_text);
  INSERT INTO songs_fts(rowid, title, artist, plain_text)
  VALUES (NEW.rowid, NEW.title, NEW.artist, NEW.plain_text);
END;

-- Setlists
CREATE TABLE IF NOT EXISTS setlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_viewed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_setlists_date ON setlists(date DESC);
CREATE INDEX IF NOT EXISTS idx_setlists_last_viewed ON setlists(last_viewed_at DESC);

-- Músicas no setlist (ordem + tom específico + bpm + notas)
-- Permite a mesma música aparecer múltiplas vezes com tons diferentes
CREATE TABLE IF NOT EXISTS setlist_songs (
  id TEXT PRIMARY KEY,
  setlist_id TEXT NOT NULL,
  song_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  key TEXT NOT NULL,
  bpm INTEGER,
  notes TEXT,
  FOREIGN KEY (setlist_id) REFERENCES setlists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist ON setlist_songs(setlist_id);
