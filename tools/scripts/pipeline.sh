#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
set -euo pipefail
original_args=("$@")
workspace=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$workspace"
app="$workspace/apps/aerealith-core"
data_root="${AEREALITH_DATA_ROOT:-$workspace/data}"
training_config="$app/configs/training.json"
tokenizer_config="$app/configs/tokenizer.json"
model_config=""
prompt="Once upon a time"
skip_download=false
allow_download_failures=false
dry_run=false
while (($#)); do
  case "$1" in
    --root|--training-config|--tokenizer-config|--model-config|--prompt)
      (($# >= 2)) && [[ "$2" != --* ]] || { echo "Missing value for $1" >&2; exit 2; }
      case "$1" in
        --root) data_root="$2";;
        --training-config) training_config="$2";;
        --tokenizer-config) tokenizer_config="$2";;
        --model-config) model_config="$2";;
        --prompt) prompt="$2";;
      esac
      shift 2;;
    --skip-download|--skip-download=true) skip_download=true; shift;;
    --allow-download-failures|--allow-download-failures=true) allow_download_failures=true; shift;;
    --dry-run|--dry-run=true) dry_run=true; shift;;
    --help|-h)
      cat <<'HELP'
Usage: bash tools/scripts/pipeline.sh [options]
Download -> process -> train/eval split -> tokenizer -> shards -> train -> evaluate -> generate.
  --root PATH                Data root (default: repository data/)
  --training-config PATH     Training settings
  --model-config PATH        Override model architecture
  --tokenizer-config PATH    Tokenizer training settings
  --prompt TEXT              Generation prompt
  --skip-download            Use existing raw downloads
  --allow-download-failures  Continue with available downloads
  --dry-run                  Print commands without running or writing files
Completed stages are reused; training resumes latest.pt.
Changed split inputs require a fresh data root. NixOS enters nix-shell automatically.
HELP
      exit 0;;
    *) echo "Unknown option: $1" >&2; exit 2;;
  esac
done
if [[ -f /etc/NIXOS && -z "${IN_NIX_SHELL:-}" ]] && ! "$dry_run"; then
  command -v nix-shell >/dev/null || { echo "NixOS requires nix-shell" >&2; exit 1; }
  printf -v nix_command '%q ' bash "$workspace/tools/scripts/pipeline.sh" "${original_args[@]}"
  exec nix-shell "$workspace/shell.nix" --run "$nix_command"
fi
for name in data_root training_config tokenizer_config model_config; do
  if [[ -n "${!name}" && "${!name}" != /* ]]; then printf -v "$name" '%s' "$workspace/${!name}"; fi
done
export AEREALITH_DATA_ROOT="$data_root"
export npm_config_manage_package_manager_versions=false
run() {
  printf '\n[pipeline]'; printf ' %q' "$@"; printf '\n'
  if ! "$dry_run"; then "$@"; fi
}
nx() { run pnpm exec nx run "$@"; }
helper() { nx @aerealith-ai/source:pipeline-config -- "$@"; }
if ! "$dry_run"; then
  for tool in pnpm uv flock; do command -v "$tool" >/dev/null || { echo "Missing required tool: $tool" >&2; exit 1; }; done
  mkdir -p "$data_root"
  exec 9>"$data_root/.pipeline.lock"
  flock -n 9 || { echo "Another pipeline is using this data root" >&2; exit 1; }
fi
nx aerealith-core:install
if ! "$skip_download"; then
  if ! nx @aerealith-ai/source:download-data -- --all --include-disabled --accept-licenses --root "$data_root" --max-mb 102400 --timeout-ms 300000 --retries 6; then
    if ! "$allow_download_failures"; then
      echo "Downloads failed. Fix access or use --allow-download-failures." >&2
      exit 1
    fi
  fi
fi
nx @aerealith-ai/source:process-raw-data -- --root "$data_root"
helper split --root "$data_root"
split="$data_root/pipeline/split"
tokenizer="$data_root/tokenizer/tokenizer.json"
if [[ ! -f "$tokenizer" ]] || "$dry_run"; then
  nx aerealith-core:tokenizer-train -- --input "$split/train" --output "$tokenizer" --config "$tokenizer_config"
else
  nx aerealith-core:tokenizer-inspect -- --tokenizer "$tokenizer"
fi
configure=(configure --root "$data_root" --training-config "$training_config")
if [[ -n "$model_config" ]]; then configure+=(--model-config "$model_config"); fi
helper "${configure[@]}"
config="$data_root/pipeline/configs"
nx aerealith-core:tokenize -- --input "$split/train" --output "$data_root/shards" --tokenizer "$tokenizer" --config "$config/tokenize.json" --resume
nx aerealith-core:tokenize -- --input "$split/eval" --output "$data_root/eval/shards" --tokenizer "$tokenizer" --config "$config/tokenize.json" --resume
nx aerealith-core:stats -- --shards "$data_root/shards" --model-config "$config/model.json"
checkpoint="$data_root/checkpoints/latest.pt"
train=(aerealith-core:train -- --config "$config/training.json")
if [[ -f "$checkpoint" ]]; then train+=(--resume "$checkpoint"); fi
nx "${train[@]}"
if "$dry_run"; then
  nx aerealith-core:evaluate -- --checkpoint "$checkpoint" --shards "$data_root/eval/shards" --config "$config/evaluation.json"
else
  nx aerealith-core:evaluate -- --checkpoint "$checkpoint" --shards "$data_root/eval/shards" --config "$config/evaluation.json" | tee "$data_root/eval/evaluation.log"
fi
nx aerealith-core:generate -- --checkpoint "$checkpoint" --tokenizer "$tokenizer" --prompt "$prompt"
printf '\n[pipeline] Model checkpoint: %s\n' "$checkpoint"
