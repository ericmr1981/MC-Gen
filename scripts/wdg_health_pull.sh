#!/bin/bash
#===========================================================
# WDG Health Pull Script
# 本机 cron 每天凌晨 4 点调用
# SSH 到 VPS，拉取 health log，POST 到本机 API
#===========================================================
set -euo pipefail

VPS_HOST="112.124.18.246"
VPS_PORT="22"
VPS_KEY="$HOME/.ssh/wdg_vps_ed25519"
VPS_SQLITE="/root/wdg_health/wdg_health.db"
LOCAL_API="http://localhost:7878/api/wdg-health-put"
API_TOKEN="${WDG_HEALTH_API_TOKEN:-wdg_health_secret_2026}"
LOG="/tmp/wdg-health-pull.log"

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S')] $*" | tee -a "$LOG"; }

# 1. 从 VPS 拉原始数据（TSV）
RAW=$(ssh -i "$VPS_KEY" -p "$VPS_PORT" -o ConnectTimeout=15 -o StrictHostKeyChecking=no \
  "root@$VPS_HOST" \
  "sqlite3 $VPS_SQLITE \"SELECT node,ts,metric,value,unit FROM health_log ORDER BY id DESC LIMIT 20;\"" \
  2>&1) || { log "ERROR: SSH failed: $RAW"; exit 1; }

if [ -z "$RAW" ]; then log "WARN: no data"; exit 0; fi

# 2. 找出最近一次 timestamp（默认 list 模式用 | 分隔）
LAST_TS=$(echo "$RAW" | tail -1 | awk -F'|' '{print $2}')
log "Latest ts=$LAST_TS"

# 3. 过滤出该 ts 的所有 metric，构建 JSON
PAYLOAD=$(echo "$RAW" | awk -F'|' -v ts="$LAST_TS" '$2 == ts' \
  | python3 -c "
import sys,json
rows = [l.strip().split('|') for l in sys.stdin if l.strip()]
if not rows: sys.exit(0)
node, ts = rows[0][0], rows[0][1]
checks = [{'metric':r[2],'value':float(r[3]),'unit':r[4]} for r in rows]
print(json.dumps({'node':node,'timestamp':ts,'checks':checks}))
" 2>&1) || { log "ERROR: JSON build failed"; exit 1; }

log "Payload: $PAYLOAD"

# 4. POST 到本机 API
RESP=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$LOCAL_API" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>&1) || { log "ERROR: curl failed: $RESP"; exit 1; }

HTTP_CODE=$(echo "$RESP" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESP" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" = "200" ]; then
  log "OK: $BODY"
else
  log "ERROR HTTP $HTTP_CODE: $BODY"
fi
