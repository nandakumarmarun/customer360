/**
 * Theme Synchronization Module
 * Handles loading and saving user theme preferences (dark/light mode and color scheme)
 * from the database /theme API endpoint, falling back to localStorage.
 */
(function () {
  const ThemeModule = {
    // Fetches theme configuration from database
    getTheme: function (callback) {
      const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.THEME;
      
      const success = function (response) {
        if (response) {
          const mode = response.mode || "light";
          const color = response.color || "red";
          if (callback) callback(mode, color);
        }
      };

      const failure = function (err) {
        console.warn("Failed to fetch theme from DB:", err);
        const mode = 'light';
        const color = 'red';
        if (callback) callback(mode, color);
      };

      if (window.ApiService) {
        window.ApiService.get(endpoint, success, failure);
      } else {
        const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || "http://localhost:3000";
        fetch(`${baseUrl}${endpoint}`)
          .then(res => res.json())
          .then(success)
          .catch(failure);
      }
    },

    // Saves theme configuration to database
    saveTheme: function (mode, color) {
      const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.THEME;
      const payload = { mode: mode, color: color };

      const success = function (response) {
        console.log("Theme saved successfully to DB:", response);
      };

      const failure = function (err) {
        console.error("Failed to save theme to DB:", err);
      };

      if (window.ApiService) {
        window.ApiService.post(endpoint, payload, success, failure);
      } else {
        const baseUrl = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || "http://localhost:3000";
        fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(success)
        .catch(failure);
      }
    }
  };

  window.ThemeModule = ThemeModule;
})();
