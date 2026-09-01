#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildReflectionPage } from "../../../tools/cli/build-reflection-page.mjs";

const root = resolve(process.argv.find((arg) => arg.startsWith("--root="))?.slice(7) ?? "/tmp/workflowhub-m16-browser");
const project = "M16BrowserFixture";
const tasksRoot = join(root, "Projects", project, "tasks");
mkdirSync(tasksRoot, { recursive: true });
const taskRoot = join(tasksRoot, "browser-task");
const confirmationRef = `quality/confirmations/${"a".repeat(64)}.json`;
mkdirSync(join(taskRoot, "quality/confirmations"), { recursive: true });
writeFileSync(join(taskRoot, confirmationRef), `${JSON.stringify({ schema_version: "human-confirmation.v2", accepted: true })}\n`);
mkdirSync(join(taskRoot, "quality/stage-reflection"), { recursive: true });
writeFileSync(join(taskRoot, "quality/stage-reflection/build-spec.json"), `${JSON.stringify({ schema_version: "stage-reflection.v1", record_kind: "judgment", task_id: "browser-task", stage: "build-spec", stage_status: "completed", generated_at: "2026-08-30T12:00:00.000Z", status: "ok", error: null, judgments: [{ subject_id: "spec-clarify", subject_kind: "step", classification: "simplify", severity: "high", reason: "真实浏览器夹具中的候选。", evidence_refs: [], confidence: "high", next_review_trigger: "下一次 build-spec" }], interventions: [{ confirmation_ref: confirmationRef, step_slug: "spec-clarify", reply_text: "保留候选供查看。", attribution: "human", confidence: "high" }], lessons_added: [] }, null, 2)}\n`);
for (const stage of ["make-decision", "build-spec", "build-plan", "build-code", "verify-code"]) {
  const raw = `${JSON.stringify({ schema_version: "workflowhub-stage-outcomes.v1", task_id: "browser-task", stage, generated_at: "2026-08-30T12:00:00.000Z", step_outcomes: [{ step_slug: `${stage}-fixture`, input_refs: [], evidence_refs: [], output_refs: [`quality/evidence/${stage}.md`] }], skill_outcomes: [] })}\n`;
  const digest = createHash("sha256").update(raw).digest("hex");
  const dir = join(taskRoot, "quality/evidence/stage-outcomes", stage); mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, `${digest}.json`), raw);
}
const out = join(root, "page");
buildReflectionPage({ root, tasksRoot, out, now: "2026-08-31T00:00:00.000Z" });
const fixture = join(out, "fixture.json");
const result = { schema_version: "workflow-evolution-browser-fixture.v1", root, project, tasks_root: tasksRoot, out, html: join(out, "workflowhub-monitor.html"), data: join(out, "data.js"), fixture };
writeFileSync(fixture, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
