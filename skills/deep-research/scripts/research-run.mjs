#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publishResearchReport, readResearchReport } from '../../../runtime/evidence/research-report.mjs';

const text = value => typeof value === 'string' && value.trim().length > 0;
const fallbackRoutes = new Set(['web_search', 'web_fetch']);
const stopCodes = new Set(['AUTHORIZATION_DENIED', 'PERMISSION_DENIED', 'AUTHENTICATION_FAILED', 'INVALID_CREDENTIALS', 'INPUT_INVALID']);
const denied = error => stopCodes.has(error?.code) || [401, 403].includes(error?.http_status);
const describeError = error => `${error?.code ? `${error.code}: ` : ''}${error?.message ?? String(error)}`;

export function roundRecords({ query, language, tool, route, results, reason = null }) {
  return { tool, ...(route ? { route } : {}), queries: [query], language, results, ...(reason ? { reason } : {}) };
}

function actualApproval(input) {
  if (input === undefined) return { approval_status: 'not_requested', requested_route: null, used_routes: [] };
  if (!input || !['not_requested', 'awaiting_user_approval', 'approved', 'declined'].includes(input.approval_status)
      || input.requested_route !== null && !text(input.requested_route)
      || input.approval_status === 'approved' && !text(input.approval_ref)) throw Error('fallback requires actual approval status, requested_route and approved approval_ref');
  return {
    approval_status: input.approval_status, requested_route: input.requested_route,
    ...(input.approval_ref === undefined ? {} : { approval_ref: input.approval_ref }), used_routes: [],
  };
}

export async function runResearch({ question, decisionAxis, queries, search, fetch, fallback, recordDir, taskId, stage, now = new Date() } = {}) {
  if (!text(question) || !text(decisionAxis) || !Array.isArray(queries) || queries.length < 1 || queries.length > 3) throw Error('question, decisionAxis and 1–3 queries required');
  for (const q of queries) if (!text(q.query) || !text(q.language)) throw Error('each query requires query and language');
  const approval = actualApproval(fallback), tool_usage = [], sources = [], evidence = [], open_items = [], used = new Set();
  let rounds = 0, reason = null, errorClass = null, stop = false;
  const report = {
    schema_version: 'research-report.v1', task_id: taskId, stage, question, decision_axis: decisionAxis,
    status: 'unavailable', tool_usage, open_items, review: { status: 'pending', evidence_ref: null }, fallback: approval,
  };
  const issue = (message, code, url = null) => {
    reason = message; errorClass = code;
    open_items.push({ question_id: question, code, reason: url ? `${url}: ${message}` : message, next_action: 'caller按实际失败补齐来源或权限；保原件，不覆盖旧事实' });
  };
  const invokeRoute = callable => {
    const route = callable?.route;
    if (route !== undefined && !text(route)) throw Error('callback route must name the actual tool route');
    if (fallbackRoutes.has(route) && approval.approval_status !== 'approved') throw Error(`fallback route ${route} requires real approval before invocation`);
    if (route) used.add(route);
    return route;
  };
  const returnedRoute = (result, invoked) => {
    if (result.route !== undefined && (!text(result.route) || result.route !== invoked)) throw Error('returned route must match the actual invoked callback route');
    if (fallbackRoutes.has(result.tool)) {
      if (result.tool !== invoked) throw Error(`fallback tool ${result.tool} must match actual invoked route`);
      if (approval.approval_status !== 'approved') throw Error(`fallback tool ${result.tool} requires real approval before invocation`);
    }
    return invoked;
  };

  if (['awaiting_user_approval', 'declined'].includes(approval.approval_status)) {
    issue(`备用路由审批为 ${approval.approval_status}，未执行备用检索`, 'approval_unavailable');
  } else if (typeof search !== 'function' || typeof fetch !== 'function') {
    issue('工具不可用: 缺search/fetch宿主能力，未执行检索', 'tool_unavailable');
  } else {
    // A fallback caller must identify routes before any external invocation.
    if (approval.approval_status === 'approved' && (search.route !== 'web_search' || fetch.route !== 'web_fetch')) {
      throw Error('approved fallback requires explicit search.route=web_search and fetch.route=web_fetch');
    }
    for (const q of queries) {
      if (stop) break;
      rounds += 1;
      let found, searchRoute;
      try {
        searchRoute = invokeRoute(search);
        found = await search(q.query, { language: q.language, question });
        if (!found || !Array.isArray(found.results) || !text(found.tool)) throw Error('search must return actual tool and results[]');
        returnedRoute(found, searchRoute);
        tool_usage.push(roundRecords({ ...q, tool: found.tool, route: searchRoute, results: found.results }));
      } catch (error) {
        const message = `工具不可用: ${describeError(error)}`;
        tool_usage.push(roundRecords({ ...q, tool: search.tool || searchRoute || search.name || 'host-search', route: searchRoute, results: [], reason: message }));
        issue(message, 'tool_unavailable');
        // The failed search route is not retried here; later queries are distinct inputs.
        if (denied(error)) { stop = true; break; }
        continue;
      }
      for (const candidate of found.results) {
        if (stop) break;
        if (!candidate || !text(candidate.url) || !['primary', 'secondary', 'inferred'].includes(candidate.source_tier)) {
          issue('candidate requires url and source_tier', 'tool_unavailable');
          continue;
        }
        if (sources.some(s => s.url_or_ref === candidate.url)) continue;
        let original, fetchRoute;
        try {
          fetchRoute = invokeRoute(fetch);
          original = await fetch(candidate.url);
          if (original?.error || original?.status === 'unavailable' || /^extract_failed(?:\s|$)/.test(original?.text ?? '')) {
            throw Object.assign(Error(`原文未取得: ${original.error ?? original.text ?? original.status}`), { code: original.error_code ?? 'EXTRACT_FAILED', ...(original.http_status ? { http_status: original.http_status } : {}) });
          }
          if (!original || !text(original.tool) || !text(original.text) || !text(original.locator)) throw Error('fetch requires actual tool, original text and locator');
          returnedRoute(original, fetchRoute);
        } catch (error) {
          const message = `原文工具不可用: ${describeError(error)}`;
          tool_usage.push({ tool: fetch.tool || fetchRoute || fetch.name || 'host-fetch', ...(fetchRoute ? { route: fetchRoute } : {}), url: candidate.url, reason: message });
          issue(message, 'tool_unavailable', candidate.url);
          if (denied(error)) stop = true;
          continue;
        }
        tool_usage.push({ tool: original.tool, ...(fetchRoute ? { route: fetchRoute } : {}), url: candidate.url, locator: original.locator });
        sources.push({ url_or_ref: candidate.url, source_tier: candidate.source_tier, read_original: true, locator: original.locator });
        evidence.push({ claim: original.text, source_ref: candidate.url, locator: original.locator, confidence: 'low', read_original: true });
      }
    }
  }
  Object.assign(report, { rounds, sources, evidence });
  approval.used_routes = [...used];
  const candidates = tool_usage.filter(t => Array.isArray(t.results)).flatMap(t => t.results);
  if (!reason && candidates.length === 0) issue('零结果：检索已执行且0结果，非工具不可用', 'no_results');
  const enough = sources.length >= 3 && sources.some(s => s.source_tier === 'primary');
  if (!enough && !reason) issue('已执行检索，但不足三个已读原文来源或缺一手来源；不能宣称调研完成', 'insufficient_sources');
  if (enough && !stop) {
    Object.assign(report, {
      status: 'completed', triangulation: { status: 'unresolved', conflicts: [] },
      coverage: { first_party_ratio: sources.filter(s => s.source_tier === 'primary').length / sources.length, dimensions: [decisionAxis] },
      saturation: { status: 'not_saturated', reason: '实际查询结束；失败URL仍在open_items，三角测量与独立复核由caller承接' },
    });
  } else Object.assign(report, { reason, error_class: errorClass, pending_questions: [question] });
  if (approval.approval_status === 'approved' && !['web_search', 'web_fetch'].every(route => used.has(route))) {
    throw Object.assign(Error(`出版限制：approved报告需真实web_search与web_fetch两路调用；原始原因：${reason ?? '未发生两路完整调用'}`), { report });
  }
  const published = await publishResearchReport({ recordDir, slug: 'research-run', report, taskId, stage, recordedAt: new Date(now).toISOString() });
  const readback = readResearchReport({ read: () => readFileSync(published.path), ref: published.ref, taskId, stage });
  return { path: published.path, ref: published.ref, value: readback.value };
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2 || argv[0] !== '--input') throw Error('usage: research-run.mjs --input <caller-input.json>; host search/fetch supplied by module caller');
  return runResearch(JSON.parse(readFileSync(resolve(argv[1]), 'utf8')));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(r => console.log(JSON.stringify(r))).catch(e => { console.error(e.message); process.exitCode = 1; });
}
