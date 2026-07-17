import { describe, expect, it } from "vitest";
import {
  authenticateMulticaEvent,
  createMulticaAdapter,
  dispatchMulticaCommand,
  normalizeMulticaSource,
  projectMulticaStatus,
} from "../adapters/multica/index.mjs";
import { normalizeMulticaSource as normalizeFromLegacyForwarder } from "../core/multica-source-adapter.mjs";
import { consumeHumanConfirmation, createTrustedSignatureProof, createTrustedSignatureVerifier } from "../core/human-confirmation.mjs";

const MULTICA_SIGNING_KEY = "workflowhub-multica-adapter-signing-key-v1";

const requirement = {
  requirement_id: "R1",
  content: "Keep requirement identity immutable.",
  evidence_refs: [{ kind: "source", uri_or_path: "memory://source/R1", content_hash: "hash-r1" }],
};

describe("Multica source adapter", () => {
  it("normalizes public source fields without leaking Multica private fields", () => {
    const multica = normalizeMulticaSource({
      issue_id: "issue-42",
      multica_issue_internal_id: "private-7",
      revision: "v1",
      completeness: "complete",
      requirements: [{ ...requirement, internal_comment_id: "private-comment-9", evidence_refs: [{ ...requirement.evidence_refs[0], multica_attachment_id: "private-attachment-3" }] }],
    });

    expect(multica).toMatchObject({
      ok: true,
      source_type: "multica",
      source_id: "issue-42",
      revision: "v1",
      completeness: "complete",
      requirements: [requirement],
    });
    expect(multica).not.toHaveProperty("issue_id");
    expect(multica).not.toHaveProperty("multica_issue_internal_id");
    expect(JSON.stringify(multica)).not.toMatch(/private-|multica_attachment_id|internal_comment_id/);
    expect(normalizeFromLegacyForwarder({ issue_id: "issue-42", revision: "v1", completeness: "complete", requirements: [requirement] })).toEqual(multica);
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

  it("authenticates actor and decision only from trusted platform event readback", async () => {
    const envelope = await authenticateMulticaEvent({
      event_ref: "source-events/comment-42.json",
      actor_id: "spoofed-agent",
      decision: "rejected",
      purpose: "stage",
      task_id: "task-42",
      bound_ref: "results/make-decision/attempt-1.json",
      bound_hash: "a".repeat(64),
    }, {
      now: () => "2026-07-17T00:00:01.000Z",
      readbackEvent: async () => ({
        ref: "source-events/comment-42.json",
        sha256: "b".repeat(64),
        occurred_at: "2026-07-17T00:00:00.000Z",
        actor_id: "human-stable-7",
        actor_type: "human",
        decision: "accepted",
        proof_ref: "authentication/comment-42.json",
        proof_hash: "c".repeat(64),
        private_token: "must-not-leak",
      }),
      verifyPlatformEvent: async (event) => event.ref === "source-events/comment-42.json" && event.proof_hash === "c".repeat(64),
      signConfirmation: async (candidate) => createTrustedSignatureProof(MULTICA_SIGNING_KEY, candidate),
    });

    expect(envelope).toMatchObject({
      actor: { id: "human-stable-7", type: "human" },
      decision: "accepted",
      authentication: { method: "signature", proof_ref: "authentication/comment-42.json", proof_hash: "c".repeat(64), signature: expect.stringMatching(/^[a-f0-9]{64}$/) },
    });
    expect(JSON.stringify(envelope)).not.toMatch(/private_token|must-not-leak/);
    expect(consumeHumanConfirmation(envelope, {
      purpose: "stage", taskId: "task-42", boundRef: envelope.bound_ref, boundHash: envelope.bound_hash,
      consumedEvents: new Set(), verifyTrustedSignature: createTrustedSignatureVerifier(MULTICA_SIGNING_KEY),
    })).toMatchObject({ accepted: true });
  });

  it("rejects a readback whose platform event identity does not match", async () => {
    await expect(authenticateMulticaEvent({ event_ref: "source-events/comment-42.json" }, {
      readbackEvent: async () => ({ ref: "source-events/other.json" }),
      verifyPlatformEvent: async () => true,
      signConfirmation: async () => "0".repeat(64),
    })).rejects.toThrow(/identity mismatch/i);
  });

  it("rejects a forged platform readback before launcher signing", async () => {
    await expect(authenticateMulticaEvent({ event_ref: "source-events/comment-42.json" }, {
      readbackEvent: async () => ({ ref: "source-events/comment-42.json" }),
      verifyPlatformEvent: async () => false,
      signConfirmation: async () => "0".repeat(64),
    })).rejects.toThrow(/platform event verification failed/i);
  });

  it("lets the public trust boundary reject a forged launcher signature", async () => {
    const request = {
      event_ref: "source-events/comment-43.json", purpose: "stage", task_id: "task-42",
      bound_ref: "results/make-decision/attempt-1.json", bound_hash: "a".repeat(64),
    };
    const event = {
      ref: request.event_ref, sha256: "b".repeat(64), occurred_at: "2026-07-17T00:00:00.000Z",
      actor_id: "human-stable-7", actor_type: "human", decision: "accepted",
      proof_ref: "authentication/comment-43.json", proof_hash: "c".repeat(64),
    };
    const forged = await authenticateMulticaEvent(request, {
      now: () => "2026-07-17T00:00:01.000Z", readbackEvent: async () => event,
      verifyPlatformEvent: async () => true, signConfirmation: async () => "0".repeat(64),
    });
    expect(() => consumeHumanConfirmation(forged, {
      purpose: "stage", taskId: request.task_id, boundRef: request.bound_ref, boundHash: request.bound_hash,
      consumedEvents: new Set(), verifyTrustedSignature: createTrustedSignatureVerifier(MULTICA_SIGNING_KEY),
    })).toThrow(/trusted signature proof is invalid/i);
  });

  it("dispatches only through the injected public CLI", async () => {
    const calls = [];
    const request = { argv: ["status", "--project", "Demo", "--task", "task-42"] };
    const result = await dispatchMulticaCommand(request, { publicCli: async (value) => { calls.push(value); return { result_ref: "tasks/task-42/status" }; } });

    expect(result).toMatchObject({ dispatched: true });
    expect(calls).toEqual([request]);
  });

  it("keeps projection failure separate from canonical task state and retries", async () => {
    let attempts = 0;
    const failed = await projectMulticaStatus({ source_ref: "multica:issue-42", status: "closed" }, {
      maxAttempts: 3,
      writeStatus: async () => { attempts += 1; throw new Error("platform unavailable"); },
    });

    expect(failed).toEqual({ dispatched: false, code: "PROJECTION_FAILED", attempts: 3 });
    expect(attempts).toBe(3);
    expect(failed).not.toHaveProperty("canonical_stage_changed");
  });

  it("implements the versioned generic adapter port", () => {
    const adapter = createMulticaAdapter({
      readbackEvent: async () => ({}),
      verifyPlatformEvent: async () => true,
      signConfirmation: async () => "0".repeat(64),
      publicCli: async () => ({}),
      writeStatus: async () => {},
    });
    expect(adapter).toMatchObject({ adapterId: "multica", adapterVersion: "1.0.0" });
    expect(["normalizeSource", "authenticateEvent", "dispatch", "projectStatus"].every((name) => typeof adapter[name] === "function")).toBe(true);
  });
});
