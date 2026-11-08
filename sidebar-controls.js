(function () {
  function initScrollPlanes() {
    var targets = new Set();
    var planeSize = 24;
    function isCandidate(element) {
      if (!element || element === document.scrollingElement || element.matches(".main-area")) return false;
      if (element.matches("dialog, .employee-table-wrap")) return true;
      var style = window.getComputedStyle(element);
      return /^(auto|scroll)$/.test(style.overflowY) || /^(auto|scroll)$/.test(style.overflowX);
    }
    function refreshTargets() {
      document.querySelectorAll("*").forEach(attach);
      if (document.scrollingElement) attach(document.scrollingElement);
    }
    function attach(target) {
      if (!isCandidate(target) || targets.has(target) || target.classList && target.classList.contains("sidebar-nav")) return;
      targets.add(target);
      var rail = document.createElement("span"), plane = document.createElement("i");
      rail.className = "scroll-plane-rail scroll-plane-rail--floating"; rail.setAttribute("aria-hidden", "true");
      plane.className = "fa-solid fa-plane scroll-plane"; rail.appendChild(plane);
      (target.tagName === "DIALOG" ? target : document.body).appendChild(rail);
      var frame = 0, activeAxis = "", dragging = false;
      function update() {
        var overflowY = target.scrollHeight > target.clientHeight + 2, overflowX = target.scrollWidth > target.clientWidth + 2;
        var isRoot = target === document.scrollingElement, style = window.getComputedStyle(target);
        var axis = overflowY && (isRoot || /^(auto|scroll)$/.test(style.overflowY)) ? "y" : overflowX && (isRoot || /^(auto|scroll)$/.test(style.overflowX)) ? "x" : "";
        activeAxis = axis;
        if (!axis || target.tagName === "DIALOG" && !target.open) { rail.hidden = true; return; }
        var rect = isRoot ? { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight } : target.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40 || rect.bottom < 0 || rect.top > window.innerHeight) { rail.hidden = true; return; }
        rail.hidden = false; rail.classList.toggle("is-horizontal", axis === "x");
        rail.style.right = Math.max(3, window.innerWidth - rect.right + (isRoot ? 5 : 4)) + "px";
        if (axis === "y") {
          var top = Math.max(5, isRoot ? 5 : rect.top + 5), bottom = Math.min(window.innerHeight - 5, isRoot ? window.innerHeight - 5 : rect.bottom - 5), height = bottom - top;
          if (height < planeSize + 8) { rail.hidden = true; return; }
          var max = target.scrollHeight - target.clientHeight, travel = Math.max(0, height - planeSize - 4), ratio = max ? Math.max(0, Math.min(1, target.scrollTop / max)) : 0;
          rail.style.left = "auto"; rail.style.top = top + "px"; rail.style.width = "20px"; rail.style.height = height + "px";
          plane.style.transform = "translateY(" + (2 + ratio * travel) + "px) rotate(90deg)";
        } else {
          var left = Math.max(5, rect.left + 5), right = Math.min(window.innerWidth - 5, rect.right - 5), width = right - left;
          if (width < planeSize + 8) { rail.hidden = true; return; }
          var maxX = target.scrollWidth - target.clientWidth, travelX = Math.max(0, width - planeSize - 4), ratioX = maxX ? Math.max(0, Math.min(1, target.scrollLeft / maxX)) : 0;
          rail.style.left = left + "px"; rail.style.right = "auto"; rail.style.top = Math.max(5, Math.min(window.innerHeight - 20, rect.bottom - 13)) + "px"; rail.style.width = width + "px"; rail.style.height = "3px";
          plane.style.transform = "translateX(" + (2 + ratioX * travelX) + "px) rotate(0deg)";
        }
      }
      function scheduleUpdate() { if (frame) return; frame = requestAnimationFrame(function () { frame = 0; update(); }); }
      function scrollToPointer(event) {
        var rect = rail.getBoundingClientRect(), ratio;
        if (activeAxis === "y") {
          var travel = Math.max(1, rect.height - planeSize - 4);
          ratio = Math.max(0, Math.min(1, (event.clientY - rect.top - planeSize / 2) / travel));
          target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
        } else if (activeAxis === "x") {
          var travelX = Math.max(1, rect.width - planeSize - 4);
          ratio = Math.max(0, Math.min(1, (event.clientX - rect.left - planeSize / 2) / travelX));
          target.scrollLeft = ratio * (target.scrollWidth - target.clientWidth);
        }
      }
      rail.addEventListener("pointerdown", function (event) { if (!activeAxis || rail.hidden) return; event.preventDefault(); dragging = true; rail.setPointerCapture(event.pointerId); scrollToPointer(event); });
      rail.addEventListener("pointermove", function (event) { if (dragging) scrollToPointer(event); });
      function stopDragging() { dragging = false; }
      rail.addEventListener("pointerup", stopDragging);
      rail.addEventListener("pointercancel", stopDragging);
      target.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
      window.addEventListener("resize", scheduleUpdate);
      if (target.tagName === "DIALOG") { target.addEventListener("close", update); target.addEventListener("toggle", update); }
      scheduleUpdate();
    }
    refreshTargets();
    var observer = new MutationObserver(function (records) {
      refreshTargets();
      if (records.some(function (record) { return record.target.tagName === "DIALOG" && record.attributeName === "open"; })) targets.forEach(function (target) { if (target.tagName === "DIALOG") target.dispatchEvent(new Event("scroll")); });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
  }
  function initSidebarControls() {
    initScrollPlanes();
    var aside = document.querySelector("body > aside");
    if (!aside) return;
    var isSupplier = document.body.classList.contains("supplier-app") || document.body.classList.contains("supplier-profile-page");
    var storageKey = isSupplier ? "roamly-supplier-sidebar-collapsed" : "roamly-admin-sidebar-collapsed";
    var collapsed = localStorage.getItem(storageKey) === "true";
    document.body.classList.toggle("sidebar-collapsed", collapsed);

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "sidebar-collapse-toggle";
    toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
    toggle.setAttribute("aria-expanded", String(!collapsed));
    toggle.innerHTML = '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';
    aside.appendChild(toggle);

    var nav = aside.querySelector(".sidebar-nav");
    var sidebarTop = aside.querySelector(".sidebar-top");
    var rail = document.createElement("span");
    rail.className = "sidebar-plane-rail";
    rail.setAttribute("aria-hidden", "true");
    var plane = document.createElement("i");
    plane.className = "fa-solid fa-plane sidebar-plane";
    rail.appendChild(plane);
    if (sidebarTop) sidebarTop.appendChild(rail);

    var draggingSidebar = false;
    function updatePlane() {
      if (!nav || !sidebarTop || window.innerWidth <= 820 || nav.scrollHeight <= nav.clientHeight + 2) {
        rail.hidden = true;
        return;
      }
      rail.hidden = false;
      var navTop = nav.offsetTop - sidebarTop.scrollTop;
      var navHeight = nav.clientHeight;
      rail.style.top = navTop + "px";
      rail.style.height = navHeight + "px";
      var maxScroll = nav.scrollHeight - nav.clientHeight;
      var travel = Math.max(0, navHeight - 30);
      var ratio = maxScroll ? nav.scrollTop / maxScroll : 0;
      plane.style.transform = "translateY(" + (ratio * travel) + "px) rotate(90deg)";
    }
    function scrollSidebarTo(clientY) {
      if (!nav) return;
      var rect = rail.getBoundingClientRect(), travel = Math.max(1, rect.height - 30);
      var ratio = Math.max(0, Math.min(1, (clientY - rect.top - 15) / travel));
      nav.scrollTop = ratio * (nav.scrollHeight - nav.clientHeight);
    }
    rail.addEventListener("pointerdown", function (event) { if (rail.hidden) return; event.preventDefault(); draggingSidebar = true; rail.setPointerCapture(event.pointerId); scrollSidebarTo(event.clientY); });
    rail.addEventListener("pointermove", function (event) { if (draggingSidebar) scrollSidebarTo(event.clientY); });
    function stopSidebarDrag() { draggingSidebar = false; }
    rail.addEventListener("pointerup", stopSidebarDrag);
    rail.addEventListener("pointercancel", stopSidebarDrag);

    toggle.addEventListener("click", function () {
      collapsed = !document.body.classList.contains("sidebar-collapsed");
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      localStorage.setItem(storageKey, String(collapsed));
      toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.innerHTML = '<i class="fa-solid ' + (collapsed ? "fa-angles-right" : "fa-angles-left") + '" aria-hidden="true"></i>';
      requestAnimationFrame(updatePlane);
    });
    if (nav) nav.addEventListener("scroll", updatePlane, { passive: true });
    window.addEventListener("resize", updatePlane);
    requestAnimationFrame(updatePlane);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSidebarControls);
  else initSidebarControls();
}());
