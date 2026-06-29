/**
 * Case Information Module
 * Decoupled module that handles rendering of client cases in a layout matching the Leads module design.
 */
(function () {
  // Module State
  let allCases = [];
  let filteredCases = [];
  let sortColumn = "createdDate";
  let sortDirection = "desc";
  let currentPage = 1;
  let pageSize = 10;
  let searchQuery = "";
  let statusFilter = "All";
  let headerRestored = true;

  // CSS Stylesheets matching the Leads Module design system
  const casesStyles = `
    /* CSS for Case Module matching Leads layout - Optimized for High Density */
    .cases-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      animation: casesFadeIn 0.4s ease;
    }
    
    @keyframes casesFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Controls Bar */
    .cases-controls-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .cases-search-wrapper {
      position: relative;
      flex: 1;
      min-width: 260px;
      max-width: 400px;
    }

    .cases-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      color: var(--muted);
      pointer-events: none;
    }

    .cases-search-input {
      width: 100%;
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 30px;
      color: var(--text);
      padding: 7px 14px 7px 35px;
      font-family: inherit;
      font-size: 12.5px;
      transition: all 0.3s ease;
      outline: none;
    }

    .cases-search-input:focus {
      border-color: var(--accent2);
      box-shadow: 0 0 10px var(--glow-shadow-medium);
      background: var(--glass2);
    }

    .cases-actions-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cases-filter-btn {
      background: var(--glass);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 7px 15px;
      border-radius: 30px;
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s ease;
    }

    .cases-filter-btn:hover, .cases-filter-btn.active {
      background: var(--glass2);
      border-color: var(--accent);
      box-shadow: 0 0 8px var(--glow-shadow);
    }

    .cases-page-size-wrapper {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-size-lbl {
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cases-page-size-select {
      background: var(--glass);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 5px 10px;
      border-radius: 20px;
      font-family: inherit;
      font-size: 12.5px;
      outline: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cases-page-size-select:focus {
      border-color: var(--accent2);
      background: var(--glass2);
    }

    /* Filter Panel */
    .cases-filter-panel {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      background: var(--glass2);
      border: 1px dashed var(--border);
      padding: 8px 12px;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .cases-filter-panel.hidden {
      display: none;
    }

    .filter-panel-title {
      font-size: 11px;
      color: var(--muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-right: 4px;
    }

    .status-filter-btn {
      background: var(--glass);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 20px;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .status-filter-btn:hover {
      background: var(--glass2);
      border-color: var(--accent);
    }

    .status-filter-btn.active {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      box-shadow: 0 0 8px var(--glow-shadow);
    }

    /* Data Grid Table */
    .cases-table-container {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--glass);
      box-shadow: var(--shadow);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
    }

    .cases-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 12px;
    }

    .cases-table th, .cases-table td {
      padding: 6px 10px;
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
    }

    .cases-table th:last-child, .cases-table td:last-child {
      border-right: none;
    }

    .cases-table th {
      background: var(--bg2);
      color: var(--text);
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-size: 10.5px;
      user-select: none;
      cursor: pointer;
      position: sticky;
      top: 0;
      z-index: 10;
      transition: background-color var(--transition);
    }

    .cases-table th:hover {
      background: var(--glass2);
    }

    .cases-table tbody tr {
      transition: background-color 0.2s ease;
    }

    .cases-table tbody tr:hover {
      background: var(--glass2);
    }

    .cases-table tbody tr:last-child td {
      border-bottom: none;
    }

    /* Col Widths */
    .col-id { width: 14%; }
    .col-type { width: 15%; }
    .col-req { width: 27%; }
    .col-status { width: 16%; }
    .col-date { width: 14%; }
    .col-action { width: 14%; }

    @media (max-width: 768px) {
      .col-id { width: 18%; }
      .col-type { width: 16%; }
      .col-req { width: 22%; }
      .col-status { width: 16%; }
      .col-date { width: 14%; }
      .col-action { width: 14%; }
    }

    .case-id-link {
      color: var(--accent2);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .case-id-link:hover {
      color: var(--text);
      text-decoration: underline;
    }

    /* Table Actions Button */
    .cases-table-action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 3px 8px;
      border-radius: 14px;
      font-size: 10.5px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .cases-table-action-btn:hover {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      box-shadow: 0 0 10px var(--glow-shadow-medium);
      transform: translateY(-1px);
    }

    /* Status & Type Badges */
    .status-badge, .type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 74px;
      text-align: center;
    }

    .status-badge.open {
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

    .status-badge.resolved {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.25);
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
    }

    .status-badge.closed {
      background: rgba(148, 163, 184, 0.12);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.25);
      box-shadow: 0 0 10px rgba(148, 163, 184, 0.1);
    }

    .status-badge.rejected {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
    }

    .type-badge.complaint {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.25);
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.1);
      min-width: auto;
      padding: 2px 8px;
    }

    .type-badge.request {
      background: rgba(59, 130, 246, 0.12);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.25);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.1);
      min-width: auto;
      padding: 2px 8px;
    }

    /* Footer Section */
    .cases-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
      padding-top: 3px;
    }

    .cases-indicator {
      font-size: 11.5px;
      color: var(--muted);
    }

    .cases-pagination {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .cases-page-btn {
      background: var(--glass2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 10px;
      border-radius: 14px;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .cases-page-btn:hover:not(:disabled) {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      transform: translateY(-1px);
    }

    .cases-page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .cases-page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .cases-num-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: inherit;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cases-num-btn:hover {
      background: var(--glass2);
      border-color: var(--border);
    }

    .cases-num-btn.active {
      background: var(--accent);
      border-color: var(--accent2);
      color: #fff;
      box-shadow: 0 0 10px var(--glow-shadow);
    }


    .cases-sort-indicator {
      margin-left: 5px;
      font-size: 10px;
      color: var(--accent2);
    }
  `;

  // Inject Styles dynamically
  $(function () {
    const $style = $("<style>").text(casesStyles);
    $("head").append($style);
  });



  // Subscribe to customer ID changes
  if (window.ParamsData) {
    window.ParamsData.subscribe('customerId', function (newCid) {
      // If Case module is currently open and active in the DOM, reload cases
      const $header = $(".qm-header-inline");
      if ($header.length && $header.hasClass("cases-active")) {
        loadCases();
      }
    });
  }

  // ── CUSTOM HEADER RENDERING ──
  function renderCasesHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("cases-active")) {
      $header.addClass("cases-active");
      $header.empty();

      const headerHtml = `
        <div class="qm-header-left-wrap" style="display: flex; align-items: center; gap: 15px;">
          <div class="qm-header-avatar" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--glass2); border: 1px solid var(--border); box-shadow: 0 0 10px var(--glow-shadow); font-size: 22px;">📁</div>
          <div class="qm-header-titles" style="display: flex; flex-direction: column;">
            <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: 1px; margin: 0; text-transform: uppercase; font-family: 'Outfit', sans-serif;">CASE INFORMATION</h2>
            <p class="qm-header-subtitle" style="font-size: 13px; color: var(--muted); margin-top: 2px; font-weight: 400; margin-bottom: 0;">Customer complaints and service requests</p>
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
    if ($header.length && $header.hasClass("cases-active")) {
      $header.removeClass("cases-active");
      $header.empty();
      $header.append(`<h2 id="qm-title">${title}</h2>`);
      headerRestored = true;
    }
  }

  // Fetch data from endpoint
  function loadCases() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    if (window.UIRenderer) {
      window.UIRenderer.showLoader("#qm-content");
    } else {
      $content.html("<div style='text-align:center; padding: 40px;'>Loading...</div>");
    }

    const cid = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
    if (!cid) {
      if (window.UIRenderer) {
        window.UIRenderer.showEmptyState("#qm-content");
      } else {
        $content.html("<div style='text-align:center; padding: 40px;'>No active customer ID.</div>");
      }
      return;
    }
    const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.CASES;
    const paramKey = (window.API_CONFIG && window.API_CONFIG.PARAMS && window.API_CONFIG.PARAMS.CUSTOMER_ID) || "customerId";
    const params = {};
    params[paramKey] = cid;

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
            allCases = dataList.filter(c => c.customer === cid);
            if (allCases.length > 0) {
              initCasesLayout();
            } else {
              if (window.UIRenderer) {
                window.UIRenderer.showEmptyState("#qm-content");
              } else {
                $content.html("<div style='text-align:center; padding: 40px;'>No case data available.</div>");
              }
            }
          } else {
            if (window.UIRenderer) {
              window.UIRenderer.showEmptyState("#qm-content");
            } else {
              $content.html("<div style='text-align:center; padding: 40px;'>No case data available.</div>");
            }
          }
        },
        function (errorMessage) {
          if (window.UIRenderer) {
            window.UIRenderer.showError("#qm-content", errorMessage || "Failed to load cases", function () {
              loadCases();
            });
          } else {
            $content.html(`<div style='text-align:center; padding: 40px; color:#ef4444;'>Failed to load cases: ${errorMessage}</div>`);
          }
        }
      );
    } else {
      console.error("ApiService not found.");
    }
  }

  // Initialize Case Layout
  function initCasesLayout() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    const layoutHtml = `
      <div class="cases-container">
        <!-- Controls Bar -->
        <div class="cases-controls-bar">
          <div class="cases-search-wrapper">
            <span class="cases-search-icon">🔍</span>
            <input type="text" class="cases-search-input" placeholder="Search request or case ID...">
          </div>
          <div class="cases-actions-wrapper">
            <button class="cases-filter-btn" id="cases-filter-toggle">
              <span>⧩</span> Filter by Status
            </button>
            <div class="cases-page-size-wrapper">
              <span class="page-size-lbl">Show:</span>
              <select class="cases-page-size-select" id="cases-page-size">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Hidden Filter Panel -->
        <div class="cases-filter-panel hidden" id="cases-filter-panel">
          <span class="filter-panel-title">Filter status:</span>
          <button class="status-filter-btn active" data-status="All">All</button>
          <button class="status-filter-btn" data-status="Open">Open</button>
          <button class="status-filter-btn" data-status="In Progress">In Progress</button>
          <button class="status-filter-btn" data-status="Resolved">Resolved</button>
          <button class="status-filter-btn" data-status="Closed">Closed</button>
          <button class="status-filter-btn" data-status="Rejected">Rejected</button>
        </div>

        <!-- Data Grid Table -->
        <div class="cases-table-container">
          <table class="cases-table">
            <thead>
              <tr>
                <th class="col-id" data-column="caseId">Case ID <span class="cases-sort-indicator"></span></th>
                <th class="col-type" data-column="caseType">Case Type <span class="cases-sort-indicator"></span></th>
                <th class="col-req" data-column="requestType">Request Type <span class="cases-sort-indicator"></span></th>
                <th class="col-status" data-column="status">Status <span class="cases-sort-indicator"></span></th>
                <th class="col-date" data-column="createdDate">Created Date <span class="cases-sort-indicator"></span></th>
                <th class="col-action" style="text-align: center; cursor: default;">Actions</th>
              </tr>
            </thead>
            <tbody class="cases-table-body" id="cases-tbody">
              <!-- Rendered Dynamically -->
            </tbody>
          </table>
        </div>

        <!-- Footer Pagination -->
        <div class="cases-footer">
          <div class="cases-indicator" id="cases-indicator">
            Showing 0 to 0 of 0 records
          </div>
          <div class="cases-pagination">
            <button class="cases-page-btn" id="cases-prev-btn">Previous</button>
            <div class="cases-page-numbers" id="cases-page-numbers">
              <!-- Numeric pagination links -->
            </div>
            <button class="cases-page-btn" id="cases-next-btn">Next</button>
          </div>
        </div>
      </div>
    `;

    $content.html(layoutHtml);

    // Bind Event Listeners
    $(".cases-search-input").on("input", function () {
      searchQuery = $(this).val().toLowerCase().trim();
      currentPage = 1;
      applyFiltersAndRender();
    });

    $("#cases-filter-toggle").on("click", function () {
      $(this).toggleClass("active");
      $("#cases-filter-panel").toggleClass("hidden");
    });

    $(".status-filter-btn").on("click", function () {
      $(".status-filter-btn").removeClass("active");
      $(this).addClass("active");
      statusFilter = $(this).attr("data-status");
      currentPage = 1;
      applyFiltersAndRender();
    });

    $("#cases-page-size").on("change", function () {
      pageSize = parseInt($(this).val(), 10);
      currentPage = 1;
      applyFiltersAndRender();
    });

    $("#cases-prev-btn").on("click", function () {
      if (currentPage > 1) {
        currentPage--;
        applyFiltersAndRender();
      }
    });

    $("#cases-next-btn").on("click", function () {
      const maxPage = Math.ceil(filteredCases.length / pageSize);
      if (currentPage < maxPage) {
        currentPage++;
        applyFiltersAndRender();
      }
    });

    $(".cases-table th").on("click", function () {
      const col = $(this).attr("data-column");
      if (!col) return; // Ignore action column

      if (sortColumn === col) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortColumn = col;
        sortDirection = "asc";
      }
      applyFiltersAndRender();
    });

    // Initial render
    currentPage = 1;
    applyFiltersAndRender();
  }

  // Filter, Sort, and Render cases
  function applyFiltersAndRender() {
    const $tbody = $("#cases-tbody");
    if (!$tbody.length) return;

    // 1. Filter
    filteredCases = allCases.filter((item) => {
      const s = searchQuery;
      const matchesSearch =
        item.caseId.toLowerCase().includes(s) ||
        item.caseType.toLowerCase().includes(s) ||
        item.requestType.toLowerCase().includes(s) ||
        item.status.toLowerCase().includes(s) ||
        item.createdDate.toLowerCase().includes(s);

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // 2. Sort
    filteredCases.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    // Update Sorting Icons in DOM
    $(".cases-table th").each(function () {
      const col = $(this).attr("data-column");
      const $indicator = $(this).find(".cases-sort-indicator");
      if (col) {
        if (col === sortColumn) {
          $indicator.text(sortDirection === "asc" ? " ▲" : " ▼");
        } else {
          $indicator.text("");
        }
      }
    });

    const totalRecords = filteredCases.length;

    // 3. Pagination bounds
    const maxPage = Math.ceil(totalRecords / pageSize) || 1;
    if (currentPage > maxPage) currentPage = maxPage;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalRecords);

    // 4. Render Rows
    $tbody.empty();

    if (totalRecords === 0) {
      $tbody.append(`
        <tr>
          <td colspan="6" style="text-align: center; color: var(--muted); font-style: italic; padding: 30px;">
            No cases match your search criteria.
          </td>
        </tr>
      `);
    } else {
      const pageData = filteredCases.slice(startIdx, endIdx);
      pageData.forEach((item) => {
        const typeClass =
          item.caseType.toLowerCase() === "complaint" ? "complaint" : "request";
        
        let statusClass = "closed";
        const statusLower = item.status.toLowerCase();
        if (statusLower === "open") statusClass = "open";
        else if (statusLower === "in progress") statusClass = "in-progress";
        else if (statusLower === "resolved") statusClass = "resolved";
        else if (statusLower === "rejected") statusClass = "rejected";

        const detailUrl = `modules/case/case-detail.html?id=${encodeURIComponent(item.caseId)}`;

        const rowHtml = `
          <tr>
            <td class="col-id" style="font-family: 'JetBrains Mono', monospace;">
              <a href="${detailUrl}" target="_blank" class="case-id-link" title="Open details for ${escapeHtml(item.caseId)} in new tab">${escapeHtml(item.caseId)}</a>
            </td>
            <td class="col-type">
              <span class="type-badge ${typeClass}">${escapeHtml(item.caseType)}</span>
            </td>
            <td class="col-req" style="font-weight: 600;">${escapeHtml(item.requestType)}</td>
            <td class="col-status">
              <span class="status-badge ${statusClass}">${escapeHtml(item.status)}</span>
            </td>
            <td class="col-date" style="color: var(--muted);">${escapeHtml(item.createdDate)}</td>
            <td class="col-action" style="text-align: center;">
              <a href="${detailUrl}" target="_blank" class="cases-table-action-btn" title="View details for ${escapeHtml(item.caseId)}">👁️ View</a>
            </td>
          </tr>
        `;
        $tbody.append(rowHtml);
      });
    }

    // 5. Update Records Indicator
    const displayStart = totalRecords === 0 ? 0 : startIdx + 1;
    $("#cases-indicator").html(`
      Showing <strong>${displayStart}</strong> to <strong>${endIdx}</strong> of <strong>${totalRecords}</strong> records
    `);

    // 6. Update Prev/Next Buttons state
    $("#cases-prev-btn").prop("disabled", currentPage === 1);
    $("#cases-next-btn").prop("disabled", currentPage === maxPage);

    // 7. Render Numeric Page Links
    const $pageNumContainer = $("#cases-page-numbers");
    $pageNumContainer.empty();

    for (let p = 1; p <= maxPage; p++) {
      const activeClass = p === currentPage ? "active" : "";
      const $btn = $(`<button class="cases-num-btn ${activeClass}">${p}</button>`);
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
        if (text === "Case Module") {
          renderCasesHeader();
          loadCases();
        } else if (text !== "" && !text.includes("CASE INFORMATION") && !headerRestored) {
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
