/**
 * End-to-end smoke tests against a running server.
 *
 *   1. npm run build && npm start   (or npm run dev)
 *   2. npm run seed
 *   3. node scripts/smoke.mjs [baseUrl]
 *
 * Covers authentication, authorization, the booking/payment flow and
 * cross-user access control. Complements `npm run verify`, which tests the
 * booking engine directly against an in-memory database.
 */

const BASE = process.argv[2] ?? "http://localhost:3100";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, got, want) {
  const ok = String(got) === String(want);
  if (ok) {
    pass++;
  } else {
    fail++;
    failures.push(`${name} — got ${got}, want ${want}`);
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` (got ${got}, want ${want})`}`);
}

function section(t) {
  console.log(`\n  ── ${t} ──`);
}

/** A cookie jar per simulated browser. */
function newClient() {
  const jar = new Map();
  return async function req(path, opts = {}) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    const res = await fetch(BASE + path, {
      ...opts,
      headers: { ...(opts.headers || {}), cookie },
      redirect: "manual",
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
    return res;
  };
}

async function signIn(req, email, password) {
  const { csrfToken } = await (await req("/api/auth/csrf")).json();
  await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email, password }),
  });
  return (await req("/api/auth/session")).json();
}

const day = (o) => {
  const n = new Date();
  const u = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  return new Date(u + o * 86_400_000).toISOString().slice(0, 10);
};

async function main() {
  console.log(`\n  Smoke testing ${BASE}\n`);

  // ── Public routes ───────────────────────────────────────────
  section("Public pages");
  const anon = newClient();
  for (const p of ["/", "/rooms", "/amenities", "/about", "/contact", "/login", "/register"]) {
    check(`GET ${p}`, (await anon(p)).status, 200);
  }

  section("Public APIs");
  check("GET /api/rooms", (await anon("/api/rooms")).status, 200);
  const { rooms } = await (await anon("/api/rooms")).json();
  check("rooms are seeded", rooms.length > 0, "true");

  // ── Unauthenticated access is refused ───────────────────────
  section("Unauthenticated access refused");
  for (const p of ["/admin", "/admin/rooms", "/account", "/account/bookings"]) {
    check(`${p} redirects`, (await anon(p)).status, 307);
  }
  for (const p of ["/api/bookings", "/api/admin/stats", "/api/admin/rooms"]) {
    check(`${p} is 401`, (await anon(p)).status, 401);
  }

  // No protected page may leak data in its body.
  const adminBody = await (await anon("/admin")).text();
  check(
    "/admin body leaks nothing",
    /GRN-[A-Z0-9]{6}/.test(adminBody) || adminBody.includes("@greenova.com"),
    "false",
  );

  // ── Admin ───────────────────────────────────────────────────
  section("Admin sign-in and access");
  const admin = newClient();
  const adminSession = await signIn(admin, "admin@greenova.com", "Admin@1234");
  check("admin role on session", adminSession?.user?.role, "admin");
  check("GET /admin", (await admin("/admin")).status, 200);
  check("GET /api/admin/stats", (await admin("/api/admin/stats")).status, 200);
  check("GET /api/admin/bookings", (await admin("/api/admin/bookings")).status, 200);

  section("Bad credentials rejected");
  const bad = newClient();
  const badSession = await signIn(bad, "admin@greenova.com", "WrongPassword1");
  check("no session for wrong password", badSession?.user ? "session" : "none", "none");

  // ── Customer ────────────────────────────────────────────────
  section("Customer cannot reach admin");
  const guest = newClient();
  const guestSession = await signIn(guest, "guest@greenova.com", "Guest@1234");
  check("customer role", guestSession?.user?.role, "customer");
  check("/admin redirects for customer", (await guest("/admin")).status, 307);
  check("admin API is 403 for customer", (await guest("/api/admin/stats")).status, 403);
  check("own bookings reachable", (await guest("/account/bookings")).status, 200);

  // ── Booking flow ────────────────────────────────────────────
  section("Booking and payment");
  const pavilion = rooms.find((r) => r.slug === "spring-pavilion");
  const off = 200 + Math.floor(Math.random() * 400);
  const [IN, OUT] = [day(off), day(off + 3)];

  const created = await guest("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: pavilion._id,
      checkIn: IN,
      checkOut: OUT,
      adults: 2,
      children: 0,
      guestName: "Smoke Test",
      guestEmail: "guest@greenova.com",
      guestPhone: "+919845011223",
    }),
  });
  check("booking created", created.status, 201);
  const { booking } = await created.json();

  // 3 nights at the rate actually charged (a discount wins over list price),
  // plus tax on the room charge AND any one-off fees, at the room's own rate.
  const nightly =
    pavilion.discountedPrice && pavilion.discountedPrice < pavilion.pricePerNight
      ? pavilion.discountedPrice
      : pavilion.pricePerNight;
  const expectedRoom = nightly * 3;
  const feesTotal = (pavilion.additionalFees ?? []).reduce((sum, f) => sum + f.amount, 0);
  const taxRate = (pavilion.taxRatePercent ?? 12) / 100;

  check("server-side room total", booking.roomTotal, expectedRoom);
  check(
    "server-side tax (room + fees)",
    booking.taxes,
    Math.round((expectedRoom + feesTotal) * taxRate),
  );
  check("starts pending", booking.status, "pending");

  const orderRes = await guest("/api/payments/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingId: booking._id }),
  });
  check("order created", orderRes.status, 200);
  const order = await orderRes.json();
  check("order amount matches booking", order.amount, booking.totalAmount);

  // With live Razorpay keys a payment cannot be completed from a test: real
  // HMAC verification rejects any signature we could synthesise, and actually
  // paying would charge a real card. Assert the correct behaviour per mode.
  const liveGateway = order.provider === "razorpay";

  const verified = await guest("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingId: booking._id,
      razorpay_order_id: order.orderId,
      razorpay_payment_id: "mock_pay_smoke01",
      razorpay_signature: "mock_signature",
    }),
  });

  if (liveGateway) {
    check("live gateway rejects a forged signature", verified.status, 400);
    const afterFail = await (await guest(`/api/bookings/${booking._id}`)).json();
    check("booking stays unconfirmed", afterFail.booking.status, "pending");
    check("payment marked failed", afterFail.booking.payment.status, "failed");
  } else {
    check("payment verified", verified.status, 200);
    const { booking: confirmed } = await verified.json();
    check("booking confirmed", confirmed.status, "confirmed");
    check("payment marked paid", confirmed.payment.status, "paid");
  }

  section("Inventory and validation");
  const avail = await (
    await guest(`/api/availability?roomId=${pavilion._id}&checkIn=${IN}&checkOut=${OUT}&adults=2`)
  ).json();
  // Pending bookings hold inventory too, so this holds in both modes.
  check("single-unit room now sold out", avail.available, false);

  const dbl = await guest("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: pavilion._id, checkIn: IN, checkOut: OUT, adults: 2, children: 0,
      guestName: "Smoke Test", guestEmail: "a@b.com", guestPhone: "+911111111111",
    }),
  });
  check("double booking rejected", dbl.status, 409);

  const cases = [
    ["past dates", { checkIn: day(-5), checkOut: day(-2), adults: 2 }],
    ["reversed dates", { checkIn: day(60), checkOut: day(58), adults: 2 }],
    ["over capacity", { checkIn: day(70), checkOut: day(72), adults: 12 }],
  ];
  for (const [label, patch] of cases) {
    const res = await guest("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: pavilion._id, children: 0,
        guestName: "Smoke Test", guestEmail: "a@b.com", guestPhone: "+911111111111",
        ...patch,
      }),
    });
    check(`${label} rejected`, res.status, 400);
  }

  section("Forged payments rejected");
  const garden = rooms.find((r) => r.slug === "garden-room");
  const b2 = await (
    await guest("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: garden._id, checkIn: day(off + 20), checkOut: day(off + 22),
        adults: 2, children: 0,
        guestName: "Smoke Test", guestEmail: "a@b.com", guestPhone: "+911111111111",
      }),
    })
  ).json();
  const o2 = await (
    await guest("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: b2.booking._id }),
    })
  ).json();

  check(
    "forged payment id rejected",
    (await guest("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: b2.booking._id, razorpay_order_id: o2.orderId,
        razorpay_payment_id: "not_a_mock_id", razorpay_signature: "bad",
      }),
    })).status,
    400,
  );
  check(
    "mismatched order rejected",
    (await guest("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: b2.booking._id, razorpay_order_id: "mock_order_elsewhere",
        razorpay_payment_id: "mock_pay_x", razorpay_signature: "mock_signature",
      }),
    })).status,
    400,
  );

  // ── Cross-user access ───────────────────────────────────────
  section("Cross-user access (IDOR)");
  const attacker = newClient();
  const email = `smoke${Date.now()}@example.com`;
  check(
    "attacker can register",
    (await attacker("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smoke Attacker", email,
        password: "Attack@123", confirmPassword: "Attack@123",
      }),
    })).status,
    201,
  );
  await signIn(attacker, email, "Attack@123");

  const victim = booking._id;
  check("cannot read another booking", (await attacker(`/api/bookings/${victim}`)).status, 403);
  check(
    "cannot cancel another booking",
    (await attacker(`/api/bookings/${victim}`, { method: "DELETE" })).status,
    403,
  );
  check(
    "cannot pay for another booking",
    (await attacker("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: victim }),
    })).status,
    403,
  );
  // Target the live routes: /booking/* is now only a redirect stub, so asserting
  // against it would pass trivially without testing cross-user access at all.
  const statusBody = await (await attacker(`/payment/status?booking=${victim}`)).text();
  check("payment status leaks nothing", statusBody.includes(booking.reference), "false");
  const detailBody = await (await attacker(`/account/bookings/${victim}`)).text();
  check("booking detail leaks nothing", detailBody.includes(booking.reference), "false");
  const own = await (await attacker("/api/bookings")).json();
  check("attacker sees no bookings", own.bookings.length, 0);

  // ── Cancellation ────────────────────────────────────────────
  section("Cancellation and refund");
  const cancelled = await guest(`/api/bookings/${booking._id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "smoke test" }),
  });
  check("cancel succeeds", cancelled.status, 200);
  const { booking: done } = await cancelled.json();
  check("status cancelled", done.status, "cancelled");
  check(
    "payment settled correctly",
    done.payment.status,
    liveGateway ? "failed" : "refunded",
  );

  const after = await (
    await guest(`/api/availability?roomId=${pavilion._id}&checkIn=${IN}&checkOut=${OUT}&adults=2`)
  ).json();
  check("inventory released", after.available, true);

  console.log(`\n  ─────────────────────────────`);
  console.log(`   ${pass} passed, ${fail} failed`);
  console.log(`  ─────────────────────────────\n`);
  if (failures.length) {
    console.log("  Failures:");
    for (const f of failures) console.log(`   - ${f}`);
    console.log("");
  }
  process.exit(fail ? 1 : 0);
}

main().catch((err) => {
  console.error("\n  Smoke run crashed:", err.message);
  console.error("  Is the server running at " + BASE + "?\n");
  process.exit(1);
});
