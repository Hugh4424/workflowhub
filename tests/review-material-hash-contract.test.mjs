import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildClassificationManifest } from "../runtime/review/review-controller.mjs";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function entry(materials, identity) {
  return buildClassificationManifest(materials).entries.find((item) => item.identity === identity);
}

describe("review material hash contract", () => {
  it("hashes string materials as their raw UTF-8 bytes", () => {
    const raw = "spec\n中文\n";
    expect(entry({ approved_spec: raw }, "approved_spec").sha256).toBe(sha256(Buffer.from(raw, "utf8")));
  });

  it("hashes Buffer materials as their raw bytes", () => {
    const raw = Buffer.from([0, 1, 2, 255]);
    expect(entry({ approved_spec: raw }, "approved_spec").sha256).toBe(sha256(raw));
  });

  it("hashes objects and arrays with stable canonical JSON", () => {
    const objectHash = entry({ approved_spec: { b: 2, a: 1 } }, "approved_spec").sha256;
    const reorderedHash = entry({ approved_spec: { a: 1, b: 2 } }, "approved_spec").sha256;
    const arrayHash = entry({ acceptance_criteria: ["AC-1", { b: 2, a: 1 }] }, "acceptance_criteria").sha256;
    expect(objectHash).toBe(reorderedHash);
    expect(objectHash).toBe(sha256(Buffer.from('{"a":1,"b":2}', "utf8")));
    expect(arrayHash).toBe(sha256(Buffer.from('["AC-1",{"a":1,"b":2}]', "utf8")));
  });
});
