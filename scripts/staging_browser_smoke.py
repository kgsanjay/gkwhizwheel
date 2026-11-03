#!/usr/bin/env python3
"""Read-only desktop/mobile Playwright checks against live staging.

No form submissions, authentication, booking holds or payments.
"""
import json
import os
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = os.getenv("STAGING_BASE_URL", "https://staging.whizwheels.in").rstrip("/")
ARTIFACTS = Path("artifacts/staging-browser")
ARTIFACTS.mkdir(parents=True, exist_ok=True)
issues = []
warnings = []


def fail(check, detail):
    issues.append(f"{check}: {detail}")
    print(f"FAIL | {check} | {detail}", flush=True)


def pass_(check, detail):
    print(f"PASS | {check} | {detail}", flush=True)


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    for device, viewport in [
        ("desktop", {"width": 1440, "height": 900}),
        ("mobile", {"width": 390, "height": 844}),
    ]:
        page = browser.new_page(viewport=viewport, device_scale_factor=1)
        crashes = []
        page.on("pageerror", lambda error: crashes.append(str(error)[:240]))
        for slug, route in [
            ("home", "/"),
            ("services", "/services"),
            ("bikes", "/services/bikes"),
            ("contact", "/contact"),
        ]:
            label = f"{device} {slug}"
            try:
                response = page.goto(BASE + route, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(2500)
                status = response.status if response else -1
                if status != 200:
                    fail(label + " HTTP", f"status={status}")
                else:
                    pass_(label + " HTTP", f"status={status}")
                heading = page.locator("h1").first
                h1 = (heading.inner_text(timeout=2500) if heading.count() else "")[:100]
                if not h1:
                    fail(label + " primary heading", "no visible H1 element")
                else:
                    pass_(label + " primary heading", h1)
                dimensions = page.evaluate("""() => ({
                    viewport: window.innerWidth,
                    scroll: document.documentElement.scrollWidth,
                    body: document.body.scrollWidth,
                    images: [...document.images].filter(x => x.getBoundingClientRect().top < innerHeight * 1.4 && x.getBoundingClientRect().bottom > -100)
                        .map(x => ({alt: x.alt, loaded: x.complete && x.naturalWidth > 0})).slice(0, 25),
                })""")
                overflow = max(dimensions["scroll"], dimensions["body"]) - dimensions["viewport"]
                if overflow > 4:
                    fail(label + " responsive width", f"horizontal overflow {overflow}px")
                else:
                    pass_(label + " responsive width", "no horizontal overflow")
                broken = [i["alt"] for i in dimensions["images"] if not i["loaded"]]
                if broken:
                    warnings.append(f"{label} unloaded visible images: {broken[:6]}")
                    print(f"WARN | {label} visible images | {len(broken)} not loaded: {broken[:6]}", flush=True)
                else:
                    pass_(label + " visible images", "all inspected images loaded")
                if crashes:
                    fail(label + " runtime errors", "; ".join(crashes[:3]))
                else:
                    pass_(label + " runtime errors", "none")
                page.screenshot(path=str(ARTIFACTS / f"{device}-{slug}.png"), full_page=True, animations="disabled")
            except Exception as exc:
                fail(label + " browser visit", f"{type(exc).__name__}: {str(exc)[:230]}")
            finally:
                crashes.clear()
        page.close()
    browser.close()

print(f"SUMMARY: {len(issues)} browser failure(s), {len(warnings)} warning(s).", flush=True)
(ARTIFACTS / "report.json").write_text(json.dumps({"failures": issues, "warnings": warnings}, indent=2))
raise SystemExit(1 if issues else 0)
