# Surplus to Shelter — Backend

Node.js + Express + SQLite backend for the food rescue MVP. Implements the
donation lifecycle and the rule-based matching engine described in the
problem statement.

## Setup

```bash
npm install
npm run dev      # auto-restarts on file changes
# or: npm start
```

Server runs at `http://localhost:3001`. A `data.sqlite` file is created
automatically on first run and seeded with 5 shelters and 3 drivers.

## Project structure

```
src/
  db.js               - SQLite connection + schema
  seed.js             - inserts starter shelters/drivers (idempotent)
  matching.js          - CORE LOGIC: pure functions, no DB, easy to test/extend
  donationService.js   - wires matching.js to the database (the donation lifecycle)
  routes/
    donations.js       - POST/GET donations, decline/pickup/deliver
    misc.js             - shelters, drivers, dashboard stats
  server.js             - Express app + startup
```

**Start reading at `matching.js` then `donationService.js`** — that's the
whole "brain" of the app. Everything else is just HTTP plumbing around it.

## API

| Method | Endpoint                        | Description                                  |
|--------|----------------------------------|-----------------------------------------------|
| GET    | `/api/health`                   | Health check                                  |
| POST   | `/api/donations`                | Post a donation (auto-matches on creation)    |
| GET    | `/api/donations`                | List all donations                            |
| GET    | `/api/donations/:id`            | Get one donation                              |
| PATCH  | `/api/donations/:id/decline`    | Shelter declines match -> re-matches          |
| PATCH  | `/api/donations/:id/pickup`     | Driver marks picked up                        |
| PATCH  | `/api/donations/:id/deliver`    | Driver marks delivered -> updates capacity    |
| GET    | `/api/shelters`                 | List shelters                                 |
| PATCH  | `/api/shelters/:id/toggle`      | Flip a shelter's accepting status             |
| GET    | `/api/drivers`                  | List drivers                                  |
| GET    | `/api/stats`                    | Dashboard numbers (meals, weight, CO2e)       |

### Example: post a donation

```bash
curl -X POST http://localhost:3001/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "donorName": "Green Leaf Cafe",
    "foodType": "Pasta trays",
    "quantity": 40,
    "expiryHours": 4,
    "zone": "Downtown"
  }'
```

Valid `zone` values right now: `Downtown`, `Uptown`, `Eastside`, `Westside`,
`Southside` (see `ZONES` in `matching.js` — swap these for real
lat/lng + haversine distance once you have real addresses).

## Wiring up the frontend prototype

The HTML prototype from earlier keeps its own in-memory state. To connect
it to this backend, replace its direct array pushes with `fetch()` calls
to these endpoints (e.g. the donation form's submit handler calls
`POST /api/donations` instead of pushing into the local `donations` array,
then re-renders from the JSON response). Ask me if you want that wiring
done — it's a quick change once this backend is running.

## Notes / where to extend

- Matching is nearest-zone, accepting + capacity filtered — intentionally
  simple per the problem statement's guidance for an MVP.
- Swap `better-sqlite3` for Postgres later only if you need multiple
  servers writing at once; for a single-machine demo SQLite is simpler
  and needs no setup.
- No auth — fine for a hackathon demo, not for production.
