import { Api } from './api.js';

const state = {
  map: null,
  startMarker: null,
  endMarker: null,
  routeControl: null,
  activeTab: 'trike',
  busRouteControl: null,
  busMarkers: []
};

// Routes
const routes = {
  'uhaw': {
    name: 'Uhaw Route',
    color: 'green',
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
      "Airport","Kanto uhaw station","Jollibee","Gensan mray logistics & transport","711 bulaong","Husky Terminal","RD Plaza","Pioneer Avenue","Palengke","SM","KCC","Robinsons"
    ]
  },
  'kanto-uhaw': {
    name: 'Kanto Uhaw Route',
    color: 'yellow',
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
      "Lado Transco Terminal","Gensan National High","Western Oil","Pioneer AVE","Magsaysay UNITOP","KCC","Brigada Pharmacy","Lagao public Market"
    ]
  }
};

function initMap() {
  const map = L.map('map').setView([6.116, 125.171], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  state.map = map;

  map.on('click', e => {
    if (state.activeTab !== 'trike') return;

    if (!state.startMarker) {
      state.startMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
      state.startMarker.on('dragend', updateTrikeUI);
    } else if (!state.endMarker) {
      state.endMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
      state.endMarker.on('dragend', updateTrikeUI);
    } else {
      state.startMarker.setLatLng(state.endMarker.getLatLng());
      state.endMarker.setLatLng(e.latlng);
    }
    updateTrikeUI();
  });
}

function fmtLatLng(ll) {
  return `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`;
}

async function reverseGeocode(latlng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const addr = data.address || {};
    if (addr.road && addr.suburb) return `${addr.road}, ${addr.suburb}`;
    if (addr.road) return addr.road;
    if (addr.suburb) return addr.suburb;
    return data.display_name || fmtLatLng(latlng);
  } catch {
    return fmtLatLng(latlng);
  }
}

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.length > 0) {
      return L.latLng(data[0].lat, data[0].lon);
    }
    return null;
  } catch {
    return null;
  }
}

async function updateTrikeUI() {
  const startEl = document.getElementById('start-coord');
  const endEl = document.getElementById('end-coord');
  const distEl = document.getElementById('distance');
  const fareEl = document.getElementById('fare');

  if (!state.startMarker || !state.endMarker) {
    startEl.textContent = state.startMarker ? fmtLatLng(state.startMarker.getLatLng()) : 'Tap map or search';
    endEl.textContent = state.endMarker ? fmtLatLng(state.endMarker.getLatLng()) : 'Tap map or search';
    distEl.textContent = '—';
    fareEl.textContent = '—';
    if (state.routeControl) {
      state.routeControl.remove();
      state.routeControl = null;
    }
    return;
  }

  const a = state.startMarker.getLatLng();
  const b = state.endMarker.getLatLng();

  startEl.textContent = 'Loading...';
  endEl.textContent = 'Loading...';

  const [startName, endName] = await Promise.all([
    reverseGeocode(a),
    reverseGeocode(b)
  ]);

  startEl.textContent = startName;
  endEl.textContent = endName;

  if (state.routeControl) {
    state.routeControl.remove();
    state.routeControl = null;
  }

  state.routeControl = L.Routing.control({
    waypoints: [a, b],
    lineOptions: { styles: [{ color: '#0ea5e9', weight: 4 }] },
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    createMarker: () => null,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: false,
    show: false
  }).addTo(state.map);

  state.routeControl.on('routesfound', async e => {
    const route = e.routes[0];
    const distanceKm = route.summary.totalDistance / 1000;
    distEl.textContent = distanceKm.toFixed(3);

    try {
      const { fare } = await Api.computeFare({ mode: 'trike', distanceKm });
      fareEl.textContent = `₱${fare}`;
    } catch {
      fareEl.textContent = 'Error';
    }
  });

  state.routeControl.on('routingerror', () => {
    distEl.textContent = '—';
    fareEl.textContent = 'Error';
  });
}

function updateBusJeepUI() {
  const routeKey = document.getElementById('route-picker').value;
  const fareEl = document.getElementById('bus-fare');

  clearBusJeepUI();

  if (!routeKey) {
    fareEl.textContent = '—';
    return;
  }

  const route = routes[routeKey];
  const waypoints = route.stops.map(([lat, lng]) => L.latLng(lat, lng));

  route.stops.forEach((coords, idx) => {
    const marker = L.circleMarker(coords, {
      radius: 6,
      color: route.color,
      fillColor: route.color,
      fillOpacity: 0.8
    }).addTo(state.map).bindTooltip(route.labels[idx]);
    state.busMarkers.push(marker);
  });

  state.busRouteControl = L.Routing.control({
    waypoints,
    lineOptions: { styles: [{ color: route.color, weight: 4 }] },
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    createMarker: () => null,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false
  }).addTo(state.map);

  fareEl.textContent = '₱20';
}

// Set current location as start
function setCurrentLocationAsStart() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
            const { latitude, longitude } = pos.coords;
      const latlng = L.latLng(latitude, longitude);

      if (state.startMarker) {
        state.startMarker.setLatLng(latlng);
      } else {
        state.startMarker = L.marker(latlng, { draggable: true }).addTo(state.map);
        state.startMarker.on('dragend', updateTrikeUI);
      }

      state.map.setView(latlng, 15);
      updateTrikeUI();
    },
    err => {
      alert("Unable to retrieve your location: " + err.message);
    }
  );
}

function initControls() {
  document.getElementById('reset-trike').addEventListener('click', () => {
    clearTrikeUI();
    updateTrikeUI();
  });

  document.getElementById('use-location').addEventListener('click', setCurrentLocationAsStart);

  // Search bar for Point A
  document.getElementById('search-start').addEventListener('change', async e => {
    const query = e.target.value.trim();
    if (!query) return;
    const latlng = await geocode(query);
    if (latlng) {
      if (state.startMarker) {
        state.startMarker.setLatLng(latlng);
      } else {
        state.startMarker = L.marker(latlng, { draggable: true }).addTo(state.map);
        state.startMarker.on('dragend', updateTrikeUI);
      }
      state.map.setView(latlng, 15);
      updateTrikeUI();
    }
  });

  // Search bar for Point B
  document.getElementById('search-end').addEventListener('change', async e => {
    const query = e.target.value.trim();
    if (!query) return;
    const latlng = await geocode(query);
    if (latlng) {
      if (state.endMarker) {
        state.endMarker.setLatLng(latlng);
      } else {
        state.endMarker = L.marker(latlng, { draggable: true }).addTo(state.map);
        state.endMarker.on('dragend', updateTrikeUI);
      }
      state.map.setView(latlng, 15);
      updateTrikeUI();
    }
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const trikePanel = document.getElementById('panel-trike');
  const aboutPanel = document.getElementById('panel-about');
  const busJeepPanel = document.getElementById('panel-busjeep');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;

      trikePanel.open = false;
      aboutPanel.open = false;
      busJeepPanel.open = false;

      clearTrikeUI();
      clearBusJeepUI();

      if (state.activeTab === 'trike') {
        trikePanel.open = true;
        updateTrikeUI();
      } else if (state.activeTab === 'busjeep') {
        busJeepPanel.open = true;
        updateBusJeepUI();
      } else if (state.activeTab === 'about') {
        aboutPanel.open = true;
      }
    });
  });
}

function boot() {
  initMap();
  initControls();
  initTabs();

  const routePicker = document.getElementById('route-picker');
  if (routePicker) {
    routePicker.addEventListener('change', updateBusJeepUI);
  }
}

document.addEventListener('DOMContentLoaded', boot);

function clearTrikeUI() {
  if (state.startMarker) { state.startMarker.remove(); state.startMarker = null; }
  if (state.endMarker) { state.endMarker.remove(); state.endMarker = null; }
  if (state.routeControl) { state.routeControl.remove(); state.routeControl = null; }
}

function clearBusJeepUI() {
  if (state.busRouteControl) { state.busRouteControl.remove(); state.busRouteControl = null; }
  state.busMarkers.forEach(m => m.remove());
  state.busMarkers = [];
}