/* ============================================================
   SURIYA P — script.js
   Features:
   • GSAP curtain wipe page transitions
   • Dark / Light theme toggle (persisted in localStorage)
   • Data Visualization canvas background
   • Typing effect
   • Scroll reveal
   • Card spotlight
   • Project filter pills
   • Nav toggle (mobile)
   • Resume modal
============================================================ */

/* ── Load GSAP from CDN ─────────────────────────────────── */
(function loadGSAP(cb) {
  if (window.gsap) return cb();
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
  s.onload = cb;
  document.head.appendChild(s);
})(initAll);

function initAll() {

/* ============================================================
   THEME TOGGLE
   Adds data-theme="dark"|"light" on <html>
   Button injected into navbar
============================================================ */
const THEME_KEY = "sp-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
  btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
}

function injectThemeBtn() {
  const nav = document.querySelector(".nav-links");
  if (!nav || document.getElementById("theme-toggle")) return;
  const li = document.createElement("li");
  li.innerHTML = `<button id="theme-toggle" class="theme-btn" aria-label="Toggle theme"></button>`;
  nav.appendChild(li);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

/* Dark is always default — only use saved pref if user explicitly set it */
const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { injectThemeBtn(); applyTheme(savedTheme); });
} else {
  injectThemeBtn();
  applyTheme(savedTheme);
}

/* ============================================================
   GSAP CURTAIN WIPE PAGE TRANSITIONS
   A gold panel sweeps in from the left covering the screen,
   then the new page loads and the curtain pulls back out right.
============================================================ */
let curtain = null;

function createCurtain() {
  if (curtain) return curtain;
  curtain = document.createElement("div");
  curtain.id = "page-curtain";
  curtain.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: #0a0d18;
    transform: translateX(-100%);
    pointer-events: none;
  `;
  document.body.appendChild(curtain);
  return curtain;
}

function curtainEnter(cb) {
  const c = createCurtain();
  c.style.pointerEvents = "all";
  gsap.fromTo(c,
    { x: "-100%" },
    { x: "0%", duration: 0.55, ease: "power3.inOut", onComplete: cb }
  );
}

function curtainExit() {
  const c = createCurtain();
  gsap.fromTo(c,
    { x: "0%" },
    { x: "100%", duration: 0.55, ease: "power3.inOut", onComplete: () => {
      c.style.pointerEvents = "none";
      gsap.set(c, { x: "-100%" });
    }}
  );
}

/* Intercept all internal nav clicks */
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href) return;
  if (href.startsWith("http") || href.startsWith("#") ||
      href.startsWith("mailto:") || href.startsWith("tel:") ||
      href.endsWith(".pdf") || link.hasAttribute("download")) return;

  e.preventDefault();
  const dest = href;
  curtainEnter(() => { window.location.href = dest; });
});

/* On page load: curtain is already gone (new page), just reveal content */
window.addEventListener("DOMContentLoaded", () => {
  /* Animate page content in after curtain exits */
  const main = document.querySelector("main, .hero, .organizations, .volunteering, .certifications");
  if (main) {
    gsap.fromTo(main,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", delay: 0.1 }
    );
  }
  curtainExit();
});

/* ============================================================
   SCROLL REVEAL
============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach(e => e.target.classList.toggle("in-view", e.isIntersecting)),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

/* ============================================================
   CARD SPOTLIGHT
============================================================ */
document.querySelectorAll(".card-spotlight").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  });
});

/* ============================================================
   PROJECT FILTER PILLS
============================================================ */
(() => {
  const pills = document.querySelectorAll(".project-pills .pill");
  const cards = document.querySelectorAll(".projects-grid .project-card");
  if (!pills.length || !cards.length) return;
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const filter = pill.dataset.filter || "all";
      cards.forEach(card => {
        const tags = (card.dataset.tags || "").split(" ");
        card.style.display = filter === "all" || tags.includes(filter) ? "" : "none";
      });
    });
  });
})();

/* ============================================================
   TYPING EFFECT
============================================================ */
(() => {
  const el = document.getElementById("typing-text");
  if (!el) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = "MSc in Data Science and Analytics";
    return;
  }
  const text = "MSc in Data Science and Analytics";
  const TYPE = 38, DEL = 20, HOLD_FULL = 1400, HOLD_EMPTY = 600;
  let i = 0, deleting = false;
  function tick() {
    if (!deleting) {
      el.textContent = text.slice(0, ++i);
      if (i === text.length) { deleting = true; return setTimeout(tick, HOLD_FULL); }
      setTimeout(tick, TYPE);
    } else {
      el.textContent = text.slice(0, --i);
      if (i === 0) { deleting = false; return setTimeout(tick, HOLD_EMPTY); }
      setTimeout(tick, DEL);
    }
  }
  tick();
})();

/* ============================================================
   DATA VISUALIZATION CANVAS BACKGROUND
   Layers: ghost bar chart + scatter plot + line/area chart + axes
   Gold-tinted, adapts to theme
============================================================ */
(() => {
  const canvas = document.getElementById("net");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  let W, H, dpr;

  function getGold(a) {
    const theme = document.documentElement.getAttribute("data-theme");
    return theme === "light"
      ? `rgba(154,114,48,${a})`
      : `rgba(201,168,76,${a})`;
  }
  const SLATE = (a) => `rgba(136,146,164,${a})`;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildBars(); buildScatter(); buildLine(); buildAxes();
  }

  /* ── Bar chart ── */
  const bars = [];
  function buildBars() {
    bars.length = 0;
    const bw = Math.min(W * 0.42, 420);
    const bx0 = W - bw - W * 0.06;
    const by0 = H * 0.64;
    const gap = bw / 22;
    for (let i = 0; i < 22; i++) {
      const bh = 24 + Math.random() * H * 0.26;
      bars.push({ x: bx0 + i * gap + gap * 0.15, w: gap * 0.52, baseH: bh,
        phase: Math.random() * Math.PI * 2, speed: 0.004 + Math.random() * 0.007,
        alpha: 0.12 + Math.random() * 0.14, floorY: by0 });
    }
  }
  function drawBars(t) {
    for (const b of bars) {
      const h = b.baseH + Math.sin(b.phase + t * b.speed * 60) * b.baseH * 0.16;
      const y = b.floorY - h;
      const gr = ctx.createLinearGradient(b.x, y, b.x, b.floorY);
      gr.addColorStop(0, getGold(b.alpha + 0.12));
      gr.addColorStop(1, getGold(0.01));
      ctx.fillStyle = gr;
      ctx.fillRect(b.x, y, b.w, h);
      ctx.strokeStyle = getGold(b.alpha + 0.18);
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke();
    }
  }

  /* ── Scatter plot ── */
  const scatter = [];
  const GC = [a => getGold(a), a => `rgba(154,194,220,${a})`, a => `rgba(180,154,220,${a})`];
  function buildScatter() {
    scatter.length = 0;
    for (let i = 0; i < 50; i++) {
      const g = Math.floor(Math.random() * 3);
      const cx = W * (0.06 + (g * 0.32 + 0.08) * 0.42);
      const cy = H * (0.1  + (g * 0.25 + 0.12) * 0.5);
      scatter.push({ x: cx + (Math.random()-0.5)*W*0.12, y: cy + (Math.random()-0.5)*H*0.14,
        r: 1.2 + Math.random()*2, vx: (Math.random()-0.5)*0.16, vy: (Math.random()-0.5)*0.12,
        alpha: 0.3 + Math.random()*0.4, group: g });
    }
  }
  function drawScatter() {
    for (let g = 0; g < 3; g++) {
      const pts = scatter.filter(p => p.group === g);
      if (pts.length < 2) continue;
      let sX=0,sY=0,sXY=0,sX2=0;
      pts.forEach(p => { sX+=p.x; sY+=p.y; sXY+=p.x*p.y; sX2+=p.x*p.x; });
      const n=pts.length, sl=(n*sXY-sX*sY)/(n*sX2-sX*sX)||0, ic=(sY-sl*sX)/n;
      const xs=pts.map(p=>p.x), x0=Math.min(...xs), x1=Math.max(...xs);
      ctx.strokeStyle=GC[g](0.07); ctx.lineWidth=0.7;
      ctx.setLineDash([3,7]);
      ctx.beginPath(); ctx.moveTo(x0,sl*x0+ic); ctx.lineTo(x1,sl*x1+ic); ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const p of scatter) {
      p.x+=p.vx; p.y+=p.vy;
      if (p.x<W*0.01||p.x>W*0.52) p.vx*=-1;
      if (p.y<H*0.04||p.y>H*0.62) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=GC[p.group](p.alpha); ctx.fill();
    }
  }

  /* ── Line/area chart ── */
  const lp = [];
  function buildLine() {
    lp.length = 0;
    for (let i=0;i<38;i++) lp.push({ phase:Math.random()*Math.PI*2, speed:0.003+Math.random()*0.005, base:0.28+Math.random()*0.38, amp:0.04+Math.random()*0.1 });
  }
  function drawLine(t) {
    const ox=W*0.12, ow=W*0.76, oy=H*0.83, oh=H*0.13;
    const pts=lp.map((p,i)=>({ x:ox+(i/(lp.length-1))*ow, y:oy-(p.base+Math.sin(p.phase+t*p.speed*60)*p.amp)*oh }));
    const ag=ctx.createLinearGradient(0,oy-oh,0,oy);
    ag.addColorStop(0,getGold(0.14)); ag.addColorStop(1,getGold(0));
    ctx.fillStyle=ag;
    ctx.beginPath(); ctx.moveTo(pts[0].x,oy);
    pts.forEach(pt=>ctx.lineTo(pt.x,pt.y));
    ctx.lineTo(pts[pts.length-1].x,oy); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=getGold(0.4); ctx.lineWidth=1.5; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    for (let i=1;i<pts.length;i++) {
      const cpx=(pts[i-1].x+pts[i].x)/2;
      ctx.bezierCurveTo(cpx,pts[i-1].y,cpx,pts[i].y,pts[i].x,pts[i].y);
    }
    ctx.stroke();
  }

  /* ── Axis grid ── */
  const axes = [];
  function buildAxes() {
    axes.length=0;
    for (let i=0;i<5;i++) axes.push({type:"h",y:H*(0.15+i*0.16),alpha:0.055+i*0.01});
    for (let j=0;j<6;j++) axes.push({type:"v",x:W*(0.1+j*0.14),alpha:0.04});
  }
  function drawAxes() {
    ctx.setLineDash([2,10]);
    for (const a of axes) {
      ctx.strokeStyle=SLATE(a.alpha); ctx.lineWidth=0.5;
      ctx.beginPath();
      if (a.type==="h"){ctx.moveTo(0,a.y);ctx.lineTo(W,a.y);}
      else {ctx.moveTo(a.x,0);ctx.lineTo(a.x,H);}
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  /* ── Mouse ── */
  const mouse = {x:-9999,y:-9999};
  window.addEventListener("mousemove",e=>{mouse.x=e.clientX;mouse.y=e.clientY;});

  function drawMouse() {
    let best=null,bestD=80;
    for (const p of scatter) { const d=Math.hypot(p.x-mouse.x,p.y-mouse.y); if(d<bestD){bestD=d;best=p;} }
    if (!best) return;
    ctx.beginPath(); ctx.arc(best.x,best.y,best.r+4,0,Math.PI*2);
    ctx.strokeStyle=getGold(0.4); ctx.lineWidth=1; ctx.stroke();
    for (const p of scatter) {
      const d=Math.hypot(p.x-mouse.x,p.y-mouse.y);
      if (d<120) {
        ctx.strokeStyle=GC[p.group]((1-d/120)*0.15);
        ctx.lineWidth=0.5;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke();
      }
    }
  }

  /* ── Loop ── */
  let last=0, lineT=0;
  function draw(ts) {
    lineT += (ts-last)/1000; last=ts;
    ctx.clearRect(0,0,W,H);
    drawAxes(); drawBars(lineT); drawScatter(); drawLine(lineT); drawMouse();
    requestAnimationFrame(draw);
  }

  let rTimer;
  window.addEventListener("resize",()=>{ clearTimeout(rTimer); rTimer=setTimeout(resize,100); });
  resize(); requestAnimationFrame(draw);
})();

/* ============================================================
   PROFILE CANVAS EFFECT
   Default: radar sweep + dotted ring + pulse rings
   On hover: data scatter dots drift outward
============================================================ */
(() => {
  const canvas = document.getElementById('profileFx');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrap = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  let W, H, cx, cy, baseR;
  let hovered = false;
  let hoverProgress = 0;

  function resize() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2;
    baseR = Math.min(W, H) * 0.37;
    buildScatter();
  }

  function gold(a) {
    const theme = document.documentElement.getAttribute('data-theme');
    return theme === 'light'
      ? `rgba(154,114,48,${a})`
      : `rgba(201,168,76,${a})`;
  }

  /* ── Scatter dots ── */
  const scatterDots = [];
  function buildScatter() {
    scatterDots.length = 0;
    for (let i = 0; i < 22; i++) {
      const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.3;
      const dist  = baseR + 18 + Math.random() * 38;
      scatterDots.push({
        angle, dist,
        ox: 0, oy: 0,
        phase:  Math.random() * Math.PI * 2,
        speed:  0.006 + Math.random() * 0.01,
        r:      1.4 + Math.random() * 2,
        alpha:  0.25 + Math.random() * 0.45,
        targetDist: dist + 20 + Math.random() * 30
      });
    }
  }

  /* ── Dotted orbit ring ── */
  let dotAngle = 0;
  function drawDottedRing(r, numDots, size, baseAlpha) {
    for (let i = 0; i < numDots; i++) {
      const a = dotAngle + (i / numDots) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      const pulse = 0.5 + 0.5 * Math.sin(dotAngle * 3 + i * 0.8);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = gold(baseAlpha * pulse);
      ctx.fill();
    }
  }

  /* ── Radar sweep ── */
  let radarAngle = 0;
  function drawRadar(alpha) {
    if (alpha <= 0) return;
    const sweepLen = Math.PI * 0.85;
    for (let i = 0; i < 60; i++) {
      const a = radarAngle - (i / 60) * sweepLen;
      const fade = (1 - i / 60) * alpha;
      ctx.strokeStyle = gold(fade * 0.55);
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * baseR, cy + Math.sin(a) * baseR);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx + Math.cos(radarAngle) * baseR, cy + Math.sin(radarAngle) * baseR, 3, 0, Math.PI * 2);
    ctx.fillStyle = gold(alpha * 0.9);
    ctx.fill();
  }

  /* ── Pulse rings ── */
  let pulseT = 0;
  function drawPulseRings(alpha) {
    if (alpha <= 0) return;
    for (let p = 0; p < 2; p++) {
      const offset = p * Math.PI;
      const pulse = 0.5 + 0.5 * Math.sin(pulseT * 1.8 + offset);
      ctx.beginPath();
      ctx.arc(cx, cy, baseR + 18 + p * 14, 0, Math.PI * 2);
      ctx.strokeStyle = gold((0.08 + pulse * 0.1) * alpha);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ── Scatter effect ── */
  function drawScatter(progress) {
    if (progress <= 0) return;
    for (const d of scatterDots) {
      d.ox = Math.cos(d.phase + pulseT * d.speed * 8) * 3;
      d.oy = Math.sin(d.phase + pulseT * d.speed * 8) * 3;

      const currentDist = d.dist + (d.targetDist - d.dist) * progress;
      const x = cx + Math.cos(d.angle) * currentDist + d.ox;
      const y = cy + Math.sin(d.angle) * currentDist + d.oy;

      /* faint line back to center */
      ctx.strokeStyle = gold(0.06 * progress);
      ctx.lineWidth   = 0.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();

      ctx.beginPath(); ctx.arc(x, y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = gold(d.alpha * progress);
      ctx.fill();
    }

    /* connect nearby dots */
    for (let i = 0; i < scatterDots.length; i++) {
      for (let j = i + 1; j < scatterDots.length; j++) {
        const a = scatterDots[i], b = scatterDots[j];
        const ax = cx + Math.cos(a.angle) * (a.dist + (a.targetDist - a.dist) * progress);
        const ay = cy + Math.sin(a.angle) * (a.dist + (a.targetDist - a.dist) * progress);
        const bx = cx + Math.cos(b.angle) * (b.dist + (b.targetDist - b.dist) * progress);
        const by = cy + Math.sin(b.angle) * (b.dist + (b.targetDist - b.dist) * progress);
        const dist = Math.hypot(ax - bx, ay - by);
        if (dist < 55) {
          ctx.strokeStyle = gold((1 - dist / 55) * 0.12 * progress);
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        }
      }
    }
  }

  /* ── Main loop ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    radarAngle += 0.012;
    dotAngle   -= 0.006;
    pulseT     += 0.016;

    /* smooth hover transition */
    const target = hovered ? 1 : 0;
    hoverProgress += (target - hoverProgress) * 0.06;

    const radarAlpha  = 1 - hoverProgress;
    const pulseAlpha  = 1 - hoverProgress * 0.7;

    /* base circle */
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.strokeStyle = gold(0.22);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawRadar(radarAlpha);
    drawPulseRings(pulseAlpha);
    drawDottedRing(baseR + 10, 24, 1.5, 0.3 * (1 - hoverProgress * 0.5));
    drawScatter(hoverProgress);

    requestAnimationFrame(draw);
  }

  wrap.addEventListener('mouseenter', () => { hovered = true; });
  wrap.addEventListener('mouseleave', () => { hovered = false; });

  let rTimer;
  window.addEventListener('resize', () => {
    clearTimeout(rTimer);
    rTimer = setTimeout(resize, 100);
  });

  resize();
  draw();
})();


const toggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (toggle && navLinks) {
  toggle.onclick = () => navLinks.classList.toggle("open");
}

/* ============================================================
   RESUME MODAL
============================================================ */
(() => {
  const openBtn = document.getElementById("open-resume");
  const modal   = document.getElementById("resume-modal");
  if (!openBtn || !modal) return;
  const closeEls = modal.querySelectorAll("[data-close='true']");
  let lastFocus = null;

  function openModal(e) {
    e.preventDefault();
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
    const f = modal.querySelectorAll("a,button,input,[tabindex]:not([tabindex='-1'])");
    if (f.length) f[0].focus();
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden","true");
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener("click", openModal);
  closeEls.forEach(el => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", e => { if (modal.classList.contains("is-open") && e.key==="Escape") closeModal(); });
})();

} // end initAll