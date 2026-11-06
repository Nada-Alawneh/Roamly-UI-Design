(function () {
  "use strict";
  var params = new URLSearchParams(location.search), destination = params.get("destination") || "", dateValue = params.get("travelDate") || "", travelers = params.get("travelers") || "", duration = params.get("duration") || "";
  var context = document.getElementById("travelerTripContext");
  if (context && (destination || dateValue || travelers || duration)) {
    context.hidden = false;
    document.getElementById("travelerTripDestination").textContent = destination ? "Your trip to " + destination : "Your planned adventure";
    var parts = [];
    if (dateValue) {
      var date = new Date(dateValue + "T12:00:00");
      parts.push(isNaN(date.getTime()) ? dateValue : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date));
    }
    if (duration) parts.push(duration);
    if (travelers) parts.push(travelers + (Number(travelers) === 1 ? " traveler" : " travelers"));
    document.getElementById("travelerTripMeta").textContent = parts.join(" · ");
    var editLink = context.querySelector("a"), editParams = new URLSearchParams();
    ["destination", "travelDate", "travelers", "duration", "budget", "style"].forEach(function (key) { if (params.has(key)) editParams.set(key, params.get(key)); });
    if (editLink) editLink.href = "ai-planner.html?" + editParams.toString();
  }
  var market = document.getElementById("market-list");
  var categoryPhotos = {
    hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85",
    equipment: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85",
    sports: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85",
    reserves: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=85",
    transport: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"
  };
  var imageFallback = location.pathname.indexOf("/supplierDashboard/") >= 0 ? "../assets/img/hero-featured.png" : "assets/img/hero-featured.png";
  function safeImage(value, fallback) {
    try { var parsed = new URL(value, location.href); return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : fallback; }
    catch (error) { return fallback; }
  }
  function decorateServiceCards() {
    if (!market) return;
    var services = [];
    try { services = JSON.parse(localStorage.getItem("roamly-market-services") || "[]"); } catch (error) {}
    var accounts = [];
    try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    market.querySelectorAll(".market-card").forEach(function (card) {
      var button = card.querySelector("[data-book]"), service = button && services.find(function (item) { return item.id === button.dataset.book; });
      if (!service) return;
      if (!card.querySelector(".market-card__image")) {
        var imageWrap = document.createElement("div"), image = document.createElement("img"), badge = document.createElement("span");
        imageWrap.className = "market-card__image"; image.loading = "lazy"; image.alt = service.title + " experience";
        image.src = safeImage(service.coverImage || categoryPhotos[service.category] || "", imageFallback);
        image.addEventListener("error", function () { if (image.src !== new URL(imageFallback, location.href).href) image.src = imageFallback; }, { once: true });
        badge.className = "market-card__image-label"; badge.textContent = service.category === "equipment" ? "Ready to rent" : "Meet your next experience";
        imageWrap.appendChild(image); imageWrap.appendChild(badge);
        var top = card.querySelector(".market-card__top"); if (top) card.insertBefore(imageWrap, top);
      }
      var company = accounts.find(function (item) { return item.id === service.supplierId; }), provider = card.querySelector(".market-card__provider");
      if (company && company.businessDescription && provider && !card.querySelector(".market-company-summary")) {
        var summary = document.createElement("p"); summary.className = "market-company-summary"; summary.textContent = company.businessDescription; provider.insertAdjacentElement("afterend", summary);
      }
    });
  }
  function formatMessageTime(value) {
    if (!value) return "";
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
  }
  function decorateTravelerThreads() {
    var host = document.getElementById("traveler-requests");
    if (!host) return;
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").trim().toLowerCase();
    var account = [];
    try { account = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    var traveler = account.find(function (item) { return item.email === email; }), requests = [];
    try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]").filter(function (item) { return item.travelerEmail === email; }); } catch (error) {}
    host.querySelectorAll(".request-card").forEach(function (card, index) {
      var request = requests[index]; if (!request) return;
      card.classList.add("traveler-request-card"); card.dataset.requestId = request.id;
      var header = card.querySelector(".request-card__header"), messagesHost = card.querySelector(".request-messages");
      if (!header || !messagesHost) return;
      if (request.message) header.querySelectorAll("p").forEach(function (paragraph) { if (paragraph.textContent.trim() === String(request.message).trim()) paragraph.remove(); });
      var serviceSnapshot = request.serviceSnapshot || {}, service = [];
      try { service = JSON.parse(localStorage.getItem("roamly-market-services") || "[]").find(function (item) { return item.id === request.serviceId; }) || {}; } catch (error) {}
      var details = card.querySelector(".traveler-booking-details");
      if (!details) {
        details = document.createElement("details"); details.className = "traveler-booking-details"; details.name = "travelerBookingDetails";
        var summary = document.createElement("summary"); summary.textContent = "Booking details";
        var body = document.createElement("div"); body.className = "traveler-booking-details__body";
        var rows = [
          ["Request reference", request.id],
          ["Provider company", request.supplierName], ["Service", serviceSnapshot.title || request.serviceTitle || service.title],
          ["Service type", request.serviceType || serviceSnapshot.serviceType], ["Destination", request.destinationCountry],
          ["Preferred date", request.date], ["Party / quantity", request.travelers],
          ["Travel style", (request.tripContext || {}).style], ["Planned trip length", (request.tripContext || {}).duration], ["Trip budget", (request.tripContext || {}).budget],
          ["Duration", serviceSnapshot.duration], ["Meeting point", serviceSnapshot.meetingPoint],
          ["Team selected", (request.teamSnapshot || []).map(function (member) { return member.name; }).filter(Boolean).join(", ")],
          ["Price", serviceSnapshot.price ? (serviceSnapshot.currency || "USD") + " " + serviceSnapshot.price + " / " + (serviceSnapshot.priceUnit || "person") : "Provider to confirm"]
        ];
        rows.forEach(function (row) { if (!row[1]) return; var item = document.createElement("div"), label = document.createElement("span"), value = document.createElement("strong"); label.textContent = row[0]; value.textContent = row[1]; item.appendChild(label); item.appendChild(value); body.appendChild(item); });
        [["Included", serviceSnapshot.included], ["Preparation", serviceSnapshot.requirements], ["Safety and cancellation", serviceSnapshot.safety]].forEach(function (row) { if (!row[1]) return; var note = document.createElement("p"), title = document.createElement("strong"), text = document.createElement("span"); title.textContent = row[0]; text.textContent = row[1]; note.appendChild(title); note.appendChild(text); body.appendChild(note); });
        Object.keys(serviceSnapshot.categoryDetails || {}).forEach(function (key) { var value = serviceSnapshot.categoryDetails[key]; if (!value) return; var note = document.createElement("p"), title = document.createElement("strong"), text = document.createElement("span"); title.textContent = key.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) { return letter.toUpperCase(); }); text.textContent = value; note.appendChild(title); note.appendChild(text); body.appendChild(note); });
        details.appendChild(summary); details.appendChild(body); header.insertAdjacentElement("afterend", details);
      }
      var chatSignature = JSON.stringify([request.message, request.messages || []]);
      if (messagesHost.dataset.chatSignature !== chatSignature) {
        messagesHost.classList.add("traveler-chat-thread"); messagesHost.replaceChildren();
        var chatHeading = document.createElement("strong"); chatHeading.className = "traveler-chat-heading"; chatHeading.textContent = "Conversation with " + (request.supplierName || "the provider company"); messagesHost.appendChild(chatHeading);
        var entries = [];
        if (request.message) entries.push({ from: traveler && traveler.name || request.travelerName || "You", text: request.message, at: request.createdAt, senderRole: "traveler" });
        (request.messages || []).forEach(function (message) { entries.push(message); });
        if (!entries.length) entries.push({ from: "Roamly", text: "Send a message to the provider company to discuss your request.", kind: "notification" });
        entries.forEach(function (message) {
          var mine = message.senderRole === "traveler" || message.from === (traveler && traveler.name), bubble = document.createElement("article"), heading = document.createElement("div"), sender = document.createElement("strong"), time = document.createElement("time"), text = document.createElement("p");
          bubble.className = "traveler-chat-message" + (mine ? " is-traveler" : " is-company") + (message.kind === "notification" ? " is-notice" : "");
          sender.textContent = mine ? "You" : (message.from || request.supplierName || "Provider company"); time.textContent = formatMessageTime(message.at); if (message.at) time.dateTime = message.at;
          heading.appendChild(sender); if (message.at) heading.appendChild(time); text.textContent = message.text || ""; bubble.appendChild(heading); bubble.appendChild(text); messagesHost.appendChild(bubble);
        });
        messagesHost.dataset.chatSignature = chatSignature;
      }
    });
  }
  function decorateMarketplace() { decorateServiceCards(); decorateTravelerThreads(); }
  decorateMarketplace();
  if (market) new MutationObserver(decorateMarketplace).observe(market, { childList: true, subtree: true });
  var requestHost = document.getElementById("traveler-requests");
  if (requestHost) new MutationObserver(decorateTravelerThreads).observe(requestHost, { childList: true, subtree: true });
  window.addEventListener("storage", decorateMarketplace);
  if (market) market.addEventListener("click", function (event) {
    if (!event.target.closest("[data-book]")) return;
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").trim();
    if (email) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var next = "adventure-marketplace.html" + location.search;
    location.href = "sign-in.html?next=" + encodeURIComponent(next);
  }, true);
}());
