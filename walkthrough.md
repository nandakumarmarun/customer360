# Walkthrough - Dynamic AJAX Data Integration Layer

We successfully decoupled the CUSTOMER360 customer dashboard UI from the static code, establishing a decoupled, asynchronous, mapping-oriented Data Integration Layer driven entirely by jQuery AJAX and a mock JSON Server.

## Changes Completed

### 1. Created Decoupled Integration Modules
- [config.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/config.js): Contains centralized `BASE_URL` and `CARD_CONFIG` selectors mapping cards to backend endpoints and modal IDs.
- [api-service.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/api-service.js): Implemented raw `$.ajax` handlers wrapper with custom timeouts and status-based connection error handling.
- [ui-renderer.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/ui-renderer.js): Built a dynamically looping card row generator to map arbitrary key-value properties. Added glassmorphic status state overlays (loading spinner, error connection overlay with Retry, and empty state boxes) that hook seamlessly inside the UI theme.
- [data-loader.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/data-loader.js): Implemented a parallel loader, backend-to-UI model mapper layer, and in-memory cache (`window.DetailDataCache`) that allows independent page component load lifecycle.

### 2. Modified Existing Front-end Files
- [index.html](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/index.html): Included jQuery CDN, integrated the 4 data layer scripts, and cleared all hardcoded HTML data rows from cards so that no static customer profile traces exist.
- [script.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/script.js): Removed all static arrays and structures (`DETAIL_DATA` and `baseData`). Refactored card click actions to fetch live records from `DetailDataCache`.
- [style.css](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/style.css): Added CSS rule definitions for loading spinners, shake keyframes, error retry text, and light/dark theme overrides for overlays.

---

## Validation & Verification

### Live Backend Verification
1. Started a local JSON database server:
   ```bash
   npx json-server --watch db.json --port 3000
   ```
2. Queried the live `/profile` endpoint using a local web client and verified the payload returned the structured card fields:
   ```json
   {
     "card": {
       "title": "Personal Information",
       "tag": "Verified",
       "data": {
         "Date of Birth": "Mar 15, 1985",
         "Nationality": "American",
         "Occupation": "Senior Executive"
       }
     }
   }
   ```
3. Hosted the files locally on port `8080` to avoid local origin iframe blocks (`file://` protocol restrictions).
