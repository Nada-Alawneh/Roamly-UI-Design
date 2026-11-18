(function () {
  "use strict";

  // Published offers cover every activity type in the supplier dashboard.
  const route = { origin: "Amman, Jordan", destination: "Istanbul, Turkey", travelers: "2", experienceBudget: "200" };
  const supplier = {
    id: "roamly-seed-istanbul",
    role: "supplier",
    supplierCategory: "adventure-nature",
    name: "Roamly Istanbul Demo",
    businessName: "Roamly Istanbul Demo",
    isDemo: true,
  };
  const examples = {
    hiking: [
      ["Old city walking tour", "جولة مشي بالبلدة القديمة", 42],
      ["Forest ridge walk", "مشي على تلال الغابة", 56],
      ["Guided valley route", "مسار الوادي مع دليل", 65],
    ],
    equipment: [
      ["Camping kit rental", "تأجير عدّة تخييم", 24],
      ["Mountain bike rental", "تأجير دراجة جبلية", 30],
      ["Climbing kit rental", "تأجير عدّة تسلّق", 28],
      ["Kayak equipment rental", "تأجير عدّة كاياك", 35],
    ],
    sports: [
      ["Guided rafting session", "جلسة تجديف نهري", 72],
      ["Zip-line session", "جلسة انزلاق بالحبل", 45],
      ["Guided kayak outing", "طلعة كاياك مع دليل", 52],
      ["Outdoor skills workshop", "ورشة مهارات بالهواء الطلق", 38],
    ],
    reserves: [
      ["Nature reserve admission", "دخول محمية طبيعية", 15],
      ["Wildlife observation tour", "جولة مراقبة الحياة البرية", 58],
      ["One night at a campsite", "ليلة بالمخيّم", 28],
      ["One night in a cabin", "ليلة بكوخ", 75],
    ],
    transport: [
      ["Private 4×4 outing", "طلعة دفع رباعي خاصة", 145],
      ["Remote trail transfer", "توصيل لمسار بعيد", 88],
      ["Private speedboat rental", "استئجار قارب سريع خاص", 185],
    ],
  };
  const catalog = window.RoamlySupplierServices;
  const offers = Object.entries(examples).flatMap(([category, entries]) =>
    entries.map(([title, titleAr, price], index) => ({
      id: "roamly-seed-" + category + "-" + (index + 1),
      supplierId: supplier.id,
      supplierName: supplier.businessName,
      providerStyle: supplier.supplierCategory,
      serviceArea: route.destination,
      serviceType: catalog.serviceTypes[category][index],
      category,
      title,
      titleAr,
      description: "Sample listing for testing the Roamly itinerary and booking flow.",
      descriptionAr: "عرض تجريبي لمراجعة برنامج الرحلة وتسلسل الحجز في روملي.",
      currency: "USD",
      price,
      published: true,
      isDemo: true,
      capacity: 6,
      duration: category === "reserves" ? "1 night" : category === "equipment" ? "1 day" : "3 hours",
      meetingPoint: "Agreed with the provider after confirmation",
      included: category === "equipment" ? "Equipment and fitting" : "Service as described in the listing",
      requirements: "Confirm group requirements before the trip.",
      availability: "Subject to confirmation",
      team: category === "equipment" ? [] : [{ name: "Roamly demo guide", role: "Local host", languages: "Arabic, English" }],
    })),
  );
  const first = offers[0];
  offers.push(
    { ...first, id: "roamly-seed-limit", title: "Solo-only guided walk", titleAr: "جولة مشي لشخص واحد", capacity: 1 },
    { ...first, id: "roamly-seed-budget", title: "Private premium walk", titleAr: "جولة مشي خاصة", price: 350 },
    { ...first, id: "roamly-seed-draft", title: "Unpublished sample", published: false },
    { ...first, id: "roamly-seed-bali", title: "Bali village walk", titleAr: "مشي بقرية في بالي", serviceArea: "Bali, Indonesia" },
  );

  function install() {
    const platform = window.RoamlyPlatform;
    for (const [key, incoming] of [
      ["roamlyLocalAccounts", [supplier]],
      ["roamly-market-services", offers],
    ]) {
      const records = platform.read(key, []);
      const existing = new Set(records.map((record) => record.id));
      platform.write(key, records.concat(incoming.filter((record) => !existing.has(record.id))));
    }
    return route;
  }

  window.RoamlyPlannerSeed = { install };
})();
