"use client";

import Link from "next/link";

/** Root-layout failures need their own document and cannot depend on app CSS. */
export default function GlobalError() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f8f7f2",
          color: "#183a2e",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: 520, textAlign: "center" }}>
          <p style={{ letterSpacing: "0.18em", fontSize: 12, textTransform: "uppercase" }}>Greenova</p>
          <h1 style={{ fontSize: "clamp(2rem, 7vw, 3rem)", fontWeight: 400 }}>We could not open this page</h1>
          <p style={{ color: "#53655d", lineHeight: 1.6 }}>
            Please refresh the page or return to the Greenova home page. Check My Bookings before trying a payment again.
          </p>
          <Link
            href="/"
            style={{ display: "inline-block", marginTop: 20, padding: "12px 20px", borderRadius: 999, background: "#1d5641", color: "white", textDecoration: "none" }}
          >
            Return home
          </Link>
        </main>
      </body>
    </html>
  );
}
