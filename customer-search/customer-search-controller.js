/**
 * Customer Search Controller - Decoupled Controller Layer
 * Fetches banking customer records via ApiService and performs query filtering.
 */
(function() {
  let loadedCustomers = [];

  const CustomerSearchController = {
    // Load customer records via AJAX call using the ApiService integration layer
    loadCustomers: function(successCallback, errorCallback) {
      const endpoint = (window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.CUSTOMERS) || "/customers";
      if (window.ApiService) {
        window.ApiService.get(
          endpoint,
          function(response) {
            loadedCustomers = response || [];
            if (successCallback) successCallback(loadedCustomers);
          },
          function(errorMsg) {
            console.error("Failed to load customer list via ApiService:", errorMsg);
            if (errorCallback) errorCallback(errorMsg);
          }
        );
      } else {
        console.warn("ApiService is not loaded. Falling back to empty customers list.");
        if (errorCallback) errorCallback("ApiService not available");
      }
    },

    // Expose loaded customer database
    getAllCustomers: function() {
      return [...loadedCustomers];
    },

    // Search function mapping ID, Email, and Phone selections
    query: function(searchType, searchValue) {
      const val = (searchValue || "").toLowerCase().trim();
      if (!val) return [...loadedCustomers];

      return loadedCustomers.filter(item => {
        if (searchType === "cid") {
          return item.id.toLowerCase().includes(val);
        } else if (searchType === "email") {
          return item.email.toLowerCase().includes(val);
        } else if (searchType === "phone") {
          // Compare digits only to make phone searching more robust
          const digitsSearch = val.replace(/\D/g, "");
          const digitsCustomer = item.phone.replace(/\D/g, "");
          return digitsCustomer.includes(digitsSearch);
        }
        return false;
      });
    },

    // Refine results based on active filters and date ranges
    filterResults: function(records, statusFilter, startDate, endDate) {
      return records.filter(item => {
        // Status filter
        if (statusFilter !== "All") {
          if (item.status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false;
          }
        }

        // Date filters
        if (startDate) {
          const itemDate = new Date(item.createdDate);
          const start = new Date(startDate);
          if (itemDate < start) return false;
        }

        if (endDate) {
          const itemDate = new Date(item.createdDate);
          const end = new Date(endDate);
          // Set to end of the day
          end.setHours(23, 59, 59, 999);
          if (itemDate > end) return false;
        }

        return true;
      });
    }
  };

  window.CustomerSearchController = CustomerSearchController;
})();
