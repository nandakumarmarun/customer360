/**
 * Customer 360 - Mandates Information Module
 * Decoupled integration module for dynamic top-tabbed mandates explorer.
 */
(function () {
  // ── APP STATE ──
  let allAccounts = [];       // Loaded CASA accounts list for left sidebar
  let accountMandates = [];   // Loaded mandates for the selected account
  const configTabs = (window.MANDATES_CONFIG && window.MANDATES_CONFIG.tabs) || [
    { id: "debit-card", title: "Debit Card", icon: "💳", categories: ["Direct Debit", "E-Mandates"] },
    { id: "upi", title: "UPI", icon: "📱", categories: ["UPI"] },
    { id: "nach", title: "NACH", icon: "🏦", categories: ["NACH"] }
  ];
  let activeTab = (configTabs.length > 0) ? configTabs[0].id : "debit-card";
  let selectedAccountId = null; // Currently selected account number (e.g. "5D0100123456789")
  let searchQuery = "";
  let headerRestored = true;

  // ── DYNAMIC CSS STYLES INJECTION ──
  const mandatesStyles = `
    /* Top Tab Bar Styles - Segmented Sliding Capsule */
    .mandates-tab-bar {
      position: relative;
      display: inline-flex;
      align-items: center;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 30px;
      padding: 3px;
      margin-bottom: 12px;
      width: auto;
      box-sizing: border-box;
      flex-shrink: 0;
      overflow: hidden;
    }

    .mandates-tab-btn {
      position: relative;
      z-index: 2;
      background: transparent !important;
      border: none !important;
      color: var(--text);
      opacity: 0.6;
      padding: 6px 20px;
      border-radius: 28px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      transition: all 0.3s ease;
      text-align: center;
      white-space: nowrap;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .mandates-tab-btn:hover {
      color: var(--text);
      opacity: 0.85;
    }

    .mandates-tab-btn.active {
      color: #fff !important;
      opacity: 1 !important;
    }

    .mandates-tab-btn.locked {
      opacity: 0.35 !important;
      cursor: not-allowed !important;
    }

    .mandates-tab-btn.locked:hover {
      opacity: 0.35 !important;
    }

    .mandates-tab-btn.locked::after {
      content: "🔒";
      font-size: 10px;
      margin-left: 2px;
      filter: grayscale(1);
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    .shake-anim {
      animation: shake 0.3s ease-in-out;
    }

    .mandates-toast {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      font-size: 11px;
      font-weight: 600;
      z-index: 100;
      display: flex;
      align-items: center;
      gap: 6px;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      pointer-events: none;
      backdrop-filter: blur(10px);
    }

    .mandates-toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* Moving slider background capsule */
    .tab-slider-pill {
      position: absolute;
      top: 3px;
      left: 3px;
      height: calc(100% - 6px);
      width: 0;
      background: var(--accent);
      border-radius: 26px;
      transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      z-index: 1;
      box-shadow: 0 2px 8px var(--glow-shadow-weak);
    }

    #quick-module-view .qm-content-area {
      padding: 10px 12px !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      flex: 1;
      min-height: 0;
    }

    /* Mandates Layout container */
    .mandates-container {
      display: flex;
      gap: 6px;
      width: 100%;
      flex: 1;
      min-height: 0;
      overflow: hidden;
      animation: mandatesFadeIn 0.4s ease;
      box-sizing: border-box;
    }

    @keyframes mandatesFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .mandates-tree-panel {
      width: 22%;
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      padding: 6px;
      box-sizing: border-box;
      gap: 8px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
      margin-bottom: 0;
    }

    .mandates-details-panel {
      width: 78%;
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      padding: 10px 12px;
      box-sizing: border-box;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
      position: relative;
      margin-bottom: 0;
    }

    .mandates-tree-panel::-webkit-scrollbar, .mandates-details-panel::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .mandates-tree-panel::-webkit-scrollbar-thumb, .mandates-details-panel::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }

    /* Controls & Search */
    .tree-search-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .tree-search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: var(--muted);
      pointer-events: none;
    }

    .tree-search-input {
      width: 100%;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--text);
      padding: 6px 12px 6px 28px;
      font-family: inherit;
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }

    .tree-search-input:focus {
      border-color: var(--accent2);
      box-shadow: 0 0 8px var(--glow-shadow-weak);
    }

    /* Sidebar list item row */
    .mandates-list-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-bottom: 24px;
    }

    .mandates-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
      box-sizing: border-box;
    }

    .mandates-list-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--accent2);
      transform: translateY(-1px);
    }

    .mandates-list-item.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.03)) !important;
      border-color: var(--accent) !important;
      box-shadow: 0 4px 12px var(--glow-shadow-weak);
    }

    .mandates-list-item-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mandates-card-icon {
      font-size: 15px;
      opacity: 0.7;
      transition: all 0.25s ease;
    }

    .mandates-list-item.active .mandates-card-icon {
      opacity: 1;
      color: var(--accent);
      filter: drop-shadow(0 0 4px var(--glow-shadow-weak));
    }

    .mandates-list-item-title {
      font-weight: 700;
      font-size: 13.5px;
      color: var(--text);
      font-family: 'Roboto Mono', monospace;
      letter-spacing: 0.5px;
    }

    .mandates-status-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
      flex-shrink: 0;
    }

    /* Details Panel Styling */
    .mandate-detail-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--muted);
      text-align: center;
      gap: 10px;
    }

    .mandate-detail-empty-icon {
      font-size: 36px;
      opacity: 0.5;
    }

    /* Stacked mandate view */
    .mandates-stacked-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-bottom: 30px;
    }

    .mandate-stacked-card {
      border-bottom: 1px dashed var(--border);
      padding-bottom: 16px;
    }

    .mandate-stacked-card:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .mandate-detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      margin-bottom: 10px;
    }

    .mandate-detail-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mandate-detail-title-wrap h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 800;
      background: linear-gradient(135deg, #fff, var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: 'Outfit', sans-serif;
    }

    .light-mode .mandate-detail-title-wrap h2 {
      background: linear-gradient(135deg, var(--text), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .mandate-detail-id {
      font-family: monospace;
      font-size: 10px;
      color: var(--muted);
      letter-spacing: 0.5px;
    }

    .mandate-section-block {
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
      box-sizing: border-box;
    }

    .mandate-section-block h3 {
      margin-top: 0;
      margin-bottom: 6px;
      font-size: 11.5px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px dashed var(--border);
      padding-bottom: 4px;
    }

    .mandate-fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px;
    }

    .mandate-field-card {
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      box-sizing: border-box;
    }

    .mandate-field-card.full-width {
      grid-column: 1 / -1;
    }

    .mandate-field-lbl {
      font-size: 9px;
      color: var(--muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .mandate-field-val {
      font-size: 11.5px;
      color: var(--text);
      font-weight: 700;
    }

    /* Status Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 8px;
      min-width: 65px;
      text-align: center;
    }

    .status-badge.active {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .status-badge.pending-approval {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }

    .status-badge.suspended {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }

    /* Toast overlay */
    .mandates-toast {
      position: fixed;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent);
      border: 1px solid var(--accent2);
      color: #fff;
      padding: 10px 20px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 13px;
      z-index: 9999;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      transition: bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .mandates-toast.show {
      bottom: 24px;
    }

    @media (max-width: 900px) {
      #quick-module-view .qm-content-area {
        height: auto !important;
        overflow: visible !important;
        flex: none !important;
      }
      .mandates-container {
        flex-direction: column;
        height: auto;
        overflow: visible;
        flex: none;
        min-height: 0;
      }
      .mandates-tree-panel, .mandates-details-panel {
        width: 100%;
        height: auto;
        max-height: 400px;
        margin-bottom: 12px;
      }
    }

    @media (max-width: 480px) {
      .mandates-tab-bar {
        display: flex;
        width: 100%;
      }
      .mandates-tab-btn {
        flex: 1;
        padding: 6px 4px;
        font-size: 11px;
        justify-content: center;
        gap: 4px;
      }
    }
  `;

  // ── INJECT THE CSS ──
  $(function () {
    const $style = $("<style>").text(mandatesStyles);
    $("head").append($style);
  });

  // ── TOAST NOTIFICATION UTILITY ──
  function showToast(message) {
    let $toast = $(".mandates-toast");
    if (!$toast.length) {
      $toast = $("<div class='mandates-toast'></div>");
      $("body").append($toast);
    }
    $toast.text(message);
    $toast.addClass("show");
    setTimeout(() => {
      $toast.removeClass("show");
    }, 2500);
  }

  // ── CUSTOM HEADER RENDERING ──
  function renderMandatesHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("mandates-active")) {
      $header.removeClass("leads-active cases-active holdings-active activities-active").addClass("mandates-active");
      $header.empty();

      const headerHtml = `
        <div class="qm-header-main-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="qm-header-left-wrap" style="display: flex; align-items: center; gap: 15px;">
            <button class="qm-back-btn" title="Back to Profile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" class="arrow-chevron" />
              </svg>
              <span>Go Back</span>
            </button>
            <div class="qm-header-avatar" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--glass2); border: 1px solid var(--border); box-shadow: 0 0 10px var(--glow-shadow); font-size: 22px;">🗄️</div>
            <div class="qm-header-titles" style="display: flex; flex-direction: column;">
              <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: 1px; margin: 0; text-transform: uppercase; font-family: 'Outfit', sans-serif;">CUSTOMER MANDATES</h2>
              <p class="qm-header-subtitle" style="font-size: 13px; color: var(--muted); margin-top: 2px; font-weight: 400; margin-bottom: 0;">Debit Card, UPI & NACH authorization sweeps</p>
            </div>
          </div>
          <div class="qm-header-actions" style="display: flex; align-items: center; gap: 8px;">
            <button class="qm-action-btn" id="refresh-mandates-btn">🔄 Refresh</button>
          </div>
        </div>
      `;
      $header.append(headerHtml);

      $("#qm-breadcrumbs-bar").removeClass("hidden").html(`
        <div class="qm-header-breadcrumbs">
          <a href="#" class="qm-breadcrumb-link" data-action="home">Profile</a>
          <span class="qm-breadcrumb-separator">/</span>
          <span class="qm-breadcrumb-current">Mandates</span>
        </div>
      `);

      // Bind refresh handler
      $("#refresh-mandates-btn").on("click", function () {
        loadMandates();
      });

      headerRestored = false;
    }
  }

  // ── RESTORE DEFAULT HEADER ──
  function restoreDefaultHeader(title) {
    const $header = $(".qm-header-inline");
    if ($header.length && $header.hasClass("mandates-active")) {
      $header.removeClass("mandates-active");
      $header.empty();
      $header.append(`
        <div class="qm-header-main-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="qm-header-left-wrap" style="display: flex; align-items: center; gap: 15px;">
            <button class="qm-back-btn" title="Back to Profile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 18l-6-6 6-6" class="arrow-chevron" />
              </svg>
              <span>Go Back</span>
            </button>
            <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); margin: 0;">${title}</h2>
          </div>
        </div>
      `);
      headerRestored = true;
    }
  }

  // Subscribe to customer ID changes
  if (window.ParamsData) {
    window.ParamsData.subscribe('customerId', function (newCid) {
      const $header = $(".qm-header-inline");
      if ($header.length && $header.hasClass("mandates-active")) {
        loadMandates();
      }
    });
  }

  // ── LOAD MANDATES DATA ──
  function loadMandates() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    // Render loading skeleton layout
    renderSkeletonLayout();

    const customerParam = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
    if (!customerParam) {
      if (window.UIRenderer) {
        window.UIRenderer.showEmptyState("#qm-content");
      } else {
        $content.html("<div style='text-align:center; padding: 40px;'>No active customer ID.</div>");
      }
      return;
    }

    const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.MANDATE_ACCOUNTS; // "/mandateAccounts"
    const params = { customer: customerParam };

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        params,
        function (response) {
          allAccounts = response || [];
          selectedAccountId = null;
          accountMandates = [];

          renderMandatesLayout();

          if (allAccounts.length > 0) {
            selectedAccountId = allAccounts[0];
            renderSidebarList();
            loadMandatesForAccount(selectedAccountId);
          } else {
            renderSidebarList();
            renderMandateDetails();
          }
        },
        function (error) {
          if (window.UIRenderer) {
            window.UIRenderer.showError("#qm-content", error || "Failed to load accounts", function () {
              loadMandates();
            });
          } else {
            $content.html(`
              <div style="text-align:center; padding: 40px;">
                <div style="color:#ef4444; font-weight:600; font-size:14px;">Failed to load accounts: ${escapeHtml(error)}</div>
              </div>
            `);
          }
        }
      );
    } else {
      $content.html("<div style='text-align:center; padding: 40px;'>API Service unavailable.</div>");
    }
  }

  // ── LOAD MANDATES FOR SPECIFIC ACCOUNT ──
  function loadMandatesForAccount(accountId) {
    const $details = $("#mandate-details-area");
    if (!$details.length) return;

    // smooth loading experience - only show spinner on first load, otherwise dim the cards
    const hasContent = $details.find(".mandates-stacked-container, .mandate-detail-empty").length > 0;
    if (!hasContent) {
      $details.html(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--muted); gap: 10px;">
          <div style="width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="font-size: 12px;">Loading mandates...</p>
        </div>
      `);
    } else {
      $details.css({
        "opacity": "0.5",
        "pointer-events": "none",
        "transition": "opacity 0.2s ease"
      });
    }

    const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.MANDATES; // "/mandates"
    const params = { account: accountId };

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        params,
        function (response) {
          accountMandates = response || [];
          renderMandateDetails();
          $details.css({
            "opacity": "1",
            "pointer-events": "auto"
          });
        },
        function (error) {
          $details.css({
            "opacity": "1",
            "pointer-events": "auto"
          });
          $details.html(`
            <div style="text-align:center; padding: 40px;">
              <div style="color:#ef4444; font-weight:600; font-size:12px;">Failed to load mandates: ${escapeHtml(error)}</div>
            </div>
          `);
        }
      );
    }
  }

  // ── SKELETON LAYOUT ──
  function renderSkeletonLayout() {
    const $content = $("#qm-content");
    $content.html(`
      <div class="mandates-tab-bar" style="height: 48px; background: var(--glass2); border-radius: 20px; animation: pulse 1.5s infinite; margin-bottom:16px;"></div>
      <div class="mandates-container">
        <div class="mandates-tree-panel">
          <div style="height: 32px; background: var(--glass2); border: 1px solid var(--border); border-radius: 20px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 60px; background: var(--glass2); border: 1px solid var(--border); border-radius: 8px; margin-top: 10px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 60px; background: var(--glass2); border: 1px solid var(--border); border-radius: 8px; margin-top: 6px; animation: pulse 1.5s infinite;"></div>
        </div>
        <div class="mandates-details-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 20px;">
            <div style="width: 40%; height: 24px; background: var(--glass2); border-radius: 6px; animation: pulse 1.5s infinite;"></div>
            <div style="width: 80px; height: 20px; background: var(--glass2); border-radius: 12px; animation: pulse 1.5s infinite;"></div>
          </div>
          <div style="height: 120px; background: var(--glass2); border: 1px solid var(--border); border-radius: 12px; animation: pulse 1.5s infinite;"></div>
        </div>
      </div>
    `);
  }

  // ── RENDER TWO-COLUMN MANDATES GRID ──
  function renderMandatesLayout() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    let tabsHtml = "";
    configTabs.forEach(t => {
      const isActive = activeTab === t.id;
      const isLocked = t.locked === true;
      tabsHtml += `<button class="mandates-tab-btn ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-tab="${t.id}">${t.icon} ${t.title}</button>`;
    });

    $content.html(`
      <!-- Top Tab Navigation Outside -->
      <div class="mandates-tab-bar">
        <div class="tab-slider-pill"></div>
        ${tabsHtml}
      </div>

      <div class="mandates-container">
        <!-- LEFT COLUMN: Accounts List Panel -->
        <div class="mandates-tree-panel">
          <!-- Search filter input -->
          <div class="tree-search-wrap">
            <span class="tree-search-icon">🔍</span>
            <input type="text" class="tree-search-input" id="tree-search" placeholder="Search accounts..." value="${escapeHtml(searchQuery)}">
          </div>

          <!-- Accounts list container -->
          <div class="mandates-list-container" id="mandates-sidebar-list">
            <!-- Accounts dynamically rendered -->
          </div>
        </div>

        <!-- RIGHT COLUMN: Stacked Details Preview -->
        <div class="mandates-details-panel" id="mandate-details-area">
          <!-- Stacked details cards injected here -->
        </div>
      </div>
    `);

    // Helper to position the iOS-style sliding background pill
    function updateTabSlider(animate = true) {
      const activeBtn = document.querySelector(".mandates-tab-btn.active");
      const slider = document.querySelector(".tab-slider-pill");
      if (activeBtn && slider) {
        // Use native layout offset properties which are not affected by GSAP scaled/skewed transforms during transitions
        const width = activeBtn.offsetWidth;
        const left = activeBtn.offsetLeft;

        if (!animate) {
          slider.style.transition = "none";
        } else {
          slider.style.transition = "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)";
        }

        slider.style.width = width + "px";
        slider.style.left = left + "px";

        if (!animate) {
          // Force layout recalculation
          slider.offsetHeight;
          slider.style.transition = "";
        }
      }
    }

    // Bind UI Event Listeners
    $(".mandates-tab-btn").on("click", function () {
      const tab = $(this).attr("data-tab");
      const tabCfg = configTabs.find(t => t.id === tab);
      if (tabCfg && tabCfg.locked) {
        // Shake feedback
        $(this).addClass("shake-anim");
        setTimeout(() => $(this).removeClass("shake-anim"), 300);

        showLockedToast(`${tabCfg.title} mandates feature is currently locked.`);
        return;
      }
      if (activeTab !== tab) {
        activeTab = tab;
        
        $(".mandates-tab-btn").removeClass("active");
        $(this).addClass("active");
        
        updateTabSlider(true);
        renderMandateDetails();
      }
    });

    $("#tree-search").on("input", function () {
      searchQuery = $(this).val().toLowerCase().trim();
      renderSidebarList();
    });

    // Window resize recalibrates slider layout positions
    $(window).off("resize.mandatesTabs").on("resize.mandatesTabs", function () {
      updateTabSlider(false);
    });

    // Initialize pill coordinates immediately and retry after transitions
    setTimeout(() => {
      updateTabSlider(false);
    }, 50);
    setTimeout(() => {
      updateTabSlider(false);
    }, 200);
    setTimeout(() => {
      updateTabSlider(false);
    }, 450);
    setTimeout(() => {
      updateTabSlider(false);
    }, 850);

    // Watch tab bar container resize/visibility shifts via ResizeObserver to ensure absolute coordinates match
    if (typeof ResizeObserver !== 'undefined') {
      const $bar = $(".mandates-tab-bar");
      if ($bar.length) {
        const ro = new ResizeObserver(() => {
          updateTabSlider(false);
        });
        ro.observe($bar[0]);
      }
    }

    // Initial renders
    renderSidebarList();
    renderMandateDetails();
  }

  // ── RENDER SIDEBAR LIST (ACCOUNTS LIST) ──
  function renderSidebarList() {
    const $list = $("#mandates-sidebar-list");
    if (!$list.length) return;

    $list.empty();

    if (allAccounts.length === 0) {
      $list.html(`<div style="text-align: center; color: var(--muted); padding: 20px 10px; font-size: 12px; font-style: italic;">No active accounts.</div>`);
      return;
    }

    // Filter items based on search query
    const filtered = allAccounts.filter(item => {
      return item.toLowerCase().includes(searchQuery);
    });

    if (filtered.length === 0) {
      $list.html(`<div style="text-align: center; color: var(--muted); padding: 20px 10px; font-size: 12px;">No accounts found</div>`);
      return;
    }

    filtered.forEach(item => {
      const formattedNum = item.replace(/(.{4})/g, '$1 ').trim();
      const isActive = item === selectedAccountId;
      const activeClass = isActive ? "active" : "";

      const itemHtml = `
        <div class="mandates-list-item ${activeClass}" data-id="${escapeHtml(item)}">
          <div class="mandates-list-item-left">
            <span class="mandates-card-icon">💳</span>
            <span class="mandates-list-item-title">${escapeHtml(formattedNum)}</span>
          </div>
          <span class="mandates-status-dot" title="Active Account"></span>
        </div>
      `;

      const $itemEl = $(itemHtml);
      $itemEl.on("click", function () {
        if (selectedAccountId !== item) {
          selectedAccountId = item;
          $(".mandates-list-item").removeClass("active");
          $(this).addClass("active");
          loadMandatesForAccount(selectedAccountId);
        }
      });

      $list.append($itemEl);
    });
  }

  // ── RENDER MANDATES DETAILED LIST (RIGHT PANEL) ──
  function renderMandateDetails() {
    const $details = $("#mandate-details-area");
    if (!$details.length) return;

    const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) || 
                     (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';

    // Filter mandates inside the loaded set by category matching activeTab configuration
    const currentTabCfg = configTabs.find(t => t.id === activeTab);
    const allowedCategories = currentTabCfg && Array.isArray(currentTabCfg.categories) ? currentTabCfg.categories : [];

    const matchingMandates = accountMandates.filter(m => {
      return m.category && allowedCategories.some(cat => 
        m.category.toLowerCase().trim() === cat.toLowerCase().trim()
      );
    });

    if (allAccounts.length === 0) {
      $details.html(`
        <div class="mandate-detail-empty">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" alt="Empty State Animation" />
          <h3>No Accounts Found</h3>
          <p>There are no active bank accounts to query mandates for.</p>
        </div>
      `);
      return;
    }

    if (!selectedAccountId) {
      const currentTabCfg = configTabs.find(t => t.id === activeTab);
      const displayTabName = currentTabCfg ? currentTabCfg.title : activeTab.toUpperCase();
      $details.html(`
        <div class="mandate-detail-empty">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" alt="Empty State Animation" />
          <h3>No Account Selected</h3>
          <p>Please select an active CASA account from the left sidebar to view its associated ${displayTabName.toLowerCase()} mandates.</p>
        </div>
      `);
      return;
    }

    if (matchingMandates.length === 0) {
      const currentTabCfg = configTabs.find(t => t.id === activeTab);
      const displayTabName = currentTabCfg ? currentTabCfg.title : activeTab.toUpperCase();
      $details.html(`
        <div class="mandate-detail-empty">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" alt="Empty State Animation" />
          <h3>No ${displayTabName} Mandates Found</h3>
          <p>There are no active ${displayTabName.toLowerCase()} mandates configured for this account.</p>
        </div>
      `);
      return;
    }

    // Build stacked detail panels
    let stackedHtml = `<div class="mandates-stacked-container">`;

    matchingMandates.forEach(mandate => {
      const badgeClass = mandate.status.toLowerCase().replace(/\s+/g, '-');
      const badgeStyle = getStatusBadgeStyle(mandate.status);
      
      let sectionsHtml = "";
      mandate.sections.forEach(sec => {
        let fieldsHtml = "";
        Object.entries(sec.fields).forEach(([label, val]) => {
          const icon = getFieldIcon(label);
          const isFullWidth = String(val).length > 40 || label.toLowerCase().includes("remark") || label.toLowerCase().includes("signatory");
          fieldsHtml += `
            <div class="mandate-field-card ${isFullWidth ? 'full-width' : ''}">
              <span class="mandate-field-lbl">${icon} ${escapeHtml(label)}</span>
              <span class="mandate-field-val">${escapeHtml(val)}</span>
            </div>
          `;
        });

        sectionsHtml += `
          <div class="mandate-section-block">
            <h3>${escapeHtml(sec.name)}</h3>
            <div class="mandate-fields-grid">
              ${fieldsHtml}
            </div>
          </div>
        `;
      });

      stackedHtml += `
        <div class="mandate-stacked-card">
          <div class="mandate-detail-header">
            <div class="mandate-detail-title-wrap">
              <h2>${escapeHtml(mandate.title)}</h2>
              <span class="mandate-detail-id">MANDATE ID · ${escapeHtml(mandate.id)}</span>
            </div>
            <div>
              <span class="status-badge ${badgeClass}" style="${badgeStyle}">${escapeHtml(mandate.status)}</span>
            </div>
          </div>
          
          <div class="mandate-detail-sections-wrap">
            ${sectionsHtml}
          </div>
        </div>
      `;
    });

    stackedHtml += `</div>`;
    $details.html(stackedHtml);
  }

  // ── BADGE/DOT STYLE HELPERS ──
  function getStatusBadgeStyle(status) {
    switch (status) {
      case "Active":
        return "background: rgba(16, 185, 129, 0.12) !important; color: #10b981 !important; border: 1px solid rgba(16, 185, 129, 0.25) !important;";
      case "Pending Approval":
        return "background: rgba(245, 158, 11, 0.12) !important; color: #f59e0b !important; border: 1px solid rgba(245, 158, 11, 0.25) !important;";
      case "Suspended":
        return "background: rgba(239, 68, 68, 0.12) !important; color: #ef4444 !important; border: 1px solid rgba(239, 68, 68, 0.25) !important;";
      default:
        return "background: var(--glass2) !important; color: var(--text) !important; border: 1px solid var(--border) !important;";
    }
  }

  function getFieldIcon(label) {
    const l = label.toLowerCase();
    if (l.includes("id")) return "🆔";
    if (l.includes("account") || l.includes("linked")) return "💳";
    if (l.includes("frequency")) return "🔄";
    if (l.includes("limit") || l.includes("amount")) return "💰";
    if (l.includes("vendor") || l.includes("recipient")) return "🏢";
    if (l.includes("date")) return "📅";
    if (l.includes("authorized") || l.includes("approv")) return "👤";
    if (l.includes("remark")) return "📝";
    if (l.includes("sign")) return "✍️";
    return "🔹";
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Show interactive locked features toast
  function showLockedToast(message) {
    let $toast = $(".mandates-toast");
    if (!$toast.length) {
      $toast = $(`<div class="mandates-toast"><span>🔒</span> <span class="toast-msg"></span></div>`);
      $("#qm-content").append($toast);
    }
    $toast.find(".toast-msg").text(message);
    $toast.addClass("show");
    
    clearTimeout(window.mandatesToastTimeout);
    window.mandatesToastTimeout = setTimeout(() => {
      $toast.removeClass("show");
    }, 2500);
  }

  // ── MUTATIONOBSERVER & EVENT LISTENER ON QUICK MODULE TITLES ──
  $(function () {
    function checkTitle(text) {
      if (!text) return;
      if (text === "Mandates Module" || text === "Mandates") {
        renderMandatesHeader();
        loadMandates();
      } else if (text !== "" && !text.includes("CUSTOMER MANDATES") && !headerRestored) {
        restoreDefaultHeader(text);
      }
    }

    $(document).on("quickModuleChanged", function (e, title) {
      checkTitle(title);
    });

    const headerNode = document.querySelector(".qm-header-inline");
    if (headerNode) {
      const observer = new MutationObserver(function () {
        const text = $("#qm-title").text().trim();
        checkTitle(text);
      });
      observer.observe(headerNode, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }
  });
})();
