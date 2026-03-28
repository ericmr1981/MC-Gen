import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ScheduledTask, TaskExecutionHistory } from '../types/scheduled-tasks';

function fmt(ms?: number) {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('zh-CN');
  } catch {
    return String(ms);
  }
}

export default function CronJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<ScheduledTask | null>(null);
  const [history, setHistory] = useState<TaskExecutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No jobId');
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const r1 = await fetch(`/api/scheduled-tasks/${jobId}`);
        if (!r1.ok) throw new Error(`Failed to fetch job (HTTP ${r1.status})`);
        const d1 = await r1.json();
        setTask(d1.task);

        const r2 = await fetch(`/api/scheduled-tasks/${jobId}/history?limit=20`);
        if (r2.ok) {
          const d2 = await r2.json();
          setHistory(Array.isArray(d2.history) ? d2.history : []);
        } else {
          setHistory([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [jobId]);

  const patchEnabled = async (enabled: boolean) => {
    if (!task) return;
    const res = await fetch(`/api/scheduled-tasks/${task.id}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    if (!res.ok) throw new Error(`Failed to update state (HTTP ${res.status})`);
    const data = await res.json();
    setTask(data.task);
  };

  if (loading) return <div className="task-detail-container">Loading…</div>;
  if (error) return (
    <div className="task-detail-container">
      <div className="cron-alert cron-alert-error">{error}</div>
      <button className="task-detail-back-btn mt-4" onClick={() => navigate('/cron')}>Back</button>
    </div>
  );
  if (!task) return (
    <div className="task-detail-container">
      <div className="cron-alert">Job not found</div>
      <button className="task-detail-back-btn mt-4" onClick={() => navigate('/cron')}>Back</button>
    </div>
  );

  return (
    <div className="task-detail-container">
      <div className="task-detail-header">
        <h1 className="task-detail-title">Cron Job</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="task-detail-back-btn" onClick={() => navigate('/cron')}>Back</button>
          <button className="task-action-btn edit" onClick={() => navigate(`/cron/${task.id}/edit`)}>Edit</button>
        </div>
      </div>

      <div className="task-detail-content">
        <div className="task-detail-grid">
          <div className="task-info-section">
            <h3>Job</h3>

            <div className="task-field">
              <span className="task-field-label">Name</span>
              <p className="task-field-value">{task.name}</p>
            </div>

            <div className="task-field">
              <span className="task-field-label">Job ID</span>
              <p className="task-field-value font-mono">{task.id}</p>
            </div>

            <div className="task-field">
              <span className="task-field-label">Agent</span>
              <p className="task-field-value font-mono">{task.agentId}</p>
            </div>

            <div className="task-field">
              <span className="task-field-label">Enabled</span>
              <div className="mt-1">
                <span className={`task-status-badge ${task.enabled ? 'task-status-enabled' : 'task-status-disabled'}`}>
                  {task.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  className={`task-action-btn ${task.enabled ? 'disable' : 'enable'}`}
                  style={{ marginLeft: 12 }}
                  onClick={() => patchEnabled(!task.enabled).catch((e) => alert(String(e)))}
                >
                  {task.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            <div className="task-field">
              <span className="task-field-label">Schedule</span>
              <p className="task-field-value font-mono">{JSON.stringify(task.schedule)}</p>
            </div>
          </div>

          <div className="task-actions-section">
            <h3>State</h3>
            <div className="task-field">
              <span className="task-field-label">Next run</span>
              <p className="task-field-value font-mono">{fmt(task.state?.nextRunAtMs)}</p>
            </div>
            <div className="task-field">
              <span className="task-field-label">Last run</span>
              <p className="task-field-value font-mono">{fmt(task.state?.lastRunAtMs)}</p>
            </div>
            <div className="task-field">
              <span className="task-field-label">Last status</span>
              <p className="task-field-value font-mono">{task.state?.lastRunStatus || task.state?.lastStatus || '—'}</p>
            </div>
            <div className="task-field">
              <span className="task-field-label">Consecutive errors</span>
              <p className="task-field-value font-mono">{task.state?.consecutiveErrors ?? 0}</p>
            </div>
            <div className="task-field">
              <span className="task-field-label">Last duration</span>
              <p className="task-field-value font-mono">{task.state?.lastDurationMs ? `${task.state.lastDurationMs}ms` : '—'}</p>
            </div>
            {task.state?.lastErrorReason && (
              <div className="task-field">
                <span className="task-field-label">Last error reason</span>
                <p className="task-field-value">{task.state.lastErrorReason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="execution-history-section">
          <h3>Payload / Delivery</h3>
          <div className="cron-json-grid">
            <div>
              <div className="cron-json-title">payload</div>
              <pre className="cron-pre">{JSON.stringify(task.payload, null, 2)}</pre>
            </div>
            <div>
              <div className="cron-json-title">delivery</div>
              <pre className="cron-pre">{JSON.stringify(task.delivery, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="execution-history-section">
          <h3>Run files (recent)</h3>
          {history.length === 0 ? (
            <div className="cron-empty">No run history files found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="execution-history-table">
                <thead>
                  <tr>
                    <th className="execution-history-th">Run ID</th>
                    <th className="execution-history-th">Modified At</th>
                    <th className="execution-history-th">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.runId} className="execution-history-tr">
                      <td className="execution-history-td font-mono">{h.runId}</td>
                      <td className="execution-history-td">{new Date(h.modifiedAt).toLocaleString('zh-CN')}</td>
                      <td className="execution-history-td">{h.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
