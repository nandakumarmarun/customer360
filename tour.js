/* tour.js - Guided Tour functionality */

const TourAPI = {
  endpoint: '/api/tour/track',
  userId: 'user_123', // Placeholder
  viewId: 'DASHBOARD_VIEW'
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
    this.nextStep = this.nextStep.bind(this);
    this.prevStep = this.prevStep.bind(this);
    this.endTour = this.endTour.bind(this);
  }

  init() {
    // Fetch tour data from the backend
    if (window.ApiService) {
      window.ApiService.get('/tour', 
        (response) => {
          if (response && Array.isArray(response)) {
            this.steps = response;
            this.isReady = true;
            this.checkAutoStart();
          } else {
            console.error('Invalid tour data format received.');
          }
        },
        (error) => {
          console.error('Failed to fetch tour data:', error);
        }
      );
    } else {
      console.error('ApiService not available for tour data fetch.');
    }
    
    // Initialize three-dot menu listener
    this.initMenu();
  }

  checkAutoStart() {
    // Check if tour was already completed
    if (!localStorage.getItem('dashboard_tour_completed')) {
      // Use IntersectionObserver to only auto-start when dashboard is visible
      const dashboard = document.getElementById('scene-dashboard');
      if (dashboard) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this.startTour();
            observer.disconnect();
          }
        }, { threshold: 0.5 });
        observer.observe(dashboard);
      }
    }
  }
  
  initMenu() {
    const menuBtn = document.getElementById('tour-menu-btn');
    const dropdown = document.getElementById('tour-dropdown');
    const startTourBtn = document.getElementById('start-tour-btn');
    
    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });
      
      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
      
      dropdown.addEventListener('click', (e) => e.stopPropagation());
    }
    
    if (startTourBtn) {
      startTourBtn.addEventListener('click', () => {
        dropdown.classList.remove('show');
        this.startTour();
      });
    }
  }

  async trackProgress(stepIndex, status = 'in_progress') {
    const payload = {
      userId: TourAPI.userId,
      viewId: TourAPI.viewId,
      step: stepIndex + 1,
      totalSteps: this.steps.length,
      status: status,
      time: new Date().toISOString()
    };
    
    console.log('Tracking Tour Progress:', payload);
    
    try {
      // Mock AJAX call (replace with actual fetch later)
      // await fetch(TourAPI.endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
    } catch (e) {
      console.error('Failed to track tour progress', e);
    }
  }

  startTour() {
    if (!this.isReady || this.steps.length === 0) {
      console.warn('Tour data is not loaded yet.');
      return;
    }
    
    let delay = 0;
    
    // Safely reset the application to the main dashboard if it was deeply nested
    const detailBack = document.getElementById('back-to-dash');
    const detailView = document.getElementById('detail-view');
    if (detailBack && detailView && !detailView.classList.contains('hidden')) {
      detailBack.click();
      delay = 800; // Allow transition
    }
    
    const qmBack = document.getElementById('qm-back-to-dash');
    if (qmBack && !qmBack.classList.contains('hidden')) {
      qmBack.click();
      delay = 800; // Allow transition
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

    const step = this.steps[this.currentStepIndex];
    const targetElement = document.querySelector(step.target);
    
    // Clean up any lingering action handlers
    if (this._actionHandler && this.steps[this.currentStepIndex - 1]) {
      const prevTarget = document.querySelector(this.steps[this.currentStepIndex - 1].target);
      if (prevTarget) prevTarget.removeEventListener('click', this._actionHandler);
      this._actionHandler = null;
    }
    
    // Reset all highlights and positions
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      if (el.dataset.tourPositionSet === 'true') {
        el.style.position = '';
        delete el.dataset.tourPositionSet;
      }
    });
    
    // Reset all parent z-indexes
    document.querySelectorAll('[data-tour-orig-z]').forEach(el => {
      el.style.zIndex = el.dataset.tourOrigZ === 'auto' ? '' : el.dataset.tourOrigZ;
      delete el.dataset.tourOrigZ;
    });
    
    // Handle Center Welcome Card
    if (step.target === 'center') {
      this.tooltip.classList.add('tour-welcome-card');
      this.renderTooltipHtml(step);
      
      this.tooltip.style.top = '50%';
      this.tooltip.style.left = '50%';
      this.tooltip.style.transform = 'translate(-50%, -50%)';
      this.tooltip.style.opacity = '1';
      
      this.bindTooltipEvents();
      return;
    }

    this.tooltip.classList.remove('tour-welcome-card');
    this.tooltip.style.transform = 'none';

    if (!targetElement) {
      console.warn('Tour target not found:', step.target);
      this.nextStep();
      return;
    }

    // Handle position for highlight z-index
    if (window.getComputedStyle(targetElement).position === 'static') {
      targetElement.style.position = 'relative';
      targetElement.dataset.tourPositionSet = 'true';
    }
    
    // Elevate parent stacking contexts to ensure element sits above overlay
    let parent = targetElement.parentElement;
    while(parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      if (style.position !== 'static' && style.zIndex !== 'auto') {
        parent.dataset.tourOrigZ = style.zIndex;
        parent.style.zIndex = '2001';
      }
      parent = parent.parentElement;
    }

    // Highlight target
    targetElement.classList.add('tour-highlight');
    
    // Instantly jump to target so we can accurately calculate bounds for fixed positioning
    if (step.target !== '#detail-view' && step.target !== '#quick-module-view') {
      targetElement.scrollIntoView({ behavior: 'auto', block: 'center' });
    }

    this.renderTooltipHtml(step);

    // Position tooltip using actual dynamic dimensions
    const rect = targetElement.getBoundingClientRect();
    const tWidth = this.tooltip.offsetWidth || 300;
    const tHeight = this.tooltip.offsetHeight || 150;
    let top = 0, left = 0;

    if (step.position === 'bottom') {
      top = rect.bottom + 20;
      left = rect.left + (rect.width / 2) - (tWidth / 2);
    } else if (step.position === 'top') {
      top = rect.top - tHeight - 20;
      left = rect.left + (rect.width / 2) - (tWidth / 2);
    } else if (step.position === 'left') {
      top = rect.top + (rect.height / 2) - (tHeight / 2);
      left = rect.left - tWidth - 20;
    } else if (step.position === 'right') {
      top = rect.top + (rect.height / 2) - (tHeight / 2);
      left = rect.right + 20;
    } else if (step.position === 'center') {
      top = rect.top + (rect.height / 2) - (tHeight / 2);
      left = rect.left + (rect.width / 2) - (tWidth / 2);
    }
    
    // Robust bounds checking to ensure tooltip NEVER goes offscreen
    if (left < 20) left = 20;
    if (left + tWidth > window.innerWidth) left = window.innerWidth - tWidth - 20;
    if (top < 20) top = 20;
    if (top + tHeight > window.innerHeight) top = window.innerHeight - tHeight - 20;

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.opacity = '1';

    this.bindTooltipEvents();

    if (step.actionRequired) {
      this._actionHandler = () => {
        targetElement.removeEventListener('click', this._actionHandler);
        this._actionHandler = null;
        setTimeout(() => this.nextStep(), 800); // Wait 800ms for heavy layout animations
      };
      targetElement.addEventListener('click', this._actionHandler);
    }
  }

  renderTooltipHtml(step) {
    let actionHtml = '';
    let nextBtnHtml = '';
    
    if (step.actionRequired) {
      actionHtml = '<p class="tour-action-msg" style="color:var(--accent); font-weight:bold; margin-top:8px;">👉 Please click the highlighted component to continue.</p>';
    } else {
      nextBtnHtml = `<button class="tour-btn" id="tour-next-btn">${this.currentStepIndex === this.steps.length - 1 ? 'Finish' : 'Next'}</button>`;
    }

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
        <button class="tour-btn secondary" id="tour-prev-btn" ${this.currentStepIndex === 0 ? 'disabled' : ''}>Previous</button>
        ${nextBtnHtml}
      </div>
    `;
  }

  bindTooltipEvents() {
    // Event listeners
    const nextBtn = document.getElementById('tour-next-btn');
    const prevBtn = document.getElementById('tour-prev-btn');
    
    if (nextBtn) nextBtn.addEventListener('click', this.nextStep);
    if (prevBtn) prevBtn.addEventListener('click', this.prevStep);
  }

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

  endTour(status = 'completed') {
    this.isActive = false;
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
      if (el.dataset.tourPositionSet === 'true') {
        el.style.position = '';
        delete el.dataset.tourPositionSet;
      }
    });
    
    // Reset all parent z-indexes
    document.querySelectorAll('[data-tour-orig-z]').forEach(el => {
      el.style.zIndex = el.dataset.tourOrigZ === 'auto' ? '' : el.dataset.tourOrigZ;
      delete el.dataset.tourOrigZ;
    });
    
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    
    this.trackProgress(this.currentStepIndex, status);
    
    if (status === 'completed') {
      localStorage.setItem('dashboard_tour_completed', 'true');
    }
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.appTour = new DashboardTour();
  window.appTour.init();
});
