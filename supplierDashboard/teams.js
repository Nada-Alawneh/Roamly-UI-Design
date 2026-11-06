(function () {
  "use strict";
  var SERVICES = "roamly-market-services", REQUESTS = "roamly-market-requests", ACCOUNTS = "roamlyLocalAccounts";
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function esc(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function date(value) { if (!value) return "Not recorded"; var parsed = new Date(value + (String(value).length === 10 ? "T12:00:00" : "")); return isNaN(parsed.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed); }
  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
  var accounts = read(ACCOUNTS, []), account = accounts.find(function (item) { return item.email === email; });
  if (!account || account.role !== "supplier") { location.href = "../sign-in.html"; return; }
  if (!account.id) { account.id = "supplier-" + btoa(account.email).replace(/[^a-z0-9]/gi, "").slice(0, 16); }
  var params = new URLSearchParams(location.search), category = params.get("category") || "hiking", type = params.get("type") || "";
  var services = read(SERVICES, []), requests = read(REQUESTS, []), detailsDialog = document.getElementById("teamDetailsDialog");
  var categoryNames = { hiking: "Hiking & Trail Companies", equipment: "Outdoor Equipment Rentals", sports: "Water & Adventure Sports", reserves: "Nature Reserves & Campsites", transport: "Specialized Transport" };
  var categoryDetailLabels = { equipment: { rentalPeriod: "Rental period", equipmentCondition: "Equipment condition", includedItems: "Items included", pickupDelivery: "Collection or delivery" }, sports: { activityLevel: "Activity level", ageRequirements: "Age and participant requirements", safetyEquipment: "Safety equipment and instruction", weatherPolicy: "Weather and water conditions" }, reserves: { accessType: "Entry and access", siteFacilities: "Facilities and amenities", conservationRules: "Conservation and visitor rules", accommodationType: "Stay or campsite details" }, transport: { vehicleType: "Vehicle and onboard features", routeCoverage: "Route planning and pickup coordination", luggageCapacity: "Passenger and luggage capacity", driverCredentials: "Driver and operating credentials" } };
  if (!type) { location.href = "supplier-dashboard.html#" + category; return; }
  function seedCompletedHistory() {
    var seedKey = "roamlyCompletedHistory:" + account.id + ":" + category + ":" + type;
    if (localStorage.getItem(seedKey)) return;
    var offers = services.filter(function (service) { return service.supplierId === account.id && service.category === category && service.serviceType === type && service.published !== false && (category === "equipment" || (service.team || []).length); });
    if (!offers.length) return;
    var existingCount = requests.filter(function (request) { return request.supplierId === account.id && request.status === "Completed" && request.serviceType === type; }).length;
    var travelers = [
      { name: "Amelia Hart", email: "amelia.hart@outlook.com", destination: "Jordan", count: 2, message: "We are looking forward to our experience. Please confirm what is included and any arrival details we should know." },
      { name: "Luca Moretti", email: "luca.moretti@gmail.com", destination: "Portugal", count: 3, message: "Our group has different experience levels. Please confirm any participant requirements and what we should bring." }
    ];
    for (var i = existingCount; i < 2; i++) {
      var person = travelers[i], service = offers[i % offers.length], tripDate = new Date(Date.now() - (21 - i * 7) * 86400000), completedAt = new Date(tripDate.getTime() + 86400000), bookingId = "history-" + account.id + "-" + category + "-" + type.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + "-" + i;
      if (requests.some(function (request) { return request.id === bookingId; })) continue;
      var serviceSnapshot = {};
      ["title", "serviceType", "description", "price", "priceUnit", "duration", "difficulty", "capacity", "meetingPoint", "categoryDetails", "included", "requirements", "safety", "availability", "currency"].forEach(function (key) { serviceSnapshot[key] = service[key] || ""; });
      requests.push({ id: bookingId, serviceId: service.id, supplierId: account.id, supplierName: account.businessName || account.name, serviceTitle: service.title, serviceType: service.serviceType, destinationCountry: person.destination, serviceSnapshot: serviceSnapshot, teamSnapshot: (service.team || []).map(function (member) { return Object.assign({}, member); }), travelerEmail: person.email, travelerName: person.name, date: tripDate.toISOString().slice(0, 10), travelers: person.count, message: person.message, status: "Completed", createdAt: new Date(tripDate.getTime() - 30 * 86400000).toISOString(), completedAt: completedAt.toISOString(), messages: [
        { from: account.businessName || account.name, text: "Your team is confirmed. We will share the final meeting details and preparation notes before the trip.", at: new Date(tripDate.getTime() - 3 * 86400000).toISOString() },
        { from: person.name, text: "Thank you. We have reviewed the details and are ready for the experience.", at: new Date(tripDate.getTime() - 2 * 86400000).toISOString() },
        { from: account.businessName || account.name, text: "Thank you for joining us. The trip is now marked as completed. We hope you enjoyed the experience.", kind: "notification", at: completedAt.toISOString() }
      ] });
    }
    if (requests.filter(function (request) { return request.supplierId === account.id && request.status === "Completed" && request.serviceType === type; }).length >= 2) {
      localStorage.setItem(REQUESTS, JSON.stringify(requests));
      localStorage.setItem(seedKey, "1");
    }
  }
  seedCompletedHistory();
  document.getElementById("backFromTeams").href = "supplier-dashboard.html#" + encodeURIComponent(category);
  document.getElementById("teamsHeading").textContent = category === "equipment" ? type + " · Rental history" : type + " · Completed bookings";
  document.title = type + (category === "equipment" ? " rental history" : " completed bookings") + " | Roamly Supplier Studio";
  function serviceFor(request) { return services.find(function (service) { return service.id === request.serviceId && service.supplierId === account.id; }) || null; }
  function completedBookings() {
    return requests.filter(function (request) {
      var service = serviceFor(request), requestType = request.serviceType || (request.serviceSnapshot || {}).serviceType || (service || {}).serviceType;
      return request.supplierId === account.id && request.status === "Completed" && requestType === type && (!service || service.category === category);
    }).sort(function (a, b) { return String(b.completedAt || b.date || b.createdAt || "").localeCompare(String(a.completedAt || a.date || a.createdAt || "")); });
  }
  function section(title, content) { return content ? '<details class="completed-detail-section" name="completedBookingDetails"><summary>' + title + '</summary><div class="completed-detail-section__body">' + content + '</div></details>' : ""; }
  function detailRows(values) { return '<div class="completed-detail-grid">' + values.filter(function (item) { return item[1]; }).map(function (item) { return '<div><span>' + item[0] + '</span><strong>' + esc(item[1]) + '</strong></div>'; }).join("") + '</div>'; }
  function renderDetails(request) {
    var service = serviceFor(request) || {}, snapshot = request.serviceSnapshot || {}, trip = Object.assign({}, service, snapshot), team = request.teamSnapshot || service.team || [], priceUnit = trip.priceUnit || (category === "equipment" ? "item / day" : category === "reserves" ? "guest / night" : category === "transport" ? "vehicle" : "traveler"), partyLabel = category === "equipment" ? "Items booked" : category === "transport" ? "Passengers" : category === "reserves" ? "Guests" : "Travelers";
    var members = team.length ? '<div class="completed-team-list">' + team.map(function (member) { return '<article class="completed-team-member"><span class="team-member-detail__icon"><i class="fa-solid fa-user"></i></span><div><strong>' + esc(member.name) + '</strong><span>' + esc(member.role || "Team member") + (member.experience ? ' · ' + esc(member.experience) : '') + '</span><small>' + esc(member.languages || "Languages not recorded") + (member.qualifications ? ' · ' + esc(member.qualifications) : '') + '</small></div></article>'; }).join("") + '</div>' : '<p class="completed-empty-note">No team snapshot was saved with this booking.</p>';
    var notes = (trip.included ? '<p><strong>Included</strong>' + esc(trip.included) + '</p>' : '') + (trip.requirements ? '<p><strong>Traveler preparation</strong>' + esc(trip.requirements) + '</p>' : '') + (trip.safety ? '<p><strong>Safety and accessibility</strong>' + esc(trip.safety) + '</p>' : '') + (trip.availability ? '<p><strong>Availability at booking</strong>' + esc(trip.availability) + '</p>' : '');
    var fieldLabels = categoryDetailLabels[category] || {}, detailRowsForCategory = Object.keys(fieldLabels).map(function (key) { return [fieldLabels[key], (trip.categoryDetails || {})[key]]; }).filter(function (item) { return item[1]; }), categoryDetails = detailRowsForCategory.length ? detailRows(detailRowsForCategory) : "";
    var messages = [];
    if (request.message) messages.push('<article class="completed-message"><strong>' + esc(request.travelerName || "Traveler") + '</strong><p>' + esc(request.message) + '</p></article>');
    (request.messages || []).forEach(function (message) { messages.push('<article class="completed-message"><strong>' + esc(message.from || "Conversation") + (message.at ? ' · ' + esc(date(message.at)) : '') + '</strong><p>' + esc(message.text) + '</p></article>'); });
    var review = (service.ratings || []).find(function (item) { return item.travelerEmail === request.travelerEmail; });
    document.getElementById("teamDetailsContent").innerHTML = '<p class="supplier-eyebrow">' + (category === "equipment" ? "COMPLETED RENTAL · " : "COMPLETED BOOKING · ") + esc(request.id) + '</p><h2 id="teamDetailsTitle">' + esc(trip.title || request.serviceTitle || type) + '</h2><div class="team-detail-status-row"><span class="team-status"><i class="fa-solid fa-circle-check"></i> Completed</span><span class="team-details-subtitle">' + esc(categoryNames[category] || category) + ' · ' + esc(type) + '</span></div>' + section(category === "equipment" ? "Rental summary" : "Booking summary", detailRows([[category === "equipment" ? "Rental date" : "Travel date", date(request.date)], ["Destination", request.destinationCountry || "Not recorded"], [partyLabel, request.travelers], ["Price (" + priceUnit + ")", trip.price ? (trip.currency || "USD") + " " + trip.price : "Not recorded"], ["Booking completed", date(request.completedAt)]])) + section("Traveler", detailRows([["Name", request.travelerName], ["Email", request.travelerEmail]])) + section(category === "equipment" ? "Items rented" : "Booked experience", '<p class="completed-description">' + esc(trip.description || "No description was saved.") + '</p>' + detailRows([["Duration", trip.duration], [category === "sports" ? "Activity level" : category === "transport" ? "Route conditions" : "Difficulty", trip.difficulty], [category === "equipment" ? "Stock at time of booking" : category === "transport" ? "Passenger seats" : category === "reserves" ? "Guest capacity" : "Group capacity", trip.capacity], [category === "equipment" ? "Collection point" : "Meeting point", trip.meetingPoint]]) + (notes ? '<div class="completed-notes">' + notes + '</div>' : '')) + section(category === "equipment" ? "Rental details" : "Service-specific details", categoryDetails) + (category === "equipment" ? "" : section("Team assigned to this booking", members)) + section("Traveler and company conversation", messages.length ? '<div class="completed-messages">' + messages.join("") + '</div>' : '<p class="completed-empty-note">No messages were exchanged for this booking.</p>') + (review ? section("Traveler review", '<p class="completed-review"><i class="fa-solid fa-star"></i> ' + esc(review.value) + ' / 5</p>') : '');
    detailsDialog.showModal();
  }
  function renderCard(request) {
    var service = serviceFor(request) || {}, snapshot = request.serviceSnapshot || {}, title = snapshot.title || service.title || request.serviceTitle || type;
    return '<article class="completed-booking-card"><div class="completed-booking-card__main"><span class="team-status"><i class="fa-solid fa-circle-check"></i> Completed</span><h2>' + esc(title) + '</h2><p>' + esc(request.travelerName || "Traveler") + ' · ' + esc(date(request.date)) + (request.destinationCountry ? ' · ' + esc(request.destinationCountry) : '') + '</p></div><button class="supplier-small-btn" type="button" data-view-details="' + esc(request.id) + '"><i class="fa-regular fa-eye"></i> More details</button></article>';
  }
  function render() {
    var list = completedBookings();
    document.getElementById("teamDirectory").innerHTML = list.length ? list.map(renderCard).join("") : '<div class="supplier-empty completed-empty"><i class="fa-solid fa-clipboard-check"></i><h2>No completed bookings yet</h2><p>Once a confirmed trip is marked completed in Booking requests, it will appear here as a read-only record.</p></div>';
  }
  document.getElementById("teamDirectory").addEventListener("click", function (event) {
    var button = event.target.closest("[data-view-details]");
    if (!button) return;
    var request = requests.find(function (item) { return item.id === button.dataset.viewDetails && item.supplierId === account.id && item.status === "Completed"; });
    if (request) renderDetails(request);
  });
  detailsDialog.querySelectorAll("#closeTeamDetails, #closeTeamDetailsFooter").forEach(function (button) { button.addEventListener("click", function () { detailsDialog.close(); }); });
  window.addEventListener("storage", function (event) { if (event.key === SERVICES || event.key === REQUESTS) { services = read(SERVICES, []); requests = read(REQUESTS, []); render(); } });
  render();
}());
