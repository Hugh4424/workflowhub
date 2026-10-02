import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const REGISTRY_PATH = join(REPO_ROOT, "docs", "reuse-registry.md");
const CONSUMERS = [
  "make-decision",
  "build-spec",
  "build-plan",
  "build-code",
  "verify-code",
  "stage-result",
  "validator",
  "facts-assembly",
];
const REQUIRED_FIELDS = [
  "Typed inputs",
  "Typed outputs",
  "Failure",
  "Skip",
  "Retry",
  "Human",
  "Decision",
  "Rationale",
  "Evidence",
  "Semantic contract",
  "Mechanism",
];

function registryBody() {
  assert.ok(existsSync(REGISTRY_PATH), "Missing docs/reuse-registry.md");
  const content = readFileSync(REGISTRY_PATH, "utf8");
  const marker = "## 8-consumer typed I/O registry";
  const start = content.indexOf(marker);
  assert.notEqual(start, -1, `Missing registry section: ${marker}`);
  return content.slice(start + marker.length);
}

function parseConsumers() {
  const blocks = new Map();
  const matches = [...registryBody().matchAll(/^### ([a-z][a-z-]*)\s*$/gm)];
  for (const [index, match] of matches.entries()) {
    const end = matches[index + 1]?.index ?? registryBody().length;
    blocks.set(match[1], registryBody().slice(match.index + match[0].length, end));
  }
  return blocks;
}

function field(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(
    new RegExp(`^-\\s+(?:\\*\\*)?${escaped}:(?:\\*\\*)?\\s*(.+)$`, "mi"),
  );
  return match?.[1]?.trim() ?? "";
}

describe("docs/reuse-registry.md typed consumer registry", () => {
  test("declares exactly the five stages plus stage-result, validator, and facts assembly", () => {
    const consumers = parseConsumers();
    assert.deepEqual(
      [...consumers.keys()].sort(),
      [...CONSUMERS].sort(),
      "registry must declare exactly 8 consumers: five stages + stage-result + validator + facts-assembly",
    );
  });

  test("gives every consumer typed I/O and the required operational/decision evidence", () => {
    for (const [consumer, block] of parseConsumers()) {
      for (const label of REQUIRED_FIELDS) {
        assert.ok(field(block, label), `${consumer} missing non-empty ${label}`);
      }

      for (const label of ["Typed inputs", "Typed outputs"]) {
        assert.match(
          field(block, label),
          /`[^`]+`/,
          `${consumer} ${label} must name at least one explicit type in backticks`,
        );
      }

      assert.match(
        field(block, "Decision"),
        /^(reuse|local|extract)(?:\b|\s|—|-)/i,
        `${consumer} Decision must start with reuse, local, or extract`,
      );
    }
  });
});
