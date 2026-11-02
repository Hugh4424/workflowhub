import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import yaml from "js-yaml";
import { resolveSkillPackage } from "../../runtime/adapters/local-skill-resolver.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(join(root, relativePath), "utf8");
const exists = (relativePath) => existsSync(join(root, relativePath));

const skillSpecs = {
  "project-norm-init": {
    path: "skills/project-norm-init/SKILL.md",
    bundle: "skills/project-norm-init/skill-bundle.json",
    required: [
      "new",
      "legacy",
      "GLOSSARY.md",
      "specs/design/",
      "specs/frontend/",
      "owner",
      "consumer",
      "version",
      "fixture",
      "Preview",
      "unknown",
      "N/A + reason",
      "no stage",
      "no gate",
    ],
    forbidden: ["quality score"],
  },
  "design-source-readiness": {
    path: "skills/design-source-readiness/SKILL.md",
    bundle: "skills/design-source-readiness/skill-bundle.json",
    required: [
      "Screen Read Map",
      "section/page anchor",
      "bindable",
      "not_bindable",
      "unknown",
      "human",
      "no score",
      "no gate",
      "GLOSSARY.md",
      "specs/design/",
      "specs/frontend/",
      "owner",
      "consumer",
    ],
    forbidden: ["quality score"],
  },
  "frontend-component-quality": {
    path: "skills/frontend-component-quality/SKILL.md",
    bundle: "skills/frontend-component-quality/skill-bundle.json",
    required: [
      "Component Quality Map",
      "reuse",
      "modify",
      "extend-state-or-variant",
      "add-local",
      "extract-shared",
      "remove-after-no-consumers",
      "real consumer",
      "typed ViewModel",
      "CSS/token owner",
      "React/Next",
      "N/A + reason",
      "scripts/check-frontend-component-quality.mjs",
      "duplicate-component",
      "global-override",
      "important-declaration",
      "css-leak",
      "no stage",
      "no gate",
    ],
    forbidden: ["SHA-256", "sha256", "second workflow", "second entrypoint"],
  },
};

function assertFrontmatter(skillName, content) {
  assert.match(content, /^---\n[\s\S]*?\n---\n/, `${skillName}: YAML frontmatter is required`);
  assert.match(content, new RegExp(`name:\\s*${skillName.replaceAll("-", "\\-")}`));
  assert.match(content, /description:\s*.+/);
  const registrations = yaml.load(read("skills/catalog.yaml")).skills.filter(entry => entry.name === skillName);
  assert.equal(registrations.length, 1, `${skillName}: catalog registration must be unique`);
  assert.match(registrations[0].local_version ?? "", /^\d+\.\d+\.\d+$/, `${skillName}: catalog version must be semver`);
  const frontmatter = yaml.load(content.match(/^---\n([\s\S]*?)\n---\n/)[1]);
  assert.equal(Object.hasOwn(frontmatter, "version"), false, `${skillName}: header version duplicates catalog`);
}

function loadBundle(skillName, bundlePath) {
  assert.ok(exists(bundlePath), `${skillName}: missing ${bundlePath}`);
  const bundle = JSON.parse(read(bundlePath));
  assert.equal(bundle.schema_version, 1, `${skillName}: bundle schema must be v1`);
  assert.equal(bundle.skill, skillName, `${skillName}: bundle skill mismatch`);
  assert.ok(Array.isArray(bundle.files) && bundle.files.length > 0, `${skillName}: files closure is empty`);
  for (const entry of bundle.files) {
    const relativePath = typeof entry === "string" ? join(`skills/${skillName}`, entry) : join(`skills/${skillName}`, entry.path);
    assert.ok(exists(relativePath), `${skillName}: bundle path missing ${relativePath}`);
  }
  assert.ok(Array.isArray(bundle.sources), `${skillName}: source provenance missing`);
  return bundle;
}

function assertNoQualityScore(content, skillName) {
  const withoutExplicitNegation = content.replace(
    /\b(?:no|not|never)\s+(?:\w+\s+){0,3}quality score\b|(?:不得|禁止|不打|不做|不设置|不生成|不提供)\s*quality score\b/gi,
    "",
  );
  assert.doesNotMatch(withoutExplicitNegation, /quality score/i, `${skillName}: forbidden quality score`);
}

test("quality score remains forbidden except explicit negation", () => {
  assertNoQualityScore("no quality score；不打 quality score。", "negative wording");
  assert.throws(() => assertNoQualityScore("Generate a quality score.", "positive wording"), /forbidden quality score/);
  assert.throws(() => assertNoQualityScore("不打 quality score，但实际生成 quality score。", "mixed wording"), /forbidden quality score/);
});

function assertNoHashDesignRevision(content, sourceName) {
  assert.doesNotMatch(
    content,
    /(?:Design\.md|Experience\.md|GLOSSARY\.md|CONTEXT\.md|specs\/(?:design|frontend)\/[A-Za-z0-9_./-]*\.md)[^\r\n]*(?:SHA-256|sha256)/i,
    `${sourceName}: source hash cannot replace a human design revision`,
  );
}

test("professional sources preserve the no-hash revision protection on current and historical paths", () => {
  for (const source of [
    "Design.md", "Experience.md", "GLOSSARY.md", "CONTEXT.md",
    "specs/design/design.md", "specs/design/components.md", "specs/design/layouts.md",
    "specs/design/interaction.md", "specs/design/craft.md", "specs/design/quality.md",
    "specs/frontend/frontend.md", "specs/frontend/ui-quality.md",
  ]) {
    assertNoHashDesignRevision(`${source}: version 2026.10.14; owner design; consumer reader`, source);
    for (const hashLabel of ["SHA-256", "sha256"]) {
      assert.throws(
        () => assertNoHashDesignRevision(`${source}: design revision ${hashLabel} abc123`, source),
        /source hash cannot replace a human design revision/,
      );
    }
  }
});

test("P1 skill contracts are explicit before implementation", () => {
  for (const [skillName, spec] of Object.entries(skillSpecs)) {
    assert.ok(exists(spec.path), `${skillName}: skill path is missing`);
    const content = read(spec.path);
    assertFrontmatter(skillName, content);
    for (const term of spec.required) {
      assert.match(content, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${skillName}: missing ${term}`);
    }
    for (const term of spec.forbidden) {
      if (term === "quality score") assertNoQualityScore(content, skillName);
      else assert.doesNotMatch(content, new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${skillName}: forbidden ${term}`);
    }
    loadBundle(skillName, spec.bundle);
  }
});

test("UI support skills declare their real stage consumers without a parallel UI workflow", () => {
  const catalog = yaml.load(read("skills/catalog.yaml"));
  const entries = new Map((catalog.skills ?? []).map((entry) => [entry.name, entry]));
  for (const skillName of Object.keys(skillSpecs)) {
    const entry = entries.get(skillName);
    assert.ok(entry, `${skillName}: catalog entry is missing`);
    assert.equal(entry.path, skillSpecs[skillName].path);
    assert.equal(entry.standalone, true, `${skillName}: must be portable`);
    assert.ok(entry.purpose && entry.design_idea, `${skillName}: purpose/design idea missing`);
    assert.match(entry.local_changes, /owner|consumer/i, `${skillName}: owner/consumer metadata missing`);
    assert.match(entry.local_changes, /delete|remove/i, `${skillName}: deletion condition missing`);
    assert.ok(Array.isArray(entry.dependency_closure), `${skillName}: dependency closure missing`);
    assert.ok(typeof entry.update_policy === "string" && entry.update_policy.length > 0, `${skillName}: update policy missing`);
  }

  const buildPlanDependencies = yaml.load(read("workflows/build-plan/skill-deps.yaml"));
  assert.equal(buildPlanDependencies.stage, "build-plan");
  for (const [skillName, trigger] of [
    ["project-norm-init", "ui_scope_existing_project_baseline"],
    ["design-source-readiness", "ui_scope_readable_design_sources"],
    ["frontend-prototype-render", "ui_scope_actual_prototype_preview"],
    ["frontend-component-quality", "ui_scope"],
    ["plan-design-review", "ui_scope_design_lens_in_merged_review"],
  ]) {
    const dependency = (buildPlanDependencies.skills ?? []).find((item) => item.name === skillName);
    assert.ok(dependency, `${skillName}: current build-plan dependency is missing`);
    assert.equal(dependency.path, `skills/${skillName}/SKILL.md`);
    assert.ok(exists(dependency.path), `${skillName}: actual method is missing`);
    assert.equal(dependency.trigger, trigger, `${skillName}: must retain its actual UI scope trigger`);
  }

  const qualityRegistrations = (catalog.skills ?? []).filter(entry => entry.name === "frontend-component-quality");
  assert.equal(qualityRegistrations.length, 1, "frontend-component-quality: catalog registration must be unique");
  const quality = qualityRegistrations[0];
  assert.deepEqual(quality.upstream, [
    {
      github_url: "https://github.com/vercel-labs/agent-skills",
      commit: "dd089a8c752c966dee8bf0f27cb625ba193ffd9e",
      commit_url: "https://github.com/vercel-labs/agent-skills/commit/dd089a8c752c966dee8bf0f27cb625ba193ffd9e",
      license: "MIT",
      reviewed_at: "2026-08-22",
      review_outcome: "accepted",
      adopted: [
        "skills/frontend-component-quality/upstream/react-best-practices/history/AGENTS-21lines.md#eliminating-waterfalls — 本地21行派生参考的消除串行请求摘要，保留真实依赖顺序；不冒完整源",
        "skills/frontend-component-quality/upstream/react-best-practices/history/AGENTS-21lines.md#bundle-size-optimization — 本地21行派生参考的客户端边界与按需加载摘要，收益仍须实测；不冒完整源",
        "skills/frontend-component-quality/upstream/react-best-practices/SKILL.md — 固定 76 文件规则闭包按 React/Next 条件只读；逐文件来源见 UPSTREAM.md"
      ],
      path: "skills/react-best-practices/AGENTS.md",
      skill_url: "https://github.com/vercel-labs/agent-skills/blob/dd089a8c752c966dee8bf0f27cb625ba193ffd9e/skills/react-best-practices/AGENTS.md",
    },
    {
      github_url: "https://github.com/vercel-labs/web-interface-guidelines",
      commit: "434b7f91364665f2f733b310ec54809bf8f37937",
      commit_url: "https://github.com/vercel-labs/web-interface-guidelines/commit/434b7f91364665f2f733b310ec54809bf8f37937",
      license: "MIT",
      path: "command.md",
      skill_url: "https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md",
      adopted: ["skills/frontend-component-quality/upstream/web-design-guidelines/command.md — 固定规则体，按当前任务适用范围只读；不另建执行器"],
    },
    {
      github_url: "https://github.com/jakubkrehel/skills",
      commit: "1eb03d2b145df1c6cd84ab54a337600a2a379017",
      commit_url: "https://github.com/jakubkrehel/skills/commit/1eb03d2b145df1c6cd84ab54a337600a2a379017",
      license: "MIT",
      path: "skills/better-ui",
      skill_url: "https://github.com/jakubkrehel/skills/tree/1eb03d2b145df1c6cd84ab54a337600a2a379017/skills/better-ui",
      adopted: ["skills/frontend-component-quality/upstream/better-ui/SKILL.md — 固定八文件规则；项目既有规范优先，不默认采用精确数值"],
    },
  ]);
});

test("Vercel source closure is pinned, licensed, and read-only", () => {
  const upstreamRoot = "skills/frontend-component-quality/upstream/react-best-practices";
  const upstream = read(`${upstreamRoot}/UPSTREAM.md`);
  const license = read(`${upstreamRoot}/LICENSE`);
  const compiled = read(`${upstreamRoot}/AGENTS.md`);
  assert.match(upstream, /vercel-labs\/agent-skills/);
  assert.match(upstream, /dd089a8c752c966dee8bf0f27cb625ba193ffd9e/);
  assert.match(upstream, /version\s*1\.0\.0/i);
  assert.match(upstream, /MIT/i);
  assert.match(license, /MIT License/);
  assert.match(license, /Permission is hereby granted/);
  assert.match(compiled, /React and Next\.js/i);
  assert.match(compiled, /Eliminating Waterfalls/i);
  assert.match(compiled, /Bundle Size Optimization/i);
  assert.match(upstream, /read-only|只读/i);
});

test("P1 public records preserve no-hash design revision and no-gate semantics", () => {
  const registry = read("skills/reuse-registry.md");
  const notices = read("THIRD_PARTY_NOTICES.md");
  for (const skillName of Object.keys(skillSpecs)) {
    assert.match(registry, new RegExp(`\\| ${skillName} \\|`), `${skillName}: reuse registry row missing`);
    assert.match(registry, new RegExp(skillName), `${skillName}: human registry entry missing`);
  }
  assert.match(notices, /Vercel Engineering|Vercel React Best Practices/);
  assert.match(notices, /dd089a8c752c966dee8bf0f27cb625ba193ffd9e/);
  assert.match(notices, /MIT/);
  assertNoHashDesignRevision(registry, "reuse registry");
  assertNoHashDesignRevision(notices, "third-party notices");
});

// Frozen from quality/evidence/2026-11-01-006-wp5-fixed-pin-inventory.json.
// These are fixed-source expectations, not values derived from the working tree.
const p5Files = manifest => manifest.trim().split("\n").map(line => ({
  sha256: line.slice(0, 64),
  path: line.slice(66),
}));
const P5_PACKAGE_SPECS = [
  {
    name: "react-best-practices",
    directory: "skills/frontend-component-quality/upstream/react-best-practices",
    sourceRepo: "https://github.com/vercel-labs/agent-skills",
    commit: "dd089a8c752c966dee8bf0f27cb625ba193ffd9e",
    fileCount: 76,
    files: p5Files(`
fc93e7421177bbf869cce892bc60a6c83a4517d974bc3bf65c4e2c1e58a6ccf6  AGENTS.md
9eafb2123d3b8b2aef41fba0db2648a3f4f49996f8c7c8bb2c86263befd8b48a  README.md
71ed7794962fa6e803ee83030517b5b93a9f70fbfeb431ec4535c5480a8d8355  SKILL.md
c4e18bac3290fbe1b471a605867d4df68b03144ea26b8befdbe8f9d8fd124354  metadata.json
01c59969e4e867f0708c8f8ef9c6d87fab9a07d0586244f429ff84013db8a115  rules/_sections.md
99df2a3ea088c6c22de2484ddc7e964d0e9923846f44c63380343ecc64455442  rules/_template.md
55ed8f9f27a1bff803d6fa55828176207714b02123cbb97ddb8a90d88024a723  rules/advanced-effect-event-deps.md
a3097edeecfb2ff6851cd66ed8cdf0617c3c88180504bee824aa6e75a215bbbc  rules/advanced-event-handler-refs.md
3e4dc22173eb0e2b6dcf583e3babd862b8696328f8f59aee7c4d746c5bc05f6c  rules/advanced-init-once.md
8a3f64dfe5a77d1564248faf17fe662ae75b55d497a243cb30b38eb07ccbbf9a  rules/advanced-use-latest.md
523338540d73427dc14c0cbb19f2741ebccdf8b105a7b2c1b33d2905cf237a42  rules/async-api-routes.md
03107c1f70a293cd58a8abc5474c5548e20ea4efdf01b6d45aae7ad0ac1cb32c  rules/async-cheap-condition-before-await.md
f3c142d090615abdcc99d31c123be37b31f0f1ed8d9ec9f7789a3bc6883ae0fb  rules/async-defer-await.md
16ef469f877e30c6b8e1e1b4bc3e527312fa3c6318cb785a4eca186ea236131a  rules/async-dependencies.md
6d2f841896279e976dfcdc1ac89e70771ac188baadfd43c096b5706cb838b961  rules/async-parallel.md
de05fedac2eb7ae563b887b5a424464ec3dfaf84e5b7797467ebe2a796ac8afc  rules/async-suspense-boundaries.md
62090b5c815fd71bf1133dce754f51abc16a9456d0ccd025fd627de27726e92a  rules/bundle-analyzable-paths.md
e648f6d54525f07a691357040ca5bff6ea3424788a91ff63812adb29622a671b  rules/bundle-barrel-imports.md
09c8259c3efb04fc0abb8e412ccbda217c222ae8118516283e571c995fe3a7d4  rules/bundle-conditional.md
3719fb47b191e8db4fe22686ec88448ad5af9e6838585425abbe103d0b642e37  rules/bundle-defer-third-party.md
401817a7369f315fc5a68a1095742ff7d53d0461906880dc9d64a41495ee1986  rules/bundle-dynamic-imports.md
d1f7cc28da7cd5ab249acd287edc5b761afcfb194e9cb62cd44c5f3543db2de2  rules/bundle-preload.md
242a873349febc1ce685e85617994784dbab92c2eaa68aed7fed5a83e7680e93  rules/client-event-listeners.md
0fb7cdf9dc93fdf22f87e3669f953fb9d4ac9b0be42eec4a29fe9a2560610b88  rules/client-localstorage-schema.md
1f35016f9053de69e884ee9be00654e37979c2ca85f5e57764dc2626ff7acb4b  rules/client-passive-event-listeners.md
644652c39c6cc00de8d1c77a7273612e868dc3f7edda30764164c12ec0f764a3  rules/client-swr-dedup.md
480b891b9eaf96e929dc1e964274a4828e3a78009b7d00ccd965a0d425215959  rules/js-batch-dom-css.md
3daaa11d24f4295cb6be8bc6f407f2ce83cc7b5bd1f0e68891ea8ab835721dc7  rules/js-cache-function-results.md
73e47431e74878a927061bf0ddc7cd91a7556cb35d2573f3421e82300d9ae311  rules/js-cache-property-access.md
11b826b0433898c1ece2d3547010d8e77db9fb240185748c45db91493de9b6cc  rules/js-cache-storage.md
71add08aeeb43091d4ff4c0b2842cce8b4bdef8ad3e732cc034bb5a84827e746  rules/js-combine-iterations.md
925ce5ce87f3347186ca62212f29cc6baa2b8c85a96d2720ad07c3d0abf781c0  rules/js-early-exit.md
9e5b166a41914d975bef7635467f8fb32cd98b5c3126c0bc6f163490812fb5f0  rules/js-flatmap-filter.md
f9e9aef2f7c2307dd7310f283df85dcada45fc43e9bb941b0c3aa414dec21ec4  rules/js-hoist-regexp.md
5df1bdc2cfabb2c98abd55d26762e5c18189535c2e686184f426082e62920391  rules/js-index-maps.md
8b54a311c826b299272f29187fc58bc55772a04c4a72eeb29456ee96dc9fc624  rules/js-length-check-first.md
87dfb67e2f39df6ad8bcfb5b78c5fb364d3c07554ad188a202408d99f3763421  rules/js-min-max-loop.md
ee08f83905b4011abbc33d594033157d77561b5bbd9b36b04f0f409581ffec32  rules/js-request-idle-callback.md
a7fd781a6ba9ad49065961b6f9a90ef486bf6b648390e1a08704025f98e1642b  rules/js-set-map-lookups.md
d0a5e1b0fec48a0a81397957e2f068e224329f7c42cb5feeed8aae6fa64025e8  rules/js-tosorted-immutable.md
1e5e7eaf3555e61d6a2e900089c676527d26259501db5594f59544b6c664f85a  rules/rendering-activity.md
9c6ae0ca7a51434e803887c64cded760956579a1452ccb80a461a03f9c937c77  rules/rendering-animate-svg-wrapper.md
2ec2fa23c4148285144687050c52369adba3da2fbe3d486f8d3e0aad8f06f2bc  rules/rendering-conditional-render.md
64eee6d5b916fe74df33363994b27fc7f71bea3bcedc7ee04bda23107ca3e6e4  rules/rendering-content-visibility.md
93b229560fae92005ed9a2a829064607b39b2e984e92d221d05b2d41df2b7c0e  rules/rendering-hoist-jsx.md
dc7ab358c67c177bca6e6f360fbc935ebe4efa928c0ba3ebd3f9f3d9e2000ca3  rules/rendering-hydration-no-flicker.md
915bacb934e2927d84b37a3f3d225a47b309ac8f9e494ed2bcb66ce07c5676a2  rules/rendering-hydration-suppress-warning.md
351b1095d641717b930f1b2253282b7120af3023bc74e06c17675168d4286864  rules/rendering-resource-hints.md
4cea07b7875ba7fc2c7465ff23b63a2bb334f90aaf2d9293d38d67b05fdb32ab  rules/rendering-script-defer-async.md
ed468533f6e95f622859c884b122cf21f9f593ed6bb3d500a54de4b9f9bcb9fb  rules/rendering-svg-precision.md
3a1249c3f13026b6f54ab5712c388df219d6af01b12aa542749acd99a46f4bc1  rules/rendering-usetransition-loading.md
234050a77faf50cb306be10a9e15bd4421134ab5907e75f13e6d78e2bd262dc9  rules/rerender-defer-reads.md
17eb5830956fb56486fd3cfc7431f5849d39751730c05ad9e77dd4f0c27169c5  rules/rerender-dependencies.md
cb11ec76f50aa7b6847269f02d79b120c889a30d9ecd2c1d578f75144419c77a  rules/rerender-derived-state-no-effect.md
1c326bb67b01fb084eb00c8911b0a7cff54681c2315b629f88e49b64eaa6481d  rules/rerender-derived-state.md
5e68df6b2ae8058e67f476ff1ac67bde159f5a9d18df439e46eabcdeb7b52e58  rules/rerender-functional-setstate.md
4ae844740f266fc8cbf050701230286624a2440ec5be67b9a63d9edc3c580573  rules/rerender-lazy-state-init.md
81c47476564ad8a79fc68fc442734255ca7d6829424359464503fda0a9f9a0dd  rules/rerender-memo-with-default-value.md
1f258990c2f27ff6256b3cc5c43300631bb3f0d81f749aed08d07fcdcc131dd1  rules/rerender-memo.md
abc2cbf167bee056743023351e96806a411d3398da8802093620aecf0721f029  rules/rerender-move-effect-to-event.md
1cc32907a770272524ba682eef9e7efdd8ad4533b6f89b718a1fcd7d1d0eb6a3  rules/rerender-no-inline-components.md
5bdcf2d1558ba5204e643c887b7b4060f89630969425651eb68e96427d97f800  rules/rerender-simple-expression-in-memo.md
6f45d703343484ef9acef9388397f3642966ae6a5a258899a0cf1f9977cfbf6c  rules/rerender-split-combined-hooks.md
60f4033909a62df5e5b8c601494f9e50a562e2f8c1c2d81eac24f38142265f1c  rules/rerender-transitions.md
8c3579576a61a949884167745dcfaf1d5426ba305cc61fd0a79602d70fda4909  rules/rerender-use-deferred-value.md
f1a649af9d1d0b5c762f6c9c4c1c70c90d7df82aa10296ee87aadb78c1b76c54  rules/rerender-use-ref-transient-values.md
d0b8d24a3db9f0f65f9e2bddbf230b0e03a5f60e1229d93a4a18f5e7a991c7c2  rules/server-after-nonblocking.md
a2ca8aa102839251c7971ec784560fab943c20b36fe6f80365d4110c13260c23  rules/server-auth-actions.md
1924b64561841923b88a657085097a0aeba3e0ba2d5470b9f5c15cc10d6ae70f  rules/server-cache-lru.md
fddeea6c870bb3da4134b61d54b7d09b83d2603f929b7547cd3dc1dc269edd5c  rules/server-cache-react.md
c2747424cdac46be62f835f245a0aa887b0090b416d28e2ac8676702645eeb37  rules/server-dedup-props.md
5abea4dd882b13661bd5f7dfb93f9e547d5f08176c61c448ade91b210ed5d49f  rules/server-hoist-static-io.md
4d869bf1cd2f1632e5ca4c0e64b1cf0e71c5f5a0f940bc8a22174d205e735ed7  rules/server-no-shared-module-state.md
569a2e9fc04f9606686cd75c5894ef8781b502786a7fffe241396846c7733472  rules/server-parallel-fetching.md
ad5d9656984d4a959997a2367bf59cc6632297b4634a1dd13a087939d83f30b3  rules/server-parallel-nested-fetching.md
f4c7d68b29c82381baad059c4a7f09e868e71ec9c3115a26ad3ae7d24c0dfe1f  rules/server-serialization.md`),
  },
  {
    name: "web-design-guidelines",
    directory: "skills/frontend-component-quality/upstream/web-design-guidelines",
    sourceRepo: "https://github.com/vercel-labs/web-interface-guidelines",
    commit: "434b7f91364665f2f733b310ec54809bf8f37937",
    fileCount: 1,
    files: p5Files(`
d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234  command.md`),
  },
  {
    name: "better-ui",
    directory: "skills/frontend-component-quality/upstream/better-ui",
    sourceRepo: "https://github.com/jakubkrehel/skills",
    commit: "1eb03d2b145df1c6cd84ab54a337600a2a379017",
    fileCount: 8,
    files: p5Files(`
2d5f9fa4f3bbf045da914349b6e5fde559c947e5323968350b65bb2cdc6b3e4f  SKILL.md
799e0b58bded32edf5c217f97e08c364660ec24234978b2e3f7dee1868bea871  agents/openai.yaml
0e9ee790191d0761a6adf27fdf1e4279d79ecbe5d0d916fc331a28a8c86f39b3  animations.md
de087d3bc69461343409c275dea7d94bca6c1158558b887b7909ce505cdfa70a  enter-exit.md
676b344e7b22c37692a520c7ea2ab8fad3b3c8943a833f8133e51042297e9f06  icon-transitions.md
eac6195bb5d5ba77efd6d9d7751295a7b0d4dadf6a68146639091b02f1e3dbbd  icons.md
db59db84ab371903b7ebdb69f1e92bdc0f2e041331d9dd65d312e4d1b5d449d6  performance.md
35a76b7c4e6da0fc933559e73ca8712fb7b804c383c6f69c25be3b9616ff2721  surfaces.md`),
  },
];
const P5_BUNDLE_FILES = [...new Set([
  "SKILL.md",
  "scripts/check-frontend-component-quality.mjs",
  "references/implementation-readiness.md",
  "upstream/react-best-practices/LICENSE",
  ...P5_PACKAGE_SPECS.flatMap(spec => [
    ...spec.files.map(file => `${spec.directory.replace("skills/frontend-component-quality/", "")}/${file.path}`),
    `${spec.directory.replace("skills/frontend-component-quality/", "")}/UPSTREAM.md`,
  ]),
])].sort();
const P5_RULE_PATH = "upstream/react-best-practices/rules/async-parallel.md";
const P5_RULE_SHA256 = P5_PACKAGE_SPECS[0].files.find(file => file.path === "rules/async-parallel.md").sha256;
const P5_SUMMARY_21_LINES = `# React and Next.js Best Practices

This file is a read-only, compiled reference for the frontend-component-quality skill.
It is advisory guidance for implementation review, not a WorkflowHub gate.

## Eliminating Waterfalls

Start independent requests together, keep dependent requests explicit, and avoid
serial data fetching in component trees when the product contract permits parallel work.

## Bundle Size Optimization

Keep client boundaries narrow, avoid importing unused modules, and load expensive
features only when the interaction needs them. Measure before claiming a gain.

## Component boundaries

Keep state ownership near the consumer, pass typed view models to display components,
and preserve stable props/events when modifying shared components.

Source is pinned in \`UPSTREAM.md\`; this copy is not an independently maintained rule engine.
`;

function p5RegularFiles(base, directory) {
  const absolute = join(base, directory);
  if (!existsSync(absolute)) return [];
  assert.ok(lstatSync(absolute).isDirectory(), `${directory}: must be a real directory`);
  const files = [];
  const walk = (current, prefix = "") => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      assert.ok(!entry.isSymbolicLink(), `${directory}/${path}: symlink is not a payload file`);
      if (entry.isDirectory()) walk(join(current, entry.name), path);
      else {
        assert.ok(entry.isFile(), `${directory}/${path}: payload must be a regular file`);
        files.push(path);
      }
    }
  };
  walk(absolute);
  return files.sort();
}

function assertP5Closure(base) {
  for (const spec of P5_PACKAGE_SPECS) {
    const metadata = new Set(["UPSTREAM.md", ...(spec.name === "react-best-practices" ? ["LICENSE", "history/AGENTS-21lines.md"] : [])]);
    const actualPaths = p5RegularFiles(base, spec.directory).filter(path => !metadata.has(path));
    assert.equal(actualPaths.length, spec.fileCount, `${spec.name}: fixed payload file count`);
    assert.deepEqual(actualPaths, spec.files.map(file => file.path).sort(), `${spec.name}: payload closure must contain exactly ${spec.fileCount} fixed files`);
  }
  const historyPath = join(base, P5_PACKAGE_SPECS[0].directory, "history/AGENTS-21lines.md");
  assert.ok(existsSync(historyPath), "react-best-practices: historical summary missing");
  assert.ok(lstatSync(historyPath).isFile(), "react-best-practices: historical summary must be a regular file");
  assert.equal(createHash("sha256").update(readFileSync(historyPath)).digest("hex"), "5e6f725360d43331346bf4562067f300b1e6c321758d9c4a182d90a3c644c761", "react-best-practices: historical summary sha256 mismatch");
  for (const spec of P5_PACKAGE_SPECS) {
    for (const file of spec.files) {
      const bytes = readFileSync(join(base, spec.directory, file.path));
      const actualHash = createHash("sha256").update(bytes).digest("hex");
      assert.equal(actualHash, file.sha256, `${spec.name}/${file.path}: sha256 mismatch`);
    }
  }
  const reactPaths = P5_PACKAGE_SPECS[0].files.map(file => file.path);
  const reactRules = reactPaths.filter(path => path.startsWith("rules/") && !["rules/_sections.md", "rules/_template.md"].includes(path));
  assert.equal(reactRules.length, 70, "react-best-practices: fixed rule count");
  const categories = [...new Set(reactRules.map(path => path.slice("rules/".length).split("-")[0]))].sort();
  assert.deepEqual(categories, ["advanced", "async", "bundle", "client", "js", "rendering", "rerender", "server"], "react-best-practices: eight fixed categories");
  const web = readFileSync(join(base, P5_PACKAGE_SPECS[1].directory, "command.md"), "utf8");
  const rulesSection = web.match(/^## Rules\s*$([\s\S]*?)^## Output Format\s*$/m);
  assert.ok(rulesSection, "web-design-guidelines: fixed rules section missing");
  assert.equal(rulesSection[1].split(/\r?\n/).filter(line => line.startsWith("- ")).length, 104, "web-design-guidelines: fixed rule count");
  assert.equal(rulesSection[1].split(/\r?\n/).filter(line => line.startsWith("### ")).length, 17, "web-design-guidelines: fixed category count");
  for (const spec of P5_PACKAGE_SPECS) {
    const upstream = readFileSync(join(base, spec.directory, "UPSTREAM.md"), "utf8");
    assert.ok(upstream.includes(spec.sourceRepo), `${spec.name}: UPSTREAM source repository missing`);
    assert.ok(upstream.includes(spec.commit), `${spec.name}: UPSTREAM fixed commit missing`);
    for (const file of spec.files) {
      assert.ok(upstream.includes(file.path), `${spec.name}: UPSTREAM path missing ${file.path}`);
      assert.ok(upstream.includes(file.sha256), `${spec.name}: UPSTREAM sha256 missing ${file.path}`);
    }
  }
}

function p5Fixture() {
  const base = realpathSync(mkdtempSync(join(tmpdir(), "p5-closure-")));
  for (const spec of P5_PACKAGE_SPECS) {
    for (const file of spec.files) {
      const path = join(base, spec.directory, file.path);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, "synthetic negative-control payload\n");
    }
  }
  const historyPath = join(base, P5_PACKAGE_SPECS[0].directory, "history/AGENTS-21lines.md");
  mkdirSync(dirname(historyPath), { recursive: true });
  writeFileSync(historyPath, P5_SUMMARY_21_LINES);
  return base;
}

function assertP5BundleDelivery(packageRoot) {
  const resolved = resolveSkillPackage({
    packageRoot,
    manifestPath: "workflows/build-plan/skill-deps.yaml",
    dependency: { name: "frontend-component-quality", path: "skills/frontend-component-quality/SKILL.md" },
  });
  const actual = resolved.resolved_bundle_paths.map(path => relative(dirname(resolved.resolved_skill_path), path).split(sep).join("/")).sort();
  assert.deepEqual(actual, P5_BUNDLE_FILES, "frontend-component-quality: resolved bundle closure mismatch");
  const rule = resolved.resolved_bundle_paths.find(path => relative(dirname(resolved.resolved_skill_path), path).split(sep).join("/") === P5_RULE_PATH);
  assert.ok(rule, `frontend-component-quality: resolver did not deliver ${P5_RULE_PATH}`);
  const actualHash = createHash("sha256").update(readFileSync(rule)).digest("hex");
  assert.equal(actualHash, P5_RULE_SHA256, "frontend-component-quality: resolved rule bytes differ from the fixed source");
}

test("ORACLE-P5-CLOSURE rejects the 21-line summary and missing payload, then accepts only the complete fixed sources", () => {
  assert.equal(P5_SUMMARY_21_LINES.trimEnd().split("\n").length, 21, "negative fixture must remain the 21-line summary");
  for (const kind of ["summary", "missing"]) {
    const fixture = p5Fixture();
    try {
      if (kind === "summary") {
        writeFileSync(join(fixture, P5_PACKAGE_SPECS[0].directory, "AGENTS.md"), P5_SUMMARY_21_LINES);
        assert.throws(() => assertP5Closure(fixture), /react-best-practices\/AGENTS\.md: sha256 mismatch/);
      } else {
        rmSync(join(fixture, P5_PACKAGE_SPECS[2].directory, "icons.md"));
        assert.throws(() => assertP5Closure(fixture), /better-ui: fixed payload file count/);
      }
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  }
  assertP5Closure(root);
});

test("ORACLE-P5-BUNDLE rejects a deleted bundle item and reads a fixed rule through the real resolver", () => {
  const fixture = p5Fixture();
  try {
    const manifest = join(fixture, "workflows/build-plan/skill-deps.yaml");
    mkdirSync(dirname(manifest), { recursive: true });
    writeFileSync(manifest, "stage: build-plan\n");
    for (const file of P5_BUNDLE_FILES) {
      const path = join(fixture, "skills/frontend-component-quality", file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, "synthetic negative-control bundle metadata\n");
    }
    const bundle = {
      schema_version: 1,
      skill: "frontend-component-quality",
      files: P5_BUNDLE_FILES.filter(file => file !== P5_RULE_PATH),
      sources: [{ path: "../catalog.yaml#skills.frontend-component-quality" }],
    };
    writeFileSync(join(fixture, "skills/frontend-component-quality/skill-bundle.json"), `${JSON.stringify(bundle, null, 2)}\n`);
    assert.throws(() => assertP5BundleDelivery(fixture), /frontend-component-quality: resolved bundle closure mismatch/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
  assertP5BundleDelivery(root);
});
