import React, { useState, useEffect } from 'react';
import { apiUrl } from '../utils/api-base';

interface CheckFailure {
  date: string;
  ts: string;
  check: string;
  status: string;
  http: number | null;
  latency_ms: number | null;
  detail: string;
}

interface WDGHealthData {
  latest: {
    date: string | null;
    overall: string;
    success_rate: number | null;
    error_rate: number | null;
    p95_latency_ms: number | null;
    unit: string;
    total_checks: number | null;
    passed_checks: number | null;
    failed_checks: number | null;
  };
  trends: {
    '7d': Record<string, Array<{ date: string; value: number }>>;
    '30d': Record<string, Array<{ date: string; value: number }>>;
  };
  failures: CheckFailure[];
}

const STATUS_COLORS: Record<string, string> = {
  pass: '#10b981',
  warn: '#f59e0b',
  fail: '#ef4444',
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
  unknown: '#9ca3af',
};

const METRIC_COLORS: Record<string, string> = {
  success_rate: '#10b981',
  error_rate: '#ef4444',
  p95_latency_ms: '#6366f1',
};

function Sparkline({ data, color, width = 300, height = 60 }: {
  data: Array<{ date: string; value: number }>;
  color: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length === 0) {
    return <div className="sparkline-empty">No data</div>;
  }
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * w;
    const y = pad + h - ((d.value - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');
  const lastX = parseFloat(points[points.length - 1].split(',')[0]);
  const lastY = parseFloat(points[points.length - 1].split(',')[1]);
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r={3} fill={color} />
    </svg>
  );
}

function TrendCard({
  label,
  value,
  unit,
  color,
  trend,
  sparkData,
}: {
  label: string;
  value: number | null;
  unit: string;
  color: string;
  trend: 'up' | 'down' | null;
  sparkData: Array<{ date: string; value: number }>;
}) {
  const arrow = trend === 'up' ? ' ↑' : trend === 'down' ? ' ↓' : '';
  return (
    <div className="wdg-metric-card">
      <div className="wdg-metric-label">{label}</div>
      <div className="wdg-metric-value" style={{ color }}>
        {value != null ? value.toFixed(1) : '—'}{value != null ? unit : ''}{arrow}
      </div>
      <div className="wdg-metric-spark">
        <Sparkline data={sparkData} color={color} width={220} height={48} />
      </div>
    </div>
  );
}

function FailuresTable({ failures }: { failures: CheckFailure[] }) {
  if (!failures || failures.length === 0) {
    return (
      <div className="wdg-failures-empty">
        ✅ No failures in recent runs
      </div>
    );
  }
  return (
    <table className="wdg-failures-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Check</th>
          <th>HTTP</th>
          <th>Latency</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>
        {failures.map((f, i) => (
          <tr key={i}>
            <td className="wdg-td-date">{f.date}</td>
            <td className="wdg-td-check">
              <code>{f.check}</code>
            </td>
            <td className="wdg-td-num" style={{ color: f.http ? '#ef4444' : '#9ca3af' }}>
              {f.http ?? '—'}
            </td>
            <td className="wdg-td-num">
              {f.latency_ms != null ? `${f.latency_ms}ms` : '—'}
            </td>
            <td className="wdg-td-detail">{f.detail || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const WDGHealthPage: React.FC = () => {
  const [data, setData] = useState<WDGHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendWindow, setTrendWindow] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetch(apiUrl('/wdg-health'))
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); }
        else { setData(d); }
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  if (loading) return <div className="wdg-loading">Loading WDG Health…</div>;
  if (error) return <div className="wdg-error">Error: {error}</div>;
  if (!data) return <div className="wdg-error">No data</div>;

  const { latest, trends, failures } = data;
  const windowTrends = trends[trendWindow];

  // Compute trend direction: compare last vs first value in window
  function getTrend(metric: string): 'up' | 'down' | null {
    const pts = windowTrends[metric];
    if (!pts || pts.length < 2) return null;
    const last = pts[pts.length - 1].value;
    const first = pts[0].value;
    if (last > first) return 'up';
    if (last < first) return 'down';
    return null;
  }

  const overallColor = STATUS_COLORS[latest.overall] || STATUS_COLORS.unknown;
  const statusLabel = latest.overall === 'pass' ? 'PASS' : latest.overall === 'warn' ? 'WARN' : latest.overall === 'fail' ? 'FAIL' : 'UNKNOWN';

  return (
    <div className="wdg-health-page">
      {/* Header */}
      <div className="wdg-header">
        <div className="wdg-header-left">
          <h2 className="wdg-title">WDG Health</h2>
          <div className="wdg-last-run">
            {latest.date ? `Latest run: ${latest.date}` : 'No runs recorded'}
          </div>
        </div>
        <div className="wdg-status-badge" style={{ backgroundColor: overallColor }}>
          {statusLabel}
        </div>
      </div>

      {/* Summary strip */}
      <div className="wdg-summary-strip">
        <div className="wdg-summary-item">
          <span className="wdg-summary-label">Checks</span>
          <span className="wdg-summary-value">
            {latest.total_checks != null ? `${latest.passed_checks}/${latest.total_checks} passed` : '—'}
          </span>
        </div>
        <div className="wdg-summary-sep" />
        <div className="wdg-summary-item">
          <span className="wdg-summary-label">Failed</span>
          <span className="wdg-summary-value" style={{ color: '#ef4444' }}>
            {latest.failed_checks ?? '—'}
          </span>
        </div>
        <div className="wdg-summary-sep" />
        <div className="wdg-summary-item">
          <span className="wdg-summary-label">Success Rate</span>
          <span className="wdg-summary-value" style={{ color: METRIC_COLORS.success_rate }}>
            {latest.success_rate != null ? `${latest.success_rate.toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className="wdg-summary-sep" />
        <div className="wdg-summary-item">
          <span className="wdg-summary-label">P95 Latency</span>
          <span className="wdg-summary-value" style={{ color: METRIC_COLORS.p95_latency_ms }}>
            {latest.p95_latency_ms != null ? `${latest.p95_latency_ms.toFixed(0)}ms` : '—'}
          </span>
        </div>
      </div>

      {/* Trends */}
      <div className="wdg-section">
        <div className="wdg-section-header">
          <h3 className="wdg-section-title">Trends</h3>
          <div className="wdg-window-toggle">
            <button
              className={`wdg-toggle-btn ${trendWindow === '7d' ? 'active' : ''}`}
              onClick={() => setTrendWindow('7d')}
            >7d</button>
            <button
              className={`wdg-toggle-btn ${trendWindow === '30d' ? 'active' : ''}`}
              onClick={() => setTrendWindow('30d')}
            >30d</button>
          </div>
        </div>
        <div className="wdg-metrics-grid">
          <TrendCard
            label="Success Rate %"
            value={latest.success_rate}
            unit="%"
            color={METRIC_COLORS.success_rate}
            trend={getTrend('success_rate')}
            sparkData={windowTrends.success_rate || []}
          />
          <TrendCard
            label="Error Rate %"
            value={latest.error_rate}
            unit="%"
            color={METRIC_COLORS.error_rate}
            trend={getTrend('error_rate')}
            sparkData={windowTrends.error_rate || []}
          />
          <TrendCard
            label="P95 Latency ms"
            value={latest.p95_latency_ms}
            unit="ms"
            color={METRIC_COLORS.p95_latency_ms}
            trend={getTrend('p95_latency_ms')}
            sparkData={windowTrends.p95_latency_ms || []}
          />
        </div>
      </div>

      {/* Recent Failures */}
      <div className="wdg-section">
        <h3 className="wdg-section-title">
          Recent Failures
          {failures.length > 0 && (
            <span className="wdg-failure-count">{failures.length}</span>
          )}
        </h3>
        <FailuresTable failures={failures} />
      </div>
    </div>
  );
};

export default WDGHealthPage;
