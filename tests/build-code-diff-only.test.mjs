import { describe, it, expect } from 'vitest';
import { scanDiff } from '../workflows/build-code/diff-scanner.mjs';

describe('scanDiff', () => {
  it('case 1: clean .mjs source change → safe, no violations', () => {
    const diffText = `diff --git a/workflows/build-code/foo.mjs b/workflows/build-code/foo.mjs
index 1234567..abcdefg 100644
--- a/workflows/build-code/foo.mjs
+++ b/workflows/build-code/foo.mjs
@@ -1,3 +1,4 @@
 export function foo() {
+  return 42;
 }
`;
    const result = scanDiff(diffText);
    expect(result.violations.length).toBe(0);
    expect(result.safe).toBe(true);
  });

  it('case 2: diff containing git push → irreversible_git violation', () => {
    const diffText = `diff --git a/scripts/deploy.mjs b/scripts/deploy.mjs
--- a/scripts/deploy.mjs
+++ b/scripts/deploy.mjs
@@ -1,2 +1,3 @@
 // deploy script
+exec('git push origin main');
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'irreversible_git' && v.pattern === 'git push')).toBe(true);
    expect(result.safe).toBe(false);
    const v = result.violations.find(v => v.type === 'irreversible_git' && v.pattern === 'git push');
    expect(typeof v.line).toBe('number');
  });

  it('case 3: diff touching package.json → external_dep violation', () => {
    const diffText = `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -5,6 +5,7 @@
   "dependencies": {
+    "lodash": "^4.17.21"
   }
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'external_dep' && v.pattern === 'package.json')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 4: diff touching .env.production → prod_config violation', () => {
    const diffText = `diff --git a/.env.production b/.env.production
--- a/.env.production
+++ b/.env.production
@@ -1,2 +1,3 @@
 NODE_ENV=production
+API_SECRET=newsecret
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'prod_config' && v.pattern === '.env.production')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 5: diff touching pnpm-lock.yaml → external_dep violation', () => {
    const diffText = `diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -100,6 +100,7 @@
 lockfileVersion: '6.0'
+  lodash: 4.17.21
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'external_dep' && v.pattern === 'pnpm-lock.yaml')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 6: diff touching go.mod → external_dep violation', () => {
    const diffText = `diff --git a/go.mod b/go.mod
--- a/go.mod
+++ b/go.mod
@@ -3,4 +3,5 @@
 module github.com/example/app
+require github.com/some/lib v1.0.0
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'external_dep' && v.pattern === 'go.mod')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 7: plain .mjs file change outside C2 list → safe, no violations (FR-DIFF-003)', () => {
    const diffText = `diff --git a/workflows/some-other/helper.mjs b/workflows/some-other/helper.mjs
--- a/workflows/some-other/helper.mjs
+++ b/workflows/some-other/helper.mjs
@@ -1,2 +1,3 @@
 export const VERSION = '1.0';
+export const REVISION = '1.1';
`;
    const result = scanDiff(diffText);
    expect(result.violations.length).toBe(0);
    expect(result.safe).toBe(true);
  });

  // --- NEW PATTERN TESTS ---

  it('case 8: git branch -d → irreversible_git violation (branch deletion)', () => {
    const diffText = `diff --git a/scripts/cleanup.mjs b/scripts/cleanup.mjs
--- a/scripts/cleanup.mjs
+++ b/scripts/cleanup.mjs
@@ -1,2 +1,3 @@
+exec('git branch -d old-feature');
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'irreversible_git' && v.pattern === 'git branch -d')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 9: git push --force → irreversible_git violation (force push)', () => {
    const diffText = `diff --git a/scripts/release.mjs b/scripts/release.mjs
--- a/scripts/release.mjs
+++ b/scripts/release.mjs
@@ -1,2 +1,3 @@
+exec('git push --force origin main');
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'irreversible_git' && v.pattern === 'git push --force')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 10: git reset --hard → irreversible_git violation (destructive reset)', () => {
    const diffText = `diff --git a/scripts/reset.mjs b/scripts/reset.mjs
--- a/scripts/reset.mjs
+++ b/scripts/reset.mjs
@@ -1,2 +1,3 @@
+exec('git reset --hard origin/main');
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'irreversible_git' && v.pattern === 'git reset --hard')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 11: diff touching go.sum → external_dep violation', () => {
    const diffText = `diff --git a/go.sum b/go.sum
--- a/go.sum
+++ b/go.sum
@@ -1,2 +1,3 @@
+github.com/some/lib v1.0.0 h1:abc123==
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'external_dep' && v.pattern === 'go.sum')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 12: plugin semver version bump in package.json → external_dep violation', () => {
    const diffText = `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -5,6 +5,6 @@
   "dependencies": {
-    "some-plugin": "^1.2.3"
+    "some-plugin": "^2.0.0"
   }
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'external_dep' && v.pattern === 'plugin-semver-bump')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 13: diff touching .env → prod_config violation', () => {
    const diffText = `diff --git a/.env b/.env
--- a/.env
+++ b/.env
@@ -1,2 +1,3 @@
 DEBUG=false
+NEW_VAR=value
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'prod_config' && v.pattern === '.env')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 14: diff touching deploy* path → prod_config violation', () => {
    const diffText = `diff --git a/scripts/deploy-prod.sh b/scripts/deploy-prod.sh
--- a/scripts/deploy-prod.sh
+++ b/scripts/deploy-prod.sh
@@ -1,2 +1,3 @@
 #!/bin/bash
+echo "deploying"
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'prod_config' && v.pattern === 'deploy*')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 15: diff touching infra* path → prod_config violation', () => {
    const diffText = `diff --git a/infra/terraform.tf b/infra/terraform.tf
--- a/infra/terraform.tf
+++ b/infra/terraform.tf
@@ -1,2 +1,3 @@
 resource "aws_s3_bucket" "b" {}
+tags = { env = "prod" }
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'prod_config' && v.pattern === 'infra*')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 16: diff touching ci* path → prod_config violation', () => {
    const diffText = `diff --git a/.github/workflows/ci-build.yml b/.github/workflows/ci-build.yml
--- a/.github/workflows/ci-build.yml
+++ b/.github/workflows/ci-build.yml
@@ -1,2 +1,3 @@
 name: CI
+  runs-on: ubuntu-latest
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'prod_config' && v.pattern === 'ci*')).toBe(true);
    expect(result.safe).toBe(false);
  });

  // --- FR-DIFF-003 false-positive guard tests ---
  // These are genuinely falsifiable: with the old substring-match bug present, they would
  // return safe:false (over-matching), so asserting safe:true catches the regression.

  it('case 17: .mjs code using process.env and a version constant → safe, no violations (FR-DIFF-003)', () => {
    // REWRITTEN: old case-17 incorrectly asserted safe:false for this code. That was
    // encoding the bug. A plain .mjs file referencing process.env.NODE_ENV must NOT
    // trigger the .env prod_config rule — `.env` must only match a changed FILE named `.env`,
    // not substrings of code content. Similarly, a version string like "1.2.3" in a .mjs file
    // must NOT trigger plugin-semver-bump (only fires in package.json context).
    // This test goes RED with the old implementation → it is genuinely falsifiable.
    const diffText = `diff --git a/workflows/build-code/processor.mjs b/workflows/build-code/processor.mjs
--- a/workflows/build-code/processor.mjs
+++ b/workflows/build-code/processor.mjs
@@ -1,5 +1,8 @@
 // explicit logic for special ancient ciphers
+const environment = process.env.NODE_ENV;
+const VERSION = "1.2.3";
+const isSpecial = true;
+const ancient = false;
+function explicit() { return 'ok'; }
 export default {};
`;
    const result = scanDiff(diffText);
    // process.env.NODE_ENV in code must NOT match the `.env` file path rule
    expect(result.violations.filter(v => v.pattern === '.env').length).toBe(0);
    // "1.2.3" in a .mjs file must NOT match plugin-semver-bump (manifest-scoped rule)
    expect(result.violations.filter(v => v.pattern === 'plugin-semver-bump').length).toBe(0);
    // No C2 path-prefix rules should fire either
    expect(result.violations.filter(v => v.pattern === 'ci*').length).toBe(0);
    expect(result.violations.filter(v => v.pattern === 'infra*').length).toBe(0);
    expect(result.violations.filter(v => v.pattern === 'deploy*').length).toBe(0);
    // Overall: this is a safe change
    expect(result.violations.length).toBe(0);
    expect(result.safe).toBe(true);
  });

  it('case 18: word "special" or "explicit" in code does not trigger ci* (strict false-positive check, FR-DIFF-003)', () => {
    // A file whose diff --git header has no basename starting with ci/deploy/infra
    const diffText = `diff --git a/workflows/build-code/special-logic.mjs b/workflows/build-code/special-logic.mjs
--- a/workflows/build-code/special-logic.mjs
+++ b/workflows/build-code/special-logic.mjs
@@ -1,3 +1,4 @@
 // ancient explicit circuit
+const x = 1;
`;
    const result = scanDiff(diffText);
    expect(result.violations.filter(v => v.pattern === 'ci*').length).toBe(0);
    expect(result.violations.length).toBe(0);
    expect(result.safe).toBe(true);
  });

  it('case 19: actual .env file change → prod_config fires; .mjs code with process.env does NOT fire .env', () => {
    // Positive control: changing the .env file itself IS a C2 violation.
    const envDiff = `diff --git a/.env b/.env
--- a/.env
+++ b/.env
@@ -1,2 +1,3 @@
 DEBUG=false
+SECRET=newsecret
`;
    const envResult = scanDiff(envDiff);
    expect(envResult.violations.some(v => v.pattern === '.env')).toBe(true);
    expect(envResult.safe).toBe(false);

    // Negative control: .mjs code reading process.env is safe.
    const codeDiff = `diff --git a/lib/config.mjs b/lib/config.mjs
--- a/lib/config.mjs
+++ b/lib/config.mjs
@@ -1,2 +1,3 @@
+const apiKey = process.env.API_KEY;
+const dbUrl = process.env.DATABASE_URL;
`;
    const codeResult = scanDiff(codeDiff);
    expect(codeResult.violations.filter(v => v.pattern === '.env').length).toBe(0);
    expect(codeResult.safe).toBe(true);
  });

  // --- FR-DIFF-003: added-line guard tests (context / removed line false-positive prevention) ---

  it('case 21: git push in context line only → safe:true (FR-DIFF-003 context-line false-positive)', () => {
    // Falsifiable: the old buggy impl scanned ALL lines including context (' ') lines,
    // so this returned safe:false. With the fix it must return safe:true.
    const diffText = `diff --git a/lib/sync.mjs b/lib/sync.mjs
--- a/lib/sync.mjs
+++ b/lib/sync.mjs
@@ -1,5 +1,6 @@
 // do not git push here — this is handled by CI
 function sync() {
+  return true;
 }
`;
    const result = scanDiff(diffText);
    expect(result.violations.filter(v => v.type === 'irreversible_git').length).toBe(0);
    expect(result.safe).toBe(true);
  });

  it('case 22: git push --force on a real added "+" line → irreversible_git still fires (positive not regressed)', () => {
    // Falsifiable: if the guard is over-broad it would suppress this — it must NOT.
    const diffText = `diff --git a/scripts/release.mjs b/scripts/release.mjs
--- a/scripts/release.mjs
+++ b/scripts/release.mjs
@@ -1,3 +1,4 @@
 // release script
+exec('git push --force origin main');
 module.exports = {};
`;
    const result = scanDiff(diffText);
    expect(result.violations.some(v => v.type === 'irreversible_git' && v.pattern === 'git push --force')).toBe(true);
    expect(result.safe).toBe(false);
  });

  it('case 23: git push on a removed "-" line → safe:true (deleting a push is not an introduced violation)', () => {
    // Falsifiable: old impl scanned '-' lines too so this returned safe:false.
    const diffText = `diff --git a/scripts/old-deploy.mjs b/scripts/old-deploy.mjs
--- a/scripts/old-deploy.mjs
+++ b/scripts/old-deploy.mjs
@@ -1,4 +1,3 @@
 // deploy helper
-exec('git push origin main');
+// push removed
`;
    const result = scanDiff(diffText);
    expect(result.violations.filter(v => v.type === 'irreversible_git').length).toBe(0);
    expect(result.safe).toBe(true);
  });

  it('case 20: semver in package.json fires plugin-semver-bump; semver in .mjs does NOT fire', () => {
    // Positive: real version bump in package.json
    const manifestDiff = `diff --git a/package.json b/package.json
--- a/package.json
+++ b/package.json
@@ -3,4 +3,4 @@
-  "version": "1.0.0"
+  "version": "2.0.0"
`;
    const manifestResult = scanDiff(manifestDiff);
    // package.json path rule fires; semver-bump may also fire — both are correct
    expect(manifestResult.violations.some(v => v.pattern === 'package.json')).toBe(true);
    expect(manifestResult.safe).toBe(false);

    // Negative: version constant in a .mjs file must NOT fire plugin-semver-bump
    const mjsDiff = `diff --git a/lib/version.mjs b/lib/version.mjs
--- a/lib/version.mjs
+++ b/lib/version.mjs
@@ -1,2 +1,2 @@
-export const VERSION = "1.0.0";
+export const VERSION = "2.0.0";
`;
    const mjsResult = scanDiff(mjsDiff);
    expect(mjsResult.violations.filter(v => v.pattern === 'plugin-semver-bump').length).toBe(0);
    expect(mjsResult.violations.length).toBe(0);
    expect(mjsResult.safe).toBe(true);
  });
});
