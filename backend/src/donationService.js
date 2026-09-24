// Supabase-backed donation lifecycle.
const db = require('./db');
const { findBestShelter, findAvailableDriver } = require('./matching');

async function getAllShelters() {
  const { data, error } = await db.from('shelters').select('*');
  if (error) throw error;
  return data;
}

async function getAllDrivers() {
  const { data, error } = await db.from('drivers').select('*');
  if (error) throw error;
  return data;
}

async function getDonation(id) {
  const { data, error } = await db.from('donations').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getAllDonations() {
  const { data, error } = await db.from('donations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function tryMatch(donationId) {
  const donation = await getDonation(donationId);
  if (!donation) throw new Error('Donation not found');

  const excludeIds = JSON.parse(donation.rejected_shelter_ids || '[]');
  const shelter = findBestShelter(await getAllShelters(), {
    zone: donation.zone,
    quantity: donation.quantity,
    excludeIds,
  });

  if (!shelter) {
    const { error } = await db.from('donations').update({
      status: 'unmatched',
      matched_shelter_id: null,
      assigned_driver_id: null,
    }).eq('id', donationId);
    if (error) throw error;
    return getDonation(donationId);
  }

  const driver = findAvailableDriver(await getAllDrivers());
  const { error: donationError } = await db.from('donations').update({
    status: driver ? 'matched' : 'awaiting_driver',
    matched_shelter_id: shelter.id,
    assigned_driver_id: driver ? driver.id : null,
  }).eq('id', donationId);
  if (donationError) {
    const isOlderStatusConstraint = !driver && donationError.code === '23514';
    if (!isOlderStatusConstraint) throw donationError;

    const { error: fallbackError } = await db.from('donations').update({
      status: 'unmatched',
      matched_shelter_id: null,
      assigned_driver_id: null,
    }).eq('id', donationId);
    if (fallbackError) throw fallbackError;
    return getDonation(donationId);
  }

  if (driver) {
    const { error } = await db.from('drivers').update({ available: false }).eq('id', driver.id);
    if (error) throw error;
  }

  return getDonation(donationId);
}

async function createDonation({ donorId, donorName, foodType, quantity, expiryHours, zone }) {
  const { data: donor, error: donorError } = await db.from('users')
    .select('id, name, role')
    .eq('id', donorId)
    .eq('role', 'donor')
    .single();
  if (donorError) throw donorError;

  const id = 'd' + Date.now() + Math.floor(Math.random() * 1000);
  const { error } = await db.from('donations').insert({
    id,
    donor_id: donor.id,
    donor_name: donor.name || donorName,
    food_type: foodType,
    quantity,
    expiry_hours: expiryHours,
    zone,
  });
  if (error) throw error;
  return tryMatch(id);
}

async function retryMatch(donationId) {
  const donation = await getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (!['unmatched', 'awaiting_driver'].includes(donation.status)) {
    throw new Error('Only unmatched donations can be retried');
  }
  return tryMatch(donationId);
}

async function declineMatch(donationId) {
  const donation = await getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (donation.status !== 'matched') throw new Error('Only a matched donation can be declined');

  const excludeIds = JSON.parse(donation.rejected_shelter_ids || '[]');
  excludeIds.push(donation.matched_shelter_id);

  if (donation.assigned_driver_id) {
    const { error } = await db.from('drivers').update({ available: true }).eq('id', donation.assigned_driver_id);
    if (error) throw error;
  }

  const { error } = await db.from('donations').update({
    rejected_shelter_ids: JSON.stringify(excludeIds),
    assigned_driver_id: null,
  }).eq('id', donationId);
  if (error) throw error;
  return tryMatch(donationId);
}

async function markPickedUp(donationId) {
  const donation = await getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (donation.status !== 'matched') throw new Error('Donation must be matched before pickup');

  const { error } = await db.from('donations').update({ status: 'picked_up' }).eq('id', donationId);
  if (error) throw error;
  return getDonation(donationId);
}

async function markDelivered(donationId) {
  const donation = await getDonation(donationId);
  if (!donation) throw new Error('Donation not found');
  if (donation.status !== 'picked_up') throw new Error('Donation must be picked up before delivery');

  const { data: completed, error: transactionError } = await db.rpc('deliver_donation', {
    p_donation_id: donationId,
  });
  if (!transactionError) {
    return Array.isArray(completed) ? completed[0] : completed;
  }
  if (transactionError.code !== 'PGRST202' && transactionError.code !== '42883') {
    throw transactionError;
  }

  const { error: donationError } = await db.from('donations').update({ status: 'delivered' }).eq('id', donationId);
  if (donationError) throw donationError;

  const { data: shelter, error: shelterError } = await db
    .from('shelters').select('capacity').eq('id', donation.matched_shelter_id).single();
  if (shelterError) throw shelterError;

  const { error: capacityError } = await db.from('shelters')
    .update({ capacity: Math.max(0, shelter.capacity - donation.quantity) })
    .eq('id', donation.matched_shelter_id);
  if (capacityError) throw capacityError;

  if (donation.assigned_driver_id) {
    const { error } = await db.from('drivers').update({ available: true }).eq('id', donation.assigned_driver_id);
    if (error) throw error;
  }

  return getDonation(donationId);
}

async function toggleShelterAccepting(shelterId) {
  const { data: shelter, error: fetchError } = await db.from('shelters').select('*').eq('id', shelterId).maybeSingle();
  if (fetchError) throw fetchError;
  if (!shelter) throw new Error('Shelter not found');

  const { data, error } = await db.from('shelters').update({ accepting: !shelter.accepting })
    .eq('id', shelterId).select().single();
  if (error) throw error;
  return data;
}

async function getStats() {
  const { data: delivered, error: deliveredError } = await db.from('donations').select('quantity').eq('status', 'delivered');
  if (deliveredError) throw deliveredError;
  const weight = delivered.reduce((sum, donation) => sum + Number(donation.quantity), 0);
  const { count: active, error: activeError } = await db.from('donations')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '(delivered,unmatched)');
  if (activeError) throw activeError;

  return {
    mealsRescued: Math.round(weight / 1.2),
    weightDivertedLbs: weight,
    co2AvoidedKg: Math.round(weight * 2.5 * 0.4536 * 10) / 10,
    donationsInProgress: active || 0,
  };
}

module.exports = {
  getAllShelters,
  getAllDrivers,
  getAllDonations,
  getDonation,
  createDonation,
  retryMatch,
  declineMatch,
  markPickedUp,
  markDelivered,
  toggleShelterAccepting,
  getStats,
};
