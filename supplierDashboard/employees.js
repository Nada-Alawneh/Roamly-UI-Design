(function () {
  "use strict";
  var EMPLOYEES = "roamly-supplier-employees", SERVICES = "roamly-market-services", ACCOUNTS = "roamlyLocalAccounts";
  var SERVICE_TYPES = { hiking: ["Local tourist guides", "Organizing mountain hiking routes", "Cave and valley exploration tours"], equipment: ["Camping equipment rental", "Mountain bike rental", "Climbing gear rental", "Kayak rental"], sports: ["Rafting trips", "Zip-line sessions", "Kayaking tours", "Outdoor training"], reserves: ["Nature reserve entry", "Safari tours", "Campsite booking", "Cabin stays"], transport: ["4x4 desert trips", "Remote area transfers", "Speedboat rental"] };
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function publicRecord(person) { return { employeeId: person.id, name: person.name, role: person.role, experience: person.experience || "", languages: person.languages || "", qualifications: person.qualifications || "", bio: person.bio || "" }; }
  function listValues(value) { if (Array.isArray(value)) return value.reduce(function (all, item) { return all.concat(listValues(item)); }, []); if (typeof value === "string") return value.split(/[|,;]/).map(function (item) { return item.trim(); }).filter(Boolean); return value == null || value === "" ? [] : [String(value).trim()]; }
  function memberTypes(person) { var values = []; ["serviceTypes", "serviceTypesText", "serviceType", "specialties", "specialty", "subServices", "subService"].forEach(function (key) { values = values.concat(listValues(person[key])); }); return values.filter(function (value, index, all) { return all.findIndex(function (item) { return item.toLowerCase() === value.toLowerCase(); }) === index; }); }
  function normalizedCategory(value) { var raw = String(value || "").trim().toLowerCase(); if (SERVICE_TYPES[raw]) return raw; if (/hiking|trail|hike/.test(raw)) return "hiking"; if (/equipment|rental|gear/.test(raw)) return "equipment"; if (/sport|water|adventure/.test(raw)) return "sports"; if (/reserve|camp|nature/.test(raw)) return "reserves"; if (/transport|4x4|vehicle/.test(raw)) return "transport"; return String(value || "").trim(); }
  function belongsToService(person, service) { var ids = listValues(service.teamMemberIds); if (ids.indexOf(String(person.id)) >= 0) return true; var targetName = String(person.name || "").trim().toLowerCase(); return (Array.isArray(service.team) ? service.team : []).some(function (member) { return String(member.employeeId || member.employeeID || member.memberId || "") === String(person.id) || (targetName && String(member.name || "").trim().toLowerCase() === targetName); }); }
  function categoryNames(values) { var labels = { hiking: "Hiking & Trail", equipment: "Equipment rentals", sports: "Water & adventure sports", reserves: "Nature & campsites", transport: "Specialized transport" }; return listValues(values).map(function (value) { var category = normalizedCategory(value); return labels[category] || value; }).join(", "); }
  function hasSpecialty(person, value) { return memberTypes(person).some(function (type) { return type.trim().toLowerCase() === String(value).trim().toLowerCase(); }); }
  function memberCategories(person) { var categories = []; ["serviceCategories", "serviceCategory", "category", "categories"].forEach(function (key) { listValues(person[key]).forEach(function (value) { var category = normalizedCategory(value); if (category && categories.indexOf(category) < 0) categories.push(category); }); }); Object.keys(SERVICE_TYPES).forEach(function (category) { if ((SERVICE_TYPES[category] || []).some(function (type) { return hasSpecialty(person, type); }) && categories.indexOf(category) < 0) categories.push(category); }); services.forEach(function (service) { if (service.supplierId === account.id && belongsToService(person, service)) { var category = normalizedCategory(service.category || service.serviceCategory); if (category && categories.indexOf(category) < 0) categories.push(category); } }); return categories; }
  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase(), accounts = read(ACCOUNTS, []), account = accounts.find(function (item) { return item.email === email; });
  if (!account || account.role !== "supplier") { location.href = "../sign-in.html"; return; }
  if (!account.id) { account.id = "supplier-" + btoa(account.email).replace(/[^a-z0-9]/gi, "").slice(0, 16); var accountIndex = accounts.findIndex(function (item) { return item.email === email; }); if (accountIndex >= 0) { accounts[accountIndex] = account; write(ACCOUNTS, accounts); } }
  var members = read(EMPLOYEES, []), services = read(SERVICES, []), params = new URLSearchParams(location.search), editingId = "", pendingStatusId = "", pendingEmployeeAction = "toggle";
  var directory = document.getElementById("employeeDirectory"), employeeDialog = document.getElementById("employeeDialog"), employeeForm = document.getElementById("employeeForm"), statusDialog = document.getElementById("employeeStatusDialog"), addConfirmDialog = document.getElementById("confirmAddEmployeeDialog"), pendingNewMember = null;
  var categoryToggle = document.getElementById("serviceCategoryToggle"), categoryMenu = document.getElementById("serviceCategoryMenu"), categorySelect = employeeForm.elements.serviceCategories;
  var languageToggle = document.getElementById("memberLanguageToggle"), languageMenu = document.getElementById("memberLanguageMenu"), languageSearch = document.getElementById("memberLanguageSearch"), languageOptions = document.getElementById("memberLanguageOptions"), languageChips = document.getElementById("memberLanguageChips"), languageValue = employeeForm.elements.languages;
  var languageCatalog = ["Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Bengali", "Bosnian", "Bulgarian", "Burmese", "Catalan", "Chinese (Cantonese)", "Chinese (Mandarin)", "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian", "Filipino", "Finnish", "French", "Georgian", "German", "Greek", "Gujarati", "Hausa", "Hebrew", "Hindi", "Hungarian", "Icelandic", "Indonesian", "Italian", "Japanese", "Kannada", "Kazakh", "Khmer", "Korean", "Kurdish", "Lao", "Latvian", "Lithuanian", "Malay", "Malayalam", "Marathi", "Mongolian", "Nepali", "Norwegian", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Serbian", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Yoruba", "Zulu"].sort(function (a, b) { return a.localeCompare(b, "en"); });
  var returnPath = params.get("return"), backLink = document.querySelector(".workflow-header .btn-admin-secondary");
  if (returnPath && returnPath.indexOf("/supplierDashboard/team-editor.html") === 0) backLink.href = returnPath;

  function ownedMembers() { return members.filter(function (person) { return person.supplierId === account.id; }); }
  function assignedServiceCount(person) { return services.filter(function (service) { return service.supplierId === account.id && (service.teamMemberIds || []).indexOf(person.id) >= 0; }).length; }
  function cleanSubservice(value) { var label = String(value || "").trim().replace(/\s+/g, " "); var key = label.toLowerCase(); if (!label || /anything|any thing|^(any|all|n\/?a|none|undefined|null)$/i.test(key)) return ""; var aliases = { "local tourist guide": "Local tourist guides", "local tourist guides": "Local tourist guides" }; if (aliases[key]) label = aliases[key]; var categoryLabels = ["Hiking & Trail Companies", "Hiking & Trail", "Outdoor Equipment Rentals", "Equipment Rentals", "Water & Adventure Sports", "Nature Reserves & Campsites", "Specialized Transport"]; if (categoryLabels.some(function (item) { return item.toLowerCase() === key; })) return ""; return label; }
  function updateSubserviceFilter(allMine) {
    var select = document.getElementById("employeeDirectoryType"), category = document.getElementById("employeeDirectoryCategory").value, selected = select.value, choices = category === "all" ? Object.keys(SERVICE_TYPES).reduce(function (all, key) { return all.concat(SERVICE_TYPES[key]); }, []) : (SERVICE_TYPES[category] || []).slice();
    // Employee legacy fields can contain free-form placeholders (for example "anything").
    // The category catalog and real supplier service records are the reliable filter sources.
    services.forEach(function (service) { if (service.supplierId === account.id && (category === "all" || normalizedCategory(service.category || service.serviceCategory) === category) && service.serviceType) choices.push(service.serviceType); });
    var unique = Object.create(null); choices = choices.map(cleanSubservice).filter(function (type) { if (!type) return false; var key = type.toLowerCase(); if (unique[key]) return false; unique[key] = true; return true; });
    choices.sort(function (a, b) { return a.localeCompare(b); });
    select.innerHTML = '<option value="all">All sub-services</option>' + choices.map(function (type) { return '<option value="' + esc(type) + '">' + esc(type) + '</option>'; }).join("");
    select.value = choices.some(function (type) { return type.toLowerCase() === selected.toLowerCase(); }) ? choices.find(function (type) { return type.toLowerCase() === selected.toLowerCase(); }) : "all";
  }
  function matchesSubservice(person, selectedType, category) {
    if (hasSpecialty(person, selectedType)) return true;
    if (memberTypes(person).some(function (type) { return type.trim().toLowerCase() === selectedType.trim().toLowerCase(); })) return true;
    return services.some(function (service) { if (service.supplierId !== account.id || String(service.serviceType || service.subService || "").trim().toLowerCase() !== selectedType.trim().toLowerCase() || (category !== "all" && normalizedCategory(service.category || service.serviceCategory) !== category)) return false; return belongsToService(person, service); });
  }
  function syncCategoryDropdown() {
    var selected = Array.prototype.filter.call(categorySelect.options, function (option) { return option.selected; });
    categoryMenu.querySelectorAll('input[type="checkbox"]').forEach(function (checkbox) { checkbox.checked = selected.some(function (option) { return option.value === checkbox.value; }); });
    categoryToggle.innerHTML = (selected.length ? selected.map(function (option) { return esc(option.textContent); }).join(", ") : "Choose service categories") + ' <i class="fa-solid fa-chevron-down"></i>';
  }
  function selectedLanguages() { return String(languageValue.value || "").split(/[|,]/).map(function (item) { return item.trim(); }).filter(Boolean); }
  function renderLanguagePicker() {
    var selected = selectedLanguages(), query = (languageSearch.value || "").trim().toLowerCase();
    languageValue.value = selected.join(" | ");
    languageOptions.innerHTML = languageCatalog.filter(function (name) { return !query || name.toLowerCase().indexOf(query) >= 0; }).map(function (name) { return '<label><input type="checkbox" value="' + esc(name) + '" ' + (selected.some(function (item) { return item.toLowerCase() === name.toLowerCase(); }) ? "checked" : "") + '> ' + esc(name) + '</label>'; }).join("");
    languageChips.innerHTML = "";
    languageToggle.innerHTML = '<span class="member-language-value" title="' + esc(selected.join(", ")) + '">' + esc(selected.length ? selected.join(", ") : "Search languages") + '</span><i class="fa-solid fa-chevron-down"></i>';
  }
  function syncAssignments(person) {
    services.forEach(function (service) {
      if (service.supplierId !== account.id || (service.teamMemberIds || []).indexOf(person.id) < 0) return;
      service.team = service.team || [];
      var index = service.team.findIndex(function (member) { return member.employeeId === person.id; });
      if (index < 0) service.team.push(publicRecord(person)); else service.team[index] = publicRecord(person);
    });
    write(SERVICES, services);
  }
  function paint() {
    var allMine = ownedMembers(); updateSubserviceFilter(allMine); var searchValue = (document.getElementById("employeeDirectorySearch").value || "").trim().toLowerCase(), categoryValue = document.getElementById("employeeDirectoryCategory").value, subserviceValue = document.getElementById("employeeDirectoryType").value, statusValue = document.getElementById("employeeDirectoryStatus").value; var mine = allMine.filter(function (person) { var categories = memberCategories(person); return (categoryValue === "all" || categories.indexOf(categoryValue) >= 0) && (subserviceValue === "all" || matchesSubservice(person, subserviceValue, categoryValue)) && (statusValue === "all" || (statusValue === "active") === (person.active !== false)) && (!searchValue || [person.name, person.role, person.languages, person.qualifications].concat(memberTypes(person)).join(" ").toLowerCase().indexOf(searchValue) >= 0); });
    directory.innerHTML = mine.length ? mine.map(function (person) {
      var active = person.active !== false, assigned = assignedServiceCount(person), phone = person.phone ? '<p><i class="fa-solid fa-phone"></i> <a href="tel:' + esc(person.phone.replace(/[^0-9+(). -]/g, "")) + '">' + esc(person.phone) + '</a></p>' : '', workEmail = person.email ? '<p><i class="fa-regular fa-envelope"></i> <a href="mailto:' + esc(person.email) + '">' + esc(person.email) + '</a></p>' : '';
      return '<article class="employee-card"><div class="employee-card__top"><span class="employee-card__avatar"><i class="fa-solid fa-user"></i></span>' + '<span class="employee-state ' + (active ? "is-active" : "is-inactive") + '">' + (active ? "Active" : "Inactive") + '</span></div><h2>' + esc(person.name) + '</h2><p class="employee-card__role">' + esc(person.role) + '</p><div class="employee-card__facts"><span><i class="fa-solid fa-layer-group"></i> ' + esc(categoryNames(memberCategories(person)) || "Service categories not assigned") + '</span><span><i class="fa-regular fa-clock"></i> ' + esc(person.experience || "Experience not added") + '</span><span><i class="fa-solid fa-language"></i> ' + esc(person.languages || "Languages not added") + '</span>' + (person.qualifications ? '<span><i class="fa-solid fa-certificate"></i> ' + esc(person.qualifications) + '</span>' : '') + '</div>' + (person.bio ? '<p class="employee-card__bio">' + esc(person.bio) + '</p>' : '') + '<footer class="employee-card__footer"><span>' + assigned + ' service assignment' + (assigned === 1 ? "" : "s") + '</span><div><button class="supplier-small-btn" type="button" data-edit-employee="' + esc(person.id) + '">Edit</button><button class="supplier-small-btn ' + (active ? "is-danger" : "") + '" type="button" data-toggle-employee="' + esc(person.id) + '">' + (active ? "Deactivate" : "Activate") + '</button><button class="supplier-small-btn is-danger" type="button" data-delete-employee="' + esc(person.id) + '">Delete</button></div></footer></article>';
    }).join("") : '<div class="supplier-empty employee-empty"><i class="fa-solid fa-users"></i><h2>Your roster is ready for its first member</h2><p>Add a guide or team member once, then select them in any service team.</p><button class="btn-gold" type="button" data-empty-add><i class="fa-solid fa-plus"></i> Add your first member</button></div>';
    var cards = directory.querySelectorAll(".employee-card");
    mine.forEach(function (person, index) { if (cards[index]) cards[index].id = "employee-" + person.id; });
  }
  function openEmployee(id) {
    editingId = id || ""; employeeForm.reset();
    var employee = editingId && members.find(function (person) { return person.id === editingId && person.supplierId === account.id; });
    document.getElementById("employeeDialogTitle").textContent = employee ? "Edit member" : "Add a member";
    if (employee) { Object.keys(employee).forEach(function (key) { if (employeeForm.elements[key] && key !== "serviceCategories" && key !== "serviceTypes") employeeForm.elements[key].value = employee[key] || ""; }); if (employeeForm.elements.serviceTypesText) employeeForm.elements.serviceTypesText.value = memberTypes(employee).join(", "); var savedCategories = []; ["serviceCategories", "serviceCategory", "category", "categories"].forEach(function (key) { savedCategories = savedCategories.concat(listValues(employee[key]).map(normalizedCategory)); }); Array.prototype.forEach.call(categorySelect.options, function (option) { option.selected = savedCategories.indexOf(option.value) >= 0; }); }
    syncCategoryDropdown(); categoryMenu.hidden = true; categoryToggle.setAttribute("aria-expanded", "false"); languageSearch.value = ""; renderLanguagePicker(); languageMenu.hidden = true; languageToggle.setAttribute("aria-expanded", "false"); document.getElementById("memberLanguageError").hidden = true;
    employeeDialog.showModal();
  }
  categoryToggle.addEventListener("click", function () { categoryMenu.hidden = !categoryMenu.hidden; categoryToggle.setAttribute("aria-expanded", String(!categoryMenu.hidden)); });
  categoryMenu.addEventListener("change", function (event) { var checkbox = event.target.closest('input[type="checkbox"]'); if (!checkbox) return; Array.prototype.forEach.call(categorySelect.options, function (option) { if (option.value === checkbox.value) option.selected = checkbox.checked; }); syncCategoryDropdown(); });
  languageToggle.addEventListener("click", function () { languageMenu.hidden = !languageMenu.hidden; languageToggle.setAttribute("aria-expanded", String(!languageMenu.hidden)); if (!languageMenu.hidden) languageSearch.focus(); });
  languageSearch.addEventListener("input", renderLanguagePicker);
  languageOptions.addEventListener("change", function (event) { var checkbox = event.target.closest('input[type="checkbox"]'); if (!checkbox) return; var values = selectedLanguages().filter(function (item) { return item.toLowerCase() !== checkbox.value.toLowerCase(); }); if (checkbox.checked) values.push(checkbox.value); languageValue.value = values.join(" | "); renderLanguagePicker(); document.getElementById("memberLanguageError").hidden = true; });
  languageChips.addEventListener("click", function (event) { var button = event.target.closest("[data-remove-language]"); if (!button) return; languageValue.value = selectedLanguages().filter(function (item) { return item.toLowerCase() !== button.dataset.removeLanguage.toLowerCase(); }).join(" | "); renderLanguagePicker(); });
  employeeForm.addEventListener("click", function (event) { if (!event.target.closest(".service-category-dropdown")) { categoryMenu.hidden = true; categoryToggle.setAttribute("aria-expanded", "false"); } if (!event.target.closest(".member-language-dropdown")) { languageMenu.hidden = true; languageToggle.setAttribute("aria-expanded", "false"); } });
  document.getElementById("addEmployee").addEventListener("click", function () { openEmployee(""); });
  ["employeeDirectorySearch", "employeeDirectoryCategory", "employeeDirectoryType", "employeeDirectoryStatus"].forEach(function (id) { var control = document.getElementById(id); control.addEventListener(id === "employeeDirectorySearch" ? "input" : "change", paint); });
  directory.addEventListener("click", function (event) {
    if (event.target.closest("[data-empty-add]")) { openEmployee(""); return; }
    var edit = event.target.closest("[data-edit-employee]"), toggle = event.target.closest("[data-toggle-employee]"), remove = event.target.closest("[data-delete-employee]");
    if (edit) openEmployee(edit.dataset.editEmployee);
    if (toggle || remove) {
      var actionButton = toggle || remove, person = members.find(function (item) { return item.id === (toggle ? toggle.dataset.toggleEmployee : remove.dataset.deleteEmployee) && item.supplierId === account.id; }); if (!person) return;
      pendingEmployeeAction = remove ? "delete" : "toggle";
      pendingStatusId = person.id;
      var deactivate = person.active !== false;
      if (remove) { document.getElementById("employeeStatusTitle").textContent = "Delete this member?"; document.getElementById("employeeStatusCopy").textContent = "They will be removed from active service teams. Existing booking requests keep their saved team details."; document.getElementById("confirmEmployeeStatus").textContent = "Delete member"; statusDialog.showModal(); return; }
      document.getElementById("employeeStatusTitle").textContent = deactivate ? "Deactivate this member?" : "Activate this member?";
      document.getElementById("employeeStatusCopy").textContent = deactivate ? "They will be removed from future service teams. Offers that would have no team members left will be hidden from travelers. Existing booking conversations remain unchanged." : "They will be available to select for new and existing service teams.";
      document.getElementById("confirmEmployeeStatus").textContent = deactivate ? "Deactivate member" : "Activate member";
      statusDialog.showModal();
    }
  });
  document.querySelectorAll("[data-close-employee]").forEach(function (button) { button.addEventListener("click", function () { employeeDialog.close(); }); });
  employeeForm.addEventListener("submit", function (event) {
    event.preventDefault(); if (!employeeForm.reportValidity()) return; var languages = selectedLanguages(); if (!languages.length) { document.getElementById("memberLanguageError").hidden = false; languageToggle.focus(); return; }
    var data = new FormData(employeeForm), now = new Date().toISOString(), person = Object.assign({}, editingId ? members.find(function (item) { return item.id === editingId; }) : { id: "employee-" + Date.now().toString(36), supplierId: account.id, active: true, createdAt: now }, {
      name: String(data.get("name")).trim(), role: String(data.get("role")).trim(), experience: String(data.get("experience") || "").trim(), languages: languages.join(", "), qualifications: String(data.get("qualifications") || "").trim(), email: String(data.get("email") || "").trim(), phone: String(data.get("phone") || "").trim(), bio: String(data.get("bio") || "").trim(), serviceCategories: Array.from(employeeForm.elements.serviceCategories.selectedOptions).map(function (option) { return option.value; }), serviceTypes: String(data.get("serviceTypesText") || "").split(",").map(function (value) { return value.trim(); }).filter(Boolean), updatedAt: now
    });
    if (!editingId) { pendingNewMember = person; document.getElementById("confirmAddEmployeeName").textContent = person.name; addConfirmDialog.showModal(); return; }
    saveMember(person, false);
  });
  function saveMember(person, isNew) {
    var index = members.findIndex(function (item) { return item.id === person.id && item.supplierId === account.id; });
    if (index < 0) { if (isNew) members.unshift(person); else members.push(person); } else members[index] = person;
    write(EMPLOYEES, members); syncAssignments(person); employeeDialog.close(); paint();
  }
  document.getElementById("cancelAddEmployee").addEventListener("click", function () { pendingNewMember = null; addConfirmDialog.close(); });
  document.getElementById("confirmAddEmployee").addEventListener("click", function () {
    if (!pendingNewMember) return;
    var person = pendingNewMember; pendingNewMember = null; addConfirmDialog.close(); saveMember(person, true);
  });
  statusDialog.addEventListener("close", function () {
    if (statusDialog.returnValue !== "confirm" || !pendingStatusId) return;
    var person = members.find(function (item) { return item.id === pendingStatusId && item.supplierId === account.id; }); pendingStatusId = ""; if (!person) return;
    if (pendingEmployeeAction === "delete") { services.forEach(function (service) { if (service.supplierId !== account.id || (service.teamMemberIds || []).indexOf(person.id) < 0) return; service.teamMemberIds = service.teamMemberIds.filter(function (id) { return id !== person.id; }); service.team = (service.team || []).filter(function (member) { return member.employeeId !== person.id; }); if (!service.team.length) service.published = false; }); members = members.filter(function (item) { return item.id !== person.id || item.supplierId !== account.id; }); write(EMPLOYEES, members); write(SERVICES, services); paint(); return; }
    person.active = person.active === false;
    if (!person.active) {
      services.forEach(function (service) {
        if (service.supplierId !== account.id || (service.teamMemberIds || []).indexOf(person.id) < 0) return;
        service.teamMemberIds = service.teamMemberIds.filter(function (id) { return id !== person.id; });
        service.team = (service.team || []).filter(function (member) { return member.employeeId !== person.id; });
        if (!service.team.length) service.published = false;
      });
    }
    write(EMPLOYEES, members); write(SERVICES, services); paint();
  });
  document.getElementById("toggleEmployeeDirectory").addEventListener("click", function (event) {
    var button = event.currentTarget, show = directory.hidden;
    directory.hidden = !show; button.setAttribute("aria-expanded", String(show));
    button.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i> Hide members' : '<i class="fa-solid fa-eye"></i> Show members';
  });
  paint();
  var focusId = params.get("id");
  if (focusId) window.setTimeout(function () { var target = document.getElementById("employee-" + focusId); if (target) { directory.hidden = false; target.classList.add("is-focused"); target.scrollIntoView({ behavior: "smooth", block: "center" }); } }, 150);
}());
