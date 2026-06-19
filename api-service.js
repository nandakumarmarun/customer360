/**
 * Data Integration Layer - API Service
 * Handles low-level AJAX requests with timeouts and standardized error hooks.
 */
(function() {
  const ApiService = {
    get: function(endpoint, successCallback, errorCallback) {
      const url = `${window.API_CONFIG.BASE_URL}${endpoint}`;
      $.ajax({
        url: url,
        method: "GET",
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
      });
    }
  };

  window.ApiService = ApiService;
})();
