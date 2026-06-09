/**
 * Data Integration Layer - Data Loader
 * Coordinates independent data loading, maps models, and manages memory cache.
 */
(function() {
  window.DetailDataCache = {};

  const DataLoader = {
    loadCard: function(cardKey) {
      const cfg = window.CARD_CONFIG[cardKey];
      if (!cfg) return;

      const target = cfg.target;
      const endpoint = cfg.endpoint;
      const modalId = cfg.modalId;

      // Show card loader
      window.UIRenderer.showLoader(target);

      // Perform independent AJAX fetch
      window.ApiService.get(endpoint, 
        // Success callback
        function(response) {
          window.UIRenderer.hideLoader(target);

          if (!response || (!response.card && !response.details)) {
            window.UIRenderer.showEmptyState(target);
            return;
          }

          // Backend -> UI Mapper logic
          // Normalize and map backend structures to frontend standard layout models
          const uiCardModel = {
            title: response.card ? response.card.title : "",
            tag: response.card ? response.card.tag : "",
            tagClass: response.card ? response.card.tagClass : "",
            icon: response.card ? response.card.icon : "",
            data: response.card ? response.card.data : {}
          };

          const uiDetailsModel = {
            title: response.details ? response.details.title : (response.card ? response.card.title : "Details"),
            hero: response.details ? response.details.hero : "default.svg",
            sections: response.details ? response.details.sections : []
          };

          // Cache details data for dynamic modal detail view mapping
          window.DetailDataCache[modalId] = uiDetailsModel;

          // Render card UI representation
          window.UIRenderer.renderCard(target, uiCardModel);
        },
        // Error callback
        function(errorMsg) {
          window.UIRenderer.showError(target, errorMsg, function() {
            DataLoader.loadCard(cardKey);
          });
        }
      );
    },

    loadSummary: function() {
      const endpoint = window.API_CONFIG.SUMMARY_ENDPOINT || "/summary";
      window.ApiService.get(endpoint,
        function(response) {
          if (response) {
            window.UIRenderer.renderSummary(response);
          }
        },
        function(errorMsg) {
          console.error("Failed to load customer summary data:", errorMsg);
        }
      );
    },

    loadAll: function() {
      this.loadSummary();

      if (!window.CARD_CONFIG) return;
      Object.keys(window.CARD_CONFIG).forEach(key => {
        this.loadCard(key);
      });
    }
  };

  window.DataLoader = DataLoader;

  // Auto-init load when jQuery & DOM are ready
  $(function() {
    DataLoader.loadAll();
  });
})();
