/**
 * Customer 360 Navigation Preloader Component
 * Fully decoupled and isolated overlay animation controller.
 */
(function() {
  const steps = [
    { timePct: 0, node: null, status: "Loading Customer Profile...", progress: 5 },
    { timePct: 18, node: "accounts", status: "Fetching Account Information...", progress: 20 },
    { timePct: 36, node: "kyc", status: "Fetching KYC Details...", progress: 38 },
    { timePct: 54, node: "cases", status: "Loading Cases...", progress: 56 },
    { timePct: 72, node: "interactions", status: "Loading Interactions...", progress: 74 },
    { timePct: 90, node: ["documents", "activities"], status: "Preparing Customer 360...", progress: 92 },
    { timePct: 100, node: null, status: "Ready!", progress: 100 }
  ];

  const Customer360Preloader = {
    // Inject Preloader HTML into DOM if not present
    init: function() {
      if ($('#customer360-preloader-overlay').length) return;

      // 6 Shimmer Skeleton Cards Grid
      let skeletonsHtml = "";
      for (let i = 0; i < 6; i++) {
        skeletonsHtml += `
          <div class="skeleton-card">
            <div class="shimmer"></div>
            <div class="skeleton-header"></div>
            <div class="skeleton-body">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
            </div>
          </div>
        `;
      }

      const overlayHtml = `
        <div id="customer360-preloader-overlay" class="customer360-preloader-overlay">
          <!-- Background Dashboard Skeletons -->
          <div class="preloader-dashboard-preview">
            ${skeletonsHtml}
          </div>
          
          <!-- Loading Graph Content Area -->
          <div class="preloader-overlay-content">
            <div class="preloader-node-network">
              
              <!-- Connection Lines from Center (200, 200) to Nodes -->
              <svg class="network-lines" viewBox="0 0 400 400">
                <line x1="200" y1="200" x2="200" y2="50" class="network-line" id="line-accounts" />
                <line x1="200" y1="200" x2="315" y2="120" class="network-line" id="line-kyc" />
                <line x1="200" y1="200" x2="315" y2="240" class="network-line" id="line-cases" />
                <line x1="200" y1="200" x2="200" y2="300" class="network-line" id="line-interactions" />
                <line x1="200" y1="200" x2="85" y2="240" class="network-line" id="line-documents" />
                <line x1="200" y1="200" x2="85" y2="120" class="network-line" id="line-activities" />
              </svg>
              
              <!-- Pulsing Center Orb and Rotating 360 Ring -->
              <div class="center-orb-wrapper">
                <div class="rotating-ring-360"></div>
                <div class="center-customer-orb">
                  <span class="orb-icon">👤</span>
                </div>
              </div>
              
              <!-- Absolute Positioned Nodes -->
              <div class="network-node" id="node-accounts" style="top: 25px; left: 146px;">
                <span class="node-icon">💰</span>
                <span class="node-label">Accounts</span>
              </div>
              <div class="network-node" id="node-kyc" style="top: 105px; left: 295px;">
                <span class="node-icon">🛡️</span>
                <span class="node-label">KYC</span>
              </div>
              <div class="network-node" id="node-cases" style="top: 225px; left: 295px;">
                <span class="node-icon">📁</span>
                <span class="node-label">Cases</span>
              </div>
              <div class="network-node" id="node-interactions" style="top: 285px; left: 138px;">
                <span class="node-icon">📡</span>
                <span class="node-label">Interactions</span>
              </div>
              <div class="network-node" id="node-documents" style="top: 225px; left: 25px;">
                <span class="node-icon">📄</span>
                <span class="node-label">Documents</span>
              </div>
              <div class="network-node" id="node-activities" style="top: 105px; left: 25px;">
                <span class="node-icon">📅</span>
                <span class="node-label">Activities</span>
              </div>
            </div>
            
            <!-- Branding details -->
            <h2 class="preloader-title">CUSTOMER 360</h2>
            <p class="preloader-subtitle">Building Complete Customer View</p>
            
            <!-- Progress Status Bar -->
            <div class="preloader-progress-container">
              <div class="preloader-progress-bar">
                <div class="preloader-progress-fill" id="c360-progress-fill"></div>
              </div>
              <div class="preloader-progress-status" id="c360-progress-status">Loading Customer Profile...</div>
            </div>
          </div>
        </div>
      `;
      
      $('body').append(overlayHtml);
    },

    // Trigger loading sequence and redirect or invoke callback on finish
    show: function(target, totalDuration = 2500) {
      this.init();

      const $overlay = $('#customer360-preloader-overlay');
      const $fill = $('#c360-progress-fill');
      const $status = $('#c360-progress-status');

      // Reset DOM state
      $('.network-node, .network-line').removeClass('active');
      $fill.css('width', '0%');
      $status.text("Loading Customer Profile...");

      // Fade-in preloader overlay
      $overlay.addClass('active');

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let progressPct = (elapsed / totalDuration) * 100;
        
        if (progressPct >= 100) {
          progressPct = 100;
          clearInterval(interval);
        }

        // Find current step matching timeline percentages
        let currentStep = steps[0];
        for (let i = 0; i < steps.length; i++) {
          if (progressPct >= steps[i].timePct) {
            currentStep = steps[i];
          }
        }

        // Apply active states to nodes and lines
        if (currentStep.node) {
          const activateNode = (nodeName) => {
            $(`#node-${nodeName}`).addClass('active');
            $(`#line-${nodeName}`).addClass('active');
          };

          if (Array.isArray(currentStep.node)) {
            currentStep.node.forEach(activateNode);
          } else {
            activateNode(currentStep.node);
          }
        }

        // Update progress bar and status text
        $fill.css('width', `${currentStep.progress}%`);
        $status.text(currentStep.status);

        // Action when completion hits 100%
        if (progressPct === 100) {
          setTimeout(() => {
            if (typeof target === 'function') {
              // Deactivate overlay and run callback
              $overlay.removeClass('active');
              setTimeout(() => {
                target();
              }, 500); // Wait for fade-out transition
            } else if (typeof target === 'string') {
              window.location.href = target;
            }
          }, 150);
        }
      }, 50);
    }
  };

  window.Customer360Preloader = Customer360Preloader;
})();
