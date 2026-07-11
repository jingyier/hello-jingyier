CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  user_agent_hash TEXT,
  ip_hash TEXT,
  source TEXT NOT NULL DEFAULT 'home'
);

CREATE INDEX IF NOT EXISTS messages_status_created_at_idx
  ON messages (status, created_at DESC);
