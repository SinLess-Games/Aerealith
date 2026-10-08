# Training data downloads

## Full model pipeline

```sh
# The script enters nix-shell automatically on NixOS when needed.
bash tools/scripts/pipeline.sh --prompt "Explain HTTP caching"
# Equivalent Nx entry point:
pnpm exec nx run @aerealith-ai/source:pipeline -- --prompt "Explain HTTP caching"
```

This downloads every configured file, processes completed raw data, creates a
separate document-level evaluation split, trains a tokenizer from training data,
creates train/evaluation token shards, trains the model, evaluates it, and generates
sample text. The final model checkpoint is `data/checkpoints/latest.pt`.
Evaluation output is saved to `data/eval/evaluation.log`.
Runtime configuration lives under `data/pipeline/configs`; the model vocabulary is
matched to the actual trained tokenizer. Default training uses the 312M model
configuration and 1,000 optimizer steps from the core training settings.

Use `--skip-download` for existing downloads, `--root PATH` for an independent run,
or `--training-config PATH`, `--model-config PATH`, and `--tokenizer-config PATH`
for custom training. `--dry-run` prints the commands without doing work.
Downloads and processing failures stop the pipeline. `--allow-download-failures`
explicitly permits proceeding with available downloads; it does not suppress
processing failures. Existing tokenizer/shards are reused and training resumes
the latest checkpoint. Run only one pipeline per data root. Changed processed
corpora or checkpoint configurations require a fresh data root.

The split requires at least two accepted distinct records, and both sets need
enough tokens for the configured training sequence length. About 5% of documents
are assigned to evaluation. Splitting creates an additional processed copy on
disk; raw and original processed files are retained. Full-model training can take
substantial time and memory. The pipeline downloads catalog entries, not all
shards of every upstream dataset.

## Processing raw files

Process completed downloads into the core's normalized, deduplicated training
JSONL with its SQLite resume manifest:

```sh
# On NixOS, enter nix-shell first.
pnpm exec nx run @aerealith-ai/source:process-raw-data
```

Defaults are repository `data/raw` and `data/processed`, or the corresponding
directories under `AEREALITH_DATA_ROOT`. `--resume` is enabled by default. Use
`--root PATH`, `--input PATH`, `--output PATH`, `--config PATH`, or `--workers N`
to override them; `--dry-run` prints the invocation without modifying files.
`--force` rebuilds the processed output and deduplication state.

The target installs locked optional `raw` and `pdf` dependencies using uv. It
reads Parquet text columns and compressed JSONL (`.gz`, `.bz2`, `.zst`), extracts
Wikipedia page titles/wikitext and PubMed titles/abstracts, and preserves
Wikidata N-Triples as text. Existing plain-text and structured readers also apply.
Wikipedia markup is retained; this is not a markup-to-prose renderer. Metadata-only
Stack V2 Parquet files fail with a source failure instead of becoming training
prose. Failed sources are recorded in `data/processed/report.json` and the command
exits nonzero; completed sources can be reused on the next run. Partial downloads
(`.part` and `.part.json`) and symlinks are ignored.

Processing streams records rather than loading entire corpora; XML documents and
Parquet batches still consume memory proportional to their record sizes. Large
corpora require substantial output disk space. Raw downloads are retained.

```sh
pnpm exec nx run @aerealith-ai/source:process-raw-data-test
```

## Downloading

Run from the repository root. Files are stored under `data/raw/<extension>/`;
checksums and provenance are recorded in `data/manifests/downloads.jsonl`.

Check publisher links without downloading:

```sh
pnpm exec nx run @aerealith-ai/source:download-data -- --all --check
```

Download every configured file, retaining completed files and resuming partials:

```sh
pnpm exec nx run @aerealith-ai/source:download-data -- \
  --all --include-disabled --accept-licenses \
  --max-mb 102400 --timeout-ms 300000 --retries 6
```

`--all` selects every catalog entry. Most large dataset entries select **one
shard**, not every file in the upstream corpus. For example, FineWeb samples,
OpenWebMath, arXiv, PubMed, and Stack have additional upstream files. Stack V2
shards contain metadata and require separate source-content retrieval. Downloaded
Parquet, compressed XML, and RDF also require extraction before text ingestion.

For gated Hugging Face repositories, accept access terms on the repository page
and export a read token as `HF_TOKEN` (or `HUGGING_FACE_HUB_TOKEN`) locally before
running Nx. The downloader also reads the Hugging Face login token from
`HF_TOKEN_PATH`, or `HF_HOME/token` (default `~/.cache/huggingface/token`).
Never commit or paste tokens. A 401 can also mean a repository is no
longer publicly available: SlimPajama's original publisher endpoint currently
returns 401 even for its public metadata API; a token is not guaranteed to fix it.
The downloader reports these failures and continues with the other sources.

The Wikimedia entries use the your.org mirror. Latest dump URLs change over time;
the download manifest records the checksum of the bytes actually downloaded.
Do not resume a partial from a different URL by editing its metadata. Files over
`--max-mb` are refused; increase the limit deliberately if needed.

Run downloader regression tests:

```sh
pnpm exec nx run @aerealith-ai/source:download-data-test
```
