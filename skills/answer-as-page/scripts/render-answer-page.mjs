#!/usr/bin/env node
import { readFileSync, mkdirSync, lstatSync, unlinkSync, realpathSync } from 'node:fs';
import { resolve, basename, dirname, join, relative, isAbsolute, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { writeFileAtomic, createFileOnce } from '../../../runtime/interface/safe-write.mjs';
import { withLock } from '../../../runtime/interface/record-lock.mjs';
import { openTask } from '../../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../../runtime/task/workspace.mjs';
import { buildPageData } from './build-page-data.mjs';
import { openInSystemBrowser } from './open-page.mjs';
import { RING_STATES } from '../../../runtime/task/final-chain.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const templatePath = resolve(dirname(fileURLToPath(import.meta.url)), '../templates/overview-template.html');
const sameIdentity = (a, b) => a?.dev === b?.dev && a?.ino === b?.ino;

function observedFile(path) {
  let stat;
  try { stat = lstatSync(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink()) throw Error(`output must be a regular file: ${path}`);
  const bytes = readFileSync(path);
  if (!sameIdentity(stat, lstatSync(path))) throw Error(`output changed while reading: ${path}`);
  return { stat, bytes };
}

export function buildNodesSidecar({ rings, sourceFingerprint, objects, now = new Date() }) {
  return {
    schema: 'answer-page-nodes.v1', generated_at: new Date(now).toISOString(), source_fingerprint: sourceFingerprint,
    nodes: [...rings.map(ring => ({ stable_id: `ring:${ring.ring}`, content_digest: digest(JSON.stringify(ring)) })),
      ...objects ? [...new Set(objects.map(o => o.kind))].map(kind => ({ stable_id: `kind:${kind}`, content_digest: digest(JSON.stringify(objects.filter(o => o.kind === kind).map(({ src, ...content }) => content))) })) : []],
  };
}

function callerData(pageData, vocabulary, rings) {
  if (!pageData || typeof pageData !== 'object'
      || !['task', 'taskIdentity', 'stageLabel', 'sourceDir'].every(key => typeof pageData[key] === 'string' && pageData[key].trim())
      || !Array.isArray(pageData.stages) || pageData.stages.length === 0
      || typeof pageData.hasPhase !== 'boolean'
      || !['objects', 'edges', 'sideEdges', 'changedChips', 'initialChanged'].every(key => Array.isArray(pageData[key]))
      || !pageData.phaseTasks || !pageData.progress || !Array.isArray(pageData.progress.reqIds)
      || !Array.isArray(pageData.progress.unlinkedTaskIds)) {
    throw Error('pageData requires complete caller task, stages, objects, edges, phaseTasks and progress');
  }
  const safeId = id => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(id) && !['__proto__', 'prototype', 'constructor'].includes(id);
  for (const stage of pageData.stages) {
    if (!stage || !['name', 'hint', 'state'].every(key => typeof stage[key] === 'string' && stage[key].trim())) throw Error('pageData stages require real name, hint and state');
    if (!['done', 'now', 'todo'].includes(stage.state)) throw Error('pageData stage state must be done/now/todo');
  }
  const ids = new Set();
  for (const object of pageData.objects) {
    if (!object || !safeId(object.id) || ids.has(object.id) || object.id.startsWith('ring:')
        || !Object.hasOwn(vocabulary.kinds, object.kind) || typeof object.title !== 'string'
        || typeof object.short !== 'string' || !object.short.trim()
        || ['phase', 'risk'].includes(object.kind) && typeof object.label !== 'string'
        || ['items', 'plan'].some(key => object[key] !== undefined && !Array.isArray(object[key]))
        || !Array.isArray(object.src) || object.src.length === 0) throw Error('pageData objects require unique real ids, known kinds, title/short, phase labels and source refs');
    if (object.status !== undefined && (!object.status || typeof object.status !== 'object' || Array.isArray(object.status)
        || typeof object.status.text !== 'string' || !['ok', 'accent', 'fail', 'unk'].includes(object.status.tone))) throw Error('pageData status requires text and known tone');
    ids.add(object.id);
  }
  for (const object of pageData.objects) {
    if (object.phase !== undefined && (!safeId(object.phase) || !pageData.objects.some(o => o.id === object.phase && o.kind === 'phase'))) throw Error('pageData phase references an undeclared phase');
  }
  const displayIds = new Set([...ids, ...rings.map(r => `ring:${r.ring}`)]);
  if (pageData.initialChanged.some(id => !safeId(id) || !displayIds.has(id))
      || pageData.changedChips.some(chip => !chip || !safeId(chip.id) || !displayIds.has(chip.id))) throw Error('pageData changed references must name actual objects or report rings');
  for (const pair of [...pageData.edges, ...pageData.sideEdges]) {
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some(id => !safeId(id) || !ids.has(id))) throw Error('pageData edge references an undeclared object');
  }
  for (const [phase, tasks] of Object.entries(pageData.phaseTasks)) {
    if (!pageData.objects.some(o => o.id === phase && o.kind === 'phase') || !Array.isArray(tasks)
        || tasks.some(id => !pageData.objects.some(o => o.id === id && o.kind === 'task' && o.phase === phase))) {
      throw Error('pageData phaseTasks must preserve actual task-to-phase links');
    }
  }
  if (pageData.progress.reqIds.some(id => !pageData.objects.some(o => o.id === id && o.kind === 'req'))
      || pageData.progress.unlinkedTaskIds.some(id => !pageData.objects.some(o => o.id === id && o.kind === 'task'))) {
    throw Error('pageData progress must reference declared requirements and tasks');
  }
  return structuredClone(pageData);
}

// One caller-owned pair under the existing local lock. No new transaction state.
async function publishPair(directory, htmlName, html, nodesName, nodes, preserveHistory = false, taskOutput) {
  return withLock(directory, `answer-page-${digest(htmlName).slice(0, 16)}`, async () => {
    const write = (name, bytes) => taskOutput
      ? taskOutput.writeRecordAtomic(relative(taskOutput.taskPath, join(directory, name)), bytes)
      : writeFileAtomic(directory, name, bytes);
    const create = (name, bytes) => taskOutput
      ? taskOutput.createRecord(relative(taskOutput.taskPath, join(directory, name)), bytes)
      : createFileOnce(directory, name, bytes);
    const files = [
      { name: nodesName, bytes: Buffer.from(nodes) },
      { name: htmlName, bytes: Buffer.from(html) },
    ];
    // Reject aliases/directories and read both old versions before either publication.
    for (const file of files) file.before = observedFile(join(directory, file.name));
    let baselineConsistent = false;
    if (files.every(file => file.before)) {
      try {
        const oldSidecar = JSON.parse(files[0].before.bytes.toString('utf8'));
        const oldMatch = files[1].before.bytes.toString('utf8').match(/const DATA = (\{[\s\S]*?\n?\});/);
        const oldData = JSON.parse(oldMatch?.[1]);
        baselineConsistent = JSON.stringify(oldData.ringNodes) === JSON.stringify(oldSidecar.nodes)
          && JSON.stringify(oldData.sourceFingerprint) === JSON.stringify(oldSidecar.source_fingerprint)
          && typeof oldData.provenance === 'string' && oldData.provenance.includes(`生成=${oldSidecar.generated_at}`);
      } catch { /* Invalid old comparison bytes remain history; refresh reports the missing baseline. */ }
    }
    const history = [];
    if (preserveHistory && files.some(file => file.before && !file.before.bytes.equals(file.bytes))) {
      for (const file of files) {
        if (!file.before) continue;
        const extension = extname(file.name);
        const name = `${file.name.slice(0, -extension.length)}.history-${digest(file.before.bytes)}${extension}`;
        const previous = observedFile(join(directory, name));
        if (previous && !previous.bytes.equals(file.before.bytes)) throw Error(`history content differs: ${name}`);
        if (!previous) await create(name, file.before.bytes);
        history.push(join(directory, name));
      }
    }
    try {
      for (const file of files) {
        file.attempted = true;
        await write(file.name, file.bytes);
        file.published = observedFile(join(directory, file.name));
        if (!file.published?.bytes.equals(file.bytes)) throw Error(`output readback differs: ${file.name}`);
      }
    } catch (error) {
      const failures = [];
      for (const file of [...files].reverse()) {
        if (!file.attempted) continue;
        try {
          const current = observedFile(join(directory, file.name));
          if (!current && !file.before) continue;
          if (current && file.before && sameIdentity(current.stat, file.before.stat) && current.bytes.equals(file.before.bytes)) continue;
          // Never replace another writer's newer identity/bytes during recovery.
          if (!current || !current.bytes.equals(file.bytes)
              || file.published && !sameIdentity(current.stat, file.published.stat)) throw Error(`recovery preserves changed output: ${file.name}`);
          if (file.before) await write(file.name, file.before.bytes);
          else {
            if (!sameIdentity(current.stat, lstatSync(join(directory, file.name)))) throw Error(`recovery identity changed: ${file.name}`);
            unlinkSync(join(directory, file.name));
          }
        } catch (failure) { failures.push(failure); }
      }
      if (failures.length) throw new AggregateError([error, ...failures], `${error.message}; pair recovery incomplete: ${failures.map(e => e.message).join('; ')}`);
      throw error;
    }
    return { history, previousNodes: files[0].before?.bytes.toString('utf8') ?? null, hadHtml: Boolean(files[1].before), baselineConsistent };
  });
}

export async function renderAnswerPage({ taskPath, reportPath, decisionLogPath, pageData, outDir, htmlName, open, now = new Date() } = {}) {
  let derived, taskOutput;
  if (pageData === undefined && taskPath) {
    derived = await buildPageData({ taskPath, reportPath });
    pageData = derived.pageData;
    decisionLogPath = derived.decisionLogPath;
    if (outDir) {
      const within = (root, path) => { const rel = relative(root, resolve(path)); return rel === '' || rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };
      taskOutput = openTask(resolve(taskPath), derived.taskIdentity);
      if (!within(join(taskOutput.taskPath,'quality/evidence'),outDir) || within(derived.workspaceRoot, outDir) || within(taskOutput.manifest.target_repo_root,outDir) || within(join(taskPath,'quality/evidence/research'),outDir)) {
        throw Error('derived output must remain in authenticated task quality/evidence outside repository and research sources');
      }
    }
  }
  if (!reportPath || !decisionLogPath || !outDir || !htmlName || basename(htmlName) !== htmlName || !htmlName.endsWith('.html')) {
    throw Error('report, decision-log, out-dir and plain .html filename are required');
  }
  let raw;
  try { raw = readFileSync(reportPath); }
  catch (error) { throw Error(`report 读取失败: ${error.message}`); }
  const report = JSON.parse(raw);
  if (!Array.isArray(report.rings) || report.rings.length === 0 || report.rings.length > 10
      || report.rings.some(r => !Number.isInteger(r.ring) || r.ring < 1 || r.ring > 10)
      || new Set(report.rings.map(r => r.ring)).size !== report.rings.length) throw Error('report rings[] must contain unique numbered rings 1–10');
  const decision = derived?.decisionMissing ? null : readFileSync(decisionLogPath), template = readFileSync(templatePath, 'utf8');
  const match = template.match(/const DATA = (\{[\s\S]*?\n\});/);
  if (!match) throw Error('template DATA replacement unavailable');
  // Evaluate repository-owned presentation vocabulary only, never caller input.
  const vocabulary = runInNewContext(`(${match[1]})`, {}, { timeout: 1000 });
  const content = callerData(pageData, vocabulary, report.rings);
  const rawReportHash = digest(raw), decisionHash = decision === null ? 'missing' : digest(decision);
  const fingerprint = derived
    ? { report_rings_sha256: digest(JSON.stringify(report.rings)), decision_log_sha256: decisionHash, materials: derived.sourceFingerprint }
    : { report_sha256: rawReportHash, decision_log_sha256: decisionHash };
  const sidecar = buildNodesSidecar({ rings: report.rings, sourceFingerprint: fingerprint, now, ...(derived ? { objects: content.objects } : {}) });
  const data = {
    ...content, kinds: vocabulary.kinds, flowKinds: vocabulary.flowKinds, lanes: vocabulary.lanes,
    provenance: `本页是只读派生视图，不是权威；报告 sha256=${rawReportHash} ref=${reportPath}；${decision === null ? `decision-log 缺失 ref=${decisionLogPath}；字节/行数未取得` : `decision-log sha256=${decisionHash} ref=${decisionLogPath}；字节=${decision.length}；行数=${decision.toString('utf8').split('\n').length}`}；${derived ? `facts 原件 sha256=${derived.factsProvenance.sha256} ref=${derived.factsProvenance.ref}（原字节仅溯源，游标位置参与实变）；` : ''}生成=${sidecar.generated_at}`,
    rings: report.rings, ringNodes: sidecar.nodes, ...(derived ? { sourceFingerprint: fingerprint, contractErrors: derived.contractErrors } : {}),
  };
  const json = JSON.stringify(data).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const title = content.task.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\"', '&quot;').replaceAll("'", '&#39;');
  if ((template.match(/<title>[^<]*<\/title>/g) ?? []).length !== 1) throw Error('template title replacement unavailable');
  const html = template.replace(match[0], () => `const DATA = ${json};`).replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);
  const directory = resolve(outDir);
  if(taskOutput){
    const ref=relative(taskOutput.taskPath,directory);let parent=taskOutput.taskPath;
    for(const part of ref.split(sep)){parent=join(parent,part);let stat;try{stat=lstatSync(parent);}catch(error){if(error.code!=='ENOENT')throw error;mkdirSync(parent);stat=lstatSync(parent);}if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('output directory alias rejected');}
  }else mkdirSync(directory, { recursive: true });
  const nodesName = htmlName.replace(/\.html$/, '.nodes.json');
  const publication = await publishPair(directory, htmlName, html, nodesName, `${JSON.stringify(sidecar, null, 2)}\n`, Boolean(derived), taskOutput);
  const htmlPath = join(directory, htmlName), nodesPath = join(directory, nodesName);
  try {
    if (typeof open !== 'function') throw Error('缺宿主浏览器能力');
    if (await open(htmlPath) !== true) throw Error('宿主未打开');
    return { htmlPath, nodesPath, opened: true, ...publication };
  } catch (error) { return { htmlPath, nodesPath, opened: false, open_reason: `未自动打开: ${error.message}`, ...publication }; }
}

export const EVENTS = Object.freeze(['skeleton-confirmed','package-converged','direction-scope-acceptance-changed','phase-closed','build-code-ended','stage-closed']);

export async function refreshAnswerPage({ event, open = openInSystemBrowser, ...options } = {}) {
  if (!EVENTS.includes(event)) throw Error(`未知事件；支持: ${EVENTS.join(', ')}`);
  if (!options.taskPath) throw Error('event refresh requires an authenticated taskPath');
  if (options.pageData !== undefined) throw Error('event refresh derives current task data; caller pageData belongs to renderAnswerPage');
  if (event === 'build-code-ended' || event === 'stage-closed') {
    const report = JSON.parse(readFileSync(options.reportPath, 'utf8'));
    const ring10 = Array.isArray(report.rings) ? report.rings.find(r => r.ring === 10) : undefined;
    if (event === 'build-code-ended' && ring10?.state !== 'skipped') throw Error('build-code-ended requires report ring 10 state=skipped; caller must supply the real report');
    if (event === 'stage-closed' && (!ring10 || ring10.state === 'skipped' || !RING_STATES.includes(ring10.state))) throw Error('stage-closed requires report ring 10 with a valid non-skipped final state; caller must supply the new report');
  }
  // Rendering owns the pair lock and returns the old observation from that same lock.
  const result = await renderAnswerPage({ ...options, open: undefined });
  const current = JSON.parse(readFileSync(result.nodesPath, 'utf8'));
  let previous, baselineMissing = false;
  if (result.hadHtml) {
    try {
      previous = JSON.parse(result.previousNodes);
      if (!result.baselineConsistent || !previous || previous.schema !== current.schema || !previous.source_fingerprint || !Array.isArray(previous.nodes)
          || previous.nodes.some(n => typeof n.stable_id !== 'string' || typeof n.content_digest !== 'string')) throw Error('invalid previous sidecar');
    } catch { baselineMissing = true; }
  }
  const changed = !result.hadHtml || baselineMissing || JSON.stringify(previous.source_fingerprint) !== JSON.stringify(current.source_fingerprint)
    || JSON.stringify(previous.nodes) !== JSON.stringify(current.nodes);
  const { previousNodes, hadHtml, baselineConsistent, ...published } = result;
  const response = { ...published, event, changed, source_fingerprint: current.source_fingerprint };
  if (!changed) return { ...response, opened: false, open_reason: '无实质变化' };
  try {
    if (await open(result.htmlPath) !== true) throw Error('宿主未打开');
    return { ...response, opened: true, open_reason: baselineMissing ? '比较基准缺失；按首次打开' : result.hadHtml ? '实质变化' : '首次生成' };
  } catch (error) { return { ...response, opened: false, open_reason: `未自动打开: ${error.message}` }; }
}

export async function main(argv = process.argv.slice(2)) {
  const values = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || !argv[i + 1]) throw Error('expected --name value');
    const key = argv[i].slice(2);
    if (!['task-path', 'report', 'out-dir', 'html', 'data', 'event'].includes(key) || Object.hasOwn(values, key)) throw Error(`unknown or duplicate --${key}`);
    values[key] = argv[i + 1];
  }
  if (!values['task-path']) throw Error('--task-path is required');
  const manifest = JSON.parse(readFileSync(join(values['task-path'], 'task.json'), 'utf8'));
  const task = openTask(resolve(values['task-path']), { projectName: manifest.project_name, taskId: manifest.task_id });
  const workspace = await openCurrentTaskWorkspace(task);
  return (values.event ? refreshAnswerPage : renderAnswerPage)({
    ...(values.event ? { event: values.event } : {}),
    reportPath: values.report, decisionLogPath: join(workspace.worktreeRoot, 'specs', manifest.task_id, 'decision-log.md'),
    taskPath: values['task-path'], ...(values.data ? { pageData: JSON.parse(readFileSync(values.data, 'utf8')) } : {}), outDir: values['out-dir'], htmlName: values.html,
  });
}
let directEntry = false;
if(process.argv[1]){try{directEntry=realpathSync(fileURLToPath(import.meta.url))===realpathSync(resolve(process.argv[1]));}catch(error){if(error.code!=='ENOENT')throw error;}}
if (directEntry) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
}
