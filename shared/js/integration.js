(function () {
  "use strict";
  const P = window.RoamlyPlatform,
    I = window.RoamlyI18n,
    C = window.RoamlyCommerce;
  if (!P || !I || !C) return;
  const ar = () => I.language === "ar",
    text = (en, arabic) => (ar() ? arabic : en);
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const usd = (cents) =>
    new Intl.NumberFormat(ar() ? "ar-JO" : "en-US", { style: "currency", currency: "USD" }).format(
      cents / 100,
    );
  const id = () => crypto.randomUUID();
  Object.assign(I.dictionary, {
    experience: ["Book Experience & Pay", "احجز التجربة وادفع"],
    submit: ["Confirm booking request", "تأكيد طلب الحجز"],
  });
  let active = null;
  let selection = new Set();
  let lastValues = null;
  let offers = [];
  let order = "match";
  let visibleOfferCount = 6;
  const form = document.querySelector("[data-planner-form]");
  const dayList = document.querySelector("[data-day-list]");
  const summary = document.getElementById("planner-offers");
  const plan = document.querySelector("[data-plan]");
  const offersById = () => new Map(offers.map(({ service, cents }) => [service.id, cents]));
  const selectedTotal = () => {
    const prices = offersById();
    return [...selection].reduce((sum, serviceId) => sum + (prices.get(serviceId) || 0), 0);
  };
  const limit = () => Math.round(active.budget * active.travelers * 100);
  const compareText = (a, b) => String(a || "").localeCompare(String(b || ""), "en");

  function tripEnd() {
    const end = new Date(active.date + "T12:00:00Z");
    if (Number.isNaN(end.getTime())) return "";
    end.setUTCDate(end.getUTCDate() + active.days - 1);
    return end.toISOString().slice(0, 10);
  }

  function existingTripPayment() {
    return P.read("roamly-market-requests", []).find((booking) =>
      booking.packagePayment && booking.bookingGroupId &&
      booking.tripContext?.itinerary?.id === active.id && booking.travelerEmail === P.email());
  }

  function renderTripPayment() {
    if (!plan || plan.hidden) return;
    const essentials = window.plannerEssentials(active.travelers);
    const experiences = selectedTotal();
    const total = essentials.reduce((sum, line) => sum + line.cents, experiences);
    plan.querySelector("[data-trip-experiences]").textContent = usd(experiences);
    plan.querySelector("[data-trip-combined]").textContent = usd(total);
    const button = plan.querySelector("[data-trip-payment]");
    const payment = existingTripPayment();
    button.disabled = false;
    button.textContent = payment
      ? text("Review trip payment", "راجع دفعة الرحلة")
      : text("Review unified payment", "راجع الدفع الموحّد");
    const status = plan.querySelector("[data-trip-payment-status]");
    status.replaceChildren();
    const selected = plan.querySelector("[data-plan-experiences]");
    selected.replaceChildren();
    selected.innerHTML = offers.filter(({ service }) => selection.has(service.id))
      .map((offer) => showOffer(offer, true)).join("");
  }

  function tripDates() {
    const start = new Date(active.date + "T12:00:00Z");
    if (Number.isNaN(start.getTime())) return "";
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + active.days - 1);
    return new Intl.DateTimeFormat(ar() ? "ar-JO" : "en-US", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
    }).formatRange(start, end);
  }

  function saveContext() {
    active.selectedIds = [...selection];
    P.write("roamlyLegacyPlan:" + P.email(), active);
    P.write("roamly-concierge-plan", active);
    if (active.packageBooking) sessionStorage.setItem("roamlyPlannerDraft", JSON.stringify(active));
  }

  function attachServices(values, newBooking = false) {
    if (!summary || !values.destination.trim()) return;
    lastValues = values;
    const saved = P.read("roamlyLegacyPlan:" + P.email(), null);
    const draft = JSON.parse(sessionStorage.getItem("roamlyPlannerDraft") || "null");
    const restoring = sessionStorage.getItem("roamlyPlannerContact") || sessionStorage.getItem("roamlyPlannerExplicitResume");
    const prior = restoring ? draft || saved : newBooking ? null : active || saved || draft;
    const days = Math.max(1, Math.min(10, parseInt(values.duration) || 6));
    const travelers = Math.max(1, Math.min(20, Number(values.travelers) || 1));
    const budget = Number(values.experienceBudget) || 200;
    const same = prior && prior.destination === values.destination && prior.date === values.travelDate &&
      prior.days === days && prior.travelers === travelers &&
      (window.RoamlyTripStyles.resolve(prior.style) || "Adventure & Nature") === values.style;
    const interests = (values.interests || "").split(/,\s*/).filter(Boolean);
    const accounts = new Map(P.read("roamlyLocalAccounts", []).map((account) => [account.id, account]));
    offers = C.services().filter((s) =>
      window.RoamlyTripStyles.supplierMatches(s, values.style, accounts) &&
      (!s.currency || s.currency === "USD") &&
      C.matchesPlannerDestination(s, values.destination) &&
      (!Number(s.capacity) || Number(s.capacity) >= travelers) &&
      (!values.supplierId || s.supplierId === values.supplierId) &&
      (!values.experienceType || window.RoamlySupplierServices.normalizeType(s.serviceType) === values.experienceType),
    ).map((service) => {
      const keywords = [service.category, service.title, service.description, service.serviceType].join(" ").toLowerCase();
      return {
        service,
        cents: Math.round(C.cost(service, travelers) * 100),
        interests: interests.filter((interest) => keywords.includes(interest.toLowerCase())),
      };
    }).filter(({ cents }) => cents <= Math.round(budget * travelers * 100));
    active = {
      ...values,
      id: !same ? id() : prior.id,
      destination: values.destination.trim(),
      date: values.travelDate,
      days,
      travelers,
      budget,
      budgetStyle: values.budget,
      serviceIds: offers.map(({ service }) => service.id),
      manualOfferSelection: true,
      offerBooking: true,
      packageBooking: true,
      offerDates: same ? { ...prior.offerDates } : {},
    };
    const prices = offersById();
    selection = new Set(
      same && prior.manualOfferSelection
        ? (prior.selectedIds || []).filter((serviceId) => prices.has(serviceId))
        : [],
    );
    if (selectedTotal() > limit()) selection.clear();
    saveContext();
    summary.hidden = false;
    renderOffers();
    renderTripPayment();
  }

  function showOffer({ service: s, cents }, final = false) {
    const checked = selection.has(s.id) ? " checked" : "";
    const title = ar() && s.titleAr ? s.titleAr : s.title;
    const description = ar() && s.descriptionAr ? s.descriptionAr : s.description;
    const facts = [
      ...(final ? [[text("Preferred date", "الموعد المفضّل"), active.offerDates[s.id] || active.date]] : []),
      [text("Activity type", "نوع النشاط"), final || !active.experienceType ? s.serviceType : ""],
      [text("Meeting point", "نقطة اللقاء"), s.meetingPoint || s.location],
      [text("Duration", "المدة"), s.duration],
      [text("Suitability", "الصعوبة والملاءمة"), s.difficulty],
      [text("Group capacity", "سعة المجموعة"), s.capacity || text("To be confirmed", "بحاجة لتأكيد")],
      [text("Availability notes", "ملاحظات التوفّر"), s.availability],
    ];
    const displayFacts = (final ? facts : facts.slice(0, 3)).filter(([, value]) => value).map(([label, value]) =>
      '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>',
    ).join("");
    const unit = C.priceUnitLabel(s);
    const quantity = s.category === "equipment"
      ? text("One item per traveler for one day.", "قطعة لكل مسافر ليوم واحد.")
      : s.category === "reserves"
      ? text("One night for your group.", "ليلة واحدة لمجموعتك.")
      : "";
    return '<article class="planner-offer' + (checked ? ' is-selected' : '') + '">' +
      '<div class="planner-offer__heading"><div><p class="planner-offer__provider">'+esc(s.supplierName || text("Local provider", "مورّد محلي"))+
      (s.isDemo ? ' · '+text("Sample offer", "عرض تجريبي") : "")+'</p><h3>'+esc(title)+'</h3></div><div class="planner-offer__price"><strong>'+esc(usd(cents))+'</strong><span>'+
      text("Group estimate", "تقدير للمجموعة")+'</span><small>'+esc(usd(Math.round(Number(s.price)*100))+" / "+unit)+'</small></div></div>'+
      (final && description ? '<p class="planner-offer__description">'+esc(description)+'</p>' : '')+
      (displayFacts ? '<dl class="planner-offer__facts">'+displayFacts+'</dl>' : '')+
      (quantity ? '<p class="planner-offer__quantity">'+quantity+'</p>' : '')+
      '<button class="btn btn--soft planner-supplier-details" type="button" data-planner-supplier-details="'+esc(s.id)+'">'+
      text("Supplier details", "تفاصيل المورّد")+'</button>'+
      (final ? "" : '<label class="planner-offer__select"><input type="checkbox" data-service-select="'+esc(s.id)+'"'+checked+'>'+
      text("Select this offer", "اختار هالعرض")+'<span class="sr-only"> '+esc(title)+'</span></label>'+
      '<label class="planner-offer__date"'+(checked ? '' : ' hidden')+'>'+text("Preferred date", "الموعد المفضّل")+
      '<input class="input" type="date" data-offer-date="'+esc(s.id)+'" value="'+esc(active.offerDates[s.id] || active.date)+
      '" min="'+esc(active.date)+'" max="'+esc(tripEnd())+'"></label>') + '</article>';
  }

  function renderOffers() {
    const sorted = [...offers].sort((a, b) =>
      (order === "price" ? a.cents - b.cents : Number(Boolean(a.service.isDemo)) - Number(Boolean(b.service.isDemo)) ||
        b.interests.length - a.interests.length || a.cents - b.cents) ||
      compareText(a.service.title, b.service.title) || compareText(a.service.id, b.service.id),
    );
    const shown = sorted.filter(({ service }, index) => index < visibleOfferCount || selection.has(service.id));
    summary.innerHTML =
      '<header class="planner-offers__head"><div><h2 id="planner-offers-title">'+text("Matching supplier offers", "عروض المورّدين المطابقة")+
      '</h2><p><bdi>'+esc(active.origin ? active.origin + " → " + active.destination : active.destination)+
      '</bdi> · '+esc([tripDates(), active.days + " " + text("days", "أيام"),
        active.travelers + " " + text("travelers", "مسافرين")].filter(Boolean).join(" · "))+'</p></div>'+
      '<a class="btn btn--soft" href="#planner-options">'+text("Edit trip", "عدّل الرحلة")+'</a></header>'+
      '<div class="planner-offers__criteria"><p>'+text("Experience budget for your group", "ميزانية التجارب للمجموعة")+
      ' <strong>'+esc(usd(limit()))+'</strong></p><p>'+esc(I.translate(active.style)) + " · " + esc(active.experienceType || text("Any matching activity", "كل الأنشطة المطابقة"))+'</p></div>'+
      (sorted.length
        ? '<div class="planner-offers__sort"><span>'+sorted.length+' '+text("matching offers", "عروض مطابقة")+'</span><label>'+
          text("Sort by", "رتّب حسب")+' <select class="input" data-offer-order><option value="match">'+text("Best match", "أفضل تطابق")+
          '</option><option value="price">'+text("Lowest group price", "أقل سعر للمجموعة")+'</option></select></label></div>'+
          '<div class="planner-offers__list">'+shown.map((offer) => showOffer(offer)).join("")+'</div>'+
          (shown.length < sorted.length ? '<button class="btn btn--soft planner-show-offers" type="button" data-show-more-offers>'+
            text("Show more offers", "اعرض عروض أكثر")+' · '+(sorted.length - shown.length)+'</button>' : "")
        : '<p class="planner-offers__empty">'+text(
          "No priced offers match this trip style, destination, group and budget yet. You can still build your itinerary.",
          "لسّه ما في عروض بسعر واضح بتطابق ستايل الرحلة والوجهة والمجموعة والميزانية. لسّه بتقدر تبني برنامج رحلتك.",
        )+'</p>')+
      '<div class="planner-offers__review"><div class="planner-offers__total"><p role="status" data-offer-total></p>'+
      '<button class="btn btn--primary" type="button" data-build-trip>'+
      text("Build my itinerary", "ابنِ برنامج رحلتي")+'</button></div>'+
      '<p class="planner-offers__feedback" role="status" data-offer-feedback></p></div>'+
      '<p class="planner-tool-status" role="status" id="planner-tool-feedback"></p>';
    const sort = summary.querySelector("[data-offer-order]");
    if (sort) sort.value = order;
    updateSelection();
    const bookings = P.read("roamly-market-requests", []).filter((booking) =>
      !booking.tripOnly && booking.status !== "Inquiry" && booking.tripContext?.itinerary?.id === active.id && booking.travelerEmail === P.email(),
    );
    if (bookings.length) {
      const updates = document.createElement("div");
      updates.className = "rx-notice";
      const title = document.createElement("strong");
      title.textContent = text("Booking updates", "تحديثات الحجز");
      updates.append(title);
      for (const booking of bookings) {
        const row = document.createElement("p");
        row.textContent = booking.serviceTitle + " · " + I.translate(booking.status);
        updates.append(row);
      }
      const track = document.createElement("a");
      track.className = "rx-link";
      track.href = "adventure-marketplace.html?view=chats";
      track.textContent = text("Track requests", "تابع طلباتك");
      updates.append(track);
      for (const group of new Set(bookings.filter((booking) => booking.payment && !booking.tripContext?.itinerary?.offerBooking)
        .map((booking) => booking.bookingGroupId).filter(Boolean))) {
        const link = document.createElement("a");
        link.className = "rx-link";
        link.href = "payment.html?group=" + encodeURIComponent(group);
        link.textContent = text("View receipt", "عرض الإيصال");
        updates.append(link);
      }
      summary.querySelector(".planner-offers__review").before(updates);
    }
    I.apply();
  }

  function updateSelection() {
    const total = summary.querySelector("[data-offer-total]");
    total.textContent = selection.size
      ? selection.size + " " + text("selected", "محددة") + " · " + usd(selectedTotal())
      : text("No supplier offers selected", "ما اخترت عروض مورّدين");
  }

  window.addEventListener("roamly:planrendered", (e) => attachServices(e.detail));
  window.addEventListener("roamly:offersrequested", (event) => {
    visibleOfferCount = 6;
    attachServices(event.detail, true);
    sessionStorage.removeItem("roamlyPlannerExplicitResume");
    if (!summary.hidden) summary.focus();
    const contact = sessionStorage.getItem("roamlyPlannerContact");
    if (contact && P.account()) {
      sessionStorage.removeItem("roamlyPlannerContact");
      summary.querySelector('[data-planner-supplier-details="' + CSS.escape(contact) + '"]')?.click();
    }
  });
  if (form && summary) {
    const draftKey = () => "roamlyPlannerSavedDraft:" + (P.email() || "guest");
    const resumeDraft = form.querySelector("[data-resume-trip-draft]");
    resumeDraft.hidden = !P.read(draftKey(), null);
    resumeDraft.addEventListener("click", () => {
      const draft = P.read(draftKey(), null);
      if (!draft?.values || !draft.plan) return;
      sessionStorage.setItem("roamlyPendingPlanner", JSON.stringify(draft.values));
      sessionStorage.setItem("roamlyPlannerDraft", JSON.stringify(draft.plan));
      sessionStorage.setItem("roamlyPlannerExplicitResume", "1");
      location.href = "ai-planner.html?resume=1";
    });

    function renderSupplierActions(actions, dialog, offer) {
      const serviceId = offer.service.id;
      const status = document.createElement("p");
      status.className = "supplier-action-status";
      status.dataset.plannerDialogAction = "";
      status.setAttribute("role", "status");
      const save = document.createElement("button");
      save.type = "button";
      save.className = "btn-admin-secondary";
      save.dataset.plannerDialogAction = "";
      save.textContent = text("Save trip draft", "احفظ مسودة الرحلة");
      save.addEventListener("click", () => {
        try {
          P.write(draftKey(), { values: lastValues, plan: { ...active, selectedIds: [...selection] } });
          resumeDraft.hidden = false;
          status.textContent = text("Draft saved in this browser.", "انحفظت المسودة بهالمتصفح.");
        } catch {
          status.textContent = text("Could not save the draft.", "تعذّر حفظ المسودة.");
        }
      });
      const choose = document.createElement("button");
      choose.type = "button";
      choose.className = "btn-gold";
      choose.dataset.plannerDialogAction = "";
      choose.textContent = selection.has(serviceId)
        ? text("Back to selected offers", "ارجع للعروض المختارة")
        : text("Add offer to trip", "ضيف العرض للرحلة");
      choose.addEventListener("click", () => {
        const choice = summary.querySelector('[data-service-select="' + CSS.escape(serviceId) + '"]');
        if (choice && !choice.checked) choice.click();
        if (!selection.has(serviceId)) {
          status.textContent = text("This offer exceeds your remaining experience budget.", "العرض بتجاوز الميزانية المتبقّية للتجارب.");
          return;
        }
        dialog.close();
      });
      actions.append(save, choose, status);
    }

    function renderSupplierConversation(content, dialog, service) {
      const section = document.createElement("section");
      section.className = "planner-supplier-conversation";
      const heading = document.createElement("h3");
      heading.textContent = text("Contact supplier", "تواصل مع المورّد");
      section.append(heading);
      content.prepend(section);

      const traveler = P.account();
      if (service.isDemo) {
        const note = document.createElement("p");
        note.textContent = text("Practice conversation. No supplier will reply to demo messages.", "محادثة للتجربة. ما رح يوصلك رد على الرسائل التجريبية.");
        section.append(note);
      }
      if (!traveler || traveler.role !== "traveler") {
        const link = document.createElement("a");
        link.className = "btn btn--soft";
        link.href = "sign-in.html?next=ai-planner.html";
        link.textContent = text("Sign in to contact the supplier", "سجّل دخولك لتتواصل مع المورّد");
        link.addEventListener("click", () => {
          sessionStorage.setItem("roamlyPendingPlanner", JSON.stringify(lastValues));
          sessionStorage.setItem("roamlyPlannerContact", service.id);
        });
        section.append(link);
        return;
      }

      const thread = document.createElement("div");
      thread.className = "planner-supplier-thread";
      thread.setAttribute("role", "log");
      const form = document.createElement("form");
      const label = document.createElement("label");
      label.textContent = text("Your question", "سؤالك");
      const message = document.createElement("textarea");
      message.className = "input";
      message.required = true;
      message.maxLength = 600;
      message.rows = 2;
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "btn btn--primary";
      submit.textContent = text("Send question", "ابعث السؤال");
      label.append(message);
      const status = document.createElement("p");
      status.setAttribute("role", "status");
      form.append(label, submit, status);
      section.append(thread, form);

      const owns = (request) => request.travelerEmail === P.email() &&
        request.serviceId === service.id && request.supplierId === service.supplierId &&
        request.tripContext?.itinerary?.id === active.id;
      function renderThread() {
        thread.replaceChildren();
        for (const request of P.read("roamly-market-requests", []).filter(owns)) {
          for (const entry of request.messages || []) {
            const row = document.createElement("p");
            row.textContent = (entry.from ? entry.from + " · " : "") + entry.text;
            thread.append(row);
          }
        }
      }

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const body = message.value.trim();
        if (!body || P.email() !== traveler.email.toLowerCase()) return;
        if (!C.services().some((offer) => offer.id === service.id && offer.supplierId === service.supplierId)) {
          status.textContent = text("This offer is no longer available.", "هالعرض ما عاد متاح.");
          return;
        }
        const requests = P.read("roamly-market-requests", []);
        let request = requests.findLast((item) => owns(item) && ["Inquiry", "Pending", "Confirmed"].includes(item.status));
        const now = new Date().toISOString();
        if (!request) {
          request = {
            id: "inquiry-" + id(), serviceId: service.id, supplierId: service.supplierId,
            supplierName: service.supplierName, serviceTitle: service.title, serviceType: service.serviceType,
            category: service.category, travelerEmail: P.email(), travelerName: traveler.name,
            travelers: active.travelers, date: active.offerDates[service.id] || active.date,
            destinationCountry: active.destination, status: "Inquiry", message: body, messages: [], createdAt: now,
            tripContext: { destination: active.destination, itinerary: { id: active.id } },
          };
          requests.push(request);
        }
        request.messages = [...(request.messages || []), { from: traveler.name, text: body, at: now }];
        try {
          P.write("roamly-market-requests", requests);
          message.value = "";
          status.textContent = text("Question saved in this conversation.", "انحفظ سؤالك بهالمحادثة.");
          renderThread();
        } catch {
          status.textContent = text("Could not save the question. Try again.", "تعذّر حفظ السؤال. جرّب مرة ثانية.");
        }
      });

      function updateThread(event) {
        if (event.key === "roamly-market-requests") renderThread();
      }
      window.addEventListener("storage", updateThread);
      dialog.addEventListener("close", () => window.removeEventListener("storage", updateThread), { once: true });
      renderThread();
    }

    function openSupplierDetails(event) {
      const trigger = event.target.closest("[data-planner-supplier-details]");
      if (!trigger) return;
      const offer = offers.find(({ service }) => service.id === trigger.dataset.plannerSupplierDetails);
      if (!offer) return;
      const email = P.email();
      const booking = email && P.read("roamly-market-requests", []).filter((item) =>
        item.travelerEmail === email && item.serviceId === offer.service.id &&
        item.tripContext?.itinerary?.id === active.id,
      ).at(-1);
      window.RoamlySupplierDetails.open(offer.service, {
        groupTotal: offer.cents,
        bookingStatus: booking?.status === "Inquiry" ? "" : booking?.status,
        decorate: (content, dialog) => renderSupplierConversation(content, dialog, offer.service),
        renderActions: plan.contains(trigger) ? undefined : (actions, dialog) => renderSupplierActions(actions, dialog, offer),
      });

    }
    summary.addEventListener("click", openSupplierDetails);
    summary.addEventListener("click", (event) => {
      if (!event.target.closest("[data-show-more-offers]")) return;
      const known = new Set([...summary.querySelectorAll("[data-service-select]")].map((input) => input.dataset.serviceSelect));
      visibleOfferCount += 6;
      renderOffers();
      [...summary.querySelectorAll("[data-planner-supplier-details]")].find((button) =>
        !known.has(button.dataset.plannerSupplierDetails),
      )?.focus();
    });
    plan.addEventListener("click", openSupplierDetails);
    summary.addEventListener("change", (e) => {
      const input = e.target;
      if (!active) return;
      if (input.matches("[data-offer-order]")) {
        order = input.value;
        renderOffers();
        summary.querySelector("[data-offer-order]").focus();
        return;
      }
      if (input.matches("[data-offer-date]")) {
        if (!input.value || !input.reportValidity()) {
          input.value = active.offerDates[input.dataset.offerDate] || active.date;
          return;
        }
        active.offerDates[input.dataset.offerDate] = input.value;
        if (plan) plan.hidden = true;
        saveContext();
        return;
      }
      if (!input.matches("[data-service-select]")) return;
      const key = input.dataset.serviceSelect;
      const feedback = summary.querySelector("[data-offer-feedback]");
      feedback.textContent = "";
      if (input.checked && selectedTotal() + (offersById().get(key) || 0) > limit()) {
        input.checked = false;
        input.closest(".planner-offer").append(feedback);
        feedback.textContent = text(
          "This would exceed your group’s experience budget. Deselect an offer or edit your budget.",
          "هالعرض برفع الاختيارات فوق ميزانية المجموعة. شيل عرض من اختياراتك أو عدّل الميزانية.",
        );
        return;
      }
      if (input.checked) selection.add(key);
      else selection.delete(key);
      const card = input.closest(".planner-offer");
      card.classList.toggle("is-selected", input.checked);
      card.querySelector(".planner-offer__date").hidden = !input.checked;
      if (plan) plan.hidden = true;
      saveContext();
      updateSelection();
    });
    plan.addEventListener("click", (event) => {
      if (!event.target.closest("[data-trip-payment]") || !active || plan.hidden) return;
      const payment = existingTripPayment();
      if (payment) {
        const bookings = P.read("roamly-market-requests", []).filter((booking) =>
          booking.bookingGroupId === payment.bookingGroupId && booking.travelerEmail === P.email());
        C.openCheckout([], payment.tripContext?.itinerary || active, bookings);
        return;
      }
      C.openCheckout([...selection], { ...active, packageBooking: true, essentials: window.plannerEssentials(active.travelers) });
    });
    const feedback = (message) => {
      let el = document.getElementById("planner-tool-feedback");
      if (el) el.textContent = message;
    };
    const download = (content, type, name) => {
      const url = URL.createObjectURL(new Blob([content], { type })),
        a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    document.querySelector(".tool-btn--sync")?.addEventListener("click", () => {
      if (!active) return;
      const clean = (s) =>
        String(s)
          .replace(/\\/g, "\\\\")
          .replace(/\r\n|\r|\n/g, "\\n")
          .replace(/,/g, "\\,")
          .replace(/;/g, "\\;");
      let lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Roamly//Travel Plan//EN",
        "CALSCALE:GREGORIAN",
      ];
      dayList.querySelectorAll(".day-card").forEach((day, index) => {
        const scheduled = day.querySelector(".day-card__date")?.dateTime;
        const date = scheduled
          ? new Date(scheduled + "T12:00:00Z")
          : new Date(active.date + "T12:00:00Z");
        if (!scheduled) date.setUTCDate(date.getUTCDate() + index);
        const next = new Date(date);
        next.setUTCDate(next.getUTCDate() + 1);
        const iso = (d) => d.toISOString().slice(0, 10).replaceAll("-", "");
        lines.push(
          "BEGIN:VEVENT",
          "UID:" + active.id + "-" + index + "@roamly.local",
          "DTSTAMP:" +
            new Date()
              .toISOString()
              .replace(/[-:]/g, "")
              .replace(/\.\d{3}/, ""),
          "DTSTART;VALUE=DATE:" + iso(date),
          "DTEND;VALUE=DATE:" + iso(next),
          "SUMMARY:" +
            clean(active.destination + " · " + day.querySelector(".day-card__title").textContent),
          "DESCRIPTION:" +
            clean(
              [...day.querySelectorAll(".timeline__title > span")]
                .map((el) => el.textContent)
                .join("\n"),
            ),
          "END:VEVENT",
        );
      });
      lines.push("END:VCALENDAR");
      download(lines.join("\r\n") + "\r\n", "text/calendar;charset=utf-8", "roamly-itinerary.ics");
      feedback(
        text(
          "Calendar file downloaded. Import it into Google, Apple or Outlook Calendar.",
          "تم تنزيل ملف التقويم. استورده إلى تقويم جوجل أو آبل أو أوتلوك.",
        ),
      );
    });
    document.querySelector(".tool-btn--pdf")?.addEventListener("click", () => {
      feedback(
        text("Choose “Save as PDF” in the print dialog.", "اختر «حفظ بصيغة PDF» في نافذة الطباعة."),
      );
      window.print();
    });
    document.querySelector(".tool-btn--share")?.addEventListener("click", async () => {
      if (!active) return;
      P.write("roamly-concierge-plan", active);
      try {
        await navigator.clipboard.writeText(
          active.destination +
            " · " +
            active.days +
            " days\n" +
            [...dayList.querySelectorAll(".day-card__title")].map((el) => el.textContent).join("\n"),
        );
        feedback(
          text(
            "Plan copied. Share it with your companions or post it in Community.",
            "نُسخت الخطة. شاركها مع مرافقيك أو انشرها في المجتمع.",
          ),
        );
      } catch {
        feedback(
          text(
            "Open Community to share this saved itinerary.",
            "افتح المجتمع لمشاركة هذه الرحلة المحفوظة.",
          ),
        );
      }
    });
    const restored = P.read("roamlyLegacyPlan:" + P.email(), null);
    if (restored && P.account() && new URLSearchParams(location.search).get("viewPlan") === "1") {
      Object.entries(restored).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field && "value" in field && typeof value === "string") field.value = value;
      });
      sessionStorage.setItem(
        "roamlyAdventurePlannerContext",
        JSON.stringify({ ...restored, travelDate: restored.date, duration: restored.days + " days" }),
      );
      location.replace("ai-planner.html?resumePlan=1");
    }
  }
  const pricingButtons = document.querySelectorAll(".plan-card__cta");
  pricingButtons.forEach((button, index) => {
    const key = ["solo", "pro", "family"][index];
    button.href = "payment.html?plan=" + key;
    button.addEventListener("click", (e) => {
      e.preventDefault();
      sessionStorage.setItem("roamlySelectedSubscription", key);
      location.href = P.account() ? "payment.html?plan=" + key : "sign-in.html?next=payment.html";
    });
  });
  function refreshAdminStats() {
    const admin = document.getElementById("tab-overview");
    if (!admin) return;
    const rows = P.ledger();
    const fees = rows.filter((row) => row.settled).reduce((total, row) => total + row.financials.commissionCents, 0);
    const stats = document.querySelectorAll("#tab-overview .stat-card");
    if (stats[0]) {
      stats[0].querySelector(".stat-label").textContent = text(
        "Commission revenue (USD)",
        "إيرادات العمولة بالدولار",
      );
      stats[0].querySelector(".stat-val").textContent = usd(fees);
      stats[0].querySelector(".stat-sub").textContent = text(
        "Confirmed and fully paid bookings",
        "حجوزات مؤكدة ومدفوعة بالكامل",
      );
    }
    if (stats[1])
      stats[1].querySelector(".stat-val").textContent = rows.filter(
        (r) => r.status !== "Completed",
      ).length;
  }
  refreshAdminStats();
  document.addEventListener("roamly:languagechange", () => {
    if (lastValues && summary && (!summary.hidden || !plan.hidden)) attachServices(lastValues);
    refreshAdminStats();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "roamly-market-requests" || e.key === "roamly-market-services") {
      refreshAdminStats();
      if (lastValues && summary && (!summary.hidden || !plan.hidden)) attachServices(lastValues);
    }
  });
  window.addEventListener("roamly:bookingschange", () => {
    refreshAdminStats();
    if (lastValues && summary && (!summary.hidden || !plan.hidden)) attachServices(lastValues);
  });
  I.apply();
})();
