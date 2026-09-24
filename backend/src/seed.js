// seed.js
// Inserts starter shelters and drivers the first time the app runs.
// Safe to run repeatedly — it only inserts when the tables are empty,
// so it won't wipe out real data your team enters during the demo.

const db = require('./db');

function seed() {
  const shelterCount = db.prepare('SELECT COUNT(*) AS n FROM shelters').get().n;
  const driverCount = db.prepare('SELECT COUNT(*) AS n FROM drivers').get().n;

  if (shelterCount === 0) {
    const insert = db.prepare(
      'INSERT INTO shelters (id, name, zone, capacity, accepting) VALUES (?, ?, ?, ?, ?)'
    );
    const shelters = [
      ['s1', "Hopewell Shelter", 'Downtown', 60, 1],
      ['s2', 'Riverside Food Bank', 'Eastside', 90, 1],
      ['s3', "St. Anne's Kitchen", 'Uptown', 40, 1],
      ['s4', 'Westside Community Hub', 'Westside', 50, 0],
      ['s5', 'Southside Pantry', 'Southside', 30, 1],
    ];
    const insertMany = db.transaction((rows) => rows.forEach((r) => insert.run(...r)));
    insertMany(shelters);
    console.log(`Seeded ${shelters.length} shelters`);
  }

  if (driverCount === 0) {
    const insert = db.prepare('INSERT INTO drivers (id, name, available) VALUES (?, ?, ?)');
    const drivers = [
      ['v1', 'Amir (bike)', 1],
      ['v2', 'Priya (van)', 1],
      ['v3', 'Leo (car)', 1],
    ];
    const insertMany = db.transaction((rows) => rows.forEach((r) => insert.run(...r)));
    insertMany(drivers);
    console.log(`Seeded ${drivers.length} drivers`);
  }
}

module.exports = seed;

// Allow running directly: `node src/seed.js`
if (require.main === module) {
  seed();
  console.log('Done.');
}
