(function () {
  "use strict";
  var EMPLOYEES = "roamly-supplier-employees", SERVICES = "roamly-market-services", ACCOUNTS = "roamlyLocalAccounts";
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
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
  var back = "supplier-dashboard.html#" + encodeURIComponent(category), form = document.getElementById("teamEditorForm"), tableBody = document.getElementById("employeeTableBody"), tableWrap = document.getElementById("employeeTableWrap"), publishDialog = document.getElementById("publishDialog"), experienceDialog = document.getElementById("experienceDialog");
  var experienceKeys = ["title", "price", "duration", "difficulty", "capacity", "meetingPoint", "description", "coverImage", "included", "requirements", "safety", "availability"], experienceSnapshot = null, experienceSaved = false;
  var categoryFields = {
    equipment: [["rentalPeriod", "Rental period", "e.g. Per day · 24 hours"], ["equipmentCondition", "Equipment condition", "e.g. Professionally inspected before every rental"], ["includedItems", "Items included", "List sizes, accessories, and quantities"], ["pickupDelivery", "Collection or delivery", "Pickup point, delivery area, and return process"]],
    sports: [["activityLevel", "Activity level", "e.g. Beginner-friendly · swimming ability required"], ["ageRequirements", "Age and participant requirements", "Minimum age, health, or experience guidance"], ["safetyEquipment", "Safety equipment and instruction", "Equipment provided and pre-activity briefing"], ["weatherPolicy", "Weather and water conditions", "How conditions are assessed and changes handled"]],
    reserves: [["accessType", "Entry and access", "Ticket, guided entry, or reservation details"], ["siteFacilities", "Facilities and amenities", "Restrooms, water, accessible paths, or utilities"], ["conservationRules", "Conservation and visitor rules", "Wildlife distance, waste, quiet hours, and restrictions"], ["accommodationType", "Stay or campsite details", "Pitch, cabin, occupancy, bedding, and check-in details"]],
    transport: [["vehicleType", "Vehicle and onboard features", "Vehicle class, accessibility, and onboard equipment"], ["routeCoverage", "Route planning and pickup coordination", "Route planned for the traveler's selected destination; confirm pickup after booking"], ["luggageCapacity", "Passenger and luggage capacity", "Passenger seats and luggage allowance"], ["driverCredentials", "Driver and operating credentials", "License, insurance, and operator qualifications"]]
  };
  var inventoryOnly = category === "equipment";
  document.getElementById("memberAssignmentSection").hidden = inventoryOnly;
  function renderCategoryFields() {
    var host = document.getElementById("categorySpecificFields"), schema = categoryFields[category] || [];
    host.innerHTML = schema.map(function (field) { return '<label class="supplier-field">' + field[1] + '<input form="teamEditorForm" name="' + field[0] + '" maxlength="220" placeholder="' + field[2] + '"></label>'; }).join("") + '<label class="supplier-field">Cover image URL (optional)<input form="teamEditorForm" name="coverImage" type="url" maxlength="500" placeholder="https://example.com/your-service-photo.jpg"></label>';
    schema.forEach(function (field) { if (experienceKeys.indexOf(field[0]) < 0) experienceKeys.push(field[0]); if (existing && form.elements[field[0]]) form.elements[field[0]].value = (existing.categoryDetails || {})[field[0]] || ""; });
    var difficulty = document.querySelector('[form="teamEditorForm"][name="difficulty"]'), difficultyLabel = difficulty && difficulty.closest("label");
    if (difficultyLabel) { difficultyLabel.hidden = category === "equipment" || category === "reserves"; difficulty.required = category === "hiking" || category === "sports" || category === "transport"; }
    var capacityLabel = document.querySelector('[form="teamEditorForm"][name="capacity"]').closest("label");
    if (capacityLabel) capacityLabel.firstChild.textContent = category === "equipment" ? "Units in stock" : category === "reserves" ? "Maximum guests / occupancy" : category === "transport" ? "Passenger seats" : "Maximum travelers";
  }
  renderCategoryFields();
  var selectedIds = inventoryOnly ? [] : existing && Array.isArray(existing.teamMemberIds) ? existing.teamMemberIds.slice() : [];
  var rosterFiltersInitialized = false;

  if (!inventoryOnly && existing && !Array.isArray(existing.teamMemberIds) && (existing.team || []).length) {
    (existing.team || []).forEach(function (person) {
      var employee = members.find(function (item) { return item.name.trim().toLowerCase() === String(person.name || "").trim().toLowerCase(); });
      if (!employee) { employee = Object.assign({ id: "employee-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), supplierId: account.id, active: true, createdAt: new Date().toISOString(), email: "", phone: "" }, person); members.push(employee); allMembers.push(employee); }
      selectedIds.push(employee.id);
    });
    existing.teamMemberIds = selectedIds.slice();
    existing.team = selectedIds.map(function (employeeId) { var person = members.find(function (item) { return item.id === employeeId; }); return person ? publicRecord(person) : null; }).filter(Boolean);
    write(EMPLOYEES, allMembers); write(SERVICES, services);
  }
  document.getElementById("serviceType").value = type;
  document.getElementById("experienceTypePill").textContent = type;
  document.getElementById("backToTeams").href = back;
  document.getElementById("manageMembersLink").href = "employees.html?return=" + encodeURIComponent(location.pathname + location.search);
  document.title = (existing ? "Edit" : "Create") + (inventoryOnly ? " rental listing | Roamly" : " team offer | Roamly");
  if (inventoryOnly) { document.getElementById("editorHeading").textContent = existing ? "Edit rental listing" : "Add rental listing"; document.querySelector(".workflow-intro").textContent = "Set the rental price, stock quantity, item condition, collection details and return terms."; document.querySelector(".experience-summary-card h2").textContent = "Rental listing details"; document.querySelector(".experience-summary-card #experienceSummaryText").textContent = "Describe the equipment and rental terms travelers need."; document.getElementById("experienceTypePill").textContent = "Rental inventory"; experienceDialog.querySelector("h2").textContent = "Rental listing details"; experienceDialog.querySelector(".supplier-eyebrow").textContent = "TRAVELER-FACING RENTAL"; publishDialog.querySelector("h2").textContent = "Publish rental listing"; publishDialog.querySelector(".supplier-eyebrow").textContent = "READY FOR RENTERS?"; }
  var durationLabel = document.querySelector('[form="teamEditorForm"][name="duration"]').closest("label"), meetingLabel = document.querySelector('[form="teamEditorForm"][name="meetingPoint"]').closest("label"), priceLabel = document.querySelector('[form="teamEditorForm"][name="price"]').closest("label"), difficultyLabel = document.querySelector('[form="teamEditorForm"][name="difficulty"]').closest("label"), capacityInput = document.querySelector('[form="teamEditorForm"][name="capacity"]');
  durationLabel.firstChild.textContent = category === "equipment" ? "Rental period" : category === "reserves" ? "Visit or stay duration" : category === "transport" ? "Journey duration" : "Experience duration";
  meetingLabel.firstChild.textContent = category === "equipment" ? "Collection or delivery point" : category === "transport" ? "Pickup point" : category === "reserves" ? "Visitor arrival point" : "Meeting point (optional)";
  priceLabel.firstChild.textContent = category === "equipment" ? "Rental price (USD)" : category === "reserves" ? "Entry or stay price (USD)" : category === "transport" ? "Price per vehicle (USD)" : "Price per traveler (USD)";
  if (difficultyLabel) difficultyLabel.firstChild.textContent = category === "sports" ? "Activity level and suitability" : category === "transport" ? "Route conditions and suitability" : "Difficulty and suitability";
  if (capacityInput) capacityInput.placeholder = category === "equipment" ? "Available quantity" : category === "reserves" ? "Maximum guests / occupancy" : category === "transport" ? "Passenger seats" : "Maximum travelers";
  if (existing) {
    document.getElementById("editorHeading").textContent = inventoryOnly ? "Edit rental listing" : "Edit team offer";
    ["title", "price", "duration", "difficulty", "capacity", "meetingPoint", "description", "coverImage", "included", "requirements", "safety", "availability"].forEach(function (key) { if (form.elements[key]) form.elements[key].value = existing[key] || ""; });
  }
  function updateExperienceSummary() {
    var title = form.elements.title.value.trim(), price = form.elements.price.value, priceUnit = category === "equipment" ? "per item / day" : category === "reserves" ? "per guest / night" : category === "transport" ? "per vehicle" : "per traveler", quantity = category === "equipment" ? "available units" : category === "reserves" ? "guest capacity" : category === "transport" ? "passenger seats" : "travelers";
    document.getElementById("experienceSummaryText").textContent = title || "Add the offer details travelers need before they book.";
    document.getElementById("experienceSummaryPills").innerHTML = '<span class="supplier-tag">' + esc(type) + '</span>' + (price !== "" ? '<span class="supplier-tag">$' + esc(price) + ' ' + priceUnit + '</span>' : '<span class="supplier-tag">Price not set</span>') + (form.elements.capacity.value ? '<span class="supplier-tag">' + esc(form.elements.capacity.value) + ' ' + quantity + '</span>' : '<span class="supplier-tag">' + quantity + ' not set</span>');
    document.getElementById("openExperienceDetails").innerHTML = '<i class="fa-solid fa-pen"></i> ' + (inventoryOnly ? (title ? "Edit rental details" : "Add rental details") : (title ? "Edit service details" : "Add service details"));
  }
  function requiredExperienceValid() {
    var valid = true;
    document.querySelectorAll('[form="teamEditorForm"][required]').forEach(function (input) { if (!input.checkValidity()) valid = false; });
    return valid;
  }
  function renderMembers() {
    var categoryFilter = document.getElementById("employeeCategoryFilter"), typeFilter = document.getElementById("employeeTypeFilter"), search = document.getElementById("employeeSearch");
    var selectedCategory = categoryFilter ? categoryFilter.value : "all", selectedType = typeFilter ? typeFilter.value : "all", query = search ? search.value.trim().toLowerCase() : "";
    if (!rosterFiltersInitialized) { if (categoryFilter) selectedCategory = categoryFilter.value = category; if (typeFilter) selectedType = type; rosterFiltersInitialized = true; }
    var available = members.filter(function (person) { var cats = (person.serviceCategories || (person.category ? [person.category] : [])).slice(); services.forEach(function (service) { if (service.supplierId === account.id && (service.teamMemberIds || []).indexOf(person.id) >= 0 && cats.indexOf(service.category) < 0) cats.push(service.category); }); var types = person.serviceTypes || []; var searchable = [person.name, person.role, person.languages, person.qualifications, types.join(" ")].join(" ").toLowerCase(); return (person.active !== false || selectedIds.indexOf(person.id) >= 0) && (selectedCategory === "all" || cats.indexOf(selectedCategory) >= 0) && (selectedType === "all" || types.indexOf(selectedType) >= 0) && (!query || searchable.indexOf(query) >= 0); });
    if (typeFilter && categoryFilter) {
      var typeMap = { hiking: ["Local tourist guides", "Organizing mountain hiking routes", "Cave and valley exploration tours"], equipment: ["Camping equipment rental", "Mountain bike rental", "Climbing gear rental", "Kayak rental"], sports: ["Rafting trips", "Zip-line sessions", "Kayaking tours", "Outdoor training"], reserves: ["Nature reserve entry", "Safari tours", "Campsite booking", "Cabin stays"], transport: ["4x4 desert trips", "Remote area transfers", "Speedboat rental"] }, choices = typeMap[selectedCategory] || [];
      typeFilter.innerHTML = '<option value="all">All specialties</option>' + choices.map(function (item) { return '<option value="' + esc(item) + '">' + esc(item) + '</option>'; }).join("");
      if (selectedType !== "all" && choices.indexOf(selectedType) < 0) selectedType = typeFilter.value = "all"; else typeFilter.value = selectedType;
      available = available.filter(function (person) { var types = person.serviceTypes || []; return selectedType === "all" || types.indexOf(selectedType) >= 0; });
    }
    document.getElementById("selectedEmployeeCount").textContent = selectedIds.length + " selected · A team can include multiple members";
    document.getElementById("noMembersMessage").hidden = available.length > 0;
    tableBody.innerHTML = available.map(function (person) {
      var assigned = selectedIds.indexOf(person.id) >= 0, inactive = person.active === false;
      return '<tr class="' + (assigned ? "is-assigned " : "") + (inactive ? "is-inactive" : "") + '"><td><strong>' + esc(person.name) + '</strong>' + '<small>' + esc(person.role) + '</small></td><td>' + esc(person.experience || "Not added") + '</td><td>' + esc(person.languages || "Not added") + (person.qualifications ? '<small>' + esc(person.qualifications) + '</small>' : "") + '</td><td><button type="button" class="employee-assign-button ' + (assigned ? "is-assigned" : "") + '" data-assign-employee="' + esc(person.id) + '" ' + (inactive ? "disabled" : "") + '>' + (inactive ? "Inactive" : assigned ? "Assigned" : "Assign") + '</button></td><td><a class="employee-more-link" target="_blank" rel="noopener" href="employees.html?id=' + encodeURIComponent(person.id) + '#employee-' + encodeURIComponent(person.id) + '">More details <i class="fa-solid fa-arrow-up-right-from-square"></i></a></td></tr>';
    }).join("");
    updateExperienceSummary();
  }
  document.getElementById("openExperienceDetails").addEventListener("click", function () { experienceSnapshot = {}; experienceKeys.forEach(function (key) { experienceSnapshot[key] = form.elements[key].value; }); experienceSaved = false; experienceDialog.showModal(); });
  document.getElementById("closeExperienceDetails").addEventListener("click", function () { experienceDialog.close(); });
  document.getElementById("cancelExperienceDetails").addEventListener("click", function () { experienceDialog.close(); });
  document.getElementById("reviewPublishFromDetails").addEventListener("click", function () { if (!requiredExperienceValid()) { document.querySelector('[form="teamEditorForm"][required]:invalid').reportValidity(); return; } experienceSaved = true; updateExperienceSummary(); experienceDialog.close(); form.requestSubmit(); });
  experienceDialog.addEventListener("close", function () { if (!experienceSaved && experienceSnapshot) { experienceKeys.forEach(function (key) { form.elements[key].value = experienceSnapshot[key]; }); updateExperienceSummary(); } experienceSnapshot = null; });
  document.getElementById("toggleRoster").addEventListener("click", function (event) { var button = event.currentTarget, show = tableWrap.hidden; tableWrap.hidden = !show; button.setAttribute("aria-expanded", String(show)); button.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i> Hide members' : '<i class="fa-solid fa-eye"></i> Show members'; });
  tableBody.addEventListener("click", function (event) {
    var button = event.target.closest("[data-assign-employee]"); if (!button || button.disabled) return;
    var employeeId = button.dataset.assignEmployee;
    if (selectedIds.indexOf(employeeId) >= 0) selectedIds = selectedIds.filter(function (item) { return item !== employeeId; }); else selectedIds.push(employeeId);
    tableWrap.classList.remove("needs-team");
    renderMembers();
  });
  document.getElementById("refreshMembers").addEventListener("click", function () {
    services = read(SERVICES, []); members = read(EMPLOYEES, []).filter(function (person) { return person.supplierId === account.id; });
    if (id) existing = services.find(function (service) { return service.id === id && service.supplierId === account.id; }) || existing;
    var assigned = existing && Array.isArray(existing.teamMemberIds) ? existing.teamMemberIds : [];
    selectedIds = selectedIds.filter(function (employeeId) { return assigned.indexOf(employeeId) >= 0 || members.some(function (person) { return person.id === employeeId && person.active !== false; }); });
    assigned.forEach(function (employeeId) { if (selectedIds.indexOf(employeeId) < 0) selectedIds.push(employeeId); });
    renderMembers();
  });
  ["employeeSearch", "employeeCategoryFilter", "employeeTypeFilter"].forEach(function (id) { var control = document.getElementById(id); if (control) control.addEventListener(id === "employeeSearch" ? "input" : "change", renderMembers); });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!requiredExperienceValid()) { experienceDialog.showModal(); document.querySelector('[form="teamEditorForm"][required]:invalid').reportValidity(); return; }
    if (!selectedIds.length && !inventoryOnly) { tableWrap.hidden = false; document.getElementById("toggleRoster").setAttribute("aria-expanded", "true"); document.getElementById("toggleRoster").innerHTML = '<i class="fa-solid fa-eye-slash"></i> Hide members'; tableWrap.classList.add("needs-team"); tableWrap.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    tableWrap.classList.remove("needs-team");
    var data = new FormData(form);
    document.getElementById("publishSummary").textContent = inventoryOnly ? "Rental listing: " + String(data.get("title")) + " · " + String(data.get("capacity")) + " units available · $" + String(data.get("price")) + " per item/day. Travelers can check availability and send rental requests to your company." : "Offer: " + String(data.get("title")) + " · " + selectedIds.length + " team member" + (selectedIds.length === 1 ? "" : "s") + ". This will appear under " + categoryNames[category] + " and be visible to travelers planning any destination.";
    publishDialog.showModal();
  });
  publishDialog.addEventListener("close", function () {
    if (publishDialog.returnValue !== "publish") return;
    var selectedMembers = selectedIds.map(function (employeeId) { return members.find(function (person) { return person.id === employeeId; }); }).filter(Boolean);
    var data = new FormData(form), now = new Date().toISOString();
    var categoryDetails = {}; (categoryFields[category] || []).forEach(function (field) { categoryDetails[field[0]] = String(data.get(field[0]) || "").trim(); });
    var item = Object.assign({}, existing || { id: "service-" + Date.now().toString(36), createdAt: now }, {
      supplierId: account.id, supplierName: account.businessName || account.name, category: category, serviceType: type,
      title: String(data.get("title")).trim(), description: String(data.get("description")).trim(),
      price: String(data.get("price") || ""), duration: String(data.get("duration") || "").trim(), difficulty: String(data.get("difficulty") || "").trim(), capacity: String(data.get("capacity") || "").trim(),
      meetingPoint: String(data.get("meetingPoint") || "").trim(), included: String(data.get("included") || "").trim(), requirements: String(data.get("requirements") || "").trim(), safety: String(data.get("safety") || "").trim(),
      availability: String(data.get("availability") || "").trim(), coverImage: String(data.get("coverImage") || "").trim(), categoryDetails: categoryDetails, teamMemberIds: inventoryOnly ? [] : selectedIds.slice(), team: inventoryOnly ? [] : selectedMembers.map(publicRecord), published: true, updatedAt: now
    });
    var index = services.findIndex(function (service) { return service.id === item.id && service.supplierId === account.id; });
    if (index < 0) services.push(item); else services[index] = item;
    write(SERVICES, services);
    location.href = back;
  });
  renderMembers();
}());
