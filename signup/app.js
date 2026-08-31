/* ============================================================
   app.js – Display Hub logic
   ============================================================ */

(function () {
  'use strict';

  // ── Persist settings in localStorage ──────────────────────
  const store = {
    get: (k, fallback) => {
      try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // ── Element refs ───────────────────────────────────────────
  const navbar          = document.getElementById('navbar');
  const navBtns         = document.querySelectorAll('.nav-btn');
  const settingsToggle  = document.getElementById('settings-toggle');
  const settingsPanel   = document.getElementById('settings-panel');
  const settingsClose   = document.getElementById('settings-close');
  const fsBtn           = document.getElementById('fs-btn');

  const imgUrlInput     = document.getElementById('img-url-input');
  const imgUrlApply     = document.getElementById('img-url-apply');
  const imgFitCheck     = document.getElementById('img-fit');
  const imageViewEl     = document.getElementById('image-view');
  const slidesUrlInput  = document.getElementById('slides-url-input');
  const slidesUrlApply  = document.getElementById('slides-url-apply');
  const clockStyleSel   = document.getElementById('clock-style');
  const clock24hCheck   = document.getElementById('clock-24h');
  const clockSecondsCheck = document.getElementById('clock-seconds');

  const clockTimeEl     = document.getElementById('clock-time');
  const clockDateEl     = document.getElementById('clock-date');

  const clockView       = document.getElementById('clock-view');
  const clockHueInput   = document.getElementById('clock-hue');
  const clockHueVal     = document.getElementById('clock-hue-val');
  const clockSatInput   = document.getElementById('clock-sat');
  const clockSatVal     = document.getElementById('clock-sat-val');
  const clockLitInput   = document.getElementById('clock-lit');
  const clockLitVal     = document.getElementById('clock-lit-val');
  const clockGradCheck  = document.getElementById('clock-gradient');
  const gradAngleRow    = document.getElementById('gradient-angle-row');
  const gradAngleInput  = document.getElementById('clock-grad-angle');
  const gradAngleVal    = document.getElementById('clock-grad-angle-val');
  const clockBgReset    = document.getElementById('clock-bg-reset');

  const displayImage    = document.getElementById('display-image');
  const imagePlaceholder= document.getElementById('image-placeholder');

  const slidesIframe    = document.getElementById('slides-iframe');
  const slidesPh        = document.getElementById('slides-placeholder');

  // ── State ──────────────────────────────────────────────────
  let currentView   = store.get('currentView',  'clock');
  let imageUrl      = store.get('imageUrl',      '');
  let imgFit        = store.get('imgFit',         false);
  let slidesUrl     = store.get('slidesUrl',     '');
  let clockStyle    = store.get('clockStyle',    'digital');
  let clock24h      = store.get('clock24h',       false);
  let clockSeconds  = store.get('clockSeconds',   false);
  let clockBg       = store.get('clockBg', { hue: 0, sat: 50, lit: 25, gradient: false, angle: 135 });
  let inactivityTimer = null;
  const INACTIVITY_MS = 4000; // ms until UI hides

  // ── View switching ─────────────────────────────────────────
  function showView(name) {
    currentView = name;
    store.set('currentView', name);

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(name + '-view').classList.add('active');

    navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  // ── Fullscreen ─────────────────────────────────────────────
  function enterFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                el.mozRequestFullScreen || el.msRequestFullscreen;
    if (req) req.call(el).catch(() => {});
  }

  function exitFullscreen() {
    const ex = document.exitFullscreen || document.webkitExitFullscreen ||
               document.mozCancelFullScreen || document.msExitFullscreen;
    if (ex) ex.call(document).catch(() => {});
  }

  function isFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement ||
              document.mozFullScreenElement || document.msFullscreenElement);
  }

  fsBtn.addEventListener('click', () => {
    isFullscreen() ? exitFullscreen() : enterFullscreen();
  });

  document.addEventListener('fullscreenchange',       updateFsBtn);
  document.addEventListener('webkitfullscreenchange', updateFsBtn);
  document.addEventListener('mozfullscreenchange',    updateFsBtn);

  function updateFsBtn() {
    fsBtn.textContent = isFullscreen() ? '⛶' : '⛶';
    fsBtn.title = isFullscreen() ? 'Exit Fullscreen' : 'Enter Fullscreen';
  }

  // Auto-enter fullscreen on first user gesture (browsers require a gesture)
  function tryAutoFullscreen() {
    if (!isFullscreen()) enterFullscreen();
    document.removeEventListener('click', tryAutoFullscreen);
    document.removeEventListener('keydown', tryAutoFullscreen);
    document.removeEventListener('touchstart', tryAutoFullscreen);
  }
  document.addEventListener('click',      tryAutoFullscreen);
  document.addEventListener('keydown',    tryAutoFullscreen);
  document.addEventListener('touchstart', tryAutoFullscreen);

  // ── Inactivity / UI hide ───────────────────────────────────
  function showUI() {
    navbar.classList.remove('hidden');
    resetInactivity();
  }

  function hideUI() {
    // Don't hide if settings panel is open
    if (!settingsPanel.hidden) { resetInactivity(); return; }
    navbar.classList.add('hidden');
  }

  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(hideUI, INACTIVITY_MS);
  }

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(evt => {
    document.addEventListener(evt, showUI, { passive: true });
  });

  resetInactivity(); // start the timer immediately

  // ── Settings panel ─────────────────────────────────────────
  settingsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsPanel.hidden = !settingsPanel.hidden;
    if (!settingsPanel.hidden) {
      // Pre-fill inputs
      imgUrlInput.value    = imageUrl;
      imgFitCheck.checked  = imgFit;
      slidesUrlInput.value = slidesUrl;
      clockStyleSel.value  = clockStyle;
      clock24hCheck.checked = clock24h;
      clockSecondsCheck.checked = clockSeconds;
      syncClockBgControls(clockBg);
      resetInactivity();   // keep UI alive while panel is open
    }
  });

  settingsClose.addEventListener('click', () => {
    settingsPanel.hidden = true;
    resetInactivity();
  });

  // Close panel on outside click
  document.addEventListener('click', (e) => {
    if (!settingsPanel.hidden &&
        !settingsPanel.contains(e.target) &&
        e.target !== settingsToggle) {
      settingsPanel.hidden = true;
    }
  });

  // ── Image fit ──────────────────────────────────────────────
  function applyImgFit(fit) {
    imageViewEl.classList.toggle('fit-screen', fit);
  }

  imgFitCheck.addEventListener('change', () => {
    imgFit = imgFitCheck.checked;
    store.set('imgFit', imgFit);
    applyImgFit(imgFit);
  });

  // ── Image setting ──────────────────────────────────────────
  function applyImage(url) {
    if (!url) return;
    imageUrl = url;
    store.set('imageUrl', url);

    displayImage.classList.remove('loaded');
    imagePlaceholder.style.display = 'none';

    const img = new Image();
    img.onload = () => {
      displayImage.src = url;
      displayImage.classList.add('loaded');
    };
    img.onerror = () => {
      imagePlaceholder.style.display = '';
      imagePlaceholder.innerHTML =
        '⚠ Could not load image.<br/>Check the URL and make sure CORS allows embedding.';
    };
    img.src = url;
  }

  imgUrlApply.addEventListener('click', () => {
    applyImage(imgUrlInput.value.trim());
    settingsPanel.hidden = true;
    showView('image');
  });

  // ── Slides setting ─────────────────────────────────────────
  /**
   * Google Slides share URLs come in several flavours.
   * This converts any of them into the embed format with auto-advance.
   *   /pub?start=true&loop=true&delayms=5000
   */
  function toSlidesEmbedUrl(raw) {
    try {
      const url = new URL(raw);
      // Already an embed URL
      if (url.pathname.includes('/embed')) return raw;

      // Strip everything after the presentation ID
      const match = url.pathname.match(/\/presentation\/d\/([^/]+)/);
      if (!match) return raw; // unknown format – use as-is

      const id = match[1];
      return `https://docs.google.com/presentation/d/${id}/embed?start=true&loop=true&delayms=60000`;
    } catch {
      return raw; // not a URL we understand – pass through
    }
  }

  function applySlides(url) {
    if (!url) return;
    const embedUrl = toSlidesEmbedUrl(url);
    slidesUrl = url;
    store.set('slidesUrl', url);

    slidesIframe.src = embedUrl;
    slidesIframe.classList.add('loaded');
    slidesPh.style.display = 'none';
  }

  slidesUrlApply.addEventListener('click', () => {
    applySlides(slidesUrlInput.value.trim());
    settingsPanel.hidden = true;
    showView('slides');
  });

  // ── Clock style ────────────────────────────────────────────
  clockStyleSel.addEventListener('change', () => {
    clockStyle = clockStyleSel.value;
    store.set('clockStyle', clockStyle);
    document.body.className = clockStyle === 'minimal' ? 'minimal' : '';
  });

  clock24hCheck.addEventListener('change', () => {
    clock24h = clock24hCheck.checked;
    store.set('clock24h', clock24h);
  });

  clockSecondsCheck.addEventListener('change', () => {
    clockSeconds = clockSecondsCheck.checked;
    store.set('clockSeconds', clockSeconds);
  });

  // ── Clock background ───────────────────────────────────────
  function applyClockBg(bg) {
    const { hue, sat, lit, gradient, angle } = bg;
    if (gradient) {
      // Sweep ±40 hue degrees around the chosen hue
      const h1 = (hue - 40 + 360) % 360;
      const h2 = hue;
      const h3 = (hue + 40) % 360;
      clockView.style.background =
        `linear-gradient(${angle}deg, hsl(${h1},${sat}%,${lit}%), hsl(${h2},${sat}%,${Math.min(lit + 8, 60)}%), hsl(${h3},${sat}%,${lit}%))`;
    } else {
      clockView.style.background = `hsl(${hue},${sat}%,${lit}%)`;
    }
    // Keep text readable: use light text on dark bg, dark text on light bg
    clockView.style.color = lit > 40 ? '#111' : '#fff';
  }

  function syncClockBgControls(bg) {
    clockHueInput.value    = bg.hue;
    clockHueVal.textContent = bg.hue;
    clockSatInput.value    = bg.sat;
    clockSatVal.textContent = bg.sat + '%';
    clockLitInput.value    = bg.lit;
    clockLitVal.textContent = bg.lit + '%';
    clockGradCheck.checked = bg.gradient;
    gradAngleInput.value   = bg.angle;
    gradAngleVal.textContent = bg.angle;
    gradAngleRow.style.display = bg.gradient ? '' : 'none';
  }

  function onClockBgChange() {
    clockBg = {
      hue:      parseInt(clockHueInput.value),
      sat:      parseInt(clockSatInput.value),
      lit:      parseInt(clockLitInput.value),
      gradient: clockGradCheck.checked,
      angle:    parseInt(gradAngleInput.value)
    };
    clockHueVal.textContent    = clockBg.hue;
    clockSatVal.textContent    = clockBg.sat + '%';
    clockLitVal.textContent    = clockBg.lit + '%';
    gradAngleVal.textContent   = clockBg.angle;
    gradAngleRow.style.display = clockBg.gradient ? '' : 'none';
    store.set('clockBg', clockBg);
    applyClockBg(clockBg);
  }

  [clockHueInput, clockSatInput, clockLitInput, gradAngleInput].forEach(el => {
    el.addEventListener('input', onClockBgChange);
  });
  clockGradCheck.addEventListener('change', onClockBgChange);

  clockBgReset.addEventListener('click', () => {
    clockBg = { hue: 0, sat: 50, lit: 25, gradient: false, angle: 135 };
    store.set('clockBg', clockBg);
    syncClockBgControls(clockBg);
    applyClockBg(clockBg);
  });

  // ── Clock rendering ────────────────────────────────────────
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function tickClock() {
    const now = new Date();
    let h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();

    if (!clock24h) {
      h = h % 12 || 12;
    }

    clockTimeEl.textContent = clockSeconds
      ? `${pad(h)}:${pad(m)}:${pad(s)}`
      : `${pad(h)}:${pad(m)}`;

    clockDateEl.textContent  =
      `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }

  tickClock();
  setInterval(tickClock, 1000);

  // ── Restore persisted state on load ───────────────────────
  showView(currentView);

  if (imageUrl)  applyImage(imageUrl);
  applyImgFit(imgFit);
  if (slidesUrl) applySlides(slidesUrl);

  if (clockStyle === 'minimal') {
    document.body.classList.add('minimal');
    clockStyleSel.value = 'minimal';
  }

  clock24hCheck.checked = clock24h;
  clockSecondsCheck.checked = clockSeconds;

  applyClockBg(clockBg);
  syncClockBgControls(clockBg);

})();
