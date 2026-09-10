import { describe, expect, it } from "vitest";
import { accept } from "./acceptance-execution-producer.mjs";

const ids = ["AC-EXE-001", "AC-EXE-002"];

function commandFor(stdout, { exitCode = 0, timeoutMs = undefined } = {}) {
  const source = `process.stdout.write(Buffer.from(${JSON.stringify(Buffer.from(stdout).toString("base64"))}, "base64")); process.exitCode=${exitCode};`;
  return { command: process.execPath, args: ["-e", source], ...(timeoutMs ? { timeout_ms: timeoutMs } : {}) };
}

function mapping() {
  return ids.map((acceptance_criterion_id, index) => ({
    acceptance_criterion_id,
    selectors: [{ test_file: `tests/fixture-${index + 1}.mjs`, full_name: `fixture test ${index + 1}` }],
  }));
}

function report(statuses = ["passed", "passed"]) {
  return JSON.stringify({
    success: statuses.every((status) => status === "passed"),
    testResults: statuses.map((status, index) => ({
      name: `tests/fixture-${index + 1}.mjs`,
      assertionResults: [{ fullName: `fixture test ${index + 1}`, title: `fixture ${index + 1}`, status }],
    })),
  });
}

describe("T006 canonical acceptance execution producer", () => {
  it("maps an actual Vitest JSON report to one canonical row per declared AC", async () => {
    const result = await accept({ ...commandFor(report()), acceptance_criterion_ids: ids, acceptance_criterion_map: mapping() });
    expect(result).toEqual({
      entries: ids.map((acceptance_criterion_id) => ({
        acceptance_criterion_id,
        assertions: [{ id: `acceptance-execution:${acceptance_criterion_id}`, expected: { status: "passed" }, actual: { status: "passed" } }],
      })),
    });
  });

  it.each([
    ["missing map", {}, "acceptance_criterion_map is required"],
    ["unknown map id", { acceptance_criterion_map: [{ acceptance_criterion_id: "AC-UNKNOWN", selectors: [] }] }, "unknown AC"],
    ["duplicate map id", { acceptance_criterion_map: [...mapping(), mapping()[0]] }, "duplicates AC"],
    ["missing map id", { acceptance_criterion_map: [mapping()[0]] }, "missing AC-EXE-002"],
  ])("keeps %s non-passing", async (_label, input, reason) => {
    const result = await accept({ ...commandFor(report()), acceptance_criterion_ids: ids, ...input });
    expect(result.entries).toHaveLength(ids.length);
    expect(result.entries.every((entry) => entry.assertions[0].actual.status === "failed")).toBe(true);
    expect(JSON.stringify(result)).toContain(reason);
  });

  it.each([
    ["malformed JSON", Buffer.from("not-json", "utf8"), "not valid JSON"],
    ["non-UTF8 JSON", Buffer.from([0xff, 0xfe, 0xfd]), "not valid UTF-8"],
  ])("keeps %s non-passing", async (_label, bytes, reason) => {
    const result = await accept({ ...commandFor(bytes), acceptance_criterion_ids: ids, acceptance_criterion_map: mapping() });
    expect(result.entries.every((entry) => entry.assertions[0].actual.status === "failed")).toBe(true);
    expect(JSON.stringify(result)).toContain(reason);
  });

  it("preserves a failed child assertion and never consumes the report success flag", async () => {
    const result = await accept({ ...commandFor(report(["failed", "passed"])), acceptance_criterion_ids: ids, acceptance_criterion_map: mapping() });
    expect(result.entries[0].assertions[0].actual.status).toBe("failed");
    expect(result.entries[1].assertions[0].actual.status).toBe("passed");
  });

  it.each([
    ["nonzero child", commandFor(report(), { exitCode: 7 }), "declared command failed"],
    ["timed out child", { command: process.execPath, args: ["-e", "setTimeout(() => {}, 1000)"], timeout_ms: 30 }, "timed out"],
    ["cancelled child", { ...commandFor(report()), cancelled: true }, "cancelled"],
  ])("keeps %s non-passing", async (_label, execution, reason) => {
    const result = await accept({ ...execution, acceptance_criterion_ids: ids, acceptance_criterion_map: mapping() });
    expect(result.entries.every((entry) => entry.assertions[0].actual.status === "failed")).toBe(true);
    expect(JSON.stringify(result)).toContain(reason);
  });

  it("does not interpret shell syntax in an argument", async () => {
    const source = "process.stdout.write(JSON.stringify({testResults:[{name:'tests/fixture-1.mjs',assertionResults:[{fullName:'fixture test 1',status:'passed'}]},{name:'tests/fixture-2.mjs',assertionResults:[{fullName:'fixture test 2',status:'passed'}]}]}))";
    const result = await accept({
      command: process.execPath,
      args: ["-e", source, "$(touch should-not-exist); literal"],
      acceptance_criterion_ids: ids,
      acceptance_criterion_map: mapping(),
    });
    expect(result.entries.every((entry) => entry.assertions[0].actual.status === "passed")).toBe(true);
  });
});
