#!/bin/bash
# PathMemos Open 交互式部署脚本
# 风格参考 OpenClaw：使用 Charmbracelet gum 提供 TUI，无 gum 时回退到普通 read。
set -eo pipefail

cd "$(dirname "$0")/.."
source "$(dirname "$0")/lib/ui.sh"

# gum 状态追踪（无 gum 时回退到基础交互，并给出原因提示）
GUM_STATUS="skipped"
GUM_REASON=""
if command -v gum >/dev/null 2>&1; then
  GUM="gum"
  GUM_STATUS="found"
  GUM_REASON="already installed"
elif bootstrap_gum; then
  GUM_STATUS="installed"
  GUM_REASON="downloaded"
else
  GUM_STATUS="fallback"
  GUM_REASON="unavailable"
fi

print_gum_status() {
  case "$GUM_STATUS" in
    found|installed) ui_success "gum 已就绪 (${GUM_REASON})" ;;
    *) [[ -n "$GUM_REASON" ]] && ui_warn "gum 不可用 (${GUM_REASON})，回退到基础交互" ;;
  esac
}
print_gum_status

# 密钥由 openssl 生成，缺失时直接报错退出
if ! command -v openssl >/dev/null 2>&1; then
  ui_error "需要 openssl，请先安装（如：apt-get install -y openssl）"
  exit 1
fi

# ---------- 部署逻辑 ----------
check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    ui_error "需要安装 Docker"
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    ui_error "需要安装 Docker Compose v2"
    exit 1
  fi
  ui_success "Docker 和 Docker Compose 已就绪"
}

load_or_create_env() {
  if [[ -f .env ]]; then
    source .env
    local missing=()
    local key
    for key in DB_PASSWORD REDIS_PASSWORD OPEN_API_KEY AI_API_KEY TENCENT_MAP_KEY; do
      if [[ -z "${!key:-}" ]]; then missing+=("$key"); fi
    done
    if [[ ${#missing[@]} -gt 0 ]]; then
      ui_error "现有 .env 缺少必填项: ${missing[*]}"
      ui_info "请补齐后重试，或删除 .env 重新运行本脚本"
      exit 1
    fi
    ui_info "已加载现有 .env 配置"
    return
  fi

  _gum_style_box "PathMemos Open 部署向导\n\n在本地或服务器一键部署私有化日记后端。"

  ui_section "[1/4] AI 服务配置"
  local AI_PROVIDER AI_API_KEY AI_BASE_URL AI_MODEL
  AI_PROVIDER=$(_gum_input --placeholder "AI Provider" --value "${AI_PROVIDER:-deepseek}")
  AI_API_KEY=$(_gum_input --placeholder "AI API Key" --password)
  if [[ -z "$AI_API_KEY" ]]; then
    ui_error "AI API Key 不能为空"
    exit 1
  fi
  AI_BASE_URL=$(_gum_input --placeholder "AI Base URL" --value "${AI_BASE_URL:-https://api.deepseek.com}")
  AI_MODEL=$(_gum_input --placeholder "AI Model" --value "${AI_MODEL:-deepseek-chat}")

  ui_section "[2/4] 地图服务配置"
  local TENCENT_MAP_KEY
  TENCENT_MAP_KEY=$(_gum_input --placeholder "腾讯地图 Key")
  if [[ -z "$TENCENT_MAP_KEY" ]]; then
    ui_error "腾讯地图 Key 不能为空"
    exit 1
  fi

  # 这些值会原样写入 .env 并被 shell source：拒绝空白、引号、$、反引号、&、#，
  # 防止 source .env 解析失败、截断或注入命令执行
  local bad_re="[[:space:]\"'\`\$&#]" v
  for v in AI_PROVIDER AI_API_KEY AI_BASE_URL AI_MODEL TENCENT_MAP_KEY; do
    if [[ "${!v}" =~ $bad_re ]]; then
      ui_error "$v 含有非法字符（不允许空白、引号、\$、反引号、&、#），请重新运行本脚本"
      exit 1
    fi
  done

  ui_section "[3/4] 生成安全密钥"
  local DB_PASSWORD REDIS_PASSWORD OPEN_API_KEY
  DB_PASSWORD=$(openssl rand -hex 16)
  REDIS_PASSWORD=$(openssl rand -hex 16)
  OPEN_API_KEY=$(openssl rand -hex 32)

  ui_section "[4/4] 确认部署计划"
  ui_kv "AI Provider" "$AI_PROVIDER"
  ui_kv "AI Base URL" "$AI_BASE_URL"
  ui_kv "AI Model" "$AI_MODEL"
  ui_kv "腾讯地图 Key" "${TENCENT_MAP_KEY:0:8}..."
  if ! _gum_confirm "确认开始部署？"; then
    ui_info "已取消"
    exit 0
  fi

  cat > .env <<EOF
DB_PASSWORD=${DB_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
OPEN_API_KEY=${OPEN_API_KEY}
AI_API_KEY=${AI_API_KEY}
AI_PROVIDER=${AI_PROVIDER}
AI_BASE_URL=${AI_BASE_URL}
AI_MODEL=${AI_MODEL}
TENCENT_MAP_KEY=${TENCENT_MAP_KEY}
API_HOST=http://localhost
# ↑ API_HOST 由 expose.sh 或 install.sh 在配置 Cloudflare Tunnel 后自动更新为公网 HTTPS 地址。
# 小程序要求 HTTPS 资源，部署后务必运行 ./scripts/expose.sh 设置正确的 API_HOST。
MCP_PUBLIC_URL=
WORKER_SECRET=
CLOUDFLARE_TUNNEL_TOKEN=
TRUSTED_PROXY_CIDR=172.16.0.0/12,10.0.0.0/8,192.168.0.0/16,127.0.0.0/8
DEPLOYMENT_MODE=open
LOG_LEVEL=INFO
EOF
  chmod 600 .env
  ui_success "环境变量已写入 .env"
}

start_services() {
  source .env

  mkdir -p uploads
  chmod 755 uploads
  chown -R 1000:1000 uploads 2>/dev/null || sudo chown -R 1000:1000 uploads 2>/dev/null || true

  ui_section "启动服务"

  ui_info "启动 PostgreSQL 和 Redis..."
  if ! docker compose up -d postgres redis; then
    ui_error "PostgreSQL / Redis 启动失败"
    ui_info "请检查: docker compose logs postgres redis"
    exit 1
  fi
  ui_success "数据库已启动"

  ui_info "启动 PathMemos 应用、Nginx 和备份服务..."
  if ! docker compose up -d app nginx backup; then
    ui_error "应用 / Nginx / 备份服务启动失败"
    ui_info "请检查: docker compose logs app nginx backup"
    exit 1
  fi
  ui_success "应用与备份服务已启动"
}

show_summary() {
  source .env
  ui_section "部署完成"
  _gum_style_box "PathMemos Open 已就绪\n\n本地访问: http://localhost\nOpen API Key: ${OPEN_API_KEY}\n\ninstall.sh 会自动继续配置 Cloudflare Tunnel。"
  ui_warn "API_HOST 当前为 http://localhost，文件 URL 暂不可用于小程序"
  ui_info "请继续运行 install.sh 或 ./scripts/expose.sh 配置 Cloudflare Tunnel 获得公网 HTTPS 地址"
}

# ---------- 主流程 ----------
check_docker
load_or_create_env
start_services
show_summary
