# SPDX-FileCopyrightText: 2026 SinLess Games LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
from pathlib import Path

import pytest
from defusedxml.common import DefusedXmlException
from pypdf.errors import PdfReadError
from yaml import YAMLError

from aerealith_core.data.loaders import REGISTRY, TEXT_EXTENSIONS
from aerealith_core.data.loaders.html import load_html
from aerealith_core.data.loaders.pdf import load_pdf
from aerealith_core.data.loaders.structured import (
    load_csv,
    load_json,
    load_jsonl,
    load_xml,
    load_yaml,
)
from aerealith_core.data.loaders.text import load_text


@pytest.mark.parametrize("extension", sorted(TEXT_EXTENSIONS))
def test_inert_text_extensions(tmp_path, extension):
    path = tmp_path / ("example" + extension)
    code = "  def hello():\n    return 'world'\n"
    path.write_text(code)
    assert "".join(REGISTRY[extension](path, 64)) == code


@pytest.mark.parametrize(
    "suffix,content,loader",
    [
        (".json", '{"nested":{"name":"Alice"},"count":2}', load_json),
        (".json", '[{"name":"Alice"},{"name":"Bob"}]', load_json),
        (".jsonl", '{"name":"Alice"}\n\n{"name":"Bob"}\n', load_jsonl),
        (".ndjson", '{"name":"Alice"}\n', load_jsonl),
        (".yaml", "nested:\n  name: Alice\n", load_yaml),
        (".yml", "name: Alice\n", load_yaml),
        (".csv", "name,role\nAlice,engineer\n", load_csv),
        (".tsv", "name\trole\nAlice\tengineer\n", load_csv),
    ],
)
def test_structured_semantics(tmp_path, suffix, content, loader):
    path = tmp_path / ("example" + suffix)
    path.write_text(content)
    records = list(loader(path, 1024))
    assert records and "Alice" in records[0]
    assert all(isinstance(json.loads(r), dict) for r in records)


@pytest.mark.parametrize(
    "loader,suffix,content",
    [
        (load_json, ".json", "{"),
        (load_jsonl, ".jsonl", '{"bad":'),
        (load_yaml, ".yaml", "!!python/object/apply:os.system ['touch nope']"),
        (load_xml, ".xml", '<!DOCTYPE a [<!ENTITY x "danger">]><a>&x;</a>'),
        (load_text, ".txt", "abc\x00def"),
    ],
)
def test_malformed_and_untrusted(tmp_path, loader, suffix, content):
    path = tmp_path / ("bad" + suffix)
    path.write_text(content)
    with pytest.raises((ValueError, YAMLError, DefusedXmlException)):
        list(loader(path, 1024))


def test_streaming_jsonl_and_csv(tmp_path):
    path = tmp_path / "stream.jsonl"
    path.write_text('{"a":1}\nmalformed later\n')
    iterator = load_jsonl(path, 128)
    assert json.loads(next(iterator)) == {"a": 1}
    with pytest.raises(ValueError):
        next(iterator)
    csv_path = tmp_path / "stream.csv"
    csv_path.write_text("name\nAlice\n" + "x" * 200 + "\n")
    iterator = load_csv(csv_path, 128)
    assert "Alice" in next(iterator)
    with pytest.raises(ValueError):
        next(iterator)


def test_html_and_xml(tmp_path):
    path = tmp_path / "page.html"
    path.write_text("<p>Hello &amp; world</p><script>secret JS</script>")
    assert "Hello & world" in next(load_html(path, 1024))
    assert "secret" not in next(load_html(path, 1024))
    path = tmp_path / "page.xml"
    path.write_text('<person id="7"><name>Alice</name>tail</person>')
    record = json.loads(next(load_xml(path, 1024)))
    assert record["attributes"]["id"] == "7"
    assert record["children"][0]["text"] == "Alice"


@pytest.mark.parametrize("suffix", [".txt", ".md", ".csv", ".jsonl", ".yaml", ".html"])
def test_empty(tmp_path, suffix):
    path = tmp_path / ("empty" + suffix)
    path.write_text("")
    assert all(not record.strip() for record in REGISTRY[suffix](path, 128))


def write_pdf(path: Path) -> None:
    from pypdf import PdfWriter
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

    writer = PdfWriter()
    page = writer.add_blank_page(width=300, height=300)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {
            NameObject("/Font"): DictionaryObject(
                {NameObject("/F1"): writer._add_object(font)}
            )
        }
    )
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 12 Tf 20 200 Td (Hello from a real PDF.) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    writer.write(path)


def test_pdf_extraction(tmp_path):
    path = tmp_path / "actual.pdf"
    write_pdf(path)
    assert "Hello from a real PDF." in next(load_pdf(path, 4096))
    path.write_bytes(b"not a PDF")
    with pytest.raises(PdfReadError):
        list(load_pdf(path, 4096))


def test_large_json_array_record_rejected_before_building(tmp_path):
    path = tmp_path / "array.json"
    path.write_text(json.dumps([{"text": "x" * 2000}]))
    with pytest.raises(ValueError, match="item exceeds"):
        list(load_json(path, 128))
    path.write_text(json.dumps([{"text": 'escaped \\" brackets [], {}'}]))
    assert "brackets" in next(load_json(path, 128))


def test_yaml_alias_expansion_and_multiline_csv_budget(tmp_path):
    path = tmp_path / "aliases.yaml"
    path.write_text('a: &a ["1234567890", "1234567890"]\nb: [*a, *a, *a, *a, *a, *a]\n')
    with pytest.raises(ValueError, match="limit"):
        list(load_yaml(path, 128))
    path = tmp_path / "multiline.csv"
    path.write_text('a,b\n"' + ("x\n" * 30) + '","' + ("x\n" * 30) + '"\n')
    with pytest.raises(ValueError, match="limit"):
        list(load_csv(path, 100))
