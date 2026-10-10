import bz2
import gzip
import json

import pyarrow as pa
import pyarrow.parquet as pq
import pytest
import zstandard
from defusedxml.common import DTDForbidden

from aerealith_core.config import PreprocessConfig
from aerealith_core.data.discovery import discover
from aerealith_core.data.loaders.raw import load_compressed, load_parquet
from aerealith_core.data.pipeline import ingest, processed_records


@pytest.mark.parametrize(
    "suffix,compress",
    [
        ("gz", gzip.compress),
        ("bz2", bz2.compress),
        ("zst", zstandard.ZstdCompressor().compress),
    ],
)
def test_compressed_text_and_limit(tmp_path, suffix, compress):
    path = tmp_path / f"sample.jsonl.{suffix}"
    path.write_bytes(compress(b'{"text":"Useful training text, without metadata."}\n'))
    assert list(load_compressed(path, 100)) == [
        "Useful training text, without metadata."
    ]
    with pytest.raises(ValueError, match="limit"):
        list(load_compressed(path, 4))


def test_wikipedia_and_pubmed(tmp_path):
    path = tmp_path / "wiki.xml.bz2"
    path.write_bytes(
        bz2.compress(
            b'<mediawiki xmlns="urn:wiki"><page><title>Title</title><revision><text>Article prose.</text></revision></page><page><title>Redirect</title><redirect title="Title"/></page></mediawiki>'
        )
    )
    assert list(load_compressed(path, 100)) == ["Title\nArticle prose."]
    path = tmp_path / "pubmed.xml.gz"
    path.write_bytes(
        gzip.compress(
            b"<PubmedArticleSet><PubmedArticle><Article><ArticleTitle>Title <i>inline</i></ArticleTitle><Abstract><AbstractText>Abstract prose.</AbstractText></Abstract></Article></PubmedArticle></PubmedArticleSet>"
        )
    )
    assert list(load_compressed(path, 100)) == ["Title inline\nAbstract prose."]


def test_xml_entities_rejected(tmp_path):
    path = tmp_path / "attack.xml.gz"
    path.write_bytes(
        gzip.compress(
            b'<!DOCTYPE page [<!ENTITY x "danger">]><page><text>&x;</text></page>'
        )
    )
    with pytest.raises(DTDForbidden):
        list(load_compressed(path, 100))


def test_rdf_blocks_preserve_triples_with_bounded_record_count(tmp_path):
    path = tmp_path / "wikidata.nt.bz2"
    content = "".join(f'<subject{i}> <predicate> "value{i}" .\n' for i in range(5000))
    path.write_bytes(bz2.compress(content.encode()))
    records = list(load_compressed(path, 65536))
    assert "".join(records) == content
    assert 1 < len(records) < 10
    assert all(len(record.encode()) <= 65536 for record in records)


def test_progress_watch_stops_its_background_worker(monkeypatch):
    import threading

    from aerealith_core.data import pipeline

    observed = threading.Event()
    events = []

    def record_event(name, **metrics):
        events.append(name)
        if name == "ingest_heartbeat":
            observed.set()

    monkeypatch.setattr(pipeline, "event", record_event)
    with pipeline.progress_watch(interval=0.01) as state:
        state["phase"] = "reading_records"
        assert observed.wait(1)
    assert events[0] == "ingest_started"
    assert "ingest_heartbeat" in events


def test_parquet_pipeline_resume_and_pending_downloads(tmp_path):
    raw = tmp_path / "raw"
    raw.mkdir()
    pq.write_table(
        pa.table(
            {
                "text": ["A useful document for the training corpus."] * 2,
                "url": ["private", "private"],
            }
        ),
        raw / "data.parquet",
    )
    (raw / "pending.parquet.part").write_bytes(b"incomplete")
    (raw / "pending.parquet.part.json").write_text("{}")
    assert len(list(discover(raw))) == 1
    output = tmp_path / "processed"
    config = PreprocessConfig()
    report = ingest(raw, output, config, resume=True)
    assert report["records"] == 1
    assert report["duplicates"] == 1
    assert not report["failures"]
    assert ingest(raw, output, config, resume=True)["skipped"] == 1
    records = list(processed_records(output))
    assert "private" not in json.dumps(records)
    pq.write_table(pa.table({"blob_id": ["metadata-only"]}), raw / "metadata.parquet")
    with pytest.raises(ValueError, match="no text column"):
        list(load_parquet(raw / "metadata.parquet", 100))
