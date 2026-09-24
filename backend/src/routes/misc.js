const express = require('express');
const router = express.Router();
const donationService = require('../donationService');

// GET /api/shelters
router.get('/shelters', async (req, res, next) => {
  try {
    res.json(await donationService.getAllShelters());
  } catch (error) {
    next(error);
  }
});

// PATCH /api/shelters/:id/toggle - flip a shelter's accepting status
router.patch('/shelters/:id/toggle', async (req, res) => {
  try {
    res.json(await donationService.toggleShelterAccepting(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/drivers
router.get('/drivers', async (req, res, next) => {
  try {
    res.json(await donationService.getAllDrivers());
  } catch (error) {
    next(error);
  }
});

// GET /api/stats - dashboard numbers
router.get('/stats', async (req, res, next) => {
  try {
    res.json(await donationService.getStats());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
