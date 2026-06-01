# ExampleIQ Booking Form

A responsive ride-booking form that matches the ExampleIQ design spec, built with vanilla HTML/CSS/JS and the Google Maps API.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Trip type tabs** | One-way / Hourly toggle |
| **Pickup & Drop-off** | Location or Airport mode |
| **Add stops** | Dynamically add/remove intermediate stops |
| **Google Maps Autocomplete** | Places autocomplete on all address inputs |
| **Distance & Travel Time** | Distance Matrix API badge shown after both addresses selected |
| **Phone lookup** | Greets returning customers by name; shows extra fields for new numbers |
| **Form validation** | Required fields, date not in past, 10-digit phone, valid email |
| **Mock API submit** | POST to `jsonplaceholder.typicode.com` (swap for real endpoint) |
| **Responsive** | Works on mobile, tablet, and desktop |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/exampleiq-booking-form.git
cd exampleiq-booking-form
```

### 2. Add your Google Maps API key

Open `index.html` and replace `YOUR_GOOGLE_MAPS_API_KEY`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initMaps" async defer></script>
```

Enable these APIs in [Google Cloud Console](https://console.cloud.google.com):
- **Maps JavaScript API**
- **Places API**
- **Distance Matrix API**

### 3. Open in browser

```bash
# Simple local server (Python)
python3 -m http.server 8080
# Then open http://localhost:8080
```

Or just open `index.html` directly in Chrome/Firefox.

---

## 📁 Project Structure

```
booking-form/
├── index.html          # Main HTML structure
├── src/
│   ├── style.css       # All styles (CSS variables, responsive)
│   └── app.js          # Form logic, Maps API, validation, submission
└── README.md
```

---

## 🧪 Testing Phone Lookup

These numbers are pre-loaded in the mock contact database (`KNOWN_CONTACTS` in `app.js`):

| Phone | Returns |
|---|---|
| `774 123 4567` | Alex Rivera – welcome back greeting |
| `617 555 0100` | Jordan Smith – welcome back greeting |
| `555 555 1234` | Morgan Lee – welcome back greeting |
| Any other number | Shows extra contact fields |

---

## 🔌 Replacing the Mock API

In `src/app.js`, find `submitToAPI()` and replace the endpoint:

```js
const ENDPOINT = 'https://your-real-api.com/bookings';
```

The payload sent is:

```json
{
  "tripType": "oneway",
  "pickup": { "date": "...", "time": "...", "address": "...", "placeId": "..." },
  "stops": [],
  "dropoff": { "address": "...", "placeId": "..." },
  "contact": { "phone": "...", "firstName": "...", "lastName": "...", "email": "..." },
  "passengers": 2,
  "submittedAt": "2025-01-01T12:00:00.000Z"
}
```

---

## 🗺️ Google Maps Integration

- **Places Autocomplete** – fires on every keypress in any address field using `AutocompleteService`
- **Distance Matrix** – called automatically once both pickup and drop-off `placeId` values are set; displays distance and estimated drive time as chips below the drop-off field

---

## 📱 Responsive Breakpoints

| Breakpoint | Behaviour |
|---|---|
| `> 480px` | Two-column date/time row |
| `≤ 480px` | Single column, compact padding |

---

## 🛠 Tech Stack

- **HTML5 / CSS3 / Vanilla JS** – no build step required
- **Google Maps JavaScript API** (Places + Distance Matrix)
- **DM Sans** via Google Fonts

---

## 📝 License

MIT
