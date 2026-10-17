/* ==========================================================================
   Roamly - page behaviour
   ========================================================================== */

var PER_PERSON = { 
  flights: 300, 
  hotel: 225, 
  transfers: 45, 
  tickets: 50 
};

var roamlyCurrency = { code: "USD", rates: { USD: 1 }, loaded: false, failed: false };
var roamlyCurrencyFallback = "USD EUR GBP JOD AED SAR QAR KWD BHD OMR EGP TRY CAD AUD NZD CHF CNY JPY KRW INR PKR BDT LKR IDR MYR SGD THB PHP VND HKD TWD MAD TND DZD ILS LBP IQD IRR ZAR NGN KES GHS UGX TZS ETB BRL MXN ARS CLP COP PEN UYU PLN CZK HUF RON BGN SEK NOK DKK ISK RUB UAH GEL AZN AMD KZT UZS NPR AFN MVR MUR XOF XAF XCD XPF ALL BAM RSD MKD MDL BYN DOP CRC GTQ HNL NIO PAB BOB PYG JMD TTD BBD BSD BZD FJD PGK WST TOP VUV SBD MNT KHR LAK MMK MOP MZN AOA ZMW ZWL MWK RWF BIF DJF SOS SDG SSP LYD MRU SLL GMD GNF CDF CVE STN ERN SZL LSL NAD BWP SCR KMF MGA MRO YER SYP TJS TMT KGS TTD".split(" ");

function selectedCurrencyCode() {
  try { return localStorage.getItem("roamlyCurrency") || "USD"; } catch (error) { return "USD"; }
}

function currencyFormatter(amount, fractionDigits) {
  var code = roamlyCurrency.code || "USD";
  var rate = roamlyCurrency.rates[code] || 1;
  var options = { style: "currency", currency: code };
  if (fractionDigits === true) options.maximumFractionDigits = new Intl.NumberFormat(undefined, { style: "currency", currency: code }).resolvedOptions().maximumFractionDigits;
  else options.maximumFractionDigits = 0;
  try { return new Intl.NumberFormat(undefined, options).format(amount * rate); }
  catch (error) { return "$" + (amount * rate).toLocaleString("en-US"); }
}

function usd(number, hasCents) {
  return currencyFormatter(number, hasCents === true);
}

function initCurrencySelector() {
  var triggers = document.querySelectorAll(".currency-switch-btn");
  if (!triggers.length) return;
  var code = selectedCurrencyCode();
  var dialog = document.createElement("dialog");
  dialog.className = "currency-dialog";
  dialog.setAttribute("aria-labelledby", "currency-dialog-title");
  dialog.innerHTML = '<div class="currency-dialog__top"><span class="currency-dialog__icon"><i class="fa-solid fa-coins" aria-hidden="true"></i></span><button class="currency-dialog__close" type="button" aria-label="Close currency picker"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div><p class="currency-dialog__eyebrow">YOUR DISPLAY PREFERENCE</p><h2 id="currency-dialog-title">Choose your currency</h2><p class="currency-dialog__lead">Prices across Roamly will be shown in your selected currency.</p><label class="currency-dialog__search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input type="search" autocomplete="off" placeholder="Search by country, name, or code" aria-label="Search currencies"></label><p class="currency-dialog__status" data-currency-status role="status" aria-live="polite">Loading exchange rates…</p><div class="currency-dialog__list" role="listbox" aria-label="Available currencies"></div><p class="currency-dialog__attribution">Indicative daily rates by <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer">ExchangeRate-API</a></p>';
  document.body.appendChild(dialog);
  var search = dialog.querySelector("input");
  var list = dialog.querySelector(".currency-dialog__list");
  var status = dialog.querySelector("[data-currency-status]");
  var names = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([navigator.language || "en"], { type: "currency" }) : null;
  var fallbackRates = null;
  try { fallbackRates = JSON.parse(localStorage.getItem("roamlyCurrencyRatesUSD") || "null"); } catch (error) { fallbackRates = null; }

  function symbolFor(currencyCode) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).formatToParts(0).filter(function (part) { return part.type === "currency"; }).map(function (part) { return part.value; }).join("");
    } catch (error) { return currencyCode; }
  }

  function labelFor(currencyCode) {
    var name = currencyCode;
    if (names) { try { name = names.of(currencyCode) || currencyCode; } catch (error) {} }
    return { name: name, symbol: symbolFor(currencyCode) };
  }

  function updateTriggerLabels() {
    var symbol = symbolFor(roamlyCurrency.code);
    triggers.forEach(function (trigger) {
      var value = trigger.querySelector("strong");
      if (value) value.textContent = roamlyCurrency.code + " (" + symbol + ")";
      else trigger.appendChild(document.createTextNode(" " + roamlyCurrency.code + " (" + symbol + ")"));
    });
  }

  function convertStaticPrices() {
    var priceAreas = document.querySelectorAll(".price, .deal-card__price, .plan-card__price");
    priceAreas.forEach(function (area) {
      var walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
      var textNodes = [];
      while (walker.nextNode()) if (/\$\s*[\d,]+(?:\.\d+)?/.test(walker.currentNode.nodeValue)) textNodes.push(walker.currentNode);
      textNodes.forEach(function (node) {
        if (node.__roamlyUsdSource === undefined) node.__roamlyUsdSource = node.nodeValue;
        node.nodeValue = node.__roamlyUsdSource.replace(/\$\s*([\d,]+(?:\.\d+)?)/g, function (match, value) {
          return currencyFormatter(Number(value.replace(/,/g, "")), /\.\d+/.test(value));
        });
      });
    });
  }

  function applyCurrency() {
    updateTriggerLabels();
    convertStaticPrices();
    document.dispatchEvent(new CustomEvent("roamly:currencychange", { detail: { code: roamlyCurrency.code } }));
  }

  function renderCurrencies(filter) {
    var codes = Array.from(new Set(Object.keys(roamlyCurrency.rates).concat(roamlyCurrencyFallback))).sort(function (a, b) {
      return labelFor(a).name.localeCompare(labelFor(b).name);
    });
    var query = filter.trim().toLocaleLowerCase();
    list.textContent = "";
    codes.filter(function (currencyCode) {
      var item = labelFor(currencyCode);
      return !query || currencyCode.toLowerCase().includes(query) || item.name.toLocaleLowerCase().includes(query) || item.symbol.toLocaleLowerCase().includes(query);
    }).forEach(function (currencyCode) {
      var item = labelFor(currencyCode);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "currency-option" + (currencyCode === roamlyCurrency.code ? " is-selected" : "");
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(currencyCode === roamlyCurrency.code));
      var details = document.createElement("span");
      details.className = "currency-option__details";
      var name = document.createElement("strong");
      name.textContent = item.name;
      var iso = document.createElement("small");
      iso.textContent = currencyCode;
      details.append(name, iso);
      var symbol = document.createElement("span");
      symbol.className = "currency-option__symbol";
      symbol.textContent = item.symbol;
      var check = document.createElement("i");
      check.className = "fa-solid fa-check";
      check.setAttribute("aria-hidden", "true");
      check.hidden = currencyCode !== roamlyCurrency.code;
      button.append(details, symbol, check);
      button.addEventListener("click", function () {
        roamlyCurrency.code = currencyCode;
        try { localStorage.setItem("roamlyCurrency", currencyCode); } catch (error) {}
        applyCurrency();
        renderCurrencies(search.value);
        dialog.close();
      });
      list.appendChild(button);
    });
    if (!list.children.length) {
      var none = document.createElement("p");
      none.className = "currency-dialog__no-results";
      none.textContent = "No currencies match that search. Try a country name or 3-letter code.";
      list.appendChild(none);
    }
  }

  function useRateData(data) {
    if (!data || data.result !== "success" || !data.rates) return false;
    roamlyCurrency.rates = data.rates;
    roamlyCurrency.loaded = true;
    var refreshAt = (data.time_next_update_unix || Math.floor(Date.now() / 1000) + 86400) * 1000;
    try { localStorage.setItem("roamlyCurrencyRatesUSD", JSON.stringify({ rates: data.rates, refreshAt: refreshAt })); } catch (error) {}
    status.textContent = "Rates updated daily. Search " + Object.keys(data.rates).length + " available currencies.";
    renderCurrencies(search.value);
    applyCurrency();
    return true;
  }

  if (fallbackRates && fallbackRates.rates && fallbackRates.refreshAt > Date.now()) useRateData({ result: "success", rates: fallbackRates.rates, time_next_update_unix: Math.floor(fallbackRates.refreshAt / 1000) });
  roamlyCurrency.code = code;
  updateTriggerLabels();
  renderCurrencies("");
  if (!roamlyCurrency.loaded) {
    fetch("https://open.er-api.com/v6/latest/USD").then(function (response) {
      if (!response.ok) throw new Error("Exchange rate request failed");
      return response.json();
    }).then(function (data) {
      if (!useRateData(data)) throw new Error("No exchange rates available");
    }).catch(function () {
      roamlyCurrency.failed = true;
      status.textContent = "Exchange rates could not load. Prices are still displayed in USD.";
      list.querySelectorAll(".currency-option").forEach(function (option) {
        if (option.getAttribute("aria-selected") !== "true") option.disabled = true;
      });
    });
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      renderCurrencies(search.value);
      dialog.showModal();
      search.focus();
    });
  });
  dialog.querySelector(".currency-dialog__close").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) { if (event.target === dialog) dialog.close(); });
  search.addEventListener("input", function () { renderCurrencies(search.value); });
  applyCurrency();
}

function initMenu() {
  var toggleButton = document.querySelector("[data-menu-toggle]");
  if (toggleButton === null) { return; }
  var header = toggleButton.closest(".site-header");
  toggleButton.addEventListener("click", function () {
    var isOpen = header.toggleAttribute("data-open");
    if (isOpen === true) { toggleButton.setAttribute("aria-expanded", "true"); }
    else { toggleButton.setAttribute("aria-expanded", "false"); }
  });
}

function initDialogs() {
  document.addEventListener("click", function (event) {
    var openButton = event.target.closest("[data-dialog-open]");
    if (openButton !== null) {
      event.preventDefault();
      var dialogId = openButton.getAttribute("data-dialog-open");
      var targetDialog = document.getElementById(dialogId);
      if (targetDialog !== null) { targetDialog.showModal(); }
      return;
    }
    var closeButton = event.target.closest("[data-dialog-close]");
    if (closeButton !== null) {
      var dialogToClose = closeButton.closest("dialog");
      if (dialogToClose !== null) { dialogToClose.close(); }
    }
  });

  var allDialogs = document.querySelectorAll("dialog.modal");
  for (var i = 0; i < allDialogs.length; i++) {
    allDialogs[i].addEventListener("click", function (event) {
      if (event.target === this) { this.close(); }
    });
  }
}

function initWelcomeFilm() {
  var dialog = document.getElementById("welcome-film");
  if (!dialog) { return; }
  var video = dialog.querySelector("video");
  var trigger = document.querySelector('[data-dialog-open="welcome-film"]');
  if (trigger && video) {
    trigger.addEventListener("click", function () {
      video.currentTime = 0;
      var playback = video.play();
      if (playback && typeof playback.catch === "function") playback.catch(function () {});
    });
  }
  dialog.addEventListener("close", function () {
    if (!video) { return; }
    video.pause();
    video.currentTime = 0;
  });
}

function renderQuote(travelers) {
  // Never divide by zero / NaN, whatever the caller passes in
  travelers = parseInt(travelers, 10);
  if (isNaN(travelers) || travelers < 1) { travelers = 1; }

  var perPersonTotal = PER_PERSON.flights + PER_PERSON.hotel + PER_PERSON.transfers + PER_PERSON.tickets;
  var totalAmount = perPersonTotal * travelers;
  // Split Bill = total amount divided by the number of travelers
  var splitPerPerson = totalAmount / travelers;
  var adultText = (travelers === 1) ? "Adult" : "Adults";

  var values = {};
  values["flights"] = usd(PER_PERSON.flights * travelers);
  values["hotel"] = usd(PER_PERSON.hotel * travelers);
  values["transfers"] = usd(PER_PERSON.transfers * travelers);
  values["tickets"] = usd(PER_PERSON.tickets * travelers);
  values["travelers"] = String(travelers);
  values["total"] = usd(totalAmount);
  values["total-cents"] = usd(totalAmount, true);
  values["total-label"] = "Total (For " + travelers + ")";
  values["per-person"] = usd(splitPerPerson, true) + " per person";
  values["split-formula"] = usd(totalAmount, true) + " / " + travelers + (travelers === 1 ? " traveler" : " travelers");
  values["party"] = travelers + " " + adultText;

  // One update path: every [data-quote] element (including Split Bill's
  // data-quote="per-person") is filled from the values map, synchronously.
  var elements = document.querySelectorAll("[data-quote]");
  for (var i = 0; i < elements.length; i++) {
    var el = elements[i];
    var key = el.getAttribute("data-quote");
    if (values[key] !== undefined) {
      el.textContent = values[key];
    }
  }
  updatePaymentSummary();
}

function updatePaymentSummary() {
  var checkout = document.getElementById("checkout");
  if (!checkout) { return; }
  var selected = checkout.querySelector('input[name="payment-option"]:checked');
  var isSplit = selected && selected.value === "split";
  var total = checkout.querySelector('[data-quote="total-cents"]');
  var perPerson = checkout.querySelector('[data-quote="per-person"]');
  var amount = checkout.querySelector("[data-payment-amount]");
  var label = checkout.querySelector("[data-payment-label]");
  var detail = checkout.querySelector("[data-payment-detail]");
  var splitNote = checkout.querySelector("[data-split-payment-note]");
  var continueButton = checkout.querySelector("[data-payment-continue]");
  if (!amount || !total) { return; }
  amount.textContent = isSplit && perPerson ? perPerson.textContent.replace(/\s+per person$/i, "") : total.textContent;
  if (label) { label.textContent = isSplit ? "Your share due today" : "Amount due today"; }
  if (detail) { detail.textContent = isSplit ? "Equal share; all travelers have 48 hours to pay" : "One payment for the full trip"; }
  if (splitNote) { splitNote.hidden = !isSplit; }
  if (continueButton) { continueButton.textContent = "Pay " + amount.textContent; }
}

function initPlannerPayment() {
  var checkout = document.getElementById("checkout");
  if (!checkout) { return; }
  checkout.querySelectorAll('input[name="payment-option"]').forEach(function (option) {
    option.addEventListener("change", function () {
      var status = checkout.querySelector("[data-payment-status]");
      if (status) status.hidden = true;
      updatePaymentSummary();
    });
  });
  var continueButton = checkout.querySelector("[data-payment-continue]");
  if (continueButton) {
    continueButton.addEventListener("click", function () {
      var fields = checkout.querySelectorAll("[name=cardholder], [name=cardnumber], [name=expiry], [name=securityCode]");
      for (var index = 0; index < fields.length; index++) {
        if (!fields[index].reportValidity()) return;
      }
      var selected = checkout.querySelector('input[name="payment-option"]:checked');
      prepareTripConfirmation(selected ? selected.value : "full");
      window.location.href = "trip.html?payment=" + (selected ? selected.value : "full");
    });
    checkout.addEventListener("submit", function (event) {
      event.preventDefault();
      continueButton.click();
    });
  }
  updatePaymentSummary();
}

function prepareTripConfirmation(paymentType) {
  var form = document.querySelector("[data-planner-form]");
  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").trim().toLowerCase();
  var profile = {};
  var accounts = [];
  try { profile = JSON.parse(localStorage.getItem("roamlyUserProfile:" + email) || "{}"); } catch (error) {}
  try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
  var account = accounts.find(function (item) { return item.email === email; });
  var travelerCount = form ? Math.max(1, Math.min(20, parseInt(form.elements.travelers.value, 10) || 1)) : 1;
  var durationText = form ? form.elements.duration.value : "6 Days Full Experience";
  var durationMatch = durationText.match(/(\d+)/);
  var durationDays = durationMatch ? parseInt(durationMatch[1], 10) : 6;
  var startValue = form ? form.elements.travelDate.value : "";
  var endValue = "";
  if (startValue) {
    var start = new Date(startValue + "T12:00:00");
    var end = new Date(start);
    end.setDate(end.getDate() + durationDays - 1);
    endValue = end.getFullYear() + "-" + String(end.getMonth() + 1).padStart(2, "0") + "-" + String(end.getDate()).padStart(2, "0");
  }
  var total = document.querySelector('.quote-total [data-quote="total"]');
  var amount = document.querySelector("[data-payment-amount]");
  var trip = {
    reference: "RMLY-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
    passengerName: profile.fullName || (account && account.name) || (email.endsWith("@roamly.com") ? "Nada Alawneh" : (email ? email.split("@")[0] : "Traveler")),
    email: email,
    origin: form ? form.elements.origin.value.trim() : "Amman, Jordan",
    destination: form ? form.elements.destination.value.trim() : "Your destination",
    travelers: travelerCount,
    startDate: startValue,
    endDate: endValue,
    duration: durationDays,
    travelStyle: form ? form.elements.style.value : "",
    budget: form ? form.elements.budget.value : "",
    total: total ? total.textContent.trim() : "",
    dueNow: amount ? amount.textContent.trim() : "",
    payment: paymentType,
    createdAt: new Date().toISOString()
  };
  sessionStorage.setItem("roamlyTripConfirmation", JSON.stringify(trip));
}

function initTripConfirmation() {
  var tripCard = document.querySelector(".trip-card");
  if (!tripCard) { return; }
  var boardingPassButton = document.querySelector("[data-boarding-passes-open]");
  var boardingPassDialog = document.getElementById("boarding-passes");
  if (boardingPassButton && boardingPassDialog) {
    boardingPassButton.addEventListener("click", function () {
      if (!boardingPassDialog.open) boardingPassDialog.showModal();
    });
  }
  var trip = {};
  try { trip = JSON.parse(sessionStorage.getItem("roamlyTripConfirmation") || "{}"); } catch (error) {}
  var params = new URLSearchParams(window.location.search);
  var paymentType = params.get("payment") || trip.payment || "full";
  tripCard.setAttribute("data-payment", paymentType === "split" ? "split" : "full");
  if (!trip.destination) {
    var fallbackStart = new Date();
    fallbackStart.setDate(fallbackStart.getDate() + 7);
    var fallbackEnd = new Date(fallbackStart);
    fallbackEnd.setDate(fallbackEnd.getDate() + 5);
    var demoEmail = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").trim().toLowerCase();
    var demoProfile = {};
    try { demoProfile = JSON.parse(localStorage.getItem("roamlyUserProfile:" + demoEmail) || "{}"); } catch (error) {}
    trip = {
      reference: "RMLY-" + Math.random().toString(36).slice(2, 7).toUpperCase(),
      passengerName: demoProfile.fullName || (demoEmail.endsWith("@roamly.com") ? "Nada Alawneh" : (demoEmail ? demoEmail.split("@")[0] : "Nada Alawneh")),
      origin: "Amman, Jordan",
      destination: "Istanbul, Turkey",
      travelers: 2,
      startDate: fallbackStart.toISOString().slice(0, 10),
      endDate: fallbackEnd.toISOString().slice(0, 10),
      duration: 6,
      travelStyle: "Cultural",
      budget: "Balanced",
      total: "$1,240",
      payment: paymentType
    };
  }

  function formatDate(value) {
    if (!value) { return "To be confirmed"; }
    var date = new Date(value + "T12:00:00");
    return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
  }
  var dates = trip.startDate ? formatDate(trip.startDate) + (trip.endDate ? " – " + formatDate(trip.endDate) : "") : "Dates to be confirmed";
  var reference = trip.reference || "RMLY-TRIP";
  var passengers = Math.max(1, parseInt(trip.travelers, 10) || 1);
  var departure = trip.origin || "Amman, Jordan";
  var destination = trip.destination || "Your destination";
  var durationDays = Math.max(1, parseInt(trip.duration, 10) || 6);
  var fullName = trip.passengerName || "Traveler";
  var airportCode = function (place) {
    var text = String(place || "").toLowerCase();
    if (text.indexOf("amman") !== -1 || text.indexOf("jordan") !== -1) return "AMM";
    if (text.indexOf("istanbul") !== -1 || text.indexOf("turkey") !== -1 || text.indexOf("türkiye") !== -1) return "IST";
    if (text.indexOf("dubai") !== -1) return "DXB";
    if (text.indexOf("bali") !== -1 || text.indexOf("denpasar") !== -1) return "DPS";
    if (text.indexOf("paris") !== -1 || text.indexOf("france") !== -1) return "CDG";
    if (text.indexOf("london") !== -1 || text.indexOf("uk") !== -1) return "LHR";
    if (text.indexOf("rome") !== -1 || text.indexOf("italy") !== -1) return "FCO";
    if (text.indexOf("new york") !== -1 || text.indexOf("usa") !== -1) return "JFK";
    return String(place || "TRIP").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase() || "TRP";
  };
  var originCode = airportCode(departure);
  var destinationCode = airportCode(destination);
  var flightDate = trip.startDate ? new Date(trip.startDate + "T12:00:00") : new Date();
  var flightDateLabel = new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(flightDate);
  var setText = function (selector, value) {
    var element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  setText("[data-trip-reference]", "#" + reference);
  setText("[data-trip-origin]", departure);
  setText("[data-trip-destination]", destination);
  setText("[data-trip-dates]", dates);
  setText("[data-trip-travelers]", passengers + (passengers === 1 ? " traveler" : " travelers"));

  var passList = document.querySelector("[data-boarding-pass-list]");
  if (!passList) { return; }
  passList.replaceChildren();
  for (var index = 0; index < passengers; index++) {
    var pass = document.createElement("article");
    pass.className = "boarding-pass";

    var main = document.createElement("div");
    main.className = "boarding-pass__main";
    var brand = document.createElement("header");
    brand.className = "boarding-pass__brand";
    var brandName = document.createElement("strong");
    brandName.textContent = "ROAMLY AIR";
    var sample = document.createElement("span");
    sample.textContent = "SAMPLE BOARDING PASS";
    brand.append(brandName, sample);

    var passenger = document.createElement("div");
    passenger.className = "boarding-pass__passenger-block";
    var passengerLabel = document.createElement("span");
    passengerLabel.textContent = "PASSENGER NAME";
    var passengerName = document.createElement("h3");
    passengerName.className = "boarding-pass__passenger";
    passengerName.textContent = index === 0 ? fullName : "GUEST TRAVELER " + String(index + 1).padStart(2, "0");
    passenger.append(passengerLabel, passengerName);

    var route = document.createElement("div");
    route.className = "boarding-pass__route";
    [[originCode, departure, "FROM"], [destinationCode, destination, "TO"]].forEach(function (place, placeIndex) {
      if (placeIndex === 1) {
        var flightPath = document.createElement("div");
        flightPath.className = "boarding-pass__flight-path";
        var planeIcon = document.createElement("i");
        planeIcon.className = "fa-solid fa-plane";
        planeIcon.setAttribute("aria-hidden", "true");
        flightPath.appendChild(planeIcon);
        route.appendChild(flightPath);
      }
      var airport = document.createElement("div");
      airport.className = "boarding-pass__airport";
      var code = document.createElement("strong");
      code.textContent = place[0];
      var city = document.createElement("span");
      city.textContent = place[1];
      var label = document.createElement("small");
      label.textContent = place[2];
      airport.append(label, code, city);
      route.appendChild(airport);
    });

    var tripMeta = document.createElement("div");
    tripMeta.className = "boarding-pass__meta";
    [["TRIP LENGTH", durationDays + (durationDays === 1 ? " DAY" : " DAYS")], ["TRAVEL STYLE", trip.travelStyle || "Flexible"], ["BUDGET", trip.budget || "Balanced"], ["ESTIMATED TOTAL", trip.total || "See trip estimate"]].forEach(function (fact) {
      var item = document.createElement("div");
      var label = document.createElement("span");
      label.textContent = fact[0];
      var value = document.createElement("strong");
      value.textContent = fact[1];
      item.append(label, value);
      tripMeta.appendChild(item);
    });

    var details = document.createElement("div");
    details.className = "boarding-pass__details";
    [["FLIGHT", "RA 204"], ["DATE", flightDateLabel], ["BOARDING", "08:15"], ["DEPARTURE", "09:05"], ["ARRIVAL", "11:30"], ["GATE", "B12"], ["SEAT", "14A"], ["GROUP", "02"], ["PASSENGER", String(index + 1) + " / " + String(passengers)]].forEach(function (fact) {
      var item = document.createElement("div");
      var label = document.createElement("span");
      label.textContent = fact[0];
      var value = document.createElement("strong");
      value.textContent = fact[1];
      item.append(label, value);
      details.appendChild(item);
    });
    main.append(brand, passenger, route, tripMeta, details);

    var stub = document.createElement("aside");
    stub.className = "boarding-pass__stub";
    var tripCode = document.createElement("span");
    tripCode.textContent = "BOOKING CODE";
    var code = document.createElement("strong");
    code.textContent = reference.slice(-5);
    var barcode = document.createElement("div");
    barcode.className = "boarding-pass__barcode";
    barcode.setAttribute("aria-hidden", "true");
    var stubRoute = document.createElement("span");
    stubRoute.textContent = originCode + "  →  " + destinationCode;
    stub.append(tripCode, code, barcode, stubRoute);
    pass.append(main, stub);
    passList.appendChild(pass);
  }
}

function prefillPlannerFromQuery(form) {
  var params = new URLSearchParams(window.location.search);
  var destination = params.get("destination");
  var travelers = params.get("travelers");
  var budget = params.get("budget");
  var style = params.get("style");
  var duration = params.get("duration");
  var travelDate = params.get("travelDate");
  var vibe = params.get("vibe");
  var range = params.get("range");
  var travelDefaults = readRoamlySettings(getRoamlyItineraryEmail());
  if (travelDefaults.rememberDefaults) {
    if (!travelers) travelers = String(travelDefaults.travelers || "");
    if (!budget) budget = travelDefaults.budget || "";
    if (!style) style = travelDefaults.style || "";
  }
  var destinationField = form.elements.namedItem("destination");
  var travelersField = form.elements.namedItem("travelers");

  if (destination && destinationField) destinationField.value = destination;
  if (travelers && travelersField && Number(travelers) >= 1 && Number(travelers) <= 20) {
    travelersField.value = String(parseInt(travelers, 10));
  }

  var durationField = form.elements.namedItem("duration");
  if (duration && durationField && Array.from(durationField.options).some(function (option) { return option.value.toLowerCase() === duration.toLowerCase(); })) {
    durationField.value = duration;
  }
  var travelDateField = form.elements.namedItem("travelDate");
  if (travelDate && travelDateField && /^\d{4}-\d{2}-\d{2}$/.test(travelDate)) travelDateField.value = travelDate;

  if (!budget && range) {
    if (/under\s*\$?500/i.test(range)) budget = "Budget";
    else if (/1,000\s*-\s*2,500|2,500\+/i.test(range)) budget = "Luxury";
    else budget = "Balanced";
  }
  var budgetField = form.elements.namedItem("budget");
  if (budget && budgetField && Array.from(budgetField.options).some(function (option) { return option.value.toLowerCase() === budget.toLowerCase(); })) {
    budgetField.value = budget;
  }

  if (!style && vibe) {
    if (/honeymoon|relax/i.test(vibe)) style = "Relax & Beach";
    else if (/family|adventure|outdoors/i.test(vibe)) style = "Adventure & Outdoors";
    else if (/culture|food/i.test(vibe)) style = "Culture & Food";
  }
  var styleField = form.elements.namedItem("style");
  if (style && styleField && Array.from(styleField.options).some(function (option) { return option.value.toLowerCase() === style.toLowerCase(); })) {
    styleField.value = style;
  }
}

function initDestinationAutocomplete(inputId, listId, toggleId) {
  var input = document.getElementById(inputId || "destinationSearch");
  var list = document.getElementById(listId || "destinationSuggestions");
  var toggle = document.getElementById(toggleId || "destinationToggle");
  if (input === null || list === null || toggle === null) return;

  var countries = "Afghanistan|Albania|Algeria|Andorra|Angola|Antigua and Barbuda|Argentina|Armenia|Australia|Austria|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belgium|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burundi|Cambodia|Cameroon|Canada|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Congo|Costa Rica|Croatia|Cuba|Cyprus|Czechia|Denmark|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Estonia|Eswatini|Ethiopia|Fiji|Finland|France|Gabon|Gambia|Georgia|Germany|Ghana|Greece|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|Iceland|India|Indonesia|Iran|Iraq|Ireland|Israel|Italy|Jamaica|Japan|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Liechtenstein|Lithuania|Luxembourg|Madagascar|Malawi|Malaysia|Maldives|Mali|Malta|Marshall Islands|Mauritania|Mauritius|Mexico|Micronesia|Moldova|Monaco|Mongolia|Montenegro|Morocco|Mozambique|Myanmar|Namibia|Nauru|Nepal|Netherlands|New Zealand|Nicaragua|Niger|Nigeria|North Korea|North Macedonia|Norway|Oman|Pakistan|Palau|Palestine|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Portugal|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|Sao Tome and Principe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Singapore|Slovakia|Slovenia|Solomon Islands|Somalia|South Africa|South Korea|South Sudan|Spain|Sri Lanka|Sudan|Suriname|Sweden|Switzerland|Syria|Taiwan|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Uzbekistan|Vanuatu|Vatican City|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe".split("|").map(function (name) {
    return { name: name, type: "Country" };
  });
  var cities = [
    "Amman, Jordan", "Aqaba, Jordan", "Abu Dhabi, United Arab Emirates", "Dubai, United Arab Emirates",
    "Istanbul, Turkey", "Cappadocia, Turkey", "Paris, France", "Nice, France", "Rome, Italy", "Venice, Italy",
    "London, United Kingdom", "Edinburgh, United Kingdom", "New York, United States", "Los Angeles, United States",
    "Toronto, Canada", "Vancouver, Canada", "Tokyo, Japan", "Kyoto, Japan", "Seoul, South Korea",
    "Bangkok, Thailand", "Phuket, Thailand", "Bali, Indonesia", "Singapore", "Kuala Lumpur, Malaysia",
    "Athens, Greece", "Santorini, Greece", "Barcelona, Spain", "Madrid, Spain", "Lisbon, Portugal",
    "Cairo, Egypt", "Marrakech, Morocco", "Cape Town, South Africa", "Sydney, Australia", "Reykjavik, Iceland",
    "Doha, Qatar", "Muscat, Oman", "Beirut, Lebanon", "Riyadh, Saudi Arabia"
  ].map(function (name) {
    return { name: name, type: "Popular city" };
  });
  var destinations = countries.concat(cities);
  var popular = ["Amman, Jordan", "Dubai, United Arab Emirates", "Istanbul, Turkey", "Paris, France", "Rome, Italy", "Tokyo, Japan", "Bali, Indonesia", "Maldives"];
  var activeIndex = -1;
  var optionId = 0;

  function normalize(value) {
    return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function closeList() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    activeIndex = -1;
  }

  function renderOptions(query) {
    list.textContent = "";
    activeIndex = -1;
    optionId += 1;

    var normalizedQuery = normalize(query.trim());
    var matches = normalizedQuery
      ? destinations.filter(function (destination) { return normalize(destination.name).indexOf(normalizedQuery) !== -1; }).slice(0, 9)
      : popular.map(function (name) { return destinations.find(function (destination) { return destination.name === name; }); });

    var heading = document.createElement("div");
    heading.className = "destination-suggestions__heading";
    heading.setAttribute("role", "presentation");
    heading.textContent = normalizedQuery ? "Matching destinations" : "Popular destinations";
    list.appendChild(heading);

    if (matches.length === 0) {
      var empty = document.createElement("div");
      empty.className = "destination-suggestions__empty";
      empty.setAttribute("role", "presentation");
      empty.textContent = "No match yet - keep typing or enter your own destination.";
      list.appendChild(empty);
      return;
    }

    matches.forEach(function (destination, index) {
      var option = document.createElement("div");
      option.className = "destination-suggestion";
      option.id = "destination-suggestion-" + optionId + "-" + index;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.setAttribute("data-value", destination.name);

      var name = document.createElement("span");
      name.className = "destination-suggestion__name";
      name.textContent = destination.name;
      var type = document.createElement("span");
      type.className = "destination-suggestion__type";
      type.textContent = destination.type;
      option.appendChild(name);
      option.appendChild(type);
      list.appendChild(option);
    });
  }

  function openList(query) {
    renderOptions(query);
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-expanded", "true");
  }

  function chooseOption(option) {
    if (!option) return;
    input.value = option.getAttribute("data-value");
    closeList();
    input.focus();
  }

  function setActive(index) {
    var options = list.querySelectorAll('[role="option"]');
    if (options.length === 0) return;
    activeIndex = Math.max(0, Math.min(index, options.length - 1));
    for (var i = 0; i < options.length; i++) {
      var isActive = i === activeIndex;
      options[i].setAttribute("aria-selected", isActive ? "true" : "false");
      if (isActive) {
        input.setAttribute("aria-activedescendant", options[i].id);
        options[i].scrollIntoView({ block: "nearest" });
      }
    }
  }

  input.addEventListener("focus", function () { openList(input.value); });
  input.addEventListener("input", function () { openList(input.value); });
  toggle.addEventListener("click", function () {
    input.focus();
    openList(input.value);
  });
  input.addEventListener("keydown", function (event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (list.hidden) openList(input.value);
      setActive(activeIndex + 1);
    } else if (event.key === "ArrowUp" && !list.hidden) {
      event.preventDefault();
      setActive(activeIndex < 0 ? 0 : activeIndex - 1);
    } else if (event.key === "Enter" && !list.hidden && activeIndex >= 0) {
      event.preventDefault();
      chooseOption(list.querySelectorAll('[role="option"]')[activeIndex]);
    } else if (event.key === "Escape" && !list.hidden) {
      event.preventDefault();
      closeList();
    }
  });
  list.addEventListener("pointerdown", function (event) {
    var option = event.target.closest('[role="option"][data-value]');
    if (option !== null) {
      event.preventDefault();
      chooseOption(option);
    }
  });
  document.addEventListener("pointerdown", function (event) {
    if (!input.closest(".destination-combobox").contains(event.target)) closeList();
  });
}

function initPlanner() {
  var form = document.querySelector("[data-planner-form]");
  var plan = document.querySelector("[data-plan]");
  if (form === null || plan === null) { return; }
  var optionsDialog = document.getElementById("planner-options");

  prefillPlannerFromQuery(form);

  function readPlannerUser() {
    return (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").trim().toLowerCase();
  }

  function hasUsedFreePlan(email) {
    var key = "roamlyFreePlanUsed:" + email;
    try { if (localStorage.getItem(key) === "1") return true; } catch (error) {}
    try { return sessionStorage.getItem(key) === "1"; } catch (error) { return false; }
  }

  var generateButton = form.querySelector('button[type="submit"]');
  function setGenerateButtonLabel(label) {
    if (generateButton) generateButton.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> ' + label;
  }

  setGenerateButtonLabel(readPlannerUser() && hasUsedFreePlan(readPlannerUser()) ? "Generate another plan" : "Generate your free plan");

  function readPlannerValues() {
    return {
      origin: form.elements.namedItem("origin").value,
      destination: form.elements.namedItem("destination").value,
      travelers: form.elements.namedItem("travelers").value,
      duration: form.elements.namedItem("duration").value,
      travelDate: form.elements.namedItem("travelDate").value,
      budget: form.elements.namedItem("budget").value,
      style: form.elements.namedItem("style").value
    };
  }

  function restorePendingPlanner() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("resume") !== "1") return false;

    var pending = null;
    try { pending = JSON.parse(sessionStorage.getItem("roamlyPendingPlanner") || "null"); } catch (error) {}
    sessionStorage.removeItem("roamlyPendingPlanner");
    if (!pending) return false;

    ["origin", "destination", "travelers", "duration", "travelDate", "budget", "style"].forEach(function (name) {
      var field = form.elements.namedItem(name);
      if (field && pending[name] !== undefined) field.value = pending[name];
    });
    return true;
  }

  var dateField = form.elements.namedItem("travelDate");
  function toLocalIsoDate(date) {
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }
  function shiftIsoDate(isoDate, days) {
    var date = new Date(isoDate + "T12:00:00");
    date.setDate(date.getDate() + days);
    return toLocalIsoDate(date);
  }
  if (dateField && !dateField.value) dateField.value = toLocalIsoDate(new Date());
  if (dateField) dateField.min = toLocalIsoDate(new Date());

  var shouldResumeGeneration = restorePendingPlanner();

  function getTravelersCount() {
    var inputField = form.elements.namedItem("travelers");
    if (!inputField) return 1;
    var num = parseInt(inputField.value, 10);
    if (isNaN(num) === true) { num = 1; }
    if (num < 1) { num = 1; }
    if (num > 20) { num = 20; }
    return num;
  }

  function showPlan() {
    plan.hidden = false;
    setGenerateButtonLabel("Generate another plan");
    var count = getTravelersCount();
    renderQuote(count);
    setWeatherMode(false, true);
  }

  var dayList = plan.querySelector("[data-day-list]");
  var dayTemplates = [
    ["Historic Istanbul", ["Start in Sultanahmet", "Visit Hagia Sophia and the Blue Mosque", "Lunch near the historic square", "Walk the waterfront at sunset"]],
    ["Markets and the old city", ["Browse the Grand Bazaar", "Explore the Spice Bazaar", "Pause for Turkish coffee", "See the city from a Galata viewpoint"]],
    ["Galata and Karaköy", ["Walk Galata’s historic lanes", "Explore Karaköy’s waterfront", "Choose a local lunch spot", "Take an evening Bosphorus ferry"]],
    ["Palaces and the Bosphorus", ["Visit Dolmabahçe Palace", "Stroll along the Bosphorus", "Explore the Beşiktaş neighborhood", "Enjoy a relaxed dinner nearby"]],
    ["Across to the Asian side", ["Take the ferry to Kadıköy", "Explore the market streets", "Have lunch by the waterfront", "Watch sunset from Moda coast"]],
    ["A slower island day", ["Take a ferry to the Princes’ Islands", "Explore the island at your own pace", "Pause for a seaside lunch", "Return to the city in the afternoon"]],
    ["Colorful neighborhoods", ["Walk through Balat and Fener", "Visit neighborhood landmarks", "Try a local café", "Take an easy Golden Horn stroll"]],
    ["Wellness and free time", ["Enjoy a traditional hammam", "Keep the afternoon open", "Browse a neighborhood you loved", "Choose dinner close to your stay"]],
    ["Food and favorite finds", ["Visit a local food market", "Join a tasting or cooking session", "Revisit a favorite district", "Enjoy a final evening by the water"]],
    ["A gentle farewell", ["Have a relaxed breakfast", "Pick up last-minute souvenirs", "Leave time for your transfer", "Depart with a little room to spare"]]
  ];
  var generalDayTitles = ["Arrival and orientation", "Landmarks and local culture", "Neighborhoods at your pace", "A day for local flavors", "Scenic highlights", "A little time to unwind", "Local discoveries", "An easy day out", "Your favorite finds", "A gentle farewell"];
  var rainIdeasByDay = [
    ["Start at a covered café near the old city", "Explore an indoor museum or landmark", "Take a longer lunch close by", "Wind down over tea in a sheltered spot"],
    ["Browse a covered market at an easy pace", "Try an indoor food hall or tasting", "Pause for Turkish coffee", "Visit a gallery or cultural space"],
    ["Choose a neighborhood gallery", "Settle into a covered café", "Keep lunch close to your next stop", "Explore a bookshop or local design store"],
    ["Spend more time inside a palace or museum", "Take a relaxed café break", "Choose a nearby indoor lunch", "Enjoy a hammam or wellness stop"],
    ["Visit an indoor cultural landmark", "Explore a covered market", "Have lunch somewhere sheltered", "Choose a cozy café for the evening"],
    ["Plan a slow breakfast indoors", "Book a hammam or spa visit", "Try a local cooking or tasting session", "Keep the evening close to your stay"],
    ["Explore an indoor exhibit", "Visit a craft or design workshop", "Take a warm café break", "Choose a covered dinner spot"],
    ["Leave the morning flexible", "Pick a museum or indoor attraction", "Enjoy a long local lunch", "Browse a covered market"],
    ["Return to a favorite indoor stop", "Shop in a covered arcade", "Take a final coffee break", "Choose a relaxed indoor dinner"],
    ["Have breakfast near your stay", "Pick up essentials from a covered shop", "Keep time open for your transfer", "Set out with weather-ready layers"]
  ];
  var generalRainIdeasByDay = [
    ["Start at a covered café near your stay", "Choose an indoor museum or landmark", "Take a longer lunch close by", "Wind down in a sheltered spot"],
    ["Browse a covered market", "Try an indoor food hall", "Pause for a warm drink", "Visit a gallery or cultural space"],
    ["Choose a neighborhood gallery", "Settle into a covered café", "Keep lunch close to your next stop", "Explore a local bookshop"],
    ["Spend more time inside a landmark", "Take a relaxed café break", "Choose a nearby indoor lunch", "Consider a wellness stop"],
    ["Visit an indoor cultural attraction", "Explore a covered market", "Have lunch somewhere sheltered", "Choose a cozy café for the evening"],
    ["Plan a slow breakfast indoors", "Book a spa or wellness visit", "Try a local cooking or tasting session", "Keep the evening close to your stay"],
    ["Explore an indoor exhibit", "Visit a craft or design workshop", "Take a warm café break", "Choose a covered dinner spot"],
    ["Leave the morning flexible", "Pick a museum or indoor attraction", "Enjoy a long local lunch", "Browse a covered arcade"],
    ["Return to a favorite indoor stop", "Shop in a covered arcade", "Take a final coffee break", "Choose a relaxed indoor dinner"],
    ["Have breakfast near your stay", "Pick up essentials from a covered shop", "Keep time open for your transfer", "Set out with weather-ready layers"]
  ];
  var weatherAdjustments = {};

  function renderPlannerDays() {
    if (!dayList) return;
    var values = readPlannerValues();
    var match = String(values.duration).match(/^(\d+)/);
    var dayCount = match ? Math.max(1, Math.min(10, Number(match[1]))) : 6;
    var destination = String(values.destination || "Somewhere new").trim() || "Somewhere new";
    var isIstanbul = /istanbul/i.test(destination);
    document.querySelectorAll("[data-plan-title]").forEach(function (title) { title.textContent = destination; });
    document.querySelectorAll("[data-plan-length]").forEach(function (length) { length.textContent = dayCount + (dayCount === 1 ? " day" : " days"); });
    var mapCard = plan.querySelector(".map-card");
    if (mapCard) mapCard.hidden = !isIstanbul;
    dayList.replaceChildren();

    for (var dayIndex = 0; dayIndex < dayCount; dayIndex += 1) {
      var template = dayTemplates[dayIndex];
      var displayDayTitle = isIstanbul ? template[0] : generalDayTitles[dayIndex];
      var dayCard = document.createElement("article");
      dayCard.className = "card day-card";
      var heading = document.createElement("header");
      heading.className = "day-card__head";
      var headingGroup = document.createElement("div");
      headingGroup.className = "day-card__heading";
      var chip = document.createElement("span");
      chip.className = "day-card__chip";
      chip.textContent = "DAY " + String(dayIndex + 1).padStart(2, "0");
      var titleEl = document.createElement("h3");
      titleEl.className = "day-card__title";
      titleEl.textContent = displayDayTitle;
      headingGroup.append(chip, titleEl);
      heading.append(headingGroup);
      var tripDate = shiftIsoDate(values.travelDate || toLocalIsoDate(new Date()), dayIndex);
      var dateLabel = document.createElement("time");
      dateLabel.className = "day-card__date";
      dateLabel.dateTime = tripDate;
      dateLabel.textContent = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(tripDate + "T12:00:00"));
      heading.append(dateLabel);
      dayCard.append(heading);
      var timeline = document.createElement("div");
      timeline.className = "timeline";
      template[1].forEach(function (activity, activityIndex) {
        var item = document.createElement("article");
        item.className = "timeline__item";
        var time = document.createElement("time");
        time.className = "timeline__time";
        time.textContent = ["09:30 AM", "12:30 PM", "03:30 PM", "06:00 PM"][activityIndex];
        var detail = document.createElement("div");
        var activityTitle = document.createElement("div");
        activityTitle.className = "timeline__title";
        var activityText = document.createElement("span");
        var isRainy = Boolean(weatherAdjustments[dayIndex]);
        activityText.textContent = isRainy ? (isIstanbul ? rainIdeasByDay[dayIndex][activityIndex] : generalRainIdeasByDay[dayIndex][activityIndex]) : (isIstanbul ? activity : ["Get oriented in a signature district", "Visit a landmark or cultural highlight", "Take a relaxed local food break", "Leave time for an easy evening"][activityIndex]);
        var wand = document.createElement("button");
        wand.type = "button";
        wand.className = "timeline__swap";
        wand.dataset.planChange = "true";
        wand.dataset.dayNumber = String(dayIndex + 1);
        wand.dataset.dayTitle = displayDayTitle + (isIstanbul ? "" : " · " + destination);
        wand.dataset.activityTitle = activityText.textContent;
        wand.setAttribute("aria-label", "Request a change to " + activityText.textContent);
        wand.title = "Request a change to this stop";
        wand.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>';
        activityTitle.append(activityText, wand);
        var description = document.createElement("p");
        description.className = "timeline__text";
        description.textContent = isRainy ? "Rain mode: this idea favors an indoor or covered stop." : (isIstanbul ? "A flexible suggestion; confirm opening hours and availability before you go." : "A flexible planning idea to personalize with your travel desk.");
        detail.append(activityTitle, description);
        item.append(time, detail);
        timeline.append(item);
      });
      dayCard.append(timeline);
      dayList.append(dayCard);
    }
  }

  var weatherButton = plan.querySelector("[data-weather-regenerate]");
  var weatherLabel = plan.querySelector("[data-weather-label]");
  var weatherValue = plan.querySelector("[data-weather-value]");
  var weatherFeedback = plan.querySelector("[data-weather-feedback]");
  var clothingTip = plan.querySelector("[data-weather-clothing]");
  var rainModeEnabled = false;

  function setWeatherMode(enabled, quiet) {
    rainModeEnabled = enabled;
    weatherAdjustments = {};
    var match = String(readPlannerValues().duration).match(/^(\d+)/);
    var dayCount = match ? Math.max(1, Math.min(10, Number(match[1]))) : 6;
    if (enabled) {
      for (var rainyDay = 0; rainyDay < dayCount; rainyDay += 1) weatherAdjustments[rainyDay] = true;
    }
    if (weatherButton) {
      weatherButton.setAttribute("aria-pressed", enabled ? "true" : "false");
      weatherButton.innerHTML = enabled
        ? '<i class="fa-solid fa-sun" aria-hidden="true"></i> Restore original ideas'
        : '<i class="fa-solid fa-cloud-rain" aria-hidden="true"></i> Rain outside? Refresh my ideas';
    }
    if (weatherLabel) weatherLabel.textContent = enabled ? "Rain mode" : "Plan mode";
    if (weatherValue) weatherValue.textContent = enabled
      ? "Your days now favor indoor and covered activities."
      : "Switch to rain mode whenever you need indoor ideas.";
    if (weatherFeedback) weatherFeedback.textContent = enabled
      ? "Rain mode is on. A refreshed itinerary and clothing tip are ready."
      : (quiet ? "" : "Your original itinerary ideas are back.");
    if (clothingTip) clothingTip.hidden = !enabled;
    if (plan && !plan.hidden) renderPlannerDays();
  }

  if (weatherButton) weatherButton.addEventListener("click", function () {
    setWeatherMode(!rainModeEnabled, false);
  });
  var changeDialog = document.querySelector("[data-plan-change-dialog]");
  var changeForm = document.querySelector("[data-plan-change-form]");
  var activeChange = null;
  plan.addEventListener("click", function (event) {
    var button = event.target.closest("[data-plan-change]");
    if (!button || !changeDialog || typeof changeDialog.showModal !== "function") return;
    activeChange = { button: button, dayNumber: Number(button.dataset.dayNumber), dayTitle: button.dataset.dayTitle, activityTitle: button.dataset.activityTitle };
    changeDialog.querySelector("[data-change-day-label]").textContent = "DAY " + String(activeChange.dayNumber).padStart(2, "0") + " · " + activeChange.dayTitle;
    changeDialog.querySelector("[data-change-activity-label]").textContent = activeChange.activityTitle;
    changeForm.reset();
    changeForm.dataset.applied = "false";
    changeForm.querySelector('[type="submit"]').innerHTML = 'Update this stop <i class="fa-solid fa-check" aria-hidden="true"></i>';
    var feedback = changeDialog.querySelector("[data-plan-change-feedback]");
    feedback.hidden = true;
    changeDialog.showModal();
  });
  document.querySelectorAll("[data-plan-change-close]").forEach(function (button) { button.addEventListener("click", function () { changeDialog.close(); }); });
  if (changeForm) changeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    if (changeForm.dataset.applied === "true") { changeDialog.close(); return; }
    if (!activeChange || !changeForm.reportValidity()) return;
    var item = activeChange.button.closest(".timeline__item");
    var title = item && item.querySelector(".timeline__title > span");
    if (!title) return;
    var preference = changeForm.elements.namedItem("preference").value.trim();
    title.textContent = preference;
    activeChange.button.dataset.activityTitle = preference;
    activeChange.button.setAttribute("aria-label", "Request a change to " + preference);
    var description = item.querySelector(".timeline__text");
    if (description) description.textContent = "Updated to match your preference.";
    changeForm.dataset.applied = "true";
    var feedback = changeDialog.querySelector("[data-plan-change-feedback]");
    feedback.textContent = "Your itinerary has been updated.";
    feedback.hidden = false;
    changeForm.querySelector('[type="submit"]').innerHTML = 'Done <i class="fa-solid fa-check" aria-hidden="true"></i>';
  });
  var saveButton = document.querySelector("[data-save-itinerary]");
  if (saveButton) {
    saveButton.addEventListener("click", function () {
      if (savePlannerItinerary(form, getTravelersCount())) showItinerarySaved(saveButton);
    });
  }

  // Re-render the whole quote (Split Bill included) on every change of the travelers field
  var travelersInput = form.elements.namedItem("travelers");
  if (travelersInput !== null) {
    var syncQuote = function () { renderQuote(getTravelersCount()); };
    travelersInput.addEventListener("input", syncQuote);
    travelersInput.addEventListener("change", syncQuote);
  }

  // Sync once on load: browsers restore form values on reload/back, which
  // would otherwise leave the static HTML prices out of step with the input.
  renderQuote(getTravelersCount());
  document.addEventListener("roamly:currencychange", function () { renderQuote(getTravelersCount()); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = readPlannerUser();
    if (!email) {
      sessionStorage.setItem("roamlyPendingPlanner", JSON.stringify(readPlannerValues()));
      window.location.href = "sign-in.html?next=ai-planner.html";
      return;
    }

    var usageKey = "roamlyFreePlanUsed:" + email;
    if (hasUsedFreePlan(email)) {
      var paywall = document.getElementById("paywall");
      if (optionsDialog && optionsDialog.open) optionsDialog.close();
      if (paywall && typeof paywall.showModal === "function") paywall.showModal();
      else window.location.href = "pricing.html";
      return;
    }

    showPlan();
    if (optionsDialog && optionsDialog.open) optionsDialog.close();
    try { localStorage.setItem(usageKey, "1"); } catch (error) {
      try { sessionStorage.setItem(usageKey, "1"); } catch (sessionError) {}
    }
    if (readRoamlySettings(getRoamlyItineraryEmail()).autoSaveItineraries && savePlannerItinerary(form, getTravelersCount()) && saveButton) {
      showItinerarySaved(saveButton);
    }
    plan.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (shouldResumeGeneration) {
    window.setTimeout(function () {
      if (optionsDialog && !optionsDialog.open && typeof optionsDialog.showModal === "function") optionsDialog.showModal();
      if (typeof form.requestSubmit === "function") form.requestSubmit();
      else form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }, 80);
  }
}

function showItinerarySaved(button) {
  if (!button) return;
  button.classList.add("is-saved");
  button.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i><span>Saved<br>to Trips</span>';
  window.clearTimeout(button._roamlySavedTimer);
  button._roamlySavedTimer = window.setTimeout(function () {
    button.classList.remove("is-saved");
    button.innerHTML = '<i class="fa-regular fa-bookmark" aria-hidden="true"></i><span>Save<br>Plan</span>';
  }, 2200);
}

function savePlannerItinerary(form, travelers) {
  var email = getRoamlyItineraryEmail();
  var plans = readRoamlyItineraries(email);
  var destinationField = form.elements.namedItem("destination");
  var durationField = form.elements.namedItem("duration");
  var dateField = form.elements.namedItem("travelDate");
  var budgetField = form.elements.namedItem("budget");
  var styleField = form.elements.namedItem("style");
  var destination = String(destinationField && destinationField.value || "Somewhere new").trim() || "Somewhere new";
  var duration = durationField ? durationField.value : "6 days";
  var travelDate = dateField ? dateField.value : "";
  var budget = budgetField ? budgetField.value : "Balanced";
  var style = styleField ? styleField.value : "Culture & Food";
  var matching = plans.find(function (item) {
    return item.destination && item.destination.toLowerCase() === destination.toLowerCase() && item.duration === duration && item.travelers === travelers && item.travelDate === travelDate;
  });
  if (matching) {
    matching.budget = budget;
    matching.style = style;
    matching.travelDate = travelDate;
    matching.updatedAt = Date.now();
  } else {
    plans.unshift({ id: "trip-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), destination: destination, duration: duration, travelDate: travelDate, travelers: travelers, budget: budget, style: style, savedAt: Date.now(), status: "upcoming" });
  }
  return writeRoamlyItineraries(email, plans);
}

function getRoamlyItineraryEmail() {
  return (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "guest").toLowerCase();
}

function readRoamlySettings(email) {
  var defaults = { travelers: "2", budget: "Balanced", style: "Culture & Food", rememberDefaults: false, autoSaveItineraries: false };
  try {
    var saved = JSON.parse(localStorage.getItem("roamlyUserSettings:" + email) || "{}");
    return Object.assign(defaults, saved && typeof saved === "object" ? saved : {});
  } catch (error) { return defaults; }
}

function writeRoamlySettings(email, settings) {
  try { localStorage.setItem("roamlyUserSettings:" + email, JSON.stringify(settings)); return true; }
  catch (error) { return false; }
}

function initUserSettings() {
  var page = document.querySelector("[data-settings-page]");
  if (!page) return;
  var email = getRoamlyItineraryEmail();
  var settings = readRoamlySettings(email);
  var form = page.querySelector("[data-settings-form]");
  var profile = {};
  var accounts = [];
  try { profile = JSON.parse(localStorage.getItem("roamlyUserProfile:" + email) || "{}"); } catch (error) {}
  try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
  var account = accounts.find(function (item) { return item.email === email; });
  var name = profile.fullName || (account && account.name) || (email === "guest" ? "Guest traveler" : email.split("@")[0]);
  page.querySelectorAll("[data-settings-name]").forEach(function (element) { element.textContent = name; });
  page.querySelectorAll("[data-settings-email], [data-settings-account-email]").forEach(function (element) { element.textContent = email === "guest" ? "Sign in to sync this account" : email; });
  page.querySelectorAll("[data-settings-initial]").forEach(function (element) { element.textContent = name.trim().charAt(0).toUpperCase() || "R"; });

  var feedback = page.querySelector("[data-settings-feedback]");
  var autoSaveFeedback = page.querySelector("[data-auto-save-feedback]");
  if (form) {
    form.elements.travelers.value = String(settings.travelers || "2");
    form.elements.budget.value = settings.budget || "Balanced";
    form.elements.style.value = settings.style || "Culture & Food";
    form.elements.rememberDefaults.checked = Boolean(settings.rememberDefaults);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      settings.travelers = form.elements.travelers.value;
      settings.budget = form.elements.budget.value;
      settings.style = form.elements.style.value;
      settings.rememberDefaults = form.elements.rememberDefaults.checked;
      feedback.textContent = writeRoamlySettings(email, settings) ? "Your travel preferences are saved on this device." : "We couldn’t save your preferences. Check your browser storage settings.";
    });
  }

  var autoSave = page.querySelector("[data-auto-save-toggle]");
  if (autoSave) {
    autoSave.checked = Boolean(settings.autoSaveItineraries);
    autoSave.addEventListener("change", function () {
      settings.autoSaveItineraries = autoSave.checked;
      var saved = writeRoamlySettings(email, settings);
      autoSaveFeedback.textContent = saved ? (autoSave.checked ? "New generated plans will be saved automatically." : "Plans will only be saved when you choose Save Plan.") : "We couldn’t save this preference.";
    });
  }

  var exportButton = page.querySelector("[data-export-itineraries]");
  var exportFeedback = page.querySelector("[data-export-feedback]");
  if (exportButton) {
    exportButton.addEventListener("click", function () {
      var itineraries = readRoamlyItineraries(email);
      var exportedAt = new Date().toLocaleString();
      var lines = [
        "ROAMLY — YOUR TRAVEL DATA",
        "Downloaded: " + exportedAt,
        "Account: " + (email === "guest" ? "Guest" : email),
        "Display currency: " + selectedCurrencyCode(),
        "",
        "TRAVEL PREFERENCES",
        "Usual travelers: " + settings.travelers,
        "Budget style: " + settings.budget,
        "Favorite trip style: " + settings.style,
        "Remember defaults: " + (settings.rememberDefaults ? "Yes" : "No"),
        "Automatically save plans: " + (settings.autoSaveItineraries ? "Yes" : "No"),
        "",
        "SAVED ITINERARIES"
      ];
      if (!itineraries.length) lines.push("No itineraries saved yet.");
      itineraries.forEach(function (item, index) {
        lines.push(
          "",
          (index + 1) + ". " + item.destination,
          "   Trip length: " + item.duration,
          "   Travelers: " + item.travelers,
          "   Budget: " + item.budget,
          "   Travel style: " + item.style,
          "   Saved: " + new Date(item.updatedAt || item.savedAt).toLocaleDateString(),
          "   Status: " + (item.status || "upcoming")
        );
      });
      var blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "roamly-travel-data.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      exportFeedback.textContent = "Your travel data download is ready.";
    });
  }
}

function readRoamlyItineraries(email) {
  try {
    var value = JSON.parse(localStorage.getItem("roamlyItineraries:" + email) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) { return []; }
}

function writeRoamlyItineraries(email, items) {
  try { localStorage.setItem("roamlyItineraries:" + email, JSON.stringify(items)); }
  catch (error) { return false; }
  return true;
}

function initItineraries() {
  var page = document.querySelector("[data-itineraries-page]");
  if (!page) return;
  var email = getRoamlyItineraryEmail();
  var list = page.querySelector("[data-itinerary-list]");
  var empty = page.querySelector("[data-itinerary-empty]");
  var count = page.querySelector("[data-itinerary-count]");
  var feedback = page.querySelector("[data-itinerary-feedback]");
  var filters = page.querySelectorAll("[data-itinerary-filter]");
  var activeFilter = "all";
  var items = readRoamlyItineraries(email);

  function makeMeta(icon, text) {
    var span = document.createElement("span");
    var glyph = document.createElement("i");
    glyph.className = "fa-solid " + icon;
    glyph.setAttribute("aria-hidden", "true");
    span.appendChild(glyph);
    span.appendChild(document.createTextNode(text));
    return span;
  }

  function render() {
    list.textContent = "";
    count.textContent = String(items.length);
    page.querySelector('[data-filter-count="all"]').textContent = String(items.length);
    page.querySelector('[data-filter-count="upcoming"]').textContent = String(items.filter(function (item) { return item.status !== "archived"; }).length);
    var visibleItems = items.filter(function (item) { return activeFilter === "all" || item.status !== "archived"; });
    empty.hidden = items.length > 0;
    page.querySelector(".itinerary-filters").hidden = items.length === 0;
    visibleItems.forEach(function (item, index) {
      var card = document.createElement("article");
      card.className = "itinerary-card";
      card.style.animationDelay = Math.min(index * 70, 280) + "ms";
      var cover = document.createElement("div");
      cover.className = "itinerary-card__cover";
      var orbit = document.createElement("span");
      orbit.className = "itinerary-card__cover-orbit";
      orbit.setAttribute("aria-hidden", "true");
      var badge = document.createElement("span");
      badge.className = "itinerary-card__badge";
      badge.textContent = item.status === "archived" ? "Past idea" : "Journey idea";
      var destination = document.createElement("h3");
      destination.className = "itinerary-card__destination";
      var pin = document.createElement("i");
      pin.className = "fa-solid fa-location-dot";
      pin.setAttribute("aria-hidden", "true");
      destination.appendChild(pin);
      destination.appendChild(document.createTextNode(item.destination));
      cover.append(orbit, badge, destination);

      var body = document.createElement("div");
      body.className = "itinerary-card__body";
      var meta = document.createElement("div");
      meta.className = "itinerary-card__meta";
      meta.append(
        makeMeta("fa-calendar-days", item.duration),
        makeMeta("fa-user-group", item.travelers + (item.travelers === 1 ? " traveler" : " travelers")),
        makeMeta("fa-compass", item.style),
        makeMeta("fa-wallet", item.budget)
      );
      var footer = document.createElement("div");
      footer.className = "itinerary-card__footer";
      var saved = document.createElement("span");
      saved.className = "itinerary-card__saved";
      saved.textContent = "Saved " + new Date(item.updatedAt || item.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      var actions = document.createElement("div");
      actions.className = "itinerary-card__actions";
      var resume = document.createElement("a");
      resume.className = "itinerary-card__open";
      resume.href = "ai-planner.html?" + new URLSearchParams({ destination: item.destination, travelers: String(item.travelers), duration: item.duration, budget: item.budget, style: item.style }).toString();
      resume.innerHTML = 'Continue planning <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "itinerary-card__remove";
      remove.setAttribute("aria-label", "Remove " + item.destination + " from saved itineraries");
      remove.innerHTML = '<i class="fa-regular fa-trash-can" aria-hidden="true"></i>';
      remove.addEventListener("click", function () {
        items = items.filter(function (entry) { return entry.id !== item.id; });
        writeRoamlyItineraries(email, items);
        feedback.textContent = "That itinerary has been removed from your trips.";
        render();
      });
      actions.append(resume, remove);
      footer.append(saved, actions);
      body.append(meta, footer);
      card.append(cover, body);
      list.appendChild(card);
    });
  }

  filters.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.getAttribute("data-itinerary-filter");
      filters.forEach(function (filter) { filter.classList.toggle("is-active", filter === button); });
      render();
    });
  });
  render();
}

function initDestinationFilter() {
  var root = document.querySelector("[data-filter]");
  if (root === null) return;

  var chips = root.querySelectorAll("[data-region-chip]");
  var searchInput = root.querySelector("[data-filter-search]");
  var cards = document.querySelectorAll("[data-region]");
  var emptyMessage = document.querySelector("[data-filter-empty]");
  var recommendationMessage = document.querySelector("[data-recommendation]");
  var recommendationText = document.querySelector("[data-recommendation-text]");
  var currentSelectedRegion = "all";
  var recommendedCard = null;

  function prepareRecommendation() {
    var params = new URLSearchParams(window.location.search);
    var vibeValue = (params.get("vibe") || "").toLowerCase();
    var rangeValue = params.get("range") || "";
    var vibe = "";
    var vibeLabel = "your travel style";

    if (/honeymoon|relax/.test(vibeValue)) { vibe = "relax"; vibeLabel = "relaxing"; }
    else if (/family/.test(vibeValue)) { vibe = "family"; vibeLabel = "family"; }
    else if (/adventure|outdoors/.test(vibeValue)) { vibe = "adventure"; vibeLabel = "adventure"; }
    else if (/culture|food/.test(vibeValue)) { vibe = "culture"; vibeLabel = "culture"; }

    var rangeNumbers = rangeValue.match(/[\d,]+/g) || [];
    var minBudget = 0;
    var maxBudget = Infinity;
    if (/under/i.test(rangeValue)) {
      maxBudget = rangeNumbers.length ? Number(rangeNumbers[0].replace(/,/g, "")) : 500;
    } else if (/\+/.test(rangeValue)) {
      minBudget = rangeNumbers.length ? Number(rangeNumbers[0].replace(/,/g, "")) : 0;
    } else if (rangeNumbers.length >= 2) {
      minBudget = Number(rangeNumbers[0].replace(/,/g, ""));
      maxBudget = Number(rangeNumbers[1].replace(/,/g, ""));
    }

    if (!vibe && !rangeValue) return;

    var rankedCards = Array.prototype.slice.call(cards).map(function (card, index) {
      var price = Number(card.getAttribute("data-price")) || 0;
      var cardVibes = (card.getAttribute("data-vibes") || "").split(/\s+/);
      var score = cardVibes.indexOf(vibe) !== -1 ? 8 : 0;
      if (price >= minBudget && price <= maxBudget) {
        score += 5;
      } else {
        var distance = price < minBudget ? minBudget - price : price - maxBudget;
        score -= Math.min(distance / 1000, 5);
      }
      return { card: card, score: score, index: index };
    }).sort(function (a, b) {
      return (b.score - a.score) || (a.index - b.index);
    });

    var grid = rankedCards[0].card.parentElement;
    rankedCards.forEach(function (entry) { grid.appendChild(entry.card); });
    recommendedCard = rankedCards[0].card;
    recommendedCard.classList.add("is-recommended");

    var media = recommendedCard.querySelector(".dest-card__media");
    if (media !== null) {
      var badge = document.createElement("span");
      badge.className = "dest-card__match-badge";
      badge.innerHTML = '<i class="fa-solid fa-sparkles" aria-hidden="true"></i> Top match';
      media.appendChild(badge);
    }

    if (recommendationText !== null) {
      var budgetLabel = rangeValue.replace(/^Budget:\s*/i, "");
      var destinationName = recommendedCard.querySelector(".dest-card__title").textContent.trim();
      var recommendedPrice = Number(recommendedCard.getAttribute("data-price")) || 0;
      var budgetFit = recommendedPrice >= minBudget && recommendedPrice <= maxBudget;
      var recommendationReason = budgetLabel ? (budgetFit ? "fits your budget" : "is the closest available option to your budget") : "is our top pick";
      recommendationText.textContent = "Based on your " + vibeLabel + " travel style" + (budgetLabel ? " and " + budgetLabel + " budget" : "") + ", " + destinationName + " " + recommendationReason + " at $" + recommendedPrice + " per traveler.";
    }
    if (recommendationMessage !== null) recommendationMessage.hidden = false;
  }

  function applyFilters() {
    var query = searchInput.value.trim().toLowerCase();
    var shownCount = 0;

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var cardRegion = card.getAttribute("data-region");
      var cardText = card.textContent.toLowerCase();

      var matchesRegion = (currentSelectedRegion === "all") || (cardRegion.indexOf(currentSelectedRegion) !== -1);
      var matchesText = (cardText.indexOf(query) !== -1);

      if (matchesRegion === true && matchesText === true) {
        card.hidden = false;
        shownCount++;
      } else {
        card.hidden = true;
      }
    }

    if (emptyMessage !== null) {
      emptyMessage.hidden = (shownCount > 0);
    }
    if (recommendationMessage !== null && recommendedCard !== null) {
      recommendationMessage.hidden = recommendedCard.hidden;
    }
  }

  for (var j = 0; j < chips.length; j++) {
    chips[j].addEventListener("click", function () {
      currentSelectedRegion = this.getAttribute("data-region-chip");
      for (var k = 0; k < chips.length; k++) {
        chips[k].setAttribute("aria-pressed", (chips[k] === this) ? "true" : "false");
      }
      applyFilters();
    });
  }

  searchInput.addEventListener("input", applyFilters);
  prepareRecommendation();
  applyFilters();
}

function initSignInJourney() {
  var form = document.querySelector("[data-signin-form]");
  if (!form) return;

  var film = document.querySelector(".auth-film");
  var filmVideo = document.querySelector(".auth-film__video");
  var routeLayer = document.getElementById("authTakeoffLayer");
  var route = document.getElementById("authTakeoffRoute");
  var revealPath = document.getElementById("authTakeoffReveal");
  var departure = document.getElementById("authTakeoffDeparture");
  var takeoffPlane = document.getElementById("authTakeoffPlane");
  var arrival = document.getElementById("authArrival");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function placeIdlePlane() {
    if (!film || !routeLayer || !route || !revealPath || !takeoffPlane || document.body.classList.contains("is-taking-off")) return;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var bounds = film.getBoundingClientRect();
    var startX = bounds.top > height ? width * .78 : bounds.left + bounds.width * .78;
    var startY = bounds.top > height ? height * .87 : bounds.top + bounds.height * .88;
    var planeWidth = Math.min(220, Math.max(155, bounds.width * .19));
    var planeHeight = planeWidth * 150 / 280;
    routeLayer.setAttribute("viewBox", "0 0 " + width + " " + height);
    routeLayer.setAttribute("width", width);
    routeLayer.setAttribute("height", height);
    route.setAttribute("d", "M " + (startX - width * .31) + " " + (startY + height * .07) + " C " + (startX - width * .22) + " " + (startY - height * .14) + ", " + (startX - width * .09) + " " + (startY + height * .13) + ", " + startX + " " + startY);
    revealPath.setAttribute("d", route.getAttribute("d"));
    route.style.strokeDasharray = "5 12";
    route.style.strokeDashoffset = "0";
    var idleRouteLength = revealPath.getTotalLength();
    revealPath.style.strokeDasharray = idleRouteLength + " " + idleRouteLength;
    revealPath.style.strokeDashoffset = "0";
    if (departure) { departure.setAttribute("cx", startX); departure.setAttribute("cy", startY); }
    takeoffPlane.style.width = planeWidth + "px";
    takeoffPlane.style.height = planeHeight + "px";
    takeoffPlane.style.left = startX + "px";
    takeoffPlane.style.top = startY + "px";
    takeoffPlane.style.transform = "translate(-50%,-50%) perspective(900px) rotateX(12deg) rotateY(-8deg) rotate(42deg) scale(1)";
  }
  placeIdlePlane();
  window.addEventListener("resize", placeIdlePlane);

  if (film && filmVideo && !reduceMotion) {
    film.addEventListener("pointermove", function (event) {
      if (event.pointerType === "touch" || window.innerWidth <= 700) return;
      var bounds = film.getBoundingClientRect();
      var x = (event.clientX - bounds.left) / bounds.width - 0.5;
      var y = (event.clientY - bounds.top) / bounds.height - 0.5;
      filmVideo.style.transform = "scale(1) rotateX(" + (-y * 1.8) + "deg) rotateY(" + (x * 2.4) + "deg)";
    });
    film.addEventListener("pointerleave", function () { filmVideo.style.transform = "scale(1)"; });
  }

  var email = form.querySelector('[name="email"]');
  var password = form.querySelector('[name="password"]');
  var confirmPassword = form.querySelector('[name="confirmPassword"]');
  var fullName = form.querySelector('[name="fullName"]');
  var terms = form.querySelector('[name="terms"]');
  var feedback = form.querySelector("[data-auth-message]");
  var title = document.getElementById("auth-title");
  var intro = document.getElementById("authIntro");
  var submitLabel = form.querySelector("[data-submit-label]");
  var switchPrompt = document.querySelector("[data-switch-prompt]");
  var switchButton = document.querySelector("[data-auth-switch]");
  var loginOnly = document.querySelectorAll("[data-login-only]");
  var registerOnly = document.querySelectorAll("[data-register-only]");
  var mode = "login";

  function showMessage(text, isError) {
    feedback.textContent = text;
    feedback.className = "auth-message" + (isError ? " is-error" : "");
    feedback.hidden = false;
  }

  function setMode(nextMode) {
    mode = nextMode;
    var registering = mode === "register";
    title.innerHTML = registering ? 'Create your <span>account.</span>' : 'Welcome <span>back.</span>';
    intro.textContent = registering
      ? "A few details now, and your next journey is closer."
      : "Sign in to pick up where your next great journey begins.";
    submitLabel.textContent = registering ? "Create Account" : "Sign In";
    switchPrompt.textContent = registering ? "Already have an account?" : "New to Roamly?";
    switchButton.textContent = registering ? "Sign in" : "Create an account";
    loginOnly.forEach(function (element) { element.hidden = registering; });
    registerOnly.forEach(function (element) { element.hidden = !registering; });
    fullName.required = registering;
    confirmPassword.required = registering;
    terms.required = registering;
    password.autocomplete = registering ? "new-password" : "current-password";
    confirmPassword.autocomplete = "new-password";
    feedback.hidden = true;
    feedback.textContent = "";
  }

  function encodePassword(value) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.reject(new Error("Account creation needs a secure local server (localhost) or HTTPS."));
    }
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then(function (digest) {
      return Array.from(new Uint8Array(digest)).map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    });
  }

  function readAccounts() {
    try { return JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); }
    catch (error) { return []; }
  }

  function playTakeoff(onComplete) {
    var layer = routeLayer;
    var plane = takeoffPlane;
    var brand = document.querySelector(".auth-brand");
    function showArrival() {
      if (arrival && brand) {
        var brandBounds = brand.getBoundingClientRect();
        arrival.style.left = (brandBounds.left + brandBounds.width * .5) + "px";
        arrival.style.top = (brandBounds.bottom + 9) + "px";
        arrival.classList.add("is-visible");
        window.setTimeout(onComplete, 420);
      } else window.setTimeout(onComplete, 450);
    }
    if (!layer || !route || !plane || !film || !filmVideo || !brand || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      showArrival();
      return;
    }

    var width = window.innerWidth;
    var height = window.innerHeight;
    layer.setAttribute("viewBox", "0 0 " + width + " " + height);
    layer.setAttribute("width", width);
    layer.setAttribute("height", height);
    var filmBounds = film.getBoundingClientRect();
    var brandBounds = brand.getBoundingClientRect();
    var sourceIsBelowViewport = filmBounds.top > height;
    var startX = sourceIsBelowViewport ? width * .78 : filmBounds.left + filmBounds.width * .78;
    var startY = sourceIsBelowViewport ? height * .87 : filmBounds.top + filmBounds.height * .88;
    var planeWidth = Math.min(220, Math.max(155, filmBounds.width * .19));
    var planeHeight = planeWidth * 150 / 280;
    plane.style.width = planeWidth + "px";
    plane.style.height = planeHeight + "px";
    plane.style.left = startX + "px";
    plane.style.top = startY + "px";
    var endX = brandBounds.left + brandBounds.width * .54;
    var endY = brandBounds.top + brandBounds.height * .46;
    var curve = "M " + startX + " " + startY + " C " + (startX - width * .08) + " " + (startY - height * .26) + ", " + (endX + width * .32) + " " + (endY + height * .64) + ", " + endX + " " + endY;
    route.setAttribute("d", curve);
    var routeLength = route.getTotalLength();
    route.style.strokeDasharray = "5 12";
    route.style.strokeDashoffset = "0";
    revealPath.setAttribute("d", curve);
    revealPath.style.strokeDasharray = "0 " + routeLength;
    revealPath.style.strokeDashoffset = "0";
    if (departure) { departure.setAttribute("cx", startX); departure.setAttribute("cy", startY); }
    var initialAngle = Math.atan2(-height * .26, -width * .08) * 180 / Math.PI - 180;
    plane.style.transform = "translate(-50%,-50%) perspective(900px) rotateX(16deg) rotateY(-8deg) rotate(" + initialAngle + "deg) scale(1)";
    document.body.classList.add("is-taking-off");

    var startTime = 0;
    var duration = 1450;
    function fly(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var distance = routeLength * eased;
      var point = route.getPointAtLength(distance);
      var next = route.getPointAtLength(Math.min(distance + 3, routeLength));
      // The stylized aircraft's nose points left in its source frame.
      var angle = Math.atan2(next.y - point.y, next.x - point.x) * 180 / Math.PI - 180;
      var scale = 1 - eased * .58;
      plane.style.left = point.x + "px";
      plane.style.top = point.y + "px";
      plane.style.transform = "translate(-50%,-50%) perspective(900px) rotateX(" + (16 - eased * 8) + "deg) rotateY(" + (-8 + eased * 18) + "deg) rotate(" + angle + "deg) scale(" + scale + ")";
      revealPath.style.strokeDasharray = distance + " " + routeLength;
      if (progress < 1) window.requestAnimationFrame(fly);
      else showArrival();
    }
    window.requestAnimationFrame(fly);
  }

  function saveAndEnter(emailValue, remember) {
    if (remember) {
      localStorage.setItem("roamlySignedInEmail", emailValue);
      sessionStorage.removeItem("roamlySignedInEmail");
    } else {
      sessionStorage.setItem("roamlySignedInEmail", emailValue);
      localStorage.removeItem("roamlySignedInEmail");
    }
    showMessage(mode === "register" ? "Your Roamly account is ready. Signing you in..." : "Welcome back. Your journey is ready.", false);
    form.querySelector(".auth-submit").disabled = true;
    var nextPage = new URLSearchParams(window.location.search).get("next");
    var destination = nextPage === "ai-planner.html" && sessionStorage.getItem("roamlyPendingPlanner")
      ? "ai-planner.html?resume=1"
      : "index.html";
    playTakeoff(function () { window.location.href = destination; });
  }

  switchButton.addEventListener("click", function () {
    setMode(mode === "login" ? "register" : "login");
  });

  var fillAccountButton = document.querySelector("[data-fill-account]");
  if (fillAccountButton) {
    fillAccountButton.addEventListener("click", function () {
      if (mode !== "login") setMode("login");
      email.value = "nada@roamly.com";
      password.value = "123456";
      password.focus();
    });
  }

  document.querySelectorAll("[data-social-provider]").forEach(function (button) {
    button.addEventListener("click", function () {
      showMessage(button.getAttribute("data-social-provider") + " sign-in is unavailable. Please use your email and password.", true);
    });
  });

  document.querySelectorAll(".auth-password-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      var showing = password.type === "password";
      password.type = showing ? "text" : "password";
      toggle.setAttribute("aria-label", showing ? "Hide password" : "Show password");
      toggle.innerHTML = '<i class="fa-regular ' + (showing ? "fa-eye-slash" : "fa-eye") + '" aria-hidden="true"></i>';
      password.focus();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var emailValue = email.value.trim().toLowerCase();
    var passwordValue = password.value;
    if (!email.validity.valid || !emailValue || passwordValue.length < 6) {
      showMessage("Enter a valid email address and a password with at least 6 characters.", true);
      return;
    }

    if (mode === "login" && emailValue.endsWith("@roamly.com") && passwordValue === "123456") {
      saveAndEnter(emailValue, form.querySelector('[name="remember"]').checked);
      return;
    }

    if (mode === "register") {
      var nameValue = fullName.value.trim();
      if (nameValue.length < 2) { showMessage("Please enter your name.", true); fullName.focus(); return; }
      if (passwordValue !== confirmPassword.value) { showMessage("The passwords do not match. Please check them and try again.", true); confirmPassword.focus(); return; }
      if (!terms.checked) { showMessage("Please agree to the terms to create your account.", true); terms.focus(); return; }
      if (readAccounts().some(function (account) { return account.email === emailValue; })) {
        showMessage("An account with this email already exists. Sign in instead.", true);
        return;
      }
      var submit = form.querySelector(".auth-submit");
      submit.disabled = true;
      encodePassword(passwordValue).then(function (passwordHash) {
        var accounts = readAccounts();
        accounts.push({ name: nameValue, email: emailValue, passwordHash: passwordHash });
        localStorage.setItem("roamlyLocalAccounts", JSON.stringify(accounts));
        saveAndEnter(emailValue, true);
      }).catch(function (error) {
        submit.disabled = false;
        showMessage(error.message || "We couldn't create your account right now. Please try again.", true);
      });
      return;
    }

    var remember = form.querySelector('[name="remember"]').checked;
    var account = readAccounts().find(function (item) { return item.email === emailValue; });
    if (!account) { showMessage("Those sign-in details don't match an account. Check them or create an account.", true); return; }
    encodePassword(passwordValue).then(function (passwordHash) {
      if (passwordHash !== account.passwordHash) { showMessage("Those sign-in details don't match. Please try again.", true); return; }
      saveAndEnter(emailValue, remember);
    }).catch(function (error) { showMessage(error.message, true); });
  });
}
function initAuthSession() {
  var email = sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail");
  var guestActions = document.getElementById("guestActions");
  var loggedActions = document.getElementById("loggedActions");
  var localAccounts = [];
  try { localAccounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) {}
  var savedAccount = localAccounts.find(function (account) { return account.email === email; });
  var savedProfile = {};
  try { savedProfile = JSON.parse(localStorage.getItem("roamlyUserProfile:" + email) || "{}"); } catch (error) {}
  var name = savedProfile.fullName || (savedAccount ? savedAccount.name : (email && email.toLowerCase().endsWith("@roamly.com") ? "Nada Alawneh" : (email ? email.split("@")[0] : "")));

  if (guestActions && loggedActions) {
    guestActions.style.display = email ? "none" : "flex";
    loggedActions.style.display = email ? "inline-block" : "none";
  }
  if (!email) return;

  document.querySelectorAll(".user-name").forEach(function (el) { el.textContent = name; });
  document.querySelectorAll(".user-dropdown__email").forEach(function (el) { el.textContent = email; });
  document.querySelectorAll(".user-avatar").forEach(function (el) {
    if (savedProfile.avatar) {
      el.textContent = "";
      el.style.backgroundImage = "url(\"" + savedProfile.avatar + "\")";
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage = "";
      el.textContent = name.charAt(0).toUpperCase();
    }
  });

  var toggle = document.getElementById("userMenuToggle");
  var wrap = toggle ? toggle.closest(".user-menu-wrap") : null;
  if (toggle && wrap) {
    toggle.addEventListener("click", function () {
      var isOpen = wrap.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", function (event) {
      if (!wrap.contains(event.target)) {
        wrap.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  var logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.addEventListener("click", function () {
      sessionStorage.removeItem("roamlySignedInEmail");
      localStorage.removeItem("roamlySignedInEmail");
      window.location.href = "index.html";
    });
  }
}

function initCountdown() {
  var root = document.querySelector("[data-countdown]");
  if (root === null) return;
  var remainingSeconds = parseInt(root.getAttribute("data-countdown"), 10);
  var hoursEl = root.querySelector('[data-unit="h"]');
  var minutesEl = root.querySelector('[data-unit="m"]');
  var secondsEl = root.querySelector('[data-unit="s"]');

  function padWithZero(number) {
    var str = String(number);
    return (str.length < 2) ? "0" + str : str;
  }

  function updateDisplay() {
    var hours = Math.floor(remainingSeconds / 3600);
    var minutes = Math.floor((remainingSeconds % 3600) / 60);
    var seconds = remainingSeconds % 60;
    if (hoursEl !== null) { hoursEl.textContent = padWithZero(hours); }
    if (minutesEl !== null) { minutesEl.textContent = padWithZero(minutes); }
    if (secondsEl !== null) { secondsEl.textContent = padWithZero(seconds); }
  }

  updateDisplay();
  var timerId = setInterval(function () {
    remainingSeconds--;
    if (remainingSeconds < 0) { remainingSeconds = 0; }
    updateDisplay();
    if (remainingSeconds === 0) { clearInterval(timerId); }
  }, 1000);
}

function initChat() {
  var form = document.querySelector("[data-chat-form]");
  var log = document.querySelector("[data-chat-log]");
  if (form === null || log === null) return;

  function addMessage(text, isMine) {
    var bubble = document.createElement("p");
    bubble.className = isMine ? "bubble bubble--me" : "bubble";
    bubble.textContent = text;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var input = form.elements.namedItem("message");
    var text = input.value.trim();
    if (text === "") return;
    addMessage(text, true);
    input.value = "";
    setTimeout(function () {
      addMessage("Thanks! A Roamly concierge is looking into this and will reply here shortly.", false);
    }, 700);
  });
}

/* ==========================================================================
   Flight Journey System (Sine Wave + Hero & Footer Bounds)
   ========================================================================== */
function initFlightJourney() {
  var plane = document.getElementById("flightPlane");
  var pathBase = document.getElementById("flightPathBase");
  var pathActive = document.getElementById("flightPathActive");
  var hudTerminal = document.getElementById("hudTerminal");
  var svg = document.getElementById("flightSkySvg");
  var mainEl = document.getElementById("main");
  var footerEl = document.querySelector("footer, .site-footer, .footer");

  if (plane === null || pathBase === null || pathActive === null || svg === null) {
    return;
  }

  var svgNs = "http://www.w3.org/2000/svg";
  var defs = svg.querySelector("defs");
  if (defs === null) {
    defs = document.createElementNS(svgNs, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }

  var baseGrad = document.getElementById("flightBaseGrad");
  if (baseGrad === null) {
    baseGrad = document.createElementNS(svgNs, "linearGradient");
    baseGrad.setAttribute("id", "flightBaseGrad");
    baseGrad.setAttribute("gradientUnits", "userSpaceOnUse");
    baseGrad.setAttribute("x1", "0");
    baseGrad.setAttribute("x2", "0");
    defs.appendChild(baseGrad);
  }

  var activeGrad = document.getElementById("flightActiveGrad");
  if (activeGrad === null) {
    activeGrad = document.createElementNS(svgNs, "linearGradient");
    activeGrad.setAttribute("id", "flightActiveGrad");
    activeGrad.setAttribute("gradientUnits", "userSpaceOnUse");
    activeGrad.setAttribute("x1", "0");
    activeGrad.setAttribute("x2", "0");
    defs.appendChild(activeGrad);
  }

  var gateLabels = [
    "GATE 01: TAKEOFF - CLOUD RUNWAY",
    "GATE 02: TOP DESTINATIONS",
    "GATE 03: AIR CONCIERGE HUB",
    "GATE 04: PROMO ESCAPES",
    "GATE 05: PASSENGER TERMINAL",
    "GATE 06: ADVENTURE BOARDING",
    "FINAL DESTINATION: ROAMLY TERMINAL"
  ];

  var pathTotalLength = 0;
  var waypoints = [];
  var sectionZones = [];

  function isSectionDark(el) {
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag === "footer" || el.classList.contains("site-footer") || el.classList.contains("footer") || el.classList.contains("why") || el.classList.contains("reviews") || el.classList.contains("hero-video-section")) {
      return true;
    }
    return false;
  }

  function addGradStop(grad, offsetPercent, color) {
    var stop = document.createElementNS(svgNs, "stop");
    stop.setAttribute("offset", offsetPercent + "%");
    stop.setAttribute("stop-color", color);
    grad.appendChild(stop);
  }

  function getAllPageSections() {
    var list = [];
    if (mainEl !== null) {
      var mainChildren = mainEl.children;
      for (var m = 0; m < mainChildren.length; m++) {
        var child = mainChildren[m];
        if (!child.classList.contains("flight-journey-tracker") && !child.classList.contains("search-wrap") && child.offsetHeight > 120) {
          list.push(child);
        }
      }
    }
    if (footerEl !== null && list.indexOf(footerEl) === -1 && footerEl.offsetHeight > 100) {
      list.push(footerEl);
    }
    return list;
  }

  function calculateFlightPath() {
    var scrollY = window.scrollY;
    var mainTop = 0;
    if (mainEl !== null) {
      mainTop = mainEl.getBoundingClientRect().top + scrollY;
    }

    var sections = getAllPageSections();
    if (sections.length < 2) { return; }

    var lastSec = sections[sections.length - 1];
    var totalHeight = 0;
    if (footerEl !== null) {
      var footerRect = footerEl.getBoundingClientRect();
      totalHeight = footerRect.top + scrollY - mainTop;
    } else {
      var lastRect = lastSec.getBoundingClientRect();
      totalHeight = (lastRect.top + scrollY - mainTop) + lastRect.height;
    }

    svg.style.height = totalHeight + "px";
    if (svg.parentElement !== null) { svg.parentElement.style.height = totalHeight + "px"; }

    waypoints = [];
    sectionZones = [];

    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var rect = sec.getBoundingClientRect();
      var secTop = rect.top + scrollY - mainTop;
      var secBottom = secTop + rect.height;
      var dark = isSectionDark(sec);
      var label = gateLabels[i] || ("GATE 0" + (i + 1) + ": TERMINAL");
      if (i === sections.length - 1) { label = "FINAL DESTINATION: LANDING"; }
      sectionZones.push({ top: secTop, bottom: secBottom, dark: dark, label: label, el: sec });
    }

    baseGrad.setAttribute("y1", "0");
    baseGrad.setAttribute("y2", String(totalHeight));
    activeGrad.setAttribute("y1", "0");
    activeGrad.setAttribute("y2", String(totalHeight));

    while (baseGrad.firstChild) { baseGrad.removeChild(baseGrad.firstChild); }
    while (activeGrad.firstChild) { activeGrad.removeChild(activeGrad.firstChild); }

    for (var z = 0; z < sectionZones.length; z++) {
      var zone = sectionZones[z];
      var startPct = Math.max(0, Math.min(100, (zone.top / totalHeight) * 100));
      var endPct = Math.max(0, Math.min(100, (zone.bottom / totalHeight) * 100));
      var softGrayColor = "rgba(100, 116, 139, 0.75)";

      addGradStop(baseGrad, startPct.toFixed(2), softGrayColor);
      addGradStop(baseGrad, endPct.toFixed(2), softGrayColor);
      addGradStop(activeGrad, startPct.toFixed(2), softGrayColor);
      addGradStop(activeGrad, endPct.toFixed(2), softGrayColor);
    }

    var dString = "";
    var totalPoints = 100;
    var screenW = window.innerWidth;
    
    var leftMargin = Math.max(24, screenW * 0.04);
    var rightMargin = screenW - leftMargin;
    var waveWidth = (rightMargin - leftMargin) / 2;
    var midEdge = (leftMargin + rightMargin) / 2;

    var heroSec = document.querySelector(".hero-video-section");
    var heroRect = heroSec ? heroSec.getBoundingClientRect() : null;
    var startY = heroRect ? (heroRect.top + window.scrollY - mainTop) + (heroRect.height * 0.55) : 300;

    for (var p = 0; p <= totalPoints; p++) {
      var t = p / totalPoints;
      var currentY = startY + (t * (totalHeight - startY));
      if (currentY > totalHeight) { currentY = totalHeight; }

      var currentX = midEdge + Math.cos(t * Math.PI * 4) * waveWidth;

      if (p === 0) {
        dString = "M " + rightMargin + " " + startY;
      } else {
        dString = dString + " L " + currentX + " " + currentY;
      }
    }

    waypoints.push({ x: rightMargin, y: startY });
    waypoints.push({ x: leftMargin, y: totalHeight });

    pathBase.setAttribute("d", dString);
    pathActive.setAttribute("d", dString);

    pathTotalLength = pathBase.getTotalLength();
    pathActive.style.strokeDasharray = "8 10";

    updateFlight();
  }

  function getLengthAtY(targetY) {
    var low = 0;
    var high = pathTotalLength;
    for (var iter = 0; iter < 15; iter++) {
      var mid = (low + high) / 2;
      var pt = pathBase.getPointAtLength(mid);
      if (pt.y < targetY) { low = mid; } else { high = mid; }
    }
    return (low + high) / 2;
  }

  function updateFlight() {
    if (pathTotalLength === 0 || waypoints.length < 2) { return; }

    var currentScroll = window.scrollY;
    var mainTop = 0;
    if (mainEl !== null) { mainTop = mainEl.getBoundingClientRect().top + currentScroll; }

    var startY = waypoints[0].y;
    var endY = waypoints[waypoints.length - 1].y;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) { maxScroll = 1; }

    var progress = currentScroll / maxScroll;
    if (progress < 0) { progress = 0; }
    if (progress > 1) { progress = 1; }

    var viewportTargetY = (currentScroll - mainTop) + (window.innerHeight * (0.38 + progress * 0.35));
    if (viewportTargetY < startY) { viewportTargetY = startY; }
    if (viewportTargetY > endY) { viewportTargetY = endY; }

    var currentLen = getLengthAtY(viewportTargetY);
    var pt = pathBase.getPointAtLength(currentLen);
    var nextLen = Math.min(currentLen + 8, pathTotalLength);
    var nextPt = pathBase.getPointAtLength(nextLen);

    var angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
    var angleDeg = (angleRad * 180 / Math.PI) + 90;

    var screenX = pt.x;
    var screenY = (pt.y + mainTop) - currentScroll;

    plane.style.transform = "translate3d(" + screenX + "px, " + screenY + "px, 0) rotate(" + angleDeg + "deg)";

    pathActive.style.strokeDasharray = "8 10";
    var dashOffset = Math.max(0, pathTotalLength - currentLen);
    pathActive.style.strokeDashoffset = dashOffset;

    var currentGate = sectionZones.length > 0 ? sectionZones[0].label : "";
    for (var k = 0; k < sectionZones.length; k++) {
      var zone = sectionZones[k];
      if (pt.y >= zone.top && pt.y <= zone.bottom) {
        currentGate = zone.label;
        break;
      } else if (pt.y > zone.bottom) {
        currentGate = zone.label;
      }
    }

    if (footerEl !== null && footerEl.getBoundingClientRect().top <= window.innerHeight) {
      currentGate = "GATE 07: LANDING";
    }

    if (hudTerminal !== null && hudTerminal.textContent !== currentGate) {
      hudTerminal.textContent = currentGate;
    }
  }

  window.addEventListener("scroll", updateFlight);
  window.addEventListener("resize", calculateFlightPath);
  window.addEventListener("load", calculateFlightPath);
  setTimeout(calculateFlightPath, 350);
}

// Initialize shared page features.
function initAboutStory() {
  var revealItems = document.querySelectorAll(".about-reveal");
  if (!revealItems.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealItems.forEach(function(item) { item.classList.add("is-visible"); });
    return;
  }

  document.body.classList.add("about-motion-ready");
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -36px 0px", threshold: 0.12 });

  revealItems.forEach(function(item) { observer.observe(item); });
}

function initTermsNavigation() {
  var toc = document.querySelector(".terms-toc");
  if (!toc) return;

  var links = Array.from(toc.querySelectorAll('a[href^="#"]'));
  var sections = links.map(function(link) {
    return document.getElementById(decodeURIComponent(link.hash.slice(1)));
  }).filter(Boolean);
  if (!sections.length) return;

  function setActive(sectionId) {
    links.forEach(function(link) {
      var active = link.hash === "#" + sectionId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  links.forEach(function(link) {
    link.addEventListener("click", function(event) {
      var section = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!section) return;
      event.preventDefault();
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", link.hash);
      setActive(section.id);
    });
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function(entries) {
      var visible = entries.filter(function(entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function(a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActive(visible[0].target.id);
    }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
    sections.forEach(function(section) { observer.observe(section); });
  }

  var initialSection = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  setActive(initialSection && sections.indexOf(initialSection) !== -1 ? initialSection.id : sections[0].id);
}

initAboutStory();
initTermsNavigation();
initMenu();
initDialogs();
initWelcomeFilm();
initCurrencySelector();
initDestinationAutocomplete("destinationSearch", "destinationSuggestions", "destinationToggle");
initDestinationAutocomplete("originSearch", "originSuggestions", "originToggle");
initPlanner();
initPlannerPayment();
initItineraries();
initDestinationFilter();
initCountdown();
initChat();
initFlightJourney();
initTripConfirmation();
initSignInJourney();
initAuthSession();
initUserSettings();

/* ==========================================================================
   8. Global Draggable AI Captain Chatbot Widget (All Pages)
   ========================================================================== */
function initFloatingAIChat() {
  if (document.getElementById("roamlyAiWidget") !== null) {
    return;
  }

  var widget = document.createElement("div");
  widget.className = "roamly-ai-widget";
  widget.id = "roamlyAiWidget";

  widget.innerHTML =
    '<div class="roamly-ai-popup" id="roamlyAiPopup" role="dialog" aria-label="Roamly AI Concierge Chat">' +
      '<div class="roamly-ai-header" id="roamlyAiDragHeader">' +
        '<div class="roamly-ai-header__info">' +
          '<div class="roamly-ai-header__avatar" aria-hidden="true">AI</div>' +
          '<div>' +
            '<p class="roamly-ai-header__eyebrow">Roamly travel assistant</p>' +
            '<h3 class="roamly-ai-header__title">Roamly AI Concierge</h3>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="roamly-ai-close" id="roamlyAiClose" aria-label="Close chat">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
        '</button>' +
      '</div>' +
      '<div class="roamly-ai-messages" id="roamlyAiMessages" aria-live="polite">' +
        '<p class="roamly-ai-bubble">Welcome to Roamly. Ask me about planning a trip, exploring destinations, or using the site.</p>' +
      '</div>' +
      '<div class="roamly-ai-chips">' +
        '<button type="button" class="roamly-ai-chip" data-prompt="Where can I find current offers?">Current offers</button>' +
        '<button type="button" class="roamly-ai-chip" data-prompt="How can I change my itinerary?">Edit an itinerary</button>' +
        '<button type="button" class="roamly-ai-chip" data-prompt="Where can I ask about cancellations?">Cancellation help</button>' +
      '</div>' +
      '<form class="roamly-ai-form" id="roamlyAiForm">' +
        '<input type="text" class="roamly-ai-input" id="roamlyAiInput" placeholder="Ask Roamly..." autocomplete="off" required>' +
        '<button type="submit" class="roamly-ai-send">Send</button>' +
      '</form>' +
    '</div>' +
    '<button type="button" class="roamly-ai-Launcher" id="roamlyAiLauncher" aria-label="Open Roamly AI Concierge">' +
      '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<line x1="32" y1="5" x2="32" y2="13" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"/>' +
        '<circle cx="32" cy="4.5" r="3" fill="#38bdf8"/>' +
        '<path d="M16 21C16 14.5 23 11 32 11C41 11 48 14.5 48 21H16Z" fill="#f8fafc" stroke="#fbbf24" stroke-width="2"/>' +
        '<path d="M13 21H51" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="32" cy="16.5" r="2.3" fill="#f59e0b"/>' +
        '<rect x="14" y="21" width="36" height="27" rx="12" fill="#0f172a" stroke="#e2e8f0" stroke-width="2"/>' +
        '<rect x="19" y="26" width="26" height="14" rx="7" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>' +
        '<circle class="roamly-bot-eye" cx="26.5" cy="33" r="3" fill="#38bdf8"/>' +
        '<circle class="roamly-bot-eye" cx="37.5" cy="33" r="3" fill="#38bdf8"/>' +
        '<path d="M28 43.5C29.5 45 34.5 45 36 43.5" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M49 46L58 41L54 52L51.5 48.5L49 46Z" fill="#fbbf24"/>' +
      '</svg>' +
    '</button>' +
    '<div class="roamly-ai-tooltip"><span>Roamly AI</span></div>';
  document.body.appendChild(widget);

  var launcher = document.getElementById("roamlyAiLauncher");
  var dragHeader = document.getElementById("roamlyAiDragHeader");
  var closeBtn = document.getElementById("roamlyAiClose");
  var form = document.getElementById("roamlyAiForm");
  var input = document.getElementById("roamlyAiInput");
  var messages = document.getElementById("roamlyAiMessages");
  var chips = widget.querySelectorAll(".roamly-ai-chip");

  var isDragging = false;
  var movedDuringDrag = false;
  var startX = 0;
  var startY = 0;

  var savedPos = sessionStorage.getItem("roamlyBotPos");
  if (savedPos !== null) {
    try {
      var parsed = JSON.parse(savedPos);
      applyPosition(parsed.left, parsed.top);
    } catch (err) {
      applyPosition(28, window.innerHeight - 90);
    }
  } else {
    applyPosition(28, window.innerHeight - 90);
  }

  function applyPosition(leftPos, topPos) {
    var maxLeft = window.innerWidth - 76;
    var maxTop = window.innerHeight - 76;
    var clampedLeft = Math.max(14, Math.min(maxLeft, leftPos));
    var clampedTop = Math.max(14, Math.min(maxTop, topPos));

    widget.style.left = clampedLeft + "px";
    widget.style.top = clampedTop + "px";
    widget.style.bottom = "auto";
    widget.style.right = "auto";

    if (clampedLeft > window.innerWidth * 0.52) {
      widget.classList.add("align-right");
    } else {
      widget.classList.remove("align-right");
    }

    if (clampedTop < window.innerHeight * 0.55) {
      widget.classList.add("open-down");
    } else {
      widget.classList.remove("open-down");
    }
  }

  function startDrag(e) {
    if (e.target.closest("#roamlyAiClose") !== null) { return; }
    isDragging = true;
    movedDuringDrag = false;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var rect = widget.getBoundingClientRect();

    startX = clientX;
    startY = clientY;
  }

  function onDrag(e) {
    if (!isDragging) { return; }
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var dx = clientX - startX;
    var dy = clientY - startY;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      movedDuringDrag = true;
      widget.classList.add("is-dragging");
      var rect = widget.getBoundingClientRect();
      applyPosition(rect.left + dx, rect.top + dy);
      startX = clientX;
      startY = clientY;
    }
  }

  function stopDrag() {
    if (!isDragging) { return; }
    isDragging = false;
    widget.classList.remove("is-dragging");

    if (movedDuringDrag) {
      var rect = widget.getBoundingClientRect();
      sessionStorage.setItem("roamlyBotPos", JSON.stringify({ left: rect.left, top: rect.top }));
    }
  }

  launcher.addEventListener("mousedown", startDrag);
  launcher.addEventListener("touchstart", startDrag, { passive: true });
  dragHeader.addEventListener("mousedown", startDrag);
  dragHeader.addEventListener("touchstart", startDrag, { passive: true });

  window.addEventListener("mousemove", onDrag);
  window.addEventListener("touchmove", onDrag, { passive: true });
  window.addEventListener("mouseup", stopDrag);
  window.addEventListener("touchend", stopDrag);

  launcher.addEventListener("click", function () {
    if (movedDuringDrag) {
      movedDuringDrag = false;
      return;
    }
    widget.classList.toggle("is-open");
    if (widget.classList.contains("is-open")) {
      setTimeout(function () { input.focus(); }, 180);
    }
  });

  closeBtn.addEventListener("click", function () {
    widget.classList.remove("is-open");
  });

  function getSmartReply(question) {
    var q = question.toLowerCase();
    if (q.indexOf("deal") !== -1 || q.indexOf("discount") !== -1 || q.indexOf("offer") !== -1) {
      return "You can browse the offers currently listed on our Deals page. Open Deals to review the available destinations and offer details.";
    }
    if (q.indexOf("refund") !== -1 || q.indexOf("cancel") !== -1 || q.indexOf("price") !== -1) {
      return "For cancellation, refund, or pricing questions, please contact our support team. Any applicable terms depend on the offer and booking details.";
    }
    if (q.indexOf("modify") !== -1 || q.indexOf("itinerary") !== -1 || q.indexOf("plan") !== -1) {
      return "Open My Itineraries to review saved plans, or use the AI Planner to create and adjust a trip outline.";
    }
    return "I can help with destination ideas and Roamly's planning tools, but I do not have live travel or booking data. Try the AI Planner or Contact Us for help with a specific booking.";
  }

  function sendUserMessage(text) {
    if (!text) { return; }

    var userBubble = document.createElement("p");
    userBubble.className = "roamly-ai-bubble roamly-ai-bubble--me";
    userBubble.textContent = text;
    messages.appendChild(userBubble);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(function () {
      var botBubble = document.createElement("p");
      botBubble.className = "roamly-ai-bubble";
      botBubble.textContent = getSmartReply(text);
      messages.appendChild(botBubble);
      messages.scrollTop = messages.scrollHeight;
    }, 450);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (text === "") { return; }
    input.value = "";
    sendUserMessage(text);
  });

  for (var c = 0; c < chips.length; c++) {
    chips[c].addEventListener("click", function () {
      var promptText = this.getAttribute("data-prompt");
      sendUserMessage(promptText);
    });
  }
}

initFloatingAIChat();


/* User profile page behavior */
(function () {
  var page = document.querySelector("[data-profile-page]");
  if (!page) return;

  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
  if (!email) {
    window.location.replace("sign-in.html");
    return;
  }

  var profileKey = "roamlyUserProfile:" + email;
  var profile = {};
  var accounts = [];
  try { profile = JSON.parse(localStorage.getItem(profileKey) || "{}"); } catch (error) { profile = {}; }
  try { accounts = JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); } catch (error) { accounts = []; }

  function readAccounts() {
    try { return JSON.parse(localStorage.getItem("roamlyLocalAccounts") || "[]"); }
    catch (error) { return []; }
  }

  function getAccount() {
    return accounts.find(function (account) { return account.email === email; });
  }

  function displayName() {
    var account = getAccount();
    return profile.fullName || (account && account.name) || (email.endsWith("@roamly.com") ? "Nada Alawneh" : email.split("@")[0]);
  }

  function saveProfile() {
    localStorage.setItem(profileKey, JSON.stringify(profile));
    accounts = readAccounts();
    var account = getAccount();
    if (account && profile.fullName) {
      account.name = profile.fullName;
      localStorage.setItem("roamlyLocalAccounts", JSON.stringify(accounts));
    }
    renderIdentity();
    updateCompletion();
  }

  function renderIdentity() {
    var name = displayName();
    var emailInput = page.querySelector('[name="email"]');
    page.querySelectorAll("[data-profile-name]").forEach(function (element) { element.textContent = name; });
    page.querySelectorAll("[data-profile-email]").forEach(function (element) { element.textContent = email; });
    page.querySelectorAll("[data-profile-initials]").forEach(function (element) { element.textContent = name.trim().charAt(0).toUpperCase() || "R"; });
    if (emailInput) emailInput.value = email;
    document.querySelectorAll(".user-name").forEach(function (element) { element.textContent = name; });
    document.querySelectorAll(".user-dropdown__email").forEach(function (element) { element.textContent = email; });
    document.querySelectorAll(".user-avatar").forEach(function (element) {
      if (profile.avatar) {
        element.textContent = "";
        element.style.backgroundImage = "url(\"" + profile.avatar + "\")";
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
      } else {
        element.style.backgroundImage = "";
        element.textContent = name.trim().charAt(0).toUpperCase() || "R";
      }
    });
    var avatar = page.querySelector("[data-profile-avatar]");
    if (avatar) {
      avatar.style.backgroundImage = profile.avatar ? "url(\"" + profile.avatar + "\")" : "";
      avatar.querySelector("[data-profile-initials]").hidden = Boolean(profile.avatar);
    }
  }

  function updateCompletion() {
    var checkpoints = [profile.fullName || displayName(), email, profile.phone, profile.country];
    var completed = checkpoints.filter(Boolean).length;
    var percent = Math.round(completed / checkpoints.length * 100);
    var label = page.querySelector("[data-profile-completion-text]");
    var bar = page.querySelector("[data-profile-progress]");
    if (label) label.textContent = percent + "%";
    if (bar) bar.style.width = percent + "%";
  }

  function setFeedback(element, message, isError) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("is-error", Boolean(isError));
  }

  function fillPersonalForm() {
    var form = page.querySelector("[data-personal-form]");
    form.elements.fullName.value = displayName();
    form.elements.phone.value = profile.phone || "";
    form.elements.country.value = profile.country || "";
  }

  function hashPassword(value) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.reject(new Error("Password updates need a secure local server (localhost) or HTTPS."));
    }
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then(function (digest) {
      return Array.from(new Uint8Array(digest)).map(function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
    });
  }

  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var image = new Image();
        image.onerror = reject;
        image.onload = function () {
          var canvas = document.createElement("canvas");
          var scale = Math.min(1, 320 / Math.max(image.width, image.height));
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", .84));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  fillPersonalForm();
  renderIdentity();
  updateCompletion();

  page.querySelector("[data-personal-form]").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    profile.fullName = form.elements.fullName.value.trim();
    profile.phone = form.elements.phone.value.trim();
    profile.country = form.elements.country.value.trim();
    saveProfile();
    setFeedback(page.querySelector("[data-personal-feedback]"), "Your details are saved.", false);
  });

  page.querySelector("[data-profile-photo]").addEventListener("change", function (event) {
    var file = event.currentTarget.files && event.currentTarget.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    resizeImage(file).then(function (imageData) {
      profile.avatar = imageData;
      saveProfile();
    }).catch(function () {
      setFeedback(page.querySelector("[data-personal-feedback]"), "That photo could not be loaded. Try another image.", true);
    });
  });

  page.querySelector("[data-remove-photo]").addEventListener("click", function () {
    delete profile.avatar;
    saveProfile();
    page.querySelector("[data-profile-photo]").value = "";
  });

  var passwordDialog = page.querySelector("[data-password-dialog]");
  var passwordForm = page.querySelector("[data-password-form]");
  page.querySelector("[data-open-password]").addEventListener("click", function () {
    passwordDialog.showModal();
    passwordForm.elements.currentPassword.focus();
  });
  page.querySelector("[data-close-password]").addEventListener("click", function () { passwordDialog.close(); });
  passwordDialog.addEventListener("click", function (event) {
    if (event.target === passwordDialog) passwordDialog.close();
  });
  passwordDialog.addEventListener("close", function () {
    passwordForm.reset();
    setFeedback(page.querySelector("[data-password-feedback]"), "", false);
  });

  passwordForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    var current = form.elements.currentPassword.value;
    var next = form.elements.newPassword.value;
    var confirm = form.elements.confirmPassword.value;
    var feedback = page.querySelector("[data-password-feedback]");
    if (next !== confirm) {
      setFeedback(feedback, "The new passwords do not match.", true);
      form.elements.confirmPassword.focus();
      return;
    }
    if (current === next) {
      setFeedback(feedback, "Choose a new password different from your current one.", true);
      return;
    }
    var account = getAccount();
    if (!account) {
      setFeedback(feedback, "We could not find this account.", true);
      return;
    }
    var existingHash = account.passwordHash;
    var verify = existingHash
      ? hashPassword(current).then(function (hash) { return hash === existingHash; })
      : Promise.resolve(false);
    verify.then(function (valid) {
      if (!valid) {
        setFeedback(feedback, "Your current password is not correct.", true);
        return null;
      }
      return hashPassword(next).then(function (nextHash) {
        accounts = readAccounts();
        var currentAccount = getAccount();
        if (!currentAccount) throw new Error("We could not find this account.");
        currentAccount.passwordHash = nextHash;
        localStorage.setItem("roamlyLocalAccounts", JSON.stringify(accounts));
        form.reset();
        setFeedback(feedback, "Your password has been updated.", false);
        window.setTimeout(function () { passwordDialog.close(); }, 1100);
      });
    }).catch(function (error) {
      setFeedback(feedback, error.message || "We could not update your password. Please try again.", true);
    });
  });
})();
