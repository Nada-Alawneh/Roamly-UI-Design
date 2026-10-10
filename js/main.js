/* ==========================================================================
   Roamly — page behaviour
   Each behaviour is keyed to a data-attribute and only runs when that
   element exists, so this one file is safe to load on every page.
   ========================================================================== */

/* ==========================================================================
   Roamly — Basic JavaScript Fundamentals Implementation
   مكتوب بأبسط قواعد البرمجة: Variables, Functions, If/Else, Loops, DOM Events
   ========================================================================== */

// 1. المتغيرات الأساسية (Variables & Objects)
var PER_PERSON = { 
  flights: 300, 
  hotel: 225, 
  transfers: 45, 
  tickets: 50 
};

// 2. الدوال (Functions & Conditions)
// دالة بسيطة لتحويل الرقم إلى صيغة أموال (دولار)
function usd(number, hasCents) {
  var digits = 0;
  
  // جملة شرطية بسيطة لمعرفة إذا كنا نحتاج قروش (Cents)
  if (hasCents === true) {
    digits = 2;
  }
  
  return "$" + number.toLocaleString("en-US", { 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  });
}

/* ---------- 1. DOM Manipulation & Events: Mobile Menu ---------- */
function initMenu() {
  var toggleButton = document.querySelector("[data-menu-toggle]");
  
  // إذا لم نجد الزر، نوقف الدالة
  if (toggleButton === null) {
    return;
  }

  var header = toggleButton.closest(".site-header");
  
  // إضافة حدث النقر (Click Event)
  toggleButton.addEventListener("click", function () {
    var isOpen = header.toggleAttribute("data-open");
    
    // جملة شرطية لتغيير حالة الزر
    if (isOpen === true) {
      toggleButton.setAttribute("aria-expanded", "true");
    } else {
      toggleButton.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------- 2. DOM Manipulation: Dialogs (Popups) ---------- */
function initDialogs() {
  // الاستماع للنقر في كل الصفحة
  document.addEventListener("click", function (event) {
    
    // فحص إذا نقرنا على زر فتح المودال
    var openButton = event.target.closest("[data-dialog-open]");
    if (openButton !== null) {
      event.preventDefault(); // منع تحديث الصفحة
      var dialogId = openButton.getAttribute("data-dialog-open");
      var targetDialog = document.getElementById(dialogId);
      
      if (targetDialog !== null) {
        targetDialog.showModal();
      }
      return;
    }
    
    // فحص إذا نقرنا على زر إغلاق المودال
    var closeButton = event.target.closest("[data-dialog-close]");
    if (closeButton !== null) {
      var dialogToClose = closeButton.closest("dialog");
      if (dialogToClose !== null) {
        dialogToClose.close();
      }
    }
  });

  // إغلاق المودال عند النقر في الخلفية المظلمة
  var allDialogs = document.querySelectorAll("dialog.modal");
  for (var i = 0; i < allDialogs.length; i++) {
    allDialogs[i].addEventListener("click", function (event) {
      if (event.target === this) {
        this.close();
      }
    });
  }
}

/* ---------- 3. Functions & Math: AI Planner ---------- */
function renderQuote(travelers) {
  // حساب التكلفة للشخص الواحد
  var perPersonTotal = PER_PERSON.flights + PER_PERSON.hotel + PER_PERSON.transfers + PER_PERSON.tickets;
  var totalAmount = perPersonTotal * travelers;

  // تجهيز الكلمات
  var adultText = "Adults";
  if (travelers === 1) {
    adultText = "Adult";
  }

  // تخزين القيم في كائن (Object)
  var values = {};
  values["flights"] = usd(PER_PERSON.flights * travelers);
  values["hotel"] = usd(PER_PERSON.hotel * travelers);
  values["transfers"] = usd(PER_PERSON.transfers * travelers);
  values["tickets"] = usd(PER_PERSON.tickets * travelers);
  values["travelers"] = String(travelers);
  values["total"] = usd(totalAmount);
  values["total-cents"] = usd(totalAmount, true);
  values["total-label"] = "Total (For " + travelers + ")";
  values["per-person"] = usd(perPersonTotal, true) + " per person";
  values["party"] = travelers + " " + adultText;

  // حلقة (Loop) لتغيير النصوص في الـ HTML
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
  
  if (form === null || plan === null) {
    return;
  }

  // دالة لجلب عدد المسافرين
  function getTravelersCount() {
    var inputField = form.elements.namedItem("travelers");
    var num = parseInt(inputField.value, 10);
    
    if (isNaN(num) === true) { num = 1; }
    if (num < 1) { num = 1; }
    if (num > 20) { num = 20; }
    
    return num;
  }

  // دالة لإظهار الخطة
  function showPlan() {
    plan.hidden = false;
    var count = getTravelersCount();
    renderQuote(count);
  }

  // حدث عند الضغط على زر Submit
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    
    if (plan.hidden === true) {
      showPlan();
      plan.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      var count = getTravelersCount();
      renderQuote(count);
      var paywall = document.getElementById("paywall");
      if (paywall !== null) {
        paywall.showModal();
      }
    }
  });
}

/* ---------- 4. Arrays & Loops: Destinations Filter ---------- */
function initDestinationFilter() {
  var root = document.querySelector("[data-filter]");
  if (root === null) return;

  var chips = root.querySelectorAll("[data-region-chip]");
  var searchInput = root.querySelector("[data-filter-search]");
  var cards = document.querySelectorAll("[data-region]");
  var emptyMessage = document.querySelector("[data-filter-empty]");
  
  var currentSelectedRegion = "all";

  // دالة لتطبيق الفلترة
  function applyFilters() {
    var query = searchInput.value.trim().toLowerCase();
    var shownCount = 0;

    // حلقة تمر على كل الكروت
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var cardRegion = card.getAttribute("data-region");
      var cardText = card.textContent.toLowerCase();

      var matchesRegion = false;
      if (currentSelectedRegion === "all") {
        matchesRegion = true;
      } else if (cardRegion.indexOf(currentSelectedRegion) !== -1) {
        matchesRegion = true;
      }

      var matchesText = false;
      if (cardText.indexOf(query) !== -1) {
        matchesText = true;
      }

      // إظهار الكرت إذا طابق الشروط
      if (matchesRegion === true && matchesText === true) {
        card.hidden = false;
        shownCount = shownCount + 1;
      } else {
        card.hidden = true;
      }
    }

    // إظهار رسالة "لا يوجد نتائج"
    if (emptyMessage !== null) {
      if (shownCount > 0) {
        emptyMessage.hidden = true;
      } else {
        emptyMessage.hidden = false;
      }
    }
  }

  // حلقة لإضافة حدث النقر على الأزرار (Chips)
  for (var j = 0; j < chips.length; j++) {
    chips[j].addEventListener("click", function () {
      currentSelectedRegion = this.getAttribute("data-region-chip");
      
      for (var k = 0; k < chips.length; k++) {
        if (chips[k] === this) {
          chips[k].setAttribute("aria-pressed", "true");
        } else {
          chips[k].setAttribute("aria-pressed", "false");
        }
      }
      applyFilters();
    });
  }

  searchInput.addEventListener("input", applyFilters);
}

/* ---------- 5. Timing Events: Flash-sale countdown ---------- */
function initCountdown() {
  var root = document.querySelector("[data-countdown]");
  if (root === null) return;

  var remainingSeconds = parseInt(root.getAttribute("data-countdown"), 10);
  var hoursEl = root.querySelector('[data-unit="h"]');
  var minutesEl = root.querySelector('[data-unit="m"]');
  var secondsEl = root.querySelector('[data-unit="s"]');

  function padWithZero(number) {
    var str = String(number);
    if (str.length < 2) {
      return "0" + str;
    }
    return str;
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
  
  // تكرار كل ثانية
  var timerId = setInterval(function () {
    remainingSeconds = remainingSeconds - 1;
    if (remainingSeconds < 0) {
      remainingSeconds = 0;
    }
    
    updateDisplay();
    
    if (remainingSeconds === 0) {
      clearInterval(timerId); // إيقاف العداد
    }
  }, 1000);
}

/* ---------- 6. Forms & Timeout: Support chat ---------- */
function initChat() {
  var form = document.querySelector("[data-chat-form]");
  var log = document.querySelector("[data-chat-log]");
  
  if (form === null || log === null) return;

  function addMessage(text, isMine) {
    var bubble = document.createElement("p");
    if (isMine === true) {
      bubble.className = "bubble bubble--me";
    } else {
      bubble.className = "bubble";
    }
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var input = form.elements.namedItem("message");
    var text = input.value.trim();
    
    if (text === "") {
      return;
    }

    addMessage(text, true);
    input.value = "";

    // مهلة زمنية للرد (Timeout)
    setTimeout(function () {
      addMessage("Thanks! A Roamly concierge is looking into this and will reply here shortly.", false);
    }, 700);
  });
}

/* ==========================================================================
   7. Advanced Basic: Smooth Airplane Navigation (Scroll Events & Math)
   ========================================================================== */
function initFlightJourney() {
  var plane = document.getElementById("flightPlane");
  var pathBase = document.getElementById("flightPathBase");
  var pathActive = document.getElementById("flightPathActive");
  var hudTerminal = document.getElementById("hudTerminal");
  var svg = document.getElementById("flightSkySvg");

  if (plane === null || pathBase === null || pathActive === null || svg === null) {
    return;
  }

  // مصفوفة (Array) تحتوي على الكائنات (Objects) للبوابات
  var waypointsConfig = [
    { selector: ".hero-video-section", label: "GATE 01: TAKEOFF • CLOUD RUNWAY" },
    { selector: ".search-wrap", label: "GATE 02: RADAR SEARCH ENGINE" },
    { selector: "section[aria-labelledby='popular-title']", label: "GATE 03: TOP DESTINATIONS" },
    { selector: ".why", label: "GATE 04: AIR CONCIERGE HUB" },
    { selector: "section[aria-labelledby='deals-title']", label: "GATE 05: PROMO ESCAPES" },
    { selector: ".reviews", label: "GATE 06: PASSENGER TERMINAL" },
    { selector: ".cta-banner", label: "FINAL DESTINATION: LANDING" }
  ];

  var pathTotalLength = 0;
  var waypoints = [];

  // دالة حساب مسار الطيران (تحتاج بعض العمليات الحسابية للهندسة)
  function calculateFlightPath() {
    var scrollY = window.scrollY;
    waypoints = [];

    // حلقة (Loop) لحساب أماكن السكاشن
    for (var i = 0; i < waypointsConfig.length; i++) {
      var config = waypointsConfig[i];
      var element = document.querySelector(config.selector);
      
      if (element !== null) {
        var rect = element.getBoundingClientRect();
        var absoluteTop = rect.top + scrollY;
        
        var isLeft = false;
        if (waypoints.length % 2 === 0) {
          isLeft = true;
        }

        var xPos = 0;
        if (isLeft === true) {
          xPos = rect.left + (rect.width * 0.15);
          if (xPos < 60) { xPos = 60; }
        } else {
          xPos = rect.left + (rect.width * 0.85);
          if (xPos > window.innerWidth - 60) { xPos = window.innerWidth - 60; }
        }

        var yPos = absoluteTop + (rect.height * 0.45);
        waypoints.push({ x: xPos, y: yPos, label: config.label, el: element });
      }
    }

    if (waypoints.length < 2) {
      return;
    }

    // بناء النص الذي يرسم الخط المنحني للـ SVG
    var dString = "M " + waypoints[0].x + " " + waypoints[0].y;
    for (var j = 0; j < waypoints.length - 1; j++) {
      var currentPoint = waypoints[j];
      var nextPoint = waypoints[j + 1];
      var midY = (currentPoint.y + nextPoint.y) / 2;
      
      dString = dString + " C " + currentPoint.x + " " + midY + ", " + nextPoint.x + " " + midY + ", " + nextPoint.x + " " + nextPoint.y;
    }

    pathBase.setAttribute("d", dString);
    pathActive.setAttribute("d", dString);

    pathTotalLength = pathBase.getTotalLength();
    pathActive.style.strokeDasharray = pathTotalLength + " " + pathTotalLength;
    pathActive.style.strokeDashoffset = pathTotalLength;

    updateFlight();
  }

  // دالة تحديث الطيارة أثناء السكرول
  function updateFlight() {
    if (pathTotalLength === 0) {
      return;
    }

    var currentScroll = window.scrollY;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) { maxScroll = 1; }

    var progress = currentScroll / maxScroll;
    if (progress < 0) { progress = 0; }
    if (progress > 1) { progress = 1; }

    var currentLen = progress * pathTotalLength;
    var pt = pathBase.getPointAtLength(currentLen);
    
    var nextLen = currentLen + 6;
    if (nextLen > pathTotalLength) { nextLen = pathTotalLength; }
    var nextPt = pathBase.getPointAtLength(nextLen);

    // حساب زاوية دوران الطيارة (Math)
    var angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
    var angleDeg = (angleRad * 180 / Math.PI) + 90;

    var screenX = pt.x;
    var screenY = pt.y - currentScroll;

    plane.style.transform = "translate3d(" + screenX + "px, " + screenY + "px, 0) rotate(" + angleDeg + "deg)";
    
    var dashOffset = pathTotalLength - currentLen;
    if (dashOffset < 0) { dashOffset = 0; }
    pathActive.style.strokeDashoffset = dashOffset;

    var currentGate = "";
    if (waypoints.length > 0) {
      currentGate = waypoints[0].label;
    }

    for (var k = 0; k < waypoints.length; k++) {
      var wp = waypoints[k];
      var wpRect = wp.el.getBoundingClientRect();
      if (wpRect.top <= window.innerHeight * 0.6) {
        currentGate = wp.label;
      }
    }

    if (hudTerminal !== null && hudTerminal.textContent !== currentGate) {
      hudTerminal.textContent = currentGate;
    }
  }

  // الاستماع لأحداث التمرير وتغيير حجم الشاشة
  window.addEventListener("scroll", updateFlight);
  window.addEventListener("resize", calculateFlightPath);

  // تشغيل الحسابات بعد تحميل الصفحة
  setTimeout(calculateFlightPath, 350);
}

// ==========================================================================
// تشغيل جميع الدوال (Function Calls)
// ==========================================================================
initMenu();
initDialogs();
initPlanner();
initDestinationFilter();
initCountdown();
initChat();
initFlightJourney();



