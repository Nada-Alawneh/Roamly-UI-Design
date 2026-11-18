(function () {
  function initSidebarControls() {
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

    toggle.addEventListener("click", function () {
      collapsed = !document.body.classList.contains("sidebar-collapsed");
      document.body.classList.toggle("sidebar-collapsed", collapsed);
      localStorage.setItem(storageKey, String(collapsed));
      toggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.innerHTML = '<i class="fa-solid ' + (collapsed ? "fa-angles-right" : "fa-angles-left") + '" aria-hidden="true"></i>';
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initSidebarControls);
  else initSidebarControls();
}());
