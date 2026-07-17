#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

section() {
  echo -e "\n${YELLOW}=== $1 ===${NC}"
}

##############################################################################
section "Go: defer inside for-loop (leaks timers/connections)"

grep -rn --include='*.go' '^\s*defer\s' "${PROJECT_ROOT}/backend/internal" /dev/null 2>/dev/null | while IFS=: read -r file lnum rest; do
  deferBody=$(sed -n "${lnum}p" "$file" 2>/dev/null || true)
  # Find the enclosing function/lambda start by scanning upwards for the first
  # line with a lower indentation than the defer line, or a func() boundary.
  deferIndent=$(echo "$deferBody" | sed -E 's/^([[:space:]]*).*/\1/' | tr -d '\n' | wc -c)
  inLambda=false
  for ((offset=1; offset<=20 && lnum-offset>0; offset++)); do
    line=$(sed -n "$((lnum-offset))p" "$file" 2>/dev/null || true)
    lineIndent=$(echo "$line" | sed -E 's/^([[:space:]]*).*/\1/' | tr -d '\n' | wc -c)
    if echo "$line" | grep -qE '\bfunc\s*\(' || echo "$line" | grep -qE 'func\s*\('; then
      inLambda=true
      break
    fi
    if [ "$lineIndent" -lt "$deferIndent" ] && echo "$line" | grep -qE '^[[:space:]]*(func\s|for\s|go\s)'; then
      break
    fi
  done
  if [ "$inLambda" = true ]; then
    continue
  fi
  context=$(sed -n "$((lnum-3)),${lnum}p" "$file" 2>/dev/null || true)
  if echo "$context" | grep -q '\bfor\b'; then
    echo -e "  ${RED}$file:$lnum${NC} $deferBody"
  fi
done || true

##############################################################################
section "Go: recover() sites (check for channel notification)"

grep -rn --include='*.go' 'recover()' "${PROJECT_ROOT}/backend/internal" /dev/null 2>/dev/null | grep -v '_test\.go' | while IFS=: read -r file lnum _; do
  ctx=$(sed -n "${lnum},$((lnum+8))p" "$file" 2>/dev/null || true)
  echo -e "  $file:$lnum"
  echo "$ctx" | sed 's/^/    /'
  echo ""
done || true

##############################################################################
section "Go: json.Marshal errors discarded"

grep -rn --include='*.go' 'json\.Marshal(' "${PROJECT_ROOT}/backend/internal" /dev/null 2>/dev/null | grep '_, _' | while read -r line; do
  echo -e "  ${RED}$line${NC}"
done || true

##############################################################################
section "Go: req.Body not wrapped with http.MaxBytesReader"

grep -rn --include='*.go' 'json\.NewDecoder(r\.Body)' "${PROJECT_ROOT}/backend/internal" /dev/null 2>/dev/null | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  lnum=$(echo "$line" | cut -d: -f2)
  prev=$((lnum - 1))
  prevLine=$(sed -n "${prev}p" "$file" 2>/dev/null || true)
  if echo "$prevLine" | grep -q 'MaxBytesReader'; then
    echo -e "  ${GREEN}OK${NC} $line (protected)"
  else
    echo -e "  ${RED}$line${NC} (missing MaxBytesReader)"
  fi
done || true

##############################################################################
section "TS: _addAbort usage (check for aborted guard)"

grep -rn --include='*.ts' '_addAbort' "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | while IFS=: read -r file lnum _; do
  start=$((lnum > 10 ? lnum - 10 : 1))
  ctx=$(sed -n "${start},${lnum}p" "$file" 2>/dev/null || true)
  # Calls to _addAbort are fine; the guard lives inside createCancelToken.
  if echo "$ctx" | grep -qE '_addAbort\s*\('; then
    echo -e "  ${GREEN}OK${NC} $file:$lnum (call site)"
    continue
  fi
  if echo "$ctx" | grep -qE 'interface\s+'; then
    echo -e "  ${GREEN}OK${NC} $file:$lnum (interface definition)"
    continue
  fi
  if echo "$ctx" | grep -qE '(let|const|var)\s+(aborted|_aborted|isAborted|cancelled)'; then
    echo -e "  ${GREEN}OK${NC} $file:$lnum (has aborted guard)"
  elif echo "$ctx" | grep -qE 'isCancelled.*cancelled|cancelled.*isCancelled'; then
    echo -e "  ${GREEN}OK${NC} $file:$lnum (has cancelled state)"
  else
    echo -e "  ${RED}$file:$lnum${NC} (missing aborted guard)"
  fi
done || true

##############################################################################
section "TS: setData called directly (not via _safeSetData)"

grep -rn --include='*.ts' '\.setData(' "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | grep -v '_safeSetData\|_forceSetData\|safeSetData\|\.d\.ts\|miniprogram_npm' | while read -r line; do
  echo -e "  $line"
done || true

##############################################################################
section "General: TODO/FIXME/HACK comments"

grep -rn --include='*.go' --include='*.ts' 'TODO\|FIXME\|HACK' \
  "${PROJECT_ROOT}/backend/internal" "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | while read -r line; do
  echo -e "  $line"
done || true

##############################################################################
section "TS: _submitting guard check (form submit methods)"

grep -rn --include='*.ts' "async submit\b\|\.submit\s*=" "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | while IFS=: read -r file lnum _; do
  fn=$(sed -n "${lnum},$((lnum+50))p" "$file" 2>/dev/null || true)
  hasGuard=$(echo "$fn" | grep -c '_submitting.*return' || true)
  hasSet=$(echo "$fn" | grep -c '_submitting\s*=\s*true' || true)
  if [ "$hasGuard" -gt 0 ] && [ "$hasSet" -gt 0 ]; then
    echo -e "  ${GREEN}OK${NC} $file:$lnum (has _submitting guard)"
  else
    echo -e "  ${RED}$file:$lnum${NC} (missing _submitting guard)"
  fi
done || true

##############################################################################
section "TS: _submitting set before validation (blocks form on invalid input)"

grep -rn --include='*.ts' '_submitting\s*=\s*true' "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | while IFS=: read -r file lnum _; do
  afterContext=$(sed -n "${lnum},$((lnum+20))p" "$file" 2>/dev/null || true)
  beforeTry=$(echo "$afterContext" | sed -n '1,/try {/p' || true)
  hasValidationReturn=$(echo "$beforeTry" | grep -c 'showToast.*return' || true)
  if [ "$hasValidationReturn" -gt 0 ]; then
    echo -e "  ${RED}$file:$lnum${NC} _submitting set BEFORE validation returns → form lock bug"
  else
    echo -e "  ${GREEN}OK${NC} $file:$lnum (no early return before try)"
  fi
done || true

##############################################################################
section "TS: cancelToken overwritten without cancelling previous"

grep -rn --include='*.ts' '_cancelToken\s*=\s*createCancelToken' "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | grep -v '_createCancelToken' | while IFS=: read -r file lnum _; do
  start=$((lnum > 5 ? lnum - 5 : 1))
  ctx=$(sed -n "${start},${lnum}p" "$file" 2>/dev/null || true)
  if echo "$ctx" | grep -qE '_cancelToken.*cancel\s*\('; then
    echo -e "  ${GREEN}OK${NC} $file:$lnum (previous token cancelled)"
  else
    echo -e "  ${RED}$file:$lnum${NC} (overwrites without cancel)"
  fi
done || true

##############################################################################
section "TS: _forceSetData outside onHide/onUnload/detached"

grep -rn --include='*.ts' '_forceSetData' "${PROJECT_ROOT}/frontend/miniapp/miniprogram" /dev/null 2>/dev/null | grep -v 'safeSetData.ts' | while IFS=: read -r file lnum rest; do
  # 跳过纯注释行
  lineBody=$(sed -n "${lnum}p" "$file" 2>/dev/null || true)
  if echo "$lineBody" | grep -qE '^\s*//'; then
    continue
  fi
  start=$((lnum-30))
  if [ "$start" -lt 1 ]; then start=1; fi
  ctx=$(sed -n "${start},${lnum}p" "$file" 2>/dev/null || true)
  # 显式生命周期回调
  if echo "$ctx" | grep -qE '\b(onHide|onUnload|detached)\s*\(' ; then
    continue
  fi
  # pageLifetimes.hide / onPageHide 等隐藏回调
  if echo "$ctx" | grep -qE 'pageLifetimes\s*:' && echo "$ctx" | grep -qE '\bhide\s*\(' ; then
    continue
  fi
  if echo "$ctx" | grep -qE '\bonPageHide\s*\(' ; then
    continue
  fi
  echo -e "  ${RED}$file:$lnum${NC} $rest"
done || true

echo ""
echo -e "${GREEN}Audit complete. Review ${RED}red${GREEN} items above.${NC}"
