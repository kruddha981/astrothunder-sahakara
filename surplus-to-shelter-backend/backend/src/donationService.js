// donationService.js
// Wires the pure matching logic (matching.js) to the database.
// This is where a donation's status actually moves through:
// posted -> matched -> picked_up -> delivered
// (or posted -> unmatched, if nothing fits)

const db = require('./db');
const { findBestShelter, findAvailableDriver } = require('./matching');

function getAllShelters() {
  return db.prepare('SELECT * FROM shelters').all();
}

function getAllDrivers() {
  return db.prepare('SELECT * FROM drivers').all();
}

function getDonation(id) {
  return db.prepare('SELECT * FROM donations WHERE id = ?').get(id);
}

function getAllDonations() {
  return db.prepare('SELECT * FROM donations ORDER BY created_at DESC').all();
}

/** Try to match a donation to a shelter + driver, and persist the result. */
function tryMatch(donationId) {
  const donation = getDonation(donationId);
  if (!donation) throw new Error('Donation not found');

  const excludeIds = JSON.parse(donation.rejected_shelter_ids || '[]');
  const shelter = findBestShelter(getAllShelters(), {
    zone: donation.zone,
    quantity: donation.quantity,
    excludeIds,
  });

  if (!shelter) {
    db.prepare(
      `UPDATE donations SET status = 'unmatched', matched_shelter_id = NULL WHERE id = ?`
    ).run(donationId);
    return getDonation(donationId);
  }

  const driver = findAvailableDriver(getAllDrivers());

  db.prepare(
    `UPDATE donations
     SET status = 'matched', matched_shelter_id = ?, assigned_driver_id = ?
     WHERE id = ?`
  ).run(shelter.id, driver ? driver.id : null, donationId);

  if (driver) {
    db.prepare('UPDATE drivers SET available = 0 WHERE id = ?').run(driver.id);
  }

  return getDonation(donationId);
}

/** Create a new donation and immediately attempt to match it. */
function createDonation({ donorName, foodType, quantity, expiryHours, zone }) {
  const id = 'd' + Date.now() + Math.floor(Math.random() * 1000);
  db.prepare(
    `INSERT INTO donations (id, donor_name, food_type, quantity, expiry_hours, zone)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, donorName, foodType, quantity, expiryHours, zone);

  return tryMatch(id);
}

/** Shelter declines a matched donation -> free the driver, re-run matching excluding that shelter. */
function declineMatch(donationId) {
  const donation = getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (donation.status !== 'matched') throw new Error('Only a matched donation can be declined');

  const excludeIds = JSON.parse(donation.rejected_shelter_ids || '[]');
  excludeIds.push(donation.matched_shelter_id);

  if (donation.assigned_driver_id) {
    db.prepare('UPDATE drivers SET available = 1 WHERE id = ?').run(donation.assigned_driver_id);
  }

  db.prepare(
    `UPDATE donations
     SET rejected_shelter_ids = ?, assigned_driver_id = NULL
     WHERE id = ?`
  ).run(JSON.stringify(excludeIds), donationId);

  return tryMatch(donationId);
}

function markPickedUp(donationId) {
  const donation = getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (donation.status !== 'matched') throw new Error('Donation must be matched before pickup');

  db.prepare(`UPDATE donations SET status = 'picked_up' WHERE id = ?`).run(donationId);
  return getDonation(donationId);
}

function markDelivered(donationId) {
  const donation = getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (donation.status !== 'picked_up') throw new Error('Donation must be picked up before delivery');

  db.prepare(`UPDATE donations SET status = 'delivered' WHERE id = ?`).run(donationId);

  db.prepare('UPDATE shelters SET capacity = MAX(0, capacity - ?) WHERE id = ?').run(
    donation.quantity,
    donation.matched_shelter_id
  );

  if (donation.assigned_driver_id) {
    db.prepare('UPDATE drivers SET available = 1 WHERE id = ?').run(donation.assigned_driver_id);
  }

  return getDonation(donationId);
}

function toggleShelterAccepting(shelterId) {
  const shelter = db.prepare('SELECT * FROM shelters WHERE id = ?').get(shelterId);
  if (!shelter) throw new Error('Shelter not found');
  db.prepare('UPDATE shelters SET accepting = ? WHERE id = ?').run(
    shelter.accepting ? 0 : 1,
    shelterId
  );
  return db.prepare('SELECT * FROM shelters WHERE id = ?').get(shelterId);
}

/** Impact numbers for the dashboard. */
function getStats() {
  const delivered = db.prepare(`SELECT * FROM donations WHERE status = 'delivered'`).all();
  const weight = delivered.reduce((sum, d) => sum + d.quantity, 0);
  const meals = Math.round(weight / 1.2); // ~1.2 lb per meal, rough estimate
  const co2Kg = Math.round(weight * 2.5 * 0.4536 * 10) / 10; // lb -> kg, ~2.5kg CO2e per kg food
  const active = db
    .prepare(`SELECT COUNT(*) AS n FROM donations WHERE status NOT IN ('delivered', 'unmatched')`)
    .get().n;

  return { mealsRescued: meals, weightDivertedLbs: weight, co2AvoidedKg: co2Kg, donationsInProgress: active };
}

module.exports = {
  getAllShelters,
  getAllDrivers,
  getAllDonations,
  getDonation,
  createDonation,
  declineMatch,
  markPickedUp,
  markDelivered,
  toggleShelterAccepting,
  getStats,
};
