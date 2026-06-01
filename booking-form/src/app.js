/**
 * ExampleIQ Booking Form – app.js
 * - Google Maps Places autocomplete
 * - Distance + travel time via Distance Matrix API
 * - Phone number lookup (localStorage mock DB)
 * - Form validation
 * - Mock API submission
 */

/* ─── Simulated phone contact DB ──────────────────────────────── */
const KNOWN_CONTACTS = {
  '7741234567': { firstName: 'Alex', lastName: 'Rivera', email: 'alex@example.com' },
  '6175550100': { firstName: 'Jordan', lastName: 'Smith', email: 'jordan@example.com' },
  '5555551234': { firstName: 'Morgan', lastName: 'Lee', email: 'morgan@example.com' },
};

/* ─── State ───────────────────────────────────────────────────── */
let pickupPlaceId = null;
let dropoffPlaceId = null;
let stopCount = 0;
let mapsReady = false;

/* ─── Helpers ──────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function showError(name, msg) {
  const el = document.querySelector(`[data-for="${name}"]`);
  const inp = document.querySelector(`[name="${name}"], #${name}`);
  if (el) el.textContent = msg;
  if (inp) inp.classList.toggle('error', !!msg);
}
function clearErrors() {
  $$('.error-msg').forEach(el => el.textContent = '');
  $$('.error').forEach(el => el.classList.remove('error'));
}

function digitsOnly(str) {
  return str.replace(/\D/g, '');
}

/* ─── Tabs ────────────────────────────────────────────────────── */
$$('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
  });
});

/* ─── Location type toggles ───────────────────────────────────── */
$$('.loc-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const group = $$(`.loc-btn[data-target="${target}"]`);
    group.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Optionally swap placeholder text for airport
    const inputId = target === 'pickup' ? 'pickupLocation' : 'dropoffLocation';
    const input = document.getElementById(inputId);
    if (btn.dataset.type === 'airport') {
      input.placeholder = 'Enter airport code or name';
    } else {
      input.placeholder = target === 'pickup' ? 'Enter pickup address' : 'Enter drop-off address';
    }
  });
});

/* ─── Add / remove stops ──────────────────────────────────────── */
document.getElementById('addStopBtn').addEventListener('click', addStop);

function addStop() {
  stopCount++;
  const id = `stop_${stopCount}`;
  const container = document.getElementById('stopsContainer');

  const row = document.createElement('div');
  row.className = 'stop-row';
  row.dataset.stopId = id;
  row.innerHTML = `
    <div class="field">
      <label class="field-label" for="${id}">Stop ${stopCount}</label>
      <div class="input-icon-wrap">
        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <input type="text" id="${id}" name="${id}" class="input autocomplete-input" placeholder="Enter stop address" autocomplete="off"/>
      </div>
      <ul class="autocomplete-list" id="${id}_suggestions"></ul>
    </div>
    <button type="button" class="remove-stop-btn" data-remove="${id}" aria-label="Remove stop">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>`;
  container.appendChild(row);

  // Remove button
  row.querySelector(`[data-remove="${id}"]`).addEventListener('click', () => row.remove());

  // Autocomplete for the new stop input
  if (mapsReady) {
    initAutocomplete(document.getElementById(id), document.getElementById(`${id}_suggestions`), null, null);
  }
}

/* ─── Google Maps Autocomplete ────────────────────────────────── */
window.initMaps = function () {
  mapsReady = true;

  initAutocomplete(
    document.getElementById('pickupLocation'),
    document.getElementById('pickupSuggestions'),
    (placeId) => { pickupPlaceId = placeId; maybeComputeRoute(); },
    null
  );

  initAutocomplete(
    document.getElementById('dropoffLocation'),
    document.getElementById('dropoffSuggestions'),
    (placeId) => { dropoffPlaceId = placeId; maybeComputeRoute(); },
    null
  );
};

function initAutocomplete(input, list, onPickup, onDropoff) {
  const service = new google.maps.places.AutocompleteService();
  const sessionToken = new google.maps.places.AutocompleteSessionToken();

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (!val) { closeList(list); return; }

    service.getPlacePredictions(
      { input: val, sessionToken },
      (predictions, status) => {
        list.innerHTML = '';
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          closeList(list); return;
        }
        predictions.slice(0, 5).forEach(pred => {
          const li = document.createElement('li');
          li.textContent = pred.description;
          li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            input.value = pred.description;
            if (onPickup) onPickup(pred.place_id);
            if (onDropoff) onDropoff(pred.place_id);
            // If it's a stop input, just store placeId on the element
            input.dataset.placeId = pred.place_id;
            closeList(list);
          });
          list.appendChild(li);
        });
        list.classList.add('open');
      }
    );
  });

  input.addEventListener('blur', () => setTimeout(() => closeList(list), 150));
}

function closeList(list) {
  list.classList.remove('open');
}

/* ─── Distance Matrix ─────────────────────────────────────────── */
function maybeComputeRoute() {
  if (!pickupPlaceId || !dropoffPlaceId || !mapsReady) return;

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix({
    origins: [{ placeId: pickupPlaceId }],
    destinations: [{ placeId: dropoffPlaceId }],
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.IMPERIAL,
  }, (response, status) => {
    if (status !== 'OK') return;
    const element = response.rows[0].elements[0];
    if (element.status !== 'OK') return;

    const routeInfo = document.getElementById('routeInfo');
    const distChip = document.getElementById('distanceChip');
    const durChip = document.getElementById('durationChip');

    distChip.textContent = `📍 ${element.distance.text}`;
    durChip.textContent = `🕒 ${element.duration.text}`;
    routeInfo.style.display = 'flex';
  });
}

/* ─── Phone lookup ────────────────────────────────────────────── */
const phoneInput = document.getElementById('phone');
const extraFields = document.getElementById('extraContactFields');
const contactStatus = document.getElementById('contactStatus');

phoneInput.addEventListener('blur', () => {
  const digits = digitsOnly(phoneInput.value);
  if (digits.length < 10) return;

  const key = digits.slice(-10); // last 10 digits
  const contact = KNOWN_CONTACTS[key];

  if (contact) {
    contactStatus.className = 'contact-status known';
    contactStatus.textContent = `👋 Welcome back, ${contact.firstName}!`;
    contactStatus.style.display = 'block';
    extraFields.style.display = 'none';
    // Pre-fill hidden values for submission
    document.getElementById('firstName').value = contact.firstName;
    document.getElementById('lastName').value = contact.lastName;
    document.getElementById('email').value = contact.email;
    phoneInput.dataset.knownContact = JSON.stringify(contact);
  } else {
    contactStatus.className = 'contact-status unknown';
    contactStatus.textContent = '';
    contactStatus.style.display = 'none';
    extraFields.style.display = 'block';
    phoneInput.dataset.knownContact = '';
  }
});

phoneInput.addEventListener('input', () => {
  if (digitsOnly(phoneInput.value).length < 10) {
    extraFields.style.display = 'none';
    contactStatus.style.display = 'none';
  }
});

/* ─── Validation ──────────────────────────────────────────────── */
function validate() {
  clearErrors();
  let valid = true;

  const pickupDate = document.getElementById('pickupDate').value;
  const pickupTime = document.getElementById('pickupTime').value;
  const pickupLoc  = document.getElementById('pickupLocation').value.trim();
  const dropoffLoc = document.getElementById('dropoffLocation').value.trim();
  const phone      = digitsOnly(phoneInput.value);
  const passengers = document.getElementById('passengers').value;
  const isNewContact = extraFields.style.display !== 'none';

  if (!pickupDate) { showError('pickupDate', 'Please select a pickup date.'); valid = false; }
  else {
    const selected = new Date(pickupDate);
    const today = new Date(); today.setHours(0,0,0,0);
    if (selected < today) { showError('pickupDate', 'Date cannot be in the past.'); valid = false; }
  }

  if (!pickupTime) { showError('pickupTime', 'Please select a pickup time.'); valid = false; }
  if (!pickupLoc) { showError('pickupLocation', 'Pickup location is required.'); valid = false; }
  if (!dropoffLoc) { showError('dropoffLocation', 'Drop-off location is required.'); valid = false; }

  if (phone.length < 10) { showError('phone', 'Enter a valid 10-digit phone number.'); valid = false; }

  if (isNewContact) {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const email     = document.getElementById('email').value.trim();
    if (!firstName) { showError('firstName', 'First name is required.'); valid = false; }
    if (!lastName)  { showError('lastName', 'Last name is required.'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('email', 'Enter a valid email address.'); valid = false;
    }
  }

  if (!passengers || Number(passengers) < 1) {
    showError('passengers', 'At least 1 passenger is required.'); valid = false;
  }

  return valid;
}

/* ─── Mock API submission ─────────────────────────────────────── */
async function submitToAPI(payload) {
  // Mock endpoint — replace with real URL
  const ENDPOINT = 'https://jsonplaceholder.typicode.com/posts';

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return await response.json();
}

/* ─── Form submit ─────────────────────────────────────────────── */
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const btn = document.getElementById('submitBtn');
  const btnText = btn.querySelector('.btn-text');
  const btnSpinner = btn.querySelector('.btn-spinner');

  btn.disabled = true;
  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-flex';

  // Collect stops
  const stops = $$('.stop-row').map(row => {
    const inp = row.querySelector('.autocomplete-input');
    return { address: inp?.value || '', placeId: inp?.dataset.placeId || '' };
  });

  const payload = {
    tripType: document.querySelector('.tab.active')?.dataset.tab || 'oneway',
    pickup: {
      date: document.getElementById('pickupDate').value,
      time: document.getElementById('pickupTime').value,
      address: document.getElementById('pickupLocation').value,
      placeId: pickupPlaceId,
    },
    stops,
    dropoff: {
      address: document.getElementById('dropoffLocation').value,
      placeId: dropoffPlaceId,
    },
    contact: {
      phone: document.getElementById('phone').value,
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
    },
    passengers: Number(document.getElementById('passengers').value),
    submittedAt: new Date().toISOString(),
  };

  try {
    const result = await submitToAPI(payload);
    console.log('Booking submitted:', result);

    // Save new contact to mock DB (localStorage)
    const digits = digitsOnly(payload.contact.phone).slice(-10);
    if (extraFields.style.display !== 'none') {
      KNOWN_CONTACTS[digits] = {
        firstName: payload.contact.firstName,
        lastName: payload.contact.lastName,
        email: payload.contact.email,
      };
    }

    // Show success
    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';

  } catch (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
  }
});

/* ─── Set default date to today ───────────────────────────────── */
(function setDefaultDate() {
  const dateInput = document.getElementById('pickupDate');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;

  // Default time to next hour
  const timeInput = document.getElementById('pickupTime');
  const nextHour = (today.getHours() + 1) % 24;
  timeInput.value = `${String(nextHour).padStart(2, '0')}:00`;
})();
