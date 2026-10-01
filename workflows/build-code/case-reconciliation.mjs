import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { isRuntimeOnlyPath } from "../../runtime/evidence/canonical-utils.mjs";
import { CLOSE_EXECUTION_SIDECAR_PREFIXES } from "../../runtime/task/git-worktree-snapshot.mjs";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import { currentPhaseWriteSetSnapshot as phaseSnapshot, validateCanonicalTestReceipt } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "../../runtime/evidence/acceptance-evidence-validator.mjs";
import { validateVerifyLeaves } from "../../runtime/evidence/quality-store.mjs";
import { authenticateP10RunConsumption, authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { assertTaskHandle, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { activeAcceptanceCriterionIds } from "../../runtime/stage/stage-content-contracts.mjs";
import { FIXED_TARGETED_CAPTURE_COMMAND } from "./capture.mjs";
import { capturePreExecutionTaskChangeScope, taskWorkspaceMatches } from "./change-scope.mjs";
import { readCurrentTestAssetRegistry } from "./test-asset-inventory.mjs";
import { classifyChangedPaths, selectAffectedCases } from "./case-selection.mjs";

// The legacy seam below compares caller-supplied artifacts and never issues a
// business pass. The current-Task reader added at the end independently reads
// the outer receipt and each per-case Task record, but still cannot issue a
// business pass while the independent effect reader/producer is absent.
const SHA256 = /^[a-f0-9]{64}$/;
const reject = (reason) => Object.freeze({ status: "unavailable", reason, entries: [] });
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const nonempty = (value) => typeof value === "string" && value.trim() !== "";
const TARGETED_REF = /^quality\/evidence\/build-code-targeted\/(?:raw|case|manifest)-[a-f0-9]{64}\.(?:txt|json)$/;
// CARD-04's derived R rows are old planning trace edges, not new U/V quotes.
// Pin both the full original R row and the complete current index cell; a
// matching message number alone cannot authenticate a rewritten assertion.
const DERIVED_R_SOURCE = Object.freeze({
  "R-001": ["dde7b9f4275e942f62668f1d5b11352a36c2d9975e85253f583234435edb0bf8", "母 PRD CARD-04 :322-352（派生，非 U/V）", "D-003"],
  "R-002": ["b785ffa3c22ec1ec14e4c01bb3967ef387149533668fe2bccadc10542e9b311c", "母 PRD 共享定义 :25-96（派生，非 U/V）", "D-001"],
  "R-003": ["0c7232048eb70ffcd6138d5b8d138a0355e17b30f712132421321195b67d4199", "母 decision-log OI-004（派生，非 U/V）", "D-001"],
  "R-006": ["170b2dc78f8a83e75dc0054dbc65559bc09b7a2e062948cc2849d9c086f6b06e", "外部基准文章（研究，不是用户引文）", "D-007"],
  "R-010": ["10d025a28ba9ea9e20806c715e38bb11f5396623bf4464af575a69e2624106c8", "m02902/m02962 用户请求与结构化范围答复（已有 R 记录，非本节逐字 U/V）", "D-009"],
  "R-011": ["c17a9580a6983eed8e69b4231e2837b9ba5942b072e92137f30ccfd28a54ce4d", "m02966 结构化用例库答复（已有 R 记录，非本节逐字 U/V）", "D-010"],
  "R-012": ["e600a6a9a58246d0deb924cdfe8e3649902adf2de4362bbd2b9a978e9eb38f90", "m02966 结构化测试适用性/证据答复（已有 R 记录，非本节逐字 U/V）", "D-012"],
  "R-013": ["62177d09afa8416514c402c950ff2724c7f82da919dc7fd41b7e989ff83732a8", "m02976 结构化索引答复（已有 R 记录，非本节逐字 U/V）", "D-010"],
  "R-014": ["c94b9e5ec4802ea41a1e68776091eb96d170769ccec556fef26ac807ef83bb9b", "m02982 结构化库位置/起始覆盖答复（已有 R 记录，非本节逐字 U/V）", "D-010"],
  "R-015": ["b81df915f1a0c7f3d0b99ecaae1e1ce65c6966627225a04ee8f61ca997660018", "meaning-code-test 结构化术语答复（已有 R 记录，非本节逐字 U/V）", "D-011"],
  "R-016": ["c271650976852a15c81283c83bf3f66d479e5a4a5f1d4caf569a1f99c205a531", "meaning-real-device-ui 结构化术语答复（已有 R 记录，非本节逐字 U/V）", "D-012"],
  "R-017": ["ccdc13cd87af17d90258d144cfcef5d76f4404faa63a518e9c454d5ec6cc1839", "post-verify-acceptance-time 结构化时点答复（已有 R 记录，非本节逐字 U/V）", "D-014"],
  "R-018": ["0cb86ec5c9e0fb538d56024b9b9c44c252e2d63494a64937e5e3184eb3328bad", "card04-post-browser-protected-write 条件研究授权（已有 R 记录；未批准写代码）", "D-009"],
});

function readArtifact(ref, expectedHash) {
  if (!nonempty(ref) || !isAbsolute(ref) || !SHA256.test(expectedHash ?? "")) return null;
  try {
    const bytes = readFileSync(ref);
    return { bytes, matches: digest(bytes) === expectedHash };
  } catch { return null; }
}

function reportMatches(raw, title) {
  const lines = raw.toString("utf8").split(/\r?\n/);
  return lines.find((line) => line.trim()) === "TAP version 13"
    && lines.filter((line) => line === `# Subtest: ${title}`).length === 1
    && lines.filter((line) => line === `ok 1 - ${title}`).length === 1
    && lines.includes("# tests 1") && lines.includes("# pass 1")
    && lines.includes("# fail 0") && lines.includes("# skipped 0")
    && lines.includes("# todo 0");
}

export function reconcileCases({ selection, observations, oracleEvidence, task } = {}) {
  if (selection?.status !== "selected" || !Array.isArray(selection.cases)
      || selection.cases.length === 0 || !Array.isArray(observations)
      || observations.length === 0 || !nonempty(task?.task_id)
      || !Array.isArray(task.acceptance_criterion_ids)) return reject("missing_business_oracle");
  if (observations.some((row) => row?.status !== "passed" || row.exit_code !== 0)) {
    return reject("nonpassing_runner_status");
  }
  const identities = observations.map((row) => `${row.case_id}\u0000${row.test_file}\u0000${row.full_id}`);
  if (new Set(identities).size !== identities.length) return reject("duplicate_runner_identity");
  if (!Array.isArray(oracleEvidence) || oracleEvidence.length === 0) {
    return reject("missing_business_oracle");
  }
  const observed = [];
  for (const item of selection.cases) {
    const criteria = item?.acceptance_criterion_ids;
    if (!nonempty(item?.id) || !Array.isArray(criteria) || criteria.length === 0
        || criteria.some((id) => !task.acceptance_criterion_ids.includes(id))) {
      return reject("missing_business_oracle");
    }
    const rows = observations.filter((row) => row.case_id === item.id);
    if (rows.length !== 1 || rows[0].test_file !== item.execution?.target
        || rows[0].full_id !== item.execution?.expected_test_identity) {
      return reject("runner_identity_mismatch");
    }
    const row = rows[0];
    for (const criterion of criteria) {
      const proofs = oracleEvidence.filter((evidence) => evidence?.case_id === item.id
        && evidence.acceptance_criterion_id === criterion);
      if (proofs.length !== 1) return reject("missing_business_oracle");
      const proof = proofs[0];
      const report = readArtifact(row.report_ref, row.raw_report_sha256);
      const reported = readArtifact(proof.report_ref, proof.raw_report_sha256);
      if (!report || !reported || !report.matches || !reported.matches
          || row.report_ref !== proof.report_ref
          || row.raw_report_sha256 !== proof.raw_report_sha256) {
        return reject("report_digest_mismatch");
      }
      if (!reportMatches(report.bytes, row.full_id)) return reject("runner_identity_mismatch");
      const before = readArtifact(proof.before_ref, proof.before_sha256);
      const after = readArtifact(proof.after_ref, proof.after_sha256);
      if (!before || !after || !before.matches || !after.matches) return reject("missing_effect_artifact");
      let prior;
      let current;
      try {
        prior = JSON.parse(before.bytes.toString("utf8"));
        current = JSON.parse(after.bytes.toString("utf8"));
      } catch { return reject("missing_effect_artifact"); }
      // This narrow contradiction check uses only the fixture's explicit
      // cancellation/balance observation. Matching values do not establish an
      // independent, versioned product rule or an official acceptance pass.
      if (item.execution?.runner === "node:test"
          && item.execution.expected_test_identity.startsWith("cancellation preserves account balance ")) {
        if (current.account_id !== prior.account_id
            || !Number.isSafeInteger(prior.balance_cents)
            || current.balance_cents !== prior.balance_cents
            || prior.cancelled !== false || current.cancelled !== true
            || proof.balance_before_cents !== prior.balance_cents
            || proof.balance_after_cents !== current.balance_cents
            || proof.cancelled !== current.cancelled) return reject("business_effect_mismatch");
      }
      observed.push(Object.freeze({ case_id: item.id, acceptance_criterion_id: criterion,
        status: "observed", report_ref: proof.report_ref, raw_report_sha256: row.raw_report_sha256,
        before_ref: proof.before_ref, before_sha256: proof.before_sha256,
        after_ref: proof.after_ref, after_sha256: proof.after_sha256 }));
    }
  }
  if (observations.length !== selection.cases.length) return reject("runner_identity_mismatch");
  return Object.freeze({ status: "unavailable", reason: "unauthenticated_business_oracle",
    entries: Object.freeze(observed), task_id: task.task_id });
}

function worktreeBytes(root, path) {
  if (typeof path !== "string" || path.trim() === "" || isAbsolute(path)
      || path.split("/").some((part) => part === "." || part === "..")) throw new Error("unsafe worktree path");
  const file = resolve(root, path);
  const inside = relative(root, file);
  if (inside === "" || inside === ".." || inside.startsWith(`..${sep}`)
      || isAbsolute(inside) || realpathSync(file) !== file || !statSync(file).isFile()) {
    throw new Error("worktree path is not a regular source file");
  }
  return readFileSync(file);
}

function boundTaskRecord(task, ref, expectedHash, kind) {
  if (!TARGETED_REF.test(ref ?? "") || !ref.includes(`/${kind}-`)
      || !SHA256.test(expectedHash ?? "") || !ref.endsWith(`-${expectedHash}.${kind === "raw" ? "txt" : "json"}`)) {
    throw new Error("targeted Task record ref/hash is invalid");
  }
  const raw = task.readRecord(ref);
  if (digest(raw) !== expectedHash) throw new Error("targeted Task record hash differs");
  return raw;
}

function parseVitestLeaves(raw, target, workspaceRoot) {
  let report;
  try { report = JSON.parse(raw.trim()); }
  catch { throw new Error("per-target reporter is not one JSON document"); }
  const expectedFile = resolve(workspaceRoot, target);
  const actualFile = report?.testResults?.[0]?.name;
  if (!Array.isArray(report?.testResults) || report.testResults.length !== 1
      || !isAbsolute(actualFile ?? "") || realpathSync(expectedFile) !== realpathSync(actualFile)
      || report.testResults[0].status !== "passed" || report.success !== true) {
    throw new Error("per-target reporter file or status is invalid");
  }
  const assertions = report.testResults[0].assertionResults;
  if (!Array.isArray(assertions) || assertions.length === 0
      || assertions.length !== report.numTotalTests || report.numPassedTests !== assertions.length
      || report.numFailedTests !== 0 || report.numPendingTests !== 0 || report.numTodoTests !== 0) {
    throw new Error("per-target reporter totals are incomplete");
  }
  const ids = assertions.map((row) => {
    if (!Array.isArray(row?.ancestorTitles)
        || row.ancestorTitles.some((title) => !nonempty(title))
        || !nonempty(row.title) || row.fullName !== [...row.ancestorTitles, row.title].join(" ")
        || row.status !== "passed") throw new Error("per-target reporter leaf is not passed and identified");
    return [target, ...row.ancestorTitles, row.title].join(" > ");
  });
  if (new Set(ids).size !== ids.length) throw new Error("per-target reporter has duplicate leaf identity");
  return ids;
}

/** Stable, unique heading anchors replace whole-file revision hashes. */
export function businessCaseAnchorErrors(entry, read) {
  const errors = [];
  for (const role of ["source", "rule"]) {
    const binding = entry?.[role];
    const heading = typeof binding?.revision === "string" && binding.revision.startsWith("anchor:")
      ? binding.revision.slice("anchor:".length) : null;
    let text;
    try { text = read(binding?.path); } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const lines = text === undefined || text === null ? [] : String(text).split(/\r?\n/);
    if (!heading || !/^#{2,3} \S/.test(heading)
        || lines.filter((line) => line === heading || line.startsWith(`${heading} `) || line.startsWith(`${heading} —`)).length !== 1) {
      errors.push(`stale ${role}.revision`);
    }
  }
  if (entry?.effect_observation?.rule_revision !== entry?.rule?.revision) errors.push("rule_revision mismatch");
  return errors;
}


export function currentCatalog(task, workspaceRoot) {
  const raw = worktreeBytes(workspaceRoot, "docs/quality/business-case-catalog.json");
  const catalog = JSON.parse(raw);
  if (catalog.schema !== "workflowhub-business-case-catalog.v1"
      || catalog.project !== task.identity.projectName
      || !nonempty(catalog.revision) || !Array.isArray(catalog.cases)) {
    throw new Error("current business catalog identity is invalid");
  }
  for (const entry of catalog.cases) {
    const phase = entry.phase_ids?.[0];
    if (!nonempty(entry.id) || !/^P[1-9][0-9]*$/.test(phase ?? "")
        || businessCaseAnchorErrors(entry, (path) => worktreeBytes(workspaceRoot, path)).length) {
      throw new Error("current business source/rule revision is invalid");
    }
  }
  return { catalog, sha256: digest(raw) };
}

function sourceSection(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const starts = lines.flatMap((line, index) => line === `## ${heading}` ? [index] : []);
  if (starts.length !== 1) return null;
  const end = lines.findIndex((line, index) => index > starts[0] && /^## /.test(line));
  return lines.slice(starts[0] + 1, end < 0 ? undefined : end);
}

// Independently inspect the raw source; never use the parser under test as its
// own business oracle. Unknown formats fail closed.
function independentlyReadCensus(raw) {
  const text = raw.toString("utf8");
  const changes = sourceSection(text, "需求变更记录");
  const index = sourceSection(text, "原始需求索引");
  const verbatim = sourceSection(text, "逐字声明层（verbatim）");
  if (!changes || !index || !verbatim) return false;
  const u = new Map();
  let active = null;
  for (const line of changes) {
    const heading = /^### (U-\d{3})(?:\s|$)/.exec(line);
    if (heading) {
      if (u.has(heading[1])) return false;
      active = heading[1];
      u.set(active, []);
    } else if (/^### /.test(line)) active = null;
    else if (active && /^>\s*\S/.test(line)) u.get(active).push(line.replace(/^>\s*/, ""));
  }
  if (u.size < 3 || [...u.values()].some((quotes) => quotes.length === 0)) return false;
  const atoms = changes.flatMap((line) => {
    const match = /^\|\s*(U-\d{3}-\d{2})\s*\|\s*([^|]+)\|/.exec(line);
    return match ? [{ id: match[1], text: match[2].trim() }] : [];
  });
  if (atoms.length !== new Set(atoms.map(({ id }) => id)).size
      || atoms.some(({ id, text: value }) => !value || !u.has(id.slice(0, 5)))) return false;
  const v = verbatim.flatMap((line) => {
    const match = /^\|\s*(V-\d{3})\s*\|\s*用户\s*\|\s*[^|]+\|\s*([^|]+)\|/.exec(line);
    return match ? [{ id: match[1], text: match[2].trim() }] : [];
  });
  if (v.length < 1 || v.length !== new Set(v.map(({ id }) => id)).size
      || v.some(({ text: value }) => !value)) return false;
  const required = new Set(Array.from({ length: 8 }, (_, index) => `R-${String(index + 1).padStart(3, "0")}`));
  const rows = index.flatMap((line) => {
    const match = /^\|\s*(R-\d{3})\s*\|\s*([^|]+)\|\s*(D-\d{3})\s*\|/.exec(line);
    return match ? [{ id: match[1], source: match[2].trim(), decision: match[3] }] : [];
  });
  const ids = rows.map((row) => row.id);
  if (ids.length !== new Set(ids).size || [...required].some((id) => !ids.includes(id))) return false;
  const original = sourceSection(text, "原始需求");
  const historicalRows = (original ?? []).flatMap((line) => {
    const id = /^\|\s*(R-\d{3})\s*\|/.exec(line)?.[1];
    return id ? [[id, line]] : [];
  });
  if (historicalRows.length !== new Set(historicalRows.map(([id]) => id)).size) return false;
  const historical = new Map(historicalRows);
  const explicitDerivedSource = (row) => {
    const [priorHash, source, decision] = DERIVED_R_SOURCE[row.id] ?? [];
    const prior = historical.get(row.id);
    return Boolean(prior && digest(prior) === priorHash
      && row.source === source && row.decision === decision);
  };
  const known = new Set([...u.keys(), ...atoms.map(({ id }) => id), ...v.map(({ id }) => id)]);
  const covered = new Set();
  let externalOriginalUnavailable = false;
  for (const row of rows) {
    const refs = [...row.source.matchAll(/\b(?:U-\d{3}(?:-\d{2}(?:~\d{2})?(?:\/\d{2})*)?|V-\d{3})\b/g)]
      .map(([value]) => value);
    if (refs.length === 0) {
      if (!explicitDerivedSource(row)) return false;
      if (/^R-01[0-8]$/.test(row.id)) externalOriginalUnavailable = true;
      continue;
    }
    for (const ref of refs) {
      if (/^U-\d{3}-\d{2}/.test(ref)) {
        const family = ref.slice(0, 5);
        const first = Number(ref.slice(6, 8));
        const last = /~(\d{2})/.exec(ref)?.[1];
        const members = last === undefined ? [first]
          : Array.from({ length: Number(last) - first + 1 }, (_, offset) => first + offset);
        members.push(...[...ref.matchAll(/\/(\d{2})/g)].map(([, number]) => Number(number)));
        if (members.length === 0 || members.length > 100 || members.some((number) => number < 1 || number > 99)) return false;
        for (const number of members) {
          const id = `${family}-${String(number).padStart(2, "0")}`;
          if (!known.has(id)) return false;
          covered.add(id);
        }
        covered.add(family);
      } else {
        if (!known.has(ref)) return false;
        covered.add(ref);
      }
    }
  }
  if ([...known].some((id) => !covered.has(id))) return false;
  const decomposedParents = new Set(atoms.map(({ id }) => id.slice(0, 5)));
  const independentV = v.filter(({ text: value }) => ![...u.entries()].some(([id, quotes]) =>
    covered.has(id) && quotes.join("\n").includes(value))).length;
  const entries = atoms.length + [...u.keys()].filter((id) => !decomposedParents.has(id)).length + independentV;
  if (u.size + atoms.length + v.length < 8 || entries < 8) return false;
  return Object.freeze({ source_structure_valid: true, source_denominator: entries,
    external_original_unavailable: externalOriginalUnavailable });
}

function readCurrentEffect(task, item, ac, materialRevision, snapshotTree, receipt, workspaceRoot, factBinding = null, bindingOnly = false) {
  if (item.effect_observation?.canonical_source?.subject !== ac) return "invalid_business_effect_binding";
  let candidates;
  try {
    const refs = factBinding === null ? task.listCanonicalQualityFactRefs() : [factBinding.ref];
    candidates = refs.flatMap((ref) => {
      const raw = task.readRecord(ref);
      const value = JSON.parse(raw);
      return value.task_id === task.identity.taskId && value.stage === "build-code"
        && value.kind === "acceptance_criterion" && value.subject === ac
        && value.material_revision === materialRevision && value.snapshot_tree === snapshotTree
        ? [{ ref, raw, value }] : [];
    });
  } catch { return "missing_current_business_effect"; }
  if (candidates.length === 0) return "missing_current_business_effect";
  if (candidates.length !== 1) return "conflicting_current_business_effect";
  const { ref, raw, value } = candidates[0];
  let fact;
  try {
    fact = authenticateQualityFactRecord({ ref, sha256: digest(raw) },
      { read: (recordRef) => task.readRecord(recordRef) });
  } catch { return "invalid_business_effect_binding"; }
  if (!fact.authenticated) return "invalid_business_effect_binding";
  try {
    if (value.evidence.length !== 1 || value.evidence[0].evidence_type !== "acceptance_evidence") {
      return "invalid_business_effect_binding";
    }
    const wrapperRef = value.evidence[0];
    const wrapperRaw = task.readRecord(wrapperRef.ref);
    if (digest(wrapperRaw) !== wrapperRef.sha256) return "invalid_business_effect_binding";
    const wrapper = validateAcceptanceEvidence(JSON.parse(wrapperRaw));
    if (wrapper.acceptance_criterion_id !== ac || wrapper.snapshot_tree !== snapshotTree
        || wrapper.freshness?.material_revision !== materialRevision
        || wrapper.refs.length !== 1) return "invalid_business_effect_binding";
    const nestedRef = wrapper.refs[0];
    if (!nestedRef.ref.startsWith(`quality/evidence/stage-quality/build-code/${ac}-`)
        || !/^quality\/evidence\/stage-quality\/build-code\/[A-Za-z0-9._:-]+-[a-f0-9]{64}\.json$/.test(nestedRef.ref)) {
      return "invalid_business_effect_binding";
    }
    const nestedRaw = task.readRecord(nestedRef.ref);
    if (digest(nestedRaw) !== nestedRef.sha256) return "invalid_business_effect_binding";
    const nested = JSON.parse(nestedRaw);
    if (nested.schema_version !== "stage-quality-evidence.v1"
        || nested.task_id !== task.identity.taskId || nested.stage !== "build-code"
        || nested.subject !== ac || nested.status !== value.status
        || nested.snapshot_tree !== snapshotTree || nested.material_revision !== materialRevision
        || nested.subject_fact?.status !== value.status) return "invalid_business_effect_binding";
    const bound = nested.subject_fact.evidence_refs;
    if (!Array.isArray(bound) || bound.some((entry) => {
      if (typeof entry?.ref !== "string" || !SHA256.test(entry.sha256 ?? "")) return true;
      try { return digest(task.readRecord(entry.ref)) !== entry.sha256; }
      catch { return true; }
    })) return "current_effect_receipt_mismatch";
    const directReceipt = bound.filter((entry) => entry.ref === receipt.receipt_ref).length === 1
      && bound.some((entry) => entry.ref === receipt.receipt_ref && entry.sha256 === receipt.receipt_hash);
    // factBinding is supplied only by authenticateP10RunConsumption after it
    // authenticates this call's tests fact, AC originals and exact final row.
    // Empty business evidence is disclosed; the shared consumption source is
    // never promoted to an AC execution proof or substituted in the original.
    if (bindingOnly && (directReceipt || factBinding !== null)) return Object.freeze({ status: "bound", ref, sha256: digest(raw),
      acceptance_ref: wrapperRef.ref, acceptance_sha256: wrapperRef.sha256,
      stage_quality_ref: nestedRef.ref, stage_quality_sha256: nestedRef.sha256,
      receipt_ref: receipt.receipt_ref, receipt_sha256: receipt.receipt_hash,
      receipt_binding: directReceipt ? "direct_business_evidence" : "same_call_consumption",
      quality_fact_status: value.status, acceptance_result: wrapper.result,
      business_evidence_status: directReceipt ? "present" : "missing" });
    if (!directReceipt) return "current_effect_receipt_mismatch";
    if (item.id === "CARD04-DECISION-LOG-CENSUS") {
      const source = item.effect_observation.canonical_source.material_source_path;
      const sourceCheck = source === item.source.path
        ? independentlyReadCensus(worktreeBytes(workspaceRoot, source)) : false;
      if (!sourceCheck) {
        return "business_effect_mismatch";
      }
      if (value.status !== "passed" || wrapper.result !== "pass") return "business_effect_mismatch";
      return sourceCheck.external_original_unavailable
        ? "external_original_unavailable" : "evidence_chain_present";
    }
    if (item.id === "CARD04-DEFERRED-ACCEPTANCE-REGRESSION") {
      return value.status === "missing" && wrapper.result === "deferred"
        ? "evidence_chain_present" : "business_effect_mismatch";
    }
    return "independent_effect_reader_unavailable";
  } catch { return "invalid_business_effect_binding"; }
}

// Independent business-rule observations use raw Git/bootstrap and raw registry
// bytes. A source observation is not an authenticated outer returned scope or
// a business pass; every caller retains the full unresolved change boundary.
function independentGitChangeObservation(task, root, receipt, current, catalog, selection, manifest) {
  try {
    const ref = `identity/executions/bootstrap-${task.identity.taskId}.json`;
    const raw = task.readRecord(ref), bootstrap = JSON.parse(raw);
    const { execution_manifest_hash, ...unsigned } = bootstrap;
    const created = bootstrap.creation_result, binding = created?.workspace;
    const oid = /^[a-f0-9]{40,64}$/;
    const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 });
    if (digest(`${JSON.stringify(unsigned, null, 2)}\n`) !== execution_manifest_hash
        || bootstrap.schema_version !== "workflowhub-invocation-identity.v1"
        || bootstrap.command !== "task-bootstrap" || bootstrap.stage !== "make-decision"
        || bootstrap.run_id !== `bootstrap-${task.identity.taskId}`
        || bootstrap.project_name !== task.identity.projectName || bootstrap.task_id !== task.identity.taskId
        || bootstrap.transaction?.status !== "closed" || created?.status !== "completed"
        || created.project !== task.identity.projectName || created.task !== task.identity.taskId
        || created.task_path !== task.taskPath || binding?.worktree_root !== root
        || !oid.test(binding.baseline_commit ?? "")
        || binding.branch !== git("symbolic-ref", "--quiet", "--short", "HEAD").trim()
        || git("rev-parse", "--verify", `${binding.baseline_commit}^{commit}`).trim() !== binding.baseline_commit
        || git("rev-parse", "--verify", `${receipt.snapshot_commit}^{tree}`).trim() !== receipt.snapshot_tree) {
      throw new Error("independent bootstrap or snapshot identity mismatch");
    }
    git("merge-base", "--is-ancestor", binding.baseline_commit, receipt.snapshot_commit);
    const fields = git("diff", "--no-ext-diff", "--name-status", "-z", "-M",
      binding.baseline_commit, receipt.snapshot_commit, "--").split("\0");
    if (fields.at(-1) !== "") throw new Error("unterminated Git diff");
    fields.pop();
    const paths = new Set(), changes = [];
    const included = (path) => !isRuntimeOnlyPath(path)
      && !CLOSE_EXECUTION_SIDECAR_PREFIXES.some((prefix) => path.startsWith(prefix));
    for (let at = 0; at < fields.length;) {
      const status = fields[at++];
      if (!/^(?:[A-Z]|[RC]\d{1,3})$/.test(status)) throw new Error("invalid raw Git status");
      const renamed = /^[RC]\d/.test(status), count = renamed ? 2 : 1;
      const names = fields.slice(at, at + count); at += count;
      if (names.length !== count || names.some((name) => !nonempty(name) || isAbsolute(name)
          || name.split("/").some((part) => part === "." || part === ".."))) throw new Error("invalid raw Git path");
      names.filter(included).forEach((name) => paths.add(name));
      if (!renamed) { if (included(names[0])) changes.push({ status, path: names[0] }); }
      else if (included(names[0]) && included(names[1])) changes.push({ status, old_path: names[0], path: names[1] });
      else if (included(names[0])) changes.push({ status: "D", path: names[0] });
      else if (included(names[1])) changes.push({ status: "A", path: names[1] });
    }
    const expectedPaths = [...paths].sort();
    const normalizeChanges = (rows) => rows.map((row) => JSON.stringify(row)).sort();
    if (current.start_ref !== ref || current.start_commit !== binding.baseline_commit
        || JSON.stringify(expectedPaths) !== JSON.stringify([...current.changed_paths].sort())
        || JSON.stringify(normalizeChanges(changes)) !== JSON.stringify(normalizeChanges(current.changes))) {
      throw new Error("raw Git and current change-source projection disagree");
    }
    const classified = classifyChangedPaths(expectedPaths, catalog);
    const active = catalog.cases.filter((item) => item.status === "active");
    const selected = new Set(classified.rows
      .filter((row) => row.classification === "business")
      .flatMap((row) => row.case_ids ?? []));
    const unmapped = classified.summary.unknown_changed_paths ?? [];
    const queue = [...selected];
    for (let at = 0; at < queue.length; at += 1) {
      const item = active.find((entry) => entry.id === queue[at]);
      if (!item) throw new Error("missing independently selected case");
      for (const related of item.related_case_ids) {
        if (!active.some((entry) => entry.id === related)) throw new Error("invalid related case");
        if (!selected.has(related)) { selected.add(related); queue.push(related); }
      }
    }
    const selectedIds = [...selected].sort();
    if (JSON.stringify(selectedIds) !== JSON.stringify([...manifest.selected_case_ids].sort())
        || JSON.stringify(unmapped) !== JSON.stringify([...(selection.unmapped_changed_paths ?? [])].sort())
        || (manifest.scope_summary !== undefined
          && JSON.stringify(manifest.scope_summary) !== JSON.stringify(classified.summary))) {
      throw new Error("independent change selection differs from actual manifest");
    }
    return Object.freeze({ status: "observed", rule: "authenticated_task_change_scope",
      bootstrap_ref: ref, bootstrap_sha256: digest(raw), baseline_commit: binding.baseline_commit,
      snapshot_commit: receipt.snapshot_commit, expected_changed_paths: Object.freeze(expectedPaths),
      expected_changes: Object.freeze(changes.map(Object.freeze)), selected_case_ids: Object.freeze(selectedIds),
      scope_summary: classified.summary,
      returned_change_scope_binding: "unavailable" });
  } catch (error) {
    return Object.freeze({ status: "unknown", rule: "authenticated_task_change_scope",
      reason: error.message, returned_change_scope_binding: "unavailable" });
  }
}

function independentInventoryObservation(root, item, reports, manifest) {
  try {
    const raw = worktreeBytes(root, "docs/quality/test-asset-registry.json"), registry = JSON.parse(raw);
    if (registry.schema !== "workflowhub-test-asset-registry.v1" || registry.outside_scope !== "unknown"
        || !Array.isArray(registry.targets)) throw new Error("invalid independent inventory source");
    const targets = registry.targets.filter((target) => target.status === "active");
    if (new Set(targets.map((target) => target.path)).size !== targets.length) throw new Error("duplicate physical inventory target");
    const matches = targets.filter((target) => target.path === item.execution.target), actual = reports.get(item.id);
    if (matches.length !== 1 || !actual) throw new Error("selected inventory target was not actually run");
    const target = matches[0], sourceHash = digest(worktreeBytes(root, target.path));
    const trustedCli = realpathSync(createRequire(import.meta.url).resolve("vitest/vitest.mjs"));
    const actualArgv = actual.report.argv, actualCli = realpathSync(actualArgv[0]);
    if (!statSync(trustedCli).isFile() || !statSync(actualCli).isFile()
        || realpathSync(manifest.execution.executable) !== realpathSync(process.execPath)
        || digest(readFileSync(actualCli)) !== digest(readFileSync(trustedCli))
        || JSON.stringify(actualArgv.slice(1)) !== JSON.stringify(["run", target.path, "--reporter=json"])) {
      throw new Error("actual Node/Vitest argv is not the trusted fixed invocation");
    }
    if (sourceHash !== target.sha256 || target.runner !== "vitest"
        || target.command !== `npx vitest run ${target.path} --reporter=json`
        || JSON.stringify(target.registered_test_ids) !== JSON.stringify(actual.ids)
        || actual.report.target !== target.path || actual.report.exit_code !== 0) {
      throw new Error("current source, independent registry and actual runnable leaves disagree");
    }
    const actualTargets = new Set([...reports.values()].map((entry) => entry.report.target));
    return Object.freeze({ status: "observed", rule: "independent_test_inventory", target: target.path,
      source_sha256: sourceHash, registry_sha256: digest(raw), full_ids: Object.freeze([...actual.ids]),
      executable: manifest.execution.executable, argv: Object.freeze([...actual.report.argv]),
      report_ref: actual.report.raw_ref, report_sha256: actual.report.raw_sha256,
      registered_target_count: targets.length,
      not_run_targets: Object.freeze(targets.filter((entry) => !actualTargets.has(entry.path)).map((entry) => entry.path)),
      outside_scope: "unknown" });
  } catch (error) {
    return Object.freeze({ status: "unknown", rule: "independent_test_inventory", reason: error.message,
      outside_scope: "unknown" });
  }
}

// Read-only capability observations execute the existing production functions.
// In-memory probes are never published as acceptance leaves or Task business passes.
function classifyObservedResult(result, ac, sourceDigest, acceptanceRef, nestedRefs) {
  return validateVerifyLeaves([{ acceptance_criterion_id: ac, result, source_digest: sourceDigest,
    acceptance_leaf: acceptanceRef, nested_evidence: nestedRefs,
    scenario: "Read an authenticated source and observe the current result classifier",
    oracle: "Nonterminal acceptance results must remain nonpassing",
    actual_outcome: result, evidence_type: "read_only_capability_observation",
    coverage_limits: ["This observation does not prove official current-Task emission"],
    exceptions: ["No acceptance status is replaced by this classifier observation"] }], { sourceDigest })[0].status;
}

function independentCensusObservation(root, item) {
  try {
    const path = item.effect_observation.canonical_source.material_source_path;
    if (path !== item.source.path) throw new Error("census source differs from registered material");
    const raw = worktreeBytes(root, path), observed = independentlyReadCensus(raw);
    if (!observed) return Object.freeze({ status: "unknown", rule: "decision_log_census",
      reason: "business_effect_mismatch", source_structure_valid: false, source_ref: path, source_sha256: digest(raw) });
    return Object.freeze({ status: "observed", rule: "decision_log_census", source_ref: path,
      source_sha256: digest(raw), ...observed, business_effect_status: "unknown" });
  } catch (error) {
    return Object.freeze({ status: "unknown", rule: "decision_log_census", reason: error.message });
  }
}

function independentMachineClassObservation(item, receipt, capture, manifest) {
  try {
    const values = ["pass", "fail", "inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"];
    const proof = { ref: capture.targeted_capture.manifest_ref, sha256: capture.targeted_capture.manifest_hash };
    const results = values.map((result) => {
      const sample = validateAcceptanceEvidence({ schema_version: "acceptance-evidence.v1",
        acceptance_criterion_id: item.ac_ids[0], result, refs: [proof] });
      const qualityStatus = classifyObservedResult(sample.result, item.ac_ids[0], receipt.source_digest, proof, [proof]);
      if (["inconclusive", "deferred", "missing", "inconsistent", "incomplete", "unavailable"].includes(result)
          && qualityStatus !== "incomplete") throw new Error("nonterminal result was classified as passing");
      if (result === "fail" && qualityStatus !== "failed") throw new Error("failed result was not classified as failed");
      return Object.freeze({ result, accepted: sample.result === result, quality_status: qualityStatus });
    });
    let invalidResultRejected = false;
    try { validateAcceptanceEvidence({ schema_version: "acceptance-evidence.v1", acceptance_criterion_id: item.ac_ids[0],
      result: "timed_out", refs: [proof] }); } catch { invalidResultRejected = true; }
    if (!invalidResultRejected) throw new Error("a ninth acceptance result was accepted");
    const interfaces = ["runtime/evidence/acceptance-evidence-validator.mjs", "runtime/evidence/quality-store.mjs"];
    return Object.freeze({ status: "observed", rule: "acceptance_machine_classes", results: Object.freeze(results),
      invalid_result_rejected: true, capability_scope: "helper_validator_only", official_emission_status: "unknown",
      observation_source: proof, manifest_run_id: manifest.run_id,
      production_sources: Object.freeze(interfaces.map((ref) => Object.freeze({ ref,
        sha256: digest(readFileSync(new URL(`../../${ref}`, import.meta.url))) }))) });
  } catch (error) {
    return Object.freeze({ status: "unknown", rule: "acceptance_machine_classes", reason: error.message,
      capability_scope: "helper_validator_only", official_emission_status: "unknown" });
  }
}

function independentDeferredObservation(task, receipt) {
  try {
    const originals = [], seen = new Set();
    for (const factRef of task.listCanonicalQualityFactRefs()) {
      const factRaw = task.readRecord(factRef), fact = JSON.parse(factRaw);
      if (fact.task_id !== task.identity.taskId || fact.kind !== "acceptance_criterion") continue;
      for (const evidence of fact.evidence ?? []) {
        if (evidence.evidence_type !== "acceptance_evidence") continue;
        const raw = task.readRecord(evidence.ref);
        if (digest(raw) !== evidence.sha256) throw new Error("canonical_acceptance_original_hash_mismatch");
        const acceptance = validateAcceptanceEvidence(JSON.parse(raw));
        if (acceptance.result !== "deferred") continue;
        const evaluated = authenticateQualityFactRecord({ ref: factRef, sha256: digest(factRaw) },
          { read: (ref) => task.readRecord(ref) });
        if (!evaluated.authenticated || fact.status === "passed") throw new Error("deferred_original_quality_mismatch");
        if (seen.has(evidence.ref)) continue;
        seen.add(evidence.ref);
        const qualityStatus = classifyObservedResult(acceptance.result, acceptance.acceptance_criterion_id,
          receipt.source_digest, { ref: evidence.ref, sha256: evidence.sha256 }, acceptance.refs);
        if (qualityStatus !== "incomplete" || task.readRecord(evidence.ref) !== raw
            || task.readRecord(factRef) !== factRaw) throw new Error("deferred_original_changed_or_passed");
        originals.push(Object.freeze({ fact_ref: factRef, fact_sha256: digest(factRaw), stage: fact.stage,
          original_snapshot_tree: fact.snapshot_tree, original_material_revision: fact.material_revision,
          acceptance_ref: evidence.ref, acceptance_sha256: evidence.sha256,
          result: acceptance.result, fact_status: fact.status, quality_status: qualityStatus }));
      }
    }
    if (!originals.length) throw new Error("missing_canonical_deferred_original");
    return Object.freeze({ status: "observed", rule: "canonical_deferred_compatibility",
      originals: Object.freeze(originals), sample_count: originals.length,
      business_effect_status: "unknown", limitation: "Published canonical originals only; no original 123-member baseline claim" });
  } catch (error) {
    return Object.freeze({ status: "unknown", rule: "canonical_deferred_compatibility", reason: error.message });
  }
}

function currentCaseDiagnostics(entries, cases, task, root, receipt, current, catalog, selection, manifest,
  reports, materialRevision, consumption, capture) {
  const changeObservation = cases.some((item) => item.id === "CARD04-AUTHENTICATED-TASK-CHANGE-SCOPE")
    ? independentGitChangeObservation(task, root, receipt, current, catalog, selection, manifest) : null;
  return Object.freeze(entries.map((entry) => {
    const item = cases.find((item) => item.id === entry.case_id);
    const binding = readCurrentEffect(task, item, entry.acceptance_criterion_id, materialRevision,
      current.snapshot_tree, { receipt_ref: capture.receipt_ref, receipt_hash: capture.receipt_hash }, root,
      consumption?.byAc.get(entry.acceptance_criterion_id) ?? null, true);
    const qualityBinding = typeof binding === "object" ? binding : Object.freeze({
      status: ["missing_current_business_effect", "independent_effect_reader_unavailable"].includes(binding) ? "unknown" : "mismatch",
      reason: binding });
    const ruleObservation = item.id === "CARD04-AUTHENTICATED-TASK-CHANGE-SCOPE" ? changeObservation
      : item.id === "CARD04-INDEPENDENT-TEST-INVENTORY" ? independentInventoryObservation(root, item, reports, manifest)
        : item.id === "CARD04-DECISION-LOG-CENSUS" ? independentCensusObservation(root, item)
          : item.id === "CARD04-ACCEPTANCE-MACHINE-CLASSES" ? independentMachineClassObservation(item, receipt, capture, manifest)
            : item.id === "CARD04-DEFERRED-ACCEPTANCE-REGRESSION" ? independentDeferredObservation(task, receipt)
              : Object.freeze({ status: "unknown", reason: "no_additional_independent_rule_observation" });
    return Object.freeze({ ...entry, source_identity_status: "verified", rule_observation: ruleObservation,
      quality_fact_binding: qualityBinding, business_effect_status: "unknown" });
  }));
}

/** Read an outer fixed-command receipt and every selected per-case raw report. */
export function reconcileCurrentTaskCases({ task, workspace, capture, oracleEvidence = [], consumptionEvidence } = {}) {
  let safeTask;
  try { safeTask = assertTaskHandle(task); }
  catch { return reject("task_workspace_mismatch"); }
  try { if (!taskWorkspaceMatches({ task: safeTask, workspace })) return reject("task_workspace_mismatch"); }
  catch { return reject("task_workspace_mismatch"); }
  const taskId = safeTask.identity.taskId;
  const root = workspace.worktreeRoot;
  const current = capturePreExecutionTaskChangeScope({ task: safeTask, workspace });
  if (current.status !== "recorded") return reject("unknown_change_scope");
  if (capture?.snapshot_tree !== current.snapshot_tree || capture?.source_digest !== current.source_digest) {
    return reject("snapshot_mismatch");
  }
  const materialRevision = createTaskKernel(safeTask, { workspace }).currentVNextMaterialRevision();
  if (capture?.targeted_capture?.material_revision !== materialRevision) return reject("material_revision_mismatch");
  let catalog, registry, selection;
  try {
    catalog = currentCatalog(safeTask, root);
    registry = readCurrentTestAssetRegistry({ task: safeTask, workspace });
    selection = selectAffectedCases({ changeScope: current, catalog: catalog.catalog,
      registry: { ...registry, task_id: taskId, snapshot_tree: current.snapshot_tree,
        source_digest: current.source_digest } });
  } catch { return reject("catalog_case_mismatch"); }
  const partial = selection.status === "unavailable" && selection.reason === "unmapped_changed_path"
    && selection.cases.length > 0 && selection.unmapped_changed_paths?.length > 0;
  if ((selection.status !== "selected" && !partial)
      || !Array.isArray(selection.cases) || selection.cases.length === 0
      || JSON.stringify(capture?.targeted_capture?.selected_case_ids) !== JSON.stringify(selection.cases.map((item) => item.id))) {
    return reject("catalog_case_mismatch");
  }
  if (capture.targeted_capture.status !== (partial ? "unavailable" : "executed")
      || (partial && (capture.targeted_capture.reason !== "unmapped_changed_path"
        || JSON.stringify(capture.targeted_capture.unmapped_changed_paths)
          !== JSON.stringify(selection.unmapped_changed_paths)))
      || (capture.targeted_capture.scope_summary !== undefined
        && JSON.stringify(capture.targeted_capture.scope_summary) !== JSON.stringify(selection.scope_summary))) {
    return reject("catalog_case_mismatch");
  }
  let acceptedAcIds;
  try {
    acceptedAcIds = new Set(activeAcceptanceCriterionIds(
      worktreeBytes(root, `specs/${taskId}/spec.md`).toString("utf8")));
  } catch { return reject("catalog_case_mismatch"); }
  if (acceptedAcIds.size === 0 || selection.cases.some((item) => !Array.isArray(item.ac_ids)
      || item.ac_ids.length === 0 || new Set(item.ac_ids).size !== item.ac_ids.length
      || item.ac_ids.some((ac) => !nonempty(ac) || !acceptedAcIds.has(ac)))) {
    return reject("catalog_case_mismatch");
  }
  let receipt, output, pointer, manifest;
  try {
    const receiptRaw = safeTask.readRecord(capture.receipt_ref);
    if (digest(receiptRaw) !== capture.receipt_hash) throw new Error("outer receipt hash mismatch");
    receipt = validateCanonicalTestReceipt(JSON.parse(receiptRaw), { taskId, stage: "build-code",
      snapshotTree: current.snapshot_tree, currentSnapshot: phaseSnapshot(root, taskId, current.snapshot_tree, selection.cases[0]?.phase_ids?.[0]), expectedProducerComponent: "build-code-test-capture",
      expectedCommand: FIXED_TARGETED_CAPTURE_COMMAND, requirePassed: true });
    if (receipt.output_ref !== capture.output_ref || receipt.output_hash !== capture.output_hash
        || receipt.source_digest !== current.source_digest || receipt.snapshot_commit !== current.snapshot_commit
        || receipt.behavior_fingerprint?.run_id !== capture.behavior_fingerprint?.run_id
        || receipt.behavior_fingerprint?.task_id !== taskId
        || receipt.behavior_fingerprint?.snapshot_tree !== current.snapshot_tree
        || receipt.behavior_fingerprint?.source_digest !== current.source_digest
        || receipt.behavior_fingerprint?.material_revision !== materialRevision
        || receipt.behavior_fingerprint?.catalog_sha256 !== catalog.sha256
        || receipt.behavior_fingerprint?.catalog_revision !== catalog.catalog.revision
        || receipt.behavior_fingerprint?.registry_sha256 !== registry.registry_sha256
        || receipt.behavior_fingerprint?.registry_revision !== registry.revision) {
      throw new Error("outer receipt source or run binding mismatch");
    }
    output = safeTask.readRecord(receipt.output_ref);
    if (digest(output) !== receipt.output_hash) throw new Error("outer output hash mismatch");
    pointer = JSON.parse(output.trim());
    const manifestRaw = boundTaskRecord(safeTask, pointer.manifest_ref, pointer.manifest_hash, "manifest");
    manifest = JSON.parse(manifestRaw);
  } catch { return reject("invalid_test_receipt"); }
  if (pointer.schema_version !== "workflowhub-targeted-capture-pointer.v1"
      || pointer.task_id !== taskId || pointer.snapshot_tree !== current.snapshot_tree
      || pointer.material_revision !== materialRevision
      || pointer.run_id !== capture.targeted_capture.run_id
      || pointer.manifest_ref !== capture.targeted_capture.manifest_ref
      || pointer.manifest_hash !== capture.targeted_capture.manifest_hash
      || manifest.schema_version !== "workflowhub-targeted-capture.v1"
      || manifest.run_id !== pointer.run_id || manifest.task_id !== taskId
      || manifest.project !== safeTask.identity.projectName
      || manifest.snapshot_tree !== current.snapshot_tree || manifest.source_digest !== current.source_digest
      || manifest.material_revision !== materialRevision
      || manifest.catalog_ref !== "docs/quality/business-case-catalog.json"
      || manifest.catalog_sha256 !== catalog.sha256 || manifest.catalog_revision !== catalog.catalog.revision
      || manifest.registry_ref !== registry.registry_ref
      || manifest.registry_sha256 !== registry.registry_sha256 || manifest.registry_revision !== registry.revision
      || manifest.selection_status !== selection.status || manifest.test_execution_status !== "observed_noncanonical"
      || (manifest.scope_summary !== undefined
        && JSON.stringify(manifest.scope_summary) !== JSON.stringify(selection.scope_summary))
      || manifest.business_effect_status !== "unknown" || capture.targeted_capture.business_effect_status !== "unknown"
      || JSON.stringify(manifest.selected_case_ids) !== JSON.stringify(selection.cases.map((item) => item.id))
      || !Array.isArray(manifest.reports) || manifest.reports.length !== selection.cases.length
      || JSON.stringify(manifest.reports) !== JSON.stringify(capture.targeted_capture.reports)
      || JSON.stringify(pointer.reports) !== JSON.stringify(manifest.reports.map(
        ({ case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids }) =>
          ({ case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids })))) {
    return reject("invalid_targeted_manifest");
  }
  const entries = [], raws = [], targetReports = new Set(), reportReadbacks = new Map();
  let actualReportLeafTotal = 0;
  for (const [index, item] of selection.cases.entries()) {
    const report = manifest.reports[index];
    if (report.case_id !== item.id || report.target !== item.execution.target
        || targetReports.has(report.target)
        || report.exit_code !== 0 || !Array.isArray(report.argv)
        || !report.argv.includes(item.execution.target) || !report.argv.includes("--reporter=json")) {
      return reject("target_report_identity_mismatch");
    }
    targetReports.add(report.target);
    let record, raw;
    try {
      record = JSON.parse(boundTaskRecord(safeTask, report.record_ref, report.record_hash, "case"));
      raw = boundTaskRecord(safeTask, report.raw_ref, report.raw_sha256, "raw");
    } catch { return reject("missing_target_report"); }
    let ids;
    try { ids = parseVitestLeaves(raw, item.execution.target, root); }
    catch { return reject("target_report_identity_mismatch"); }
    if (record.schema_version !== "workflowhub-targeted-case-execution.v1"
        || record.run_id !== pointer.run_id || record.task_id !== taskId
        || record.snapshot_tree !== current.snapshot_tree || record.material_revision !== materialRevision
        || record.case_id !== item.id || record.target !== item.execution.target
        || record.raw_output_ref !== report.raw_ref || record.raw_output_sha256 !== report.raw_sha256
        || record.exit_code !== 0 || record.canonical_receipt !== false || report.canonical_receipt !== false
        || report.test_count !== ids.length
        || JSON.stringify(record.argv) !== JSON.stringify(report.argv)
        || JSON.stringify(record.registered_test_ids) !== JSON.stringify(item.execution.registered_test_ids)
        || JSON.stringify(ids) !== JSON.stringify(item.execution.registered_test_ids)
        || JSON.stringify(report.full_ids) !== JSON.stringify(ids)
        || !Array.isArray(record.observations) || record.observations.length !== ids.length
        || JSON.stringify(record.observations) !== JSON.stringify(manifest.observations.filter((row) => row.case_id === item.id))
        || record.observations.some((row) => row.case_id !== item.id || row.test_file !== item.execution.target
          || row.status !== "passed" || row.exit_code !== 0 || row.raw_report_sha256 !== report.raw_sha256)
        || JSON.stringify(record.observations.map((row) => row.full_id)) !== JSON.stringify(ids)) {
      return reject("target_report_identity_mismatch");
    }
    reportReadbacks.set(item.id, { report, ids });
    raws.push(raw);
    actualReportLeafTotal += ids.length;
    for (const ac of item.ac_ids ?? []) entries.push(Object.freeze({ case_id: item.id,
      acceptance_criterion_id: ac, status: "readback", leaf_count: ids.length,
      full_ids: Object.freeze(ids), report_ref: report.raw_ref, report_sha256: report.raw_sha256,
      receipt_ref: capture.receipt_ref, snapshot_tree: current.snapshot_tree,
      material_revision: materialRevision, rule_revision: item.rule.revision }));
  }
  try {
    const combined = boundTaskRecord(safeTask, manifest.execution.raw_output_ref,
      manifest.execution.raw_output_sha256, "raw");
    if (combined !== raws.join("\n") || manifest.execution.exit_code !== 0
        || manifest.execution.test_count !== actualReportLeafTotal) {
      return reject("target_report_identity_mismatch");
    }
  } catch { return reject("missing_target_report"); }
  if (entries.length === 0) return reject("catalog_case_mismatch");
  const selectedAcIds = new Set(entries.map((entry) => entry.acceptance_criterion_id));
  const consumption = consumptionEvidence === undefined ? null : authenticateP10RunConsumption({
    task: safeTask, locator: consumptionEvidence, taskId,
    snapshotTree: current.snapshot_tree, materialRevision,
    sourceDigest: current.source_digest, capture, receipt, acceptedAcIds: selectedAcIds });
  if (consumptionEvidence !== undefined && consumption === null) return Object.freeze({
    status: "unavailable", reason: "current_execution_unverified", execution_freshness: "unknown",
    business_effect_status: "unknown", business_effect_reason: "invalid_run_consumption_source",
    task_id: taskId, receipt_ref: capture.receipt_ref, manifest_ref: pointer.manifest_ref,
    entries: Object.freeze(entries) });
  const diagnostics = () => currentCaseDiagnostics(entries, selection.cases, safeTask, root, receipt,
    current, catalog.catalog, selection, manifest, reportReadbacks, materialRevision, consumption, capture);
  if (partial) return Object.freeze({ status: "unavailable", reason: "unmapped_changed_path",
    execution_freshness: "unknown", business_effect_status: "unknown", task_id: taskId,
    receipt_ref: capture.receipt_ref, manifest_ref: pointer.manifest_ref,
    selected_case_ids: Object.freeze(selection.cases.map((item) => item.id)),
    unmapped_changed_paths: selection.unmapped_changed_paths,
    ...(consumption === null ? {} : { run_consumption_status: "verified" }),
    entries: diagnostics() });
  let reason = "missing_current_business_effect";
  let chainCount = 0;
  let censusSelected = false;
  let sourceStructureValid = false;
  const chainKeys = new Set();
  let invalidConsumptionFact = false;
  for (const item of selection.cases) {
    if (item.id === "CARD04-DECISION-LOG-CENSUS") censusSelected = true;
    if (consumption === null && item.effect_observation?.producer_status === "not_implemented") {
      reason = "producer_unavailable";
      break;
    }
    for (const ac of item.ac_ids) {
      const outcome = readCurrentEffect(safeTask, item, ac, materialRevision, current.snapshot_tree,
        { receipt_ref: capture.receipt_ref, receipt_hash: capture.receipt_hash }, root,
        consumption?.byAc.get(ac) ?? null);
      if (consumption !== null && ["missing_current_business_effect", "invalid_business_effect_binding",
        "current_effect_receipt_mismatch", "conflicting_current_business_effect"].includes(outcome)) {
        invalidConsumptionFact = true;
      }
      if (outcome === "evidence_chain_present") {
        chainCount += 1;
        chainKeys.add(`${item.id}\u0000${ac}`);
        if (item.id === "CARD04-DECISION-LOG-CENSUS") sourceStructureValid = true;
      } else if (outcome === "external_original_unavailable") {
        sourceStructureValid = true;
        reason = outcome;
      } else if (outcome !== "missing_current_business_effect") reason = outcome;
    }
    if (consumption !== null && item.effect_observation?.producer_status === "not_implemented") {
      reason = "producer_unavailable";
    }
  }
  if (invalidConsumptionFact) return Object.freeze({ status: "unavailable",
    reason: "current_execution_unverified", execution_freshness: "unknown",
    business_effect_status: "unknown", business_effect_reason: reason,
    task_id: taskId, receipt_ref: capture.receipt_ref, manifest_ref: pointer.manifest_ref,
    run_consumption_status: "verified", entries: diagnostics() });
  if (chainCount === entries.length) reason = consumption === null
    ? "missing_official_stage_binding" : "independent_business_effect_unverified";
  return Object.freeze({ status: "unavailable",
    reason: consumption === null ? "current_execution_unverified" : "business_effect_unverified",
    execution_freshness: "unknown", business_effect_status: "unknown",
    ...(consumption === null ? {} : { run_consumption_status: "verified" }),
    evidence_chain_present: chainCount === entries.length,
    ...(censusSelected ? { source_structure_valid: sourceStructureValid } : {}),
    business_effect_reason: reason, task_id: taskId,
    receipt_ref: capture.receipt_ref, manifest_ref: pointer.manifest_ref,
    entries: Object.freeze(diagnostics().map((entry) => Object.freeze({ ...entry,
      ...(chainKeys.has(`${entry.case_id}\u0000${entry.acceptance_criterion_id}`)
        ? { evidence_chain_present: true } : {}) }))) });
}
