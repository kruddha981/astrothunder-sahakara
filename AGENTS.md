# Sahakara Full-Stack Development Guidelines

This workspace contains the **Sahakara** platform (National Surplus-to-Shelter Food Rescue Platform), composed of a Node/Express backend and an interactive HTML5/CSS3/Vanilla JS frontend.

---

## 1. Project Architecture

```
astrothunder-sahakara/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── donations.js   # Donation creation, matching & feeds
│   │   │   └── misc.js        # Shelters, drivers, stats endpoints
│   │   ├── db.js              # SQLite database connection & schema
│   │   ├── engine.js          # Tiered food rescue matching engine
│   │   ├── seed.js            # Initial data for Jaipur cluster
│   │   └── server.js          # Express app entry point (port 3001)
│   ├── data.sqlite            # SQLite database file
│   └── package.json
├── frontend/
│   ├── index.html             # Main Single-Page Application
│   ├── styles.css             # Design tokens, layouts & components
│   └── script.js              # UI interactivity, API calls & Leaflet map
└── .agents/                   # Custom agent workflows & rules
```

---

## 2. Server & Environment Conventions

- **Backend Port:** `3001` (Base URL: `http://localhost:3001`)
  - Dev command: `npm start` or `npm run dev` in `backend/`
  - Health check: `GET http://localhost:3001/api/health`
- **Frontend Port:** `8080` (Base URL: `http://localhost:8080`)
  - Dev command: `python3 -m http.server 8080` in `frontend/`
- **Browser Execution:** When running/previewing, target **Brave Browser** (`open -a "Brave Browser" http://localhost:8080`).

---

## 3. Full-Stack Coordination Rules

### A. Frontend Guidelines (`frontend/`)
1. **API Integration:** Connect UI events (donation forms, live feeds, map markers, shelter lists, driver assignments) to the backend API (`http://localhost:3001/api/...`).
2. **Visual Standards:** Maintain a rich, modern aesthetic with dark mode accents, smooth micro-animations, glassmorphism badges, and clean typography (`Inter`, `JetBrains Mono`).
3. **Map & Geolocation:** Maintain Leaflet.js map integration with custom pin colors for donors (green/yellow/red depending on food ladder tier), shelters (blue), and drivers (purple).
4. **Resilience & Fallbacks:** Always handle network errors gracefully (show loading states, toast notifications, fallback offline demo data if API is unreachable).

### B. Backend Guidelines (`backend/`)
1. **Express & Better-SQLite3:** Use parameterized queries to prevent SQL injection.
2. **Matching Engine (`src/engine.js`):** Implement strict food rescue hierarchy (Tier 1: Cooked/Perishable to Shelters; Tier 2: Produce/Pantry; Tier 3: Raw/Scraps to Gaushalas/Compost).
3. **CORS:** Ensure `cors()` middleware is configured to allow `http://localhost:8080`.
4. **Validation:** Validate all incoming POST payloads (`foodType`, `quantityKg`, `cookedTime`, `expiryTime`, `donorLocation`) before inserting into SQLite.

---

## 4. Quick Verification Commands
- Check backend health: `curl -s http://localhost:3001/api/health`
- Check active shelters: `curl -s http://localhost:3001/api/shelters`
- Check stats: `curl -s http://localhost:3001/api/stats`
- Check active ports: `lsof -i :8080 -i :3001`
