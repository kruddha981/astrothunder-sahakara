/**
 * SAHAKARA — Food Rescue Platform (Jaipur Cluster)
 * Pure Client-Side Architecture (Independent of Backend Server)
 * OpenStreetMap (Leaflet.js) + OSRM Road Routing + Interactive Telemetry Simulation
 */

// Initial Jaipur Nodes Database
const JAIPUR_NODES = [
  {
    id: 'node-amity-mess',
    type: 'donor',
    name: 'Amity University Jaipur (Central Mess)',
    category: 'University Dining & Hostel Kitchen',
    lat: 27.1729,
    lng: 75.9542,
    address: 'SP-1, Kant Kalwar, NH-11C, RIICO Industrial Area, Jaipur, Rajasthan 303002',
    capacity_meals: 250,
    status: 'Surplus Dispatched (40 Meals Hot Dal & Rice)',
    phone: '+91 141 237 8899'
  },
  {
    id: 'node-ananda',
    type: 'shelter',
    name: 'Ananda Seva Ashram (Node 04)',
    category: 'Shelter Home & Community Kitchen',
    lat: 26.9248,
    lng: 75.8267,
    address: 'Bani Park, Near Collectorate Circle, Jaipur, Rajasthan 302016',
    capacity_meals: 120,
    status: 'Awaiting Incoming EV Delivery (OTP: 4419)',
    phone: '+91 98290 44321'
  },
  {
    id: 'node-akshaya-patra',
    type: 'shelter',
    name: 'Akshaya Patra Foundation Jaipur',
    category: 'Central Mega Kitchen & Distribution',
    lat: 26.8202,
    lng: 75.8647,
    address: 'Mahal Road, Jagatpura, Jaipur, Rajasthan 302017',
    capacity_meals: 1500,
    status: 'Ready to Receive Surplus Batches',
    phone: '+91 141 306 3000'
  },
  {
    id: 'node-apna-ghar',
    type: 'shelter',
    name: 'Apna Ghar Vridhashram & Child Care',
    category: 'Elderly & Orphan Welfare Home',
    lat: 26.8856,
    lng: 75.7654,
    address: 'Shyam Nagar, Janpath, Jaipur, Rajasthan 302019',
    capacity_meals: 85,
    status: 'Night Meal Allocation Confirmed',
    phone: '+91 94140 12890'
  },
  {
    id: 'node-prerna',
    type: 'shelter',
    name: 'Prerna Balika Ashram',
    category: 'Girls Education & Residential Care',
    lat: 26.9654,
    lng: 75.7723,
    address: 'Vidyadhar Nagar, Sector 3, Jaipur, Rajasthan 302039',
    capacity_meals: 90,
    status: 'Capacity Available (60 meals)',
    phone: '+91 98280 55432'
  },
  {
    id: 'node-gaushala-govind',
    type: 'gaushala',
    name: 'Shree Govind Dev Ji Gaushala Trust',
    category: 'Bio-Feed & Livestock Nutrition',
    lat: 26.9298,
    lng: 75.8242,
    address: 'Jaleb Chowk, City Palace Complex, Jaipur, Rajasthan 302002',
    capacity_meals: 600,
    status: 'Receiving Organic Veg Peels & Grains',
    phone: '+91 141 260 2341'
  },
  {
    id: 'node-gaushala-haldighati',
    type: 'gaushala',
    name: 'Pratap Nagar Kamdhenu Gaushala',
    category: 'Livestock Care Node',
    lat: 26.8012,
    lng: 75.8219,
    address: 'Sector 8, Pratap Nagar, Jaipur, Rajasthan 302033',
    capacity_meals: 450,
    status: 'Active Intake',
    phone: '+91 98292 77102'
  },
  {
    id: 'node-compost-durgapura',
    type: 'compost',
    name: 'Durgapura Municipal Bio-Compost Hub',
    category: 'Aerobic Digest & Soil Regeneration',
    lat: 26.8524,
    lng: 75.7891,
    address: 'Agriculture Research Centre Road, Durgapura, Jaipur, Rajasthan 302018',
    capacity_meals: 2000,
    status: 'Zero-Landfill Processing Online',
    phone: '+91 141 276 0198'
  }
];

// Active Volunteer Drivers
let JAIPUR_DRIVERS = [
  {
    id: 'drv-vikram',
    name: 'Driver Vikram R. (EV Cargo-4419)',
    vehicle_type: 'Mahindra Zor Grand Electric (Insulated Pod)',
    vehicle_number: 'RJ-14-EV-4419',
    lat: 27.0250,
    lng: 75.8900,
    speed_kmh: 41,
    battery_level: '84%',
    cargo_temp_celsius: 64,
    status: 'In Transit — Amity Mess to Bani Park Shelter',
    active_batch: 'SK-8821',
    eta_mins: 14
  }
];

// Active Live Dispatch State
let currentLiveDispatch = {
  tracking_id: 'SK-8821',
  donor_name: 'Amity University Jaipur (Central Mess)',
  food_title: '40 Hot Dinner Meals (Rice, Dal Makhani & Roti)',
  quantity: '40 Meals (~18 kg)',
  meals_count: 40,
  temp_celsius: 64,
  status: 'picked_up',
  pickup_address: 'SP-1, Kant Kalwar, NH-11C, RIICO Industrial Area, Jaipur 303002',
  assigned_shelter: 'Ananda Seva Ashram (Node 04)',
  shelter_distance_km: 2.4,
  assigned_driver: 'Driver Vikram R. (EV Cargo-4419)',
  driver_eta_mins: 14,
  otp_code: '4419'
};

let currentModalCategory = '';
let jaipurMap = null;
let mapMarkers = [];
let activeRoutePolyline = null;
let activeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  initLadderCountdown();
  initStatsCounter();
  renderDispatchCard(currentLiveDispatch);
  initJaipurMap();
  initAuth();
});

/* ==========================================================================
   1. Live Last Resort Ladder & Time-Warp Simulator (Judge Demo Engine)
   ========================================================================== */

let timeWarpMinutes = 25;
let timeWarpAutoPlayInterval = null;

function initLadderCountdown() {
  updateLadderDisplay(timeWarpMinutes);
}

/**
 * Triggered whenever the user drags the Time-Warp Slider
 */
function onTimeWarpSliderChange(val) {
  timeWarpMinutes = parseInt(val, 10);
  updateLadderDisplay(timeWarpMinutes);
}

/**
 * Triggered by 1-click preset buttons (e.g. 15m, 65m, 115m, 180m)
 */
function setTimeWarp(minutes) {
  timeWarpMinutes = minutes;
  const slider = document.getElementById('timewarp-slider');
  if (slider) slider.value = minutes;
  updateLadderDisplay(minutes);
}

/**
 * Toggle auto-simulation play across the full 4-hour ladder
 */
function toggleTimeWarpAutoPlay() {
  const playBtn = document.getElementById('btn-timewarp-play');
  const playIcon = document.getElementById('play-icon');
  const playText = document.getElementById('play-text');
  const slider = document.getElementById('timewarp-slider');

  if (timeWarpAutoPlayInterval) {
    // Stop playback
    clearInterval(timeWarpAutoPlayInterval);
    timeWarpAutoPlayInterval = null;
    playBtn.classList.remove('playing');
    playIcon.textContent = '▶';
    playText.textContent = 'Auto Sim';
  } else {
    // Start auto-playback
    if (timeWarpMinutes >= 235) {
      timeWarpMinutes = 0;
      if (slider) slider.value = 0;
    }

    playBtn.classList.add('playing');
    playIcon.textContent = '⏸';
    playText.textContent = 'Pause';

    timeWarpAutoPlayInterval = setInterval(() => {
      if (timeWarpMinutes < 240) {
        timeWarpMinutes += 5;
        if (slider) slider.value = timeWarpMinutes;
        updateLadderDisplay(timeWarpMinutes);
      } else {
        // Reached end of ladder
        toggleTimeWarpAutoPlay();
      }
    }, 350);
  }
}

/**
 * Updates UI tiers, badges, and colors according to simulated elapsed time
 */
function updateLadderDisplay(mins) {
  const displayEl = document.getElementById('warp-time-display');
  const badgeEl = document.getElementById('warp-tier-badge');
  const tier1Timer = document.getElementById('tier-1-timer');

  const row1 = document.getElementById('tier-row-1');
  const row2 = document.getElementById('tier-row-2');
  const row3 = document.getElementById('tier-row-3');
  const row4 = document.getElementById('tier-row-4');

  const p1 = document.getElementById('preset-t1');
  const p2 = document.getElementById('preset-t2');
  const p3 = document.getElementById('preset-t3');
  const p4 = document.getElementById('preset-t4');

  if (displayEl) displayEl.textContent = `${mins} min`;

  // Reset preset active states
  [p1, p2, p3, p4].forEach(p => p && p.classList.remove('active'));

  // Reset all row classes
  [row1, row2, row3, row4].forEach(r => {
    if (r) {
      r.classList.remove('active-tier', 'passed-tier');
    }
  });

  if (mins <= 45) {
    // TIER 1: Human Grade - Nearby Shelter (5km)
    if (badgeEl) {
      badgeEl.className = 'timewarp-tier-badge tier-1-badge';
      badgeEl.textContent = 'Tier 1: Human Grade (Fresh)';
    }
    if (p1) p1.classList.add('active');

    if (row1) row1.classList.add('active-tier');
    if (tier1Timer) tier1Timer.textContent = `${45 - mins}m left`;

    updateHeroCardStatus(1, 'Nearby Orphanage & Shelter (3.2km)', 'Hot & Fresh &bull; 100% Edible');

  } else if (mins <= 90) {
    // TIER 2: Regional Shelter / Bulk Re-heating (18km)
    if (badgeEl) {
      badgeEl.className = 'timewarp-tier-badge tier-2-badge';
      badgeEl.textContent = 'Tier 2: Regional Shelter Hub';
    }
    if (p2) p2.classList.add('active');

    if (row1) row1.classList.add('passed-tier');
    if (row2) row2.classList.add('active-tier');

    updateHeroCardStatus(2, 'Jaipur Rain Basera Central Hub (14.8km)', 'Re-heating Container &bull; Secondary Radius');

  } else if (mins <= 150) {
    // TIER 3: Gaushala / Animal Shelter
    if (badgeEl) {
      badgeEl.className = 'timewarp-tier-badge tier-3-badge';
      badgeEl.textContent = 'Tier 3: Animal Shelter (Gaushala)';
    }
    if (p3) p3.classList.add('active');

    if (row1) row1.classList.add('passed-tier');
    if (row2) row2.classList.add('passed-tier');
    if (row3) row3.classList.add('active-tier');

    updateHeroCardStatus(3, 'Shree Krishna Gaushala (8.1km)', 'Quality-Tested Organic Cattle Feed');

  } else {
    // TIER 4: Municipal Biomethanation & Compost
    if (badgeEl) {
      badgeEl.className = 'timewarp-tier-badge tier-4-badge';
      badgeEl.textContent = 'Tier 4: Zero-Landfill Compost';
    }
    if (p4) p4.classList.add('active');

    if (row1) row1.classList.add('passed-tier');
    if (row2) row2.classList.add('passed-tier');
    if (row3) row3.classList.add('passed-tier');
    if (row4) row4.classList.add('active-tier');

    updateHeroCardStatus(4, 'JMC Biomethanation Facility', 'Zero Organic Waste &bull; Soil Enrichment');
  }
}

/**
 * Dynamic feedback in live dispatch card when Time-Warp moves
 */
function updateHeroCardStatus(tierNum, recipient, notes) {
  const destEl = document.getElementById('card-destination');
  const stagePill = document.getElementById('card-stage-pill');
  if (destEl) destEl.textContent = recipient;
  if (stagePill) {
    stagePill.textContent = `TIER ${tierNum} ACTIVE`;
  }
}

/* ==========================================================================
   2. Real-time Impact Stats Counter
   ========================================================================== */
function initStatsCounter() {
  const mealsEl = document.getElementById('stat-meals-count');
  const kgEl = document.getElementById('stat-kg-count');
  if (!mealsEl) return;

  let currentMeals = 1482930;
  let currentKg = 593170;

  mealsEl.textContent = currentMeals.toLocaleString('en-IN');
  if (kgEl) kgEl.textContent = currentKg.toLocaleString('en-IN');

  // Live real-time simulation increments
  setInterval(() => {
    const mealInc = Math.floor(Math.random() * 6) + 2;
    const kgInc = Math.round(mealInc * 0.45);
    
    currentMeals += mealInc;
    currentKg += kgInc;

    mealsEl.textContent = currentMeals.toLocaleString('en-IN');
    if (kgEl) kgEl.textContent = currentKg.toLocaleString('en-IN');
  }, 10000);
}

/* ==========================================================================
   3. Render Hero Dispatch Mockup Card
   ========================================================================== */
function renderDispatchCard(dispatch) {
  currentLiveDispatch = dispatch;
  
  // URL Bar and Card Kicker
  const urlEl = document.querySelector('.mockup-url-bar span');
  if (urlEl) urlEl.textContent = `sahakara.org/dispatch/live/${dispatch.tracking_id}`;

  const kickerEl = document.querySelector('.donor-details .card-kicker');
  if (kickerEl) kickerEl.textContent = `ACTIVE RESCUE BATCH #${dispatch.tracking_id}`;

  const titleEl = document.querySelector('.donor-details .food-title');
  if (titleEl) titleEl.textContent = dispatch.food_title || `${dispatch.quantity} surplus meals`;

  const sourceEl = document.querySelector('.donor-details .donor-source');
  if (sourceEl) {
    sourceEl.innerHTML = `Posted by <strong>${dispatch.donor_name}</strong> &bull; ${dispatch.pickup_address ? dispatch.pickup_address.split(',')[0] : 'Jaipur Cluster'}`;
  }

  const tempBadgeEl = document.querySelector('.temp-badge span');
  if (tempBadgeEl) {
    tempBadgeEl.textContent = `${dispatch.temp_celsius || 64}°C Safe Temp`;
  }

  // Update Stepper
  updateStepperState(dispatch.status);

  // Update Meta Grid
  const shelterValueEl = document.querySelector('.meta-box:nth-child(1) .meta-value');
  const shelterSubEl = document.querySelector('.meta-box:nth-child(1) .meta-sub');
  if (shelterValueEl && dispatch.assigned_shelter) {
    shelterValueEl.textContent = dispatch.assigned_shelter;
  }
  if (shelterSubEl) {
    shelterSubEl.textContent = `${dispatch.shelter_distance_km || 2.4} km away • Capacity confirmed for ${dispatch.meals_count || 40} meals`;
  }

  const driverValueEl = document.querySelector('.meta-box:nth-child(2) .meta-value');
  const driverSubEl = document.querySelector('.meta-box:nth-child(2) .meta-sub');
  if (driverValueEl && dispatch.assigned_driver) {
    driverValueEl.textContent = dispatch.assigned_driver;
  }
  if (driverSubEl) {
    const eta = dispatch.driver_eta_mins > 0 ? `Arriving at shelter in ${dispatch.driver_eta_mins} mins` : 'Delivered';
    driverSubEl.textContent = `${eta} • OTP: ${dispatch.otp_code}`;
  }
}

function updateStepperState(status) {
  const steps = document.querySelectorAll('.stepper-steps .step-node');
  if (!steps || steps.length < 4) return;

  const statuses = ['posted', 'matched', 'picked_up', 'delivered'];
  const currentIndex = statuses.indexOf(status);

  steps.forEach((step, idx) => {
    step.className = 'step-node';
    if (idx < currentIndex) {
      step.classList.add('completed');
      const circle = step.querySelector('.step-circle');
      if (circle) circle.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (idx === currentIndex) {
      step.classList.add('active');
      const circle = step.querySelector('.step-circle');
      if (circle) circle.innerHTML = `<span class="active-dot"></span>`;
    } else {
      const circle = step.querySelector('.step-circle');
      if (circle) circle.innerHTML = '';
    }
  });

  const lineFilled = document.querySelector('.stepper-line-filled');
  if (lineFilled) {
    const percentages = [0, 33, 66, 100];
    lineFilled.style.width = `${percentages[Math.max(0, currentIndex)]}%`;
  }
}

/* ==========================================================================
   4. Real-Time Jaipur Map (Leaflet.js + OpenStreetMap + OSRM)
   ========================================================================== */
async function initJaipurMap() {
  const mapContainer = document.getElementById('jaipur-live-map');
  if (!mapContainer || typeof L === 'undefined') return;

  // Center on Jaipur / NH-11C corridor
  jaipurMap = L.map('jaipur-live-map', {
    center: [26.9600, 75.8500],
    zoom: 11,
    zoomControl: true,
    attributionControl: false
  });

  // OpenStreetMap Tile Layer (no API key needed)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(jaipurMap);

  // Render Nodes & Drivers
  await renderMapData();

  // Telemetry simulation every 3 seconds
  setInterval(simulateDriverMovement, 3000);
}

/**
 * Fetch real road route geometry from free public OSRM API
 * Falls back to straight polyline if OSRM fails or is slow
 */
async function fetchOSRMRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) return { success: false, coords: [] };

  const coordParam = waypoints.map(pt => `${pt[1]},${pt[0]}`).join(';');
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordParam}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0 && data.routes[0].geometry) {
        // Convert [lng, lat] to [lat, lng]
        const roadCoords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        return { success: true, coords: roadCoords };
      }
    }
  } catch (err) {
    console.warn('OSRM road route request failed, falling back to straight polyline:', err);
  }

  // Straight line fallback
  return { success: false, coords: waypoints };
}

async function renderMapData() {
  if (!jaipurMap) return;

  // Clear existing markers
  mapMarkers.forEach(m => jaipurMap.removeLayer(m.marker));
  mapMarkers = [];

  if (activeRoutePolyline) {
    jaipurMap.removeLayer(activeRoutePolyline);
    activeRoutePolyline = null;
  }

  // 1. Render Verified Nodes
  let donorNode = null;
  let shelterNode = null;

  JAIPUR_NODES.forEach(node => {
    const markerIcon = createNodeIcon(node.type);
    const marker = L.marker([node.lat, node.lng], { icon: markerIcon }).addTo(jaipurMap);

    const popupHtml = `
      <div class="map-popup-box">
        <span class="pop-tag">${node.type.toUpperCase()} • ${node.category || ''}</span>
        <strong>${node.name}</strong>
        <p><strong>Address:</strong> ${node.address}</p>
        <p><strong>Capacity:</strong> ${node.capacity_meals} meals</p>
        <p><strong>Status:</strong> <span style="color:#0F7B5F;font-weight:600;">${node.status}</span></p>
        <p><strong>Phone:</strong> ${node.phone}</p>
      </div>
    `;
    marker.bindPopup(popupHtml);

    mapMarkers.push({ type: node.type, marker, data: node });

    if (node.type === 'donor' && !donorNode) donorNode = node;
    if (node.id === 'node-ananda' || (node.type === 'shelter' && !shelterNode)) shelterNode = node;
  });

  // 2. Render Active Volunteer Drivers
  let primaryDriver = null;
  JAIPUR_DRIVERS.forEach(driver => {
    const driverIcon = createDriverIcon();
    const marker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(jaipurMap);

    const popupHtml = `
      <div class="map-popup-box">
        <span class="pop-tag">VOLUNTEER DRIVER • ${driver.vehicle_type}</span>
        <strong>${driver.name}</strong>
        <p><strong>Vehicle:</strong> ${driver.vehicle_number}</p>
        <p><strong>Speed:</strong> ${driver.speed_kmh} km/h • <strong>Battery:</strong> ${driver.battery_level}</p>
        <p><strong>Cargo Temp:</strong> <span style="color:#0F7B5F;font-weight:600;">${driver.cargo_temp_celsius}°C (Safe)</span></p>
        <p><strong>Status:</strong> ${driver.status}</p>
      </div>
    `;
    marker.bindPopup(popupHtml);

    mapMarkers.push({ type: 'driver', marker, data: driver, isDriver: true });

    if (!primaryDriver) primaryDriver = driver;
  });

  // 3. Draw Road Polyline with OSRM
  if (donorNode && primaryDriver && shelterNode) {
    const waypoints = [
      [donorNode.lat, donorNode.lng],
      [primaryDriver.lat, primaryDriver.lng],
      [shelterNode.lat, shelterNode.lng]
    ];

    const routeResult = await fetchOSRMRoute(waypoints);

    activeRoutePolyline = L.polyline(routeResult.coords, {
      color: '#C04A26',
      weight: 4,
      opacity: 0.9,
      dashArray: routeResult.success ? null : '6, 6',
      smoothFactor: 1
    }).addTo(jaipurMap);
  }

  // Apply active category filter
  applyMarkerFilter();

  // Update HUD
  if (JAIPUR_DRIVERS[0]) {
    updateTelemetryHud(JAIPUR_DRIVERS[0]);
  }
}

function simulateDriverMovement() {
  const driver = JAIPUR_DRIVERS[0];
  if (!driver) return;

  // Move driver smoothly towards Bani Park Shelter (26.9248, 75.8267)
  const targetLat = 26.9248;
  const targetLng = 75.8267;

  const latDiff = (targetLat - driver.lat) * 0.05;
  const lngDiff = (targetLng - driver.lng) * 0.05;

  driver.lat += latDiff;
  driver.lng += lngDiff;

  // Slight speed & temp variations
  driver.speed_kmh = Math.floor(38 + Math.random() * 8);
  driver.cargo_temp_celsius = Math.floor(63 + Math.random() * 2);

  if (driver.eta_mins > 1) {
    driver.eta_mins = Math.max(1, driver.eta_mins - 0.2);
  }

  // Update Marker on Map
  const item = mapMarkers.find(m => m.isDriver && m.data.id === driver.id);
  if (item && item.marker) {
    item.marker.setLatLng([driver.lat, driver.lng]);
  }

  updateTelemetryHud(driver);
}

function updateTelemetryHud(driver) {
  const nameEl = document.getElementById('hud-driver-name');
  const speedEl = document.getElementById('hud-speed');
  const tempEl = document.getElementById('hud-temp');
  const etaEl = document.getElementById('hud-eta');
  const batteryEl = document.getElementById('hud-battery');
  const batchTagEl = document.getElementById('hud-batch-tag');

  if (nameEl) nameEl.textContent = driver.name.split(' (')[0];
  if (speedEl) speedEl.textContent = `${driver.speed_kmh} km/h`;
  if (tempEl) tempEl.textContent = `${driver.cargo_temp_celsius}°C`;
  if (etaEl) etaEl.textContent = `${Math.round(driver.eta_mins)} mins`;
  if (batteryEl) batteryEl.textContent = driver.battery_level;
  if (batchTagEl) batchTagEl.textContent = `#${driver.active_batch || 'SK-8821'}`;
}

function createNodeIcon(type) {
  const iconClass = `custom-map-marker marker-${type}`;
  let symbol = '🏠';
  if (type === 'donor') symbol = '🍱';
  if (type === 'shelter') symbol = '🤝';
  if (type === 'gaushala') symbol = '🐄';
  if (type === 'compost') symbol = '🌱';

  return L.divIcon({
    className: iconClass,
    html: `<span style="font-size:14px;">${symbol}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
}

function createDriverIcon() {
  return L.divIcon({
    className: 'custom-map-marker marker-driver',
    html: `<span style="font-size:13px;">⚡</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

function filterMapNodes(category, btnElement) {
  activeFilter = category;

  // Update button active state
  const chips = document.querySelectorAll('#map-category-filters .map-chip');
  chips.forEach(c => c.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  applyMarkerFilter();
}

function applyMarkerFilter() {
  mapMarkers.forEach(item => {
    if (activeFilter === 'all' || item.type === activeFilter) {
      if (!jaipurMap.hasLayer(item.marker)) {
        jaipurMap.addLayer(item.marker);
      }
    } else {
      if (jaipurMap.hasLayer(item.marker)) {
        jaipurMap.removeLayer(item.marker);
      }
    }
  });
}

/* ==========================================================================
   5. City Chips Search / Filter
   ========================================================================== */
function filterCities() {
  const query = document.getElementById('city-search').value.toLowerCase().trim();
  const chips = document.querySelectorAll('#city-chips-grid .city-chip');

  chips.forEach(chip => {
    const cityName = chip.getAttribute('data-name') || '';
    if (cityName.includes(query) || query === '') {
      chip.style.display = 'flex';
    } else {
      chip.style.display = 'none';
    }
  });
}

/* ==========================================================================
   6. Post Surplus Food & Node Registration Modal
   ========================================================================== */
function openPostModal(category = '') {
  currentModalCategory = category;
  const modal = document.getElementById('modal-post');
  const form = document.getElementById('post-form');
  const success = document.getElementById('post-success');
  const title = document.getElementById('modal-title');
  const submitBtn = document.getElementById('btn-submit-post');

  if (category === 'shelter') {
    title.textContent = 'Register Verified Shelter Node (Jaipur)';
    submitBtn.textContent = 'Register Shelter Node';
  } else if (category === 'driver') {
    title.textContent = 'Join Volunteer Transport Network (Jaipur)';
    submitBtn.textContent = 'Register as Driver';
  } else if (category === 'gaushala') {
    title.textContent = 'Register Gaushala Node (Jaipur)';
    submitBtn.textContent = 'Register Gaushala';
  } else if (category === 'compost') {
    title.textContent = 'Register Bio-Compost Facility';
    submitBtn.textContent = 'Register Facility';
  } else {
    title.textContent = 'Post Surplus Food (Jaipur Live Cluster)';
    submitBtn.textContent = 'Broadcast to Nearby Shelters';
  }

  form.hidden = false;
  success.hidden = true;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closePostModal() {
  const modal = document.getElementById('modal-post');
  modal.hidden = true;
  document.body.style.overflow = '';
}

async function handlePostSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('post-form');
  const success = document.getElementById('post-success');
  const submitBtn = document.getElementById('btn-submit-post');

  const donorType = document.getElementById('post-donor-type').value;
  const donorName = document.getElementById('post-donor-name').value || 'Amity Jaipur Food Partner';
  const phone = document.getElementById('post-phone').value || '+91 98290 12345';
  const pincode = document.getElementById('post-pincode').value || '302001';
  const foodType = document.getElementById('post-food-type').value || 'Hot Cooked Meals';
  const quantity = document.getElementById('post-qty').value || '50 meals';
  const deadline = document.getElementById('post-deadline').value || '2 hours';
  const address = document.getElementById('post-address').value || 'Jaipur City Hub';

  if (!authState.token || authState.user?.role !== 'donor') {
    openSignInModal();
    return;
  }

  const mealCount = parseInt(quantity, 10) || 50;
  const expiryHours = Math.max(2, Math.min(6, parseInt(deadline, 10) || 4));

  submitBtn.textContent = 'Broadcasting to Jaipur Node Cluster...';
  submitBtn.disabled = true;

  let donation;
  try {
    const response = await fetch('http://localhost:3001/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authState.token}`,
      },
      body: JSON.stringify({
        donorName,
        foodType,
        quantity: mealCount,
        expiryHours,
        zone: 'Downtown',
      }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to post donation');
    donation = payload;
  } catch (error) {
    submitBtn.textContent = 'Broadcast to Nearby Shelters';
    submitBtn.disabled = false;
    alert(error.message);
    return;
  }

  setTimeout(() => {
    submitBtn.textContent = 'Broadcast to Nearby Shelters';
    submitBtn.disabled = false;

    if (currentModalCategory && currentModalCategory !== 'donor') {
      // Partner Node Registration
      const newNode = {
        id: `node-user-${Date.now()}`,
        type: currentModalCategory,
        name: donorName,
        category: `${currentModalCategory.toUpperCase()} Partner Node`,
        lat: 26.9124 + (Math.random() - 0.5) * 0.08,
        lng: 75.7873 + (Math.random() - 0.5) * 0.08,
        address: `${address}, Pin: ${pincode}`,
        capacity_meals: 100,
        status: 'Verified & Active in Cluster',
        phone
      };

      JAIPUR_NODES.push(newNode);

      const successHeading = success.querySelector('.success-heading');
      const successPara = success.querySelector('.success-paragraph');
      if (successHeading) successHeading.textContent = 'Node Verified & Registered';
      if (successPara) successPara.textContent = `${donorName} has been enrolled in the Jaipur food recovery network.`;

      form.hidden = true;
      success.hidden = false;
      renderMapData();
    } else {
      // Surplus Food Posting
      const newTrackingId = donation.id;

      const newDispatch = {
        tracking_id: newTrackingId,
        donor_name: donation.donor_name,
        food_title: `${quantity} ${foodType}`,
        quantity,
        meals_count: mealCount,
        temp_celsius: 65,
        status: donation.status,
        pickup_address: address,
        assigned_shelter: donation.matched_shelter_id || 'Awaiting shelter match',
        shelter_distance_km: 2.1,
        assigned_driver: donation.assigned_driver_id || 'Awaiting driver assignment',
        driver_eta_mins: 18,
        otp_code: `${Math.floor(1000 + Math.random() * 9000)}`
      };

      // Add as donor node on map
      const newDonorNode = {
        id: `donor-${newTrackingId}`,
        type: 'donor',
        name: donorName,
        category: donorType,
        lat: 26.9300 + (Math.random() - 0.5) * 0.06,
        lng: 75.8000 + (Math.random() - 0.5) * 0.06,
        address,
        capacity_meals: mealCount,
        status: `Surplus Active (#${newTrackingId})`,
        phone
      };

      JAIPUR_NODES.unshift(newDonorNode);

      const successHeading = success.querySelector('.success-heading');
      const successPara = success.querySelector('.success-paragraph');
      
      if (successHeading) successHeading.textContent = `Dispatch Broadcast #${newTrackingId} Active`;
      if (successPara) {
        successPara.innerHTML = `Surplus reference <strong>#${newTrackingId}</strong> matched to <strong>${newDispatch.assigned_shelter}</strong>. Driver <strong>${newDispatch.assigned_driver}</strong> assigned. Pickup OTP: <strong>${newDispatch.otp_code}</strong>.`;
      }

      // Live update Hero Card & Map
      renderDispatchCard(newDispatch);
      renderMapData();

      form.hidden = true;
      success.hidden = false;
    }
  }, 600);
}

/* ==========================================================================
   7. Authentication, Free Email OTP & State Management
   ========================================================================== */

const AUTH_API_BASE = 'http://localhost:3001/api/auth';

let authState = {
  token: localStorage.getItem('sahakara_auth_token') || null,
  user: JSON.parse(localStorage.getItem('sahakara_auth_user') || 'null')
};

let currentSignupData = {};
let currentLoginEmail = '';
let loginOtpTimer = null;
let signupOtpTimer = null;

/**
 * Initializes Authentication State on page load
 */
async function initAuth() {
  renderNavAuthState();
  setupOtpDigitInputs('login-otp-inputs');
  setupOtpDigitInputs('signup-otp-inputs');

  if (authState.token) {
    try {
      const res = await fetch(`${AUTH_API_BASE}/me`, {
        headers: { 'Authorization': `Bearer ${authState.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          authState.user = data.user;
          localStorage.setItem('sahakara_auth_user', JSON.stringify(data.user));
          renderNavAuthState();
        }
      } else {
        // Token invalid or expired
        logout(false);
      }
    } catch (e) {
      console.warn('[Auth] Running offline or backend unavailable; preserving cached session:', e.message);
    }
  }
}

/**
 * Updates the Navbar according to whether user is logged in
 */
function renderNavAuthState() {
  const container = document.getElementById('nav-actions-container');
  if (!container) return;

  if (authState.user) {
    const roleEmoji = authState.user.role === 'donor' ? '🍛' : authState.user.role === 'shelter' ? '🏠' : '🛵';
    const roleName = (authState.user.role || 'Partner').toUpperCase();
    const initials = (authState.user.name || 'User').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    container.innerHTML = `
      <div class="user-nav-profile" title="Logged in as ${authState.user.name} (${authState.user.email})">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <span class="user-nav-name">${authState.user.name}</span>
          <span class="user-nav-role">${roleEmoji} ${roleName}</span>
        </div>
        <button type="button" class="btn-nav-logout" onclick="logout(true)" title="Sign out" aria-label="Sign out">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>
      <button type="button" class="btn btn-primary" onclick="openPostModal()">
        <span>Post surplus</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    `;
  } else {
    container.innerHTML = `
      <button type="button" class="btn btn-ghost" id="btn-nav-signin" onclick="openSignInModal()">Sign in</button>
      <button type="button" class="btn btn-primary" onclick="openPostModal()">
        <span>Post surplus food</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    `;
  }
}

function openSignInModal(initialTab = 'signin') {
  const modal = document.getElementById('modal-signin');
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  hideAuthAlert();
  switchAuthTab(initialTab);
}

function closeSignInModal() {
  const modal = document.getElementById('modal-signin');
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  clearInterval(loginOtpTimer);
  clearInterval(signupOtpTimer);
}

function switchAuthTab(tab) {
  const btnSignin = document.getElementById('tab-btn-signin');
  const btnSignup = document.getElementById('tab-btn-signup');
  const panelSignin = document.getElementById('auth-panel-signin');
  const panelSignup = document.getElementById('auth-panel-signup');

  hideAuthAlert();

  if (tab === 'signin') {
    btnSignin.classList.add('active');
    btnSignin.setAttribute('aria-selected', 'true');
    btnSignup.classList.remove('active');
    btnSignup.setAttribute('aria-selected', 'false');
    panelSignin.style.display = 'block';
    panelSignup.style.display = 'none';
  } else {
    btnSignup.classList.add('active');
    btnSignup.setAttribute('aria-selected', 'true');
    btnSignin.classList.remove('active');
    btnSignin.setAttribute('aria-selected', 'false');
    panelSignup.style.display = 'block';
    panelSignin.style.display = 'none';
  }
}

function toggleLoginMethod(method) {
  const btnPwd = document.getElementById('btn-login-method-pwd');
  const btnOtp = document.getElementById('btn-login-method-otp');
  const formPwd = document.getElementById('form-login-pwd');
  const formOtp = document.getElementById('form-login-otp');

  hideAuthAlert();

  if (method === 'password') {
    btnPwd.classList.add('active');
    btnOtp.classList.remove('active');
    formPwd.style.display = 'flex';
    formOtp.style.display = 'none';
  } else {
    btnOtp.classList.add('active');
    btnPwd.classList.remove('active');
    formOtp.style.display = 'block';
    formPwd.style.display = 'none';
  }
}

function selectSignupRole(role, element) {
  document.querySelectorAll('.role-card').forEach(card => card.classList.remove('selected'));
  element.classList.add('selected');
  const radio = element.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

function showAuthAlert(type, message, devOtp = null) {
  const alertEl = document.getElementById('auth-alert');
  if (!alertEl) return;

  alertEl.className = `auth-alert ${type}`;
  alertEl.hidden = false;

  if (devOtp) {
    alertEl.innerHTML = `
      <div>${message}</div>
      <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem; white-space: nowrap;" onclick="autoFillOtp('${devOtp}')">
        Fill OTP: <strong>${devOtp}</strong>
      </button>
    `;
  } else {
    alertEl.textContent = message;
  }
}

function hideAuthAlert() {
  const alertEl = document.getElementById('auth-alert');
  if (alertEl) alertEl.hidden = true;
}

function autoFillOtp(otp) {
  const digits = otp.split('');
  // Check active panel
  const activePanel = document.getElementById('auth-panel-signup').style.display === 'block' ? 'signup' : 'login';
  const inputs = document.querySelectorAll(`#${activePanel}-otp-inputs .otp-box-digit`);
  inputs.forEach((input, idx) => {
    input.value = digits[idx] || '';
  });
  if (inputs.length > 0) inputs[inputs.length - 1].focus();
}

function setupOtpDigitInputs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const inputs = container.querySelectorAll('.otp-box-digit');

  inputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val ? val.slice(-1) : '';

      if (val && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{6}$/.test(pasteData)) {
        pasteData.split('').forEach((digit, i) => {
          if (inputs[i]) inputs[i].value = digit;
        });
        inputs[inputs.length - 1].focus();
      }
    });
  });
}

function getOtpCodeFromBoxes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return '';
  const inputs = container.querySelectorAll('.otp-box-digit');
  return Array.from(inputs).map(i => i.value).join('');
}

function clearOtpBoxes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.otp-box-digit').forEach(i => i.value = '');
}

/**
 * Handle direct Password Login
 */
async function handlePasswordLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-submit-pwd-login');

  btn.disabled = true;
  btn.textContent = 'Authenticating...';
  hideAuthAlert();

  try {
    const res = await fetch(`${AUTH_API_BASE}/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      setAuthSession(data.token, data.user);
      closeSignInModal();
      showToast(`Welcome back, ${data.user.name}!`);
    } else {
      showAuthAlert('error', data.error || 'Invalid credentials');
    }
  } catch (err) {
    showAuthAlert('error', 'Unable to connect to backend server. Make sure port 3001 is running.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Sign In</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  }
}

/**
 * Request OTP for Login
 */
async function requestLoginOtp(isResend = false) {
  const emailInput = document.getElementById('login-otp-email');
  const email = emailInput.value.trim();

  if (!email || !email.includes('@')) {
    showAuthAlert('error', 'Please enter a valid email address');
    return;
  }

  currentLoginEmail = email;
  hideAuthAlert();

  const btn = document.getElementById('btn-send-login-otp');
  btn.disabled = true;
  btn.textContent = 'Sending code...';

  try {
    const res = await fetch(`${AUTH_API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'login' })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      document.getElementById('login-otp-step-1').style.display = 'none';
      document.getElementById('login-otp-step-2').hidden = false;
      document.getElementById('login-target-email-display').textContent = email;
      clearOtpBoxes('login-otp-inputs');

      startOtpCountdown('login');
      showAuthAlert('success', data.message, data.devOtp);
    } else {
      showAuthAlert('error', data.error || 'Failed to dispatch OTP');
    }
  } catch (err) {
    showAuthAlert('error', 'Connection error. Check backend server.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send Login Code';
  }
}

function resetLoginOtpFlow() {
  document.getElementById('login-otp-step-1').style.display = 'block';
  document.getElementById('login-otp-step-2').hidden = true;
  clearInterval(loginOtpTimer);
  hideAuthAlert();
}

/**
 * Submit OTP to complete Login
 */
async function submitLoginOtp() {
  const otp = getOtpCodeFromBoxes('login-otp-inputs');
  if (otp.length < 6) {
    showAuthAlert('error', 'Please enter all 6 digits of the OTP');
    return;
  }

  const btn = document.getElementById('btn-verify-login-otp');
  btn.disabled = true;
  btn.textContent = 'Verifying...';
  hideAuthAlert();

  try {
    const res = await fetch(`${AUTH_API_BASE}/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentLoginEmail, otp })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      setAuthSession(data.token, data.user);
      closeSignInModal();
      showToast(`Welcome, ${data.user.name}!`);
    } else {
      showAuthAlert('error', data.error || 'Invalid or expired OTP');
    }
  } catch (err) {
    showAuthAlert('error', 'Connection failed');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify & Sign In';
  }
}

/**
 * Handle Step 1 of Sign Up (Dispatch Free OTP)
 */
async function handleSignupStep1(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const org = document.getElementById('signup-org').value.trim();
  const zone = document.getElementById('signup-zone').value;
  const phone = document.getElementById('signup-phone').value.trim();
  const role = document.querySelector('input[name="signup-role"]:checked')?.value || 'donor';

  currentSignupData = { name, email, password, organization: org, zone, phone, role };

  const btn = document.getElementById('btn-send-signup-otp');
  btn.disabled = true;
  btn.textContent = 'Sending free code...';
  hideAuthAlert();

  try {
    const res = await fetch(`${AUTH_API_BASE}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose: 'signup', name, role, organization: org })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      document.getElementById('signup-step-1').style.display = 'none';
      document.getElementById('signup-step-2').hidden = false;
      document.getElementById('signup-target-email-display').textContent = email;
      clearOtpBoxes('signup-otp-inputs');

      startOtpCountdown('signup');
      showAuthAlert('success', data.message, data.devOtp);
    } else {
      showAuthAlert('error', data.error || 'Failed to send verification code');
    }
  } catch (err) {
    showAuthAlert('error', 'Could not reach auth server');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Send Verification Code</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
  }
}

function resetSignupStep() {
  document.getElementById('signup-step-1').style.display = 'block';
  document.getElementById('signup-step-2').hidden = true;
  clearInterval(signupOtpTimer);
  hideAuthAlert();
}

function resendSignupOtp() {
  if (!currentSignupData.email) return;
  handleSignupStep1({ preventDefault: () => {} });
}

/**
 * Submit Signup OTP & complete registration
 */
async function submitSignupVerification() {
  const otp = getOtpCodeFromBoxes('signup-otp-inputs');
  if (otp.length < 6) {
    showAuthAlert('error', 'Please enter all 6 digits');
    return;
  }

  const btn = document.getElementById('btn-complete-signup');
  btn.disabled = true;
  btn.textContent = 'Registering...';
  hideAuthAlert();

  try {
    const res = await fetch(`${AUTH_API_BASE}/verify-and-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentSignupData, otp })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      setAuthSession(data.token, data.user);
      closeSignInModal();
      showToast(`Account verified! Welcome to Sahakara, ${data.user.name}.`);
    } else {
      showAuthAlert('error', data.error || 'Verification failed');
    }
  } catch (err) {
    showAuthAlert('error', 'Connection error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify & Create Account';
  }
}

/**
 * OTP Timer Countdown Helper
 */
function startOtpCountdown(type) {
  let seconds = 45;
  const countdownEl = document.getElementById(`${type}-otp-countdown`);
  const resendBtn = document.getElementById(`btn-resend-${type}-otp`);
  const timerText = document.getElementById(`${type}-otp-timer-text`);

  if (!countdownEl || !resendBtn) return;

  resendBtn.disabled = true;
  timerText.style.display = 'inline';
  countdownEl.textContent = seconds;

  const timerRef = setInterval(() => {
    seconds--;
    countdownEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timerRef);
      resendBtn.disabled = false;
      timerText.style.display = 'none';
    }
  }, 1000);

  if (type === 'login') {
    clearInterval(loginOtpTimer);
    loginOtpTimer = timerRef;
  } else {
    clearInterval(signupOtpTimer);
    signupOtpTimer = timerRef;
  }
}

/**
 * 1-Click Persona Login (Pre-configured test accounts)
 */
async function quickLoginPersona(role) {
  hideAuthAlert();
  const credentials = {
    donor: { email: 'donor@sahakara.org', password: 'Sahakara@123' },
    shelter: { email: 'shelter@sahakara.org', password: 'Sahakara@123' },
    driver: { email: 'driver@sahakara.org', password: 'Sahakara@123' }
  };

  const cred = credentials[role];
  if (!cred) return;

  try {
    const res = await fetch(`${AUTH_API_BASE}/login-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cred)
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      setAuthSession(data.token, data.user);
      closeSignInModal();
      showToast(`Logged in as demo persona: ${data.user.name} (${data.user.role.toUpperCase()})`);
    } else {
      showAuthAlert('error', 'Could not login persona');
    }
  } catch (e) {
    showAuthAlert('error', 'Backend offline. Please start backend on port 3001.');
  }
}

/**
 * Store auth session in localStorage & update UI
 */
function setAuthSession(token, user) {
  authState.token = token;
  authState.user = user;
  localStorage.setItem('sahakara_auth_token', token);
  localStorage.setItem('sahakara_auth_user', JSON.stringify(user));
  renderNavAuthState();
}

/**
 * Logout
 */
function logout(showNotice = true) {
  authState.token = null;
  authState.user = null;
  localStorage.removeItem('sahakara_auth_token');
  localStorage.removeItem('sahakara_auth_user');
  renderNavAuthState();
  if (showNotice) {
    showToast('You have been signed out.');
  }
}

/**
 * Lightweight Toast Notification
 */
function showToast(message) {
  let toast = document.getElementById('sahakara-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'sahakara-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #111827;
      color: #FFFFFF;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 10px;
      border: 1px solid #374151;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(10px);
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span>🌱</span> <span>${message}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 4000);
}

/* ==========================================================================
   8. Compliance Notice Modal
   ========================================================================== */
const complianceDocs = {
  'FSSAI Guidelines': `
    <p><strong>FSSAI Food Safety and Standards (Recovery and Distribution of Surplus Food) Regulations, 2019</strong></p>
    <p>Sahakara guarantees digital chain-of-custody logs ensuring all surplus food is dispatched within 2 hours of post, maintained above 60°C or below 5°C, and distributed exclusively to registered welfare organizations.</p>
  `,
  'Good Samaritan': `
    <p><strong>Statutory Donor Protection</strong></p>
    <p>Under Section 31 of statutory safety guidelines, food business operators acting in good faith without willful misconduct or gross negligence are shielded from civil liability regarding surplus food donation.</p>
  `,
  'Audit Logs': `
    <p><strong>Real-Time Verifiable Handshakes</strong></p>
    <p>Every donation batch is assigned a unique cryptographic dispatch identifier (e.g. #SK-8821), tracking kitchen origin, vehicle transit temperatures, SMS OTP driver exchanges, and shelter consumption logs.</p>
  `,
  'Privacy': `
    <p><strong>Civic Public Good Data Policy</strong></p>
    <p>No user data is monetized or shared with third-party advertising networks. Telephone numbers are masked during volunteer driver relays.</p>
  `
};

function showModalNotice(topic) {
  const modal = document.getElementById('modal-notice');
  const heading = document.getElementById('notice-heading');
  const body = document.getElementById('notice-body');

  heading.textContent = topic;
  body.innerHTML = complianceDocs[topic] || '<p>Official protocol documentation available on demand.</p>';

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeNoticeModal() {
  const modal = document.getElementById('modal-notice');
  modal.hidden = true;
  document.body.style.overflow = '';
}

/* ==========================================================================
   9. Global Backdrop and Escape Key Listeners
   ========================================================================== */
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.hidden = true;
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.hidden = true;
    });
    document.body.style.overflow = '';
  }
});

/* ==========================================================================
   10. Interactive Zero-Waste Impact Calculator
   ========================================================================== */
let currentKitchenMultiplier = 1.0;

function updateCalculator(meals) {
  const mealCount = parseInt(meals, 10);
  const kgPerDay = Math.round(mealCount * 0.45);

  const displayEl = document.getElementById('calc-meals-display');
  const kgDisplayEl = document.getElementById('calc-kg-display');
  if (displayEl) displayEl.textContent = `${mealCount} meals/day`;
  if (kgDisplayEl) kgDisplayEl.textContent = `${kgPerDay} kg/day`;

  // Annual Calculations
  const yearlyMeals = mealCount * 365 * currentKitchenMultiplier;
  const yearlyKg = yearlyMeals * 0.45;
  const co2Tons = (yearlyKg * 2.5 / 1000).toFixed(1);
  const waterMillionL = (yearlyMeals * 42 / 1000).toFixed(1);
  const csrLakhs = (yearlyMeals * 30 / 100000).toFixed(1);

  const fedEl = document.getElementById('res-people-fed');
  const co2El = document.getElementById('res-co2-saved');
  const waterEl = document.getElementById('res-water-saved');
  const csrEl = document.getElementById('res-csr-value');

  if (fedEl) fedEl.textContent = Math.round(yearlyMeals).toLocaleString('en-IN');
  if (co2El) co2El.innerHTML = `${co2Tons} <small>tons</small>`;
  if (waterEl) waterEl.innerHTML = `${waterMillionL} <small>Million L</small>`;
  if (csrEl) csrEl.innerHTML = `₹ ${csrLakhs} <small>Lakhs</small>`;
}

function setCalcType(type, btn) {
  document.querySelectorAll('.calc-kitchen-types .type-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (type === 'mess') currentKitchenMultiplier = 1.0;
  if (type === 'banquet') currentKitchenMultiplier = 1.35;
  if (type === 'caterer') currentKitchenMultiplier = 1.15;
  if (type === 'hotel') currentKitchenMultiplier = 1.5;

  const slider = document.getElementById('calc-surplus-range');
  if (slider) updateCalculator(slider.value);
}

/* ==========================================================================
   11. Interactive SMS & Helpline Simulator
   ========================================================================== */
function simulateSmsPreset(type) {
  const bubbleDonor = document.getElementById('sms-bubble-donor');
  const bubbleReply = document.getElementById('sms-bubble-reply');
  if (!bubbleDonor || !bubbleReply) return;

  if (type === 'amity') {
    bubbleDonor.textContent = 'FOOD 50 MEALS HOT VEG PULAO AMITY MESS PIN 303002';
    bubbleReply.textContent = 'Processing Jaipur node match...';

    setTimeout(() => {
      bubbleReply.textContent = 'SAHAKARA DISPATCH: Received #SK-9412. Matched to Ananda Seva Ashram (Node 04). Driver Vikram R. dispatched. Pickup OTP: 5252.';
      renderDispatchCard({
        tracking_id: 'SK-9412',
        donor_name: 'Amity University Mess (Kant Kalwar)',
        food_title: '50 Meals Hot Veg Pulao',
        quantity: '50 Meals (~22 kg)',
        meals_count: 50,
        temp_celsius: 66,
        status: 'matched',
        pickup_address: 'SP-1, Kant Kalwar, NH-11C, Jaipur 303002',
        assigned_shelter: 'Ananda Seva Ashram (Node 04)',
        shelter_distance_km: 2.3,
        assigned_driver: 'Driver Vikram R. (EV Cargo-4419)',
        driver_eta_mins: 12,
        otp_code: '5252'
      });
    }, 400);
  } else if (type === 'banquet') {
    bubbleDonor.textContent = 'FOOD 100 PORTIONS PANEER RICE ROYAL BANQUET PIN 302017';
    bubbleReply.textContent = 'Processing Jaipur node match...';

    setTimeout(() => {
      bubbleReply.textContent = 'SAHAKARA DISPATCH: Received #SK-8835. Matched to Akshaya Patra Foundation Jaipur (3.1 km). EV Driver Dinesh assigned. OTP: 7712.';
      renderDispatchCard({
        tracking_id: 'SK-8835',
        donor_name: 'Royal Heritage Banquet Jaipur',
        food_title: '100 Portions Paneer Rice & Sabzi',
        quantity: '100 Meals (~45 kg)',
        meals_count: 100,
        temp_celsius: 67,
        status: 'matched',
        pickup_address: 'Mahal Road, Jagatpura, Jaipur 302017',
        assigned_shelter: 'Akshaya Patra Foundation Jaipur',
        shelter_distance_km: 3.1,
        assigned_driver: 'Driver Dinesh K. (EV-7712)',
        driver_eta_mins: 20,
        otp_code: '7712'
      });
    }, 400);
  } else if (type === 'accept') {
    bubbleDonor.textContent = 'ACCEPT #SK-8821';
    bubbleReply.textContent = 'SAHAKARA DISPATCH: Volunteer Driver Vikram R. confirmed pickup. Route active on Jaipur live radar. Handover OTP: 4419.';
    if (currentLiveDispatch) {
      currentLiveDispatch.status = 'picked_up';
      updateStepperState('picked_up');
    }
  }
}

/* ==========================================================================
   12. FSSAI Rescue Certificate Pass Modal
   ========================================================================== */
function openFssaiPassModal() {
  const modal = document.getElementById('modal-fssai-pass');
  if (!modal) return;

  const batchId = currentLiveDispatch ? currentLiveDispatch.tracking_id : 'SK-8821';
  const donor = currentLiveDispatch ? currentLiveDispatch.donor_name : 'Amity University Mess (Jaipur)';
  const shelter = currentLiveDispatch ? currentLiveDispatch.assigned_shelter : 'Ananda Seva Ashram (Node 04)';
  const driver = currentLiveDispatch ? currentLiveDispatch.assigned_driver : 'Driver Vikram R. (EV-4419)';

  const idEl = document.getElementById('cert-batch-id');
  const dEl = document.getElementById('cert-donor');
  const sEl = document.getElementById('cert-shelter');
  const drEl = document.getElementById('cert-driver');

  if (idEl) idEl.textContent = `#${batchId}`;
  if (dEl) dEl.textContent = donor;
  if (sEl) sEl.textContent = shelter;
  if (drEl) drEl.textContent = driver;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeFssaiPassModal() {
  const modal = document.getElementById('modal-fssai-pass');
  if (modal) modal.hidden = true;
  document.body.style.overflow = '';
}
