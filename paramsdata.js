/**
 * Customer 360 - Global Parameter Access Level Layer
 * Handles global variables and parameters accessible from any module or script.
 * Supports reactive subscriptions, URL search parameter auto-extraction, and ES6 getter/setters.
 */
(function () {
  // Internal state store
  const store = {};
  
  // Registry for reactive callback listeners
  const subscribers = {};

  // Helper to extract initial values from URL search query
  function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Define the Global Parameters Data object
  const ParamsData = {
    /**
     * Retrieve a parameter value by key.
     * @param {string} key
     * @returns {*}
     */
    get: function (key) {
      return store[key];
    },

    /**
     * Set a parameter value and trigger any registered subscribers.
     * @param {string} key
     * @param {*} value
     */
    set: function (key, value) {
      const oldValue = store[key];
      if (oldValue === value) return; // No change, skip updates
      
      store[key] = value;

      // Trigger all callback functions registered for this key
      if (subscribers[key]) {
        subscribers[key].forEach(function (callback) {
          try {
            callback(value, oldValue);
          } catch (e) {
            console.error(`Error in subscriber callback for key "${key}":`, e);
          }
        });
      }
    },

    /**
     * Subscribe to changes for a specific parameter key.
     * @param {string} key
     * @param {function(newValue, oldValue)} callback
     * @returns {function()} Unsubscribe function
     */
    subscribe: function (key, callback) {
      if (typeof callback !== 'function') return;

      if (!subscribers[key]) {
        subscribers[key] = [];
      }
      subscribers[key].push(callback);

      // Return cleanup function to unsubscribe
      return function unsubscribe() {
        subscribers[key] = subscribers[key].filter(cb => cb !== callback);
      };
    }
  };

  // Define ES6 getters/setters for common parameters for clean property access:
  // e.g. window.ParamsData.customerId = 'NX-4829-0055' or console.log(window.ParamsData.customerId)
  Object.defineProperty(ParamsData, 'customerId', {
    get: function () {
      return this.get('customerId');
    },
    set: function (value) {
      this.set('customerId', value);
    },
    enumerable: true,
    configurable: false
  });

  // Expose on the window global scope
  window.ParamsData = ParamsData;

  // Initialize defaults and query parameters
  const initialCustomerId = getQueryParam('cid') || 'NX-4829-0055';
  ParamsData.set('customerId', initialCustomerId);

  console.log(`[ParamsData] Global storage initialized. Customer ID: ${initialCustomerId}`);
})();
