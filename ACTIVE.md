# ACTIVE.md — Current WIP

> This file lives inside the project repo. The workspace root WORKSPACE.md is only an index.

## Current Project
- **Name**: workspace
- **Repo**: /Users/ericmr/Documents/GitHub/MC-Gen
- **Task**: MC-Gen: 修复 OA dashboard 总是挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）
- **Mode**: llm
- **Started**: 2026-04-06T05:19:47.923Z
- **Status**: running
- **Sprints**: sprint-1

## Sprint Plan
- **sprint-1**: engineering-senior-developer | deps: none | attachments: full
## Matrix Flags
- [COMPLEXITY_MED] complexity=5 — consider multi-sprint
## Continue Gate (v5 preview)
- **Final Oracle**: Live acceptance for "MC-Gen: 修复 OA dashboard 经常挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）" plus local oracle: cd client && npm run build && node tests/verify-phase1.js && bash scripts/run_change_guard.sh
- **Local Oracle**: cd client && npm run build && node tests/verify-phase1.js && bash scripts/run_change_guard.sh
- **Current Blocker**: Not yet verified against final oracle. Replace with concrete blocker after the first failed live check.
- **Round Outcome**: retry_with_new_bet
- **Stop Allowed**: no
- **Next Forced Bet**: Execute one bounded bet, then run cd client && npm run build && node tests/verify-phase1.js && bash scripts/run_change_guard.sh; if final oracle still fails, record evidence delta and launch the next repair step.
- **Evidence Delta**: new-branch
- **No-Evidence Rounds**: 0
- **Last Evidence**: none yet
- **Evidence Artifact**: none
- **Result Status**: pending
- **Pivot Trigger**: 2 no-evidence rounds on same branch


## Master Brief
/Users/ericmr/Documents/GitHub/MC-Gen/harness/assignments/master-brief-1775452787923.md

## Version
harness.js v5-preview | per-project ACTIVE.md | workspace index | ContextAssembler

---
*Last updated: 2026-04-06T05:19:47.923Z*
