/**
 * Browser checks against a running server: real console errors, failed
 * network requests, and horizontal overflow at mobile/tablet/desktop widths.
 *
 *   node scripts/browser-check.mjs [baseUrl]
 *
 * Uses the system Chrome via puppeteer-core (no bundled browser download).
 */

import puppeteer from "puppeteer-core";
import fs from "fs";

const BASE = process.argv[2] ?? "http://localhost:3100";

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error("  No Chrome/Edge found. Skipping browser checks.");
  process.exit(0);
}

const VIEWPORTS = [
  { name: "mobile-s", width: 320, height: 720 },
  { name: "mobile-m", width: 375, height: 812 },
  { name: "mobile-l", width: 430, height: 932 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 800 },
  { name: "desktop-l", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
];

const PAGES = [
  "/",
  "/rooms",
  "/rooms/canopy-suite",
  "/availability",
  "/amenities",
  "/dining",
  "/gallery",
  "/offers",
  "/about",
  "/contact",
  "/faq",
  "/policies",
  "/login",
  "/register",
  "/forgot-password",
];

// Noise that does not indicate a defect in the app.
const IGNORE = [
  /favicon/i,
  /Download the React DevTools/i,
  /^net::ERR_INTERNET_DISCONNECTED/i,
  // Next.js cancels in-flight RSC prefetches when a page unmounts.
  /[?&]_rsc=/,
  /net::ERR_ABORTED/,
];

let problems = 0;

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

console.log(`\n  Browser checks against ${BASE}\n`);

// ── Console + network errors (desktop pass) ───────────────────
console.log("  ── Console & network errors ──");
for (const path of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text()))) {
      errors.push(`console: ${m.text().slice(0, 120)}`);
    }
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`));
  page.on("requestfailed", (r) => {
    const reason = r.failure()?.errorText ?? "";
    if (!IGNORE.some((x) => x.test(r.url()) || x.test(reason))) {
      errors.push(`request failed: ${r.url().slice(0, 90)} (${reason})`);
    }
  });

  try {
    const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Let animations settle so late errors surface.
    await new Promise((r) => setTimeout(r, 600));
    const status = res?.status() ?? 0;
    if (status >= 400) errors.push(`HTTP ${status}`);
  } catch (err) {
    errors.push(`navigation: ${err.message.slice(0, 100)}`);
  }

  if (errors.length) {
    problems += errors.length;
    console.log(`  FAIL  ${path}`);
    for (const e of [...new Set(errors)]) console.log(`          ${e}`);
  } else {
    console.log(`  PASS  ${path}`);
  }
  await page.close();
}

// ── Horizontal overflow across viewports ──────────────────────
console.log("\n  ── Horizontal overflow ──");
for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height });
  const bad = [];

  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 250));
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        if (scrollWidth <= docWidth + 1) return null;

        // Identify the widest offending element to make the report actionable.
        let worst = null;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > docWidth + 1) {
            if (!worst || r.right > worst.right) {
              worst = {
                right: Math.round(r.right),
                tag: el.tagName.toLowerCase(),
                cls: (el.className?.toString?.() ?? "").slice(0, 60),
              };
            }
          }
        }
        return { docWidth, scrollWidth, worst };
      });

      if (overflow) {
        bad.push(
          `${path}: scroll ${overflow.scrollWidth} > view ${overflow.docWidth}` +
            (overflow.worst ? ` — <${overflow.worst.tag} class="${overflow.worst.cls}">` : ""),
        );
      }
    } catch (err) {
      bad.push(`${path}: ${err.message.slice(0, 80)}`);
    }
  }

  if (bad.length) {
    problems += bad.length;
    console.log(`  FAIL  ${vp.name} (${vp.width}px)`);
    for (const b of bad) console.log(`          ${b}`);
  } else {
    console.log(`  PASS  ${vp.name} (${vp.width}px) — no overflow on ${PAGES.length} pages`);
  }
  await page.close();
}

// ── Reachability, labels and touch targets ─────────────────────
console.log("\n  ── Accessibility & touch targets ──");
for (const vp of VIEWPORTS.filter((item) => item.width <= 430)) {
  const page = await browser.newPage();
  await page.setViewport({ width: vp.width, height: vp.height });
  const bad = [];

  for (const path of PAGES) {
    try {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
      const issues = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
        };
        const controls = [...document.querySelectorAll("button, input:not([type=hidden]), select, textarea")]
          .filter((element) => element.getAttribute("aria-hidden") !== "true")
          .filter(visible);
        const tiny = controls
          .filter((element) => {
            // Inputs in this interface are often wrapped by their <label>;
            // check the whole labelled control, not just the text field.
            const target = element.closest("label") || element;
            const rect = target.getBoundingClientRect();
            return rect.width < 40 || rect.height < 40;
          })
          .slice(0, 3)
          .map((element) => element.tagName.toLowerCase() + "#" + (element.id || element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 24) || "unlabelled"));
        const unlabeled = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")]
          .filter((element) => element.getAttribute("aria-hidden") !== "true")
          .filter(visible)
          .filter((element) => {
            const input = element;
            return !input.labels?.length && !input.getAttribute("aria-label") && !input.getAttribute("aria-labelledby");
          })
          .slice(0, 3)
          .map((element) => element.tagName.toLowerCase() + "#" + (element.id || element.getAttribute("name") || "unknown"));
        const missingAlt = [...document.images]
          .filter((image) => !image.hasAttribute("alt"))
          .slice(0, 3)
          .map((image) => image.currentSrc || image.src);
        const clipped = [...document.querySelectorAll("button, a, input, select, textarea")]
          .filter(visible)
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.right > document.documentElement.clientWidth + 1;
          })
          .slice(0, 3)
          .map((element) => element.tagName.toLowerCase() + "#" + (element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 24) || "unknown"));
        return { tiny, unlabeled, missingAlt, clipped };
      });

      for (const [kind, values] of Object.entries(issues)) {
        if (values.length) bad.push(path + ": " + kind + " — " + values.join(", "));
      }
    } catch (err) {
      bad.push(path + ": " + err.message.slice(0, 80));
    }
  }

  if (bad.length) {
    problems += bad.length;
    console.log("  FAIL  " + vp.name + " (" + vp.width + "px)");
    for (const issue of bad) console.log("          " + issue);
  } else {
    console.log("  PASS  " + vp.name + " (" + vp.width + "px) — controls are reachable and labelled");
  }
  await page.close();
}

// ── Mobile navigation drawer ──────────────────────────────────
console.log("\n  ── Mobile navigation ──");
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('button[aria-label="Open menu"]', { visible: true, timeout: 10000 });
  // The button is server-rendered before React attaches its event handler.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const opener = await page.$('button[aria-label="Open menu"]');
  if (!opener) {
    problems++;
    console.log("  FAIL  menu button not found at 390px");
  } else {
    await opener.click();
    await page.waitForSelector('aside[role="dialog"]', { visible: true, timeout: 10000 });
    const closeVisible = await page.$('aside[role="dialog"] button[aria-label="Close menu"]');
    const locked = await page.evaluate(() => document.body.style.overflow === "hidden");
    console.log(`  ${closeVisible ? "PASS" : "FAIL"}  drawer opens`);
    console.log(`  ${locked ? "PASS" : "FAIL"}  body scroll locked while open`);
    if (!closeVisible || !locked) problems++;

    if (closeVisible) {
      // The drawer is still completing its spring transform, so use the
      // verified control's native action rather than a coordinate click.
      await closeVisible.evaluate((button) => button.click());
      await page.waitForSelector('aside[role="dialog"]', { hidden: true, timeout: 10000 });
      const unlocked = await page.evaluate(() => document.body.style.overflow !== "hidden");
      console.log(`  ${unlocked ? "PASS" : "FAIL"}  scroll restored on close`);
      if (!unlocked) problems++;
    }
  }
  await page.close();
}

// ── Dark mode ─────────────────────────────────────────────────
console.log("\n  ── Dark mode ──");
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.goto(BASE + "/rooms", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 400));

  const { bg, fg } = await page.evaluate(() => {
    const s = getComputedStyle(document.body);
    return { bg: s.backgroundColor, fg: s.color };
  });

  // Parse "rgb(r, g, b)" and compare relative luminance.
  const lum = (c) => {
    const [r, g, b] = c.match(/\d+/g).slice(0, 3).map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const darkBg = lum(bg) < 60;
  const lightFg = lum(fg) > 150;
  console.log(`  ${darkBg ? "PASS" : "FAIL"}  dark background applied (${bg})`);
  console.log(`  ${lightFg ? "PASS" : "FAIL"}  light foreground applied (${fg})`);
  if (!darkBg || !lightFg) problems++;
  await page.close();
}

await browser.close();

console.log(`\n  ─────────────────────────────`);
console.log(`   ${problems === 0 ? "All browser checks passed" : `${problems} problem(s) found`}`);
console.log(`  ─────────────────────────────\n`);
process.exit(problems ? 1 : 0);
