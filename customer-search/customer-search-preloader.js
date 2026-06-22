/**
 * Reusable Search Preloader Component
 * Scoped under window.SearchPreloader
 */
(function() {
  const messages = [
    "Loading Customer 360...",
    "Verifying Credentials...",
    "Retrieving Account Profile...",
    "Preparing Experience..."
  ];

  const SearchPreloader = {
    // Inject HTML elements if not already in DOM
    init: function() {
      if ($('#search-preloader-overlay').length) return;

      const searchAssetsPath = (window.ASSETS_CONFIG && window.ASSETS_CONFIG.SEARCH_ASSETS_PATH) || 'assets/';
      const overlayHtml = `
        <div id="search-preloader-overlay" class="search-preloader-overlay">
          <div class="search-preloader-bg-glow"></div>
          <div class="search-preloader-particles" id="preloader-particles"></div>
          <div class="search-preloader-content">
            <div class="search-preloader-ring-wrapper">
              <div class="search-preloader-ring"></div>
              <div class="search-preloader-icon">
                <img src="${searchAssetsPath}customer360-loader.svg" alt="Logo" width="100%" height="100%" />
              </div>
            </div>
            <div class="search-preloader-status" id="preloader-status-text">INITIALIZING...</div>
            <div class="search-preloader-text">Customer 360</div>
          </div>
        </div>
      `;
      $('body').append(overlayHtml);
      this.spawnParticles();
    },

    // Spawns decorative floating particles
    spawnParticles: function() {
      const $container = $('#preloader-particles');
      if (!$container.length) return;
      $container.empty();

      const particleCount = 18;
      for (let i = 0; i < particleCount; i++) {
        const $p = $('<div class="search-preloader-particle"></div>');
        const angle = (i / particleCount) * Math.PI * 2;
        const radius = 60 + Math.random() * 20;
        const x = 120 + Math.cos(angle) * radius - 2;
        const y = 120 + Math.sin(angle) * radius - 2;

        $p.css({
          left: `${x}px`,
          top: `${y}px`,
          opacity: 0
        });

        $container.append($p);

        // Animate particles in loops if gsap is available
        if (typeof gsap !== 'undefined') {
          gsap.to($p[0], {
            x: Math.cos(angle) * 35,
            y: Math.sin(angle) * 35,
            opacity: Math.random() * 0.7 + 0.3,
            duration: 1.5 + Math.random() * 1.5,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.random() * 1.5
          });
        }
      }
    },

    // Show preloader, animate text, and run callback after duration completes
    show: function(callback, durationMs = 1800) {
      this.init();
      const $overlay = $('#search-preloader-overlay');
      const $status = $('#preloader-status-text');

      $overlay.addClass('active');
      
      // Cycle status text
      let msgIndex = 0;
      $status.text(messages[0]);
      
      const textInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        $status.fadeOut(150, function() {
          $(this).text(messages[msgIndex]).fadeIn(150);
        });
      }, durationMs / 3.5);

      // Timeout for loading completion
      setTimeout(() => {
        clearInterval(textInterval);
        $status.text("READY!");
        
        setTimeout(() => {
          this.hide(callback);
        }, 200);
      }, durationMs);
    },

    // Hide preloader overlay and invoke callback
    hide: function(callback) {
      const $overlay = $('#search-preloader-overlay');
      $overlay.removeClass('active');
      
      setTimeout(() => {
        if (callback) callback();
      }, 500); // Wait for CSS transition fade out
    }
  };

  window.SearchPreloader = SearchPreloader;
})();
