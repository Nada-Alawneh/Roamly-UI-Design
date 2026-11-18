(function () {
  "use strict";
  const pairs = {
    home: ["Home", "الرئيسية"],
    tourism: ["Explore with AI ▾", "استكشف بالذكاء الاصطناعي ▾"],
    jordan: ["The Jordanian Narrative", "الحكاية الأردنية"],
    global: ["Global AI Planner", "مخطط السفر العالمي"],
    community: ["Community", "المجتمع"],
    destinations: ["Destinations", "الوجهات"],
    pricing: ["Pricing", "الأسعار"],
    about: ["About Us", "من نحن"],
    contact: ["Contact Us", "تواصل معنا"],
    concierge: ["YOUR PERSONAL AI CONCIERGE", "مساعد سفرك الذكي"],
    plannerTitle: ["Less planning. More possibility.", "تخطيط أقل. آفاق أوسع."],
    plannerLead: [
      "A conversation, a thoughtful route, and local people who bring it to life.",
      "محادثة، ومسار مدروس، وتجارب يصنعها أهل المكان.",
    ],
    demo: [
      "Demo checkout · no real card charge",
      "دفع تجريبي · لا تُخصم مبالغ حقيقية",
    ],
    chatTitle: ["Let’s make it your journey", "لنصمم رحلتك معاً"],
    continue: ["Continue", "متابعة"],
    restart: ["Start again", "ابدأ من جديد"],
    yourRoute: ["YOUR ROUTE, REIMAGINED", "مسارك برؤية جديدة"],
    blankTitle: ["Great journeys start with a conversation.", "الرحلات الجميلة تبدأ بمحادثة."],
    blankLead: [
      "Tell us where you want to go. Your day-by-day plan will appear here.",
      "أخبرنا إلى أين تريد الذهاب، وستظهر خطتك اليومية هنا.",
    ],
    jordanKicker: ["THE JORDANIAN NARRATIVE", "الحكاية الأردنية"],
    jordanTitle: ["Some places stay with you.", "أماكن تبقى في القلب."],
    jordanLead: [
      "Walk through rose-red history. Follow the silence of the desert. Find a seat at a table that feels like home.",
      "امشِ بين صفحات التاريخ الوردي، وأنصت لسكون الصحراء، وشارك أهلها دفء المائدة.",
    ],
    explore: ["Find your Jordan story", "اكتشف حكايتك في الأردن"],
    localStories: ["LOCAL PEOPLE. EXTRAORDINARY STORIES.", "أهل المكان. حكايات استثنائية."],
    jordanExperiences: ["From ancient paths to desert skies", "من دروب التاريخ إلى سماء الصحراء"],
    gallery: ["A world worth slowing down for", "عالم يستحق التأمل"],
    communityTitle: ["Good journeys deserve to be shared.", "الرحلات الجميلة تستحق المشاركة."],
    communityLead: [
      "Routes worth copying. Advice from people who have been there.",
      "مسارات تستحق التجربة ونصائح ممن سبقوك إليها.",
    ],
    shareStory: ["Share a little inspiration", "شارك بعض الإلهام"],
    postType: ["Post type", "نوع المنشور"],
    tip: ["Travel tip", "نصيحة سفر"],
    review: ["Review", "تقييم"],
    itinerary: ["Itinerary", "برنامج رحلة"],
    yourStory: ["Your story", "حكايتك"],
    shareHint: [
      "Itinerary posts include your most recently generated plan.",
      "تتضمن منشورات الرحلات آخر خطة أنشأتها.",
    ],
    publish: ["Share with community", "شارك مع المجتمع"],
    where: [
      "Where would you like to go? Try Jordan, Istanbul or Bali.",
      "إلى أين تريد السفر؟ جرّب الأردن أو إسطنبول أو بالي.",
    ],
    when: ["When will you travel? Choose a start date.", "متى ستسافر؟ اختر تاريخ البداية."],
    days: ["How many days? Choose between 1 and 14.", "كم يوماً؟ اختر من يوم إلى ١٤ يوماً."],
    people: ["How many travelers? Choose between 1 and 20.", "كم عدد المسافرين؟ اختر من ١ إلى ٢٠."],
    style: [
      "What do you love? Nature, culture, food, or a little of everything?",
      "ماذا تحب؟ الطبيعة، الثقافة، الطعام، أم مزيجاً منها؟",
    ],
    analyzing: [
      "Analyzing your route and matching published supplier experiences…",
      "جارٍ تحليل مسارك ومطابقة تجارب المورّدين المنشورة…",
    ],
    day: ["Day", "اليوم"],
    add: ["Confirm & Add to Trip", "تأكيد وإضافة إلى الرحلة"],
    book: ["Book Entire Plan", "احجز الخطة كاملة"],
    experience: ["Book Experience & Pay", "احجز التجربة وادفع"],
    perPerson: ["per traveler", "لكل مسافر"],
    total: ["Selected experiences total", "إجمالي التجارب المحددة"],
    noMatch: [
      "No published supplier experiences match this destination. Enjoy the suggested route; booking becomes available when local services are published.",
      "لا توجد تجارب منشورة لهذه الوجهة. استمتع بالمسار المقترح؛ سيتاح الحجز عند نشر خدمات محلية.",
    ],
    freeTime: [
      "Explore at your own pace. Leave room for local food, neighborhood walks and rest.",
      "استكشف على مهل، واترك وقتاً للطعام المحلي والمشي والراحة.",
    ],
    checkout: ["Review your experiences", "راجع تجاربك"],
    name: ["Traveler name", "اسم المسافر"],
    email: ["Email for booking updates", "البريد الإلكتروني لتحديثات الحجز"],
    payment: ["Payment arrangement", "طريقة تقسيم المبلغ"],
    full: ["One payer", "دافع واحد"],
    split: ["Split equally with the group", "تقسيم بالتساوي بين المجموعة"],
    submit: ["Confirm booking request", "تأكيد طلب الحجز"],
    pending: [
      "Requests sent. Suppliers will confirm availability and final pricing in their dashboard. No money has been charged.",
      "أُرسلت الطلبات. سيؤكد المورّدون التوافر والسعر النهائي من لوحاتهم. لم يُخصم أي مبلغ.",
    ],
    close: ["Close", "إغلاق"],
    copy: ["Copy this Itinerary", "انسخ هذه الرحلة"],
    copied: ["Copied — open the planner to personalize it.", "نُسخت الرحلة — افتح المخطط لتخصيصها."],
    like: ["Like", "أعجبني"],
    needPlan: ["Create a plan first, then share it here.", "أنشئ خطة أولاً ثم شاركها هنا."],
    posted: [
      "Your story is saved on this browser.",
      "حُفظت حكايتك على هذا المتصفح.",
    ],
    invalid: ["Please enter a valid answer.", "يرجى إدخال إجابة صحيحة."],
    unavailable: [
      "A selected service changed or is unavailable. Please review your plan again.",
      "تغيّرت خدمة محددة أو أصبحت غير متاحة. يرجى مراجعة الخطة.",
    ],
    budget: [
      "What is your experience budget per traveler in USD? Enter 20–10000.",
      "ما ميزانية التجارب لكل مسافر بالدولار؟ أدخل من ٢٠ إلى ١٠٠٠٠.",
    ],
    saved: ["Plan saved on this browser.", "حُفظت الخطة على هذا المتصفح."],
    save: ["Save itinerary", "احفظ الرحلة"],
    demoData: [
      "Demo supplier · availability requires confirmation",
      "مورّد تجريبي · التوافر يحتاج تأكيداً",
    ],
  };
  Object.assign(pairs, {
    experiences: ["Experiences", "التجارب"],
    signIn: ["Sign In", "تسجيل الدخول"],
    menu: ["Menu", "القائمة"],
    skip: ["Skip to content", "تجاوز إلى المحتوى"],
    quick: ["Quick Links", "روابط سريعة"],
    top: ["Top Destinations", "أبرز الوجهات"],
    support: ["Support", "الدعم"],
    deals: ["Packages & Deals", "الباقات والعروض"],
    faq: ["FAQs", "الأسئلة الشائعة"],
    guide: ["Booking Guide", "دليل الحجز"],
    terms: ["Terms & Conditions", "الشروط والأحكام"],
    privacy: ["Privacy Policy", "سياسة الخصوصية"],
    newsletter: ["Subscribe to our newsletter", "اشترك في نشرتنا"],
    newsletterLead: [
      "Get exclusive deals, AI travel tips, and destination inspiration straight to your inbox.",
      "احصل على عروض حصرية ونصائح للسفر وإلهام لوجهتك القادمة.",
    ],
    subscribe: ["Subscribe", "اشترك"],
    emailAddress: ["Email address", "البريد الإلكتروني"],
    companion: ["Roamly is your travel companion", "روملي رفيق سفرك"],
    profile: ["My Profile", "ملفي الشخصي"],
    myTrips: ["My Itineraries", "رحلاتي"],
    settings: ["Account Settings", "إعدادات الحساب"],
    logout: ["Log Out", "تسجيل الخروج"],
    overview: ["Overview", "نظرة عامة"],
    team: ["Team members", "أعضاء الفريق"],
    requests: ["Booking requests", "طلبات الحجز"],
    business: ["Business profile", "ملف الشركة"],
    hiking: ["Hiking & Trail Companies", "شركات المشي والمسارات"],
    equipment: ["Outdoor Equipment Rentals", "تأجير المعدات الخارجية"],
    sports: ["Water & Adventure Sports", "الرياضات المائية والمغامرات"],
    reserves: ["Nature Reserves & Campsites", "المحميات والمخيمات"],
    transport: ["Specialized Transport", "النقل المتخصص"],
    mainSite: ["Main site", "الموقع الرئيسي"],
    addService: ["Add service", "إضافة خدمة"],
    edit: ["Edit", "تعديل"],
    delete: ["Delete", "حذف"],
    saveService: ["Save service", "احفظ الخدمة"],
    cancel: ["Cancel", "إلغاء"],
    published: ["Published", "منشور"],
    draft: ["Draft", "مسودة"],
    pendingLabel: ["Pending", "قيد الانتظار"],
    confirmed: ["Confirmed", "مؤكد"],
    completed: ["Completed", "مكتمل"],
  });
  Object.assign(pairs, {
    supplierIntegration: ["Your services → traveler itineraries", "خدماتك ← برامج المسافرين"],
    supplierIntegrationLead: [
      "Published services with a price and destination or meeting point appear in matching concierge plans. Booking requests arrive in your existing inbox.",
      "تظهر الخدمات المنشورة ذات السعر والوجهة أو نقطة اللقاء في خطط السفر المطابقة. تصلك طلبات الحجز في صندوقك الحالي.",
    ],
    importDemos: ["Add editable demo experiences", "أضف تجارب تجريبية قابلة للتعديل"],
  });
  let lang;
  try {
    lang = localStorage.getItem("roamlyLanguage") === "ar" ? "ar" : "en";
  } catch {
    lang = "en";
  }
  function t(key) {
    return pairs[key]?.[lang === "ar" ? 1 : 0] || key;
  }
  const normalize = (value) => String(value).replace(/\s+/g, " ").trim();
  const messages = new Map(
    Object.entries(window.ROAMLY_AR || {}).map(([en, ar]) => [normalize(en), ar]),
  );
  for (const values of Object.values(pairs)) messages.set(normalize(values[0]), values[1]);
  const reverse = new Map([...messages].map(([en, ar]) => [normalize(ar), en]));
  const textRecords = new WeakMap(),
    attributeRecords = new WeakMap();
  let observer,
    applying = false;
  const escapeRegExp = (value) =>
    Array.from(value, (c) =>
      [46, 42, 43, 63, 94, 36, 123, 125, 40, 41, 124, 91, 93, 92].includes(c.charCodeAt(0))
        ? String.fromCharCode(92) + c
        : c,
    ).join("");
  const phrases = [...messages.keys()]
    .filter((key) => key.length > 2 && /[A-Za-z]/.test(key) && !/@|https?:/.test(key))
    .sort((a, b) => b.length - a.length);
  const phrasePattern = new RegExp(
    "(?<![A-Za-z])(?:" + phrases.map(escapeRegExp).join("|") + ")(?![A-Za-z])",
    "gi",
  );
  const insensitive = new Map([...messages].map(([en, ar]) => [en.toLowerCase(), ar]));
  let titleSource = document.title;
  function translate(value) {
    const source = normalize(value);
    if (lang !== "ar") return value;
    const exact = messages.get(source) || insensitive.get(source.toLowerCase());
    let output =
      exact || source.replace(phrasePattern, (match) => insensitive.get(match.toLowerCase()) || match);
    if (
      !exact &&
      /^(?:[A-Za-z]+, )?[A-Za-z]{3,9} \d{1,2}(?:, \d{4})?(?:, \d{1,2}:\d{2} [AP]M)?$/.test(source)
    ) {
      const hasYear = /\d{4}/.test(source),
        date = new Date(hasYear ? source : source + " 2000");
      if (!isNaN(date.getTime()))
        output = new Intl.DateTimeFormat("ar-JO", {
          month: "short",
          day: "numeric",
          ...(hasYear ? { year: "numeric" } : {}),
          ...(/:[0-9]{2}/.test(source) ? { hour: "numeric", minute: "2-digit" } : {}),
        }).format(date);
    }
    if (!/https?:|@|[a-z0-9]+-[a-f0-9]{8}/i.test(source))
      output = output
        .replace(/\bAM\b/g, "ص")
        .replace(/\bPM\b/g, "م")
        .replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
    return (/^\s/.test(value) ? " " : "") + output + (/\s$/.test(value) ? " " : "");
  }
  function apply() {
    if (applying) return;
    applying = true;
    if (observer) observer.disconnect();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const pageTitle = document.querySelector("[data-page-title]")?.dataset.pageTitle || titleSource;
    document.title = lang === "ar" ? translate(pageTitle) : pageTitle;
    for (const values of Object.values(pairs)) {
      messages.set(normalize(values[0]), values[1]);
      reverse.set(normalize(values[1]), values[0]);
    }
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (pairs[el.dataset.i18n] && el.textContent !== t(el.dataset.i18n))
        el.textContent = t(el.dataset.i18n);
    });
    document
      .querySelectorAll("option:not([value])")
      .forEach((el) =>
        el.setAttribute("value", reverse.get(normalize(el.textContent)) || el.textContent),
      );
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const parent = node.parentElement;
      if (
        !parent ||
        parent.closest(
          "script,style,textarea,[data-language],[data-user-content],.user-name,.profile-name,.user-dropdown__email",
        )
      )
        continue;
      const current = node.nodeValue;
      if (!current.trim()) continue;
      let record = textRecords.get(node);
      if (!record || current !== record.rendered) {
        record = { source: reverse.get(normalize(current)) || current, rendered: current };
        textRecords.set(node, record);
      }
      const output = lang === "ar" ? translate(record.source) : record.source;
      if (current !== output) node.nodeValue = output;
      record.rendered = output;
    }
    document
      .querySelectorAll(
        "[placeholder],[title],[aria-label],[alt],[data-i18n-placeholder],[data-i18n-aria-label]",
      )
      .forEach((el) => {
        let records = attributeRecords.get(el);
        if (!records) {
          records = {};
          attributeRecords.set(el, records);
        }
        for (const attr of ["placeholder", "title", "aria-label", "alt"]) {
          if (!el.hasAttribute(attr)) continue;
          const current = el.getAttribute(attr);
          let rec = records[attr];
          if (!rec || rec.rendered !== current)
            rec = records[attr] = {
              source: reverse.get(normalize(current)) || current,
              rendered: current,
            };
          const key = el.getAttribute("data-i18n-" + attr);
          const output = key && pairs[key] ? t(key) : lang === "ar" ? translate(rec.source) : rec.source;
          if (output !== current) el.setAttribute(attr, output);
          rec.rendered = output;
        }
      });
    document
      .querySelectorAll("[data-language]")
      .forEach((el) => el.setAttribute("aria-pressed", String(el.dataset.language === lang)));
    if (observer)
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["placeholder", "title", "aria-label", "alt"],
      });
    applying = false;
  }
  window.RoamlyI18n = {
    t,
    apply,
    translate,
    get language() {
      return lang;
    },
    dictionary: pairs,
  };
  let scheduled = false;
  observer = new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        apply();
      });
    }
  });
  const navKeys = {
    Home: "home",
    "AI Planner": "global",
    Destinations: "destinations",
    Pricing: "pricing",
    "About Us": "about",
    "Contact Us": "contact",
    Community: "community",
  };
  document.querySelectorAll(".site-nav a").forEach((a) => {
    const key = navKeys[a.textContent.trim()];
    if (key) a.dataset.i18n = key;
  });
  const host =
    document.querySelector(".site-header__inner") ||
    document.querySelector(".topbar-right") ||
    document.body;
  if (host) {
    const toggle = document.createElement("div");
    toggle.className = "rx-languages" + (host === document.body ? " rx-languages--floating" : "");
    toggle.setAttribute("aria-label", "Language / اللغة");
    toggle.innerHTML =
      '<button type="button" data-language="en" lang="en">English</button><button type="button" data-language="ar" lang="ar">عربي</button>';
    host.append(toggle);
    toggle.addEventListener("click", (e) => {
      const b = e.target.closest("[data-language]");
      if (!b) return;
      lang = b.dataset.language;
      try {
        localStorage.setItem("roamlyLanguage", lang);
      } catch {}
      apply();
      document.dispatchEvent(new Event("roamly:languagechange"));
    });
  }
  apply();
})();
