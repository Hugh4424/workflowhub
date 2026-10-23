#!/usr/bin/env node
import { readFileSync, mkdirSync, lstatSync, unlinkSync } from 'node:fs';
import { resolve, basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { writeFileAtomic } from '../../../runtime/interface/safe-write.mjs';
import { withLock } from '../../../runtime/interface/record-lock.mjs';
import { openTask } from '../../../runtime/task/task-handle.mjs';
import { openCurrentTaskWorkspace } from '../../../runtime/task/workspace.mjs';

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

export function buildNodesSidecar({ rings, sourceFingerprint, now = new Date() }) {
  return {
    schema: 'answer-page-nodes.v1', generated_at: new Date(now).toISOString(), source_fingerprint: sourceFingerprint,
    nodes: rings.map(ring => ({ stable_id: `ring:${ring.ring}`, content_digest: digest(JSON.stringify(ring)) })),
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
async function publishPair(directory, htmlName, html, nodesName, nodes) {
  return withLock(directory, `answer-page-${digest(htmlName).slice(0, 16)}`, async () => {
    const files = [
      { name: nodesName, bytes: Buffer.from(nodes) },
      { name: htmlName, bytes: Buffer.from(html) },
    ];
    // Reject aliases/directories and read both old versions before either publication.
    for (const file of files) file.before = observedFile(join(directory, file.name));
    try {
      for (const file of files) {
        file.attempted = true;
        await writeFileAtomic(directory, file.name, file.bytes);
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
          if (file.before) await writeFileAtomic(directory, file.name, file.before.bytes);
          else {
            if (!sameIdentity(current.stat, lstatSync(join(directory, file.name)))) throw Error(`recovery identity changed: ${file.name}`);
            unlinkSync(join(directory, file.name));
          }
        } catch (failure) { failures.push(failure); }
      }
      if (failures.length) throw new AggregateError([error, ...failures], `${error.message}; pair recovery incomplete: ${failures.map(e => e.message).join('; ')}`);
      throw error;
    }
  });
}

export async function renderAnswerPage({ reportPath, decisionLogPath, pageData, outDir, htmlName, open, now = new Date() } = {}) {
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
  const decision = readFileSync(decisionLogPath), template = readFileSync(templatePath, 'utf8');
  const match = template.match(/const DATA = (\{[\s\S]*?\n\});/);
  if (!match) throw Error('template DATA replacement unavailable');
  // Evaluate repository-owned presentation vocabulary only, never caller input.
  const vocabulary = runInNewContext(`(${match[1]})`, {}, { timeout: 1000 });
  const content = callerData(pageData, vocabulary, report.rings);
  const fingerprint = { report_sha256: digest(raw), decision_log_sha256: digest(decision) };
  const sidecar = buildNodesSidecar({ rings: report.rings, sourceFingerprint: fingerprint, now });
  const data = {
    ...content, kinds: vocabulary.kinds, flowKinds: vocabulary.flowKinds, lanes: vocabulary.lanes,
    provenance: `本页是只读派生视图，不是权威；报告 sha256=${fingerprint.report_sha256} ref=${reportPath}；decision-log sha256=${fingerprint.decision_log_sha256} ref=${decisionLogPath}；字节=${decision.length}；行数=${decision.toString('utf8').split('\n').length}；生成=${sidecar.generated_at}`,
    rings: report.rings, ringNodes: sidecar.nodes,
  };
  const json = JSON.stringify(data).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const title = content.task.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\"', '&quot;').replaceAll("'", '&#39;');
  if ((template.match(/<title>[^<]*<\/title>/g) ?? []).length !== 1) throw Error('template title replacement unavailable');
  const html = template.replace(match[0], () => `const DATA = ${json};`).replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);
  const directory = resolve(outDir);
  mkdirSync(directory, { recursive: true });
  const nodesName = htmlName.replace(/\.html$/, '.nodes.json');
  await publishPair(directory, htmlName, html, nodesName, `${JSON.stringify(sidecar, null, 2)}\n`);
  const htmlPath = join(directory, htmlName), nodesPath = join(directory, nodesName);
  try {
    if (typeof open !== 'function') throw Error('缺宿主浏览器能力');
    if (await open(htmlPath) !== true) throw Error('宿主未打开');
    return { htmlPath, nodesPath, opened: true };
  } catch (error) { return { htmlPath, nodesPath, opened: false, open_reason: `未自动打开: ${error.message}` }; }
}

export async function main(argv = process.argv.slice(2)) {
  const values = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || !argv[i + 1]) throw Error('expected --name value');
    const key = argv[i].slice(2);
    if (!['task-path', 'report', 'out-dir', 'html', 'data'].includes(key) || Object.hasOwn(values, key)) throw Error(`unknown or duplicate --${key}`);
    values[key] = argv[i + 1];
  }
  if (!values['task-path'] || !values.data) throw Error('--task-path and --data are required');
  const manifest = JSON.parse(readFileSync(join(values['task-path'], 'task.json'), 'utf8'));
  const task = openTask(resolve(values['task-path']), { projectName: manifest.project_name, taskId: manifest.task_id });
  const workspace = await openCurrentTaskWorkspace(task);
  return renderAnswerPage({
    reportPath: values.report, decisionLogPath: join(workspace.worktreeRoot, 'specs', manifest.task_id, 'decision-log.md'),
    pageData: JSON.parse(readFileSync(values.data, 'utf8')), outDir: values['out-dir'], htmlName: values.html,
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
}
