import { describe, expect, it } from "vitest";
import { runProviderSmoke } from "../run-wh-review-provider-smoke.mjs";
describe("real provider smoke safety", () => {
  it("requires every repository and evidence path explicitly", async () => {
    await expect(runProviderSmoke({})).rejects.toThrow(/explicit source_root/);
  });
  it("rejects relative source paths before provider startup", async () => {
    await expect(runProviderSmoke({ source_root: "." })).rejects.toThrow(/source_root must be absolute/);
  });
});
