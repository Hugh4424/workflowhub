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

const roots = [];
afterEach(() => { while (roots.length) rmSync(roots.pop(), { recursive: true, force: true }); });

const HOST_SECRETS = ["/Users/", "/home/", "/private/", "/tmp/", "C:\\Users\\"];

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
});
