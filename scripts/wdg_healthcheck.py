#!/usr/bin/env python3
# WDG healthcheck -> OA monitor.db goal_metrics
# - Checks WDG UI (login + key read-only APIs)
# - Checks Metabase (user/current + sample card queries)
# - Writes summarized metrics + breakdown into OA goal_metrics

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from statistics import quantiles

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None  # type: ignore


@dataclass
class CheckResult:
    name: str
    status: str  # pass|warn|fail
    detail: str = ""
    http: int | None = None
    latency_ms: int | None = None
    extra: dict | None = None


def now_shanghai() -> datetime:
    if ZoneInfo is None:
        return datetime.now()
    return datetime.now(ZoneInfo("Asia/Shanghai"))


def http_json(
    url: str,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body_json: dict | None = None,
    opener: urllib.request.OpenerDirector | None = None,
    timeout_s: int = 10,
) -> tuple[int, int, dict | list | str]:
    data = None
    h = {"Accept": "application/json"}
    if headers:
        h.update(headers)
    if body_json is not None:
        payload = json.dumps(body_json).encode("utf-8")
        h["Content-Type"] = "application/json"
        data = payload

    req = urllib.request.Request(url=url, method=method, headers=h, data=data)
    op = opener.open if opener else urllib.request.urlopen  # type: ignore

    t0 = time.time()
    try:
        with op(req, timeout=timeout_s) as resp:
            raw = resp.read()
            latency_ms = int((time.time() - t0) * 1000)
            code = getattr(resp, "status", None) or resp.getcode()
            ct = resp.headers.get("Content-Type", "")
            if "application/json" in ct:
                try:
                    return code, latency_ms, json.loads(raw.decode("utf-8"))
                except Exception:
                    return code, latency_ms, raw.decode("utf-8", errors="ignore")
            return code, latency_ms, raw.decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        latency_ms = int((time.time() - t0) * 1000)
        try:
            raw = e.read().decode("utf-8", errors="ignore")
        except Exception:
            raw = str(e)
        return int(e.code), latency_ms, raw
    except Exception as e:
        latency_ms = int((time.time() - t0) * 1000)
        return 0, latency_ms, str(e)


def load_creds(creds_path: str) -> tuple[str, str]:
    with open(creds_path, "r", encoding="utf-8") as f:
        d = json.load(f)
    u = str(d.get("username", "")).strip()
    p = str(d.get("password", ""))
    if not u or not p:
        raise ValueError(f"missing username/password in creds file: {creds_path}")
    return u, p


def ssh_cat(host: str, key_path: str, remote_path: str, timeout_s: int = 8) -> str:
    # Best-effort; caller decides how to handle failures.
    cmd = [
        "ssh",
        "-i",
        key_path,
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        f"ConnectTimeout={timeout_s}",
        f"root@{host}",
        f"cat {remote_path}",
    ]
    out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=timeout_s + 2)
    return out.decode("utf-8", errors="ignore").strip()


def percentile_95(values: list[int]) -> int | None:
    if not values:
        return None
    if len(values) == 1:
        return values[0]
    # quantiles gives cut points; n=20 -> 5% steps; take 95% => index 18
    qs = quantiles(values, n=20, method="inclusive")
    return int(qs[18])


def write_goal_metrics(
    oa_db: str,
    date_str: str,
    goal: str,
    metrics: list[tuple[str, float, str, dict | None]],
) -> None:
    os.makedirs(os.path.dirname(oa_db), exist_ok=True)
    db = sqlite3.connect(oa_db)
    db.execute("PRAGMA journal_mode=WAL")
    for name, value, unit, breakdown in metrics:
        breakdown_json = json.dumps(breakdown, ensure_ascii=False) if breakdown else None
        db.execute(
            """
            INSERT INTO goal_metrics (date, goal, metric, value, unit, breakdown)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, goal, metric) DO UPDATE SET
              value = excluded.value,
              unit = excluded.unit,
              breakdown = excluded.breakdown,
              created_at = datetime('now')
            """,
            (date_str, goal, name, float(value), unit, breakdown_json),
        )
    db.commit()
    db.close()


def main() -> int:
    ap = argparse.ArgumentParser()

    # Resolve repo root so this script keeps working even if you move the MC-Gen folder.
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    default_creds = os.path.join(repo_root, "oa-project", "data", "wdg_ui_credentials.json")
    default_oa_db = os.path.join(repo_root, "oa-project", "data", "monitor.db")

    ap.add_argument("--ui-base", default="http://112.124.18.246:3002", help="WDG UI base URL")
    ap.add_argument("--mb-base", default="http://112.124.18.246:8082", help="Metabase base URL")
    ap.add_argument("--vps-host", default="112.124.18.246", help="VPS host (for SSH reading metabase key)")
    ap.add_argument("--vps-ssh-key", default="/Users/ericmr/.ssh/wdg_vps_ed25519", help="SSH key path")
    ap.add_argument("--metabase-key-path", default="/root/.secrets/metabase_api_key", help="VPS metabase api key path")
    ap.add_argument("--creds", default=default_creds, help="UI login creds json")
    ap.add_argument("--oa-db", default=default_oa_db, help="OA SQLite db path")
    ap.add_argument("--write-oa", action="store_true", help="write results to OA db")
    ap.add_argument("--brand", default="bonjur", help="brand_code used for API smoke")
    ap.add_argument("--month", default="2026-03", help="month used for API smoke")
    ap.add_argument("--mb-dashboards", default="9,10,5,4", help="dashboards to sample, comma-separated")
    args = ap.parse_args()

    ts = now_shanghai()
    date_str = ts.strftime("%Y-%m-%d")

    checks: list[CheckResult] = []
    latencies: list[int] = []

    # UI checks (login + api)
    try:
        username, password = load_creds(args.creds)
    except Exception as e:
        checks.append(CheckResult("ui_creds", "fail", detail=str(e)))
        username = ""
        password = ""

    cj = urllib.request.HTTPCookieProcessor()
    opener = urllib.request.build_opener(cj)

    # root
    code, ms, _ = http_json(args.ui_base + "/", opener=opener)
    checks.append(CheckResult("ui_root", "pass" if code in (200, 301, 302, 307, 308) else "fail", http=code, latency_ms=ms))
    if ms:
        latencies.append(ms)

    # login
    if username and password:
        code, ms, body = http_json(
            args.ui_base + "/api/auth/login",
            method="POST",
            body_json={"username": username, "password": password},
            opener=opener,
        )
        ok = code == 200 and isinstance(body, dict) and body.get("success") is True
        checks.append(CheckResult("ui_login", "pass" if ok else "fail", http=code, latency_ms=ms, detail=("" if ok else str(body)[:200])))
        latencies.append(ms)

        code, ms, body = http_json(args.ui_base + "/api/auth/me", opener=opener)
        ok = code == 200 and isinstance(body, dict) and body.get("success") is True
        checks.append(CheckResult("ui_me", "pass" if ok else "fail", http=code, latency_ms=ms, detail=("" if ok else str(body)[:200])))
        latencies.append(ms)
    else:
        checks.append(CheckResult("ui_login", "fail", detail="missing creds"))

    # Read-only API smoke (requires login)
    api_urls = [
        ("api_pipeline", f"{args.ui_base}/api/pipeline"),
        ("api_rules", f"{args.ui_base}/api/rules?brand_code={urllib.parse.quote(args.brand)}"),
        ("api_match", f"{args.ui_base}/api/match?brand_code={urllib.parse.quote(args.brand)}&month={urllib.parse.quote(args.month)}"),
        ("api_coverage", f"{args.ui_base}/api/coverage?brand_code={urllib.parse.quote(args.brand)}&month={urllib.parse.quote(args.month)}"),
        ("api_coverage_by_file", f"{args.ui_base}/api/coverage/by-file?brand_code={urllib.parse.quote(args.brand)}&month={urllib.parse.quote(args.month)}"),
    ]
    for name, url in api_urls:
        code, ms, body = http_json(url, opener=opener)
        ok = code == 200 and isinstance(body, dict) and (body.get("success") is True)
        checks.append(CheckResult(name, "pass" if ok else "fail", http=code, latency_ms=ms, detail=("" if ok else str(body)[:200])))
        if ms:
            latencies.append(ms)

    # Metabase checks
    mb_key = None
    try:
        mb_key = ssh_cat(args.vps_host, args.vps_ssh_key, args.metabase_key_path)
        if not mb_key:
            raise ValueError("empty key")
        checks.append(CheckResult("mb_key", "pass"))
    except Exception as e:
        checks.append(CheckResult("mb_key", "fail", detail=str(e)))

    if mb_key:
        headers = {"X-API-KEY": mb_key}
        code, ms, _ = http_json(args.mb_base + "/api/user/current", headers=headers)
        checks.append(CheckResult("mb_user_current", "pass" if code == 200 else "fail", http=code, latency_ms=ms))
        latencies.append(ms)

        dash_ids = [s.strip() for s in str(args.mb_dashboards).split(",") if s.strip()]
        for did in dash_ids:
            # dashboard
            code, ms, d = http_json(args.mb_base + f"/api/dashboard/{did}", headers=headers)
            ok = code == 200 and isinstance(d, dict)
            checks.append(CheckResult(f"mb_dashboard_{did}", "pass" if ok else "fail", http=code, latency_ms=ms, detail=("" if ok else str(d)[:200])))
            latencies.append(ms)
            if not ok:
                continue

            dashcards = d.get("dashcards") or []
            card_ids: list[int] = []
            for dc in dashcards:
                c = (dc or {}).get("card") or {}
                cid = c.get("id")
                if isinstance(cid, int):
                    card_ids.append(cid)
            card_ids = card_ids[:2]

            for cid in card_ids:
                code, ms, body = http_json(
                    args.mb_base + f"/api/card/{cid}/query",
                    method="POST",
                    headers=headers,
                    body_json={},
                    timeout_s=15,
                )
                rows = None
                if isinstance(body, dict):
                    rows = body.get("data", {}).get("rows")
                ok = code in (200, 202) and isinstance(rows, list) and len(rows) > 0
                checks.append(
                    CheckResult(
                        f"mb_card_{cid}",
                        "pass" if ok else "fail",
                        http=code,
                        latency_ms=ms,
                        detail=("" if ok else (body.get("error", "") if isinstance(body, dict) else str(body)[:200])),
                        extra={"rows": (len(rows) if isinstance(rows, list) else None)},
                    )
                )
                latencies.append(ms)

    # Decide overall
    total = len(checks)
    passed = sum(1 for c in checks if c.status == "pass")
    failed = sum(1 for c in checks if c.status == "fail")

    success_rate = round(passed / total * 100.0, 1) if total else 0.0
    error_rate = round(failed / total * 100.0, 1) if total else 100.0
    p95 = percentile_95(latencies) or 0

    # Management standards (default)
    # - fail: any of these fail -> overall fail
    must_pass_prefixes = [
        "ui_login",
        "ui_me",
        "api_pipeline",
        "api_rules",
        "api_match",
        "mb_user_current",
    ]
    must_fail = [c for c in checks if c.name in must_pass_prefixes and c.status != "pass"]
    overall = "pass"
    if must_fail:
        overall = "fail"
    elif p95 >= 2500 or error_rate >= 10:
        overall = "warn"

    breakdown = {
        "ts": ts.isoformat(),
        "overall": overall,
        "summary": {"total": total, "passed": passed, "failed": failed, "success_rate": success_rate, "error_rate": error_rate, "p95_latency_ms": p95},
        "checks": [
            {
                "name": c.name,
                "status": c.status,
                "http": c.http,
                "latency_ms": c.latency_ms,
                "detail": c.detail,
                **({"extra": c.extra} if c.extra else {}),
            }
            for c in checks
        ],
    }

    if args.write_oa:
        metrics = [
            ("success_rate", success_rate, "%", breakdown),
            ("error_rate", error_rate, "%", breakdown),
            ("p95_latency_ms", float(p95), "ms", breakdown),
        ]
        write_goal_metrics(args.oa_db, date_str, "wdg_health", metrics)

    # exit code: only hard fail should mark cron run as failed
    if overall == "fail":
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
