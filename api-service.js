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
          if (xhr.status === 403 || xhr.status === 401) {
            if (window.showForbiddenPopup) {
              window.showForbiddenPopup();
            } else {
              alert("Your session is closed. You need to relogin.");
              let loginUrl = (window.API_CONFIG && window.API_CONFIG.LOGIN_PAGE_URL) || "login.html";
              if (window.location.pathname.includes('/customer-search/')) {
                loginUrl = '../' + loginUrl;
              }
              window.location.href = loginUrl;
            }
            return;
          }
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

  function showForbiddenPopup() {
    if (document.getElementById('forbidden-overlay')) return;

    let loginUrl = (window.API_CONFIG && window.API_CONFIG.LOGIN_PAGE_URL) || 'login.html';
    if (window.location.pathname.includes('/customer-search/')) {
      loginUrl = '../' + loginUrl;
    }

    const overlayHtml = `
      <div id="forbidden-overlay" class="forbidden-overlay">
        <div class="forbidden-card">
          <div class="lock-anim-container">
            <svg class="animated-lock" viewBox="0 0 64 64" width="80" height="80">
              <path class="lock-shackle" d="M20 28V18c0-6.6 5.4-12 12-12s12 5.4 12 12v10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
              <rect class="lock-body" x="12" y="26" width="40" height="32" rx="6" fill="currentColor"/>
              <circle class="lock-keyhole" cx="32" cy="40" r="4" fill="#1e1e2f"/>
              <path class="lock-keyhole-bar" d="M32 44v6" stroke="#1e1e2f" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
          <h2>Session Expired</h2>
          <p>Your session is closed. You need to relogin to continue.</p>
          <button id="forbidden-login-btn" class="forbidden-btn">Go to Login</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlayHtml);

    document.getElementById('forbidden-login-btn').addEventListener('click', () => {
      window.location.href = loginUrl;
    });

    setTimeout(() => {
      const overlay = document.getElementById('forbidden-overlay');
      if (overlay) overlay.classList.add('active');
    }, 10);
  }

  window.showForbiddenPopup = showForbiddenPopup;
  window.ApiService = ApiService;
})();
