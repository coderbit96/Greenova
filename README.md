# Greenova

A production-ready hotel website and room booking management system — marketing site,
live availability, payments, guest accounts and a full admin back office.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, MongoDB/Mongoose,
NextAuth v5, Razorpay and Cloudinary.

---

## Quick start

```bash
npm install
cp .env.example .env      # then edit — see Configuration below
npm run seed              # optional: 6 rooms, 2 demo accounts, sample bookings
npm run dev               # http://localhost:3000
```

You need a MongoDB instance. Either run one locally, or use a free
[Atlas](https://www.mongodb.com/atlas) cluster and paste the connection string
into `MONGODB_URI`.

**Demo accounts** (created by `npm run seed`):

| Role  | Email                | Password     |
| ----- | -------------------- | ------------ |
| Admin | `admin@greenova.com` | `Admin@1234` |
| Guest | `guest@greenova.com` | `Guest@1234` |

---

## Configuration

Only two variables are strictly required — `MONGODB_URI` and `AUTH_SECRET`.
Everything else degrades gracefully so you can run the whole app before signing
up for anything.

| Variable                       | Required | Behaviour when absent                                    |
| ------------------------------ | -------- | -------------------------------------------------------- |
| `MONGODB_URI`                  | **Yes**  | App cannot start                                          |
| `AUTH_SECRET`                  | **Yes**  | Sessions cannot be signed                                 |
| `AUTH_GOOGLE_ID` / `_SECRET`   | No       | Google button is hidden; email/password still works       |
| `RAZORPAY_KEY_ID` / `_SECRET`  | No       | **Mock gateway** — the booking flow completes end-to-end  |
| `CLOUDINARY_*`                 | No       | Uploads return a clear error; paste image URLs instead    |
| `RAZORPAY_WEBHOOK_SECRET`      | No       | Webhook endpoint returns 501                              |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Live credentials

This project reads all credentials from `.env`, which is gitignored and never
committed. `.env.example` documents the keys with blank values.

**Google OAuth** — the sign-in button only renders when both
`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. Google must also have the
callback registered under *Authorised redirect URIs*:

```
http://localhost:3000/api/auth/callback/google      # development
https://yourdomain.com/api/auth/callback/google     # production
```

A redirect URI that is not registered fails with `redirect_uri_mismatch`,
which is a Google console setting, not a code problem.

### Payments

With no Razorpay keys the app uses a built-in **mock gateway**: orders are created
with `mock_order_*` identifiers and the checkout resolves without opening the hosted
widget, so you can exercise booking → payment → confirmation offline. The mock
verifier accepts *only* mock-issued identifiers, so it cannot be used to forge a
real payment.

Add real keys and the same code path switches to live Razorpay, with HMAC-SHA256
signature verification compared in constant time. No code changes needed.

For production also set `RAZORPAY_WEBHOOK_SECRET` and point the Razorpay dashboard
at `/api/payments/webhook` — this is the safety net for guests who close the tab
mid-payment.

> **Live vs test keys.** A key beginning `rzp_live_` moves real money: every
> booking made against it charges a real card, including on a development
> machine. Use `rzp_test_` keys for development and keep live keys for the
> deployed environment. The automated suites detect which gateway is active and
> never attempt to complete a live payment — with live keys they assert that a
> forged signature is *rejected* instead.

---

## Commands

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Development server                                    |
| `npm run build`     | Production build                                      |
| `npm start`         | Serve the production build                            |
| `npm run check`     | typecheck + lint + build, in one go                   |
| `npm run typecheck` | `tsc --noEmit`                                        |
| `npm run lint`      | ESLint (Next 16 removed `next lint`)                  |
| `npm run seed`      | Reset and populate the database with demo data        |
| `npm run verify`    | Booking-engine tests against an in-memory MongoDB     |
| `npm run smoke`     | End-to-end API/auth/booking tests against a live server |
| `npm run browser`   | Console errors, responsive overflow and dark mode     |

`verify` needs no database and no configuration. `smoke` and `browser` expect a
running server:

```bash
npm run build && npm start   # in one terminal
npm run seed
npm run smoke  http://localhost:3000
npm run browser http://localhost:3000
```

`browser` drives your installed Chrome (or Edge) through puppeteer-core, so
nothing is downloaded. It skips itself if no browser is found.

---

## How it works

### Availability

Inventory is counted, not flagged. Each room has a `totalUnits` count, and
availability for a date range is `totalUnits` minus the number of overlapping
bookings.

Overlap uses **half-open intervals** — `[checkIn, checkOut)`. Two ranges collide
only when `aIn < bOut && aOut > bIn`, so a guest checking out on the 5th and
another checking in on the 5th do not conflict. Same-day turnover works correctly.

`pending`, `confirmed` and `completed` bookings all hold inventory; `cancelled`
ones release it immediately. A pending booking holding its unit is what stops two
guests paying for the last room at once.

All dates are normalised to UTC midnight before any night arithmetic, so stays do
not gain or lose a night across a DST boundary.

### Money

Every monetary value is stored and computed in **paise** (integer minor units).
Nothing is a float, so no rounding drift accumulates. Formatting to rupees happens
only at the point of display.

Prices are always recomputed server-side from the room record. The client sends
dates and a room id — never an amount — so a tampered request cannot change what
is charged.

### Brand and colour

Greenova is a premium, nature-inspired luxury brand: elegant, spacious, minimal.
The interface is deliberately **not** predominantly green — warm neutrals carry
the surfaces and green appears as an accent.

| Token         | Role                                                        |
| ------------- | ----------------------------------------------------------- |
| `sand-50/100/200` | Warm ivory, off-white and soft beige — page and card surfaces |
| `sand-900`    | Charcoal — body text                                         |
| `forest-*`    | Deep forest green — primary actions, logo, footer            |
| `emerald-*`   | Brighter green — positive/live states ("Available", success) |
| `brass-*`     | Champagne — eyebrow labels and the secondary button          |

Semantic tokens (`--bg`, `--fg`, `--border`, …) are defined in
`src/app/globals.css` and consumed as `bg-bg`, `text-fg-muted` and so on, so a
palette change is one edit rather than a find-and-replace.

**Contrast is verified, not assumed.** Every foreground/background pairing in the
system clears WCAG AA (4.5:1), on both light and dark surfaces:

| Pairing                        | Ratio    |
| ------------------------------ | -------- |
| charcoal on ivory              | 15.4:1   |
| muted text on ivory            | 5.9:1    |
| muted text on beige            | 5.3:1    |
| champagne label on ivory       | 5.7:1    |
| forest link on ivory           | 8.3:1    |
| white on the primary button    | 8.5:1    |
| charcoal on the champagne button | 6.7:1  |
| ivory text on dark             | 14.7:1   |
| muted on dark                  | 7.7:1    |

Dark mode is a **selected** palette rather than an inverted one: near-neutral
charcoal surfaces (`#121714`) with warm ivory text, so it does not read as a
green wash. The revenue chart's series colours (`#0e8f5f` light, `#25a973` dark)
were validated separately against each surface for colour-vision deficiency and
contrast.

### Authorization

Protection is layered, because in the App Router **layouts and pages render in
parallel** — a `redirect()` in a layout does not stop a sibling page from running
its data fetching and streaming markup. Relying on a layout guard alone leaks data.

1. `src/middleware.ts` blocks `/admin`, `/account` and `/booking` at the edge,
   before any page code executes.
2. Every protected page re-checks its own session before querying.
3. Every API route guards independently via `requireUser()` / `requireAdmin()`.

Booking endpoints additionally verify record ownership, so one signed-in user
cannot read, pay for or cancel another user's booking.

---

## Project layout

Business logic is separated from presentation. **No component touches the
database or the payment gateway** — components render, hooks orchestrate,
actions authorize, services do the work.

```
src/
├── app/                     routes only — pages compose components, API routes wrap services
│   ├── account/  admin/  booking/  rooms/  …
│   └── api/                 thin HTTP wrappers over services
├── components/              presentation only
│   ├── ui/                  Button, Input, Badge, Reveal, Spinner
│   ├── layout/              Navbar, Footer, Providers
│   ├── home/                Hero (GSAP parallax), marketing sections
│   ├── rooms/               RoomCard
│   ├── booking/             SearchWidget, BookingPanel, CheckoutForm
│   ├── account/             BookingList
│   ├── admin/               AdminRooms, AdminBookings, RevenueChart
│   ├── auth/                LoginForm, RegisterForm, GoogleButton, AuthShell
│   └── contact/             ContactForm
├── services/                ★ server-side business logic (marked `server-only`)
│   ├── room.service.ts      queries, paise conversion, safe delete
│   ├── booking.service.ts   create/cancel, ownership, admin listing
│   ├── availability.service.ts   the booking engine
│   ├── payment.service.ts   orders, verification, webhook application
│   ├── stats.service.ts     dashboard + guest-profile aggregations
│   └── user.service.ts      registration, credentials, OAuth upsert
├── actions/                 Server Actions — authorize, validate, revalidate
├── hooks/                   client orchestration (useCheckout, useAvailability, …)
├── validators/              Zod schemas by domain, shared by forms and APIs
├── types/                   serialized DTOs crossing the server/client boundary
├── utils/                   cn, dates, money, strings, serialize
├── lib/                     third-party adapters: auth, db, razorpay, cloudinary, guards
├── models/                  Mongoose schemas
└── middleware.ts            edge auth guard
```

### The layering rule

```
component  →  hook / action  →  service  →  model
 (render)      (orchestrate)     (logic)     (data)
```

- **Components** hold no `fetch`, no SQL/Mongo, no gateway calls. A form
  renders fields and calls one function.
- **Hooks** own client-side sequencing. `useCheckout` runs the whole
  booking → order → gateway → verify flow, so `CheckoutForm` just renders.
- **Actions** are the mutation entry point: authenticate, validate with Zod,
  call a service, `revalidatePath`. They return a typed
  `{ ok: true, data } | { ok: false, error }` instead of throwing at the UI.
- **Services** are the only place that touches Mongoose or Razorpay. Each is
  marked `server-only`, so importing one into a client component **fails the
  build** rather than leaking at runtime.
- Pages and API routes both call the *same* services, so a query is written
  once — `/rooms` and `GET /api/rooms` cannot drift apart.

Services return plain DTOs (`RoomDTO`, `PopulatedBookingDTO`) via a single
`serialize()` helper, rather than each page repeating
`JSON.parse(JSON.stringify(...))` on Mongoose documents.

## Pages

Everything under **Public** is browsable without an account — including
availability search. Signing in is only required to hold a reservation.

| Route | Access | What it is |
| ----- | ------ | ---------- |
| `/` | Public | Home |
| `/rooms` | Public | Rooms & suites |
| `/rooms/[slug]` | Public | Individual room, with live availability |
| `/availability` | Public | Dedicated date search |
| `/about` | Public | Our story |
| `/gallery` | Public | Photography |
| `/amenities` | Public | Experiences |
| `/dining` | Public | Restaurants and the kitchen |
| `/offers` | Public | Rates and packages |
| `/contact` | Public | Contact form |
| `/faq` | Public | Frequently asked questions |
| `/policies` | Public | House policies |
| `/privacy`, `/terms` | Public | Legal |
| `/login`, `/register` | Public | Authentication |
| `/forgot-password` | Public | Password reset request |
| `/account` | Guest | Profile and stay history |
| `/account/bookings` | Guest | All bookings |
| `/account/bookings/[bookingId]` | Owner | Booking detail, cancel and pay |
| `/checkout` | Guest | Guest details and payment |
| `/payment/status?booking=<id>` | Owner | Post-payment outcome |
| `/admin`, `/admin/rooms`, `/admin/bookings` | Admin | Back office |

Two earlier URLs moved and now `permanentRedirect` to their replacements, so
links already shared or emailed keep working:

```
/booking/checkout          →  /checkout
/booking/confirmation/[id] →  /payment/status?booking=[id]
```

`/booking/*` is deliberately excluded from the middleware matcher — gating a
redirect stub would bounce an old link to `/login` before it could forward, and
the destination guards itself anyway.

## API

| Method   | Route                         | Access   |
| -------- | ----------------------------- | -------- |
| `GET`    | `/api/rooms`                  | Public   |
| `GET`    | `/api/rooms/[slug]`           | Public   |
| `GET`    | `/api/availability`           | Public   |
| `POST`   | `/api/auth/register`          | Public   |
| `POST`   | `/api/contact`                | Public   |
| `GET`    | `/api/bookings`               | Guest    |
| `POST`   | `/api/bookings`               | Guest    |
| `GET`    | `/api/bookings/[id]`          | Owner    |
| `DELETE` | `/api/bookings/[id]`          | Owner    |
| `POST`   | `/api/payments/create-order`  | Owner    |
| `POST`   | `/api/payments/verify`        | Owner    |
| `POST`   | `/api/payments/webhook`       | Razorpay |
| `GET`    | `/api/admin/stats`            | Admin    |
| `GET`/`POST`  | `/api/admin/rooms`       | Admin    |
| `PATCH`/`DELETE` | `/api/admin/rooms/[id]` | Admin  |
| `GET`    | `/api/admin/bookings`         | Admin    |
| `PATCH`  | `/api/admin/bookings/[id]`    | Admin    |
| `POST`   | `/api/upload`                 | Admin    |

---

## Notes

- **Deleting a room** with upcoming bookings deactivates it instead, so live
  reservations are never orphaned.
- **Cancelling a paid booking** attempts a Razorpay refund first. If the refund
  call fails the booking is still cancelled and the failure logged, so a gateway
  outage cannot trap a guest in a reservation.
- **Payment verification is idempotent** — a repeated callback returns the already
  confirmed booking rather than double-processing.
- **Dark mode** follows the system preference, with a `data-theme` attribute
  available for an explicit override.
- **Reduced motion** is respected: the GSAP parallax and all reveal animations
  disable under `prefers-reduced-motion`.

## Deploying

Works on any Node host; Vercel needs no extra configuration. Set the environment
variables from `.env.example` in your host's dashboard, point `AUTH_URL` at your
real domain, and add `https://yourdomain.com/api/auth/callback/google` to the
Google OAuth authorised redirect URIs.
