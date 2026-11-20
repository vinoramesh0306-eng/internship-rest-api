CREATE TABLE IF NOT EXISTS internships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  domain TEXT NOT NULL,
  location TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('Remote', 'Hybrid', 'On-site')),
  stipend TEXT NOT NULL,
  duration TEXT NOT NULL,
  deadline TEXT NOT NULL,
  skills TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
