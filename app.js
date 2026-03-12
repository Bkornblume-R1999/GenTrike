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

// ─── GENSAN KEY PLACES DATABASE ───────────────────────────────────────────────
const GENSAN_PLACES = [
  // Malls & Commercial
  { name: 'SM City General Santos', lat: 6.1152, lng: 125.1856, tags: ['sm', 'mall', 'shopping'] },
  { name: 'KCC Mall of GenSan', lat: 6.1172, lng: 125.1858, tags: ['kcc', 'mall', 'robinson'] },
  { name: 'Robinsons Place GenSan', lat: 6.1185, lng: 125.1902, tags: ['robinsons', 'mall'] },
  { name: 'Gaisano Mall General Santos', lat: 6.1090, lng: 125.1734, tags: ['gaisano', 'mall'] },
  // Hospitals
  { name: 'Mindanao Medical Center', lat: 6.1078, lng: 125.1774, tags: ['hospital', 'mmc', 'medical'] },
  { name: 'South Cotabato Provincial Hospital', lat: 6.1071, lng: 125.1700, tags: ['hospital', 'provincial'] },
  { name: 'Notre Dame Hospital', lat: 6.1041, lng: 125.1786, tags: ['hospital', 'notre dame'] },
  { name: 'General Santos Doctors Hospital', lat: 6.1101, lng: 125.1780, tags: ['hospital', 'doctors'] },
  // Schools / Universities
  { name: 'Notre Dame of Dadiangas University', lat: 6.1050, lng: 125.1786, tags: ['nddu', 'university', 'college', 'notre dame'] },
  { name: 'University of Southern Mindanao GenSan', lat: 6.1100, lng: 125.1701, tags: ['usm', 'university', 'college'] },
  { name: 'General Santos City National High School', lat: 6.1040, lng: 125.1762, tags: ['high school', 'nhs'] },
  { name: 'STI College General Santos', lat: 6.1087, lng: 125.1797, tags: ['sti', 'college'] },
  // Transport / Terminals
  { name: 'General Santos Airport (Francisco Bangoy)', lat: 6.0583, lng: 125.0959, tags: ['airport', 'bangoy', 'flights'] },
  { name: 'Bulaong Bus Terminal', lat: 6.1186, lng: 125.1610, tags: ['bus', 'terminal', 'bulaong'] },
  { name: 'Tambler Bus Terminal', lat: 6.0831, lng: 125.1353, tags: ['bus', 'terminal', 'tambler'] },
  { name: 'Husky Terminal', lat: 6.1131, lng: 125.1641, tags: ['terminal', 'husky'] },
  // Government
  { name: 'City Hall General Santos', lat: 6.1082, lng: 125.1728, tags: ['city hall', 'government'] },
  { name: 'Hall of Justice General Santos', lat: 6.1073, lng: 125.1742, tags: ['hall of justice', 'court', 'government'] },
  { name: 'GenSan City Police Station', lat: 6.1085, lng: 125.1731, tags: ['police', 'pnp', 'station'] },
  // Markets
  { name: 'GenSan Public Market (CBD)', lat: 6.1073, lng: 125.1715, tags: ['public market', 'palengke', 'cbd'] },
  { name: 'Lagao Public Market', lat: 6.1276, lng: 125.1963, tags: ['lagao', 'market', 'palengke'] },
  { name: 'Bawing Public Market', lat: 6.0852, lng: 125.1399, tags: ['bawing', 'market'] },
  // Parks & Landmarks
  { name: 'Oval Plaza General Santos', lat: 6.1082, lng: 125.1717, tags: ['oval', 'plaza', 'park', 'landmark'] },
  { name: "People's Park GenSan", lat: 6.1084, lng: 125.1718, tags: ['park', 'people'] },
  { name: 'GenSan Fish Port Complex', lat: 6.0954, lng: 125.1655, tags: ['fish port', 'port', 'fishing'] },
  { name: 'Manny Pacquiao Museum', lat: 6.1078, lng: 125.1720, tags: ['pacquiao', 'museum', 'landmark'] },
  // Barangays / Districts — GenSan
  { name: 'Barangay Lagao', lat: 6.1276, lng: 125.1963, tags: ['lagao', 'barangay'] },
  { name: 'Barangay Labangal', lat: 6.0987, lng: 125.1593, tags: ['labangal', 'barangay'] },
  { name: 'Barangay Calumpang', lat: 6.1048, lng: 125.1683, tags: ['calumpang', 'barangay'] },
  { name: 'Barangay Bula', lat: 6.1150, lng: 125.1600, tags: ['bula', 'barangay'] },
  { name: 'Barangay Dadiangas West', lat: 6.1087, lng: 125.1706, tags: ['dadiangas', 'west', 'barangay'] },
  { name: 'Barangay Tambler', lat: 6.0741, lng: 125.1252, tags: ['tambler', 'barangay'] },
  { name: 'Barangay Apopong', lat: 6.1247, lng: 125.1541, tags: ['apopong', 'barangay'] },
  { name: 'Barangay Buayan', lat: 6.1318, lng: 125.1724, tags: ['buayan', 'barangay'] },
  // Hotels
  { name: 'Hotel Heneral Santos', lat: 6.1076, lng: 125.1718, tags: ['hotel', 'heneral'] },
  { name: 'Ceresita Fine Hotel Labangal', lat: 6.0985, lng: 125.1569, tags: ['hotel', 'ceresita', 'labangal'] },
  { name: 'Phela Grande Convention Center', lat: 6.1143, lng: 125.1852, tags: ['hotel', 'phela', 'convention'] },
  // Roads / Key Junctions
  { name: 'Pioneer Avenue', lat: 6.1073, lng: 125.1757, tags: ['pioneer', 'avenue', 'street'] },
  { name: 'National Highway GenSan', lat: 6.1062, lng: 125.1654, tags: ['national highway', 'highway'] },
  { name: 'Jollibee Pioneer Avenue', lat: 6.1073, lng: 125.1767, tags: ['jollibee', 'pioneer'] },

  // ── SOUTH COTABATO MUNICIPALITIES ─────────────────────────────────────────
  // Koronadal City (provincial capital)
  { name: 'Koronadal City', lat: 6.5028, lng: 124.8469, tags: ['koronadal', 'marbel', 'capital', 'south cotabato'] },
  { name: 'Koronadal City Hall', lat: 6.5021, lng: 124.8461, tags: ['koronadal', 'city hall', 'government', 'marbel'] },
  { name: 'South Cotabato Capitol', lat: 6.5035, lng: 124.8477, tags: ['capitol', 'provincial', 'south cotabato', 'koronadal'] },
  { name: 'Notre Dame of Marbel University', lat: 6.4980, lng: 124.8443, tags: ['ndmu', 'marbel', 'university', 'koronadal'] },
  { name: 'Koronadal Public Market', lat: 6.5019, lng: 124.8450, tags: ['koronadal', 'market', 'palengke', 'marbel'] },
  { name: 'South Cotabato Provincial Hospital', lat: 6.5030, lng: 124.8500, tags: ['hospital', 'south cotabato', 'koronadal'] },
  // Tupi
  { name: 'Tupi, South Cotabato', lat: 6.3328, lng: 125.0253, tags: ['tupi', 'municipality', 'south cotabato'] },
  { name: 'Tupi Public Market', lat: 6.3325, lng: 125.0248, tags: ['tupi', 'market', 'palengke'] },
  { name: 'Tupi Municipal Hall', lat: 6.3330, lng: 125.0255, tags: ['tupi', 'municipal hall', 'government'] },
  // Polomolok
  { name: 'Polomolok, South Cotabato', lat: 6.2152, lng: 125.0731, tags: ['polomolok', 'municipality', 'south cotabato'] },
  { name: 'Polomolok Public Market', lat: 6.2148, lng: 125.0726, tags: ['polomolok', 'market'] },
  { name: 'Dole Philippines Polomolok', lat: 6.2180, lng: 125.0800, tags: ['dole', 'polomolok', 'pineapple', 'plantation'] },
  // Surallah
  { name: 'Surallah, South Cotabato', lat: 6.3642, lng: 124.7397, tags: ['surallah', 'municipality', 'south cotabato'] },
  { name: 'Surallah Public Market', lat: 6.3639, lng: 124.7393, tags: ['surallah', 'market', 'palengke'] },
  { name: 'Surallah Municipal Hall', lat: 6.3645, lng: 124.7400, tags: ['surallah', 'municipal hall', 'government'] },
  // Lake Sebu
  { name: 'Lake Sebu, South Cotabato', lat: 6.2630, lng: 124.6650, tags: ['lake sebu', 'municipality', 'south cotabato', 'tboli'] },
  { name: "Lake Sebu (Seloton)", lat: 6.2617, lng: 124.6633, tags: ['lake sebu', 'lake', 'tourism', 'tboli'] },
  { name: "Seven Falls Lake Sebu", lat: 6.2700, lng: 124.6580, tags: ['seven falls', 'lake sebu', 'falls', 'tourism', 'zipline'] },
  // T'boli
  { name: "T'boli, South Cotabato", lat: 6.1202, lng: 124.5818, tags: ['tboli', 'municipality', 'south cotabato'] },
  // Banga
  { name: 'Banga, South Cotabato', lat: 6.2997, lng: 124.7822, tags: ['banga', 'municipality', 'south cotabato'] },
  { name: 'Banga Municipal Hall', lat: 6.2994, lng: 124.7818, tags: ['banga', 'municipal hall', 'government'] },
  // Santo Niño
  { name: 'Santo Niño, South Cotabato', lat: 6.4294, lng: 124.8001, tags: ['santo nino', 'municipality', 'south cotabato'] },
  // Norala
  { name: 'Norala, South Cotabato', lat: 6.4650, lng: 124.6681, tags: ['norala', 'municipality', 'south cotabato'] },
  // Tantangan
  { name: 'Tantangan, South Cotabato', lat: 6.3892, lng: 124.9014, tags: ['tantangan', 'municipality', 'south cotabato'] },
  // Tampakan
  { name: 'Tampakan, South Cotabato', lat: 6.4667, lng: 124.9906, tags: ['tampakan', 'municipality', 'south cotabato'] },
  // Sto. Niño (different from above — Lambayong)
  { name: 'Lambayong (Moises Padilla), South Cotabato', lat: 6.5522, lng: 124.6506, tags: ['lambayong', 'moises padilla', 'municipality', 'south cotabato'] },
  // Key regional roads
  { name: 'Cotabato-General Santos Highway', lat: 6.3500, lng: 124.9500, tags: ['highway', 'national road', 'south cotabato'] },
];

// ─── SEARCH HISTORY ────────────────────────────────────────────────────────────
const MAX_HISTORY = 4;

function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem('geoGensan_searchHistory') || '[]');
  } catch { return []; }
}

function addToSearchHistory(place) {
  let history = getSearchHistory();
  // Remove duplicates
  history = history.filter(h => h.name !== place.name);
  history.unshift({ name: place.name, lat: place.lat, lng: place.lng });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem('geoGensan_searchHistory', JSON.stringify(history));
}

// ─── AUTOCOMPLETE ──────────────────────────────────────────────────────────────
function searchLocalPlaces(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = GENSAN_PLACES.map(place => {
    const nameLower = place.name.toLowerCase();
    let score = 0;
    if (nameLower.startsWith(q)) score = 100;
    else if (nameLower.includes(q)) score = 70;
    else if (place.tags.some(t => t.includes(q))) score = 50;
    else if (place.tags.some(t => q.includes(t))) score = 30;
    return { ...place, score };
  }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

  return scored.slice(0, 5);
}

// Track which input currently owns the open dropdown
let _activeAutocompleteInput = null;

function closeAllAutocompletes() {
  document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.remove());
  _activeAutocompleteInput = null;
}

// One global listener to close dropdowns when clicking outside any search field
document.addEventListener('click', (e) => {
  // If the click is inside an autocomplete dropdown or an input-content wrapper, keep it open
  if (e.target.closest('.autocomplete-dropdown') || e.target.closest('.input-content')) return;
  closeAllAutocompletes();
}, true);

function createAutocompleteDropdown(inputEl, onSelect) {
  // Close any dropdown belonging to the OTHER input first
  document.querySelectorAll('.autocomplete-dropdown').forEach(d => {
    // Only remove dropdowns not belonging to this input's wrapper
    const wrapper = inputEl.closest('.input-content') || inputEl.parentElement;
    if (!wrapper.contains(d)) d.remove();
  });

  const wrapper = inputEl.closest('.input-content') || inputEl.parentElement;

  // Remove existing dropdown for this field
  const old = wrapper.querySelector('.autocomplete-dropdown');
  if (old) old.remove();

  _activeAutocompleteInput = inputEl;

  const query = inputEl.value.trim();
  const history = getSearchHistory();

  let results = [];
  if (!query) {
    // Show recent searches only (up to MAX_HISTORY)
    results = history.map(h => ({ ...h, isHistory: true }));
  } else {
    results = searchLocalPlaces(query);
  }

  if (!results.length) return;

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';

  if (!query && results.length) {
    const header = document.createElement('div');
    header.className = 'autocomplete-header';
    header.textContent = '🕐 Recent Searches';
    dropdown.appendChild(header);
  }

  results.forEach(place => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.innerHTML = `
      <span class="autocomplete-icon">${place.isHistory ? '🕐' : '📍'}</span>
      <span class="autocomplete-name">${place.name}</span>
    `;
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onSelect(place);
      closeAllAutocompletes();
    });
    // Touch support
    item.addEventListener('touchend', (e) => {
      e.preventDefault();
      onSelect(place);
      closeAllAutocompletes();
    });
    dropdown.appendChild(item);
  });

  wrapper.style.position = 'relative';
  wrapper.appendChild(dropdown);
}

function removeAutocomplete(inputEl) {
  const wrapper = inputEl.closest('.input-content') || inputEl.parentElement;
  const dd = wrapper.querySelector('.autocomplete-dropdown');
  if (dd) dd.remove();
  if (_activeAutocompleteInput === inputEl) _activeAutocompleteInput = null;
}

async function reverseGeocode(latlng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}&zoom=18&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const addr = data.address || {};
    
    // Try to get a human-friendly name from display_name parts
    const name = data.name || '';
    const road = addr.road || addr.pedestrian || addr.footway || '';
    const suburb = addr.suburb || addr.village || addr.neighbourhood || addr.quarter || '';
    const district = addr.city_district || addr.district || '';
    
    const parts = [];
    if (name && name !== road) parts.push(name);
    if (road) parts.push(road);
    if (suburb) parts.push(suburb);
    else if (district) parts.push(district);
    
    if (parts.length > 0) return parts.slice(0, 2).join(', ');
    
    // Fall back to display_name first two segments
    if (data.display_name) {
      const segments = data.display_name.split(',').map(s => s.trim()).filter(Boolean);
      return segments.slice(0, 2).join(', ');
    }
    
    return formatLatLng(latlng);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return formatLatLng(latlng);
  }
}

// South Cotabato / Region XII bounding box
// Covers General Santos, Koronadal, Surallah, Tupi, Polomolok, Tampakan, T'boli, Lake Sebu, etc.
// approx: lon 124.55–125.45, lat 5.85–6.55
const REGION12_VIEWBOX = '124.55,5.85,125.45,6.55';

// Check if a Nominatim result is within Region XII / South Cotabato area
function isWithinRegion12(lat, lng) {
  return lat >= 5.85 && lat <= 6.55 && lng >= 124.55 && lng <= 125.45;
}

async function geocodeWithNominatim(query) {
  try {
    // Attempt 1: query + South Cotabato context, bounded to region
    const url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', South Cotabato, Philippines')}&viewbox=${REGION12_VIEWBOX}&bounded=1&limit=5&addressdetails=1&namedetails=1`;
    const res1 = await fetch(url1, { headers: { 'Accept-Language': 'en' } });
    const data1 = await res1.json();
    const valid1 = data1.filter(r => isWithinRegion12(parseFloat(r.lat), parseFloat(r.lon)));
    if (valid1.length > 0) {
      return { lat: parseFloat(valid1[0].lat), lng: parseFloat(valid1[0].lon), name: valid1[0].display_name.split(',')[0] };
    }

    // Attempt 2: query alone, still bounded to region
    const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${REGION12_VIEWBOX}&bounded=1&limit=5&addressdetails=1`;
    const res2 = await fetch(url2, { headers: { 'Accept-Language': 'en' } });
    const data2 = await res2.json();
    const valid2 = data2.filter(r => isWithinRegion12(parseFloat(r.lat), parseFloat(r.lon)));
    if (valid2.length > 0) {
      return { lat: parseFloat(valid2[0].lat), lng: parseFloat(valid2[0].lon), name: valid2[0].display_name.split(',')[0] };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function geocode(query) {
  // First: check local places database
  const localResults = searchLocalPlaces(query);
  if (localResults.length > 0 && localResults[0].score >= 70) {
    const place = localResults[0];
    addToSearchHistory(place);
    return L.latLng(place.lat, place.lng);
  }
  
  // Then: try Nominatim
  const result = await geocodeWithNominatim(query);
  if (result) {
    addToSearchHistory({ name: result.name || query, lat: result.lat, lng: result.lng });
    return L.latLng(result.lat, result.lng);
  }
  
  showToast('❌ Location not found');
  return null;
}

// ─── FIREBASE + IMGBB CONFIG ───────────────────────────────────────────────────
const FIREBASE_DB_URL = 'https://gentrike-75c7c-default-rtdb.asia-southeast1.firebasedatabase.app';
const IMGBB_API_KEY   = '7416acef89ebb625100b3bf7a580770a';
const LAST_REPORT_KEY = 'geoGensan_lastReportTime';
const MAX_REPORTS     = 100;
const COOLDOWN_MS     = 2 * 60 * 60 * 1000; // 2 hours

// ── ImgBB upload ──────────────────────────────────────────────────────────────
async function uploadToImgBB(base64DataUrl) {
  // Strip the "data:image/...;base64," prefix
  const base64 = base64DataUrl.split(',')[1];
  const formData = new FormData();
  formData.append('image', base64);
  formData.append('key', IMGBB_API_KEY);

  const res = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (data.success) return data.data.url;
  throw new Error('ImgBB upload failed: ' + (data.error?.message || 'unknown'));
}

// ── Firebase Realtime Database helpers ───────────────────────────────────────
async function fbPush(path, value) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });
  if (!res.ok) throw new Error('Firebase write failed: ' + res.status);
  return res.json(); // returns { name: "-generatedKey" }
}

async function fbGetAll(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
  if (!res.ok) throw new Error('Firebase read failed: ' + res.status);
  const data = await res.json();
  if (!data) return [];
  // Convert object of objects → sorted array (newest first by timestamp)
  return Object.entries(data)
    .map(([key, val]) => ({ _key: key, ...val }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

async function fbDelete(path) {
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Firebase delete failed: ' + res.status);
}

async function fbCount(path) {
  // Use shallow=true to just get keys without full data (faster)
  const res = await fetch(`${FIREBASE_DB_URL}/${path}.json?shallow=true`);
  if (!res.ok) return 0;
  const data = await res.json();
  return data ? Object.keys(data).length : 0;
}

// ── Enforce 100-report cap (delete oldest if over limit) ─────────────────────
async function enforceReportCap() {
  const res = await fetch(`${FIREBASE_DB_URL}/reports.json`);
  if (!res.ok) return;
  const data = await res.json();
  if (!data) return;

  const entries = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp);
  if (entries.length > MAX_REPORTS) {
    const toDelete = entries.slice(0, entries.length - MAX_REPORTS);
    await Promise.all(toDelete.map(([key]) => fbDelete(`reports/${key}`)));
  }
}

// ─── COMPLAINT SYSTEM ─────────────────────────────────────────────────────────
function canSubmitReport() {
  const last = parseInt(localStorage.getItem(LAST_REPORT_KEY) || '0');
  return Date.now() - last >= COOLDOWN_MS;
}

function getRemainingCooldown() {
  const last = parseInt(localStorage.getItem(LAST_REPORT_KEY) || '0');
  const remaining = COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? remaining : 0;
}

function formatCooldown(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

let cooldownInterval = null;
let pendingImageData = null; // holds base64 data URL of selected image
let pendingImageFile = null; // holds the original File object

function initComplaintModal() {
  const openBtn      = document.getElementById('open-complaint');
  const modal        = document.getElementById('complaint-modal');
  const closeBtn     = document.getElementById('close-complaint');
  const submitBtn    = document.getElementById('submit-complaint');
  const descTextarea = document.getElementById('complaint-desc');
  const descCount    = document.getElementById('desc-count');

  // Image drop zone elements
  const dropZone   = document.getElementById('image-drop-zone');
  const fileInput  = document.getElementById('complaint-image-input');
  const dropIdle   = document.getElementById('drop-zone-idle');
  const dropPreview = document.getElementById('drop-zone-preview');
  const imgPreview = document.getElementById('complaint-img-preview');
  const removeBtn  = document.getElementById('drop-remove-img');

  function resetImageState() {
    pendingImageData = null;
    pendingImageFile = null;
    if (dropIdle)    dropIdle.style.display = 'flex';
    if (dropPreview) dropPreview.style.display = 'none';
    if (imgPreview)  imgPreview.src = '';
    if (fileInput)   fileInput.value = '';
  }

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('❌ Please select a valid image file'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ Image must be under 5MB'); return;
    }
    pendingImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingImageData = e.target.result;
      imgPreview.src = pendingImageData;
      dropIdle.style.display = 'none';
      dropPreview.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  }

  if (dropZone) {
    dropIdle.addEventListener('click', () => fileInput && fileInput.click());
    fileInput && fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageFile(e.target.files[0]);
    });
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault(); dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault(); dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); resetImageState(); });
  }

  openBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
    updateCooldownUI();
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    clearInterval(cooldownInterval);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) { modal.style.display = 'none'; clearInterval(cooldownInterval); }
  });

  descTextarea.addEventListener('input', () => {
    descCount.textContent = descTextarea.value.length;
  });

  submitBtn.addEventListener('click', async () => {
    const plate = document.getElementById('complaint-plate').value.trim();
    const type  = document.getElementById('complaint-type').value;
    const desc  = document.getElementById('complaint-desc').value.trim();

    if (!plate && !pendingImageData) { showToast('❌ Enter a plate number or attach a photo'); return; }
    if (!type)  { showToast('❌ Please select a report type'); return; }
    if (!desc)  { showToast('❌ Please enter a description'); return; }
    if (!canSubmitReport()) { showToast('⏳ Please wait before submitting again'); return; }

    // Disable button and show uploading state
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Submitting...';

    try {
      // 1. Upload image to ImgBB if one was attached
      let imageUrl = null;
      if (pendingImageData) {
        showToast('📤 Uploading photo...', 10000);
        imageUrl = await uploadToImgBB(pendingImageData);
      }

      // 2. Push report to Firebase
      const report = {
        plate: plate.toUpperCase() || '(photo only)',
        type,
        description: desc,
        imageUrl: imageUrl || null,
        timestamp: Date.now(),
        date: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
      };
      await fbPush('reports', report);

      // 3. Enforce 100-report cap in background
      enforceReportCap();

      // 4. Record cooldown locally
      localStorage.setItem(LAST_REPORT_KEY, Date.now().toString());

      // 5. Reset form
      document.getElementById('complaint-plate').value = '';
      document.getElementById('complaint-type').value = '';
      document.getElementById('complaint-desc').value = '';
      descCount.textContent = '0';
      resetImageState();

      modal.style.display = 'none';
      showToast('✅ Report submitted!', 3000);
      updateCooldownUI();

    } catch (err) {
      console.error('Submit error:', err);
      showToast('❌ Submission failed. Check your connection.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Report';
    }
  });
}

function updateCooldownUI() {
  const notice   = document.getElementById('complaint-cooldown-notice');
  const timerEl  = document.getElementById('cooldown-timer');
  const submitBtn = document.getElementById('submit-complaint');

  clearInterval(cooldownInterval);

  if (!canSubmitReport()) {
    notice.style.display = 'flex';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';

    const tick = () => {
      const rem = getRemainingCooldown();
      if (rem <= 0) {
        clearInterval(cooldownInterval);
        notice.style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        return;
      }
      timerEl.textContent = formatCooldown(rem);
    };
    tick();
    cooldownInterval = setInterval(tick, 1000);
  } else {
    notice.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
}

// ─── ADMIN PANEL ───────────────────────────────────────────────────────────────
// Admin panel is now a standalone page (admin.html) with its own login gate.
function initAdminPanel() {
  // No-op: admin login is handled entirely in admin.html
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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
    startEl.classList.remove('is-placeholder');
    startEl.style.display = '';
  }

  if (endMarker) {
    const addr = await reverseGeocode(endMarker.getLatLng());
    endEl.textContent = addr;
    endEl.classList.remove('is-placeholder');
    endEl.style.display = '';
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
  const startInp = document.getElementById('search-start');
  const endInp   = document.getElementById('search-end');
  if (startLbl) { startLbl.textContent = 'Tap map or search'; startLbl.classList.add('is-placeholder'); startLbl.style.display = ''; }
  if (endLbl)   { endLbl.textContent   = 'Tap map or search'; endLbl.classList.add('is-placeholder');   endLbl.style.display   = ''; }
  if (startInp) startInp.classList.remove('is-active');
  if (endInp)   endInp.classList.remove('is-active');
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

  // Zoom in on the route bounds
  const bounds = L.latLngBounds(waypoints);
  state.map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2 });

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

  // Toggle input/label: click label -> show input; blur -> hide input, show label with address
  function setupSearchField(inputId, labelId) {
    const inp = document.getElementById(inputId);
    const lbl = document.getElementById(labelId);
    if (!inp || !lbl) return;
    // Clicking the label activates the input
    lbl.addEventListener('click', () => {
      lbl.style.display = 'none';
      inp.classList.add('is-active');
      inp.focus();
      inp.value = '';
    });
    // Also activate when clicking the wrapper area
    inp.closest && inp.closest('.input-wrapper') && inp.closest('.input-wrapper').addEventListener('click', () => {
      lbl.style.display = 'none';
      inp.classList.add('is-active');
      inp.focus();
    });
    // On blur: hide input, show label with whatever address is set
    inp.addEventListener('blur', () => {
      inp.classList.remove('is-active');
      lbl.style.display = '';
      inp.value = '';
    });
  }
  setupSearchField('search-start', 'start-display');
  setupSearchField('search-end', 'end-display');

  // ── Helper: place-selection callbacks ───────────────────────────────────────
  function selectStartPlace(place) {
    const latlng = L.latLng(place.lat, place.lng);
    addToSearchHistory(place);
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
    searchStart.blur();
  }

  function selectEndPlace(place) {
    const latlng = L.latLng(place.lat, place.lng);
    addToSearchHistory(place);
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
    searchEnd.blur();
  }

  // ── Start field ──────────────────────────────────────────────────────────────
  searchStart.addEventListener('focus', () => {
    // Close end-field dropdown before opening start's
    removeAutocomplete(searchEnd);
    createAutocompleteDropdown(searchStart, selectStartPlace);
  });

  searchStart.addEventListener('input', () => {
    createAutocompleteDropdown(searchStart, selectStartPlace);
  });

  searchStart.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    const query = e.target.value.trim();
    if (!query) return;
    closeAllAutocompletes();
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

  // ── End field ────────────────────────────────────────────────────────────────
  searchEnd.addEventListener('focus', () => {
    // Close start-field dropdown before opening end's
    removeAutocomplete(searchStart);
    createAutocompleteDropdown(searchEnd, selectEndPlace);
  });

  searchEnd.addEventListener('input', () => {
    createAutocompleteDropdown(searchEnd, selectEndPlace);
  });

  searchEnd.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    const query = e.target.value.trim();
    if (!query) return;
    closeAllAutocompletes();
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
      document.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      showRoute(card.dataset.route);
    });
  });

  document.getElementById('clear-route').addEventListener('click', () => {
    clearBusJeepRoute();
    document.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
    showToast('Route cleared');
  });
}

function init() {
  initMap();
  // Mark initial labels as placeholders so they render in grey
  ['start-display','end-display'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('is-placeholder');
  });
  initEventListeners();
  initPanelDrag();
  initMatrixTabs();
  initComplaintModal();
  initAdminPanel();
  
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
