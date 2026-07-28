import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync(
  new URL("./fixtures/template-content-quality/retention-map.json", import.meta.url),
  "utf8",
));

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const baseline = (path) => execFileSync(
  "git",
  ["show", `${fixture.baseline_ref}:${path}`],
  { encoding: "utf8" },
);
function headingInventory(text) {
  const seen = new Map();
  return text.split(/\r?\n/)
    .filter((line) => /^#{1,3}\s+\S/.test(line))
    .map((marker) => {
      const occurrence = (seen.get(marker) ?? 0) + 1;
      seen.set(marker, occurrence);
      return { marker, occurrence };
    });
}

function markerOccurrence(document, marker, wanted = 1) {
  let occurrence = 0;
  for (const line of document.split(/\r?\n/)) {
    if (line !== marker) continue;
    occurrence += 1;
    if (occurrence === wanted) return true;
  }
  return false;
}

const retentionEntries = [...fixture.items, ...fixture.subsections, ...fixture.required_rules];

function validatorFor(entry) {
  const validator = fixture.validators[entry.validator_test];
  expect(validator, `${entry.id} references an unknown validator`).toBeDefined();
  return validator;
}

function executeValidator(entry) {
  const validator = validatorFor(entry);
  if (validator.kind === "heading-target") {
    return markerOccurrence(read(entry.source), entry.target_marker, entry.target_occurrence ?? 1);
  }
  if (validator.kind === "regex-target") {
    return new RegExp(entry.old_pattern, "m").test(baseline(entry.source))
      && new RegExp(entry.target_pattern, "m").test(read(entry.source));
  }
  if (validator.kind === "contract-marker") {
    return read(entry.path).replace(/\s+/g, "").includes(entry.pattern.replace(/\s+/g, ""));
  }
  throw new Error(`unsupported retention validator kind: ${validator.kind}`);
}

function sectionBody(document, heading) {
  const lines = document.split(/\r?\n/);
  const index = lines.indexOf(heading);
  const level = heading.match(/^#+/)[0].length;
  const next = lines.findIndex((line, lineIndex) =>
    lineIndex > index && new RegExp(`^#{1,${level}}\\s+`).test(line));
  return lines.slice(index + 1, next === -1 ? lines.length : next).join("\n").trim();
}

function tableBlocks(document) {
  const blocks = [];
  let current = [];
  for (const line of document.split(/\r?\n/)) {
    if (/^\s*\|.*\|\s*$/.test(line)) current.push(line);
    else if (current.length) {
      blocks.push(current);
      current = [];
    }
  }
  if (current.length) blocks.push(current);
  return blocks;
}

describe("template content retention map", () => {
  it("maps every baseline H1/H2/H3 exactly once with unique IDs and targets", () => {
    const expected = fixture.scope.flatMap((source) =>
      headingInventory(baseline(source))
        .map(({ marker, occurrence }) => `${source}\0${marker}\0${occurrence}`));
    const mapped = [...fixture.items, ...fixture.subsections]
      .map(({ source, old_marker, old_occurrence = 1 }) => `${source}\0${old_marker}\0${old_occurrence}`);

    expect(new Set(mapped).size).toBe(mapped.length);
    expect([...mapped].sort()).toEqual([...expected].sort());
    expect(new Set(retentionEntries.map(({ id }) => id)).size).toBe(retentionEntries.length);
    expect(new Set(retentionEntries.map(({ target }) => target)).size).toBe(retentionEntries.length);
  });

  it("executes every declared validator and resolves deletion replacements", () => {
    const targets = new Map(retentionEntries.map((entry) => [entry.target, entry]));
    for (const item of retentionEntries) {
      expect(["retain", "refine", "move", "delete"]).toContain(item.action);
      expect(item.reason.trim().length, `${item.id} needs a concrete reason`).toBeGreaterThan(4);
      validatorFor(item);
      if (item.action === "delete") {
        expect(item.replacement_target, `${item.id} delete needs a replacement_target`).toBeTruthy();
        const replacement = targets.get(item.replacement_target);
        expect(replacement, `${item.id} replacement_target must resolve`).toBeDefined();
        expect(executeValidator(replacement), `${item.id} replacement target is absent`).toBe(true);
        continue;
      }
      expect(executeValidator(item), `${item.id} target validation failed`).toBe(true);
    }
  });

  it("keeps target sections in the declared information order", () => {
    const byTarget = new Map(retentionEntries.map((item) => [item.target, item]));
    for (const [path, targets] of Object.entries(fixture.ordered_targets)) {
      const document = read(path);
      const indexes = targets.map((target) => document.indexOf(byTarget.get(target).target_marker));
      expect(indexes.every((index) => index >= 0), `${path} has missing ordered targets`).toBe(true);
      expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
    }
  });

  it("binds retained structure to the existing schemas and validators", () => {
    for (const check of fixture.contract_checks) {
      expect(check.reason.trim().length).toBeGreaterThan(4);
      expect(executeValidator(check), `${check.id} contract marker missing`).toBe(true);
    }
  });
});

describe("high-value Markdown template hygiene", () => {
  for (const path of fixture.scope) {
    it(`${path} stays structurally clean`, () => {
      const document = read(path);
      const allHeadings = document.split(/\r?\n/).filter((line) => /^#{1,6}\s+\S/.test(line));
      const h1 = allHeadings.filter((line) => /^#\s+/.test(line));
      const h2 = allHeadings.filter((line) => /^##\s+/.test(line));

      if (fixture.markdown_rules.require_single_h1) expect(h1).toHaveLength(1);
      if (fixture.markdown_rules.require_unique_h2) expect(new Set(h2).size).toBe(h2.length);
      if (fixture.markdown_rules.require_balanced_fences) {
        expect((document.match(/^```/gm) ?? []).length % 2).toBe(0);
      }
      if (fixture.markdown_rules.require_nonempty_h2) {
        for (const heading of h2) {
          const body = sectionBody(document, heading);
          if (body === "") {
            const lines = document.split(/\r?\n/);
            const nextHeading = lines.slice(lines.indexOf(heading) + 1).find((line) => /^#{1,6}\s+\S/.test(line));
            const allowed = fixture.markdown_rules.allowed_empty_container_pairs.some((pair) =>
              pair.heading === heading && nextHeading?.startsWith(pair.next_heading_prefix));
            expect(allowed, `${path}: empty ${heading}`).toBe(true);
          }
        }
      }
      if (fixture.markdown_rules.require_consistent_tables) {
        for (const table of tableBlocks(document)) {
          const widths = table.map((line) => line.split("|").length);
          expect(new Set(widths).size, `${path}: inconsistent table width`).toBe(1);
        }
      }
      for (const pattern of fixture.markdown_rules.forbidden_patterns) {
        expect(document, `${path}: forbidden template text ${pattern}`).not.toContain(pattern);
      }
    });
  }
});

describe("template responsibilities", () => {
  it("keeps the declared product, engineering, and execution information split", () => {
    for (const check of fixture.content_checks) {
      const document = read(check.path);
      expect(check.reason.trim().length, `${check.id} needs a concrete reason`).toBeGreaterThan(4);
      for (const marker of check.required) {
        expect(document, `${check.id} is missing ${marker}`).toContain(marker);
      }
      for (const marker of check.forbidden) {
        expect(document, `${check.id} duplicates ${marker}`).not.toContain(marker);
      }
    }
  });

  it("leaves templates ready for direct reading instead of authoring syntax", () => {
    const templatePaths = fixture.scope.filter((path) => path.includes("/templates/"));
    for (const path of templatePaths) {
      const document = read(path);
      expect(document, `${path}: raw JSON example`).not.toMatch(/\[\s*\{\s*"[a-z_]+"\s*:/);
      expect(document, `${path}: unresolved braces`).not.toMatch(/\{[^}\n]+\}/);
      expect(document, `${path}: authoring comment`).not.toMatch(/<!--|-->/);
    }
  });
});
