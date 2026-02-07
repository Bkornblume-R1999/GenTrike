import { Api } from './api.js';

// Application State
const state = {
  map: null,
  currentMode: 'trike',
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

// Route Data
const ROUTES = {
  'uhaw': {
    name: 'Uhaw Route',
    color: '#10b981',
    stops: [
      [6.05767570956232, 125.10107993582126],
      [6.066884922625555, 125.1434596999282],
      [6.077595973054012, 125.14630932006035],
      [6.103867375918512, 125.15131957789644],
      [6.118545877545823, 125.16105536621555],
      [6.113102709883002, 125.1641208727235],
      [6.112729529261363, 125.17019837345096],
      [6.107332339041174, 125.17169075356206],
      [6.10715133832164, 125.17841548474036],
      [6.11504792768598, 125.1810033808399],
      [6.117269670385729, 125.18593755106797],
      [6.121359557284698, 125.19027992842483]
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
      [6.078873108385696, 125.13528401472598],
      [6.077396262058303, 125.14070464684552],
      [6.077595973054012, 125.14630932006035],
      [6.107364931098272, 125.17185909281004],
      [6.1094378291354685, 125.17859477710057],
      [6.117269670385729, 125.18593755106797],
      [6.118803421745483, 125.19375059719822],
      [6.127613973270192, 125.19631931002468]
    ],
    labels: [
      "Lado Transco Terminal", "GenSan National High", "Western Oil",
      "Pioneer Ave", "Magsaysay UNITOP", "KCC", "Brigada Pharmacy",
      "Lagao Public Market"
    ]
  }
};

// ==================== UTILITIES ====================

function showToast(message, duration = 3000) {
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
  const distEl = document.getElementById('distance-display');
  const fareEl = document.getElementById('fare-display');

  // No markers yet
  if (!startMarker && !endMarker) {
    startEl.textContent = 'Tap map or search';
    endEl.textContent = 'Tap map or search';
    distEl.textContent = '—';
    fareEl.textContent = '₱—';
    clearTrikeRoute();
    return;
  }

  // Only start marker
  if (startMarker && !endMarker) {
    const startPos = startMarker.getLatLng();
    startEl.textContent = 'Loading...';
    const startName = await reverseGeocode(startPos);
    startEl.textContent = startName;
    
    endEl.textContent = 'Tap map or search';
    distEl.textContent = '—';
    fareEl.textContent = '₱—';
    clearTrikeRoute();
    return;
  }

  // Both markers
  const startPos = startMarker.getLatLng();
  const endPos = endMarker.getLatLng();

  // Update location names
  startEl.textContent = 'Loading...';
  endEl.textContent = 'Loading...';
  
  const [startName, endName] = await Promise.all([
    reverseGeocode(startPos),
    reverseGeocode(endPos)
  ]);
  
  startEl.textContent = startName;
  endEl.textContent = endName;

  // Clear old route
  clearTrikeRoute();

  // Calculate new route
  state.trike.routeControl = L.Routing.control({
    waypoints: [startPos, endPos],
    lineOptions: {
      styles: [{
        color: '#2563eb',
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

  state.trike.routeControl.on('routesfound', async (e) => {
    const route = e.routes[0];
    const distanceKm = route.summary.totalDistance / 1000;
    distEl.textContent = `${distanceKm.toFixed(2)} km`;

    try {
      const { fare } = await Api.computeFare({ mode: 'trike', distanceKm });
      fareEl.textContent = `₱${fare}`;
      showToast(`💰 Estimated fare: ₱${fare}`);
    } catch (error) {
      console.error('Fare calculation error:', error);
      fareEl.textContent = '₱—';
      showToast('❌ Failed to calculate fare');
    }
  });

  state.trike.routeControl.on('routingerror', () => {
    distEl.textContent = '—';
    fareEl.textContent = '₱—';
    showToast('❌ Could not find route');
  });
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
