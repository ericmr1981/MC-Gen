#!/bin/bash
cd /Users/ericmr/Documents/GitHub/MC-Gen
node /usr/local/lib/node_modules/openclaw/skills/dev-project-harness-loop/scripts/harness.js \
  --mode llm \
  --complexity 5 \
  "MC-Gen: 修复 OA dashboard 总是挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）"
