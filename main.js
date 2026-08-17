// Starfield
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');
let stars = [];
const N = 200;

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener('resize', resize); resize();

function mkStars() {
  stars = [];
  for (let i = 0; i < N; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.02,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15
    });
  }
}
mkStars();

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    s.x += s.vx; s.y += s.vy; s.a += s.da;
    if (s.a <= 0.1 || s.a >= 1) s.da *= -1;
    if (s.x < 0) s.x = canvas.width; if (s.x > canvas.width) s.x = 0;
    if (s.y < 0) s.y = canvas.height; if (s.y > canvas.height) s.y = 0;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.a})`;
    ctx.fill();
  }
  requestAnimationFrame(draw);
}
draw();

// Shooting stars
function spawnStar() {
  const el = document.createElement('div');
  el.className = 'shoot';
  el.style.left = Math.random() * 80 + 10 + '%';
  el.style.top = Math.random() * 40 + '%';
  el.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}
setInterval(spawnStar, 4000 + Math.random() * 6000);

// Thocky click — Web Audio API mechanical keyboard sound
let _actx = null;
function thock() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  const now = _actx.currentTime;
  // Low thump
  const osc = _actx.createOscillator();
  const g1 = _actx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
  g1.gain.setValueAtTime(0.18, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  osc.connect(g1).connect(_actx.destination);
  osc.start(now); osc.stop(now + 0.05);
  // Click snap
  const buf = _actx.createBuffer(1, 200, _actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < 200; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / 200, 12);
  const noise = _actx.createBufferSource();
  const g2 = _actx.createGain();
  const filt = _actx.createBiquadFilter();
  noise.buffer = buf;
  filt.type = 'bandpass'; filt.frequency.value = 3000; filt.Q.value = 1.5;
  g2.gain.setValueAtTime(0.12, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  noise.connect(filt).connect(g2).connect(_actx.destination);
  noise.start(now); noise.stop(now + 0.04);
}

// CLI Console
(function() {
  const cli = document.getElementById('cli');
  const out = document.getElementById('cliOut');
  const inp = document.getElementById('cliIn');
  if (!cli || !inp) return;
  const hist = [];
  let hIdx = -1;
  let loggedIn = false;
  let loginState = null;

  const CMDS = {
    HELP: () => {
      const cmds = [
        'Available commands:',
        '  <span class="clih">EGG</span>      — Easter Egg Laboratory',
        '  <span class="clih">WHOIS</span>   — Contact / identity',
        '  <span class="clih">STATUS</span>  — System status',
        '  <span class="clih">USERS</span>   — List known users',
        '  <span class="clih">LOGIN</span>   — Authenticate (LOGIN &lt;user&gt;)',
        '  <span class="clih">CLEAR</span>   — Clear terminal',
      ];
      if (loggedIn) {
        cmds.push('', '  <span class="clis">— SYSADMIN CLEARANCE GRANTED —</span>',
        '  <span class="clih">SITES</span>   — Site inventory',
        '  <span class="clih">INFO</span>    — System intel');
      }
      return cmds;
    },
    USERS: () => [
      'Known users:',
      '  1. <span class="clih">Shaker</span>',
      '  2. <span class="clih">SYSADMIN</span>',
      '', '  Type <span class="clih">LOGIN &lt;user&gt;</span> to authenticate.',
    ],
    LOGIN: (user) => {
      if (loggedIn) return ['Already authenticated as <span class="clis">SYSADMIN</span>.'];
      const target = (user || '').toUpperCase();
      if (!target) return ['Usage: <span class="clih">LOGIN &lt;username&gt;</span>'];
      if (target === 'SHAKER') return [
        '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        '▓  ACCESS DENIED                   ▓',
        '▓  nice try ;)                     ▓',
        '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
      ];
      if (target === 'SYSADMIN') {
        loginState = { user: 'SYSADMIN' };
        return ['SYSADMIN login — enter password:'];
      }
      return ['Unknown user: ' + target + '. Type <span class="clih">USERS</span> to list available accounts.'];
    },
    SITES: () => {
      if (!loggedIn) return ['<span class="clie">ACCESS DENIED</span> — insufficient clearance.'];
      return ['Site inventory:', '  1. <span class="clih">DASHBOARD</span>   — dshaker.space', '  2. <span class="clih">EGGS</span>        — easter egg laboratory', '  3. <span class="clih">FILES</span>       — file hosting', '  4. <span class="clih">CONTACT</span>     — identity records', '  5. <span class="clih">RETRO</span>       — <span class="clir">??? classified ???</span>', '  6. <span class="clih">API</span>         — <span class="clir">planned</span>'];
    },
    INFO: () => {
      if (!loggedIn) return ['<span class="clie">ACCESS DENIED</span> — insufficient clearance.'];
      // Note: this terminal is 100% client-side flavor. There is no real
      // backend, no root shell, and no Pi here — it's a fictional demo.
      return ['System intel (themed demo):', '  hostname: dshaker.space', '  platform: Cloudflare Pages (static)', '  runtime: your browser', '  clearance: <span class="clis">guest</span>', '  state: <span class="clis">cosmic and chill</span>'];
    },
    EGG: () => { location.href = 'eggs.html'; return ['Navigating to Egg Laboratory...']; },
    RETRO: () => { location.href = '/retro/boot'; return ['Booting into the Retro Zone...']; },
    WHOIS: () => { location.href = 'contact.html'; return ['Loading identity records...']; },

    STATUS: () => [
      '<span class="clis">● ALL SYSTEMS NOMINAL</span>',
      '  uptime: ∞',
      '  stars: rendering',
      '  vibes: immaculate',
    ],
    CLEAR: () => { out.innerHTML = ''; return []; },

  };

  function appendLine(html) {
    const d = document.createElement('div');
    d.className = 'clil';
    d.innerHTML = html;
    out.appendChild(d);
  }

  function execCmd(raw) {
    const rawCmd = raw.trim();
    if (!rawCmd) return;
    hist.push(rawCmd);
    hIdx = hist.length;
    appendLine('sputnik@space:~$ ' + rawCmd);

    // Password prompt intercept
    if (loginState && loginState.user === 'SYSADMIN') {
      loginState = null;
      // Fictional easter-egg credential for a client-side gag terminal.
      // It is NOT a real secret — never treat client-side auth as security.
      if (rawCmd === 'THEHAT') {
        loggedIn = true;
        appendLine('<span class="clis">\u2713 ACCESS GRANTED</span> — Welcome, SYSADMIN.');
        appendLine('  Type <span class="clih">HELP</span> for new commands.');
      } else {
        appendLine('<span class="clie">\u2717 ACCESS DENIED</span> — incorrect password.');
      }
      out.scrollTop = out.scrollHeight;
      return;
    }

    const parts = rawCmd.toUpperCase().split(/\s+/);
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');
    if (CMDS[cmd]) {
      const res = CMDS[cmd](arg);
      if (res) res.forEach(l => appendLine(l));
    } else {
      appendLine('<span class="clie">command not found: ' + cmd + '</span>  — type <span class="clih">HELP</span>');
    }
    out.scrollTop = out.scrollHeight;
  }

  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { execCmd(inp.value); inp.value = ''; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) { hIdx--; inp.value = hist[hIdx]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (hIdx < hist.length - 1) { hIdx++; inp.value = hist[hIdx]; } else { hIdx = hist.length; inp.value = ''; } }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
  });

  // Thock on each keystroke
  inp.addEventListener('keydown', e => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') thock();
  });

  // Click anywhere in CLI to focus input
  cli.addEventListener('click', () => inp.focus());
  inp.addEventListener('focus', () => cli.classList.add('focus'));
  inp.addEventListener('blur', () => cli.classList.remove('focus'));
})();

// Cursor glow
const glow = document.getElementById('glow');
document.addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

// Theme toggle
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  themeBtn.textContent = document.body.classList.contains('light') ? '\u2600\uFE0F' : '\uD83C\uDF19';
});

// Auto-init feature pages when main.js runs on them
(function() {
  if (document.getElementById('fileList')) refreshFiles();
  if (document.getElementById('dashGrid')) {
    refreshDash();
    setInterval(refreshDash, 30000);
  }
})();

// Smooth scroll (sub-pages with anchor targets)
document.querySelectorAll('a.nb').forEach(b => {
  b.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(b.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Dashboard refresh
async function refreshDash() {
  const btn = document.querySelector('.drf');
  btn.classList.add('spin');
  try {
    const r = await fetch('/api/services/status');
    if (r.ok) {
      const d = await r.json();
      document.getElementById('dSt').innerHTML = '<span class="cst ok"><span class="dot"></span> ' + (d.status || 'Operational') + '</span>';
      document.getElementById('dStSub').textContent = d.message || 'All systems nominal';
      document.getElementById('dUp').textContent = d.uptime || '--';
      document.getElementById('dSrv').textContent = d.hostname || '--';
      document.getElementById('dPy').textContent = d.python || '--';
      document.getElementById('dTime').textContent = new Date().toISOString().slice(11, 19);
    } else {
      document.getElementById('dSt').innerHTML = '<span class="cst warn"><span class="dot"></span> Offline</span>';
      document.getElementById('dStSub').textContent = 'API unreachable';
    }
  } catch (e) {
    document.getElementById('dSt').innerHTML = '<span class="cst warn"><span class="dot"></span> Offline</span>';
    document.getElementById('dStSub').textContent = 'API unreachable';
  }
  setTimeout(() => btn.classList.remove('spin'), 800);
}

// Easter eggs — hardcoded, no backend needed
const _eggs = {
  '/api/egg/egg':   { egg: '🥚', message: 'This is an egg.' },
  '/api/egg/coffee': { coffee: 'void', message: 'No coffee. Only void.' },
  '/api/egg/hack':   () => {
    toggleHack();
    return { status: 'MATRIX RAIN DEPLOYED', message: 'Hack the planet. Click again to dismiss.' };
  },
  '/api/egg/void':   () => {
    const msg = 'HOVER OVER EGG';
    const bin = [...msg].map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    return { void: '◉', binary: bin };
  },
};
const _quotes = [
  "The universe is under no obligation to make sense to you. — Neil deGrasse Tyson",
  "Somewhere, something incredible is waiting to be known. — Carl Sagan",
  "We are all made of star stuff. — Carl Sagan",
  "The cosmos is within us. We are a way for the universe to know itself. — Carl Sagan",
  "Space is big. You just won't believe how vastly, hugely, mind-bogglingly big it is. — Douglas Adams",
  "To confine our attention to terrestrial matters would be to limit the human spirit. — Stephen Hawking",
];

function probeEgg(card, url) {
  const term = document.getElementById('eterm');
  const lines = [
    `<span class="tp">sputnik@space:~$ </span><span class="to">curl -s ${url}</span>`,
  ];
  const handler = _eggs[url];
  if (handler) {
    const d = typeof handler === 'function' ? handler() : handler;
    lines.push(`<span class="ts">${JSON.stringify(d, null, 2)}</span>`);
  } else {
    lines.push(`<span class="th">404 — This egg has not been laid yet.</span>`);
  }
  lines.push(`<span class="tp">sputnik@space:~$ </span><span class="tc"></span>`);
  const old = term.querySelector('.tc');
  if (old) old.parentElement.remove();
  lines.forEach(l => {
    const div = document.createElement('div');
    div.className = 'tl';
    div.innerHTML = l;
    term.appendChild(div);
  });
  term.scrollTop = term.scrollHeight;
  card.classList.add('rev');
}

// Matrix rain — hack mode overlay
(function() {
  const cvs = document.getElementById('matrix');
  if (!cvs) return;
  const mctx = cvs.getContext('2d');
  let cols = [], mraf = null, mActive = false;
  const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@!<>{}[]|/\\=+~^';
  const FONT = 14;

  function mResize() {
    cvs.width = innerWidth; cvs.height = innerHeight;
    cols = Array.from({length: Math.floor(cvs.width / FONT)}, (_, i) => ({
      x: i * FONT, y: Math.random() * cvs.height, speed: 0.4 + Math.random() * 1.2
    }));
  }

  function mDraw() {
    if (!mActive) return;
    mctx.fillStyle = 'rgba(0,0,0,0.06)';
    mctx.fillRect(0, 0, cvs.width, cvs.height);
    mctx.font = FONT + 'px monospace';
    for (const c of cols) {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      mctx.fillStyle = Math.random() > 0.96 ? '#fff' : `hsl(120,100%,${35 + Math.random() * 30}%)`;
      mctx.fillText(ch, c.x, c.y);
      c.y += FONT * c.speed;
      if (c.y > cvs.height && Math.random() > 0.98) {
        c.y = 0;
        c.speed = 0.4 + Math.random() * 1.2;
      }
    }
    mraf = requestAnimationFrame(mDraw);
  }

  window.toggleHack = function() {
    const starCvs = document.getElementById('starfield');
    const nebs = document.querySelectorAll('.neb');
    mActive = !mActive;
    if (mActive) {
      mResize();
      cvs.style.display = 'block';
      starCvs.style.opacity = '0';
      nebs.forEach(n => n.style.opacity = '0');
      mDraw();
      addEventListener('resize', mResize);
    } else {
      cvs.style.display = 'none';
      starCvs.style.opacity = '';
      nebs.forEach(n => n.style.opacity = '');
      cancelAnimationFrame(mraf);
      mctx.clearRect(0, 0, cvs.width, cvs.height);
      removeEventListener('resize', mResize);
    }
  };
})();

// Dial-up upload sequence
const _modemLines = [
  'ATDT dshaker.space',
  'CONNECT 56000',
  '--- Modem handshake ---',
  'V.90 protocol detected',
  'Remote host authenticated',
  '--- Transferring ---',
];
function doDialUpload(file) {
  const m = document.getElementById('uploadModal');
  const ml = m.querySelector('.ml');
  const sz = (file.size / 1024).toFixed(1);
  ml.innerHTML = `
    <h3>📡 Connecting...</h3>
    <div class="diallog" id="dialLog"></div>
    <div class="dprog">
      <div class="dprogbar"><div class="dprogfill" id="dialFill"></div></div>
      <div class="dprogstats"><span id="dialPct">0%</span><span id="dialSpd">0.0 KB/s</span><span id="dialRem">--:--</span></div>
    </div>
    <div class="dfile">📄 ${file.name} <span class="dfsz">${sz} KB</span></div>
    <div class="dma"><button class="mb" onclick="closeUpload()">Cancel</button></div>`;
  m.classList.add('act');
  const log = document.getElementById('dialLog');
  const fill = document.getElementById('dialFill');
  const pct = document.getElementById('dialPct');
  const spd = document.getElementById('dialSpd');
  const rem = document.getElementById('dialRem');
  let li = 0;
  const iv = setInterval(() => {
    if (li < _modemLines.length) {
      log.innerHTML += `<div class="dll">${_modemLines[li++]}</div>`;
      log.scrollTop = log.scrollHeight;
    } else {
      clearInterval(iv);
      let p = 0;
      const pi = setInterval(() => {
        p += Math.random() * 18 + 5;
        if (p > 100) p = 100;
        fill.style.width = p + '%';
        pct.textContent = Math.round(p) + '%';
        spd.textContent = (Math.random() * 12 + 3).toFixed(1) + ' KB/s';
        const sec = Math.max(0, Math.ceil((100 - p) / 12));
        rem.textContent = '0:' + String(sec).padStart(2, '0');
        if (p >= 100) {
          clearInterval(pi);
          log.innerHTML += '<div class="dll dlok">✓ Transfer complete — 200 OK</div>';
          log.scrollTop = log.scrollHeight;
          setTimeout(() => { closeUpload(); }, 1200);
        }
      }, 300);
    }
  }, 600);
}

// File browser — backed by Cloudflare Pages Function /api/files
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function refreshFiles() {
  const list = document.getElementById('fileList');
  if (!list) return;
  list.innerHTML = '<div class="femp"><span class="ei">⏳</span>Loading…</div>';
  try {
    const r = await fetch('/api/files');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const files = d.files || [];
    list.innerHTML = '';
    if (!files.length) {
      const empty = document.createElement('div');
      empty.className = 'femp';
      empty.innerHTML = '<span class="ei">📭</span>No files yet — upload something';
      list.appendChild(empty);
      if (d.note) {
        const note = document.createElement('div');
        note.className = 'fnote';
        note.textContent = d.note;
        list.appendChild(note);
      }
    } else {
      files.forEach(f => {
        const row = document.createElement('div');
        row.className = 'fr';
        const icon = document.createElement('span');
        icon.className = 'fi'; icon.textContent = '📄';
        const nm = document.createElement('span');
        nm.className = 'fn'; nm.textContent = f.name || '';
        const sz = document.createElement('span');
        sz.className = 'fsz'; sz.textContent = f.size || '';
        const act = document.createElement('span');
        act.className = 'fa';
        const dl = document.createElement('a');
        dl.className = 'fab'; dl.textContent = '⬇'; dl.href = f.url || '#'; dl.download = true;
        act.appendChild(dl);
        [icon, nm, sz, act].forEach(x => row.appendChild(x));
        list.appendChild(row);
      });
    }
  } catch (e) {
    list.innerHTML = '';
    const err = document.createElement('div');
    err.className = 'femp';
    err.innerHTML = '<span class="ei">⚠️</span>Cannot reach file API (not deployed)';
    list.appendChild(err);
  }
}

let filesSortAsc = true;
function toggleSort() {
  const list = document.getElementById('fileList');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.frow'));
  if (!rows.length) return;
  filesSortAsc = !filesSortAsc;
  rows.sort((a, b) => {
    const x = a.querySelector('.fn').textContent;
    const y = b.querySelector('.fn').textContent;
    return filesSortAsc ? x.localeCompare(y) : y.localeCompare(x);
  });
  rows.forEach(r => list.appendChild(r));
}

// Upload modal
function openUpload() { document.getElementById('uploadModal').classList.add('act'); }
function closeUpload() { document.getElementById('uploadModal').classList.remove('act'); document.getElementById('fileName').textContent = ''; }
function fileSelected(input) {
  if (input.files.length) document.getElementById('fileName').textContent = input.files[0].name;
}
function doUpload() {
  const input = document.getElementById('fileInput');
  if (!input.files.length) return;
  doDialUpload(input.files[0]);
}

// Drag and drop
const dropZone = document.getElementById('dropZone');
function handleDragOver(e) { e.preventDefault(); dropZone.classList.add('drag'); }
function handleDragLeave(e) { dropZone.classList.remove('drag'); }
function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('drag');
  if (e.dataTransfer.files.length) {
    document.getElementById('fileInput').files = e.dataTransfer.files;
    document.getElementById('fileName').textContent = e.dataTransfer.files[0].name;
    openUpload();
  }
}
dropZone.addEventListener('click', () => document.getElementById('fileInput').click());

// Hidden emoji easter eggs
(function() {
  const EMOJIS = [
    { emoji: '🛸', x: 12, y: 25 },
    { emoji: '🪐', x: 78, y: 15 },
    { emoji: '👾', x: 55, y: 72 },
    { emoji: '🌈', x: 8, y: 65 },
    { emoji: '💎', x: 88, y: 48 },
    { emoji: '🎭', x: 35, y: 88 },
    { emoji: '⭐', x: 65, y: 8 },
  ];
  const REVEAL_R = 120;
  const found = new Set(JSON.parse(localStorage.getItem('shaker_eggs') || '[]'));

  // Place emoji spots
  const spots = EMOJIS.map((e, i) => {
    const el = document.createElement('div');
    el.className = 'emoji-spot';
    el.textContent = e.emoji;
    el.style.left = e.x + '%';
    el.style.top = e.y + '%';
    el.dataset.idx = i;
    if (found.has(i)) el.classList.add('revealed');
    document.body.appendChild(el);
    return el;
  });

  // Toast
  const toast = document.createElement('div');
  toast.className = 'found-toast';
  document.body.appendChild(toast);
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }
  showToast(found.size + ' / ' + EMOJIS.length + ' found');

  // Click to spotlight
  document.addEventListener('click', e => {
    // Don't interfere with interactive elements
    if (e.target.closest('a, button, input, .cli, .appcard, .nb, .ec, .theme, .fd, .fab, .hackBtn, .mo')) return;

    // Spawn spotlight
    const sp = document.createElement('div');
    sp.className = 'spotlight';
    sp.style.left = e.clientX + 'px';
    sp.style.top = e.clientY + 'px';
    document.body.appendChild(sp);
    setTimeout(() => sp.remove(), 600);

    // Check for nearby emojis
    EMOJIS.forEach((em, i) => {
      if (found.has(i)) return;
      const emX = em.x / 100 * innerWidth;
      const emY = em.y / 100 * innerHeight;
      const dist = Math.hypot(e.clientX - emX, e.clientY - emY);
      if (dist < REVEAL_R) {
        found.add(i);
        localStorage.setItem('shaker_eggs', JSON.stringify([...found]));
        spots[i].classList.add('revealed');
        setTimeout(() => showToast('✨ Found ' + em.emoji + '! (' + found.size + '/' + EMOJIS.length + ')'), 300);
        if (found.size === EMOJIS.length) {
          setTimeout(() => showToast('🏆 All emojis found!'), 1000);
        }
      }
    });
  });
})();
