#!/bin/bash
# PathMemos Open 回滚脚本
# 用法:
#   ./scripts/rollback.sh              # 回滚到上一个发布版本（open 分支每次发布为单个 commit，默认 HEAD~1）
#   ./scripts/rollback.sh <commit>     # 回滚到指定 commit/tag
#
# 流程：备份数据库 → 切换代码 → 重建并启动 → 健康检查 →
#       如有需要，手动执行对应 migration 的 down 脚本并重新启动
set -eo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "❌ 找不到 .env 文件"
  exit 1
fi
source .env

TARGET="${1:-HEAD~1}"
BACKUP_FILE="backups/pre_rollback_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "============================================"
echo "  PathMemos Open 回滚"
echo "============================================"
echo ""
echo "  目标版本: ${TARGET}"
echo "  备份文件: ${BACKUP_FILE}"
echo ""

read -rp "确认回滚？数据库将被备份后切换代码 [y/N] " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "已取消"
  exit 0
fi

# 1. 备份
echo "[1/4] 备份数据库 ..."
mkdir -p backups
if ! docker compose ps --status running postgres 2>/dev/null | grep -q postgres; then
  echo "       ❌ postgres 容器未运行，无法备份，请先启动服务" >&2
  exit 1
fi
docker compose exec -T postgres pg_dump -U papafeiji papafeiji | gzip > "${BACKUP_FILE}"
echo "       备份完成: ${BACKUP_FILE}"

# 2. 切换代码
echo "[2/4] 切换代码 → ${TARGET}"
# 浅克隆（install.sh 用 git clone --depth 1）没有历史版本，checkout 前先校验目标可解析
if ! git rev-parse --verify --quiet "${TARGET}^{commit}" >/dev/null; then
  echo "       ❌ 目标版本 ${TARGET} 不存在"
  if [[ "$(git rev-parse --is-shallow-repository 2>/dev/null)" == "true" ]]; then
    echo "       当前仓库为浅克隆（--depth 1），没有历史版本可回滚"
    echo "       可执行 git fetch --unshallow 拉取完整历史后重试"
  else
    echo "       请用 git log --oneline 查看可用版本后重试"
  fi
  exit 1
fi
git checkout "${TARGET}"

# checkout 到具体 commit 会进入 detached HEAD，后续 upgrade.sh 的 git pull 会失败。
# 提醒用户：若之后想继续用 upgrade.sh 升级，需先执行 `git checkout open` 回到分支。
if [[ -z "$(git symbolic-ref HEAD 2>/dev/null)" ]]; then
  echo "  ⚠ 当前处于 detached HEAD 状态，后续执行 upgrade.sh 前请先运行：git checkout open"
fi

# 3. 重建
echo "[3/4] 重建并启动容器 ..."
docker compose up -d --build app nginx postgres redis

# 4. 健康检查
echo "[4/4] 等待服务就绪 ..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:${NGINX_HTTP_PORT:-80}/health" > /dev/null 2>&1; then
    echo "       ✅ 回滚成功，服务已就绪"
    echo ""
    echo "  ⚠ 注意：回滚不会自动执行 migration down。"
    echo "  如果新版 migration 新增了表/字段导致旧代码不兼容，"
    echo "  请从 git 历史取回对应版本的 down 脚本，再手动执行："
    echo "    git show <目标版本>:backend/migrations/XXX.down.sql > /tmp/XXX.down.sql"
    echo "    docker compose exec -T postgres psql -U papafeiji -d papafeiji < /tmp/XXX.down.sql"
    exit 0
  fi
  sleep 2
done

echo "       ⚠ 健康检查超时，请检查日志："
echo "         docker compose logs app --tail 50"
exit 1
