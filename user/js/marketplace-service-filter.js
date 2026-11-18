(function () {
  "use strict";
  var SERVICES = "roamly-market-services", REQUESTS = "roamly-market-requests";
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  var params = new URLSearchParams(location.search), preferredServiceType = params.get("serviceType") || "", initialTypeApplied = false;
  var category = document.getElementById("market-filter"), list = document.getElementById("market-list"), count = document.getElementById("market-count"), toolbar = document.querySelector(".market-toolbar"), search = document.getElementById("market-search");
  if (!category || !list || !toolbar) return;
  var more = document.getElementById("market-more"), pageSize = 6, limit = pageSize;
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
    select.replaceChildren(new Option("All services", "all"), ...choices.map(function (type) { return new Option(type, type); }));
    if (choices.indexOf(previous) >= 0) select.value = previous;
    if (!initialTypeApplied && preferredServiceType && choices.indexOf(preferredServiceType) >= 0) select.value = preferredServiceType;
    initialTypeApplied = true;
    apply();
  }
  function apply() {
    var subtype = select.value, query = (search && search.value || "").trim().toLowerCase(), services = read(SERVICES, []), requests = read(REQUESTS, []), matched = 0;
    var cards = Array.from(list.querySelectorAll(".market-card"));
    cards.forEach(function (card) {
      var bookButton = card.querySelector("[data-book]"), service = services.find(function (item) { return bookButton && item.id === bookButton.dataset.book; });
      var searchable = service && [service.title, service.titleAr, service.serviceType, service.supplierName, service.description, service.descriptionAr].join(" ").toLowerCase();
      var hidden = !service || service.published === false || (subtype !== "all" && service.serviceType !== subtype) || (query && !searchable.includes(query));
      if (!hidden) matched++;
      card.hidden = Boolean(hidden || (more && matched > limit));
      if (card.hidden) return;
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
      if (bookButton) { bookButton.textContent = "Contact provider"; bookButton.classList.add("market-card__contact"); var detailsButton = document.createElement("button"); detailsButton.type = "button"; detailsButton.className = "btn-admin-secondary market-card__more"; detailsButton.dataset.marketDetails = service.id; detailsButton.textContent = "More details"; bookButton.insertAdjacentElement("beforebegin", detailsButton); }
    });
    if (count) {
      var shown = more ? Math.min(limit, matched) : matched;
      var arabic = document.documentElement.lang === "ar";
      var description = arabic ? "عرض " + shown + " من " + matched : "Showing " + shown + " of " + matched;
      if (count.textContent !== description) count.textContent = description;
    }
    if (more) more.hidden = matched <= limit;
    var empty = document.getElementById("market-search-empty"); if (empty) empty.hidden = cards.length === 0 || matched > 0;
  }
  function reset() { limit = pageSize; apply(); }
  category.addEventListener("change", function () { limit = pageSize; updateOptions(); });
  select.addEventListener("change", reset);
  if (search) search.addEventListener("input", reset);
  document.getElementById("market-sort")?.addEventListener("change", reset);
  if (more) more.addEventListener("click", function () { limit += pageSize; apply(); });
  window.addEventListener("storage", function (event) { if (!event.key || event.key === SERVICES) updateOptions(); });
  new MutationObserver(apply).observe(list, { childList: true, subtree: true });
  updateOptions();
}());
