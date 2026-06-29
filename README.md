# Customer 360 - Global Parameter Access Layer (`paramsdata.js`)

This document explains the architecture of the unified global parameter storage layer (`window.ParamsData`) and provides instructions on how to use it, subscribe to parameter modifications, and extend it with new parameters.

---

## 1. How It Works

The global store implemented in [paramsdata.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/paramsdata.js) uses a **Publish-Subscribe (Pub-Sub)** pattern.

- **Private Storage**: State values are kept in an internal object inside the IIFE scope to prevent accidental outer mutation.
- **Set & Get**: Variables are mutated and accessed via explicit `set(key, val)` and `get(key)` methods.
- **Reactive Subscriptions**: Other modules subscribe to parameter changes via `subscribe(key, callback)`. When a value changes, all registered callbacks for that key are executed immediately.
- **Convenient Property Accessors**: Common parameters (like `customerId`) use ES6 getters/setters so that developers can use standard property assignments (e.g. `window.ParamsData.customerId = 'NX-4829-0056'`).
- **URL Parameter Extraction**: Auto-extracts values from query params (e.g. `?customerId=...`) at initialization to sync URL state with the application.

---

## 2. Using the Global Store

### Setting Values
You can set any value at runtime:
```javascript
window.ParamsData.set('themeMode', 'dark');
```

### Getting Values
You can retrieve values from anywhere:
```javascript
const currentTheme = window.ParamsData.get('themeMode');
```

### Subscribing to Changes
You can register reactive functions to listen for changes:
```javascript
const unsubscribe = window.ParamsData.subscribe('themeMode', function (newValue, oldValue) {
  console.log(`Theme changed from "${oldValue}" to "${newValue}"`);
  // Perform page re-rendering or module updates here
});

// To stop listening later:
unsubscribe();
```

---

## 3. Adding New Parameters

To define parameters that support clean direct property access (e.g. `window.ParamsData.myValue = ...` instead of `window.ParamsData.set('myValue', ...)`), define property accessors on the object inside `paramsdata.js`:

```javascript
// Inside paramsdata.js:
Object.defineProperty(ParamsData, 'myValue', {
  get: function () {
    return this.get('myValue');
  },
  set: function (value) {
    this.set('myValue', value);
  },
  enumerable: true,
  configurable: false
});
```

Once defined, you can write and read directly:
```javascript
// Setting:
window.ParamsData.myValue = "New Value";

// Reading:
console.log(window.ParamsData.myValue);
```

---

## 4. Dynamic Field Mapping System (Holdings Module)

To decouple the UI component layer from direct database schema assumptions, the Portfolio Holdings module ([holding.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/modules/holding/holding.js)) uses a dynamic translation layer.

### How It Works

1. **Mapping Definitions**: Centralized mapping dictionaries are defined in [config.js](file:///c:/Users/Lenovo/Desktop/works/customer%20360/customer360/config.js) under `window.API_CONFIG.FIELD_MAPPING`:
   ```javascript
   FIELD_MAPPING: {
     customerId: "customer",
     title: "name",
     subtitle: "number",
     value: "amount",
     tag: "status",
     details: "details",
     fullDetails: "fullDetails"
   }
   ```
2. **Resolver Helper**: A globally accessible helper function is exposed:
   ```javascript
   window.fieldName = function(key) {
     const mapping = (window.API_CONFIG && window.API_CONFIG.FIELD_MAPPING) || {};
     return mapping[key] || key;
   };
   window.fieldName2 = window.fieldName; // Backup alias
   ```
3. **Usage in Module**: Inside the holdings module, a local reference `fName` is established:
   ```javascript
   const fName = (window.fieldName || window.fieldName2 || function(k) { return k; });
   ```
   All properties retrieved from the database API response are resolved via this helper before rendering or filtering:
   - `acc[fName("title")]` resolves dynamically to `acc["name"]`
   - `acc[fName("subtitle")]` resolves dynamically to `acc["number"]`
   - `acc[fName("value")]` resolves dynamically to `acc["amount"]`
   - `acc[fName("tag")]` resolves dynamically to `acc["status"]`
   - `record[fName("customerId")]` resolves dynamically to `record["customer"]`

This architecture allows backend schema key renaming to be fully handled within `config.js` without altering layout or rendering logic in the JavaScript modules.
