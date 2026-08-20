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

  /**
   * Dynamically resolves API parameters from config options.
   * Supports:
   * 1. Single string: `paramKey: "panNumber"` or `params: "panNumber"`
   * 2. Array of strings (multiple params): `params: ["customerId", "panNumber"]`
   * 3. Key-Value mapping object: `params: { pan: "panNumber", id: "customerId" }`
   *    (where the object key is the request param name sent to the API, and the value is the ParamsData store key or static value)
   * 4. Function: `params: () => ({ ... })`
   * 5. Default fallback: `{ [fName("customerId")]: currentCustomerId }`
   */
  function resolveConfigParams(configObj, defaultKey) {
    const params = {};
    if (!configObj) {
      const defKey = defaultKey || fName("customerId");
      params[defKey] = currentCustomerId;
      return params;
    }

    // Check if custom params are explicitly defined in any standard config property
    const rawParams = configObj.params !== undefined ? configObj.params :
      (configObj.queryParams !== undefined ? configObj.queryParams :
        (configObj.paramKey !== undefined ? configObj.paramKey :
          (configObj.paramKeys !== undefined ? configObj.paramKeys : null)));

    if (typeof rawParams === "function") {
      return rawParams() || {};
    }

    if (Array.isArray(rawParams)) {
      // e.g. ["customerId", "panNumber"] or ["panNumber"]
      rawParams.forEach(function (pKey) {
        const apiKey = fName(pKey) || pKey;
        const val = (window.ParamsData && window.ParamsData.get)
          ? window.ParamsData.get(pKey)
          : (window.ParamsData ? window.ParamsData[pKey] : null);
        if (val !== undefined && val !== null) {
          params[apiKey] = val;
        } else if (pKey === "customerId" && currentCustomerId) {
          params[apiKey] = currentCustomerId;
        }
      });
      return params;
    }

    if (typeof rawParams === "object" && rawParams !== null) {
      // e.g. { pan: "panNumber", id: "customerId" }
      Object.keys(rawParams).forEach(function (reqKey) {
        const storeKey = rawParams[reqKey];
        let val = (window.ParamsData && window.ParamsData.get)
          ? window.ParamsData.get(storeKey)
          : (window.ParamsData ? window.ParamsData[storeKey] : null);
        if (val === undefined || val === null) {
          if (storeKey === "customerId" && currentCustomerId) {
            val = currentCustomerId;
          } else {
            val = storeKey;
          }
        }
        params[reqKey] = val;
      });
      return params;
    }

    if (typeof rawParams === "string" && rawParams.trim() !== "") {
      // Single key e.g. "panNumber" or "customerId"
      const apiKey = fName(rawParams) || rawParams;
      const val = (window.ParamsData && window.ParamsData.get)
        ? window.ParamsData.get(rawParams)
        : (window.ParamsData ? window.ParamsData[rawParams] : null);
      params[apiKey] = (val !== undefined && val !== null) ? val : (rawParams === "customerId" ? currentCustomerId : val);
      return params;
    }

    // Default fallback: customerId
    const defKey = defaultKey ? (fName(defaultKey) || defaultKey) : fName("customerId");
    params[defKey] = currentCustomerId;
    return params;
  }

  // Expose helper globally for modular reusability
  window.resolveConfigParams = resolveConfigParams;

  // ── CUSTOM HEADER RENDERING ──
  function renderHoldingsHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("holdings-active")) {
      $header.removeClass("leads-active cases-active activities-active mandates-active cards-active").addClass("holdings-active");
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
            <div class="qm-header-avatar" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--glass2); border: 1px solid var(--border); box-shadow: 0 0 10px var(--glow-shadow); font-size: 22px;">📊</div>
            <div class="qm-header-titles" style="display: flex; flex-direction: column;">
              <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: 1px; margin: 0; text-transform: uppercase; font-family: 'Outfit', sans-serif;">PORTFOLIO HOLDINGS</h2>
              <p class="qm-header-subtitle" style="font-size: 13px; color: var(--muted); margin-top: 2px; font-weight: 400; margin-bottom: 0;">Explorer tree and accounts detail summary</p>
            </div>
          </div>
        </div>
      `;
      $header.append(headerHtml);

      $("#qm-breadcrumbs-bar").removeClass("hidden").html(`
        <div class="qm-header-breadcrumbs">
          <a href="#" class="qm-breadcrumb-link" data-action="home">Profile</a>
          <span class="qm-breadcrumb-separator">/</span>
          <span class="qm-breadcrumb-current">Holdings</span>
        </div>
      `);
      headerRestored = false;
    }
  }

  // ── RESTORE DEFAULT HEADER ──
  function restoreDefaultHeader(title) {
    const $header = $(".qm-header-inline");
    if ($header.length && $header.hasClass("holdings-active")) {
      $header.removeClass("holdings-active");
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

          // Directly use the returned holdings data
          let record = Array.isArray(response) ? (response[0] || null) : response;

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

      const params = resolveConfigParams(categoryCfg);

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

    function updateHeaderSummary(tabId, accountsList) {
      const $modelInfo = $(".model-info");
      if (!$modelInfo.length) return;

      $modelInfo.find(".header-summary-inline").remove();

      // Dynamic renderer for summary items
      const renderDynamicSummaryItems = (items) => {
        $modelInfo.find(".header-summary-inline").remove();
        if (!items || !items.length) return;

        const itemsHtml = items.map(item => `
          <div class="summary-inline-item">
            ${item.isStatus ? '<span class="status-dot"></span>' : ''}
            <span class="label" style="${item.isStatus ? 'margin-left: 2px;' : ''}">${escapeHtml(item.label)}:</span>
            <span class="value ${item.isGreen ? 'green' : ''}">${escapeHtml(item.value)}</span>
          </div>
        `).join("");

        $modelInfo.append(`<div class="header-summary-inline">${itemsHtml}</div>`);
      };

      // Fetch summary from API endpoint if configured
      const summaryEndpoint = activeTab ? activeTab.summaryEndpoint : null;
      const summaryConfig = activeTab ? { params: activeTab.summaryParams || activeTab.params || activeTab.paramKey || activeTab.paramKeys } : null;
      const apiParams = resolveConfigParams(summaryConfig);

      if (summaryEndpoint && window.ApiService) {
        window.ApiService.get(
          summaryEndpoint,
          apiParams,
          function (response) {
            const dataItem = Array.isArray(response)
              ? (response[0] || null)
              : response;

            if (dataItem && typeof dataItem === 'object') {
              const summaryItems = [];
              const ignoredKeys = ["id", "customerId", "customer", "panNumber", "pan", "taxId"];

              // Support nested summaryStats or flat key-value pairs directly from backend response
              const statsSource = (dataItem.summaryStats && typeof dataItem.summaryStats === 'object')
                ? dataItem.summaryStats
                : dataItem;

              Object.entries(statsSource).forEach(([rawKey, val]) => {
                if (ignoredKeys.includes(rawKey) || val === null || val === undefined || typeof val === 'object') {
                  return;
                }

                // If backend passes readable string e.g. "Total Balance", use as-is; otherwise format camelCase/snake_case
                let label = rawKey;
                if (!rawKey.includes(' ')) {
                  label = rawKey
                    .replace(/_/g, ' ')
                    .replace(/([A-Z])/g, ' $1')
                    .trim();
                  label = label.charAt(0).toUpperCase() + label.slice(1);
                }

                const valStr = String(val);
                const isStatus = label.toLowerCase().includes('status') || label.toLowerCase().includes('standing');
                const isGreen = valStr.includes('₹') || valStr.includes('$') || valStr.includes('€') || valStr.includes('%') || label.toLowerCase().includes('value') || label.toLowerCase().includes('balance');

                summaryItems.push({
                  label: label,
                  value: valStr,
                  isGreen: isGreen,
                  isStatus: isStatus
                });
              });

              if (summaryItems.length > 0) {
                renderDynamicSummaryItems(summaryItems);
              } else {
                $modelInfo.find(".header-summary-inline").remove();
              }
            } else {
              $modelInfo.find(".header-summary-inline").remove();
            }
          },
          function (error) {
            console.warn("Could not fetch holdings summary from API:", error);
            $modelInfo.find(".header-summary-inline").remove();
          }
        );
      } else {
        $modelInfo.find(".header-summary-inline").remove();
      }
    }

    function initLayout() {
      // 5. Build holdings explorer UI structure
      const explorerHtml = `
        <div class="holdings-explorer-layout">
          <!-- SUB-CATEGORY TABS BAR (At the top of the detail view area) -->
          <div class="modal-tabs-bar" id="explorer-tabs-container" style="display: flex; gap: 10px; border-bottom: 1px solid var(--border); padding-bottom: 12px; background: transparent; flex-shrink: 0; flex-wrap: wrap;">
            <!-- subcategory tabs dynamically generated -->
          </div>

          <div class="explorer-body">
            <!-- LEFT SECTION: Account List -->
            <div class="explorer-left">
              <div class="explorer-search-wrap" style="position: relative; flex-shrink: 0;">
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 13px;">🔍</span>
                <input type="text" id="explorer-search-input" style="width: 100%; padding: 8px 12px 8px 34px; border-radius: 20px; background: var(--glass2); border: 1px solid var(--border); color: var(--text); outline: none; font-size: 13px;" placeholder="Search accounts..." />
              </div>
              <div class="account-list" id="explorer-account-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-bottom: 20px;">
                <!-- Dynamically rendered accounts -->
              </div>
            </div>
            <!-- RIGHT SECTION: Account Detail Preview -->
            <div class="explorer-right" id="explorer-detail-preview">
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
        $(".model-info").find(".header-summary-inline").remove();
        $("#detail-model-title").text(categoryCfg.title);
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
            const typeMatch = String(acc.type || acc.matchType || acc.category || "").toLowerCase() === tabMatchType.toLowerCase();
            return typeMatch;
          });
        }

        activeTabAccounts = accounts;
        renderAccounts(accounts);
        updateHeaderSummary(activeTabId, accounts);
      } else {
        // Tab-Specific Endpoint Flow (Original Logic)
        const endpoint = activeTab.endpoint;
        const params = resolveConfigParams(activeTab);

        if (window.ApiService) {
          window.ApiService.get(
            endpoint,
            params,
            function (response) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#explorer-account-list");

              let accounts = Array.isArray(response) ? response : [];
              activeTabAccounts = accounts;
              renderAccounts(accounts);
              updateHeaderSummary(activeTabId, accounts);
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
            let isFullWidth = key.toLowerCase().includes("address") || key.toLowerCase().includes("details") || key.toLowerCase().includes("remarks");
            if (!isFullWidth && window.UIRenderer && typeof window.UIRenderer.calculateTextSpan === 'function') {
              isFullWidth = window.UIRenderer.calculateTextSpan(valStr, 180, "600 12px 'Outfit', sans-serif") > 1;
            } else if (!isFullWidth) {
              isFullWidth = valStr.length > 20;
            }

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
        } else if (subTabId === "transactions") {
          renderTransactions(acc, $container);
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
                      let isFullWidth = k.toLowerCase().includes("address") || k.toLowerCase().includes("details") || k.toLowerCase().includes("remarks");
                      if (!isFullWidth && window.UIRenderer && typeof window.UIRenderer.calculateTextSpan === 'function') {
                        isFullWidth = window.UIRenderer.calculateTextSpan(valStr, 180, "600 12px 'Outfit', sans-serif") > 1;
                      } else if (!isFullWidth) {
                        isFullWidth = valStr.length > 20;
                      }

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



      function renderTransactionIconHtml(txn) {
        const isCredit = String(txn.type).toLowerCase() === 'credit';
        return isCredit ? 'C' : 'D';
      }

      function renderTransactions(acc, $container) {
        const rtConfig = activeTab.rightTabs.find(rt => rt.id === "transactions");
        if (!rtConfig || !rtConfig.endpoint) {
          $container.html(`<div style="text-align: center; color: var(--muted); padding: 50px 10px; font-style: italic;">Configuration error.</div>`);
          return;
        }

        const params = {};
        const paramKey = rtConfig.paramKey || "casaId";
        const valField = rtConfig.idField || "number";
        params[paramKey] = acc[valField];

        if (window.UIRenderer) {
          window.UIRenderer.showLoader("#preview-tab-content-area");
        } else {
          $container.html(`<div style="text-align: center; color: var(--muted); padding: 30px 10px;">Loading Transactions...</div>`);
        }

        if (window.ApiService) {
          window.ApiService.get(
            rtConfig.endpoint,
            params,
            function (response) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#preview-tab-content-area");
              let txns = Array.isArray(response) ? response : [];
              if (txns.length === 0) {
                $container.html(`<div style="text-align: center; color: var(--muted); padding: 50px 10px; font-style: italic; font-size: 13px;">No transactions linked to this account.</div>`);
                return;
              }

              let txnsHtml = '<div style="display: flex; flex-direction: column; gap: 8px; padding: 4px;">';
              txns.forEach(txn => {
                const iconHtml = renderTransactionIconHtml(txn);
                const isCredit = String(txn.type).toLowerCase() === 'credit';
                const status = (txn.fields && txn.fields["Status"]) || "Success";
                const statusLower = status.toLowerCase();
                let statusClass = 'pending';
                if (statusLower === 'success' || statusLower === 'completed') {
                  statusClass = 'success';
                } else if (statusLower === 'failed' || statusLower === 'declined') {
                  statusClass = 'failed';
                }

                txnsHtml += `
                  <div class="txn-list-item" data-txn-id="${txn.id}">
                    <div class="txn-item-left">
                      <div class="txn-category-icon ${isCredit ? 'credit' : 'debit'}">${iconHtml}</div>
                      <div class="txn-meta">
                        <span class="txn-description">${txn.description}</span>
                        <span class="txn-date">${txn.date}</span>
                      </div>
                    </div>
                    <div class="txn-item-right">
                      <div class="txn-amount-wrap">
                        <span class="txn-amount ${isCredit ? 'credit' : 'debit'}">${txn.amount}</span>
                        <span class="txn-badge ${statusClass}">${status}</span>
                      </div>
                      <div class="txn-arrow-indicator">→</div>
                    </div>
                  </div>
                `;
              });
              txnsHtml += '</div>';
              $container.html(txnsHtml);

              // Click handler on list items to open transaction details offcanvas
              $container.find('.txn-list-item').on('click', function() {
                const txnId = $(this).data('txn-id');
                const txnData = txns.find(t => t.id === txnId);
                if (txnData) {
                  openTxnDetailOffcanvas(txnData);
                }
              });
            },
            function (error) {
              if (window.UIRenderer) window.UIRenderer.hideLoader("#preview-tab-content-area");
              $container.html(`<div style="text-align: center; color: #ef4444; padding: 50px 10px; font-size: 13px;">Error loading transactions: ${error}</div>`);
            }
          );
        } else {
          if (window.UIRenderer) window.UIRenderer.hideLoader("#preview-tab-content-area");
          $container.html("<div style='text-align: center; color: #ef4444; padding: 40px;'>API Service is unavailable.</div>");
        }
      }

      function openTxnDetailOffcanvas(txn) {
        const $panel = $("#txn-detail-panel");
        const $backdrop = $("#txn-detail-backdrop");
        const $body = $("#txn-detail-body");

        if (!$panel.length || !$backdrop.length || !$body.length) return;

        // Build details content
        let fieldsHtml = '';
        if (txn.fields) {
          fieldsHtml += `<div class="detail-fields-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); background: var(--border); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; gap: 1px;">`;
          Object.entries(txn.fields).forEach(([k, v]) => {
            const valStr = String(v);
            const icon = getLocalFieldIcon(k);
            let highlightStyle = '';
            if (k.toLowerCase() === 'status') {
              const isSuccess = valStr.toLowerCase() === 'success';
              highlightStyle = `color: ${isSuccess ? '#10b981' : '#ef4444'}; font-weight: 800;`;
            } else if (k.toLowerCase() === 'amount') {
              const isCredit = String(txn.type).toLowerCase() === 'credit';
              highlightStyle = `color: ${isCredit ? '#10b981' : 'var(--text)'}; font-weight: 800; font-size: 16px;`;
            }

            let isFullWidth = k.toLowerCase().includes("id") || k.toLowerCase().includes("reference") || k.toLowerCase().includes("merchant") || k.toLowerCase().includes("date") || k.toLowerCase().includes("remarks");
            if (!isFullWidth && window.UIRenderer && typeof window.UIRenderer.calculateTextSpan === 'function') {
              isFullWidth = window.UIRenderer.calculateTextSpan(valStr, 180, "600 12px 'Outfit', sans-serif") > 1;
            } else if (!isFullWidth) {
              isFullWidth = valStr.length > 20;
            }

            fieldsHtml += `
              <div class="detail-field-card ${isFullWidth ? 'full-width' : ''}" style="padding: 12px 14px; border-bottom: 1px solid var(--border); background: var(--bg2);">
                <div class="df-info" style="display: flex; flex-direction: column;">
                  <label class="df-label" style="font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
                    <span class="df-icon-inline">${icon}</span> ${k}
                  </label>
                  <span class="df-value" style="display: block; font-size: 13px; font-weight: 600; color: var(--text); ${highlightStyle}">${valStr}</span>
                </div>
              </div>
            `;
          });
          fieldsHtml += `</div>`;
        }

        const iconHtml = renderTransactionIconHtml(txn);
        const isCredit = String(txn.type).toLowerCase() === 'credit';

        const contentHtml = `
          <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <div class="txn-category-icon-lg ${isCredit ? 'credit' : 'debit'}" style="width: 70px; height: 70px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.3); font-size: 28px; font-weight: 800;">
              ${iconHtml}
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <span style="font-size: 16px; font-weight: 800; color: var(--text);">${txn.description}</span>
              <span style="font-size: 12px; color: var(--muted);">${txn.category}</span>
            </div>
            <div style="font-size: 26px; font-weight: 900; margin-top: 5px; ${isCredit ? 'color: #10b981;' : 'color: var(--text);'}">${txn.amount}</div>
          </div>
          ${fieldsHtml}
        `;

        $body.html(contentHtml);

        // Open offcanvas
        $panel.removeClass("hidden");
        $backdrop.removeClass("hidden");
        // force reflow
        $panel[0].offsetHeight;
        $backdrop[0].offsetHeight;
        $panel.addClass("active");
        $backdrop.addClass("active");

        // Bind close events
        function closeTxnPanel() {
          $panel.removeClass("active");
          $backdrop.removeClass("active");
          setTimeout(() => {
            if (!$panel.hasClass("active")) {
              $panel.addClass("hidden");
              $backdrop.addClass("hidden");
            }
          }, 400);
        }

        $("#txn-detail-close-btn").off("click").on("click", closeTxnPanel);
        $backdrop.off("click").on("click", closeTxnPanel);
      }

      if (activeTab && activeTab.rightTabs) {
        // Render sub-tabs container
        let tabsHtml = `
          <div class="preview-tabs-bar" style="display: flex; gap: 8px; border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-top: 12px; margin-bottom: 14px; margin-left: 12px; margin-right: 12px; flex-shrink: 0;">
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

  // ── MUTATIONOBSERVER & EVENT LISTENER ON QUICK MODULE TITLES ──
  $(function () {
    function checkTitle(text) {
      if (!text) return;
      if (text === "Holding Module" || text === "Holding") {
        loadHoldings();
      } else if (text !== "" && !text.includes("PORTFOLIO HOLDINGS") && !headerRestored) {
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
