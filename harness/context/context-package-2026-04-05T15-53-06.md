# Context Package
> Built by ContextAssembler | 2026-04-05T15-53-06 | task: MC-Gen: 修复 OA dashboard 经常挂掉（假 running / iframe 连接失败），并修复右上角 OA 按钮无效（点击后无可用 dashboard 或状态不准）

## 📋 Git State
- **Branch**: `main`
- **Status**: ⚠️ dirty
```
M client/vite.config.ts
 M scripts/dev-backend.js
 M scripts/ensure-dev-ports.js
 M scripts/nexusctl.sh
 M scripts/wdg_healthcheck.py
 M server/index.js
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
client/vite.config.ts       |   8 +-
 scripts/dev-backend.js      |  12 ++-
 scripts/ensure-dev-ports.js |  12 ++-
 scripts/nexusctl.sh         |   2 +-
 scripts/wdg_healthcheck.py  |  10 ++-
 server/index.js             | 177 ++++++++++++++++++++++++++++++++------------
 6 files changed, 164 insertions(+), 57 deletions(-)
```

## 📄 Latest Sprint Contract
**File**: `sprint-1.md`

# Sprint Contract — sprint-1

## 任务
开始开发 WDG Health 模块（类似 Cron Reliability）：每天 4:00 运行 WDG healthcheck，将结果写入 OA monitor.db，并在 MC-Gen 的 OA Dashboard UI 中展示该模块（趋势/成功率/延迟/最近失败原因），支持仅失败告警。

## 项目
workspace | /Users/ericmr/Documents/GitHub/Nexus/MC-Gen

## Agent
design-ui-designer

## Matrix Flags
- **[COMPLEXITY_HIGH]** complexity=9 — PGE-sprint enforced
- **[COMPLEXITY_MED]** complexity=9 — consider multi-sprint
## Continue Gate (v5 preview)
- **Final Oracle**: Live acceptance for "开始开发 WDG Health 模块（类似 Cron Reliability）：每天 4:00 运行 WDG healthcheck，将结果写入 OA monitor.db，并在 MC-Gen 的 OA Dashboard UI 中展示该模块（趋势/成功率/延迟/最近失败原因），支持仅失败告警。" plus local oracle: npm run build && node tests/verify-phase1.js
- **Current Blocker**: Not yet verified against final oracle. Replace with concrete blocker after the 

## ▶️  ACTIVE.md
# ACTIVE.md — Current WIP

## Current Project
- **Name**: workspace
- **Repo**: /Users/ericmr/Documents/GitHub/Nexus/MC-Gen
- **Task**: --mode llm --complexity 5 MC-Gen sprint-2: 在本地(Mac mini)配置每天04:00运行 scripts/wdg_healthcheck.py，将结果写入 OA monitor.db，并端到端验证：monitor.db写入成功、/api/wdg-health 返回真实数据。
- **Started**: 2026-04-02T13:47:27.363Z
- **Status**: running
- **Sprints**: sprint-1

## Sprint Plan
- **sprint-1**: engineering-backend-architect [SCOPE_MULTI] [SPEC_API]| deps: none
## Matrix Flags
- 

## ✂️  Relevant Snippets (extracted; large docs are NOT inlined)
> If more context is needed, request specific files/sections; do not ask for “the whole doc”.

### `harness/context/context-package-2026-04-01T16-22-35.md`
#### lines 1-55
```
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
```

### `tests/e2e/TEST_REPORT.md`
#### lines 1-58
```
# E2E 测试报告：Agent 卡片显示 Agent ID 和 Model 信息

## 测试概述

**测试日期:** 2026-03-07
**测试工具:** Playwright
**测试环境:** http://localhost:7878
**浏览器:** Chromium

---

## 测试结果汇总

```
╔══════════════════════════════════════════════════════════════╗
║                    E2E Test Results                          ║
╠══════════════════════════════════════════════════════════════╣
║ Status:     ✅ ALL TESTS PASSED (部分跳过)                   ║
║ Total:      7 tests                                          ║
║ Passed:     6 (86%)                                          ║
║ Skipped:    1 (14%) - 无活动会话                             ║
║ Failed:     0                                                ║
║ Duration:   23.4s                                            ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 测试详情

### ✅ 通过的测试

#### 1. Normal View Mode - should display session cards on the dashboard
- **状态:** ✅ PASSED
- **描述:** 验证会话卡片在仪表板上正确显示
- **结果:** 成功检测到 5 个活动会话卡片

#### 2. Normal View Mode - should display agent ID and model badges when available
- **状态:** ✅ PASSED
- **描述:** 验证 agent ID 和 model 徽章在可用时正确显示
- **结果:** 没有会话提供 agent ID 和 model 信息（这是预期的，因为当前会话是 Claude Code 会话）

#### 3. Normal View Mode - meta badges should be styled correctly
- **状态:** ⏭️ SKIPPED
- **描述:** 验证元徽章样式正确
- **结果:** 跳过 - 没有包含元信息的会话

#### 4. Dense View Mode - should display agent ID and model in dense mode
- **状态:** ✅ PASSED
- **描述:** 验证密集模式下正确显示 agent ID 和 model
- **结果:** 未找到元信息（正常，当前会话不提供）

#### 5. WebSocket Real-time Updates - meta badges should update when session receives new model/agent info
- **状态:** ✅ PASSED
- **描述:** 验证 WebSocket 实时更新时元徽章能正确更新
- **结果:** 测试期间未收到包含元信息的更新

#### 6. Edge Cases - should handle sessions without agentId or model gracefully
```

### `dev-docs/05-phase2-implementation.md`
#### lines 122-200
```
}
```

**关键点**:
- Codex JSONL 格式：`{ type: "response_item", payload: { role: "user", content: [...] } }`
- content 是数组，需要过滤 `item.type === 'text'` 并提取 `item.text`
- 文件名格式：`rollout-1234567890-abc123.jsonl`，需要提取 uuid 部分

---

### Step 2: 创建 OpenClaw Parser

**文件**: `server/parsers/openclaw.js`

**完整代码**:

```javascript
import path from 'path';
import os from 'os';

// OpenClaw agents 目录
export const OPENCLAW_AGENTS_DIR = path.join(os.homedir(), '.openclaw', 'agents');

// 解析 OpenClaw JSONL 消息
export function parseMessage(line) {
  try {
    const obj = JSON.parse(line);

    // OpenClaw 格式最简单: role == "user" 或 role == "assistant"
    if (obj.role === 'user' || obj.role === 'assistant') {
      const content = obj.content;
      let text = '';

      if (typeof content === 'string') {
        text = content;
      } else if (Array.isArray(content)) {
        text = content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');
      }

      return { role: obj.role, content: text };
    }

    return null;
  } catch (error) {
    return null;
  }
}

// 从文件路径提取 Session ID
export function getSessionId(filePath) {
  return path.basename(filePath, '.jsonl');
}

// 从目录路径提取项目名称
export function getProjectName(dirPath) {
  // 从 agents/{agentName}/sessions 提取 agentName
  const parts = dirPath.split(path.sep);
  const sessionsIndex = parts.lastIndexOf('sessions');

  if (sessionsIndex > 0) {
    return parts[sessionsIndex - 1];
  }

  return path.basename(path.dirname(dirPath));
}

// 编码工作目录为目录名
export function encodeCwd(cwd) {
  return cwd.replace(/\//g, '-');
}
```

**关键点**:
- OpenClaw JSONL 格式最简单：`{ role: "user", content: "..." }`
- 路径结构：`~/.openclaw/agents/{agentName}/sessions/{sessionId}.jsonl`
- 项目名称从 agentName 提取
```

### `docs/API.md`
#### lines 5-51
```
- 地址：`ws://localhost:7878`
- 连接建立后，服务端会先发送 `init` 全量快照。

```js
const ws = new WebSocket('ws://localhost:7878');
```

## 2. 消息类型

### 2.1 `init`

客户端连接后立即收到一次全量数据。

```json
{
  "type": "init",
  "sessions": [],
  "usageTotals": {
    "scope": "all_history",
    "totals": {
      "runningAgents": 0,
      "totalTokens": 0,
      "totalCostUsd": 0
    },
    "byTool": {
      "codex": { "totalTokens": 0, "totalCostUsd": 0, "runningAgents": 0 },
      "claude-code": { "totalTokens": 0, "totalCostUsd": 0, "runningAgents": 0 },
      "openclaw": { "totalTokens": 0, "totalCostUsd": 0, "runningAgents": 0 }
    },
    "backfill": {
      "status": "running",
      "scannedFiles": 0,
      "totalFiles": 100
    },
    "updatedAt": 1771184174000
  }
}
```

### 2.2 `session_init`

发现新会话时推送。

```json
{
  "type": "session_init",
  "sessionId": "abc123",
```

### `CLAUDE.md`
#### lines 1-21
```
# Nexus - AI Agent Session Monitor

## 用户启动方式（默认推荐）

**重要：当用户询问如何启动项目时，推荐使用以下方式：**

```bash
npm start
```

这是真正的用户启动方式：
- 一键启动前后端（生产模式）
- 单进程同时提供后端 API 和前端界面
- 访问 http://localhost:7878 即可使用
- 后台运行，适合日常使用

其他用户命令：
```bash
npm stop       # 停止服务
npm restart    # 重启服务
npm run status # 查看运行状态
```

#### lines 34-84
```
npm run dev:all
```

开发模式特点：
- 前后端分离运行
- 前端：http://localhost:5173（Vite 热重载）
- 后端：http://localhost:7878
- 前台运行，占用终端

## 项目架构

- 后端：Express + WebSocket（监控 Claude Code/Codex/OpenClaw 会话）
- 前端：React + Vite（实时展示会话流和用量统计）
- 生产模式：后端静态服务前端构建产物（`dist/`）
- 开发模式：前后端独立运行，支持热重载

## 监控目录

- Claude Code：`~/.claude/projects/`
- Codex：`~/.codex/sessions/`
- OpenClaw：`~/.openclaw/agents/`

## 关键文件

- `server/index.js` - 后端入口，生产模式启动点
- `scripts/nexusctl.sh` - 启动控制脚本
- `client/` - 前端源码
- `dist/` - 前端构建产物（生产模式使用）

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Nexus** (1933 symbols, 5067 relationships, 153 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Nexus/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

```

## 📂 Relevant Small File Previews (keyword matched; size-capped)

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

### `tests/e2e/agent-card-display.spec.ts`
```
import { test, expect } from '@playwright/test';
import { NexusDashboardPage } from './pages/NexusDashboardPage';

test.describe('Agent Card - Agent ID and Model Display', () => {
  test.beforeEach(async ({ page }) => {
    const dashboard = new NexusDashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();
  });

  test.describe('Normal View Mode', () => {
    test('should display session cards on the dashboard', async ({ page }) => {
      const dashboard = new NexusDashboardPage(page);

      // Wait for any sessions to load
      await page.waitForTimeout(3000);

      // Get session cards
      const cards = await dashboard.getSessionCards();
      const cardCount = await cards.length;

      // It's possible no sessions are active, so we allow 0 cards
      
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
*ContextAssembler v1 | 2026-04-05T15-53-06*