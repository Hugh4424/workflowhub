import { describe, expect, it } from "vitest";

import {
  validateReportableFindingDispositions,
} from "../../runtime/review/stage-review-disposition.mjs";
import { qualityPredicateSatisfied } from "../../runtime/stage/completion-predicates.mjs";

const findings = {
  minor: { id: "F-aaaaaaaaaaaa", severity: "minor", disposition: "actionable", evidence_status: "direct" },
  serious: { id: "F-bbbbbbbbbbbb", severity: "major", disposition: "actionable", evidence_status: "direct" },
};

function disposition(finding_id, status) {
  return {
    finding_id,
    original_fact: `${finding_id} original fact`,
    source: "review-result",
    consequence: "user-visible consequence",
    status,
    next_action: "record the bounded action",
    evidence_ref: "quality/reviews/results/current.json",
    owner: "task owner",
    consumer: "current stage",
    retain_or_delete: "retain",
  };
}

describe("P6 review finding and close freshness matrix", () => {
  it("requires dispositions for minor and serious canonical findings", () => {
    const result = validateReportableFindingDispositions({
      result: { findings: [findings.minor, findings.serious] },
      dispositions: [disposition(findings.serious.id, "fixed")],
    });
    expect(result.facts.status).toBe("incomplete");
    expect(result.missing_items).toContain(`finding disposition is missing for: ${findings.minor.id}`);
  });

  it("allows a complete ordinary disposition set without turning the review into pass", () => {
    const result = validateReportableFindingDispositions({
      result: { findings: [findings.minor, findings.serious] },
      dispositions: [
        disposition(findings.minor.id, "rejected_invalid"),
        disposition(findings.serious.id, "fixed"),
      ],
    });
    expect(result.facts).toMatchObject({ status: "recorded", items: [{ status: "rejected_invalid" }, { status: "fixed" }] });
  });

  it("does not accept accepted_risk without an authenticated risk receipt", () => {
    const result = validateReportableFindingDispositions({
      result: { findings: [findings.serious] },
      dispositions: [disposition(findings.serious.id, "accepted_risk")],
    });
    expect(result.facts.status).toBe("incomplete");
    expect(result.missing_items[0]).toMatch(/accepted_risk requires an authenticated user risk receipt/);
  });

  it("accepts accepted_risk only when the current finding is explicitly authorized", () => {
    const result = validateReportableFindingDispositions({
      result: { findings: [findings.serious] },
      dispositions: [disposition(findings.serious.id, "accepted_risk")],
      authorizedRiskFindingIds: [findings.serious.id],
    });
    expect(result.facts.status).toBe("recorded");
  });

  it("keeps review recording separate from provider verdict and requires passed acceptance facts", () => {
    expect(qualityPredicateSatisfied({ status: "recorded" }, "review")).toBe(true);
    expect(qualityPredicateSatisfied({ status: "failed" }, "review")).toBe(false);
    expect(qualityPredicateSatisfied({ status: "passed" }, "acceptance_criterion")).toBe(true);
    expect(qualityPredicateSatisfied({ status: "recorded" }, "acceptance_criterion")).toBe(false);
  });
});
