import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

function registryBody() {
  const content = readFileSync(REGISTRY_PATH, "utf8");
  const marker = "## 8-consumer typed I/O registry";
  const start = content.indexOf(marker);
  assert.notEqual(start, -1, `Missing registry section: ${marker}`);
  return content.slice(start + marker.length);
}

function parseConsumers() {
  const body = registryBody();
  const blocks = new Map();
  const matches = [...body.matchAll(/^### ([a-z][a-z-]*)\s*$/gm)];
  for (const [index, match] of matches.entries()) {
    const end = matches[index + 1]?.index ?? body.length;
    blocks.set(match[1], body.slice(match.index + match[0].length, end));
  }
  return blocks;
}

function field(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return block.match(
    new RegExp(`^-\\s+(?:\\*\\*)?${escaped}:(?:\\*\\*)?\\s*(.+)$`, "mi"),
  )?.[1]?.trim() ?? "";
}

function semanticAssertion(value, label, consumer) {
  assert.ok(value, `${consumer} missing ${label} semantics`);
  assert.match(
    value,
    /(?:when|if|on|unless|after|当|若|如果|遇到|失败|跳过|重试|人工|human|retry|skip|fail)/i,
    `${consumer} ${label} must describe a condition or outcome, not a label-only placeholder`,
  );
}

describe("M12 reuse registry semantics", () => {
  test("records actionable failure, skip, retry, and human handling for all 8 consumers", () => {
    const consumers = parseConsumers();
    assert.equal(consumers.size, 8, "semantic checks require all 8 registry consumers");

    for (const consumer of CONSUMERS) {
      const block = consumers.get(consumer);
      assert.ok(block, `Missing consumer block for ${consumer}`);
      semanticAssertion(field(block, "Failure"), "Failure", consumer);
      semanticAssertion(field(block, "Skip"), "Skip", consumer);
      semanticAssertion(field(block, "Retry"), "Retry", consumer);
      semanticAssertion(field(block, "Human"), "Human", consumer);
      assert.ok(field(block, "Rationale"), `${consumer} missing decision rationale`);
      assert.ok(field(block, "Evidence"), `${consumer} missing decision evidence`);
    }
  });

  test("rejects pseudo-reuse: one mechanism cannot serve different semantic contracts", () => {
    const byMechanism = new Map();
    for (const [consumer, block] of parseConsumers()) {
      const mechanism = field(block, "Mechanism");
      const semanticContract = field(block, "Semantic contract");
      assert.ok(mechanism, `${consumer} must name its mechanism`);
      assert.ok(semanticContract, `${consumer} must name its semantic contract`);
      const key = mechanism.toLocaleLowerCase();
      const prior = byMechanism.get(key);
      assert.ok(
        !prior || prior.semanticContract === semanticContract,
        `${consumer} reuses mechanism ${JSON.stringify(mechanism)} but changes its semantic contract; choose local/extract or document a distinct mechanism`,
      );
      byMechanism.set(key, { consumer, semanticContract });
    }
  });
});
