(function () {
  "use strict";
  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(fallback) && !Array.isArray(value) ? fallback : (value ?? fallback);
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const email = () =>
    String(
      sessionStorage.getItem("roamlySignedInEmail") || localStorage.getItem("roamlySignedInEmail") || "",
    )
      .trim()
      .toLowerCase();
  const account = () => read("roamlyLocalAccounts", []).find((a) => a.email?.toLowerCase() === email());
  function entitlement(user = email()) {
    return read("roamlyEntitlement:" + user, { credits: 0, expiresAt: null, plan: null });
  }
  function generationAccess(user = email()) {
    if (!user || !account()) return "signin";
    if (localStorage.getItem("roamlyFreePlanUsed:" + user) !== "1") return "free";
    const paid = entitlement(user);
    if (paid.expiresAt && Date.parse(paid.expiresAt) > Date.now()) return "subscription";
    if (paid.credits > 0) return "credit";
    return "upgrade";
  }
  function consumeGeneration() {
    const user = email(),
      access = generationAccess(user);
    if (access === "signin" || access === "upgrade") return false;
    if (access === "free") localStorage.setItem("roamlyFreePlanUsed:" + user, "1");
    if (access === "credit") {
      const value = entitlement(user);
      value.credits--;
      write("roamlyEntitlement:" + user, value);
    }
    return true;
  }
  const plans = {
    solo: { name: "Solo Explorer", amount: 299, currency: "USD", credits: 1 },
    pro: { name: "Pro Unlimited", amount: 499, currency: "JOD", months: 1 },
    family: { name: "Family Annual", amount: 3999, currency: "USD", months: 12 },
  };
  function activatePlan(id, receiptId) {
    const plan = plans[id],
      user = email();
    if (!plan || !account()) throw new Error("Sign in to activate a plan.");
    const receipts = read("roamlySubscriptionReceipts", []);
    if (receipts.some((r) => r.id === receiptId)) return;
    const current = entitlement(user);
    let expiresAt = current.expiresAt;
    if (plan.months) {
      const base = new Date(Math.max(Date.now(), Date.parse(current.expiresAt) || 0));
      const originalDay = base.getUTCDate();
      base.setUTCDate(1);
      base.setUTCMonth(base.getUTCMonth() + plan.months);
      const lastDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
      base.setUTCDate(Math.min(originalDay, lastDay));
      expiresAt = base.toISOString();
    }
    write("roamlyEntitlement:" + user, {
      credits: (current.credits || 0) + (plan.credits || 0),
      expiresAt,
      plan: id,
      updatedAt: new Date().toISOString(),
    });
    receipts.push({
      id: receiptId,
      email: user,
      plan: id,
      amountCents: plan.amount,
      currency: plan.currency,
      status: "Paid (demo)",
      createdAt: new Date().toISOString(),
    });
    write("roamlySubscriptionReceipts", receipts);
  }
  function finances(booking) {
    if (booking.financials) return booking.financials;
    const service =
      booking.serviceSnapshot ||
      read("roamly-market-services", []).find((s) => s.id === booking.serviceId) ||
      {};
    const quantity = service.category === "transport" ? 1 : Math.max(1, Number(booking.travelers) || 1);
    const grossCents = Math.round(
      (Number(booking.agreedPrice) ||
        Number(booking.payment?.estimatedTotal) ||
        Number(service.price) * quantity ||
        0) * 100,
    );
    const commissionCents = Math.round((grossCents * 15) / 100);
    return {
      grossCents,
      commissionCents,
      netCents: grossCents - commissionCents,
      commissionRate: 0.15,
      currency: "USD",
    };
  }
  function ledger(owner) {
    return read("roamly-market-requests", [])
      .filter(
        (b) =>
          !b.tripOnly && (!owner || b.supplierId === owner) &&
          b.status !== "Inquiry" &&
          !["Cancelled", "Rejected", "Refunded"].includes(b.status),
      )
      .map((b) => ({
        ...b,
        financials: finances(b),
        settled: ["Confirmed", "Completed"].includes(b.status) && b.payment?.status === "Paid (demo)",
      }));
  }
  function paySupplierBooking(id) {
    const all = read("roamly-market-requests", []),
      owner = email() || sessionStorage.getItem("roamlyMarketplaceGuestEmail") || "";
    const booking = all.find(
      (r) =>
        r.id === id && r.travelerEmail === owner && r.travelerConfirmedAt && r.status === "Confirmed",
    );
    if (!booking || booking.packagePayment) return false;
    if (booking.payment?.status === "Paid (demo)") return true;
    if (booking.payment?.mode === "split") return false;
    const amount = Number(booking.agreedPrice);
    if (!Number.isFinite(amount) || amount <= 0) return false;
    booking.payment = {
      mode: "full",
      status: "Paid (demo)",
      estimatedTotal: amount,
      currency: "USD",
      shares: [amount],
      paidShares: [0],
      receiptId: "demo-" + id,
    };
    booking.financials = finances({ ...booking, financials: null });
    write("roamly-market-requests", all);
    return true;
  }
  window.RoamlyPlatform = {
    read,
    write,
    email,
    account,
    entitlement,
    generationAccess,
    consumeGeneration,
    plans,
    activatePlan,
    finances,
    ledger,
    paySupplierBooking,
  };
})();
