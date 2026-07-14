import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

describe("Phase 5B Must Read contracts", () => {
  it.each(["build-spec", "build-plan", "build-code", "verify-code"])("makes %s checklist and closure obligations explicit", (stage) => {
    const contract = read(`contracts/${stage}.md`);
    expect(contract).toMatch(/## Reviewer role/);
    expect(contract).toMatch(/## Must Read/);
    expect(contract).toMatch(/## Required materials/);
    expect(contract).toMatch(/## Required skills/);
    expect(contract).toMatch(/## Stage output/);
    expect(contract).toMatch(/## Hard invariants/);
    expect(contract).toMatch(/## Pass items/);
    expect(contract).toMatch(/## Continuation closure/);
    expect(contract).toMatch(/- C1:/);
    expect(contract).toMatch(/pass_items/);
    expect(contract).toMatch(/closure_evidence/);
  });

  it("makes make-decision direction and detail mutually exclusive complete contracts", () => {
    const contract = read("contracts/make-decision.md");
    expect(contract).toMatch(/exactly one.*direction.*detail/i);
    expect(contract).toMatch(/## Reviewer role/);
    expect(contract).toMatch(/## Must Read/);
    for (const track of ["direction", "detail"]) {
      const section = contract.split(`## review_track: ${track}`)[1].split(/\n## review_track: /)[0];
      expect(section).toMatch(/### Required materials/);
      expect(section).toMatch(/### Required skills/);
      expect(section).toMatch(/### Stage output/);
      expect(section).toMatch(/### Hard invariants/);
      expect(section).toMatch(/### Pass items/);
      expect(section).toMatch(/### Continuation closure/);
      expect(section).toMatch(new RegExp(`- ${track === "direction" ? "DIR" : "DET"}-C1:`));
    }
  });

  it("keeps provider protocol aligned with the JSON output parser and schema", () => {
    const protocol = read("contracts/provider-protocol.md");
    const schema = JSON.parse(read("schemas/reviewer-output.schema.json"));
    expect(protocol).toContain("single bare JSON object");
    expect(protocol).toMatch(/exactly one Markdown `json` fence/i);
    expect(protocol).toMatch(/text before or after the fence is allowed/i);
    expect(protocol).toContain("checklist");
    expect(protocol).toContain("pass_items");
    expect(protocol).toContain("changes.diff:line <n>");
    expect(protocol).toContain("skillResults");
    expect(protocol).toContain("skillResults` 必须精确为 `[]`");
    expect(protocol).toContain("不得添加未声明的条目");
    for (const field of schema.required) expect(protocol).toContain(`\`${field}\``);
  });

  it("records every AgentHub verifier contract as a keep, host, lens, or evidenced removal", () => {
    const ledger = read("legacy-rule-ledger.md");
    for (const source of ["base-verifier.md", "intake-reviewer-contract.md", "design-reviewer-contract.md", "plan-reviewer-contract.md", "code-reviewer-contract.md", "test-acceptance-reviewer-contract.md"]) expect(ledger).toContain(source);
    for (const decision of ["keep", "host", "lens", "removed (evidence)"]) expect(ledger).toContain(`| ${decision} |`);
    expect(ledger).toContain("closure bundle");
    expect(ledger).toContain("AgentHub-only path/runtime assumption");
  });

  it("uses individually addressable legacy rule ids instead of contract-level summaries", () => {
    const ledger = read("legacy-rule-ledger.md");
    const ids = [...ledger.matchAll(/^\| `AGH-[A-Z]+-\d{2}` \|/gm)].map((match) => match[0]);
    expect(ids.length).toBeGreaterThanOrEqual(70);
    for (const family of ["BASE", "INTAKE", "DESIGN", "PLAN", "CODE", "ACCEPT"]) expect(ids.some((id) => id.includes(`AGH-${family}-`))).toBe(true);
  });

  it("keeps only traceable mappings and does not claim unsupported base protocol semantics", () => {
    const ledger = read("legacy-rule-ledger.md");
    const rows = [...ledger.matchAll(/^\| `(?<id>AGH-[A-Z]+-\d{2})` \| (?<source>.*?) \| (?<decision>keep|host|lens|removed \(evidence\)) \| (?<mapping>.*?) \|$/gm)];
    expect(rows.find((row) => row.groups.id === "AGH-BASE-10").groups.decision).toBe("removed (evidence)");
    expect(rows.find((row) => row.groups.id === "AGH-BASE-14").groups.decision).toBe("removed (evidence)");
    expect(rows).toHaveLength(130);
    for (const row of rows) {
      expect(row.groups.mapping).toMatch(/skills\/wh-review\/(?:contracts|scripts|schemas|stage-skill-plan\.json)/);
      expect(row.groups.mapping).toMatch(/[§#]/);
    }
    const base10 = rows.find((row) => row.groups.id === "AGH-BASE-10").groups.mapping;
    expect(base10).toContain("hash-journaled mutable private state");
    expect(base10).toContain("#updateReceiptAndFlow");
    expect(base10).toContain("#recoverPendingReceiptBinding");
  });
});
