import { describe, expect, it } from "vitest";
import { createCanonicalSource } from "../runtime/evidence/canonical-source.mjs";

const completeSource = {
  source_type: "host_input",
  source_id: "source-42",
  revision: "v1",
  completeness: "complete",
  requirements: ["Keep requirement identity immutable."],
};

describe("canonical source input", () => {
  it("accepts complete host-neutral input with a deterministic content hash", () => {
    const first = createCanonicalSource(completeSource);
    const second = createCanonicalSource(completeSource);

    expect(first).toMatchObject({ ok: true, ...completeSource });
    expect(first.content_hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(second).toEqual(first);
  });

  it("rejects an explicitly incomplete source", () => {
    expect(createCanonicalSource({ ...completeSource, completeness: "incomplete" }))
      .toEqual({ ok: false, code: "SOURCE_INCOMPLETE" });
  });

  it("rejects a missing authoritative requirement set", () => {
    const { requirements: _requirements, ...source } = completeSource;
    expect(createCanonicalSource(source))
      .toEqual({ ok: false, code: "SOURCE_INCOMPLETE" });
  });

  it("preserves an explicitly unknown source", () => {
    expect(createCanonicalSource({ ...completeSource, completeness: "unknown" }))
      .toEqual({ ok: false, code: "SOURCE_UNKNOWN" });
  });

  it("rejects missing source identity", () => {
    const { source_id: _sourceId, ...source } = completeSource;
    expect(createCanonicalSource(source))
      .toEqual({ ok: false, code: "SOURCE_INCOMPLETE" });
  });
});
