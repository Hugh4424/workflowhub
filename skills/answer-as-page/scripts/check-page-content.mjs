#!/usr/bin/env node
// Private read-only content checker for the cockpit page. It re-reads the
// current task/report and names every mismatch; it is not a public command.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, isAbsolute } from 'node:path';
import { buildPageData } from './build-page-data.mjs';

const USAGE = 'usage: --task-path <root> --report <report> [--material-root <dir>]';
const TITLE_BAD = /^缺[：:]|未取得/;

export async function checkPageContent({ taskPath, reportPath, materialRoot, htmlPath, nodesPath }) {
  return buildPageData({ taskPath, reportPath }).then(({ pageData, report, contractErrors }) => {
    const errors = [];
    const stampExists = Boolean(pageData.generatedAt);
    const add = (code, message) => errors.push({ code, message });
    for (const error of contractErrors ?? []) add('CONTRACT', error);
    const material = materialRoot
      ? (isAbsolute(materialRoot) ? materialRoot : resolve(taskPath, materialRoot))
      : pageData.sourceDir;
    if (!pageData.task || TITLE_BAD.test(pageData.task)) add('TITLE_UNSTABLE', `页面任务标题不成立：${pageData.task || '空'}`);
    for (const object of pageData.objects ?? []) {
      for (const source of object.src ?? []) {
        if (!source?.path || !isAbsolute(source.path)) continue;
        if (!existsSync(source.path)) add('MISSING_SOURCE', `${object.id} 的声明原件不可读：${source.path}`);
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
    if (latest?.phase_id && !String(pageData.stageLabel ?? '').includes(latest.phase_id)) {
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
    const changedAt = Math.max(...['decision-log.md', 'spec.md'].map(name => { try { return statSync(join(material, name)).mtimeMs; } catch { return 0; } }));
    let pageAt = NaN;
    if (htmlPath && existsSync(htmlPath)) pageAt = statSync(htmlPath).mtimeMs;
    else if (stampExists) pageAt = Date.parse(pageData.generatedAt);
    if (Number.isFinite(pageAt) && changedAt > pageAt) add('STALE_MATERIAL', '材料在页面生成后变化，页面需标过期');
    if (htmlPath && !existsSync(htmlPath)) add('MISSING_HTML', `页面 HTML 不可读：${htmlPath}`);
    if (nodesPath) {
      if (!existsSync(nodesPath)) add('MISSING_SIDECAR', `页面侧车不可读：${nodesPath}`);
      else {
        try {
          const sidecar = JSON.parse(readFileSync(nodesPath, 'utf8'));
          if (sidecar.task !== undefined && sidecar.task !== pageData.task) add('SIDECAR_MISMATCH', '侧车任务与 pageData 不一致');
          if (sidecar.stage !== undefined && sidecar.stage !== pageData.stageLabel) add('SIDECAR_MISMATCH', '侧车阶段与 pageData 不一致');
        } catch { add('SIDECAR_MISMATCH', `侧车 JSON 不可读：${nodesPath}`); }
      }
    }
    return { ok: errors.length === 0, errors, stage: pageData.stageLabel, task: pageData.task };
  });
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
