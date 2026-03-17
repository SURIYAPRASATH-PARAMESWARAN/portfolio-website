/* =========================
   PAGE TRANSITIONS
========================= */

// Fade in page CONTENT on load — navbar stays visible always
window.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add("page-ready");
    });
  });
});

// Fade out CONTENT only on internal navigation
document.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href) return;

  const isExternal = href.startsWith("http");
  const isAnchor   = href.startsWith("#");
  const isMail     = href.startsWith("mailto:") || href.startsWith("tel:");
  const isFile     = href.endsWith(".pdf") || link.hasAttribute("download");

  if (isExternal || isAnchor || isMail || isFile) return;

  e.preventDefault();
  document.body.classList.remove("page-ready");
  document.body.classList.add("page-leave");

  // Wait exactly as long as the leave transition (0.2s)
  setTimeout(() => {
    window.location.href = href;
  }, 200);
});

/* =========================
   SCROLL REVEAL
========================= */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("in-view", entry.isIntersecting);
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

/* =========================
   CARD SPOTLIGHT
========================= */

document.querySelectorAll(".card-spotlight").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
  });
});

/* =========================
   PROJECT FILTER PILLS
========================= */

(() => {
  const pills = document.querySelectorAll(".project-pills .pill");
  const cards = document.querySelectorAll(".projects-grid .project-card");
  if (!pills.length || !cards.length) return;

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      const filter = pill.dataset.filter || "all";

      cards.forEach((card) => {
        const tags = (card.dataset.tags || "").split(" ");
        card.style.display =
          filter === "all" || tags.includes(filter) ? "" : "none";
      });
    });
  });
})();

/* =========================
   TYPING EFFECT (INDEX ONLY)
========================= */

(() => {
  const el = document.getElementById("typing-text");
  if (!el) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    el.textContent = "MSc in Data Science and Analytics — University of Leeds, UK";
    return;
  }

  const text = "MSc in Data Science and Analytics — University of Leeds, UK";
  const TYPE = 32, DEL = 18, HOLD_FULL = 1100, HOLD_EMPTY = 500;

  let i = 0, deleting = false;

  function tick() {
    if (!deleting) {
      i++;
      el.textContent = text.slice(0, i);
      if (i === text.length) {
        deleting = true;
        return setTimeout(tick, HOLD_FULL);
      }
      setTimeout(tick, TYPE);
    } else {
      i--;
      el.textContent = text.slice(0, i);
      if (i === 0) {
        deleting = false;
        return setTimeout(tick, HOLD_EMPTY);
      }
      setTimeout(tick, DEL);
    }
  }

  tick();
})();

/* =========================
   NETWORK CANVAS (ALL PAGES)
   FIXED: mouse offset, stable sizing, no dpr mismatch
========================= */

(() => {
  const canvas = document.getElementById("net");
  if (!canvas) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  const particles = [];

  // FIX: store raw CSS-space mouse coords (clientX/Y are already CSS px)
  const mouse = { x: -9999, y: -9999, active: false };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;

    // Physical pixel size of the canvas buffer
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    // CSS display size always matches viewport — no offset possible
    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";

    // Scale context so every draw call uses CSS pixels (no manual dpr multiply needed)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    particles.length = 0;
    const count = Math.max(35, Math.min(120, Math.round((w * h) / 15000)));
    for (let i = 0; i < count; i++) {
      particles.push({
        x:  Math.random() * w,
        y:  Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  Math.random() * 1.4 + 0.6
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // ---- move + bounce particles ----
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = "rgba(77,183,255,.85)";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- particle–particle lines ----
    const maxDist = 120;
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.35;
          ctx.strokeStyle = `rgba(77,183,255,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // ---- mouse–particle lines (FIX: use raw clientX/Y space, same as CSS px) ----
    if (mouse.active) {
      ctx.lineWidth = 1.6;
      const mouseDist = 150;
      for (const p of particles) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouseDist) {
          const alpha = (1 - dist / mouseDist) * 0.85;
          ctx.strokeStyle = `rgba(77,183,255,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);  // direct CSS-px coords — no offset
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  // FIX: use clientX/Y directly — these are already CSS-pixel space
  // (matching the ctx transform which is also in CSS-pixel space)
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener("mouseleave", () => {
    mouse.active = false;
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    // Debounce resize to avoid thrashing
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      build();
    }, 100);
  });

  resize();
  build();
  draw();
})();

/* =========================
   NAV TOGGLE (mobile)
========================= */
const toggle = document.querySelector(".nav-toggle");
const links  = document.querySelector(".nav-links");

if (toggle && links) {
  toggle.onclick = () => {
    links.classList.toggle("open");
  };
}

/* =========================
   RESUME MODAL
========================= */
(() => {
  const openBtn = document.getElementById("open-resume");
  const modal   = document.getElementById("resume-modal");
  if (!openBtn || !modal) return;

  const closeSelectors   = modal.querySelectorAll("[data-close='true']");
  const focusableSelector = "a, button, input, textarea, select, [tabindex]:not([tabindex='-1'])";

  let lastFocus = null;

  function openModal(e) {
    e.preventDefault();
    lastFocus = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const focusable = modal.querySelectorAll(focusableSelector);
    if (focusable.length) focusable[0].focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }

  openBtn.addEventListener("click", openModal);

  closeSelectors.forEach(el => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeModal();
  });
})();