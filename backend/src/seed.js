const db = require('./db');

async function seed() {
  const shelters = [
    { id: 's1', name: 'Hopewell Shelter', zone: 'Downtown', capacity: 60, accepting: true },
    { id: 's2', name: 'Riverside Food Bank', zone: 'Eastside', capacity: 90, accepting: true },
    { id: 's3', name: "St. Anne's Kitchen", zone: 'Uptown', capacity: 40, accepting: true },
    { id: 's4', name: 'Westside Community Hub', zone: 'Westside', capacity: 50, accepting: false },
    { id: 's5', name: 'Southside Pantry', zone: 'Southside', capacity: 30, accepting: true },
  ];
  const drivers = [
    { id: 'v1', name: 'Amir (bike)', available: true },
    { id: 'v2', name: 'Priya (van)', available: true },
    { id: 'v3', name: 'Leo (car)', available: true },
  ];

  const shelterResult = await db.from('shelters').upsert(shelters, {
    onConflict: 'id',
    ignoreDuplicates: true,
  });
  if (shelterResult.error) throw shelterResult.error;

  const driverResult = await db.from('drivers').upsert(drivers, {
    onConflict: 'id',
    ignoreDuplicates: true,
  });
  if (driverResult.error) throw driverResult.error;
}

module.exports = seed;
