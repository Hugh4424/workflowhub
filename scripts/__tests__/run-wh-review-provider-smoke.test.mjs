import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertProviderRound } from "../run-wh-review-provider-smoke.mjs";

const script = fileURLToPath(new URL("../run-wh-review-provider-smoke.mjs", import.meta.url));

describe("run-wh-review-provider-smoke", () => {
  it("reports an explicit SKIP before reading host config unless real-provider opt-in is set", () => {
    const result = spawnSync(process.execPath, [script], {
      env: { PATH: process.env.PATH ?? "", HOME: "/missing-wh-review-smoke-home" },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "SKIP",
      reason: "WH_REVIEW_PROVIDER_SMOKE=1 is required",
    });
    expect(result.stdout).not.toContain("PASS");
  });

  it("turns a provider terminal-output failure into an explicit smoke failure", () => {
    expect(() => assertProviderRound({
      providerId: "kimi", round: 1, expectedMarker: "R1_DIFF_MARKER",
      response: { runtime_id: "runtime", providers: [{ provider: "kimi", status: "failed", error: { code: "PROVIDER_OUTPUT_INVALID" } }] },
    })).toThrow("SMOKE_KIMI_R1_FAIL: provider status=failed; PROVIDER_OUTPUT_INVALID");
  });
});
