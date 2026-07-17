# PathMemos Open UI helper library
# 提供彩色输出和交互式输入，有 gum 时用 gum TUI，无 gum 时回退 read。

if [[ -z "${_PATHMEMOS_UI_LIB_LOADED:-}" ]]; then
_PATHMEMOS_UI_LIB_LOADED=1

BOLD='\033[1m'
ACCENT='\033[38;2;255;77;77m'
INFO='\033[38;2;136;146;176m'
SUCCESS='\033[38;2;0;229;204m'
WARN='\033[38;2;255;176;32m'
ERROR='\033[38;2;230;57;70m'
MUTED='\033[38;2;90;100;128m'
NC='\033[0m'

is_tty() {
  if [[ -t 1 || -t 2 ]]; then return 0; fi
  if [[ -r /dev/tty && -w /dev/tty ]]; then return 0; fi
  return 1
}

ui_info()    { echo -e "${INFO}·${NC} $*"; }
ui_warn()    { echo -e "${WARN}!${NC} $*"; }
ui_success() { echo -e "${SUCCESS}✓${NC} $*"; }
ui_error()   { echo -e "${ERROR}✗${NC} $*"; }
ui_section()  { echo -e "\n${ACCENT}${BOLD}$*${NC}"; }
ui_kv()      { echo -e "${MUTED}$1:${NC} ${BOLD}$2${NC}"; }

bootstrap_gum() {
  if ! is_tty; then GUM=""; return 1; fi
  if command -v gum >/dev/null 2>&1; then GUM="gum"; return 0; fi
  if ! command -v tar >/dev/null 2>&1; then GUM=""; return 1; fi
  local os arch asset base tmpdir gum_path
  os=$(uname -s); arch=$(uname -m)
  case "$os" in Darwin) os="Darwin" ;; Linux) os="Linux" ;; *) GUM=""; return 1 ;; esac
  case "$arch" in x86_64|amd64) arch="x86_64" ;; arm64|aarch64) arch="arm64" ;; *) GUM=""; return 1 ;; esac
  asset="gum_${GUM_VERSION:-0.15.2}_${os}_${arch}.tar.gz"
  base="https://github.com/charmbracelet/gum/releases/download/v${GUM_VERSION:-0.15.2}"
  tmpdir=$(mktemp -d)
  # RETURN trap 自清除，避免函数返回后残留为全局 trap 误删后续函数的同名 local 变量。
  trap "rm -rf \"$tmpdir\"; trap - RETURN" RETURN
  curl -fsSL --retry 2 --connect-timeout 5 --max-time 20 "${base}/${asset}" -o "${tmpdir}/${asset}" 2>/dev/null || { GUM=""; return 1; }
  tar -xzf "${tmpdir}/${asset}" -C "$tmpdir" >/dev/null 2>&1 || { GUM=""; return 1; }
  gum_path=$(find "$tmpdir" -type f -name gum 2>/dev/null | head -n1)
  [[ -z "$gum_path" ]] && { GUM=""; return 1; }
  chmod +x "$gum_path"
  local install_dir="/usr/local/bin"
  if [[ -d "$install_dir" && -w "$install_dir" ]]; then
    cp -f "$gum_path" "${install_dir}/gum" 2>/dev/null && GUM="${install_dir}/gum" && return 0
  fi
  # 无法安装到系统目录时直接使用临时目录中的二进制；
  # 必须取消 RETURN trap，否则函数返回时 tmpdir 被删除导致 GUM 失效（容忍 tmpdir 泄漏）。
  trap - RETURN
  GUM="$gum_path"; return 0
}

_gum_input() {
  local placeholder="" value="" password=""
  while [[ $# -gt 0 ]]; do
    case "$1" in --placeholder) placeholder="$2"; shift 2 ;; --value) value="$2"; shift 2 ;; --password) password=1; shift ;; *) shift ;; esac
  done
  if [[ -n "$GUM" ]]; then
    local args=(input)
    [[ -n "$placeholder" ]] && args+=(--placeholder "$placeholder")
    [[ -n "$value" ]] && args+=(--value "$value")
    [[ -n "$password" ]] && args+=(--password)
    "$GUM" "${args[@]}" < /dev/tty
    return
  fi
  local prompt="${placeholder:-输入}: "
  [[ -n "$value" ]] && prompt="${prompt}[$value] "
  echo -n "$prompt" > /dev/tty
  local answer
  if [[ -n "$password" ]]; then IFS= read -rs answer < /dev/tty; echo "" > /dev/tty
  else IFS= read -r answer < /dev/tty; fi
  echo "${answer:-$value}"
}

_gum_choose() {
  local header="" options=()
  while [[ $# -gt 0 ]]; do
    case "$1" in --header) header="$2"; shift 2 ;; *) options+=("$1"); shift ;; esac
  done
  if [[ -n "$GUM" ]]; then
    "$GUM" choose --header "$header" "${options[@]}" < /dev/tty
    return
  fi
  echo "$header" > /dev/tty
  local i=1 opt
  for opt in "${options[@]}"; do echo "  $i) $opt" > /dev/tty; i=$((i+1)); done
  echo -n "请选择 [1]: " > /dev/tty
  local choice; IFS= read -r choice < /dev/tty
  # 输入非数字或越界时默认选第 1 项（10# 强制按十进制解析，避免 08 被当八进制）
  if [[ "$choice" =~ ^[0-9]{1,3}$ ]] && (( 10#$choice >= 1 && 10#$choice <= ${#options[@]} )); then
    choice=$((10#$choice))
  else
    choice=1
  fi
  echo "${options[choice-1]}"
}

_gum_confirm() {
  local prompt="$1" default=""
  [[ "$2" == "--default" ]] && default="$3"
  if [[ -n "$GUM" ]]; then
    local args=(confirm "$prompt")
    [[ "$default" == "yes" ]] && args+=(--default)
    [[ "$default" == "no" ]] && args+=(--default=false)
    "$GUM" "${args[@]}" < /dev/tty
    return
  fi
  local suffix="[y/N]"; [[ "$default" == "yes" ]] && suffix="[Y/n]"
  echo -n "$prompt $suffix " > /dev/tty
  local answer; IFS= read -r answer < /dev/tty; answer=${answer:-$default}
  [[ "$answer" =~ ^[Yy](es)?$ ]]
}

_gum_spin() {
  local title="$1"; shift
  if [[ -n "$GUM" ]]; then
    "$GUM" spin --spinner dot --title "$title" -- "$@"
    return
  fi
  ui_info "$title ..."
  "$@"
}

_gum_style_box() {
  # 统一把字面 \n 转成真实换行，否则 gum 会原样输出 "\n"
  local text
  text="$(echo -e "$1")"
  if [[ -n "$GUM" ]]; then
    "$GUM" style --border rounded --border-foreground "#ff4d4d" --padding "1 2" "$text" < /dev/tty || echo -e "${ACCENT}${BOLD}$text${NC}"
  else
    echo -e "${ACCENT}${BOLD}$text${NC}"
  fi
}

fi
