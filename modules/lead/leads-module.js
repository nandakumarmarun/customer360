/**
 * Customer 360 - Leads Information Module
 * Decoupled integration module for dynamic leads rendering.
 */
(function () {
  // ── INTERNAL APP STATE ──
  let allLeads = [];
  let filteredLeads = [];
  let currentPage = 1;
  let pageSize = 10;
  let statusFilter = "All";
  let searchQuery = "";
  let headerRestored = true;

  // ── DYNAMIC CSS STYLES INJECTION ──
  const leadsStyles = `
    /* Custom Header Layout override */
    .qm-header-inline.leads-active {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      gap: 16px;
    }

    .qm-header-left-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .qm-header-avatar {
      width: 38px;
      height: 38px;
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 0 15px var(--glow-shadow-weak);
    }

    .qm-header-titles {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .qm-header-titles h2 {
      font-size: 18px !important;
      font-weight: 800 !important;
      letter-spacing: 0.5px !important;
      margin: 0 !important;
      background: linear-gradient(135deg, #fff, var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .light-mode .qm-header-titles h2 {
      background: linear-gradient(135deg, var(--text), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .qm-header-subtitle {
      font-size: 11px;
      color: var(--muted);
      margin: 0;
    }

    .qm-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .qm-action-btn {
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 14px;
      border-radius: 20px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }

    .qm-action-btn:hover {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px var(--glow-shadow);
    }

    .qm-action-btn:active {
      transform: translateY(0);
    }

    /* Leads Container Layout */
    .leads-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      min-height: 400px;
    }

    #quick-module-view .qm-content-area {
      padding: 16px 24px !important;
    }

    /* Controls Bar */
    .leads-controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .leads-search-wrapper {
      position: relative;
      flex: 1;
      min-width: 200px;
      max-width: 320px;
    }

    .leads-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      pointer-events: none;
      font-size: 13px;
    }

    .leads-search-input {
      width: 100%;
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 12px 8px 34px;
      border-radius: 20px;
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: all 0.3s ease;
    }

    .leads-search-input:focus {
      border-color: var(--accent2);
      box-shadow: 0 0 8px var(--glow-shadow-medium);
      background: rgba(255, 255, 255, 0.05);
    }

    .light-mode .leads-search-input:focus {
      background: #fff;
    }

    .leads-actions-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .leads-filter-btn {
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 8px 14px;
      border-radius: 20px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s ease;
      user-select: none;
    }

    .leads-filter-btn:hover, .leads-filter-btn.active {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px var(--glow-shadow);
    }

    .leads-page-size-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-size-lbl {
      font-size: 12px;
      color: var(--muted);
    }

    .leads-page-size-select {
      background: var(--bg2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 12px;
      font-family: inherit;
      font-size: 12px;
      outline: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .leads-page-size-select:focus {
      border-color: var(--accent2);
    }

    /* Filter panel popup */
    .leads-filter-panel {
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      transition: all 0.3s ease;
    }

    .leads-filter-panel.hidden {
      display: none;
    }

    .filter-panel-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--muted);
      margin-right: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-filter-btn {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 16px;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .status-filter-btn:hover {
      background: var(--glass2);
    }

    .status-filter-btn.active {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      box-shadow: 0 0 8px var(--glow-shadow-medium);
    }

    /* Table Container (Glassmorphic & Scrollable) */
    .leads-table-container {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--glass);
      box-shadow: var(--shadow);
      max-height: calc(100vh - 275px);
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }

    .light-mode .leads-table-container {
      background: var(--bg2);
    }

    .leads-table-container::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    .leads-table-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .leads-table-container::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 3px;
    }

    .leads-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      table-layout: fixed;
    }

    .leads-table th {
      position: sticky;
      top: 0;
      background: var(--bg2);
      color: var(--text);
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 14px;
      border-bottom: 2px solid var(--border);
      border-right: 1px solid var(--border);
      z-index: 10;
    }

    .leads-table th:last-child {
      border-right: none;
    }

    .leads-table td {
      padding: 8px 14px;
      font-size: 13px;
      color: var(--text);
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .leads-table td:last-child {
      border-right: none;
    }

    .leads-table tr:last-child td {
      border-bottom: none;
    }

    .leads-table-body tr {
      transition: all 0.25s ease;
    }

    .leads-table-body tr:hover {
      background: var(--glass2);
    }

    /* Link and Action Styles */
    .lead-id-link {
      color: var(--accent2);
      text-decoration: none;
      font-weight: 700;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .lead-id-link:hover {
      color: #fff;
      text-shadow: 0 0 8px var(--accent2);
      text-decoration: underline;
    }

    .leads-table-action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .leads-table-action-btn:hover {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      box-shadow: 0 0 10px var(--glow-shadow-medium);
      transform: translateY(-1px);
    }

    /* Col Widths */
    .col-id { width: 16%; }
    .col-prod { width: 34%; }
    .col-status { width: 18%; }
    .col-date { width: 16%; }
    .col-action { width: 16%; }

    @media (max-width: 768px) {
      .col-id { width: 22%; }
      .col-prod { width: 28%; }
      .col-status { width: 18%; }
      .col-date { width: 16%; }
      .col-action { width: 16%; }
    }

    /* Status Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 10px;
      min-width: 84px;
      text-align: center;
    }

    .status-badge.approved {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.25);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
    }

    .status-badge.pending {
      background: rgba(245, 158, 11, 0.12);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.25);
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.1);
    }

    .status-badge.in-progress {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.25);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
    }

    .status-badge.rejected {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
    }

    /* Footer Section */
    .leads-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      padding-top: 6px;
    }

    .leads-indicator {
      font-size: 12px;
      color: var(--muted);
    }

    .leads-pagination {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .leads-page-btn {
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 12px;
      border-radius: 14px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .leads-page-btn:hover:not(:disabled) {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      transform: translateY(-1px);
    }

    .leads-page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .leads-page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .leads-num-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .leads-num-btn:hover {
      background: var(--glass2);
      border-color: var(--border);
    }

    .leads-num-btn.active {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      box-shadow: 0 0 10px var(--glow-shadow);
    }

    /* Leads Toast Overlay */
    .leads-toast {
      position: fixed;
      bottom: -100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent);
      border: 1px solid var(--accent2);
      color: #fff;
      padding: 12px 24px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transition: bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .leads-toast.show {
      bottom: 30px;
    }
  `;

  // ── INJECT THE CSS ──
  $(function () {
    const $style = $("<style>").text(leadsStyles);
    $("head").append($style);
  });

  // ── TOAST NOTIFICATION UTILITY ──
  function showToast(message) {
    let $toast = $(".leads-toast");
    if (!$toast.length) {
      $toast = $("<div class='leads-toast'></div>");
      $("body").append($toast);
    }
    $toast.text(message);
    $toast.addClass("show");
    setTimeout(() => {
      $toast.removeClass("show");
    }, 2500);
  }

  // ── CUSTOM HEADER RENDERING ──
  function renderLeadsHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("leads-active")) {
      $header.addClass("leads-active");
      $header.empty();

      const headerHtml = `
        <div class="qm-header-left-wrap">
          <div class="qm-header-avatar">🎯</div>
          <div class="qm-header-titles">
            <h2 id="qm-title">LEADS INFORMATION</h2>
            <p class="qm-header-subtitle">Customer leads and acquisition details</p>
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
    if ($header.length && $header.hasClass("leads-active")) {
      $header.removeClass("leads-active");
      $header.empty();
      $header.append(`<h2 id="qm-title">${title}</h2>`);
      headerRestored = true;
    }
  }

  // Subscribe to customer ID changes
  if (window.ParamsData) {
    window.ParamsData.subscribe('customerId', function (newCid) {
      // If Leads module is currently open and active in the DOM, reload leads
      const $header = $(".qm-header-inline");
      if ($header.length && $header.hasClass("leads-active")) {
        loadLeads();
      }
    });
  }

  // ── LOAD LEADS DATA ──
  function loadLeads() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    // Use standard loaders from ui-renderer.js
    if (window.UIRenderer) {
      window.UIRenderer.showLoader("#qm-content");
    } else {
      $content.html("<div style='text-align:center; padding: 40px;'>Loading...</div>");
    }

    // Extract customer ID dynamically from global storage
    const customerParam = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
    if (!customerParam) {
      if (window.UIRenderer) {
        window.UIRenderer.showEmptyState("#qm-content");
      } else {
        $content.html("<div style='text-align:center; padding: 40px;'>No active customer ID.</div>");
      }
      return;
    }

    // Call ApiService to fetch
    const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.LEADS;
    const paramKey = (window.API_CONFIG && window.API_CONFIG.PARAMS && window.API_CONFIG.PARAMS.CUSTOMER_ID) || "customerId";
    const params = {};
    params[paramKey] = customerParam;

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        params,
        function (response) {
          if (window.UIRenderer) window.UIRenderer.hideLoader("#qm-content");
          
          let dataList = null;
          if (response && response.data) {
            dataList = response.data;
          } else if (Array.isArray(response)) {
            dataList = response;
          }

          if (dataList && dataList.length > 0) {
            allLeads = dataList;
            initLeadsLayout();
          } else {
            if (window.UIRenderer) {
              window.UIRenderer.showEmptyState("#qm-content");
            } else {
              $content.html("<div style='text-align:center; padding: 40px;'>No leads data available.</div>");
            }
          }
        },
        function (error) {
          if (window.UIRenderer) {
            window.UIRenderer.showError("#qm-content", error || "Failed to load leads", function () {
              loadLeads();
            });
          } else {
            $content.html(`<div style='text-align:center; padding: 40px; color:#ef4444;'>Failed to load leads: ${error}</div>`);
          }
        }
      );
    } else {
      if (window.UIRenderer) {
        window.UIRenderer.showError("#qm-content", "API Service unavailable", function () {
          loadLeads();
        });
      } else {
        $content.html("<div style='text-align:center; padding: 40px; color:#ef4444;'>API Service unavailable</div>");
      }
    }
  }

  // ── INITIALIZE LEADS LAYOUT IN THE CONTENT AREA ──
  function initLeadsLayout() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    const layoutHtml = `
      <div class="leads-container">
        <!-- Controls Bar -->
        <div class="leads-controls-bar">
          <div class="leads-search-wrapper">
            <span class="leads-search-icon">🔍</span>
            <input type="text" class="leads-search-input" placeholder="Search product or lead ID...">
          </div>
          <div class="leads-actions-wrapper">
            <button class="leads-filter-btn" id="leads-filter-toggle">
              <span>⧩</span> Filter by Status
            </button>
            <div class="leads-page-size-wrapper">
              <span class="page-size-lbl">Show:</span>
              <select class="leads-page-size-select" id="leads-page-size">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Hidden Filter Panel -->
        <div class="leads-filter-panel hidden" id="leads-filter-panel">
          <span class="filter-panel-title">Filter status:</span>
          <button class="status-filter-btn active" data-status="All">All</button>
          <button class="status-filter-btn" data-status="Approved">Approved</button>
          <button class="status-filter-btn" data-status="Pending">Pending</button>
          <button class="status-filter-btn" data-status="In Progress">In Progress</button>
          <button class="status-filter-btn" data-status="Rejected">Rejected</button>
        </div>

        <!-- Data Grid Table -->
        <div class="leads-table-container">
          <table class="leads-table">
            <thead>
              <tr>
                <th class="col-id">Lead ID</th>
                <th class="col-prod">Product</th>
                <th class="col-status">Status</th>
                <th class="col-date">Created Date</th>
                <th class="col-action" style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody class="leads-table-body" id="leads-tbody">
              <!-- Content rendered dynamically -->
            </tbody>
          </table>
        </div>

        <!-- Footer Pagination -->
        <div class="leads-footer">
          <div class="leads-indicator" id="leads-indicator">
            Showing 0 to 0 of 0 records
          </div>
          <div class="leads-pagination">
            <button class="leads-page-btn" id="leads-prev-btn">Previous</button>
            <div class="leads-page-numbers" id="leads-page-numbers">
              <!-- Numeric pagination links -->
            </div>
            <button class="leads-page-btn" id="leads-next-btn">Next</button>
          </div>
        </div>
      </div>
    `;

    $content.html(layoutHtml);

    // Bind Event Listeners
    $(".leads-search-input").on("input", function () {
      searchQuery = $(this).val().toLowerCase().trim();
      currentPage = 1;
      applyFiltersAndRender();
    });

    $("#leads-filter-toggle").on("click", function () {
      $(this).toggleClass("active");
      $("#leads-filter-panel").toggleClass("hidden");
    });

    $(".status-filter-btn").on("click", function () {
      $(".status-filter-btn").removeClass("active");
      $(this).addClass("active");
      statusFilter = $(this).attr("data-status");
      currentPage = 1;
      applyFiltersAndRender();
    });

    $("#leads-page-size").on("change", function () {
      pageSize = parseInt($(this).val(), 10);
      currentPage = 1;
      applyFiltersAndRender();
    });

    $("#leads-prev-btn").on("click", function () {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndRender();
      }
    });

    $("#leads-next-btn").on("click", function () {
      const maxPage = Math.ceil(filteredLeads.length / pageSize);
      if (currentPage < maxPage) {
        currentPage++;
        applyFiltersAndRender();
      }
    });

    // Initial render
    currentPage = 1;
    applyFiltersAndRender();
  }

  // ── FILTER DATA AND RENDER THE GRID ──
  function applyFiltersAndRender() {
    const $tbody = $("#leads-tbody");
    if (!$tbody.length) return;

    // 1. Apply Search and Status Filter
    filteredLeads = allLeads.filter(lead => {
      const matchesSearch =
        lead.leadId.toLowerCase().includes(searchQuery) ||
        lead.product.toLowerCase().includes(searchQuery);

      const matchesStatus =
        statusFilter === "All" ||
        lead.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    const totalRecords = filteredLeads.length;

    // 2. Pagination Boundaries
    const maxPage = Math.ceil(totalRecords / pageSize) || 1;
    if (currentPage > maxPage) currentPage = maxPage;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalRecords);

    // 3. Render Table Body Rows
    $tbody.empty();

    if (totalRecords === 0) {
      $tbody.append(`
        <tr>
          <td colspan="5" style="text-align: center; color: var(--muted); font-style: italic;">
            No leads match your search criteria.
          </td>
        </tr>
      `);
    } else {
      const pageData = filteredLeads.slice(startIdx, endIdx);
      pageData.forEach(lead => {
        const statusClass = lead.status.toLowerCase().replace(/\s+/g, "-");
        const rowHtml = `
          <tr>
            <td class="col-id" style="font-family: 'JetBrains Mono', monospace;">
              <a href="modules/lead/lead-detail.html?id=${lead.leadId}" target="_blank" class="lead-id-link" title="Open details for ${escapeHtml(lead.leadId)} in new tab">${escapeHtml(lead.leadId)}</a>
            </td>
            <td class="col-prod" style="font-weight: 600;">${escapeHtml(lead.product)}</td>
            <td class="col-status">
              <span class="status-badge ${statusClass}">${escapeHtml(lead.status)}</span>
            </td>
            <td class="col-date" style="color: var(--muted);">${escapeHtml(lead.createdDate)}</td>
            <td class="col-action" style="text-align: center;">
              <a href="modules/lead/lead-detail.html?id=${lead.leadId}" target="_blank" class="leads-table-action-btn" title="View details for ${escapeHtml(lead.leadId)}">👁️ View</a>
            </td>
          </tr>
        `;
        $tbody.append(rowHtml);
      });
    }

    // 4. Update Records Indicator
    const displayStart = totalRecords === 0 ? 0 : startIdx + 1;
    $("#leads-indicator").html(`
      Showing <strong>${displayStart}</strong> to <strong>${endIdx}</strong> of <strong>${totalRecords}</strong> records
    `);

    // 5. Update Prev/Next Buttons state
    $("#leads-prev-btn").prop("disabled", currentPage === 1);
    $("#leads-next-btn").prop("disabled", currentPage === maxPage);

    // 6. Render Numeric Page Links
    const $pageNumContainer = $("#leads-page-numbers");
    $pageNumContainer.empty();

    for (let p = 1; p <= maxPage; p++) {
      const activeClass = p === currentPage ? "active" : "";
      const $btn = $(`<button class="leads-num-btn ${activeClass}">${p}</button>`);
      $btn.on("click", function () {
        currentPage = p;
        applyFiltersAndRender();
      });
      $pageNumContainer.append($btn);
    }
  }

  // Helper for escaping HTML strings
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ── MUTATIONOBSERVER ON QUICK MODULE TITLES ──
  $(function () {
    const $titleNode = $("#qm-title");
    if (!$titleNode.length) return;

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        const text = $titleNode.text().trim();
        if (text === "Lead Module") {
          renderLeadsHeader();
          loadLeads();
        } else if (text !== "" && !text.includes("LEADS INFORMATION") && !headerRestored) {
          // Navigated to another quick access module
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
