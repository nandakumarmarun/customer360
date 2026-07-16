/* tour.js - Guided Tour functionality */

const TourAPI = {
  userId: 'user_123', // Placeholder – replace with actual session user
  viewId: 'DASHBOARD_VIEW',

  /**
   * POST a progress record to /tourProgress via json-server.
   * json-server automatically assigns an `id` and persists to db.json.
   */
  saveProgress: function(payload) {
    const endpoint = window.API_CONFIG &&
                     window.API_CONFIG.ENDPOINTS &&
                     window.API_CONFIG.ENDPOINTS.TOUR_PROGRESS;
    if (!endpoint || !window.ApiService) return; // silently skip
    window.ApiService.post(
      endpoint,
      payload,
      () => { /* saved silently */ },
      () => { /* error silently ignored */ }
    );
  }
};

class DashboardTour {
  constructor() {
    this.steps = [];
    this.isReady = false;
    this.currentStepIndex = 0;
    this.isActive = false;
    this.overlay = null;
    this.tooltip = null;
    this._actionHandler = null;

    // Bind methods
    this.nextStep  = this.nextStep.bind(this);
    this.prevStep  = this.prevStep.bind(this);
    this.skipTour  = this.skipTour.bind(this);
    this.endTour   = this.endTour.bind(this);

    // Capture phase: block clicks on non-highlighted items during tour
    document.addEventListener('click', (e) => {
      if (this.isActive) {
        const isInsideTooltip   = e.target.closest('.tour-tooltip');
        const isInsideHighlight = e.target.closest('.tour-highlight');
        if (!isInsideTooltip && !isInsideHighlight) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    }, true);
  }

  /* ── Initialisation ───────────────────────────────────────────────── */

  init() {
    if (window.ApiService) {
      const endpoint = window.API_CONFIG &&
                       window.API_CONFIG.ENDPOINTS &&
                       window.API_CONFIG.ENDPOINTS.TOUR;
      window.ApiService.get(
        endpoint,
        (response) => {
          // Only proceed if the API returns a non-empty array of steps
          if (response && Array.isArray(response) && response.length > 0) {
            this.steps = response;
            this.isReady = true;
            this.checkAutoStart();
          }
          // If empty array or invalid format — silently do nothing, tour won't show
        },
        () => {
          // API error — silently do nothing, tour won't show
        }
      );
    }
    // If ApiService not available — silently do nothing

    this.initMenu();
  }

  checkAutoStart() {
    // Auto-start is controlled purely by whether the API returned steps.
    // No localStorage check — the server decides if the tour should show.
    const dashboard = document.getElementById('scene-dashboard');
    if (dashboard) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.startTour();
          observer.disconnect();
        }
      }, { threshold: 0.5 });
      observer.observe(dashboard);
    } else {
      // Dashboard element not ready yet — try after a short delay
      setTimeout(() => this.startTour(), 500);
    }
  }

  initMenu() {
    const menuBtn     = document.getElementById('tour-menu-btn');
    const dropdown    = document.getElementById('tour-dropdown');
    const startTourBtn = document.getElementById('start-tour-btn');

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
      document.addEventListener('click', () => dropdown.classList.remove('show'));
      dropdown.addEventListener('click', (e) => e.stopPropagation());
    }

    if (startTourBtn) {
      startTourBtn.addEventListener('click', () => {
        dropdown.classList.remove('show');
        this.startTour();
      });
    }
  }

  /* ── Progress Tracking (API + local) ─────────────────────────────── */

  trackProgress(stepIndex, status) {
    const payload = {
      userId:     TourAPI.userId,
      viewId:     TourAPI.viewId,
      step:       stepIndex + 1,
      totalSteps: this.steps.length,
      status:     status,
      timestamp:  new Date().toISOString()
    };

    // Silently save to API — errors are suppressed
    TourAPI.saveProgress(payload);
  }

  /* ── Tour Lifecycle ───────────────────────────────────────────────── */

  startTour() {
    if (!this.isReady || this.steps.length === 0) {
      console.warn('[Tour] Data not loaded yet.');
      return;
    }

    let delay = 0;

    const detailBack = document.getElementById('back-to-dash');
    const detailView = document.getElementById('detail-view');
    if (detailBack && detailView && !detailView.classList.contains('hidden')) {
      detailBack.click();
      delay = 800;
    }

    const qmBack = document.getElementById('qm-back-to-dash');
    if (qmBack && !qmBack.classList.contains('hidden')) {
      qmBack.click();
      delay = 800;
    }

    if (delay > 0) {
      setTimeout(() => this._initTourSequence(), delay);
    } else {
      this._initTourSequence();
    }
  }

  _initTourSequence() {
    this.currentStepIndex = 0;
    this.isActive = true;
    if (!this.overlay) this.createOverlay();
    this.showStep();
    this.trackProgress(0, 'started');
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tour-overlay';
    document.body.appendChild(this.overlay);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tour-tooltip glass-card';
    document.body.appendChild(this.tooltip);
  }

  showStep() {
    if (this.currentStepIndex >= this.steps.length) {
      this.endTour('completed');
      return;
    }

    const step          = this.steps[this.currentStepIndex];
    const targetElement = document.querySelector(step.target);

    // Clean up lingering action handler from previous step
    if (this._actionHandler && this.steps[this.currentStepIndex - 1]) {
      const prevTarget = document.querySelector(this.steps[this.currentStepIndex - 1].target);
      if (prevTarget) prevTarget.removeEventListener('click', this._actionHandler);
      this._actionHandler = null;
    }

    this.clearHighlights();

    // ── Welcome / center card ────────────────────────────────────────
    if (step.target === 'center') {
      this.tooltip.classList.add('tour-welcome-card');
      this.renderTooltipHtml(step);
      this.tooltip.style.top       = '50%';
      this.tooltip.style.left      = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      this.tooltip.style.opacity   = '1';
      this.bindTooltipEvents();
      return;
    }

    this.tooltip.classList.remove('tour-welcome-card');
    this.tooltip.style.transform = 'none';

    if (!targetElement) {
      console.warn('[Tour] Target not found:', step.target);
      this.nextStep();
      return;
    }

    // Ensure relative positioning for z-index elevation
    if (window.getComputedStyle(targetElement).position === 'static') {
      targetElement.style.position = 'relative';
      targetElement.dataset.tourPositionSet = 'true';
    }

    // Elevate parent stacking contexts
    let parent = targetElement.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (style.position !== 'static' && style.zIndex !== 'auto') {
        parent.dataset.tourOrigZ = style.zIndex;
        parent.style.zIndex = '2001';
      }
      parent = parent.parentElement;
    }

    targetElement.classList.add('tour-highlight');

    if (step.target !== '#detail-view' && step.target !== '#quick-module-view') {
      targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
    }

    this.renderTooltipHtml(step);

    // Position tooltip
    const rect   = targetElement.getBoundingClientRect();
    const tWidth  = this.tooltip.offsetWidth  || 300;
    const tHeight = this.tooltip.offsetHeight || 150;
    let top = 0, left = 0;

    if (step.position === 'bottom') {
      top  = rect.bottom + 20;
      left = rect.left + rect.width / 2 - tWidth / 2;
    } else if (step.position === 'top') {
      top  = rect.top - tHeight - 20;
      left = rect.left + rect.width / 2 - tWidth / 2;
    } else if (step.position === 'left') {
      top  = rect.top + rect.height / 2 - tHeight / 2;
      left = rect.left - tWidth - 20;
    } else if (step.position === 'right') {
      top  = rect.top + rect.height / 2 - tHeight / 2;
      left = rect.right + 20;
    } else if (step.position === 'center') {
      top  = rect.top + rect.height / 2 - tHeight / 2;
      left = rect.left + rect.width / 2 - tWidth / 2;
    }

    // Clamp to viewport
    if (left < 20)                          left = 20;
    if (left + tWidth  > window.innerWidth) left = window.innerWidth  - tWidth  - 20;
    if (top  < 20)                          top  = 20;
    if (top  + tHeight > window.innerHeight) top = window.innerHeight - tHeight - 20;

    this.tooltip.style.top     = `${top}px`;
    this.tooltip.style.left    = `${left}px`;
    this.tooltip.style.opacity = '1';

    this.bindTooltipEvents();

    // Action-required step: wait for user to click the highlighted element
    if (step.actionRequired) {
      this._actionHandler = () => {
        targetElement.removeEventListener('click', this._actionHandler);
        this._actionHandler = null;
        this.clearHighlights();
        setTimeout(() => this.nextStep(), 800);
      };
      targetElement.addEventListener('click', this._actionHandler);

      // Animated pulse helper
      const pRect   = targetElement.getBoundingClientRect();
      const pointer = document.createElement('div');
      pointer.className = 'tour-pointer-helper';
      pointer.innerHTML = `
        <div class="tour-pulse-ring"></div>
        <div class="tour-pulse-dot"></div>
      `;
      document.body.appendChild(pointer);

      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      pointer.style.top  = `${pRect.top  + scrollY - 10}px`;
      pointer.style.left = `${pRect.right + scrollX - 10}px`;
      this.pointerHelper = pointer;
    }
  }

  /* ── Tooltip Rendering ────────────────────────────────────────────── */


  renderTooltipHtml(step) {
    const isLast  = this.currentStepIndex === this.steps.length - 1;
    const isFirst = this.currentStepIndex === 0;

    // Modern SVG chevron icons
    const iconPrev   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    const iconNext   = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
    const iconFinish = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    const iconSkip   = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    const actionHtml = step.actionRequired
      ? `<p class="tour-action-msg">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           Click the highlighted element to continue
         </p>`
      : '';

    const nextBtnHtml = !step.actionRequired
      ? `<button class="tour-btn" id="tour-next-btn">
           ${isLast ? iconFinish + ' Finish' : 'Next ' + iconNext}
         </button>`
      : '';

    this.tooltip.innerHTML = `
      <div class="tour-header">
        <h3>${step.title}</h3>
        <span class="tour-progress">${this.currentStepIndex + 1} / ${this.steps.length}</span>
      </div>
      <div class="tour-body">
        <p>${step.content}</p>
        ${actionHtml}
      </div>
      <div class="tour-footer">
        <div class="tour-footer-left">
          <button class="tour-btn secondary" id="tour-prev-btn" ${isFirst ? 'disabled' : ''}>
            ${iconPrev} Prev
          </button>
          <button class="tour-btn skip" id="tour-skip-btn" title="Skip tour">
            ${iconSkip} Skip
          </button>
        </div>
        ${nextBtnHtml}
      </div>
    `;
  }


  bindTooltipEvents() {
    const nextBtn = document.getElementById('tour-next-btn');
    const prevBtn = document.getElementById('tour-prev-btn');
    const skipBtn = document.getElementById('tour-skip-btn');

    if (nextBtn) nextBtn.addEventListener('click', this.nextStep);
    if (prevBtn) prevBtn.addEventListener('click', this.prevStep);
    if (skipBtn) skipBtn.addEventListener('click', this.skipTour);
  }

  /* ── Navigation ───────────────────────────────────────────────────── */

  nextStep() {
    this.trackProgress(this.currentStepIndex, 'next_clicked');
    this.currentStepIndex++;
    this.showStep();
  }

  prevStep() {
    this.trackProgress(this.currentStepIndex, 'prev_clicked');
    this.currentStepIndex--;
    this.showStep();
  }

  skipTour() {
    // Track skip with the step where the user bailed out
    this.trackProgress(this.currentStepIndex, 'skipped');
    this.endTour('skipped');
  }

  endTour(status = 'completed') {
    this.isActive = false;
    this.clearHighlights();

    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
    if (this.tooltip) { this.tooltip.remove(); this.tooltip = null; }

    if (status === 'completed') {
      this.trackProgress(this.currentStepIndex, 'completed');
    }
    // For skip: progress already tracked in skipTour()
    // No localStorage — server controls whether the tour shows again
  }

  clearHighlights() {
    if (this.pointerHelper) { this.pointerHelper.remove(); this.pointerHelper = null; }

    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      if (el.dataset.tourPositionSet === 'true') {
        el.style.position = '';
        delete el.dataset.tourPositionSet;
      }
    });

    document.querySelectorAll('[data-tour-orig-z]').forEach(el => {
      el.style.zIndex = el.dataset.tourOrigZ === 'auto' ? '' : el.dataset.tourOrigZ;
      delete el.dataset.tourOrigZ;
    });
  }
}

// Initialise on load
document.addEventListener('DOMContentLoaded', () => {
  window.appTour = new DashboardTour();
  window.appTour.init();
});
