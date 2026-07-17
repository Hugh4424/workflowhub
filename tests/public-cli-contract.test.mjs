import { describe, expect, it, vi } from "vitest";
import { errorCliEnvelope, okCliEnvelope } from "../core/cli-envelope.mjs";
import { JSON_INPUT_MAX_BYTES, readJsonInput } from "../core/json-input.mjs";
import { classifyExecutorError, createLauncherExecutor, executePublicCli, parsePublicCliArgv, runPublicCli } from "../core/public-cli.mjs";
import { assertSchemaFixture } from "./helpers/side-effect-snapshot.mjs";

const inputEnvelope = (source = "@-") => JSON.stringify({
  schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json",
  schema_version: "1.0.0",
  command: "stage",
  input_source: source,
  payload: {},
});

describe("public CLI contract", () => {
  it("admits the fixed command allowlist and rejects unknown commands", () => {
    for (const argv of [["doctor"], ["task", "create"], ["stage", "run", "--project", "Demo", "--task", "one", "--stage", "build-code"], ["commit", "status", "--project", "Demo", "--task", "one"], ["close", "status", "--project", "Demo", "--task", "one"], ["release", "status"], ["routing", "status"], ["admin-repin", "prepare", "--project", "Demo", "--task", "one"], ["status", "--project", "Demo", "--task", "one"]]) {
      expect(parsePublicCliArgv(argv).command).toBe(argv[0]);
    }
    expect(() => parsePublicCliArgv(["shell"])).toThrowError(expect.objectContaining({ code: "USAGE_UNKNOWN_COMMAND" }));
    expect(() => parsePublicCliArgv(["doctor", "destroy"])).toThrowError(expect.objectContaining({ code: "USAGE_UNKNOWN_ACTION" }));
    expect(() => parsePublicCliArgv(["doctor", "--anything", "x"])).toThrowError(expect.objectContaining({ code: "USAGE_UNKNOWN_OPTION" }));
  });

  it("reads JSON only from stdin or an authorized staging ref", async () => {
    await expect(readJsonInput({ source: "@-", stdin: inputEnvelope() })).resolves.toMatchObject({ command: "stage" });
    await expect(readJsonInput({ source: "staging:payloads/a.json", authorizedStagingRefs: ["staging:payloads/a.json"], stagedPayload: inputEnvelope("staging:payloads/a.json") })).resolves.toMatchObject({ command: "stage" });
    await expect(readJsonInput({ source: "staging:payloads/a.json", stagedPayload: "{}" })).rejects.toMatchObject({ code: "USAGE_UNAUTHORIZED_STAGING_REF" });
    await expect(readJsonInput({ source: "/tmp/input.json" })).rejects.toMatchObject({ code: "USAGE_INVALID_INPUT_SOURCE" });
  });

  it("enforces the byte limit before JSON parsing", async () => {
    await expect(readJsonInput({ source: "@-", stdin: "x".repeat(JSON_INPUT_MAX_BYTES + 1) })).rejects.toMatchObject({ code: "INPUT_TOO_LARGE" });
  });

  it("rejects schema and argv mismatches before executor dispatch", async () => {
    const executor = vi.fn();
    await expect(executePublicCli({ argv: ["task", "create", "--input", "@-"], stdin: inputEnvelope(), executor })).rejects.toMatchObject({ code: "SCHEMA_COMMAND_MISMATCH", exitCode: 10 });
    expect(executor).not.toHaveBeenCalled();
  });

  it("dispatches an admitted canonical payload", async () => {
    const executor = vi.fn(() => ({ result_ref: "tasks/demo/results/status.json" }));
    const envelope = await executePublicCli({ argv: ["stage", "run", "--project", "Demo", "--task", "one", "--stage", "build-code", "--input", "@-"], stdin: inputEnvelope(), executor });
    expect(executor).toHaveBeenCalledWith(expect.objectContaining({ command: "stage", action: "run", input: expect.objectContaining({ input_source: "@-" }) }));
    expect(envelope).toEqual(okCliEnvelope({ resultRef: "tasks/demo/results/status.json" }));
  });

  it("creates mutually exclusive schema-valid output envelopes", async () => {
    const ok = okCliEnvelope({ resultRef: "canonical:result" });
    const failed = errorCliEnvelope(Object.assign(new Error("bad input"), { code: "SCHEMA_INVALID", exitCode: 10 }));
    expect(ok).not.toHaveProperty("error");
    expect(failed).not.toHaveProperty("result_ref");
    await assertSchemaFixture("cli-output.v1.schema.json", ok);
    await assertSchemaFixture("cli-output.v1.schema.json", failed);
  });

  it("writes exactly one JSON envelope and diagnostics only to stderr", async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    await expect(runPublicCli({ argv: ["unknown"], stdout, stderr })).resolves.toBe(2);
    expect(stdout.write).toHaveBeenCalledOnce();
    expect(() => JSON.parse(stdout.write.mock.calls[0][0])).not.toThrow();
    expect(stderr.write).toHaveBeenCalledOnce();
    expect(stdout.write.mock.calls[0][0]).not.toContain("CAPABILITY_UNAVAILABLE");
  });

  it("never serializes capability-shaped executor fields", async () => {
    const envelope = await executePublicCli({ argv: ["status", "--project", "Demo", "--task", "one"], executor: () => ({ result_ref: "canonical:status", capability_id: "secret" }) });
    expect(JSON.stringify(envelope)).not.toContain("secret");
  });

  it("does not expose executor errors or capability material", async () => {
    const stdout = { write: vi.fn() };
    const stderr = { write: vi.fn() };
    await expect(runPublicCli({ argv: ["status", "--project", "Demo", "--task", "one"], executor: () => { throw new Error("capability_id=secret"); }, stdout, stderr })).resolves.toBe(30);
    expect(`${stdout.write.mock.calls[0][0]}${stderr.write.mock.calls[0][0]}`).not.toContain("secret");
  });

  it("routes task create to the trusted default handler with the admitted payload", async () => {
    const task = { identity: { projectName: "Demo", taskId: "created" } };
    const createTask = vi.fn(() => task);
    const payload = {
      schema_id: "https://workflowhub.dev/schemas/task-create-input.v1.schema.json",
      schema_version: "1.0.0",
      project_name: "Demo",
      task_id: "created",
      source_ref: "sources/event.json",
      target_repository_ref: "repositories/product",
    };
    const executor = createLauncherExecutor({ launcherAuthority: {}, repositoryAuthority: {}, releaseAuthority: {}, createTask });
    await expect(executePublicCli({
      argv: ["task", "create", "--input", "@-"],
      stdin: JSON.stringify({
        schema_id: "https://workflowhub.dev/schemas/cli-input.v1.schema.json",
        schema_version: "1.0.0",
        command: "task",
        input_source: "@-",
        payload,
      }),
      executor,
    })).resolves.toEqual(okCliEnvelope({ resultRef: "projects/Demo/tasks/created/task.json" }));
    expect(createTask).toHaveBeenCalledWith(payload, expect.objectContaining({ launcherAuthority: {} }));
  });

  it.each([
    ["task identity mismatch", 11, "INTEGRITY_INVALID"],
    ["authentic capability required", 12, "AUTHORIZATION_FAILED"],
    ["release manifest hash mismatch", 13, "RELEASE_INVALID"],
    ["immutable record already exists", 14, "IMMUTABLE_CONFLICT"],
    ["authorization stale after live state drift", 15, "AUTHORIZATION_STALE"],
  ])("maps executor failure %s to a stable public class", (message, exitCode, code) => {
    const classified = classifyExecutorError(new Error(message));
    expect(classified).toMatchObject({ exitCode, code, safeForCli: true });
    expect(classified.message).not.toBe(message);
  });
});
