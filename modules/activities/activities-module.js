/**
 * Activities Module
 * Handles rendering of customer interactions in a timeline grouped chronologically from oldest (top) to future (bottom).
 * Integrates into the quick module view layout.
 */
(function () {
  // Module State
  let allActivities = [];
  let isExpandedAll = true;
  let forceExpandState = null; // null, "expand", "collapse"
  let configLoaded = false;
  let activitiesConfig = {
    TYPES: {},
    DEFAULT_TYPE: { icon: "🔔", colorClass: "act-theme-gray" }
  };

  // Filter State
  let dateFilterMode = "all"; // all, single, range, preset
  let filterSingleDate = "";
  let filterStartDate = "";
  let filterEndDate = "";
  let filterPreset = "all";
  let filterType = "all";
  let filterOverdueOnly = false;
  // Encapsulated Stylesheets
  const activitiesStyles = `
    /* CSS for Activities Module */
    .activities-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      height: 100%;
      min-height: 0;
    /* CSS for Activities Module */
    .activities-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      animation: activitiesFadeIn 0.4s ease;
      font-family: 'Outfit', sans-serif;
    }

    .act-filter-panel {
      background: var(--glass2);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      margin-top: 10px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      animation: actSlideDown 0.3s ease;
      font-family: inherit;
    }

    .act-filter-panel.hidden {
      display: none !important;
    }

    @keyframes actSlideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .act-filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 150px;
      flex: 1;
    }

    .act-filter-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .act-filter-input {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12.5px;
      outline: none;
      font-family: inherit;
      transition: all 0.3s ease;
      accent-color: var(--accent);
      cursor: pointer;
    }
    
    .light-mode .act-filter-input {
      background: rgba(0, 0, 0, 0.02);
    }

    .act-filter-select {
      background-color: #2c2c2e;
      color: #ffffff;
      border: 1px solid #3a3a3c;
      border-radius: 8px;
      padding: 6px 28px 6px 10px;
      font-size: 12.5px;
      outline: none;
      font-family: inherit;
      cursor: pointer;
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 12px;
      transition: all 0.3s ease;
    }

    .light-mode .act-filter-select {
      background-color: #f2f2f7;
      color: #000000;
      border: 1px solid #e5e5ea;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23555559' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    }

    .act-filter-select:hover, .act-filter-select:focus {
      background-color: #3a3a3c;
      border-color: #0a84ff;
    }
    
    .light-mode .act-filter-select:hover, .light-mode .act-filter-select:focus {
      background-color: #e5e5ea;
      border-color: #007aff;
    }
    
    .act-filter-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 8px var(--glow-shadow-weak);
      background: rgba(255, 255, 255, 0.05);
    }

    .act-filter-input::-webkit-calendar-picker-indicator {
      cursor: pointer;
      filter: invert(0.8);
      opacity: 0.6;
      transition: all 0.2s ease;
    }

    .act-filter-input:hover::-webkit-calendar-picker-indicator {
      opacity: 1;
      transform: scale(1.1);
    }

    .light-mode .act-filter-input::-webkit-calendar-picker-indicator {
      filter: invert(0.2);
    }

    @keyframes activitiesFadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .activities-scroll-container {
      flex: 1;
      max-height: 480px;
      overflow-y: auto;
      padding-right: 8px;
      margin-top: 5px;
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }

    .activities-scroll-container::-webkit-scrollbar {
      width: 5px;
    }

    .activities-scroll-container::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }

    .activities-scroll-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .activities-timeline-wrapper {
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .activities-section-header {
      font-size: 11px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 10px 14px;
      background: var(--glass2);
      border-radius: 8px;
      margin: 16px 0 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-left: 3px solid var(--accent);
      cursor: pointer;
      user-select: none;
      transition: all 0.3s ease;
    }

    .activities-section-header:hover {
      background: var(--glass);
      border-left-color: var(--accent2);
    }

    .activities-section-header-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .activities-section-header-arrow {
      font-size: 8px;
      color: var(--muted);
      transition: transform 0.3s ease;
    }

    .activities-section-header.collapsed .activities-section-header-arrow {
      transform: rotate(-90deg);
    }

    .activities-section-header-label {
      font-size: 10px;
      color: var(--muted);
      font-weight: 600;
    }

    .activities-section-content {
      display: flex;
      flex-direction: column;
      transition: max-height 0.3s ease-out;
      overflow: hidden;
    }

    .activities-section-header.collapsed + .activities-section-content {
      max-height: 0 !important;
      display: none;
    }

    .activities-timeline-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 14px 10px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 10px;
    }

    .activities-timeline-item:hover {
      background: var(--glass);
      transform: translateX(4px);
    }

    /* Timeline vertical connector line */
    .activities-timeline-item::before {
      content: "";
      position: absolute;
      left: 25px;
      top: 44px;
      bottom: -16px;
      width: 2px;
      background: var(--border);
      z-index: 1;
      opacity: 0.5;
    }

    .activities-timeline-item.last-item::before {
      display: none;
    }

    .act-item-icon-wrapper {
      position: relative;
      z-index: 2;
    }

    .act-item-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #fff;
    }

    /* Icon theme classes utilizing native CSS variables */
    .act-theme-rose {
      background: linear-gradient(135deg, var(--accent2, #ff4444), var(--accent, #aa0000));
      box-shadow: 0 0 10px rgba(170, 0, 0, 0.25);
    }

    .act-theme-green {
      background: linear-gradient(135deg, #34d399, #059669);
      box-shadow: 0 0 10px rgba(5, 150, 105, 0.25);
    }

    .act-theme-cyan {
      background: linear-gradient(135deg, #22d3ee, #0891b2);
      box-shadow: 0 0 10px rgba(8, 145, 178, 0.25);
    }

    .act-theme-purple {
      background: linear-gradient(135deg, #c084fc, #7c3aed);
      box-shadow: 0 0 10px rgba(124, 58, 237, 0.25);
    }

    .act-theme-gray {
      background: linear-gradient(135deg, #9ca3af, #4b5563);
      box-shadow: 0 0 10px rgba(75, 85, 99, 0.25);
    }

    .act-item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .act-overdue-badge {
      font-size: 8px;
      font-weight: 700;
      color: var(--accent2, #ff4444);
      text-transform: uppercase;
      letter-spacing: 1px;
      background: rgba(255, 68, 68, 0.12);
      border: 1px solid rgba(255, 68, 68, 0.2);
      padding: 1px 5px;
      border-radius: 3px;
      width: fit-content;
      margin-bottom: 2px;
      font-family: inherit;
    }

    .act-item-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      transition: color 0.3s ease;
    }

    .activities-timeline-item:hover .act-item-title {
      color: var(--accent);
    }

    .act-item-subtitle {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.4;
    }

    .act-right-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .act-item-date {
      font-size: 11.5px;
      color: var(--muted);
      white-space: nowrap;
      text-align: right;
    }

    .act-item-date.overdue {
      color: var(--accent2, #ff4444) !important;
      font-weight: 600;
    }

    .act-arrow {
      font-size: 9px;
      color: var(--muted);
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.3s ease;
    }

    .act-arrow:hover {
      opacity: 1;
    }

    /* Skeleton rows for loading state */
    .activities-skeleton-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 10px;
    }

    .activities-skeleton-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--glass2);
      animation: actPulse 1.5s infinite ease-in-out;
    }

    .activities-skeleton-line-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .activities-skeleton-line {
      height: 12px;
      background: var(--glass2);
      border-radius: 4px;
      animation: actPulse 1.5s infinite ease-in-out;
    }

    @keyframes actPulse {
      0% { opacity: 0.6; }
      50% { opacity: 0.3; }
      100% { opacity: 0.6; }
    }
  `;

  // Inject Stylesheet
  $("<style>").text(activitiesStyles).appendTo("head");

  /* ====== CORE FUNCTIONS ====== */

  // Load configuration from API with static fallbacks
  function loadActivitiesConfig(callback) {
    if (configLoaded) {
      if (callback) callback();
      return;
    }

    const endpoint = (window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.ACTIVITY_CONFIG) || "/activitiesConfig";

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        function (response) {
          if (response) {
            activitiesConfig.TYPES = response.TYPES || response.types || {};
            activitiesConfig.DEFAULT_TYPE = response.DEFAULT_TYPE || response.defaultType || { icon: "🔔", colorClass: "act-theme-gray" };
            // For backward compatibility:
            window.ACTIVITIES_CONFIG = activitiesConfig;
          }
          configLoaded = true;
          if (callback) callback();
        },
        function (error) {
          console.warn("Failed to load dynamic activities config, using fallbacks:", error);
          configLoaded = true;
          if (callback) callback();
        }
      );
    } else {
      configLoaded = true;
      if (callback) callback();
    }
  }

  // Load activities from API
  function loadActivities() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    // Ensure container exists
    if (!$(".activities-container").length) {
      initActivitiesLayout();
    }

    const $scrollContainer = $(".activities-scroll-container");
    if ($scrollContainer.length) {
      $scrollContainer.empty();
      // Render Skeleton Items
      for (let i = 0; i < 4; i++) {
        $scrollContainer.append(`
          <div class="activities-skeleton-item">
            <div class="activities-skeleton-circle"></div>
            <div class="activities-skeleton-line-group">
              <div class="activities-skeleton-line" style="width: 50%;"></div>
              <div class="activities-skeleton-line" style="width: 80%;"></div>
            </div>
            <div class="activities-skeleton-line" style="width: 15%; height: 10px;"></div>
          </div>
        `);
      }
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

    // Helper to fetch actual activities
    function fetchActivitiesData() {
      const endpoint = window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.ACTIVITIES;
      const paramKey = (window.API_CONFIG && window.API_CONFIG.PARAMS && window.API_CONFIG.PARAMS.CUSTOMER_ID) || "customerId";
      const params = {};
      params[paramKey] = cid;

      if (window.ApiService && endpoint) {
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

            // Filter by active customer ID in-memory (handles both 'customer' and 'customerId' mappings)
            allActivities = (dataList || []).filter(act => act.customer === cid || act.customerId === cid);

            renderTimeline();
          },
          function (errorMessage) {
            console.error("Failed to load activities:", errorMessage);
            if (window.UIRenderer) {
              window.UIRenderer.showError("#qm-content", errorMessage || "Failed to load activities", function () {
                loadActivities();
              });
            } else {
              const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('ERROR')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.ERROR) || '';
              $content.html(`
                <div style="text-align:center; padding: 40px;">
                  <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" />
                  <div style="color: #ef4444; font-weight: 600; font-size: 14px;">Failed to load activities: ${escapeHtml(errorMessage)}</div>
                </div>
              `);
            }
          }
        );
      } else {
        console.warn("ApiService or ACTIVITIES endpoint config missing. Falling back to empty state.");
        allActivities = [];
        renderTimeline();
      }
    }

    // Load config first, then fetch activities
    loadActivitiesConfig(fetchActivitiesData);
  }

  // Initialize Outline Layout
  function initActivitiesLayout() {
    const $content = $("#qm-content");
    if (!$content.length) return;

    $content.html(`
      <div class="activities-container">
        <div class="act-filter-panel hidden">
          <!-- Date Filter Mode Group -->
          <div class="act-filter-group">
            <label class="act-filter-label">Date Filter Mode</label>
            <select class="act-filter-select" id="act-date-mode-select">
              <option value="all">All Time</option>
              <option value="single">Single Date</option>
              <option value="range">Date Range</option>
              <option value="preset">Date Preset</option>
            </select>
          </div>

          <!-- Dynamic Date Inputs Group -->
          <div class="act-filter-group" id="act-date-inputs-group">
            <!-- Inputs dynamically shown/hidden here -->
          </div>

          <!-- Type Filter Group -->
          <div class="act-filter-group">
            <label class="act-filter-label">Activity Type</label>
            <select class="act-filter-select" id="act-type-select">
              <option value="all">All Types</option>
              <option value="appointment">📅 Appointment</option>
              <option value="event">🗓️ Event</option>
              <option value="task">📝 Task</option>
              <option value="call">📞 Call</option>
              <option value="visit">🚶 Visit</option>
            </select>
          </div>

          <!-- Overdue & Reset Group -->
          <div class="act-filter-group" style="flex-direction: row; align-items: flex-end; gap: 10px; justify-content: space-between; min-width: 200px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text); cursor: pointer; user-select: none; margin-bottom: 8px;">
              <input type="checkbox" id="act-overdue-checkbox" style="accent-color: var(--accent2); cursor: pointer;">
              <span>⚠️ Overdue Only</span>
            </label>
            <button id="act-reset-filters-btn" style="background: none; border: 1px solid var(--border); color: var(--text); padding: 5px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; font-family: inherit; font-weight: 600; margin-bottom: 4px; transition: all 0.3s ease;">Reset</button>
          </div>
        </div>

        <div class="activities-scroll-container">
          <!-- Timeline will be populated here -->
        </div>
      </div>
    `);

    // Bind Filter inputs
    $("#act-date-mode-select").on("change", function () {
      dateFilterMode = $(this).val();
      updateDateInputsUI();
      renderTimeline();
    });

    $("#act-type-select").on("change", function () {
      filterType = $(this).val();
      renderTimeline();
    });

    $("#act-overdue-checkbox").on("change", function () {
      filterOverdueOnly = $(this).is(":checked");
      renderTimeline();
    });

    $("#act-reset-filters-btn").on("click", function () {
      dateFilterMode = "all";
      filterSingleDate = "";
      filterStartDate = "";
      filterEndDate = "";
      filterPreset = "all";
      filterType = "all";
      filterOverdueOnly = false;

      // Reset DOM elements
      $("#act-date-mode-select").val("all");
      $("#act-type-select").val("all");
      $("#act-overdue-checkbox").prop("checked", false);

      updateDateInputsUI();
      renderTimeline();
    });

    // Initialize inputs UI
    updateDateInputsUI();
    loadActivityTypes();
  }

  // Update Dynamic Date input HTML based on date filter mode
  function updateDateInputsUI() {
    const $container = $("#act-date-inputs-group");
    if (!$container.length) return;

    $container.empty();

    if (dateFilterMode === "single") {
      $container.html(`
        <label class="act-filter-label">Select Date</label>
        <input type="text" class="act-filter-input" id="act-filter-single" placeholder="yyyy-mm-dd" value="${filterSingleDate}">
      `);
      flatpickr("#act-filter-single", {
        defaultDate: filterSingleDate || null,
        dateFormat: "Y-m-d",
        onChange: function (selectedDates, dateStr, instance) {
          filterSingleDate = dateStr;
          renderTimeline();
        }
      });
    } else if (dateFilterMode === "range") {
      $container.html(`
        <div style="display: flex; gap: 8px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label class="act-filter-label">From</label>
            <input type="text" class="act-filter-input" id="act-filter-start" placeholder="yyyy-mm-dd" value="${filterStartDate}" style="width: 110px;">
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <label class="act-filter-label">To</label>
            <input type="text" class="act-filter-input" id="act-filter-end" placeholder="yyyy-mm-dd" value="${filterEndDate}" style="width: 110px;">
          </div>
        </div>
      `);
      flatpickr("#act-filter-start", {
        defaultDate: filterStartDate || null,
        dateFormat: "Y-m-d",
        onChange: function (selectedDates, dateStr, instance) {
          filterStartDate = dateStr;
          renderTimeline();
        }
      });
      flatpickr("#act-filter-end", {
        defaultDate: filterEndDate || null,
        dateFormat: "Y-m-d",
        onChange: function (selectedDates, dateStr, instance) {
          filterEndDate = dateStr;
          renderTimeline();
        }
      });
    } else if (dateFilterMode === "preset") {
      $container.html(`
        <label class="act-filter-label">Date Preset</label>
        <select class="act-filter-select" id="act-filter-preset">
          <option value="all">Select Preset...</option>
          <option value="today" ${filterPreset === "today" ? "selected" : ""}>Today</option>
          <option value="yesterday" ${filterPreset === "yesterday" ? "selected" : ""}>Yesterday</option>
          <option value="last7" ${filterPreset === "last7" ? "selected" : ""}>Last 7 Days</option>
          <option value="last30" ${filterPreset === "last30" ? "selected" : ""}>Last 30 Days</option>
          <option value="thismonth" ${filterPreset === "thismonth" ? "selected" : ""}>This Month</option>
          <option value="lastmonth" ${filterPreset === "lastmonth" ? "selected" : ""}>Last Month</option>
        </select>
      `);
      $("#act-filter-preset").on("change", function () {
        filterPreset = $(this).val();
        renderTimeline();
      });
    } else {
      $container.html(`
        <label class="act-filter-label">Date Filter</label>
        <span style="font-size: 12px; color: var(--muted); padding-top: 8px;">Showing All History</span>
      `);
    }
  }

  // Load Activity Types from API with static fallbacks
  function loadActivityTypes() {
    const $select = $("#act-type-select");
    if (!$select.length) return;

    const endpoint = (window.API_CONFIG && window.API_CONFIG.ENDPOINTS && window.API_CONFIG.ENDPOINTS.ACTIVITY_TYPES) || "/activityTypes";
    const defaultTypes = [
      { value: "all", label: "All Types", icon: "" },
      { value: "appointment", label: "Appointment", icon: "📅" },
      { value: "event", label: "Event", icon: "🗓️" },
      { value: "task", label: "Task", icon: "📝" },
      { value: "call", label: "Call", icon: "📞" },
      { value: "visit", label: "Visit", icon: "🚶" }
    ];

    function populateSelect(types) {
      const currentVal = $select.val() || filterType;
      $select.empty();
      types.forEach(t => {
        const iconPrefix = t.icon ? `${t.icon} ` : "";
        const $option = $("<option></option>")
          .val(t.value)
          .text(`${iconPrefix}${t.label}`);
        if (currentVal === t.value) {
          $option.prop("selected", true);
        }
        $select.append($option);
      });
    }

    if (window.ApiService) {
      window.ApiService.get(
        endpoint,
        function (response) {
          if (Array.isArray(response) && response.length > 0) {
            populateSelect(response);
          } else {
            console.warn("Empty or invalid response for activity types. Using fallback.");
            populateSelect(defaultTypes);
          }
        },
        function (error) {
          console.error("Failed to load activity types from API:", error);
          populateSelect(defaultTypes);
        }
      );
    } else {
      populateSelect(defaultTypes);
    }
  }

  // Group and sort activities, then render html
  function renderTimeline() {
    const $scrollContainer = $(".activities-scroll-container");
    if (!$scrollContainer.length) return;

    $scrollContainer.empty();

    if (allActivities.length === 0) {
      const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';
      $scrollContainer.html(`
        <div style="text-align: center; padding: 40px;">
          <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" />
          <div style="color: var(--muted); font-size: 14px; font-weight: 600;">No activities recorded for this customer.</div>
        </div>
      `);
      return;
    }

    const now = new Date();
    const config = activitiesConfig;

    // Apply Filter Logic In-Memory
    const filteredList = allActivities.filter(item => {
      const itemDate = new Date(item.date);
      const now = new Date();

      // 1. Overdue Status Filter
      if (filterOverdueOnly) {
        const isPast = itemDate < now;
        if (!isPast) return false;
      }

      // 2. Type Filter
      if (filterType !== "all" && item.type !== filterType) {
        return false;
      }

      // 3. Date Filter
      if (dateFilterMode !== "all") {
        if (isNaN(itemDate.getTime())) return false;

        if (dateFilterMode === "single" && filterSingleDate) {
          const fDate = new Date(filterSingleDate);
          return itemDate.toDateString() === fDate.toDateString();
        }

        if (dateFilterMode === "range") {
          if (filterStartDate) {
            const start = new Date(filterStartDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
          }
          if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
          }
        }

        if (dateFilterMode === "preset") {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (filterPreset === "today") {
            return itemDate.toDateString() === now.toDateString();
          }
          if (filterPreset === "yesterday") {
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            return itemDate.toDateString() === yesterday.toDateString();
          }
          if (filterPreset === "last7") {
            const last7Days = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= last7Days && itemDate <= now;
          }
          if (filterPreset === "last30") {
            const last30Days = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= last30Days && itemDate <= now;
          }
          if (filterPreset === "thismonth") {
            return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
          }
          if (filterPreset === "lastmonth") {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return itemDate.getMonth() === lastMonth.getMonth() && itemDate.getFullYear() === lastMonth.getFullYear();
          }
        }
      }

      return true;
    });

    if (filteredList.length === 0) {
      const animPath = (window.UIRenderer && window.UIRenderer.getAnimationPath('EMPTY')) || (window.ASSETS_CONFIG && window.ASSETS_CONFIG.ANIMATIONS && window.ASSETS_CONFIG.ANIMATIONS.EMPTY) || '';
      $scrollContainer.html(`
        <div style="text-align: center; padding: 40px;">
          <img src="${animPath}" style="width: 180px; height: 180px; margin-bottom: 16px;" />
          <div style="color: var(--muted); font-size: 14px; font-weight: 600;">No activities match the selected filters.</div>
        </div>
      `);
      return;
    }

    // 1. Parse and Sort activities in ascending chronological order (oldest -> newest/future)
    const sortedList = [...filteredList].map(act => ({
      ...act,
      parsedDate: new Date(act.date)
    })).sort((a, b) => a.parsedDate - b.parsedDate);

    // 2. Group into buckets
    const groups = {
      monthly: {},    // keys like "May 2026", containing arrays
      yesterday: [],
      today: [],
      upcoming: []
    };

    sortedList.forEach(item => {
      const itemDate = item.parsedDate;
      if (isNaN(itemDate.getTime())) {
        // Fallback for unparseable dates
        const key = "Past Logs";
        if (!groups.monthly[key]) groups.monthly[key] = [];
        groups.monthly[key].push(item);
        return;
      }

      if (itemDate > now) {
        groups.upcoming.push(item);
      } else if (itemDate.toDateString() === now.toDateString()) {
        groups.today.push(item);
      } else {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (itemDate.toDateString() === yesterday.toDateString()) {
          groups.yesterday.push(item);
        } else {
          // Month group
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const key = `${monthNames[itemDate.getMonth()]} ${itemDate.getFullYear()}`;
          if (!groups.monthly[key]) {
            groups.monthly[key] = [];
          }
          groups.monthly[key].push(item);
        }
      }
    });

    // Helper: calculate relative label for older months
    function getRelativeMonthLabel(monthYearStr) {
      const parts = monthYearStr.split(" ");
      if (parts.length < 2) return "";
      const monthName = parts[0];
      const year = parseInt(parts[1]);

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex === -1 || isNaN(year)) return "";

      const targetDate = new Date(year, monthIndex, 1);
      const currentDate = new Date(now.getFullYear(), now.getMonth(), 1);

      const diffMonths = (currentDate.getFullYear() - targetDate.getFullYear()) * 12 + (currentDate.getMonth() - targetDate.getMonth());

      if (diffMonths === 0) return "This Month";
      if (diffMonths === 1) return "Last Month";
      if (diffMonths > 1) return `${diffMonths} Months Ago`;
      return "";
    }

    // 3. Render HTML - ordered from oldest (top) to future (bottom)
    const $timelineWrapper = $('<div class="activities-timeline-wrapper"></div>');
    let totalItemsRendered = 0;

    // Helper to render timeline section contents
    function renderSectionHTML(sectionTitle, rightLabel, items, sectionIdSuffix) {
      if (!items || items.length === 0) return;

      let collapsedClass = "";
      if (forceExpandState === "expand") {
        collapsedClass = "";
      } else if (forceExpandState === "collapse") {
        collapsedClass = "collapsed";
      } else {
        // Initial load: start expanded by default to display the timeline clearly
        collapsedClass = "";
      }

      const $header = $(`
        <div class="activities-section-header ${collapsedClass}" id="timeline-section-${sectionIdSuffix}">
          <div class="activities-section-header-title">
            <span class="activities-section-header-arrow">▼</span>
            <span>${sectionTitle}</span>
          </div>
          ${rightLabel ? `<span class="activities-section-header-label">${rightLabel}</span>` : ""}
        </div>
      `);

      const $content = $('<div class="activities-section-content"></div>');

      items.forEach((item, index) => {
        totalItemsRendered++;
        const typeCfg = config.TYPES[item.type] || config.DEFAULT_TYPE;

        // Determine if overdue: date is in past
        const dateIsOverdue = item.parsedDate < now;
        const dateClass = dateIsOverdue ? "act-item-date overdue" : "act-item-date";

        // Human readable display date
        let displayDate = item.date;
        if (item.parsedDate && !isNaN(item.parsedDate.getTime())) {
          const hours = String(item.parsedDate.getHours()).padStart(2, '0');
          const mins = String(item.parsedDate.getMinutes()).padStart(2, '0');
          if (itemDateIsToday(item.parsedDate)) {
            displayDate = `Today`;
          } else if (itemDateIsYesterday(item.parsedDate)) {
            displayDate = `Yesterday`;
          } else {
            // E.g. "12-Sep" or "22:00 | 13-Oct"
            const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthDay = `${item.parsedDate.getDate()}-${monthsShort[item.parsedDate.getMonth()]}`;
            if (item.type === "appointment" || item.type === "event" || item.parsedDate.getHours() > 0) {
              displayDate = `${hours}:${mins} | ${monthDay}`;
            } else {
              displayDate = monthDay;
            }
          }
        }

        const isLastItem = (totalItemsRendered === sortedList.length);
        const lastClass = isLastItem ? "last-item" : "";

        const assignedUsers = item.assignedUsers || [];
        const $itemHtml = $(`
          <div class="activities-timeline-item ${lastClass}" style="cursor: pointer;">
            <div class="act-item-icon-wrapper">
              <div class="act-item-icon ${typeCfg.colorClass}">${typeCfg.icon}</div>
            </div>
            <div class="act-item-details">
              ${dateIsOverdue ? `<span class="act-overdue-badge">Overdue</span>` : ""}
              <span class="act-item-title">${escapeHtml(item.title)}</span>
              <span class="act-item-subtitle">${escapeHtml(item.subtitle)}</span>
            </div>
            <div class="act-right-controls" style="display: flex; align-items: center; gap: 15px;">
              <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center;">
                <span class="${dateClass}">${displayDate}</span>
                ${(assignedUsers && assignedUsers.length > 0) ? `
                  <span class="act-assigned-users" style="font-size: 10px; color: var(--muted); font-weight: 600; text-align: right; background: var(--glass2); padding: 2px 8px; border-radius: 12px; border: 1px solid var(--border); margin-top: 4px; display: inline-flex; align-items: center; gap: 3px;">
                    👥 ${assignedUsers.join(', ')}
                  </span>
                ` : ""}
              </div>
              <span class="act-arrow">▶</span>
            </div>
          </div>
        `);

        $itemHtml.on("click", function () {
          const detailUrl = (window.API_CONFIG && window.API_CONFIG.DETAIL_URLS && window.API_CONFIG.DETAIL_URLS.ACTIVITY_DETAIL) || "modules/activities/activity-detail.html";
          const cid = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
          let url = detailUrl + `?id=${encodeURIComponent(item.id)}`;
          if (cid) {
            url += `&customerId=${encodeURIComponent(cid)}`;
          }
          window.open(url, "_blank");
        });

        $content.append($itemHtml);
      });

      $timelineWrapper.append($header);
      $timelineWrapper.append($content);
    }

    // A. Month-wise past activities (oldest months first)
    // Extract monthly keys, sort chronologically
    const sortedMonthKeys = Object.keys(groups.monthly).sort((a, b) => {
      const parseKey = (str) => {
        if (str === "Past Logs") return new Date(0);
        const parts = str.split(" ");
        const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return new Date(parseInt(parts[1]), mNames.indexOf(parts[0]), 1);
      };
      return parseKey(a) - parseKey(b);
    });

    sortedMonthKeys.forEach(monthKey => {
      const label = getRelativeMonthLabel(monthKey);
      const suffix = monthKey.replace(/\s+/g, '-').toLowerCase();
      renderSectionHTML(monthKey, label, groups.monthly[monthKey], suffix);
    });

    // B. Yesterday
    renderSectionHTML("Yesterday", "1 Day Ago", groups.yesterday, "yesterday");

    // C. Today
    renderSectionHTML("Today", "Today", groups.today, "today");

    // D. Upcoming (at the bottom)
    renderSectionHTML("Upcoming", "Future", groups.upcoming, "upcoming");

    $scrollContainer.append($timelineWrapper);

    // 4. Trigger auto-scroll alignment
    setTimeout(alignTimelineScroll, 250);
  }

  // Aligns timeline scroll to highlight "Today" (or "Upcoming" if today is empty)
  function alignTimelineScroll() {
    const container = document.querySelector(".activities-scroll-container");
    if (!container) return;

    let targetSection = document.getElementById("timeline-section-today");
    if (!targetSection) {
      targetSection = document.getElementById("timeline-section-upcoming");
    }

    if (container && targetSection) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetSection.getBoundingClientRect();

      // If layout is not ready yet (GSAP transition still active or element has no size), retry
      if (containerRect.height === 0 || targetRect.height === 0) {
        setTimeout(alignTimelineScroll, 50);
        return;
      }

      const relativeTop = targetRect.top - containerRect.top + container.scrollTop;
      container.scrollTo({
        top: relativeTop,
        behavior: "smooth"
      });

      // Initialize GSAP scroll triggers and accordion triggers after scroll positioning is set
      setTimeout(() => {
        initScrollAnimations();
        initAccordionScrollTriggers();
      }, 800);
    } else if (container) {
      if (container.scrollHeight === 0) {
        setTimeout(alignTimelineScroll, 50);
        return;
      }
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
      setTimeout(() => {
        initScrollAnimations();
        initAccordionScrollTriggers();
      }, 800);
    }
  }

  // Initializes ScrollTrigger Scroll-Accordion (opens sections dynamically as you scroll to them)
  function initAccordionScrollTriggers() {
    // Disabled to prevent automatic collapse feedback loop and layout thrashing.
    // Manual click-based expansion/collapse is retained for superior user control.
  }

  // Initializes ScrollTrigger animations for timeline items entering view
  function initScrollAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn("GSAP or ScrollTrigger not found, skipping scroll animations.");
      return;
    }

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Clean up existing scroll triggers for this container to avoid duplicate memory triggers
    ScrollTrigger.getAll().forEach(trigger => {
      if (trigger.vars.scroller === ".activities-scroll-container") {
        trigger.kill();
      }
    });

    // Refresh layout calculations
    ScrollTrigger.refresh();

    // Query all items
    const items = gsap.utils.toArray('.activities-timeline-item');
    items.forEach(item => {
      const icon = item.querySelector('.act-item-icon');

      // Animates row entrance
      gsap.fromTo(item,
        {
          opacity: 0,
          y: 20,
          scale: 0.96,
          filter: "blur(3px)"
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: item,
            scroller: ".activities-scroll-container",
            start: "top 98%", // Trigger when top enters viewport from bottom
            end: "bottom 2%",  // Trigger when bottom leaves viewport from top
            toggleActions: "play reverse play reverse" // Replay animation when scrolling above and below!
          }
        }
      );

      // Animates circular icon pop
      if (icon) {
        gsap.fromTo(icon,
          { scale: 0.5, rotation: -40 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.7,
            ease: "back.out(1.6)",
            scrollTrigger: {
              trigger: item,
              scroller: ".activities-scroll-container",
              start: "top 98%",
              end: "bottom 2%",
              toggleActions: "play reverse play reverse"
            }
          }
        );
      }
    });
  }

  // Date helper checks
  function itemDateIsToday(dateObj) {
    return dateObj.toDateString() === (new Date()).toDateString();
  }

  function itemDateIsYesterday(dateObj) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateObj.toDateString() === yesterday.toDateString();
  }

  // HTML escaping utility
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let headerRestored = false;

  // Render Module Headers and Actions
  function renderActivitiesHeader() {
    const $header = $(".qm-header-inline");
    if (!$header.length || !$header.hasClass("activities-active")) {
      $header.removeClass("cases-active leads-active holdings-active").addClass("activities-active");
      $header.empty();

      const headerHtml = `
        <div class="qm-header-left-wrap" style="display: flex; align-items: center; gap: 15px;">
          <button class="qm-back-btn" title="Back to Profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="qm-header-avatar" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--glass2); border: 1px solid var(--border); box-shadow: 0 0 10px var(--glow-shadow); font-size: 22px;">📅</div>
          <div class="qm-header-titles" style="display: flex; flex-direction: column;">
            <h2 id="qm-title" style="font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: 1px; margin: 0; text-transform: uppercase; font-family: 'Outfit', sans-serif;">ACTIVITIES</h2>
            <p class="qm-header-subtitle" style="font-size: 13px; color: var(--muted); margin-top: 2px; font-weight: 400; margin-bottom: 0;">Customer interaction records and appointments</p>
          </div>
        </div>
        <div class="qm-header-actions" style="display: flex; align-items: center; gap: 12px; font-size: 12px;">
          <button class="qm-text-action-btn" id="toggle-filters-btn" style="background:none; border:none; color:var(--accent2); cursor:pointer; font-weight:600; font-family:inherit; outline:none; font-size:12px;">🔍 Filters</button>
          <span style="color: var(--border);">|</span>
          <button class="qm-text-action-btn" id="goto-today-btn" style="background:none; border:none; color:var(--accent2); cursor:pointer; font-weight:600; font-family:inherit; outline:none; font-size:12px; display:flex; align-items:center; gap:4px;">📍 Today</button>
          <span style="color: var(--border);">|</span>
          <button class="qm-text-action-btn" id="refresh-activities-btn" style="background:none; border:none; color:var(--accent2); cursor:pointer; font-weight:600; font-family:inherit; outline:none; font-size:12px;">Refresh</button>
          <span style="color: var(--border);">|</span>
          <button class="qm-text-action-btn" id="expand-all-btn" style="background:none; border:none; color:var(--accent2); cursor:pointer; font-weight:600; font-family:inherit; outline:none; font-size:12px;">Expand All</button>
          <span style="color: var(--border);">|</span>
          <button class="qm-text-action-btn" id="collapse-all-btn" style="background:none; border:none; color:var(--accent2); cursor:pointer; font-weight:600; font-family:inherit; outline:none; font-size:12px;">Collapse All</button>
          <span style="color: var(--border);">|</span>
          <button class="qm-action-btn" id="create-appointment-btn" style="padding: 5px 12px; font-size: 11px;">📅 Create Appointment</button>
        </div>
      `;
      $header.append(headerHtml);

      // Bind header actions
      $("#toggle-filters-btn").on("click", function () {
        const $panel = $(".act-filter-panel");
        $panel.toggleClass("hidden");
        $(this).toggleClass("active");
      });

      $("#goto-today-btn").on("click", function () {
        forceExpandState = null;
        renderTimeline();
        alignTimelineScroll();
      });

      $("#refresh-activities-btn").on("click", function () {
        loadActivities();
      });

      $("#expand-all-btn").on("click", function () {
        forceExpandState = "expand";
        renderTimeline();
      });

      $("#collapse-all-btn").on("click", function () {
        forceExpandState = "collapse";
        renderTimeline();
      });

      $("#create-appointment-btn").on("click", function () {
        const cid = (window.ParamsData && window.ParamsData.getCustomerId) ? window.ParamsData.getCustomerId() : null;
        let url = (window.API_CONFIG && window.API_CONFIG.CREATION_URLS && window.API_CONFIG.CREATION_URLS.CREATE_APPOINTMENT) || "modules/activities/appointment-create.html";
        if (cid) {
          url += `?customerId=${encodeURIComponent(cid)}`;
        }
        window.open(url, "_blank");
      });

      headerRestored = false;
    }
  }

  // ── RESTORE DEFAULT HEADER ──
  function restoreDefaultHeader(title) {
    const $header = $(".qm-header-inline");
    if ($header.length && $header.hasClass("activities-active")) {
      $header.removeClass("activities-active");
      $header.empty();
      $header.append(`<h2 id="qm-title">${title}</h2>`);
      headerRestored = true;
    }
  }

  // ── MUTATIONOBSERVER ON QUICK ACCESS TITLE ──
  $(function () {
    // Bind toggle section clicks via event delegation
    $(document).on("click", ".activities-section-header", function () {
      $(this).toggleClass("collapsed");
      // Force GSAP ScrollTrigger coordinates refresh when accordion opens/collapses
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    });

    const $titleNode = $("#qm-title");
    if (!$titleNode.length) return;

    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function () {
        const text = $titleNode.text().trim();
        if (text === "Activities Module") {
          renderActivitiesHeader();
          loadActivities();
        } else if (text !== "" && !text.includes("ACTIVITIES") && !headerRestored) {
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
