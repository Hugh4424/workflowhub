#!/usr/bin/env python3
"""Read-only checks for this Skill package; Python 3.9+, standard library only.

Checks package resources, the two plain-string frontmatter fields used here,
UTF-8, inline Markdown file links, and the original templates. This is not a
general YAML/Markdown validator or a test of an Agent's generated output.
"""

import argparse
import hashlib
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


REQUIRED = (
    "SKILL.md",
    "agents/openai.yaml",
    "references/design-spec.md",
    "references/engineering-spec.md",
    "references/experience-spec.md",
    "references/collaborative-review.md",
    "references/execution.md",
    "references/sources.md",
)
TEMPLATES = {
    "assets/templates/【模板】SDD 首轮需求输入文档.md":
        "0b671701c695655261e77597f45e99b5c31767ed5063b6cb23330e6a5404a1ac",
    "assets/templates/【模板】Spec 评审文档.md":
        "d39f1eb363a078b55193f7b988e39fe4a032582be2adb8438fe98eaf1ee56fa7",
}
LINK = re.compile(r"\[[^\]\n]+\]\((<[^>\n]+>|[^)\n]+)\)")


def check(root):
    """Return actionable errors without changing any files."""
    root = Path(root).resolve()
    errors = []
    texts = {}
    paths = set(REQUIRED) | set(TEMPLATES)
    paths.update(str(p.relative_to(root)) for p in root.glob("*.md"))
    for folder in ("references", "docs"):
        paths.update(str(p.relative_to(root)) for p in (root / folder).rglob("*.md"))

    for relative in sorted(paths):
        path = root / relative
        try:
            data = path.read_bytes()
            texts[relative] = data.decode("utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"{relative}: cannot read UTF-8 file ({exc})")
            continue
        if relative in TEMPLATES and hashlib.sha256(data).hexdigest() != TEMPLATES[relative]:
            errors.append(f"{relative}: original template bytes changed")

    skill = texts.get("SKILL.md", "")
    frontmatter = re.match(r"\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)", skill, re.S)
    if frontmatter is None:
        errors.append("SKILL.md: missing YAML frontmatter")
    else:
        header = frontmatter.group(1).replace("\r\n", "\n")
        for field in ("name", "description"):
            values = re.findall(rf"^{field}: ([^\r\n]+)$", header, re.M)
            if len(values) != 1:
                errors.append(f"SKILL.md: expected one plain-string {field}")
                continue
            value = values[0].strip()
            if field == "name" and value != "spec-driven-production":
                errors.append("SKILL.md: name must be spec-driven-production")
            if field == "description" and (not value or len(value) > 1024 or value in ("|", ">")):
                errors.append("SKILL.md: description must be a nonempty single line, at most 1024 characters")

    for relative, content in texts.items():
        if not relative.endswith(".md"):
            continue
        for match in LINK.finditer(content):
            raw = match.group(1).strip().strip("<>")
            url = urlsplit(raw)
            if url.scheme or url.netloc or not url.path:
                continue
            target = (root / relative).parent / unquote(url.path)
            target = target.resolve()
            try:
                target.relative_to(root)
            except ValueError:
                errors.append(f"{relative}: link leaves Skill package: {raw}")
                continue
            if not target.exists():
                errors.append(f"{relative}: missing link target: {raw}")
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    errors = check(args.path)
    if errors:
        print("FAIL\n" + "\n".join(f"- {error}" for error in errors))
        return 1
    print("PASS: resources, core metadata, UTF-8, local file links, and original templates")
    print("Agent discovery and end-to-end behavior require a separate host smoke test.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
