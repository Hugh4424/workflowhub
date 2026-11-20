#!/usr/bin/env node
// Private read-only content checker for the cockpit page. It re-derives the
// model from the authenticated task and names every mismatch. Two modes:
//   - candidate: validate the pair about to be published (prepublish gate);
//   - existing files: validate the published pair and detect staleness by the
//     recorded source fingerprint, never by file modification time.
// It is not a public command and it never writes a page.
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, isAbsolute } from 'node:path';
import { buildPageData } from './build-page-data.mjs';

const USAGE = 'usage: --task-path <root> --report <report> [--material-root <dir>] [--html-path <file> --nodes-path <file>]';
const TITLE_BAD = /^缺[：:]|未取得/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
const TONES = new Set(['ok', 'accent', 'fail', 'unk']);
const digest = value => createHash('sha256').update(value).digest('hex');
const parseData = html => JSON.parse(/const DATA = (\{[\s\S]*?\n?\});/.exec(html ?? '')?.[1]);
const sidecarNodes = objects => [...new Set(objects.map(o => o.kind))].map(kind => ({
  stable_id: `kind:${kind}`,
  content_digest: digest(JSON.stringify(objects.filter(o => o.kind === kind).map(({ src, contentDigest, ...content }) => content))),
}));

// The model projection the page must show; presentation decorations are ignored.
// A report file path is provenance for the same rings, not new page content: the
// renderer already treats immutable-reference drift as no substantive change,
// and the fingerprint gate below compares report content by its rings hash. So
// pr sources compare by their recorded location, while a different report
// content still fails STALE_PAGE / the pr status projection.
const projectedSource = (object, source) => object.kind === 'pr' ? [source.loc] : [source.path, source.loc];

function modelProjection(data) {
  return {
    task: data.task,
    taskIdentity: data.taskIdentity,
    stageLabel: data.stageLabel,
    sourceDir: data.sourceDir,
    edges: data.edges,
    sideEdges: data.sideEdges,
    phaseTasks: data.phaseTasks,
    progress: data.progress,
    objects: (data.objects ?? []).map(object => ({
      id: object.id, kind: object.kind, source_id: object.source_id ?? null, title: object.title,
      ac_ids: object.ac_ids ?? null,
      status: object.status ?? null, implementation: object.implementation ?? null, acceptance: object.acceptance ?? null,
      level: object.level?.value ?? null, level_reason: object.level?.reason ?? null,
      src: (object.src ?? []).map(source => projectedSource(object, source)),
    })),
  };
}

export async function checkPageContent({ taskPath, reportPath, materialRoot, htmlPath, nodesPath, candidate, callerFingerprint }) {
  // Caller-supplied models cannot be compared with current materials; they still
  // pass structure/source/pointer checks and their own report/decision fingerprint.
  const derived = callerFingerprint ? null : await buildPageData({ taskPath, reportPath });
  const { report, contractErrors, contractFacts, sourceFingerprint } = derived ?? {};
  let pageData = derived?.pageData ?? candidate?.pageData ?? null;
  if (!pageData && htmlPath) { try { pageData = parseData(readFileSync(htmlPath, 'utf8')); } catch { /* reported as unreadable HTML below */ } }
  const errors = [], warnings = [];
  const add = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });
  // Materials claiming the authoritative post contract block publication on any
  // contract error; legacy materials keep the same errors as named gaps.
  for (const error of contractErrors ?? []) add('CONTRACT', error);
  const material = materialRoot
    ? (isAbsolute(materialRoot) ? materialRoot : resolve(taskPath, materialRoot))
    : pageData?.sourceDir;
  if (!pageData?.task || TITLE_BAD.test(pageData.task)) add('TITLE_UNSTABLE', `页面任务标题不成立：${pageData?.task || '空'}`);

  // Structure, source, pointer, level and model reconciliation for one model.
  function inspectModel(data, label) {
    const missing = [];
    if (!data || typeof data !== 'object') { add('STRUCTURE_MISSING', `${label} 不是对象`); return; }
    for (const key of ['task', 'taskIdentity', 'stageLabel', 'sourceDir']) if (typeof data[key] !== 'string' || !data[key].trim()) missing.push(key);
    if (typeof data.hasPhase !== 'boolean') missing.push('hasPhase');
    if (!Array.isArray(data.stages) || data.stages.length === 0) missing.push('stages');
    if (!Array.isArray(data.objects) || data.objects.length === 0) missing.push('objects');
    for (const key of ['edges', 'sideEdges']) if (!Array.isArray(data[key])) missing.push(key);
    if (!data.phaseTasks || typeof data.phaseTasks !== 'object' || Array.isArray(data.phaseTasks)) missing.push('phaseTasks');
    if (!data.progress || !Array.isArray(data.progress.reqIds) || !Array.isArray(data.progress.unlinkedTaskIds)) missing.push('progress');
    if (missing.length) { add('STRUCTURE_MISSING', `${label} 缺必要结构：${missing.join('、')}`); return; }
    const ids = new Set();
    for (const object of data.objects) {
      if (!object || !SAFE_ID.test(object.id ?? '') || ids.has(object.id)) { add('STRUCTURE_MISSING', `${label} 对象 id 缺失、含非法字符或重复：${object?.id ?? '空'}`); continue; }
      ids.add(object.id);
      if (!Array.isArray(object.src) || object.src.length === 0) { add('STRUCTURE_MISSING', `${object.id} 没有来源指针`); continue; }
      if (object.status !== undefined && (!object.status || typeof object.status.text !== 'string' || !TONES.has(object.status.tone))) add('STRUCTURE_MISSING', `${object.id} 的状态缺文字或未知 tone`);
      for (const source of object.src) {
        if (!source?.path || !isAbsolute(source.path)) continue;
        if (!existsSync(source.path)) add('MISSING_SOURCE', `${object.id} 的声明原件不可读：${source.path}`);
      }
    }
    for (const pair of [...data.edges, ...data.sideEdges]) {
      if (!Array.isArray(pair) || pair.length !== 2 || pair.some(id => !ids.has(id))) add('POINTER_MISMATCH', `${label} 关系指向未声明对象：${JSON.stringify(pair)}`);
    }
    for (const [phase, tasks] of Object.entries(data.phaseTasks)) {
      if (!ids.has(phase)) { add('POINTER_MISMATCH', `${label} 阶段指针未声明：${phase}`); continue; }
      if (!Array.isArray(tasks)) { add('POINTER_MISMATCH', `${label} 阶段 ${phase} 的 Task 列表不是数组`); continue; }
      for (const id of tasks) {
        const task = data.objects.find(object => object.id === id);
        if (!task || task.kind !== 'task' || task.phase !== phase) add('POINTER_MISMATCH', `${label} 阶段 ${phase} 的 Task 指针不一致：${id}`);
      }
    }
    for (const id of [...data.progress.reqIds, ...data.progress.unlinkedTaskIds]) if (!ids.has(id)) add('POINTER_MISMATCH', `${label} 进展指针未声明：${id}`);
    for (const id of [data.currentObjectId, data.initialSelection]) if (id && id !== 'progress' && !ids.has(id)) add('POINTER_MISMATCH', `${label} 选中对象未声明：${id}`);
    for (const chip of data.changedChips ?? []) if (!chip || !SAFE_ID.test(chip.id ?? '') || (!ids.has(chip.id) && !/^ring:\d+$/.test(chip.id))) add('POINTER_MISMATCH', `${label} 变化标记指向未声明对象：${chip?.id ?? '空'}`);
    // A level is displayed only from its declared source; caller models are exempt
    // from the derived-level comparison because they are not derived from materials.
    if (derived) {
      const derivedLevels = new Map((pageData.objects ?? []).filter(o => o.kind === 'acc').map(o => [o.source_id, o.level?.value ?? 'unknown']));
      for (const object of data.objects.filter(o => o.kind === 'acc')) {
        const expected = derivedLevels.get(object.source_id);
        if (expected !== undefined && (object.level?.value ?? 'unknown') !== expected) add('LEVEL_MISMATCH', `${object.source_id} 的级别显示 ${object.level?.value ?? 'unknown'} 与来源 ${expected} 不一致`);
        if (object.level && !['unknown', ...new Set(derivedLevels.values())].includes(object.level.value)) add('LEVEL_MISMATCH', `${object.source_id} 的级别 ${object.level.value} 没有来源`);
      }
    }
    if (derived) {
      // The declared Phase contract and the page must count the same tasks.
      if (!(contractErrors ?? []).length && Number.isInteger(contractFacts?.task_count) && contractFacts.task_count > 0) {
        const projected = (data.objects ?? []).filter(object => object.kind === 'task').length;
        if (projected !== contractFacts.task_count) add('POINTER_MISMATCH', `Phase 契约声明 ${contractFacts.task_count} 个 Task，页面显示 ${projected} 个`);
      }
      const expected = modelProjection(pageData), actual = modelProjection(data);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        const byId = new Map(expected.objects.map(o => [o.id, JSON.stringify(o)]));
        const actualById = new Map(actual.objects.map(o => [o.id, JSON.stringify(o)]));
        for (const id of expected.objects.map(o => o.id)) if (!actualById.has(id)) add('MODEL_MISMATCH', `${label} 缺派生对象 ${id}`);
        for (const id of actual.objects.map(o => o.id)) if (!byId.has(id)) add('MODEL_MISMATCH', `${label} 多出对象 ${id}`);
        for (const [id, value] of actualById) if (byId.has(id) && byId.get(id) !== value) add('MODEL_MISMATCH', `${label} 对象 ${id} 与当前材料派生结果不一致`);
        for (const key of ['task', 'taskIdentity', 'stageLabel', 'sourceDir', 'edges', 'sideEdges', 'phaseTasks', 'progress']) {
          if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) add('MODEL_MISMATCH', `${label} 的 ${key} 与当前材料派生结果不一致`);
        }
        if (!errors.some(error => error.code === 'MODEL_MISMATCH')) add('MODEL_MISMATCH', `${label} 与当前材料派生结果不一致`);
      }
    }
  }

  // A sidecar node is only a summary when it names a kind/ring and carries a digest;
  // missing expected kind/ring summaries fail instead of passing as an absent node.
  function inspectSidecarNodes(nodes,label,reportForNodes){
    if(!Array.isArray(nodes)||!nodes.length){add('SIDECAR_MISMATCH',`${label} 缺 nodes`);return;}
    for(const node of nodes)if(!node||typeof node.stable_id!=='string'||typeof node.content_digest!=='string'||!/^(kind|ring):/.test(node.stable_id))add('SIDECAR_MISMATCH',`${label} 节点缺摘要或 kind：${node?.stable_id??'空'}`);
    if(derived){for(const kind of new Set(pageData.objects.map(o=>o.kind)))if(!nodes.some(node=>node.stable_id===`kind:${kind}`))add('SIDECAR_MISMATCH',`${label} 缺 kind 节点摘要：kind:${kind}`);}
    for(const ring of reportForNodes?.rings??[])if(!nodes.some(node=>node.stable_id===`ring:${ring.ring}`))add('SIDECAR_MISMATCH',`${label} 缺 ring 节点摘要：ring:${ring.ring}`);
  }
  let callerReport=null;
  if(callerFingerprint&&reportPath){try{callerReport=JSON.parse(readFileSync(reportPath,'utf8'));}catch{/* an unreadable caller report is reported below */}}

  // Package reconciliation is one fact about the derived model, not a fact per view.
  for (const issue of pageData?.packageReconciliation?.issues ?? []) add('PACKAGE_RECONCILE', issue);
  const counters = pageData?.packageReconciliation;
  if (counters && counters.declared && counters.projected !== counters.declared) add('PACKAGE_RECONCILE', `包目录声明 ${counters.declared} 个，页面只投 ${counters.projected} 个`);
  // F2: the full Appendix A census must bind every acceptance to a package.
  if (pageData?.packageReconciliation) for (const object of pageData.objects.filter(o => o.kind === 'acc')) if (!object.owners?.length) add('AC_UNBOUND', `验收 ${object.source_id} 未挂到任何包`);

  // The recorded fingerprint wraps the material hash map; compare that map.
  const sameFingerprint = recorded => callerFingerprint
    ? JSON.stringify(recorded) === JSON.stringify(callerFingerprint)
    : JSON.stringify(recorded?.materials ?? recorded) === JSON.stringify(sourceFingerprint)
      && (recorded?.report_rings_sha256 === undefined || recorded.report_rings_sha256 === sourceFingerprint.report_rings_sha256);

  // Existing published pair: consistency between the two files, then staleness.
  function inspectPair(data, sidecar) {
    if (JSON.stringify(data.ringNodes) !== JSON.stringify(sidecar.nodes)) add('POINTER_MISMATCH', 'HTML ringNodes 与侧车 nodes 计数或指针不一致');
    if (callerFingerprint) {
      if (JSON.stringify(sidecar.source_fingerprint) !== JSON.stringify(callerFingerprint)) add('SIDECAR_MISMATCH', '侧车指纹与调用方指纹不一致');
      if (typeof data.provenance !== 'string' || !data.provenance.includes(`生成=${sidecar.generated_at}`)) add('SIDECAR_MISMATCH', 'HTML provenance 未承接侧车生成时间');
      return;
    }
    if (JSON.stringify(data.sourceFingerprint) !== JSON.stringify(sidecar.source_fingerprint)) add('SIDECAR_MISMATCH', 'HTML 指纹与侧车指纹不一致');
    if (typeof data.provenance !== 'string' || !data.provenance.includes(`生成=${sidecar.generated_at}`)) add('SIDECAR_MISMATCH', 'HTML provenance 未承接侧车生成时间');
    const oldFingerprint = data.sourceFingerprint?.materials ?? data.sourceFingerprint;
    if (!oldFingerprint || typeof oldFingerprint !== 'object') { add('SIDECAR_MISMATCH', '页面没有来源指纹，无法判过期'); return; }
    const changed = [...new Set([...Object.keys(oldFingerprint), ...Object.keys(sourceFingerprint)])]
      .filter(key => JSON.stringify(oldFingerprint[key]) !== JSON.stringify(sourceFingerprint[key]));
    if (changed.length) add('STALE_PAGE', `材料在页面生成后变化，页面需标过期：${changed.map(key => key.replace(/^.*[\\/](?=[^\\/]+$)/, '')).slice(0, 8).join('、')}`);
  }

  if (candidate) {
    inspectModel(candidate.pageData, '候选模型');
    const html = typeof candidate.html === 'string' ? candidate.html : candidate.html?.toString('utf8');
    const sidecarText = typeof candidate.nodes === 'string' ? candidate.nodes : JSON.stringify(candidate.nodes);
    let sidecar;
    try { sidecar = JSON.parse(sidecarText); } catch { add('STRUCTURE_MISSING', '候选侧车不是可读 JSON'); }
    let data;
    try { data = parseData(html); } catch { add('STRUCTURE_MISSING', '候选 HTML 的 DATA 不可解析'); }
    if (data) {
      inspectModel(data, '候选 HTML');
      for (const id of (data.objects ?? []).map(o => o.id)) if (id.startsWith('ring:')) add('STRUCTURE_MISSING', `候选 HTML 把环当成业务对象：${id}`);
    }
    if (sidecar) {
      inspectSidecarNodes(sidecar.nodes,'候选侧车',derived?report:callerReport);
      if (!sameFingerprint(sidecar.source_fingerprint)) add('FINGERPRINT_MISMATCH', '候选侧车指纹与当前材料派生指纹不一致');
      if (data && JSON.stringify(data.ringNodes) !== JSON.stringify(sidecar.nodes)) add('POINTER_MISMATCH', '候选 HTML ringNodes 与侧车 nodes 不一致');
      if (data && derived) {
        const expected = new Map(sidecarNodes(pageData.objects).map(node => [node.stable_id, node.content_digest]));
        for (const node of sidecar.nodes) {
          if (expected.has(node.stable_id) && expected.get(node.stable_id) !== node.content_digest) add('POINTER_MISMATCH', `候选侧车节点摘要与模型不一致：${node.stable_id}`);
        }
      }
      if (sidecar.task !== undefined && sidecar.task !== pageData.task) add('SIDECAR_MISMATCH', '侧车任务与 pageData 不一致');
    }
  }

  if (htmlPath) {
    if (!existsSync(htmlPath)) add('MISSING_HTML', `页面 HTML 不可读：${htmlPath}`);
    else {
      let data;
      try { data = parseData(readFileSync(htmlPath, 'utf8')); inspectModel(data, '已发布 HTML'); }
      catch (error) { add('STRUCTURE_MISSING', `已发布 HTML 的 DATA 不可解析：${error.message}`); }
      if (nodesPath) {
        if (!existsSync(nodesPath)) add('MISSING_SIDECAR', `页面侧车不可读：${nodesPath}`);
        else {
          try {
            const sidecar = JSON.parse(readFileSync(nodesPath, 'utf8'));
            if (sidecar.task !== undefined && sidecar.task !== pageData.task) add('SIDECAR_MISMATCH', '侧车任务与 pageData 不一致');
            if (sidecar.stage !== undefined && sidecar.stage !== pageData.stageLabel) add('SIDECAR_MISMATCH', '侧车阶段与 pageData 不一致');
            inspectSidecarNodes(sidecar.nodes,'已发布侧车',derived?report:callerReport);
            if (data) inspectPair(data, sidecar);
          } catch { add('SIDECAR_MISMATCH', `侧车 JSON 不可读：${nodesPath}`); }
        }
      }
    }
  }

  const latest = (() => {
    try {
      const rows = readFileSync(join(taskPath, 'facts.jsonl'), 'utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
      return rows.filter(row => typeof row.stage === 'string').at(-1) ?? null;
    } catch { return null; }
  })();
  // Only a current phase cursor is comparable; a bare stage row cannot tell
  // which phase the page label should name.
  if (derived && latest?.phase_id && !String(pageData?.stageLabel ?? '').includes(latest.phase_id)) {
    add('STALE_STAGE', `页面阶段 ${pageData.stageLabel} 与当前游标 ${latest.phase_id} 不一致`);
  }
  const commands = new Map();
  for (const ring of report?.rings ?? []) {
    for (const test of ring.tests ?? []) {
      const key = String(test.command ?? '');
      if (!key) continue;
      const exits = commands.get(key) ?? new Set();
      exits.add(Number(test.exit_code));
      commands.set(key, exits);
    }
  }
  for (const [command, exits] of commands) if (exits.has(0) && [...exits].some(exit => exit !== 0)) add('COMMAND_CONFLICT', `同一命令既有红又有绿：${command}`);
  const index = (() => { try { return readFileSync(join(material, 'phases/index.md'), 'utf8'); } catch { return ''; } })();
  const ring6 = report?.rings?.find(ring => ring.ring === 6);
  for (const scope of ring6?.write_set ?? []) {
    if (typeof scope !== 'string' || !index.includes(scope.replace(/[*].*$/, ''))) add('WRITESET_FAKE', `环6写集不在当前索引：${scope}`);
  }
  return { ok: errors.length === 0, errors, warnings, stage: pageData?.stageLabel ?? null, task: pageData?.task ?? null, mode: callerFingerprint ? 'caller' : 'derived', checks: { structure: true, sources: true, pointers: true, pair_fingerprint: true, derived_model: Boolean(derived), contract: Boolean(derived), level: Boolean(derived) }, fingerprint_checked: Boolean(derived), pair_fingerprint_checked: true };
}

export async function main(argv = process.argv.slice(2)) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    if (!['--task-path', '--report', '--material-root', '--html-path', '--nodes-path'].includes(key) || argv[index + 1] === undefined) throw new Error(USAGE);
    values[key.slice(2)] = argv[index + 1];
  }
  if (!values['task-path'] || !values.report) throw new Error(USAGE);
  const result = await checkPageContent({ taskPath: resolve(values['task-path']), reportPath: resolve(values.report), materialRoot: values['material-root'], htmlPath: values['html-path'] ? resolve(values['html-path']) : undefined, nodesPath: values['nodes-path'] ? resolve(values['nodes-path']) : undefined });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
  return result;
}

if (process.argv[1] && import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 2; });
}
