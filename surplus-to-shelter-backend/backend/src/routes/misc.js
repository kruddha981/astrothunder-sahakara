const express = require('express');
const router = express.Router();
const donationService = require('../donationService');

// GET /api/shelters
router.get('/shelters', (req, res) => {
  res.json(donationService.getAllShelters());
});

// PATCH /api/shelters/:id/toggle - flip a shelter's accepting status
router.patch('/shelters/:id/toggle', (req, res) => {
  try {
    res.json(donationService.toggleShelterAccepting(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/drivers
router.get('/drivers', (req, res) => {
  res.json(donationService.getAllDrivers());
});

// GET /api/stats - dashboard numbers
router.get('/stats', (req, res) => {
  res.json(donationService.getStats());
});

module.exports = router;
