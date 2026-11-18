const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../shared/js/roamly-features.js"), "utf8");
function boot(initial = {}) {
  const values = new Map(Object.entries(initial));
  const store = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener() {},
  };
  const context = vm.createContext({
    document,
    localStorage: store,
    sessionStorage: store,
    window: { RoamlyI18n: { t: (key) => key, apply() {}, language: "en" }, addEventListener() {} },
    location: { pathname: "/test", search: "" },
    URLSearchParams,
    Intl,
    Date,
    Set,
    Map,
    console,
    crypto: { randomUUID: () => "test-id" },
  });
  vm.runInContext(
    source.replace(
      /\}\)\(\);\s*$/,
      "globalThis.testApi = { matches, matchesPlannerDestination, cost, services, splitShares, serviceDate };})();",
    ),
    context,
  );
  return { api: context.testApi, values, context };
}
const first = boot();
assert.equal(first.api.services().length, 5, "Demo catalog is available on a fresh browser");
assert.equal(JSON.parse(first.values.get("roamlyLocalAccounts"))[0].role, "supplier");
const second = boot(Object.fromEntries(first.values));
assert.equal(second.api.services().length, 5, "Reload must not duplicate seeded services");
const custom = {
  id: "custom",
  supplierId: "owner",
  title: "Private tour",
  meetingPoint: "Petra, Jordan",
  price: 70,
  published: true,
};
const populated = boot({ "roamly-market-services": JSON.stringify([custom]) });
assert.ok(
  populated.api.services().some((s) => s.id === "custom"),
  "Existing supplier services are preserved",
);
assert.ok(populated.api.matches(custom, "الأردن"), "Arabic destination resolves to Jordan");
assert.ok(
  populated.api.matches(custom, "Jordan"),
  "Meeting point participates in destination matching",
);
const istanbul = first.api.services().find((s) => s.destination === "Istanbul");
assert.ok(
  first.api.matches(istanbul, "Istanbul, Turkey"),
  "Existing destination links with country suffix match",
);
assert.equal(
  first.api.matches(istanbul, "Bali"),
  false,
  "Unrelated services must not enter a plan",
);
const plannerMatch = first.api.matchesPlannerDestination;
assert.equal(plannerMatch(istanbul, "إسطنبول، تركيا"), true);
assert.equal(plannerMatch(istanbul, "Turkey"), true);
assert.equal(plannerMatch({ serviceArea: "Paris, United States" }, "Paris, France"), false);
assert.equal(plannerMatch({ serviceArea: "New York, United States" }, "York"), false);
assert.equal(plannerMatch({ title: "Paris walk" }, "Paris"), false);
assert.equal(plannerMatch({ meetingPoint: "Sultanahmet Square, Istanbul" }, "Istanbul"), true);
assert.equal(plannerMatch({ serviceArea: "Bali, Indonesia", meetingPoint: "Istanbul" }, "Istanbul"), false);
assert.equal(first.api.cost({ price: 40, category: "hiking" }, 3), 120);
assert.equal(
  first.api.cost({ price: 40, category: "transport" }, 3),
  40,
  "Vehicle prices are not multiplied by passenger count",
);
assert.equal(
  first.api.serviceDate({ days: 3, serviceIds: ["a", "b", "c"] }, "b", "2026-12-31"),
  "2027-01-01",
  "Day scheduling crosses month and year boundaries",
);
assert.equal(
  first.api.serviceDate({ days: 3, serviceIds: ["a", "b"] }, "b", ""),
  "",
  "Copied plans require a new date",
);
const hidden = boot({
  "roamly-concierge-seeded": "true",
  "roamly-market-services": JSON.stringify([
    { ...custom, published: false },
    { ...custom, id: "free", price: 0 },
  ]),
});
assert.equal(hidden.api.services().length, 0, "Draft and unpriced services cannot be booked");
// Equal-share allocations remain exact in cents, including indivisible totals.
for (let people = 2; people <= 20; people++) {
  let offset = 0;
  const totals = Array(people).fill(0);
  for (const cents of [6501, 4800, 3502]) {
    const shares = first.api
      .splitShares(cents, people, offset)
      .map((amount) => Math.round(amount * 100));
    assert.equal(
      shares.reduce((a, b) => a + b, 0),
      cents,
    );
    shares.forEach((amount, i) => (totals[i] += amount));
    offset = (offset + (cents % people)) % people;
  }
  assert.ok(Math.max(...totals) - Math.min(...totals) <= 1);
}
console.log(
  "Passed concierge catalog, ownership, matching, publication, pricing, and cent allocation checks.",
);
