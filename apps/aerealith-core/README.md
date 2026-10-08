# Aerealith Core

A local PyTorch decoder-only language model, safe document ingestion, byte BPE
training, resumable token shards, single-device training, evaluation and inference.
This project was generated with `@nxlv/python:uv-project` 23.0.0.

## Installation and Nx commands

Use the repository's Node 26.5.0 and pnpm 11.13.1, plus uv and Python 3.12.
On NixOS, enter `nix-shell` from the repository root first. The supplied
`shell.nix` selects native Python 3.12 and supplies the C++/zlib libraries needed
by PyTorch wheels. It uses your installed Node and pnpm; pnpm's automatic binary
download is disabled in this shell. Nixpkgs comes from your configured channel.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm exec nx run aerealith-core:install
pnpm exec nx run-many --projects=aerealith-core --targets=lint,typecheck,test,format-check,build
pnpm exec nx show project aerealith-core --json
pnpm exec nx run aerealith-core:smoke
```

The Python lockfile is local to this project. The existing affected-project CI
installs this project’s Python dependencies before running Nx validation. `install` includes the optional PDF
reader for the tests; ordinary usage can use `uv sync --frozen` without `--extra pdf`.
The default torch source is the CPU wheel index. For CUDA, change the explicit
`pytorch-cpu` index in `pyproject.toml` to the appropriate official CUDA wheel
index, relock with `uv lock`, and run `uv sync`. Verify
`uv run python -c 'import torch; print(torch.cuda.is_available())'` before training.
Do not assume a CPU wheel will use a GPU.

All commands below run from the repository root. Nx runs Python with
`apps/aerealith-core` as its working directory. Therefore configuration filenames
and relative paths inside configurations resolve against that project directory.
The default data root is `/mnt/aerealith/Aerealith/data` (repository-root `data/`).
Training defaults use `../../data/` relative to the Nx project working directory;
paths remain configurable. Never commit corpus data,
tokenizers, binary shards, checkpoints, or virtual environments.

Available targets: `build`, `test`, `lint`, `typecheck`, `format`, `format-check`,
`install`, `lock`, `sync`, `add`, `update`, `remove`, `ingest`, `tokenizer-train`,
`tokenizer-inspect`, `tokenize`, `inspect`, `stats`, `train`, `evaluate`, `generate`,
`smoke`.
Corpus/training commands disable Nx caching because outputs live on external disks
and resumed jobs must execute. `format` writes; `format-check` does not.
Arguments pass directly to Nx run-command targets:

```sh
pnpm exec nx run aerealith-core:stats --model-config=configs/model-312m.json --target=25
```

## Architecture and parameter counts

The default preset has a vocabulary of 32,768, 24 decoder blocks, hidden dimension
1,024, 16 query heads, 8 KV heads (64 dimensions each), and SwiGLU intermediate
size 2,816. Context length is 8,192. Blocks use RMSNorm before attention and FFN,
RoPE on query/key vectors, causal PyTorch SDPA, residual connections, configurable
dropout, and bias-free linear layers. Input and output embeddings are tied.
Gradient checkpointing is enabled in the 312M preset. No positional embeddings,
retrieval database, or hosted model is embedded in the Transformer.

For vocabulary `V`, hidden width `D`, FFN width `F`, layers `L`, and KV projection
width `K = kv_heads * D / heads`, trainable parameters are:

```text
V*D + L*(2*D*D + 2*D*K + 3*D*F + 2*D) + D
```

Untied embeddings add another `V*D`. More layers grow the block term linearly;
wider hidden dimensions grow attention quadratically; wider FFNs grow `3*D*F`;
more KV heads increase `2*D*K`. Context length changes activation/storage cost,
not parameter count. RoPE buffers are not trainable. Every run prints the actual
parameter count before training. `stats` constructs the model on PyTorch's meta
device and checks that the analytical count matches the real module parameters.
The verified default count is **316,720,128 parameters**, 1.30% above the previous
312,656,896 target. The FFN uses the usual SwiGLU width of approximately `8*D/3`,
rounded up to a multiple of 256 (2,816), rather than tuning dimensions to reproduce
an unexplained historical count.

Presets include `model-312m.json`, `model-500m.json`, `model-750m.json`,
`model-1b.json` and `model-tiny.json`. Names describe approximate sizes; the actual
count is computed from architecture. When tokenizer training produces fewer than
the requested number of merges, update `vocab_size` to its _actual_ vocabulary
size. Training rejects mismatched tokenizers/vocabularies before constructing
an expensive model.

## Directory structure and storage

```text
aerealith_core/
  config.py             validated typed settings
  model.py              RMSNorm, RoPE, attention, SwiGLU, Transformer
  data/
    loaders/            safe suffix registry and format readers
    discovery.py        deterministic bounded traversal
    quality.py          normalization, filters, near-dedup protocol
    pipeline.py         per-source manifest transactions and exact dedup
  tokenizer.py          local byte-level BPE
  shards.py             binary shard publication and statistics
  dataset.py            bounded-LRU memory maps, cross-shard sequences
  training.py           sampler, optimization, evaluation, checkpoints
  generation.py         sampling CLI backend
  retrieval.py          provider-independent future RAG contract
  observability.py      structured numeric JSON events
  cli.py                user commands
configs/                model, tokenizer, preprocessing, training, eval, generation
tests/                  tiny fixtures constructed at runtime
```

Created repository-root layout:

```text
data/raw/   data/processed/   data/tokenizer/   data/shards/
data/manifests/   data/checkpoints/
data/eval/raw/    data/eval/processed/    data/eval/shards/
```

Manifests live beside their output artifacts so moving a directory does not
separate publication state from shards. Keep processed manifests available for
leakage checks. They contain the configured corpus root but no document contents
in failure messages; training records contain opaque source IDs rather than paths.

Full binary shards store 16,777,216 little-endian uint32 tokens, **64 MiB** each.
15 billion tokens need approximately **60 GB** decimal for token files alone.
Keep raw data, processed JSONL, SQLite dedup indexes, token shards and checkpoints
in your capacity plan. Atomic replacement temporarily needs room for both versions
of a tail/checkpoint. FP32 model weights cost about 1.25 GB at 313M parameters;
AdamW states, gradients and activations need substantially more. An 8,192-token
context is an initial target, not a promise that every GPU can train it. Reduce
context/batch size and use checkpointing on limited hardware.

## Adding data and supported formats

Keep training and evaluation source directories separate **before** preprocessing.
Train the tokenizer on the training corpus only. Input is untrusted: readers never
execute code, SQL, YAML objects, macros, external links or embedded references.

Supported document suffixes: `.txt`, `.md`, `.rst`, `.pdf`, `.csv`, `.tsv`, `.yaml`,
`.yml`, `.json`, `.jsonl`, `.ndjson`, `.sql`, `.xml`, `.html`, `.htm`, `.log`.
Supported source/config suffixes: `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.java`, `.c`,
`.h`, `.cpp`, `.hpp`, `.cs`, `.go`, `.rs`, `.rb`, `.php`, `.sh`, `.bash`, `.zsh`,
`.ps1`, `.nix`, `.toml`, `.ini`, `.conf`, `.css`, `.scss`, `.graphql`, `.proto`,
`.tf`, `.hcl`, `.dockerfile`, plus extensionless `Dockerfile`.

Text/code/SQL/log readers preserve indentation and stream bounded blocks. CSV/TSV
preserve headers and emit row objects; JSONL/NDJSON emit one nested record per line;
JSON top-level arrays stream items; other JSON, YAML, HTML and XML are size bounded.
YAML uses safe loading. XML uses DefusedXML and preserves tags/attributes/children.
HTML removes script/style/navigation text. PDFs extract actual page text, with no
OCR; encrypted or image-only PDFs need separate preparation. Unsupported formats
and parser errors appear in `report.json` and SQLite, and make ingestion exit 1.
Quality rejection counts are explicit. Corpus contents are never emitted in logs.
Readers accept UTF-8 (including BOM); other encodings fail explicitly.

```sh
pnpm exec nx run aerealith-core:ingest --input=/mnt/aerealith/Aerealith/data/raw --output=/mnt/aerealith/Aerealith/data/processed --config=configs/preprocessing.json --workers=2 --resume
```

Default normalization is NFKC, trailing whitespace cleanup, empty/short rejection
(minimum 20 characters), printable ratio filtering, binary NUL rejection, and
SQLite-backed SHA-256 exact dedup. NFKC may change code identifiers; choose NFC
when exact Unicode code semantics matter. Structured parser/record limit defaults
to 8 MiB; text files can exceed it by streaming blocks. Increasing the parser cap
increases memory requirements. JSON array item sizes are checked before parser allocation;
JSONL is preferable for untrusted very large structured datasets.

## Processing recovery and safety

A per-output advisory lock prevents competing writers. SQLite uses WAL and FULL
synchronization. Ingestion fingerprints files with SHA-256, records size/mtime,
status, records, rejected/duplicate counts, output checksum, error type and
completion time. Records/dedup commit only after a temporary JSONL is validated,
fsynced, renamed, and the parent directory fsynced. Readers consume only committed
outputs. Interrupted work is retried; completed valid outputs are skipped.

`--resume` verifies fingerprints/checksums; it does not trust filenames alone.
Appending new source files is supported. Changed completed source files require
`--force`, because earlier dedup decisions affect later records. `--force` rebuilds
only the specified output directory. Workers parallelize a bounded fingerprint
window; parsing and dedup commits stay deterministic and serial.

Tokenization writes checksummed unique binary/JSON pairs, then atomically commits
the source and shard metadata in SQLite. A partial tail is persisted at each source
boundary and copied into a bounded buffer on resume. Full shards remain untouched.
Uncommitted orphan shards are cleaned on restart; source changes and tokenizer or
config changes are rejected. Recovery granularity is **one source file**: after
an interruption the in-progress source is retried, not the whole corpus. Split
single enormous files into bounded files for finer checkpoints. Resume checksum
verification reads completed files again, but does not parse/tokenize them again.
Keep corpora immutable while jobs run and avoid network filesystems with unreliable
fsync/SQLite/advisory-lock semantics.

## Training and inspecting the tokenizer

Byte BPE uses Hugging Face Tokenizers entirely locally. All 256 bytes are in the
initial alphabet; PAD/UNK/BOS/EOS IDs are 0/1/2/3. The ByteLevel decoder reconstructs
text. Tokenizer training defaults to a deterministic prefix sample capped at 256 MiB
and 100,000 records to bound vocabulary statistics; set `max_training_bytes` and
`max_training_records` in tokenizer config, or prepare a representative training
subset when corpus ordering would bias this sample. Each record receives BOS and EOS explicitly during tokenization; tokenizer
encoding itself does not silently inject specials. Checkpoint/shard identities
use the SHA-256 of `tokenizer.json` and tokenizer format version.

```sh
pnpm exec nx run aerealith-core:tokenizer-train --input=/mnt/aerealith/Aerealith/data/processed --output=/mnt/aerealith/Aerealith/data/tokenizer/tokenizer.json --config=configs/tokenizer.json
pnpm exec nx run aerealith-core:tokenizer-inspect --tokenizer=/mnt/aerealith/Aerealith/data/tokenizer/tokenizer.json
pnpm exec nx run aerealith-core:tokenize --input=/mnt/aerealith/Aerealith/data/processed --output=/mnt/aerealith/Aerealith/data/shards --tokenizer=/mnt/aerealith/Aerealith/data/tokenizer/tokenizer.json --config=configs/tokenization.json --resume
pnpm exec nx run aerealith-core:inspect --shards=/mnt/aerealith/Aerealith/data/shards
pnpm exec nx run aerealith-core:stats --shards=/mnt/aerealith/Aerealith/data/shards --model-config=configs/model-312m.json --target=25
```

Shard metadata includes number, count, dtype, checksum, tokenizer identity,
sequence length, pipeline version, full/partial status. Reports count documents,
records, tokens, shards, full shards and partial tail. Structured progress includes
processed/total documents, tokens, current/completed shards and throughput.

`tokens_per_parameter = unique_available_training_tokens / trainable_parameters`.
This measures corpus budget; `tokens_seen` separately measures optimization tokens,
including repeated epochs. `stats --target=20` or `--target=25` computes required
and additional tokens and `ceil(tokens / tokens_per_shard)` shard counts. The
example 15 billion / 312,656,896 is approximately 47.98 tokens per parameter.

## Starting and resuming training

Edit `configs/training.json` to use your absolute paths and hardware settings.
The mmap dataset reads across shard boundaries, produces input/next-token targets,
keeps at most eight maps open per process, and supports multiple DataLoader workers.
The seed-based sampler uses an O(1) affine bijection per epoch instead of storing a
corpus-sized permutation. Samples are reproducible across worker counts.

Training implements AdamW, warmup/cosine decay, gradient accumulation/clipping,
CUDA BF16 where supported, FP16/scaler fallback, CPU FP32, validation, reproducible
seeds, step loss/perplexity, tokens/sec, timing, LR and GPU allocated-memory metrics.
Effective batch size is `batch_size * accumulation_steps`. Sequence length can be
lower than the model context. Checkpoints publish `latest.pt` atomically at configured
intervals and at the final step.

```sh
pnpm exec nx run aerealith-core:train --config=configs/training.json
pnpm exec nx run aerealith-core:train --config=configs/training.json --resume=/mnt/aerealith/Aerealith/data/checkpoints/latest.pt
```

Checkpoints contain model, optimizer, scheduler, scaler, step, tokens seen, consumed
batch position, Python/NumPy/Torch/CUDA RNG state, model/training configuration,
tokenizer identity and dataset identity. Resuming rejects changed schedules,
corpora or architectures. Output location, device and worker count may change.
Keep the original planned step count when resuming an interrupted run. Corpus
checkpoints never use pickle; model checkpoints load with `weights_only=True`.
Only use checkpoints you own or trust; no serialization format eliminates all
resource-exhaustion risks.

## Evaluation and generation

Create a separate evaluation corpus and process/tokenize it using the **same trained
tokenizer** and separate output directories. Evaluation rejects identical directories,
shared shard checksums and shared normalized document hashes. Keep training and
evaluation processed manifests accessible; evaluation refuses to skip leakage checks.
This detects exact overlap, not semantic near duplicates. Evaluation returns
weighted token loss, perplexity, token count and token accuracy.

```sh
pnpm exec nx run aerealith-core:ingest --input=/mnt/aerealith/Aerealith/data/eval/raw --output=/mnt/aerealith/Aerealith/data/eval/processed --resume
pnpm exec nx run aerealith-core:tokenize --input=/mnt/aerealith/Aerealith/data/eval/processed --output=/mnt/aerealith/Aerealith/data/eval/shards --tokenizer=/mnt/aerealith/Aerealith/data/tokenizer/tokenizer.json --resume
pnpm exec nx run aerealith-core:evaluate --checkpoint=/mnt/aerealith/Aerealith/data/checkpoints/latest.pt --shards=/mnt/aerealith/Aerealith/data/eval/shards --config=configs/evaluation.json
pnpm exec nx run aerealith-core:generate --checkpoint=/mnt/aerealith/Aerealith/data/checkpoints/latest.pt --tokenizer=/mnt/aerealith/Aerealith/data/tokenizer/tokenizer.json --prompt='Hello, Aerealith.' --max-new-tokens=100 --temperature=0.8 --top-k=50 --top-p=0.95 --seed=42
```

Use `--temperature=0` for greedy generation; repetition penalty is configurable.
Generation uses a sliding context and recomputes attention each token. A KV cache
is a future optimization. A tiny randomly trained model validates the mechanics;
useful language output requires substantial curated data and training.

## Extending loaders, retrieval and observability

A loader accepts `(path, max_bytes)` and yields text records. Add a pure safe reader,
register its suffix with `register_loader`, and add fixtures for valid, malformed,
empty and oversized inputs. Common records include text, opaque source ID, source
type, document content hash, record/chunk ID and pipeline version. Do not emit
absolute paths or document contents in failures. `NearDuplicateIndex` defines an
optional future MinHash/LSH adapter; only exact dedup is implemented today.

Implement `Retriever.retrieve(query, limit=...)` for Qdrant, Cloudflare Vectorize or
another store. `RetrievedContext` carries text, source ID, score and metadata;
`augment_prompt` prepares external context independently of model/training code.
Embedding generation, indexing and citation policy remain separate future work.

JSON events expose preprocessing counts/bytes/failures, tokenization tokens/shards,
training throughput/loss/LR/GPU memory and checkpoint duration. A collector can
convert these numeric fields to OpenTelemetry/Prometheus metrics. There is no
Datadog dependency in this Python project and existing Pyroscope is untouched.

## Troubleshooting and current limits

- Run `install` before Python targets; a frozen lock mismatch requires intentional
  relocking with `uv lock`. The initial dependency installation needs network access.
- NixOS cannot launch generic downloaded ELF binaries by default. Use a Nix Python
  environment with `nix-shell` before running Python targets. PyPI executables such
  as Ruff may additionally require nix-ld or a normal Linux container.
- If Nx reports a missing internal module while constructing the project graph
  after a dependency install, run `pnpm exec nx reset` and retry the target.
- CUDA availability requires CUDA wheels and compatible drivers. CPU FP32 is the
  development fallback; reduce model/context sizes for smoke tests.
- A vocabulary mismatch requires editing model configuration after inspecting the
  actual trained tokenizer. Do not retrain the tokenizer mid-run.
- Corruption fails checksum validation; restore backups or explicitly rebuild.
  Do not remove manifests to force a resume. Back up manifest and output together.
- Parser failures are recorded by opaque source ID and exception class. Inspect raw
  files locally; content is deliberately excluded from logs.
- Parsing is serial, CPU tokenizer training tracks sampled vocabulary statistics in memory,
  and exceptionally large individual JSON/YAML/PDF records need limits or splitting.
  XML/YAML are safe-loaded but still require bounded, curated input.
- Training is single-device; DDP/FSDP, remote checkpoint stores, benchmark suites,
  near-duplicate algorithms, OCR, archive ingestion and RAG adapters are not included.
- The 138 GB corpus and production GPU training were not exercised in local tests;
  tests use small generated fixtures and CPU training. Benchmark your storage and
  tune limits before a full preprocessing run.
