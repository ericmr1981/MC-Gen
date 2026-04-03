#!/bin/bash
#===========================================================
# ZeroClaw VPS 安装脚本（本地执行）
# 把预编译 binary + 配置 + healthcheck 脚本部署到 VPS
#===========================================================
set -euo pipefail

VPS_HOST="112.124.18.246"
VPS_PORT="22"
SSH_KEY="$HOME/.ssh/wdg_vps_ed25519"
LOCAL_BIN="/tmp/zeroclaw"
SRC_DIR="$HOME/Documents/GitHub/Nexus/MC-Gen/zeroclaw-vps"
HCHECK_SRC="$HOME/Documents/GitHub/Nexus/MC-Gen/scripts/vps_healthcheck.py"

echo "=== 1. 推送 zeroclaw binary ==="
scp -i "$SSH_KEY" -P "$VPS_PORT" -o ConnectTimeout=15 \
  "$LOCAL_BIN" "root@$VPS_HOST:/usr/local/bin/zeroclaw"

echo "=== 2. 推送配置目录 ==="
scp -i "$SSH_KEY" -P "$VPS_PORT" -o ConnectTimeout=15 \
  "$SRC_DIR/config.toml" "root@$VPS_HOST:/root/zeroclaw-vps/config.toml"

echo "=== 3. 推送 healthcheck 脚本 ==="
scp -i "$SSH_KEY" -P "$VPS_PORT" -o ConnectTimeout=15 \
  "$HCHECK_SRC" "root@$VPS_HOST:/root/wdg_health/wdg_healthcheck.py"

echo "=== 4. VPS 上设置权限 + systemd service ==="
ssh -i "$SSH_KEY" -p "$VPS_PORT" -o ConnectTimeout=15 root@$VPS_HOST << 'ENDSSH'
  chmod +x /usr/local/bin/zeroclaw
  chmod 600 /root/zeroclaw-vps/config.toml

  # 如果 env.sh 不存在，创建它
  if [ ! -f /root/zeroclaw-vps/env.sh ]; then
    cat > /root/zeroclaw-vps/env.sh << 'ENVEOF'
MINIMAX_API_KEY=替换为真实MiniMax_API_KEY
MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic
ENVEOF
    chmod 600 /root/zeroclaw-vps/env.sh
    echo "env.sh created — 请编辑填入真实 key"
  fi

  # 复制 systemd service
  cp /root/zeroclaw-vps/config.toml /root/.zeroclaw/config.toml 2>/dev/null || true

  # 启动 zeroclaw daemon
  systemctl daemon-reload
  systemctl enable zeroclaw-health
  systemctl restart zeroclaw-health

  echo "=== 5. 验证 ==="
  systemctl status zeroclaw-health --no-pager | head -10
  /usr/local/bin/zeroclaw status 2>/dev/null || echo "status check done"
ENDSSH

echo "=== 安装完成 ==="
echo "下一步：在 VPS 上编辑 /root/zeroclaw-vps/env.sh 填入真实 MiniMax key，然后 systemctl restart zeroclaw-health"
