# Context Package
> Built by ContextAssembler | 2026-04-06T05-19-46 | task: MC-Gen: 修复 OA dashboard 总是挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）

## 📋 Git State
- **Branch**: `main`
- **Status**: ⚠️ dirty
```
M .harness-master.json
 M .harness-spawn-sprint-1.json
 M ACTIVE.md
 M WORKSPACE.md
 M client/vite.config.ts
 M harness/artifacts/continue-gate/sprint-1.json
 M harness/contracts/sprint-1.md
 M harness/reports/sprint-sprint-1-report.md
 M scripts/dev-backend.js
 M scripts/ensure-dev-ports.js
 M scripts/nexusctl.sh
 M scripts/wdg_healthcheck.py
 M server/index.js
?? harness/assignments/master-brief-1775404387947.md
?? harness/context/context-package-2026-04-05T15-53-06.md
?? harness/harness_run.sh
?? scripts/__pycache__/
```

## 📜 Recent Commits (last 5)
```
  4711c2d chore: converge to MC-Gen (port 7979 + tunnel + archive legacy)
  0449002 mc-gen: fix /nexus deploy (basename + api base)
  19f9717 chore: add workspace harness + WDG healthcheck scripts
  2b48463 feat: add WDG Health monitoring page
  df6bf0a Revert "feat(oa): add WDG Health goal tracking"
```

## 🔍 Uncommitted Changes
```
.harness-master.json                          | 117 +++++++++++++----
 .harness-spawn-sprint-1.json                  |  41 +++---
 ACTIVE.md                                     |  39 ++++--
 WORKSPACE.md                                  |   2 +-
 client/vite.config.ts                         |   8 +-
 harness/artifacts/continue-gate/sprint-1.json |  14 +-
 harness/contracts/sprint-1.md                 |  19 ++-
 harness/reports/sprint-sprint-1-report.md     | 133 +++++++++++++------
 scripts/dev-backend.js                        |  12 +-
 scripts/ensure-dev-ports.js                   |  12 +-
 scripts/nexusctl.sh                           |   2 +-
 scripts/wdg_healthcheck.py                    |  10 +-
 server/index.js                               | 177 +++++++++++++++++++-------
 13 files changed, 412 insertions(+), 174 deletions(-)
```

## 📄 Latest Sprint Contract
**File**: `sprint-1.md`

# Sprint Contract — sprint-1

## 任务
MC-Gen: 修复 OA dashboard 经常挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）

## 项目
workspace | /Users/ericmr/Documents/GitHub/MC-Gen

## Agent
engineering-senior-developer

## Matrix Flags
- **[COMPLEXITY_MED]** complexity=5 — consider multi-sprint
## Continue Gate (v5 preview)
- **Final Oracle**: Live acceptance for "MC-Gen: 修复 OA dashboard 经常挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）" plus local oracle: cd client && npm run build && node tests/verify-phase1.js && bash scripts/run_change_guard.sh
- **Current Blocker**: Not yet verified against final oracle. Replace with concrete blocker after the first failed live check.
- **Round Outcome**: retry_with_new_bet
- **Stop Allowed**: no
- **Next Forced Bet**: Execute

## ▶️  ACTIVE.md
# ACTIVE.md — Current WIP

> This file lives inside the project repo. The workspace root WORKSPACE.md is only an index.

## Current Project
- **Name**: workspace
- **Repo**: /Users/ericmr/Documents/GitHub/MC-Gen
- **Task**: MC-Gen: 修复 OA dashboard 经常挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）
- **Mode**: llm
- **Started**: 2026-04-05T15:53:07.948Z
- **Status**: running
- **Sprints**: sprint-1

## Sprint Plan
- **sprint-1**: engineering-senior-developer | deps: none | attac

## 📂 Relevant Source Files (task keywords matched)

### `tests/debug-getAgentId.js`
```
import path from 'path';

// 从 OpenClaw parser 复制函数逻辑
function getAgentId(filePath) {
  if (!filePath) return null;
  const parts = String(filePath).split(path.sep);
  const idx = parts.lastIndexOf('agents');
  if (idx >= 0 && idx + 1 < parts.length) {
    const agentId = parts[idx + 1];
    return agentId || null;
  }
  return null;
}

// 测试用例
const testPaths = [
  '/Users/ericmr/.openclaw/agents/jarvis/sessions/399557ec-0d7b-4cc4-8113-a9cb15ecccf1.jsonl',
  '/Users/ericmr/.openclaw/agents/main/sessions/00c50fcc-4681-4a36-aa8e-368442f484d6.jsonl',
  '/Users/ericmr/.openclaw/agents/social-media-assistant/sessions/abc123.jsonl',
  null,
  '/invalid/path.jsonl'
];

console.log('Testing getAgentId function:');
console.log('');

testPaths.forEach((testPath) => {
  const result = getAgentId(tes
```

### `tests/e2e/openclaw-agentid-final.spec.ts`
```
import { test, expect } from '@playwright/test';

test.describe('OpenClaw Agent ID Display', () => {
  test('verify agentId in DOM and React state', async ({ page }) => {
    // Enable console logging
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('FRONTEND DEBUG') || text.includes('agentId')) {
        console.log('[Browser]', text);
      }
    });

    await page.goto('http://localhost:7878');

    // Wait longer for initial load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(8000);

    console.log('\n=== Checking Console Messages ===');
    const debugMessages = consoleMessages.filter(msg =>
      msg.includes('FRONTEND DEBUG') || msg.inclu
```

### `tests/e2e/frontend-agent-id-debug.spec.ts`
```
import { test, expect } from '@playwright/test';

test('Verify frontend receives and stores agentId', async ({ page }) => {
  // Enable console logging
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
    console.log('[Browser Console]', msg.text());
  });

  // Navigate to the dashboard
  await page.goto('http://localhost:7878');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Check for debug messages
  const debugMessages = consoleMessages.filter(msg =>
    msg.includes('FRONTEND DEBUG') || msg.includes('OpenClaw session')
  );

  console.log('\n=== Console Debug Messages ===');
  debugMessages.forEach(msg => console.log(msg));

  // Get all session cards
  const 
```

### `tests/e2e/websocket-agentid.spec.ts`
```
import { test, expect } from '@playwright/test';

test('Direct WebSocket Test for agentId', async ({ page }) => {
  // Navigate to page
  await page.goto('http://localhost:7878');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Get session data directly from the page
  const sessionData = await page.evaluate(async () => {
    // Try to access React component state by finding session data in DOM
    const cards = document.querySelectorAll('.session-card, .dense-card');

    // Also try to get from any global window object if available
    const windowData = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1);

    return {
      cardCount: cards.length,
      hasReactDevTools: !!windowData,
      // Try to extract data attributes if any
 
```

### `tests/e2e/verify-agent-id.spec.ts`
```
import { test, expect } from '@playwright/test';

test('Verify agent ID is displayed for OpenClaw sessions', async ({ page }) => {
  // Navigate to the dashboard
  await page.goto('http://localhost:7878');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Get all session cards
  const sessionCards = page.locator('.session-card, .dense-card');
  const cardCount = await sessionCards.count();

  console.log(`Found ${cardCount} session cards`);

  for (let i = 0; i < cardCount; i++) {
    const card = sessionCards.nth(i);

    // Get session name
    const nameElement = card.locator('.session-name, .dense-card-name');
    const name = await nameElement.count() > 0 ? await nameElement.textContent() : 'N/A';

    // Get tool
    co
```

### `tests/e2e/pages/NexusDashboardPage.ts`
```
import { Page } from '@playwright/test';

/**
 * Page Object Model for Nexus Dashboard
 * Represents the main application page where agent sessions are displayed
 */
export class NexusDashboardPage {
  readonly page: Page;
  readonly sessionCards;
  readonly connectionStatus;
  readonly viewModeToggle;
  readonly toolEventsToggle;

  constructor(page: Page) {
    this.page = page;
    this.sessionCards = page.locator('.session-card, .dense-card');
    this.connectionStatus = page.locator('[data-testid="connection-status"], .connection-status');
    this.viewModeToggle = page.locator('[data-testid="view-mode-toggle"], button:has-text("View")');
    this.toolEventsToggle = page.locator('[data-testid="tool-events-toggle"], input[type="checkbox"]');
  }

  /**
   * Navigate to the Nexus dashbo
```

### `tests/e2e/agentid-test.spec.ts`
```
import { test, expect } from '@playwright/test';

test('OpenClaw Agent ID Display Verification', async ({ page }) => {
  await page.goto('http://localhost:7878');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  const domAnalysis = await page.evaluate(() => {
    const cards = document.querySelectorAll('.session-card, .dense-card');
    return Array.from(cards).map((card, idx) => {
      const tool = card.querySelector('.session-tool, .dense-card-tool')?.textContent?.trim();
      const name = card.querySelector('.session-name, .dense-card-name')?.textContent?.trim();
      const metaContainer = card.querySelector('.session-meta, .dense-card-meta');
      const badges = Array.from(card.querySelectorAll('.session-meta-badge, .dense-card-meta-badge'))
     
```

### `client/src/components/AgentsPanel.tsx`
```
import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/api-base';
import './AgentsPanel.css';

export interface AgentStatus {
  agentId: string;
  status: 'working' | 'idle' | 'offline';
  statusColor: 'green' | 'yellow' | 'gray' | 'red';
  sessionCount: number;
  fullPath?: string;
}

export interface AgentCategory {
  key: string;
  title: string;
  agents: AgentStatus[];
  defaultExpanded?: boolean;
}

export interface AgentsResponse {
  categories: AgentCategory[];
  totalAgents: number;
}

export function AgentsPanel() {
  const [data, setData] = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAgents();
   
```

---
*ContextAssembler v1 | 2026-04-06T05-19-46*