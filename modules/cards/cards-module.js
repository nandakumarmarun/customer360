/**
 * Customer 360 - Cards Information Module
 * Uses CASA endpoints (`/mandateAccounts` and `/casaCards`) to display accounts & debit card details.
 */
(function () {
  // ── APP STATE ──
  let allAccounts = [];       // Loaded accounts list for left sidebar
  let accountCards = [];      // Loaded debit cards for the selected account
  const configTabs = (window.CARDS_CONFIG && window.CARDS_CONFIG.tabs) || [
    { id: "debit-card", title: "Debit Card", icon: "💳" },
    { id: "credit-card", title: "Credit Card", icon: "💳", locked: true }
  ];
  let activeTab = (configTabs.length > 0) ? configTabs[0].id : "debit-card";
  let selectedAccountId = null; // Currently selected account number (e.g. "5D0100123456789")
  let searchQuery = "";
  let headerRestored = true;

  // ── DYNAMIC CSS STYLES INJECTION ──
  const cardsStyles = `
    /* Top Tab Bar Styles - Segmented Sliding Capsule */
    .cards-tab-bar {
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

    .cards-tab-btn {
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

    .cards-tab-btn:hover {
      color: var(--text);
      opacity: 0.85;
    }

    .cards-tab-btn.active {
      color: #fff !important;
      opacity: 1 !important;
    }

    .cards-tab-btn.locked {
      opacity: 0.35 !important;
      cursor: not-allowed !important;
    }

    .cards-tab-btn.locked:hover {
      opacity: 0.35 !important;
    }

    .cards-tab-btn.locked::after {
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

    .cards-toast {
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

    .cards-toast.show {
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

    /* Cards Layout container */
    .cards-container {
      display: flex;
      gap: 6px;
      width: 100%;
      flex: 1;
      min-height: 0;
      box-sizing: border-box;
      overflow: hidden;
    }

    /* Left Sidebar: Tree / Accounts Panel */
    .cards-tree-panel {
      width: 270px;
      min-width: 270px;
      max-width: 270px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 10px;
      box-sizing: border-box;
      height: 100%;
      overflow: hidden;
    }

    .tree-search-wrap {
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    .tree-search-input {
      width: 100%;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 6px 12px 6px 30px;
      font-size: 11.5px;
      color: var(--text);
      outline: none;
      transition: all 0.25s ease;
      box-sizing: border-box;
      font-family: inherit;
    }

    .tree-search-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 8px var(--glow-shadow-weak);
    }

    .tree-search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 11px;
      color: var(--muted);
      pointer-events: none;
    }

    .cards-list-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
      overflow-y: auto;
      flex: 1;
      padding-right: 2px;
    }

    .cards-list-container::-webkit-scrollbar {
      width: 4px;
    }
    .cards-list-container::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }

    .cards-list-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding: 10px 12px;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
      box-sizing: border-box;
    }

    .cards-list-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--accent2);
      transform: translateY(-1px);
    }

    .cards-list-item.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.03)) !important;
      border-color: var(--accent) !important;
      box-shadow: 0 4px 12px var(--glow-shadow-weak);
    }

    .cards-list-item-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cards-card-icon {
      font-size: 15px;
      opacity: 0.7;
      transition: all 0.25s ease;
    }

    .cards-list-item.active .cards-card-icon {
      opacity: 1;
      color: var(--accent);
      filter: drop-shadow(0 0 4px var(--glow-shadow-weak));
    }

    .cards-list-item-title {
      font-weight: 700;
      font-size: 13px;
      color: var(--text);
      font-family: 'Roboto Mono', monospace;
      letter-spacing: 0.5px;
    }

    .cards-status-dot {
      width: 6px;
      height: 6px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
      flex-shrink: 0;
    }

    /* Right Column Details Panel */
    .cards-details-panel {
      flex: 1;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      box-sizing: border-box;
      height: 100%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .cards-details-panel::-webkit-scrollbar {
      width: 5px;
    }
    .cards-details-panel::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }

    .cards-detail-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--muted);
      text-align: center;
      gap: 10px;
    }

    /* Card Details Sections - matching CASA in Holdings */
    .detail-section-block {
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 12px;
      box-sizing: border-box;
    }

    .detail-fields-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
      gap: 1px;
    }

    .detail-field-card {
      background: var(--bg2);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-sizing: border-box;
    }

    .detail-field-card.full-width {
      grid-column: 1 / -1;
    }

    .df-label {
      font-size: 11px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 2px;
      font-weight: 600;
    }

    .df-value {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }

    .card-img-container {
      width: 100%;
      max-width: 100%;
      height: 180px;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      margin: 4px 0;
    }

    .card-img-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 6px;
    }

    @media (max-width: 900px) {
      #quick-module-view .qm-content-area {
        height: auto !important;
        overflow: visible !important;
        flex: none !important;
      }
      .cards-container {
        flex-direction: column !important;
        height: auto !important;
        overflow: visible !important;
      }
      .cards-tree-panel {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        height: 220px !important;
      }
      .cards-details-panel {
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
      }
      .detail-fields-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  // Inject CSS dynamically into DOM
  function injectCardsStyles() {
    if (!document.getElementById("cards-dynamic-styles")) {
      const styleEl = document.createElement("style");
      styleEl.id = "cards-dynamic-styles";
      styleEl.textContent = cardsStyles;
      document.head.appendChild(styleEl);
    }
  }

  // ── HELPER: IMAGE RESOLUTION ──
  function byteArrayToBase64(byteArray) {
    let binary = '';
    const bytes = new Uint8Array(byteArray);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  function resolveImageSrc(image) {
    if (!image) return '';
    if (typeof image === 'string') {
      const trimmed = image.trim();
      if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('assets/') || trimmed.startsWith('/') || trimmed.startsWith('./')) {
        return trimmed;
      }
      return 'data:image/png;base64,' + trimmed;
    }
    if (image instanceof Blob || image instanceof File) {
      return URL.createObjectURL(image);
    }
    if (Array.isArray(image)) {
      try {
        return 'data:image/png;base64,' + byteArrayToBase64(image);
      } catch (e) {
        return '';
      }
    }
    if (image.buffer || image.byteLength) {
      try {
        return 'data:image/png;base64,' + arrayBufferToBase64(image);
      } catch (e) {
        return '';
      }
    }
    if (typeof image === 'object') {
      const srcVal = image.href || image.base64 || image.data || image.bytes;
      if (srcVal) {
        return resolveImageSrc(srcVal);
      }
    }
    return '';
  }

  function renderCardImage(image) {
    if (!image) return '';
    const src = resolveImageSrc(image);
    if (!src) return '';
    const alt = (image && image.alt) || 'Card image';
    return `<img class="card-image" src="${src}" alt="${alt}" loading="lazy" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 6px;" />`;
  }

  function getLocalFieldIcon(label) {
    const l = (label || "").toLowerCase();
    if (l.includes("phone") || l.includes("mobile") || l.includes("tel")) return "📞";
    if (l.includes("email") || l.includes("mail")) return "✉️";
    if (l.includes("address") || l.includes("street") || l.includes("city") || l.includes("state") || l.includes("country")) return "📍";
    if (l.includes("holder") || l.includes("name") || l.includes("user")) return "👤";
    if (l.includes("card") || l.includes("type")) return "💳";
    if (l.includes("status")) return "🏷️";
    if (l.includes("limit") || l.includes("atm") || l.includes("pos") || l.includes("amount") || l.includes("balance")) return "💰";
    if (l.includes("date") || l.includes("expiry") || l.includes("valid")) return "📅";
    if (l.includes("number") || l.includes("id")) return "📄";
    return "🔹";
  }

  // ── RENDER CUSTOM HEADER ──
  function renderCardsHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("cards-active")) {
      $header
        .removeClass("leads-active cases-active holdings-active activities-active mandates-active")
        .addClass("cards-active");
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
            <div class="qm-header-avatar" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--glass2); border: 1px solid var(--border); box-shadow: 0 0 10px var(--glow-shadow); font-size: 22px;">💳</div>
            <div class="qm-header-titles" style="display: flex; flex-direction: column;">
              <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: 1px; margin: 0; text-transform: uppercase; font-family: 'Outfit', sans-serif;">CUSTOMER CARDS</h2>
              <p class="qm-header-subtitle" style="font-size: 13px; color: var(--muted); margin-top: 2px; font-weight: 400; margin-bottom: 0;">Debit Card & Credit Card linked accounts</p>
            </div>
          </div>
          <div class="qm-header-actions" style="display: flex; align-items: center; gap: 8px;">
            <button class="qm-action-btn" id="refresh-cards-btn">🔄 Refresh</button>
          </div>
        </div>
      `;
      $header.append(headerHtml);

      $("#qm-breadcrumbs-bar").removeClass("hidden").html(`
        <div class="qm-header-breadcrumbs">
          <a href="#" class="qm-breadcrumb-link" data-action="home">Profile</a>
          <span class="qm-breadcrumb-separator">/</span>
          <span class="qm-breadcrumb-current">Cards</span>
        </div>
      `);

      // Bind refresh handler
      $("#refresh-cards-btn").on("click", function () {
        loadCardsModule();
      });

      headerRestored = false;
    }
  }

  // ── RESTORE DEFAULT HEADER WHEN LEAVING MODULE ──
  function restoreDefaultHeader(title) {
    const $header = $(".qm-header-inline");
    if ($header.length && $header.hasClass("cards-active")) {
      $header.removeClass("cards-active");
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

  // ── LOCKED TOAST FEEDBACK ──
  function showLockedToast(msg) {
    let $toast = $(".cards-toast");
    if (!$toast.length) {
      $toast = $(`<div class="cards-toast"><span>🔒</span> <span>${msg}</span></div>`);
      $("#qm-content").append($toast);
    } else {
      $toast.html(`<span>🔒</span> <span>${msg}</span>`);
    }

    $toast.addClass("show");
    setTimeout(() => {
      $toast.removeClass("show");
    }, 2500);
  }

  // ── MAIN ENTRY: LOAD ACCOUNTS USING MANDATE_ACCOUNTS API ──
  function loadCardsModule() {
    injectCardsStyles();
    renderSkeletonLayout();

    const cid = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
    const $content = $("#qm-content");

    if (!cid) {
      if (window.UIRenderer) {
        window.UIRenderer.showEmptyState("#qm-content");
      } else {
        $content.html("<div style='text-align:center; padding: 40px;'>No active customer selected.</div>");
      }
      return;
    }

    // Load available account numbers string list from /mandateAccounts endpoint
    const endpoint = (window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.MANDATE_ACCOUNTS) || "/mandateAccounts";
    const params = { customerId: cid };

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        params,
        function (response) {
          const rawList = Array.isArray(response) ? response : [];
          allAccounts = rawList.map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.number || item.accountNumber || item.account || item.id || "";
            }
            return String(item);
          }).filter(acc => acc && acc.trim() !== "");

          selectedAccountId = null;
          accountCards = [];

          renderCardsLayout();

          if (allAccounts.length > 0) {
            selectedAccountId = allAccounts[0];
            renderSidebarList();
            loadCardsForAccount(selectedAccountId);
          } else {
            renderSidebarList();
            renderCardDetails();
          }
        },
        function (error) {
          if (window.UIRenderer) {
            window.UIRenderer.showError("#qm-content", error || "Failed to load accounts", function () {
              loadCardsModule();
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

  // ── LOAD CARDS FOR SPECIFIC ACCOUNT USING CASA CARDS ENDPOINT ──
  function loadCardsForAccount(accountId) {
    const $details = $("#cards-details-area");
    if (!$details.length) return;

    const hasContent = $details.find(".cards-cards-container, .cards-detail-empty, .detail-section-block").length > 0;
    if (!hasContent) {
      $details.html(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--muted); gap: 10px;">
          <div style="width: 30px; height: 30px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <p style="font-size: 12px;">Loading debit cards...</p>
        </div>
      `);
    } else {
      $details.css({
        "opacity": "0.5",
        "pointer-events": "none",
        "transition": "opacity 0.2s ease"
      });
    }

    // Exact same API endpoint used in CASA in Holdings (`/casaCards`)
    const endpoint = (window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.HOLDINGS_CASA_CARDS) || "/casaCards";
    const params = { accountNumber: accountId };

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        params,
        function (response) {
          accountCards = Array.isArray(response) ? response : [];
          renderCardDetails();
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
              <div style="color:#ef4444; font-weight:600; font-size:12px;">Failed to load cards: ${escapeHtml(error)}</div>
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
      <div class="cards-tab-bar" style="height: 48px; background: var(--glass2); border-radius: 20px; animation: pulse 1.5s infinite; margin-bottom:16px;"></div>
      <div class="cards-container">
        <div class="cards-tree-panel">
          <div style="height: 32px; background: var(--glass2); border: 1px solid var(--border); border-radius: 20px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 60px; background: var(--glass2); border: 1px solid var(--border); border-radius: 8px; margin-top: 10px; animation: pulse 1.5s infinite;"></div>
          <div style="height: 60px; background: var(--glass2); border: 1px solid var(--border); border-radius: 8px; margin-top: 6px; animation: pulse 1.5s infinite;"></div>
        </div>
        <div class="cards-details-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 20px;">
            <div style="width: 40%; height: 24px; background: var(--glass2); border-radius: 6px; animation: pulse 1.5s infinite;"></div>
            <div style="width: 80px; height: 20px; background: var(--glass2); border-radius: 12px; animation: pulse 1.5s infinite;"></div>
          </div>
          <div style="height: 120px; background: var(--glass2); border: 1px solid var(--border); border-radius: 12px; animation: pulse 1.5s infinite;"></div>
        </div>
      </div>
    `);
  }

  // ── RENDER TWO-COLUMN CARDS GRID ──
  function renderCardsLayout() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    let tabsHtml = "";
    configTabs.forEach(t => {
      const isActive = activeTab === t.id;
      const isLocked = t.locked === true;
      tabsHtml += `<button class="cards-tab-btn ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-tab="${t.id}">${t.icon} ${t.title}</button>`;
    });

    $content.html(`
      <!-- Top Tab Navigation Outside -->
      <div class="cards-tab-bar">
        <div class="tab-slider-pill"></div>
        ${tabsHtml}
      </div>

      <div class="cards-container">
        <!-- LEFT COLUMN: Accounts List Panel -->
        <div class="cards-tree-panel">
          <!-- Search filter input -->
          <div class="tree-search-wrap">
            <span class="tree-search-icon">🔍</span>
            <input type="text" class="tree-search-input" id="tree-search" placeholder="Search accounts..." value="${escapeHtml(searchQuery)}">
          </div>

          <!-- Accounts list container -->
          <div class="cards-list-container" id="cards-sidebar-list">
            <!-- Accounts dynamically rendered -->
          </div>
        </div>

        <!-- RIGHT COLUMN: Stacked Details Preview (Direct Card Details) -->
        <div class="cards-details-panel" id="cards-details-area">
          <!-- Card details injected here -->
        </div>
      </div>
    `);

    // Helper to position the sliding background pill
    function updateTabSlider(animate = true) {
      const activeBtn = document.querySelector(".cards-tab-btn.active");
      const slider = document.querySelector(".tab-slider-pill");
      if (activeBtn && slider) {
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
          slider.offsetHeight;
          slider.style.transition = "";
        }
      }
    }

    // Bind UI Event Listeners
    $(".cards-tab-btn").on("click", function () {
      const tab = $(this).attr("data-tab");
      const tabCfg = configTabs.find(t => t.id === tab);
      if (tabCfg && tabCfg.locked) {
        $(this).addClass("shake-anim");
        setTimeout(() => $(this).removeClass("shake-anim"), 300);
        showLockedToast(`${tabCfg.title} feature is currently locked.`);
        return;
      }
      if (activeTab !== tab) {
        activeTab = tab;

        $(".cards-tab-btn").removeClass("active");
        $(this).addClass("active");

        updateTabSlider(true);
        renderCardDetails();
      }
    });

    $("#tree-search").on("input", function () {
      searchQuery = $(this).val().toLowerCase().trim();
      renderSidebarList();
    });

    $(window).off("resize.cardsTabs").on("resize.cardsTabs", function () {
      updateTabSlider(false);
    });

    setTimeout(() => updateTabSlider(false), 50);
    setTimeout(() => updateTabSlider(false), 200);
    setTimeout(() => updateTabSlider(false), 450);

    if (typeof ResizeObserver !== 'undefined') {
      const $bar = $(".cards-tab-bar");
      if ($bar.length) {
        const ro = new ResizeObserver(() => updateTabSlider(false));
        ro.observe($bar[0]);
      }
    }

    // Initial renders
    renderSidebarList();
    renderCardDetails();
  }

  // ── RENDER SIDEBAR LIST (ACCOUNT NUMBERS STRING LIST) ──
  function renderSidebarList() {
    const $list = $("#cards-sidebar-list");
    if (!$list.length) return;

    $list.empty();

    if (allAccounts.length === 0) {
      $list.html(`<div style="text-align: center; color: var(--muted); padding: 20px 10px; font-size: 12px; font-style: italic;">No active accounts.</div>`);
      return;
    }

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
        <div class="cards-list-item ${activeClass}" data-id="${escapeHtml(item)}">
          <div class="cards-list-item-left">
            <span class="cards-card-icon">💳</span>
            <span class="cards-list-item-title">${escapeHtml(formattedNum)}</span>
          </div>
          <span class="cards-status-dot" title="Active Account"></span>
        </div>
      `;

      const $itemEl = $(itemHtml);
      $itemEl.on("click", function () {
        if (selectedAccountId !== item) {
          selectedAccountId = item;
          $(".cards-list-item").removeClass("active");
          $(this).addClass("active");
          loadCardsForAccount(selectedAccountId);
        }
      });

      $list.append($itemEl);
    });
  }

  // ── RENDER CARD DETAILS (MATCHING CASA IN HOLDINGS) ──
  function renderCardDetails() {
    const $details = $("#cards-details-area");
    if (!$details.length) return;

    const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) ||
      (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';

    if (allAccounts.length === 0) {
      $details.html(`
        <div class="cards-detail-empty">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" alt="Empty State Animation" />
          <h3>No Accounts Found</h3>
          <p>There are no active bank accounts to query cards for.</p>
        </div>
      `);
      return;
    }

    if (!selectedAccountId) {
      $details.html(`
        <div class="cards-detail-empty">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" alt="Empty State Animation" />
          <h3>No Account Selected</h3>
          <p>Please select an account from the left sidebar to view its linked debit card details.</p>
        </div>
      `);
      return;
    }

    if (accountCards.length === 0) {
      $details.html(`
        <div class="cards-detail-empty">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" alt="Empty State Animation" />
          <h3>No Cards Linked</h3>
          <p>No active debit cards are linked to account ${escapeHtml(selectedAccountId)}.</p>
        </div>
      `);
      return;
    }

    // Build Cards View exactly matching CASA in Holdings
    let cardsHtml = '<div class="cards-cards-container" style="display: flex; flex-direction: column; gap: 14px; padding: 2px;">';

    accountCards.forEach(card => {
      let cardFieldsHtml = '';
      let totalSpan = 0;

      // Render card image inside a cell of the detail fields grid
      if (card.image) {
        const imgTag = renderCardImage(card.image);
        if (imgTag) {
          totalSpan += 2; // card image spans full-width
          cardFieldsHtml += `
            <div class="detail-field-card full-width" style="padding: 10px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px;">
              <label class="df-label" style="font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
                <span class="df-icon-inline">🖼️</span> Card Design
              </label>
              <div class="card-img-container">
                ${imgTag}
              </div>
            </div>
          `;
        }
      }

      if (card.fields) {
        Object.entries(card.fields).forEach(([k, v]) => {
          const valStr = String(v);
          const icon = getLocalFieldIcon(k);
          let isFullWidth = k.toLowerCase().includes("address") || k.toLowerCase().includes("details") || k.toLowerCase().includes("remarks");
          if (!isFullWidth && window.UIRenderer && typeof window.UIRenderer.calculateTextSpan === 'function') {
            isFullWidth = window.UIRenderer.calculateTextSpan(valStr, 180, "600 12px 'Outfit', sans-serif") > 1;
          } else if (!isFullWidth) {
            isFullWidth = valStr.length > 25;
          }

          const span = isFullWidth ? 2 : 1;
          totalSpan += span;

          cardFieldsHtml += `
            <div class="detail-field-card ${isFullWidth ? 'full-width' : ''}">
              <div class="df-info">
                <label class="df-label">
                  <span class="df-icon-inline">${icon}</span> ${escapeHtml(k)}
                </label>
                <span class="df-value" style="display: block;">${escapeHtml(valStr)}</span>
              </div>
            </div>
          `;
        });
      }

      const remainder = totalSpan % 2;
      if (remainder !== 0) {
        cardFieldsHtml += `
          <div class="detail-field-card empty-placeholder"></div>
        `;
      }

      cardsHtml += `
        <div class="detail-section-block glass-card">
          <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 12px;">
            <span style="font-size: 20px;">💳</span>
            <div style="display: flex; flex-direction: column; text-align: left;">
              <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: var(--accent2); text-transform: uppercase; letter-spacing: 1px; font-family: 'Outfit', sans-serif;">${escapeHtml(card.title || card.name || "Debit Card")}</h3>
              <span style="font-size: 11px; color: var(--muted); font-family: monospace;">${escapeHtml(card.subtitle || card.number || "")}</span>
            </div>
          </div>
          <div class="detail-fields-grid">
            ${cardFieldsHtml}
          </div>
        </div>
      `;
    });

    cardsHtml += '</div>';
    $details.html(cardsHtml);
  }

  // ── MUTATIONOBSERVER & EVENT LISTENER ON QUICK ACCESS TITLE ──
  $(function () {
    function checkTitle(text) {
      if (!text) return;
      const clean = text.toLowerCase().trim();
      if (clean.includes("card")) {
        const wasActive = $(".qm-header-inline").hasClass("cards-active");
        renderCardsHeader();
        if (!wasActive || !$(".cards-container").length) {
          loadCardsModule();
        }
      } else if (text !== "" && !clean.includes("card") && !headerRestored) {
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

  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
