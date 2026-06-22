/**
 * Data Integration Layer Configuration
 * Global settings and component mapping profiles.
 */

window.API_CONFIG = {
  BASE_URL: "http://localhost:3000",
  TIMEOUT_MS: 8000,
  
  // Grouped Endpoints for easy modification
  ENDPOINTS: {
    CUSTOMER: "/customer",
    CUSTOMERS: "/customers",
    LEADS: "/leads",
    CASES: "/cases",
    TOUR: "/tour",
    TOUR_TRACK: "/api/tour/track"
  },

  // Grouped Query Parameter keys used by backend APIs
  PARAMS: {
    CUSTOMER_ID: "cid", // parameter used to identify customers in query string, e.g. ?cid=...
    CASE_CUSTOMER_ID: "customer", // parameter key cases API expects
    LEAD_CUSTOMER_ID: "customer"  // parameter key leads API expects
  }
};

window.ASSETS_CONFIG = {
  DASHBOARD_ASSETS_PATH: "assets/png/",
  SEARCH_ASSETS_PATH: "assets/"
};

/**
 * Maps each card key to its DOM target and modal ID.
 * The key must match the property name in the API response object.
 * e.g. response.profile, response.contact, response.address …
 */
window.CARD_CONFIG = {
  profile: {
    target: "#card-personal",
    modalId: "modal-personal"
  },
  contact: {
    target: "#card-contact",
    modalId: "modal-contact"
  },
  address: {
    target: "#card-address",
    modalId: "modal-address"
  },
  owner: {
    target: "#card-owner",
    modalId: "modal-owner"
  },
  other: {
    target: "#card-other",
    modalId: "modal-other"
  },
  kyc: {
    target: "#card-kyc",
    modalId: "modal-kyc"
  }
};
