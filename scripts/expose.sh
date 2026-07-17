#!/bin/bash
# PathMemos Open 公网暴露脚本（仅 Named Tunnel：需要 Cloudflare Tunnel Token）
# 使用 Cloudflare Tunnel 提供 HTTPS 入口，gum TUI + read 回退。
# 零配置的 Quick Tunnel（临时测试）请使用 install.sh，由 systemd 守护 cloudflared 二进制。
set -eo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "❌ 找不到 .env 文件，请先运行 ./scripts/init.sh"
  exit 1
fi

source .env

source "$(dirname "$0")/lib/ui.sh"
bootstrap_gum || true

# ---------- 主流程 ----------

_gum_style_box "Cloudflare Tunnel 公网暴露\n\n无需域名、无需证书、无需公网 IP。"

ui_section "[1/3] 创建 Tunnel"
cat <<EOF
请按以下步骤在 Cloudflare Dashboard 操作：
  1. 登录 https://dash.cloudflare.com
  2. 进入 Zero Trust → Networks → Tunnels
  3. 点击 Create a tunnel → 选择 Cloudflared
  4. 输入名称（如 pathmemos-open），保存
  5. 复制页面中的 token（类似 eyJh...）
  6. 创建 Public Hostname：
     - Subdomain: 任意
     - Domain: 你的 Cloudflare 域名
     - Service: HTTP
     - URL: http://nginx:80   （必须填这个）
EOF

TOKEN=$(_gum_input --placeholder "Tunnel Token")
if [[ -z "$TOKEN" ]]; then
  ui_error "Token 不能为空"
  exit 1
fi

TUNNEL_DOMAIN=$(_gum_input --placeholder "Tunnel 公网域名（如 https://memos.example.com，即 Cloudflare 中配置的 Public Hostname）")
if [[ -z "$TUNNEL_DOMAIN" ]]; then
  ui_error "Tunnel 域名不能为空"
  exit 1
fi
TUNNEL_DOMAIN=${TUNNEL_DOMAIN%/}
# 无 scheme 时自动补 https://
if [[ "$TUNNEL_DOMAIN" != http://* && "$TUNNEL_DOMAIN" != https://* ]]; then
  TUNNEL_DOMAIN="https://${TUNNEL_DOMAIN}"
fi
# 域名会写入 .env 并被 source：主机部分只允许字母、数字、点、横线，
# 一并拒绝空白、引号、$、反引号、&、# 等会导致 source 解析失败或注入的字符
_tunnel_host="${TUNNEL_DOMAIN#http://}"
_tunnel_host="${_tunnel_host#https://}"
if [[ -z "$_tunnel_host" || "$_tunnel_host" =~ [^A-Za-z0-9.-] ]]; then
  ui_error "Tunnel 域名格式不正确：仅允许字母、数字、点、横线（可带 http(s):// 前缀）"
  exit 1
fi

ui_section "[2/3] 确认配置"
ui_kv "Tunnel 域名" "$TUNNEL_DOMAIN"
ui_kv "Public Hostname URL" "http://nginx:80"
ui_kv "API_HOST" "$TUNNEL_DOMAIN"
if ! _gum_confirm "确认启动 Tunnel？"; then
  ui_info "已取消"
  exit 0
fi

ui_section "[3/3] 写入配置并启动"
if grep -q "^CLOUDFLARE_TUNNEL_TOKEN=" .env; then
  sed -i "s|^CLOUDFLARE_TUNNEL_TOKEN=.*|CLOUDFLARE_TUNNEL_TOKEN=${TOKEN}|" .env
else
  echo "CLOUDFLARE_TUNNEL_TOKEN=${TOKEN}" >> .env
fi
if grep -q "^API_HOST=" .env; then
  sed -i "s|^API_HOST=.*|API_HOST=${TUNNEL_DOMAIN}|" .env
else
  echo "API_HOST=${TUNNEL_DOMAIN}" >> .env
fi

source .env

_gum_spin "启动 Cloudflare Tunnel" docker compose --profile tunnel up -d cloudflared
ui_success "Tunnel 已启动"

_gum_spin "重新创建应用容器以应用新 API_HOST" docker compose up -d app
ui_success "应用已重新创建"

# 启动后探测一次公网健康端点并提示结果
ui_info "探测公网地址: ${TUNNEL_DOMAIN}/health ..."
if curl -fsSL --retry 3 --retry-delay 2 --connect-timeout 10 --max-time 20 "${TUNNEL_DOMAIN}/health" >/dev/null 2>&1; then
  ui_success "公网地址可访问: ${TUNNEL_DOMAIN}"
else
  ui_warn "公网地址暂不可访问"
  ui_info "请检查 Tunnel 状态: docker compose logs -f cloudflared"
fi

ui_section "完成"
_gum_style_box "公网地址: ${TUNNEL_DOMAIN}\n\n在小程序设置页填写：\n  - 后端地址: ${TUNNEL_DOMAIN}\n  - API Key: ${OPEN_API_KEY}\n\n查看日志:\n  docker compose logs -f app\n  docker compose logs -f cloudflared"
