import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

describe("Phase 5B Must Read contracts", () => {
  it.each(["build-spec", "build-plan", "build-code", "verify-code"])("makes %s checklist and closure obligations explicit", (stage) => {
    const contract = read(`contracts/${stage}.md`);
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
    for (const track of ["direction", "detail"]) {
      const section = contract.split(`## review_track: ${track}`)[1].split(/\n## review_track: /)[0];
      expect(section).toMatch(/### Hard invariants/);
      expect(section).toMatch(/### Pass items/);
      expect(section).toMatch(/### Continuation closure/);
      expect(section).toMatch(new RegExp(`- ${track === "direction" ? "DIR" : "DET"}-C1:`));
    }
  });

  it("keeps provider protocol aligned with the bare JSON output schema", () => {
    const protocol = read("contracts/provider-protocol.md");
    const schema = JSON.parse(read("schemas/reviewer-output.schema.json"));
    expect(protocol).toContain("single bare JSON object");
    expect(protocol).toContain("checklist");
    expect(protocol).toContain("pass_items");
    expect(protocol).toContain("skillResults");
    for (const field of schema.required) expect(protocol).toContain(`\`${field}\``);
  });

  it("records every AgentHub verifier contract as a keep, host, lens, or evidenced removal", () => {
    const ledger = read("legacy-rule-ledger.md");
    for (const source of ["base-verifier.md", "intake-reviewer-contract.md", "design-reviewer-contract.md", "plan-reviewer-contract.md", "code-reviewer-contract.md", "test-acceptance-reviewer-contract.md"]) expect(ledger).toContain(source);
    for (const decision of ["keep", "host", "lens", "removed (evidence)"]) expect(ledger).toContain(`| ${decision} |`);
    expect(ledger).toContain("closure bundle");
    expect(ledger).toContain("AgentHub-only path/runtime assumption");
  });
});
