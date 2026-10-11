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
   7. Advanced Basic: Smooth Left-Right Curve Avoiding Text Content to Footer
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

  // إنشاء تدرجات الألوان الذكية داخل الـ SVG لتتغير بين السكاشن الغامقة والفاتحة
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

  // عناوين البوابات للسكاشن وصولاً للفوتر
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

  // دالة تفحص إذا كان السكشن غامق أو فاتح تلقائياً
  function isSectionDark(el) {
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (
      tag === "footer" ||
      el.classList.contains("site-footer") ||
      el.classList.contains("footer") ||
      el.classList.contains("why") ||
      el.classList.contains("reviews") ||
      el.classList.contains("hero-video-section")
    ) {
      return true;
    }

    var styleBg = window.getComputedStyle(el).backgroundColor;
    if (styleBg && styleBg.indexOf("rgb") !== -1) {
      var rgb = styleBg.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        var red = parseInt(rgb[0], 10);
        var green = parseInt(rgb[1], 10);
        var blue = parseInt(rgb[2], 10);
        var alpha = rgb.length >= 4 ? parseFloat(rgb[3]) : 1;
        if (alpha === 0) {
          return false;
        }
        var lum = (red * 299 + green * 587 + blue * 114) / 1000;
        return lum < 140;
      }
    }
    return false;
  }

  // دالة مساعدة لإضافة نقطة لون للتدرج
  function addGradStop(grad, offsetPercent, color) {
    var stop = document.createElementNS(svgNs, "stop");
    stop.setAttribute("offset", offsetPercent + "%");
    stop.setAttribute("stop-color", color);
    grad.appendChild(stop);
  }

  // دالة جمع كل السكاشن بالصفحة بما فيها السكشن الأخير والفوتر
  function getAllPageSections() {
    var list = [];

    if (mainEl !== null) {
      var mainChildren = mainEl.children;
      for (var m = 0; m < mainChildren.length; m++) {
        var child = mainChildren[m];
        if (
          !child.classList.contains("flight-journey-tracker") &&
          !child.classList.contains("search-wrap") &&
          child.offsetHeight > 120
        ) {
          list.push(child);
        }
      }
    }

    var bodyChildren = document.body.children;
    var afterMain = (mainEl === null);
    for (var b = 0; b < bodyChildren.length; b++) {
      var bChild = bodyChildren[b];
      if (bChild === mainEl) {
        afterMain = true;
        continue;
      }
      if (afterMain === true) {
        var bTag = bChild.tagName ? bChild.tagName.toLowerCase() : "";
        if (
          bTag !== "script" &&
          bTag !== "dialog" &&
          !bChild.classList.contains("flight-hud") &&
          bChild.offsetHeight > 120
        ) {
          list.push(bChild);
        }
      }
    }

    var footerEl = document.querySelector("footer, .site-footer, .footer");
    if (footerEl !== null && list.indexOf(footerEl) === -1 && footerEl.offsetHeight > 100) {
      list.push(footerEl);
    }

    return list;
  }

  // دالة حساب مسار الطيران (كيرف مرة يمين ومرة يسار يلتف حول المحتوى بدون تغطية النص)
  function calculateFlightPath() {
    var scrollY = window.scrollY;
    var mainTop = 0;

    if (mainEl !== null) {
      var mainRect = mainEl.getBoundingClientRect();
      mainTop = mainRect.top + scrollY;
    }

    var sections = getAllPageSections();
    if (sections.length < 2) {
      return;
    }

    var lastSec = sections[sections.length - 1];
    var lastRect = lastSec.getBoundingClientRect();
    var totalHeight = (lastRect.top + scrollY - mainTop) + lastRect.height;

    svg.style.height = totalHeight + "px";
    if (svg.parentElement !== null) {
      svg.parentElement.style.height = totalHeight + "px";
    }

    waypoints = [];
    sectionZones = [];

    var screenW = window.innerWidth;
    // نقاط أقصى اليسار وأقصى اليمين على الأطراف الفارغة لتفادي النص بالمنتصف
    var leftInnerX = Math.max(36, screenW * 0.08);
    var leftOuterX = Math.max(24, screenW * 0.035);
    var rightInnerX = Math.min(screenW - 36, screenW * 0.92);
    var rightOuterX = Math.min(screenW - 24, screenW * 0.965);

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var rect = sec.getBoundingClientRect();
      var secTop = rect.top + scrollY - mainTop;
      var secBottom = secTop + rect.height;
      var dark = isSectionDark(sec);

      var label = gateLabels[i] || ("GATE 0" + (i + 1) + ": TERMINAL");
      if (i === sections.length - 1) {
        label = "FINAL DESTINATION: LANDING";
      }

      sectionZones.push({
        top: secTop,
        bottom: secBottom,
        dark: dark,
        label: label,
        el: sec
      });

      // التناوب: سكشن على اليسار وسكشن على اليمين
      var isLeft = (i % 2 === 0);

      // داخل السكشن يلتف الكيرف على الطرف الفارغ، وينتقل للجهة المقابلة في منطقة الفراغ بين السكاشن
      var padOffset = Math.min(85, rect.height * 0.16);
      var entryY = secTop + padOffset;
      var exitY = secBottom - padOffset;

      if (i === 0) {
        // نقطة الانطلاق في الهيرو
        waypoints.push({
          x: leftInnerX,
          y: secTop + (rect.height * 0.35),
          label: label,
          el: sec
        });
        waypoints.push({
          x: leftOuterX,
          y: exitY,
          label: label,
          el: sec
        });
      } else if (i === sections.length - 1) {
        // نقاط الهبوط في الفوتر
        waypoints.push({
          x: isLeft ? leftInnerX : rightInnerX,
          y: entryY,
          label: label,
          el: sec
        });
        waypoints.push({
          x: isLeft ? leftOuterX : rightOuterX,
          y: secTop + (rect.height * 0.82),
          label: label,
          el: sec
        });
      } else {
        // نقطتان على نفس الطرف الفارغ لكل سكشن حتى يمر بجانب النص والكروت دون أن يقطع فوقها
        waypoints.push({
          x: isLeft ? leftInnerX : rightInnerX,
          y: entryY,
          label: label,
          el: sec
        });
        waypoints.push({
          x: isLeft ? leftOuterX : rightOuterX,
          y: exitY,
          label: label,
          el: sec
        });
      }
    }

    // تحديث تدرج الألوان (فاتح وذهبي على الغامق، وكحلي على الفاتح)
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

      var baseColor = zone.dark ? "rgba(241, 245, 249, 0.55)" : "rgba(15, 23, 42, 0.42)";
      var activeColor = zone.dark ? "#fbbf24" : "#0f172a";

      addGradStop(baseGrad, startPct.toFixed(2), baseColor);
      addGradStop(baseGrad, endPct.toFixed(2), baseColor);

      addGradStop(activeGrad, startPct.toFixed(2), activeColor);
      addGradStop(activeGrad, endPct.toFixed(2), activeColor);
    }

    // بناء منحنيات المسار الانسيابية (Bezier Curves)
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

  // دالة إيجاد النقطة على المسار المقابلة لمكان الشاشة الحالي
  function getLengthAtY(targetY) {
    var low = 0;
    var high = pathTotalLength;
    for (var iter = 0; iter < 15; iter++) {
      var mid = (low + high) / 2;
      var pt = pathBase.getPointAtLength(mid);
      if (pt.y < targetY) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }

  // دالة تحديث الطيارة أثناء السكرول
  function updateFlight() {
    if (pathTotalLength === 0 || waypoints.length < 2) {
      return;
    }

    var currentScroll = window.scrollY;
    var mainTop = 0;
    if (mainEl !== null) {
      mainTop = mainEl.getBoundingClientRect().top + currentScroll;
    }

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

    var nextLen = currentLen + 8;
    if (nextLen > pathTotalLength) { nextLen = pathTotalLength; }
    var nextPt = pathBase.getPointAtLength(nextLen);

    // حساب زاوية دوران الطيارة
    var angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
    var angleDeg = (angleRad * 180 / Math.PI) + 90;

    var screenX = pt.x;
    var screenY = (pt.y + mainTop) - currentScroll;

    plane.style.transform = "translate3d(" + screenX + "px, " + screenY + "px, 0) rotate(" + angleDeg + "deg)";

    var dashOffset = pathTotalLength - currentLen;
    if (dashOffset < 0) { dashOffset = 0; }
    pathActive.style.strokeDashoffset = dashOffset;

    var currentGate = sectionZones.length > 0 ? sectionZones[0].label : "";
    var onDark = true;

    for (var k = 0; k < sectionZones.length; k++) {
      var zone = sectionZones[k];
      if (pt.y >= zone.top && pt.y <= zone.bottom) {
        currentGate = zone.label;
        onDark = zone.dark;
        break;
      } else if (pt.y > zone.bottom) {
        currentGate = zone.label;
        onDark = zone.dark;
      }
    }

    if (onDark === true) {
      plane.classList.remove("on-light-sec");
    } else {
      plane.classList.add("on-light-sec");
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
        '<!-- قبعة الكابتن وأنتين الطيران الذكي -->' +
        '<line x1="32" y1="5" x2="32" y2="13" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="32" cy="4.5" r="3" fill="#38bdf8"/>' +
        '<path d="M16 21C16 14.5 23 11 32 11C41 11 48 14.5 48 21H16Z" fill="#f8fafc" stroke="#fbbf24" stroke-width="2"/>' +
        '<path d="M13 21H51" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="32" cy="16.5" r="2.3" fill="#f59e0b"/>' +
        '<!-- رأس مجسم البوت -->' +
        '<rect x="14" y="21" width="36" height="27" rx="12" fill="#0f172a" stroke="#e2e8f0" stroke-width="2"/>' +
        '<!-- شاشة الوجه ونظارة الطيار -->' +
        '<rect x="19" y="26" width="26" height="14" rx="7" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>' +
        '<circle class="roamly-bot-eye" cx="26.5" cy="33" r="3" fill="#38bdf8"/>' +
        '<circle class="roamly-bot-eye" cx="37.5" cy="33" r="3" fill="#38bdf8"/>' +
        '<path d="M28 43.5C29.5 45 34.5 45 36 43.5" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>' +
        '<!-- طيارة ذهبية صغيرة على جنب المجسم -->' +
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
  var initialLeft = 28;
  var initialTop = window.innerHeight - 90;

  // استرجاع آخر مكان سحبه فيه اليوزر إذا تنقل بين الصفحات
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

    // ضبط اتجاه فتح الـ Pop-up تلقائياً حسب موقع المجسم على الشاشة
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
    if (e.target.closest("#roamlyAiClose") !== null) {
      return;
    }
    isDragging = true;
    movedDuringDrag = false;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var rect = widget.getBoundingClientRect();

    startX = clientX;
    startY = clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
  }

  function onDrag(e) {
    if (!isDragging) {
      return;
    }
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var dx = clientX - startX;
    var dy = clientY - startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      movedDuringDrag = true;
      widget.classList.add("is-dragging");
      applyPosition(initialLeft + dx, initialTop + dy);
    }
  }

  function stopDrag() {
    if (!isDragging) {
      return;
    }
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

  window.addEventListener("resize", function () {
    var rect = widget.getBoundingClientRect();
    applyPosition(rect.left, rect.top);
  });

  // فتح وإغلاق الشات عند الضغط بدون سحب
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

  // ردود ذكية للمساعد حسب سؤال اليوزر
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




/* ==========================================================================
   9. Contact Us & Feedback Boarding Studio Interactive Logic
   ========================================================================== */
function initContactStudio() {
  var form = document.getElementById("roamlyContactForm");
  if (form === null) {
    return;
  }

  var topicButtons = document.querySelectorAll("#contactTopicChips .topic-chip");
  var topicInput = document.getElementById("selectedTopicInput");
  var starButtons = document.querySelectorAll("#contactStarPicker .star-btn");
  var ratingInput = document.getElementById("selectedRatingInput");
  var ratingStatus = document.getElementById("ratingStatusText");
  var modal = document.getElementById("contactSuccessModal");
  var closeModalBtn = document.getElementById("closeContactModalBtn");
  var modalTopicBadge = document.getElementById("modalTopicBadge");
  var modalPersonalText = document.getElementById("modalPersonalText");

  var ratingLabels = {
    1: "1/5 • Needs Work 🛠️",
    2: "2/5 • Fair Experience 🌤️",
    3: "3/5 • Good Flight 👍",
    4: "4/5 • Great Service! ✨",
    5: "5/5 • Amazing! 🤩"
  };

  // تفعيل أزرار اختيار موضوع الرسالة
  for (var i = 0; i < topicButtons.length; i++) {
    topicButtons[i].addEventListener("click", function () {
      for (var j = 0; j < topicButtons.length; j++) {
        topicButtons[j].classList.remove("is-active");
      }
      this.classList.add("is-active");
      if (topicInput !== null) {
        topicInput.value = this.getAttribute("data-topic");
      }
    });
  }

  // تفعيل النجوم التفاعلية للفيدباك
  for (var s = 0; s < starButtons.length; s++) {
    starButtons[s].addEventListener("click", function () {
      var val = parseInt(this.getAttribute("data-val"), 10);
      if (ratingInput !== null) {
        ratingInput.value = String(val);
      }
      if (ratingStatus !== null && ratingLabels[val]) {
        ratingStatus.textContent = ratingLabels[val];
      }
      for (var k = 0; k < starButtons.length; k++) {
        var btnVal = parseInt(starButtons[k].getAttribute("data-val"), 10);
        if (btnVal <= val) {
          starButtons[k].classList.add("is-Lit");
        } else {
          starButtons[k].classList.remove("is-Lit");
        }
      }
    });
  }

  // إظهار الـ Pop-up الفخم عند إرسال الفورم
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var userName = document.getElementById("contact-name").value.trim() || "Traveler";
    var chosenTopic = topicInput ? topicInput.value : "General Inquiry";
    var chosenRating = ratingInput ? ratingInput.value : "5";

    if (modalTopicBadge !== null) {
      modalTopicBadge.textContent = chosenTopic.toUpperCase() + " • " + chosenRating + "★ RATING";
    }
    if (modalPersonalText !== null) {
      modalPersonalText.textContent = "Thank you, " + userName + "! Your message and feedback have been received by our priority concierge desk. We'll get back to you within 15 minutes.";
    }
    if (modal !== null) {
      modal.classList.add("is-visible");
      modal.setAttribute("aria-hidden", "false");
    }
    form.reset();
  });

  if (closeModalBtn !== null && modal !== null) {
    closeModalBtn.addEventListener("click", function () {
      modal.classList.remove("is-visible");
      modal.setAttribute("aria-hidden", "true");
    });
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        modal.classList.remove("is-visible");
        modal.setAttribute("aria-hidden", "true");
      }
    });
  }
}

initContactStudio();



/* ==========================================================================
   10. Simple Navbar Login State Toggle
   ========================================================================== */
function initSimpleNavbarAuth() {
  var guestActions = document.getElementById("guestActions");
  var loggedActions = document.getElementById("loggedActions");
  var simulateLoginBtn = document.getElementById("simulateLoginBtn");
  var userMenuToggle = document.getElementById("userMenuToggle");
  var userMenuWrap = document.querySelector(".user-menu-wrap");
  var logoutBtn = document.getElementById("logoutBtn");

  // محاكاة تسجيل الدخول عند الضغط على زر Sign In
  if (simulateLoginBtn && guestActions && loggedActions) {
    simulateLoginBtn.addEventListener("click", function () {
      guestActions.style.display = "none";
      loggedActions.style.display = "block";
    });
  }

  // فتح وإغلاق القائمة المنسدلة للبروفايل
  if (userMenuToggle && userMenuWrap) {
    userMenuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      userMenuWrap.classList.toggle("is-open");
    });

    document.addEventListener("click", function (e) {
      if (!userMenuWrap.contains(e.target)) {
        userMenuWrap.classList.remove("is-open");
      }
    });
  }

  // تسجيل الخروج والرجوع لحالة الضيف
  if (logoutBtn && guestActions && loggedActions) {
    logoutBtn.addEventListener("click", function () {
      loggedActions.style.display = "none";
      guestActions.style.display = "flex";
      userMenuWrap.classList.remove("is-open");
    });
  }
}

initSimpleNavbarAuth();

/* ==========================================================================
   Simple Safe Dark Theme Controller
   ========================================================================== */
function initSafeDarkMode() {
  var toggleBtn = document.getElementById("themeToggleBtn");
  var themeIcon = document.getElementById("themeIcon");
  var htmlRoot = document.documentElement;

  // استرجاع اختيار اليوزر السابق
  if (localStorage.getItem("roamlyThemeMode") === "dark") {
    htmlRoot.classList.add("dark-theme");
    if (themeIcon) { themeIcon.className = "fa-solid fa-sun"; }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      htmlRoot.classList.toggle("dark-theme");

      if (htmlRoot.classList.contains("dark-theme")) {
        localStorage.setItem("roamlyThemeMode", "dark");
        if (themeIcon) { themeIcon.className = "fa-solid fa-sun"; }
      } else {
        localStorage.setItem("roamlyThemeMode", "light");
        if (themeIcon) { themeIcon.className = "fa-solid fa-moon"; }
      }
    });
  }
}

initSafeDarkMode();