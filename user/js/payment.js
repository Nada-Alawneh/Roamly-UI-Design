(function () {
  "use strict";
  const P = window.RoamlyPlatform,
    I = window.RoamlyI18n,
    host = document.getElementById("payment-content");
  if (!host) return;
  const tr = (en, ar) => (I.language === "ar" ? ar : en),
    params = new URLSearchParams(location.search),
    format = (amount, currency = "USD") =>
      new Intl.NumberFormat(I.language === "ar" ? "ar-JO" : "en-US", {
        style: "currency",
        currency,
      }).format(amount / 100);
  let receiptId = crypto.randomUUID(),
    paid = false;
  const splitDeadline = (booking) => Date.parse(booking.createdAt) + 48 * 60 * 60 * 1000;
  function splitNotice(booking, shareRecorded) {
    const notice = document.createElement("p");
    notice.className = "rx-notice";
    const deadline = splitDeadline(booking);
    const date = new Intl.DateTimeFormat(I.language === "ar" ? "ar-JO" : "en-US", {
      dateStyle: "medium", timeStyle: "short",
    }).format(deadline);
    const reminder = Date.now() >= deadline
      ? tr("The group’s 48-hour payment window has ended.", "انتهت مهلة الـ٤٨ ساعة للدفع الجماعي.")
      : tr("Your group has 48 hours from the first payment to complete the balance. Payment reminder: finish by ", "معك إنت وفريقك ٤٨ ساعة من أول دفعة لإكمال المبلغ. تذكير بالدفع: كمّلوا قبل ") + date + ".";
    notice.textContent = (shareRecorded ? tr("Your share was recorded. ", "تم تسجيل حصتك. ") : "") +
      reminder + " " + tr(
        "The demo policy deducts a 10% fee from the amount paid and refunds the remainder if the deadline passes.",
        "حسب سياسة الدفع التجريبية، إذا انتهت المهلة بينخصم ١٠٪ من المبلغ المدفوع وبينردّ الباقي.",
      );
    return notice;
  }
  function showActivation() {
    const message = host.querySelector("#payment-status");
    message.textContent = tr(
      "Your access is ready. Continue your saved questionnaire.",
      "أصبح وصولك جاهزاً. تابع استبيانك المحفوظ.",
    );
    const link = document.createElement("a");
    link.className = "rx-button";
    link.href = sessionStorage.getItem("roamlyPendingPlanner")
      ? "ai-planner.html?resume=1"
      : "ai-planner.html";
    link.textContent = tr("Continue to my planner", "متابعة إلى مخطط رحلتي");
    message.append(document.createElement("br"), link);
  }
  function render() {
    const group = params.get("group");
    if (group && !params.has("share")) {
      const rows = P.read("roamly-market-requests", []).filter((b) => b.bookingGroupId === group);
      const tripPayment = rows[0]?.packagePayment;
      if (!rows.length || (tripPayment && rows[0].travelerEmail !== P.email())) {
        host.textContent = tr(
          "This booking receipt could not be found.",
          "تعذر العثور على إيصال الحجز.",
        );
        return;
      }
      host.innerHTML =
        "<h2>" +
        (tripPayment ? tr("Unified trip receipt", "إيصال الرحلة الموحّد") : tr("Booking receipt", "إيصال الحجز")) +
        "</h2><p>" +
        (tripPayment ? tr("Your trip costs and recorded payments.", "تكاليف رحلتك والدفعات المسجّلة.") : tr(
          "Each supplier confirms their own service. No real money was charged.",
          "يؤكد كل مورّد خدمته. لم يُخصم أي مبلغ حقيقي.",
        )) +
        '</p><ul id="receipt-bookings"></ul><ul id="receipt-shares"></ul>';
      if (tripPayment) {
        const total = document.createElement("strong");
        total.textContent = tr("Trip total", "إجمالي الرحلة") + " · " + format(tripPayment.totalCents);
        const entries = host.querySelector("#receipt-bookings");
        entries.before(total);
        if (rows[0].payment?.mode === "split" && tripPayment.sharesCents) {
          const balance = document.createElement("p");
          const recorded = (rows[0].payment.paidShares || []).reduce((sum, index) => sum + (tripPayment.sharesCents[index] || 0), 0);
          balance.textContent = tr("Recorded", "المسجّل") + " " + format(recorded) + " · " +
            tr("Remaining", "المتبقّي") + " " + format(tripPayment.totalCents - recorded);
          total.after(balance);
          if (recorded < tripPayment.totalCents && Number.isFinite(splitDeadline(rows[0]))) {
            balance.after(splitNotice(rows[0], rows[0].payment.paidShares?.includes(0)));
          }
        }
        for (const line of tripPayment.essentials) {
          const item = document.createElement("li");
          item.textContent = tr(line.en, line.ar) + " · " + format(line.cents);
          entries.append(item);
        }
      }
      rows.filter((row) => !row.tripOnly).forEach((row) => {
        const li = document.createElement("li");
        li.textContent =
          row.serviceTitle +
          " · " +
          row.date +
          " · " +
          format(row.financials?.grossCents || 0) +
          (tripPayment ? "" : " · " + I.translate(row.status));
        host.querySelector("#receipt-bookings").append(li);
      });
      if (rows[0].payment?.mode === "split")
        rows[0].payment.shares.forEach((amount, index) => {
          const done = rows.every((r) => r.payment.paidShares?.includes(index)),
            li = document.createElement("li"),
            share = tripPayment?.sharesCents?.[index] ?? rows.reduce((n, r) => n + Math.round(r.payment.shares[index] * 100), 0);
          li.textContent =
            tr("Traveler " + (index + 1), "المسافر " + (index + 1)) +
            " · " +
            format(share) +
            " · " +
            tr(done ? "Recorded" : "Outstanding", done ? "مسجّلة" : "متبقية");
          if (!done && !(tripPayment && Date.now() >= splitDeadline(rows[0]))) {
            const a = document.createElement("a");
            a.href = "payment.html?group=" + encodeURIComponent(group) + "&share=" + index;
            a.className = "rx-link";
            a.textContent = tr("Pay share", "ادفع الحصة");
            li.append(a);
          }
          host.querySelector("#receipt-shares").append(li);
        });
      if (tripPayment) {
        const complete = rows.every((row) => row.payment?.status === "Paid (demo)");
        const pass = document.createElement(complete ? "a" : "button");
        pass.className = "rx-button";
        if (complete) {
          pass.href = "trip.html?group=" + encodeURIComponent(group) + "&boarding=1";
        } else {
          pass.type = "button";
          pass.disabled = true;
          const help = document.createElement("p");
          help.textContent = tr("Available after all shares are paid.", "بتتوفر البطاقة بعد دفع كل الحصص.");
          host.append(help);
        }
        pass.textContent = tr("View boarding pass", "اعرض بطاقة الصعود");
        host.append(pass);
      }
      return;
    }
    if (group) {
      const index = Number(params.get("share")),
        bookings = P.read("roamly-market-requests", []).filter((b) => b.bookingGroupId === group),
        valid =
          bookings.length &&
          Number.isInteger(index) &&
          index >= 0 &&
          bookings.every((b) => b.payment?.mode === "split" && index < b.payment.shares.length);
      if (!valid) {
        host.textContent = tr("This payment share could not be found.", "تعذر العثور على حصة الدفع.");
        return;
      }
      const amount = bookings[0].packagePayment?.sharesCents?.[index] ??
          bookings.reduce((n, b) => n + Math.round(b.payment.shares[index] * 100), 0),
        already = bookings.every((b) => b.payment.paidShares?.includes(index)),
        deadline = bookings[0].packagePayment ? splitDeadline(bookings[0]) : NaN,
        expired = Date.now() >= deadline;
      host.innerHTML =
        "<h2>" +
        tr(
          "Traveler " + (index + 1) + " · group payment",
          "المسافر " + (index + 1) + " · الدفع الجماعي",
        ) +
        "</h2><p>" +
        tr("Your share: ", "حصتك: ") +
        format(amount) +
        '</p><p class="rx-notice">' +
        tr(
          "This link works in the same browser. No card will be charged.",
          "يعمل هذا الرابط في المتصفح نفسه. لن يُخصم أي مبلغ من البطاقة.",
        ) +
        '</p><button type="button" class="rx-button" id="pay-share" ' +
        (already || expired ? "disabled" : "") +
        ">" +
        tr(
          already ? "Share recorded" : "Record my share",
          already ? "تم تسجيل الحصة" : "سجّل حصتي",
        ) +
        '</button><p id="payment-status" role="status"></p>';
      if (Number.isFinite(deadline) && bookings.some((b) => b.payment.status !== "Paid (demo)")) {
        host.querySelector("#pay-share").before(splitNotice(bookings[0], already));
      }
      if (bookings[0].packagePayment && bookings[0].travelerEmail === P.email()) {
        const receipt = document.createElement("a");
        receipt.className = "rx-link";
        receipt.href = "payment.html?group=" + encodeURIComponent(group);
        receipt.textContent = tr("View receipt", "عرض الإيصال");
        host.append(receipt);
      }
      host.querySelector("button").onclick = () => {
        if (Date.now() >= deadline) {
          render();
          return;
        }
        const all = P.read("roamly-market-requests", []);
        all
          .filter((b) => b.bookingGroupId === group)
          .forEach((b) => {
            b.payment.paidShares = Array.from(new Set([...(b.payment.paidShares || []), index]));
            b.payment.status =
              b.payment.paidShares.length === b.payment.shares.length
                ? "Paid (demo)"
                : "Awaiting group payment (demo)";
          });
        try {
          P.write("roamly-market-requests", all);
          render();
          host.querySelector("#payment-status").textContent = tr(
            "Your share was recorded.",
            "تم تسجيل حصتك.",
          );
        } catch {
          host.querySelector("#payment-status").textContent = tr(
            "Unable to save the receipt. Try again.",
            "تعذر حفظ الإيصال. حاول مجدداً.",
          );
        }
      };
      return;
    }
    const key = params.get("plan") || sessionStorage.getItem("roamlySelectedSubscription"),
      plan = P.plans[key];
    if (!plan) {
      host.innerHTML =
        "<p>" +
        tr("Choose a subscription before checkout.", "اختر اشتراكاً قبل الدفع.") +
        '</p><a class="rx-button" href="pricing.html">' +
        tr("View plans", "عرض الخطط") +
        "</a>";
      return;
    }
    sessionStorage.setItem("roamlySelectedSubscription", key);
    if (!P.account()) {
      location.replace("sign-in.html?next=payment.html");
      return;
    }
    host.innerHTML =
      "<h2>" +
      plan.name +
      "</h2><p><strong>" +
      format(plan.amount, plan.currency) +
      "</strong> · " +
      tr(
        plan.credits ? "One additional plan" : "Access for " + plan.months + " month(s)",
        plan.credits ? "خطة إضافية واحدة" : "وصول لمدة " + plan.months + " شهر",
      ) +
      "</p><p>" +
      tr(
        "Your first AI plan is free. This purchase adds access without resetting your free-plan usage.",
        "أول خطة ذكية مجانية. تضيف هذه العملية وصولاً جديداً دون إعادة ضبط استخدام خطتك المجانية.",
      ) +
      '</p><div class="rx-notice">' +
      tr(
        "No payment or recurring charge will be made.",
        "لن تُخصم أي دفعة أو رسوم متكررة.",
      ) +
      '</div><label><input type="checkbox" id="acknowledge-payment" required> ' +
      tr("I understand this is a simulated payment.", "أفهم أن هذه محاكاة للدفع.") +
      '</label><br><button class="rx-button" id="confirm-subscription" type="button" ' +
      (paid ? "disabled" : "") +
      ">" +
      tr("Confirm selection", "تأكيد الاختيار") +
      '</button><p id="payment-status" role="status"></p>';
    host.querySelector("button").onclick = () => {
      if (paid) return;
      const check = host.querySelector("input");
      if (!check.checked) {
        check.reportValidity();
        return;
      }
      try {
        P.activatePlan(key, receiptId);
        paid = true;
        host.querySelector("button").disabled = true;
        showActivation();
      } catch (error) {
        host.querySelector("#payment-status").textContent = tr(
          "Payment access could not be saved. Please try again.",
          "تعذر حفظ صلاحية الوصول. يرجى المحاولة مجدداً.",
        );
      }
    };
    if (paid) showActivation();
  }
  render();
  document.addEventListener("roamly:languagechange", render);
  window.addEventListener("storage", (e) => {
    if (e.key === "roamly-market-requests") render();
  });
})();
