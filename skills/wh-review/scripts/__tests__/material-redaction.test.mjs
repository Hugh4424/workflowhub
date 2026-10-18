import yaml from "js-yaml";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createSimpleReviewPacket, rehydrateProviderInput, serializeProviderInput } from "../simple-review-runner.mjs";
import { redactProviderHostPaths } from "../review-materials.mjs";
import { providerMaterialPath, redactHostPathText } from "../../../../runtime/review/provider-material-projection.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });
const lines = text => text.split("\n").length;
function providerBundle(materials) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-redaction-"))); roots.push(root);
  const packet = createSimpleReviewPacket({ stage: "make-decision", review_track: "detail", materials });
  return rehydrateProviderInput(serializeProviderInput({ packet, hostProvider: "codex", providers: ["synthetic-fixture/model"], reviewMode: "single_round", prompt: "Synthetic local fixture only; no provider dispatch." }), root);
}

describe("provider-visible material redaction", () => {
  it("preserves digit regex literals instead of treating their d: as a drive", () => {
    const input = String.raw`const time = /\d\d:\d\d/;`;
    expect(redactHostPathText(input)).toBe(input);
    expect(redactProviderHostPaths(input)).toBe(input);
  });

  it("preserves escaped regex source passed to RegExp", () => {
    const input = String.raw`new RegExp("\\d\\d:\\d\\d")`;
    expect(redactHostPathText(input)).toBe(input);
  });

  it("preserves word-to-digit regex literals", () => {
    const input = String.raw`const pair = /\w:\d+/;`;
    expect(redactHostPathText(input)).toBe(input);
  });

  it("preserves ordinary time literals", () => {
    expect(redactHostPathText("meeting at 10:30 ok")).toBe("meeting at 10:30 ok");
  });

  it("still redacts actual Windows drive paths and Unix host paths", () => {
    expect(redactHostPathText(String.raw`open C:\Users\x\file.txt`)).toBe("open <host-path-redacted>");
    expect(redactHostPathText("see /Users/x/y now")).toBe("see <host-path-redacted> now");
  });

  it.each(["?", "."])("redacts Windows %s namespace drive paths without changing adjacent text", namespace => {
    const slash = String.fromCharCode(92);
    const path = slash.repeat(2) + namespace + slash + "C:" + slash + "Users" + slash + "fixture-user" + slash + "private.md";
    const input = "open " + path + "，next sentence\n";
    expect(redactHostPathText(input)).toBe("open <host-path-redacted>，next sentence\n");
    expect(redactProviderHostPaths({ nested: [input] })).toEqual({ nested: ["open <host-path-redacted>，next sentence\n"] });
    expect(redactProviderHostPaths(Buffer.from(input, "utf8")).toString("utf8")).toBe("open <host-path-redacted>，next sentence\n");
  });

  it.each(["?", "."])("redacts Windows %s namespace drive paths through the actual provider serializer", namespace => {
    const slash = String.fromCharCode(92);
    const path = slash.repeat(2) + namespace + slash + "C:" + slash + "Users" + slash + "fixture-user" + slash + "private.md";
    const restored = providerBundle({ raw_requirement: "open " + path + "\n", context_map: { path } });
    try {
      expect(readFileSync(join(restored.materials.bundleRoot, "materials/01-raw_requirement.md"), "utf8")).toBe("open <host-path-redacted>\n");
      expect(JSON.parse(readFileSync(join(restored.materials.bundleRoot, "materials/02-context_map.json"), "utf8"))).toEqual({ path: "<host-path-redacted>" });
    } finally { restored.materials.dispose(); }
  });

  it("preserves regex source through UTF-8 Buffer and Uint8Array projection", () => {
    const input = String.raw`/\d\d:\d\d/`;
    const buffer = redactProviderHostPaths(Buffer.from(input, "utf8"));
    const uint8 = redactProviderHostPaths(new Uint8Array(Buffer.from(input, "utf8")));
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString("utf8")).toBe(input);
    expect(uint8).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(uint8).toString("utf8")).toBe(input);
  });
  it("preserves the real pinned public source URL and reviewer line positions", () => {
    const catalog = yaml.load(readFileSync(new URL("../../../catalog.yaml", import.meta.url), "utf8"));
    const skills = catalog.skills.filter(skill => skill.name === "grill-with-docs");
    expect(skills).toHaveLength(1);
    const sources = skills[0].upstream.filter(source => source.path === "skills/engineering/grill-with-docs/SKILL.md");
    expect(sources).toHaveLength(1);
    const source = sources[0];
    expect(source.github_url).toBe("https://github.com/mattpocock/skills");
    expect(source.commit).toBe("b0618bc436ad893b3c5e84e55fba86586d34a404");
    expect(source.commit).toMatch(/^[a-f0-9]{40}$/);
    expect(source.skill_url).toBe(`${source.github_url}/blob/${source.commit}/${source.path}`);
    const url = source.skill_url;
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

// Independent TCR458: preserve an executable keyword, never a credential value.
import { createHash as n3LexicalHash } from "node:crypto";
describe("N3 P2 lexical redaction", () => {
  const recordLine = 'const authorization = await record({ operation: "commit", confirmationRef: "confirm-2" });';
  const consumeLine = 'const authorization = await consume({ operation: "commit" });';
  it("preserves the real authorization record source line and its line mapping", () => {
    const source = readFileSync(new URL("../../../../tests/contract/narrow-tool-git-authorize.test.mjs", import.meta.url), "utf8");
    expect(source.split("\n")[78]).toBe("    " + recordLine);
    const projected = redactProviderHostPaths(source);
    expect(projected.split("\n")[78]).toBe(source.split("\n")[78]);
    expect(lines(projected)).toBe(lines(source));
  });
  it.each([
    recordLine, consumeLine,
    'let authorization = await api.consume({ operation: "commit" });',
    '\tconst\tauthorization\t=\tawait\trecord({ operation: "commit" });',
    '+' + recordLine, '-' + consumeLine,
  ])("preserves only explicit executable awaited calls: %s", source => {
    expect(redactProviderHostPaths(source)).toBe(source);
  });
  it("keeps string Buffer Uint8Array types and idempotent projected bytes", () => {
    const source = recordLine + '\n' + consumeLine + '\nAPI_KEY=synthetic-lexical-key\n';
    const expected = recordLine + '\n' + consumeLine + '\nAPI_KEY=<secret-redacted>\n';
    for (const value of [source, Buffer.from(source), new Uint8Array(Buffer.from(source))]) {
      const output = redactProviderHostPaths(value);
      expect(typeof output === "string" ? output : Buffer.from(output).toString()).toBe(expected);
      if (typeof value === "string") expect(typeof output).toBe("string");
      else if (Buffer.isBuffer(value)) expect(Buffer.isBuffer(output)).toBe(true);
      else { expect(output).toBeInstanceOf(Uint8Array); expect(Buffer.isBuffer(output)).toBe(false); }
      expect(redactProviderHostPaths(output)).toEqual(output);
    }
  });
  it.each([
    'authorization=await', 'authorization: await', 'authorization="await"', "authorization='await'",
    'const authorization = "await";', '{ authorization: "await" }',
    '"const authorization = await consume()"', "'const authorization = await consume()'",
    '// const authorization = await consume()', '/*\nconst authorization = await consume()\n*/',
    '`multiline\nconst authorization = await consume()\nend`',
    '"escaped \\" text; const authorization = await consume()"',
    '`outer ${"text"}\nconst authorization = await consume()\nend`',
    'const authorization = await;', 'prose const authorization = await consume()',
  ])("retains conservative protection for non-code or ambiguous carriers: %s", source => {
    expect(redactProviderHostPaths(source)).toContain("<secret-redacted>");
  });
  it("preserves awaited syntax while redacting mixed arguments and actual serialized egress", () => {
    const source = [recordLine, consumeLine,
      'const authorization = await api.consume({ api_key: "synthetic-lexical-argument", path: "/Users/fixture/private.md" });',
      'const authorization = await api.consume({ path: "C:\\Users\\fixture\\private.md", url: "file:///tmp/fixture-private.md" });',
      'Authorization: Bearer synthetic-lexical-bearer', 'Authorization: Basic synthetic-lexical-basic',
      'Bearer synthetic-lexical-standalone', '// const authorization = await consume()',
      '`template\nconst authorization = await consume()\nend`',
      'https://user:synthetic-lexical-password@example.com/a?api_key=synthetic-lexical-query&view=raw，尾句',
    ].join('\n');
    const restored = providerBundle({raw_requirement: source, context_map: {nested: {authorization: "await", public: "https://example.com/public"}}});
    try {
      const file = "materials/01-raw_requirement.md";
      const bytes = readFileSync(join(restored.materials.bundleRoot, file));
      const text = bytes.toString();
      expect(text.split('\n')[0]).toBe(recordLine); expect(text.split('\n')[1]).toBe(consumeLine);
      expect(text).toContain('const authorization = await api.consume(');
      for (const secret of ["synthetic-lexical-argument", "synthetic-lexical-bearer", "synthetic-lexical-basic", "synthetic-lexical-standalone", "synthetic-lexical-password", "synthetic-lexical-query", "/Users/fixture/", "C:\\Users\\fixture\\", "file:///tmp/"]) expect(text).not.toContain(secret);
      expect(text).toContain("view=raw，尾句"); expect(lines(text)).toBe(lines(source));
      expect(redactProviderHostPaths(text)).toBe(text);
      expect(text).toContain('// const authorization = <secret-redacted> consume()');
      expect(text).toContain('`template\nconst authorization = <secret-redacted> consume()\nend`');
      const nested = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "materials/02-context_map.json"), "utf8"));
      expect(nested.nested.authorization).toBe("<secret-redacted>");
      const manifest = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "manifest.json"), "utf8"));
      const member = manifest.files.find(entry => entry.path === file);
      expect(member.sha256).toBe(n3LexicalHash("sha256").update(bytes).digest("hex"));
      expect(member.bytes).toBe(bytes.length);
    } finally { restored.materials.dispose(); }
  });
});
