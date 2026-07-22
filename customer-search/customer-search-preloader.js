/**
 * Reusable Search Preloader Component
 * Scoped under window.SearchPreloader
 */
(function () {
  const messages = [
    "Loading Customer 360...",
    "Verifying Credentials...",
    "Retrieving Account Profile...",
    "Preparing Experience..."
  ];

  const SearchPreloader = {
    // Inject HTML elements if not already in DOM
    init: function () {
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
                  <defs>
                    <linearGradient id="hexagon-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="var(--accent, #aa0000)" />
                      <stop offset="100%" stop-color="var(--accent2, #ff4444)" />
                    </linearGradient>
                    <filter id="hex-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" fill="none" stroke="url(#hexagon-gradient)" stroke-width="6.5" stroke-linejoin="round" filter="url(#hex-glow)" />
                  <polygon points="50,33 65,42 65,58 50,67 35,58 35,42" fill="url(#hexagon-gradient)" opacity="0.8" />
                </svg>
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
    spawnParticles: function () {
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
    show: function (callback, durationMs = 1800, keepVisible = false) {
      this.init();
      const $overlay = $('#search-preloader-overlay');
      const $status = $('#preloader-status-text');

      $overlay.addClass('active');

      if (durationMs <= 200) {
        $status.text("LOADING...");
        setTimeout(() => {
          if (keepVisible) {
            if (callback) callback();
          } else {
            this.hide(callback);
          }
        }, 500); // 500ms allows the CSS transition to complete so the preloader is fully visible before navigation starts
        return;
      }

      // Cycle status text
      let msgIndex = 0;
      $status.text(messages[0]);

      const textInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        $status.fadeOut(150, function () {
          $(this).text(messages[msgIndex]).fadeIn(150);
        });
      }, durationMs / 3.5);

      // Timeout for loading completion
      setTimeout(() => {
        clearInterval(textInterval);
        $status.text("READY!");

        setTimeout(() => {
          if (keepVisible) {
            if (callback) callback();
          } else {
            this.hide(callback);
          }
        }, 200);
      }, durationMs);
    },

    // Hide preloader overlay and invoke callback
    hide: function (callback) {
      const $overlay = $('#search-preloader-overlay');
      $overlay.removeClass('active');

      setTimeout(() => {
        if (callback) callback();
      }, 500); // Wait for CSS transition fade out
    }
  };

  window.SearchPreloader = SearchPreloader;
})();
