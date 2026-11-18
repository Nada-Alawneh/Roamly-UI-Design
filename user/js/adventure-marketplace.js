(function () {
  "use strict";
  var params = new URLSearchParams(location.search), destination = params.get("destination") || "", dateValue = params.get("travelDate") || "", travelers = params.get("travelers") || "", duration = params.get("duration") || "", plannerPage = "../user/ai-planner.html";
  var inbox = document.querySelector("[data-market-inbox]");
  if (inbox) {
    var showInbox = params.get("view") === "chats" || params.has("booking") || location.hash === "#booking-requests";
    inbox.hidden = !showInbox;
    document.querySelector("[data-market-catalog]").hidden = showInbox;
    document.querySelector("[data-market-hero]").hidden = showInbox;
  }
  var context = document.getElementById("travelerTripContext");
  var editLink = document.getElementById("editPlannerTrip"), tripParams = new URLSearchParams();
  ["origin", "destination", "travelDate", "travelers", "duration", "budget", "style", "providerStyle", "supplierId", "serviceType", "tripPace", "activityLevel", "tripNotes", "vibe", "companions", "experienceBudget", "priority", "interests"].forEach(function (key) {
    if (params.has(key)) tripParams.set(key, params.get(key));
  });
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
    if (params.get("origin")) parts.push("From " + params.get("origin"));
    if (params.get("budget")) parts.push(params.get("budget") + " budget");
    if (params.get("style")) parts.push(params.get("style") + " style");
    if (params.get("serviceType")) parts.push("Looking for " + params.get("serviceType"));
    if (params.get("tripPace")) parts.push(params.get("tripPace"));
    if (params.get("activityLevel")) parts.push(params.get("activityLevel"));
    document.getElementById("travelerTripMeta").textContent = parts.join(" · ");
  }
  var planPreview = document.getElementById("plannerItineraryPreview"), planDays = document.getElementById("plannerItineraryDays"), planContext = null;
  try { planContext = JSON.parse(sessionStorage.getItem("roamlyAdventurePlannerContext") || "null"); } catch (error) {}
  var planMatchesQuery = planContext && destination && planContext.destination === destination && (!dateValue || planContext.travelDate === dateValue) && (!travelers || String(planContext.travelers) === travelers) && (!params.get("serviceType") || planContext.experienceType === params.get("serviceType")) && (!params.get("supplierId") || String(planContext.supplierId) === params.get("supplierId")) && (!params.get("providerStyle") || planContext.providerStyle === params.get("providerStyle"));
  var hasGeneratedPlan = params.get("plannerDraft") !== "1" && planMatchesQuery && Array.isArray(planContext.itinerary) && planContext.itinerary.length > 0;
  if (hasGeneratedPlan && planPreview && planDays) {
    planPreview.hidden = false;
    planContext.itinerary.forEach(function (day) {
      var section = document.createElement("section"), heading = document.createElement("div"), title = document.createElement("strong"), date = document.createElement("span"), activities = document.createElement("ul");
      section.className = "market-itinerary-day"; heading.className = "market-itinerary-day__heading";
      title.textContent = day.title || "Trip day"; date.textContent = day.date || ""; heading.append(title, date);
      (day.activities || []).forEach(function (activity) { var item = document.createElement("li"); item.textContent = activity; activities.appendChild(item); });
      section.append(heading, activities); planDays.appendChild(section);
    });
  }
  if (hasGeneratedPlan) tripParams.set("resumePlan", "1");
  var returnHref = tripParams.size ? plannerPage + "?" + tripParams.toString() : plannerPage;
  var returnLink = document.getElementById("returnToGeneratedPlan"), headerBack = document.getElementById("marketHeaderBack");
  if (headerBack) headerBack.href = returnHref;
  if (returnLink && hasGeneratedPlan) { returnLink.href = returnHref; returnLink.hidden = false; }
  if (editLink) {
    tripParams.set("editTrip", "1");
    editLink.href = plannerPage + "?" + tripParams.toString();
  }
  var market = document.getElementById("market-list");
  var categoryPhotos = {
    hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=85",
    equipment: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=1200&q=85",
    sports: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85",
    reserves: "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=85",
    transport: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85"
  };
  var imageFallback = "../shared/assets/img/hero-featured.png";
  function safeImage(value, fallback) {
    try { var parsed = new URL(value, location.href); return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : fallback; }
    catch (error) { return fallback; }
  }
  function makeText(tag, className, value) { var node = document.createElement(tag); if (className) node.className = className; node.textContent = value || ""; return node; }
  document.addEventListener("click", function (event) {
    var more = event.target.closest("[data-market-details]"), contact = event.target.closest("[data-contact-from-details]");
    if (more) { var all = []; try { all = JSON.parse(localStorage.getItem("roamly-market-services") || "[]"); } catch (error) {} var service = all.find(function (item) { return item.id === more.dataset.marketDetails && item.published !== false; }); if (service) window.RoamlySupplierDetails.open(service); }
    if (contact) { var details = document.getElementById("market-details-dialog"), serviceId = details && details.dataset.serviceId, cardButton = Array.from(document.querySelectorAll("#market-list [data-book]")).find(function (item) { return item.dataset.book === serviceId; }); if (details && details.open) details.close(); if (cardButton) cardButton.click(); }
  });
  var marketplaceList = document.getElementById("market-list");
  if (marketplaceList) marketplaceList.addEventListener("click", function (event) {
    var book = event.target.closest("[data-book]"); if (!book) return;
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || sessionStorage.getItem("roamlyMarketplaceGuestEmail") || "").trim().toLowerCase(); if (!email) return;
    var requests = []; try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]"); } catch (error) {}
    var existing = requests.slice().reverse().find(function (request) { return String(request.travelerEmail || "").toLowerCase() === email && request.serviceId === book.dataset.book && (request.status === "Pending" || request.status === "Confirmed"); });
    if (!existing) return;
    event.preventDefault(); event.stopImmediatePropagation();
    var thread = Array.from(document.querySelectorAll(".request-card[data-request-id]")).find(function (item) { return item.dataset.requestId === existing.id; });
    if (thread) { thread.scrollIntoView({ behavior: "smooth", block: "center" }); var reply = thread.querySelector("[data-traveler-reply] input[name=reply]"); if (reply) window.setTimeout(function () { reply.focus(); }, 250); }
  }, true);
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
      if (company && company.phone && !card.querySelector(".market-company-contact")) {
        var contact = document.createElement("a"), details = card.querySelector(".market-card__full-details-body"), phoneLink = "tel:" + String(company.phone).replace(/[^0-9+]/g, "");
        contact.className = "market-company-contact"; contact.href = phoneLink; contact.innerHTML = '<i class="fa-solid fa-phone" aria-hidden="true"></i><span><small>Call the provider</small><strong></strong></span>'; contact.querySelector("strong").textContent = company.phone;
        if (details) details.appendChild(contact);
      }
    });
  }
  function formatMessageTime(value) {
    if (!value) return "";
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
  }
  var requestedThread = params.get("booking");
  function decorateTravelerThreads() {
    var host = document.getElementById("traveler-requests");
    if (!host) return;
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || sessionStorage.getItem("roamlyMarketplaceGuestEmail") || "").trim().toLowerCase();
    var account = [];
    try { account = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    var traveler = account.find(function (item) { return item.email === email; }), requests = [];
    try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]").filter(function (item) { return !item.tripOnly && item.travelerEmail === email; }); } catch (error) {}
    var openLatestThread = sessionStorage.getItem("roamlyOpenLatestThread") === "1";
    host.querySelectorAll(".request-card").forEach(function (card) {
      var request = requests.find(function (item) { return item.id === card.dataset.requestId; });
      if (!request) return;
      card.classList.add("traveler-request-card"); card.dataset.requestId = request.id;
      var header = card.querySelector(".request-card__header"), messagesHost = card.querySelector(".request-messages");
      if (!header || !messagesHost) return;
      var thread = card.closest(".market-chat");
      if (inbox && !thread) {
        thread = document.createElement("details");
        thread.className = "market-chat";
        thread.name = "supplier-chats";
        var title = document.createElement("summary");
        var supplier = document.createElement("strong");
        supplier.textContent = request.supplierName || "Provider";
        var experience = document.createElement("span");
        experience.textContent = (request.serviceTitle || "") + (request.date ? " · " + request.date : "");
        title.append(supplier, experience);
        thread.open = requestedThread === request.id || card.dataset.reopen === "true";
        card.before(thread);
        thread.append(title, card);
      }
      if (request.status === "Confirmed" && !request.packagePayment && !request.travelerConfirmedAt && !card.querySelector("[data-traveler-confirm-booking]")) {
        var confirmation = document.createElement("button"); confirmation.type = "button"; confirmation.className = "btn-gold traveler-confirm-booking"; confirmation.dataset.travelerConfirmBooking = request.id; confirmation.innerHTML = '<i class="fa-solid fa-calendar-check" aria-hidden="true"></i> Book this experience'; header.insertAdjacentElement("afterend", confirmation);
      }
      if (request.travelerConfirmedAt && !card.querySelector(".traveler-confirmed-note")) { var confirmedNote = makeText("p", "traveler-confirmed-note", "You confirmed this booking at USD " + (Number(request.agreedPrice) || 0).toFixed(2) + ". Your itinerary and checkout are ready."); header.insertAdjacentElement("afterend", confirmedNote); }
      if (request.status === "Confirmed" && !request.packagePayment && !card.querySelector(".traveler-payment-next-step")) {
        var nextStep = document.createElement("p"); nextStep.className = "traveler-payment-next-step";
        nextStep.textContent = "The provider accepted your request. Confirm the final price and payment method with them in this conversation before you travel. Roamly has not charged you.";
        header.insertAdjacentElement("afterend", nextStep);
      }
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
          ["Service type", request.serviceType || serviceSnapshot.serviceType], ["Starting point", (request.tripContext || {}).origin], ["Destination", (request.tripContext || {}).destination || request.destinationCountry],
          ["Preferred date", request.date], ["Party / quantity", request.travelers],
          ["Travel style", (request.tripContext || {}).style], ["Planned trip length", (request.tripContext || {}).duration], ["Trip budget", (request.tripContext || {}).budget], ["Preferred pace", (request.tripContext || {}).tripPace], ["Experience level", (request.tripContext || {}).activityLevel], ["Selected activity", (request.tripContext || {}).experienceType], ["Traveler preferences", (request.tripContext || {}).notes],
          ["Duration", serviceSnapshot.duration], ["Meeting point", serviceSnapshot.meetingPoint], ["Availability", serviceSnapshot.availability || service.availability],
          ["Team selected", (request.teamSnapshot || []).map(function (member) { return member.name; }).filter(Boolean).join(", ")],
          ["Price", serviceSnapshot.price ? (serviceSnapshot.currency || "USD") + " " + serviceSnapshot.price + " / " + (serviceSnapshot.priceUnit || "person") : "Provider to confirm"]
        ];
        var bookingImage = serviceSnapshot.coverImage || service.coverImage;
        if (bookingImage) {
          var image = document.createElement("img"); image.className = "traveler-booking-details__image";
          image.src = safeImage(bookingImage, imageFallback); image.alt = (serviceSnapshot.title || "Booked experience") + " photo";
          image.addEventListener("error", function () { image.src = imageFallback; }, { once: true }); body.appendChild(image);
        }
        var bookingDescription = serviceSnapshot.description || service.description;
        if (bookingDescription) { var description = document.createElement("p"), descriptionTitle = document.createElement("strong"), descriptionText = document.createElement("span"); description.className = "traveler-booking-details__description"; descriptionTitle.textContent = "Experience"; descriptionText.textContent = bookingDescription; description.appendChild(descriptionTitle); description.appendChild(descriptionText); body.appendChild(description); }
        rows.forEach(function (row) { if (!row[1]) return; var item = document.createElement("div"), label = document.createElement("span"), value = document.createElement("strong"); label.textContent = row[0]; value.textContent = row[1]; item.appendChild(label); item.appendChild(value); body.appendChild(item); });
        [["Included", serviceSnapshot.included], ["Preparation", serviceSnapshot.requirements], ["Safety and cancellation", serviceSnapshot.safety]].forEach(function (row) { if (!row[1]) return; var note = document.createElement("p"), title = document.createElement("strong"), text = document.createElement("span"); title.textContent = row[0]; text.textContent = row[1]; note.appendChild(title); note.appendChild(text); body.appendChild(note); });
        Object.keys(serviceSnapshot.categoryDetails || {}).forEach(function (key) { var value = serviceSnapshot.categoryDetails[key]; if (!value) return; var note = document.createElement("p"), title = document.createElement("strong"), text = document.createElement("span"); title.textContent = key.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) { return letter.toUpperCase(); }); text.textContent = value; note.appendChild(title); note.appendChild(text); body.appendChild(note); });
        if ((request.teamSnapshot || []).length) { var team = document.createElement("section"), teamTitle = document.createElement("strong"); team.className = "traveler-booking-details__team"; teamTitle.textContent = "Your experience team"; team.appendChild(teamTitle); request.teamSnapshot.forEach(function (member) { var person = document.createElement("p"), name = document.createElement("strong"), meta = document.createElement("span"), extras = [member.experience, member.languages, member.qualifications, member.bio].filter(Boolean); name.textContent = member.name + (member.role ? " · " + member.role : ""); meta.textContent = extras.join(" · "); person.appendChild(name); if (meta.textContent) person.appendChild(meta); team.appendChild(person); }); body.appendChild(team); }
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
    if (requestedThread) {
      var targetThread = Array.from(host.querySelectorAll(".request-card[data-request-id]")).find(function (card) {
        return card.dataset.requestId === requestedThread;
      });
      if (targetThread) {
        requestedThread = null;
        targetThread.classList.add("is-linked-request");
        targetThread.tabIndex = -1;
        window.setTimeout(function () {
          targetThread.scrollIntoView({ block: "center" });
          targetThread.focus({ preventScroll: true });
        }, 150);
      }
    } else if (openLatestThread) {
      var latestCard = host.querySelector(".request-card:last-of-type");
      if (latestCard) { sessionStorage.removeItem("roamlyOpenLatestThread"); latestCard.scrollIntoView({ behavior: "smooth", block: "center" }); var latestReply = latestCard.querySelector("[data-traveler-reply] input[name=reply]"); if (latestReply) window.setTimeout(function () { latestReply.focus(); }, 250); }
    }
  }
  function ensureTravelerConfirmDialog() {
    var dialog = document.getElementById("travelerConfirmBookingDialog");
    if (!dialog) { dialog = document.createElement("dialog"); dialog.id = "travelerConfirmBookingDialog"; dialog.className = "supplier-dialog"; dialog.innerHTML = '<form id="travelerConfirmBookingForm"><button class="dialog-close" type="button" data-close-confirm-booking aria-label="Close">×</button><p class="supplier-eyebrow">FINAL BOOKING CONFIRMATION</p><h2 id="travelerConfirmBookingTitle">Confirm with this provider</h2><p class="supplier-dialog-intro">Continue only after you and the provider have agreed on the final price in this conversation.</p><input type="hidden" name="requestId"><label class="supplier-field">Agreed final price (USD)<input type="number" name="agreedPrice" min="0.01" step="0.01" required placeholder="Enter the price agreed in chat"></label><label class="supplier-confirm-consent"><input type="checkbox" name="consent" required><span>I confirm the trip details and final price were agreed with the provider.</span></label><div class="supplier-dialog-actions"><button class="btn-admin-secondary" type="button" data-close-confirm-booking>Keep chatting</button><button class="btn-gold" type="submit">Confirm and return to my plan</button></div></form>'; document.body.appendChild(dialog); }
    return dialog;
  }
  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-traveler-confirm-booking]"), close = event.target.closest("[data-close-confirm-booking]");
    if (close) { var openDialog = document.getElementById("travelerConfirmBookingDialog"); if (openDialog && openDialog.open) openDialog.close(); }
    if (!button) return;
    var dialog = ensureTravelerConfirmDialog(), form = dialog.querySelector("form"), requests = [];
    try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]"); } catch (error) {}
    var request = requests.find(function (item) { return item.id === button.dataset.travelerConfirmBooking; }); if (!request || request.packagePayment || request.status !== "Confirmed") return;
    form.reset(); form.elements.requestId.value = request.id; dialog.querySelector("h2").textContent = "Confirm " + (request.serviceTitle || "this booking");
    form.elements.agreedPrice.value = request.agreedPrice || (request.serviceSnapshot && request.serviceSnapshot.price) || ""; var bookButton = form.querySelector('[type="submit"]'); if (bookButton) bookButton.textContent = "Book experience and return to my plan"; dialog.showModal();
  });
  document.addEventListener("submit", function (event) {
    var form = event.target.closest("#travelerConfirmBookingForm"); if (!form) return;
    event.preventDefault(); if (!form.reportValidity()) return;
    var requests = []; try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]"); } catch (error) {}
    var request = requests.find(function (item) { return item.id === form.elements.requestId.value && item.status === "Confirmed" && !item.packagePayment; }); if (!request) return;
    var amount = Number(form.elements.agreedPrice.value); if (!Number.isFinite(amount) || amount <= 0) return;
    request.agreedPrice = amount; request.travelerConfirmedAt = new Date().toISOString(); request.messages = request.messages || [];
    var accounts = []; try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || sessionStorage.getItem("roamlyMarketplaceGuestEmail") || "").trim().toLowerCase(), traveler = accounts.find(function (item) { return item.email === email; });
    request.messages.push({ from: traveler && traveler.name || "Traveler", senderRole: "traveler", text: "I confirm the booking at the agreed price of USD " + amount.toFixed(2) + ". I am returning to my itinerary to continue the checkout step.", at: request.travelerConfirmedAt });
    localStorage.setItem("roamly-market-requests", JSON.stringify(requests));
    var params = new URLSearchParams(location.search); params.set("resumePlan", "1"); params.set("continueCheckout", "1"); params.set("bookingId", request.id); params.set("agreedPrice", amount.toFixed(2));
    location.href = plannerPage + "?" + params.toString();
  });
  document.addEventListener("submit", function (event) { if (event.target && event.target.id === "booking-form" && event.submitter && event.submitter.value === "send") sessionStorage.setItem("roamlyOpenLatestThread", "1"); }, true);
  var bookingFormForContext = document.getElementById("booking-form");
  if (bookingFormForContext) bookingFormForContext.addEventListener("submit", function (event) {
    if (!event.submitter || event.submitter.value !== "send") return;
    window.setTimeout(function () {
      var requests = []; try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]"); } catch (error) {}
      var context = null; try { context = JSON.parse(sessionStorage.getItem("roamlyAdventurePlannerContext") || "null"); } catch (error) {}
      if (!context) return;
      var signedEmail = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || sessionStorage.getItem("roamlyMarketplaceGuestEmail") || "").trim().toLowerCase();
      var request = requests.slice().reverse().find(function (item) { return String(item.travelerEmail || "").toLowerCase() === signedEmail && item.serviceId === bookingFormForContext.elements.serviceId.value; });
      if (!request) return; request.tripContext = request.tripContext || {}; request.tripContext.tripPace = context.tripPace || ""; request.tripContext.activityLevel = context.activityLevel || ""; request.tripContext.experienceType = context.experienceType || ""; request.tripContext.itinerary = context.itinerary || request.tripContext.itinerary || [];
      var preferences = [["Style", context.style], ["Preferred pace", context.tripPace], ["Experience level", context.activityLevel], ["Selected activity", context.experienceType], ["Traveler preferences", context.tripNotes]].filter(function (row) { return row[1]; }).map(function (row) { return row[0] + ": " + row[1]; }).join("\n");
      if (preferences && request.message.indexOf("Trip preferences:") < 0) request.message += "\n\nTrip preferences:\n" + preferences;
      localStorage.setItem("roamly-market-requests", JSON.stringify(requests));
    }, 0);
  });
  function decorateMarketplace() { decorateServiceCards(); decorateTravelerThreads(); }
  decorateMarketplace();
  if (market) new MutationObserver(decorateMarketplace).observe(market, { childList: true, subtree: true });
  var requestHost = document.getElementById("traveler-requests");
  if (requestHost) new MutationObserver(decorateTravelerThreads).observe(requestHost, { childList: true, subtree: true });
  window.addEventListener("storage", decorateMarketplace);
}());

document.addEventListener("DOMContentLoaded", function () {
  var offerId = new URLSearchParams(location.search).get("offer");
  if (!offerId) return;
  var offer = window.RoamlyPlatform?.read("roamly-market-services", []).find(function (service) {
    return service.id === offerId && service.published !== false;
  });
  if (offer) window.RoamlySupplierDetails.open(offer);
});
