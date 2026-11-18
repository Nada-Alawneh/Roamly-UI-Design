(function () {
  "use strict";
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
  function renderGallery(host, service) {
    const sample = service.isDemo && /istanbul/i.test(service.serviceArea || service.location || service.destination || "");
    const local = ["istanbul-square.jpg", "istanbul-night.jpg", "istanbul-bridge.jpg"];
    const published = [service.coverImage, ...(Array.isArray(service.galleryImages) ? service.galleryImages : [])]
      .filter(Boolean).map((value) => safeImage(value, "")).filter(Boolean);
    const sources = [...new Set(sample ? [...published, ...local.map((file) => "../shared/assets/img/experiences/" + file)] : published)].slice(0, 6);
    if (!sources.length) return;

    const section = document.createElement("section");
    section.className = "supplier-photo-section";
    if (sample) section.append(makeText("h3", "supplier-photo-caption", "Istanbul destination photos"));
    const gallery = document.createElement("div");
    gallery.className = "supplier-photo-grid";
    for (const [index, source] of sources.entries()) {
      const image = document.createElement("img");
      image.src = source;
      image.alt = (sample ? "Istanbul" : service.title || "Experience") + " · " + (index + 1);
      image.loading = index ? "lazy" : "eager";
      image.onerror = () => {
        image.remove();
        if (!gallery.childElementCount) section.remove();
      };
      gallery.append(image);
    }
    section.append(gallery);
    if (sample) {
      const credits = makeText("a", "supplier-photo-caption", "Media credits");
      credits.href = "../shared/assets/img/experiences/CREDITS.md";
      credits.target = "_blank";
      credits.rel = "noopener";
      section.append(credits);
    }
    host.append(section);
  }

  function fillDetailsDialog(service, options) {
    var dialog = ensureDetailsDialog(), title = dialog.querySelector("#marketDetailsTitle"), content = dialog.querySelector("#marketDetailsContent");
    var arabic = window.RoamlyI18n?.language === "ar";
    title.textContent = (arabic && service.titleAr) || service.title || service.serviceType || "Experience"; content.replaceChildren();
    renderGallery(content, service);
    var summary = makeText("p", "market-details-dialog__description", (arabic && service.descriptionAr) || service.description); if (summary.textContent) content.appendChild(summary);
    var basic = document.createElement("section"); basic.className = "market-details-dialog__section"; basic.appendChild(makeText("h3", "", "Experience overview"));
    [["Provider", service.supplierName], ["Experience type", service.serviceType], ["Destination", service.serviceArea || service.location || service.destination], ["Price", service.price ? "USD " + service.price + (service.category === "equipment" ? " / item per day" : service.category === "reserves" ? " / guest per night" : service.category === "transport" ? " / vehicle" : " / traveler") : "Ask provider"], ["Duration", service.duration], ["Difficulty and suitability", service.difficulty], ["Maximum capacity", service.capacity], ["Meeting point", service.meetingPoint], ["Availability", service.availability]].forEach(function (row) { appendDetail(basic, row[0], row[1]); }); if (Number.isFinite(options.groupTotal)) appendDetail(basic, "Group estimate", new Intl.NumberFormat(arabic ? "ar-JO" : "en-US", { style: "currency", currency: "USD" }).format(options.groupTotal / 100)); content.appendChild(basic);
    var more = document.createElement("details");
    more.className = "supplier-detail-disclosure";
    more.append(makeText("summary", "", "Inclusions, terms and team"));
    var extraRows = [["What's included", service.included], ["What to bring", service.requirements], ["Safety and cancellation", service.safety]];
    extraRows.forEach(function (row) { if (!row[1]) return; var section = document.createElement("section"); section.className = "market-details-dialog__section"; section.appendChild(makeText("h3", "", row[0])); section.appendChild(makeText("p", "", row[1])); more.appendChild(section); });
    if (service.categoryDetails && Object.keys(service.categoryDetails).length) { var specific = document.createElement("section"); specific.className = "market-details-dialog__section"; specific.appendChild(makeText("h3", "", "Service-specific details")); Object.keys(service.categoryDetails).forEach(function (key) { appendDetail(specific, key.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) { return letter.toUpperCase(); }), service.categoryDetails[key]); }); more.appendChild(specific); }
    if ((service.team || []).length) { var team = document.createElement("section"); team.className = "market-details-dialog__section market-details-dialog__team"; team.appendChild(makeText("h3", "", "Your experience team")); service.team.forEach(function (person) { var member = document.createElement("article"); member.appendChild(makeText("strong", "", [person.name, person.role].filter(Boolean).join(" · "))); appendDetail(member, "Experience", person.experience); appendDetail(member, "Languages", person.languages); appendDetail(member, "Qualifications", person.qualifications); if (person.bio) member.appendChild(makeText("p", "", person.bio)); team.appendChild(member); }); more.appendChild(team); }
    if (more.childElementCount > 1) content.append(more);
    var accounts = []; try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
    var company = accounts.find(function (item) { return item.id === service.supplierId; });
    if (company && (company.businessDescription || company.phone)) { var about = document.createElement("section"); about.className = "market-details-dialog__section"; about.appendChild(makeText("h3", "", "About the provider")); if (company.businessDescription) about.appendChild(makeText("p", "", company.businessDescription)); if (company.phone) { var phone = document.createElement("a"); phone.className = "market-company-contact"; phone.href = "tel:" + String(company.phone).replace(/[^0-9+]/g, ""); phone.textContent = "Call " + company.phone; about.appendChild(phone); } content.appendChild(about); }
    if (options.bookingStatus) {
      var update = document.createElement("section");
      update.className = "market-details-dialog__section";
      update.append(makeText("h3", "", "Booking updates"));
      appendDetail(update, "Status", options.bookingStatus);
      content.append(update);
    }
    var actions = dialog.querySelector(".supplier-dialog-actions");
    actions.querySelectorAll("[data-details-link], [data-planner-dialog-action]").forEach((action) => action.remove());
    actions.querySelector("[data-close-market-details]").hidden = Boolean(options.renderActions);
    var contact = actions.querySelector("[data-contact-from-details]");
    contact.hidden = Boolean(options.href || options.decorate);
    if (options.href) {
      var link = makeText("a", "btn-gold", options.bookingStatus ? "Open booking conversations" : "Open in Experiences");
      link.dataset.detailsLink = "";
      link.href = options.href;
      link.target = "_blank";
      link.rel = "noopener";
      actions.append(link);
    }
    dialog.dataset.serviceId = service.id;
    if (options.decorate) options.decorate(content, dialog);
    if (options.renderActions) options.renderActions(actions, dialog);
    dialog.querySelector(".market-details-dialog__card").scrollTop = 0;
    return dialog;
  }

  document.addEventListener("click", function (event) {
    var close = event.target.closest("[data-close-market-details]");
    var dialog = document.getElementById("market-details-dialog");
    if (dialog?.open && (close || event.target === dialog)) dialog.close();
  });

  window.RoamlySupplierDetails = {
    open(service, options = {}) {
      var dialog = fillDetailsDialog(service, options);
      if (!dialog.open) dialog.showModal();
      window.RoamlyI18n?.apply();
    },
  };
})();
