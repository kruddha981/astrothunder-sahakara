// matching.js
// The core logic of the whole product lives here, deliberately separated
// from the Express routes below. This is the file you'll actually
// iterate on / improve during the hackathon (e.g. swap in real
// geocoding + a proper distance function, or plug in an ML ranker) —
// everything else in the backend is just plumbing around it.

// Fixed demo "zones" standing in for real geocoded coordinates.
// Swap this for lat/lng + a haversine formula once you have real addresses.
const ZONES = {
  Downtown: { x: 0, y: 0 },
  Uptown: { x: 2, y: 5 },
  Eastside: { x: 6, y: 1 },
  Westside: { x: -5, y: 1 },
  Southside: { x: 1, y: -6 },
};

function distanceBetweenZones(zoneA, zoneB) {
  const a = ZONES[zoneA];
  const b = ZONES[zoneB];
  if (!a || !b) return Infinity;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Pick the best shelter for a donation.
 * Rule-based on purpose: nearest shelter that (a) is currently accepting
 * donations, (b) has enough remaining capacity, and (c) hasn't already
 * declined this donation. This is intentionally simple — the problem
 * statement explicitly says rule-based matching is fine for an MVP.
 */
function findBestShelter(shelters, { zone, quantity, excludeIds = [] }) {
  const candidates = shelters.filter(
    (s) => s.accepting && s.capacity >= quantity && !excludeIds.includes(s.id)
  );
  if (candidates.length === 0) return null;

  candidates.sort(
    (a, b) => distanceBetweenZones(zone, a.zone) - distanceBetweenZones(zone, b.zone)
  );
  return candidates[0];
}

/** Pick any free driver. Swap for "nearest free driver" once you track driver location. */
function findAvailableDriver(drivers) {
  return drivers.find((d) => d.available) || null;
}

module.exports = {
  ZONES,
  distanceBetweenZones,
  findBestShelter,
  findAvailableDriver,
};
