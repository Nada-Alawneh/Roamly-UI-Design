(function () {
  "use strict";
  const today = () => {
    const d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  };
  const I = window.RoamlyI18n,
    t = (k) => I.t(k),
    S = "roamly-market-services",
    R = "roamly-market-requests",
    P = "roamly-concierge-plan";
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(fallback) && !Array.isArray(value) ? fallback : (value ?? fallback);
    } catch {
      return fallback;
    }
  };
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const uid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
  const money = (n) =>
    new Intl.NumberFormat(I.language === "ar" ? "ar-JO" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(n);
  const tr = (en, ar) => (I.language === "ar" ? ar : en);
  const demo = [
    {
      id: "roam-demo-petra",
      title: "Petra, beyond the Treasury",
      titleAr: "البتراء، ما وراء الخزنة",
      destination: "Jordan",
      location: "Petra",
      price: 65,
      category: "hiking",
      serviceType: "Local tourist guides",
      description:
        "Follow a local guide through the Siq and discover Nabataean stories. Entry tickets not included.",
      descriptionAr: "رافق دليلاً محلياً عبر السيق واكتشف حكايات الأنباط. تذاكر الدخول غير مشمولة.",
      coverImage:
        "https://images.unsplash.com/photo-1579606032821-4e6161c81bd3?auto=format&fit=crop&w=1000&q=85",
      duration: "4 hours",
    },
    {
      id: "roam-demo-rum",
      title: "Wadi Rum sunset trails",
      titleAr: "دروب الغروب في وادي رم",
      destination: "Jordan",
      location: "Wadi Rum",
      price: 48,
      category: "transport",
      serviceType: "4x4 desert trips",
      priceUnit: "vehicle",
      description:
        "A private 4×4 ride among sandstone arches, with Bedouin tea at sunset. Up to 6 passengers.",
      descriptionAr:
        "جولة خاصة بسيارة دفع رباعي بين الأقواس الصخرية مع شاي بدوي عند الغروب. حتى ٦ ركاب.",
      capacity: 6,
      coverImage:
        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1000&q=85",
      duration: "3 hours",
    },
    {
      id: "roam-demo-dana",
      title: "Dana village & nature walk",
      titleAr: "قرية ضانا ومسارات الطبيعة",
      destination: "Jordan",
      location: "Dana",
      price: 35,
      category: "hiking",
      serviceType: "Organizing mountain hiking routes",
      description:
        "Walk ancient village lanes and a gentle nature trail with a local host. Includes a homemade lunch.",
      descriptionAr: "تجول في أزقة القرية ومسار طبيعي هادئ برفقة مضيف محلي، مع غداء منزلي.",
      coverImage: "",
      duration: "5 hours",
    },
    {
      id: "roam-demo-istanbul",
      title: "Istanbul neighborhood discoveries",
      titleAr: "اكتشف أحياء إسطنبول",
      destination: "Istanbul",
      location: "Istanbul, Turkey",
      price: 55,
      category: "hiking",
      serviceType: "Local tourist guides",
      description:
        "A small-group walk through historic streets and neighborhood food stops. Food purchases are extra.",
      descriptionAr: "جولة صغيرة في الشوارع التاريخية ومحطات الطعام المحلية. المشتريات الغذائية إضافية.",
      coverImage: "assets/img/istanbul-map.png",
      duration: "3 hours",
    },
    {
      id: "roam-demo-bali",
      title: "Bali rice terrace walk",
      titleAr: "مشي بين مدرجات الأرز في بالي",
      destination: "Bali",
      location: "Bali, Indonesia",
      price: 30,
      category: "hiking",
      serviceType: "Local tourist guides",
      description: "Discover Ubud’s rice terraces with a local walking guide. Includes drinking water.",
      descriptionAr: "اكتشف مدرجات الأرز في أوبود مع دليل محلي. تشمل الجولة مياه الشرب.",
      coverImage: "assets/img/bali.png",
      duration: "3 hours",
    },
  ];
  try {
    if (!read("roamly-concierge-seeded", false)) {
      const accounts = read("roamlyLocalAccounts", []);
      if (!accounts.some((a) => a.id === "roamly-demo-host")) {
        accounts.push({
          id: "roamly-demo-host",
          email: "host@demo.roamly",
          name: "Roamly Local Collective",
          businessName: "Roamly Local Collective",
          role: "supplier",
          isDemo: true,
        });
        write("roamlyLocalAccounts", accounts);
      }
      const services = read(S, []);
      for (const d of demo)
        if (!services.some((s) => s.id === d.id))
          services.push({
            ...d,
            supplierId: "roamly-demo-host",
            supplierName: "Roamly Sample Experiences",
            published: true,
            capacity: d.capacity || 12,
            currency: "USD",
            team: [{ name: "Local experience host", role: "Guide", languages: "Arabic, English" }],
            isDemo: true,
          });
      write(S, services);
      write("roamly-concierge-seeded", true);
    }
  } catch (error) {
    console.warn("Roamly storage unavailable", error);
  }
  const catalogPhotos = read(S, []);
  const legacySampleServices = catalogPhotos.filter(
    (s) => s && s.supplierId === "roamly-demo-host" && s.supplierName === "Roamly Local Collective · Demo",
  );
  legacySampleServices.forEach((s) => { s.supplierName = "Roamly Sample Experiences"; });
  const danaPhoto = catalogPhotos.find(
    (s) => s.id === "roam-demo-dana" && s.coverImage === "assets/img/hero-featured.png",
  );
  if (danaPhoto) danaPhoto.coverImage = "";
  if (danaPhoto || legacySampleServices.length) {
    try {
      write(S, catalogPhotos);
    } catch {}
  }
  function services() {
    return read(S, []).filter(
      (s) => s && s.published !== false && Number.isFinite(Number(s.price)) && Number(s.price) > 0,
    );
  }
  function matches(s, destination) {
    const aliases = {
      الأردن: "jordan",
      الاردن: "jordan",
      إسطنبول: "istanbul",
      اسطنبول: "istanbul",
      بالي: "bali",
      turkey: "istanbul",
      تركيا: "istanbul",
      indonesia: "bali",
    };
    let q = destination.trim().toLowerCase();
    q = aliases[q] || q;
    q = q.split(",")[0].trim();
    const place = [s.destination, s.location, s.meetingPoint, s.destinationCountry, s.country, s.title]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return q === "jordan"
      ? /jordan|petra|wadi rum|dana|amman|aqaba|الأردن|البتراء/.test(place)
      : place.includes(q);
  }
  function plannerPlace(value) {
    const cleaned = String(value || "").normalize("NFKD").replace(/\p{M}/gu, "")
      .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const aliases = {
      اسطنبول: "istanbul", تركيا: "turkey", turkiye: "turkey", بالي: "bali",
      اندونيسيا: "indonesia", الاردن: "jordan", دبي: "dubai", الامارات: "united arab emirates",
      uae: "united arab emirates", uk: "united kingdom", usa: "united states",
    };
    return Object.hasOwn(aliases, cleaned) ? aliases[cleaned] : cleaned;
  }
  function matchesPlannerDestination(service, destination) {
    const [place, country] = String(destination || "").split(/[,،]/).map(plannerPlace);
    if (!place) return false;
    const declaredCountry = plannerPlace(service.destinationCountry || service.country);
    if (country && declaredCountry && country !== declaredCountry) return false;
    const coverage = service.serviceArea
      ? [service.serviceArea]
      : [service.destination, service.location].filter(Boolean);
    if (country && coverage.some((area) => {
      const parts = String(area).split(/[,،]/).map(plannerPlace).filter(Boolean);
      return parts.length > 1 && parts[0] === place && parts.at(-1) !== country;
    })) return false;
    if (!coverage.length) coverage.push(service.meetingPoint);
    return [...coverage, declaredCountry].some((area) =>
      String(area || "").split(/[,،]/).map(plannerPlace).includes(place),
    );
  }
  function serviceName(s) {
    return I.language === "ar" && s.titleAr ? s.titleAr : s.title;
  }
  function serviceDate(context, id, startDate) {
    if (!startDate) return "";
    const index = Math.max(0, (context.serviceIds || []).indexOf(id));
    const date = new Date(startDate + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + (index % Math.max(1, context.days)));
    return date.toISOString().slice(0, 10);
  }
  function splitShares(cents, people, offset = 0) {
    return Array.from(
      { length: people },
      (_, i) =>
        (Math.floor(cents / people) + ((i - offset + people) % people < cents % people ? 1 : 0)) / 100,
    );
  }
  function cost(s, party) {
    return Number(s.price) * (s.priceUnit === "vehicle" || s.category === "transport" ? 1 : party);
  }
  function priceUnitLabel(s) {
    if (s.priceUnit === "vehicle" || s.category === "transport") return tr("per vehicle", "للمركبة");
    if (s.category === "equipment") return tr("per item per day", "للقطعة في اليوم");
    if (s.category === "reserves") return tr("per guest per night", "للضيف في الليلة");
    return tr("per traveler", "للمسافر");
  }
  function serviceCard(s, checked = true) {
    return (
      '<article class="rx-service"><span class="rx-tag">' +
      esc(s.supplierName) +
      "</span><h3>" +
      esc(serviceName(s)) +
      "</h3><p>" +
      esc(I.language === "ar" && s.descriptionAr ? s.descriptionAr : s.description) +
      "</p><p>" +
      esc(s.location || s.meetingPoint || "") +
      " · " +
      esc(s.duration || "") +
      "</p><strong>" +
      money(Number(s.price)) +
      " / " +
      (s.category === "transport" ? tr("vehicle", "للمركبة") : t("perPerson")) +
      "</strong>" +
      '<label><input type="checkbox" data-service-select="' +
      esc(s.id) +
      '" ' +
      (checked ? "checked" : "") +
      ">" +
      t("add") +
      "</label></article>"
    );
  }
  function makeDialog(className) {
    const d = document.createElement("dialog");
    d.className = className;
    document.body.append(d);
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    });
    d.addEventListener("close", () => d.remove());
    return d;
  }
  function openCheckout(ids, context, bookings = []) {
    const recorded = bookings[0]?.packagePayment;
    const packageBooking = Boolean(recorded) || (context.offerBooking === true && context.packageBooking === true);
    const catalog = services();
    const snapshot = ids.map((id) => catalog.find((s) => s.id === id)).filter(Boolean);
    if (!recorded && (snapshot.length !== ids.length || (!ids.length && !packageBooking))) {
      const status = document.querySelector("[data-trip-payment-status]");
      if (packageBooking && status) status.textContent = tr(
        "An offer is no longer available. Review your supplier selection and try again.",
        "في عرض ما عاد متوفّر. راجع عروض المورّدين وجرّب مرة ثانية.",
      );
      return;
    }
    const d = makeDialog("rx-checkout");
    const total = snapshot.reduce((sum, s) => sum + cost(s, context.travelers), 0);
    const email =
      sessionStorage.getItem("roamlySignedInEmail") ||
      localStorage.getItem("roamlySignedInEmail") ||
      sessionStorage.getItem("roamlyMarketplaceGuestEmail") ||
      "";
    const account = read("roamlyLocalAccounts", []).find((a) => a.email === email);
    const plannerCheckout = Boolean(document.querySelector("[data-planner-form]"));
    const offerBooking = context.offerBooking === true;
    if (packageBooking) d.classList.add("rx-trip-checkout");
    const essentials = recorded?.essentials ?? (packageBooking ? context.essentials : []);
    const packageTotal = recorded?.totalCents ?? essentials.reduce((sum, row) => sum + row.cents, Math.round(total * 100));
    const labels = packageBooking
      ? { title: tr("Review your trip payment", "راجع دفعة الرحلة"), submit: tr("Record one trip payment", "سجّل دفعة واحدة للرحلة") }
      : offerBooking
      ? { title: tr("Review booking requests", "راجع طلبات الحجز"), submit: tr("Send booking requests", "أرسل طلبات الحجز") }
      : { title: t("checkout"), submit: t("submit") };
    const splitDisabled = context.travelers < 2 ? " disabled" : "";
    const paymentOptions = offerBooking && !packageBooking ? "" : plannerCheckout
      ? '<fieldset><legend>' + t("payment") + '</legend><div class="pay-methods__options">' +
        '<label class="pay-option"><input type="radio" name="payment" value="full" checked><span class="pay-option__copy"><span class="pay-option__title">' +
        tr("Pay in Full", "الدفع الكامل") + '</span>' +
        (packageBooking ? '<small class="pay-option__text">' + tr("One payment for the entire trip.", "دفعة واحدة لكل الرحلة.") + '</small>' : '') + '</span></label>' +
        '<label class="pay-option"><input type="radio" name="payment" value="split"' + splitDisabled +
        '><span class="pay-option__copy"><span class="pay-option__title">' + t("split") + '</span>' +
        (packageBooking ? '<small class="pay-option__text">' + tr("Divide the total between travelers.", "قسّم الإجمالي بين المسافرين.") + '</small>' : '') + '</span></label></div></fieldset>'
      : '<label>' + t("payment") + '<select class="input" name="payment"><option value="full">' +
        t("full") + '</option><option value="split"' + splitDisabled + '>' + t("split") + '</option></select></label>';
    const packageSummary = packageBooking ? `
      <section class="checkout__summary rx-package-summary" aria-labelledby="rx-package-summary">
        <div class="checkout__summary-row">
          <div><h3 id="rx-package-summary">${tr("Booking summary", "ملخص الحجز")}</h3>
          <p>${esc(context.destination)} · ${context.days} ${tr("days", "أيام")} · ${context.travelers} ${tr("travelers", "مسافرين")}</p></div>
          <strong>${money(packageTotal / 100)}</strong>
        </div>
        <ul class="rx-package-lines">${essentials.map((line) =>
          `<li><span>${esc(tr(line.en, line.ar))}</span><strong>${money(line.cents / 100)}</strong></li>`
        ).join("")}</ul>
        ${(recorded ? bookings.some((row) => !row.tripOnly) : snapshot.length) ? `<h4>${tr("Supplier experiences", "تجارب المورّدين")}</h4>` : ""}
        <ul class="rx-package-lines">${recorded ? bookings.filter((row) => !row.tripOnly).map((row) =>
          `<li><div><strong>${esc(row.serviceTitle || "")}</strong><small>${esc(row.supplierName || "")} · ${esc(row.date || "")}</small></div>
          <strong>${money((row.financials?.grossCents || 0) / 100)}</strong></li>`
        ).join("") : snapshot.map((service, index) => {
          const date = esc(context.offerDates?.[service.id] || context.date);
          return `<li><div><strong>${esc(serviceName(service))}</strong>
            <small>${esc(service.supplierName)} · <time datetime="${date}">${date}</time></small>
            <input type="hidden" name="offerDate${index}" value="${date}"></div>
            <strong>${money(cost(service, context.travelers))}</strong></li>`;
        }).join("")}</ul>
        ${(recorded ? bookings.some((row) => !row.tripOnly) : snapshot.length) ? `<p>${tr("Supplier offers are pre-approved in this demo and included in the trip total.", "عروض المورّدين موافَق عليها مسبقاً بالنسخة التجريبية ومشمولة بإجمالي الرحلة.")}</p>` : ""}
      </section>` : "";
    d.innerHTML =
      '<button class="rx-close" type="button" aria-label="' +
      t("close") +
      '">×</button><h2>' +
      (packageBooking ? tr("Choose how you’d like to pay", "اختار طريقة الدفع") : labels.title) +
      '</h2><p class="rx-notice">' +
      (packageBooking
        ? tr("Pay through Roamly. This is a demo checkout.", "الدفع عبر روملي. هالعملية تجريبية.")
        : offerBooking
        ? tr("Send a request for each selected experience. Your supplier confirms the date and final price before checkout.", "أرسل طلب لكل تجربة اخترتها. المورّد بيأكد الموعد والسعر النهائي قبل الدفع.")
        : tr("No card will be charged.", "لن يُخصم أي مبلغ من البطاقة.")) +
      "</p><form>" +
      (packageBooking ? packageSummary : snapshot
        .map(
          (s, index) => offerBooking
            ? `<fieldset class="planner-request-line"><legend>${esc(serviceName(s))}</legend>
                <p>${esc(s.supplierName)} · <strong>${money(cost(s, context.travelers))}</strong></p>
                <label>${tr("Preferred date", "الموعد المفضّل")}
                  <input class="input" type="date" name="offerDate${index}" required value="${esc(context.offerDates?.[s.id] || context.date)}"${packageBooking ? " readonly" : ""}>
                </label>
              </fieldset>`
            :
            "<p>" +
            esc(serviceName(s)) +
            " <strong>" +
            money(cost(s, context.travelers)) +
        '</strong><br><span class="rx-tag" data-booking-date="' +
            esc(s.id) +
            '">' +
            esc(serviceDate(context, s.id, context.date)) +
            "</span></p>",
        )
        .join("") +
      "<p>" +
      t("total") +
      ": <strong>" +
      money(packageTotal / 100) +
      "</strong></p>") +
      (offerBooking
        ? '<input type="hidden" name="date" value="' + esc(context.date) + '">'
        : '<label>' + tr("Start date", "تاريخ البداية") + '<input class="input" type="date" name="date" required value="' + esc(context.date) + '"></label>') +
      '<label>' +
      t("name") +
      '<input class="input" name="name" required maxlength="100" value="' +
      esc(account?.name || "") +
      '" autocomplete="name"></label><label>' +
      t("email") +
      '<input class="input" name="email" type="email" required value="' +
      esc(email) +
      '" autocomplete="email"' + (offerBooking && account ? " readonly" : "") + '></label>' +
      paymentOptions +
      (packageBooking ? '<div class="payment-due" aria-live="polite"><strong>' + tr("Amount due today", "المبلغ المطلوب اليوم") + '</strong><strong class="payment-due__amount" data-package-due></strong></div>' : '') +
      (offerBooking && !packageBooking ? "" : '<p id="split-summary" class="rx-notice"></p>') +
      (packageBooking && !recorded ? `
        <section class="checkout__form" aria-labelledby="rx-test-card-title">
          <div class="checkout__payment-head"><h3 id="rx-test-card-title">${tr("Card details", "بيانات البطاقة")}</h3>
            <span><i class="fa-regular fa-credit-card" aria-hidden="true"></i> ${tr("Test card", "بطاقة اختبار")}</span></div>
          <p class="checkout__privacy-note" id="rx-test-card-help">${tr("Use the test number 4242 4242 4242 4242, expiry 12/30, and security code 123. No card data is saved.", "استخدم رقم الاختبار 4242 4242 4242 4242، والانتهاء 12/30 والرمز 123. بيانات البطاقة ما بتنحفظ.")}</p>
          <label>${tr("Name on card", "الاسم على البطاقة")}<input class="input" data-test-card-name required maxlength="100" autocomplete="off"></label>
          <label>${tr("Card number", "رقم البطاقة")}<input class="input" data-test-card="4242424242424242" required inputmode="numeric" autocomplete="off" maxlength="19" aria-describedby="rx-test-card-help" dir="ltr"></label>
          <div class="form-row">
            <label>${tr("Expiry date", "تاريخ الانتهاء")}<input class="input" data-test-card="12/30" required inputmode="numeric" autocomplete="off" maxlength="5" placeholder="MM/YY" dir="ltr"></label>
            <label>${tr("Security code", "رمز الأمان")}<input class="input" type="password" data-test-card="123" required inputmode="numeric" autocomplete="off" maxlength="3" dir="ltr"></label>
          </div>
        </section>` : '') +
      (packageBooking ? '<div class="checkout__actions"><button class="btn btn--soft" type="button" data-package-back>' + tr("Back to itinerary", "ارجع لخطة الرحلة") + '</button>' : '') +
      '<button class="rx-button" type="submit">' +
      labels.submit +
      '</button>' + (packageBooking ? '</div>' : '') + '<p role="status" id="checkout-status"></p></form>';
    if (packageBooking) {
      const heading = d.querySelector("h2");
      heading.id = "rx-trip-checkout-title";
      heading.className = "modal__title";
      const head = document.createElement("div");
      head.className = "checkout__head";
      head.innerHTML = '<span class="pill pill--emerald pill--xs"><i class="fa-solid fa-receipt" aria-hidden="true"></i> ' +
        tr("Booking summary", "ملخص الحجز") + '</span>';
      heading.before(head);
      head.append(heading);
      const intro = document.createElement("p");
      intro.className = "modal__text";
      intro.textContent = recorded
        ? tr("Review your trip costs and selected experiences.", "راجع تكاليف رحلتك والتجارب اللي اخترتها.")
        : tr("Review your trip total, included essentials, and payment split.", "راجع إجمالي الرحلة والخدمات المشمولة وطريقة الدفع.");
      head.append(intro);
      d.setAttribute("aria-labelledby", heading.id);
      const note = d.querySelector(".rx-notice");
      note.className = "checkout__demo-note";
      const summary = d.querySelector(".rx-package-summary");
      summary.after(note);
    }
    d.querySelector(".rx-close").onclick = () => d.close();
    if (recorded) {
      const complete = bookings.every((row) => row.payment?.status === "Paid (demo)");
      const section = document.createElement("section");
      section.className = "rx-recorded-payment";
      section.append(d.querySelector(".rx-package-summary"), d.querySelector(".checkout__demo-note"));
      const badge = document.createElement("p");
      badge.className = "payment-due";
      const paidCents = (bookings[0].payment?.paidShares || []).reduce(
        (sum, index) => sum + (recorded.sharesCents?.[index] || 0), 0);
      badge.textContent = complete
        ? tr("Paid in full", "تم دفع كامل المبلغ") + " · " + money(packageTotal / 100)
        : tr("Remaining balance", "المبلغ المتبقّي") + " · " + money((packageTotal - paidCents) / 100);
      const group = encodeURIComponent(bookings[0].bookingGroupId);
      const action = document.createElement("a");
      action.className = "rx-button";
      action.href = complete ? "../user/trip.html?group=" + group + "&boarding=1" : "../user/payment.html?group=" + group;
      action.textContent = complete
        ? tr("View boarding pass", "اعرض بطاقة الصعود")
        : tr("Manage split payment", "تابع الدفع المقسّم");
      section.append(badge, action);
      d.querySelector("h2").textContent = tr("Review your trip payment", "راجع دفعة الرحلة");
      d.querySelector("form").replaceWith(section);
      d.showModal();
      return;
    }
    if (packageBooking) d.querySelector("[data-package-back]").onclick = () => d.close();
    const form = d.querySelector("form");
    const testCardFields = [...form.querySelectorAll("[data-test-card]")];
    for (const field of testCardFields) {
      field.addEventListener("input", () => field.setCustomValidity(""));
    }
    form.elements.date.min = today();
    const dateFields = new Map();
    if (offerBooking) {
      const end = new Date(context.date + "T12:00:00Z");
      end.setUTCDate(end.getUTCDate() + context.days - 1);
      const max = end.toISOString().slice(0, 10);
      snapshot.forEach((s, index) => {
        const field = form.elements["offerDate" + index];
        field.min = [today(), context.date].sort().at(-1);
        field.max = max;
        dateFields.set(s.id, field);
      });
    }
    const requestedDate = (s) => dateFields.get(s.id)?.value ||
      serviceDate(context, s.id, form.elements.date.value);
    function summary() {
      snapshot.forEach((s) => {
        const label = d.querySelector('[data-booking-date="' + CSS.escape(s.id) + '"]');
        if (label) label.textContent = serviceDate(context, s.id, form.elements.date.value);
      });
      const split = form.elements.payment.value === "split";
      let cents = packageTotal,
        base = Math.floor(cents / context.travelers),
        remainder = cents % context.travelers;
      if (packageBooking) form.querySelector("[type=submit]").textContent = split
        ? tr("Pay first share", "ادفع الحصة الأولى") + " · " + money((base + (remainder ? 1 : 0)) / 100)
        : tr("Pay in Full", "الدفع الكامل") + " · " + money(cents / 100);
      if (packageBooking) {
        d.querySelector("[data-package-due]").textContent = money((split ? base + (remainder ? 1 : 0) : cents) / 100);
      }
      d.querySelector("#split-summary").textContent = split
        ? context.travelers +
          " " +
          tr("travelers:", "مسافرين:") +
          " " +
          money(base / 100) +
          (remainder ? " – " + money((base + 1) / 100) : "") +
          " " +
          tr(
            "each. Record the first share now. The other travelers can record their shares using the links on the receipt.",
            "لكل شخص. سجّل الحصة الأولى الآن. يمكن لبقية المسافرين تسجيل حصصهم باستخدام روابط الإيصال.",
          ) + (packageBooking ? " " + tr(
            "The group has 48 hours to complete payment. If it expires, the demo policy is a 10% fee on the amount paid.",
            "مع المجموعة ٤٨ ساعة لإكمال الدفع. إذا انتهت المهلة، السياسة التجريبية بتخصم ١٠٪ من المبلغ المدفوع.",
          ) : "")
        : packageBooking ? "" : tr(
            "The supplier still needs to confirm availability.",
            "لا يزال على المورّد تأكيد التوافر.",
          );
    }
    if (!offerBooking || packageBooking) {
      form.querySelectorAll("[name=payment]").forEach((option) => option.addEventListener("change", summary));
      form.elements.date.addEventListener("change", summary);
      summary();
    }
    let submitted = false;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (submitted) return;
      const invalidCardField = testCardFields.find((field) =>
        field.value.replace(/\s/g, "") !== field.dataset.testCard);
      if (invalidCardField) {
        invalidCardField.setCustomValidity(tr("Enter the test card details shown above.", "اكتب بيانات بطاقة الاختبار الموضّحة فوق."));
        invalidCardField.reportValidity();
        return;
      }
      const current = services();
      const tripStyles = window.RoamlyTripStyles;
      const accounts = offerBooking && tripStyles
        ? new Map(read("roamlyLocalAccounts", []).map((account) => [account.id, account]))
        : null;
      const valid = snapshot.every((s) =>
        current.some(
          (x) =>
            x.id === s.id &&
            x.supplierId === s.supplierId &&
            Number(x.price) === Number(s.price) &&
            cost(x, context.travelers) === cost(s, context.travelers) &&
            (!offerBooking || matchesPlannerDestination(x, context.destination)) &&
            (!accounts || tripStyles.supplierMatches(x, context.style, accounts)) &&
            (!Number(x.capacity) || Number(x.capacity) >= context.travelers),
        ),
      );
      if (!valid) {
        d.querySelector("#checkout-status").textContent = t("unavailable");
        return;
      }
      const groupId = uid(),
        now = new Date().toISOString(),
        split = form.elements.payment?.value === "split";
      const requests = read(R, []);
      if (packageBooking && requests.some((r) => r.packagePayment &&
        r.travelerEmail === email && r.tripContext?.itinerary?.id === context.id)) {
        d.querySelector("#checkout-status").textContent = tr("This trip payment is already recorded.", "دفعة الرحلة مسجّلة من قبل.");
        return;
      }
      let shareOffset = 0;
      const fresh = snapshot.filter(
        (s) =>
          !requests.some(
            (r) =>
              r.serviceId === s.id &&
              r.travelerEmail === form.elements.email.value.trim().toLowerCase() &&
              r.date === requestedDate(s) &&
              (!packageBooking || !r.packagePayment) &&
              ["Pending", "Confirmed", "Completed"].includes(r.status),
          ),
      );
      if (!fresh.length && snapshot.length) {
        d.querySelector("#checkout-status").textContent = tr(
          "These booking requests have already been sent.",
          "أُرسلت طلبات هذه الحجوزات سابقاً.",
        );
        return;
      }
      if (fresh.length !== snapshot.length) {
        d.querySelector("#checkout-status").textContent = tr(
          "Some selected experiences already have requests. Deselect them before sending the remaining requests.",
          "توجد طلبات لبعض التجارب المحددة. ألغِ تحديدها قبل إرسال باقي الطلبات.",
        );
        return;
      }
      const booked = (fresh.length ? fresh : [{ title: "Trip essentials", price: 0 }]).map((s) => {
        const tripOnly = !fresh.length;
        const n = split ? context.travelers : 1,
          c = Math.round(cost(s, context.travelers) * 100),
          shares = splitShares(c, n, shareOffset);
        shareOffset = (shareOffset + (c % n)) % n;
        return {
          id: "request-" + uid(),
          bookingGroupId: groupId,
          ...(tripOnly && { tripOnly: true }),
          serviceId: s.id,
          supplierId: s.supplierId,
          supplierName: s.supplierName,
          serviceTitle: s.title,
          serviceType: s.serviceType,
          category: s.category,
          serviceSnapshot: { ...s },
          teamSnapshot: s.team || [],
          travelerEmail: form.elements.email.value.trim().toLowerCase(),
          travelerName: form.elements.name.value.trim(),
          date: requestedDate(s),
          travelers: context.travelers,
          status: packageBooking ? "Confirmed" : "Pending",
          message: "Concierge plan booking · " + context.destination,
          tripContext: {
            origin: context.origin,
            destination: context.destination,
            style: context.style,
            providerStyle: context.providerStyle,
            travelDate: form.elements.date.value,
            duration: context.days + " days",
            notes: context.tripNotes,
            itinerary: { ...context, date: form.elements.date.value },
          },
          ...(packageBooking && { packagePayment: {
            paidTo: "Roamly",
            ...(!tripOnly && { supplierApproval: "Pre-approved (demo)", supplierApprovedAt: now }),
            receiptId: "demo-" + groupId,
            totalCents: packageTotal,
            essentials,
            sharesCents: splitShares(packageTotal, split ? context.travelers : 1)
              .map((amount) => Math.round(amount * 100)),
            currency: "USD",
          } }),
          ...((!offerBooking || packageBooking) && { payment: {
            mode: split ? "split" : "full",
            status: split && context.travelers > 1 ? "Awaiting group payment (demo)" : "Paid (demo)",
            paidShares: [0],
            receiptId: "demo-" + groupId,
            estimatedTotal: cost(s, context.travelers),
            currency: "USD",
            shares,
          } }),
          financials: {
            grossCents: c,
            commissionCents: Math.round(c * 0.15),
            netCents: c - Math.round(c * 0.15),
            commissionRate: 0.15,
            currency: "USD",
          },
          messages: tripOnly ? [] : [
            {
              from: form.elements.name.value,
              text: packageBooking
                ? "This demo offer was pre-approved for the selected date before trip checkout."
                : "Booking request received from the Roamly concierge. Please confirm availability and final price.",
              kind: "notification",
              at: now,
            },
          ],
          createdAt: now,
        };
      });
      try {
        const carried = new Set();
        if (packageBooking) {
          for (const booking of booked) {
            if (booking.tripOnly) continue;
            const inquiries = requests.filter((request) =>
              request.status === "Inquiry" && request.serviceId === booking.serviceId &&
              request.supplierId === booking.supplierId && request.travelerEmail === booking.travelerEmail &&
              request.tripContext?.itinerary?.id === context.id,
            );
            for (const inquiry of inquiries) carried.add(inquiry.id);
            booking.messages = inquiries.flatMap((inquiry) => inquiry.messages || []).concat(booking.messages);
          }
        }
        write(R, requests.filter((request) => !carried.has(request.id)).concat(booked));
        if (!account) {
          try {
            sessionStorage.setItem(
              "roamlyMarketplaceGuestEmail",
              form.elements.email.value.trim().toLowerCase(),
            );
          } catch {}
        }
        submitted = true;
        form.querySelectorAll("input,select,button").forEach((el) => (el.disabled = true));
        d.querySelector("#checkout-status").textContent = tr(
          "Your requests were sent to the suppliers to confirm availability. No payment was charged.",
          "أُرسلت طلباتك إلى المورّدين لتأكيد التوافر. لم يُخصم أي مبلغ.",
        );
        const receipt = document.createElement("a");
        receipt.href = offerBooking && !packageBooking
          ? "../user/adventure-marketplace.html?view=chats"
          : "../user/payment.html?group=" + encodeURIComponent(groupId);
        receipt.className = "rx-link";
        receipt.textContent = offerBooking && !packageBooking ? tr("Track requests", "تابع طلباتك") : tr("View receipt", "عرض الإيصال");
        d.querySelector("#checkout-status").append(document.createElement("br"), receipt);
        if (split && context.travelers > 1) {
          for (let i = 1; i < context.travelers; i++) {
            const shareLink = document.createElement("a");
            shareLink.href = "../user/payment.html?group=" + encodeURIComponent(groupId) + "&share=" + i;
            shareLink.className = "rx-link";
            shareLink.textContent = tr(
              "Traveler " + (i + 1) + " · pay share",
              "المسافر " + (i + 1) + " · دفع الحصة",
            );
            d.querySelector("#checkout-status").append(document.createElement("br"), shareLink);
          }
        }
        window.dispatchEvent(new Event("roamly:bookingschange"));
        if (packageBooking) {
          location.href = split
            ? "../user/payment.html?group=" + encodeURIComponent(groupId)
            : "../user/trip.html?group=" + encodeURIComponent(groupId);
        } else if (!split && plannerCheckout && !offerBooking) {
          location.href = "../user/trip.html?group=" + encodeURIComponent(groupId);
        }
      } catch {
        d.querySelector("#checkout-status").textContent = tr(
          "Storage is full or unavailable. No booking was submitted.",
          "التخزين ممتلئ أو غير متاح. لم يُرسل الحجز.",
        );
      }
    });
    d.showModal();
  }
  const jordan = document.querySelector(".jordan-narrative");
  const jordanPlaceAliases = {
    amman: ["Amman", "عمّان", "عمان"],
    salt: ["Salt", "السلط"],
    jerash: ["Jerash", "Gerasa", "جرش"],
    ajloun: ["Ajloun", "Ajlun", "عجلون"],
    "umm-qais": ["Umm Qais", "Umm Qays", "أم قيس", "ام قيس"],
    madaba: ["Madaba", "Nebo", "مادبا", "نيبو"],
    "dead-sea": ["Dead Sea", "البحر الميت"],
    karak: ["Karak", "Kerak", "الكرك"],
    dana: ["Dana", "ضانا"],
    petra: ["Petra", "Wadi Musa", "البتراء", "وادي موسى"],
    "wadi-rum": ["Wadi Rum", "Wadi Ramm", "وادي رم"],
    aqaba: ["Aqaba", "العقبة"],
  };
  function startJordanCheckout(id) {
    openCheckout([id], { id: uid(), destination: "Jordan", date: "", travelers: 1, days: 1 });
  }
  function placeBookingOption(s) {
    const unit = s.priceUnit === "vehicle" || s.category === "transport"
      ? tr("per vehicle", "للمركبة")
      : tr("per traveler", "للمسافر");
    const details = [
      [tr("Price", "السعر"), money(Number(s.price)) + " / " + unit],
      [tr("Duration", "المدة"), s.duration],
      [tr("Capacity", "السعة"), s.capacity],
      [tr("Meeting point", "نقطة اللقاء"), s.meetingPoint],
      [tr("Availability", "التوفّر"), s.availability],
      [tr("Provider", "مقدّم التجربة"), s.supplierName],
    ];
    return `<article class="jordan-booking-option">
      <h3>${esc(serviceName(s))}</h3>
      <p>${esc(I.language === "ar" && s.descriptionAr ? s.descriptionAr : s.description)}</p>
      <dl>${details.filter(([, value]) => value).map(([label, value]) =>
        `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>
      ${s.isDemo ? `<p class="rx-notice">${tr("Sample experience", "تجربة تجريبية")}</p>` : ""}
      <button type="button" class="rx-button" data-experience="${esc(s.id)}">
        ${tr("Continue to booking", "تابع للحجز")}
      </button>
    </article>`;
  }
  function openPlaceBooking(chapter) {
    const photo = chapter.querySelector(".jordan-photo img");
    const name = chapter.querySelector("h1, h2").textContent;
    const aliases = jordanPlaceAliases[chapter.id].join("|");
    const placePattern = new RegExp("(?<![\\p{L}])(?:" + aliases + ")(?![\\p{L}])", "iu");
    const available = services().filter((s) =>
      placePattern.test([s.location, s.meetingPoint, s.destination, s.title, s.titleAr].join(" ")),
    );
    const dialog = makeDialog("jordan-booking");
    dialog.setAttribute("aria-labelledby", "jordan-booking-title");
    dialog.innerHTML = `
      <button class="rx-close" type="button" aria-label="${esc(t("close"))}" autofocus>×</button>
      <img src="${esc(photo.getAttribute("src"))}" alt="">
      <div class="jordan-booking-copy">
        <p class="eyebrow">${tr("Booking details", "تفاصيل الحجز")}</p>
        <h2 id="jordan-booking-title">${esc(name)}</h2>
        ${available.length ? available.map(placeBookingOption).join("") : `
          <p>${tr("There are no published experiences for this destination right now.", "ما في تجارب منشورة لهالوجهة حالياً.")}</p>
          <div class="jordan-actions">
            <a class="jordan-learn" href="../user/jordan-narrative.html#jordan-chapters-title">
              ${tr("Explore other destinations", "تصفّح باقي الوجهات")}
            </a>
          </div>`}
      </div>`;
    dialog.addEventListener("click", (event) => {
      if (event.target.closest(".rx-close")) dialog.close();
      const next = event.target.closest("[data-experience]");
      if (next) {
        dialog.close();
        startJordanCheckout(next.dataset.experience);
      }
    });
    dialog.showModal();
  }
  if (jordan) {
    jordan.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-jordan-book]");
      if (trigger) openPlaceBooking(trigger.closest(".jordan-chapter"));
    });
  }
  const feed = document.getElementById("community-feed");
  const commentsKey = "roamly-community-comments";
  const openComments = new Set();
  const videoUrls = new Map();
  let communityView = "all";
  let communityVideoDb;
  function videoStore(mode, operation) {
    communityVideoDb ??= new Promise((resolve, reject) => {
      const request = indexedDB.open("roamly-community-media", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("videos");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return communityVideoDb.then((db) => new Promise((resolve, reject) => {
      const transaction = db.transaction("videos", mode);
      const request = operation(transaction.objectStore("videos"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    }));
  }
  const seedPosts = [
    {
      id: "saja-diabat-petra",
      name: "Saja Diabat",
      place: "Petra, Jordan",
      placeAr: "البتراء، الأردن",
      kind: "review",
      photos: ["assets/img/community/petra.jpg"],
      video: "assets/video/community/petra.mp4",
      editorial: {
        en: "Petra is worth a day of its own. Give yourself time to walk the Siq, stop when the Treasury comes into view, and explore beyond the first photo. On Roamly you can compare local guides by what they cover and choose one whose pace gives you room to look around and ask questions.",
        ar: "البتراء بتستاهل يوم لحالها. خذ وقتك بالسيق، ووقف شوي أول ما تطلّ الخزنة، وكمّل جوا المدينة بعد أول صورة. على روملي بتقدر تقارن جولات الأدلاء المحليين حسب الأماكن اللي بمرّوا فيها، وتختار دليل يمشي معك على مهلك ويعطيك مجال تسأل وتتأمّل.",
      },
    },
    {
      id: "saja-diabat-wadi-rum",
      name: "Saja Diabat",
      place: "Wadi Rum, Jordan",
      placeAr: "وادي رم، الأردن",
      kind: "review",
      video: "assets/video/community/wadi-rum-saja.mp4",
      editorial: {
        en: "Wadi Rum rewards a slow afternoon. If you’re choosing a desert tour on Roamly, look for a local host who leaves time for stops among the sandstone formations and can suggest a spot to watch the last light. Check the route and meeting point with the host before you go.",
        ar: "وادي رم أحلى لما تعطيه وقت. إذا بتختار جولة صحراوية من روملي، شوف أي مضيف محلي بيعطيك وقت تنزل بين التشكيلات الصخرية، وبقدر يدلّك على مكان تشوف منه آخر ضوّ بالنهار. واتفق معه على المسار ونقطة اللقاء قبل ما تطلع.",
      },
    },
    {
      id: "raghad-wadi-rum",
      name: "Raghad Diabat",
      place: "Wadi Rum, Jordan",
      placeAr: "وادي رم، الأردن",
      kind: "review",
      photos: ["assets/img/community/wadi-rum-raghad.jpg"],
      editorial: {
        en: "A photo can be the start of planning your own day in Wadi Rum. Use Roamly to check which local providers offer a short scenic drive and which leave longer for walks or sunset stops. Ask the provider how much time you’ll have at each stop, especially if photography is the reason you’re going.",
        ar: "صورة وحدة ممكن تكون بداية تخطيط يومك بوادي رم. من روملي بتقدر تشوف مين من المورّدين المحليين عنده جولة قصيرة، ومين بترك وقت أطول للمشي أو وقفة الغروب. اسأل المورّد قديش بتطوّلوا بكل محطة، خصوصاً إذا رايح عشان التصوير.",
      },
    },
    {
      id: "seed-jordan",
      sample: true,
      place: "Petra, Jordan",
      rating: 5,
      photos: ["assets/img/jordan/petra-camel.jpg", "assets/img/jordan/dana.jpg", "assets/img/jordan/wadi-rum.jpg"],
      name: "Lina Haddad",
      kind: "itinerary",
      text: "Three days in Jordan: Petra at opening time, a slow afternoon in Dana, and sunset in Wadi Rum. Leave room for tea with your hosts.",
      textAr:
        "ثلاثة أيام في الأردن: البتراء عند الافتتاح، وعصر هادئ في ضانا، وغروب في وادي رم. اترك وقتاً للشاي مع أهل المكان.",
      likes: 24,
      plan: {
        id: "community-jordan",
        destination: "Jordan",
        days: 3,
        travelers: 2,
        budget: 200,
        date: "",
        style: "Culture & Nature",
        serviceIds: ["roam-demo-petra", "roam-demo-dana", "roam-demo-rum"],
      },
    },
    {
      id: "seed-bali",
      sample: true,
      place: "Bali, Indonesia",
      photos: ["assets/img/bali.png"],
      name: "Omar Saleh",
      kind: "tip",
      text: "Start your Ubud walk early, carry water, and ask before taking photos of people. A little care goes a long way.",
      textAr:
        "ابدأ المشي في أوبود باكراً، واحمل الماء، واستأذن قبل تصوير الناس. الاهتمام بالتفاصيل يصنع الفارق.",
      likes: 18,
    },
    {
      id: "seed-review",
      sample: true,
      place: "Aqaba, Jordan",
      photos: ["assets/img/jordan/aqaba.jpg"],
      rating: 5,
      name: "Maya Chen",
      kind: "review",
      text: "We ended our Aqaba trip with a walk by the water and seafood with friends. Sunset was our favorite part of the day.",
      textAr:
        "ختمنا رحلتنا بالعقبة بمشوار على الشط ووجبة سمك مع الأصحاب. الغروب كان أحلى لحظة باليوم.",
      likes: 12,
    },
  ];
  function posts() {
    return [...read("roamly-community-posts", []), ...seedPosts];
  }
  function communityAuthor() {
    const email = sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail");
    const account = read("roamlyLocalAccounts", []).find((a) => a.email === email);
    return account?.name || tr("Guest traveler", "مسافر زائر");
  }
  function reviewBookings() {
    const account = window.RoamlyPlatform?.account();
    if (account?.role !== "traveler") return [];
    return read(R, []).filter((row) => row.status === "Completed" && row.supplierId &&
      row.travelerEmail === account.email && !row.tripOnly);
  }
  function postComments(id) {
    const saved = read(commentsKey, []).filter((comment) => comment.postId === id);
    if (id !== "saja-diabat-petra") return saved;
    return [{
      name: tr("Petra local guide", "دليل محلي في البتراء"),
      text: tr(
        "Thanks for sharing Petra with the community, Saja! If you’re planning a first visit, ask your guide about walking time through the Siq and which stops suit your group. Happy to answer questions here.",
        "شكراً يا سجى على مشاركة البتراء مع الكوميونتي! إذا هاي أول زيارة إلكم، اسألوا دليلكم قديش بده المشي بالسيق وأي وقفات بتناسب مجموعتكم. يسعدنا نجاوب على أسئلتكم هون.",
      ),
      supplierReply: true,
      sample: true,
    }, ...saved];
  }
  function commentList(id) {
    return postComments(id).map((comment) =>
      '<li><strong>' + esc(comment.name) + '</strong>' +
      (comment.supplierReply ? '<span class="community-supplier-badge">' + (comment.sample
        ? tr("Sample supplier reply", "رد نموذجي من مورّد")
        : tr("Supplier reply", "رد المورّد")) + '</span>' : '') +
      '<p>' + esc(comment.text) + '</p></li>',
    ).join("");
  }
  function photoMarkup(photos, label, expandable = false) {
    const sources = (photos || []).filter((src) =>
      /^assets\/img\/[a-z0-9/_-]+\.(jpg|png|webp)$/i.test(src) ||
      /^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(src)
    );
    if (!sources.length) return "";
    return '<div class="community-photos" data-count="' + sources.length + '">' +
      sources.map((src, index) => {
        const alt = esc(label + " " + (index + 1));
        const image = '<img loading="lazy" src="' + esc(src.startsWith("assets/") ? "../shared/" + src : src) + '" alt="' + alt + '">';
        return expandable ? '<button type="button" class="community-photo-open" data-media-open aria-label="' +
          tr("Enlarge photo", "كبّر الصورة") + ' · ' + alt + '">' + image + '</button>' : image;
      }).join("") + "</div>";
  }

  async function prepareCommunityPhotos(files) {
    if (files.length > 3) throw new Error(tr("Choose up to three photos.", "اختار لحد ثلاث صور."));
    const photos = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) {
        throw new Error(tr("Use JPG, PNG or WebP photos under 15 MB each.", "اختار صور JPG أو PNG أو WebP بحجم أقل من ١٥ ميغابايت لكل صورة."));
      }
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        photos.push(canvas.toDataURL("image/jpeg", 0.72));
      } finally {
        bitmap.close();
      }
    }
    return photos;
  }

  function renderFeed() {
    if (!feed) return;
    const liked = read("roamly-community-likes", []);
    feed.innerHTML =
      '<p class="rx-tag">' +
      tr(
        "Posts are saved on this browser",
        "المنشورات محفوظة على هذا المتصفح",
      ) +
      "</p>" +
      posts().filter((p) => communityView === "all" || p.video || p.localVideo)
        .map(
          (p) => {
            const place = I.language === "ar" ? p.placeAr || p.place : p.place;
            const caption = I.language === "ar" ? p.textAr || p.text : p.text;
            const video = /^assets\/video\/community\/[a-z0-9-]+\.mp4$/i.test(p.video || "")
              ? '<video controls playsinline preload="metadata" src="../shared/' + esc(p.video) +
                '" aria-label="' + esc([p.name, place].filter(Boolean).join(" · ")) + '"></video>'
              : p.localVideo ? '<video controls playsinline preload="metadata" data-local-video="' +
                esc(p.id) + '" aria-label="' + esc([p.name, place].filter(Boolean).join(" · ")) + '"></video>' : "";
            return '<article class="rx-post" id="post-' + esc(p.id) + '"><header><span class="rx-avatar" aria-hidden="true">' +
            esc(
              p.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join(""),
            ) +
            "</span><div><strong>" +
            esc(p.name) +
            "</strong><br><small>" +
            t(p.kind) +
            (place ? " · " + esc(place) : "") +
            (p.sample ? " · " + tr("Sample post", "منشور تجريبي") : "") +
            "</small></div></header>" +
            (p.supplierReview ? '<p class="community-supplier-review"><span class="community-supplier-badge">' +
              tr("Completed booking", "حجز مكتمل") + '</span> <strong>' +
              esc(p.supplierReview.name) + '</strong> · ' + esc(p.supplierReview.experience) + '</p>' : "") +
            '<div class="community-post-media">' +
            photoMarkup(p.photos, place || tr("Trip photo", "صورة الرحلة"), true) +
            (video ? '<div class="community-video">' + video + '<button type="button" data-media-open class="community-video-open">' +
              tr("Expand video", "كبّر الفيديو") + '</button></div>' : "") + '</div>' +
            (p.rating ? '<p class="community-rating"><span aria-hidden="true">★</span> ' + esc(p.rating) + ' / 5</p>' : "") +
            (caption ? "<p>" + esc(caption) + "</p>" : "") +
            (p.editorial ? '<aside class="community-editorial-note"><strong>' +
              tr("Roamly travel note", "ملاحظة سفر من روملي") + '</strong><p>' +
              esc(tr(p.editorial.en, p.editorial.ar)) + '</p></aside>' : "") +
            '<div class="community-post-actions"><button type="button" data-like="' +
            esc(p.id) +
            '" aria-pressed="' +
            liked.includes(p.id) +
            '">' + (liked.includes(p.id) ? "♥ " : "♡ ") +
            t("like") +
            " " +
            ((p.likes || 0) + (liked.includes(p.id) ? 1 : 0)) +
            "</button>" +
            '<button type="button" data-comments="' + esc(p.id) + '" aria-expanded="' + openComments.has(p.id) +
            '" aria-controls="comments-' + esc(p.id) + '">' + tr("Comments", "التعليقات") +
            ' <span>' + postComments(p.id).length + '</span></button>' +
            '<button type="button" data-post-share="' + esc(p.id) + '">' + tr("Share link", "شارك الرابط") + '</button>' +
            (p.plan
              ? '<button type="button" data-copy="' + esc(p.id) + '">' + t("copy") + "</button>"
              : "") +
            '</div><section class="community-comments" id="comments-' + esc(p.id) + '"' +
            (openComments.has(p.id) ? '' : ' hidden') + '><ul>' + commentList(p.id) + '</ul>' +
            '<form data-comment-form="' + esc(p.id) + '"><label>' + tr("Write a comment", "اكتب تعليق") +
            '<input class="input" name="comment" required maxlength="500"></label><button type="submit">' +
            tr("Send", "إرسال") + '</button><p role="status"></p></form></section>' +
            '<p role="status" data-post-feedback="' +
            esc(p.id) +
            '"></p></article>';
          },
        )
        .join("");
    feed.classList.toggle("community-reels", communityView === "reels");
    for (const player of feed.querySelectorAll("[data-local-video]")) {
      const id = player.dataset.localVideo;
      if (videoUrls.has(id)) {
        player.src = videoUrls.get(id);
        continue;
      }
      videoStore("readonly", (store) => store.get(id)).then((blob) => {
        if (!blob || !player.isConnected) return;
        const url = URL.createObjectURL(blob);
        videoUrls.set(id, url);
        player.src = url;
      }).catch(() => {});
    }
  }
  renderFeed();
  if (feed) {
    const composer = document.getElementById("community-compose");
    const viewer = document.getElementById("community-media-viewer");
    const viewerContent = viewer.querySelector("[data-community-media-content]");
    viewer.addEventListener("close", () => {
      if (!viewer.open) viewerContent.replaceChildren();
    });
    const addPost = document.getElementById("community-add");
    const notice = document.getElementById("community-feedback");
    const viewButtons = [...document.querySelectorAll("[data-community-view]")];
    function setView(view) {
      communityView = view;
      for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.communityView === view));
      feed.tabIndex = view === "reels" ? 0 : -1;
      renderFeed();
      feed.scrollTop = 0;
    }
    for (const button of viewButtons) button.addEventListener("click", () => setView(button.dataset.communityView));
    function setComposerOpen(open) {
      composer.hidden = !open;
      addPost.setAttribute("aria-expanded", String(open));
      (open ? document.getElementById("post-kind") : addPost).focus();
    }
    addPost.addEventListener("click", () => setComposerOpen(composer.hidden));
    document.getElementById("community-close").addEventListener("click", () => setComposerOpen(false));
    composer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setComposerOpen(false);
    });
    feed.addEventListener("play", (event) => {
      for (const video of feed.querySelectorAll("video")) {
        if (video !== event.target) video.pause();
      }
    }, true);
    const linkTarget = document.getElementById(location.hash.slice(1));
    if (linkTarget?.parentElement === feed) requestAnimationFrame(() => linkTarget.scrollIntoView());
    feed.addEventListener("click", async (e) => {
      const mediaButton = e.target.closest("[data-media-open]");
      if (mediaButton) {
        const original = mediaButton.querySelector("img") || mediaButton.parentElement.querySelector("video");
        const src = original.currentSrc || original.src;
        if (!src) return;
        const media = document.createElement(original.localName);
        media.src = src;
        if (original instanceof HTMLVideoElement) {
          original.pause();
          media.controls = true;
          media.playsInline = true;
          media.setAttribute("aria-label", original.getAttribute("aria-label") || tr("Trip video", "فيديو الرحلة"));
          media.addEventListener("loadedmetadata", () => { media.currentTime = original.currentTime; }, { once: true });
        } else {
          media.alt = original.alt;
        }
        viewerContent.replaceChildren(media);
        viewer.showModal();
        if (media instanceof HTMLVideoElement) media.play().catch(() => {});
        return;
      }
      const like = e.target.closest("[data-like]"),
        copy = e.target.closest("[data-copy]"),
        comments = e.target.closest("[data-comments]"),
        share = e.target.closest("[data-post-share]");
      if (like) {
        let liked = read("roamly-community-likes", []);
        liked = liked.includes(like.dataset.like)
          ? liked.filter((id) => id !== like.dataset.like)
          : liked.concat(like.dataset.like);
        write("roamly-community-likes", liked);
        const isLiked = liked.includes(like.dataset.like);
        const base = posts().find((p) => p.id === like.dataset.like)?.likes || 0;
        like.setAttribute("aria-pressed", String(isLiked));
        like.textContent = (isLiked ? "♥ " : "♡ ") + t("like") + " " + (base + Number(isLiked));
      }
      if (comments) {
        const section = document.getElementById(comments.getAttribute("aria-controls"));
        section.hidden = !section.hidden;
        if (section.hidden) openComments.delete(comments.dataset.comments);
        else openComments.add(comments.dataset.comments);
        comments.setAttribute("aria-expanded", String(!section.hidden));
      }
      if (share) {
        const link = new URL(location.href);
        link.hash = "post-" + share.dataset.postShare;
        const feedback = share.closest("article").querySelector("[data-post-feedback]");
        try {
          await navigator.clipboard.writeText(link.href);
          feedback.textContent = tr("Link copied.", "تم نسخ الرابط.");
        } catch {
          const anchor = document.createElement("a");
          anchor.href = link.href;
          anchor.textContent = tr("Post link", "رابط المنشور");
          feedback.replaceChildren(anchor);
        }
      }
      if (copy) {
        const post = posts().find((p) => p.id === copy.dataset.copy);
        if (post?.plan) {
          const copied = { ...post.plan, id: uid(), date: "", createdAt: new Date().toISOString() };
          write(P, copied);
          const feedback = copy.closest("article").querySelector("[data-post-feedback]");
          feedback.textContent = t("copied");
          const a = document.createElement("a");
          a.href =
            "../user/ai-planner.html?" +
            new URLSearchParams({
              destination: copied.destination,
              travelers: String(copied.travelers),
              duration: copied.days + " days",
            });
          a.className = "rx-link";
          a.textContent = t("global");
          feedback.append(a);
        }
      }
    });
    feed.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-comment-form]");
      if (!form) return;
      event.preventDefault();
      const postId = form.dataset.commentForm;
      const text = form.elements.comment.value.trim();
      if (!text) return;
      const status = form.querySelector("[role=status]");
      try {
        const account = window.RoamlyPlatform?.account();
        const supplier = posts().find((p) => p.id === postId)?.supplierReview;
        const supplierReply = account?.role === "supplier" && account.id === supplier?.id;
        write(commentsKey, [...read(commentsKey, []), {
          postId, name: supplierReply ? supplier.name || account.name : communityAuthor(), text, supplierReply,
        }]);
        const article = form.closest("article");
        article.querySelector(".community-comments ul").innerHTML = commentList(postId);
        article.querySelector("[data-comments] span").textContent = postComments(postId).length;
        form.reset();
        status.textContent = tr("Comment posted.", "تم نشر تعليقك.");
      } catch {
        status.textContent = tr("Could not save the comment.", "تعذّر حفظ التعليق.");
      }
    });
    const photoInput = document.getElementById("post-photos");
    const videoInput = document.getElementById("post-video");
    const bookingInput = document.getElementById("post-booking");
    const kindInput = document.getElementById("post-kind");
    for (const booking of reviewBookings()) {
      bookingInput.add(new Option([booking.supplierName, booking.serviceTitle, booking.date].filter(Boolean).join(" · "), booking.id));
    }
    function updateBookingField() {
      bookingInput.hidden = kindInput.value !== "review" || bookingInput.options.length <= 1;
      document.getElementById("post-booking-label").hidden = bookingInput.hidden;
      if (bookingInput.hidden) bookingInput.value = "";
    }
    kindInput.addEventListener("change", updateBookingField);
    updateBookingField();
    const preview = document.getElementById("post-photo-preview");
    const publish = composer.querySelector('[type="submit"], button:not([type])');
    const status = document.getElementById("post-status");
    let photoSelection = 0;
    let photos = [];

    photoInput.addEventListener("change", async () => {
      const selection = ++photoSelection;
      photos = [];
      preview.hidden = true;
      preview.replaceChildren();
      status.textContent = "";
      publish.disabled = true;
      try {
        const selected = await prepareCommunityPhotos([...photoInput.files]);
        if (selection !== photoSelection) return;
        photos = selected;
        preview.innerHTML = photoMarkup(photos, tr("Selected photo", "صورة مختارة"));
        preview.hidden = photos.length === 0;
      } catch (error) {
        if (selection !== photoSelection) return;
        status.textContent = error instanceof DOMException
          ? tr("This photo could not be opened.", "تعذّر فتح الصورة.")
          : error.message;
        photoInput.value = "";
      } finally {
        if (selection === photoSelection) publish.disabled = false;
      }
    });

    composer.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = document.getElementById("post-text").value.trim(),
        kind = document.getElementById("post-kind").value,
        current = read(P, null),
        status = document.getElementById("post-status");
      if (!text || publish.disabled) return;
      if (kind === "itinerary" && !current) {
        status.textContent = t("needPlan");
        return;
      }
      const booking = kind === "review" && bookingInput.value
        ? reviewBookings().find((row) => row.id === bookingInput.value) : null;
      if (kind === "review" && bookingInput.value && !booking) {
        status.textContent = tr("This booking is no longer available for review.", "هالحجز ما عاد متاح للتقييم.");
        return;
      }
      const video = videoInput.files[0];
      if (video && (!["video/mp4", "video/webm"].includes(video.type) || video.size > 30 * 1024 * 1024)) {
        status.textContent = tr("Choose an MP4 or WebM video up to 30 MB.", "اختار فيديو MP4 أو WebM بحجم لحد ٣٠ ميغابايت.");
        return;
      }
      const p = {
        id: uid(),
        name: communityAuthor(),
        kind,
        text,
        place: document.getElementById("post-place").value.trim() || booking?.tripContext?.destination || "",
        rating: Number(document.getElementById("post-rating").value) || null,
        photos,
        ...(video ? { localVideo: true } : {}),
        ...(booking ? { supplierReview: {
          id: booking.supplierId, name: booking.supplierName, experience: booking.serviceTitle,
        } } : {}),
        likes: 0,
        createdAt: new Date().toISOString(),
        ...(kind === "itinerary" ? { plan: current } : {}),
      };
      publish.disabled = true;
      try {
        if (video) await videoStore("readwrite", (store) => store.put(video, p.id));
        write("roamly-community-posts", [p, ...read("roamly-community-posts", [])]);
        composer.reset();
        updateBookingField();
        photos = [];
        preview.hidden = true;
        preview.replaceChildren();
        status.textContent = "";
        notice.textContent = t("posted");
        setComposerOpen(false);
        setView(video ? "reels" : "all");
      } catch {
        if (video) videoStore("readwrite", (store) => store.delete(p.id)).catch(() => {});
        status.textContent = tr(
          "Unable to save this post. Browser storage may be full.",
          "تعذر حفظ المنشور. قد تكون مساحة التخزين ممتلئة.",
        );
      } finally { publish.disabled = false; }
    });
  }

  document.addEventListener("roamly:languagechange", () => {
    renderFeed();
    I.apply();
  });
  window.addEventListener("storage", (e) => {
    if (["roamly-community-posts", "roamly-community-likes", commentsKey].includes(e.key)) renderFeed();
  });
  window.RoamlyCommerce = {
    openCheckout,
    services,
    matches,
    matchesPlannerDestination,
    priceUnitLabel,
    cost,
    serviceCard,
    serviceDate,
    splitShares,
  };
  if (document.querySelector("[data-planner-form]"))
    window.dispatchEvent(new StorageEvent("storage", { key: S }));
  I.apply();
})();
