#!/usr/bin/env python3
"""Inventory Markdown structure and static signals without making a quality verdict."""

from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import asdict, dataclass
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import unquote


EXCLUDED_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".venv",
    "build",
    "dist",
    "node_modules",
    "vendor",
}

HEADING_RE = re.compile(r"^(#{1,6})[ \t]+(.+?)\s*$", re.MULTILINE)
LINK_RE = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
PLACEHOLDER_RE = re.compile(r"\b(?:TODO|FIXME|TBC|TBD|XXX)\b|待定|待补充|需补充", re.IGNORECASE)
NORMATIVE_PATTERNS = {
    "MUST": re.compile(r"\bMUST\b|必须|务必|应当", re.IGNORECASE),
    "SHOULD": re.compile(r"\bSHOULD\b|应该|建议", re.IGNORECASE),
    "MAY": re.compile(r"\bMAY\b|可以|允许", re.IGNORECASE),
    "FORBIDDEN": re.compile(r"\bFORBIDDEN\b|禁止|不得", re.IGNORECASE),
}

LAYER_HINTS = {
    "L0": ("agent.md", "governance", "entrypoint", "authority", "precedence", "治理", "入口", "优先级"),
    "L1": ("product experience", "target user", "job to be done", "产品体验", "目标用户", "用户任务"),
    "L2": ("design principle", "principles", "设计原则", "决策原则"),
    "L3": ("brand", "design language", "voice and tone", "品牌", "设计语言", "语气"),
    "L4": ("foundation", "token", "typography", "spacing", "color", "基础", "令牌", "排版", "间距", "颜色"),
    "L5": ("component", "anatomy", "variant", "state model", "组件", "解剖", "变体", "状态模型"),
    "L6": ("implementation", "validation", "mapping", "acceptance", "实现", "验证", "映射", "验收"),
    "L7": ("lifecycle", "versioning", "migration", "deprecation", "changelog", "生命周期", "版本", "迁移", "弃用", "变更日志"),
}


@dataclass
class LinkIssue:
    code: str
    file: str
    target: str
    resolved_path: str


def discover_markdown(inputs: list[Path]) -> tuple[list[Path], Path]:
    resolved = [path.resolve() for path in inputs]
    missing = [str(path) for path in resolved if not path.exists()]
    if missing:
        raise ValueError(f"input does not exist: {', '.join(missing)}")

    files: set[Path] = set()
    roots: list[Path] = []
    for item in resolved:
        if item.is_file():
            if item.suffix.lower() not in {".md", ".markdown"}:
                raise ValueError(f"input file is not Markdown: {item}")
            files.add(item)
            roots.append(item.parent)
            continue

        roots.append(item)
        for directory, dirs, names in os.walk(item):
            dirs[:] = [name for name in dirs if name not in EXCLUDED_DIRS and not name.startswith(".")]
            for name in names:
                candidate = Path(directory) / name
                if candidate.suffix.lower() in {".md", ".markdown"} and candidate.is_file():
                    files.add(candidate.resolve())

    if not files:
        raise ValueError("no Markdown files found")

    display_root = Path(os.path.commonpath([str(root) for root in roots]))
    return sorted(files), display_root


def display_path(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return str(path)


def parse_link_target(raw: str) -> str:
    value = raw.strip()
    if value.startswith("<") and ">" in value:
        return value[1 : value.index(">")]
    return next(iter(value.split(maxsplit=1)), "")


def find_layer_hints(path: Path, text: str) -> list[str]:
    haystack = f"{path.name}\n{text}".lower()
    return [layer for layer, terms in LAYER_HINTS.items() if any(term in haystack for term in terms)]


def scan_file(path: Path, root: Path) -> tuple[dict[str, object], list[LinkIssue]]:
    text = path.read_text(encoding="utf-8", errors="replace")
    headings = [
        {"level": len(match.group(1)), "text": match.group(2).strip()}
        for match in HEADING_RE.finditer(text)
    ]
    normative = {
        level: len(pattern.findall(text)) for level, pattern in NORMATIVE_PATTERNS.items()
    }
    local_links = 0
    external_links = 0
    issues: list[LinkIssue] = []

    for match in LINK_RE.finditer(text):
        target = parse_link_target(match.group(1))
        if not target or target.startswith("#"):
            continue
        if target.startswith(("http://", "https://", "mailto:", "data:")):
            external_links += 1
            continue

        local_links += 1
        target_path = unquote(target.split("#", 1)[0].split("?", 1)[0])
        if not target_path:
            continue
        raw_path = Path(target_path)
        resolved = raw_path.resolve() if raw_path.is_absolute() else (path.parent / raw_path).resolve()
        if not resolved.exists():
            issues.append(
                LinkIssue(
                    code="BROKEN_LOCAL_LINK",
                    file=display_path(path, root),
                    target=target,
                    resolved_path=str(resolved),
                )
            )

    return (
        {
            "path": display_path(path, root),
            "bytes": path.stat().st_size,
            "lines": len(text.splitlines()),
            "headings": headings,
            "h1_count": sum(heading["level"] == 1 for heading in headings),
            "placeholder_count": len(PLACEHOLDER_RE.findall(text)),
            "normative_counts": normative,
            "local_link_count": local_links,
            "external_link_count": external_links,
            "candidate_layer_hints": find_layer_hints(path, text),
        },
        issues,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path, help="Markdown file or directory")
    parser.add_argument("--output", type=Path, help="Write JSON to this path instead of stdout")
    parser.add_argument("--compact", action="store_true", help="Emit compact JSON")
    parser.add_argument(
        "--fail-on-broken-links",
        action="store_true",
        help="Exit with status 1 when broken local links are found",
    )
    args = parser.parse_args()

    try:
        files, root = discover_markdown(args.inputs)
        records: list[dict[str, object]] = []
        issues: list[LinkIssue] = []
        for path in files:
            record, file_issues = scan_file(path, root)
            records.append(record)
            issues.extend(file_issues)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2

    layer_counts = Counter(layer for record in records for layer in record["candidate_layer_hints"])
    normative_totals = Counter()
    for record in records:
        normative_totals.update(record["normative_counts"])

    payload = {
        "schema_version": "1.0.0",
        "scanner_role": "static-signals-only",
        "root": str(root),
        "summary": {
            "markdown_file_count": len(records),
            "total_lines": sum(int(record["lines"]) for record in records),
            "placeholder_count": sum(int(record["placeholder_count"]) for record in records),
            "broken_local_link_count": len(issues),
            "normative_counts": dict(sorted(normative_totals.items())),
            "candidate_layer_file_counts": dict(sorted(layer_counts.items())),
        },
        "files": records,
        "static_issues": [asdict(issue) for issue in issues],
        "limitations": [
            "Layer hints are keyword signals and require semantic review.",
            "Placeholder counts do not determine whether an unresolved item is acceptable.",
            "No claim about design correctness, authority, Figma parity, code parity, or readiness is made.",
        ],
    }

    rendered = json.dumps(
        payload,
        ensure_ascii=False,
        indent=None if args.compact else 2,
        sort_keys=True,
    ) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    else:
        sys.stdout.write(rendered)
    return 1 if args.fail_on_broken_links and issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
