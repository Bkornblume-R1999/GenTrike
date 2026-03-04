import { Api } from './api.js';

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
  },
  'mabuhay': {
    name: 'Mabuhay Route',
    color: '#ffffff',
    stops: [
      [6.110574293841927, 125.17538426349432],
      [6.107234567890123, 125.17098765432109],
      [6.103867375918512, 125.16654320987654],
      [6.100456789012345, 125.16209876543210],
      [6.097123456789012, 125.15765432109876],
      [6.093789012345678, 125.15321098765432],
      [6.090456789012345, 125.14876543210987],
      [6.087123456789012, 125.14432109876543],
      [6.083789012345678, 125.13987654321098],
      [6.080456789012345, 125.13543210987654]
    ],
    labels: [
      "Public Market", "City Hall", "Oval Plaza", "Bulaklakan",
      "San Isidro", "Mabuhay Junction", "Habitat Phase I", "Habitat Phase II",
      "Habitat Phase III", "Mabuhay Satellite Market"
    ]
  }
};

function initPanelDrag() {
  const panel = document.getElementById('control-panel');
  const handle = document.querySelector('.panel-handle');
  
  if (!handle || window.innerWidth >= 1024) return;
  
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
    
    if (deltaY > 0 && !panel.classList.contains('minimized')) {
      panel.style.transform = `translateY(${deltaY}px)`;
    } else if (deltaY < 0 && panel.classList.contains('minimized')) {
      panel.style.transform = `translateY(calc(100% - 60px + ${deltaY}px))`;
    }
  };
  
  const handleEnd = () => {
    if (!isDragging) return;
    isDragging = false;
    panel.style.transition = '';
    panel.style.transform = '';
    
    const deltaY = currentY - startY;
    
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        panel.classList.add('minimized');
        panel.classList.remove('expanded');
      } else {
        panel.classList.remove('minimized');
      }
    }
  };
  
  handle.addEventListener('touchstart', handleStart, { passive: true });
  document.addEventListener('touchmove', handleMove, { passive: true });
  document.addEventListener('touchend', handleEnd);
  
  handle.addEventListener('mousedown', handleStart);
  document.addEventListener('mousemove', handleMove);
  document.addEventListener('mouseup', handleEnd);
  
  handle.addEventListener('click', (e) => {
    if (e.detail === 1) {
      panel.classList.toggle('minimized');
      panel.classList.remove('expanded');
    }
  });
}

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
  map.on('click', handleMapClick);
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
    state.trike.startMarker.setLatLng(state.trike.endMarker.getLatLng());
    state.trike.endMarker.setLatLng(e.latlng);
    showToast('🔄 Route updated');
  }
  
  updateTrikeRoute();
}

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
      expandPanelOnMobile();
    });

    state.trike.routeControl.on('routingerror', () => {
      hideLoading();
      showToast('❌ Could not find route');
    });
  }
}

function expandPanelOnMobile() {
  if (window.innerWidth < 1024) {
    const panel = document.getElementById('control-panel');
    panel.classList.remove('minimized');
    panel.classList.add('expanded');
    showToast('📊 Fare calculated!', 1500);
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
  
  if (fareData.discountType === 'special') {
    fareBreakdown.style.display = 'flex';
    regularFareEl.textContent = `₱${fareData.baseFare}`;
    discountAmountEl.textContent = `-₱${fareData.discountAmount}`;
    discountLabelEl.textContent = 'Special Discount (20%)';
    fareFormulaEl.textContent = '₱12 base (4km) + ₱0.80/km (with discount)';
  } else {
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
  
  document.getElementById('search-start').value = '';
  document.getElementById('search-end').value = '';
  const startLbl = document.getElementById('start-display');
  const endLbl = document.getElementById('end-display');
  if (startLbl) { startLbl.textContent = 'Tap map or search'; startLbl.style.visibility = ''; }
  if (endLbl)   { endLbl.textContent   = 'Tap map or search'; endLbl.style.visibility   = ''; }
  document.getElementById('distance-display').textContent = '—';
  document.getElementById('fare-display').textContent = '₱—';
  document.getElementById('fare-breakdown').style.display = 'none';
  
  const panel = document.getElementById('control-panel');
  panel.classList.remove('expanded');
}

function showRoute(routeKey) {
  clearBusJeepRoute();
  
  const route = ROUTES[routeKey];
  if (!route) return;

  state.busjeep.selectedRoute = routeKey;

  route.stops.forEach((coords, idx) => {
    const marker = L.circleMarker(coords, {
      radius: 8,
      color: route.color === '#ffffff' ? '#000000' : '#ffffff',
      fillColor: route.color,
      fillOpacity: route.color === '#ffffff' ? 0.9 : 1,
      weight: 3
    }).addTo(state.map);
    
    marker.bindTooltip(route.labels[idx], {
      permanent: false,
      direction: 'top'
    });
    
    state.busjeep.markers.push(marker);
  });

  const waypoints = route.stops.map(([lat, lng]) => L.latLng(lat, lng));
  
  state.busjeep.routeControl = L.Routing.control({
    waypoints,
    lineOptions: {
      styles: [{
        color: route.color === '#ffffff' ? '#cccccc' : route.color,
        weight: 5,
        opacity: route.color === '#ffffff' ? 1 : 0.8
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

function switchMode(mode) {
  if (state.currentMode === mode) return;
  
  state.currentMode = mode;
  
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
  
  document.querySelectorAll('.panel-view').forEach(view => {
    view.classList.toggle('active', view.dataset.view === mode);
  });
  
  if (mode !== 'trike') {
    clearTrikeMarkers();
  }
  if (mode !== 'busjeep') {
    clearBusJeepRoute();
  }
  
  const panel = document.getElementById('control-panel');
  panel.classList.remove('expanded');
  
  setTimeout(() => state.map.invalidateSize(), 100);
}

function selectDiscount(discountType) {
  if (state.discountType === discountType) return;
  
  state.discountType = discountType;
  
  document.querySelectorAll('.discount-btn').forEach(btn => {
    const isActive = btn.dataset.discount === discountType;
    btn.classList.toggle('active', isActive);
  });
  
  if (state.trike.startMarker && state.trike.endMarker) {
    updateTrikeRoute();
  }
  
  const discountNames = {
    none: 'Regular fare',
    special: 'Special discount applied (20% off)'
  };
  showToast(discountNames[discountType] || 'Fare updated');
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
}

function initMatrixTabs() {
  document.querySelectorAll('.matrix-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cluster = tab.dataset.cluster;
      
      document.querySelectorAll('.matrix-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cluster === cluster);
      });
      
      document.querySelectorAll('.matrix-view').forEach(view => {
        view.classList.toggle('active', view.dataset.cluster === cluster);
      });
    });
  });
}

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

function initEventListeners() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchMode(btn.dataset.mode);
    });
  });

  document.querySelectorAll('.discount-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectDiscount(btn.dataset.discount);
    });
  });

  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }

  document.getElementById('reset-trike').addEventListener('click', () => {
    clearTrikeMarkers();
    showToast('🔄 Reset');
  });

  document.getElementById('use-location').addEventListener('click', useCurrentLocation);

  const searchStart = document.getElementById('search-start');
  const searchEnd = document.getElementById('search-end');

  // Hide floating label on focus; restore on blur only if input is empty
  [['search-start','start-display'],['search-end','end-display']].forEach(([inputId, labelId]) => {
    const inp = document.getElementById(inputId);
    const lbl = document.getElementById(labelId);
    if (!inp || !lbl) return;
    inp.addEventListener('focus', () => { lbl.style.visibility = 'hidden'; });
    inp.addEventListener('blur',  () => { if (!inp.value) lbl.style.visibility = ''; });
    inp.addEventListener('input', () => { lbl.style.visibility = inp.value ? 'hidden' : ''; });
  });

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

  document.querySelectorAll('.route-card').forEach(card => {
    card.addEventListener('click', () => {
      showRoute(card.dataset.route);
    });
  });

  document.getElementById('clear-route').addEventListener('click', () => {
    clearBusJeepRoute();
    showToast('Route cleared');
  });
}

function init() {
  initMap();
  initEventListeners();
  initPanelDrag();
  initMatrixTabs();
  
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'enabled') {
    document.body.classList.add('dark-mode');
  }
  
  setTimeout(() => {
    showToast('👋 Welcome to GenSan Fare!', 3000);
  }, 500);
}

document.addEventListener('DOMContentLoaded', init);

window.addEventListener('resize', () => {
  if (state.map) {
    state.map.invalidateSize();
  }
});
