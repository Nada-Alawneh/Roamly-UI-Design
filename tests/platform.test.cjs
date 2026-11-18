const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const makeStore = () => {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
};
const localStorage = makeStore();
const sessionStorage = makeStore();
const context = vm.createContext({ window: {}, localStorage, sessionStorage, Date });
vm.runInContext(fs.readFileSync(path.join(root, "shared/js/platform.js"), "utf8"), context);
const P = context.window.RoamlyPlatform;
const email = "test-traveler@example.test";
assert.equal(P.generationAccess(), "signin");
sessionStorage.setItem("roamlySignedInEmail", email);
assert.equal(P.generationAccess(), "signin", "A session email must correspond to an account");
P.write("roamlyLocalAccounts", [{ id: "test", email, role: "traveler" }]);
assert.equal(P.generationAccess(), "free");
assert.equal(P.consumeGeneration(), true);
assert.equal(P.consumeGeneration(), false, "A second free generation must be blocked");
assert.equal(P.generationAccess(), "upgrade");
P.activatePlan("solo", "credit-demo");
P.activatePlan("solo", "credit-demo");
assert.equal(P.entitlement().credits, 1, "A receipt can only grant access once");
assert.equal(P.generationAccess(), "credit");
assert.equal(P.consumeGeneration(), true);
assert.equal(P.generationAccess(), "upgrade");
P.activatePlan("pro", "monthly-demo");
assert.equal(P.generationAccess(), "subscription");
assert.equal(P.consumeGeneration(), true);
assert.equal(
  P.generationAccess(),
  "subscription",
  "An active subscription retains generation access",
);
const sample = {
  id: "booking-test",
  supplierId: "test-supplier",
  travelerEmail: email,
  travelers: 2,
  serviceSnapshot: { price: 55, category: "hiking" },
  status: "Pending",
};
assert.equal(P.finances(sample).grossCents, 11000);
assert.equal(P.finances(sample).commissionCents, 1650);
assert.equal(P.finances(sample).netCents, 9350);
assert.equal(P.finances({ ...sample, agreedPrice: 77.77 }).commissionCents, 1167);
P.write("roamly-market-requests", [
  sample,
  { ...sample, id: "other-owner", supplierId: "another" },
]);
assert.equal(P.ledger("test-supplier").length, 1);
assert.equal(P.ledger("test-supplier")[0].settled, false);
assert.equal(P.paySupplierBooking(sample.id), false, "A pending request must not take payment");
P.write("roamly-market-requests", [
  { ...sample, status: "Confirmed", agreedPrice: 110, travelerConfirmedAt: "2026-11-09T12:00:00Z" },
]);
assert.equal(P.paySupplierBooking(sample.id), true);
assert.equal(P.ledger("test-supplier")[0].settled, true);
assert.equal(P.ledger("test-supplier")[0].payment.status, "Paid (demo)");
console.log(
  "Passed account, one-free-plan, paid entitlement, supplier scope, and commission checks.",
);
