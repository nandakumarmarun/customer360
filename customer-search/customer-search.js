/**
 * Customer Search View Module - Scoped Logic
 * Handles Three.js background, theme updates, UI layout actions, sorting, and pagination.
 */
(function() {
  // Global View State
  let threeObjects = {};
  let currentSearchResults = [];
  let filteredSearchResults = [];
  let currentPage = 1;
  const pageSize = 5; // Compact listing layout

  let dataLoaded = false;
  let preloaderFinished = false;
  let loadError = null;

  /* ====== INITIALIZATION ====== */
  $(function() {
    initThreeBackground();
    initThemeState();
    
    // Update illustration image path from configuration if defined
    const searchAssetsPath = (window.ASSETS_CONFIG && window.ASSETS_CONFIG.SEARCH_ASSETS_PATH) || 'assets/';
    $('.search-illustration-container img').attr('src', `${searchAssetsPath}search-icon.svg`);
    
    function playEntranceAnimation() {
      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.customer-search-experience',
          { opacity: 0, scale: 0.95, y: 25 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power3.out' }
        );
      }
    }

    function onBothCompleted() {
      $('.customer-search-page').removeClass('hidden');
      playEntranceAnimation();
      
      // If there was a loading error, automatically show results card in error state
      if (loadError) {
        const $results = $('#results-card');
        $results.addClass('visible');
        applyFiltersAndRenderTable();
      }
    }

    // 1. Asynchronously load the customer database from the API
    if (window.CustomerSearchController) {
      window.CustomerSearchController.loadCustomers(
        function() {
          dataLoaded = true;
          if (preloaderFinished) {
            onBothCompleted();
          }
        },
        function(errorMsg) {
          dataLoaded = true;
          loadError = errorMsg;
          if (preloaderFinished) {
            onBothCompleted();
          }
        }
      );
    } else {
      dataLoaded = true;
      loadError = "Controller not loaded";
    }

    // 2. Trigger page load preloader
    if (window.Customer360Preloader) {
      window.Customer360Preloader.show(function() {
        preloaderFinished = true;
        if (dataLoaded) {
          onBothCompleted();
        }
      }, 2500);
    } else {
      preloaderFinished = true;
      if (dataLoaded) {
        onBothCompleted();
      }
    }

    bindSearchEvents();
    bindFilterEvents();
    bindPaginationEvents();
  });

  /* ====== THEME & COLOR PICKER TOGGLE ====== */
  function initThemeState() {
    const root = document.documentElement;

    function applyThemeMode(mode) {
      if (mode === 'light') {
        root.classList.add('light-mode');
        $('body').addClass('light-mode');
      } else {
        root.classList.remove('light-mode');
        $('body').removeClass('light-mode');
      }
      updateThreeTheme(mode === 'light');
    }

    // Load theme from server via ThemeModule
    if (window.ThemeModule) {
      window.ThemeModule.getTheme(function (mode, color) {
        applyThemeMode(mode);
        applyColorTheme(color);
      });
    }

    // Bind click listeners for color themes
    $('.theme-picker-btn').on('click', function(e) {
      e.stopPropagation();
      const theme = $(this).data('theme');
      applyColorTheme(theme);
      
      const currentMode = root.classList.contains('light-mode') ? 'light' : 'dark';
      if (window.ThemeModule) {
        window.ThemeModule.saveTheme(currentMode, theme);
      }
    });

    // Theme light/dark toggle button click
    $('#theme-toggle').on('click', function() {
      const isLight = root.classList.toggle('light-mode');
      $('body').toggleClass('light-mode');
      const currentMode = isLight ? 'light' : 'dark';
      const currentColor = root.classList.contains('theme-neon') ? 'neon' : 'red';

      if (window.ThemeModule) {
        window.ThemeModule.saveTheme(currentMode, currentColor);
      }

      // WOW effect: Expansion Flash circle matching script.js
      const btn = this;
      const flash = $('<div style="position:fixed; width:10px; height:10px; background:var(--accent); border-radius:50%; z-index:10000; pointer-events:none;"></div>');
      const rect = btn.getBoundingClientRect();
      flash.css({
        top: `${rect.top + 22}px`,
        left: `${rect.left + 22}px`
      });
      $('body').append(flash);

      if (typeof gsap !== 'undefined') {
        gsap.to(flash[0], {
          width: window.innerWidth * 3,
          height: window.innerWidth * 3,
          xPercent: -50,
          yPercent: -50,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => flash.remove()
        });
      } else {
        flash.remove();
      }

      updateThreeTheme(isLight);
    });

    // Check Star Geo and apply colors
    const checkThree = setInterval(() => {
      if (threeObjects.starGeo) {
        updateThreeTheme(root.classList.contains('light-mode'));
        clearInterval(checkThree);
      }
    }, 100);
  }

  function applyColorTheme(theme) {
    const root = document.documentElement;
    if (theme === 'neon') {
      root.classList.add('theme-neon');
    } else {
      root.classList.remove('theme-neon');
    }

    $('.theme-picker-btn').each(function() {
      if ($(this).data('theme') === theme) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });

    updateThreeTheme(root.classList.contains('light-mode'));
  }

  /* ====== THREE.JS BACKGROUND INTERACTION ====== */
  function initThreeBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    if (typeof THREE === 'undefined') {
      console.warn("Three.js not loaded.");
      return;
    }

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 80;

    // Starfield Geometry
    const starGeo = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMat = new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Floating geometries
    const geos = [
      new THREE.IcosahedronGeometry(6, 0),
      new THREE.OctahedronGeometry(4, 0),
      new THREE.TetrahedronGeometry(3, 0)
    ];
    
    const meshes = [];
    for (let i = 0; i < 6; i++) {
      const geo = geos[i % geos.length];
      const mat = new THREE.MeshBasicMaterial({
        color: 0xaa0000,
        wireframe: true,
        transparent: true,
        opacity: 0.15
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60);
      mesh.userData.speed = { x: (Math.random() - 0.5) * 0.003, y: (Math.random() - 0.5) * 0.003 };
      scene.add(mesh);
      meshes.push(mesh);
    }

    threeObjects = { scene, starGeo, starMat, meshes, camera };

    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.005;
      camera.position.x += (mouseX * 10 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 6 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      
      meshes.forEach((m, i) => {
        m.rotation.x += m.userData.speed.x;
        m.rotation.y += m.userData.speed.y;
        m.position.y += Math.sin(t + i) * 0.02;
      });
      
      renderer.render(scene, camera);
    }
    animate();
  }

  function updateThreeTheme(isLight) {
    if (!threeObjects.starGeo) return;

    const { starGeo, meshes } = threeObjects;
    const colors = starGeo.attributes.color.array;
    const isNeon = document.documentElement.classList.contains('theme-neon');

    for (let i = 0; i < colors.length / 3; i++) {
      if (isLight) {
        if (isNeon) {
          colors[i * 3] = 0.31; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.9;
        } else {
          colors[i * 3] = 0.88; colors[i * 3 + 1] = 0.11; colors[i * 3 + 2] = 0.28;
        }
      } else {
        if (isNeon) {
          const r = Math.random();
          if (r < 0.33) { colors[i * 3] = 0.42; colors[i * 3 + 1] = 0.39; colors[i * 3 + 2] = 1; }
          else if (r < 0.66) { colors[i * 3] = 0; colors[i * 3 + 1] = 0.83; colors[i * 3 + 2] = 1; }
          else { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; }
        } else {
          const r = Math.random();
          if (r < 0.33) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.4; }
          else if (r < 0.66) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.45; colors[i * 3 + 2] = 0.45; }
          else { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; }
        }
      }
    }
    starGeo.attributes.color.needsUpdate = true;

    meshes.forEach((m, i) => {
      if (isLight) {
        if (isNeon) m.material.color.setHex(0x4f46e5);
        else m.material.color.setHex(0xaa0000);
        m.material.opacity = 0.1;
      } else {
        if (isNeon) m.material.color.setHex(i % 3 === 0 ? 0x6c63ff : i % 3 === 1 ? 0x00d4ff : 0xff6b9d);
        else m.material.color.setHex(i % 3 === 0 ? 0xaa0000 : i % 3 === 1 ? 0xf87171 : 0xf43f5e);
        m.material.opacity = 0.15;
      }
    });
  }

  /* ====== SEARCH WORKFLOWS ====== */
  function bindSearchEvents() {
    // Dynamic placeholder switching based on selection
    $('#search-type').on('change', function() {
      const type = $(this).val();
      const $input = $('#search-input');
      
      if (type === "cid") {
        $input.attr("placeholder", "Enter Customer ID (e.g. NX-4829-0055)...");
      } else if (type === "email") {
        $input.attr("placeholder", "Enter Email address...");
      } else if (type === "phone") {
        $input.attr("placeholder", "Enter Phone Number...");
      }
    });

    // Form submit listener
    $('#search-btn').on('click', function() {
      executeSearch();
    });

    $('#search-input').on('keypress', function(e) {
      if (e.which === 13) {
        executeSearch();
      }
    });
  }

  function executeSearch() {
    const type = $('#search-type').val();
    const inputVal = $('#search-input').val().trim();

    if (!inputVal) {
      alert("Please enter a search query.");
      return;
    }

    if (type === "cid") {
      // Redirect directly to Customer 360 page (index.html)
      window.location.href = `../index.html?customerId=${encodeURIComponent(inputVal)}`;
    } else {
      // Stay on page and display results below directly
      currentSearchResults = window.CustomerSearchController.query(type, inputVal);
      currentPage = 1;
      applyFiltersAndRenderTable();
      
      // Scroll smoothly to results card
      const $results = $('#results-card');
      $results.addClass('visible');
      $('html, body').animate({
        scrollTop: $results.offset().top - 100
      }, 800);
    }
  }

  /* ====== FILTERS ====== */
  function bindFilterEvents() {
    // Active / Inactive Status Toggles
    $('.status-btn').on('click', function() {
      $('.status-btn').removeClass('active');
      $(this).addClass('active');
      currentPage = 1;
      applyFiltersAndRenderTable();
    });

    // Date Range inputs
    $('.date-input').on('change', function() {
      currentPage = 1;
      applyFiltersAndRenderTable();
    });

    // Clear filters click
    $('#btn-clear-filters').on('click', function() {
      $('.status-btn').removeClass('active');
      $('.status-btn[data-status="All"]').addClass('active');
      $('#date-from').val('');
      $('#date-to').val('');
      currentPage = 1;
      applyFiltersAndRenderTable();
    });
  }

  function applyFiltersAndRenderTable() {
    const status = $('.status-btn.active').data('status') || 'All';
    const dateFrom = $('#date-from').val();
    const dateTo = $('#date-to').val();

    // 1. Filter results via Controller layer
    filteredSearchResults = window.CustomerSearchController.filterResults(
      currentSearchResults,
      status,
      dateFrom,
      dateTo
    );

    // 2. Update count statistics
    $('#results-total-count').text(filteredSearchResults.length);

    // 3. Render Table rows
    renderTableRows();
  }

  function renderTableRows() {
    const $tbody = $('#results-tbody');
    const $tableContainer = $('#table-container-div');
    const $overlayContainer = $('#results-overlay-div');
    
    $tbody.empty();

    if (filteredSearchResults.length === 0) {
      // Show empty state or error overlay inside list card
      $tableContainer.hide();
      
      const errorTitle = loadError ? "Connection Error" : "No Records Found";
      const errorIcon = loadError ? "⚠️" : "📭";
      const errorDesc = loadError 
        ? `Failed to load customers list from database: ${escapeHtml(loadError)}. Please verify the API server is running.`
        : "We couldn't find any customers matching the criteria. Try clearing the filters.";
        
      $overlayContainer.html(`
        <div class="results-overlay-container">
          <div class="results-overlay-icon">${errorIcon}</div>
          <div class="results-overlay-title">${errorTitle}</div>
          <div class="results-overlay-desc">${errorDesc}</div>
        </div>
      `).show();
      
      updatePaginationControls(0);
      return;
    }

    $overlayContainer.hide();
    $tableContainer.show();

    // Pagination slice bounds
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, filteredSearchResults.length);
    const paginatedList = filteredSearchResults.slice(startIdx, endIdx);

    paginatedList.forEach(item => {
      const statusClass = item.status.toLowerCase();
      const profileUrl = `../index.html?customerId=${encodeURIComponent(item.id)}`;
      
      const rowHtml = `
        <tr>
          <td>
            <a href="${profileUrl}" class="results-cid-link">${escapeHtml(item.id)}</a>
          </td>
          <td style="font-weight: 600;">${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(item.phone)}</td>
          <td>
            <span class="search-status-badge ${statusClass}">${escapeHtml(item.status)}</span>
          </td>
          <td style="color: var(--muted);">${escapeHtml(item.createdDate)}</td>
          <td style="text-align: center;">
            <a href="${profileUrl}" class="action-view-btn">👁️ View Profile</a>
          </td>
        </tr>
      `;
      $tbody.append(rowHtml);
    });

    updatePaginationControls(filteredSearchResults.length);
  }

  /* ====== PAGINATION ====== */
  function bindPaginationEvents() {
    $('#prev-btn').on('click', function() {
      if (currentPage > 1) {
        currentPage--;
        renderTableRows();
      }
    });

    $('#next-btn').on('click', function() {
      const totalPages = Math.ceil(filteredSearchResults.length / pageSize) || 1;
      if (currentPage < totalPages) {
        currentPage++;
        renderTableRows();
      }
    });
  }

  function updatePaginationControls(totalRecords) {
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;

    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(currentPage * pageSize, totalRecords);

    // Indicator label text
    $('#pagination-indicator').html(
      `Showing <strong>${startRecord}</strong> to <strong>${endRecord}</strong> of <strong>${totalRecords}</strong> records`
    );

    // Prev/Next buttons
    $('#prev-btn').prop('disabled', currentPage === 1);
    $('#next-btn').prop('disabled', currentPage === totalPages || totalRecords === 0);

    // Page number links
    const $nums = $('#pagination-page-numbers');
    $nums.empty();

    for (let p = 1; p <= totalPages; p++) {
      const activeClass = p === currentPage ? 'active' : '';
      const $btn = $(`<button class="pagination-num-btn ${activeClass}">${p}</button>`);
      $btn.on('click', function() {
        currentPage = p;
        renderTableRows();
      });
      $nums.append($btn);
    }
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
})();
