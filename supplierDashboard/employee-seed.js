(function () {
  "use strict";
  var email = (sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "").toLowerCase();
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch (error) { return fallback; } }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  var accounts = read("roamlyLocalAccounts", []), account = accounts.find(function (item) { return item.email === email && item.role === "supplier"; });
  if (!account) return;
  if (!account.id) { account.id = "supplier-" + btoa(account.email).replace(/[^a-z0-9]/gi, "").slice(0, 16); var ai = accounts.findIndex(function (item) { return item.email === email; }); if (ai >= 0) { accounts[ai] = account; write("roamlyLocalAccounts", accounts); } }

  var employees = read("roamly-supplier-employees", []);
  employees = employees.filter(function (person) { return !(person.supplierId === account.id && person.testData === true); });
  employees.forEach(function (person) { if (person.supplierId === account.id) { delete person.testData; delete person.testLabel; } });
  write("roamly-supplier-employees", employees);

  var services = read("roamly-market-services", []);
  var removedIds = services.filter(function (service) { return service.supplierId === account.id && service.testData === true; }).map(function (service) { return service.id; });
  services = services.filter(function (service) { return !(service.supplierId === account.id && service.testData === true); });
  services.forEach(function (service) {
    if (service.supplierId !== account.id) return;
    delete service.testData; delete service.testLabel;
    delete service.countryCoverage;
    service.teamMemberIds = (service.teamMemberIds || []).filter(function (id) { return employees.some(function (person) { return person.id === id; }); });
    service.team = (service.team || []).filter(function (member) { return !member.employeeId || employees.some(function (person) { return person.id === member.employeeId; }); });
  });
  if (removedIds.length) {
    var requests = read("roamly-market-requests", []);
    write("roamly-market-requests", requests.filter(function (request) { return removedIds.indexOf(request.serviceId) < 0; }));
  }

  var hikingTypes = ["Local tourist guides", "Organizing mountain hiking routes", "Cave and valley exploration tours"];
  var activeEmployees = employees.filter(function (person) { return person.supplierId === account.id && person.active !== false && ((person.serviceCategories || []).indexOf("hiking") >= 0 || (person.serviceTypes || []).some(function (type) { return hikingTypes.indexOf(type) >= 0; })); });
  if (activeEmployees.length < 1) { write("roamly-market-services", services); write("roamly-supplier-employees", employees); return; }
  function publicMember(person) { return { employeeId: person.id, name: person.name, role: person.role, experience: person.experience || "", languages: person.languages || "", qualifications: person.qualifications || "", bio: person.bio || "" }; }
  function teamFor(typeIndex, offerIndex) {
    var count = Math.min(2, activeEmployees.length), start = (typeIndex * 2 + offerIndex) % activeEmployees.length, selected = [];
    for (var i = 0; i < count; i++) selected.push(activeEmployees[(start + i) % activeEmployees.length]);
    return selected;
  }
  var offers = [
    { type: "Local tourist guides", id: "guided-nature-walk", title: "Guided nature and wildlife walk", price: "32", duration: "4 hours", difficulty: "Easy to moderate · suitable for families", capacity: "8", meetingPoint: "Agreed with the provider after confirmation", description: "Explore local landscapes, wildlife and natural heritage with a knowledgeable guide. The route is tailored to the selected destination.", included: "Local guide, route briefing and drinking water", requirements: "Comfortable walking shoes, sun protection and a refillable water bottle", safety: "Small groups; route and pace are adjusted to weather and participant needs.", availability: "Available by arrangement · reserve 24 hours ahead" },
    { type: "Local tourist guides", id: "guided-cultural-trail", title: "Guided forest and cultural walk", price: "28", duration: "3.5 hours", difficulty: "Easy · suitable for beginners", capacity: "10", meetingPoint: "Agreed with the provider after confirmation", description: "Discover a destination's natural setting and local heritage with a guide who adapts the walk to the group.", included: "Local guide, water refill and route planning", requirements: "Closed walking shoes, sun protection and weather-appropriate clothing", safety: "Family-friendly pacing with regular rest stops; local access conditions are checked before the walk.", availability: "Daily by arrangement · reserve 24 hours ahead" },
    { type: "Organizing mountain hiking routes", id: "guided-mountain-route", title: "Guided mountain trail", price: "48", duration: "6 hours", difficulty: "Moderate · good fitness recommended", capacity: "6", meetingPoint: "Agreed with the provider after confirmation", description: "A small-group mountain route with planned rest stops, scenic viewpoints and a pace set by the route leader.", included: "Route leader, navigation equipment and safety briefing", requirements: "Hiking boots, drinking water and weather-appropriate layers", safety: "The team checks local trail and weather conditions and reschedules unsafe departures.", availability: "Available by arrangement · reserve 48 hours ahead" },
    { type: "Organizing mountain hiking routes", id: "guided-ridge-hike", title: "Guided ridge and forest hike", price: "42", duration: "5 hours", difficulty: "Moderate · suitable for active beginners", capacity: "8", meetingPoint: "Agreed with the provider after confirmation", description: "Follow a scenic ridge and woodland route with a leader and assistant guide, adjusted to the group's experience.", included: "Two-person guiding team, route briefing and navigation support", requirements: "Hiking boots, water, snacks and a light rain layer", safety: "Route and pace are adjusted to local trail conditions and participant experience.", availability: "Available by arrangement · reserve 24 hours ahead" },
    { type: "Cave and valley exploration tours", id: "guided-cave-discovery", title: "Guided canyon and cave exploration", price: "55", duration: "5 hours", difficulty: "Challenging · activity requirements apply", capacity: "6", meetingPoint: "Agreed with the provider after confirmation", description: "A guided canyon and cave experience focused on geology, local ecology and responsible access.", included: "Specialist guide, required safety equipment and briefing", requirements: "Activity-appropriate clothing and footwear; requirements shared before confirmation", safety: "Runs only when local conditions are safe; participants follow the guide's instructions.", availability: "By arrangement · reserve 48 hours ahead" },
    { type: "Cave and valley exploration tours", id: "guided-valley-expedition", title: "Guided valley and cave expedition", price: "62", duration: "6 hours", difficulty: "Challenging · experience requirements apply", capacity: "6", meetingPoint: "Agreed with the provider after confirmation", description: "Explore valley landscapes, natural pools and cave formations with an experienced outdoor team.", included: "Two-person guide team, activity safety equipment and route briefing", requirements: "Activity-appropriate footwear, clothing and a waterproof bag", safety: "Conditions are checked before departure; the route may change for safety.", availability: "Seasonal by location · reserve 48 hours ahead" }
  ];
  var typeNames = ["Local tourist guides", "Organizing mountain hiking routes", "Cave and valley exploration tours"];
  var legacyIds = { "guided-nature-walk": "dana-guided-walk", "guided-cultural-trail": "ajloun-heritage-walk", "guided-mountain-route": "mujib-mountain-trail", "guided-ridge-hike": "ajloun-ridge-hike", "guided-cave-discovery": "mujib-canyon-discovery", "guided-valley-expedition": "wadi-hidan-cave-tour" };
  offers.forEach(function (offer, offerIndex) {
    var prefix = "service-" + account.id + "-", current = services.find(function (service) { return service.supplierId === account.id && (service.id === prefix + offer.id || service.id === prefix + legacyIds[offer.id]); });
    if (!current) return;
    var selected = teamFor(typeNames.indexOf(offer.type), offerIndex), currentId = current.id, wasPublished = current.published !== false, createdAt = current.createdAt;
    Object.assign(current, offer, { id: currentId, supplierId: account.id, supplierName: account.businessName || account.name, category: "hiking", serviceType: offer.type, teamMemberIds: selected.map(function (person) { return person.id; }), team: selected.map(publicMember), published: wasPublished, createdAt: createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  var catalogKey = "roamlySupplierHikingCatalogV2Initialized:" + account.id, catalogInitialized = localStorage.getItem(catalogKey) === "1";
  typeNames.forEach(function (type, typeIndex) {
    if (catalogInitialized) return;
    var existingCount = services.filter(function (service) { return service.supplierId === account.id && service.category === "hiking" && service.serviceType === type && (service.team || []).length > 0; }).length;
    offers.filter(function (offer) { return offer.type === type; }).forEach(function (offer, offerIndex) {
      if (existingCount > offerIndex) return;
      var assigned = teamFor(typeIndex, offerIndex), id = "service-" + account.id + "-" + offer.id;
      if (services.some(function (service) { return service.id === id; })) return;
      var team = assigned.map(publicMember);
      services.push({ id: id, supplierId: account.id, supplierName: account.businessName || account.name, category: "hiking", serviceType: offer.type, title: offer.title, price: offer.price, duration: offer.duration, difficulty: offer.difficulty, capacity: offer.capacity, meetingPoint: offer.meetingPoint, description: offer.description, included: offer.included, requirements: offer.requirements, safety: offer.safety, availability: offer.availability, teamMemberIds: assigned.map(function (person) { return person.id; }), team: team, ratings: [], published: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    });
  });
  write("roamly-market-services", services);
  localStorage.setItem(catalogKey, "1");
}());
