# Sprint Post-Task Report — Sprint 1 (Complete)

> **Sprint**: sprint-1  
> **Completed by**: main session (Polo_Engineer)  
> **Completed**: 2026-04-02T02:06 UTC  
> **Mode**: manual execution (harness complexity analysis showed <2 files, no subagent needed)

---

## §1 Sprint Goal

**Original**: SSH reverse tunnel + Iframe embedding for Nexus + OA Dashboard

**Sub-goals**:
1. Create `scripts/ssh-tunnel.sh` — Mac SSH reverse tunnel script
2. Configure VPS nginx `/nexus/` and `/oa/` routes
3. End-to-end verification

---

## §2 What Was Done

### Tunnel Setup
- Existing SSH tunnel confirmed active: `VPS:7078 → Mac:7878 (Nexus)`, `VPS:7346 → Mac:3460 (OA)`
- Created `scripts/ssh-tunnel.sh` with VPS port check and `managed-external` state support

### VPS Nginx Fix
- **Fixed `nexus-openclaw` config**: `proxy_pass http://127.0.0.1:7878` → `http://127.0.0.1:7078`
  (was pointing to wrong port; 7078 is the SSH reverse tunnel listener)
- **Added `/nexus/` and `/oa/` locations** to `app-home-portal` nginx config:
  - `/nexus/` → `http://127.0.0.1:8088/` (nexus-openclaw upstream)
  - `/oa/` → `http://127.0.0.1:7346/` (OA reverse tunnel)

### Verification Results
| Route | Status | Response |
|-------|--------|----------|
| `http://112.124.18.246/nexus/` | ✅ 200 | Nexus sessions page |
| `http://112.124.18.246/oa/` | ✅ 200 | OA Dashboard |
| `http://112.124.18.246/nexus-remote.html` | ✅ 200 | Nexus iframe page |
| `http://112.124.18.246/oa-remote.html` | ✅ 200 | OA iframe page |

---

## §3 Remaining Work (Out of Scope for Sprint-1)

- **Cron scheduling** for WDG healthcheck: configured separately as project 009
- **Home Portal apps.json** entries already existed (`nexus-sessions`, `oa-dashboard`)

---

## §4 Lessons Learned

- VPS nginx `nexus-openclaw` was proxying to `localhost:7878` instead of `localhost:7078` (the SSH tunnel port)
- SSH reverse tunnel on Mac was already running (pid 98770) — tunnel startup race condition handled by `managed-external` flag
- `set -e` in tunnel script caused premature exit on `ExitOnForwardFailure=yes` — removed

**Status: ✅ Sprint-1 ACCEPTED**
