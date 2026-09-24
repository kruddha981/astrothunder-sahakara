// db.js
// Opens (or creates) a local SQLite file and makes sure the schema exists.
// SQLite is the right call for a 24hr hackathon: zero setup, one file,
// no server to install. Swap for Postgres later if you need concurrent
// writers at scale — the rest of the code doesn't need to change much.

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS shelters (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    zone       TEXT NOT NULL,
    capacity   REAL NOT NULL,     -- remaining lbs they can take right now
    accepting  INTEGER NOT NULL DEFAULT 1  -- 0/1 boolean
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    available  INTEGER NOT NULL DEFAULT 1  -- 0/1 boolean
  );

  CREATE TABLE IF NOT EXISTS donations (
    id                    TEXT PRIMARY KEY,
    donor_name            TEXT NOT NULL,
    food_type             TEXT NOT NULL,
    quantity              REAL NOT NULL,   -- lbs
    expiry_hours          INTEGER NOT NULL,
    zone                  TEXT NOT NULL,
    status                TEXT NOT NULL DEFAULT 'posted',
      -- posted | matched | picked_up | delivered | unmatched
    matched_shelter_id    TEXT,
    assigned_driver_id    TEXT,
    rejected_shelter_ids  TEXT NOT NULL DEFAULT '[]', -- JSON array string
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (matched_shelter_id) REFERENCES shelters(id),
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id)
  );
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL,          -- donor | shelter | driver | volunteer
    organization  TEXT,
    phone         TEXT,
    zone          TEXT DEFAULT 'Central',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otp_verifications (
    id         TEXT PRIMARY KEY,
    email      TEXT NOT NULL,
    otp_code   TEXT NOT NULL,
    purpose    TEXT NOT NULL,            -- signup | login | reset
    payload    TEXT,                     -- temporary JSON data
    expires_at INTEGER NOT NULL,         -- epoch timestamp in ms
    verified   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
