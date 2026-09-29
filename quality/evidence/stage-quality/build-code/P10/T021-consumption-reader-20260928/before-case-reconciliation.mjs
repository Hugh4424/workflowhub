import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { validateCanonicalTestReceipt } from "../../runtime/evidence/canonical-evidence-validators.mjs";
import { validateAcceptanceEvidence } from "../../runtime/evidence/acceptance-evidence-validator.mjs";
import { authenticateQualityFactRecord } from "../../runtime/evidence/freshness.mjs";
import { assertTaskHandle, createTaskKernel } from "../../runtime/task/task-handle.mjs";
import { activeAcceptanceCriterionIds } from "../../runtime/stage/stage-content-contracts.mjs";
import { FIXED_TARGETED_CAPTURE_COMMAND } from "./capture.mjs";
import { capturePreExecutionTaskChangeScope, taskWorkspaceMatches } from "./change-scope.mjs";
import { readCurrentTestAssetRegistry } from "./test-asset-inventory.mjs";
import { selectAffectedCases } from "./case-selection.mjs";

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

function currentCatalog(task, workspaceRoot) {
  const raw = worktreeBytes(workspaceRoot, "docs/quality/business-case-catalog.json");
  const catalog = JSON.parse(raw);
  if (catalog.schema !== "workflowhub-business-case-catalog.v1"
      || catalog.project !== task.identity.projectName
      || !nonempty(catalog.revision) || !Array.isArray(catalog.cases)) {
    throw new Error("current business catalog identity is invalid");
  }
  for (const entry of catalog.cases) {
    const phase = entry.phase_ids?.[0];
    const rulePath = entry.rule?.path ?? `specs/${task.identity.taskId}/phases/${phase}.md`;
    if (!nonempty(entry.id) || !/^P[1-9][0-9]*$/.test(phase ?? "")
        || entry.source?.revision !== `sha256:${digest(worktreeBytes(workspaceRoot, entry.source.path))}`
        || entry.rule?.revision !== `sha256:${digest(worktreeBytes(workspaceRoot, rulePath))}`
        || entry.effect_observation?.rule_revision !== entry.rule.revision) {
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
  return Object.freeze({ source_structure_valid: true, external_original_unavailable: externalOriginalUnavailable });
}

function readCurrentEffect(task, item, ac, materialRevision, snapshotTree, receipt, workspaceRoot) {
  if (item.effect_observation?.canonical_source?.subject !== ac) return "invalid_business_effect_binding";
  let candidates;
  try {
    candidates = task.listCanonicalQualityFactRefs().flatMap((ref) => {
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
    if (!Array.isArray(bound) || bound.length === 0 || bound.some((entry) => {
      if (typeof entry?.ref !== "string" || !SHA256.test(entry.sha256 ?? "")) return true;
      try { return digest(task.readRecord(entry.ref)) !== entry.sha256; }
      catch { return true; }
    }) || bound.filter((entry) => entry.ref === receipt.receipt_ref).length !== 1
        || !bound.some((entry) => entry.ref === receipt.receipt_ref && entry.sha256 === receipt.receipt_hash)) {
      return "current_effect_receipt_mismatch";
    }
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

/** Read an outer fixed-command receipt and every selected per-case raw report. */
export function reconcileCurrentTaskCases({ task, workspace, capture, oracleEvidence = [] } = {}) {
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
          !== JSON.stringify(selection.unmapped_changed_paths)))) return reject("catalog_case_mismatch");
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
      snapshotTree: current.snapshot_tree, expectedProducerComponent: "build-code-test-capture",
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
      || manifest.business_effect_status !== "unknown" || capture.targeted_capture.business_effect_status !== "unknown"
      || JSON.stringify(manifest.selected_case_ids) !== JSON.stringify(selection.cases.map((item) => item.id))
      || !Array.isArray(manifest.reports) || manifest.reports.length !== selection.cases.length
      || JSON.stringify(manifest.reports) !== JSON.stringify(capture.targeted_capture.reports)
      || JSON.stringify(pointer.reports) !== JSON.stringify(manifest.reports.map(
        ({ case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids }) =>
          ({ case_id, target, record_ref, record_hash, raw_ref, raw_sha256, argv, exit_code, full_ids })))) {
    return reject("invalid_targeted_manifest");
  }
  const entries = [], raws = [], targetReports = new Set();
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
  if (partial) return Object.freeze({ status: "unavailable", reason: "unmapped_changed_path",
    execution_freshness: "unknown", business_effect_status: "unknown", task_id: taskId,
    receipt_ref: capture.receipt_ref, manifest_ref: pointer.manifest_ref,
    selected_case_ids: Object.freeze(selection.cases.map((item) => item.id)),
    unmapped_changed_paths: selection.unmapped_changed_paths,
    entries: Object.freeze(entries) });
  let reason = "missing_current_business_effect";
  let chainCount = 0;
  let censusSelected = false;
  let sourceStructureValid = false;
  const chainKeys = new Set();
  for (const item of selection.cases) {
    if (item.id === "CARD04-DECISION-LOG-CENSUS") censusSelected = true;
    if (item.effect_observation?.producer_status === "not_implemented") {
      reason = "producer_unavailable";
      break;
    }
    for (const ac of item.ac_ids) {
      const outcome = readCurrentEffect(safeTask, item, ac, materialRevision, current.snapshot_tree,
        { receipt_ref: capture.receipt_ref, receipt_hash: capture.receipt_hash }, root);
      if (outcome === "evidence_chain_present") {
        chainCount += 1;
        chainKeys.add(`${item.id}\u0000${ac}`);
        if (item.id === "CARD04-DECISION-LOG-CENSUS") sourceStructureValid = true;
      } else if (outcome === "external_original_unavailable") {
        sourceStructureValid = true;
        reason = outcome;
      } else if (outcome !== "missing_current_business_effect") reason = outcome;
    }
  }
  if (chainCount === entries.length) reason = "missing_official_stage_binding";
  return Object.freeze({ status: "unavailable", reason: "current_execution_unverified",
    execution_freshness: "unknown", business_effect_status: "unknown",
    evidence_chain_present: chainCount === entries.length,
    ...(censusSelected ? { source_structure_valid: sourceStructureValid } : {}),
    business_effect_reason: reason, task_id: taskId,
    receipt_ref: capture.receipt_ref, manifest_ref: pointer.manifest_ref,
    entries: Object.freeze(entries.map((entry) => Object.freeze({ ...entry,
      ...(chainKeys.has(`${entry.case_id}\u0000${entry.acceptance_criterion_id}`)
        ? { evidence_chain_present: true } : {}) }))) });
}
