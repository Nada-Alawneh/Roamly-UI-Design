# Roamly frontend integration

The original homepage main markup and light palette are preserved. The original AI Planner, Live Plan, weather backup, activity edits, quote, Save Plan, Sync Calendar, and PDF controls remain in place. Shared scripts are the only additions to the homepage source.

## Try the traveler-to-supplier workflow

Serve the workspace over HTTP on localhost. In `user/ai-planner.html`, open travel preferences, choose Istanbul or Bali and a future date, then complete the vibe, companions, budget, interests, pace and activity questions. Generating while signed out takes you to sign-in and restores the questionnaire after login. The sign-in screen includes a local demo traveler.

Each account receives one free generation. The next attempt opens the pricing selection. Solo Explorer grants one additional generation; the monthly and annual plans grant access for their respective durations. Confirm a demo payment and continue directly to the saved questionnaire. Reopening a saved itinerary or using the rain-mode button does not consume a generation.

Published Adventure & Nature services that match the destination, party size, selected provider/activity and experience budget appear on their itinerary days. Select experiences and use **Book Entire Plan & Pay**. Checkout records a demo payment and creates one request per service, routed by the owning supplier ID. Split checkout records the organizer's share and provides receipt links for the rest of the party. The receipt is also available from the planner booking updates. Supplier confirmation and full demo payment both need to be present before earnings are recognized.

Use **View demo supplier inbox** from a receipt confirmation to see the booking in Supplier Studio. For example, a confirmed and fully paid $110 booking produces $16.50 in admin commission and $93.50 in supplier net earnings. The same figures appear in the supplier and admin ledgers. Existing agreed-price supplier checkout uses the same accounting rules.

Calendar Sync downloads an `.ics` file for Google, Apple or Outlook Calendar. PDF opens the browser print dialog with a print layout; choose **Save as PDF**. The weather widget keeps the original indoor/rain alternatives.

## Jordan and language

`user/jordan-narrative.html` has chapters about Petra, Wadi Rum and Jordanian hospitality, with **Book Experience & Pay** buttons for published local offers. The tourism menu on inner pages links to the Jordanian Narrative and Global AI Planner. The gallery and community remain available without injecting content into the homepage.

`shared/js/i18n.js` applies the shared English/Arabic choice, RTL direction, translation keys, placeholders, titles and accessibility labels. `shared/js/translations-ar.js` contains translations for the original pages and generated UI. The language switch preserves form values and does not change booking or service identifiers.

## Demo boundary

The concierge uses local itinerary templates and supplier matching. Authentication, subscriptions, booking receipts and earnings are browser-local demo records. No card details are collected by the demo checkout, no money is charged, and no supplier messages are transmitted outside the app. A real backend and payment provider are needed for production accounts, inventory, payment collection and settlement.

## Checks

Run these with Node.js:

- `node tests/platform.test.cjs` — account gating, the one-free-plan limit, paid credits, scoped supplier records, and cent-exact commission.
- `node tests/concierge.test.cjs` — catalog seeding, destination matching, booking days, pricing, and split rounding.
- `node tests/localization.test.cjs` — static content and accessible attribute coverage across all 27 pages.

Browser checks exercised guest sign-in and state recovery, paid upgrade and resume, the original Live Plan and weather controls, calendar download, saved-plan reopening, split payment and supplier acceptance, the admin/supplier commission split, the Jordan checkout, and Arabic mobile rendering. The homepage main markup was compared byte-for-byte against the original.
