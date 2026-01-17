-- Migration: Add workspaces for multi-tenancy
-- Each workspace isolates songs, setlists, and users

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

-- Invites table (for inviting users to workspace)
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);

-- Add workspace_id and role to users
ALTER TABLE users ADD COLUMN workspace_id TEXT REFERENCES workspaces(id);
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member';

-- Add workspace_id to songs
ALTER TABLE songs ADD COLUMN workspace_id TEXT REFERENCES workspaces(id);

-- Add workspace_id to setlists
ALTER TABLE setlists ADD COLUMN workspace_id TEXT REFERENCES workspaces(id);

-- Indexes for efficient workspace-scoped queries
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_songs_workspace ON songs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_setlists_workspace ON setlists(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_workspace ON invites(workspace_id);
