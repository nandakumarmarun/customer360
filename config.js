/**
 * Data Integration Layer Configuration
 * Global settings and component mapping profiles.
 */

window.API_CONFIG = {
  BASE_URL: "http://localhost:3000",
  TIMEOUT_MS: 8000,
  SUMMARY_ENDPOINT: "/summary"
};

window.CARD_CONFIG = {
  personal: {
    endpoint: "/profile",
    target: "#card-personal",
    modalId: "modal-personal"
  },
  contact: {
    endpoint: "/contact",
    target: "#card-contact",
    modalId: "modal-contact"
  },
  address: {
    endpoint: "/address",
    target: "#card-address",
    modalId: "modal-address"
  },
  owner: {
    endpoint: "/owner",
    target: "#card-owner",
    modalId: "modal-owner"
  },
  other: {
    endpoint: "/other",
    target: "#card-other",
    modalId: "modal-other"
  },
  kyc: {
    endpoint: "/kyc",
    target: "#card-kyc",
    modalId: "modal-kyc"
  }
};
