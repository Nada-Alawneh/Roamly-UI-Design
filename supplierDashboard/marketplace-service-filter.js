(function () {
  "use strict";
  var SERVICES = "roamly-market-services", REQUESTS = "roamly-market-requests";
  var types = {
    hiking: ["Local tourist guides", "Organizing mountain hiking routes", "Cave and valley exploration tours"],
    equipment: ["Camping equipment rental", "Mountain bike rental", "Climbing gear rental", "Kayak rental"],
    sports: ["Rafting trips", "Zip-line sessions", "Kayaking tours", "Outdoor training"],
    reserves: ["Nature reserve entry", "Safari tours", "Campsite booking", "Cabin stays"],
    transport: ["4x4 desert trips", "Remote area transfers", "Speedboat rental"]
  };
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  var category = document.getElementById("market-filter"), list = document.getElementById("market-list"), count = document.getElementById("market-count"), toolbar = document.querySelector(".market-toolbar");
  if (!category || !list || !toolbar) return;
  if (category.parentElement) category.parentElement.firstChild.textContent = "Provider category ";
  var label = document.createElement("label"); label.appendChild(document.createTextNode("Service type "));
  var select = document.createElement("select"); select.id = "market-subtype"; label.appendChild(select); toolbar.insertBefore(label, toolbar.children[1] || null);
  function updateOptions() {
    var keys = category.value === "all" ? Object.keys(types) : [category.value], choices = [];
    keys.forEach(function (key) { (types[key] || []).forEach(function (type) { if (choices.indexOf(type) < 0) choices.push(type); }); });
    var previous = select.value;
    select.innerHTML = '<option value="all">All services</option>' + choices.map(function (type) { return '<option value="' + type.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '">' + type + '</option>'; }).join("");
    if (choices.indexOf(previous) >= 0) select.value = previous;
    apply();
  }
  function apply() {
    var subtype = select.value, services = read(SERVICES, []), requests = read(REQUESTS, []), visible = 0;
    Array.from(list.querySelectorAll(".market-card")).forEach(function (card) {
      var title = card.querySelector("h2"), provider = card.querySelector(".market-card__provider"), tags = card.querySelectorAll(".supplier-tag");
      var service = services.find(function (item) { return title && provider && item.title === title.textContent && provider.textContent.indexOf(item.supplierName || "") === 0; });
      var hidden = (service && service.published === false) || (subtype !== "all" && (!tags[0] || tags[0].textContent !== subtype));
      card.hidden = Boolean(hidden); if (hidden) return; visible++;
      if (card.dataset.detailsAdded || !service) return;
      card.dataset.detailsAdded = "true";
      var extra = document.createElement("div"); extra.className = "market-service-extras";
      [["Included", service.included], ["Bring / prepare", service.requirements], ["Safety & cancellation", service.safety]].forEach(function (entry) {
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
      var bookingCount = document.createElement("div"); bookingCount.className = "market-booking-count";
      bookingCount.innerHTML = '<i class="fa-solid fa-calendar-check"></i> ' + requests.filter(function (request) { return request.serviceId === service.id && request.status === "Confirmed"; }).length + ' confirmed booking(s)';
      var price = card.querySelector(".market-card__meta"); if (price) price.insertAdjacentElement("beforebegin", bookingCount);
    });
    if (count) count.textContent = visible + " services";
  }
  category.addEventListener("change", updateOptions); select.addEventListener("change", apply);
  new MutationObserver(apply).observe(list, { childList: true, subtree: true });
  updateOptions();
}());
