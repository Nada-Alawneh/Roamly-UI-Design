# Roamly UI/UX Design Project

This repository contains the official Figma design files and mockups for the **Roamly** project.

## 🔗 Figma Design Link
You can view and inspect all frames, pages, and wireframes directly on Figma through the link below:
https://www.figma.com/design/SPmNCMZXE5LSw4xbJCtIuu/Roamly-%E2%80%94-Mockups---Wireframes?node-id=0-1&p=f&t=dBXfyrrcMIVbCRc4-0
##  Project Pages Included:
- User Mockup
- User WireFrame
- Admin Mockup
- Admin Wireframe





# Roamly — HTML/CSS build of the Figma file

Static site built from the Figma file **Roamly → page "User MockUp"** (12 frames, desktop width 1528px).
Open `index.html` in a browser. Nothing to install or build.

## Figma frame → file

| Figma frame | Open |
|---|---|
| Home Page | `index.html` |
| AI Planner 1 | `user/ai-planner.html` |
| AI Planner 2 | `user/ai-planner.html#plan` (or press **Re-Generate AI Plan**) |
| Book Trip | `user/ai-planner.html#checkout` (or **Book Trip ➔** on the plan) |
| Unlock Unlimited AI | `user/ai-planner.html#paywall` (or generate a second time) |
| Pay in Full | `user/trip.html` |
| Split Pill | `user/trip.html?payment=split` (or pick **Split Bill** in checkout) |
| Destinations | `user/destinations.html` |
| Packages&Deals | `user/deals.html` |
| Prices | `user/pricing.html` |
| Support | `user/Contact-Us.html` |
| Sign In | `user/sign-in.html` |

## Files

- `user/` contains the traveler and public pages, their page-specific CSS and scripts, and the planner fixtures.
- `adminDashboard/` contains the admin pages and scripts.
- `supplierDashboard/` contains the supplier dashboard, profile, team and booking tools.
- `shared/` contains the shared styles, platform and language scripts, and assets.
- `tests/` contains project-wide checks.

## Behaviour (`shared/js/main.js`)

- Mobile menu toggle (below 1100px).
- Pop-ups use native `<dialog>`: open from buttons, close with ✕, Esc or a click outside, and open from the URL hash.
- AI planner: the first generate shows the plan (the free one), and the next one opens the paywall. The travellers count re-prices the plan at $620 per person, which matches the $1,240 and $3,100 totals in the frames.
- Checkout submits only the payment choice to `user/trip.html`. Card fields have no `name`, so they are never sent or put in a URL.
- Destinations: region chips and search filter the cards.
- Deals: the flash-sale countdown ticks down.
- Support: the chat box echoes your message with a canned reply (front-end demo only), and the FAQ uses `<details>`.
Fonts: Inter (Google Fonts). Icons: Font Awesome 6 Free (jsDelivr).

## Where this differs from the Figma file

- The file had two header versions. This build uses the newer one (passport logo + "Roamly.") on every page.
- Added hover states, a highlighted current page in the nav and chevrons on dropdowns. The frames have no interaction states.
- Fixed the "$620.00 per person per person" typo on the Split Bill option.
- Support chat: the dark left panel fills the full height. In Figma it stops short and leaves a white strip.
- The checkout pop-up shows the whole form. In Figma it is cut off at the Confirm button.
- The FAQ answers are placeholder text I wrote. The frame only has the questions.
- Layout is responsive down to phone width. The frames are desktop only.
- The checkout fields hold the sample values from the design (Nada Alawneh, 4532 •••• 8921, …).

## Before going live

The images are the PNGs exactly as Figma exported them (about 6.5 MB in total). Converting the photos to WebP or JPEG would cut that by roughly 80%.

## Planner sample data

Open the Global AI Planner and select **Load sample trip**. The seed adds one
fictional Istanbul supplier and examples for all 18 Adventure & Nature services.
It fills the route, two travelers, a future date, and a USD 200 experience budget
per traveler. Re-running it preserves records with existing IDs.

- Compare all activities or select a single activity to see its matching offer.
- Set the group to one traveler to include the solo-only example.
- Raise the per-traveler experience budget to USD 350 to include the premium example.
- Change the destination to Bali to see the alternate destination fixture. An
  unpublished example stays out of results.
- Select offers and dates, build the itinerary, and record one simulated payment
  to create an actual demo receipt and the related pending supplier requests.
  Itinerary generation follows the regular sign-in and plan-access rules.

The fixture file is `user/data/planner-seed.js`. It does not create login credentials,
payment history, or confirmed reservations. Data lives in the current browser.
