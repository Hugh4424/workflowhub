import { readFileSync, mkdtempSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
const [root, reqPath] = process.argv.slice(2);
const { buildReviewMaterials } = await import(resolve(root, "skills/wh-review/scripts/review-materials.mjs"));
const req = JSON.parse(readFileSync(resolve(reqPath), "utf8"));
const attachmentRoot = realpathSync(mkdtempSync(join(tmpdir(), "p10-attach-")));
const built = buildReviewMaterials({
  attachmentRoot, stage: req.stage, activationCohort: req.activation_cohort,
  materials: req.materials, uiScope: false, role: "red",
});
console.log(JSON.stringify({
  bundleRoot: built.bundleRoot,
  materialId: built.materialId,
  files: built.deliveryManifest,
  discarded: built.discarded_facts,
}, null, 2));
