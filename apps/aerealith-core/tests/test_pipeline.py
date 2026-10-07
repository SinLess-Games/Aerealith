# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

import pytest

from aerealith_core.config import PreprocessConfig, TokenizeConfig
from aerealith_core.data.pipeline import ingest, processed_records
from aerealith_core.dataset import TokenDataset, reject_leakage
from aerealith_core.shards import shard_metadata, tokenize
from aerealith_core.tokenizer import load_tokenizer


def test_ingestion_resume_dedup_failures(tmp_path):
    raw, out = tmp_path / "raw", tmp_path / "out"
    raw.mkdir()
    for name in ("a.txt", "b.md"):
        (raw / name).write_text("Same useful document with structured text")
    (raw / "bad.json").write_text("{")
    report = ingest(raw, out, PreprocessConfig())
    assert (
        report["documents"] == 2
        and report["records"] == 1
        and report["duplicates"] == 1
    )
    assert report["failures"][0]["error_type"] == "JSONDecodeError"
    assert ingest(raw, out, PreprocessConfig(), resume=True)["skipped"] == 2
    records = list(processed_records(out))
    assert str(tmp_path) not in str(records)
    (raw / "a.txt").write_text("Changed document with enough content")
    with pytest.raises(ValueError, match="changed"):
        ingest(raw, out, PreprocessConfig(), resume=True)
    assert ingest(raw, out, PreprocessConfig(), force=True)["records"] == 2


def test_ingestion_interruption_recovery(tmp_path, monkeypatch):
    raw, out = tmp_path / "raw", tmp_path / "out"
    raw.mkdir()
    (raw / "a.txt").write_text("A complete document with enough characters.")
    import aerealith_core.data.pipeline as module

    original = module.checksum
    calls = 0

    def interrupt(path):
        nonlocal calls
        calls += 1
        if calls == 2:
            raise KeyboardInterrupt
        return original(path)

    monkeypatch.setattr(module, "checksum", interrupt)
    with pytest.raises(KeyboardInterrupt):
        ingest(raw, out, PreprocessConfig())
    assert not list(out.glob("*.jsonl"))
    monkeypatch.setattr(module, "checksum", original)
    report = ingest(raw, out, PreprocessConfig(), resume=True)
    assert report["records"] == 1


def test_tokenizer_shard_checksums_and_readback(corpus):
    _, processed, tokenizer, shards = corpus
    loaded = load_tokenizer(tokenizer)
    expected = []
    for record in processed_records(processed):
        expected.extend([2, *loaded.encode(record["text"]).ids, 3])
    metadata = shard_metadata(shards)
    assert sum(m["tokens"] for m in metadata) == len(expected)
    assert all(m["tokens"] == 32 for m in metadata[:-1])
    data = TokenDataset(shards, 8)
    for index in range(len(data)):
        inputs, targets = data[index]
        assert inputs.tolist() == expected[index * 8 : index * 8 + 8]
        assert targets.tolist() == expected[index * 8 + 1 : index * 8 + 9]
    before = [m["file"] for m in metadata]
    assert (
        tokenize(processed, shards, tokenizer, TokenizeConfig(32, 8), resume=True)[
            "skipped"
        ]
        == 2
    )
    assert before == [m["file"] for m in shard_metadata(shards)]
    path = shards / metadata[0]["file"]
    content = bytearray(path.read_bytes())
    content[0] ^= 1
    path.write_bytes(content)
    with pytest.raises(ValueError, match="checksum"):
        shard_metadata(shards)


def test_tokenization_crash_orphan_recovery(corpus, tmp_path, monkeypatch):
    _, processed, tokenizer, original_shards = corpus
    import aerealith_core.shards as module

    out = tmp_path / "interrupted"
    original = module.write_shard
    calls = 0

    def interrupt(*args, **kwargs):
        nonlocal calls
        result = original(*args, **kwargs)
        calls += 1
        if calls == 2:
            raise KeyboardInterrupt
        return result

    monkeypatch.setattr(module, "write_shard", interrupt)
    with pytest.raises(KeyboardInterrupt):
        tokenize(processed, out, tokenizer, TokenizeConfig(32, 8))
    monkeypatch.setattr(module, "write_shard", original)
    report = tokenize(processed, out, tokenizer, TokenizeConfig(32, 8), resume=True)
    assert report["tokens"] == sum(m["tokens"] for m in shard_metadata(original_shards))
    assert [m["sha256"] for m in shard_metadata(out)] == [
        m["sha256"] for m in shard_metadata(original_shards)
    ]
    assert len(list(out.glob("*.bin"))) == report["shards"]


def test_append_resume_tail(corpus):
    raw, processed, tokenizer, shards = corpus
    old_tokens = sum(m["tokens"] for m in shard_metadata(shards))
    (raw / "new.txt").write_text(
        "Additional useful document about planetary astronomy and stars."
    )
    ingest(raw, processed, PreprocessConfig(min_chars=1), resume=True)
    report = tokenize(processed, shards, tokenizer, TokenizeConfig(32, 8), resume=True)
    assert report["tokens"] > old_tokens and report["documents"] == 3
    assert all(m["full"] for m in shard_metadata(shards)[:-1])


def test_leakage(corpus):
    *_, shards = corpus
    with pytest.raises(ValueError, match="differ"):
        reject_leakage(TokenDataset(shards, 8), TokenDataset(shards, 8))


def test_removed_source_and_private_path_mapping(tmp_path):
    import sqlite3

    raw, output = tmp_path / "raw", tmp_path / "processed"
    raw.mkdir()
    source = raw / "local.txt"
    source.write_text("Training text with enough useful content.")
    ingest(raw, output, PreprocessConfig())
    with sqlite3.connect(output / "manifest.sqlite") as db:
        assert db.execute("SELECT path FROM source_paths").fetchone()[0] == "local.txt"
    source.unlink()
    with pytest.raises(ValueError, match="removed"):
        ingest(raw, output, PreprocessConfig(), resume=True)
