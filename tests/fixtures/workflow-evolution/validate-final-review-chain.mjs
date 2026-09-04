#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { createSimpleReviewPacket } from "../../../skills/wh-review/scripts/simple-review-runner.mjs";

const outputPath = process.argv[2] ?? "quality/reviews/m16-final-review-chain.json";
const requestPath = process.argv[3] ?? process.env.WORKFLOWHUB_WH_REVIEW_REQUEST ?? null;
const specPath = process.env.WORKFLOWHUB_REVIEW_SPEC_PATH
  ? resolve(process.env.WORKFLOWHUB_REVIEW_SPEC_PATH)
  : resolve(process.cwd(), "specs/archive/workflowhub-m16-evolution-20260831/spec.md");
const CURRENT_MATERIALS = ["decision-log.md", "spec.md", "plan.md", "tasks.md"];
const SHA256 = /^[a-f0-9]{64}$/;

const fail = () => process.exit(32);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const validHash = (value) => typeof value === "string" && SHA256.test(value);

function readJson(path) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { fail(); return null; }
}

function currentMaterialIdentity() {
  const taskRoot = dirname(specPath);
  const manifest = [];
  for (const name of CURRENT_MATERIALS) {
    let bytes;
    try { bytes = readFileSync(resolve(taskRoot, name)); } catch { return null; }
    manifest.push({ path: name, bytes: bytes.length, sha256: hash(bytes) });
  }
  return hash(Buffer.from(JSON.stringify(manifest), "utf8"));
}

function requestPacket() {
  if (!requestPath) return null;
  const request = readJson(requestPath);
  if (!request || typeof request !== "object" || Array.isArray(request)) fail();
  try { return { request, packet: createSimpleReviewPacket(request) }; } catch { fail(); return null; }
}

const value = readJson(resolve(outputPath));
if (!value || typeof value !== "object" || Array.isArray(value)) fail();
if (value.schema_version !== "workflowhub-review-chain.v1"
    || !["clean", "findings", "unavailable"].includes(value.status)
    || !Array.isArray(value.findings)
    || !validHash(value.material_sha256)) fail();

const subject = value.review_subject;
const expectedStage = subject === "current-code" ? "verify-code" : subject === "current-materials" ? "build-plan" : null;
const publicResult = value.public_result;
const scoped = subject !== undefined || publicResult !== undefined;
if (value.status === "unavailable" && !scoped) {
  console.log(JSON.stringify({ status: "ok", review_status: "unavailable", findings: value.findings.length }));
  process.exit(0);
}
if (expectedStage === null
    || value.current_material_sha256 !== value.material_sha256
    || !validHash(value.review_material_sha256)
    || typeof value.attempt_id !== "string" || value.attempt_id.trim() === ""
    || value.owner !== `run-final-review-chain:${value.attempt_id}`
    || !validHash(value.idempotency_key)
    || !publicResult
    || publicResult.stage !== expectedStage
    || !Array.isArray(publicResult.findings ?? publicResult.result?.findings)) fail();

const currentIdentity = currentMaterialIdentity();
if (!currentIdentity || value.material_sha256 !== currentIdentity || value.current_material_sha256 !== currentIdentity) fail();

if (requestPath) {
  const bound = requestPacket();
  if (!bound
      || bound.request.review_subject !== subject
      || bound.request.stage !== expectedStage
      || bound.packet.material_id !== value.review_material_sha256
      || publicResult.material_id !== bound.packet.material_id) fail();
}

console.log(JSON.stringify({ status: "ok", review_status: value.status, findings: value.findings.length }));
