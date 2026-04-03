#!/bin/bash
# wdg_healthcheck_wrapper.sh
# LaunchAgent entry point — runs wdg_healthcheck.py with --write-oa

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/artifacts"

mkdir -p "$LOG_DIR"

LOG="$LOG_DIR/wdg_healthcheck-$(date '+%Y-%m-%d').log"
STDERR="$LOG_DIR/wdg_healthcheck-$(date '+%Y-%m-%d')-stderr.log"

exec python3 "$SCRIPT_DIR/wdg_healthcheck.py" \
  --write-oa \
  >> "$LOG" 2>> "$STDERR"
