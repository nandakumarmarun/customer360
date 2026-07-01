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
        // Prepare layout and start animations behind the solid loading screen
        app.classList.remove('hidden');
        startApp();

        // Fade out the loading screen smoothly
        screen.style.transition = 'opacity 0.8s ease';
        screen.style.opacity = '0';
        
        setTimeout(() => {
          screen.style.display = 'none';
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

  function applyThemeMode(mode) {
    if (mode === 'light') {
      root.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
    // Update Three.js scene colors
    updateThreeTheme(mode === 'light');
  }

  // Load theme from server via ThemeModule
  if (window.ThemeModule) {
    window.ThemeModule.getTheme(function (mode, color) {
      applyThemeMode(mode);
      applyColorTheme(color);
    });
  }

  // Bind click listeners for color theme pickers
  pickers.forEach(p => {
    p.onclick = (e) => {
      if (!document.getElementById('scene-dashboard')) return;
      e.stopPropagation();
      const theme = p.dataset.theme;
      applyColorTheme(theme);
      
      const currentMode = root.classList.contains('light-mode') ? 'light' : 'dark';
      if (window.ThemeModule) {
        window.ThemeModule.saveTheme(currentMode, theme);
      }
    };
  });

  // Ensure Three.js is ready before updating on initial load
  const checkThree = setInterval(() => {
    if (threeObjects.starGeo) {
      updateThreeTheme(root.classList.contains('light-mode'));
      clearInterval(checkThree);
    }
  }, 100);

  btn.onclick = () => {
    if (!document.getElementById('scene-dashboard')) return;
    const isLight = root.classList.toggle('light-mode');
    document.body.classList.toggle('light-mode');
    const currentMode = isLight ? 'light' : 'dark';
    const currentColor = root.classList.contains('theme-neon') ? 'neon' : 'red';

    if (window.ThemeModule) {
      window.ThemeModule.saveTheme(currentMode, currentColor);
    }

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
  };
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

  // Mouse Tilt & Particle Parallax for Header Banner
  const header = document.querySelector('.detail-header');
  const hero = document.getElementById('detail-img');
  const particles = document.getElementById('hero-particles');

  header.addEventListener('mousemove', (e) => {
    const rect = header.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    // Intensified Hero Tilt
    gsap.to(hero, {
      rotateY: x * 40,
      rotateX: -y * 40,
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

  header.addEventListener('mouseleave', () => {
    gsap.to(hero, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' });
    const pDots = particles.querySelectorAll('.hero-particle');
    pDots.forEach(p => gsap.to(p, { x: 0, y: 0, duration: 1.5, ease: 'power2.out' }));
  });
}

function createHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
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

function getHeaderIcon(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("personal")) return "👤";
  if (t.includes("contact")) return "📡";
  if (t.includes("address")) return "📍";
  if (t.includes("owner")) return "👥";
  if (t.includes("other")) return "⚙️";
  if (t.includes("kyc") || t.includes("compliance")) return "🛡️";
  return "🔹";
}

function getHeaderDesc(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("personal")) return "Comprehensive identity profile, professional details, and bank tier status.";
  if (t.includes("contact")) return "Primary communication channels and residential contact numbers.";
  if (t.includes("address")) return "Verified home, residential, and mailing addresses.";
  if (t.includes("owner")) return "Shareholders, ownership percentages, and control structures.";
  if (t.includes("other")) return "Supplementary system parameters, remarks, and preferences.";
  if (t.includes("kyc") || t.includes("compliance")) return "Regulatory check status, document verification, and risk metrics.";
  return "Detailed client profile information.";
}

function getFieldIcon(label) {
  const l = (label || "").toLowerCase();
  if (l.includes("phone") || l.includes("mobile") || l.includes("tel")) return "📞";
  if (l.includes("email") || l.includes("mail")) return "✉️";
  if (l.includes("address") || l.includes("street") || l.includes("city") || l.includes("state") || l.includes("country") || l.includes("zip") || l.includes("postal")) return "📍";
  if (l.includes("birth") || l.includes("dob") || l.includes("age")) return "🎂";
  if (l.includes("gender") || l.includes("sex")) return "👤";
  if (l.includes("nationality") || l.includes("passport")) return "🌐";
  if (l.includes("occupation") || l.includes("employer") || l.includes("industry") || l.includes("job") || l.includes("work")) return "💼";
  if (l.includes("status") || l.includes("classification") || l.includes("tier")) return "🏷️";
  if (l.includes("net worth") || l.includes("balance") || l.includes("income") || l.includes("salary") || l.includes("revenue")) return "💰";
  if (l.includes("score") || l.includes("rating") || l.includes("risk")) return "⭐️";
  if (l.includes("since") || l.includes("date") || l.includes("time")) return "📅";
  if (l.includes("tax") || l.includes("ssn") || l.includes("id") || l.includes("cid")) return "📄";
  if (l.includes("rm") || l.includes("manager") || l.includes("owner") || l.includes("beneficial")) return "👥";
  return "🔹";
}

function openDetail(data) {
  window.currentActiveDetailData = data;
  const detailView = document.getElementById('detail-view');
  detailView.classList.remove('hidden');
  setTimeout(() => detailView.classList.add('visible'), 10);
  document.body.style.overflow = 'hidden';

  document.getElementById('detail-model-title').textContent = data.title;
  document.getElementById('detail-model-desc').textContent = getHeaderDesc(data.title);
  const assetsPath = (window.ASSETS_CONFIG && window.ASSETS_CONFIG.DASHBOARD_ASSETS_PATH) || 'assets/png/';
  document.getElementById('detail-img').src = `${assetsPath}${data.hero}`;

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

  // Create particles
  createHeroParticles();

  const contentArea = document.getElementById('detail-content-area');
  contentArea.innerHTML = '';

  data.sections.forEach(sec => {
    // Create Section Element
    const secEl = document.createElement('div');
    secEl.className = 'detail-section-block glass-card';

    let sectionHeader = `<h3>${sec.name}</h3>`;
    let fieldsHtml = '';

    Object.entries(sec.fields).forEach(([label, v]) => {
      let valStr = "";
      let hideLabel = false;

      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        valStr = String(v.value || "");
        hideLabel = !!v.hideLabel;
      } else {
        valStr = String(v);
      }

      const icon = getFieldIcon(label);
      
      // Dynamically calculate the column span based on data length:
      // - span 1: short text (value length <= 15)
      // - span 2: medium text (value length > 15 && value length <= 35)
      // - span 3: long text (value length > 35)
      let span = 1;
      if (valStr.length > 35 || hideLabel) {
        span = 3;
      } else if (valStr.length > 15) {
        span = 2;
      }

      const isFullWidth = span === 3;
      const isSpan2 = span === 2;
      const isInline = false;

      fieldsHtml += `
        <div class="detail-field-card ${isFullWidth ? 'full-width' : ''} ${isSpan2 ? 'span-2' : ''} ${isInline ? 'inline-layout' : ''}">
          <div class="df-info">
            ${hideLabel ? '' : `<label class="df-label"><span class="df-icon-inline">${icon}</span> ${label}${isInline ? ':' : ''}</label>`}
            <span class="df-value">${valStr}</span>
          </div>
        </div>
      `;
    });

    secEl.innerHTML = `
      ${sectionHeader}
      <div class="detail-fields-grid">
        ${fieldsHtml}
      </div>
    `;

    contentArea.appendChild(secEl);
  });
}

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
  qmModules = [{ title: 'Main Dashboard', isMain: true, index: 0, element: null, icon: '🏠' }];
  Array.from(moduleCards).forEach((card, i) => {
    const iconEl = card.querySelector('.mod-icon');
    qmModules.push({
      title: card.querySelector('span').innerText,
      isMain: false,
      index: i + 1,
      element: card,
      icon: iconEl ? iconEl.innerText.trim() : '🔹'
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
      dot.innerHTML = `<span class="qm-dot-icon">${m.icon}</span>`;
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

/* ====== NOTIFICATIONS PANEL INITS ====== */
function initNotifications() {
  const bellBtn = document.querySelector('.header-notif');
  const alertsBar = document.querySelector('.alerts-bar');
  const panel = document.getElementById('notif-panel');
  const backdrop = document.getElementById('notif-backdrop');
  const closeBtn = document.getElementById('notif-close-btn');

  if (!bellBtn || !panel || !backdrop || !closeBtn) return;

  function openNotifPanel() {
    panel.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    // force reflow
    panel.offsetHeight;
    backdrop.offsetHeight;
    panel.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeNotifPanel() {
    panel.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!panel.classList.contains('active')) {
        panel.classList.add('hidden');
      }
      if (!backdrop.classList.contains('active')) {
        backdrop.classList.add('hidden');
      }
    }, 400);
  }

  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openNotifPanel();
  });

  if (alertsBar) {
    alertsBar.style.cursor = 'pointer';
    alertsBar.addEventListener('click', (e) => {
      e.stopPropagation();
      openNotifPanel();
    });
  }

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeNotifPanel();
  });

  backdrop.addEventListener('click', (e) => {
    e.stopPropagation();
    closeNotifPanel();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('active')) {
      closeNotifPanel();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initQuickModules();
  initNotifications();
  const orb = document.getElementById('avatar-orb');
  if (orb) {
    orb.addEventListener('click', () => {
      orb.style.transform = 'scale(1.15)';
      setTimeout(() => orb.style.transform = '', 600);
    });
  }
});
