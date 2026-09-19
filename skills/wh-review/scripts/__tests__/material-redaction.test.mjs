import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  createSimpleReviewPacket,
  rehydrateProviderInput,
  serializeProviderInput,
} from "../simple-review-runner.mjs";
import { redactProviderHostPaths } from "../review-materials.mjs";
import { providerMaterialPath } from "../../../../runtime/review/provider-material-projection.mjs";
import { deliveredMaterialId } from "../../../../runtime/review/review-packet-identity.mjs";

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

const HOST_SECRETS = ["/Users/", "/home/", "/private/", "/tmp/", "C:\\Users\\"];

// Independent oracle for the broker's identity, mirroring
// `3rd-review/lib/attachments.mjs` `canonicalWorkflowHubMaterialId(files)`:
// sha256 of the JSON array of {path, bytes, sha256} sorted by path bytes, over
// every delivered file except the transport wrappers. It is written out here
// rather than imported so the tests keep a second implementation to compare
// against.
const brokerMaterialId = (files) => createHash("sha256")
  .update(JSON.stringify(files
    .filter(({ path }) => !["manifest.json", "canonical-evidence.json"].includes(path))
    .map(({ path, bytes, sha256 }) => ({ path, bytes, sha256: sha256.toLowerCase() }))
    .sort((left, right) => Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8")))))
  .digest("hex");

describe("simple review material host-path redaction", () => {
  it("redacts host paths from string and JSON materials and keeps the bundle manifest honest", () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-redaction-")));
    roots.push(attachmentRoot);
    const input = {
      stage: "make-decision",
      review_track: "detail",
      materials: {
        raw_requirement: "用户需求见 /Users/Hugh/Downloads/make-decision调研深度优化方案.md 与 /tmp/notes.md",
        context_map: {
          note: "see /home/user/context.json",
          source: "/private/var/tmp/provider-secret.json",
          nested: { ref: "C:\\Users\\reviewer\\dump.json" },
        },
      },
    };
    const packet = createSimpleReviewPacket({ stage: input.stage, review_track: input.review_track, materials: input.materials });
    const providerInput = serializeProviderInput({
      packet,
      hostProvider: "codex",
      providers: ["other/model"],
      reviewMode: "single_round",
      prompt: "review exact bytes",
    });
    const restored = rehydrateProviderInput(providerInput, attachmentRoot);
    try {
      expect(restored.materials.materialId).toBe(packet.material_id);
      const text = readFileSync(join(restored.materials.bundleRoot, "materials/01-raw_requirement.md"), "utf8");
      const json = readFileSync(join(restored.materials.bundleRoot, "materials/02-context_map.json"), "utf8");
      for (const [label, content] of [["text material", text], ["json material", json]]) {
        for (const secret of HOST_SECRETS) expect(content, `${label} leaks ${secret}`).not.toContain(secret);
        expect(content, `${label} keeps a redaction marker`).toContain("<host-path-redacted>");
      }
      const manifest = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "manifest.json"), "utf8"));
      // The manifest lists every bundle file except itself: it is serialized
      // before its own entry is appended to the delivery list.
      expect(manifest.files.map(({ path }) => path)).toEqual([
        "review-instructions.md",
        "materials/01-raw_requirement.md",
        "materials/02-context_map.json",
      ]);
      for (const entry of manifest.files) {
        const bytes = readFileSync(join(restored.materials.bundleRoot, ...entry.path.split("/")));
        expect(entry.sha256, entry.path).toBe(createHash("sha256").update(bytes).digest("hex"));
        expect(entry.bytes, entry.path).toBe(bytes.length);
      }
    } finally {
      restored.materials.dispose();
    }
  });

  it("preserves CJK prose and DEF-01 tokens after a redacted host path", () => {
    const input = "来源 /Users/Hugh/notes.md，取消理由：DEF-01；DEF-01";
    const redacted = redactProviderHostPaths(input);
    const tokenCount = (value) => (value.match(/DEF-01/g) ?? []).length;

    expect(redacted).toContain("<host-path-redacted>");
    expect(redacted).not.toContain("/Users/Hugh/");
    expect(redacted).toContain("取消理由：");
    expect(tokenCount(input)).toBe(2);
    expect(tokenCount(redacted)).toBe(2);
  });

  // Regression for the direction-review material check. `direction_flow` is a
  // declared make-decision material, but the broker's managed direction
  // validation requires a delivered path whose last segment is exactly
  // `direction_flow.json`. The numbered form `materials/09-direction_flow.json`
  // does not match, so every direction provider failed with
  // `MATERIAL_INCOMPLETE: direction-review.v1 material is missing
  // direction_flow.json` even though the file was present in the bundle.
  it("delivers the direction flow under a path the broker direction check accepts", () => {
    // `3rd-review/lib/broker.mjs` validateDirectionReviewMaterial.
    const brokerAcceptsDirectionFlow = (target) => target === "direction_flow.json" || target.endsWith("/direction_flow.json");
    const flow = providerMaterialPath("direction_flow", 8, { version: "direction-review.v1" });
    expect(flow).toBe("direction_flow.json");
    expect(brokerAcceptsDirectionFlow(flow)).toBe(true);
    expect(brokerAcceptsDirectionFlow("materials/09-direction_flow.json")).toBe(false);
    // Ordinary materials keep their numbered provider path.
    expect(providerMaterialPath("raw_requirement", 0, "text")).toBe("materials/01-raw_requirement.md");
    expect(providerMaterialPath("context_map", 3, { note: true })).toBe("materials/04-context_map.json");
    expect(providerMaterialPath("raw_requirement", 0, Buffer.from("x"))).toBe("materials/01-raw_requirement.md");
  });

  // The pre-dispatch self-check can only protect the boundary if the oracle it
  // compares against is sensitive to exactly the delivered path set.
  it("detects delivered-path drift against the declared identity", () => {
    const sha = (c) => c.repeat(64);
    const entries = [
      { path: "review-instructions.md", bytes: 1, sha256: sha("a") },
      { path: "materials/01-raw_requirement.md", bytes: 2, sha256: sha("b") },
      { path: "manifest.json", bytes: 3, sha256: sha("c") },
    ];
    expect(deliveredMaterialId(entries)).toBe(deliveredMaterialId(entries));
    // Transport wrappers are excluded exactly like the broker excludes them.
    expect(deliveredMaterialId(entries))
      .toBe(deliveredMaterialId([entries[0], entries[1], { path: "manifest.json", bytes: 9, sha256: sha("d") }]));
    // A renamed delivered material is a different delivered identity.
    expect(deliveredMaterialId(entries))
      .not.toBe(deliveredMaterialId([entries[0], { ...entries[1], path: "direction_flow.json" }, entries[2]]));
    // So is a changed byte length or hash.
    expect(deliveredMaterialId(entries))
      .not.toBe(deliveredMaterialId([entries[0], { ...entries[1], bytes: 3 }, entries[2]]));
  });

  // Corrected contract: authenticated-evidence.json is provider-visible delivered
  // material, so the declared identity counts it exactly as the broker's
  // canonicalWorkflowHubMaterialId does (the broker excludes only manifest.json
  // and canonical-evidence.json). The earlier divergence excluded it on the
  // WorkflowHub side, which made every evidence-carrying packet unmatchable. The
  // base versus supplemental distinction is carried by
  // authenticated_evidence_sha256, not by this digest.
  it("counts authenticated evidence in the declared identity exactly like the broker", () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-evidence-identity-")));
    roots.push(attachmentRoot);
    const input = {
      stage: "make-decision",
      review_track: "detail",
      materials: { raw_requirement: "需求正文，见 /Users/Hugh/notes.md。后续句子。" },
      authenticated_evidence: { schema_version: "m1.v1", note: "见 /Users/Hugh/evidence.json，证据正文" },
    };
    const packet = createSimpleReviewPacket(input);
    const restored = rehydrateProviderInput(serializeProviderInput({
      packet,
      hostProvider: "codex",
      providers: ["other/model"],
      reviewMode: "single_round",
      prompt: "review exact bytes",
    }), attachmentRoot);
    try {
      expect(restored.materials.materialId).toBe(packet.material_id);
      expect(restored.materials.materialIdentityConflict).toBeUndefined();
      const manifest = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "manifest.json"), "utf8"));
      const delivered = manifest.files.map((entry) => {
        const bytes = readFileSync(join(restored.materials.bundleRoot, ...entry.path.split("/")));
        return { path: entry.path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
      });
      expect(delivered.map(({ path }) => path)).toContain("authenticated-evidence.json");
      expect(brokerMaterialId(delivered)).toBe(packet.material_id);
      // Dropping the evidence entry changes the identity, exactly as it does for
      // the broker, so the two sides stay bound to the same delivered bytes.
      expect(deliveredMaterialId(delivered.filter(({ path }) => path !== "authenticated-evidence.json")))
        .not.toBe(packet.material_id);
    } finally {
      restored.materials.dispose();
    }
  });

  it("computes the material identity over redacted provider-visible bytes only", () => {
    const differOnlyInHostPath = (path) => createSimpleReviewPacket({
      stage: "build-code",
      materials: { implementation: `see ${path} for details` },
    }).material_id;
    expect(differOnlyInHostPath("/Users/alice/requirement.md")).toBe(differOnlyInHostPath("/tmp/bob-notes.md"));
    expect(differOnlyInHostPath("/Users/alice/requirement.md")).not.toBe(
      createSimpleReviewPacket({ stage: "build-code", materials: { implementation: "see details" } }).material_id,
    );
  });

  // Regression for the 2026-09-19 make-decision review failure
  // (`PROTOCOL_INCOMPATIBLE: 3rd-review managed lifecycle envelope is invalid`).
  // The declared packet identity and the delivered bundle bytes were produced by
  // two different host-path rules. A host path followed by CJK punctuation made
  // them disagree: the declaration consumed the rest of the line while the
  // delivered bytes stopped at the punctuation, so the broker recomputed an id
  // that the client rejected. The earlier coverage above only used
  // space-separated paths, where both rules happen to agree.
  it("keeps the declared material identity equal to the broker id over the delivered bytes", () => {
    const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "wh-review-identity-")));
    roots.push(attachmentRoot);
    const fixtures = [
      {
        label: "host path then CJK comma",
        raw_requirement: "来源 /Users/Hugh/notes.md，取消理由：DEF-01；DEF-01",
        mustKeep: ["取消理由：", "DEF-01；DEF-01"],
      },
      {
        label: "https drive-letter branch then CJK quote",
        raw_requirement: "类似“https://github.com/alibaba/open-code-review”的开源代码审查工具进行，保证代码审查质量更高。",
        mustKeep: ["的开源代码审查工具进行，保证代码审查质量更高。"],
      },
      {
        label: "host path then ideographic full stop",
        raw_requirement: "见 /Users/Hugh/notes.md。后续句子仍然属于材料正文。",
        mustKeep: ["后续句子仍然属于材料正文。"],
      },
      {
        label: "space-separated control",
        raw_requirement: "见 /Users/Hugh/notes.md 后续句子。",
        mustKeep: ["后续句子。"],
      },
    ];
    for (const { label, raw_requirement, mustKeep } of fixtures) {
      const packet = createSimpleReviewPacket({
        stage: "make-decision",
        review_track: "detail",
        materials: { raw_requirement },
      });
      const restored = rehydrateProviderInput(serializeProviderInput({
        packet,
        hostProvider: "codex",
        providers: ["other/model"],
        reviewMode: "single_round",
        prompt: "review exact bytes",
      }), attachmentRoot);
      try {
        const manifest = JSON.parse(readFileSync(join(restored.materials.bundleRoot, "manifest.json"), "utf8"));
        const delivered = manifest.files.map((entry) => {
          const bytes = readFileSync(join(restored.materials.bundleRoot, ...entry.path.split("/")));
          return { path: entry.path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
        });
        expect(restored.materials.materialId, `${label}: rehydrated identity`).toBe(packet.material_id);
        expect(brokerMaterialId(delivered), `${label}: declared packet identity diverged from the delivered bytes`)
          .toBe(packet.material_id);
        const deliveredText = readFileSync(join(restored.materials.bundleRoot, "materials/01-raw_requirement.md"), "utf8");
        expect(deliveredText, `${label}: host path must still be redacted`).not.toContain("/Users/Hugh/");
        for (const kept of mustKeep) expect(deliveredText, `${label}: lost reviewer-relevant text`).toContain(kept);
      } finally {
        restored.materials.dispose();
      }
    }
  });
});
