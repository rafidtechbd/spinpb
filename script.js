/* ════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════ */
// 24-hour lock
const LOCK_MS     = 24 * 60 * 60 * 1000;
const SS_DURATION = 60;   // screenshot countdown seconds
const SPIN_MS     = 2600; // faster spin (was 3800)

// Only 5% and 10% — repeated to fill 6 equal segments
// Each appears 3 times, alternating for visual variety
const SEGS = [
  { label:'5%',  color:['#e94560','#ff6b85'] },
  { label:'10%', color:['#4fadff','#80cfff'] },
  { label:'5%',  color:['#f87c1f','#ffaa55'] },
  { label:'10%', color:['#a855f7','#d08dff'] },
  { label:'5%',  color:['#e94560','#ff8fa0'] },
  { label:'10%', color:['#21c95e','#5aeaa0'] },
];
const N   = SEGS.length;
const ARC = (Math.PI * 2) / N;

/* ════════════════════════════════════════════════════
   BACKGROUND PARTICLES
════════════════════════════════════════════════════ */
(function () {
  const cv = document.getElementById('bg');
  const cx = cv.getContext('2d');
  let pts =[];
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 65; i++) pts.push({
    x:  Math.random() * innerWidth,
    y:  Math.random() * innerHeight,
    r:  Math.random() * 1.7 + .4,
    dx: (Math.random() - .5) * .27,
    dy: (Math.random() - .5) * .27,
    a:  Math.random() * .45 + .08
  });
  function draw() {
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
    requestAnimationFrame(draw);
  }
  draw();
})();

/* ════════════════════════════════════════════════════
   WHEEL DRAWING
════════════════════════════════════════════════════ */
const wCV = document.getElementById('wheel');
const wCX = wCV.getContext('2d');
const W   = wCV.width;
const CX  = W / 2, CY = W / 2, R = CX - 6;
let rotation = 0;

function drawWheel(rot) {
  wCX.clearRect(0, 0, W, W);

  SEGS.forEach((seg, i) => {
    const s = rot + i * ARC, e = s + ARC;

    // radial gradient fill
    const grd = wCX.createRadialGradient(CX, CY, 0, CX, CY, R);
    grd.addColorStop(0.3, seg.color[0]);
    grd.addColorStop(1,   seg.color[1]);

    wCX.beginPath();
    wCX.moveTo(CX, CY);
    wCX.arc(CX, CY, R, s, e);
    wCX.closePath();
    wCX.fillStyle = grd;
    wCX.fill();
    wCX.strokeStyle = 'rgba(0,0,0,.22)';
    wCX.lineWidth = 2;
    wCX.stroke();

    // label
    wCX.save();
    wCX.translate(CX, CY);
    wCX.rotate(s + ARC / 2);
    wCX.textAlign = 'right';
    wCX.font = `700 ${W * .082}px Hind Siliguri, sans-serif`;
    wCX.fillStyle = '#fff';
    wCX.shadowColor = 'rgba(0,0,0,.75)';
    wCX.shadowBlur = 8;
    wCX.fillText(seg.label, R - 12, 7);
    wCX.restore();
  });

  // shine overlay
  const shine = wCX.createRadialGradient(CX - R*.22, CY - R*.22, 0, CX, CY, R);
  shine.addColorStop(0, 'rgba(255,255,255,.13)');
  shine.addColorStop(.5,'rgba(255,255,255,0)');
  wCX.beginPath();
  wCX.arc(CX, CY, R, 0, Math.PI * 2);
  wCX.fillStyle = shine;
  wCX.fill();

  // center hub
  const hub = wCX.createRadialGradient(CX - 6, CY - 6, 1, CX, CY, 20);
  hub.addColorStop(0, '#ffffff');
  hub.addColorStop(1, '#4fadff');
  wCX.beginPath();
  wCX.arc(CX, CY, 20, 0, Math.PI * 2);
  wCX.fillStyle = hub;
  wCX.fill();
  wCX.strokeStyle = '#071430';
  wCX.lineWidth = 3;
  wCX.stroke();
}
drawWheel(rotation);

/* ════════════════════════════════════════════════════
   AUDIO — Web Audio API synthetic sounds
════════════════════════════════════════════════════ */
let audioCtx = null;
let soundOn  = true;
let tickIv   = null;

document.getElementById('soundBtn').addEventListener('click', function () {
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
    o.frequency.setValueAtTime(1200, a.currentTime);
    g.gain.setValueAtTime(.06, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .035);
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
      g.gain.setValueAtTime(.2, a.currentTime + t);
      g.gain.exponentialRampToValueAtTime(.001, a.currentTime + t + .4);
      o.start(a.currentTime + t);
      o.stop(a.currentTime + t + .45);
    });
  } catch(e){}
}

/* ════════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════════ */
const cfCV = document.getElementById('confetti');
const cfCX = cfCV.getContext('2d');
let cfPts  =[];

function launchConfetti() {
  cfCV.width = innerWidth; cfCV.height = innerHeight;
  cfPts = [];
  const clr =['#4fadff','#ffc940','#a855f7','#21c95e','#e94560','#00d4ff','#f87c1f'];
  for (let i = 0; i < 180; i++) cfPts.push({
    x:  Math.random() * innerWidth,
    y: -20 - Math.random() * 100,
    w:  Math.random() * 9 + 4,
    h:  Math.random() * 4 + 2,
    c:  clr[Math.floor(Math.random() * clr.length)],
    rot: Math.random() * 360,
    vx: (Math.random() - .5) * 5,
    vy: Math.random() * 5 + 2.5,
    vr: (Math.random() - .5) * 9,
    a:  1
  });
  animateConf();
}
function animateConf() {
  cfCX.clearRect(0, 0, cfCV.width, cfCV.height);
  cfPts = cfPts.filter(p => p.a > .03);
  cfPts.forEach(p => {
    cfCX.save();
    cfCX.globalAlpha = p.a;
    cfCX.translate(p.x, p.y);
    cfCX.rotate(p.rot * Math.PI / 180);
    cfCX.fillStyle = p.c;
    cfCX.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    cfCX.restore();
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    if (p.y > cfCV.height * .72) p.a -= .016;
  });
  if (cfPts.length) requestAnimationFrame(animateConf);
  else cfCX.clearRect(0, 0, cfCV.width, cfCV.height);
}

/* ════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════ */
function genId() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:8}, () => c[Math.floor(Math.random() * c.length)]).join('');
}
function fmtDate(d) {
  return d.toLocaleDateString('bn-BD', {year:'numeric', month:'long', day:'numeric'});
}
function fmtTime(d) {
  return d.toLocaleTimeString('bn-BD');
}

// Weighted random — 50% chance 5%, 50% chance 10%
// (both labels appear equally among 6 segments, pure random pick is fine)
function pickSegment() {
  // truly random among all 6 slots — result is always 5% or 10%
  return Math.floor(Math.random() * N);
}

/* ════════════════════════════════════════════════════
   INTERVALS
════════════════════════════════════════════════════ */
let lockIv  = null;
let ssIv    = null;
let clockIv = null;

/* ════════════════════════════════════════════════════
   DOM REFS
════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════
   LIVE CLOCK
════════════════════════════════════════════════════ */
function startClock() {
  clearInterval(clockIv);
  clockIv = setInterval(() => { mTime.textContent = fmtTime(new Date()); }, 1000);
  mTime.textContent = fmtTime(new Date());
}

/* ════════════════════════════════════════════════════
   LOCK COUNTDOWN — HH:MM:SS for 24hr
════════════════════════════════════════════════════ */
function startLockCountdown(unlockAt) {
  clearInterval(lockIv);
  lockTimer.style.display = 'block';
  function upd() {
    const rem = unlockAt - Date.now();
    if (rem <= 0) {
      clearInterval(lockIv);
      lockTimer.style.display = 'none';
      resetAll();
      return;
    }
    const h = String(Math.floor(rem / 3600000)).padStart(2, '0');
    const m = String(Math.floor((rem % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((rem % 60000) / 1000)).padStart(2, '0');
    lockTimer.textContent = `🔒 আনলক হবে: ${h}:${m}:${s}`;
  }
  upd(); lockIv = setInterval(upd, 1000);
}

/* ════════════════════════════════════════════════════
   RESET ALL
════════════════════════════════════════════════════ */
function resetAll() {['spin_used','spin_time','discount_value','session_id','ss_start']
    .forEach(k => localStorage.removeItem(k));
  spinBtn.disabled = false;
  statusMsg.textContent = 'চাকা ঘুরান এবং আপনার ডিসকাউন্ট জিতুন!';
  resultPanel.style.display = 'none';
  lockTimer.style.display = 'none';
  clearInterval(lockIv); clearInterval(ssIv); clearInterval(clockIv);
}

/* ════════════════════════════════════════════════════
   SHOW RESULT
════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════
   SPIN ANIMATION — faster (SPIN_MS = 2600ms)
════════════════════════════════════════════════════ */
function doSpin(segIdx) {
  spinBtn.disabled = true;
  statusMsg.textContent = 'স্পিন হচ্ছে...';

  // More extra rounds for fast feel, still lands precisely
  const extraRounds = (8 + Math.floor(Math.random() * 4)) * Math.PI * 2;
  const targetAngle = -Math.PI / 2 - (segIdx * ARC + ARC / 2);
  const norm        = ((targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const finalR      = norm + extraRounds;

  const startR = rotation;
  const t0     = performance.now();
  let lastTick = 0;

  clearInterval(tickIv);
  tickIv = setInterval(() => {
    const el   = performance.now() - t0;
    const prog = Math.min(el / SPIN_MS, 1);
    // ease-out cubic
    const eas  = 1 - Math.pow(1 - prog, 3);
    const cur  = startR + (finalR - startR) * eas;
    const seg  = cur % ARC;
    if (seg < lastTick) playTick();
    lastTick = seg;
  }, 22);

  function frame(now) {
    const el   = now - t0;
    const prog = Math.min(el / SPIN_MS, 1);
    const eas  = 1 - Math.pow(1 - prog, 3);
    rotation   = startR + (finalR - startR) * eas;
    drawWheel(rotation);
    if (prog < 1) { requestAnimationFrame(frame); return; }
    clearInterval(tickIv);
    rotation = finalR;
    drawWheel(rotation);
    afterSpin(segIdx);
  }
  requestAnimationFrame(frame);
}

function afterSpin(segIdx) {
  const seg       = SEGS[segIdx];
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

/* ════════════════════════════════════════════════════
   SPIN BUTTON CLICK
════════════════════════════════════════════════════ */
spinBtn.addEventListener('click', () => doSpin(pickSegment()));

/* ════════════════════════════════════════════════════
   INIT — restore from localStorage
════════════════════════════════════════════════════ */
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
    resetAll(); // lock expired
  }
})();

/* ════════════════════════════════════════════════════
   BASIC PROTECTION
════════════════════════════════════════════════════ */
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

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