#!/usr/bin/env python3
"""
WDG Healthcheck — VPS 节点健康检测脚本
由 cron 定时调用，写入本地 SQLite，供本机 SSH pull 拉取
"""
import sqlite3, json, os, subprocess
from datetime import datetime, timezone

DB_PATH = "/root/wdg_health/wdg_health.db"
LOG_PATH = "/root/wdg_health/wdg_health.log"
NODE = "vps-1"  # 多节点时按需修改

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True, timeout=10).strip()
    except Exception as e:
        return f"ERROR: {e}"

def get_docker_count():
    out = run("docker ps -q | wc -l")
    try:
        return int(out)
    except:
        return -1

def get_nginx_up():
    out = run("systemctl is-active nginx")
    return 1 if out == "active" else 0

def get_net_latency():
    # 测到网关延迟（VPS 内网网关）
    out = run("ping -c 3 -W 2 172.31.0.1 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}' | tail -1")
    try:
        return float(out)
    except:
        return -1.0

def get_net_latency_ext():
    # 测到百度延迟（外网可用性）
    out = run("ping -c 3 -W 2 119.75.217.109 2>/dev/null | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}' | tail -1")
    try:
        return float(out)
    except:
        return -1.0

def ensure_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS health_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node TEXT NOT NULL,
            ts TEXT NOT NULL,
            metric TEXT NOT NULL,
            value REAL,
            unit TEXT DEFAULT '',
            UNIQUE(node, ts, metric)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_hl_node_ts ON health_log(node, ts DESC)")
    conn.commit()
    return conn

def write_log(msg):
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] {msg}\n"
    with open(LOG_PATH, "a") as f:
        f.write(line)

def main():
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")
    ts_str = now.isoformat()

    checks = [
        ("cpu_usage", float(run("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'")) if run("top -bn1 | grep 'Cpu(s)'") else -1.0, "%"),
        ("ram_usage", float(run("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'")) if run("free | grep Mem") else -1.0, "%"),
        ("disk_usage", float(run("df / | tail -1 | awk '{print $5}' | sed 's/%//'")) if run("df / | tail -1") else -1.0, "%"),
        ("docker_containers", float(get_docker_count()), "count"),
        ("nginx_up", float(get_nginx_up()), "bool"),
        ("net_latency_gw", get_net_latency(), "ms"),
        ("net_latency_ext", get_net_latency_ext(), "ms"),
        ("load_avg", float(run("uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//'")) if run("uptime | awk -F'load average:' '{print $2}'") else -1.0, ""),
    ]

    conn = ensure_db()
    for metric, value, unit in checks:
        conn.execute(
            "INSERT OR REPLACE INTO health_log (node, ts, metric, value, unit) VALUES (?, ?, ?, ?, ?)",
            (NODE, ts_str, metric, value, unit)
        )
    conn.commit()
    conn.close()

    summary = {m: v for m, v, _ in checks}
    write_log(f"healthcheck done: {json.dumps(summary)}")
    print(f"WDG healthcheck OK at {ts_str}: {summary}")

if __name__ == "__main__":
    main()
