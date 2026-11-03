#!/usr/bin/env python3
"""Read-only external smoke test for the GK WhizWheel staging site.

No login, registrations, bookings, payments, mutations, or secrets.
Run from an external machine/CI to verify actual public HTTP responses.
"""
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit

BASE = os.getenv("STAGING_BASE_URL", "https://staging.whizwheels.in").rstrip("/")
assert urlsplit(BASE).scheme == "https", "Staging URL must use HTTPS"
CONTEXT = ssl.create_default_context()
failures = []
results = []


def get(path, accept="text/html"):
    request = urllib.request.Request(BASE + path, headers={
        "User-Agent": "GKWhizWheel-StagingReadOnlySmoke/1.0",
        "Accept": accept,
    }, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=18, context=CONTEXT) as response:
            return response.status, dict(response.headers), response.read(250000)
    except urllib.error.HTTPError as exc:
        return exc.code, dict(exc.headers), exc.read(250000)


def check(label, ok, details):
    results.append((label, ok, details))
    print(f"{'PASS' if ok else 'FAIL'} | {label} | {details}", flush=True)
    if not ok:
        failures.append(label)


for path in ["/", "/services", "/services/bikes", "/about", "/contact", "/login", "/admin/login", "/up"]:
    try:
        status, headers, body = get(path)
        text = body.decode("utf-8", "replace")
        html_expected = path != "/up"
        is_page = (not html_expected) or ('<html' in text.lower() and ('id="app"' in text or 'data-page=' in text))
        check("page " + path, status == 200 and is_page,
              f"HTTP {status}, html={is_page}, bytes={len(body)}")
        if path == "/":
            check("homepage JS / Vite", 'build/assets/' in text or '/build/' in text,
                  "asset reference present" if 'build/' in text else "asset reference missing")
    except Exception as exc:
        check("page " + path, False, type(exc).__name__ + ": " + str(exc)[:180])

for path in ["/api/v1/bikes", "/api/v1/stores", "/api/v1/bike-categories", "/api/v1/services"]:
    try:
        status, headers, body = get(path, "application/json")
        parsed = json.loads(body)
        data = parsed.get("data")
        valid = status == 200 and parsed.get("success") is True and isinstance(data, list)
        check("public API " + path, valid,
              f"HTTP {status}, records={len(data) if isinstance(data, list) else 'unknown'}")
        if path == "/api/v1/bikes" and isinstance(data, list) and data:
            bike = data[0]
            check("bike detail fields", all(k in bike for k in ("id", "brand", "model_name", "daily_rate")),
                  "id/brand/model_name/daily_rate are present")
    except Exception as exc:
        check("public API " + path, False, type(exc).__name__ + ": " + str(exc)[:180])

for path in ["/.env", "/composer.json", "/storage/logs/laravel.log", "/.git/config"]:
    try:
        status, headers, body = get(path, "text/plain")
        check("secret path shield " + path, status in (403, 404),
              f"HTTP {status} (expected 403 or 404)")
    except Exception as exc:
        check("secret path shield " + path, False, type(exc).__name__ + ": " + str(exc)[:180])

# Confirm unauthenticated customer/admin data isn't exposed to the public.
for path in ["/api/v1/auth/me", "/api/v1/admin/bookings", "/api/v1/customer/kyc-documents"]:
    try:
        status, headers, body = get(path, "application/json")
        check("unauthenticated API " + path, status in (401, 403),
              f"HTTP {status} (expected 401 or 403)")
    except Exception as exc:
        check("unauthenticated API " + path, False, type(exc).__name__ + ": " + str(exc)[:180])

print(f"SUMMARY: {len(results) - len(failures)} passed, {len(failures)} failed; all tests read-only.", flush=True)
sys.exit(1 if failures else 0)
