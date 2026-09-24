const express = require('express');
const router = express.Router();
const donationService = require('../donationService');
const { ZONES } = require('../matching');
const { authenticateToken, requireRole } = require('./auth');

// GET /api/donations - list all
router.get('/', async (req, res, next) => {
  try {
    res.json(await donationService.getAllDonations());
  } catch (error) {
    next(error);
  }
});

// POST /api/donations - post a new surplus donation, auto-match it
router.post('/', authenticateToken, requireRole('donor'), async (req, res, next) => {
  const { donorName, foodType, quantity, expiryHours, zone } = req.body;

  if (!foodType || !quantity || !zone) {
    return res.status(400).json({
      error: 'foodType, quantity, and zone are required',
    });
  }
  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'quantity must be a positive number' });
  }
  if (!Object.hasOwn(ZONES, zone)) {
    return res.status(400).json({
      error: `zone must be one of: ${Object.keys(ZONES).join(', ')}`,
    });
  }
  if (
    expiryHours !== undefined &&
    (!Number.isInteger(expiryHours) || expiryHours < 2 || expiryHours > 6)
  ) {
    return res.status(400).json({ error: 'expiryHours must be an integer from 2 to 6' });
  }

  try {
    const donation = await donationService.createDonation({
      donorId: req.user.id,
      donorName,
      foodType,
      quantity,
      expiryHours: expiryHours || 4,
      zone,
    });
    res.status(201).json(donation);
  } catch (error) {
    next(error);
  }
});

// GET /api/donations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const donation = await donationService.getDonation(req.params.id);
    if (!donation) return res.status(404).json({ error: 'Donation not found' });
    res.json(donation);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/donations/:id/retry - retry matching after capacity or driver availability changes
router.patch('/:id/retry', authenticateToken, requireRole('donor'), async (req, res) => {
  try {
    res.json(await donationService.retryMatch(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/donations/:id/decline - shelter declines a matched donation
router.patch('/:id/decline', authenticateToken, requireRole('shelter'), async (req, res) => {
  try {
    res.json(await donationService.declineMatch(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/donations/:id/pickup - driver marks picked up
router.patch('/:id/pickup', authenticateToken, requireRole('driver'), async (req, res) => {
  try {
    res.json(await donationService.markPickedUp(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/donations/:id/deliver - driver marks delivered
router.patch('/:id/deliver', authenticateToken, requireRole('driver'), async (req, res) => {
  try {
    res.json(await donationService.markDelivered(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
