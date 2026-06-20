/**
 * Case Information Module
 * Decoupled module that handles rendering of client cases in a high-density table grid.
 */
(function () {
  // Module State
  let allCases = [];
  let filteredCases = [];
  let sortColumn = "createdDate";
  let sortDirection = "desc";
  let currentPage = 1;
  let pageSize = 5;
  let searchText = "";
  let statusFilter = "All";
  let wasActive = false;
  let defaultHeaderHTML = "";

  // Inject Custom Stylesheets for Premium Design & Layout
  function injectStyles() {
    if (document.getElementById("case-module-styles")) return;

    const style = document.createElement("style");
    style.id = "case-module-styles";
    style.textContent = `
      /* Root variables for light/dark sensitive colors */
      :root {
        --case-color-red: #ff5252;
        --case-color-blue: #40a9ff;
        --case-color-orange: #ff9f43;
        --case-color-green: #2ed573;
        --case-color-grey: #a4b0be;
      }
      :root.light-mode {
        --case-color-red: #d32f2f;
        --case-color-blue: #1890ff;
        --case-color-orange: #d35400;
        --case-color-green: #27ae60;
        --case-color-grey: #7f8c8d;
      }

      /* Header Restructuring styles */
      .qm-header-inline.case-header-active {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        border-bottom: 1px solid var(--border);
        padding-bottom: 15px;
        margin-bottom: 20px;
      }
      .qm-header-left-part {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .qm-header-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--glass2);
        border: 1px solid var(--border);
        box-shadow: 0 0 10px var(--glow-shadow);
        font-size: 22px;
      }
      .qm-header-titles {
        display: flex;
        flex-direction: column;
      }
      .qm-header-titles h2 {
        font-size: 20px;
        font-weight: 700;
        color: var(--text);
        letter-spacing: 1px;
        margin: 0;
        text-transform: uppercase;
        font-family: 'Outfit', sans-serif;
      }
      .qm-subtitle {
        font-size: 13px;
        color: var(--muted);
        margin-top: 2px;
        font-weight: 400;
      }
      .qm-header-right-part {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .qm-header-btn {
        background: var(--glass);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        font-family: 'Outfit', sans-serif;
        cursor: pointer;
        transition: background-color var(--transition), border-color var(--transition), transform 0.2s ease;
      }
      .qm-header-btn:hover {
        background: var(--glass2);
        border-color: var(--accent);
        transform: translateY(-1px);
        box-shadow: 0 0 8px var(--glow-shadow);
      }
      .qm-header-btn:active {
        transform: translateY(0);
      }

      /* Case module wrappers */
      .case-module-wrapper {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 100%;
        animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Control elements */
      .case-controls-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
        flex-wrap: wrap;
        background: var(--glass);
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .case-controls-left, .case-controls-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .case-input, .case-select {
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid var(--border);
        color: var(--text);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color var(--transition), box-shadow var(--transition);
      }
      :root.light-mode .case-input, :root.light-mode .case-select {
        background: rgba(255, 255, 255, 0.85);
      }
      .case-input:focus, .case-select:focus {
        border-color: var(--accent);
        box-shadow: 0 0 6px var(--glow-shadow);
      }
      .case-input::placeholder {
        color: var(--muted);
        opacity: 0.8;
      }

      /* High Density Table styles */
      .case-table-wrapper {
        overflow-x: auto;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--glass);
        box-shadow: var(--shadow);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .case-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
        font-size: 13px;
      }
      .case-table th, .case-table td {
        padding: 10px 14px;
        border-bottom: 1px solid var(--border);
        border-right: 1px solid var(--border);
      }
      .case-table th:last-child, .case-table td:last-child {
        border-right: none;
      }
      .case-table th {
        background: var(--bg2);
        color: var(--text);
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-size: 11px;
        user-select: none;
        cursor: pointer;
        position: sticky;
        top: 0;
        z-index: 10;
        transition: background-color var(--transition);
      }
      .case-table th:hover {
        background: var(--glass2);
      }
      .case-table tbody tr {
        transition: background-color 0.2s ease;
      }
      .case-table tbody tr:hover {
        background: var(--glass2);
      }
      .case-table tbody tr:last-child td {
        border-bottom: none;
      }

      /* Cell elements */
      .case-link {
        color: var(--accent2);
        text-decoration: none;
        font-weight: 600;
        transition: color 0.2s ease;
      }
      .case-link:hover {
        color: var(--accent);
        text-decoration: underline;
      }
      
      /* Badges styling */
      .case-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 1px solid transparent;
      }
      .case-badge.badge-type-complaint {
        border-color: var(--case-color-red);
        color: var(--case-color-red);
        background: rgba(255, 82, 82, 0.08);
      }
      .case-badge.badge-type-request {
        border-color: var(--case-color-blue);
        color: var(--case-color-blue);
        background: rgba(64, 169, 255, 0.08);
      }
      .case-badge.badge-status-open {
        border-color: var(--case-color-orange);
        color: var(--case-color-orange);
        background: rgba(255, 159, 67, 0.08);
      }
      .case-badge.badge-status-inprogress {
        border-color: var(--case-color-blue);
        color: var(--case-color-blue);
        background: rgba(64, 169, 255, 0.08);
      }
      .case-badge.badge-status-resolved {
        border-color: var(--case-color-green);
        color: var(--case-color-green);
        background: rgba(46, 213, 115, 0.08);
      }
      .case-badge.badge-status-closed {
        border-color: var(--case-color-grey);
        color: var(--case-color-grey);
        background: rgba(164, 176, 190, 0.08);
      }
      .case-badge.badge-status-rejected {
        border-color: var(--case-color-red);
        color: var(--case-color-red);
        background: rgba(255, 82, 82, 0.08);
      }

      /* View Actions button */
      .case-action-btn {
        display: inline-block;
        background: var(--accent);
        color: #fff;
        border: 1px solid var(--accent);
        border-radius: 4px;
        padding: 4px 10px;
        font-size: 11px;
        text-decoration: none;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-align: center;
        transition: background var(--transition), border-color var(--transition), transform 0.1s ease;
      }
      .case-action-btn:hover {
        background: var(--accent2);
        border-color: var(--accent2);
        transform: scale(1.03);
      }

      /* Sorting indicator */
      .case-sort-indicator {
        margin-left: 5px;
        font-size: 10px;
        color: var(--accent2);
      }

      /* Pagination controls */
      .case-pagination-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        background: var(--glass);
        border-radius: 12px;
        border: 1px solid var(--border);
        flex-wrap: wrap;
        gap: 10px;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      .case-pagination-info {
        font-size: 12px;
        color: var(--muted);
        font-weight: 500;
      }
      .case-pagination-buttons {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .case-page-btn {
        background: var(--glass);
        border: 1px solid var(--border);
        color: var(--text);
        border-radius: 4px;
        min-width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
        transition: background var(--transition), border-color var(--transition);
      }
      .case-page-btn:hover:not(.disabled):not(.active) {
        background: var(--glass2);
        border-color: var(--accent);
      }
      .case-page-btn.active {
        background: var(--accent);
        border-color: var(--accent);
        color: #fff;
        box-shadow: 0 0 8px var(--glow-shadow);
      }
      .case-page-btn.disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  // Get current Customer ID from header label
  function getCustomerID() {
    const headerText = $(".header-id").text() || "";
    const match = headerText.match(/CID\s*·\s*([\w-]+)/i);
    return match ? match[1].trim() : "NX-4829-0055"; // Default fallback
  }

  // Activate Module and Render Header Customizations
  function activateCaseModule() {
    injectStyles();

    // Cache default header html so we can restore it later
    const $header = $(".qm-header-inline");
    if ($header.length && !defaultHeaderHTML) {
      defaultHeaderHTML = $header.html();
    }

    // Structure Custom Header: Left part with avatar icon/title/subtitle
    $header.addClass("case-header-active").html(`
      <div class="qm-header-left-part">
        <div class="qm-header-avatar">📁</div>
        <div class="qm-header-titles">
          <h2 id="qm-title">Case Information</h2>
          <span class="qm-subtitle">Customer complaints and service requests</span>
        </div>
      </div>
    `);

    // Reset pagination state
    currentPage = 1;
    searchText = "";
    statusFilter = "All";

    const cid = getCustomerID();
    loadCases(cid);
  }

  // Restore Default Header Layout when navigating away
  function deactivateCaseModule() {
    const $header = $(".qm-header-inline");
    if ($header.length && defaultHeaderHTML) {
      $header.removeClass("case-header-active").html(defaultHeaderHTML);
    }
  }

  // AJAX Fetch Cases from REST endpoint
  function loadCases(cid) {
    if (typeof UIRenderer !== "undefined") {
      UIRenderer.showLoader("#qm-content");
    }

    if (typeof ApiService !== "undefined") {
      ApiService.get(
        `/cases?customer=${cid}`,
        function (response) {
          allCases = response || [];
          if (typeof UIRenderer !== "undefined") {
            UIRenderer.hideLoader("#qm-content");
          }

          if (allCases.length === 0) {
            if (typeof UIRenderer !== "undefined") {
              UIRenderer.showEmptyState("#qm-content");
            }
          } else {
            applyFilters();
          }
        },
        function (errorMessage) {
          if (typeof UIRenderer !== "undefined") {
            UIRenderer.showError(
              "#qm-content",
              "Failed to load customer cases: " + errorMessage,
              function () {
                loadCases(cid);
              }
            );
          }
        }
      );
    } else {
      console.error("ApiService is not loaded.");
    }
  }

  // Filter and Sort local data array
  function applyFilters() {
    filteredCases = allCases.filter((item) => {
      const s = searchText.toLowerCase();
      const matchesSearch =
        item.caseId.toLowerCase().includes(s) ||
        item.caseType.toLowerCase().includes(s) ||
        item.requestType.toLowerCase().includes(s) ||
        item.status.toLowerCase().includes(s) ||
        item.createdDate.toLowerCase().includes(s);

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort matching records
    filteredCases.sort((a, b) => {
      let valA = a[sortColumn] || "";
      let valB = b[sortColumn] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    // Re-clamp current page
    const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    renderTable();
  }

  // Build and render table DOM nodes
  function renderTable() {
    const $container = $("#qm-content");
    if (!$container.length) return;

    $container.empty();

    const totalItems = filteredCases.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIdx = (currentPage - 1) * pageSize;
    const paginatedItems = filteredCases.slice(startIdx, startIdx + pageSize);

    // 1. Controls Row (Search, Filter, Page Size)
    const controlsHtml = `
      <div class="case-controls-row">
        <div class="case-controls-left">
          <input type="text" id="case-search-input" class="case-input" placeholder="Search case details..." value="${escapeHtml(
            searchText
          )}" />
          <select id="case-status-filter" class="case-select">
            <option value="All" ${statusFilter === "All" ? "selected" : ""}>All Statuses</option>
            <option value="Open" ${statusFilter === "Open" ? "selected" : ""}>Open</option>
            <option value="In Progress" ${statusFilter === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Resolved" ${statusFilter === "Resolved" ? "selected" : ""}>Resolved</option>
            <option value="Closed" ${statusFilter === "Closed" ? "selected" : ""}>Closed</option>
            <option value="Rejected" ${statusFilter === "Rejected" ? "selected" : ""}>Rejected</option>
          </select>
        </div>
        <div class="case-controls-right">
          <select id="case-page-size" class="case-select">
            <option value="5" ${pageSize === 5 ? "selected" : ""}>5 per page</option>
            <option value="10" ${pageSize === 10 ? "selected" : ""}>10 per page</option>
            <option value="20" ${pageSize === 20 ? "selected" : ""}>20 per page</option>
          </select>
        </div>
      </div>
    `;

    // Helpers to draw headers with active sort icons
    function getHeaderTh(columnName, labelText) {
      const isSorted = sortColumn === columnName;
      const indicatorText = isSorted ? (sortDirection === "asc" ? " ▲" : " ▼") : "";
      return `<th class="case-sortable-header" data-column="${columnName}">${labelText}<span class="case-sort-indicator">${indicatorText}</span></th>`;
    }

    // 2. Data Grid (Table)
    let tbodyHtml = "";
    if (paginatedItems.length === 0) {
      tbodyHtml = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 30px; color: var(--muted); font-size: 14px;">
            No cases match the filter criteria.
          </td>
        </tr>
      `;
    } else {
      paginatedItems.forEach((item) => {
        const typeClass =
          item.caseType.toLowerCase() === "complaint" ? "badge-type-complaint" : "badge-type-request";
        
        let statusClass = "badge-status-closed";
        const statusLower = item.status.toLowerCase();
        if (statusLower === "open") statusClass = "badge-status-open";
        else if (statusLower === "in progress") statusClass = "badge-status-inprogress";
        else if (statusLower === "resolved") statusClass = "badge-status-resolved";
        else if (statusLower === "rejected") statusClass = "badge-status-rejected";

        const detailUrl = `modules/case/case-detail.html?id=${encodeURIComponent(item.caseId)}`;

        tbodyHtml += `
          <tr>
            <td>
              <a href="${detailUrl}" target="_blank" class="case-link">${escapeHtml(item.caseId)}</a>
            </td>
            <td>
              <span class="case-badge ${typeClass}">${escapeHtml(item.caseType)}</span>
            </td>
            <td>
              <span style="font-weight: 500;">${escapeHtml(item.requestType)}</span>
            </td>
            <td>
              <span class="case-badge ${statusClass}">${escapeHtml(item.status)}</span>
            </td>
            <td>
              <span style="color: var(--muted); font-family: monospace;">${escapeHtml(item.createdDate)}</span>
            </td>
            <td style="text-align: center;">
              <a href="${detailUrl}" target="_blank" class="case-action-btn">View</a>
            </td>
          </tr>
        `;
      });
    }

    const tableHtml = `
      <div class="case-table-wrapper">
        <table class="case-table">
          <thead>
            <tr>
              ${getHeaderTh("caseId", "Case ID")}
              ${getHeaderTh("caseType", "Case Type")}
              ${getHeaderTh("requestType", "Request Type")}
              ${getHeaderTh("status", "Status")}
              ${getHeaderTh("createdDate", "Created Date")}
              <th style="text-align: center; cursor: default;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      </div>
    `;

    // 3. Pagination controls row
    let paginationButtonsHtml = "";
    if (totalPages > 1) {
      // Prev arrow
      const prevDisabled = currentPage === 1 ? "disabled" : "";
      paginationButtonsHtml += `
        <button class="case-page-btn ${prevDisabled}" data-page="prev">←</button>
      `;

      // Page numbers (No dots/ellipsis, show clean sequential page numbers)
      for (let i = 1; i <= totalPages; i++) {
        const activeClass = currentPage === i ? "active" : "";
        paginationButtonsHtml += `
          <button class="case-page-btn ${activeClass}" data-page="${i}">${i}</button>
        `;
      }

      // Next arrow
      const nextDisabled = currentPage === totalPages ? "disabled" : "";
      paginationButtonsHtml += `
        <button class="case-page-btn ${nextDisabled}" data-page="next">→</button>
      `;
    } else {
      paginationButtonsHtml = `
        <button class="case-page-btn disabled" style="width: auto; padding: 0 10px;">Page 1 of 1</button>
      `;
    }

    const itemStart = totalItems === 0 ? 0 : startIdx + 1;
    const itemEnd = Math.min(startIdx + pageSize, totalItems);

    const paginationHtml = `
      <div class="case-pagination-row">
        <div class="case-pagination-info">
          Showing ${itemStart} to ${itemEnd} of ${totalItems} records
        </div>
        <div class="case-pagination-buttons">
          ${paginationButtonsHtml}
        </div>
      </div>
    `;

    // Append all items wrapped in an animation container
    const $wrapper = $('<div class="case-module-wrapper"></div>')
      .append(controlsHtml)
      .append(tableHtml)
      .append(paginationHtml);

    $container.append($wrapper);
  }

  // Simple HTML Escaper
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Delegated Event Handlers
  $(document).on("input", "#case-search-input", function () {
    searchText = $(this).val() || "";
    currentPage = 1; // reset page on search
    applyFilters();
  });

  $(document).on("change", "#case-status-filter", function () {
    statusFilter = $(this).val() || "All";
    currentPage = 1; // reset page on status filter change
    applyFilters();
  });

  $(document).on("change", "#case-page-size", function () {
    pageSize = parseInt($(this).val()) || 5;
    currentPage = 1; // reset page on size change
    applyFilters();
  });

  $(document).on("click", ".case-sortable-header", function () {
    const col = $(this).attr("data-column");
    if (sortColumn === col) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = col;
      sortDirection = "asc"; // Default to ascending for new sort columns
    }
    applyFilters();
  });

  $(document).on("click", ".case-page-btn", function () {
    if ($(this).hasClass("disabled") || $(this).hasClass("active")) return;

    const pageAttr = $(this).attr("data-page");
    const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;

    if (pageAttr === "prev") {
      currentPage = Math.max(1, currentPage - 1);
    } else if (pageAttr === "next") {
      currentPage = Math.min(totalPages, currentPage + 1);
    } else {
      currentPage = parseInt(pageAttr) || 1;
    }
    applyFilters();
  });

  // Action button events removed

  // Monitor the Quick Module Title to activate/deactivate
  $(document).ready(function () {
    const qmTitle = document.getElementById("qm-title");
    if (qmTitle) {
      const observer = new MutationObserver(() => {
        const isActive = qmTitle.innerText === "Case Module";
        if (isActive && !wasActive) {
          wasActive = true;
          activateCaseModule();
        } else if (!isActive && wasActive) {
          wasActive = false;
          deactivateCaseModule();
        }
      });
      observer.observe(qmTitle, { childList: true, characterData: true, subtree: true });
    }
  });
})();
