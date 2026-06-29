/**
 * Data Integration Layer - Data Loader
 * Makes ONE API call to CUSTOMER_ENDPOINT and distributes the
 * response to renderSummary + all card renderers.
 *
 * Expected API response shape:
 * {
 *   summary : { name, cid, tier, … },
 *   profile : { card: {…}, details: {…} },
 *   contact : { card: {…}, details: {…} },
 *   address : { card: {…}, details: {…} },
 *   owner   : { card: {…}, details: {…} },
 *   other   : { card: {…}, details: {…} },
 *   kyc     : { card: {…}, details: {…} }
 * }
 */
(function() {
  window.DetailDataCache = {};

  // Show loaders on every card immediately
  function showAllLoaders() {
    if (!window.CARD_CONFIG) return;
    Object.values(window.CARD_CONFIG).forEach(function(cfg) {
      window.UIRenderer.showLoader(cfg.target);
    });
  }

  // Build the standard UI card model from a section response
  function buildCardModel(section) {
    return {
      title    : section.card ? section.card.title    : "",
      tag      : section.card ? section.card.tag      : "",
      tagClass : section.card ? section.card.tagClass : "",
      icon     : section.card ? section.card.icon     : "",
      data     : section.card ? section.card.data     : {}
    };
  }

  // Build the standard UI details model from a section response
  function buildDetailsModel(section, fallbackTitle) {
    return {
      title    : section.details ? section.details.title    : (fallbackTitle || "Details"),
      hero     : section.details ? section.details.hero     : "default.svg",
      sections : section.details ? section.details.sections : []
    };
  }

  const DataLoader = {
    /**
     * Single API call — fetches everything at once and
     * distributes each section to the correct renderer.
     */
    loadAll: function() {
      const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.CUSTOMER;
      const cid = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
      if (!cid) {
        console.warn("[DataLoader] No customer ID present. Hiding loading screen and showing error alert.");
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
          loadingScreen.style.transition = 'opacity 0.5s ease';
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
          }, 500);
        }
        const app = document.getElementById('app');
        if (app) {
          app.classList.remove('hidden');
        }
        if (window.UIRenderer && window.UIRenderer.showNoDataAlert) {
          window.UIRenderer.showNoDataAlert();
        }
        return;
      }

      const paramKey = (window.API_CONFIG && window.API_CONFIG.PARAMS && window.API_CONFIG.PARAMS.CUSTOMER_ID) || "customerId";
      const params = {};
      params[paramKey] = cid;

      showAllLoaders();

      window.ApiService.get(
        endpoint,
        params,

        // ── SUCCESS ──────────────────────────────────────────
        function(response) {
          if (!response) {
            console.error("Customer API returned empty response.");
            return;
          }

          // 1. Render sidebar / header summary
          if (response.summary) {
            window.UIRenderer.renderSummary(response.summary);
          }

          // 2. Render each card section
          if (window.CARD_CONFIG) {
            Object.keys(window.CARD_CONFIG).forEach(function(key) {
              const cfg     = window.CARD_CONFIG[key];
              const section = response[key];   // e.g. response.profile, response.contact …

              window.UIRenderer.hideLoader(cfg.target);

              if (!section) {
                window.UIRenderer.showEmptyState(cfg.target);
                return;
              }

              // Cache detail data for the cinematic detail view
              const detailsModel = buildDetailsModel(section, key);
              window.DetailDataCache[cfg.modalId] = detailsModel;

              // Render the card face
              window.UIRenderer.renderCard(cfg.target, buildCardModel(section));
            });
          }
        },

        // ── ERROR ─────────────────────────────────────────────
        function(errorMsg) {
          console.error("Failed to load customer data:", errorMsg);

          // Show retry on every card
          if (window.CARD_CONFIG) {
            Object.values(window.CARD_CONFIG).forEach(function(cfg) {
              window.UIRenderer.showError(cfg.target, errorMsg, function() {
                DataLoader.loadAll();   // single retry reloads everything
              });
            });
          }
        }
      );
    }
  };

  window.DataLoader = DataLoader;

  // Auto-init when jQuery + DOM are ready
  $(function() {
    DataLoader.loadAll();

    // Subscribe to global customerId changes to reload the data reactively
    if (window.ParamsData) {
      window.ParamsData.subscribe('customerId', function(newCid) {
        console.log(`[DataLoader] Customer ID changed to ${newCid}. Reloading data...`);
        DataLoader.loadAll();
      });
    }
  });
})();
