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

// Cursor glow
const glow = document.getElementById('glow');
document.addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

// Theme toggle
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  themeBtn.textContent = document.body.classList.contains('light') ? '\u2600\uFE0F' : '\uD83C\uDF19';
});

// Smooth scroll nav
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

// Easter eggs
const eggResponses = {};
async function probeEgg(card, url) {
  const term = document.getElementById('eterm');
  const name = card.querySelector('.cn').textContent;
  const lines = [
    `<span class="tp">sputnik@space:~$ </span><span class="to">curl -s ${url}</span>`,
  ];
  try {
    const r = await fetch(url);
    const d = await r.json();
    lines.push(`<span class="ts">${JSON.stringify(d, null, 2)}</span>`);
  } catch (e) {
    lines.push(`<span class="th">Connection refused. The void protects its secrets.</span>`);
  }
  lines.push(`<span class="tp">sputnik@space:~$ </span><span class="tc"></span>`);
  // Remove old cursor
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

// File browser
function refreshFiles() { /* TODO: GET /api/files */ }
function toggleSort() { /* TODO: sort logic */ }

// Upload modal
function openUpload() { document.getElementById('uploadModal').classList.add('act'); }
function closeUpload() { document.getElementById('uploadModal').classList.remove('act'); document.getElementById('fileName').textContent = ''; }
function fileSelected(input) {
  if (input.files.length) document.getElementById('fileName').textContent = input.files[0].name;
}
async function doUpload() {
  const input = document.getElementById('fileInput');
  if (!input.files.length) return;
  const form = new FormData();
  form.append('file', input.files[0]);
  try {
    const r = await fetch('/api/files/upload', { method: 'POST', body: form });
    if (r.ok) { closeUpload(); refreshFiles(); }
  } catch (e) { alert('Upload failed'); }
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
