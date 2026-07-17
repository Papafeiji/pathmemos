#!/bin/bash
set -euo pipefail

# PathMemos Open 数据备份脚本
# 备份数据库 pg_dump + uploads 目录到本地备份目录，保留最近 N 份。
#
# 用法：./scripts/backup.sh [--keep N] [--output DIR]

cd "$(dirname "$0")/.."

KEEP=${KEEP:-7}
OUTPUT_DIR=${OUTPUT_DIR:-./backups}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --keep) KEEP="$2"; shift 2 ;;
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    *) echo "未知参数: $1" >&2; exit 1 ;;
  esac
done

mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$OUTPUT_DIR/db_$TIMESTAMP.sql.gz"
UPLOADS_BACKUP="$OUTPUT_DIR/uploads_$TIMESTAMP.tar.gz"
# 容器名随 compose 项目名（目录名）变化，动态解析避免硬编码失配
DB_CONTAINER="$(docker compose ps -q postgres 2>/dev/null || true)"
UPLOADS_DIR="./uploads"

# 数据库备份
if [[ -n "$DB_CONTAINER" ]]; then
  echo "备份数据库 -> $DB_BACKUP"
  docker exec "$DB_CONTAINER" pg_dump -U papafeiji papafeiji | gzip > "$DB_BACKUP"
else
  echo "警告：找不到运行中的 postgres 容器，跳过数据库备份" >&2
fi

# uploads 目录备份
if [[ -d "$UPLOADS_DIR" ]]; then
  echo "备份文件 -> $UPLOADS_BACKUP"
  tar czf "$UPLOADS_BACKUP" -C "$(dirname "$UPLOADS_DIR")" "$(basename "$UPLOADS_DIR")"
else
  echo "警告：uploads 目录不存在，跳过文件备份" >&2
fi

# 清理旧备份
if command -v ls &>/dev/null; then
  for prefix in db_ uploads_; do
    ls -1t "$OUTPUT_DIR"/${prefix}* 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r f; do
      echo "删除旧备份: $f"
      rm -f "$f"
    done || true
  done
fi

echo "备份完成（保留最近 $KEEP 份）"
