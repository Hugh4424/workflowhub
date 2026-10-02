import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSimpleReviewPacket, rehydrateProviderInput, serializeProviderInput } from "../simple-review-runner.mjs";
import { redactProviderHostPaths } from "../review-materials.mjs";
import { providerMaterialPath } from "../../../../runtime/review/provider-material-projection.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
const lines = text => text.split("\n").length;
function providerBundle(materials) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-redaction-"))); roots.push(root);
  const packet = createSimpleReviewPacket({ stage: "make-decision", review_track: "detail", materials });
  return rehydrateProviderInput(serializeProviderInput({ packet, hostProvider: "codex", providers: ["synthetic-fixture/model"], reviewMode: "single_round", prompt: "Synthetic local fixture only; no provider dispatch." }), root);
}

describe("provider-visible material redaction", () => {
  it("preserves the real pinned public source URL and reviewer line positions", () => {
    const skill = readFileSync(new URL("../../../grill-with-docs/SKILL.md", import.meta.url), "utf8");
    const url = skill.match(/https:\/\/github\.com\/mattpocock\/skills\/blob\/[a-f0-9]{40}\/[^>\s]+/)[0];
    const input = `上游 ${url}，来源正文。\n见 /Users/fixture/private.md，取消理由：DEF-01；DEF-01\n末行\n`;
    const output = redactProviderHostPaths(input);
    expect(output).toContain(url);
    expect(output).toContain("，来源正文。\n");
    expect(output).toContain("，取消理由：DEF-01；DEF-01\n");
    expect(output).not.toContain("/Users/fixture/");
    expect(lines(output)).toBe(lines(input));
    expect(redactProviderHostPaths(output)).toBe(output);
  });

  it("removes Unix, Windows and file URLs while preserving public URLs with path-like segments", () => {
    const input = '/home/fixture/private.md\nC:\\Users\\fixture\\private.md\nfile:///Users/fixture/private.md\nhttps://example.com/docs/Users/public.md?view=raw#section\n';
    const output = redactProviderHostPaths(input);
    for (const secret of ["/home/fixture", "C:\\Users\\fixture", "file:///Users/fixture"]) expect(output).not.toContain(secret);
    expect(output).toContain("https://example.com/docs/Users/public.md?view=raw#section\n");
    expect(lines(output)).toBe(lines(input));
  });

  it("removes known credential assignments and standalone Bearer tokens without dropping lines", () => {
    const input = 'API_KEY=synthetic-key-one\napiKey: "synthetic-key-two"\nAuthorization: Bearer synthetic-bearer\nBearer synthetic-standalone\nclient_secret=synthetic-client\n';
    const output = redactProviderHostPaths(input);
    for (const secret of ["synthetic-key-one", "synthetic-key-two", "synthetic-bearer", "synthetic-standalone", "synthetic-client"]) expect(output).not.toContain(secret);
    expect(output).toContain("<secret-redacted>");
    expect(lines(output)).toBe(lines(input));
  });

  it("redacts complete known credential values that contain URLs", () => {
    for (const input of ['api_key="prefix https://example.com/synthetic-cross-url"', "Authorization: Bearer https://example.com/synthetic-bearer-url", "Bearer https://example.com/synthetic-standalone-url"]) {
      const output = redactProviderHostPaths(input);
      expect(output).not.toContain("synthetic-");
      expect(output).toContain("<secret-redacted>");
      expect(redactProviderHostPaths(output)).toBe(output);
    }
    expect(redactProviderHostPaths('api_key=""')).toBe('api_key=""');
    expect(redactProviderHostPaths("https://example.com/public?view=raw&api_key=synthetic-query#section"))
      .toBe("https://example.com/public?view=raw&api_key=REDACTED#section");
  });

  it("projects nested known secret fields and preserves ordinary JSON values", () => {
    const input = { APIKey: "synthetic-json-key", nested: { authorization: "Bearer synthetic-json-bearer", OPENAI_API_KEY: "synthetic-env-key", note: "正文 /tmp/fixture.md，下一句", count: 3, empty: null }, rows: [{ clientSecret: "synthetic-json-client", public: "https://example.com/a" }] };
    const output = redactProviderHostPaths(input);
    for (const secret of ["synthetic-json-key", "synthetic-json-bearer", "synthetic-env-key", "synthetic-json-client"]) expect(JSON.stringify(output)).not.toContain(secret);
    expect(output.nested.count).toBe(3); expect(output.nested.empty).toBeNull();
    expect(output.nested.note).toContain("，下一句"); expect(output.rows[0].public).toBe(input.rows[0].public);
    expect(input.APIKey).toBe("synthetic-json-key");
  });

  it("edits only URL credentials and sensitive query values, preserving escapes, public parameters and fragments", () => {
    const input = "https://user:synthetic-password@example.com/a%20b?view=raw&access%5Ftoken=synthetic-query&x=public#section";
    const output = redactProviderHostPaths(input);
    expect(output).toBe("https://REDACTED@example.com/a%20b?view=raw&access%5Ftoken=REDACTED&x=public#section");
    expect(redactProviderHostPaths(output)).toBe(output);
    expect(redactProviderHostPaths("api_key=https://secret.example/opaque-secret\n")).toBe("api_key=<secret-redacted>\n");
  });

  it("redacts UTF-8 byte materials and rejects undecodable bytes instead of leaking opaque payloads", () => {
    const input = Buffer.from("\ufeffapi_key=synthetic-buffer-key\n/home/fixture/private.md，下一句\n");
    const output = redactProviderHostPaths(input);
    expect(Buffer.isBuffer(output)).toBe(true);
    expect(output.toString()).not.toContain("synthetic-buffer-key");
    expect(output.toString()).not.toContain("/home/fixture/");
    expect(output.toString()).toContain("，下一句\n");
    expect(output.toString().startsWith("\ufeff")).toBe(true);
    expect(lines(output.toString())).toBe(lines(input.toString()));
    const uint8 = redactProviderHostPaths(new Uint8Array(Buffer.from("Bearer synthetic-uint8")));
    expect(uint8).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(uint8).toString()).not.toContain("synthetic-uint8");
    expect(() => redactProviderHostPaths(Buffer.from([0xff, 0xfe]))).toThrow(/MATERIAL_NOT_UTF8/);
  });

  it("delivers sanitized text and JSON through the actual serializer and provider bundle writer", () => {
    const publicUrl = "https://example.com/docs/Users/public.md?view=raw";
    const restored = providerBundle({ raw_requirement: `来源 ${publicUrl}，保留正文\nAPI_KEY=synthetic-egress-key\n/Users/fixture/private.md，后续句子\n`, context_map: { authorization: "Bearer synthetic-egress-bearer", url: "https://user:synthetic-egress-password@example.com/a?token=synthetic-egress-query&view=raw" } });
    try {
      const text = readFileSync(join(restored.materials.bundleRoot, "materials/01-raw_requirement.md"), "utf8");
      const json = readFileSync(join(restored.materials.bundleRoot, "materials/02-context_map.json"), "utf8");
      const combined = text + json;
      for (const secret of ["synthetic-egress-key", "synthetic-egress-bearer", "synthetic-egress-password", "synthetic-egress-query", "/Users/fixture/"]) expect(combined).not.toContain(secret);
      expect(text).toContain(publicUrl); expect(text).toContain("，后续句子\n");
      const manifest = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "manifest.json"), "utf8"));
      expect(manifest.files.map(entry => entry.path)).toContain("materials/01-raw_requirement.md");
      expect(manifest.files.map(entry => entry.path)).toContain("materials/02-context_map.json");
    } finally { restored.materials.dispose(); }
  });

  it("delivers projected UTF-8 Buffers through the actual serializer", () => {
    const restored = providerBundle({ raw_requirement: Buffer.from("api_key=synthetic-egress-buffer\n/tmp/fixture-secret.md，尾句\n") });
    try {
      const text = readFileSync(join(restored.materials.bundleRoot, "materials/01-raw_requirement.md"), "utf8");
      expect(text).not.toContain("synthetic-egress-buffer"); expect(text).not.toContain("/tmp/fixture-secret.md");
      expect(text).toContain("，尾句\n");
    } finally { restored.materials.dispose(); }
  });

  it("keeps the broker-required direction flow path and numbered ordinary material paths", () => {
    expect(providerMaterialPath("direction_flow", 8, { version: "direction-review.v1" })).toBe("direction_flow.json");
    expect(providerMaterialPath("raw_requirement", 0, "text")).toBe("materials/01-raw_requirement.md");
    expect(providerMaterialPath("context_map", 3, { note: true })).toBe("materials/04-context_map.json");
  });
});
