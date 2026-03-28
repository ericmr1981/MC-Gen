import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { logger } from './utils/logger.js';

const DEFAULT_AGENT_ID = 'jarvis';
const TASKS_MD_PATH = '/Users/ericmr/.openclaw/agents/jarvis/workspace/TASKS.md';
const GITHUB_ROOT = '/Users/ericmr/Documents/GitHub';
const STORE_PATH = path.join(GITHUB_ROOT, 'Nexus', 'data', 'tokenbench', 'taskcards.jsonl');

function ensureWithinRoot(candidatePath, rootPath) {
  const resolvedRoot = path.resolve(rootPath);
  const resolvedCandidate = path.resolve(candidatePath);
  if (resolvedCandidate === resolvedRoot) return resolvedCandidate;
  if (!resolvedCandidate.startsWith(resolvedRoot + path.sep)) {
    throw new Error('path_outside_root');
  }
  return resolvedCandidate;
}

function resolveRepoPath(repo) {
  if (!repo || typeof repo !== 'string') throw new Error('missing_repo');
  const trimmed = repo.trim();
  if (!trimmed) throw new Error('missing_repo');

  // Allow absolute paths, but only inside GITHUB_ROOT.
  if (trimmed.startsWith('/') || trimmed.startsWith('~')) {
    const expanded = trimmed.startsWith('~')
      ? path.join(os.homedir(), trimmed.slice(1))
      : trimmed;
    return ensureWithinRoot(expanded, GITHUB_ROOT);
  }

  // Otherwise treat as a repo folder name under GITHUB_ROOT.
  const joined = path.join(GITHUB_ROOT, trimmed);
  return ensureWithinRoot(joined, GITHUB_ROOT);
}

function parseTasksMd(raw) {
  // Very lightweight parser: scan for blocks with "Project name" plus an optional "Repo".
  // TASKS.md is treated as a stable registry, not a schema.
  const lines = raw.split(/\r?\n/);
  const projects = [];
  let current = null;

  const flush = () => {
    if (current?.name) {
      projects.push({
        name: current.name,
        repoPath: current.repoPath || null,
        recordPath: current.recordPath || null
      });
    }
    current = null;
  };

  for (const line of lines) {
    const mName = line.match(/\*\*Project name：\*\*\s*(.+?)\s*$/);
    if (mName) {
      flush();
      current = { name: mName[1].trim() };
      continue;
    }

    const mRepo = line.match(/\*\*Repo：\*\*\s*`([^`]+)`/);
    if (mRepo && current) {
      current.repoPath = mRepo[1].trim();
      continue;
    }

    const mLoc = line.match(/\*\*Project location：\*\*\s*`([^`]+)`/);
    if (mLoc && current) {
      current.recordPath = mLoc[1].trim();
      continue;
    }

    const mRecord = line.match(/\*\*Record root：\*\*\s*`([^`]+)`/);
    if (mRecord && current) {
      current.recordPath = mRecord[1].trim();
      continue;
    }
  }

  flush();

  // de-dupe by name
  const seen = new Set();
  return projects.filter((p) => {
    const k = p.name;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function safeReadText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function safeAppendJsonl(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, JSON.stringify(obj) + '\n', 'utf8');
}

function safeReadJsonl(filePath, limit = 5000) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const slice = lines.slice(-limit);
  const items = [];
  for (const ln of slice) {
    try {
      items.push(JSON.parse(ln));
    } catch {
      // ignore
    }
  }
  return items;
}

function readSessionUsage({ sessionId, agentId = DEFAULT_AGENT_ID }) {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('missing_session_id');
  }

  const transcriptPath = path.join(os.homedir(), '.openclaw', 'agents', agentId, 'sessions', `${sessionId}.jsonl`);
  if (!fs.existsSync(transcriptPath)) {
    throw new Error('transcript_not_found');
  }

  const raw = fs.readFileSync(transcriptPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);

  let total = 0;
  let input = 0;
  let output = 0;
  let cacheRead = 0;
  let cacheWrite = 0;

  /**
   * Model inference notes:
   * - OpenClaw often writes a “session started” row with provider=openclaw, model=delivery-mirror, tokens=0.
   * - We want the *actual* provider model used for the session (e.g. gpt-5.2).
   */
  const modelEvents = [];

  const toMs = (ts) => {
    if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
    if (typeof ts === 'string' && ts.trim()) {
      const parsed = Date.parse(ts);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  for (const ln of lines) {
    let obj;
    try {
      obj = JSON.parse(ln);
    } catch {
      continue;
    }

    const usage = obj?.message?.usage || obj?.usage || null;
    let totalTokensThis = 0;
    if (usage && typeof usage === 'object') {
      const i = Number(usage.input ?? usage.prompt_tokens ?? 0) || 0;
      const o = Number(usage.output ?? usage.completion_tokens ?? 0) || 0;
      const cr = Number(usage.cacheRead ?? usage.cache_read_tokens ?? 0) || 0;
      const cw = Number(usage.cacheWrite ?? usage.cache_write_tokens ?? 0) || 0;
      const t = Number(usage.totalTokens ?? usage.total_tokens ?? 0) || 0;

      input += i;
      output += o;
      cacheRead += cr;
      cacheWrite += cw;

      totalTokensThis = t > 0 ? t : (i + o + cr + cw);
      total += totalTokensThis;
    }

    // Primary source: message/provider/model.
    const provider = obj?.message?.provider || obj?.provider || null;
    const model = obj?.message?.model || obj?.model || obj?.message?.response?.model || obj?.response?.model || null;
    const ts = toMs(obj?.message?.timestamp) ?? toMs(obj?.timestamp) ?? null;

    if (typeof model === 'string' && model.trim()) {
      modelEvents.push({
        provider: typeof provider === 'string' ? provider : null,
        model: model.trim(),
        totalTokens: totalTokensThis,
        ts
      });
    }

    // Secondary source: explicit model snapshot custom events.
    if (obj?.type === 'custom' && obj?.customType === 'model-snapshot') {
      const snapProvider = obj?.data?.provider;
      const snapModel = obj?.data?.modelId;
      const snapTs = toMs(obj?.data?.timestamp) ?? toMs(obj?.timestamp) ?? null;
      if (typeof snapModel === 'string' && snapModel.trim()) {
        modelEvents.push({
          provider: typeof snapProvider === 'string' ? snapProvider : null,
          model: snapModel.trim(),
          totalTokens: 0,
          ts: snapTs
        });
      }
    }
  }

  const chooseModel = () => {
    const isBad = (e) => e?.provider === 'openclaw' || e?.model === 'delivery-mirror';

    const withTokens = modelEvents.filter((e) => !isBad(e) && (Number(e.totalTokens) || 0) > 0);
    if (withTokens.length) {
      const groups = new Map();
      for (const e of withTokens) {
        const key = `${e.provider || 'unknown'}::${e.model}`;
        const cur = groups.get(key) || { count: 0, totalTokens: 0, lastTs: -Infinity, model: e.model };
        cur.count += 1;
        cur.totalTokens += Number(e.totalTokens) || 0;
        cur.lastTs = Math.max(cur.lastTs, e.ts ?? -Infinity);
        groups.set(key, cur);
      }

      const best = [...groups.values()].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.lastTs !== a.lastTs) return b.lastTs - a.lastTs;
        return b.totalTokens - a.totalTokens;
      })[0];

      return best?.model || null;
    }

    const nonOpenClaw = modelEvents.filter((e) => !isBad(e));
    if (nonOpenClaw.length) {
      nonOpenClaw.sort((a, b) => (b.ts ?? -Infinity) - (a.ts ?? -Infinity));
      return nonOpenClaw[0]?.model || null;
    }

    // last resort: first model we saw.
    return modelEvents.find((e) => e?.model)?.model || null;
  };

  const model = chooseModel();

  return {
    agentId,
    sessionId,
    transcriptPath,
    model,
    usage: {
      input,
      output,
      cacheRead,
      cacheWrite,
      totalTokens: total
    }
  };
}

function execGitNumstat({ repoPath, startSha, endSha }) {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      ['-C', repoPath, 'diff', '--numstat', `${startSha}..${endSha}`],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || err.message || 'git_diff_failed'));
          return;
        }

        const lines = String(stdout).split(/\r?\n/).filter(Boolean);
        let filesChanged = 0;
        let added = 0;
        let deleted = 0;

        for (const line of lines) {
          const parts = line.split('\t');
          if (parts.length < 3) continue;
          const aRaw = parts[0];
          const dRaw = parts[1];
          // binary files show '-' in numstat
          const a = aRaw === '-' ? 0 : (Number(aRaw) || 0);
          const d = dRaw === '-' ? 0 : (Number(dRaw) || 0);
          added += a;
          deleted += d;
          filesChanged += 1;
        }

        const changedLoc = added + deleted;
        resolve({
          startSha,
          endSha,
          filesChanged,
          added,
          deleted,
          changedLoc
        });
      }
    );
  });
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  const clamped = Math.max(0, Math.min(sorted.length - 1, idx));
  return sorted[clamped];
}

export function registerTokenBenchRoutes(app) {
  app.get('/api/tokenbench/projects', (req, res) => {
    try {
      const raw = safeReadText(TASKS_MD_PATH);
      const projects = parseTasksMd(raw);
      res.json({ projects });
    } catch (error) {
      logger.error('TokenBench projects failed', { error: error?.message || String(error) });
      res.status(500).json({ error: 'tokenbench_projects_failed' });
    }
  });

  app.post('/api/tokenbench/taskcards/compute', async (req, res) => {
    try {
      const {
        projectName,
        repo,
        taskType,
        startSha,
        endSha,
        sessionId,
        agentId,
        tests
      } = req.body || {};

      if (!repo || !taskType || !startSha || !endSha || !sessionId) {
        res.status(400).json({ error: 'missing_fields' });
        return;
      }

      const repoPath = resolveRepoPath(repo);
      const diff = await execGitNumstat({ repoPath, startSha, endSha });
      const session = readSessionUsage({ sessionId, agentId: agentId || DEFAULT_AGENT_ID });

      const tokensTotal = session.usage.totalTokens;
      const tokensPerLoc = diff.changedLoc > 0 ? tokensTotal / diff.changedLoc : null;

      res.json({
        preview: {
          projectName: projectName || null,
          repo,
          repoPath,
          taskType,
          startSha,
          endSha,
          sessionId,
          agentId: session.agentId,
          tests: tests || null,
          model: session.model,
          diff,
          session: session.usage,
          tokensTotal,
          tokensPerLoc
        }
      });
    } catch (error) {
      logger.error('TokenBench compute failed', { error: error?.message || String(error) });
      res.status(500).json({ error: 'tokenbench_compute_failed', detail: error?.message || String(error) });
    }
  });

  app.post('/api/tokenbench/taskcards', (req, res) => {
    try {
      const { card } = req.body || {};
      if (!card || typeof card !== 'object') {
        res.status(400).json({ error: 'missing_card' });
        return;
      }

      const stored = {
        ...card,
        id: card.id || `tb_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString()
      };

      safeAppendJsonl(STORE_PATH, stored);
      res.json({ ok: true, item: stored });
    } catch (error) {
      logger.error('TokenBench save failed', { error: error?.message || String(error) });
      res.status(500).json({ error: 'tokenbench_save_failed' });
    }
  });

  app.get('/api/tokenbench/taskcards', (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit || 200) || 200, 5000);
      const items = safeReadJsonl(STORE_PATH, limit);
      res.json({ items });
    } catch (error) {
      logger.error('TokenBench list failed', { error: error?.message || String(error) });
      res.status(500).json({ error: 'tokenbench_list_failed' });
    }
  });

  app.get('/api/tokenbench/report', (req, res) => {
    try {
      const items = safeReadJsonl(STORE_PATH, 5000);
      const groups = new Map();

      for (const item of items) {
        const repo = item.repo || item.repoPath || 'unknown';
        const taskType = item.taskType || 'unknown';
        const model = item.model || 'unknown';
        const key = `${repo}::${taskType}::${model}`;
        if (!groups.has(key)) {
          groups.set(key, { repo, taskType, model, items: [] });
        }
        groups.get(key).items.push(item);
      }

      const rows = [];
      const outliers = [];

      for (const g of groups.values()) {
        const totals = g.items
          .map((x) => Number(x.tokensTotal ?? x.tokens_total ?? x?.session?.totalTokens ?? 0) || 0)
          .filter((n) => Number.isFinite(n) && n > 0);
        const perLoc = g.items
          .map((x) => Number(x.tokensPerLoc ?? 0) || 0)
          .filter((n) => Number.isFinite(n) && n > 0);

        const medTotal = median(totals);
        const p90Total = percentile(totals, 90);
        const medPerLoc = median(perLoc);
        const p90PerLoc = percentile(perLoc, 90);

        rows.push({
          repo: g.repo,
          taskType: g.taskType,
          model: g.model,
          count: g.items.length,
          tokensTotal: { median: medTotal, p90: p90Total },
          tokensPerLoc: { median: medPerLoc, p90: p90PerLoc }
        });

        // Simple outlier heuristic within group.
        const totalThreshold = p90Total ? p90Total * 1.5 : null;
        const perLocThreshold = p90PerLoc ? p90PerLoc * 1.5 : null;
        for (const item of g.items) {
          const t = Number(item.tokensTotal ?? 0) || 0;
          const pl = Number(item.tokensPerLoc ?? 0) || 0;
          if ((totalThreshold && t > totalThreshold) || (perLocThreshold && pl > perLocThreshold)) {
            outliers.push({
              repo: g.repo,
              taskType: g.taskType,
              model: g.model,
              id: item.id,
              createdAt: item.createdAt,
              tokensTotal: t,
              tokensPerLoc: pl,
              sessionId: item.sessionId
            });
          }
        }
      }

      rows.sort((a, b) => (b.tokensPerLoc.p90 || 0) - (a.tokensPerLoc.p90 || 0));
      outliers.sort((a, b) => (b.tokensPerLoc || 0) - (a.tokensPerLoc || 0));

      res.json({
        rows,
        outliers: outliers.slice(0, 50)
      });
    } catch (error) {
      logger.error('TokenBench report failed', { error: error?.message || String(error) });
      res.status(500).json({ error: 'tokenbench_report_failed' });
    }
  });
}
