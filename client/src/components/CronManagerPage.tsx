import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/api-base';
import { useNavigate } from 'react-router-dom';
import type { ScheduledTask } from '../types/scheduled-tasks';

function formatTs(ms?: number) {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('zh-CN');
  } catch {
    return String(ms);
  }
}

function statusLabel(task: ScheduledTask): { text: string; cls: string } {
  const s = task.state?.lastRunStatus || task.state?.lastStatus;
  if (s === 'ok') return { text: 'OK', cls: 'value-success' };
  if (s === 'error') return { text: 'ERROR', cls: 'value-danger' };
  if (s) return { text: String(s).toUpperCase(), cls: '' };
  return { text: 'UNKNOWN', cls: '' };
}

export default function CronManagerPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(() => {
    return window.localStorage.getItem('nexus.cron.selectedAgentId') || 'all';
  });
  const [query, setQuery] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl('/scheduled-tasks'));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem('nexus.cron.selectedAgentId', selectedAgentId);
  }, [selectedAgentId]);

  const agentSummaries = useMemo(() => {
    const byAgent = new Map<string, { agentId: string; total: number; enabled: number; error: number }>();

    for (const t of tasks) {
      const key = t.agentId || 'unknown';
      const cur = byAgent.get(key) || { agentId: key, total: 0, enabled: 0, error: 0 };
      cur.total += 1;
      if (t.enabled) cur.enabled += 1;
      if (t.state?.lastRunStatus === 'error' || t.state?.lastStatus === 'error') cur.error += 1;
      byAgent.set(key, cur);
    }

    const arr = Array.from(byAgent.values()).sort((a, b) => a.agentId.localeCompare(b.agentId));
    return arr;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (selectedAgentId !== 'all' && (t.agentId || 'unknown') !== selectedAgentId) return false;
        if (!q) return true;
        const hay = `${t.name || ''} ${t.id || ''} ${t.agentId || ''} ${t.sessionKey || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
  }, [tasks, selectedAgentId, query]);

  const patchEnabled = async (jobId: string, enabled: boolean) => {
    const res = await fetch(apiUrl(`/scheduled-tasks/${jobId}/state`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error(`Failed to update state (HTTP ${res.status})`);
    const data = await res.json();
    setTasks((prev) => prev.map((t) => (t.id === jobId ? data.task : t)));
  };

  const bulkSetEnabled = async (enabled: boolean) => {
    const scope = selectedAgentId === 'all' ? 'all agents' : selectedAgentId;
    if (!window.confirm(`Apply: set enabled=${enabled} for ${scope} (filtered list only)?`)) return;

    const targets = filteredTasks;
    for (const t of targets) {
      try {
        await patchEnabled(t.id, enabled);
      } catch (e) {
        // Continue, but keep it visible.
        console.error('bulkSetEnabled failed for', t.id, e);
      }
    }
  };

  return (
    <div className="cron-manager">
      <div className="cron-sidebar">
        <div className="cron-sidebar-header">
          <div>
            <div className="cron-title">Cron</div>
            <div className="cron-subtitle">Manage OpenClaw jobs by agent</div>
          </div>
          <button className="cron-btn" onClick={fetchTasks} disabled={loading}>Refresh</button>
        </div>

        <div className="cron-sidebar-controls">
          <input
            className="cron-input"
            placeholder="Search (name / jobId / agentId / sessionKey)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="cron-agent-list">
          <button
            className={`cron-agent-item ${selectedAgentId === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelectedAgentId('all')}
          >
            <span className="cron-agent-name">All</span>
            <span className="cron-agent-meta">{tasks.length}</span>
          </button>

          {agentSummaries.map((a) => (
            <button
              key={a.agentId}
              className={`cron-agent-item ${selectedAgentId === a.agentId ? 'is-active' : ''}`}
              onClick={() => setSelectedAgentId(a.agentId)}
            >
              <span className="cron-agent-name">{a.agentId}</span>
              <span className="cron-agent-meta">
                {a.enabled}/{a.total}{a.error ? ` · ${a.error} err` : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="cron-main">
        <div className="cron-main-header">
          <div>
            <h1 className="cron-main-title">{selectedAgentId === 'all' ? 'All cron jobs' : `Cron jobs · ${selectedAgentId}`}</h1>
            <div className="cron-main-hint">
              next: from jobs.json · last status: from job.state
            </div>
          </div>
          <div className="cron-actions">
            <button className="cron-btn" onClick={() => bulkSetEnabled(true)} disabled={loading || filteredTasks.length === 0}>Enable</button>
            <button className="cron-btn danger" onClick={() => bulkSetEnabled(false)} disabled={loading || filteredTasks.length === 0}>Disable</button>
          </div>
        </div>

        {error && (
          <div className="cron-alert cron-alert-error">Failed to load: {error}</div>
        )}

        {loading ? (
          <div className="cron-empty">Loading…</div>
        ) : filteredTasks.length === 0 ? (
          <div className="cron-empty">No jobs found.</div>
        ) : (
          <div className="cron-table-wrap">
            <table className="cron-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Enabled</th>
                  <th>Schedule</th>
                  <th>Next run</th>
                  <th>Last</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => {
                  const st = statusLabel(t);
                  const scheduleText = t.schedule?.kind === 'cron'
                    ? `${t.schedule.expr || ''} (${t.schedule.tz || ''})`
                    : t.schedule?.kind === 'at'
                      ? `at ${t.schedule.at || ''} (${t.schedule.tz || ''})`
                      : t.schedule?.kind === 'every'
                        ? `every ${t.schedule.everyMs || ''}ms`
                        : '—';
                  return (
                    <tr
                      key={t.id}
                      className="cron-row"
                      onClick={() => navigate(`/cron/${t.id}`)}
                      title={t.id}
                    >
                      <td className="cron-td-name">
                        <div className="cron-job-name">{t.name}</div>
                        <div className="cron-job-sub">{t.id}</div>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <label className="cron-switch">
                          <input
                            type="checkbox"
                            checked={!!t.enabled}
                            onChange={(e) => patchEnabled(t.id, e.target.checked).catch((err) => alert(String(err)))}
                          />
                          <span className="cron-switch-slider" />
                        </label>
                      </td>
                      <td className="cron-mono">{scheduleText}</td>
                      <td className="cron-mono">{formatTs(t.state?.nextRunAtMs)}</td>
                      <td className={`cron-mono ${st.cls}`}>{st.text}</td>
                      <td className="cron-mono">{t.state?.consecutiveErrors ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
