import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/api-base';
import type {
  TokenBenchOutlier,
  TokenBenchProject,
  TokenBenchReportRow,
  TokenBenchTaskCard
} from '../types/tokenbench';
import { formatTokens } from '../utils/formatters';

type Tab = 'new' | 'report' | 'tasks';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>{children}</div>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.2)',
        color: 'inherit'
      }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.2)',
        color: 'inherit'
      }}
    />
  );
}

function Button({
  children,
  onClick,
  disabled
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.14)',
        background: disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.10)',
        color: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {children}
    </button>
  );
}

export default function TokenBenchPage() {
  const [tab, setTab] = useState<Tab>('new');

  const [projects, setProjects] = useState<TokenBenchProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [projectName, setProjectName] = useState('');
  const selectedProject = useMemo(
    () => projects.find((p) => p.name === projectName) || null,
    [projects, projectName]
  );

  const [repo, setRepo] = useState('');
  const [taskType, setTaskType] = useState('bugfix');
  const [startSha, setStartSha] = useState('');
  const [endSha, setEndSha] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [agentId, setAgentId] = useState('jarvis');
  const [tests, setTests] = useState('');

  const [computeLoading, setComputeLoading] = useState(false);
  const [preview, setPreview] = useState<TokenBenchTaskCard | null>(null);
  const [computeError, setComputeError] = useState<string | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportRows, setReportRows] = useState<TokenBenchReportRow[]>([]);
  const [outliers, setOutliers] = useState<TokenBenchOutlier[]>([]);
  const [reportError, setReportError] = useState<string | null>(null);

  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskCards, setTaskCards] = useState<TokenBenchTaskCard[]>([]);
  const [tasksError, setTasksError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    setProjectsError(null);

    fetch(apiUrl('/tokenbench/projects'))
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProjects(Array.isArray(data?.projects) ? data.projects : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setProjectsError(err?.message || String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setProjectsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedProject?.repoPath) return;
    // convenience: if user hasn't typed a repo yet, prefill.
    setRepo((prev) => (prev.trim() ? prev : selectedProject.repoPath || ''));
  }, [selectedProject]);

  const compute = async () => {
    setComputeLoading(true);
    setComputeError(null);
    setSaveOk(null);

    try {
      const res = await fetch(apiUrl('/tokenbench/taskcards/compute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName || null,
          repo,
          taskType,
          startSha,
          endSha,
          sessionId,
          agentId,
          tests: tests || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'compute_failed');
      }

      setPreview(data?.preview || null);
    } catch (err: any) {
      setPreview(null);
      setComputeError(err?.message || String(err));
    } finally {
      setComputeLoading(false);
    }
  };

  const save = async () => {
    if (!preview) return;
    setSaveLoading(true);
    setSaveOk(null);

    try {
      const res = await fetch(apiUrl('/tokenbench/taskcards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: preview })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'save_failed');
      setSaveOk(data?.item?.id || 'saved');
    } catch (err: any) {
      setSaveOk(null);
      setComputeError(err?.message || String(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const loadReport = async () => {
    setReportLoading(true);
    setReportError(null);

    try {
      const res = await fetch(apiUrl('/tokenbench/report'));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'report_failed');
      setReportRows(Array.isArray(data?.rows) ? data.rows : []);
      setOutliers(Array.isArray(data?.outliers) ? data.outliers : []);
    } catch (err: any) {
      setReportError(err?.message || String(err));
      setReportRows([]);
      setOutliers([]);
    } finally {
      setReportLoading(false);
    }
  };

  const loadTasks = async () => {
    setTasksLoading(true);
    setTasksError(null);

    try {
      const res = await fetch(apiUrl('/tokenbench/taskcards'));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'tasks_failed');
      const items = Array.isArray(data?.items) ? data.items : [];
      // newest first
      setTaskCards(items.slice().reverse());
    } catch (err: any) {
      setTasksError(err?.message || String(err));
      setTaskCards([]);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'report') return;
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'tasks') return;
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div style={{ padding: 20, maxWidth: 1200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>TokenBench</h2>
          <div style={{ opacity: 0.75, marginTop: 4, fontSize: 13 }}>
            Benchmark token usage for code tasks (diff stats + transcript token totals)
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => setTab('new')} disabled={tab === 'new'}>
            New Task
          </Button>
          <Button onClick={() => setTab('report')} disabled={tab === 'report'}>
            Report
          </Button>
          <Button onClick={() => setTab('tasks')} disabled={tab === 'tasks'}>
            Tasks
          </Button>
        </div>
      </div>

      {tab === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16 }}>
          <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ marginBottom: 12 }}>
              <FieldLabel>Project (from TASKS.md)</FieldLabel>
              <Select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={projectsLoading}
              >
                <option value="">(optional) Select project…</option>
                {projects.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}{p.repoPath ? '' : ' (no repo)'}
                  </option>
                ))}
              </Select>
              {projectsError && <div style={{ color: '#ff8a8a', fontSize: 12, marginTop: 6 }}>{projectsError}</div>}
              {projectsLoading && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>Loading projects…</div>}
            </div>

            <div style={{ marginBottom: 12 }}>
              <FieldLabel>Repo (folder name under /Users/ericmr/Documents/GitHub, or absolute path)</FieldLabel>
              <TextInput value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="e.g. Nexus or /Users/ericmr/Documents/GitHub/Nexus" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <FieldLabel>Task Type</FieldLabel>
                <TextInput value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="e.g. refactor / feature / bugfix" />
              </div>
              <div>
                <FieldLabel>Agent ID</FieldLabel>
                <TextInput value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="jarvis" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <FieldLabel>Start SHA</FieldLabel>
                <TextInput value={startSha} onChange={(e) => setStartSha(e.target.value)} placeholder="commit sha" />
              </div>
              <div>
                <FieldLabel>End SHA</FieldLabel>
                <TextInput value={endSha} onChange={(e) => setEndSha(e.target.value)} placeholder="commit sha" />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <FieldLabel>Session ID (OpenClaw transcript: ~/.openclaw/agents/&lt;agentId&gt;/sessions/&lt;sessionId&gt;.jsonl)</FieldLabel>
              <TextInput value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="session id" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <FieldLabel>Tests (optional)</FieldLabel>
              <TextInput value={tests} onChange={(e) => setTests(e.target.value)} placeholder="e.g. npm test && npm run build" />
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Button
                onClick={compute}
                disabled={computeLoading || !repo.trim() || !taskType.trim() || !startSha.trim() || !endSha.trim() || !sessionId.trim()}
              >
                {computeLoading ? 'Computing…' : 'Compute preview'}
              </Button>
              <Button onClick={save} disabled={saveLoading || !preview}>
                {saveLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>

            {saveOk && <div style={{ color: '#92ffad', fontSize: 13, marginTop: 10 }}>Saved: {saveOk}</div>}
            {computeError && <div style={{ color: '#ff8a8a', fontSize: 13, marginTop: 10 }}>{computeError}</div>}
          </div>

          <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)' }}>
            <h3 style={{ marginTop: 0 }}>Preview</h3>
            {!preview && <div style={{ opacity: 0.7 }}>Compute to see preview.</div>}

            {preview && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>TOKENS</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{formatTokens(preview.tokensTotal)}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>model: {preview.model || 'unknown'}</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>DIFF</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {preview.diff.filesChanged} files · +{preview.diff.added} / -{preview.diff.deleted}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>changed LOC: {preview.diff.changedLoc}</div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>TOKENS / LOC</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {preview.tokensPerLoc == null ? '—' : preview.tokensPerLoc.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>repo: {preview.repo}</div>
                  </div>
                </div>

                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 12,
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    overflowX: 'auto',
                    maxHeight: 520
                  }}
                >
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Report</h3>
            <Button onClick={loadReport} disabled={reportLoading}>
              {reportLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>

          {reportError && <div style={{ color: '#ff8a8a', marginBottom: 12 }}>{reportError}</div>}
          {!reportError && reportRows.length === 0 && !reportLoading && (
            <div style={{ opacity: 0.7 }}>No data yet. Save a few Task Cards first.</div>
          )}

          {reportRows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', opacity: 0.8 }}>
                    <th style={{ padding: '8px 10px' }}>repo</th>
                    <th style={{ padding: '8px 10px' }}>task_type</th>
                    <th style={{ padding: '8px 10px' }}>model</th>
                    <th style={{ padding: '8px 10px' }}>count</th>
                    <th style={{ padding: '8px 10px' }}>tokens median</th>
                    <th style={{ padding: '8px 10px' }}>tokens p90</th>
                    <th style={{ padding: '8px 10px' }}>t/loc median</th>
                    <th style={{ padding: '8px 10px' }}>t/loc p90</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((r) => (
                    <tr key={`${r.repo}::${r.taskType}::${r.model}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{r.repo}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{r.taskType}</td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{r.model}</td>
                      <td style={{ padding: '8px 10px' }}>{r.count}</td>
                      <td style={{ padding: '8px 10px' }}>{r.tokensTotal.median == null ? '—' : formatTokens(r.tokensTotal.median)}</td>
                      <td style={{ padding: '8px 10px' }}>{r.tokensTotal.p90 == null ? '—' : formatTokens(r.tokensTotal.p90)}</td>
                      <td style={{ padding: '8px 10px' }}>{r.tokensPerLoc.median == null ? '—' : r.tokensPerLoc.median.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px' }}>{r.tokensPerLoc.p90 == null ? '—' : r.tokensPerLoc.p90.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {outliers.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Outliers (top {outliers.length})</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', opacity: 0.8 }}>
                      <th style={{ padding: '8px 10px' }}>repo</th>
                      <th style={{ padding: '8px 10px' }}>task_type</th>
                      <th style={{ padding: '8px 10px' }}>model</th>
                      <th style={{ padding: '8px 10px' }}>tokens</th>
                      <th style={{ padding: '8px 10px' }}>t/loc</th>
                      <th style={{ padding: '8px 10px' }}>session</th>
                      <th style={{ padding: '8px 10px' }}>created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outliers.map((o) => (
                      <tr
                        key={String(o.id || o.sessionId || Math.random())}
                        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{o.repo}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{o.taskType}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{o.model}</td>
                        <td style={{ padding: '8px 10px' }}>{formatTokens(o.tokensTotal)}</td>
                        <td style={{ padding: '8px 10px' }}>{o.tokensPerLoc ? o.tokensPerLoc.toFixed(2) : '—'}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{o.sessionId || '—'}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{o.createdAt || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Tasks</h3>
            <Button onClick={loadTasks} disabled={tasksLoading}>
              {tasksLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>

          {tasksError && <div style={{ color: '#ff8a8a', marginBottom: 12 }}>{tasksError}</div>}
          {!tasksError && taskCards.length === 0 && !tasksLoading && (
            <div style={{ opacity: 0.7 }}>No Task Cards yet. Create one in “New Task” then Save.</div>
          )}

          {taskCards.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: 'left', opacity: 0.8 }}>
                    <th style={{ padding: '8px 10px' }}>when</th>
                    <th style={{ padding: '8px 10px' }}>repo</th>
                    <th style={{ padding: '8px 10px' }}>task_type</th>
                    <th style={{ padding: '8px 10px' }}>model</th>
                    <th style={{ padding: '8px 10px' }}>tokens</th>
                    <th style={{ padding: '8px 10px' }}>loc_changed</th>
                    <th style={{ padding: '8px 10px' }}>t/loc</th>
                    <th style={{ padding: '8px 10px' }}>session</th>
                    <th style={{ padding: '8px 10px' }}>start</th>
                    <th style={{ padding: '8px 10px' }}>end</th>
                  </tr>
                </thead>
                <tbody>
                  {taskCards.map((c) => {
                    const locChanged = c?.diff?.changedLoc ?? null;
                    const short = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : '—');
                    return (
                      <tr key={c.id || `${c.sessionId}::${c.startSha}::${c.endSha}`} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{c.createdAt || '—'}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{c.repo}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{c.taskType}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{c.model || 'unknown'}</td>
                        <td style={{ padding: '8px 10px' }}>{formatTokens(c.tokensTotal)}</td>
                        <td style={{ padding: '8px 10px' }}>{locChanged == null ? '—' : locChanged}</td>
                        <td style={{ padding: '8px 10px' }}>{c.tokensPerLoc == null ? '—' : c.tokensPerLoc.toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{short(c.sessionId, 8)}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{short(c.startSha, 7)}</td>
                        <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{short(c.endSha, 7)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
