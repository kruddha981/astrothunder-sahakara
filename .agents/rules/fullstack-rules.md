# Full-Stack Sahakara Development Rules

- **Workspace Layout:**
  - `frontend/`: Single-page app with `index.html`, `styles.css`, `script.js`.
  - `backend/`: Express REST API running on port 3001 using `better-sqlite3`.
- **Target Browser:** Brave Browser (`open -a "Brave Browser"`).
- **Frontend Server:** Port 8080 (`python3 -m http.server 8080` in `frontend/`).
- **Backend Server:** Port 3001 (`npm start` in `backend/`).
- **API Communication:**
  - All frontend API calls point to `http://localhost:3001/api/*`.
  - Handle offline and error scenarios gracefully in UI.
- **Consistency:** Whenever backend schemas or matching algorithms change, update the corresponding frontend presentation logic.
