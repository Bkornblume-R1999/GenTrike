import { Api } from './api.js';

// Application State
const state = {
  map: null,
  currentMode: 'trike',
  discountType: 'none',
  trike: {
    startMarker: null,
    endMarker: null,
    routeControl: null
  },
  busjeep: {
    routeControl: null,
    markers: [],
    selectedRoute: null
  }
};

// Route Data - Expanded with more General Santos City routes
const ROUTES = {
  'uhaw': {
    name: 'Uhaw Route',
    color: '#10b981',
    stops: [
      [6.05767570956232, 125.10107993582126],   // Airport
      [6.066884922625555, 125.1434596999282],   // Kanto Uhaw Station
      [6.077595973054012, 125.14630932006035],  // Jollibee
      [6.103867375918512, 125.15131957789644],  // GenSan Mray Logistics
      [6.118545877545823, 125.16105536621555],  // 7-Eleven Bulaong
      [6.113102709883002, 125.1641208727235],   // Husky Terminal
      [6.112729529261363, 125.17019837345096],  // RD Plaza
      [6.107332339041174, 125.17169075356206],  // Pioneer Avenue
      [6.10715133832164, 125.17841548474036],   // Palengke
      [6.11504792768598, 125.1810033808399],    // SM
      [6.117269670385729, 125.18593755106797],  // KCC
      [6.121359557284698, 125.19027992842483]   // Robinsons
    ],
    labels: [
      "Airport", "Kanto Uhaw Station", "Jollibee", "GenSan Mray Logistics",
      "7-Eleven Bulaong", "Husky Terminal", "RD Plaza", "Pioneer Avenue",
      "Palengke", "SM", "KCC", "Robinsons"
    ]
  },
  'kanto-uhaw': {
    name: 'Kanto Uhaw Route',
    color: '#f59e0b',
    stops: [
      [6.078873108385696, 125.13528401472598],  // Lado Transco Terminal
      [6.077396262058303, 125.14070464684552],  // GenSan National High
      [6.077595973054012, 125.14630932006035],  // Western Oil
      [6.107364931098272, 125.17185909281004],  // Pioneer Ave
      [6.1094378291354685, 125.17859477710057], // Magsaysay UNITOP
      [6.117269670385729, 125.18593755106797],  // KCC
      [6.118803421745483, 125.19375059719822],  // Brigada Pharmacy
      [6.127613973270192, 125.19631931002468]   // Lagao Public Market
    ],
    labels: [
      "Lado Transco Terminal", "GenSan National High", "Western Oil",
      "Pioneer Ave", "Magsaysay UNITOP", "KCC", "Brigada Pharmacy",
      "Lagao Public Market"
    ]
  },
  'lagao': {
    name: 'Lagao Route',
    color: '#3b82f6',
    stops: [
      [6.127613973270192, 125.19631931002468],  // Lagao Market
      [6.119584527392012, 125.19232841468442],  // Lagao Gym
      [6.116882344293761, 125.18754235621987],  // Veranza Mall
      [6.115287937423156, 125.18267431743526],  // Notre Dame
      [6.112845371239487, 125.17874332915972],  // Gaisano Mall
      [6.110574293841927, 125.17538426349432],  // Public Market
      [6.108342618273854, 125.17289543821345],  // City Hall
      [6.106821839463725, 125.17098374627438],  // Plaza Heneral Santos
      [6.103867375918512, 125.16845321098765],  // Oval Plaza
      [6.101234567890123, 125.16543219876543]   // Dadiangas Park
    ],
    labels: [
      "Lagao Market", "Lagao Gym", "Veranza Mall", "Notre Dame",
      "Gaisano Mall", "Public Market", "City Hall", "Plaza Heneral Santos",
      "Oval Plaza", "Dadiangas Park"
    ]
  },
  'dadiangas': {
    name: 'Dadiangas Route',
    color: '#ef4444',
    stops: [
      [6.095432123456789, 125.15234567891234],  // Dadiangas Wharf
      [6.098765432109876, 125.15789012345678],  // Fish Port
      [6.102345678901234, 125.16234567890123],  // Magsaysay Avenue
      [6.105678901234567, 125.16789012345678],  // Quirino Avenue
      [6.108901234567890, 125.17234567890123],  // Pioneer Avenue Junction
      [6.112234567890123, 125.17689012345678],  // Public Market
      [6.115567890123456, 125.18134567890123],  // SM City GenSan
      [6.118890123456789, 125.18589012345678]   // Robinsons Place
    ],
    labels: [
      "Dadiangas Wharf", "Fish Port", "Magsaysay Avenue", "Quirino Avenue",
      "Pioneer Avenue Junction", "Public Market", "SM City GenSan", "Robinsons Place"
    ]
  },
  'calumpang': {
    name: 'Calumpang Route',
    color: '#8b5cf6',
    stops: [
      [6.110574293841927, 125.17538426349432],  // Public Market
      [6.105892736451827, 125.16983742651938],  // Bulaklakan
      [6.101234897563421, 125.16532876549321],  // San Isidro
      [6.097856234789123, 125.15987654321098],  // Sinawal
      [6.093421876543210, 125.15432198765432],  // Calumpang Elementary
      [6.089765432109876, 125.14987654321098],  // Calumpang Proper
      [6.086543210987654, 125.14543210987654],  // Calumpang Heights
      [6.083210987654321, 125.14098765432109],  // Calumpang Terminal
      [6.079876543210987, 125.13654320987654]   // Upper Calumpang
    ],
    labels: [
      "Public Market", "Bulaklakan", "San Isidro", "Sinawal",
      "Calumpang Elementary", "Calumpang Proper", "Calumpang Heights",
      "Calumpang Terminal", "Upper Calumpang"
    ]
  },
  'labangal': {
    name: 'Labangal Route',
    color: '#f97316',
    stops: [
      [6.110574293841927, 125.17538426349432],  // CBD / Public Market
      [6.108234567890123, 125.17098765432109],  // Rizal Avenue
      [6.105892341234567, 125.16654320987654],  // Pendatun Avenue
      [6.103543218765432, 125.16209876543210],  // King Solomon Institute
      [6.101198765432109, 125.15765432109876],  // Labangal Elementary
      [6.098850123456789, 125.15321098765432],  // Petronas Gas Station
      [6.096501234567890, 125.14876543210987],  // Barrio Blaan
      [6.094152345678901, 125.14432109876543],  // Labangal Proper
      [6.091803456789012, 125.13987654321098],  // Bloomfields Subdivision
      [6.089454567890123, 125.13543210987654],  // Labangal Terminal
      [6.087105678901234, 125.13098765432109]   // Upper Labangal
    ],
    labels: [
      "CBD / Public Market", "Rizal Avenue", "Pendatun Avenue",
      "King Solomon Institute", "Labangal Elementary", "Petronas Gas Station",
      "Barrio Blaan", "Labangal Proper", "Bloomfields Subdivision",
      "Labangal Terminal", "Upper Labangal"
    ]
  }
};

// ==================== PANEL DRAG FUNCTIONALITY ====================

function initPanelDrag() {
  const panel = document.getElementById('control-panel');
  const handle = document.querySelector('.panel-handle');
  
  if (!handle || window.innerWidth >= 1024) return; // Only on mobile
  
  let startY = 0;
  let currentY = 0;
  let isDragging = false;
  
  const handleStart = (e) => {
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    startY = touch.clientY;
    isDragging = true;
    panel.style.transition = 'none';
  };
  
  const handleMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    currentY = touch.clientY;
    const deltaY = currentY - startY;
    
    // Only allow downward drag to minimize
    if (deltaY > 0 && !panel.classList.contains('minimized')) {
      panel.style.transform = `translateY(${deltaY}px)`;
    }
    // Only allow upward drag to expand
    else if (deltaY < 0 && panel.classList.contains('minimized')) {
      panel.style.transform = `translateY(calc(100% - 60px + ${deltaY}px))`;
    }
  };
  
  const handleEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    panel.style.transition = '';
    panel.style.transform = '';
    
    const deltaY = currentY - startY;
    
    // If dragged more than 50px, toggle state
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        panel.classList.add('minimized');
      } else {
        panel.classList.remove('minimized');
      }
    }
  };
  
  // Touch events
  handle.addEventListener('touchstart', handleStart, { passive: true });
  document.addEventListener('touchmove', handleMove, { passive: true });
  document.addEventListener('touchend', handleEnd);
  
  // Mouse events (for testing on desktop)
  handle.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  
  // Also toggle on click/tap
  handle.addEventListener('click', (e) => {
    if (e.detail === 1) {
      panel.classList.toggle('minimized');
    }
  });
}

// ==================== UTILITIES ====================

function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function formatLatLng(ll) {
  return `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
}

// Custom marker icons
function createMarkerIcon(label, color) {
  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">${label}</div>
    `,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// ==================== GEOCODING ====================

async function reverseGeocode(latlng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const addr = data.address || {};
    
    const parts = [];
    if (addr.road) parts.push(addr.road);
    if (addr.suburb) parts.push(addr.suburb);
    
    return parts.length > 0 ? parts.join(', ') : formatLatLng(latlng);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return formatLatLng(latlng);
  }
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', General Santos City')}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.length > 0) {
      return L.latLng(data[0].lat, data[0].lon);
    }
    showToast('❌ Location not found');
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    showToast('❌ Search failed');
    return null;
  }
}

// ==================== MAP INITIALIZATION ====================

function initMap() {
  const map = L.map('map', {
    zoomControl: true,
    minZoom: 8,
    maxZoom: 19
  }).setView([6.116, 125.171], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
  
  state.map = map;

  // Handle map clicks for trike mode
  map.on('click', handleMapClick);
  
  // Fix map size
  setTimeout(() => map.invalidateSize(), 100);
  
  return map;
}

function handleMapClick(e) {
  if (state.currentMode !== 'trike') return;

  const { startMarker, endMarker } = state.trike;

  if (!startMarker) {
    state.trike.startMarker = L.marker(e.latlng, {
      draggable: true,
      icon: createMarkerIcon('A', '#10b981')
    }).addTo(state.map);
    
    state.trike.startMarker.on('dragend', updateTrikeRoute);
    showToast('📍 Start point set');
  } else if (!endMarker) {
    state.trike.endMarker = L.marker(e.latlng, {
      draggable: true,
      icon: createMarkerIcon('B', '#ef4444')
    }).addTo(state.map);
    
    state.trike.endMarker.on('dragend', updateTrikeRoute);
    showToast('🎯 Calculating route...');
  } else {
    // Move markers
    state.trike.startMarker.setLatLng(state.trike.endMarker.getLatLng());
    state.trike.endMarker.setLatLng(e.latlng);
    showToast('🔄 Route updated');
  }
  
  updateTrikeRoute();
}

// ==================== TRIKE MODE ====================

async function updateTrikeRoute() {
  const { startMarker, endMarker } = state.trike;
  const startEl = document.getElementById('start-display');
  const endEl = document.getElementById('end-display');

  if (!startMarker && !endMarker) return;

  if (startMarker) {
    const addr = await reverseGeocode(startMarker.getLatLng());
    startEl.textContent = addr;
  }

  if (endMarker) {
    const addr = await reverseGeocode(endMarker.getLatLng());
    endEl.textContent = addr;
  }

  if (startMarker && endMarker) {
    clearTrikeRoute();
    showLoading();
    
    const waypoints = [
      startMarker.getLatLng(),
      endMarker.getLatLng()
    ];

    state.trike.routeControl = L.Routing.control({
      waypoints,
      lineOptions: {
        styles: [{
          color: '#2563eb',
          weight: 6,
          opacity: 0.8
        }]
      },
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      createMarker: () => null,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false
    }).addTo(state.map);

    state.trike.routeControl.on('routesfound', async (e) => {
      hideLoading();
      const routes = e.routes;
      const summary = routes[0].summary;
      
      const distanceKm = summary.totalDistance / 1000;
      document.getElementById('distance-display').textContent = `${distanceKm.toFixed(2)} km`;
      
      const fareData = await Api.computeFare({ 
        mode: 'trike', 
        distanceKm,
        discountType: state.discountType 
      });
      
      displayFare(fareData);
    });

    state.trike.routeControl.on('routingerror', () => {
      hideLoading();
      showToast('❌ Could not find route');
    });
  }
}

function displayFare(fareData) {
  const fareDisplay = document.getElementById('fare-display');
  const fareBreakdown = document.getElementById('fare-breakdown');
  const regularFareEl = document.getElementById('regular-fare');
  const discountLabelEl = document.getElementById('discount-label');
  const discountAmountEl = document.getElementById('discount-amount');
  const fareFormulaEl = document.getElementById('fare-formula');
  
  fareDisplay.textContent = `₱${fareData.fare}`;
  
  if (fareData.discountType !== 'none') {
    // Show breakdown
    fareBreakdown.style.display = 'flex';
    regularFareEl.textContent = `₱${fareData.baseFare}`;
    discountAmountEl.textContent = `-₱${fareData.discountAmount}`;
    
    const discountNames = {
      pwd: 'PWD Discount (20%)',
      senior: 'Senior Citizen Discount (20%)',
      student: 'Student Discount (20%)'
    };
    discountLabelEl.textContent = discountNames[fareData.discountType] || 'Discount (20%)';
    
    fareFormulaEl.textContent = '₱12 base (4km) + ₱0.80/km (with discount)';
  } else {
    // Hide breakdown
    fareBreakdown.style.display = 'none';
    fareFormulaEl.textContent = '₱15 base (4km) + ₱1/km';
  }
}

function clearTrikeRoute() {
  if (state.trike.routeControl) {
    state.trike.routeControl.remove();
    state.trike.routeControl = null;
  }
}

function clearTrikeMarkers() {
  if (state.trike.startMarker) {
    state.trike.startMarker.remove();
    state.trike.startMarker = null;
  }
  if (state.trike.endMarker) {
    state.trike.endMarker.remove();
    state.trike.endMarker = null;
  }
  clearTrikeRoute();
  
  // Clear inputs
  document.getElementById('search-start').value = '';
  document.getElementById('search-end').value = '';
  document.getElementById('start-display').textContent = 'Tap map or search';
  document.getElementById('end-display').textContent = 'Tap map or search';
  document.getElementById('distance-display').textContent = '—';
  document.getElementById('fare-display').textContent = '₱—';
  document.getElementById('fare-breakdown').style.display = 'none';
}

// ==================== BUS/JEEP MODE ====================

function showRoute(routeKey) {
  clearBusJeepRoute();
  
  const route = ROUTES[routeKey];
  if (!route) return;

  state.busjeep.selectedRoute = routeKey;

  // Add markers
  route.stops.forEach((coords, idx) => {
    const marker = L.circleMarker(coords, {
      radius: 8,
      color: '#ffffff',
      fillColor: route.color,
      fillOpacity: 1,
      weight: 3
    }).addTo(state.map);
    
    marker.bindTooltip(route.labels[idx], {
      permanent: false,
      direction: 'top'
    });
    
    state.busjeep.markers.push(marker);
  });

  // Add route line
  const waypoints = route.stops.map(([lat, lng]) => L.latLng(lat, lng));
  
  state.busjeep.routeControl = L.Routing.control({
    waypoints,
    lineOptions: {
      styles: [{
        color: route.color,
        weight: 5,
        opacity: 0.8
      }]
    },
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1'
    }),
    createMarker: () => null,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false
  }).addTo(state.map);

  // Show route detail
  showRouteDetail(route);
  showToast(`🚌 ${route.name} selected`);
}

function showRouteDetail(route) {
  const detailEl = document.getElementById('route-detail');
  const nameEl = document.getElementById('route-detail-name');
  const stopsEl = document.getElementById('stops-list');
  
  nameEl.textContent = route.name;
  
  stopsEl.innerHTML = route.labels.map((label, idx) => `
    <div class="stop-item">
      <div class="stop-number">${idx + 1}</div>
      <div>${label}</div>
    </div>
  `).join('');
  
  detailEl.style.display = 'block';
}

function clearBusJeepRoute() {
  if (state.busjeep.routeControl) {
    state.busjeep.routeControl.remove();
    state.busjeep.routeControl = null;
  }
  
  state.busjeep.markers.forEach(m => m.remove());
  state.busjeep.markers = [];
  state.busjeep.selectedRoute = null;
  
  document.getElementById('route-detail').style.display = 'none';
}

// ==================== MODE SWITCHING ====================

function switchMode(mode) {
  if (state.currentMode === mode) return;
  
  state.currentMode = mode;
  
  // Update UI
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
  
  document.querySelectorAll('.panel-view').forEach(view => {
    view.classList.toggle('active', view.dataset.view === mode);
  });
  
  // Clear map elements
  if (mode !== 'trike') {
    clearTrikeMarkers();
  }
  if (mode !== 'busjeep') {
    clearBusJeepRoute();
  }
  
  setTimeout(() => state.map.invalidateSize(), 100);
}

// ==================== DISCOUNT SELECTION ====================

function selectDiscount(discountType) {
  if (state.discountType === discountType) return;
  
  state.discountType = discountType;
  
  // Update UI
  document.querySelectorAll('.discount-btn').forEach(btn => {
    const isActive = btn.dataset.discount === discountType;
    btn.classList.toggle('active', isActive);
  });
  
  // Recalculate fare if route exists
  if (state.trike.startMarker && state.trike.endMarker) {
    updateTrikeRoute();
  }
  
  const discountNames = {
    none: 'Regular fare',
    pwd: 'PWD discount applied',
    senior: 'Senior citizen discount applied',
    student: 'Student discount applied'
  };
  showToast(discountNames[discountType] || 'Fare updated');
}

// ==================== MATRIX TABS ====================

function initMatrixTabs() {
  document.querySelectorAll('.matrix-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cluster = tab.dataset.cluster;
      
      // Update active tab
      document.querySelectorAll('.matrix-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cluster === cluster);
      });
      
      // Update active view
      document.querySelectorAll('.matrix-view').forEach(view => {
        view.classList.toggle('active', view.dataset.cluster === cluster);
      });
    });
  });
}

// ==================== GEOLOCATION ====================

function useCurrentLocation() {
  if (!navigator.geolocation) {
    showToast('❌ Geolocation not supported');
    return;
  }

  showToast('📍 Getting location...');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const latlng = L.latLng(latitude, longitude);

      if (state.trike.startMarker) {
        state.trike.startMarker.setLatLng(latlng);
      } else {
        state.trike.startMarker = L.marker(latlng, {
          draggable: true,
          icon: createMarkerIcon('A', '#10b981')
        }).addTo(state.map);
        state.trike.startMarker.on('dragend', updateTrikeRoute);
      }

      state.map.setView(latlng, 15);
      updateTrikeRoute();
      showToast('✅ Location set');
    },
    (error) => {
      console.error('Geolocation error:', error);
      showToast('❌ Could not get location');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ==================== EVENT LISTENERS ====================

function initEventListeners() {
  // Mode switcher
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  // Discount selector
  document.querySelectorAll('.discount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectDiscount(btn.dataset.discount);
    });
  });

  // Reset button (in quick actions)
  document.getElementById('reset-trike').addEventListener('click', () => {
    clearTrikeMarkers();
    showToast('🔄 Reset');
  });

  // Use location button
  document.getElementById('use-location').addEventListener('click', useCurrentLocation);

  // Search inputs
  const searchStart = document.getElementById('search-start');
  const searchEnd = document.getElementById('search-end');

  searchStart.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    const query = e.target.value.trim();
    if (!query) return;

    const latlng = await geocode(query);
    if (latlng) {
      if (state.trike.startMarker) {
        state.trike.startMarker.setLatLng(latlng);
      } else {
        state.trike.startMarker = L.marker(latlng, {
          draggable: true,
          icon: createMarkerIcon('A', '#10b981')
        }).addTo(state.map);
        state.trike.startMarker.on('dragend', updateTrikeRoute);
      }
      state.map.setView(latlng, 15);
      updateTrikeRoute();
      e.target.blur();
    }
  });

  searchEnd.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    const query = e.target.value.trim();
    if (!query) return;

    const latlng = await geocode(query);
    if (latlng) {
      if (state.trike.endMarker) {
        state.trike.endMarker.setLatLng(latlng);
      } else {
        state.trike.endMarker = L.marker(latlng, {
          draggable: true,
          icon: createMarkerIcon('B', '#ef4444')
        }).addTo(state.map);
        state.trike.endMarker.on('dragend', updateTrikeRoute);
      }
      state.map.setView(latlng, 15);
      updateTrikeRoute();
      e.target.blur();
    }
  });

  // Route cards
  document.querySelectorAll('.route-card').forEach(card => {
    card.addEventListener('click', () => {
      showRoute(card.dataset.route);
    });
  });

  // Clear route button
  document.getElementById('clear-route').addEventListener('click', () => {
    clearBusJeepRoute();
    showToast('Route cleared');
  });
}

// ==================== INITIALIZATION ====================

function init() {
  initMap();
  initEventListeners();
  initPanelDrag();
  initMatrixTabs();
  
  setTimeout(() => {
    showToast('👋 Welcome to GenSan Fare!', 3000);
  }, 500);
}

// Start app
document.addEventListener('DOMContentLoaded', init);

// Handle window resize
window.addEventListener('resize', () => {
  if (state.map) {
    state.map.invalidateSize();
  }
});
