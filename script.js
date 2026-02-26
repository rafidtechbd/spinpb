/* ══════════════════════════════════════════════════════════
   ██  CONSTANTS
══════════════════════════════════════════════════════════ */
const LOCK_MS     = 24 * 60 * 60 * 1000; // 24 hours
const SS_DURATION = 60;                   // screenshot timer seconds
const SPIN_MS     = 2600;                 // spin animation duration ms

/* ══════════════════════════════════════════════════════════
   ██  WHEEL SEGMENTS — all 6 visible on the board
       BUT the spin secretly always targets index 0 (5%) or 1 (10%)
       The visual positions of 5% and 10% on wheel are index 0 and 1.
       Remaining segments (15%,20%,25%,30%) are purely decorative.
══════════════════════════════════════════════════════════ */
const SEGS =[
  { label:'5%',  color:['#e94560','#ff6b85'] }, // idx 0 ← actual target
  { label:'10%', color:['#4fadff','#80cfff'] }, // idx 1 ← actual target
  { label:'15%', color:['#f87c1f','#ffaa55'] }, // decorative
  { label:'20%', color:['#21c95e','#5aeaa0'] }, // decorative
  { label:'25%', color:['#f9c846','#ffe07a'] }, // decorative
  { label:'30%', color:['#a855f7','#d08dff'] }, // decorative
];
const N   = SEGS.length;
const ARC = (Math.PI * 2) / N;

/* Secret pick: always returns index 0 or 1 (5% or 10%) */
function secretPick() {
  // 50/50 split between 5% and 10%
  return Math.random() < 0.5 ? 0 : 1;
}

/* ══════════════════════════════════════════════════════════
   ██  MOBILE DETECTION — reduce effects on low-end devices
══════════════════════════════════════════════════════════ */
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
              || window.innerWidth < 600;

/* ══════════════════════════════════════════════════════════
   ██  BACKGROUND PARTICLES — fewer on mobile
══════════════════════════════════════════════════════════ */
(function() {
  const cv = document.getElementById('bg');
  const cx = cv.getContext('2d');
  const COUNT = isMobile ? 22 : 55; // ← key mobile perf fix
  let pts =[], raf = null, visible = true;

  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) pts.push({
    x:  Math.random() * innerWidth,
    y:  Math.random() * innerHeight,
    r:  Math.random() * 1.6 + .4,
    dx: (Math.random() - .5) * (isMobile ? .2 : .28),
    dy: (Math.random() - .5) * (isMobile ? .2 : .28),
    a:  Math.random() * .4 + .08
  });

  // Pause animation when tab is hidden — saves battery & CPU
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !raf) draw();
  });

  function draw() {
    if (!visible) { raf = null; return; }
    cx.clearRect(0, 0, cv.width, cv.height);
    pts.forEach(p => {
      cx.beginPath();
      cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      cx.fillStyle = `rgba(79,173,255,${p.a})`;
      cx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = cv.width;
      if (p.x > cv.width) p.x = 0;
      if (p.y < 0) p.y = cv.height;
      if (p.y > cv.height) p.y = 0;
    });
    raf = requestAnimationFrame(draw);
  }
  draw();
})();

/* ══════════════════════════════════════════════════════════
   ██  WHEEL DRAWING — optimised canvas rendering
══════════════════════════════════════════════════════════ */
const wCV = document.getElementById('wheel');
const wCX = wCV.getContext('2d');
const W   = wCV.width;
const CX  = W / 2, CY = W / 2, R = CX - 5;
let rotation = 0;

// Pre-build gradient cache to avoid recreating on every frame
let grdCache = null;
function getGrd(i) {
  // gradients depend on segment color only, not rotation — safe to cache
  if (!grdCache) grdCache = [];
  if (!grdCache[i]) {
    const g = wCX.createRadialGradient(CX, CY, 0, CX, CY, R);
    g.addColorStop(0.3, SEGS[i].color[0]);
    g.addColorStop(1,   SEGS[i].color[1]);
    grdCache[i] = g;
  }
  return grdCache[i];
}

function drawWheel(rot) {
  wCX.clearRect(0, 0, W, W);

  for (let i = 0; i < N; i++) {
    const s = rot + i * ARC, e = s + ARC;

    wCX.beginPath();
    wCX.moveTo(CX, CY);
    wCX.arc(CX, CY, R, s, e);
    wCX.closePath();
    wCX.fillStyle = getGrd(i);
    wCX.fill();
    wCX.strokeStyle = 'rgba(0,0,0,.2)';
    wCX.lineWidth = 2;
    wCX.stroke();

    // segment label
    wCX.save();
    wCX.translate(CX, CY);
    wCX.rotate(s + ARC / 2);
    wCX.textAlign = 'right';
    wCX.font = `700 ${W * .08}px Hind Siliguri,sans-serif`;
    wCX.fillStyle = '#fff';
    wCX.shadowColor = 'rgba(0,0,0,.7)';
    wCX.shadowBlur = 6;
    wCX.fillText(SEGS[i].label, R - 11, 7);
    wCX.restore();
  }

  // subtle radial shine (skip on mobile for perf)
  if (!isMobile) {
    const shine = wCX.createRadialGradient(CX - R*.2, CY - R*.2, 0, CX, CY, R);
    shine.addColorStop(0, 'rgba(255,255,255,.11)');
    shine.addColorStop(.5,'rgba(255,255,255,0)');
    wCX.beginPath();
    wCX.arc(CX, CY, R, 0, Math.PI * 2);
    wCX.fillStyle = shine;
    wCX.fill();
  }

  // center hub
  const hub = wCX.createRadialGradient(CX - 5, CY - 5, 1, CX, CY, 18);
  hub.addColorStop(0, '#ffffff');
  hub.addColorStop(1, '#4fadff');
  wCX.beginPath();
  wCX.arc(CX, CY, 18, 0, Math.PI * 2);
  wCX.fillStyle = hub;
  wCX.fill();
  wCX.strokeStyle = '#071430';
  wCX.lineWidth = 3;
  wCX.stroke();
}
drawWheel(rotation);

/* ══════════════════════════════════════════════════════════
   ██  AUDIO — Web Audio API, lightweight synthetic sounds
══════════════════════════════════════════════════════════ */
let audioCtx = null;
let soundOn  = true;
let tickIv   = null;

document.getElementById('soundBtn').addEventListener('click', function() {
  soundOn = !soundOn;
  this.textContent = soundOn ? '🔊' : '🔇';
});

function AC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTick() {
  if (!soundOn) return;
  try {
    const a = AC();
    const o = a.createOscillator(), g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(1100, a.currentTime);
    g.gain.setValueAtTime(.055, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .036);
    o.start(); o.stop(a.currentTime + .038);
  } catch(e){}
}
function playWin() {
  if (!soundOn) return;
  try {
    const a = AC();
    [[523,0],[659,.1],[784,.2],[1047,.32],[1319,.46]].forEach(([f,t]) => {
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(f, a.currentTime + t);
      g.gain.setValueAtTime(.18, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t + .38);
      o.start(a.currentTime + t);
      o.stop(a.currentTime + t + .42);
    });
  } catch(e){}
}

/* ══════════════════════════════════════════════════════════
   ██  CONFETTI — lightweight, fewer particles on mobile
══════════════════════════════════════════════════════════ */
const cfCV = document.getElementById('confetti');
const cfCX = cfCV.getContext('2d');
let cfPts =[];

function launchConfetti() {
  cfCV.width = innerWidth; cfCV.height = innerHeight;
  cfPts =[];
  const CCOUNT = isMobile ? 80 : 160; // ← mobile perf fix
  const clr =['#4fadff','#ffc940','#a855f7','#21c95e','#e94560','#00d4ff','#f87c1f'];
  for (let i = 0; i < CCOUNT; i++) cfPts.push({
    x:  Math.random() * innerWidth,
    y: -15 - Math.random() * 80,
    w:  Math.random() * 8 + 4,
    h:  Math.random() * 4 + 2,
    c:  clr[i % clr.length],
    rot: Math.random() * 360,
    vx: (Math.random() - .5) * 4.5,
    vy: Math.random() * 4.5 + 2,
    vr: (Math.random() - .5) * 8,
    a:  1
  });
  animateConf();
}

function animateConf() {
  cfCX.clearRect(0, 0, cfCV.width, cfCV.height);
  cfPts = cfPts.filter(p => p.a > .04);
  for (const p of cfPts) {
    cfCX.save();
    cfCX.globalAlpha = p.a;
    cfCX.translate(p.x, p.y);
    cfCX.rotate(p.rot * Math.PI / 180);
    cfCX.fillStyle = p.c;
    cfCX.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    cfCX.restore();
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    if (p.y > cfCV.height * .7) p.a -= .018;
  }
  if (cfPts.length) requestAnimationFrame(animateConf);
  else cfCX.clearRect(0, 0, cfCV.width, cfCV.height);
}

/* ══════════════════════════════════════════════════════════
   ██  HELPERS
══════════════════════════════════════════════════════════ */
function genId() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:8}, () => c[Math.floor(Math.random()*c.length)]).join('');
}
function fmtDate(d) {
  return d.toLocaleDateString('bn-BD',{year:'numeric',month:'long',day:'numeric'});
}
function fmtTime(d) {
  return d.toLocaleTimeString('bn-BD');
}

/* ══════════════════════════════════════════════════════════
   ██  INTERVALS
══════════════════════════════════════════════════════════ */
let lockIv  = null;
let ssIv    = null;
let clockIv = null;

/* ══════════════════════════════════════════════════════════
   ██  DOM REFS
══════════════════════════════════════════════════════════ */
const spinBtn     = document.getElementById('spinBtn');
const statusMsg   = document.getElementById('statusMsg');
const lockTimer   = document.getElementById('lockTimer');
const resultPanel = document.getElementById('resultPanel');
const suspenseMsg = document.getElementById('suspenseMsg');
const winText     = document.getElementById('winText');
const metaGrid    = document.getElementById('metaGrid');
const mSession    = document.getElementById('mSession');
const mDate       = document.getElementById('mDate');
const mTime       = document.getElementById('mTime');
const ssWrap      = document.getElementById('ssWrap');
const ssCount     = document.getElementById('ssCount');
const expiredMsg  = document.getElementById('expiredMsg');

/* ══════════════════════════════════════════════════════════
   ██  LIVE CLOCK
══════════════════════════════════════════════════════════ */
function startClock() {
  clearInterval(clockIv);
  clockIv = setInterval(() => { mTime.textContent = fmtTime(new Date()); }, 1000);
  mTime.textContent = fmtTime(new Date());
}

/* ══════════════════════════════════════════════════════════
   ██  LOCK COUNTDOWN — HH:MM:SS
══════════════════════════════════════════════════════════ */
function startLockCountdown(unlockAt) {
  clearInterval(lockIv);
  lockTimer.style.display = 'block';
  function upd() {
    const rem = unlockAt - Date.now();
    if (rem <= 0) { clearInterval(lockIv); lockTimer.style.display = 'none'; resetAll(); return; }
    const h = String(Math.floor(rem / 3600000)).padStart(2,'0');
    const m = String(Math.floor((rem % 3600000) / 60000)).padStart(2,'0');
    const s = String(Math.floor((rem % 60000) / 1000)).padStart(2,'0');
    lockTimer.textContent = `🔒 আনলক হবে: ${h}:${m}:${s}`;
  }
  upd(); lockIv = setInterval(upd, 1000);
}

/* ══════════════════════════════════════════════════════════
   ██  RESET
══════════════════════════════════════════════════════════ */
function resetAll() {
  ['spin_used','spin_time','discount_value','session_id','ss_start']
    .forEach(k => localStorage.removeItem(k));
  spinBtn.disabled = false;
  statusMsg.textContent = 'চাকা ঘুরান এবং আপনার ডিসকাউন্ট জিতুন!';
  resultPanel.style.display = 'none';
  lockTimer.style.display = 'none';
  clearInterval(lockIv); clearInterval(ssIv); clearInterval(clockIv);
}

/* ══════════════════════════════════════════════════════════
   ██  SHOW RESULT
══════════════════════════════════════════════════════════ */
function showResult(discount, sessionId, spinTime, ssStart, skipSuspense) {
  resultPanel.style.display = 'block';
  if (!skipSuspense) {
    suspenseMsg.style.display = 'block';
    winText.style.display     = 'none';
    metaGrid.style.display    = 'none';
    ssWrap.style.display      = 'none';
    expiredMsg.style.display  = 'none';
    setTimeout(() => {
      suspenseMsg.style.display = 'none';
      revealWin(discount, sessionId, spinTime, ssStart);
    }, 1500);
  } else {
    suspenseMsg.style.display = 'none';
    revealWin(discount, sessionId, spinTime, ssStart);
  }
}

function revealWin(discount, sessionId, spinTime, ssStart) {
  winText.textContent    = `🎉 অভিনন্দন! আপনি জিতেছেন ${discount} ডিসকাউন্ট!`;
  winText.style.display  = 'block';
  metaGrid.style.display = 'grid';
  mSession.textContent   = sessionId;
  mDate.textContent      = fmtDate(new Date(spinTime));
  startClock();

  clearInterval(ssIv);
  expiredMsg.style.display = 'none';

  let rem = SS_DURATION - Math.floor((Date.now() - ssStart) / 1000);
  if (rem <= 0) {
    ssWrap.style.display     = 'none';
    expiredMsg.style.display = 'block';
    return;
  }
  ssWrap.style.display = 'block';
  ssCount.textContent  = rem;
  ssCount.classList.remove('danger');

  ssIv = setInterval(() => {
    rem--;
    ssCount.textContent = Math.max(0, rem);
    if (rem <= 10) ssCount.classList.add('danger');
    if (rem <= 0) {
      clearInterval(ssIv);
      ssWrap.style.display     = 'none';
      expiredMsg.style.display = 'block';
    }
  }, 1000);
}

/* ══════════════════════════════════════════════════════════
   ██  SPIN ANIMATION
   Key trick: segIdx is ALWAYS 0 or 1 (5% or 10%).
   The wheel shows all 6 segments visually, but the pointer
   will always stop at slot 0 (5%) or slot 1 (10%).
   User sees the wheel pass through 15%,20%,25%,30% during
   the spin — looks completely random and fair.
══════════════════════════════════════════════════════════ */
function doSpin(segIdx) {
  spinBtn.disabled = true;
  statusMsg.textContent = 'স্পিন হচ্ছে...';

  // 8–11 full rounds → fast feel, lands precisely on target
  const extraRounds = (8 + Math.floor(Math.random() * 4)) * Math.PI * 2;

  // Pointer sits at top = -PI/2
  // We want the center of segIdx to be at the top
  const targetAngle = -Math.PI / 2 - (segIdx * ARC + ARC / 2);
  const norm  = ((targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const finalR = norm + extraRounds;

  const startR = rotation;
  const t0     = performance.now();
  let lastSeg  = 0;

  // tick sound — throttled on mobile
  const TICK_INTERVAL = isMobile ? 30 : 22;
  clearInterval(tickIv);
  tickIv = setInterval(() => {
    const el   = performance.now() - t0;
    const prog = Math.min(el / SPIN_MS, 1);
    const eas  = 1 - Math.pow(1 - prog, 3);
    const cur  = startR + (finalR - startR) * eas;
    const seg  = cur % ARC;
    if (seg < lastSeg) playTick();
    lastSeg = seg;
  }, TICK_INTERVAL);

  function frame(now) {
    const el   = now - t0;
    const prog = Math.min(el / SPIN_MS, 1);
    // ease-out cubic — starts fast, slows down naturally
    const eas  = 1 - Math.pow(1 - prog, 3);
    rotation   = startR + (finalR - startR) * eas;
    drawWheel(rotation);
    if (prog < 1) { requestAnimationFrame(frame); return; }
    // spin complete
    clearInterval(tickIv);
    rotation = finalR;
    drawWheel(rotation);
    afterSpin(segIdx);
  }
  requestAnimationFrame(frame);
}

function afterSpin(segIdx) {
  const seg       = SEGS[segIdx]; // always 5% or 10%
  const sessionId = genId();
  const now       = Date.now();

  localStorage.setItem('spin_used',      'true');
  localStorage.setItem('spin_time',      now);
  localStorage.setItem('discount_value', seg.label);
  localStorage.setItem('session_id',     sessionId);
  localStorage.setItem('ss_start',       now);

  playWin();
  launchConfetti();

  statusMsg.textContent = 'স্পিন লক হয়েছে ২৪ ঘণ্টার জন্য।';
  spinBtn.disabled = true;
  startLockCountdown(now + LOCK_MS);
  showResult(seg.label, sessionId, now, now, false);
}

/* ══════════════════════════════════════════════════════════
   ██  SPIN BUTTON
══════════════════════════════════════════════════════════ */
spinBtn.addEventListener('click', () => doSpin(secretPick()));

/* ══════════════════════════════════════════════════════════
   ██  INIT — restore localStorage state on reload
══════════════════════════════════════════════════════════ */
(function init() {
  const used     = localStorage.getItem('spin_used');
  const spinTime = parseInt(localStorage.getItem('spin_time') || '0');
  const discount = localStorage.getItem('discount_value');
  const session  = localStorage.getItem('session_id');
  const ssStart  = parseInt(localStorage.getItem('ss_start') || spinTime);
  const elapsed  = Date.now() - spinTime;

  if (used === 'true' && elapsed < LOCK_MS) {
    spinBtn.disabled = true;
    statusMsg.textContent = 'স্পিন লক হয়েছে ২৪ ঘণ্টার জন্য।';
    showResult(discount, session, spinTime, ssStart, true);
    startLockCountdown(spinTime + LOCK_MS);
  } else if (used === 'true') {
    resetAll();
  }
})();

/* ══════════════════════════════════════════════════════════
   ██  BASIC PROTECTION
══════════════════════════════════════════════════════════ */
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

// Pause card border animation when page hidden (battery save)
document.addEventListener('visibilitychange', () => {
  const card = document.querySelector('.card');
  if (card) card.style.animationPlayState = document.hidden ? 'paused' : 'running';
});

let devDetected = false;
setInterval(() => {
  const open = (window.outerWidth - window.innerWidth > 150)
            || (window.outerHeight - window.innerHeight > 150);
  if (open && !devDetected) {
    devDetected = true;
    alert('⚠️ Developer Tools সনাক্ত হয়েছে। এই পেজটি সুরক্ষিত।');
  }
  if (!open) devDetected = false;
}, 1200);