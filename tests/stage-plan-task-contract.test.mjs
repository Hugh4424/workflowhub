import { beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

let validatePlanTaskContract;
let validateExecutablePlanTaskMinimum;
let buildPlanTaskContract;
let moduleLoadError;

beforeAll(async () => {
  try {
    ({
      validatePlanTaskContract,
      validateExecutablePlanTaskMinimum,
      buildPlanTaskContract,
    } = await import("../core/stage-content-contracts.mjs"));
  } catch (error) {
    moduleLoadError = error;
  }
});

function requireApi() {
  expect(moduleLoadError).toBeUndefined();
  expect(
    validatePlanTaskContract,
    "core/stage-content-contracts.mjs must provide the accepted plan/tasks validator",
  ).toBeTypeOf("function");
  expect(buildPlanTaskContract).toBeTypeOf("function");
  expect(validateExecutablePlanTaskMinimum).toBeTypeOf("function");
}

const spec = `
# Specification

## Requirements

- **FR-DEMO-001**: first behavior.
- **FR-DEMO-002**: second behavior.

## Acceptance

- **AC1**: first behavior is observable. ← FR-DEMO-001
- **AC2**: second behavior is observable. ← FR-DEMO-002
`;

const plan = `
# Implementation Plan

## Technical Context
Node.js 24, ESM, Vitest.

## Global Constraints
No host identity discovery.

## Modules, Interfaces, and Data Contracts
Validator consumes frozen spec, plan, and tasks bytes and returns structural facts.

## Implementation Order
Phase 1 RED precedes Phase 2 GREEN.

## Test Strategy
Run the exact narrow command attached to each task.

## Rollback and Recovery
Keep accepted artifacts immutable and revert only the current implementation snapshot.

## FR to AC to Step Traceability
FR-DEMO-001 → T001 → AC1; FR-DEMO-002 → T002 → AC2.

## Constitution Check
F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 Q1 Q2 Q3 S1 S2 S3 S4 S5 S6 S7 S8.

## Complexity Trade-offs
Reuse one validator instead of a second parser.

## Phase 1: Contract RED

### Goal
Prove the old implementation accepts a structural gap.

### Files
tests/demo-contract.test.mjs.

### Tasks
T001.

### Verify
npx vitest run tests/demo-contract.test.mjs; expected exit 1.

### Knowledge
No external facts are needed because this is a deterministic parser fixture.

### STOP
Stop if accepted artifacts would need modification.

## Phase 2: Contract GREEN

### Goal
Reject every structural gap deterministically.

### Files
core/demo-contract.mjs.

### Tasks
T002.

### Verify
npx vitest run tests/demo-contract.test.mjs; expected exit 0.

### Knowledge
The RED fixture is the implementation oracle.

### STOP
Stop if a provider verdict is used as structural truth.
`;

const tasks = `
# Tasks

#### T001 — contract RED
- **ID**: T001
- **动作**: Add a failing structural fixture.
- **精确文件**: tests/demo-contract.test.mjs
- **输入**: FR-DEMO-001
- **输出**: RED evidence
- **依赖**: none
- **并行**: no
- **FR**: FR-DEMO-001
- **AC**: AC1
- **gate_cmd**: npx vitest run tests/demo-contract.test.mjs
- **expected_exit**: 1
- **oracle**: The old implementation accepts one invalid fixture.
- **evidence_path**: apply/evidence/T001.stdout

#### T002 — contract GREEN
- **ID**: T002
- **动作**: Implement deterministic validation after RED.
- **精确文件**: core/demo-contract.mjs
- **输入**: T001 fixtures
- **输出**: plan-task-contract.v1 facts
- **依赖**: T001
- **并行**: no
- **FR**: FR-DEMO-002
- **AC**: AC2
- **gate_cmd**: npx vitest run tests/demo-contract.test.mjs
- **expected_exit**: 0
- **oracle**: All valid fixtures pass and every invalid fixture fails.
- **evidence_path**: apply/evidence/T002.stdout
`;

function validate(overrides = {}) {
  requireApi();
  return validatePlanTaskContract({
    spec,
    plan,
    tasks,
    ...overrides,
  });
}

function expectRejected(input, pattern) {
  expect(input).toMatchObject({ ok: false });
  expect(input.errors.join("\n")).toMatch(pattern);
}

function removeSection(document, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return document.replace(
    new RegExp(`\\n## ${escaped}\\n[\\s\\S]*?(?=\\n## |$)`),
    "",
  );
}

function removeFirstPhaseField(document, field) {
  return document.replace(
    new RegExp(`\\n### ${field}\\n[\\s\\S]*?(?=\\n### |\\n## Phase|$)`),
    "",
  );
}

function removeTaskField(document, field) {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return document.replace(new RegExp(`\\n- \\*\\*${escaped}\\*\\*:[^\\n]*`), "");
}

describe("plan-task-contract.v1 complete fixture", () => {
  it("accepts short FR-001/AC-001 identifiers as well as long identifiers", () => {
    const shortSpec = spec.replaceAll("FR-DEMO-001", "FR-001").replaceAll("FR-DEMO-002", "FR-002").replaceAll("AC1", "AC-001").replaceAll("AC2", "AC-002");
    const shortPlan = plan.replaceAll("FR-DEMO-001", "FR-001").replaceAll("FR-DEMO-002", "FR-002").replaceAll("AC1", "AC-001").replaceAll("AC2", "AC-002");
    const shortTasks = tasks.replaceAll("FR-DEMO-001", "FR-001").replaceAll("FR-DEMO-002", "FR-002").replaceAll("AC1", "AC-001").replaceAll("AC2", "AC-002");
    expect(validatePlanTaskContract({ spec: shortSpec, plan: shortPlan, tasks: shortTasks })).toMatchObject({ ok: true });
    expect(validatePlanTaskContract({ spec, plan, tasks })).toMatchObject({ ok: true });
  });

  it("accepts a complete plan, two ordered tasks, and bidirectional FR/AC coverage", () => {
    expect(validate()).toMatchObject({
      ok: true,
      errors: [],
      facts: {
        phase_count: 2,
        task_count: 2,
      },
    });
  });

  it("builds hash-bound canonical facts and rejects stale plan bytes", async () => {
    requireApi();
    const { createHash } = await import("node:crypto");
    const hash = (value) => createHash("sha256").update(value).digest("hex");
    const value = buildPlanTaskContract({
      spec,
      plan,
      tasks,
      planRef: "plan.md",
      planHash: hash(plan),
      tasksRef: "tasks.md",
      tasksHash: hash(tasks),
    });
    expect(value).toMatchObject({
      plan_ref: "plan.md",
      tasks_ref: "tasks.md",
      fr_coverage: { accepted_count: 2, covered_count: 2 },
      ac_coverage: { accepted_count: 2, covered_count: 2 },
      dependency_validation: { valid: true },
      command_oracle_checks: { valid: true },
      errors: [],
    });
    expect(() => buildPlanTaskContract({
      spec,
      plan: `${plan}\nchanged`,
      tasks,
      planRef: "plan.md",
      planHash: hash(plan),
      tasksRef: "tasks.md",
      tasksHash: hash(tasks),
    })).toThrow(/hash binding mismatch/i);
  });
});

describe("accepted stage-content-contracts artifacts", () => {
  it("parses and compiles the published plan-task JSON Schema", () => {
    const schema = JSON.parse(readFileSync("core/schemas/plan-task-contract.v1.json", "utf8"));
    expect(() => new Ajv2020({ strict: false }).compile(schema)).not.toThrow();
  });

  it("validates the real accepted spec, plan, and tasks without omissions", () => {
    requireApi();
    const root = existsSync("specs/stage-content-contracts/spec.md")
      ? "specs/stage-content-contracts"
      : "specs/archive/stage-content-contracts";
    const result = validatePlanTaskContract({
      spec: readFileSync(`${root}/spec.md`, "utf8"),
      plan: readFileSync(`${root}/plan.md`, "utf8"),
      tasks: readFileSync(`${root}/tasks.md`, "utf8"),
    });
    expect(result).toMatchObject({
      ok: true,
      errors: [],
      facts: {
        phase_count: 8,
        task_count: 41,
        fr_coverage: { accepted_count: 61, covered_count: 61 },
        ac_coverage: { accepted_count: 53, covered_count: 53 },
        dependency_validation: { valid: true },
        command_oracle_checks: { valid: true },
      },
    });
  });
});

describe("FR-PLN-001 required plan content", () => {
  it.each([
    "Technical Context",
    "Global Constraints",
    "Modules, Interfaces, and Data Contracts",
    "Implementation Order",
    "Test Strategy",
    "Rollback and Recovery",
    "FR to AC to Step Traceability",
    "Constitution Check",
    "Complexity Trade-offs",
  ])("rejects a plan missing %s", (heading) => {
    expectRejected(validate({ plan: removeSection(plan, heading) }), new RegExp(heading, "i"));
  });

  it("rejects a constitution check that does not enumerate all 21 clauses", () => {
    expectRejected(validate({
      plan: plan.replace("S1 S2 S3 S4 S5 S6 S7 S8.", "S1 S2."),
    }), /21|constitution|F1|S8/i);
  });
});

describe("FR-PLN-002 every Phase has six meaningful fields", () => {
  it.each(["Goal", "Files", "Tasks", "Verify", "Knowledge", "STOP"])(
    "rejects a Phase missing %s",
    (field) => {
      expectRejected(validate({ plan: removeFirstPhaseField(plan, field) }), new RegExp(field, "i"));
    },
  );

  it("rejects an unexplained None in a Phase field", () => {
    expectRejected(validate({
      plan: plan.replace(
        "No external facts are needed because this is a deterministic parser fixture.",
        "None",
      ),
    }), /None|Knowledge|reason/i);
  });
});

describe("FR-PLN-003 every task has all 13 execution fields", () => {
  it.each([
    "ID",
    "动作",
    "精确文件",
    "输入",
    "输出",
    "依赖",
    "并行",
    "FR",
    "AC",
    "gate_cmd",
    "expected_exit",
    "oracle",
    "evidence_path",
  ])("rejects a task missing %s", (field) => {
    expectRejected(validate({ tasks: removeTaskField(tasks, field) }), new RegExp(field, "i"));
  });

  it("rejects a behavior change without explicit RED before GREEN", () => {
    expectRejected(validate({
      tasks: tasks
        .replace("#### T001 — contract RED", "#### T001 — documentation")
        .replace("- **expected_exit**: 1", "- **expected_exit**: 0"),
    }), /RED|GREEN|behavior|顺序/i);
  });

  it("rejects a natural-language gate instead of an executable command", () => {
    expectRejected(validate({
      tasks: tasks.replace(
        "npx vitest run tests/demo-contract.test.mjs",
        "run the relevant tests",
      ),
    }), /gate_cmd|command|executable|命令/i);
  });
});

describe("FR-PLN-004 IDs, dependencies, and traceability", () => {
  it("rejects a duplicate task ID", () => {
    expectRejected(validate({
      tasks: tasks.replace("#### T002 — contract GREEN", "#### T001 — contract GREEN"),
    }), /duplicate|T001|重复/i);
  });

  it("rejects an unknown dependency", () => {
    expectRejected(validate({
      tasks: tasks.replace("- **依赖**: T001", "- **依赖**: T999"),
    }), /T999|dependency|依赖/i);
  });

  it("rejects a dependency cycle", () => {
    expectRejected(validate({
      tasks: tasks.replace("- **依赖**: none", "- **依赖**: T002"),
    }), /cycle|cyclic|环/i);
  });

  it("rejects an accepted FR with no task", () => {
    expectRejected(validate({
      tasks: tasks.replace("- **FR**: FR-DEMO-002", "- **FR**: FR-DEMO-001"),
    }), /FR-DEMO-002|orphan|coverage|覆盖/i);
  });

  it("rejects a task that references an unknown FR", () => {
    expectRejected(validate({
      tasks: tasks.replace("- **FR**: FR-DEMO-002", "- **FR**: FR-DEMO-999"),
    }), /FR-DEMO-999|unknown|invalid|无效/i);
  });

  it("rejects an accepted AC with no task and an unknown AC reference", () => {
    expectRejected(validate({
      tasks: tasks.replace("- **AC**: AC2", "- **AC**: AC999"),
    }), /AC2|AC999|coverage|unknown|覆盖|无效/i);
  });
});

describe("build-plan minimum executable gate", () => {
  const minimum = (overrides = {}) => validateExecutablePlanTaskMinimum({
    spec,
    plan,
    tasks,
    ...overrides,
  });

  it("keeps only coverage, dependency, file, command, and RED/GREEN blockers", () => {
    requireApi();
    expect(minimum()).toMatchObject({ ok: true, errors: [] });
    expect(minimum({
      tasks: tasks.replace("- **FR**: FR-DEMO-002", "- **FR**: FR-DEMO-001"),
    }).errors).toContain("accepted FR has no task coverage: FR-DEMO-002");
    expect(minimum({
      tasks: tasks.replace("- **依赖**: T001", "- **依赖**: T999"),
    }).errors.join("; ")).toMatch(/unknown dependency T999/);
    expect(minimum({
      tasks: tasks.replace("- **精确文件**: tests/demo-contract.test.mjs", "- **精确文件**: none"),
    }).errors.join("; ")).toMatch(/exact file boundary/);
    expect(minimum({
      tasks: tasks.replace("- **精确文件**: tests/demo-contract.test.mjs", "- **精确文件**: `src/*.mjs`"),
    }).errors.join("; ")).toMatch(/exact file boundary/);
    expect(minimum({
      tasks: tasks.replace("npx vitest run tests/demo-contract.test.mjs", "uv run pytest tests/demo_contract.py"),
    })).toMatchObject({ ok: true, errors: [] });
    expect(minimum({
      tasks: tasks.replace("- **依赖**: T001", "- **依赖**: none"),
    }).errors.join("; ")).toMatch(/reciprocal/);
  });
});

describe("FR-PLN-005/006 engineering lens stays complete and lens-only", () => {
  it("requires full spec, plan, tasks, and deterministic contract facts", () => {
    const manifest = JSON.parse(readFileSync(new URL("../skills/wh-review/manifest.json", import.meta.url), "utf8"));
    expect(manifest.contracts["build-plan"].required_skills).toContain("plan-eng-review");
    expect(manifest.contracts["build-plan"].required_materials_by_skill["plan-eng-review"]).toEqual([
      "approved_spec", "draft_plan", "draft_tasks", "plan_task_contract",
    ]);
  });

  it("checks engineering effects without becoming a second runner or verdict", () => {
    const skill = readFileSync(new URL("../skills/plan-eng-review/SKILL.md", import.meta.url), "utf8");
    for (const term of [
      "Code Anchors", "interface", "schema", "state transitions", "data flow",
      "parallel", "exact executable command", "rollback", "implementation effect",
    ]) expect(skill).toContain(term);
    expect(skill).toMatch(/lens-only/i);
    expect(skill).toMatch(/no runner[\s\S]*no verdict|no runner[\s\S]*verdict/i);
  });
});
