/* ==========================================================================
   Roamly — page behaviour
   Each behaviour is keyed to a data-attribute and only runs when that
   element exists, so this one file is safe to load on every page.
   ========================================================================== */

/* Per-person trip costs behind the "Lock In This Itinerary" card.
   2 travellers → $1,240 and 5 travellers → $3,100, as in the Figma frames. */
const PER_PERSON = { flights: 300, hotel: 225, transfers: 45, tickets: 50 };

const usd = (n, cents = false) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

/* ---------- Mobile menu ---------- */
function initMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const header = toggle?.closest(".site-header");
  if (!header) return;

  toggle.addEventListener("click", () => {
    const open = header.toggleAttribute("data-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

/* ---------- Dialogs ----------
   [data-dialog-open="id"] opens <dialog id="id">; [data-dialog-close]
   or a click on the dimmed area closes it; #id in the URL opens it on load. */
function initDialogs() {
  document.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-dialog-open]");
    if (opener) {
      event.preventDefault();
      document.getElementById(opener.dataset.dialogOpen)?.showModal();
      return;
    }
    const closer = event.target.closest("[data-dialog-close]");
    if (closer) closer.closest("dialog")?.close();
  });

  for (const dialog of document.querySelectorAll("dialog.modal")) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
  if (target instanceof HTMLDialogElement) target.showModal();
}

/* ---------- AI planner ----------
   First submit reveals the plan (the free generation). Any later submit
   re-prices the plan and shows the paywall. #plan, #checkout or #paywall
   in the URL reveal the plan straight away. */
function renderQuote(travelers) {
  const lines = Object.fromEntries(
    Object.entries(PER_PERSON).map(([key, perPerson]) => [key, perPerson * travelers])
  );
  const perPersonTotal = Object.values(PER_PERSON).reduce((a, b) => a + b, 0);
  const total = perPersonTotal * travelers;
  const values = {
    ...Object.fromEntries(Object.entries(lines).map(([k, v]) => [k, usd(v)])),
    travelers: String(travelers),
    total: usd(total),
    "total-cents": usd(total, true),
    "total-label": `Total (For ${travelers})`,
    "per-person": `${usd(perPersonTotal, true)} per person`,
    party: `${travelers} ${travelers === 1 ? "Adult" : "Adults"}`,
  };

  for (const el of document.querySelectorAll("[data-quote]")) {
    const value = values[el.dataset.quote];
    if (value !== undefined) el.textContent = value;
  }
}

function initPlanner() {
  const form = document.querySelector("[data-planner-form]");
  const plan = document.querySelector("[data-plan]");
  if (!form || !plan) return;

  // Prefill from links such as destinations.html → "Explore Itinerary"
  const params = new URLSearchParams(location.search);
  for (const [name, value] of params) {
    const field = form.elements.namedItem(name);
    if (field && "value" in field) field.value = value;
  }

  const travelers = () => Math.min(Math.max(parseInt(form.elements.travelers.value, 10) || 1, 1), 20);
  const reveal = () => {
    plan.hidden = false;
    renderQuote(travelers());
  };

  if (["#plan", "#checkout", "#paywall"].includes(location.hash)) reveal();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (plan.hidden) {
      reveal();
      plan.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    renderQuote(travelers());
    document.getElementById("paywall")?.showModal();
  });
}

/* ---------- My Trip: Pay in Full vs Split Bill ---------- */
function initTripStatus() {
  const card = document.querySelector("[data-payment]");
  if (!card) return;
  const payment = new URLSearchParams(location.search).get("payment");
  if (payment === "split") card.dataset.payment = "split";
}

/* ---------- Destinations: region chips + search ---------- */
function initDestinationFilter() {
  const root = document.querySelector("[data-filter]");
  if (!root) return;

  const chips = root.querySelectorAll("[data-region-chip]");
  const search = root.querySelector("[data-filter-search]");
  const cards = document.querySelectorAll("[data-region]");
  const empty = document.querySelector("[data-filter-empty]");
  let region = "all";

  const apply = () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const inRegion = region === "all" || card.dataset.region.split(" ").includes(region);
      const matches = card.textContent.toLowerCase().includes(query);
      card.hidden = !(inRegion && matches);
      if (!card.hidden) shown += 1;
    }
    if (empty) empty.hidden = shown > 0;
  };

  for (const chip of chips) {
    chip.addEventListener("click", () => {
      region = chip.dataset.regionChip;
      for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
      apply();
    });
  }
  search.addEventListener("input", apply);
}

/* ---------- Flash-sale countdown ---------- */
function initCountdown() {
  const root = document.querySelector("[data-countdown]");
  if (!root) return;

  let remaining = parseInt(root.dataset.countdown, 10);
  const parts = {
    h: root.querySelector('[data-unit="h"]'),
    m: root.querySelector('[data-unit="m"]'),
    s: root.querySelector('[data-unit="s"]'),
  };
  const pad = (n) => String(n).padStart(2, "0");
  const render = () => {
    parts.h.textContent = pad(Math.floor(remaining / 3600));
    parts.m.textContent = pad(Math.floor((remaining % 3600) / 60));
    parts.s.textContent = pad(remaining % 60);
  };

  render();
  const timer = setInterval(() => {
    remaining = Math.max(remaining - 1, 0);
    render();
    if (remaining === 0) clearInterval(timer);
  }, 1000);
}

/* ---------- Support chat (front-end demo only) ---------- */
function initChat() {
  const form = document.querySelector("[data-chat-form]");
  const log = document.querySelector("[data-chat-log]");
  if (!form || !log) return;

  const add = (text, mine) => {
    const bubble = document.createElement("p");
    bubble.className = mine ? "bubble bubble--me" : "bubble";
    bubble.textContent = text;
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.elements.message;
    const text = input.value.trim();
    if (!text) return;
    add(text, true);
    input.value = "";
    setTimeout(() => add("Thanks! A Roamly concierge is looking into this and will reply here shortly. ✨", false), 700);
  });
}



/* ==========================================================================
   Roamly Flight Engine: Smooth Airplane & Contrail Waypoint Navigation
   ========================================================================== */

function initFlightJourney() {
  const plane = document.getElementById("flightPlane");
  const pathBase = document.getElementById("flightPathBase");
  const pathActive = document.getElementById("flightPathActive");
  const hudTerminal = document.getElementById("hudTerminal");
  const svg = document.getElementById("flightSkySvg");

  if (!plane || !pathBase || !pathActive || !svg) return;

  // تعريف بوابات الطيران (السكاشن الرئيسية ومسمياتها الرادارية)
  const waypointsConfig = [
    { selector: ".hero-video-section", label: "GATE 01: TAKEOFF • CLOUD RUNWAY" },
    { selector: ".search-wrap", label: "GATE 02: RADAR SEARCH ENGINE" },
    { selector: "section[aria-labelledby='popular-title']", label: "GATE 03: TOP DESTINATIONS" },
    { selector: ".why", label: "GATE 04: AIR CONCIERGE HUB" },
    { selector: "section[aria-labelledby='deals-title']", label: "GATE 05: PROMO ESCAPES" },
    { selector: ".reviews", label: "GATE 06: PASSENGER TERMINAL" },
    { selector: ".cta-banner", label: "FINAL DESTINATION: LANDING" }
  ];

  let pathTotalLength = 0;
  let waypoints = [];

  // إنشاء تدرج لوني للمسار النفاث
  if (!document.getElementById("flightGradient")) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="flightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>
    `;
    svg.prepend(defs);
  }

  // حساب ورسم منحنيات بيزير (Bezier Curves) بين كل سكشن والآخر
  function calculateFlightPath() {
    const mainEl = document.querySelector("main") || document.body;
    const mainRect = mainEl.getBoundingClientRect();
    const scrollY = window.scrollY;

    waypoints = [];

    waypointsConfig.forEach((cfg) => {
      const el = document.querySelector(cfg.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const absoluteTop = rect.top + scrollY;
        // حساب نقطة الهبوط المناسبة للسكشن بتعرج جمالي (يمين - يسار)
        const isLeft = waypoints.length % 2 === 0;
        const xPos = isLeft 
          ? Math.max(60, rect.left + rect.width * 0.15) 
          : Math.min(window.innerWidth - 60, rect.left + rect.width * 0.85);
        const yPos = absoluteTop + rect.height * 0.45;

        waypoints.push({ x: xPos, y: yPos, label: cfg.label, el: el });
      }
    });

    if (waypoints.length < 2) return;

    // بناء كود المسار المنحني d الخاص بـ SVG
    let d = `M ${waypoints[0].x} ${waypoints[0].y}`;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const curr = waypoints[i];
      const next = waypoints[i + 1];
      const midY = (curr.y + next.y) / 2;
      // منحنى انسيابي سينمائي بين السكشنين
      d += ` C ${curr.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
    }

    pathBase.setAttribute("d", d);
    pathActive.setAttribute("d", d);

    pathTotalLength = pathBase.getTotalLength();
    pathActive.style.strokeDasharray = `${pathTotalLength} ${pathTotalLength}`;
    pathActive.style.strokeDashoffset = pathTotalLength;

    updateFlight();
  }

  // تحديث موقع الطائرة وزاوية دورانها أثناء السكرول
  function updateFlight() {
    if (!pathTotalLength) return;

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, window.scrollY / (maxScroll || 1)));

    const currentLen = progress * pathTotalLength;
    const pt = pathBase.getPointAtLength(currentLen);
    
    // حساب نقطة أمامية طفيفة لمعرفة زاوية انعطاف الطائرة (Aircraft Banking)
    const nextPt = pathBase.getPointAtLength(Math.min(pathTotalLength, currentLen + 6));
    const angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
    const angleDeg = (angleRad * 180 / Math.PI) + 90; // زاوية الأيقونة للأمام

    // تحريك الطائرة بالإحداثيات الشاشية (Viewport View)
    const screenX = pt.x;
    const screenY = pt.y - window.scrollY;

    plane.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) rotate(${angleDeg}deg)`;
    pathActive.style.strokeDashoffset = Math.max(0, pathTotalLength - currentLen);

    // تحديد البوابة الحالية وتحديث الـ HUD
    let currentGate = waypoints[0]?.label || "";
    waypoints.forEach((wp) => {
      const rect = wp.el.getBoundingClientRect();
      if (rect.top <= window.innerHeight * 0.6) {
        currentGate = wp.label;
      }
    });

    if (hudTerminal && hudTerminal.textContent !== currentGate) {
      hudTerminal.textContent = currentGate;
    }
  }

  window.addEventListener("scroll", updateFlight, { passive: true });
  window.addEventListener("resize", () => {
    calculateFlightPath();
  });

  // تأخير طفيف عند بداية تحميل الصفحة لضمان اكتمال تحميل عناصر الصفحة
  setTimeout(calculateFlightPath, 350);
}

// تشغيل نظام الملاحة الجوية
initFlightJourney();
initMenu();
initPlanner();
initTripStatus();
initDestinationFilter();
initCountdown();
initChat();
initDialogs();



