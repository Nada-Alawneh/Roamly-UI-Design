# Roamly UI/UX Design Project

This repository contains the official Figma design files and mockups for the **Roamly** project.

## 🔗 Figma Design Link
You can view and inspect all frames, pages, and wireframes directly on Figma through the link below:
https://www.figma.com/design/Z7ExjW5hY6ltOrtQiHCBza/Roamly?node-id=33-2&t=zNJnbNdl7TPAzwDL-1

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
| AI Planner 1 | `ai-planner.html` |
| AI Planner 2 | `ai-planner.html#plan` (or press **Re-Generate AI Plan**) |
| Book Trip | `ai-planner.html#checkout` (or **Book Trip ➔** on the plan) |
| Unlock Unlimited AI | `ai-planner.html#paywall` (or generate a second time) |
| Pay in Full | `trip.html` |
| Split Pill | `trip.html?payment=split` (or pick **Split Bill** in checkout) |
| Destinations | `destinations.html` |
| Packages&Deals | `deals.html` |
| Prices | `pricing.html` |
| Support | `support.html` |
| Sign In | `sign-in.html` |

## Files

```
css/base.css          design tokens (colours, shadows, radii), reset, buttons, fields, pills, cards
css/layout.css        header, footer, dark page-hero band, section headings
css/components.css    destination card, deal card, modal dialog, toggle switch, card grids
css/pages/*.css       one file per page
js/main.js            small behaviours, each tied to a data-attribute (see below)
assets/img/           images exported from Figma
```

The header and footer are repeated in every HTML file (plain static HTML has no includes).
If you change the nav, change it in all 8 files.

## Behaviour (`js/main.js`)

- Mobile menu toggle (below 1100px).
- Pop-ups use native `<dialog>`: open from buttons, close with ✕, Esc or a click outside, and open from the URL hash.
- AI planner: the first generate shows the plan (the free one), and the next one opens the paywall. The travellers count re-prices the plan at $620 per person, which matches the $1,240 and $3,100 totals in the frames.
- Checkout submits only the payment choice to `trip.html`. Card fields have no `name`, so they are never sent or put in a URL.
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
