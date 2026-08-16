#!/bin/bash
# PathMemos Open 升级脚本
# 用法: ./scripts/upgrade.sh
#
# 流程：拉取代码 → 备份数据库 → 重建容器 → 健康检查
set -eo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "❌ 找不到 .env 文件"
  exit 1
fi
source .env

BACKUP_FILE="backups/pre_upgrade_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "============================================"
echo "  PathMemos Open 升级"
echo "============================================"

# 1. 拉取代码
echo "[1/4] 拉取最新代码 ..."
# detached HEAD（rollback.sh 切到指定 commit 后）下 git pull 会失败且报错难懂，先给出明确指引。
if ! git symbolic-ref -q HEAD >/dev/null 2>&1; then
  echo "       ❌ 当前处于 detached HEAD（可能由 rollback.sh 造成），请先执行 git checkout open 再升级" >&2
  exit 1
fi
git pull origin open

# 2. 备份
echo "[2/4] 备份数据库 ..."
mkdir -p backups
if ! docker compose ps --status running postgres 2>/dev/null | grep -q postgres; then
  echo "       ❌ postgres 容器未运行，无法备份，请先启动服务" >&2
  exit 1
fi
docker compose exec -T postgres pg_dump -U papafeiji papafeiji | gzip > "${BACKUP_FILE}"
echo "       备份完成: ${BACKUP_FILE}"

# 3. 重建
echo "[3/4] 拉取基础镜像并重建容器（migration 由 app 自动执行）..."
docker compose pull --ignore-buildable 2>/dev/null || docker compose pull || true
docker compose up -d --build

# 4. 健康检查
echo "[4/4] 等待服务就绪 ..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${NGINX_HTTP_PORT:-80}/health" > /dev/null 2>&1; then
    echo "       ✅ 升级成功，服务已就绪"
    exit 0
  fi
  sleep 2
done

echo "       ⚠ 健康检查超时，请检查日志："
echo "         docker compose logs app --tail 50"
echo ""
echo "   如需回滚，执行："
echo "     ./scripts/rollback.sh"
exit 1
