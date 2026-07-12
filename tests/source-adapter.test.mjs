import { describe, expect, it } from "vitest";
import {
  normalizeMulticaSource,
  normalizeOfflineSource,
} from "../core/multica-source-adapter.mjs";

const requirement = {
  requirement_id: "R1",
  content: "Keep requirement identity immutable.",
  evidence_refs: [{ kind: "source", uri_or_path: "memory://source/R1", content_hash: "hash-r1" }],
};

describe("Multica source adapter", () => {
  it("normalizes equivalent Multica and offline fixtures to the same canonical requirements", () => {
    const multica = normalizeMulticaSource({
      issue_id: "issue-42",
      revision: "v1",
      completeness: "complete",
      requirements: [requirement],
    });
    const offline = normalizeOfflineSource({
      source_id: "issue-42",
      revision: "v1",
      completeness: "complete",
      requirements: [requirement],
    });

    expect(multica).toMatchObject({
      ok: true,
      source_type: "multica",
      source_id: "issue-42",
      revision: "v1",
      completeness: "complete",
      requirements: [requirement],
    });
    expect(offline).toMatchObject({
      ok: true,
      source_type: "offline_fixture",
      source_id: "issue-42",
      revision: "v1",
      completeness: "complete",
      requirements: [requirement],
    });
    expect(multica.requirements).toEqual(offline.requirements);
    expect(multica).not.toHaveProperty("issue_id");
  });

  it("returns SOURCE_INCOMPLETE instead of manufacturing an empty canonical source", () => {
    const result = normalizeMulticaSource({
      issue_id: "issue-42",
      revision: "v1",
      completeness: "incomplete",
      requirements: [],
    });

    expect(result).toEqual({ ok: false, code: "SOURCE_INCOMPLETE" });
  });

  it("treats a missing authoritative requirement set as SOURCE_INCOMPLETE", () => {
    const result = normalizeMulticaSource({ issue_id: "issue-42", revision: "v1" });

    expect(result).toEqual({ ok: false, code: "SOURCE_INCOMPLETE" });
  });

  it("preserves an explicitly unknown complete source as SOURCE_UNKNOWN", () => {
    const result = normalizeMulticaSource({
      issue_id: "issue-42",
      revision: "v1",
      completeness: "unknown",
      requirements: [requirement],
    });

    expect(result).toEqual({ ok: false, code: "SOURCE_UNKNOWN" });
  });

  it("reports SOURCE_INCOMPLETE when required source identity is missing", () => {
    const result = normalizeMulticaSource({
      revision: "v1",
      completeness: "unknown",
      requirements: [requirement],
    });

    expect(result).toEqual({ ok: false, code: "SOURCE_INCOMPLETE" });
  });
});
