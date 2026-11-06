(function () {
  "use strict";
  var accounts;
  try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) { accounts = []; }
  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
  var account = accounts.find(function (item) { return item.email === email && item.role === "supplier"; });
  if (!account) { location.href = "../sign-in.html"; return; }
  if (!account.id) { account.id = "supplier-" + btoa(account.email).replace(/[^a-z0-9]/gi, "").slice(0, 16); var ix = accounts.findIndex(function (item) { return item.email === email; }); if (ix >= 0) { accounts[ix] = account; localStorage.setItem("roamlyLocalAccounts", JSON.stringify(accounts)); } }

  var body = document.body, pageHeader = body.querySelector(".workflow-header"), pageMain = body.querySelector(".workflow-main");
  if (!pageHeader || !pageMain || Array.prototype.some.call(body.children, function (child) { return child.tagName === "ASIDE"; })) return;
  var categories = [
    ["hiking", "Hiking & Trail Companies", "fa-person-hiking"], ["equipment", "Outdoor Equipment Rentals", "fa-person-biking"],
    ["sports", "Water & Adventure Sports", "fa-water"], ["reserves", "Nature Reserves & Campsites", "fa-tree"],
    ["transport", "Specialized Transport", "fa-truck-pickup"]
  ];
  var route = location.pathname.split("/").pop(), params = new URLSearchParams(location.search), activeCategory = params.get("category") || "hiking";
  var initials = String(account.name || "Supplier").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join("");
  var aside = document.createElement("aside");
  aside.innerHTML = '<div class="sidebar-top"><div class="logo-row"><img class="sidebar-logo" src="../assets/img/logo.png" alt="Roamly Supplier Studio"><span class="sidebar-brand-caption">Supplier Studio</span></div><nav class="sidebar-nav" aria-label="Supplier sections"><a class="admin-nav-link" data-workflow-tab="overview" href="supplier-dashboard.html#overview"><i class="fa-solid fa-chart-pie"></i><span>Overview</span></a><a class="admin-nav-link" data-workflow-tab="employees" href="employees.html"><i class="fa-solid fa-users"></i><span>Team members</span></a>' + categories.map(function (item) { return '<a class="admin-nav-link" data-workflow-tab="' + item[0] + '" href="supplier-dashboard.html#' + item[0] + '"><i class="fa-solid ' + item[2] + '"></i><span>' + item[1] + '</span></a>'; }).join("") + '<a class="admin-nav-link" data-workflow-tab="requests" href="supplier-dashboard.html#requests"><i class="fa-solid fa-comments"></i><span>Booking requests</span></a><a class="admin-nav-link" data-workflow-tab="profile" href="profile.html#profile"><i class="fa-solid fa-building"></i><span>Business profile</span></a></nav></div><div class="sidebar-bottom"><a class="logout-link" href="../sign-in.html" data-workflow-logout><i class="fa-solid fa-right-from-bracket"></i><span>Log Out</span></a><a class="back-link" href="../index.html"><i class="fa-solid fa-arrow-left"></i><span>Main site</span></a></div>';
  var pageTitle = pageMain.querySelector("h1");
  var main = document.createElement("div"); main.className = "main-area supplier-workflow-main";
  var topbar = document.createElement("header"); topbar.className = "topbar";
  topbar.innerHTML = '<div class="topbar-left"><h2>' + (pageTitle ? pageTitle.textContent : "Supplier Studio") + '</h2><span class="live-pill"><span class="live-dot"></span> Adventure &amp; Nature</span></div><div class="topbar-right"><div class="profile-menu-wrap"><button class="profile-menu-trigger" id="workflowProfileToggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="workflowProfileMenu"><span class="profile-meta"><span class="profile-name" id="workflowProfileName"></span><span class="profile-role">Adventure &amp; Nature Supplier</span></span><span class="avatar" id="workflowProfileAvatar"></span><i class="fa-solid fa-chevron-down profile-chevron" aria-hidden="true"></i></button><div class="profile-dropdown" id="workflowProfileMenu" hidden><div class="profile-dropdown__heading">YOUR ACCOUNT</div><a href="profile.html#profile" class="profile-dropdown__link"><i class="fa-regular fa-user"></i><span><strong>My Profile</strong><small>Personal information</small></span></a><a href="profile.html#preferences" class="profile-dropdown__link"><i class="fa-solid fa-sliders"></i><span><strong>Preferences</strong><small>Language &amp; notifications</small></span></a><div class="profile-dropdown__divider"></div><a href="../sign-in.html" class="profile-dropdown__logout" data-workflow-logout><i class="fa-solid fa-right-from-bracket"></i> Log Out</a></div></div></div>';
  body.insertBefore(aside, body.firstChild); body.insertBefore(main, pageHeader); main.appendChild(topbar); main.appendChild(pageHeader); main.appendChild(pageMain);
  var activeTab = route === "employees.html" ? "employees" : route === "team-editor.html" || route === "teams.html" ? activeCategory : "";
  aside.querySelectorAll("[data-workflow-tab]").forEach(function (link) { if (link.dataset.workflowTab === activeTab) { link.classList.add("active"); link.setAttribute("aria-current", "page"); } });
  var profileName = document.getElementById("workflowProfileName"), avatar = document.getElementById("workflowProfileAvatar"), profile = {};
  try { profile = JSON.parse(localStorage.getItem("roamlyUserProfile:" + account.email) || "{}"); } catch (error) { profile = {}; }
  profileName.textContent = account.name || "Supplier"; avatar.textContent = initials;
  if (typeof profile.avatar === "string" && /^data:image\/[^;]+;base64,/.test(profile.avatar)) { avatar.textContent = ""; avatar.classList.add("avatar--photo"); avatar.style.backgroundImage = 'url("' + profile.avatar + '")'; }
  var toggle = document.getElementById("workflowProfileToggle"), menu = document.getElementById("workflowProfileMenu");
  toggle.addEventListener("click", function () { var open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); menu.hidden = open; });
  document.addEventListener("click", function (event) { if (!event.target.closest(".profile-menu-wrap")) { toggle.setAttribute("aria-expanded", "false"); menu.hidden = true; } });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !menu.hidden) { toggle.setAttribute("aria-expanded", "false"); menu.hidden = true; toggle.focus(); } });
  document.querySelectorAll("[data-workflow-logout]").forEach(function (link) { link.addEventListener("click", function () { sessionStorage.removeItem("roamlySignedInEmail"); localStorage.removeItem("roamlySignedInEmail"); }); });
}());
