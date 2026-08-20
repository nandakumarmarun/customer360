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
  LOGIN_PAGE_URL: "login.html",

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
    HOLDINGS_CASA_TRANSACTIONS: "/casaTransactions",
    HOLDINGS_DEPOSITS: "/casaDeposits",
    HOLDINGS_GOLD: "/goldAccounts",
    HOLDINGS_LOCKER: "/locker",
    HOLDINGS_INVESTMENTS: "/investments",
    HOLDINGS_INSURANCE: "/insurance",
    HOLDINGS_MUTUAL_FUNDS: "/mutualFunds",
    HOLDINGS_CASA_SUMMARY: "/casaSummary",
    HOLDINGS_DEPOSITS_SUMMARY: "/depositsSummary",
    HOLDINGS_INSURANCE_SUMMARY: "/insuranceSummary",
    HOLDINGS_MUTUAL_FUNDS_SUMMARY: "/mutualFundsSummary",
    THEME: "/theme",
    SEARCH: "/search",
    ACTIVITIES: "/activities",
    ACTIVITY_TYPES: "/activityTypes",
    ACTIVITY_CONFIG: "/activitiesConfig",
    QUICK_MODULES: "/quickModules",
    MANDATES: "/mandates",
    MANDATE_ACCOUNTS: "/mandateAccounts"
  },

  // Grouped Query Parameter keys used by backend APIs
  PARAMS: {
    CUSTOMER_ID: "customerId", // parameter key used to identify customers (in query string and API requests)
    PAN_NUMBER: "panNumber",
    INPUT_TYPE: "inputType",
    INPUT_VALUE: "inputValue"
  },

  // Generic global layout field mapping
  FIELD_MAPPING: {
    customerId: "customer",
    panNumber: "panNumber",
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
    paramKey: "customerId",
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
        summaryEndpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA_SUMMARY,
        paramKey: "customerId",
        rightTabs: [
          { id: "details", title: "Details" },
          { id: "debitCards", title: "Debit Cards", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA_CARDS, paramKey: "casaId", idField: "number" },
          { id: "transactions", title: "Transactions", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA_TRANSACTIONS, paramKey: "casaId", idField: "number" }
        ]
      },
      { id: "casaDeposits", title: "DEPOSITS", icon: "📈", matchType: "CASA Deposits", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_DEPOSITS, summaryEndpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_DEPOSITS_SUMMARY, paramKey: "customerId" },
      { id: "goldAccounts", title: "Gold Accounts", icon: "🪙", matchType: "Gold Accounts", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_GOLD, paramKey: "customerId" }
    ]
  },
  {
    id: "valueAdded",
    title: "Value Added Services",
    icon: "🌟",
    apiKey: "valueAdded",
    tabs: [
      { id: "locker", title: "Locker", icon: "🔒", matchType: "Locker Details", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_LOCKER, paramKey: "customerId" }
    ]
  },
  {
    id: "investments",
    title: "Investments",
    icon: "📊",
    apiKey: "investments",
    tabs: [
      { id: "insurance", title: "Insurance", icon: "🛡️", matchType: "Insurance Details", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_INSURANCE, summaryEndpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_INSURANCE_SUMMARY, paramKey: "customerId" },
      { id: "mutualFunds", title: "Mutual Funds", icon: "🎯", matchType: "Mutual Funds", endpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_MUTUAL_FUNDS, summaryEndpoint: window.API_CONFIG.ENDPOINTS.HOLDINGS_MUTUAL_FUNDS_SUMMARY, paramKey: "panNumber" }
    ]
  }
];



/**
 * Configurable tab configuration for the Mandates module.
 */
window.MANDATES_CONFIG = {
  tabs: [
    { id: "debit-card", title: "Debit Card", icon: "💳", categories: ["Direct Debit", "E-Mandates"] },
    { id: "upi", title: "UPI", icon: "📱", categories: ["UPI"], locked: true },
    { id: "nach", title: "NACH", icon: "🏦", categories: ["NACH"], locked: true }
  ]
};

/**
 * Configurable tab configuration for the Cards module.
 */
window.CARDS_CONFIG = {
  tabs: [
    { id: "debit-card", title: "Debit Card", icon: "💳" },
    { id: "credit-card", title: "Credit Card", icon: "💳", locked: true }
  ]
};

/**
 * Quick Access Modules configuration fallback.
 */
window.QUICK_MODULES_CONFIG = [
  { id: "case", title: "Case", icon: "⚖️", enabled: true, order: 1 },
  { id: "lead", title: "Lead", icon: "🎯", enabled: true, order: 2 },
  { id: "activities", title: "Activities", icon: "📅", enabled: true, order: 3 },
  { id: "contacts", title: "Related Contacts", icon: "👥", enabled: true, order: 4 },
  { id: "group", title: "Group", icon: "🏢", enabled: true, order: 5 },
  { id: "attachments", title: "Attachments", icon: "📎", enabled: true, order: 6 },
  { id: "holding", title: "Holding", icon: "📊", enabled: true, order: 7 },
  { id: "mandates", title: "Mandates", icon: "📋", enabled: true, order: 8 },
  { id: "cards", title: "Cards", icon: "💳", enabled: true, order: 9 },
  { id: "profiler", title: "Profiler", icon: "👤", enabled: true, order: 10 },
  { id: "offers", title: "Offers", icon: "🏷️", enabled: true, order: 11 }
];



// Scalable helper function to resolve any dynamic field name
window.fieldName = function (key) {
  const mapping = (window.API_CONFIG && window.API_CONFIG.FIELD_MAPPING) || {};
  return mapping[key] || key;
};

// Expose alias fieldName2 for consistency/flexibility
window.fieldName2 = window.fieldName;

