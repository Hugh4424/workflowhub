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

  it("keeps the portable quality dimensions explicit instead of hiding them behind broad labels", () => {
    const requiredClauses = {
      "build-spec": [/双向追溯/, /失败与边界场景/, /可判定验收/],
      "build-plan": [/消费点/, /失败路径/, /验证命令.*真实/],
      "build-code": [/原子性/, /竞态/, /消费者影响/, /结构质量由本合同直接检查/],
      "verify-code": [/逐条.*验收/, /不得抽样/, /证据新鲜度/, /UI scope.*isolated-browser-qa/],
    };
    for (const [stage, clauses] of Object.entries(requiredClauses)) {
      const contract = read(`contracts/${stage}.md`);
      for (const clause of clauses) expect(contract).toMatch(clause);
    }
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

  it("maps migrated rules to concrete checks instead of a generic hard-invariants section", () => {
    const ledger = read("legacy-rule-ledger.md");
    expect(ledger).not.toContain("§Hard invariants");
    for (const family of ["DESIGN", "PLAN", "CODE", "ACCEPT"]) {
      const rows = [...ledger.matchAll(new RegExp("^\\| `AGH-" + family + "-\\d{2}` \\|.*$", "gm"))];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) expect(row[0]).toMatch(/(?:C\d|H\d|quality questions|#\S|removed \(evidence\)|lens|validator|finding-state|review-round-facade|stage-skill-plan)/i);
    }
  });

  it("keeps only traceable mappings and does not claim unsupported base protocol semantics", () => {
    const ledger = read("legacy-rule-ledger.md");
    const rows = [...ledger.matchAll(/^\| `(?<id>AGH-[A-Z]+-\d{2})` \| (?<source>.*?) \| (?<decision>keep|host|lens|removed \(evidence\)) \| (?<mapping>.*?) \|$/gm)];
    expect(rows.find((row) => row.groups.id === "AGH-BASE-10").groups.decision).toBe("removed (evidence)");
    expect(rows.find((row) => row.groups.id === "AGH-BASE-14").groups.decision).toBe("removed (evidence)");
    expect(rows).toHaveLength(130);
    for (const row of rows) {
      expect(row.groups.mapping).toMatch(/skills\/wh-review\/(?:contracts|scripts|schemas|stage-skill-plan\.json)/);
      expect(row.groups.mapping).toMatch(/(?:§|#|C\d|H\d|removed \(evidence\))/);
    }
    const base10 = rows.find((row) => row.groups.id === "AGH-BASE-10").groups.mapping;
    expect(base10).toContain("hash-journaled mutable private state");
    expect(base10).toContain("#updateReceiptAndFlow");
    expect(base10).toContain("#recoverPendingReceiptBinding");
  });

  it("does not claim nonexistent code or browser lenses in the migration ledger", () => {
    const ledger = read("legacy-rule-ledger.md");
    const plan = JSON.parse(read("stage-skill-plan.json"));
    const rows = [...ledger.matchAll(/^\| `(?<id>AGH-[A-Z]+-\d{2})` \| (?<source>.*?) \| (?<decision>keep|host|lens|removed \(evidence\)) \| (?<mapping>.*?) \|$/gm)]
      .map((match) => match.groups);
    const byId = new Map(rows.map((row) => [row.id, row]));

    expect(plan.stages["build-code"].required_skills).toEqual([]);
    for (const id of ["AGH-CODE-11", "AGH-CODE-17"]) {
      expect(byId.get(id).decision).toBe("keep");
      expect(byId.get(id).mapping).toContain("build-code.md#Structural quality questions");
      expect(byId.get(id).mapping).not.toMatch(/skill lens/i);
    }

    expect(plan.stages["verify-code"].optional_skills ?? []).not.toContainEqual({ name: "isolated-browser-qa", when: "ui" });
    expect(byId.get("AGH-ACCEPT-15").decision).toBe("keep");
    expect(byId.get("AGH-ACCEPT-15").mapping).toContain("verify-code.md#Acceptance quality questions");
  });

  it("keeps unavailable physical evidence as unknown instead of a blocking quality finding", () => {
    const contract = read("contracts/verify-code.md");
    expect(contract).toMatch(/优先使用.*isolated-browser-qa/);
    expect(contract).toMatch(/缺失或失败.*unknown.*escalate_to_human/);
    expect(contract).toMatch(/不得仅因.*未使用.*blocking/);
  });
});
