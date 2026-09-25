/**
 * Customer 360 - Pending Charges Module
 * Displays a list of pending charges for a customer.
 */
(function () {
  // ── APP STATE ──
  let pendingChargesData = [];

  let headerRestored = true;
  let isLoading = false;

  // ── DYNAMIC CSS STYLES INJECTION ──
  const pendingChargesStyles = `
    .pending-charges-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      height: 100%;
      overflow-y: auto;
      animation: pcFadeIn 0.4s ease;
      box-sizing: border-box;
      padding: 10px;
    }

    @keyframes pcFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pc-card {
      position: relative;
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 18px 12px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      flex-shrink: 0;
    }

    .pc-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--accent2);
      border-radius: 4px 0 0 4px;
      transition: width 0.3s ease;
    }

    .pc-card:hover {
      background: var(--glass2);
      border-color: var(--border);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .pc-card:hover::before {
      width: 6px;
    }

    .pc-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pc-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
    }

    .pc-date {
      font-size: 12px;
      color: var(--text);
      opacity: 0.7;
    }

    .pc-amount {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--accent2);
      background: var(--glass2);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 12px var(--glow-shadow-weak, rgba(0,0,0,0.1));
      letter-spacing: 0.5px;
    }

    /* Scrollbar */
    .pending-charges-container::-webkit-scrollbar {
      width: 6px;
    }
    .pending-charges-container::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }
  `;

  // Inject styles once
  if (!document.getElementById("pending-charges-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "pending-charges-styles";
    styleEl.innerHTML = pendingChargesStyles;
    document.head.appendChild(styleEl);
  }

  // ── UI RENDERING ──
  function calculateTotal(data) {
    let total = 0;
    data.forEach(item => {
      let val = parseFloat(String(item.amount).replace(/[^0-9.-]+/g, ""));
      if (!isNaN(val)) total += val;
    });
    return total;
  }

  function renderPendingChargesHeader(total) {
    $(".qm-header-inline").addClass("pending-charges-active").removeClass("mandates-active cards-active activities-active offers-active");
    $(".qm-action-btn-group, .qm-search-bar").hide();

    let totalText = "...";
    if (total !== undefined) {
      totalText = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(total);
    }

    $(".qm-header-inline").html(`
      <div class="qm-header-main-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="qm-header-left-wrap" style="display: flex; align-items: center; gap: 15px;">
          <button class="qm-back-btn" title="Back to Profile" onclick="document.querySelector('#qm-back-to-dash') ? document.querySelector('#qm-back-to-dash').click() : window.history.back()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6" class="arrow-chevron" />
            </svg>
            <span>Back</span>
          </button>
          <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); margin: 0;">Pending Charges</h2>
        </div>
        <div class="pc-header-right" style="font-size: 18px; font-weight: 700; color: var(--accent2); background: var(--glass); padding: 5px 15px; border-radius: 20px; border: 1px solid var(--border);">
          Total: ${totalText}
        </div>
      </div>
    `);

    headerRestored = false;
  }

  function restoreDefaultHeader(text) {
    $(".qm-header-inline").removeClass("pending-charges-active");
    $(".qm-action-btn-group, .qm-search-bar").show();
    headerRestored = true;
  }

  function renderPendingChargesUI() {
    if (isLoading) return;
    isLoading = true;
    const $container = $("#quick-module-view .qm-content-area");
    $container.empty().html('<div style="padding:10px;text-align:center;color:var(--text);">Loading...</div>');

    const cid = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;

    const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.PENDING_CHARGES;
    const paramKey = (window.API_CONFIG && window.API_CONFIG.PARAMS && window.API_CONFIG.PARAMS.CUSTOMER_ID) || "customerId";
    const params = {};
    params[paramKey] = cid;

    if (window.ApiService) {
      window.ApiService.get(endpoint, params, function (response) {
        isLoading = false;
        pendingChargesData = response;
        renderPendingChargesHeader(calculateTotal(pendingChargesData));
        buildUI($container);
      }, function (error) {
        isLoading = false;
        $container.html('<div style="padding:10px;color:red;text-align:center;">Failed to load data.</div>');
      });
    } else {
      isLoading = false;
      renderPendingChargesHeader(calculateTotal(pendingChargesData));
      buildUI($container);
    }
  }

  function buildUI($container) {
    let html = `<div class="pending-charges-container">`;

    if (!pendingChargesData || pendingChargesData.length === 0) {
      const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';
      html += `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; gap: 8px;">
          <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" alt="Empty State Animation" />
          <div style="font-size: 15px; font-weight: 700; color: var(--text); margin-top: 8px; font-family: 'Outfit', sans-serif;">No Pending Charges Found</div>
          <div style="font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 280px; margin: 0 auto; text-align: center; font-family: inherit;">There are no pending charges for this customer at the moment.</div>
        </div>
      `;
    } else {
      pendingChargesData.forEach(charge => {
        html += `
          <div class="pc-card">
            <div class="pc-left">
              <div class="pc-title">${charge.title}</div>
              <div class="pc-date">${charge.date}</div>
            </div>
            <div class="pc-amount">${charge.amount}</div>
          </div>
        `;
      });
    }

    html += `</div>`;
    $container.html(html);
  }

  // ── MUTATIONOBSERVER & EVENT LISTENER ON QUICK MODULE TITLES ──
  $(function () {
    function checkTitle(text) {
      if (!text) return;
      const clean = text.toLowerCase().trim();
      if (clean.includes("pending charges") || clean.includes("pending charge")) {
        const wasActive = $(".qm-header-inline").hasClass("pending-charges-active");
        if (!wasActive) {
          renderPendingChargesHeader(); // show placeholder total
        }
        if (!wasActive || !$(".pending-charges-container").length) {
          renderPendingChargesUI();
        }
      } else if (text !== "" && !clean.includes("pending charge") && !headerRestored) {
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
