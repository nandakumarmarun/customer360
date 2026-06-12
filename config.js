/**
 * Data Integration Layer Configuration
 * Global settings and component mapping profiles.
 */

window.API_CONFIG = {
  BASE_URL: "http://localhost:3000",
  TIMEOUT_MS: 8000,
  // Single endpoint — returns summary + all card sections in one response
  CUSTOMER_ENDPOINT: "/customer"
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
