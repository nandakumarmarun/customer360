/**
 * Data Integration Layer Configuration
 * Global settings and component mapping profiles.
 */

window.API_CONFIG = {
  BASE_URL: "http://localhost:3000",
  TIMEOUT_MS: 8000,

  // Customer Search URL for easy modification
  CUSTOMER_SEARCH_URL: "customer-search/customer-search.html",
  HOME_PAGE_URL: "index.html",

  // Complete URLs for creation forms
  CREATION_URLS: {
    CREATE_LEAD: "modules/lead/lead-create.html",
    CREATE_CASE: "modules/case/case-create.html",
    CREATE_COMPLAINT: "modules/case/complaint-create.html",
    CREATE_APPOINTMENT: "modules/activities/appointment-create.html"
  },

  // Complete URLs for details view
  DETAIL_URLS: {
    LEAD_DETAIL: "modules/lead/lead-detail.html",
    CASE_DETAIL: "modules/case/case-detail.html",
    COMPLAINT_DETAIL: "modules/case/complaint-detail.html",
    ACTIVITY_DETAIL: "modules/activities/activity-detail.html"
  },

  // Edit Profile URLs based on customer type
  EDIT_PROFILE_URLS: {
    Corporate: "edit-profile-corporate.html",
    Retail: "edit-profile-retail.html",
    default: "edit-profile-default.html"
  },

  // Grouped Endpoints for easy modification
  ENDPOINTS: {
    CUSTOMER: "/customer",
    CUSTOMERS: "/customers",
    LEADS: "/leads",
    CASES: "/cases",
    TOUR: "/tour",
    TOUR_TRACK: "/api/tour/track",
    TOUR_PROGRESS: "/tourProgress",
    HOLDINGS: "/holdings",
    HOLDINGS_ASSETS: "/assets",
    HOLDINGS_LOANS: "/loans",
    HOLDINGS_LOANS_DETAILS: "/loanDetails",
    HOLDINGS_GOLD_LOANS_DETAILS: "/goldLoanDetails",
    HOLDINGS_CASA: "/casaDetails",
    HOLDINGS_CASA_CARDS: "/casaCards",
    HOLDINGS_DEPOSITS: "/casaDeposits",
    HOLDINGS_GOLD: "/goldAccounts",
    HOLDINGS_LOCKER: "/locker",
    HOLDINGS_INVESTMENTS: "/investments",
    THEME: "/theme",
    SEARCH: "/search",
    ACTIVITIES: "/activities",
    ACTIVITY_TYPES: "/activityTypes",
    ACTIVITY_CONFIG: "/activitiesConfig",
    QUICK_MODULES: "/quickModules"
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
  SEARCH_ASSETS_PATH: "assets/",
  ANIMATIONS: {
    EMPTY: "assets/animations/empty.svg",
    ERROR: "assets/animations/error.svg",
    NO_CUSTOMER: "assets/animations/no-customer.svg"
  }
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
    endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_ASSETS,
    tabs: [
      { id: "loans", title: "Asset Loans", icon: "🏠", matchType: "Asset Loans", detailsEndpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_LOANS_DETAILS, detailsParams: { idKey: "loanId" } },
      { id: "goldLoans", title: "Gold Loans", icon: "🪙", matchType: "Gold Loans", detailsEndpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_GOLD_LOANS_DETAILS, detailsParams: { idKey: "goldLoanId" } }
    ]
  },
  {
    id: "liabilities",
    title: "Liabilities",
    icon: "📉",
    apiKey: "liabilities",
    tabs: [
      {
        id: "casaDetails",
        title: "CASA",
        icon: "💳",
        matchType: "CASA Details",
        endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA,
        rightTabs: [
          { id: "details", title: "Details" },
          { id: "debitCards", title: "Debit Cards", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA_CARDS, paramKey: "casaId", idField: "number" }
        ]
      },
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
  },
  {
    id: "investments",
    title: "Investments",
    icon: "📊",
    apiKey: "investments",
    tabs: [
      { id: "investmentDetails", title: "Investments", icon: "📈", matchType: "Investment Details", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_INVESTMENTS }
    ]
  }
];



// Scalable helper function to resolve any dynamic field name
window.fieldName = function (key) {
  const mapping = (window.API_CONFIG && window.API_CONFIG.FIELD_MAPPING) || {};
  return mapping[key] || key;
};

// Expose alias fieldName2 for consistency/flexibility
window.fieldName2 = window.fieldName;

