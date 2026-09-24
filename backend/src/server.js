const express = require('express');
const cors = require('cors');

const seed = require('./seed');
const donationsRouter = require('./routes/donations');
const miscRouter = require('./routes/misc');
const authRouter = require('./routes/auth');

seed(); // make sure shelters + drivers exist on first run

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/donations', donationsRouter);
app.use('/api', miscRouter); // /api/shelters, /api/drivers, /api/stats

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Basic error handler so a thrown error doesn't crash the whole demo
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Surplus-to-Shelter API running at http://localhost:${PORT}`);
});
