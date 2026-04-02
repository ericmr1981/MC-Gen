# Context Package
> Built by ContextAssembler | 2026-04-01T16-22-35 | task: 开始开发 WDG Health 模块（类似 Cron Reliability）：每天 4:00 运行 WDG healthcheck，将结果写入 OA monitor.db，并在 MC-Gen 的 OA Dashboard UI 中展示该模块（趋势/成功率/延迟/最近失败原因），支持仅失败告警。

## 📋 Git State
- **Branch**: `main`
- **Status**: ⚠️ dirty
```
D oa-project/config.yaml
?? .harness-master.json
?? .harness-spawn-sprint-1.json
?? ACTIVE.md
?? harness/
?? oa-project
?? scripts/wdg_healthcheck.py
```

## 📜 Recent Commits (last 5)
```
  8d0f1cc feat: add real-time token throughput + I/O stats to session cards
  9200f0f chore: initial import (restart from scratch)
```

## 🔍 Uncommitted Changes
```
oa-project/config.yaml | 126 -------------------------------------------------
 1 file changed, 126 deletions(-)
```

## ▶️  ACTIVE.md
# ACTIVE.md — Current WIP

## Current Project
- **Name**: workspace
- **Repo**: /Users/ericmr/Documents/GitHub/Nexus/MC-Gen
- **Task**: --mode keyword --complexity 3 MC-Gen：将 session-card 尺寸调整为 width=700 height=500（保持布局不溢出）
- **Started**: 2026-04-01T13:54:52.642Z
- **Status**: running
- **Sprints**: sprint-1

## Sprint Plan
- **sprint-1**: engineering-senior-developer [SCOPE_MULTI]| deps: none
## Matrix Flags
- [SCOPE_MULTI] scope=multi-file — affects 20 files, confirm with Boss

## Master Brief

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

### `tests/file-monitor-regression.js`
```
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import * as FileMonitor from '../server/monitors/file-monitor.js';

let passed = 0;
let failed = 0;

function pass(name) {
  passed += 1;
  console.log(`✅ ${name}`);
}

function fail(name, error) {
  failed += 1;
  console.log(`❌ ${name}`);
  console.log(`   ${error?.message || error}`);
}

function run(name, fn) {
  try {
    fn();
    pass(name);
  } catch (error) {
    fail(name, error);
  }
}

function withTempDir(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-fm-'));
  try {
    fn(tmp);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

run('scanAllProjects recursively includes nested jsonl files', () => {
  withTempDir((tmpRoot) => {
    const pr
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

### `server/monitors/process-monitor.js`
```
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
const PROCESS_SCAN_COMMAND_TIMEOUT_MS = Number(process.env.NEXUS_PROCESS_SCAN_TIMEOUT_MS || 1200);
const PROCESS_SCAN_MAX_BUFFER = 1024 * 1024;

// Track active processes (PID -> project directory)
const activeProcesses = new Map();

let _hasLsof = null;
let _lsofPath = '';
async function hasLsof() {
  if (_hasLsof !== null) return _hasLsof;

  const out = await runCommand('command -v lsof');
  const found = String(out || '').trim();
  if (found) {
    _hasLsof = true;
    _lsofPath = found;
    console.log(`[ProcessMonitor] lsof available: true (path=${_lsofPath})`);
    return _hasLsof;
  }

  // macOS often ships lsof in /usr/sbin, which may not be on PATH
```

---
*ContextAssembler v1 | 2026-04-01T16-22-35*