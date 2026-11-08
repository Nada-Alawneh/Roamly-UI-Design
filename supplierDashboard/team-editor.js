(function () {
  "use strict";
  var EMPLOYEES = "roamly-supplier-employees", SERVICES = "roamly-market-services", ACCOUNTS = "roamlyLocalAccounts";
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]; }); }
  function values(value) { if (Array.isArray(value)) return value.reduce(function (all, item) { return all.concat(values(item)); }, []); if (typeof value === "string") return value.split(/[|,;]/).map(function (item) { return item.trim(); }).filter(Boolean); return value ? [String(value).trim()] : []; }
  function publicRecord(employee) { return { employeeId: employee.id, name: employee.name, role: employee.role, experience: employee.experience || "", languages: employee.languages || "", qualifications: employee.qualifications || "", bio: employee.bio || "" }; }

  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
  var accounts = read(ACCOUNTS, []), account = accounts.find(function (item) { return item.email === email; });
  if (!account || account.role !== "supplier") { location.href = "../sign-in.html"; return; }
  if (!account.id) { account.id = "supplier-" + btoa(account.email).replace(/[^a-z0-9]/gi, "").slice(0, 16); var accountIndex = accounts.findIndex(function (item) { return item.email === email; }); if (accountIndex >= 0) { accounts[accountIndex] = account; write(ACCOUNTS, accounts); } }

  var params = new URLSearchParams(location.search), category = params.get("category") || "hiking", type = params.get("type") || "", id = params.get("id");
  var services = read(SERVICES, []), allMembers = read(EMPLOYEES, []), members = allMembers.filter(function (person) { return person.supplierId === account.id; });
  var existing = id && services.find(function (service) { return service.id === id && service.supplierId === account.id; });
  if (!type && existing) type = existing.serviceType;
  var categoryNames = { hiking: "Hiking & Trail Companies", equipment: "Outdoor Equipment Rentals", sports: "Water & Adventure Sports", reserves: "Nature Reserves & Campsites", transport: "Specialized Transport" };
  if (!type || !categoryNames[category]) { location.href = "supplier-dashboard.html#hiking"; return; }

  var back = "supplier-dashboard.html#" + encodeURIComponent(category), form = document.getElementById("teamEditorForm"), publishDialog = document.getElementById("publishDialog");
  var menu = document.getElementById("employeeSelectMenu"), toggle = document.getElementById("employeeSelectToggle"), experiencePanel = document.getElementById("experienceFormPanel"), experienceToggle = document.getElementById("experienceFormToggle"), selectedIds = [], detailsReady = false;
  var categoryFields = {
    equipment: [["rentalPeriod", "Rental period", "For example: Per day · 24 hours"], ["equipmentCondition", "Equipment condition", "For example: Inspected before every rental"], ["includedItems", "Items included", "List sizes, accessories, and quantities"], ["pickupDelivery", "Collection or delivery", "Pickup point, delivery area, and return process"]],
    sports: [["activityLevel", "Activity level", "For example: Beginner-friendly · swimming ability required"], ["ageRequirements", "Age and participant requirements", "Minimum age, health, or experience guidance"], ["safetyEquipment", "Safety equipment and instruction", "Equipment provided and pre-activity briefing"], ["weatherPolicy", "Weather and water conditions", "How conditions are assessed and changes handled"]],
    reserves: [["accessType", "Entry and access", "Ticket, guided entry, or reservation details"], ["siteFacilities", "Facilities and amenities", "Restrooms, water, accessible paths, or utilities"], ["conservationRules", "Conservation and visitor rules", "Wildlife distance, waste, quiet hours, and restrictions"], ["accommodationType", "Stay or campsite details", "Pitch, cabin, occupancy, bedding, and check-in details"]],
    transport: [["vehicleType", "Vehicle and onboard features", "Vehicle class, accessibility, and onboard equipment"], ["routeCoverage", "Route planning and pickup", "Route and pickup coordination for the traveler's destination"], ["luggageCapacity", "Passenger and luggage capacity", "Passenger seats and luggage allowance"], ["driverCredentials", "Driver and operating credentials", "License, insurance, and operator qualifications"]]
  };
  var inventoryOnly = category === "equipment";

  function renderCategoryFields() {
    var host = document.getElementById("categorySpecificFields"), schema = categoryFields[category] || [];
    host.innerHTML = schema.map(function (field) { return '<label class="supplier-field">' + field[1] + '<input name="' + field[0] + '" maxlength="220" placeholder="' + field[2] + '"></label>'; }).join("");
    schema.forEach(function (field) { if (existing && form.elements[field[0]]) form.elements[field[0]].value = (existing.categoryDetails || {})[field[0]] || ""; });
    var difficulty = form.elements.difficulty, difficultyLabel = document.getElementById("difficultyField");
    difficulty.required = category === "hiking" || category === "sports" || category === "transport";
    difficultyLabel.hidden = inventoryOnly || category === "reserves";
    var capacityLabel = document.getElementById("capacityLabel");
    capacityLabel.textContent = inventoryOnly ? "Units in stock" : category === "reserves" ? "Maximum guests / occupancy" : category === "transport" ? "Passenger seats" : "Maximum travelers";
    var priceLabel = form.elements.price.closest("label");
    priceLabel.firstChild.textContent = inventoryOnly ? "Rental price (USD)" : category === "reserves" ? "Entry or stay price (USD)" : category === "transport" ? "Price per vehicle (USD)" : "Price per traveler (USD)";
    var durationLabel = form.elements.duration.closest("label"), meetingLabel = form.elements.meetingPoint.closest("label");
    durationLabel.firstChild.textContent = inventoryOnly ? "Rental period" : category === "reserves" ? "Visit or stay duration" : category === "transport" ? "Journey duration" : "Experience duration";
    meetingLabel.firstChild.textContent = inventoryOnly ? "Collection or delivery point " : category === "transport" ? "Pickup point " : category === "reserves" ? "Visitor arrival point " : "Meeting point ";
    if (existing) Object.keys(existing.categoryDetails || {}).forEach(function (key) { if (form.elements[key]) form.elements[key].value = existing.categoryDetails[key] || ""; });
  }
  renderCategoryFields();

  if (!inventoryOnly && existing) {
    selectedIds = Array.isArray(existing.teamMemberIds) ? existing.teamMemberIds.slice() : [];
    if (!selectedIds.length && Array.isArray(existing.team)) {
      existing.team.forEach(function (person) {
        var employee = members.find(function (item) { return String(item.name || "").trim().toLowerCase() === String(person.name || "").trim().toLowerCase(); });
        if (!employee) { employee = Object.assign({ id: person.employeeId || "employee-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), supplierId: account.id, active: true, createdAt: new Date().toISOString() }, person); members.push(employee); allMembers.push(employee); }
        if (selectedIds.indexOf(employee.id) < 0) selectedIds.push(employee.id);
      });
      write(EMPLOYEES, allMembers);
    }
  }

  document.getElementById("experienceTypePill").textContent = type;
  document.getElementById("backToTeams").href = back;
  document.getElementById("manageMembersLink").href = "employees.html?return=" + encodeURIComponent(location.pathname + location.search);
  document.title = (existing ? "Edit" : "Create") + (inventoryOnly ? " rental listing | Roamly" : " experience | Roamly");
  if (inventoryOnly) {
    document.getElementById("editorHeading").textContent = existing ? "Edit rental listing" : "Add rental listing";
    document.querySelector(".workflow-intro").textContent = "Add the rental details first, then review and publish your listing.";
    document.getElementById("detailsStepTitle").textContent = "Rental listing details";
    document.getElementById("publishSummary").textContent = "Review your rental listing before making it visible to travelers.";
    document.querySelector("#publishDialog h2").textContent = "Publish this rental listing?";
  } else if (existing) document.getElementById("editorHeading").textContent = "Edit experience";

  if (existing) ["title", "price", "duration", "difficulty", "capacity", "meetingPoint", "description", "coverImage", "included", "requirements", "safety", "availability"].forEach(function (key) { if (form.elements[key]) form.elements[key].value = existing[key] || ""; });

  function hasRequiredDetails(service) { return Boolean(service && service.title && service.price !== "" && service.duration && service.capacity && service.description && (!form.elements.difficulty.required || service.difficulty)); }
  detailsReady = hasRequiredDetails(existing);
  document.getElementById("memberAssignmentSection").hidden = inventoryOnly || !detailsReady;
  document.getElementById("assignmentLockedSection").hidden = inventoryOnly || detailsReady;
  document.getElementById("experienceSaveStatus").innerHTML = detailsReady ? '<i class="fa-solid fa-circle-check"></i> Details saved. You can update them here at any time.' : '<i class="fa-solid fa-circle-info"></i> Save these details to continue to employee selection.';
  document.getElementById("saveExperienceDetails").innerHTML = detailsReady ? '<i class="fa-solid fa-floppy-disk"></i> Save experience details' : '<i class="fa-solid fa-floppy-disk"></i> Save experience and continue';

  function updateExperiencePanelState() {
    var title = String(form.elements.title.value || "").trim(), summary = document.getElementById("experienceCollapsedSummary");
    summary.hidden = !detailsReady;
    document.getElementById("experienceCollapsedText").textContent = title ? title + " · $" + form.elements.price.value + " · " + form.elements.duration.value : "No details saved yet.";
    experienceToggle.innerHTML = experiencePanel.hidden ? (detailsReady ? '<i class="fa-solid fa-pen"></i> Edit experience details' : '<i class="fa-solid fa-plus"></i> Add experience details') : '<i class="fa-solid fa-chevron-up"></i> Hide details form';
    experienceToggle.setAttribute("aria-expanded", String(!experiencePanel.hidden));
  }
  updateExperiencePanelState();

  function memberSpecialties(person) { return ["serviceTypes", "serviceTypesText", "serviceType", "specialties", "specialty", "subServices", "subService"].reduce(function (all, key) { return all.concat(values(person[key])); }, []); }
  function hasSpecialty(person, specialty) { return memberSpecialties(person).some(function (item) { return item.toLowerCase() === String(specialty).trim().toLowerCase(); }); }
  function memberCategories(person) {
    var categories = [];
    ["serviceCategories", "serviceCategory", "category", "categories"].forEach(function (key) { values(person[key]).forEach(function (value) { if (categories.indexOf(value) < 0) categories.push(value); }); });
    services.forEach(function (service) {
      var memberOnService = (Array.isArray(service.teamMemberIds) && service.teamMemberIds.map(String).indexOf(String(person.id)) >= 0) || (Array.isArray(service.team) && service.team.some(function (member) { return String(member.employeeId || "") === String(person.id) || String(member.name || "").trim().toLowerCase() === String(person.name || "").trim().toLowerCase(); }));
      if (service.supplierId === account.id && memberOnService && categories.indexOf(service.category) < 0) categories.push(service.category);
    });
    if (hasSpecialty(person, type) && categories.indexOf(category) < 0) categories.push(category);
    return categories;
  }
  function memberFitsService(person) { return Boolean(person && person.active !== false && (memberCategories(person).indexOf(category) >= 0 || hasSpecialty(person, type))); }
  function selectedEmployees() { return selectedIds.map(function (employeeId) { return members.find(function (person) { return String(person.id) === String(employeeId) && memberFitsService(person); }); }).filter(Boolean); }

  function updateSelectionSummary(available) {
    var count = selectedEmployees().length, label = document.getElementById("selectedEmployeeCount");
    label.textContent = count ? count + " employee" + (count === 1 ? "" : "s") + " selected" : "No employees selected";
    document.getElementById("employeeSelectLabel").textContent = count ? count + " employee" + (count === 1 ? "" : "s") + " selected" : "Select employees";
    document.getElementById("assignmentPublishHint").textContent = count ? count + " active employee" + (count === 1 ? " is" : "s are") + " assigned to this experience." : "Select at least one active employee to publish this experience.";
    var all = document.getElementById("selectAllEmployees"), eligibleIds = available.map(function (person) { return String(person.id); }), selectedEligible = eligibleIds.filter(function (employeeId) { return selectedIds.map(String).indexOf(employeeId) >= 0; }).length;
    all.checked = eligibleIds.length > 0 && selectedEligible === eligibleIds.length;
    all.indeterminate = selectedEligible > 0 && selectedEligible < eligibleIds.length;
    document.getElementById("selectedEmployeeList").innerHTML = selectedEmployees().map(function (person) { return '<span class="selected-employee-chip"><i class="fa-solid fa-user-check"></i> ' + esc(person.name) + '<button type="button" data-remove-employee="' + esc(person.id) + '" aria-label="Remove ' + esc(person.name) + '">×</button></span>'; }).join("") || '<span class="selected-employee-empty">Your selected employees will appear here.</span>';
  }
  function buildServiceRecord(published) {
    var data = new FormData(form), now = new Date().toISOString(), categoryDetails = {};
    (categoryFields[category] || []).forEach(function (field) { categoryDetails[field[0]] = String(data.get(field[0]) || "").trim(); });
    var assigned = inventoryOnly ? [] : selectedEmployees();
    return Object.assign({}, existing || { id: "service-" + Date.now().toString(36), createdAt: now }, {
      supplierId: account.id, supplierName: account.businessName || account.name, category: category, serviceType: type,
      title: String(data.get("title") || "").trim(), description: String(data.get("description") || "").trim(), price: String(data.get("price") || ""),
      duration: String(data.get("duration") || "").trim(), difficulty: String(data.get("difficulty") || "").trim(), capacity: String(data.get("capacity") || "").trim(),
      meetingPoint: String(data.get("meetingPoint") || "").trim(), included: String(data.get("included") || "").trim(), requirements: String(data.get("requirements") || "").trim(),
      safety: String(data.get("safety") || "").trim(), availability: String(data.get("availability") || "").trim(), coverImage: String(data.get("coverImage") || "").trim(),
      categoryDetails: categoryDetails, teamMemberIds: assigned.map(function (person) { return person.id; }), team: assigned.map(publicRecord), published: Boolean(published), updatedAt: now
    });
  }
  function storeService(item) {
    var index = services.findIndex(function (service) { return service.id === item.id && service.supplierId === account.id; });
    if (index < 0) services.unshift(item); else services[index] = item;
    write(SERVICES, services); existing = item; id = item.id;
    var route = new URL(location.href); route.searchParams.set("id", item.id); history.replaceState(null, "", route.pathname + route.search + route.hash);
    document.getElementById("manageMembersLink").href = "employees.html?return=" + encodeURIComponent(location.pathname + location.search);
  }
  function renderEmployees() {
    var query = document.getElementById("employeeSearch").value.trim().toLowerCase();
    var eligible = members.filter(memberFitsService), visible = eligible.filter(function (person) { return [person.name, person.role, person.languages].concat(memberSpecialties(person)).join(" ").toLowerCase().indexOf(query) >= 0; });
    document.getElementById("noMembersMessage").hidden = eligible.length > 0;
    document.getElementById("employeeOptions").innerHTML = visible.map(function (person) {
      var checked = selectedIds.map(String).indexOf(String(person.id)) >= 0;
      return '<label class="employee-select-option"><input type="checkbox" data-employee-option="' + esc(person.id) + '" ' + (checked ? "checked" : "") + '><span><strong>' + esc(person.name) + '</strong><small>' + esc(person.role || "Team member") + (person.experience ? " · " + esc(person.experience) : "") + '</small></span><i class="fa-solid fa-check"></i></label>';
    }).join("") || (eligible.length ? '<p class="employee-select-no-results">No employees match this search.</p>' : "");
    updateSelectionSummary(eligible);
  }
  function saveDetailsAndContinue() {
    if (!form.reportValidity()) return;
    var wasPublished = Boolean(existing && existing.published), item = buildServiceRecord(wasPublished);
    storeService(item); detailsReady = true;
    experiencePanel.hidden = true; updateExperiencePanelState();
    document.getElementById("assignmentLockedSection").hidden = true;
    document.getElementById("experienceSaveStatus").innerHTML = '<i class="fa-solid fa-circle-check"></i> Experience saved. Now choose the employees who will deliver it.';
    document.getElementById("saveExperienceDetails").innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save experience details';
    if (inventoryOnly) { document.getElementById("publishSummary").textContent = "Rental listing: " + item.title + " · " + item.capacity + " units · $" + item.price + " per item/day."; publishDialog.showModal(); return; }
    document.getElementById("memberAssignmentSection").hidden = false;
    renderEmployees();
    document.getElementById("memberAssignmentSection").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("saveExperienceDetails").addEventListener("click", saveDetailsAndContinue);
  experienceToggle.addEventListener("click", function () {
    experiencePanel.hidden = !experiencePanel.hidden;
    updateExperiencePanelState();
    if (!experiencePanel.hidden) form.elements.title.focus();
  });
  form.addEventListener("submit", function (event) { event.preventDefault(); saveDetailsAndContinue(); });
  toggle.addEventListener("click", function () { var open = menu.hidden; menu.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); if (open) document.getElementById("employeeSearch").focus(); });
  document.addEventListener("click", function (event) { if (!event.target.closest(".employee-select-control")) { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); } });
  document.getElementById("employeeSearch").addEventListener("input", renderEmployees);
  document.getElementById("employeeOptions").addEventListener("change", function (event) {
    var input = event.target.closest("[data-employee-option]"); if (!input) return;
    var employeeId = input.dataset.employeeOption;
    selectedIds = selectedIds.filter(function (idValue) { return String(idValue) !== String(employeeId); });
    if (input.checked) selectedIds.push(employeeId);
    renderEmployees();
  });
  document.getElementById("selectAllEmployees").addEventListener("change", function (event) {
    var eligibleIds = members.filter(memberFitsService).map(function (person) { return String(person.id); });
    selectedIds = event.target.checked ? Array.from(new Set(selectedIds.map(String).concat(eligibleIds))) : selectedIds.filter(function (employeeId) { return eligibleIds.indexOf(String(employeeId)) < 0; });
    renderEmployees();
  });
  document.getElementById("selectedEmployeeList").addEventListener("click", function (event) {
    var button = event.target.closest("[data-remove-employee]"); if (!button) return;
    selectedIds = selectedIds.filter(function (employeeId) { return String(employeeId) !== String(button.dataset.removeEmployee); }); renderEmployees();
  });
  document.getElementById("refreshMembers").addEventListener("click", function () { allMembers = read(EMPLOYEES, []); members = allMembers.filter(function (person) { return person.supplierId === account.id; }); services = read(SERVICES, []); existing = id && services.find(function (service) { return service.id === id && service.supplierId === account.id; }) || existing; selectedIds = selectedIds.filter(function (employeeId) { return members.some(function (person) { return String(person.id) === String(employeeId); }); }); renderEmployees(); });
  document.getElementById("publishServiceButton").addEventListener("click", function () {
    if (!detailsReady) { document.getElementById("experienceDetailsSection").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (!form.reportValidity()) { document.getElementById("experienceDetailsSection").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (!inventoryOnly && !selectedEmployees().length) { menu.hidden = false; toggle.setAttribute("aria-expanded", "true"); document.getElementById("assignmentPublishHint").textContent = "Choose at least one active employee before publishing."; toggle.focus(); return; }
    var item = buildServiceRecord(true);
    document.getElementById("publishSummary").textContent = inventoryOnly ? "Rental listing: " + item.title + " · " + item.capacity + " units · $" + item.price + " per item/day." : "Experience: " + item.title + " · " + selectedEmployees().length + " employee" + (selectedEmployees().length === 1 ? "" : "s") + ". It will appear under " + categoryNames[category] + " for travelers.";
    publishDialog.showModal();
  });
  publishDialog.addEventListener("close", function () { if (publishDialog.returnValue !== "publish") return; storeService(buildServiceRecord(true)); location.href = back; });
  renderEmployees();
}());
