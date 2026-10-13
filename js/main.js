/* ==========================================================================
   Roamly — page behaviour
   ========================================================================== */

var PER_PERSON = { 
  flights: 300, 
  hotel: 225, 
  transfers: 45, 
  tickets: 50 
};

function usd(number, hasCents) {
  var digits = 0;
  if (hasCents === true) { digits = 2; }
  return "$" + number.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function initMenu() {
  var toggleButton = document.querySelector("[data-menu-toggle]");
  if (toggleButton === null) { return; }
  var header = toggleButton.closest(".site-header");
  toggleButton.addEventListener("click", function () {
    var isOpen = header.toggleAttribute("data-open");
    if (isOpen === true) { toggleButton.setAttribute("aria-expanded", "true"); }
    else { toggleButton.setAttribute("aria-expanded", "false"); }
  });
}

function initDialogs() {
  document.addEventListener("click", function (event) {
    var openButton = event.target.closest("[data-dialog-open]");
    if (openButton !== null) {
      event.preventDefault();
      var dialogId = openButton.getAttribute("data-dialog-open");
      var targetDialog = document.getElementById(dialogId);
      if (targetDialog !== null) { targetDialog.showModal(); }
      return;
    }
    var closeButton = event.target.closest("[data-dialog-close]");
    if (closeButton !== null) {
      var dialogToClose = closeButton.closest("dialog");
      if (dialogToClose !== null) { dialogToClose.close(); }
    }
  });

  var allDialogs = document.querySelectorAll("dialog.modal");
  for (var i = 0; i < allDialogs.length; i++) {
    allDialogs[i].addEventListener("click", function (event) {
      if (event.target === this) { this.close(); }
    });
  }
}

function renderQuote(travelers) {
  // Never divide by zero / NaN, whatever the caller passes in
  travelers = parseInt(travelers, 10);
  if (isNaN(travelers) || travelers < 1) { travelers = 1; }

  var perPersonTotal = PER_PERSON.flights + PER_PERSON.hotel + PER_PERSON.transfers + PER_PERSON.tickets;
  var totalAmount = perPersonTotal * travelers;
  // Split Bill = total amount ÷ number of travelers
  var splitPerPerson = totalAmount / travelers;
  var adultText = (travelers === 1) ? "Adult" : "Adults";

  var values = {};
  values["flights"] = usd(PER_PERSON.flights * travelers);
  values["hotel"] = usd(PER_PERSON.hotel * travelers);
  values["transfers"] = usd(PER_PERSON.transfers * travelers);
  values["tickets"] = usd(PER_PERSON.tickets * travelers);
  values["travelers"] = String(travelers);
  values["total"] = usd(totalAmount);
  values["total-cents"] = usd(totalAmount, true);
  values["total-label"] = "Total (For " + travelers + ")";
  values["per-person"] = usd(splitPerPerson, true) + " per person";
  values["split-formula"] = usd(totalAmount, true) + " ÷ " + travelers + (travelers === 1 ? " traveler" : " travelers");
  values["party"] = travelers + " " + adultText;

  // One update path: every [data-quote] element (including Split Bill's
  // data-quote="per-person") is filled from the values map, synchronously.
  var elements = document.querySelectorAll("[data-quote]");
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var key = el.getAttribute("data-quote");
    if (values[key] !== undefined) {
      el.textContent = values[key];
    }
  }
}

function initPlanner() {
  var form = document.querySelector("[data-planner-form]");
  var plan = document.querySelector("[data-plan]");
  if (form === null || plan === null) { return; }

  function getTravelersCount() {
    var inputField = form.elements.namedItem("travelers");
    if (!inputField) return 1;
    var num = parseInt(inputField.value, 10);
    if (isNaN(num) === true) { num = 1; }
    if (num < 1) { num = 1; }
    if (num > 20) { num = 20; }
    return num;
  }

  function showPlan() {
    plan.hidden = false;
    var count = getTravelersCount();
    renderQuote(count);
  }

  // Re-render the whole quote (Split Bill included) on every change of the travelers field
  var travelersInput = form.elements.namedItem("travelers");
  if (travelersInput !== null) {
    var syncQuote = function () { renderQuote(getTravelersCount()); };
    travelersInput.addEventListener("input", syncQuote);
    travelersInput.addEventListener("change", syncQuote);
  }

  // Sync once on load: browsers restore form values on reload/back, which
  // would otherwise leave the static HTML prices out of step with the input.
  renderQuote(getTravelersCount());

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showPlan();
    plan.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function initDestinationFilter() {
  var root = document.querySelector("[data-filter]");
  if (root === null) return;

  var chips = root.querySelectorAll("[data-region-chip]");
  var searchInput = root.querySelector("[data-filter-search]");
  var cards = document.querySelectorAll("[data-region]");
  var emptyMessage = document.querySelector("[data-filter-empty]");
  var currentSelectedRegion = "all";

  function applyFilters() {
    var query = searchInput.value.trim().toLowerCase();
    var shownCount = 0;

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var cardRegion = card.getAttribute("data-region");
      var cardText = card.textContent.toLowerCase();

      var matchesRegion = (currentSelectedRegion === "all") || (cardRegion.indexOf(currentSelectedRegion) !== -1);
      var matchesText = (cardText.indexOf(query) !== -1);

      if (matchesRegion === true && matchesText === true) {
        card.hidden = false;
        shownCount++;
      } else {
        card.hidden = true;
      }
    }

    if (emptyMessage !== null) {
      emptyMessage.hidden = (shownCount > 0);
    }
  }

  for (var j = 0; j < chips.length; j++) {
    chips[j].addEventListener("click", function () {
      currentSelectedRegion = this.getAttribute("data-region-chip");
      for (var k = 0; k < chips.length; k++) {
        chips[k].setAttribute("aria-pressed", (chips[k] === this) ? "true" : "false");
      }
      applyFilters();
    });
  }

  searchInput.addEventListener("input", applyFilters);
}

function initCountdown() {
  var root = document.querySelector("[data-countdown]");
  if (root === null) return;
  var remainingSeconds = parseInt(root.getAttribute("data-countdown"), 10);
  var hoursEl = root.querySelector('[data-unit="h"]');
  var minutesEl = root.querySelector('[data-unit="m"]');
  var secondsEl = root.querySelector('[data-unit="s"]');

  function padWithZero(number) {
    var str = String(number);
    return (str.length < 2) ? "0" + str : str;
  }

  function updateDisplay() {
    var hours = Math.floor(remainingSeconds / 3600);
    var minutes = Math.floor((remainingSeconds % 3600) / 60);
    var seconds = remainingSeconds % 60;
    if (hoursEl !== null) { hoursEl.textContent = padWithZero(hours); }
    if (minutesEl !== null) { minutesEl.textContent = padWithZero(minutes); }
    if (secondsEl !== null) { secondsEl.textContent = padWithZero(seconds); }
  }

  updateDisplay();
  var timerId = setInterval(function () {
    remainingSeconds--;
    if (remainingSeconds < 0) { remainingSeconds = 0; }
    updateDisplay();
    if (remainingSeconds === 0) { clearInterval(timerId); }
  }, 1000);
}

function initChat() {
  var form = document.querySelector("[data-chat-form]");
  var log = document.querySelector("[data-chat-log]");
  if (form === null || log === null) return;

  function addMessage(text, isMine) {
    var bubble = document.createElement("p");
    bubble.className = isMine ? "bubble bubble--me" : "bubble";
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var input = form.elements.namedItem("message");
    var text = input.value.trim();
    if (text === "") return;
    addMessage(text, true);
    input.value = "";
    setTimeout(function () {
      addMessage("Thanks! A Roamly concierge is looking into this and will reply here shortly.", false);
    }, 700);
  });
}

/* ==========================================================================
   Flight Journey System (Sine Wave + Hero & Footer Bounds)
   ========================================================================== */
function initFlightJourney() {
  var plane = document.getElementById("flightPlane");
  var pathBase = document.getElementById("flightPathBase");
  var pathActive = document.getElementById("flightPathActive");
  var hudTerminal = document.getElementById("hudTerminal");
  var svg = document.getElementById("flightSkySvg");
  var mainEl = document.getElementById("main");

  if (plane === null || pathBase === null || pathActive === null || svg === null) {
    return;
  }

  var svgNs = "http://www.w3.org/2000/svg";
  var defs = svg.querySelector("defs");
  if (defs === null) {
    defs = document.createElementNS(svgNs, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  var baseGrad = document.getElementById("flightBaseGrad");
  if (baseGrad === null) {
    baseGrad = document.createElementNS(svgNs, "linearGradient");
    baseGrad.setAttribute("id", "flightBaseGrad");
    baseGrad.setAttribute("gradientUnits", "userSpaceOnUse");
    baseGrad.setAttribute("x1", "0");
    baseGrad.setAttribute("x2", "0");
    defs.appendChild(baseGrad);
  }

  var activeGrad = document.getElementById("flightActiveGrad");
  if (activeGrad === null) {
    activeGrad = document.createElementNS(svgNs, "linearGradient");
    activeGrad.setAttribute("id", "flightActiveGrad");
    activeGrad.setAttribute("gradientUnits", "userSpaceOnUse");
    activeGrad.setAttribute("x1", "0");
    activeGrad.setAttribute("x2", "0");
    defs.appendChild(activeGrad);
  }

  var gateLabels = [
    "GATE 01: TAKEOFF • CLOUD RUNWAY",
    "GATE 02: TOP DESTINATIONS",
    "GATE 03: AIR CONCIERGE HUB",
    "GATE 04: PROMO ESCAPES",
    "GATE 05: PASSENGER TERMINAL",
    "GATE 06: ADVENTURE BOARDING",
    "FINAL DESTINATION: ROAMLY TERMINAL"
  ];

  var pathTotalLength = 0;
  var waypoints = [];
  var sectionZones = [];

  function isSectionDark(el) {
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "footer" || el.classList.contains("site-footer") || el.classList.contains("footer") || el.classList.contains("why") || el.classList.contains("reviews") || el.classList.contains("hero-video-section")) {
      return true;
    }
    return false;
  }

  function addGradStop(grad, offsetPercent, color) {
    var stop = document.createElementNS(svgNs, "stop");
    stop.setAttribute("offset", offsetPercent + "%");
    stop.setAttribute("stop-color", color);
    grad.appendChild(stop);
  }

  function getAllPageSections() {
    var list = [];
    if (mainEl !== null) {
      var mainChildren = mainEl.children;
      for (var m = 0; m < mainChildren.length; m++) {
        var child = mainChildren[m];
        if (!child.classList.contains("flight-journey-tracker") && !child.classList.contains("search-wrap") && child.offsetHeight > 120) {
          list.push(child);
        }
      }
    }
    var footerEl = document.querySelector("footer, .site-footer, .footer");
    if (footerEl !== null && list.indexOf(footerEl) === -1 && footerEl.offsetHeight > 100) {
      list.push(footerEl);
    }
    return list;
  }

  function calculateFlightPath() {
    var scrollY = window.scrollY;
    var mainTop = 0;
    if (mainEl !== null) {
      mainTop = mainEl.getBoundingClientRect().top + scrollY;
    }

    var sections = getAllPageSections();
    if (sections.length < 2) { return; }

    var lastSec = sections[sections.length - 1];
    var footerEl = document.querySelector("footer, .site-footer, .footer");
    var totalHeight = 0;
    if (footerEl !== null) {
      var footerRect = footerEl.getBoundingClientRect();
      totalHeight = footerRect.top + scrollY - mainTop;
    } else {
      var lastRect = lastSec.getBoundingClientRect();
      totalHeight = (lastRect.top + scrollY - mainTop) + lastRect.height;
    }

    svg.style.height = totalHeight + "px";
    if (svg.parentElement !== null) { svg.parentElement.style.height = totalHeight + "px"; }

    waypoints = [];
    sectionZones = [];

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var rect = sec.getBoundingClientRect();
      var secTop = rect.top + scrollY - mainTop;
      var secBottom = secTop + rect.height;
      var dark = isSectionDark(sec);
      var label = gateLabels[i] || ("GATE 0" + (i + 1) + ": TERMINAL");
      if (i === sections.length - 1) { label = "FINAL DESTINATION: LANDING"; }
      sectionZones.push({ top: secTop, bottom: secBottom, dark: dark, label: label, el: sec });
    }

    baseGrad.setAttribute("y1", "0");
    baseGrad.setAttribute("y2", String(totalHeight));
    activeGrad.setAttribute("y1", "0");
    activeGrad.setAttribute("y2", String(totalHeight));

    while (baseGrad.firstChild) { baseGrad.removeChild(baseGrad.firstChild); }
    while (activeGrad.firstChild) { activeGrad.removeChild(activeGrad.firstChild); }

    for (var z = 0; z < sectionZones.length; z++) {
      var zone = sectionZones[z];
      var startPct = Math.max(0, Math.min(100, (zone.top / totalHeight) * 100));
      var endPct = Math.max(0, Math.min(100, (zone.bottom / totalHeight) * 100));
      var softGrayColor = "rgba(100, 116, 139, 0.75)";

      addGradStop(baseGrad, startPct.toFixed(2), softGrayColor);
      addGradStop(baseGrad, endPct.toFixed(2), softGrayColor);
      addGradStop(activeGrad, startPct.toFixed(2), softGrayColor);
      addGradStop(activeGrad, endPct.toFixed(2), softGrayColor);
    }

    var dString = "";
    var totalPoints = 100;
    var screenW = window.innerWidth;
    
    var leftMargin = Math.max(24, screenW * 0.04);
    var rightMargin = screenW - leftMargin;
    var waveWidth = (rightMargin - leftMargin) / 2;
    var midEdge = (leftMargin + rightMargin) / 2;

    var heroSec = document.querySelector(".hero-video-section");
    var heroRect = heroSec ? heroSec.getBoundingClientRect() : null;
    var startY = heroRect ? (heroRect.top + window.scrollY - mainTop) + (heroRect.height * 0.55) : 300;

    for (var p = 0; p <= totalPoints; p++) {
      var t = p / totalPoints;
      var currentY = startY + (t * (totalHeight - startY));
      if (currentY > totalHeight) { currentY = totalHeight; }

      var currentX = midEdge + Math.cos(t * Math.PI * 4) * waveWidth;

      if (p === 0) {
        dString = "M " + rightMargin + " " + startY;
      } else {
        dString = dString + " L " + currentX + " " + currentY;
      }
    }

    waypoints.push({ x: rightMargin, y: startY });
    waypoints.push({ x: leftMargin, y: totalHeight });

    pathBase.setAttribute("d", dString);
    pathActive.setAttribute("d", dString);

    pathTotalLength = pathBase.getTotalLength();
    pathActive.style.strokeDasharray = "8 10";

    updateFlight();
  }

  function getLengthAtY(targetY) {
    var low = 0;
    var high = pathTotalLength;
    for (var iter = 0; iter < 15; iter++) {
      var mid = (low + high) / 2;
      var pt = pathBase.getPointAtLength(mid);
      if (pt.y < targetY) { low = mid; } else { high = mid; }
    }
    return (low + high) / 2;
  }

  function updateFlight() {
    if (pathTotalLength === 0 || waypoints.length < 2) { return; }

    var currentScroll = window.scrollY;
    var mainTop = 0;
    if (mainEl !== null) { mainTop = mainEl.getBoundingClientRect().top + currentScroll; }

    var startY = waypoints[0].y;
    var endY = waypoints[waypoints.length - 1].y;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) { maxScroll = 1; }

    var progress = currentScroll / maxScroll;
    if (progress < 0) { progress = 0; }
    if (progress > 1) { progress = 1; }

    var viewportTargetY = (currentScroll - mainTop) + (window.innerHeight * (0.38 + progress * 0.35));
    if (viewportTargetY < startY) { viewportTargetY = startY; }
    if (viewportTargetY > endY) { viewportTargetY = endY; }

    var currentLen = getLengthAtY(viewportTargetY);
    var pt = pathBase.getPointAtLength(currentLen);
    var nextLen = Math.min(currentLen + 8, pathTotalLength);
    var nextPt = pathBase.getPointAtLength(nextLen);

    var angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
    var angleDeg = (angleRad * 180 / Math.PI) + 90;

    var screenX = pt.x;
    var screenY = (pt.y + mainTop) - currentScroll;

    plane.style.transform = "translate3d(" + screenX + "px, " + screenY + "px, 0) rotate(" + angleDeg + "deg)";

    pathActive.style.strokeDasharray = "8 10";
    var dashOffset = Math.max(0, pathTotalLength - currentLen);
    pathActive.style.strokeDashoffset = dashOffset;

    var currentGate = sectionZones.length > 0 ? sectionZones[0].label : "";
    for (var k = 0; k < sectionZones.length; k++) {
      var zone = sectionZones[k];
      if (pt.y >= zone.top && pt.y <= zone.bottom) {
        currentGate = zone.label;
        break;
      } else if (pt.y > zone.bottom) {
        currentGate = zone.label;
      }
    }

    if (hudTerminal !== null && hudTerminal.textContent !== currentGate) {
      hudTerminal.textContent = currentGate;
    }
  }

  window.addEventListener("scroll", updateFlight);
  window.addEventListener("resize", calculateFlightPath);
  window.addEventListener("load", calculateFlightPath);
  setTimeout(calculateFlightPath, 350);
}

// تشغيل جميع الدوال الأساسية
initMenu();
initDialogs();
initPlanner();
initDestinationFilter();
initCountdown();
initChat();
initFlightJourney();

// تمرير نوع الدفع (Full أو Split) عند إرسال نموذج الحجز في الـ Checkout لصفحة الـ trip
document.addEventListener("DOMContentLoaded", function() {
  var checkoutForm = document.querySelector("#checkout form");
  if (checkoutForm !== null) {
    checkoutForm.addEventListener("submit", function(e) {
      e.preventDefault();
      var selectedPayment = checkoutForm.querySelector('input[name="payment"]:checked');
      var paymentVal = selectedPayment ? selectedPayment.value : "full";
      window.location.href = "trip.html?payment=" + paymentVal;
    });
  }
});

/* ==========================================================================
   8. Global Draggable AI Captain Chatbot Widget (All Pages)
   ========================================================================== */
function initFloatingAIChat() {
  if (document.getElementById("roamlyAiWidget") !== null) {
    return;
  }

  var widget = document.createElement("div");
  widget.className = "roamly-ai-widget";
  widget.id = "roamlyAiWidget";

  widget.innerHTML =
    '<div class="roamly-ai-popup" id="roamlyAiPopup" role="dialog" aria-label="Roamly AI Concierge Chat">' +
      '<div class="roamly-ai-header" id="roamlyAiDragHeader">' +
        '<div class="roamly-ai-header__info">' +
          '<div class="roamly-ai-header__avatar" aria-hidden="true">🧑‍✈️</div>' +
          '<div>' +
            '<p class="roamly-ai-header__eyebrow">Live AI Captain • 24/7</p>' +
            '<h3 class="roamly-ai-header__title">Roamly AI Concierge</h3>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="roamly-ai-close" id="roamlyAiClose" aria-label="Close chat">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
        '</button>' +
      '</div>' +
      '<div class="roamly-ai-messages" id="roamlyAiMessages" aria-live="polite">' +
        '<p class="roamly-ai-bubble">👋 Welcome aboard! I am Captain Roamly AI. Drag me anywhere on the screen, or ask me about bookings, weather, or custom itineraries!</p>' +
      '</div>' +
      '<div class="roamly-ai-chips">' +
        '<button type="button" class="roamly-ai-chip" data-prompt="Best package deals right now?">🔥 Best Deals</button>' +
        '<button type="button" class="roamly-ai-chip" data-prompt="How can I modify my itinerary?">🗺️ Modify Trip</button>' +
        '<button type="button" class="roamly-ai-chip" data-prompt="What is the refund policy?">💰 Refund Policy</button>' +
      '</div>' +
      '<form class="roamly-ai-form" id="roamlyAiForm">' +
        '<input type="text" class="roamly-ai-input" id="roamlyAiInput" placeholder="Ask Captain Roamly..." autocomplete="off" required>' +
        '<button type="submit" class="roamly-ai-send">Send ➔</button>' +
      '</form>' +
    '</div>' +
    '<button type="button" class="roamly-ai-Launcher" id="roamlyAiLauncher" aria-label="Open Roamly AI Concierge">' +
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<line x1="32" y1="5" x2="32" y2="13" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="32" cy="4.5" r="3" fill="#38bdf8"/>' +
        '<path d="M16 21C16 14.5 23 11 32 11C41 11 48 14.5 48 21H16Z" fill="#f8fafc" stroke="#fbbf24" stroke-width="2"/>' +
        '<path d="M13 21H51" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="32" cy="16.5" r="2.3" fill="#f59e0b"/>' +
        '<rect x="14" y="21" width="36" height="27" rx="12" fill="#0f172a" stroke="#e2e8f0" stroke-width="2"/>' +
        '<rect x="19" y="26" width="26" height="14" rx="7" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>' +
        '<circle class="roamly-bot-eye" cx="26.5" cy="33" r="3" fill="#38bdf8"/>' +
        '<circle class="roamly-bot-eye" cx="37.5" cy="33" r="3" fill="#38bdf8"/>' +
        '<path d="M28 43.5C29.5 45 34.5 45 36 43.5" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M49 46L58 41L54 52L51.5 48.5L49 46Z" fill="#fbbf24"/>' +
      '</svg>' +
    '</button>' +
    '<div class="roamly-ai-tooltip"><span>Roamly AI</span></div>';
  document.body.appendChild(widget);

  var launcher = document.getElementById("roamlyAiLauncher");
  var dragHeader = document.getElementById("roamlyAiDragHeader");
  var closeBtn = document.getElementById("roamlyAiClose");
  var form = document.getElementById("roamlyAiForm");
  var input = document.getElementById("roamlyAiInput");
  var messages = document.getElementById("roamlyAiMessages");
  var chips = widget.querySelectorAll(".roamly-ai-chip");

  var isDragging = false;
  var movedDuringDrag = false;
  var startX = 0;
  var startY = 0;

  var savedPos = sessionStorage.getItem("roamlyBotPos");
  if (savedPos !== null) {
    try {
      var parsed = JSON.parse(savedPos);
      applyPosition(parsed.left, parsed.top);
    } catch (err) {
      applyPosition(28, window.innerHeight - 90);
    }
  } else {
    applyPosition(28, window.innerHeight - 90);
  }

  function applyPosition(leftPos, topPos) {
    var maxLeft = window.innerWidth - 76;
    var maxTop = window.innerHeight - 76;
    var clampedLeft = Math.max(14, Math.min(maxLeft, leftPos));
    var clampedTop = Math.max(14, Math.min(maxTop, topPos));

    widget.style.left = clampedLeft + "px";
    widget.style.top = clampedTop + "px";
    widget.style.bottom = "auto";
    widget.style.right = "auto";

    if (clampedLeft > window.innerWidth * 0.52) {
      widget.classList.add("align-right");
    } else {
      widget.classList.remove("align-right");
    }

    if (clampedTop < window.innerHeight * 0.55) {
      widget.classList.add("open-down");
    } else {
      widget.classList.remove("open-down");
    }
  }

  function startDrag(e) {
    if (e.target.closest("#roamlyAiClose") !== null) { return; }
    isDragging = true;
    movedDuringDrag = false;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var rect = widget.getBoundingClientRect();

    startX = clientX;
    startY = clientY;
  }

  function onDrag(e) {
    if (!isDragging) { return; }
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var dx = clientX - startX;
    var dy = clientY - startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      movedDuringDrag = true;
      widget.classList.add("is-dragging");
      var rect = widget.getBoundingClientRect();
      applyPosition(rect.left + dx, rect.top + dy);
      startX = clientX;
      startY = clientY;
    }
  }

  function stopDrag() {
    if (!isDragging) { return; }
    isDragging = false;
    widget.classList.remove("is-dragging");

    if (movedDuringDrag) {
      var rect = widget.getBoundingClientRect();
      sessionStorage.setItem("roamlyBotPos", JSON.stringify({ left: rect.left, top: rect.top }));
    }
  }

  launcher.addEventListener("mousedown", startDrag);
  launcher.addEventListener("touchstart", startDrag, { passive: true });
  dragHeader.addEventListener("mousedown", startDrag);
  dragHeader.addEventListener("touchstart", startDrag, { passive: true });

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("touchmove", onDrag, { passive: true });
  window.addEventListener("mouseup", stopDrag);
  window.addEventListener("touchend", stopDrag);

  launcher.addEventListener("click", function () {
    if (movedDuringDrag) {
      movedDuringDrag = false;
      return;
    }
    widget.classList.toggle("is-open");
    if (widget.classList.contains("is-open")) {
      setTimeout(function () { input.focus(); }, 180);
    }
  });

  closeBtn.addEventListener("click", function () {
    widget.classList.remove("is-open");
  });

  function getSmartReply(question) {
    var q = question.toLowerCase();
    if (q.indexOf("deal") !== -1 || q.indexOf("discount") !== -1 || q.indexOf("offer") !== -1) {
      return "🔥 Our top flash deals right now include Maldives Paradise (50% Off at $899) and Dubai Experience (40% Off at $889) — plus an extra 15% off at checkout!";
    }
    if (q.indexOf("refund") !== -1 || q.indexOf("cancel") !== -1 || q.indexOf("price") !== -1) {
      return "💰 With Roamly's Best Price Guarantee, if you find a lower rate within 24 hours of booking, we refund the difference immediately!";
    }
    if (q.indexOf("modify") !== -1 || q.indexOf("itinerary") !== -1 || q.indexOf("plan") !== -1) {
      return "🗺️ You can customize any day of your trip in the AI Planner! Click 'Re-Generate AI Plan' next to any activity to swap it based on live weather and traffic.";
    }
    return "✈️ Copy that! I've checked our live global concierge data for \"" + question + "\". Would you like me to tailor a custom itinerary or apply a promo bundle for you?";
  }

  function sendUserMessage(text) {
    if (!text) { return; }

    var userBubble = document.createElement("p");
    userBubble.className = "roamly-ai-bubble roamly-ai-bubble--me";
    userBubble.textContent = text;
    messages.appendChild(userBubble);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(function () {
      var botBubble = document.createElement("p");
      botBubble.className = "roamly-ai-bubble";
      botBubble.textContent = getSmartReply(text);
      messages.appendChild(botBubble);
      messages.scrollTop = messages.scrollHeight;
    }, 450);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (text === "") { return; }
    input.value = "";
    sendUserMessage(text);
  });

  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener("click", function () {
      var promptText = this.getAttribute("data-prompt");
      sendUserMessage(promptText);
    });
  }
}

initFloatingAIChat();