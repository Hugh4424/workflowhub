"""Exercise failures that can break a shared or installed Skill package."""

from pathlib import Path
import shutil
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_skill import check, REQUIRED, TEMPLATES


class PackageChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="sdd-check-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "路径 with spaces" / "spec-driven-production"
        for relative in (*REQUIRED, *TEMPLATES, "README.md"):
            destination = self.root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, destination)
        shutil.copytree(ROOT / "docs", self.root / "docs")
        shutil.copytree(ROOT / "scripts", self.root / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copytree(ROOT / "tests", self.root / "tests", ignore=shutil.ignore_patterns("__pycache__"))

    def edit_skill(self, text):
        with (self.root / "SKILL.md").open("a", encoding="utf-8") as file:
            file.write(text)

    def test_copy_with_unicode_and_spaces_is_valid_and_unchanged(self):
        before = {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()}
        self.assertEqual(check(self.root), [])
        self.assertEqual(before, {p: p.read_bytes() for p in self.root.rglob("*") if p.is_file()})

    def test_missing_reference(self):
        (self.root / "references/design-spec.md").unlink()
        self.assertTrue(any("design-spec.md" in error for error in check(self.root)))

    def test_template_change(self):
        path = self.root / next(iter(TEMPLATES))
        path.write_bytes(path.read_bytes() + b"\n")
        self.assertTrue(any("template bytes changed" in error for error in check(self.root)))

    def test_missing_link(self):
        self.edit_skill("\n[missing](references/not-present.md)\n")
        self.assertTrue(any("missing link target" in error for error in check(self.root)))

    def test_link_outside_package(self):
        self.edit_skill("\n[outside](../outside.md)\n")
        self.assertTrue(any("leaves Skill package" in error for error in check(self.root)))

    def test_invalid_name(self):
        path = self.root / "SKILL.md"
        path.write_text(path.read_text(encoding="utf-8").replace("name: spec-driven-production", "name: invalid"), encoding="utf-8")
        self.assertTrue(any("name must be" in error for error in check(self.root)))

    def test_duplicate_description(self):
        path = self.root / "SKILL.md"
        path.write_text(path.read_text(encoding="utf-8").replace("\nname:", "\ndescription: duplicate\nname:", 1), encoding="utf-8")
        self.assertTrue(any("one plain-string description" in error for error in check(self.root)))

    def test_non_utf8_resource(self):
        (self.root / "references/design-spec.md").write_bytes(b"\xff")
        self.assertTrue(any("cannot read UTF-8" in error for error in check(self.root)))


if __name__ == "__main__":
    unittest.main()
