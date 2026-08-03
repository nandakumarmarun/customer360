/**
 * Customer 360 - Holdings Information Module
 * Decoupled integration module that handles dynamic rendering of client portfolio holdings
 * inside the main dashboard's quick access module view (#quick-module-view / #qm-content).
 * Registers and hooks itself dynamically, matching the pattern used by Cases and Leads.
 */
(function () {
  // Module State
  let currentCustomerId = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
  let holdingsData = null;
  let headerRestored = true;

  // Helper for dynamic field mapping fallback in case window.fieldName is not loaded
  const fName = (window.fieldName || window.fieldName2 || function (k) { return k; });

  // Helper to convert byte array to base64
  function byteArrayToBase64(arr) {
    let binary = '';
    const len = arr.length;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return window.btoa(binary);
  }

  // Helper to convert ArrayBuffer/TypedArray to base64
  function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Resolve image source dynamically (supports URL, base64, raw bytes)
  function resolveImageSrc(image) {
    if (!image) return '';
    
    // If image is a string directly
    if (typeof image === 'string') {
      const trimmed = image.trim();
      const isPathOrUrl = trimmed.startsWith('http') || 
                          trimmed.startsWith('data:') || 
                          trimmed.startsWith('/') || 
                          trimmed.startsWith('.') ||
                          /\.(png|jpe?g|gif|svg|webp|bmp)(?:\?.*)?$/i.test(trimmed);
      if (isPathOrUrl) {
        return trimmed;
      }
      return 'data:image/png;base64,' + trimmed;
    }
    
    // If image is a Blob or File
    if (image instanceof Blob || image instanceof File) {
      return URL.createObjectURL(image);
    }
    
    // If image is an Array or Array-like
    if (Array.isArray(image)) {
      try {
        return 'data:image/png;base64,' + byteArrayToBase64(image);
      } catch (e) {
        console.error("Error converting array to base64:", e);
        return '';
      }
    }
    
    if (image.buffer || image.byteLength) { // TypedArray/ArrayBuffer
      try {
        return 'data:image/png;base64,' + arrayBufferToBase64(image);
      } catch (e) {
        console.error("Error converting buffer to base64:", e);
        return '';
      }
    }
    
    // If image is an object
    if (typeof image === 'object') {
      const srcVal = image.href || image.base64 || image.data || image.bytes;
      if (srcVal) {
        return resolveImageSrc(srcVal);
      }
    }
    
    return '';
  }

  // Render image for a card (supports href, base64, or raw bytes)
  function renderCardImage(image) {
    if (!image) return '';
    const src = resolveImageSrc(image);
    if (!src) return '';
    const alt = (image && image.alt) || 'Card image';
    return `<img class="card-image" src="${src}" alt="${alt}" loading="lazy" />`;
  }



  // Subscribe to customer ID changes
  if (window.ParamsData) {
    window.ParamsData.subscribe('customerId', function (newCid) {
      currentCustomerId = newCid;
      // If Holdings module is currently open and active in the DOM, reload holdings
      const $header = $(".qm-header-inline");
      if ($header.length && $header.hasClass("holdings-active")) {
        loadHoldings();
      }
    });
  }

  // ── CUSTOM HEADER RENDERING ──
  function renderHoldingsHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("holdings-active")) {
      $header.removeClass("leads-active cases-active activities-active").addClass("holdings-active");
      $header.empty();

      const headerHtml = `
        <div class="qm-header-left-wrap" style="display: flex; align-items: center; gap: 12px;">
          <button class="qm-back-btn" title="Back to Profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="qm-header-avatar" style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--glass2); border: 1px solid var(--border); box-shadow: 0 0 15px var(--glow-shadow-weak); font-size: 18px;">📊</div>
          <div class="qm-header-titles" style="display: flex; flex-direction: column; gap: 2px;">
            <h2 id="qm-title" style="font-size: 18px !important; font-weight: 800 !important; letter-spacing: 0.5px !important; margin: 0 !important; background: linear-gradient(135deg, #fff, var(--accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">PORTFOLIO HOLDINGS</h2>
            <p class="qm-header-subtitle" style="font-size: 11px; color: var(--muted); margin: 0;">Explorer tree and accounts detail summary</p>
          </div>
        </div>
      `;
      $header.append(headerHtml);
      headerRestored = false;
    }
  }

  // ── RESTORE DEFAULT HEADER ──
  function restoreDefaultHeader(title) {
    const $header = $(".qm-header-inline");
    if ($header.length && $header.hasClass("holdings-active")) {
      $header.removeClass("holdings-active");
      $header.empty();
      $header.append(`<h2 id="qm-title">${title}</h2>`);
      headerRestored = true;
    }
  }

  function loadHoldings() {
    renderHoldingsHeader();
    currentCustomerId = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;

    const $content = $("#qm-content");
    if (!$content.length) return;

    if (!currentCustomerId) {
      if (window.UIRenderer) {
        window.UIRenderer.showEmptyState("#qm-content");
      } else {
        $content.html("<div style='text-align:center; padding: 40px;'>No active customer ID.</div>");
      }
      return;
    }

    if (window.UIRenderer) {
      window.UIRenderer.showLoader("#qm-content");
    } else {
      $content.html("<div style='text-align:center; padding: 40px;'>Loading Holdings...</div>");
    }

    const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.HOLDINGS;
    const paramKey = (window.API_CONFIG && window.API_CONFIG.PARAMS && window.API_CONFIG.PARAMS.CUSTOMER_ID) || "customerId";
    const params = {};
    params[paramKey] = currentCustomerId;

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        params,
        function (response) {
          if (window.UIRenderer) window.UIRenderer.hideLoader("#qm-content");

          // Find the customer's holdings record
          let record = null;
          const custKey = fName("customerId");
          if (Array.isArray(response)) {
            record = response.find(h => h[custKey] === currentCustomerId || h.id === currentCustomerId);
          } else if (response && (response[custKey] === currentCustomerId || response.id === currentCustomerId)) {
            record = response;
          }

          if (record) {
            holdingsData = record;
            renderLandingView(record);
          } else {
            if (window.UIRenderer) {
              window.UIRenderer.showEmptyState("#qm-content", "No holdings accounts mapped for this customer profile.");
            } else {
              const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';
              $content.html(`
                <div style="text-align:center; padding: 40px;">
                  <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" />
                  <div style="color:var(--muted); font-size:14px; font-weight:600;">No holdings accounts mapped for this customer profile.</div>
                </div>
              `);
            }
          }
        },
        function (error) {
          if (window.UIRenderer) {
            window.UIRenderer.showError("#qm-content", "Failed to load holdings from API.", function () {
              loadHoldings();
            });
          } else {
            const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('ERROR')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.ERROR) || '';
            $content.html(`
              <div style="text-align:center; padding: 40px;">
                <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" />
                <div style="color:#ef4444; font-weight:600; font-size:14px;">Failed to load holdings: ${escapeHtml(error)}</div>
              </div>
            `);
          }
        }
      );
    } else {
      const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('ERROR')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.ERROR) || '';
      $content.html(`
        <div style="text-align:center; padding: 40px;">
          <img src="${animPath}" style="width: 120px; height: 120px; margin-bottom: 12px;" />
          <div style="color:#ef4444; font-weight:600; font-size:14px;">API Service is unavailable.</div>
        </div>
      `);
    }
  }

  // Render Category Cards Landing View
  function renderLandingView(data) {
    const $content = $("#qm-content");
    if (!$content.length) return;

    let cardsHtml = `
      <div class="holdings-landing-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; padding: 20px;">
    `;

    window.HOLDING_CONFIG.forEach(cfg => {
      const catData = data[cfg.apiKey] || { subcategoriesCount: 0, accountsCount: 0 };
      cardsHtml += `
        <div class="holding-category-card glass-card info-card" data-category-id="${cfg.id}" style="min-height: 160px; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; transition: all 0.3s ease; position: relative; overflow: hidden; border-radius: 14px;">
          <div class="card-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div class="card-icon" style="font-size: 24px; width: 44px; height: 44px; border-radius: 12px; background: var(--glass2); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${cfg.icon}</div>
            <div class="card-title-wrap" style="flex: 1;">
              <h3 style="font-size: 15px; font-weight: 600; margin: 0; color: var(--text);">${cfg.title}</h3>
            </div>
            <div class="card-arrow" style="font-size: 20px; color: var(--muted); transition: transform 0.3s;">›</div>
          </div>
          <div class="card-body" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--muted);">
              <span>Categories</span>
              <span style="font-weight: 700; color: var(--text);">${catData.subcategoriesCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: var(--muted);">
              <span>Accounts</span>
              <span style="font-weight: 700; color: var(--text);">${catData.accountsCount}</span>
            </div>
          </div>
        </div>
      `;
    });

    cardsHtml += `</div>`;
    $content.html(cardsHtml);

    // Bind Category Card clicks to open Explorer Modal
    $content.find(".holding-category-card").on("click", function () {
      const catId = $(this).attr("data-category-id");
      const cfg = window.HOLDING_CONFIG.find(c => c.id === catId);
      if (cfg) {
        openHoldingsExplorerModal(cfg);
      }
    });
  }

  // Open the Holdings Explorer Modal with Category subcategories loaded as tabs inside the detail-view
  function openHoldingsExplorerModal(categoryCfg) {
    const $detailView = $("#detail-view");
    if (!$detailView.length) {
      console.error("#detail-view not found on the page.");
      return;
    }

    // 1. Set header titles & descriptions & tags in #detail-view
    $("#detail-model-title").text(categoryCfg.title);
    $("#detail-model-desc").text("Portfolio Holdings Explorer");

    // 2. Set Hero image
    const assetsPath = (window.ASSETS_CONFIG && window.ASSETS_CONFIG.DASHBOARD_ASSETS_PATH) || 'assets/png/';
    let heroImg = "bank.svg";
    if (categoryCfg.id === "liabilities") {
      heroImg = "card.svg";
    } else if (categoryCfg.id === "valueAdded") {
      heroImg = "shield.svg";
    } else if (categoryCfg.id === "investments") {
      heroImg = "chart.svg";
    }
    $("#detail-img").attr("src", `${assetsPath}${heroImg}`);

    // 3. Create particles
    if (typeof window.createHeroParticles === "function") {
      window.createHeroParticles();
    }

    // 4. Update #detail-content-area layout styles
    const $contentArea = $("#detail-content-area");
    $contentArea.empty();
    $contentArea.css({
      "overflow-y": "hidden",
      "height": "calc(100vh - 170px)",
      "display": "flex",
      "flex-direction": "column"
    });

    // Open the detail view modal first so the user sees it opening
    $detailView.removeClass("hidden");
    setTimeout(() => $detailView.addClass("visible"), 10);
    document.body.style.overflow = 'hidden';

    let activeTabId = "";
    let selectedAccountIndex = 0;
    let activePreviewTabId = "details";
    let activeTab = null;
    let activeTabAccounts = []; // Stores fetched accounts for searching
    let categoryData = null;    // Cache for single API response

    // Handle single category API vs standard individual tab loading
    if (categoryCfg.endpoint) {
      if (window.UIRenderer) {
        window.UIRenderer.showLoader($contentArea);
      } else {
        $contentArea.html("<div style='text-align:center; padding: 40px;'>Loading Portfolio Items...</div>");
      }

      const custKey = fName("customerId");
      const params = {};
      params[custKey] = currentCustomerId;

      if (window.ApiService) {
        window.ApiService.get(
          categoryCfg.endpoint,
          params,
          function (response) {
            if (window.UIRenderer) window.UIRenderer.hideLoader($contentArea);
            categoryData = response;
            
            // Set first tab as active
            activeTabId = categoryCfg.tabs && categoryCfg.tabs.length > 0 ? categoryCfg.tabs[0].id : "";
            initLayout();
          },
          function (error) {
            if (window.UIRenderer) window.UIRenderer.hideLoader($contentArea);
            $contentArea.html(`<div style="text-align: center; color: #ef4444; padding: 40px;">Error loading data: ${error}</div>`);
          }
        );
      } else {
        if (window.UIRenderer) window.UIRenderer.hideLoader($contentArea);
        $contentArea.html("<div style='text-align: center; color: #ef4444; padding: 40px;'>API Service is unavailable.</div>");
      }
    } else {
      // Standard flow: tabs are loaded individually on click/active
      activeTabId = categoryCfg.tabs && categoryCfg.tabs.length > 0 ? categoryCfg.tabs[0].id : "";
      initLayout();
    }

    function initLayout() {
      // 5. Build holdings explorer UI structure
      const explorerHtml = `
        <div class="holdings-explorer-layout" style="display: flex; flex-direction: column; height: 100%; gap: 16px; min-height: 0; flex: 1;">
          <!-- SUB-CATEGORY TABS BAR (At the top of the detail view area) -->
          <div class="modal-tabs-bar" id="explorer-tabs-container" style="display: flex; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 12px; background: transparent; flex-shrink: 0; flex-wrap: wrap;">
            <!-- subcategory tabs dynamically generated -->
          </div>

          <div class="explorer-body" style="display: flex; gap: 20px; overflow: hidden; height: 100%; flex: 1; min-height: 0;">
            <!-- LEFT SECTION: Account List -->
            <div class="explorer-left" style="width: 45%; display: flex; flex-direction: column; gap: 16px; border-right: 1px solid var(--border); padding-right: 20px; height: 100%; overflow: hidden;">
              <div class="explorer-search-wrap" style="position: relative; flex-shrink: 0;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 13px;">🔍</span>
                <input type="text" id="explorer-search-input" style="width: 100%; padding: 8px 12px 8px 34px; border-radius: 20px; background: var(--glass2); border: 1px solid var(--border); color: var(--text); outline: none; font-size: 13px;" placeholder="Search accounts..." />
              </div>
              <div class="account-list" id="explorer-account-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px;">
                <!-- Dynamically rendered accounts -->
              </div>
            </div>
            <!-- RIGHT SECTION: Account Detail Preview -->
            <div class="explorer-right" id="explorer-detail-preview" style="width: 55%; display: flex; flex-direction: column; height: 100%; padding-left: 10px; overflow: hidden;">
              <!-- Dynamic details preview -->
            </div>
          </div>
        </div>
      `;

      $contentArea.html(explorerHtml);

      // Render tabs and initial accounts list
      renderTabs();
      loadActiveCategoryItems();

      // Bind search input filter
      $contentArea.find("#explorer-search-input").on("input", function () {
        const query = $(this).val().toLowerCase().trim();
        filterActiveCategoryItems(query);
      });

      // Back button cleanups and restore styles on exit
      $("#back-to-dash").off("click.holdings").on("click.holdings", function () {
        $contentArea.css({ "overflow-y": "", "height": "", "display": "", "flex-direction": "" });
      });
    }

    function renderTabs() {
      const $container = $contentArea.find("#explorer-tabs-container");
      if (!$container.length) return;

      $container.empty();

      categoryCfg.tabs.forEach(tab => {
        const isActive = tab.id === activeTabId;
        const $tab = $(`
          <button class="holding-tab-btn" data-tab-id="${tab.id}" style="background: ${isActive ? 'var(--accent)' : 'var(--glass2)'}; color: ${isActive ? '#fff' : 'var(--text)'}; border: 1px solid ${isActive ? 'var(--accent2)' : 'var(--border)'}; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: ${isActive ? '0 0 10px var(--glow-shadow-weak)' : 'none'};">
            <span>${tab.icon}</span> ${tab.title}
          </button>
        `);

        $tab.on("click", function () {
          if (activeTabId !== tab.id) {
            activeTabId = tab.id;
            selectedAccountIndex = 0;
            activePreviewTabId = "details";
            $contentArea.find("#explorer-search-input").val(""); // reset search on tab swap
            renderTabs();
            loadActiveCategoryItems();
          }
        });

        $container.append($tab);
      });
    }

    function loadActiveCategoryItems() {
      activeTab = categoryCfg.tabs.find(t => t.id === activeTabId);
      const $list = $contentArea.find("#explorer-account-list");
      $list.empty();

      if (window.UIRenderer) {
        window.UIRenderer.showLoader("#explorer-account-list");
      } else {
        $list.html(`<div style="text-align: center; color: var(--muted); padding: 20px;">Loading accounts...</div>`);
      }

      const custKey = fName("customerId");

      if (categoryCfg.endpoint && categoryData) {
        // Shared Category API Flow (In-memory cached data)
        if (window.UIRenderer) window.UIRenderer.hideLoader("#explorer-account-list");

        let accounts = [];
        const tabMatchType = activeTab.matchType || activeTab.title || activeTab.id;

        if (Array.isArray(categoryData)) {
          accounts = categoryData.filter(acc => {
            const customerMatch = acc[custKey] === currentCustomerId;
            const typeMatch = String(acc.type || acc.matchType || acc.category || "").toLowerCase() === tabMatchType.toLowerCase();
            return customerMatch && typeMatch;
          });
        }

        activeTabAccounts = accounts;
        renderAccounts(accounts);
      } else {
        // Tab-Specific Endpoint Flow (Original Logic)
        const endpoint = activeTab.endpoint;
        const params = {};
        params[custKey] = currentCustomerId;

        if (window.ApiService) {
          window.ApiService.get(
            endpoint,
            params,
            function (response) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#explorer-account-list");

              let accounts = Array.isArray(response) ? response : [];
              // Filter locally just in case
              accounts = accounts.filter(acc => acc[custKey] === currentCustomerId);
              activeTabAccounts = accounts;
              renderAccounts(accounts);
            },
            function (error) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#explorer-account-list");
              const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('ERROR')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.ERROR) || '';
              $list.html(`
                <div style="text-align: center; padding: 30px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
                  <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" alt="Error Animation" />
                  <div style="font-size: 14px; font-weight: 700; color: var(--text); margin-top: 8px; font-family: 'Outfit', sans-serif;">Error Loading Accounts</div>
                  <div style="font-size: 12px; color: #ef4444; line-height: 1.5; font-family: inherit; max-width: 200px; margin: 0 auto;">${escapeHtml(error)}</div>
                </div>
              `);
              renderPreview(null);
            }
          );
        } else {
          const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('ERROR')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.ERROR) || '';
          $list.html(`
            <div style="text-align: center; padding: 30px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
              <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" alt="Error Animation" />
              <div style="font-size: 14px; font-weight: 700; color: var(--text); margin-top: 8px; font-family: 'Outfit', sans-serif;">Service Unavailable</div>
              <div style="font-size: 12px; color: #ef4444; line-height: 1.5; font-family: inherit; max-width: 200px; margin: 0 auto;">API Service is offline.</div>
            </div>
          `);
          renderPreview(null);
        }
      }
    }

    function filterActiveCategoryItems(query) {
      const nameKey = fName("title");
      const numberKey = fName("subtitle");
      const filtered = activeTabAccounts.filter(acc =>
        (acc[nameKey] ? String(acc[nameKey]).toLowerCase().includes(query) : false) ||
        (acc[numberKey] ? String(acc[numberKey]).toLowerCase().includes(query) : false)
      );
      selectedAccountIndex = 0;
      renderAccounts(filtered);
    }

    function renderAccounts(accountList) {
      const $list = $contentArea.find("#explorer-account-list");
      $list.empty();

      if (accountList.length === 0) {
        const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';
        const searchInputVal = $contentArea.find("#explorer-search-input").val() || "";
        const msg = searchInputVal.trim()
          ? "No accounts match your search query."
          : "No accounts available under this holdings category.";
        
        $list.html(`
          <div style="text-align: center; padding: 30px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
            <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" alt="Empty State Animation" />
            <div style="font-size: 14px; font-weight: 700; color: var(--text); margin-top: 8px; font-family: 'Outfit', sans-serif;">No Accounts Mapped</div>
            <div style="font-size: 12px; color: var(--muted); line-height: 1.5; font-family: inherit; max-width: 200px; margin: 0 auto;">${msg}</div>
          </div>
        `);
        renderPreview(null);
        return;
      }

      const statusKey = fName("tag");
      const nameKey = fName("title");
      const numberKey = fName("subtitle");
      const amountKey = fName("value");

      accountList.forEach((acc, idx) => {
        const isActive = selectedAccountIndex === idx;
        const statusVal = String(acc[statusKey] || "");
        const statusClass = statusVal.toLowerCase() === "active" ? "active" : "";

        const $item = $(`
          <div class="account-item ${isActive ? 'active' : ''}" style="cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border: 1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}; border-radius: 12px; background: ${isActive ? 'var(--glass2)' : 'var(--glass)'}; transition: all 0.2s;">
            <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;">
              <span class="acc-type" style="font-weight: 600; font-size: 13px; color: var(--text);">${acc[nameKey] || ""}</span>
              <span class="acc-num" style="font-family: monospace; font-size: 11px; color: var(--muted);">${acc[numberKey] || ""}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              <span class="acc-bal" style="font-weight: 700; font-size: 13px; color: var(--text);">${acc[amountKey] || ""}</span>
              <span class="acc-status ${statusClass}" style="font-size: 9px; padding: 2px 8px; border-radius: 10px; background: ${statusVal.toLowerCase() === 'active' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 165, 0, 0.1)'}; color: ${statusVal.toLowerCase() === 'active' ? '#4ade80' : 'orange'}; border: 1px solid ${statusVal.toLowerCase() === 'active' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 165, 0, 0.2)'};">${statusVal}</span>
            </div>
          </div>
        `);

        $item.on("click", function () {
          selectedAccountIndex = idx;
          $list.find(".account-item").css({ "border-color": "var(--border)", "background": "var(--glass)" }).removeClass("active");
          $(this).css({ "border-color": "var(--accent)", "background": "var(--glass2)" }).addClass("active");
          selectAccount(acc);
        });

        $list.append($item);
      });

      selectAccount(accountList[selectedAccountIndex]);
    }

    function selectAccount(acc) {
      if (!acc) {
        renderPreview(null);
        return;
      }

      if (activeTab && activeTab.detailsEndpoint) {
        // Multi-Endpoint Flow: Fetch details from activeTab.detailsEndpoint
        const params = {};
        if (activeTab.detailsParams) {
          // const customerParam = activeTab.detailsParams.customerKey || "customerId";
          const idParam = activeTab.detailsParams.idKey || "id";
          // params[customerParam] = currentCustomerId;
          params[idParam] = acc.id;
        }

        if (window.UIRenderer) {
          window.UIRenderer.showLoader("#explorer-detail-preview");
        } else {
          $contentArea.find("#explorer-detail-preview").html(`<div style="text-align: center; color: var(--muted); padding: 50px 10px;">Loading details...</div>`);
        }

        if (window.ApiService) {
          window.ApiService.get(
            activeTab.detailsEndpoint,
            params,
            function (response) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#explorer-detail-preview");
              const resData = Array.isArray(response) ? response[0] : response;
              acc.fullDetails = resData ? (resData.fullDetails || resData) : null;
              renderPreview(acc);
            },
            function (error) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#explorer-detail-preview");
              console.warn("Failed to load details:", error);
              $contentArea.find("#explorer-detail-preview").html(
                `<div style="text-align: center; color: #ef4444; padding: 100px 10px; font-size: 13px;">Error loading details: ${error}</div>`
              );
            }
          );
        } else {
          renderPreview(acc);
        }
      } else {
        // Single-Endpoint Flow: Render pre-loaded details directly
        renderPreview(acc);
      }
    }

    function renderPreview(acc) {
      const $preview = $contentArea.find("#explorer-detail-preview");
      $preview.empty();

      if (!acc) {
        $preview.html(`<div style="text-align: center; color: var(--muted); padding: 100px 10px; font-style: italic; font-size: 13px;">Select an account to view details.</div>`);
        return;
      }

      function getLocalFieldIcon(label) {
        const l = (label || "").toLowerCase();
        if (l.includes("phone") || l.includes("mobile") || l.includes("tel")) return "📞";
        if (l.includes("email") || l.includes("mail")) return "✉️";
        if (l.includes("address") || l.includes("street") || l.includes("city") || l.includes("state") || l.includes("country") || l.includes("zip") || l.includes("postal")) return "📍";
        if (l.includes("birth") || l.includes("dob") || l.includes("age")) return "🎂";
        if (l.includes("gender") || l.includes("sex")) return "👤";
        if (l.includes("nationality") || l.includes("passport")) return "🌐";
        if (l.includes("occupation") || l.includes("employer") || l.includes("industry") || l.includes("job") || l.includes("work")) return "💼";
        if (l.includes("status") || l.includes("classification") || l.includes("tier")) return "🏷️";
        if (l.includes("net worth") || l.includes("balance") || l.includes("income") || l.includes("salary") || l.includes("revenue") || l.includes("amount") || l.includes("limit") || l.includes("interest")) return "💰";
        if (l.includes("score") || l.includes("rating") || l.includes("risk")) return "⭐️";
        if (l.includes("since") || l.includes("date") || l.includes("time") || l.includes("maturity") || l.includes("opened")) return "📅";
        if (l.includes("tax") || l.includes("ssn") || l.includes("id") || l.includes("cid") || l.includes("number") || l.includes("acc")) return "📄";
        if (l.includes("rm") || l.includes("manager") || l.includes("owner") || l.includes("beneficial") || l.includes("holder")) return "👥";
        return "🔹";
      }

      function renderSectionBlock(sec) {
        let fieldsHtml = '';
        if (sec.fields) {
          Object.entries(sec.fields).forEach(([key, val]) => {
            const valStr = String(val);
            const icon = getLocalFieldIcon(key);
            const isFullWidth = valStr.length > 20 || key.toLowerCase().includes("address") || key.toLowerCase().includes("details") || key.toLowerCase().includes("remarks");

            fieldsHtml += `
              <div class="detail-field-card ${isFullWidth ? 'full-width' : ''}" style="padding: 10px; border-bottom: 1px solid var(--border);">
                <div class="df-info">
                  <label class="df-label" style="font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px;">
                    <span class="df-icon-inline">${icon}</span> ${key}
                  </label>
                  <span class="df-value" style="display: block; font-size: 13px; font-weight: 600; color: var(--text);">${valStr}</span>
                </div>
              </div>
            `;
          });
        }

        return `
          <div class="detail-section-block glass-card" style="padding: 16px; border-radius: 14px; margin-bottom: 16px;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 11.5px; text-transform: uppercase; color: var(--accent2); letter-spacing: 2px; font-weight: 800; border-bottom: 1px solid var(--border); padding-bottom: 5px;">${sec.name}</h3>
            <div class="detail-fields-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; gap: 1px;">
              ${fieldsHtml}
            </div>
          </div>
        `;
      }

      function renderSubTabContent(acc, subTabId, $container) {
        if (subTabId === "details") {
          const fullDetailsKey = fName("fullDetails");
          const fullDetails = acc[fullDetailsKey];
          const sections = fullDetails && fullDetails.sections ? fullDetails.sections : [];

          if (sections.length === 0) {
            $container.html(`<div style="text-align: center; color: var(--muted); padding: 50px 10px; font-style: italic; font-size: 13px;">No details available for this account.</div>`);
            return;
          }

          let sectionsHtml = '';
          sections.forEach(sec => {
            sectionsHtml += renderSectionBlock(sec);
          });
          $container.html(sectionsHtml);
        } else {
          // Find configuration of this sub-tab
          const rtConfig = activeTab.rightTabs.find(rt => rt.id === subTabId);
          if (!rtConfig || !rtConfig.endpoint) {
            $container.html(`<div style="text-align: center; color: var(--muted); padding: 50px 10px; font-style: italic;">Configuration error.</div>`);
            return;
          }

          // Fetch cards from details API
          const params = {};
          const paramKey = rtConfig.paramKey || "casaId";
          const valField = rtConfig.idField || "number";
          params[paramKey] = acc[valField];

          if (window.UIRenderer) {
            window.UIRenderer.showLoader("#preview-tab-content-area");
          } else {
            $container.html(`<div style="text-align: center; color: var(--muted); padding: 30px 10px;">Loading...</div>`);
          }

          if (window.ApiService) {
            window.ApiService.get(
              rtConfig.endpoint,
              params,
              function (response) {
                if (window.UIRenderer) window.UIRenderer.hideLoader("#preview-tab-content-area");
                let cards = Array.isArray(response) ? response : [];
                if (cards.length === 0) {
                  $container.html(`<div style="text-align: center; color: var(--muted); padding: 50px 10px; font-style: italic; font-size: 13px;">No cards linked to this account.</div>`);
                  return;
                }

                let cardsHtml = '<div style="display: flex; flex-direction: column; gap: 12px; padding: 4px;">';
                cards.forEach(card => {
                  let cardFieldsHtml = '';
                  
                  // Render card image inside a cell of the detail fields grid
                  if (card.image) {
                    const imgTag = renderCardImage(card.image);
                    if (imgTag) {
                      cardFieldsHtml += `
                        <div class="detail-field-card full-width" style="padding: 10px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px;">
                          <label class="df-label" style="font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
                            <span class="df-icon-inline">🖼️</span> Card Design
                          </label>
                          <div class="card-img-container" style="width: 100%; max-width: 100%; height: 180px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); margin: 4px 0;">
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
                      const isFullWidth = valStr.length > 20 || k.toLowerCase().includes("address") || k.toLowerCase().includes("details") || k.toLowerCase().includes("remarks");
                      
                      cardFieldsHtml += `
                        <div class="detail-field-card ${isFullWidth ? 'full-width' : ''}" style="padding: 10px; border-bottom: 1px solid var(--border);">
                          <div class="df-info">
                            <label class="df-label" style="font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
                              <span class="df-icon-inline">${icon}</span> ${k}
                            </label>
                            <span class="df-value" style="display: block; font-size: 13px; font-weight: 600; color: var(--text);">${valStr}</span>
                          </div>
                        </div>
                      `;
                    });
                  }

                  cardsHtml += `
                    <div class="detail-section-block glass-card" style="padding: 16px; border-radius: 14px; margin-bottom: 16px;">
                      <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 12px;">
                        <span style="font-size: 20px;">💳</span>
                        <div style="display: flex; flex-direction: column; text-align: left;">
                          <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: var(--accent2); text-transform: uppercase; letter-spacing: 1px;">${card.title || card.name || ""}</h3>
                          <span style="font-size: 11px; color: var(--muted);">${card.subtitle || card.number || ""}</span>
                        </div>
                      </div>
                      <div class="detail-fields-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; gap: 1px;">
                        ${cardFieldsHtml}
                      </div>
                    </div>
                  `;
                });
                cardsHtml += '</div>';
                $container.html(cardsHtml);
              },
              function (error) {
                if (window.UIRenderer) window.UIRenderer.hideLoader("#preview-tab-content-area");
                $container.html(`<div style="text-align: center; color: #ef4444; padding: 50px 10px; font-size: 13px;">Error loading cards: ${error}</div>`);
              }
            );
          } else {
            $container.html(`<div style="text-align: center; color: #ef4444; padding: 50px 10px;">API Service is unavailable.</div>`);
          }
        }
      }

      if (activeTab && activeTab.rightTabs) {
        // Render sub-tabs container
        let tabsHtml = `
          <div class="preview-tabs-bar" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 14px; flex-shrink: 0;">
        `;
        activeTab.rightTabs.forEach(rt => {
          const isRtActive = rt.id === activePreviewTabId;
          tabsHtml += `
            <button class="preview-tab-btn ${isRtActive ? 'active' : ''}" data-rt-id="${rt.id}" style="background: ${isRtActive ? 'var(--accent)' : 'var(--glass2)'}; color: ${isRtActive ? '#fff' : 'var(--text)'}; border: 1px solid ${isRtActive ? 'var(--accent2)' : 'var(--border)'}; padding: 5px 12px; border-radius: 15px; cursor: pointer; font-size: 11.5px; font-weight: 600; transition: all 0.2s; font-family: inherit;">
              ${rt.title}
            </button>
          `;
        });
        tabsHtml += `
          </div>
          <div class="preview-tab-content" id="preview-tab-content-area" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; min-height: 0;">
          </div>
        `;

        $preview.html(tabsHtml);

        // Bind clicks to preview tab buttons
        $preview.find(".preview-tab-btn").on("click", function () {
          const rtId = $(this).attr("data-rt-id");
          if (activePreviewTabId !== rtId) {
            activePreviewTabId = rtId;
            renderPreview(acc); // Re-render preview with the new active tab
          }
        });

        // Resolve the content container
        const $content = $preview.find("#preview-tab-content-area");
        renderSubTabContent(acc, activePreviewTabId, $content);
      } else {
        // Directly render details sections (Original Flow)
        const fullDetailsKey = fName("fullDetails");
        const fullDetails = acc[fullDetailsKey];
        const sections = fullDetails && fullDetails.sections ? fullDetails.sections : [];

        if (sections.length === 0) {
          $preview.html(`<div style="text-align: center; color: var(--muted); padding: 100px 10px; font-style: italic; font-size: 13px;">No details available for this account.</div>`);
          return;
        }

        let sectionsHtml = '';
        sections.forEach(sec => {
          sectionsHtml += renderSectionBlock(sec);
        });

        $preview.html(`
          <div class="preview-content" style="display: flex; flex-direction: column; gap: 16px; height: 100%; overflow-y: auto; padding-right: 5px;">
            ${sectionsHtml}
          </div>
        `);
      }
    }
  }

  // ── MUTATIONOBSERVER ON QUICK MODULE TITLES ──
  $(function () {
    const $titleNode = $("#qm-title");
    if (!$titleNode.length) return;

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        const text = $titleNode.text().trim();
        if (text === "Holding Module") {
          loadHoldings();
        } else if (text !== "" && !text.includes("PORTFOLIO HOLDINGS") && !headerRestored) {
          restoreDefaultHeader(text);
        }
      });
    });

    observer.observe($titleNode[0], {
      childList: true,
      characterData: true,
      subtree: true
    });
  });
})();
