/* ════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════ */
const LOCK_MS       = 10 * 60 * 1000;  // 10 minutes
const SS_DURATION   = 60;              // seconds
const SPIN_DURATION = 3800;            // ms

// Segments: label, color pair, weight (sum = 100)
const SEGS = [
  { label:'5%',  color:['#e94560','#ff6b85'], weight:30 },
  { label:'10%', color:['#f87c1f','#ffaa55'], weight:25 },
  { label:'15%', color:['#f9c846','#ffe07a'], weight:20 },
  { label:'20%', color:['#21c95e','#5aeaa0'], weight:15 },
  { label:'25%', color:['#4fadff','#80cfff'], weight:7  },
  { label:'30%', color:['#a855f7','#d08dff'], weight:3  },
];
const N   = SEGS.length;
const ARC = (Math.PI * 2) / N;

/* ════════════════════════════════════════════════════════
   BACKGROUND PARTICLES
════════════════════════════════════════════════════════ */
(function () {
  const cv = document.getElementById('bg');
  const cx = cv.getContext('2d');
  let pts = [];
  function resize() { cv.width = innerWidth; cv.height = innerHeight; }
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 70; i++) pts.push({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.8 + .4,
    dx: (Math.random() - .5) * .28,
    dy: (Math.random() - .5) * .28,
    a: Math.random() * .45 + .08
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

/* ════════════════════════════════════════════════════════
   WHEEL DRAWING
════════════════════════════════════════════════════════ */
const wCV  = document.getElementById('wheel');
const wCX  = wCV.getContext('2d');
const W    = wCV.width;
const CX   = W / 2, CY = W / 2, R = CX - 6;
let rotation = 0;

function drawWheel(rot) {
  wCX.clearRect(0, 0, W, W);

  SEGS.forEach((seg, i) => {
    const s = rot + i * ARC, e = s + ARC;

    // gradient fill
    const grd = wCX.createRadialGradient(CX, CY, 0, CX, CY, R);
    grd.addColorStop(0.4, seg.color[0]);
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

    // text
    wCX.save();
    wCX.translate(CX, CY);
    wCX.rotate(s + ARC / 2);
    wCX.textAlign = 'right';
    wCX.font = `700 ${W * .074}px Hind Siliguri, sans-serif`;
    wCX.fillStyle = '#fff';
    wCX.shadowColor = 'rgba(0,0,0,.7)';
    wCX.shadowBlur = 7;
    wCX.fillText(seg.label, R - 12, 6);
    wCX.restore();
  });

  // shine sweep (subtle rotating highlight)
  const shine = wCX.createConicalGradient
    ? null
    : wCX.createRadialGradient(CX - R * .2, CY - R * .2, 0, CX, CY, R);
  if (shine) {
    shine.addColorStop(0, 'rgba(255,255,255,.12)');
    shine.addColorStop(.5,'rgba(255,255,255,0)');
    wCX.beginPath();
    wCX.arc(CX, CY, R, 0, Math.PI * 2);
    wCX.fillStyle = shine;
    wCX.fill();
  }

  // center hub
  const hub = wCX.createRadialGradient(CX - 6, CY - 6, 2, CX, CY, 20);
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

/* ════════════════════════════════════════════════════════
   AUDIO (Web Audio API – synthetic)
════════════════════════════════════════════════════════ */
let audioCtx = null;
let soundOn  = true;
let tickIv   = null;

document.getElementById('soundToggle').addEventListener('click', function() {
  soundOn = !soundOn;
  this.textContent = soundOn ? '🔊 সাউন্ড' : '🔇 সাউন্ড';
});

function AC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function tick() {
  if (!soundOn) return;
  try {
    const a = AC();
    const o = a.createOscillator();
    const g = a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type = 'square';
    o.frequency.setValueAtTime(1100, a.currentTime);
    g.gain.setValueAtTime(.05, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .04);
    o.start(); o.stop(a.currentTime + .04);
  } catch(e){}
}
function playWin() {
  if (!soundOn) return;
  try {
    const a = AC();
    [[523,.0],[659,.1],[784,.2],[1047,.34],[1319,.5]].forEach(([f,t]) => {
      const o = a.createOscillator();
      const g = a.createGain();
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

/* ════════════════════════════════════════════════════════
   CONFETTI
════════════════════════════════════════════════════════ */
const cfCV = document.getElementById('confetti');
const cfCX = cfCV.getContext('2d');
let cfPts  = [];

function launchConfetti() {
  cfCV.width = innerWidth; cfCV.height = innerHeight;
  cfPts = [];
  const colors = ['#4fadff','#ffc940','#a855f7','#21c95e','#e94560','#00d4ff','#f87c1f'];
  for (let i = 0; i < 180; i++) {
    cfPts.push({
      x:  Math.random() * innerWidth,
      y: -20 - Math.random() * 100,
      w:  Math.random() * 9 + 5,
      h:  Math.random() * 4 + 2,
      c:  colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vx: (Math.random() - .5) * 5,
      vy: Math.random() * 5 + 2.5,
      vr: (Math.random() - .5) * 9,
      a:  1
    });
  }
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
  else cfCX.clearRect(0,0,cfCV.width,cfCV.height);
}

/* ════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════ */
function genId() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:8}, () => c[Math.floor(Math.random()*c.length)]).join('');
}
function fmtDate(d) {
  return d.toLocaleDateString('bn-BD', {year:'numeric',month:'long',day:'numeric'});
}
function fmtTime(d) {
  return d.toLocaleTimeString('bn-BD');
}

// Weighted random: returns index
function weightedRandom() {
  const total = SEGS.reduce((s, sg) => s + sg.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGS.length; i++) {
    r -= SEGS[i].weight;
    if (r <= 0) return i;
  }
  return SEGS.length - 1;
}

/* ════════════════════════════════════════════════════════
   INTERVALS
════════════════════════════════════════════════════════ */
let lockIv   = null;
let ssIv     = null;
let clockIv  = null;

/* ════════════════════════════════════════════════════════
   ELEMENTS
════════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════════
   LIVE CLOCK
════════════════════════════════════════════════════════ */
function startClock() {
  clearInterval(clockIv);
  clockIv = setInterval(() => { mTime.textContent = fmtTime(new Date()); }, 1000);
  mTime.textContent = fmtTime(new Date());
}

/* ════════════════════════════════════════════════════════
   LOCK COUNTDOWN
════════════════════════════════════════════════════════ */
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
    const m = String(Math.floor(rem/60000)).padStart(2,'0');
    const s = String(Math.floor((rem%60000)/1000)).padStart(2,'0');
    lockTimer.textContent = `🔒 আনলক হবে: ${m}:${s}`;
  }
  upd(); lockIv = setInterval(upd, 1000);
}

/* ════════════════════════════════════════════════════════
   RESET
════════════════════════════════════════════════════════ */
function resetAll() {
  ['spin_used','spin_time','discount_value','session_id','ss_start'].forEach(k => localStorage.removeItem(k));
  spinBtn.disabled = false;
  statusMsg.textContent = 'চাকা ঘুরান এবং আপনার ডিসকাউন্ট জিতুন!';
  resultPanel.style.display = 'none';
  lockTimer.style.display = 'none';
  clearInterval(lockIv); clearInterval(ssIv); clearInterval(clockIv);
}

/* ════════════════════════════════════════════════════════
   SHOW RESULT
════════════════════════════════════════════════════════ */
function showResult(discount, sessionId, spinTime, ssStart, skipSuspense) {
  resultPanel.style.display = 'block';

  if (!skipSuspense) {
    // suspense animation
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
  winText.textContent = `🎉 অভিনন্দন! আপনি জিতেছেন ${discount} ডিসকাউন্ট!`;
  winText.style.display  = 'block';
  metaGrid.style.display = 'grid';
  mSession.textContent   = sessionId;
  mDate.textContent      = fmtDate(new Date(spinTime));
  startClock();

  // Screenshot timer
  clearInterval(ssIv);
  expiredMsg.style.display = 'none';

  let rem = SS_DURATION - Math.floor((Date.now() - ssStart) / 1000);
  if (rem <= 0) {
    ssWrap.style.display    = 'none';
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
      ssWrap.style.display    = 'none';
      expiredMsg.style.display = 'block';
    }
  }, 1000);
}

/* ════════════════════════════════════════════════════════
   SPIN ANIMATION
════════════════════════════════════════════════════════ */
function doSpin(segIdx) {
  spinBtn.disabled = true;
  statusMsg.textContent = 'স্পিন হচ্ছে...';

  const extraRounds = (5 + Math.floor(Math.random() * 3)) * Math.PI * 2;
  // pointer at top = -PI/2; want center of segIdx at top
  const targetAngle = -Math.PI / 2 - (segIdx * ARC + ARC / 2);
  const norm  = ((targetAngle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
  const finalR = norm + extraRounds;

  const startR = rotation;
  const t0     = performance.now();
  let lastTick = 0;

  // tick scheduling
  clearInterval(tickIv);
  tickIv = setInterval(() => {
    const elapsed = performance.now() - t0;
    const prog    = Math.min(elapsed / SPIN_DURATION, 1);
    const eased   = 1 - Math.pow(1 - prog, 3);
    const cur     = startR + (finalR - startR) * eased;
    const seg     = cur % ARC;
    if (seg < lastTick) tick();
    lastTick = seg;
  }, 28);

  function frame(now) {
    const elapsed = now - t0;
    const prog    = Math.min(elapsed / SPIN_DURATION, 1);
    const eased   = 1 - Math.pow(1 - prog, 3);
    rotation      = startR + (finalR - startR) * eased;
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

  localStorage.setItem('spin_used',       'true');
  localStorage.setItem('spin_time',       now);
  localStorage.setItem('discount_value',  seg.label);
  localStorage.setItem('session_id',      sessionId);
  localStorage.setItem('ss_start',        now);

  playWin();
  launchConfetti();

  statusMsg.textContent = 'স্পিন লক হয়েছে ১০ মিনিটের জন্য।';
  spinBtn.disabled = true;
  startLockCountdown(now + LOCK_MS);
  showResult(seg.label, sessionId, now, now, false);
}

/* ════════════════════════════════════════════════════════
   SPIN BUTTON
════════════════════════════════════════════════════════ */
spinBtn.addEventListener('click', () => {
  const idx = weightedRandom();
  doSpin(idx);
});

/* ════════════════════════════════════════════════════════
   INIT – restore localStorage
════════════════════════════════════════════════════════ */
(function init() {
  const used     = localStorage.getItem('spin_used');
  const spinTime = parseInt(localStorage.getItem('spin_time') || '0');
  const discount = localStorage.getItem('discount_value');
  const session  = localStorage.getItem('session_id');
  const ssStart  = parseInt(localStorage.getItem('ss_start') || spinTime);
  const elapsed  = Date.now() - spinTime;

  if (used === 'true' && elapsed < LOCK_MS) {
    spinBtn.disabled = true;
    statusMsg.textContent = 'স্পিন লক হয়েছে ১০ মিনিটের জন্য।';
    showResult(discount, session, spinTime, ssStart, true);
    startLockCountdown(spinTime + LOCK_MS);
  } else if (used === 'true') {
    resetAll(); // lock expired
  }
})();

/* ════════════════════════════════════════════════════════
   BASIC PROTECTION
════════════════════════════════════════════════════════ */
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());

let devDetected = false;
setInterval(() => {
  const open = window.outerWidth - window.innerWidth > 150
            || window.outerHeight - window.innerHeight > 150;
  if (open && !devDetected) {
    devDetected = true;
    alert('⚠️ Developer Tools সনাক্ত হয়েছে। এই পেজটি সুরক্ষিত।');
  }
  if (!open) devDetected = false;
}, 1200);