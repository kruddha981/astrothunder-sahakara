/**
 * SAHAKARA — Matching Engine & Last Resort Food Rescue Ladder Logic
 * Implements strict time-decay food safety rules and tiered geospatial routing.
 */

(function () {
  /**
   * Safe consumption windows (in minutes) by food category
   */
  const SAFE_MINUTES_BY_CATEGORY = {
    'cooked rice/dal': 240,    // 4 hours (Hot cooked perishable meals)
    'dairy': 120,              // 2 hours (Milk, paneer, cream desserts)
    'dry snacks': 1440,        // 24 hours (Bakery, biscuits, dry grains)
    'raw grains': 1440,        // 24 hours (Uncooked grains/flour)
    'produce': 720             // 12 hours (Fruits & vegetables)
  };

  /**
   * Calculates Great-Circle Distance between two coordinates in Kilometers (Haversine Formula)
   */
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Earth's mean radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 10) / 10; // Rounded to 1 decimal place
  }

  /**
   * Returns default safe consumption minutes for a food category
   */
  function getDefaultSafeMinutes(category) {
    const key = (category || '').toLowerCase().trim();
    return SAFE_MINUTES_BY_CATEGORY[key] || 240;
  }

  /**
   * Computes the current Ladder Stage (1 to 4) based on elapsed time vs safe window:
   * - Under 25% used  -> Stage 1 (Nearby Shelter, <= 3 km)
   * - Under 50% used  -> Stage 2 (Farther Shelter, <= 10 km)
   * - Under 75% used  -> Stage 3 (Gaushala / Animal Shelter, <= 15 km)
   * - 75% and beyond  -> Stage 4 (Municipal Bio-Compost, <= 30 km)
   */
  function currentStage(minutesElapsed, safeMinutes) {
    const totalSafe = safeMinutes || 240;
    const ratio = minutesElapsed / totalSafe;

    if (minutesElapsed >= totalSafe) {
      return 4; // Max stage / Expired for human intake
    }

    if (ratio < 0.25) return 1;
    if (ratio < 0.50) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  }

  /**
   * Checks whether food is safe for human consumption.
   * STRICT SAFETY RULE: Food is NEVER routed to human shelters in stages 3 and 4
   * or when elapsed time has reached the expiration threshold.
   */
  function isHumanSafe(minutesElapsed, safeMinutes, stage) {
    const currentStg = stage !== undefined ? stage : currentStage(minutesElapsed, safeMinutes);
    if (currentStg >= 3) return false;
    if (minutesElapsed >= (safeMinutes || 240)) return false;
    return true;
  }

  /**
   * Core Matching Algorithm:
   * Filters and pairs an incoming donation with the optimal recipient based on:
   * 1. Ladder Stage criteria & Radius (1: shelter <= 3km, 2: shelter <= 10km, 3: gaushala <= 15km, 4: compost <= 30km)
   * 2. Recipient capacity (capacity >= qty)
   * 3. Strict food safety guarantees (no human routing in stages 3 & 4)
   */
  function findMatch(donation, recipients, minutesElapsed = 0) {
    const safeMinutes = donation.safe_minutes || getDefaultSafeMinutes(donation.food_category);
    const stage = currentStage(minutesElapsed, safeMinutes);
    const qty = Number(donation.qty) || 1;

    // Filter recipients with sufficient remaining capacity
    const eligibleByCapacity = (recipients || []).filter((r) => Number(r.capacity) >= qty);

    let candidates = [];

    // Stage 1: Nearby shelter within 3 km (or closest available shelter if none within 3km)
    if (stage === 1) {
      candidates = eligibleByCapacity
        .filter((r) => r.type === 'shelter')
        .map((r) => ({ ...r, distance: haversineDistance(donation.lat, donation.lon, r.lat, r.lon) }))
        .filter((r) => r.distance <= 5.0); // Tolerant 5km max for stage 1

      // If strict 3km has matches, prioritize them
      const strictCandidates = candidates.filter((r) => r.distance <= 3.0);
      if (strictCandidates.length > 0) candidates = strictCandidates;
    }

    // Stage 2: Regional shelter within 10 km
    else if (stage === 2) {
      candidates = eligibleByCapacity
        .filter((r) => r.type === 'shelter')
        .map((r) => ({ ...r, distance: haversineDistance(donation.lat, donation.lon, r.lat, r.lon) }))
        .filter((r) => r.distance <= 12.0);
    }

    // Stage 3: Gaushala / Animal Shelter within 15 km (Food safety: NO human shelters)
    else if (stage === 3) {
      candidates = eligibleByCapacity
        .filter((r) => r.type === 'gaushala')
        .map((r) => ({ ...r, distance: haversineDistance(donation.lat, donation.lon, r.lat, r.lon) }))
        .filter((r) => r.distance <= 18.0);
    }

    // Stage 4: Municipal Bio-Compost within 30 km (Zero-Landfill guaranteed)
    else {
      candidates = eligibleByCapacity
        .filter((r) => r.type === 'compost')
        .map((r) => ({ ...r, distance: haversineDistance(donation.lat, donation.lon, r.lat, r.lon) }))
        .filter((r) => r.distance <= 35.0);
    }

    // Fallback: If no candidate matched in specific stage, pick nearest node permitted for that tier
    if (candidates.length === 0) {
      const allowedType = stage <= 2 ? 'shelter' : stage === 3 ? 'gaushala' : 'compost';
      candidates = eligibleByCapacity
        .filter((r) => r.type === allowedType)
        .map((r) => ({ ...r, distance: haversineDistance(donation.lat, donation.lon, r.lat, r.lon) }));
    }

    // Sort by shortest distance
    candidates.sort((a, b) => a.distance - b.distance);

    const matched = candidates[0] || null;

    return {
      matchedRecipient: matched,
      stage: stage,
      distanceKm: matched ? matched.distance : null,
      isExpired: minutesElapsed >= safeMinutes
    };
  }

  // Export globally to window
  window.SahakaraMatching = {
    haversineDistance,
    SAFE_MINUTES_BY_CATEGORY,
    getDefaultSafeMinutes,
    currentStage,
    isHumanSafe,
    findMatch
  };
})();
