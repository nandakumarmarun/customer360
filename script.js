let threeObjects = {}; // To store scene, stars, etc. for theme updates

/* ====== THREE.JS BACKGROUND ====== */
(function initThree() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 80;

  // Starfield
  const starGeo = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
    const r = Math.random();
    if (r < 0.33) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.4; }
    else if (r < 0.66) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.45; colors[i * 3 + 2] = 0.45; }
    else { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; }
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const starMat = new THREE.PointsMaterial({ size: 0.4, vertexColors: true, transparent: true, opacity: 0.8 });
  scene.add(new THREE.Points(starGeo, starMat));

  // Floating geometry
  const geos = [
    new THREE.IcosahedronGeometry(6, 0),
    new THREE.OctahedronGeometry(4, 0),
    new THREE.TetrahedronGeometry(3, 0)
  ];
  const meshes = [];
  for (let i = 0; i < 6; i++) {
    const geo = geos[i % geos.length];
    const mat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xaa0000 : i % 3 === 1 ? 0xf87171 : 0xf43f5e,
      wireframe: true, transparent: true, opacity: 0.15
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
    starGeo.attributes.position.array.forEach((v, i) => { if (i % 3 === 2) { } });
    renderer.render(scene, camera);
  }
  animate();
})();

/* ====== LOADING SCREEN ====== */
(function initLoader() {
  const line = document.getElementById('loading-line');
  const status = document.getElementById('loading-status');
  const percent = document.getElementById('loading-percent');
  const screen = document.getElementById('loading-screen');
  const app = document.getElementById('app');

  const steps = [
    { pct: 15, msg: 'Initializing System' },
    { pct: 35, msg: 'Loading Neural Engine' },
    { pct: 55, msg: 'Fetching Customer Data' },
    { pct: 72, msg: 'Running AI Analysis' },
    { pct: 88, msg: 'Building Interface' },
    { pct: 100, msg: 'Ready' }
  ];
  let i = 0;
  function nextStep() {
    if (i >= steps.length) {
      setTimeout(() => {
        screen.style.transition = 'opacity 0.8s ease';
        screen.style.opacity = '0';
        setTimeout(() => {
          screen.style.display = 'none';
          app.classList.remove('hidden');
          startApp();
        }, 800);
      }, 400);
      return;
    }
    const s = steps[i++];
    line.style.width = s.pct + '%';
    status.textContent = s.msg;
    percent.textContent = s.pct + '%';
    setTimeout(nextStep, 400 + Math.random() * 300);
  }
  setTimeout(nextStep, 300);
})();

/* ====== AVATAR PARTICLES ====== */
function spawnAvatarParticles() {
  const container = document.getElementById('avatar-particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.style.cssText = `position:absolute;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;
      border-radius:50%;background:${Math.random() < 0.5 ? '#6c63ff' : '#00d4ff'};
      top:${Math.random() * 100}%;left:${Math.random() * 100}%;opacity:0;
      animation:particleFly ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`;
    container.appendChild(p);
  }
  if (!document.getElementById('particle-style')) {
    const st = document.createElement('style');
    st.id = 'particle-style';
    st.textContent = `@keyframes particleFly{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(${(Math.random() - 0.5) * 100}px,${(Math.random() - 0.5) * 100}px);opacity:0}}`;
    document.head.appendChild(st);
  }
}

/* ====== MAIN APP START ====== */
function startApp() {
  spawnAvatarParticles();

  // Avatar reveal
  const info = document.getElementById('avatar-info');
  setTimeout(() => info.classList.add('visible'), 600);

  // Immediate auto-scroll to dashboard
  const dashboard = document.getElementById('scene-dashboard');
  if (dashboard) {
    const scrollObj = { y: window.pageYOffset };
    gsap.to(scrollObj, {
      y: dashboard.offsetTop,
      duration: 2.0, // Snappier scroll
      ease: "power3.inOut",
      onUpdate: () => window.scrollTo(0, scrollObj.y)
    });

    // Make the scroll hint arrow clickable
    const scrollHint = document.getElementById('scroll-hint');
    if (scrollHint) {
      scrollHint.addEventListener('click', () => {
        const currentObj = { y: window.pageYOffset };
        gsap.to(currentObj, {
          y: dashboard.offsetTop,
          duration: 1.5,
          ease: "power3.inOut",
          onUpdate: () => window.scrollTo(0, currentObj.y)
        });
      });
    }
  }

  // GSAP scroll from scene1 → scene2
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Animate alert row (Ticker Alert)
    gsap.from('.alerts-bar', {
      scrollTrigger: { trigger: '#scene-dashboard', start: 'top 80%' },
      y: -40, opacity: 0, duration: 0.8, ease: 'power3.out'
    });

    // Animate dashboard header
    gsap.from('#dash-header', {
      scrollTrigger: { trigger: '#scene-dashboard', start: 'top 80%' },
      y: -40, opacity: 0, duration: 0.8, ease: 'power3.out',
      clearProps: 'transform'
    });

    // Animate profile sidebar
    gsap.from('#profile-sidebar', {
      scrollTrigger: { trigger: '#scene-dashboard', start: 'top 70%' },
      x: -60, duration: 0.9, delay: 0.2, ease: 'power3.out'
    });

    // Animate cards
    gsap.utils.toArray('.info-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: '#cards-grid', start: 'top 80%' },
        y: 50, duration: 0.7, delay: i * 0.1, ease: 'power3.out'
      });
    });

    // Animate modules
    gsap.utils.toArray('.module-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: '#bottom-modules', start: 'top 85%' },
        y: 30, duration: 0.5, delay: i * 0.07, ease: 'power2.out'
      });
    });
  }

  initDetailView();
  initCardHovers();
  initThemeToggle();
  initStories();
}

/* ====== STORIES ====== */
function initStories() {
  document.querySelectorAll('.story-item').forEach(item => {
    item.addEventListener('click', () => {
      const ring = item.querySelector('.story-ring');
      ring.classList.remove('active');

      // Simple feedback
      const label = item.querySelector('span').textContent;
      console.log(`Opening story: ${label}`);

      // Wow effect: small pulse
      gsap.to(item, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
    });
  });
}

/* ====== THEME & COLOR PICKER TOGGLE ====== */
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Load saved theme, default to light
  const savedTheme = localStorage.getItem('customer360-theme') || 'light';

  // Apply light/dark mode classes on start
  if (savedTheme === 'light') {
    root.classList.add('light-mode');
    document.body.classList.add('light-mode');
  } else {
    root.classList.remove('light-mode');
    document.body.classList.remove('light-mode');
  }

  // Load saved color theme, default to red
  const savedColorTheme = localStorage.getItem('customer360-color-theme') || 'red';
  const pickers = document.querySelectorAll('.theme-picker-btn');

  function applyColorTheme(theme) {
    if (theme === 'neon') {
      root.classList.add('theme-neon');
    } else {
      root.classList.remove('theme-neon');
    }
    pickers.forEach(p => {
      if (p.dataset.theme === theme) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    // Update Three.js scene colors
    updateThreeTheme(root.classList.contains('light-mode'));
  }

  applyColorTheme(savedColorTheme);

  // Bind click listeners for color theme pickers
  pickers.forEach(p => {
    p.addEventListener('click', (e) => {
      e.stopPropagation();
      const theme = p.dataset.theme;
      localStorage.setItem('customer360-color-theme', theme);
      applyColorTheme(theme);
    });
  });

  // Ensure Three.js is ready before updating on initial load
  const checkThree = setInterval(() => {
    if (threeObjects.starGeo) {
      updateThreeTheme(root.classList.contains('light-mode'));
      clearInterval(checkThree);
    }
  }, 100);

  btn.addEventListener('click', () => {
    const isLight = root.classList.toggle('light-mode');
    document.body.classList.toggle('light-mode');
    localStorage.setItem('customer360-theme', isLight ? 'light' : 'dark');

    // Wow Effect: Expansion Flash
    const flash = document.createElement('div');
    flash.style.cssText = `position:fixed;top:${btn.getBoundingClientRect().top + 22}px;left:${btn.getBoundingClientRect().left + 22}px;
      width:10px;height:10px;background:var(--accent);border-radius:50%;z-index:10000;pointer-events:none;`;
    document.body.appendChild(flash);

    gsap.to(flash, {
      width: window.innerWidth * 3,
      height: window.innerWidth * 3,
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      onComplete: () => flash.remove()
    });

    updateThreeTheme(isLight);
  });
}

function updateThreeTheme(isLight) {
  if (!threeObjects.starGeo) return;

  const { starGeo, meshes } = threeObjects;
  const colors = starGeo.attributes.color.array;
  const isNeon = document.documentElement.classList.contains('theme-neon');

  for (let i = 0; i < colors.length / 3; i++) {
    if (isLight) {
      if (isNeon) {
        // Neon light mode (Indigo/Purple stars)
        colors[i * 3] = 0.31; colors[i * 3 + 1] = 0.27; colors[i * 3 + 2] = 0.9;
      } else {
        // Red light mode (Crimson Red stars)
        colors[i * 3] = 0.88; colors[i * 3 + 1] = 0.11; colors[i * 3 + 2] = 0.28;
      }
    } else {
      if (isNeon) {
        // Neon dark mode colors
        const r = Math.random();
        if (r < 0.33) { colors[i * 3] = 0.42; colors[i * 3 + 1] = 0.39; colors[i * 3 + 2] = 1; }
        else if (r < 0.66) { colors[i * 3] = 0; colors[i * 3 + 1] = 0.83; colors[i * 3 + 2] = 1; }
        else { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; }
      } else {
        // Red dark mode colors
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
      if (isNeon) {
        m.material.color.setHex(0x4f46e5); // Indigo
      } else {
        m.material.color.setHex(0xaa0000); // Crimson Red
      }
      m.material.opacity = 0.1;
    } else {
      if (isNeon) {
        m.material.color.setHex(i % 3 === 0 ? 0x6c63ff : i % 3 === 1 ? 0x00d4ff : 0xff6b9d);
      } else {
        m.material.color.setHex(i % 3 === 0 ? 0xaa0000 : i % 3 === 1 ? 0xf87171 : 0xf43f5e);
      }
      m.material.opacity = 0.15;
    }
  });
}

/* ====== CINEMATIC DETAIL VIEW (HERO PNG VERSION) ====== */

function initDetailView() {
  const cards = document.querySelectorAll('.info-card[data-modal]');
  const backBtn = document.getElementById('back-to-dash');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Avoid opening detail view if the card is currently loading or in an error state
      if ($(card).find('.card-error-overlay.active, .card-loader-overlay.active').length > 0) {
        return;
      }

      const modalId = card.dataset.modal;
      const data = window.DetailDataCache ? window.DetailDataCache[modalId] : null;
      if (data) {
        openDetail(data);
      } else {
        console.warn(`No cached detail data found for: ${modalId}`);
      }
    });
  });

  backBtn.addEventListener('click', closeDetail);

  // Mouse Tilt & Particle Parallax for Hero Zone
  const left = document.querySelector('.detail-left');
  const hero = document.getElementById('detail-img');
  const particles = document.getElementById('hero-particles');

  left.addEventListener('mousemove', (e) => {
    const rect = left.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Intensified Hero Tilt
    gsap.to(hero, {
      rotateY: x * 40, // Increased from 20
      rotateX: -y * 40, // Increased from 20
      x: x * 50,
      y: y * 50,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Particle Parallax (inverse movement for depth)
    const pDots = particles.querySelectorAll('.hero-particle');
    pDots.forEach((p, i) => {
      const depth = (i % 5) + 1;
      gsap.to(p, {
        x: -x * 60 * depth,
        y: -y * 60 * depth,
        duration: 1 + (i % 3) * 0.5,
        ease: 'power1.out'
      });
    });
  });

  left.addEventListener('mouseleave', () => {
    gsap.to(hero, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' });
    const pDots = particles.querySelectorAll('.hero-particle');
    pDots.forEach(p => gsap.to(p, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' }));
  });
}

function createHeroParticles() {
  const container = document.getElementById('hero-particles');
  container.innerHTML = '';
  const count = 40;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    const size = Math.random() * 4 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const z = (Math.random() - 0.5) * 200;

    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}%;
      top: ${y}%;
      transform: translateZ(${z}px);
      opacity: ${Math.random() * 0.5 + 0.2};
    `;
    container.appendChild(p);

    // Subtle float animation
    gsap.to(p, {
      y: `+=${(Math.random() - 0.5) * 30}`,
      x: `+=${(Math.random() - 0.5) * 30}`,
      duration: 3 + Math.random() * 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
}

let currentDetailIndex = 0;
let isDetailScrolling = false;

function openDetail(data) {
  window.currentActiveDetailData = data;
  const detailView = document.getElementById('detail-view');
  detailView.classList.remove('hidden');
  setTimeout(() => detailView.classList.add('visible'), 10);
  document.body.style.overflow = 'hidden';

  document.getElementById('detail-model-title').textContent = data.title;
  document.getElementById('detail-img').src = `assets/png/${data.hero}`;

  // Tag Handling
  const modelTag = document.getElementById('detail-model-tag');
  if (modelTag) {
    if (data.tag) {
      modelTag.textContent = data.tag;
      modelTag.style.display = 'inline-block';
      modelTag.className = `card-tag ${data.tagClass || 'tag-normal'}`;
    } else {
      modelTag.style.display = 'none';
    }
  }

  const stack = document.getElementById('detail-cards-stack');
  const dotsContainer = document.getElementById('detail-nav-dots');
  stack.innerHTML = '';
  dotsContainer.innerHTML = '';
  currentDetailIndex = 0;

  // Preprocess sections to handle text splitting (only for structured fields, keep direct display fields intact)
  const processedSections = [];
  data.sections.forEach(sec => {
    const newFields = {};

    Object.entries(sec.fields).forEach(([k, v]) => {
      let valStr = "";
      let hideLabel = false;
      
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        valStr = String(v.value || "");
        hideLabel = !!v.hideLabel;
      } else {
        valStr = String(v);
      }

      newFields[k] = { value: valStr, hideLabel: hideLabel };
    });

    processedSections.push({
      name: sec.name,
      fields: newFields
    });
  });

  // Group sections by their actual rendered pixel height to fit precisely inside the card without overflowing.
  const BUDGET_HEIGHT = 410; // Maximum allowed height of card content in pixels (safe layout budget)
  const HEADER_HEIGHT = 42; // Height of section h4 header plus its padding and border
  const SECTION_MARGIN = 30; // margin-bottom of a section container
  const GRID_GAP = 20; // row gap in grid

  function getGridHeight(fields) {
    if (fields.length === 0) return 0;
    let rows = [];
    let currentRowCols = 0; // 0, 1, or 2

    fields.forEach(([k, f]) => {
      const valLen = f.value ? f.value.length : 0;
      const isScrollable = valLen > 100;
      const isFullWidth = f.hideLabel || valLen > 25 || isScrollable;

      let fieldHeight = 0;
      if (isScrollable) {
        fieldHeight = 90; // Clamped height for scrollable fields
      } else if (f.hideLabel) {
        // font-size 13px, line-height 1.6 => ~21px per line
        const lines = Math.ceil(valLen / 60) || 1;
        fieldHeight = lines * 21;
      } else {
        // label height is ~18px, span line-height ~1.4 for 12px font => ~17px per line
        const lines = Math.ceil(valLen / 60) || 1;
        fieldHeight = 18 + lines * 17;
      }

      if (isFullWidth) {
        currentRowCols = 0; // Close any preceding half-row
        rows.push(fieldHeight);
      } else {
        if (currentRowCols === 1) {
          // Place in the second column of the current row, updating row height to the max
          const prevHeight = rows[rows.length - 1];
          rows[rows.length - 1] = Math.max(prevHeight, fieldHeight);
          currentRowCols = 0;
        } else {
          // Start a new row
          rows.push(fieldHeight);
          currentRowCols = 1;
        }
      }
    });

    const totalRowsHeight = rows.reduce((sum, h) => sum + h, 0);
    const totalGaps = (rows.length - 1) * GRID_GAP;
    return totalRowsHeight + (totalGaps > 0 ? totalGaps : 0);
  }

  function getCardHeight(sections) {
    if (sections.length === 0) return 0;
    let total = 0;
    sections.forEach((sec, idx) => {
      total += HEADER_HEIGHT;
      total += getGridHeight(Object.entries(sec.fields));
      if (idx < sections.length - 1) {
        total += SECTION_MARGIN;
      }
    });
    return total;
  }

  const groupedSections = [];
  let currentCardSections = [];

  processedSections.forEach(sec => {
    let remainingFields = Object.entries(sec.fields);
    let isContinuation = false;

    while (remainingFields.length > 0) {
      const sectionTitle = isContinuation ? `${sec.name} (Cont.)` : sec.name;
      
      // Look for/create this section on the current card
      let activeSection = currentCardSections.find(s => s.name === sectionTitle);
      let isNewSectionOnCard = false;
      if (!activeSection) {
        activeSection = { name: sectionTitle, fields: {} };
        isNewSectionOnCard = true;
      }

      const addedFields = [];
      while (remainingFields.length > 0) {
        const [k, v] = remainingFields[0];
        
        // Temporarily assign field to activeSection
        activeSection.fields[k] = v;
        if (isNewSectionOnCard) {
          currentCardSections.push(activeSection);
          isNewSectionOnCard = false;
        }

        const height = getCardHeight(currentCardSections);
        
        // Force the first field of a clean card to fit to avoid infinite loops
        const isFirstFieldOnCard = currentCardSections.length === 1 && Object.keys(currentCardSections[0].fields).length === 1;
        
        if (height <= BUDGET_HEIGHT || isFirstFieldOnCard) {
          remainingFields.shift();
          addedFields.push([k, v]);
        } else {
          // Rollback the field
          delete activeSection.fields[k];
          if (Object.keys(activeSection.fields).length === 0) {
            const idx = currentCardSections.indexOf(activeSection);
            if (idx > -1) {
              currentCardSections.splice(idx, 1);
            }
          }
          break; // Stop adding fields to this card
        }
      }

      if (addedFields.length === 0) {
        // Current card is full, push and reset
        groupedSections.push(currentCardSections);
        currentCardSections = [];
        isContinuation = true;
      } else {
        if (remainingFields.length > 0) {
          // Card was filled, push and reset
          groupedSections.push(currentCardSections);
          currentCardSections = [];
          isContinuation = true;
        }
      }
    }
  });

  if (currentCardSections.length > 0) {
    groupedSections.push(currentCardSections);
  }

  groupedSections.forEach((group, idx) => {
    // Create Card
    const card = document.createElement('div');
    card.className = `detail-card glass-card ${idx === 0 ? 'active' : ''}`;

    let cardContent = '';
    group.forEach(sec => {
      let fieldsHtml = '';

      for (const [k, fieldObj] of Object.entries(sec.fields)) {
        const valStr = fieldObj.value;
        const length = valStr.length;
        
        // Lower threshold to 100 chars to strictly enforce capacity limits
        const isScrollable = length > 100;
        // Clamp height to ~2 rows (90px) to match fieldCost = 4
        const scrollStyle = isScrollable ? 'max-height: 90px; overflow-y: auto; padding-right: 8px;' : '';
        const scrollClass = isScrollable ? 'scrollable-field' : '';

        if (fieldObj.hideLabel) {
          fieldsHtml += `
            <div class="d-field direct-val ${scrollClass}" style="grid-column: 1 / -1; white-space: pre-line; display: block; width: 100%; ${scrollStyle}">
              <span style="font-size: 13px; line-height: 1.6; font-weight: 400; color: var(--text);">${valStr}</span>
            </div>
          `;
        } else {
          const isLong = length > 25;
          let fontSize = 12;
          if (length > 100) fontSize = 10;
          else if (length > 70) fontSize = 11;
          else if (length > 40) fontSize = 11;

          fieldsHtml += `
            <div class="d-field ${isLong ? 'full' : ''} ${scrollClass}" style="${scrollStyle}">
              <label>${k}</label>
              <span style="font-size: ${fontSize}px; white-space: pre-wrap; word-break: break-word;">${valStr}</span>
            </div>
          `;
        }
      }

      cardContent += `
        <div class="card-inner-section">
          <h4>${sec.name}</h4>
          <div class="d-grid">${fieldsHtml}</div>
        </div>
      `;
    });

    card.innerHTML = cardContent;
    stack.appendChild(card);

    // Create Dot
    const dot = document.createElement('div');
    dot.className = `nav-dot ${idx === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => setDetailCard(idx));
    dotsContainer.appendChild(dot);
  });

  // Event Listeners for Carousel
  const rightPanel = document.querySelector('.detail-right');

  // Wheel Interaction
  rightPanel.onwheel = (e) => {
    const scrollField = e.target.closest('.scrollable-field');
    if (scrollField) {
      const atTop = scrollField.scrollTop === 0;
      const atBottom = Math.abs(scrollField.scrollHeight - scrollField.scrollTop - scrollField.clientHeight) < 2;
      if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
        return; // Allow native scroll inside the field
      }
    }
    
    if (isDetailScrolling) return;
    if (e.deltaY > 20) setDetailCard(currentDetailIndex + 1);
    else if (e.deltaY < -20) setDetailCard(currentDetailIndex - 1);
  };

  // Touch Interaction
  let touchStart = 0;
  rightPanel.ontouchstart = (e) => touchStart = e.touches[0].clientY;
  rightPanel.ontouchmove = (e) => {
    const scrollField = e.target.closest('.scrollable-field');
    if (scrollField) {
      const touchCurrent = e.touches[0].clientY;
      const deltaY = touchStart - touchCurrent;
      const atTop = scrollField.scrollTop === 0;
      const atBottom = Math.abs(scrollField.scrollHeight - scrollField.scrollTop - scrollField.clientHeight) < 2;
      
      if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
        touchStart = touchCurrent;
        return;
      }
    }

    if (isDetailScrolling) return;
    let touchEnd = e.touches[0].clientY;
    if (touchStart - touchEnd > 50) setDetailCard(currentDetailIndex + 1);
    else if (touchEnd - touchStart > 50) setDetailCard(currentDetailIndex - 1);
  };

  // Conditional Navigation Visibility
  const hasMultiple = groupedSections.length > 1;
  document.getElementById('detail-prev').style.display = hasMultiple ? 'flex' : 'none';
  document.getElementById('detail-next').style.display = hasMultiple ? 'flex' : 'none';
  document.querySelector('.detail-nav-footer').style.display = hasMultiple ? 'flex' : 'none';

  // Arrow Interaction
  if (hasMultiple) {
    document.getElementById('detail-prev').onclick = () => setDetailCard(currentDetailIndex - 1);
    document.getElementById('detail-next').onclick = () => setDetailCard(currentDetailIndex + 1);
  }

  createHeroParticles();
}

function setDetailCard(index) {
  const cards = document.querySelectorAll('.detail-card');
  const dots = document.querySelectorAll('.nav-dot');
  if (index < 0 || index >= cards.length || index === currentDetailIndex || isDetailScrolling) return;

  isDetailScrolling = true;

  // Update Classes
  cards.forEach((c, i) => {
    c.classList.remove('active', 'prev', 'next');
    if (i === index) c.classList.add('active');
    else if (i < index) c.classList.add('prev');
    else c.classList.add('next');
  });

  dots.forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });

  currentDetailIndex = index;

  // Throttle
  setTimeout(() => isDetailScrolling = false, 800);
}

// Removed initDetailParallax in favor of carousel logic

function closeDetail() {
  const detailView = document.getElementById('detail-view');
  detailView.classList.remove('visible');
  document.body.style.overflow = '';
  setTimeout(() => detailView.classList.add('hidden'), 800);
}

/* ====== CARD HOVER TILT ====== */
function initCardHovers() {
  document.querySelectorAll('.info-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      card.style.transform = `translateY(-4px) rotateX(${-dy * 5}deg) rotateY(${dx * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });
}

/* ====== QUICK MODULES ====== */
let currentQmIndex = 0;
let qmModules = [];

function initQuickModules() {
  const qmView = document.getElementById('quick-module-view');
  const cardsGrid = document.getElementById('cards-grid');
  const backBtn = document.getElementById('qm-back-to-dash');
  const qmTitle = document.getElementById('qm-title');
  const qmContent = document.getElementById('qm-content');
  const qmNavDots = document.getElementById('qm-nav-dots');

  let isAnimating = false;

  const moduleCards = document.querySelectorAll('.module-card');
  qmModules = [{ title: 'Main Dashboard', isMain: true, index: 0, element: null }];
  Array.from(moduleCards).forEach((card, i) => {
    qmModules.push({
      title: card.querySelector('span').innerText,
      isMain: false,
      index: i + 1,
      element: card
    });
  });

  function updateDots(index) {
    if (!qmNavDots) return;
    Array.from(qmNavDots.children).forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  function setQuickModule(index, direction = 1) {
    if (isAnimating) return;
    if (index < 0 || index >= qmModules.length || index === currentQmIndex) return;
    
    isAnimating = true;
    const module = qmModules[index];

    // Going to Main Dashboard
    if (index === 0) {
      // Returning to Dashboard
      if (backBtn) backBtn.classList.add('hidden');
      
      if (typeof gsap !== 'undefined') {
        gsap.to(qmView, {
          opacity: 0, scale: 1.1, y: 50, rotateX: -15, duration: 0.5, ease: 'power3.inOut',
          onComplete: () => {
            qmView.classList.add('hidden');
            cardsGrid.style.display = '';
            gsap.fromTo(cardsGrid,
              { opacity: 0, scale: 0.9, filter: "blur(10px)" },
              { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.7, ease: 'back.out(1.2)', clearProps: 'all', onComplete: () => isAnimating = false }
            );
          }
        });
      } else {
        qmView.classList.add('hidden');
        cardsGrid.style.display = '';
        isAnimating = false;
      }
      currentQmIndex = index;
      updateDots(index);
      return;
    }

    // Going to a Quick Module
    const newHtml = `
        <div style="background: var(--glass2); padding: 40px; border-radius: 20px; border: 1px dashed var(--border); color: var(--text); font-size: 18px; text-align: center; transform-origin: center;">
          <p>This is the parallax layout for the <strong>${module.title}</strong> module.</p>
          <p style="margin-top: 20px; color: var(--muted); font-size: 14px;">Module Index: ${index} of ${qmModules.length - 1}</p>
        </div>
    `;

    if (currentQmIndex === 0) {
      // First time opening from dashboard
      if (backBtn) {
        setTimeout(() => backBtn.classList.remove('hidden'), 300);
      }
      
      qmTitle.innerText = module.title + ' Module';
      qmContent.innerHTML = newHtml;
      
      if (typeof gsap !== 'undefined') {
        gsap.to(cardsGrid, {
          opacity: 0, scale: 0.9, filter: "blur(10px)", duration: 0.5, ease: 'power3.inOut',
          onComplete: () => {
            cardsGrid.style.display = 'none';
            qmView.classList.remove('hidden');
            gsap.fromTo(qmView, 
              { opacity: 0, scale: 1.1, y: 50, rotateX: 15 },
              { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 0.7, ease: 'back.out(1.2)', clearProps: 'all', onComplete: () => isAnimating = false }
            );
          }
        });
      } else {
        cardsGrid.style.display = 'none';
        qmView.classList.remove('hidden');
        isAnimating = false;
      }
    } else {
      // Parallax transition between modules
      if (typeof gsap !== 'undefined') {
        const outX = direction > 0 ? -100 : 100;
        const inX = direction > 0 ? 100 : -100;
        
        gsap.to(qmTitle, { opacity: 0, x: outX * 0.5, duration: 0.3, ease: 'power2.in' });
        gsap.to(qmContent, { opacity: 0, x: outX, filter: "blur(5px)", duration: 0.4, ease: 'power2.in', onComplete: () => {
            qmTitle.innerText = module.title + ' Module';
            qmContent.innerHTML = newHtml;
            
            gsap.fromTo(qmTitle, { opacity: 0, x: inX * 0.5 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', clearProps: 'all' });
            gsap.fromTo(qmContent, 
              { opacity: 0, x: inX, filter: "blur(5px)" },
              { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.6, ease: 'power3.out', clearProps: 'all', onComplete: () => isAnimating = false }
            );
          }
        });
      } else {
        qmTitle.innerText = module.title + ' Module';
        qmContent.innerHTML = newHtml;
        isAnimating = false;
      }
    }
    
    currentQmIndex = index;
    updateDots(index);
  }

  // Generate Navigation Dots
  if (qmNavDots) {
    qmNavDots.innerHTML = '';
    qmModules.forEach((m, i) => {
      const dot = document.createElement('div');
      dot.className = 'qm-dot';
      dot.setAttribute('data-title', m.title);
      if (i === 0) dot.classList.add('active'); // Dashboard is initially active
      dot.addEventListener('click', () => {
        if (!isAnimating && i !== currentQmIndex) {
          setQuickModule(i, i > currentQmIndex ? 1 : -1);
        }
      });
      qmNavDots.appendChild(dot);
    });
  }

  // Card Clicks
  qmModules.forEach((m, i) => {
    if (m.isMain || !m.element) return;
    m.element.addEventListener('click', () => {
      if (isAnimating || !cardsGrid || !qmView) return;
      setQuickModule(i, 1);
    });
  });

  // Back Button
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      setQuickModule(0, -1);
    });
  }
}

/* ====== STARTUP ====== */
document.addEventListener('DOMContentLoaded', () => {
  initQuickModules();
  const orb = document.getElementById('avatar-orb');
  if (orb) {
    orb.addEventListener('click', () => {
      orb.style.transform = 'scale(1.15)';
      setTimeout(() => orb.style.transform = '', 600);
    });
  }
});
