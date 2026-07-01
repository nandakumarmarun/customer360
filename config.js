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
    TOUR_TRACK: "/api/tour/track",
    HOLDINGS: "/holdings",
    HOLDINGS_LOANS: "/loans",
    HOLDINGS_CASA: "/casaDetails",
    HOLDINGS_DEPOSITS: "/casaDeposits",
    HOLDINGS_GOLD: "/goldAccounts",
    HOLDINGS_LOCKER: "/locker",
    THEME: "/theme",
    SEARCH: "/search"
  },

  // Grouped Query Parameter keys used by backend APIs
  PARAMS: {
    CUSTOMER_ID: "customerId", // parameter key used to identify customers (in query string and API requests)
    INPUT_TYPE: "inputType",
    INPUT_VALUE: "inputValue"
  },

  // Generic global layout field mapping
  FIELD_MAPPING: {
    customerId: "customer",
    title: "name",
    subtitle: "number",
    value: "amount",
    tag: "status",
    details: "details",
    fullDetails: "fullDetails"
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

/**
 * Maps category landing grid cards and explorer subcategory tabs for Holdings.
 */
window.HOLDING_CONFIG = [
  {
    id: "assets",
    title: "Assets",
    icon: "🏦",
    apiKey: "assets",
    tabs: [
      { id: "loans", title: "Loans", icon: "🏠", matchType: "Loans", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_LOANS }
    ]
  },
  {
    id: "liabilities",
    title: "Liabilities",
    icon: "📉",
    apiKey: "liabilities",
    tabs: [
      { id: "casaDetails", title: "CASA", icon: "💳", matchType: "CASA Details", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA },
      { id: "casaDeposits", title: "DEPOSITS", icon: "📈", matchType: "CASA Deposits", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_DEPOSITS },
      { id: "goldAccounts", title: "Gold Accounts", icon: "🪙", matchType: "Gold Accounts", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_GOLD }
    ]
  },
  {
    id: "valueAdded",
    title: "Value Added Services",
    icon: "🌟",
    apiKey: "valueAdded",
    tabs: [
      { id: "locker", title: "Locker", icon: "🔒", matchType: "Locker Details", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_LOCKER }
    ]
  }
];

// Scalable helper function to resolve any dynamic field name
window.fieldName = function(key) {
  const mapping = (window.API_CONFIG && window.API_CONFIG.FIELD_MAPPING) || {};
  return mapping[key] || key;
};

// Expose alias fieldName2 for consistency/flexibility
window.fieldName2 = window.fieldName;

