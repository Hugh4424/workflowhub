import { expect, test } from "vitest";
import { ReviewProviderClient } from "../review-provider-client.mjs";

const materials = {
  bundleRoot: "/tmp/bundle",
  attachmentRoot: "/tmp/attachments",
  materialId: "material-id",
  sourcePrefix: ".wh-review-packets",
  deliveryManifest: [],
};

test("default broker wait covers the current long-running public review", () => {
  const client = new ReviewProviderClient({ command: [process.execPath], config: "fixture-config" });
  expect(client.timeoutMs).toBeGreaterThanOrEqual(600_000);
});

test("client bounds a hanging broker and returns a typed timeout", async () => {
  const client = new ReviewProviderClient({
    command: [process.execPath, "-e", "setTimeout(() => {}, 1000)"],
    config: "fixture-config",
    timeoutMs: 25,
  });
  await expect(client.runGroup({
    hostProvider: "codex/terra",
    providers: ["codex/luna"],
    materials,
    prompt: "review",
  })).rejects.toMatchObject({ code: "PROCESS_TIMEOUT" });
});
