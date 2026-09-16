#!/usr/bin/env bash
set -euo pipefail

# 按手机号补发 VIP 天数（客服补偿 / 运营发放）。
# 在目标服务器部署目录（含 docker-compose.yml，如 /opt/papafeiji）下运行。
#
# 用法：
#   scripts/grant_vip_by_phone.sh --phone <手机号> --days <天数> [--memo "<备注>"]
#
# 示例：
#   scripts/grant_vip_by_phone.sh --phone 15024426268 --days 30 --memo "客服补偿"
#
# 语义与后端 vip.Service.ExtendVIPDaysWithTx 一致：
#   base      = GREATEST(now, 当前 expire_time)
#   新到期    = base + days 天（begin_time 保持不变，GREATEST 防并发缩短）
# 注意：重复执行会再次累加天数（与后端接口一致，非幂等）。

PHONE=""
DAYS=""
MEMO=""

usage() {
  sed -n '2,14p' "$0"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --phone) PHONE="${2:-}"; shift 2 ;;
    --days) DAYS="${2:-}"; shift 2 ;;
    --memo) MEMO="${2:-}"; shift 2 ;;
    --help|-h) usage; exit 0 ;;
    *) echo "错误：未知参数 $1" >&2; echo "用法：$0 --phone <手机号> --days <天数> [--memo "备注"]" >&2; exit 1 ;;
  esac
done

if [[ -z "$PHONE" || -z "$DAYS" ]]; then
  echo "错误：--phone 与 --days 必填" >&2
  exit 1
fi
if ! [[ "$PHONE" =~ ^1[3-9][0-9]{9}$ ]]; then
  echo "错误：手机号格式不正确：${PHONE}" >&2
  exit 1
fi
if ! [[ "$DAYS" =~ ^[0-9]+$ ]] || [[ "$DAYS" -le 0 ]]; then
  echo "错误：--days 必须为正整数" >&2
  exit 1
fi

if [[ ! -f docker-compose.yml ]]; then
  echo "错误：请在部署目录（含 docker-compose.yml，如 /opt/papafeiji）下运行" >&2
  exit 1
fi

PSQL=(docker compose exec -T postgres psql -U papafeiji -d papafeiji)

echo "==> 查找用户：phone=${PHONE}"
USER_ID=$("${PSQL[@]}" -tA -c "SELECT id FROM users WHERE phone_number = '${PHONE}'")
if [[ -z "$USER_ID" ]]; then
  echo "错误：手机号 ${PHONE} 对应的用户不存在" >&2
  exit 1
fi
echo "    user_id=${USER_ID}"

echo "==> 补发 VIP：days=${DAYS} memo=${MEMO:-<无>}"
"${PSQL[@]}" -v ON_ERROR_STOP=1 <<SQL
INSERT INTO user_vips (id, user_id, begin_time, expire_time, created_at)
VALUES (
  gen_random_uuid()::text,
  '${USER_ID}',
  now(),
  GREATEST(now(), COALESCE((SELECT expire_time FROM user_vips WHERE user_id = '${USER_ID}'), now())) + INTERVAL '${DAYS} days',
  now()
)
ON CONFLICT (user_id) DO UPDATE SET
  begin_time = user_vips.begin_time,
  expire_time = GREATEST(user_vips.expire_time, EXCLUDED.expire_time)
RETURNING user_id, begin_time, expire_time;
SQL

LOG_DIR="logs"
mkdir -p "$LOG_DIR"
echo "$(date '+%Y-%m-%dT%H:%M:%S%z') | grant_vip_by_phone | phone=${PHONE} user_id=${USER_ID} | days=${DAYS} | memo=${MEMO:-<无>}" >> "$LOG_DIR/grant-vip.log"
echo "==> 完成，已记录到 ${LOG_DIR}/grant-vip.log"
