/**
 * Data Integration Layer - API Service
 * Handles low-level AJAX requests with timeouts, standardized error hooks,
 * and supportive parameters payload mappings.
 */
(function() {
  const ApiService = {
    // Dynamic GET request: handles optional 'data' query parameters object
    get: function(endpoint, data, successCallback, errorCallback) {
      if (typeof data === 'function') {
        errorCallback = successCallback;
        successCallback = data;
        data = null;
      }
      return this._ajax(endpoint, "GET", data, successCallback, errorCallback);
    },

    // Dynamic POST request: JSON payload body
    post: function(endpoint, data, successCallback, errorCallback) {
      return this._ajax(endpoint, "POST", data, successCallback, errorCallback);
    },

    // Dynamic PUT request: JSON payload body
    put: function(endpoint, data, successCallback, errorCallback) {
      return this._ajax(endpoint, "PUT", data, successCallback, errorCallback);
    },

    // Dynamic DELETE request: handles optional 'data' query parameters object
    delete: function(endpoint, data, successCallback, errorCallback) {
      if (typeof data === 'function') {
        errorCallback = successCallback;
        successCallback = data;
        data = null;
      }
      return this._ajax(endpoint, "DELETE", data, successCallback, errorCallback);
    },

    // Standardized internal Ajax wrapper
    _ajax: function(endpoint, method, data, successCallback, errorCallback) {
      const url = `${window.API_CONFIG.BASE_URL}${endpoint}`;
      
      const ajaxOptions = {
        url: url,
        method: method,
        timeout: window.API_CONFIG.TIMEOUT_MS,
        dataType: "json",
        success: function(response) {
          if (successCallback) successCallback(response);
        },
        error: function(xhr, status, errorThrown) {
          let errorMessage = "Connection failed";
          if (status === "timeout") {
            errorMessage = "Request timed out";
          } else if (xhr.status === 404) {
            errorMessage = "Resource not found";
          } else if (xhr.status >= 500) {
            errorMessage = "Server error";
          } else if (xhr.responseText) {
            try {
              const res = JSON.parse(xhr.responseText);
              errorMessage = res.message || errorMessage;
            } catch(e) {}
          }
          if (errorCallback) errorCallback(errorMessage);
        }
      };

      if (data) {
        if (method === "GET" || method === "DELETE") {
          ajaxOptions.data = data; // Automatically serialized as URL query string params
        } else {
          ajaxOptions.contentType = "application/json";
          ajaxOptions.data = JSON.stringify(data); // Sent as a JSON string request payload body
        }
      }

      return $.ajax(ajaxOptions);
    }
  };

  window.ApiService = ApiService;
})();
