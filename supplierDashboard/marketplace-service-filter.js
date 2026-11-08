(function () {
  "use strict";
  var SERVICES = "roamly-market-services", REQUESTS = "roamly-market-requests";
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  var params = new URLSearchParams(location.search), preferredServiceType = params.get("serviceType") || "", initialTypeApplied = false;
  var category = document.getElementById("market-filter"), list = document.getElementById("market-list"), count = document.getElementById("market-count"), toolbar = document.querySelector(".market-toolbar"), search = document.getElementById("market-search");
  if (!category || !list || !toolbar) return;
  if (category.parentElement) category.parentElement.firstChild.textContent = "Provider category ";
  var label = document.createElement("label"); label.appendChild(document.createTextNode("Service type "));
  var select = document.createElement("select"); select.id = "market-subtype"; label.appendChild(select); toolbar.insertBefore(label, toolbar.children[1] || null);
  function updateOptions() {
    var services = read(SERVICES, []), choices = [];
    services.forEach(function (service) {
      if (!service || service.published === false || (category.value !== "all" && service.category !== category.value)) return;
      var type = String(service.serviceType || "").trim();
      if (type && choices.indexOf(type) < 0) choices.push(type);
    });
    choices.sort(function (left, right) { return left.localeCompare(right); });
    var previous = select.value;
    select.innerHTML = '<option value="all">All services</option>' + choices.map(function (type) { return '<option value="' + type.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '">' + type + '</option>'; }).join("");
    if (choices.indexOf(previous) >= 0) select.value = previous;
    if (!initialTypeApplied && preferredServiceType && choices.indexOf(preferredServiceType) >= 0) select.value = preferredServiceType;
    initialTypeApplied = true;
    apply();
  }
  function apply() {
    var subtype = select.value, query = (search && search.value || "").trim().toLowerCase(), services = read(SERVICES, []), requests = read(REQUESTS, []), visible = 0;
    var cards = Array.from(list.querySelectorAll(".market-card"));
    cards.forEach(function (card) {
      var bookButton = card.querySelector("[data-book]"), service = services.find(function (item) { return bookButton && item.id === bookButton.dataset.book; });
      var hidden = !service || service.published === false || (subtype !== "all" && service.serviceType !== subtype) || (query && card.textContent.toLowerCase().indexOf(query) < 0);
      card.hidden = Boolean(hidden); if (hidden) return; visible++;
      if (card.dataset.detailsAdded || !service) return;
      card.dataset.detailsAdded = "true";
      var extra = document.createElement("div"); extra.className = "market-service-extras";
      [["Included", service.included], ["Bring / prepare", service.requirements], ["Safety & cancellation", service.safety], ["Availability", service.availability]].forEach(function (entry) {
        if (!entry[1]) return; var note = document.createElement("p"), heading = document.createElement("strong"), copy = document.createElement("span");
        heading.textContent = entry[0]; copy.textContent = entry[1]; note.appendChild(heading); note.appendChild(copy); extra.appendChild(note);
      });
      var team = card.querySelector(".market-team-list"), people = team ? team.querySelectorAll(".market-team-member") : [];
      (service.team || []).forEach(function (person, index) {
        if (!people[index]) return;
        var details = [];
        if (person.qualifications) details.push(person.qualifications);
        if (person.bio) details.push(person.bio);
        if (details.length) { var detail = document.createElement("small"); detail.className = "market-team-extra"; detail.textContent = details.join(" - "); people[index].appendChild(detail); }
      });
      if (extra.childElementCount && team) team.insertAdjacentElement("afterend", extra);
      var detailParts = [".market-service-details", ".market-category-details", ".market-team-list", ".market-inventory-note", ".market-service-extras"].map(function (selector) { return card.querySelector(selector); }).filter(Boolean);
      if (detailParts.length) {
        var disclosure = document.createElement("details"), summary = document.createElement("summary"), body = document.createElement("div");
        disclosure.className = "market-card__full-details"; summary.innerHTML = '<span><i class="fa-solid fa-list-check"></i> Full experience details</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>'; body.className = "market-card__full-details-body";
        detailParts.forEach(function (part) { body.appendChild(part); }); disclosure.appendChild(summary); disclosure.appendChild(body);
        var meta = card.querySelector(".market-card__meta"); if (meta) card.insertBefore(disclosure, meta); else card.appendChild(disclosure);
      }
      var bookingCount = document.createElement("div"); bookingCount.className = "market-booking-count";
      bookingCount.innerHTML = '<i class="fa-solid fa-calendar-check"></i> ' + requests.filter(function (request) { return request.serviceId === service.id && (request.status === "Confirmed" || request.status === "Completed"); }).length + ' booking(s)';
      var price = card.querySelector(".market-card__meta"); if (price) price.insertAdjacentElement("beforebegin", bookingCount);
      var bookButton = card.querySelector("[data-book]");
      if (bookButton) { bookButton.textContent = "Contact provider"; bookButton.classList.add("market-card__contact"); var more = document.createElement("button"); more.type = "button"; more.className = "btn-admin-secondary market-card__more"; more.dataset.marketDetails = service.id; more.textContent = "More details"; bookButton.insertAdjacentElement("beforebegin", more); }
    });
    if (count) count.textContent = visible + " services";
    var empty = document.getElementById("market-search-empty"); if (empty) empty.hidden = cards.length === 0 || visible > 0;
  }
  category.addEventListener("change", updateOptions); select.addEventListener("change", apply); if (search) search.addEventListener("input", apply);
  window.addEventListener("storage", function (event) { if (!event.key || event.key === SERVICES) updateOptions(); });
  new MutationObserver(apply).observe(list, { childList: true, subtree: true });
  updateOptions();
}());
