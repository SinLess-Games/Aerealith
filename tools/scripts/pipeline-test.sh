#!/usr/bin/env bash
set -euo pipefail
workspace=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
fixture=$(mktemp -d /tmp/aerealith-pipeline-test.XXXXXX)
trap 'rm -rf -- "$fixture"' EXIT
mkdir -p "$fixture/raw"
printf '%s\n' 'The first document explains HTTP caching and cache validation for websites.' > "$fixture/raw/first.txt"
printf '%s\n' 'The second document discusses mathematics and arithmetic in simple language.' > "$fixture/raw/second.txt"
cat > "$fixture/training.json" <<'JSON'
{"steps":2,"batch_size":1,"accumulation_steps":1,"sequence_length":16,"warmup_steps":1,"checkpoint_interval":1,"validation_interval":1,"validation_batches":1}
JSON
cat > "$fixture/tokenizer.json" <<'JSON'
{"vocab_size":260,"min_frequency":2}
JSON
export OMP_NUM_THREADS=1
bash "$workspace/tools/scripts/pipeline.sh" --skip-download --root "$fixture" --training-config "$fixture/training.json" --tokenizer-config "$fixture/tokenizer.json" --model-config "$workspace/apps/aerealith-core/configs/model-tiny.json" --prompt Hello
test -s "$fixture/checkpoints/latest.pt"
test -s "$fixture/shards/manifest.sqlite"
test -s "$fixture/eval/shards/manifest.sqlite"
test -s "$fixture/eval/evaluation.log"
echo 'Pipeline integration test passed.'
