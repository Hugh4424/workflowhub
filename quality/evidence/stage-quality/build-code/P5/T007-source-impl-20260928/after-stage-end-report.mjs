import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const SCHEMA = "stage-end-report-facts.v1";
const MACHINE_STATUSES = new Set(["missing", "inconsistent", "incomplete", "failed", "unavailable"]);
const VERDICT_STATUS = Object.freeze({ material_incomplete: "incomplete", inconsistent: "inconsistent", unavailable: "unavailable", skipped: "unavailable" });
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hasText = (value) => typeof value === "string" && value.trim() !== "";
const pointer = (name, index) => `input.${name}${index === undefined ? "" : `[${index}]`}`;
const gap = (item, status, reason, source) => ({ item, status, reason, source });
const disclosure = (reason, source) => ({ reason, source });
function declaration(value, source) {
  if (hasText(value)) return disclosure(value, source);
  if (!isObject(value)) return disclosure("人工声明未说明", source);
  if (value.status !== undefined && (!hasText(value.status) || MACHINE_STATUSES.has(value.status))) {
    throw new TypeError("human declaration cannot contain a machine status");
  }
  return {
    reason: hasText(value.reason) ? value.reason : "人工声明未说明",
    source: hasText(value.source_path) ? value.source_path : source,
    ...(value.status === undefined ? {} : { status: value.status }),
  };
}
function humanExceptionDeclaration(value, index, sourceField = "source_path", label = "human exception declaration") {
  const fields = ["declared_by", "reason", "scope", "expires_at_phase", "owner", sourceField];
  for (const field of fields) {
    if (!isObject(value) || !hasText(value[field])) {
      throw new TypeError(`${label}[${index}] requires ${field === "source" ? "source_path" : field}`);
    }
  }
  const phase = /^P([1-9][0-9]*)$/.exec(value.expires_at_phase);
  if (!phase || !Number.isSafeInteger(Number(phase[1])) || Number(phase[1]) < 5) {
    throw new TypeError(`${label}[${index}] has invalid expires_at_phase`);
  }
  if (value.verbatim !== undefined && !hasText(value.verbatim)) {
    throw new TypeError(`${label}[${index}] has invalid verbatim`);
  }
  if (value.status !== undefined && (!hasText(value.status) || MACHINE_STATUSES.has(value.status))) {
    throw new TypeError(`${label}[${index}] cannot contain a machine status`);
  }
  return {
    declared_by: value.declared_by,
    reason: value.reason,
    scope: value.scope,
    expires_at_phase: value.expires_at_phase,
    owner: value.owner,
    source: value[sourceField],
    ...(value.verbatim === undefined ? {} : { verbatim: value.verbatim }),
    ...(value.status === undefined ? {} : { status: value.status }),
  };
}

/** Transform supplied facts. Caller-owned inputs and paths are not authenticated here. */
export function buildStageEndReportFacts(input = {}) {
  if (!isObject(input)) throw new TypeError("stage report input must be an object");
  const { chainRows = [], stageResult = {}, evidenceIndex = [], declared = {}, stageResultPath } = input;
  if (!Array.isArray(chainRows) || !isObject(stageResult) || !Array.isArray(evidenceIndex) || !isObject(declared)) {
    throw new TypeError("stage report inputs require chainRows[], stageResult{}, evidenceIndex[], declared{}");
  }
  const stageSource = hasText(stageResultPath) ? stageResultPath : pointer("stageResult");
  const not_done = [];
  const coverage_limits = [];
  const sources = [];
  const addSource = (path, kind) => {
    if (hasText(path) && !sources.some((entry) => entry.path === path)) sources.push({ path, kind });
  };
  addSource(stageSource, hasText(stageResultPath) ? "stage_result" : "unbound_input");
  // A readable file and an exit-0 command are execution candidates only.
  // T007 has no authenticated T008 producer or canonical receipt reader that
  // binds caller data to this task, stage, snapshot, and output bytes.
  not_done.push(gap("source_binding", "unavailable",
    "阶段结果及逐命令事实由调用者提供；未核对 Task、stage、snapshot 与 canonical receipt/output hash，exit 0 或文件存在不能认证执行",
    stageSource));
  coverage_limits.push(disclosure(
    "来源绑定不可用：stageResult/commands 仅为未认证候选；缺少可信生产者和 canonical receipt 逐条绑定",
    stageSource));
  if (!Object.hasOwn(input, "chainRows")) {
    not_done.push(gap("chain_rows", "missing", "缺少运行期 acceptanceChain 输入；不能推断逐 AC 完成", pointer("chainRows")));
  } else if (chainRows.length === 0) {
    not_done.push(gap("chain_rows", "incomplete", "显式提供的 acceptanceChain 为空；不能据此认定无 AC 缺口", pointer("chainRows")));
  }
  if (!Object.hasOwn(input, "stageResult")) {
    not_done.push(gap("stage_result", "missing", "缺少阶段结果输入；不能推断阶段执行或质量完成", stageSource));
  }

  // The vNext result separates readiness, stage completion, and quality.
  // A ready worktree or passing quality projection cannot erase incomplete
  // completion or named missing materials.
  if (hasText(stageResult.status) && stageResult.status !== "completed") {
    const status = MACHINE_STATUSES.has(stageResult.status) ? stageResult.status : "incomplete";
    not_done.push(gap("stage_status", status, `阶段状态为 ${stageResult.status}；不能按完成报告`, `${stageSource}#status`));
  }
  for (const [index, item] of (Array.isArray(stageResult.completion?.missing) ? stageResult.completion.missing : []).entries()) {
    const name = hasText(item) ? item : `completion.missing[${index}]`;
    const predicates = stageResult.completion?.predicates;
    const conflict = hasText(item) && isObject(predicates) && Object.hasOwn(predicates, item)
      && predicates[item]?.status === "conflict";
    not_done.push(gap(name, conflict ? "inconsistent" : "missing",
      conflict ? `阶段完成条件事实冲突：${name}` : `阶段完成条件仍缺：${name}`,
      conflict ? `${stageSource}#completion.predicates.${item}.status` : `${stageSource}#completion.missing[${index}]`));
  }
  if (hasText(stageResult.work_status) && stageResult.work_status !== "ready" && stageResult.work_status !== "completed") {
    const status = stageResult.work_status === "blocked_by_missing_material" ? "missing" : "incomplete";
    not_done.push(gap("work_status", status, `当前工作状态为 ${stageResult.work_status}`, `${stageSource}#work_status`));
  }
  for (const [index, item] of (Array.isArray(stageResult.readiness?.missing_materials) ? stageResult.readiness.missing_materials : []).entries()) {
    const name = hasText(item) ? item : `readiness.missing_materials[${index}]`;
    not_done.push(gap(name, "missing", `当前材料缺失：${name}`, `${stageSource}#readiness.missing_materials[${index}]`));
  }

  for (const [index, item] of (Array.isArray(stageResult.quality_missing) ? stageResult.quality_missing : []).entries()) {
    const name = hasText(item) ? item : `quality_missing[${index}]`;
    not_done.push(gap(name, "missing", `阶段结果列出未满足项：${name}`, `${stageSource}#quality_missing[${index}]`));
  }
  // Current stage-runtime-result.vnext has missing_items and quality_warnings,
  // not the older quality_missing/commands fixture fields. Preserve every
  // distinct diagnostic instead of reporting an empty success-looking list.
  const seenDiagnostics = new Set();
  for (const field of ["missing_items", "quality_warnings"]) {
    for (const [index, item] of (Array.isArray(stageResult[field]) ? stageResult[field] : []).entries()) {
      if (!hasText(item) || seenDiagnostics.has(item)) continue;
      seenDiagnostics.add(item);
      const status = /(?:^|:)unavailable(?:$|\b)/.test(item) ? "unavailable"
        : /(?:^|:)failed(?:$|\b)/.test(item) ? "failed" : "incomplete";
      not_done.push(gap(`${field}[${index}]`, status, item, `${stageSource}#${field}[${index}]`));
    }
  }
  if (hasText(stageResult.quality_status) && stageResult.quality_status !== "passed" && stageResult.quality_status !== "complete") {
    const status = MACHINE_STATUSES.has(stageResult.quality_status) ? stageResult.quality_status : "incomplete";
    not_done.push(gap("stage_quality", status, `阶段质量状态为 ${stageResult.quality_status}`, `${stageSource}#quality_status`));
  }
  if (hasText(stageResult.execution_outcome)
      && !new Set(["ok", "completed", "passed"]).has(stageResult.execution_outcome)) {
    not_done.push(gap("execution_outcome", "incomplete", `阶段执行结果为 ${stageResult.execution_outcome}；不能按完成报告`, `${stageSource}#execution_outcome`));
  }

  for (const [index, row] of chainRows.entries()) {
    if (!isObject(row)) throw new TypeError(`chainRows[${index}] must be an object`);
    const ac = hasText(row.acceptance_criterion_id) ? row.acceptance_criterion_id : `AC[${index}]`;
    const source = hasText(row.source_path) ? row.source_path : pointer("chainRows", index);
    addSource(source, "acceptance_row");
    if (!hasText(row.source_path)) coverage_limits.push(disclosure(`AC ${ac} 行只有调用者输入位置，缺独立来源路径`, source));
    const evidenceCandidates = Array.isArray(row.evidence_refs)
      ? row.evidence_refs.filter((ref) => isObject(ref) && hasText(ref.ref) && /^[a-f0-9]{64}$/.test(ref.hash))
      : [];
    if (evidenceCandidates.length === 0) {
      not_done.push(gap(ac, "incomplete", "逐 AC 证据引用缺有效 ref/hash 候选；不能认定验收完成", source));
    }
    for (const ref of evidenceCandidates) addSource(ref.ref, "acceptance_evidence_candidate");
    const rowLimits = Array.isArray(row.coverage_limits) ? row.coverage_limits
      : hasText(row.coverage_limits) ? [row.coverage_limits.trim()] : [];
    if (rowLimits.length === 0) {
      not_done.push(gap(ac, "inconsistent", "该 AC 无覆盖限制披露；空数组不能证明无缺口", source));
    } else {
      for (const limit of rowLimits) {
        coverage_limits.push(declaration(limit, source));
      }
    }
  }

  const route_applicability = [];
  for (const [index, route] of (Array.isArray(declared.routes) ? declared.routes : []).entries()) {
    if (!isObject(route) || !hasText(route.ac) || typeof route.applicable !== "boolean") {
      throw new TypeError(`declared.routes[${index}] requires ac and boolean applicable`);
    }
    const source = hasText(route.source_path) ? route.source_path : pointer("declared.routes", index);
    const reason = hasText(route.reason) ? route.reason : null;
    route_applicability.push({ ac: route.ac, applicable: route.applicable, reason,
      hard_requirements: { command: true, exit: true, output: true }, source });
    if (!route.applicable && !reason) not_done.push(gap(route.ac, "incomplete", "路线不适用声明缺 reason", source));
  }
  for (const [index, row] of chainRows.entries()) {
    const ac = row.acceptance_criterion_id;
    if (!hasText(ac) || route_applicability.some((route) => route.ac === ac)) continue;
    const source = hasText(row.source_path) ? row.source_path : pointer("chainRows", index);
    route_applicability.push({ ac, applicable: null, reason: "路线适用性未声明",
      hard_requirements: { command: true, exit: true, output: true }, source });
    not_done.push(gap(ac, "incomplete", "路线适用性未声明；不能推断 N/A 或已执行", source));
  }

  const executions = [];
  for (const [index, entry] of (Array.isArray(stageResult.commands) ? stageResult.commands : []).entries()) {
    if (!isObject(entry)) throw new TypeError(`stageResult.commands[${index}] must be an object`);
    const output_ref = hasText(entry.output_ref) ? entry.output_ref : null;
    const source = output_ref ?? `${stageSource}#commands[${index}]`;
    executions.push({ command: entry.command ?? null, exit_code: entry.exit_code ?? null, output_ref, source });
    addSource(source, output_ref ? "execution_output_candidate" : "stage_result_command");
    if (!hasText(entry.command) || !Number.isInteger(entry.exit_code) || !output_ref) {
      not_done.push(gap(`execution[${index}]`, "incomplete", "命令、exit 或 output 路径缺失", source));
    } else if (entry.exit_code !== 0) {
      not_done.push(gap(`execution[${index}]`, "failed", `命令 exit=${entry.exit_code}；失败输出须保留`, source));
    }
  }
  if (!Array.isArray(stageResult.commands)) {
    not_done.push(gap("command_facts", "missing", "阶段结果缺逐命令 command/exit/output 输入", `${stageSource}#commands`));
    coverage_limits.push(disclosure("阶段结果没有逐命令 command/exit/output 行；不能从质量状态推断实跑", `${stageSource}#commands`));
  } else if (stageResult.commands.length === 0) {
    not_done.push(gap("command_facts", "incomplete", "显式命令列表为空；不能据此认定无需实跑", `${stageSource}#commands`));
  }

  for (const [index, advisory] of (Array.isArray(stageResult.quality_advisories) ? stageResult.quality_advisories : []).entries()) {
    if (typeof advisory !== "string" || !advisory.startsWith("stage-end-spec-analyze:")) continue;
    const verdict = advisory.slice("stage-end-spec-analyze:".length);
    if (verdict === "consistent" || verdict === "reported") continue;
    const status = VERDICT_STATUS[verdict] ?? "unavailable";
    // Bare fact refs and similarly named files do not bind this verdict to
    // the underlying quality bytes. Only this advisory's position is known.
    const source = `${stageSource}#quality_advisories[${index}]`;
    addSource(source, "stage_result_advisory");
    not_done.push(gap(`${stageResult.stage ?? "unknown-stage"}/stage-end-spec-analyze/${index}`, status,
      `spec-analyze 机器判决为 ${verdict}；此项仍为 advisory`, source));
    coverage_limits.push(disclosure(`spec-analyze ${verdict} 原始质量事实来源未核`, source));
  }

  for (const [index, entry] of evidenceIndex.entries()) {
    if (hasText(entry?.path)) addSource(entry.path, hasText(entry.kind) ? entry.kind : "evidence_candidate");
    else coverage_limits.push(disclosure("证据索引项缺 path，未当作来源", pointer("evidenceIndex", index)));
  }
  for (const [index, item] of (Array.isArray(declared.limits) ? declared.limits : []).entries()) {
    coverage_limits.push(declaration(item, pointer("declared.limits", index)));
  }
  if (!hasText(stageResultPath)) coverage_limits.push(disclosure("阶段结果为调用者提供的内存对象，来源身份未认证", stageSource));
  if (coverage_limits.length === 0) coverage_limits.push(disclosure("未提供覆盖限制；空数组不能证明完整覆盖", pointer("declared.limits")));

  if (declared.exceptions !== undefined && !Array.isArray(declared.exceptions)) {
    throw new TypeError("human exception declarations must be an array");
  }
  const exceptions = (declared.exceptions ?? []).map((entry, index) => humanExceptionDeclaration(entry, index));
  if (exceptions.length === 0) {
    not_done.push(gap("exceptions", "missing", "缺少带真实来源的人工例外声明；不能推断没有例外", pointer("declared.exceptions")));
  }

  return { schema_version: SCHEMA, not_done, route_applicability, executions, coverage_limits, exceptions, sources };
}

/** Render adverse facts first. Reject malformed records instead of guessing. */
export function renderStageEndReport(facts) {
  if (!isObject(facts) || facts.schema_version !== SCHEMA
      || !Array.isArray(facts.not_done) || !Array.isArray(facts.route_applicability)
      || !Array.isArray(facts.executions) || !Array.isArray(facts.coverage_limits)
      || !Array.isArray(facts.exceptions) || !Array.isArray(facts.sources)
      || facts.coverage_limits.length === 0 || facts.exceptions.length === 0) {
    throw new TypeError("invalid stage-end-report-facts.v1 record");
  }
  for (const [index, entry] of facts.not_done.entries()) {
    if (!isObject(entry) || !hasText(entry.item) || !MACHINE_STATUSES.has(entry.status)
        || !hasText(entry.reason) || !hasText(entry.source)) throw new TypeError(`not_done[${index}] is invalid`);
  }
  for (const [index, entry] of facts.route_applicability.entries()) {
    if (!isObject(entry) || !hasText(entry.ac) || ![true, false, null].includes(entry.applicable)
        || !hasText(entry.source) || (entry.applicable !== true && !hasText(entry.reason))
        || !isObject(entry.hard_requirements) || entry.hard_requirements.command !== true
        || entry.hard_requirements.exit !== true || entry.hard_requirements.output !== true) {
      throw new TypeError(`route_applicability[${index}] is invalid`);
    }
  }
  for (const [index, entry] of facts.executions.entries()) {
    if (!isObject(entry) || !hasText(entry.source)
        || (entry.command !== null && !hasText(entry.command))
        || (entry.exit_code !== null && !Number.isInteger(entry.exit_code))
        || (entry.output_ref !== null && !hasText(entry.output_ref))) {
      throw new TypeError(`executions[${index}] is invalid`);
    }
  }
  for (const [index, entry] of facts.coverage_limits.entries()) {
    if (!isObject(entry) || !hasText(entry.reason) || !hasText(entry.source)
        || (entry.status !== undefined && (!hasText(entry.status) || MACHINE_STATUSES.has(entry.status)))) {
      throw new TypeError(`coverage_limits[${index}] is invalid`);
    }
  }
  facts.exceptions.forEach((entry, index) => humanExceptionDeclaration(entry, index, "source", "exceptions"));
  for (const [index, entry] of facts.sources.entries()) {
    if (!isObject(entry) || !hasText(entry.path) || !hasText(entry.kind)) throw new TypeError(`sources[${index}] is invalid`);
  }
  // Keep each caller-supplied fact inside one literal inline field. Escaping
  // controls prevents new headings/items; HTML encoding blocks raw tags and
  // entities. A code-span fence longer than any input backtick also makes
  // Markdown links/images inert with either HTML parser setting.
  const inline = (value) => {
    const escaped = String(value).replace(/[\u0000-\u001f\u007f-\u009f\u2028-\u202e\u2066-\u2069]/g, (char) => {
      if (char === "\n") return "\\n";
      if (char === "\r") return "\\r";
      if (char === "\t") return "\\t";
      return `\\u${char.codePointAt(0).toString(16).padStart(4, "0")}`;
    }).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let longestBacktickRun = 0;
    for (const run of escaped.matchAll(/`+/g)) {
      longestBacktickRun = Math.max(longestBacktickRun, run[0].length);
    }
    const fence = "`".repeat(longestBacktickRun + 1);
    return `${fence} ${escaped} ${fence}`;
  };
  const lines = ["## 没做到"];
  lines.push(...(facts.not_done.length ? facts.not_done.map((entry) =>
    `- ${inline(entry.item)} | ${inline(entry.status)} | ${inline(entry.reason)} | 来源：${inline(entry.source)}`) : ["- 无已记录的机器失败；来源完整性仍须独立核对"]));
  lines.push("", "## 路线适用");
  lines.push(...(facts.route_applicability.length ? facts.route_applicability.map((entry) =>
    `- ${inline(entry.ac)}: ${entry.applicable === true ? "适用" : entry.applicable === false ? "N/A" : "unknown"}${entry.reason ? `；${inline(entry.reason)}` : ""}；硬要求 command/exit/output；来源：${inline(entry.source)}`) : ["- 未提供路线事实"]));
  lines.push("", "## 执行事实");
  lines.push(...(facts.executions.length ? facts.executions.map((entry) =>
    `- ${inline(entry.command ?? "<命令缺失>")} | exit=${entry.exit_code ?? "unknown"} | output=${inline(entry.output_ref ?? "missing")} | 来源：${inline(entry.source)}`) : ["- 无命令执行事实"]));
  lines.push("", "## 覆盖限制", ...facts.coverage_limits.map((entry) => `- ${entry.status ? `[${inline(entry.status)}] ` : ""}${inline(entry.reason)} | 来源：${inline(entry.source)}`));
  lines.push("", "## 人工声明", ...facts.exceptions.map((entry) =>
    `- ${entry.status ? `[${inline(entry.status)}] ` : ""}声明者：${inline(entry.declared_by)} | 理由：${inline(entry.reason)} | 范围：${inline(entry.scope)} | 到期阶段：${inline(entry.expires_at_phase)} | 负责人：${inline(entry.owner)}${entry.verbatim === undefined ? "" : ` | 原话：${inline(entry.verbatim)}`} | 来源：${inline(entry.source)}`));
  lines.push("", "## 来源", ...facts.sources.map((entry) => `- ${inline(entry.path)} (${inline(entry.kind)})`));
  return `${lines.join("\n")}\n`;
}

/** Read a real stage-result file and only its referenced output files. */
export async function collectStageEndReportFacts({ stageResultPath, evidenceDir } = {}) {
  if (!hasText(stageResultPath) || !hasText(evidenceDir)) throw new TypeError("stageResultPath and evidenceDir are required");
  let stageResult;
  try { stageResult = JSON.parse(readFileSync(stageResultPath, "utf8")); }
  catch (error) {
    if (error?.code !== "ENOENT") throw error;
    return buildStageEndReportFacts({ stageResultPath });
  }
  if (!isObject(stageResult)) throw new TypeError("stage result JSON must be an object");
  const evidenceIndex = [];
  const missing = [];
  const evidenceRoot = existsSync(evidenceDir) && lstatSync(evidenceDir).isDirectory() ? realpathSync(evidenceDir) : null;
  for (const [index, command] of (Array.isArray(stageResult.commands) ? stageResult.commands : []).entries()) {
    if (!hasText(command?.output_ref)) continue;
    const candidate = isAbsolute(command.output_ref) ? command.output_ref : resolve(dirname(stageResultPath), command.output_ref);
    const regularFile = existsSync(candidate) && lstatSync(candidate).isFile();
    const actual = regularFile ? realpathSync(candidate) : null;
    const rel = evidenceRoot === null || actual === null ? null : relative(evidenceRoot, actual);
    const within = rel !== null && rel !== "" && rel !== ".." && !rel.startsWith("../") && !isAbsolute(rel);
    if (within) {
      evidenceIndex.push({ path: actual, kind: "execution_output" });
    } else {
      missing.push(gap(`execution[${index}]`, "missing", "输出文件缺失或不在指定证据目录内", command.output_ref));
    }
  }
  const facts = buildStageEndReportFacts({ stageResult, stageResultPath, evidenceIndex });
  facts.not_done.push(...missing);
  if (!evidenceRoot) facts.coverage_limits.push(disclosure("证据目录不存在；命令输出未认证", evidenceDir));
  return facts;
}
