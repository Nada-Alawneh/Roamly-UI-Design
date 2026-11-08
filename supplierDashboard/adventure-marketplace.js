(function () {
  "use strict";
  var params = new URLSearchParams(location.search), destination = params.get("destination") || "", dateValue = params.get("travelDate") || "", travelers = params.get("travelers") || "", duration = params.get("duration") || "", plannerPage = location.pathname.indexOf("/supplierDashboard/") >= 0 ? "../ai-planner.html" : "ai-planner.html";
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
    if (params.get("origin")) parts.push("From " + params.get("origin"));
    if (params.get("budget")) parts.push(params.get("budget") + " budget");
    if (params.get("style")) parts.push(params.get("style") + " style");
    if (params.get("serviceType")) parts.push("Looking for " + params.get("serviceType"));
    if (params.get("tripPace")) parts.push(params.get("tripPace"));
    if (params.get("activityLevel")) parts.push(params.get("activityLevel"));
    document.getElementById("travelerTripMeta").textContent = parts.join(" · ");
    var editLink = document.getElementById("editPlannerTrip"), editParams = new URLSearchParams();
    ["origin", "destination", "travelDate", "travelers", "duration", "budget", "style", "providerStyle", "supplierId", "serviceType", "tripPace", "activityLevel", "tripNotes"].forEach(function (key) { if (params.has(key)) editParams.set(key, params.get(key)); });
    if (editLink) editLink.href = plannerPage + "?" + editParams.toString();
  }
  var planPreview = document.getElementById("plannerItineraryPreview"), planDays = document.getElementById("plannerItineraryDays"), planContext = null;
  try { planContext = JSON.parse(sessionStorage.getItem("roamlyAdventurePlannerContext") || "null"); } catch (error) {}
  var planMatchesQuery = planContext && destination && planContext.destination === destination && (!dateValue || planContext.travelDate === dateValue) && (!travelers || String(planContext.travelers) === travelers) && (!params.get("serviceType") || planContext.experienceType === params.get("serviceType")) && (!params.get("supplierId") || String(planContext.supplierId) === params.get("supplierId")) && (!params.get("providerStyle") || planContext.providerStyle === params.get("providerStyle"));
  if (planPreview && planDays && planMatchesQuery && Array.isArray(planContext.itinerary) && planContext.itinerary.length) {
    planPreview.hidden = false;
    planContext.itinerary.forEach(function (day) {
      var section = document.createElement("section"), heading = document.createElement("div"), title = document.createElement("strong"), date = document.createElement("span"), activities = document.createElement("ul");
      section.className = "market-itinerary-day"; heading.className = "market-itinerary-day__heading";
      title.textContent = day.title || "Trip day"; date.textContent = day.date || ""; heading.append(title, date);
      (day.activities || []).forEach(function (activity) { var item = document.createElement("li"); item.textContent = activity; activities.appendChild(item); });
      section.append(heading, activities); planDays.appendChild(section);
    });
    var returnParams = new URLSearchParams();
    ["origin", "destination", "travelDate", "travelers", "duration", "budget", "style", "providerStyle", "supplierId", "serviceType", "tripPace", "activityLevel", "tripNotes"].forEach(function (key) { if (params.has(key)) returnParams.set(key, params.get(key)); });
    returnParams.set("resumePlan", "1");
    var returnHref = plannerPage + "?" + returnParams.toString(), returnLink = document.getElementById("returnToGeneratedPlan"), headerBack = document.getElementById("marketHeaderBack");
    if (returnLink) { returnLink.href = returnHref; returnLink.hidden = false; }
    if (headerBack) { headerBack.href = returnHref; headerBack.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Return to your plan'; }
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
  function makeText(tag, className, value) { var node = document.createElement(tag); if (className) node.className = className; node.textContent = value || ""; return node; }
  function appendDetail(host, label, value) { if (value === undefined || value === null || String(value).trim() === "") return; var row = document.createElement("div"); row.className = "market-details-row"; row.append(makeText("span", "", label), makeText("strong", "", String(value))); host.appendChild(row); }
  function ensureDetailsDialog() {
    var dialog = document.getElementById("market-details-dialog"); if (dialog) return dialog;
    dialog = document.createElement("dialog"); dialog.id = "market-details-dialog"; dialog.className = "supplier-dialog market-details-dialog"; dialog.setAttribute("aria-labelledby", "marketDetailsTitle");
    dialog.innerHTML = '<div class="market-details-dialog__card"><button class="dialog-close" type="button" data-close-market-details aria-label="Close">×</button><p class="supplier-eyebrow">EXPERIENCE DETAILS</p><h2 id="marketDetailsTitle"></h2><div id="marketDetailsContent" class="market-details-dialog__content"></div><div class="supplier-dialog-actions"><button class="btn-admin-secondary" type="button" data-close-market-details>Close details</button><button class="btn-gold" type="button" data-contact-from-details>Contact this provider</button></div></div>';
    document.body.appendChild(dialog); return dialog;
  }
  function fillDetailsDialog(service) {
    var dialog = ensureDetailsDialog(), title = dialog.querySelector("#marketDetailsTitle"), content = dialog.querySelector("#marketDetailsContent"), imageUrl = safeImage(service.coverImage || "", imageFallback);
    title.textContent = service.title || service.serviceType || "Experience"; content.replaceChildren();
    if (service.coverImage) { var image = document.createElement("img"); image.className = "market-details-dialog__image"; image.src = imageUrl; image.alt = service.title || "Experience"; content.appendChild(image); }
    var summary = makeText("p", "market-details-dialog__description", service.description); content.appendChild(summary);
    var basic = document.createElement("section"); basic.className = "market-details-dialog__section"; basic.appendChild(makeText("h3", "", "Experience overview"));
    [["Provider", service.supplierName], ["Experience type", service.serviceType], ["Category", service.category], ["Price", service.price ? "USD " + service.price + (service.category === "equipment" ? " / item per day" : service.category === "reserves" ? " / guest per night" : service.category === "transport" ? " / vehicle" : " / traveler") : "Ask provider"], ["Duration", service.duration], ["Difficulty and suitability", service.difficulty], ["Maximum capacity", service.capacity], ["Meeting point", service.meetingPoint], ["Availability", service.availability]].forEach(function (row) { appendDetail(basic, row[0], row[1]); }); content.appendChild(basic);
    var extraRows = [["What's included", service.included], ["What to bring", service.requirements], ["Safety and cancellation", service.safety]];
    extraRows.forEach(function (row) { if (!row[1]) return; var section = document.createElement("section"); section.className = "market-details-dialog__section"; section.appendChild(makeText("h3", "", row[0])); section.appendChild(makeText("p", "", row[1])); content.appendChild(section); });
    if (service.categoryDetails && Object.keys(service.categoryDetails).length) { var specific = document.createElement("section"); specific.className = "market-details-dialog__section"; specific.appendChild(makeText("h3", "", "Service-specific details")); Object.keys(service.categoryDetails).forEach(function (key) { appendDetail(specific, key.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) { return letter.toUpperCase(); }), service.categoryDetails[key]); }); content.appendChild(specific); }
    if ((service.team || []).length) { var team = document.createElement("section"); team.className = "market-details-dialog__section market-details-dialog__team"; team.appendChild(makeText("h3", "", "Your experience team")); service.team.forEach(function (person) { var member = document.createElement("article"); member.appendChild(makeText("strong", "", [person.name, person.role].filter(Boolean).join(" · "))); appendDetail(member, "Experience", person.experience); appendDetail(member, "Languages", person.languages); appendDetail(member, "Qualifications", person.qualifications); if (person.bio) member.appendChild(makeText("p", "", person.bio)); team.appendChild(member); }); content.appendChild(team); }
    var accounts = []; try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    var company = accounts.find(function (item) { return item.id === service.supplierId; });
    if (company && (company.businessDescription || company.phone)) { var about = document.createElement("section"); about.className = "market-details-dialog__section"; about.appendChild(makeText("h3", "", "About the provider")); if (company.businessDescription) about.appendChild(makeText("p", "", company.businessDescription)); if (company.phone) { var phone = document.createElement("a"); phone.className = "market-company-contact"; phone.href = "tel:" + String(company.phone).replace(/[^0-9+]/g, ""); phone.textContent = "Call " + company.phone; about.appendChild(phone); } content.appendChild(about); }
    dialog.dataset.serviceId = service.id;
  }
  document.addEventListener("click", function (event) {
    var more = event.target.closest("[data-market-details]"), close = event.target.closest("[data-close-market-details]"), contact = event.target.closest("[data-contact-from-details]");
    if (more) { var all = []; try { all = JSON.parse(localStorage.getItem("roamly-market-services") || "[]"); } catch (error) {} var service = all.find(function (item) { return item.id === more.dataset.marketDetails; }); if (service) { fillDetailsDialog(service); ensureDetailsDialog().showModal(); } }
    if (close) { var detailsDialog = document.getElementById("market-details-dialog"); if (detailsDialog && detailsDialog.open) detailsDialog.close(); }
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
  function decorateTravelerThreads() {
    var host = document.getElementById("traveler-requests");
    if (!host) return;
    var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || sessionStorage.getItem("roamlyMarketplaceGuestEmail") || "").trim().toLowerCase();
    var account = [];
    try { account = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    var traveler = account.find(function (item) { return item.email === email; }), requests = [];
    try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]").filter(function (item) { return item.travelerEmail === email; }); } catch (error) {}
    var openLatestThread = sessionStorage.getItem("roamlyOpenLatestThread") === "1";
    host.querySelectorAll(".request-card").forEach(function (card, index) {
      var request = requests[index]; if (!request) return;
      card.classList.add("traveler-request-card"); card.dataset.requestId = request.id;
      var header = card.querySelector(".request-card__header"), messagesHost = card.querySelector(".request-messages");
      if (!header || !messagesHost) return;
      if (request.status === "Confirmed" && !request.travelerConfirmedAt && !card.querySelector("[data-traveler-confirm-booking]")) {
        var confirmation = document.createElement("button"); confirmation.type = "button"; confirmation.className = "btn-gold traveler-confirm-booking"; confirmation.dataset.travelerConfirmBooking = request.id; confirmation.innerHTML = '<i class="fa-solid fa-calendar-check" aria-hidden="true"></i> Book this experience'; header.insertAdjacentElement("afterend", confirmation);
      }
      if (request.travelerConfirmedAt && !card.querySelector(".traveler-confirmed-note")) { var confirmedNote = makeText("p", "traveler-confirmed-note", "You confirmed this booking at USD " + (Number(request.agreedPrice) || 0).toFixed(2) + ". Your itinerary and checkout are ready."); header.insertAdjacentElement("afterend", confirmedNote); }
      if (request.status === "Confirmed" && !card.querySelector(".traveler-payment-next-step")) {
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
    if (openLatestThread) {
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
    var request = requests.find(function (item) { return item.id === button.dataset.travelerConfirmBooking; }); if (!request || request.status !== "Confirmed") return;
    form.reset(); form.elements.requestId.value = request.id; dialog.querySelector("h2").textContent = "Confirm " + (request.serviceTitle || "this booking");
    form.elements.agreedPrice.value = request.agreedPrice || (request.serviceSnapshot && request.serviceSnapshot.price) || ""; var bookButton = form.querySelector('[type="submit"]'); if (bookButton) bookButton.textContent = "Book experience and return to my plan"; dialog.showModal();
  });
  document.addEventListener("submit", function (event) {
    var form = event.target.closest("#travelerConfirmBookingForm"); if (!form) return;
    event.preventDefault(); if (!form.reportValidity()) return;
    var requests = []; try { requests = JSON.parse(localStorage.getItem("roamly-market-requests") || "[]"); } catch (error) {}
    var request = requests.find(function (item) { return item.id === form.elements.requestId.value && item.status === "Confirmed"; }); if (!request) return;
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
