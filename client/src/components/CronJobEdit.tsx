import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/api-base';
import { useNavigate, useParams } from 'react-router-dom';
import type { ScheduledTask } from '../types/scheduled-tasks';

function safeJsonStringify(v: any) {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return '{\n}\n';
  }
}

function parseJsonOrThrow(label: string, text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${label} JSON invalid: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export default function CronJobEdit() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<ScheduledTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Basic fields
  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [sessionKey, setSessionKey] = useState('');
  const [sessionTarget, setSessionTarget] = useState('isolated');
  const [wakeMode, setWakeMode] = useState('now');

  // Schedule
  const [scheduleKind, setScheduleKind] = useState<'cron' | 'at' | 'every'>('cron');
  const [scheduleExpr, setScheduleExpr] = useState('');
  const [scheduleTz, setScheduleTz] = useState('Asia/Shanghai');
  const [scheduleAt, setScheduleAt] = useState('');
  const [scheduleEveryMs, setScheduleEveryMs] = useState<string>('');
  const [scheduleAnchorMs, setScheduleAnchorMs] = useState<string>('');

  // Full config
  const [payloadJson, setPayloadJson] = useState('');
  const [deliveryJson, setDeliveryJson] = useState('');

  useEffect(() => {
    if (!jobId) {
      setError('No jobId');
      setLoading(false);
      return;
    }

    const fetchTask = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(apiUrl(`/scheduled-tasks/${jobId}`));
        if (!res.ok) throw new Error(`Failed to fetch job (HTTP ${res.status})`);
        const data = await res.json();
        const t: ScheduledTask = data.task;
        setTask(t);

        setName(t.name || '');
        setEnabled(!!t.enabled);
        setAgentId(t.agentId || '');
        setSessionKey(t.sessionKey || '');
        setSessionTarget(t.sessionTarget || 'isolated');
        setWakeMode(t.wakeMode || 'now');

        const sk = (t.schedule?.kind || 'cron') as any;
        setScheduleKind(sk);
        setScheduleExpr(t.schedule?.expr || '');
        setScheduleTz(t.schedule?.tz || 'Asia/Shanghai');
        setScheduleAt(t.schedule?.at || '');
        setScheduleEveryMs(t.schedule?.everyMs != null ? String(t.schedule.everyMs) : '');
        setScheduleAnchorMs(t.schedule?.anchorMs != null ? String(t.schedule.anchorMs) : '');

        setPayloadJson(safeJsonStringify(t.payload));
        setDeliveryJson(safeJsonStringify(t.delivery));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [jobId]);

  const scheduleObj = useMemo(() => {
    const base: any = { kind: scheduleKind, tz: scheduleTz };
    if (scheduleKind === 'cron') {
      base.expr = scheduleExpr;
    } else if (scheduleKind === 'at') {
      base.at = scheduleAt;
    } else if (scheduleKind === 'every') {
      base.everyMs = scheduleEveryMs ? Number(scheduleEveryMs) : undefined;
      base.anchorMs = scheduleAnchorMs ? Number(scheduleAnchorMs) : undefined;
    }
    return base;
  }, [scheduleKind, scheduleExpr, scheduleTz, scheduleAt, scheduleEveryMs, scheduleAnchorMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    try {
      setError(null);

      const payload = parseJsonOrThrow('payload', payloadJson);
      const delivery = parseJsonOrThrow('delivery', deliveryJson);

      if (!name.trim()) throw new Error('name required');
      if (!agentId.trim()) throw new Error('agentId required');
      if (!sessionKey.trim()) throw new Error('sessionKey required');
      if (!scheduleObj.kind) throw new Error('schedule.kind required');

      const updated: Partial<ScheduledTask> = {
        name: name.trim(),
        enabled,
        agentId: agentId.trim(),
        sessionKey: sessionKey.trim(),
        sessionTarget,
        wakeMode,
        schedule: scheduleObj,
        payload,
        delivery,
      };

      const res = await fetch(apiUrl(`/scheduled-tasks/${task.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Failed to update (HTTP ${res.status}) ${txt}`);
      }

      setSaveSuccess(true);
      window.setTimeout(() => navigate(`/cron/${task.id}`), 600);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : String(e2));
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!window.confirm(`Delete cron job "${task.name}"? This removes it from jobs.json.`)) return;

    try {
      const res = await fetch(apiUrl(`/scheduled-tasks/${task.id}`), { method: 'DELETE' });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Delete failed (HTTP ${res.status}) ${txt}`);
      }
      navigate('/cron');
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) return <div className="task-edit-container">Loading…</div>;

  if (error && !task) {
    return (
      <div className="task-edit-container">
        <div className="cron-alert cron-alert-error">{error}</div>
        <button onClick={() => navigate('/cron')} className="task-detail-back-btn mt-4">Back</button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-edit-container">
        <div className="cron-alert">Job not found</div>
        <button onClick={() => navigate('/cron')} className="task-detail-back-btn mt-4">Back</button>
      </div>
    );
  }

  return (
    <div className="task-edit-container">
      <div className="task-detail-header">
        <h1 className="task-detail-title">Edit Cron Job</h1>
        <button onClick={() => navigate(-1)} className="task-detail-back-btn">Cancel</button>
      </div>

      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Saved</strong>
        </div>
      )}

      {error && (
        <div className="cron-alert cron-alert-error" style={{ marginBottom: 12 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} className="task-edit-form">
        <div className="task-edit-grid">
          <div className="task-info-section">
            <h3>Job</h3>

            <div className="task-field">
              <label className="task-field-label">Name</label>
              <input className="task-field-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="task-field">
              <label className="task-field-label">Enabled</label>
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="form-checkbox h-4 w-4 text-blue-600" />
                  <span className="ml-2">Enabled</span>
                </label>
              </div>
            </div>

            <div className="task-field">
              <label className="task-field-label">Agent ID</label>
              <input className="task-field-input" value={agentId} onChange={(e) => setAgentId(e.target.value)} required />
            </div>

            <div className="task-field">
              <label className="task-field-label">Session Key</label>
              <input className="task-field-input" value={sessionKey} onChange={(e) => setSessionKey(e.target.value)} required />
            </div>

            <div className="task-field">
              <label className="task-field-label">Session Target</label>
              <select className="task-field-input" value={sessionTarget} onChange={(e) => setSessionTarget(e.target.value)}>
                <option value="main">main</option>
                <option value="isolated">isolated</option>
              </select>
            </div>

            <div className="task-field">
              <label className="task-field-label">Wake Mode</label>
              <input className="task-field-input" value={wakeMode} onChange={(e) => setWakeMode(e.target.value)} placeholder="now / next-heartbeat" />
            </div>

            <h3 style={{ marginTop: 18 }}>Schedule</h3>

            <div className="task-field">
              <label className="task-field-label">Kind</label>
              <select className="task-field-input" value={scheduleKind} onChange={(e) => setScheduleKind(e.target.value as any)}>
                <option value="cron">cron</option>
                <option value="at">at</option>
                <option value="every">every</option>
              </select>
            </div>

            {scheduleKind === 'cron' && (
              <div className="task-field">
                <label className="task-field-label">Cron expr</label>
                <input className="task-field-input" value={scheduleExpr} onChange={(e) => setScheduleExpr(e.target.value)} placeholder="*/10 * * * *" />
              </div>
            )}

            {scheduleKind === 'at' && (
              <div className="task-field">
                <label className="task-field-label">At (ISO)</label>
                <input className="task-field-input" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} placeholder="2026-03-27T12:00:00.000Z" />
              </div>
            )}

            {scheduleKind === 'every' && (
              <>
                <div className="task-field">
                  <label className="task-field-label">everyMs</label>
                  <input className="task-field-input" value={scheduleEveryMs} onChange={(e) => setScheduleEveryMs(e.target.value)} placeholder="300000" />
                </div>
                <div className="task-field">
                  <label className="task-field-label">anchorMs</label>
                  <input className="task-field-input" value={scheduleAnchorMs} onChange={(e) => setScheduleAnchorMs(e.target.value)} placeholder="(optional)" />
                </div>
              </>
            )}

            <div className="task-field">
              <label className="task-field-label">Timezone</label>
              <input className="task-field-input" value={scheduleTz} onChange={(e) => setScheduleTz(e.target.value)} placeholder="Asia/Shanghai" />
            </div>
          </div>

          <div className="task-payload-section">
            <h3>Payload (JSON)</h3>
            <textarea className="task-field-textarea" rows={18} value={payloadJson} onChange={(e) => setPayloadJson(e.target.value)} />

            <h3 style={{ marginTop: 18 }}>Delivery (JSON)</h3>
            <textarea className="task-field-textarea" rows={10} value={deliveryJson} onChange={(e) => setDeliveryJson(e.target.value)} />

            <div className="cron-danger">
              <div className="cron-danger-title">Danger zone</div>
              <button type="button" className="cron-btn danger" onClick={handleDelete}>Delete job</button>
              <div className="cron-danger-hint">Deletes from jobs.json (no undo).</div>
            </div>
          </div>
        </div>

        <div className="task-edit-actions">
          <button type="button" onClick={() => navigate(-1)} className="task-action-btn cancel">Cancel</button>
          <button type="submit" className="task-action-btn save">Save</button>
        </div>
      </form>
    </div>
  );
}
