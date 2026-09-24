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
});

/* ==========================================================================
   1. Live Ladder Active Step Countdown
   ========================================================================== */
function initLadderCountdown() {
  const timerEl = document.getElementById('ladder-timer');
  if (!timerEl) return;

  let totalSeconds = 28 * 60 + 40; // 28 minutes, 40 seconds

  setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      timerEl.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds} left`;
    } else {
      timerEl.textContent = 'Escalating...';
    }
  }, 1000);
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

function handlePostSubmit(e) {
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

  submitBtn.textContent = 'Broadcasting to Jaipur Node Cluster...';
  submitBtn.disabled = true;

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
      const newTrackingId = `SK-${Math.floor(1000 + Math.random() * 9000)}`;
      const mealCount = parseInt(quantity, 10) || 50;

      const newDispatch = {
        tracking_id: newTrackingId,
        donor_name: donorName,
        food_title: `${quantity} ${foodType}`,
        quantity,
        meals_count: mealCount,
        temp_celsius: 65,
        status: 'matched',
        pickup_address: address,
        assigned_shelter: 'Ananda Seva Ashram (Node 04)',
        shelter_distance_km: 2.1,
        assigned_driver: 'Driver Vikram R. (EV Cargo-4419)',
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
   7. Sign In Modal & OTP Verification
   ========================================================================== */
function openSignInModal() {
  const modal = document.getElementById('modal-signin');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeSignInModal() {
  const modal = document.getElementById('modal-signin');
  modal.hidden = true;
  document.body.style.overflow = '';
}

function handleSignInSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('login-phone').value;
  const role = document.getElementById('login-role').value;

  const testOtp = '123456';
  const enteredOtp = prompt(`OTP sent to +91 ${phone} (Test OTP: ${testOtp}). Enter OTP:`);
  
  if (enteredOtp === testOtp || enteredOtp) {
    alert(`Welcome! Logged in as ${role.toUpperCase()} (Jaipur Cluster). Token: SK-AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    closeSignInModal();
  }
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
