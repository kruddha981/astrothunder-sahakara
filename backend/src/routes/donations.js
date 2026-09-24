const express = require('express');
const router = express.Router();
const donationService = require('../donationService');
const { ZONES } = require('../matching');

// GET /api/donations - list all
router.get('/', (req, res) => {
  res.json(donationService.getAllDonations());
});

// POST /api/donations - post a new surplus donation, auto-match it
router.post('/', (req, res) => {
  const { donorName, foodType, quantity, expiryHours, zone } = req.body;

  if (!donorName || !foodType || !quantity || !zone) {
    return res.status(400).json({
      error: 'donorName, foodType, quantity, and zone are required',
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

  const donation = donationService.createDonation({
    donorName,
    foodType,
    quantity,
    expiryHours: expiryHours || 4,
    zone,
  });
  res.status(201).json(donation);
});

// GET /api/donations/:id
router.get('/:id', (req, res) => {
  const donation = donationService.getDonation(req.params.id);
  if (!donation) return res.status(404).json({ error: 'Donation not found' });
  res.json(donation);
});

// PATCH /api/donations/:id/decline - shelter declines a matched donation
router.patch('/:id/decline', (req, res) => {
  try {
    res.json(donationService.declineMatch(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/donations/:id/pickup - driver marks picked up
router.patch('/:id/pickup', (req, res) => {
  try {
    res.json(donationService.markPickedUp(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/donations/:id/deliver - driver marks delivered
router.patch('/:id/deliver', (req, res) => {
  try {
    res.json(donationService.markDelivered(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
