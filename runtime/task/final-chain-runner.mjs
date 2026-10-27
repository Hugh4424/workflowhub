import { FORMAL_DEVELOPMENT_STAGES, WORKFLOW_STAGES } from "../stage/stage-registry.mjs";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { redactProviderHostPaths } from "../review/provider-material-projection.mjs";
import { loadPortableWorkflowManifest, stateForStepResults, validateStepResults } from "./portable-workflow-run.mjs";
import { RINGS, resolveLevel, evaluateRing, summarize, evaluateWorkflowSteps, summarizeWorkflow } from "./final-chain.mjs";

const text = value => typeof value === "string" && value.trim() !== "";
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const hash = raw => createHash("sha256").update(raw).digest("hex");
const inside = (root, path) => { const rel = relative(root, path); return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };
const section = (raw, title) => raw.match(new RegExp(`^#{2,3} ${title}[^\\n]*\\n([\\s\\S]*?)(?=^#{1,3} |$(?![\\s\\S]))`, "m"))?.[1] ?? "";
const cells = line => line.trim().split("|").slice(1, -1).map(value => value.trim().replace(/^`|`$/g, ""));
const plainRef = value => value?.trim().replace(/^<|>$/g, "").replace(/^`|`$/g, "").split("#")[0];

// Private read boundary for both authentic task storage and caller-controlled test roots.
// It does not create a task capability or relax the existing task writer's layout.
function readOriginal(root, ref) {
  if (typeof ref !== "string" || !ref || ref.includes("\\") || ref.split("/").includes("..")) throw Error(`unsafe original ref: ${ref}`);
  const base = resolve(root), path = isAbsolute(ref) ? resolve(ref) : resolve(base, ref);
  if (path === base || !inside(base, path)) throw Error(`original escapes allowed root: ${ref}`);
  let cursor = sep;
  const ancestry = [];
  for (const part of path.split(sep).filter(Boolean)) {
    cursor = join(cursor, part);
    const st = lstatSync(cursor);
    if (st.isSymbolicLink() || realpathSync(cursor) !== cursor) throw Error(`original path alias: ${ref}`);
    ancestry.push({path:cursor,dev:st.dev,ino:st.ino});
  }
  const named = lstatSync(path);
  if (!named.isFile() || named.nlink !== 1) throw Error(`original is not a single-link regular file: ${ref}`);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd);
    if (opened.dev !== named.dev || opened.ino !== named.ino || opened.nlink !== 1) throw Error(`original changed while opening: ${ref}`);
    const raw = readFileSync(fd, "utf8"), after = lstatSync(path);
    if (after.isSymbolicLink() || after.dev !== opened.dev || after.ino !== opened.ino || after.nlink !== 1) throw Error(`original changed during read: ${ref}`);
    for (const prior of ancestry) { const current = lstatSync(prior.path); if (current.dev !== prior.dev || current.ino !== prior.ino || current.isSymbolicLink()) throw Error(`original ancestor changed: ${ref}`); }
    return raw;
  } finally { closeSync(fd); }
}
function names(root, directory, limits) {
  try {
    const path = resolve(root, directory);
    if (!inside(resolve(root), path) || realpathSync(path) !== path || !lstatSync(path).isDirectory()) throw Error("directory is not an authentic allowed directory");
    return readdirSync(path).filter(name => /^[^/\\]+\.(?:json|md|txt)$/.test(name)).sort().map(name => `${directory}/${name}`);
  } catch (error) { if (error.code !== "ENOENT") limits.push(`${directory}: ${error.message}`); return []; }
}
function optional(root, ref, limits) {
  try { return readOriginal(root, ref); }
  catch (error) { limits.push(`${ref}: ${error.message}`); return null; }
}
function readSource(ref, taskPath, materialRoot, limits, expectedHash) {
  const original = plainRef(ref);
  if (!original) return {ref:ref ?? null,safe:false,readable:false,verified:false};
  const roots = isAbsolute(original) ? [taskPath,materialRoot].filter(root=>inside(root,original)) : original.startsWith("quality/") || original === "facts.jsonl" ? [taskPath] : [materialRoot, taskPath];
  const matches = [];
  for (const root of roots) {
    try { const raw = readOriginal(root, original); matches.push({raw,sha256:hash(raw)}); }
    catch (error) { if (error.code !== "ENOENT") limits.push(`${ref}: ${error.message}`); }
  }
  if (!matches.length || matches.some(value => value.raw !== matches[0].raw)) {
    limits.push(`${ref}: 原件不可读或来源有歧义；交当前来源 owner`);
    return {ref,safe:false,readable:false,verified:false};
  }
  const value = matches[0], valid = !expectedHash || expectedHash.toLowerCase() === value.sha256;
  if (!valid) limits.push(`${ref}: 原件 sha256 与声明不符`);
  return {ref,safe:true,readable:true,verified:valid,...value};
}
function fileEvidence(ref, raw) {
  return raw === null ? {readable:false,unavailable:true} : {ref,sha256:hash(raw),evidence_type:"file_sha256",readable:true,verified:true};
}
// Only ring 1 can consume a parent original. Parent roots never enter readSource.
function exactRawSource(taskPath, manifest, materialRoot, repo, spec, decisionLog, limits) {
  const validInput = input => object(input) && text(input.ref) && !isAbsolute(input.ref) && input.ref.startsWith("quality/evidence/raw-requirements/") && !input.ref.includes("\\") && !input.ref.includes("\0") && !input.ref.split("/").some(part=>part === ".." || part === "." || !part) && /^[a-f0-9]{64}$/i.test(input.sha256 ?? "");
  const unavailable = reason => { limits.push(`原始需求 exact RAW 未取得: ${reason}`); return {evidence:{readable:false,unavailable:true},scope:null}; };
  const own = manifest.inputs?.raw_requirement;
  if (own !== undefined) {
    if (!validInput(own)) return unavailable("当前 task inputs.raw_requirement ref/hash 非法");
    try {
      const raw=readOriginal(taskPath,own.ref);
      if (hash(raw) !== own.sha256.toLowerCase()) return unavailable("当前 task RAW sha256 不匹配");
      return {evidence:fileEvidence(own.ref,raw),scope:null};
    } catch (error) { return unavailable(error.message); }
  }
  if (!text(manifest.project_name) || dirname(dirname(taskPath)).split(sep).at(-1) !== manifest.project_name || dirname(taskPath).split(sep).at(-1) !== "tasks" || taskPath.split(sep).at(-1) !== manifest.task_id || dirname(dirname(dirname(taskPath))).split(sep).at(-1) !== "Projects") return null;
  const container=dirname(taskPath), sources=String(spec ?? ""), roots=[];
  const refs = raw => [...raw.matchAll(/`([^`\n]+)`|\]\(<?([^\n)>]+)>?\)/g)].map(match=>plainRef(match[1]??match[2])).filter(text);
  const parentRoot = value => isAbsolute(value) && dirname(value) === container && /^[a-z0-9][a-z0-9._-]*$/i.test(value.split(sep).at(-1)) && value !== taskPath;
  for (const line of sources.split("\n").filter(line=>/父任务库/.test(line))) for (const ref of refs(line)) {
    if (isAbsolute(ref)) { if (!parentRoot(ref)) return unavailable("具名父根不在同项目 tasks 容器或身份不明"); roots.push(ref); }
  }
  const definitions=[...sources.matchAll(/parent:(quality\/evidence\/raw-requirements\/[^`\s\n]+)[`\s]?/g)].map(match=>match[1]);
  let selectedRefs=[];
  if (definitions.length) selectedRefs=definitions.map(ref=>({relative:ref}));
  else {
    const prds=[...new Set(sources.split("\n").filter(line=>/父\s*PRD|parent\s*PRD/i.test(line)).flatMap(refs).filter(ref=>/^specs\/archive\/[^/]+\/prd\.md$/.test(ref)))];
    if (prds.length > 1) return unavailable("父 PRD 精确来源有歧义");
    if (prds.length === 1) {
      try {
        const prd=readOriginal(repo,prds[0]);
        const definition=prd.match(/^\[raw\]:\s*<?([^\s>]+)>?\s*$/m)?.[1];
        selectedRefs=(definition && /\[raw\]/i.test(prd.replace(/^\[raw\]:.*$/m,"")) ? [definition] : refs(prd)).map(absolute=>({absolute}));
      }
      catch (error) { return unavailable(error.message); }
    } else {
      const lines=decisionLog.split("\n");
      let named=lines.filter(line=>/原始需求|原始要求|原需|RAW/i.test(line)).flatMap(refs).filter(ref=>/^quality\/evidence\/[^\n]+\.md$/.test(ref));
      if (!named.length) named=lines.filter(line=>/research|调研/i.test(line)).flatMap(refs).filter(ref=>/^quality\/evidence\/[^\n]+\.md$/.test(ref));
      named=[...new Set(named)];
      if (named.length > 1) return unavailable("具名 RAW research 来源不唯一，不递归发现");
      if (named.length === 1) {
        try { selectedRefs=refs(readOriginal(taskPath,named[0])).map(absolute=>({absolute})); }
        catch (error) { return unavailable(error.message); }
      }
    }
  }
  for (const {absolute} of selectedRefs) if (isAbsolute(absolute ?? "") && inside(container,absolute)) {
    const parts=relative(container,absolute).split(sep), root=join(container,parts[0]);
    if (parentRoot(root) && parts.slice(1,4).join("/") === "quality/evidence/raw-requirements") roots.push(root);
  }
  const unique=[...new Set(roots)];
  if (!unique.length) return null;
  if (unique.length !== 1) return unavailable("双父来源冲突，未有唯一决定");
  const root=unique[0], expectedId=root.split(sep).at(-1);
  try {
    const originalManifest=readOriginal(root,"task.json"), parent=JSON.parse(originalManifest), input=parent.inputs?.raw_requirement;
    const identity = value => object(value) && value.task_id === expectedId && value.project_name === manifest.project_name && value.target_repo_root === manifest.target_repo_root;
    if (!identity(parent)) return unavailable("父 manifest task/project/repository 身份缺失或冲突");
    if (!validInput(input)) return unavailable("父 inputs.raw_requirement exact ref/hash 缺失或非法");
    if (!selectedRefs.some(ref=>ref.relative === input.ref || ref.absolute === join(root,input.ref))) return unavailable("已具名来源没有指向父 manifest 的 exact RAW；不读旁件");
    const raw=readOriginal(root,input.ref);
    if (hash(raw) !== input.sha256.toLowerCase()) return unavailable("父 RAW sha256 与 manifest 声明不匹配");
    const verify = supplied => {
      if (supplied !== input.ref) return "parent original ref outside exact approved chain";
      try {
        const current=readOriginal(root,"task.json");
        if (current !== originalManifest || !identity(JSON.parse(current))) return "parent original manifest identity changed";
        return hash(readOriginal(root,input.ref)) === input.sha256.toLowerCase() ? null : "parent original sha256 mismatch";
      } catch (error) { return `parent original unavailable: ${error.message}`; }
    };
    return {evidence:{...fileEvidence(join(root,input.ref),raw),source_task_id:expectedId,source_manifest_ref:join(root,"task.json")},scope:{ref:input.ref,verify}};
  } catch (error) { return unavailable(error.message); }
}

function levelInput(decisionLog, read, limits) {
  const body = section(decisionLog, "级别与路线");
  const choices = [...body.matchAll(/(?:用户选择|真实用户选择|用户已确认级别|确认级别)\s*[:：]\s*(small|normal|complex|planning|小改动|普通|复杂|规划)/g)];
  const latest = choices.at(-1);
  if (!latest) return {};
  const block = body.slice(latest.index);
  const sourceRef = block.match(/原\s*ref\s*[:：]\s*([^\s\n；;]+)/i)?.[1];
  const declaredHash = block.match(/sha256\s*[:：]\s*([a-f0-9]{64})/i)?.[1];
  const source = read(sourceRef,declaredHash);
  const entryRef = body.match(/入口(?:调用)?(?:返回)?(?:原\s*ref|原件|来源)\s*[:：]\s*([^\s\n；;]+)/i)?.[1];
  const entrySource = read(entryRef);
  let entry;
  try { entry = JSON.parse(entrySource.raw); } catch { limits.push("入口调用原件不是可核返回；交当前 make-decision 来源 owner"); }
  const flags = ["boundary_clear","single_outcome","limited_impact","major_architecture","migration","permission","security"];
  const actual = entry?.flags ?? entry?.result?.flags;
  if (!actual || !flags.every(key => typeof actual[key] === "boolean")) entrySource.verified = false;
  const facts = {};
  for (const key of ["scope","change_kind","independent_units","risk","credentials","dependencies","acceptance"]) {
    const match = body.match(new RegExp(`^[-* ]*${key}\\s*[:：]\\s*([^\\n；;]+)[；;]\\s*来源\\s*[:：]\\s*([^\\s\\n]+)`, "m"));
    if (match) {
      const value = match[1].trim();
      facts[key] = {value:value === "false" ? false : value === "true" ? true : /^\d+$/.test(value) ? Number(value) : value,source:read(match[2])};
    }
  }
  return {selected:latest[1],confirmed:source.verified === true,source,entrySource,facts};
}
function taskFacts(taskPath, taskId, limits) {
  const raw = optional(taskPath,"facts.jsonl",limits);
  if (raw === null || !raw.trim()) return [];
  try {
    return raw.trimEnd().split(/\r?\n/).map((line,index) => {
      const value = JSON.parse(line);
      if (!object(value) || value.task_id !== taskId) throw Error(`line ${index+1} task identity mismatch`);
      return value;
    });
  } catch (error) { limits.push(`facts.jsonl: ${error.message}; existing facts were not rewritten`); return []; }
}
function checkedOriginal(candidate, taskId, taskPath, materialRoot, limits, slug, scopedOriginal) {
  if (!text(candidate?.ref)) return candidate;
  let ref = scopedOriginal?.ref ?? candidate.ref;
  if (!scopedOriginal && isAbsolute(ref)) {
    const root = [taskPath,materialRoot].find(root=>inside(root,ref));
    if (!root) { limits.push(`${ref}: original outside approved task/material roots`); return {...candidate,verified:false}; }
    ref = relative(root,ref);
  }
  const step = {step_id:1,step_slug:slug};
  const result = {task_id:taskId,workflow:"final-chain",step_id:1,step_slug:slug,status:"completed",result_ref:ref};
  const verified = validateStepResults({task_id:taskId,workflow:"final-chain",step_results:[result]},taskId,[step],{taskPath},{workflow:"final-chain",verifyEvidence:(_task,supplied,expectedTask)=>{
    if (scopedOriginal) return expectedTask === taskId ? scopedOriginal.verify(supplied.result_ref) : "original consuming task identity mismatch";
    const source = readSource(supplied.result_ref,taskPath,materialRoot,limits,candidate.sha256 ?? candidate.original_sha256);
    if (!source.verified) return "original sha256 binding or safe readable source unavailable";
    try { const record = JSON.parse(source.raw); if (record?.task_id !== undefined && record.task_id !== expectedTask) return "original task identity mismatch"; } catch (error) { if (error instanceof SyntaxError) return null; throw error; }
    return null;
  }});
  if (verified.error || !Array.isArray(verified.results)) {
    const reason = verified.error ?? "original validator returned no verified result";
    limits.push(`${candidate.ref}: ${reason}`);
    return {...candidate,verified:false,verification_error:reason};
  }
  return candidate;
}

function argvMatches(command, argv) {
  if (!Array.isArray(argv) || !argv.length || !argv.every(text)) return false;
  try { const parsed = JSON.parse(command); if (Array.isArray(parsed)) return JSON.stringify(parsed) === JSON.stringify(argv); } catch { /* Existing facts may contain the literal command. */ }
  if (argv.length === 3 && /(?:^|\/)sh$/.test(argv[0]) && argv[1] === "-c") return command === argv[2];
  return argv.every(arg=>/^[a-zA-Z0-9_./:@%+=,-]+$/.test(arg)) && command === argv.join(" ");
}
function receiptPointers(source) {
  return [...String(source ?? "").matchAll(/(?:^|[;\s])receipt:\s*([^;\n]+)/g)].map(match=>match[1].trim());
}
function commands(facts, taskPath, materialRoot, limits, taskId, allowedCwds, historicalCwds = []) {
  const result = [];
  for (const row of facts) for (const entry of Array.isArray(row.evidence?.value) ? row.evidence.value : []) {
    const direct = entry.receipt_ref ?? entry.ref ?? entry.failure_signature?.match(/output:\s*(\S+)\.output/)?.[1]?.concat(".json");
    const pointed = receiptPointers(row.source);
    const refs = direct ? [direct] : pointed.length ? pointed : names(taskPath,"quality/tests",limits).filter(ref=>ref.endsWith(".json"));
    const candidates = [];
    for (const ref of [...new Set(refs)]) {
      const source = readSource(ref,taskPath,materialRoot,limits,entry.sha256);
      if (!source.verified) continue;
      let receipt;
      try { receipt = JSON.parse(source.raw); } catch { continue; }
      if (!argvMatches(entry.command,receipt.argv) || receipt.exit_code !== entry.exit_code) continue;
      const historical = text(receipt.cwd) && historicalCwds.includes(receipt.cwd) && Boolean(direct || pointed.length);
      if (!text(receipt.cwd) || (!allowedCwds.includes(resolve(receipt.cwd)) && !historical)) { limits.push(`${ref}: receipt cwd is not bound to this task workspace`); continue; }
      if (receipt.task_id !== undefined && receipt.task_id !== taskId) { limits.push(`${ref}: original task identity mismatch`); continue; }
      const timed = receipt.started_at !== undefined || receipt.ended_at !== undefined;
      const start = Date.parse(receipt.started_at), end = Date.parse(receipt.ended_at);
      if (timed && (!Number.isFinite(start) || !Number.isFinite(end) || end < start)) { limits.push(`${ref}: receipt timing is invalid or reversed`); continue; }
      if (!direct && !timed) { limits.push(`${ref}: native receipt time/source binding unavailable`); continue; }
      candidates.push({ref,source,receipt,start,end,historical});
    }
    let chosen;
    if (candidates.length === 1) chosen = candidates[0];
    else if (candidates.length > 1 && !direct && pointed.length) {
      const ordered = candidates.every((candidate,index)=>Number.isFinite(candidate.start) && Number.isFinite(candidate.end) && (!index || candidate.start >= candidates[index-1].end));
      if (ordered && new Set(candidates.map(candidate=>`${candidate.start}:${candidate.end}`)).size === candidates.length) chosen = candidates.at(-1);
    }
    if (!chosen) { limits.push(`执行原回执${candidates.length > 1 ? "有歧义" : "未定位或身份不对应"}: ${entry.command ?? "unknown command"}; existing source refs retained`); continue; }
    const {ref,source,receipt} = chosen;
    if (chosen.historical) limits.push(`${ref}: 历史测试 cwd ${receipt.cwd}；仅证明原任务执行，不证明当前代码快照通过；原件 sha256 ${source.sha256}`);
    const output = readSource(receipt.output_ref ?? entry.output_ref,taskPath,materialRoot,limits,receipt.output_sha256 ?? entry.output_sha256);
    if (!Number.isInteger(receipt.exit_code) || !output.verified || receipt.signal || receipt.timed_out || receipt.cancelled || receipt.truncated) { limits.push(`${ref}: native receipt/output is unavailable, cancelled, timed out or truncated`); continue; }
    const command = receipt.argv.join(" ");
    const candidate = {...entry,ref,command,exit_code:receipt.exit_code,evidence_type:"command_exit",readable:true,verified:true,receipt,output:output.raw,original_sha256:source.sha256};
    result.push(checkedOriginal(candidate,taskId,taskPath,materialRoot,limits,entry.step_slug ?? "recorded-command"));
  }
  return result;
}
const safeScopePath = value => text(value) && !isAbsolute(value) && !value.includes("\\") && !value.includes("\0") && !value.split("/").some(part=>part === ".." || part === "." || !part);
const scopeContains = (pattern,path) => safeScopePath(pattern) && safeScopePath(path) && (pattern.endsWith("/**") ? path.startsWith(pattern.slice(0,-2)) && path.length > pattern.length-2 : pattern === path);
function writeSets(spec, phases, missingPhases) {
  const design = section(spec,"全局文件边界与依赖") || section(spec,"实现设计");
  const specLines = design.split("\n").filter(line => /(?:新增|修改)/.test(line));
  const declared = specLines.length ? [...new Set(specLines.flatMap(line => [...line.matchAll(/`([^`]+)`/g)].map(match=>match[1])))] : null;
  const values = phases.map(({raw}) => raw.match(/\*\*Write set\*\*\s*[:：]\s*([^\n]+)/)?.[1]);
  const phaseWriteSet = !missingPhases.length && values.length && values.every(text) ? [...new Set(values.flatMap(value=>[...value.matchAll(/`([^`]+)`/g)].map(match=>match[1])))] : null;
  // Expand only paths proved covered by a real trailing /** declaration; never union unknown Phase paths into spec authority.
  const covered = Array.isArray(declared) && Array.isArray(phaseWriteSet) ? phaseWriteSet.filter(path=>declared.some(pattern=>scopeContains(pattern,path))) : [];
  return {specWriteSet:declared ? [...new Set([...declared,...covered])] : null,phaseWriteSet};
}
function contractOriginal(facts, read, materialRoot, spec, phaseIndex, phases, limits, commands) {
  const field = (raw,name) => raw.match(new RegExp(`^\\s*-\\s+\\*\\*${name}\\*\\*\\s*[:：]\\s*(.+?)\\s*$`,"m"))?.[1]?.trim() ?? null;
  const same = (left,right) => Array.isArray(left) && Array.isArray(right) && [...left].sort().join("\0") === [...right].sort().join("\0");
  const refs = facts.flatMap(row=>{const first=typeof row.source === "string" ? row.source.split(";")[0].trim() : "";return /^quality\/evidence\/[^\n]+\.json$/.test(first) ? [first] : [];});
  const candidates=[...refs.map(ref=>({ref})),...commands.filter(command=>command.command.includes("validatePostPhaseContract")).map(native=>({ref:native.ref,native}))];
  let unknown;
  for (const {ref,native} of candidates) {
    if (native && unknown) return unknown;
    const source = read(ref);
    if (!source.verified) { unknown={unavailable:true,readable:false}; continue; }
    let original;
    try { original=native ? {command:native.command,exit_code:native.exit_code,contract:JSON.parse(native.output)} : JSON.parse(source.raw); } catch { limits.push(`${ref}: checker actual result body unavailable`); unknown={unavailable:true,readable:false}; continue; }
    if (!text(original.command) || !original.command.includes("validatePostPhaseContract")) continue;
    const body=original.contract, checked=body?.facts;
    const words=native ? native.receipt.argv : original.command.match(/(?:"[^"]*"|'[^']*'|\S+)/g)?.map(value=>value.replace(/^['"]|['"]$/g,"")) ?? [];
    if (!words.includes(materialRoot) || !object(body) || typeof body.ok !== "boolean" || !Array.isArray(body.errors) || !checked || !Array.isArray(checked.phase_rows) || !Number.isInteger(checked.phase_count) || checked.phase_count <= 0 || !Number.isInteger(checked.task_count) || checked.task_count <= 0) { limits.push(`${ref}: current material root/scanned contract body or input scope unavailable`); unknown={unavailable:true,readable:false}; continue; }
    const row=facts.find(row=>String(row.source??"").split(";")[0].trim() === ref);
    const producerRefs=[...receiptPointers(row?.source),...(row?.evidence?.value??[]).map(entry=>entry.receipt_ref??entry.ref).filter(text)];
    const producer=native ?? commands.find(command=>producerRefs.includes(command.ref) && command.verified && argvMatches(original.command,command.receipt.argv) && command.receipt.argv.includes(materialRoot) && command.exit_code === original.exit_code);
    let actual;
    try { actual=producer ? JSON.parse(producer.output) : null; } catch { actual=null; }
    if (!producer?.verified || !producer.receipt.argv.includes(materialRoot) || !actual || actual.ok !== body.ok || JSON.stringify(actual.errors) !== JSON.stringify(body.errors) || JSON.stringify(actual.facts) !== JSON.stringify(body.facts)) { limits.push(`${ref}: 普通或native合同结果未绑定实际checker command/input/exit及原结果，执行来源或结果冲突未取得`); unknown={unavailable:true,readable:false}; continue; }
    if (body.ok === false && body.errors.length) return {...fileEvidence(ref,source.raw),command:producer.command,exit_code:producer.exit_code,contract_ok:false,contract:body,scan_count:checked.phase_count,basis:[fileEvidence(ref,source.raw),producer],note:"已核实际checker失败；advisory exit不覆盖错误结果"};
    const expectedFrs=[...new Set([...String(spec??"").matchAll(/^-\s+\*\*(FR-[A-Z0-9-]+)\*\*/gm)].map(match=>match[1]))];
    const expectedAcs=[...new Set([...String(spec??"").matchAll(/^-\s+(?:\[[ xX]\]\s+)?\*\*(AC-[A-Z0-9-]+)/gm)].map(match=>match[1]))];
    let applicable=checked.phase_count === phases.length && same(checked.fr_coverage?.accepted_ids,expectedFrs) && same(checked.ac_coverage?.accepted_ids,expectedAcs);
    for (const record of checked.phase_rows) {
      const current=phases.find(phase=>phase.ref === record.path);
      if (!current) {applicable=false;continue;}
      const raw=current.raw,dependencyValue=field(raw,"Dependency"),dependency=dependencyValue?.match(/`([^`]+)`/)?.[1] ?? dependencyValue;
      const writes=[...String(field(raw,"Write set")??"").matchAll(/`([^`]+)`/g)].map(match=>match[1]);
      const taskIds=[...raw.matchAll(/^###\s+(T\d{3,})\b/gm)].map(match=>match[1]);
      if (dependency !== record.dependency || !same(writes,record.write_set) || field(raw,"gate_cmd") !== record.command || field(raw,"oracle") !== record.oracle || !same(taskIds,record.task_ids)) applicable=false;
      if ([...String(dependency??"").matchAll(/\bP\d+\b/g)].some(match=>!phases.some(phase=>phase.ref.match(/\/P\d+/)?.[0].slice(1) === match[0]))) applicable=false;
    }
    if (!applicable || !text(phaseIndex)) { limits.push(`${ref}: 受检FR/AC/Phase/task/dependency/command-oracle结构或范围已变化，原适用结论未取得`); unknown={unavailable:true,readable:false}; continue; }
    return {...fileEvidence(ref,source.raw),command:producer.command,exit_code:producer.exit_code,contract_ok:original.exit_code === 0 && body.ok === true && body.errors.length === 0,contract:body,scan_count:checked.phase_count,basis:[fileEvidence(ref,source.raw),producer],note:"仅声明级合同及已核结构锚；无关prose/whole-file hash不作新鲜度门"};
  }
  return unknown;
}
function decisionOriginal(commands, materialRoot, decisionLog, limits, repoRoots, taskPath) {
  const packageRoot=resolve(dirname(fileURLToPath(import.meta.url)),"../.."),checkerRelative="tools/cli/check-decision-log-chain.mjs";
  const target=join(materialRoot,"decision-log.md"),scans=new Map();
  const candidates=commands.filter(command=>command.command.includes("check-decision-log-chain.mjs"));
  for(const command of candidates.slice().reverse()) {
    const argv=command.receipt.argv,entryIndex=argv[1] === "--" ? 2 : 1,entry=argv[entryIndex],profile=argv.slice(entryIndex+1);
    if(!/^(?:.*\/)?(?:node|nodejs)(?:\.exe)?$/.test(argv[0]??"") || !text(entry) || !(entry === checkerRelative || entry.endsWith("/"+checkerRelative)) || profile.length !== 2 || profile[0] !== "--file" || argv.includes("--root")) continue;
    const inputPath=resolve(command.receipt.cwd,profile[1]),entryPath=resolve(command.receipt.cwd,entry);
    let inputBytes,checkerBytes,kind=inputPath === target ? "decision-log" : null;
    try {
      inputBytes=inputPath === target ? readOriginal(materialRoot,"decision-log.md") : readOriginal(taskPath,inputPath);
      if(inputPath !== target) {
        if(/^#.*需求索引/m.test(inputBytes))kind="requirements-index";
        else if(/^#.*(?:覆盖表|覆盖矩阵)/m.test(inputBytes))kind="coverage-matrix";
        else continue;
      }
      // Once selected, a newer kind cannot be displaced by older attempts.
      if(scans.has(kind))continue;
      const sourceRoot=[packageRoot,...repoRoots].find(root=>inside(root,entryPath));
      if(!sourceRoot)throw Error("checker source outside trusted roots");
      checkerBytes=readOriginal(sourceRoot,relative(sourceRoot,entryPath));
      if(checkerBytes !== readOriginal(packageRoot,checkerRelative))throw Error("checker source differs from installed source");
    } catch(error){
      limits.push(`${command.ref}: checkpoint input/source unavailable: ${error.message}`);
      if(kind === "decision-log")return {readable:false,unavailable:true,basis:[command]};
      if(kind && !scans.has(kind))scans.set(kind,{readable:false,unavailable:true,basis:[command]});
      if(scans.size === 2)break;
      continue;
    }
    let observation;
    if(command.exit_code !== 0) observation={...command,basis:[command,{ref:inputPath,notes:["selected input path; failed execution does not certify current bytes as scanned"]}]};
    else {
      const lines=typeof command.output === "string" ? command.output.split(/\r?\n/).filter(line=>line.startsWith("[check-decision-log-chain] scanned ")) : [];
      let signature;
      try {if(lines.length !== 1)throw Error("exactly one execution signature required");signature=JSON.parse(lines[0].slice("[check-decision-log-chain] scanned ".length));}catch{signature=null;}
      const bound=object(signature) && Object.keys(signature).sort().join(",") === "checker_sha256,input_path,input_sha256"
        && signature.input_path === inputPath && /^[a-f0-9]{64}$/.test(signature.input_sha256??"") && /^[a-f0-9]{64}$/.test(signature.checker_sha256??"")
        && signature.input_sha256 === hash(inputBytes) && signature.checker_sha256 === hash(checkerBytes);
      const advisory=/\[check-decision-log-chain\] advisory complete: \d+ warning\(s\), non-blocking, exit 0/.test(command.output);
      if(!bound || !advisory || (kind === "decision-log" && /unknown\.decision_entries|no decision entries|coverage is unavailable/i.test(command.output))) {
        limits.push(`${command.ref}: execution-time input/source binding or recognized scan unavailable; no current-byte backfill`);
        observation={readable:false,unavailable:true,basis:[command,{ref:inputPath,notes:["execution signature missing, conflicting, mismatched or scan unavailable"]}]};
      } else observation={...command,basis:[command,fileEvidence(entryPath,checkerBytes),fileEvidence(inputPath,inputBytes)]};
    }
    if(kind === "decision-log")return {...observation,nonempty:decisionLog.trim().length>0,scan_count:1,decision_count:[...decisionLog.matchAll(/^#{3,4}\s+(?:D|ADR)-\d+/gm)].length,required_sections_present:["任务身份","原始需求","工作包与决定","未决项"].every(title=>decisionLog.includes(title))};
    scans.set(kind,observation);
    if(scans.size === 2)break;
  }
  if(!scans.size)return {readable:false,unavailable:true};
  const selected=[...scans.values()],basis=selected.flatMap(item=>item.basis??[]);
  if(selected.some(item=>item.unavailable))return {readable:false,unavailable:true,basis};
  const failed=selected.find(item=>item.exit_code !== 0);
  if(failed)return {...failed,basis};
  return {...selected[0],nonempty:typeof decisionLog === "string" && decisionLog.trim().length>0,scan_count:scans.size,
    decision_count:[...String(decisionLog).matchAll(/^#{3,4}\s+(?:D|ADR)-\d+/gm)].length,
    required_sections_present:scans.size === 2 && ["任务身份","原始需求","工作包与决定","未决项"].every(title=>String(decisionLog).includes(title)),
    basis:[...basis,fileEvidence("decision-log.md",decisionLog)]};
}

function tracking(spec) {
  const body = section(spec,"需求到任务追踪");
  const lines = body.split("\n").filter(line=>line.trim().startsWith("|"));
  if (lines.length < 3) return [];
  const header = cells(lines[0]);
  const col = patterns => header.findIndex(value=>patterns.some(pattern=>pattern.test(value)));
  const indexes = [col([/source|来源|需求/i]),col([/FR|AC/i]),col([/Phase|Task/i]),col([/oracle|判据|测试/i])];
  return lines.slice(1).filter(line=>!/^\|\s*:?-{2,}/.test(line)).map(line => {
    const values = cells(line); return Object.fromEntries(["source","fr_ac","phase_task","oracle"].map((key,index)=>[key,indexes[index] < 0 ? "" : values[indexes[index]]]));
  });
}
function currentReview(facts, taskPath, materialRoot, taskId, level, changed, limits, expectedPhases, phaseBodies, sourceRepo) {
  const selectedRefs = facts.map(row=>row.review_result_ref?.value).filter(text);
  const selected = new Set(selectedRefs);
  // The ordinary producer appends flat immutable phase results, not an index or additional stage rows.
  // Enumerate only expected current phase filenames; filenames select candidates, JSON and originals prove identity.
  const phaseRefs = names(taskPath,"quality/reviews",limits).filter(ref=>{
    const match = /\/\d{4}-\d{2}-\d{2}-\d{3,}-build-code-phase-(p[1-9][0-9]*)\.json$/.exec(ref);
    return match && expectedPhases.includes(match[1].toUpperCase());
  }).sort((left,right)=>{
    const a = /\/(\d{4}-\d{2}-\d{2})-(\d+)-/.exec(left), b = /\/(\d{4}-\d{2}-\d{2})-(\d+)-/.exec(right);
    return a[1].localeCompare(b[1]) || Number(a[2]) - Number(b[2]);
  });
  const phaseScopes = new Map(phaseBodies.map(({ref,raw})=>{
    const id = ref.match(/\/P([0-9]+)/)?.[1];
    const declaration = raw.match(/\*\*(?:Write set|写入集)\*\*\s*[:：]\s*([^\n]+)/)?.[1];
    return [`P${id}`,declaration ? [...declaration.matchAll(/`([^`]+)`/g)].map(match=>match[1]) : []];
  }));
  const refs = [...new Set([...phaseRefs,...selectedRefs])];
  let candidate, candidateSuccessful = false;
  const phaseReviews = new Map();
  for (const ref of refs) {
    // Selection itself supersedes the old observation, including unreadable or malformed latest originals.
    if (phaseRefs.includes(ref)) phaseReviews.set(/-phase-(p[1-9][0-9]*)\.json$/.exec(ref)[1].toUpperCase(),false);
    const source = readSource(ref,taskPath,materialRoot,limits);
    if (!source.verified) continue;
    let value;
    try { value = JSON.parse(source.raw); } catch { continue; }
    if (!object(value)) continue;
    const providers = (Array.isArray(value.provider_results) ? value.provider_results : []).map(provider => {
      const raw = readSource(provider.raw_output_ref,taskPath,materialRoot,limits,provider.raw_output_sha256);
      return {provider:provider.provider,status:provider.status,parse_outcome:provider.parse_outcome ?? provider.execution?.parse_outcome,raw_ref:provider.raw_output_ref,readable:raw.verified};
    });
    const materialCoverage = Array.isArray(value.material_coverage) ? value.material_coverage : [];
    const request = value.request;
    const declared = request?.subject?.changed_files;
    const current = Array.isArray(declared) && changed.length > 0 && declared.length === changed.length && declared.every(path=>changed.includes(path));
    const identity = value.task_id === taskId && request?.stage === value.stage && request?.review_scope === value.review_scope && request?.subject_kind === value.subject_kind && request?.phase_id === value.phase_id && request?.review_kind === value.review_kind && request?.surface === value.surface;
    const successful = providers.some(provider=>provider.status === "completed" && provider.parse_outcome === "ok" && provider.readable && materialCoverage.some(coverage=>coverage.provider === provider.provider && ["read","unread","undetermined"].every(key=>Array.isArray(coverage[key]))));
    if (phaseRefs.includes(ref)) {
      const filenamePhase = /-phase-(p[1-9][0-9]*)\.json$/.exec(ref)?.[1]?.toUpperCase();
      const allowed = phaseScopes.get(filenamePhase) ?? [];
      const declaredScope = Array.isArray(declared) && declared.length > 0 && allowed.length > 0
        && declared.every(path=>text(path) && !isAbsolute(path) && allowed.some(pattern=>scopeContains(pattern,path)));
      // Later originals replace only this phase's observation; failed/unknown latest facts never fall back to older success.
      phaseReviews.set(filenamePhase, value.version === "wh-review-result.v1" && identity && successful && declaredScope
        && ["available","available-with-failures"].includes(value.status)
        && value.stage === "build-code" && value.review_scope === "phase" && value.subject_kind === "phase"
        && value.review_kind === null && value.phase_id === filenamePhase);
    }
    if (!selected.has(ref)) continue;
    candidateSuccessful = successful && ["available","available-with-failures"].includes(value.status);
    candidate = {...fileEvidence(ref,source.raw),...value,providers,material_coverage:materialCoverage,independent:identity,current_scope:current,final:value.stage === "build-code" && value.review_scope === "terminal" && value.subject_kind === "worktree" && value.phase_id === null && value.review_kind === null,phase_reviews_verified:false};
    if (candidate.final && (!identity || !current || !candidateSuccessful)) candidate.unavailable = true;
    candidate.basis = [{...fileEvidence(ref,source.raw),provider_results:providers,material_coverage:materialCoverage,discarded_facts:value.discarded_facts}];
  }
  if (candidate) {
    const last = expectedPhases.at(-1), lastScope = phaseScopes.get(last) ?? [];
    const lastChanges = changed.filter(path=>lastScope.some(pattern=>scopeContains(pattern,path)));
    const manifest = candidate.ocr?.manifest;
    // A combined terminal may own the indexed last Phase only when its actual input contains that Phase's current changed source.
    // Existing explicit failed/unknown last-Phase observations remain; no implicit disposition or fabricated phase review is written.
    const terminalLast = !phaseReviews.has(last) && candidate.final && candidate.independent && candidate.current_scope && candidateSuccessful
      && lastChanges.length > 0 && Array.isArray(manifest) && lastChanges.every(path=>{
        try {
          const projected = redactProviderHostPaths(readOriginal(sourceRepo,path));
          return manifest.some(entry=>object(entry) && (entry.path === path || typeof entry.path === "string" && entry.path.startsWith("repos/") && entry.path.split("/").slice(2).join("/") === path)
            && entry.sha256 === hash(projected) && entry.bytes === Buffer.byteLength(projected));
        } catch (error) { limits.push(`${path}: combined last-Phase source input unavailable: ${error.message}`); return false; }
      });
    candidate.phase_reviews_verified = expectedPhases.length > 0 && expectedPhases.every(phase=>phaseReviews.get(phase) === true || phase === last && terminalLast);
  }
  return candidate ?? {readable:false,unavailable:true};
}
function originalFields(raw) {
  try { const value = JSON.parse(raw); if (object(value)) return value; } catch { /* Ordinary human originals need not be JSON. */ }
  const field = name => raw.match(new RegExp(`^(?:${name})\\s*[:：]\\s*(.+)$`, "m"))?.[1]?.trim();
  return {source:field("source"),step_slug:field("step_slug"),reader:field("执行者|独立读者"),inputs:field("实际输入"),observation:field("实际观察"),criteria_ref:field("原方法判据"),conclusion:field("结论"),limits:text(field("限制")) ? [field("限制")] : undefined};
}
function researchOriginal(refs, read, commands, limits, taskPath, materialRoot) {
  const sourcePath=ref=>isAbsolute(ref) ? ref : join(ref.startsWith("quality/") ? taskPath : materialRoot,ref);
  for (const ref of refs) {
    const report=read(ref);
    if (!report.verified) continue;
    const raw=report.raw;
    if (!/(?:实际观察|实际调用|本次实读)/.test(raw) || !/(?:未查|没查|检查范围|覆盖)/.test(raw) || /实际观察[：:][^\n]*(?:未执行|计划明天|尚未)/.test(raw) || /覆盖结论[^\n]*(?:相反|矛盾|不符)/.test(raw)) continue;
    const pointers=[...raw.matchAll(/([A-Za-z0-9_./-]+\.(?:mjs|js|output))(?::(\d+)(?:[–-](\d+))?)?/g)];
    const sources=[];
    let invalid=false;
    for (const match of pointers) {
      const source=read(match[1]);
      if (!source.verified) { invalid=true; break; }
      const lines=source.raw.trimEnd().split("\n"), start=Number(match[2]??1), end=Number(match[3]??start);
      if (start < 1 || end < start || end > lines.length) { invalid=true; break; }
      sources.push(source);
    }
    const code=sources.filter(source=>/\.(?:mjs|js)$/.test(source.ref)), outputs=sources.filter(source=>source.ref.endsWith(".output"));
    if (invalid || !code.length) continue;
    const staticOnly=/仅[^\n]*源码[^\n]*(?:结构|名字|形参)/.test(raw) && /未执行/.test(raw) && !/实际调用|原始执行输出|调用者已消费/.test(raw);
    if (staticOnly) {
      const declarations=code.flatMap(source=>[...source.raw.matchAll(/export\s+(?:const|function)\s+([a-zA-Z_$][\w$]*)(?:\(([^)]*)\))?/g)]);
      if (declarations.length && declarations.every(match=>raw.includes(match[1]) && (!match[2] || match[2].split(",").every(name=>raw.includes(name.trim()))))) {
        limits.push(`${ref}: 静态源码声明/形参结构研究；未执行，未证明运行或外部效果。`);
        return {...fileEvidence(ref,raw),basis:[fileEvidence(ref,raw),...code.map(source=>fileEvidence(source.ref,source.raw))]};
      }
      continue;
    }
    if (!outputs.length) continue;
    const outputConsistent=outputs.every(output=>{
      if (!output.raw.trim() || /no tests executed|observation unavailable/i.test(output.raw)) return false;
      return commands.some(command=>{
        if (!command.verified || command.output !== output.raw || sourcePath(plainRef(command.receipt?.output_ref)??"") !== sourcePath(output.ref)) return false;
        const expectedFailure=/预期[^\n]*(?:失败|非零)|expected failure/i.test(raw);
        if (command.exit_code !== 0 && !expectedFailure) return false;
        const argv=command.receipt.argv;
        return argv.some(arg=>typeof arg === "string" && /\.(?:mjs|js)$/.test(arg) && code.some(source=>sourcePath(source.ref) === (isAbsolute(arg) ? arg : resolve(command.receipt.cwd,arg))));
      });
    });
    if (outputConsistent) return {...fileEvidence(ref,raw),basis:[fileEvidence(ref,raw),...sources.map(source=>fileEvidence(source.ref,source.raw))]};
  }
  if (refs.length) limits.push("具名研究来源/观察/覆盖或执行 producer 未可靠对应同任务命令、确切输入与精确输出，保 unavailable；源码/stdout静态相容不证明执行，交独立研究 reader。");
  return {readable:false,unavailable:true};
}
function deliveryInput(facts, taskId, read, actualCommands, declared, limits, repo, historicalCwds = [], targetRepo = repo) {
  const delivery = {declared};
  for (const row of facts) {
    const entries = Array.isArray(row.evidence?.value) ? row.evidence.value : [];
    const eventRef = typeof row.source === "string" ? row.source.split(";")[0].trim() : null;
    if (row.record_kind !== "stage" || !text(eventRef) || !/^quality\/evidence\/[^;\n]+\.(?:md|json)$/.test(eventRef)) continue;
    const source = read(eventRef);
    if (!source.verified) continue;
    let event;
    try { event = JSON.parse(source.raw); } catch {
      const field = name => source.raw.match(new RegExp(`^(?:${name})\\s*[:：]\\s*(.+)$`, "m"))?.[1]?.trim();
      const observation = field("实际观察"), stamp = field("观察时间"), reader = field("执行者");
      const identity = field("任务") === taskId && field("阶段") === row.stage && text(field("步骤")) && text(reader) && text(stamp) && Number.isFinite(Date.parse(stamp));
      if (identity && /尚未到交付时点/.test(observation ?? "")) event = {task_id:taskId,stage:row.stage,reached:false,timing_verified:true,observation,reader};
      else if (identity && /已到交付时点/.test(observation ?? "")) event = {task_id:taskId,stage:row.stage,reached:true,timing_verified:true,observation,reader};
    }
    if (event?.task_id === taskId && event.stage === row.stage && event.timing_verified === true && typeof event.reached === "boolean" && text(event.reader) && text(event.observation)) {
      Object.assign(delivery,{timing_verified:true,reached:event.reached,timing_ref:eventRef});
      const field=name=>source.raw.match(new RegExp(`^${name}[：:]\\s*(.+)$`,"m"))?.[1]?.trim();
      if (/已声明交付/.test(event.observation) && /本任务提交\s*PR/.test(field("交付目标") ?? "")) {
        if (declared === false) { delivery.declared = undefined; limits.push(`${eventRef}: 当前已认证交付声明与decision-log明确不做冲突；保未取得，不猜选一处`); }
        else delivery.declared = true;
      }
      if (event.reached && /不要求合并/.test(field("交付目标")??"") && [repo,targetRepo].includes(field("目标仓库"))) {
        const candidate=actualCommands.find(command=>command.ref === field("PR 读回原件"));
        if (candidate?.verified && candidate.exit_code === 0) try {
          const pr=JSON.parse(candidate.output), remote=execFileSync("git",["remote","get-url","origin"],{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
          const oid=name=>execFileSync("git",["rev-parse","--verify",name],{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
          const authenticated=Number.isInteger(pr.number) && pr.number > 0 && text(pr.headRefName) && text(pr.baseRefName) && pr.url === `${remote.replace(/\.git$/,"")}/pull/${pr.number}` && oid(pr.headRefName) === pr.headRefOid && oid(pr.baseRefName) === pr.baseRefOid && read(field("PR 返回输出")).raw === candidate.output;
          const fields=[["Git remote origin",remote],["PR URL",pr.url],["PR",`#${pr.number}`],["head",pr.headRefName],["base",pr.baseRefName],["head commit",pr.headRefOid],["base commit",pr.baseRefOid]];
          if (authenticated && fields.every(([name])=>text(field(name)))) {
            delivery.pr={...candidate,number:pr.number,url:pr.url,head:pr.headRefName,base:pr.baseRefName,basis:[fileEvidence(eventRef,source.raw),candidate]};
            const mismatches=fields.filter(([name,value])=>field(name) !== value);
            if (mismatches.length) delivery.conflict=`PR 声明与已认证原件矛盾：${mismatches.map(([name,value])=>`${name} 声明 ${field(name)}，原件 ${value}`).join("；")}；来源 ${eventRef} / ${candidate.ref}`;
          } else limits.push(`${eventRef}: ordinary PR declared object/local Git identity unavailable`);
        } catch { limits.push(`${eventRef}: ordinary PR identity original unavailable`); }
      }
    } else limits.push(`${eventRef}: delivery timing original identity/observation is not reliably established`);
  }
  for (const row of facts.filter(value=>value.record_kind === "close_action" && value.stage === "close" && value.close_action?.action === "merge")) {
    const action = row.close_action, source = read(action.ref);
    if (!source.verified || !text(action.result)) continue;
    let merge;
    try { merge = JSON.parse(source.raw); } catch { continue; }
    if (!Array.isArray(merge.argv) || !/\bgit\b.*\bmerge\b/.test(merge.argv.join(" ")) || merge.exit_code !== 0 || merge.signal || merge.timed_out || merge.cancelled || merge.truncated || ![repo,targetRepo].includes(resolve(merge.cwd ?? ""))) continue;
    const mergeOutput = read(merge.output_ref,merge.output_sha256);
    if (!mergeOutput.verified) continue;
    Object.assign(delivery,{declared:true,reached:true,timing_verified:true,timing_ref:action.ref});
    const expectedNumber = action.result.match(/PR\s*#?\s*(\d+)/i)?.[1];
    const expectedHead = action.result.match(/\b[a-f0-9]{40}\b/i)?.[0];
    const handoffRefs = [];
    for (const stage of facts.filter(value=>value.record_kind === "stage" && text(value.handoff?.value))) {
      const handoff=read(stage.handoff.value);
      if (!handoff.verified) continue;
      const body=handoff.raw;
      const taskField=body.match(/^任务[：:]\s*`?([^`\s，,。]+)`?/m)?.[1];
      const repoField=body.match(/^(?:目标)?仓库[：:]\s*`?([^`\s]+)`?/m)?.[1];
      if (taskField !== taskId || ![repo,targetRepo].includes(repoField)) continue;
      handoffRefs.push(...body.split("\n").filter(line=>/PR/.test(line)).flatMap(line=>[...line.matchAll(/(?:`)?(quality\/tests\/[^`\s、，；;]+\.json)(?:`)?/g)].map(match=>match[1])));
    }
    const commandRefs=actualCommands.filter(entry=>/\bgh\s+pr\s+view\b/.test(entry.command) && entry.exit_code === 0).map(entry=>entry.ref);
    for (const ref of [...new Set([...receiptPointers(row.source),...handoffRefs,...commandRefs])]) {
      const original = read(ref);
      if (!original.verified) continue;
      let receipt;
      try { receipt = JSON.parse(original.raw); } catch { continue; }
      if (!Array.isArray(receipt.argv) || !/\bgh\s+pr\s+view\b/.test(receipt.argv.join(" ")) || receipt.exit_code !== 0 || receipt.signal || receipt.timed_out || receipt.cancelled || receipt.truncated || (![repo,targetRepo].includes(resolve(receipt.cwd ?? "")) && !historicalCwds.includes(receipt.cwd))) continue;
      const output = read(receipt.output_ref,receipt.output_sha256);
      if (!output.verified) continue;
      try {
        const pr = JSON.parse(output.raw);
        let remote;
        try { remote = execFileSync("git",["remote","get-url","origin"],{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim().replace(/\.git$/i,"").replace(/^git@([^:]+):/,"https://$1/"); } catch { continue; }
        const expectedRepo = remote.replace(/\/$/,"");
        const boundRepo = typeof pr.url === "string" && pr.url.startsWith(`${expectedRepo}/pull/`) && pr.url.endsWith(`/pull/${pr.number}`);
        const boundTask = text(pr.headRefName) && pr.headRefName.endsWith(`/${taskId}`);
        const boundHead = text(expectedHead) && (pr.headRefOid === expectedHead || pr.mergeCommit?.oid === expectedHead);
        let expectedBase=merge.argv.find(arg=>/^origin\/[^/]+$/.test(arg))?.slice("origin/".length);
        if (!expectedBase) { try { expectedBase=execFileSync("git",["branch","--show-current"],{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim(); } catch { /* No base source means unavailable. */ } }
        const boundBase=text(expectedBase) && pr.baseRefName === expectedBase;
        if (pr.state !== "MERGED" || !Number.isFinite(Date.parse(pr.mergedAt)) || !/^[a-f0-9]{40}$/i.test(pr.mergeCommit?.oid ?? "") || !boundRepo || !boundTask || !boundHead || !boundBase || expectedNumber && Number(expectedNumber) !== pr.number) { limits.push(`${ref}: PR repository/head/base/task/merge identity or state is not bound to the actual close source`); continue; }
        delivery.pr = {...fileEvidence(ref,original.raw),number:pr.number,url:pr.url,head:pr.headRefName,base:pr.baseRefName,fields:{task_id:taskId,merge_ref:action.ref,pr_number:pr.number},basis:[fileEvidence(action.ref,source.raw),fileEvidence(ref,original.raw),fileEvidence(receipt.output_ref,output.raw)]};
      } catch { limits.push(`${ref}: PR original is not a readable JSON result`); }
    }
  }
  if (!delivery.pr && actualCommands.some(entry=>/\bgh\s+pr\s+view\b/.test(entry.command))) limits.push("PR command original retained, but delivery object identity/state is not bound to an actual task source; no ordinary receipt fallback.");
  return delivery;
}

function criterionRef(repo, ref, source, limits) {
  const match=ref.match(/^([A-Za-z0-9_./-]+\.md)(?:#(.+)|:(.+))?$/);
  if (!match || !safeScopePath(match[1])) return null;
  const target=match[1].includes('/') ? match[1] : join(dirname(source),match[1]);
  const raw=optional(repo,target,limits);
  if (raw === null) return null;
  if (!match[2] && !match[3]) return target;
  if (match[3]) {
    const lines=match[3].match(/^(\d+)(?:[-–](\d+))?$/);
    return (lines ? Number(lines[1]) > 0 && Number(lines[2]??lines[1]) <= raw.split("\n").length : raw.includes(match[3])) ? target+':'+match[3] : null;
  }
  let anchor;
  try { anchor=decodeURIComponent(match[2]); } catch { return null; }
  const selector=anchor.match(/^(.*?)\s+第([1-9]\d*(?:\/[1-9]\d*)*)步$/);
  if (selector) anchor=selector[1];
  const slug=value=>value.trim().toLowerCase().replace(/[`*_]/g,"").replace(/[^\p{L}\p{N}\s-]/gu,"").replace(/\s/g,"-");
  const headings=[...raw.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)];
  const chapters=headings.filter(heading=>heading[2] === anchor || slug(heading[2]) === anchor);
  const explicit=[...raw.matchAll(/<[^>]+\s(?:id|name)=["']([^"']+)["'][^>]*>/g)].filter(match=>match[1] === anchor);
  if (chapters.length !== 1 && (!explicit.length || selector)) return null;
  if (selector) {
    const chapter=chapters[0],end=headings.find(heading=>heading.index > chapter.index && heading[1].length <= chapter[1].length)?.index ?? raw.length;
    const body=raw.slice(chapter.index+chapter[0].length,end);
    const numbers=new Set([...body.matchAll(/^(?:#{1,6}\s+)?([1-9]\d*)[.)、]\s+/gm)].map(match=>Number(match[1])));
    if (!selector[2].split('/').every(number=>numbers.has(Number(number)))) return null;
  }
  return target+'#'+anchor;
}

function stepObligationDeclarations(materialRoot) {
  let raw;
  try { raw = readOriginal(materialRoot, "step-consumer-design.md"); }
  catch { return null; }
  const map = new Map(), malformed = new Set();
  for (const line of raw.split(/\r?\n/).filter(value => (value.includes("steps.json") || value.includes("skills/")) && value.trim().startsWith("|"))) {
    const source = line.match(/((?:workflows|skills)\/[^#>]+)#/)?.[1];
    const slug = source?.startsWith("skills/") ? line.match(/^\|\s*\[([^:\]]+):/)?.[1]?.trim() : line.match(/\]\([^)]*\)\s*`([^`]+)`/)?.[1] ?? line.match(/`([^`]+)`/)?.[1];
    if (!source || !text(slug)) continue;
    const key = `${source}\0${slug}`;
    const cells = line.split("|");
    const obligation = cells.slice(1, -1).find(cell => /\bhuman\b|\bprogram\b/i.test(cell))?.trim() ?? "";
    const hasHuman = /\bhuman\b/i.test(obligation), hasProgram = /\bprogram\b/i.test(obligation);
    const flags = hasHuman || hasProgram ? {human_required:hasHuman,program_required:hasProgram} : null;
    if (!flags || map.has(key) && JSON.stringify(map.get(key)) !== JSON.stringify(flags)) malformed.add(key);
    else map.set(key,flags);
  }
  return {map,malformed};
}

function methodObligationFlags(materialRoot, source, step, declarations) {
  if (source.startsWith("workflows/") || source.startsWith("skills/")) {
    const key = `${source}\0${step.step_slug}`;
    if (!declarations || declarations.malformed.has(key) || !declarations.map.has(key)) return {human_required:true,program_required:false,method_flags_unknown:true};
    return declarations.map.get(key);
  }
  const explicit = [step.human_required,step.program_required];
  if (explicit.some(value => value !== undefined)) {
    if (!explicit.every(value => typeof value === "boolean")) return {human_required:true,program_required:false,method_flags_unknown:true};
    return {human_required:step.human_required,program_required:step.program_required};
  }
  return {human_required:true,program_required:false};
}

function workflowReport(repo, taskPath, materialRoot, level, facts, actualCommands, read, limits) {
  const selected = [];
  const skillRows = new Map(), skillConflicts = new Set();
  const declarations = stepObligationDeclarations(materialRoot);
  const stages = WORKFLOW_STAGES;
  const actualStages = facts.filter(row=>row.record_kind === "stage").map(row=>({stage:row.stage,ref:"facts.jsonl"}));
  let portableUnknown=false;
  const terminalRefs=[...new Set(facts.flatMap(row=>[String(row.source??"").split(";")[0].trim(),...(row.evidence?.value??[]).map(entry=>entry.ref??entry.receipt_ref)]).filter(ref=>typeof ref === "string" && ref.startsWith("quality/evidence/portable-workflow-outcomes/build-prd/terminal/")))];
  for (const ref of terminalRefs) {
    const source=read(ref);
    let terminal;
    try { terminal=source.verified ? JSON.parse(source.raw) : null; } catch { terminal=null; }
    const start=Date.parse(terminal?.started_at),end=Date.parse(terminal?.completed_at);
    if (!terminal || terminal.record_kind !== "portable_workflow_terminal" || terminal.task_id !== facts[0]?.task_id || terminal.workflow !== "build-prd" || !["in-progress","succeeded","failed","unverified","blocked","abandoned"].includes(terminal.state) || !text(terminal.reason) || !Number.isFinite(start) || !Number.isFinite(end) || end < start || !Array.isArray(terminal.step_result_refs) || !terminal.step_result_refs.every(result=>read(result).verified)) { portableUnknown=true; limits.push(`${ref}: actual build-prd terminal invocation source is unavailable or identity invalid`); continue; }
    actualStages.push({stage:"build-prd",ref});
  }
  const stageScope = {actual:actualStages,verified:false,source_refs:["facts.jsonl"]};
  const loadedStages = new Set();
  const routeSources = [];
  for (const stage of stages) {
    if (stage === "build-prd" && !actualStages.some(row=>row.stage === stage)) continue;
    if (level.value !== "complex" && stage !== "make-decision" && stage !== "build-prd") continue;
    const rootSource = `workflows/${stage}/steps.json`;
    let root, source = rootSource;
    try {
      root = loadPortableWorkflowManifest({worktreeRoot:repo,workflow:stage,read:path=>readOriginal(repo,relative(repo,path))});
      if (stage === "make-decision" && level.value !== "complex") {
        const flow = root.flows?.[level.value];
        source = typeof flow === "string" ? flow : flow?.steps;
        if (!text(source) || !source.startsWith(`workflows/make-decision/flows/${level.value}/`)) throw Error("selected flow source is unavailable or outside the declared flow");
        root = loadPortableWorkflowManifest({worktreeRoot:repo,workflow:stage,read:()=>readOriginal(repo,source)});
      }
    } catch (error) { limits.push(`${rootSource}: ${error.message}`); continue; }
    loadedStages.add(stage);
    routeSources.push(source);
    for (const step of root.steps) {
      let ownerRef = step.observable_result.match(/判定消费[：:]\s*([^；;\n]+)/)?.[1]?.trim() ?? null;
      if (ownerRef) { const originalOwner=ownerRef; ownerRef=criterionRef(repo,originalOwner,source,limits); if (!ownerRef) limits.push(`${originalOwner}: owner 判据 anchor/定位未取得；交原方法reader`); }
      selected.push({...step,source,stage,route:level.value,owner_ref:ownerRef,...methodObligationFlags(materialRoot,source,step,declarations),applicability:"required"});
    }
    const dependencies = optional(repo,`workflows/${stage}/skill-deps.yaml`,limits);
    if (dependencies !== null) {
      let blocks;
      try {
        const declaration=yaml.load(dependencies);
        if (declaration?.stage !== stage || !Array.isArray(declaration.skills) || declaration.skills.some(item=>!text(item?.name) || !text(item.path) || !text(item.trigger) || !safeScopePath(item.path) || !item.path.startsWith("skills/")) || new Set(declaration.skills.map(item=>item.name.trim())).size !== declaration.skills.length) throw Error("stage/skills/name/path/trigger declaration invalid");
        blocks=declaration.skills;
      } catch (error) { limits.push(`workflows/${stage}/skill-deps.yaml: 技能声明未取得，${error.message}；不把坏源当空集合`); continue; }
      for (const {name,path,trigger} of blocks) {
        const executions = facts.filter(row=>row.record_kind === "stage" && row.stage === stage).flatMap(row=>(row.evidence?.value ?? []).filter(item=>item.skill_name === name.trim() && item.skill_path === path.trim() && item.trigger === trigger.trim()).map(item=>({item,source:row.source})));
        if (!executions.length) continue;
        read(path.trim());
        const key = `${path.trim()}\0${name.trim()}`;
        let group = skillRows.get(key);
        if (!group) {
          const flags = methodObligationFlags(materialRoot,path.trim(),{step_slug:name.trim()},declarations);
          const step = {source:path.trim(),step_slug:name.trim(),stage,route:level.value,owner_ref:path.trim(),...flags,applicability:"on_demand"};
          group = {step,observations:[]}; skillRows.set(key,group); selected.push(step);
        }
        group.observations.push(...executions.map(value=>({...value,stage})));
        const observations=group.observations.map(value=>value.item);
        for (const field of ["triggered","executed"]) group.step[field === "triggered" ? "trigger" : field] = observations.some(item=>item[field] === true) ? true : observations.every(item=>item[field] === false) ? false : undefined;
        group.step.rule_ref = observations.every(item=>text(item.rule_ref)) ? [...new Set(observations.map(item=>item.rule_ref))].join("; ") : undefined;
        if (new Set(executions.map(({item})=>JSON.stringify([item.triggered,item.executed,item.rule_ref]))).size > 1) skillConflicts.add(key);
        if (skillConflicts.has(key)) group.step.rule_ref = undefined;
        limits.push(`${path.trim()}#${name.trim()}: ${stage} 条件观察仅取对应stage；source ${executions.map(value=>value.source).join("; ")}；同source+slug合并实际观察，不增重复分母。`);
      }
    }
  }
  const declaredStages = level.value === "complex" ? [...FORMAL_DEVELOPMENT_STAGES] : [FORMAL_DEVELOPMENT_STAGES[0]];
  if (actualStages.some(row=>row.stage === "build-prd")) declaredStages.push("build-prd");
  const knownActual = [...new Set(actualStages.map(row=>row.stage))];
  stageScope.declared = declaredStages;
  stageScope.verified = !portableUnknown && level.declared === true && declaredStages.every(stage=>loadedStages.has(stage) && knownActual.includes(stage));
  stageScope.source_refs = ["facts.jsonl",...routeSources,...terminalRefs];
  if (!stageScope.verified) limits.push("阶段候选或实际行来源不充分；缺阶段行不推未调用，stage_skip_rate保持null");
  if (!selected.length) return {workflow_steps:[],workflow_metrics:null};
  const evidence = [...skillConflicts].map(key=>{const step=skillRows.get(key).step;return {source:step.source,step_slug:step.step_slug,conflict:true};});
  for (const row of facts) for (const entry of row.evidence?.value ?? []) {
    const command = actualCommands.find(item=>item.ref === (entry.receipt_ref ?? entry.ref));
    if (command && text(entry.source) && text(entry.step_slug)) evidence.push({source:entry.source,step_slug:entry.step_slug,program:command});
    const source = read(entry.ref);
    if (!source.verified) continue;
    const original = originalFields(source.raw);
    const declaredSource = entry.source ?? original.source, slug = entry.step_slug ?? original.step_slug;
    if (text(declaredSource) && text(slug) && original.source === declaredSource && original.step_slug === slug && selected.some(step=>step.source === declaredSource && step.step_slug === slug)) {
      evidence.push({source:declaredSource,step_slug:slug,human:{...original,ref:entry.ref,readable:true,verified:true}});
    } else limits.push(`${entry.ref}: human source/slug identity not established; original ref retained`);
  }
  const rows = evaluateWorkflowSteps({steps:selected,evidence,level,stageScope});
  return {workflow_steps:rows,workflow_metrics:summarizeWorkflow(rows,stageScope)};
}

export function runFinalChainCheck({taskPath,materialRoot} = {}) {
  const limits = [];
  let manifest;
  try {
    if (typeof taskPath !== "string" || !isAbsolute(taskPath)) throw Error("taskPath must be absolute");
    manifest = JSON.parse(readOriginal(taskPath,"task.json"));
    if (!object(manifest) || !text(manifest.task_id) || !/^[a-z0-9][a-z0-9._-]*$/i.test(manifest.task_id) || !isAbsolute(manifest.target_repo_root ?? "")) throw Error("task manifest identity or repository is invalid");
  } catch (error) { throw Error(`final-chain task.json is unreadable: ${join(String(taskPath),"task.json")}: ${error.message}`); }
  taskPath = resolve(taskPath);
  const taskId = manifest.task_id;
  if (materialRoot === undefined) {
    const candidates = [process.cwd(),manifest.target_repo_root].flatMap(root=>[join(root,"specs",taskId),join(root,"specs/archive",taskId)]);
    materialRoot = candidates.find(root=>{try{return lstatSync(root).isDirectory() && realpathSync(root) === root;}catch{return false;}}) ?? candidates[0];
  }
  if (!isAbsolute(materialRoot ?? "")) throw TypeError("final-chain materialRoot must be absolute");
  materialRoot = resolve(materialRoot);
  const read = (ref,sha) => readSource(ref,taskPath,materialRoot,limits,sha);
  const decisionLog = optional(materialRoot,"decision-log.md",limits) ?? "";
  const spec = optional(materialRoot,"spec.md",limits);
  const level = resolveLevel({decisionLog,levelDeclaration:levelInput(decisionLog,read,limits)});
  if (!level.declared) limits.push(...level.reasons);
  const facts = taskFacts(taskPath,taskId,limits);
  const materialSpecsAt = materialRoot.lastIndexOf(`${sep}specs${sep}`);
  const materialRepo = materialSpecsAt > 0 ? materialRoot.slice(0,materialSpecsAt) : manifest.target_repo_root;
  const allowedCwds = [...new Set([materialRepo,manifest.target_repo_root,manifest.workspace_root].filter(text).map(value=>resolve(value)))];
  const workspaceDeclarations=decisionLog.includes(taskId) ? decisionLog.split("\n").filter(line=>/认证\s*(?:worktree|工作区)/i.test(line)).map(line=>{
    const paths=[...line.matchAll(/(?:认证\s*)?(?:worktree|工作区)(?:\s*为|\s*[:：])?\s*`(\/[^`]+)`/gi)].map(match=>match[1]);
    const branches=[...line.matchAll(/(?:分支|branch)\s*`([^`]+)`/gi)].map(match=>match[1]);
    return {paths,valid:line.includes(manifest.baseline_commit) && branches.length === 1 && branches[0].endsWith(`/${taskId}`)};
  }).filter(row=>row.paths.length) : [];
  const historicalCwds=workspaceDeclarations.length && workspaceDeclarations.every(row=>row.valid) && new Set(workspaceDeclarations.flatMap(row=>row.paths)).size === 1 ? workspaceDeclarations[0].paths.slice(0,1) : [];
  const actualCommands = commands(facts,taskPath,materialRoot,limits,taskId,allowedCwds,historicalCwds);
  let repo = manifest.target_repo_root, changed = [], diff;
  const specsAt = materialRoot.lastIndexOf(`${sep}specs${sep}`);
  if (specsAt > 0) repo = materialRoot.slice(0,specsAt);
  try {
    repo = execFileSync("git",["rev-parse","--show-toplevel"],{cwd:materialRoot,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
    if (!text(manifest.baseline_commit) || manifest.baseline_commit.startsWith("-")) throw Error("baseline_commit unavailable or invalid");
    changed = execFileSync("git",["diff","--name-only","-z",`${manifest.baseline_commit}..HEAD`],{cwd:repo,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).split("\0").filter(Boolean);
    diff = {ref:`git:${manifest.baseline_commit}..HEAD`,command:`git diff --name-only -z ${manifest.baseline_commit}..HEAD`,exit_code:0,evidence_type:"command_exit",readable:true,verified:true,diff_verified:true,changed_files:changed};
  } catch (error) { limits.push(`环 7 当前实现 diff 未取得: ${error.message}`); }
  const phaseIndex = optional(materialRoot,"phases/index.md",limits);
  const phaseRefs = phaseIndex ? [...new Set(phaseIndex.split("\n").filter(line=>line.trim().startsWith("|")).flatMap(line=>[...line.matchAll(/`(phases\/P[1-9][0-9]*(?:-[^`/\\\n]+)?\.md)`/g)].map(match=>match[1])))] : [];
  const phases = phaseRefs.map(ref=>({ref,raw:optional(materialRoot,ref,limits)})).filter(item=>item.raw !== null);
  const missingPhases = phaseRefs.filter(ref=>!phases.some(phase=>phase.ref === ref));
  const sets = writeSets(spec ?? "",phases,missingPhases);
  if (diff) {
    diff.phase_write_set = sets.phaseWriteSet;
    diff.spec_write_set = sets.specWriteSet;
    diff.outside_write_set = Array.isArray(sets.phaseWriteSet) ? changed.filter(path=>!sets.phaseWriteSet.some(allowed=>scopeContains(allowed,path))) : null;
    if (diff.outside_write_set?.length) {
      diff.conflict = `baseline..HEAD 当前 diff 超出 Phase 声明写集: ${diff.outside_write_set.join(", ")}`;
      limits.push(`当前 baseline..HEAD 写集外路径单列（不合并来源）：${diff.outside_write_set.join(", ")}`);
    }
  }
  const rawRefs = [...names(materialRoot,"raw-requirements",limits).map(ref=>({root:materialRoot,ref})),...names(taskPath,"quality/evidence/raw-requirements",limits).map(ref=>({root:taskPath,ref}))];
  const exactRaw = exactRawSource(taskPath,manifest,materialRoot,repo,spec,decisionLog,limits);
  const rawEvidence = exactRaw ? [exactRaw.evidence].filter(item=>item.verified) : rawRefs.map(({root,ref})=>fileEvidence(ref,optional(root,ref,limits))).filter(item=>item.verified);
  const decisionCheck = decisionOriginal(actualCommands,materialRoot,decisionLog,limits,[materialRepo,manifest.target_repo_root],taskPath);
  const ordinaryContract = contractOriginal(facts,read,materialRoot,spec,phaseIndex,phases,limits,actualCommands);
  const review = currentReview(facts,taskPath,materialRoot,taskId,level,changed,limits,phaseRefs.map(ref=>ref.match(/\/P(\d+)/)?.[1]).filter(Boolean).map(id=>`P${id}`),phases,repo);
  const explicitResearchRefs = decisionLog.split("\n").filter(line=>/研究|调研|research/i.test(line)).flatMap(line=>[...line.matchAll(/`([^`\n]+\.md)`/g)].map(match=>plainRef(match[1]))).filter(ref=>ref.startsWith("quality/evidence/") || isAbsolute(ref) && inside(taskPath,ref));
  const researchRefs = [...new Set(explicitResearchRefs)];
  const researchSources = researchRefs.map(ref=>read(ref)).filter(source=>source.verified);
  const research=researchOriginal(researchRefs,read,actualCommands,limits,taskPath,materialRoot);
  if (!research.verified) for (const source of researchSources) limits.push(`${source.ref}: 研究原件 sha256 ${source.sha256}；实际来源、观察与覆盖结论未取得可靠读回，不能凭关键词或文件名完成环3。`);
  const table = tracking(spec ?? "");
  const tests = actualCommands.filter(row=>!row.command.includes("check-decision-log-chain") && !row.command.includes("validatePostPhaseContract") && !/\bgh\s+pr\s+view\b/.test(row.command));
  const phaseGates = phases.flatMap(({raw})=>[...raw.matchAll(/\*\*gate_cmd\*\*\s*[:：]\s*`([^`]+)`/g)].map(match=>match[1]));
  const test = tests.filter(row=>/\b(?:vitest|pytest|jest|mocha)\b|\bnode["']?\s+--test\b|\bnpm\s+(?:run\s+)?test\b/.test(row.command) || phaseGates.includes(row.command)).at(-1);
  const deliveryBody = section(decisionLog,"交付声明");
  let declaredDelivery;
  if (/明确不做|不做.*交付|不提交.*PR/i.test(deliveryBody)) declaredDelivery = false;
  else if (/声明要做|要做.*交付|提交\s*PR/i.test(deliveryBody)) declaredDelivery = true;
  const delivery = deliveryInput(facts,taskId,read,actualCommands,declaredDelivery,limits,repo,historicalCwds,manifest.target_repo_root);
  const rings = {
    1:rawEvidence[0] ? {...rawEvidence[0],basis:rawEvidence} : {readable:false,unavailable:true},
    2:decisionCheck,
    3:research,
    4:spec === null ? {readable:false,unavailable:true} : {...fileEvidence("spec.md",spec),rows:table,rows_readable:true},
    5:spec === null || !ordinaryContract || ordinaryContract.unavailable ? {readable:false,unavailable:true} : {...fileEvidence("spec.md",spec),nonempty:spec.trim().length>0,scan_count:ordinaryContract.scan_count,required_sections_present:["功能需求","验收流程","测试标准","架构边界"].every(title=>spec.includes(title)),contract_ok:ordinaryContract.contract_ok,basis:[fileEvidence("spec.md",spec),ordinaryContract]},
    6:phaseIndex === null ? {readable:false,unavailable:true} : {...fileEvidence("phases/index.md",phaseIndex),phase_refs:phaseRefs},
    7:diff ?? {readable:false,unavailable:true},8:test ?? {readable:false,unavailable:true},9:review,
  };
  if (delivery.conflict && delivery.pr?.verified) rings[10]={...delivery.pr,conflict:delivery.conflict};
  const unknown = section(decisionLog,"未决项");
  const bundle = {task_id:taskId,rings,...sets,directionChangingUnknown:/无真实未知|无未决|全部已解决/.test(unknown) ? false : unknown.trim() ? true : undefined,delivery};
  for (const [number,item] of Object.entries(rings)) {
    if (item.verified && text(item.ref) && !item.ref.startsWith("git:")) rings[number] = checkedOriginal(item,taskId,taskPath,materialRoot,limits,`ring-${number}`,number === "1" ? exactRaw?.scope : undefined);
  }
  const results = RINGS.map(({ring})=>evaluateRing(bundle,ring,level));
  const statuses = {completed:"completed",skipped:"in-progress",incomplete:"failed",unavailable:"unverified"};
  const chain = stateForStepResults(results.filter(row=>row.state !== "not_applicable").map(row=>({step_slug:`ring-${row.ring}`,status:statuses[row.state]})));
  if (review.unavailable || results[8].state === "unavailable") limits.push("环 9 不可机判：整次实现/交付身份、当前 diff 或真实 provider 原件未取得；交独立审查 reader");
  const mergeDeclared = facts.some(row=>row.record_kind === "close_action" && row.close_action?.action === "merge" && text(row.close_action.result));
  if (specsAt > 0) limits.push(mergeDeclared ? "已记录任务 merge 事实；已合并主仓的 baseline..HEAD 可能含后续提交，只按任务相关路径读回；此视野限制不缩减 outside 清单。" : "baseline..HEAD 是当前材料仓库视野，可能含后续变化；未取得任务合并事实，不据路径推断历史交付。");
  const workflow = workflowReport(repo,taskPath,materialRoot,level,facts,actualCommands,read,limits);
  return {schema_version:"1.0.0",task_id:taskId,baseline_commit:manifest.baseline_commit ?? null,material_root:materialRoot,level,rings:results,...summarize(results),limits:[...new Set(limits)],chain_state:chain.state,...workflow};
}
