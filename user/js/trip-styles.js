(function () {
  "use strict";
  const styles = {
    "Adventure & Nature": {
      id: "adventure-nature",
      groups: ["Hiking and trails", "Outdoor equipment rentals", "Water and adventure sports", "Nature reserves and campsites", "Specialized transport"],
      stops: [
        ["Explore a marked outdoor trail", "استكشف مسار طبيعي محدد"],
        ["Pause at a scenic viewpoint", "خذ استراحة عند مطل طبيعي"],
        ["Explore a park or nature reserve", "استكشف متنزه أو محمية طبيعية"],
        ["Look for a guided nature walk", "دور على جولة بالطبيعة مع دليل"],
        ["Choose an outdoor route near the water", "اختار مسار بالهواء الطلق قريب من المي"],
        ["Plan a short hike at your group’s pace", "خطّط لمشي قصير على وتيرة مجموعتك"],
      ],
    },
    "Culture & History": {
      id: "culture-history",
      groups: ["Licensed tour guides", "Museums and archaeological sites", "Craft and heritage workshops", "Cultural events"],
      stops: [["Walk through a historic district", "تمشّى بحي تاريخي"], ["Explore a museum or heritage site", "استكشف متحف أو موقع تراثي"], ["Look for a local craft workshop", "دور على ورشة حِرف محلية"]],
    },
    "Relaxation & Wellness": {
      id: "relaxation-wellness",
      groups: ["Spas and wellness resorts", "Yoga and meditation retreats", "Thermal springs and wellness clinics", "Quiet beach hotels and resorts"],
      stops: [["Start with a quiet walk", "ابدأ بمشوار هادئ"], ["Set aside time for yoga or a spa visit", "خصّص وقت لليوغا أو لزيارة سبا"], ["Keep the evening open for rest", "خلّي المساء مفتوح للراحة"]],
    },
    "Family Friendly": {
      id: "family-friendly",
      groups: ["Theme parks and water parks", "Zoos and aquariums", "Indoor playgrounds", "Family tour operators"],
      stops: [["Choose a family-friendly attraction", "اختار معلم مناسب للعيلة"], ["Plan an indoor activity or aquarium visit", "خطّط لنشاط داخلي أو زيارة حوض أحياء بحرية"], ["Leave room for a family break", "خلّي مجال لاستراحة مع العيلة"]],
    },
    "Culinary & Food": {
      id: "culinary-food",
      groups: ["Restaurants and cafés", "Food tour operators", "Cooking classes", "Farm visits and tastings"],
      stops: [["Browse a local food market", "لفّ بسوق أكل محلي"], ["Try a regional dish", "جرّب أكلة من المنطقة"], ["Set aside time for a cooking class or tasting", "خصّص وقت لدرس طبخ أو جولة تذوّق"]],
    },
    "Romantic & Honeymoon": {
      id: "romantic-honeymoon",
      groups: ["Romantic dining organizers", "Boat and yacht rentals", "Travel photography studios", "Boutique hotels and private cabins"],
      stops: [["Take a slow walk together", "خذوا مشوار على مهلكم سوا"], ["Find a scenic spot for photos", "اختاروا مكان بإطلالة للصور"], ["Plan a quiet dinner or sunset outing", "خطّطوا لعشا هادئ أو طلعة مع الغروب"]],
    },
    "Shopping & City Life": {
      id: "shopping-city-life",
      groups: ["City tour operators", "Personal shoppers", "Entertainment and event venues", "Local transport companies"],
      stops: [["Explore a central shopping district", "استكشف منطقة تسوّق بوسط المدينة"], ["Browse a market or outlet", "لفّ بسوق أو بأوتلت"], ["Look for an evening event in town", "دور على فعالية مسائية بالمدينة"]],
    },
  };
  const legacy = {
    "Adventure & Outdoors": "Adventure & Nature",
    "Culture & Food": "Culinary & Food",
    "Relax & Beach": "Relaxation & Wellness",
    "Family Trip": "Family Friendly",
  };
  function resolve(value) {
    const input = String(value || "").trim().toLowerCase();
    return Object.keys(styles).find((name) => name.toLowerCase() === input || styles[name].id === input) ||
      (Object.hasOwn(legacy, value) ? legacy[value] : "");
  }
  function supplierMatches(service, style, accounts) {
    const account = accounts.get(service.supplierId);
    const ownerStyle = account?.supplierCategory;
    const declared = service.providerStyle || service.supplierCategory;
    const normalized = resolve(style) || "Adventure & Nature";
    if (ownerStyle) return resolve(ownerStyle) === normalized && (!declared || resolve(declared) === normalized);
    if (declared) return resolve(declared) === normalized;
    return normalized === "Adventure & Nature" && ["hiking", "equipment", "sports", "reserves", "transport"].includes(service.category);
  }
  window.RoamlyTripStyles = {
    styles, resolve, supplierMatches,
    labels: Object.fromEntries(Object.values(styles).flatMap((style) => style.stops)),
  };
})();
