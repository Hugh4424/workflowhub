#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {evaluateReport} from './readiness-model.mjs';

const args = process.argv.slice(2);
if (args.length !== 2 || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/build-report.mjs <report-data.json> <output.html>');
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(scriptDir, '..');
const templatePath = path.join(skillRoot, 'assets', 'material-agent-readiness-eval-markdown-report-template.html');
const localesPath = path.join(skillRoot, 'assets', 'report-locales.json');
const inputPath = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);

const die = (message) => {
  console.error(`ERROR: ${message}`);
  process.exit(1);
};

const readText = (filePath, label) => {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) die(`${label} does not exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
};

const parseJson = (filePath, label) => {
  try {
    return JSON.parse(readText(filePath, label));
  } catch (error) {
    die(`cannot parse ${label}: ${error.message}`);
  }
};

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const scoreText = (score, strings) => score === null ? strings.notScored : String(score);
const scoreClass = (score) => score === null ? 'unknown' : score >= 85 ? 'good' : score >= 70 ? 'warn' : 'risk';

const listMarkup = (items, strings, code = false) => {
  if (!items.length) return `<p>${escapeHtml(strings.noItems)}</p>`;
  return `<ul>${items.map((item) => `<li>${code ? `<code>${escapeHtml(item)}</code>` : escapeHtml(item)}</li>`).join('')}</ul>`;
};

const isCompactTag = (value) => {
  const text = String(value);
  return text.length <= 18 && !/[\\/#\s]/u.test(text);
};
const tagsMarkup = (items) => items.map((item) => (
  `<span class="tag${isCompactTag(item) ? ' tag--compact' : ''}">${escapeHtml(item)}</span>`
)).join('');

const input = parseJson(inputPath, 'report data JSON');
let evaluation;
try {
  evaluation = evaluateReport(input);
} catch (error) {
  die(`invalid report data:\n${error.message}`);
}

const locales = parseJson(localesPath, 'locale JSON');
const baseStrings = locales[input.locale];
if (!baseStrings) die(`unsupported locale ${input.locale}`);
const profileStrings = baseStrings.profiles[input.assessment.profile];
if (!profileStrings) die(`missing labels for profile ${input.assessment.profile}`);
const strings = {...baseStrings, ...profileStrings};

const template = readText(templatePath, 'report template');
const overallScore = evaluation.overallScore === null ? '—' : String(evaluation.overallScore);
const sourceVersion = input.source.version || strings.noItems;

const gradeScale = [
  ['A', '90–100', strings.gradeA],
  ['B', '80–89.9', strings.gradeB],
  ['C', '70–79.9', strings.gradeC],
  ['D', '50–69.9', strings.gradeD],
  ['F', '0–49.9', strings.gradeF],
].map(([grade, range, meaning]) => (
  `<div class="grade-band${evaluation.grade === grade ? ' active' : ''}"><b>${grade} · ${range}</b>${escapeHtml(meaning)}</div>`
)).join('');

const capabilitiesHtml = evaluation.capabilities.map((capability) => {
  const score = scoreText(capability.score, strings);
  const barScore = capability.score === null ? 0 : capability.score;
  return `<article class="capability ${scoreClass(capability.score)}" data-capability="${capability.id}" data-score="${capability.score ?? ''}">
    <div class="capability-top"><span class="value">${escapeHtml(score)}</span><span class="weight">${escapeHtml(strings.weight)} ${capability.weight}%</span></div>
    <h3>${escapeHtml(strings[`capability_${capability.id}`])}</h3>
    <p>${escapeHtml(strings[`capabilityDef_${capability.id}`])}</p>
    <div class="bar" aria-hidden="true"><i style="--score:${barScore}%"></i></div>
  </article>`;
}).join('');

const severityOrder = {BLOCKER: 0, HIGH: 1, MEDIUM: 2, LOW: 3};
const sortedFindings = [...input.findings].sort((a, b) => (
  severityOrder[a.severity] - severityOrder[b.severity] || a.id.localeCompare(b.id)
));
const findingsHtml = sortedFindings.length ? sortedFindings.map((finding) => `<article class="finding ${finding.severity}" data-finding-id="${escapeHtml(finding.id)}" data-finding-severity="${finding.severity}">
  <div class="finding-head">
    <div><div class="finding-kicker">${escapeHtml(strings[`severity_${finding.severity}`])} · ${escapeHtml(strings[`capability_${finding.capability}`])}</div><h3>${escapeHtml(finding.title)}</h3></div>
    <span class="finding-id">${escapeHtml(finding.id)}</span>
  </div>
  <div class="finding-body">
    <div class="finding-field" data-field="missing-contract"><span class="field-label">${escapeHtml(strings.missingContract)}</span><p>${escapeHtml(finding.missingContract)}</p></div>
    <div class="finding-field" data-field="design-impact"><span class="field-label">${escapeHtml(strings.agentImpact)}</span><p>${escapeHtml(finding.agentImpact)}</p></div>
    <div class="finding-field" data-field="designer-location"><span class="field-label">${escapeHtml(strings.designerLocation)}</span><p>${escapeHtml(finding.designerLocation)}</p></div>
    <div class="finding-field" data-field="designer-action"><span class="field-label">${escapeHtml(strings.designerAction)}</span><p>${escapeHtml(finding.designerAction)}</p></div>
    <div class="finding-field" data-field="completion-criteria"><span class="field-label">${escapeHtml(strings.completionCriteria)}</span><p>${escapeHtml(finding.completionCriteria)}</p></div>
    <div class="finding-field" data-field="evidence"><span class="field-label">${escapeHtml(strings.evidence)}</span><p>${escapeHtml(finding.evidence)}</p><div class="finding-meta">${tagsMarkup([
      ...finding.layers,
      finding.type,
      finding.defectKind,
      finding.confidence,
      ...finding.evidenceRefs,
    ])}</div></div>
  </div>
</article>`).join('') : `<div class="evidence-card"><p>${escapeHtml(strings.noItems)}</p></div>`;

const layerRows = evaluation.layers.map((layer) => `<tr data-layer="${layer.id}" data-score="${layer.score ?? ''}">
  <td><strong>${layer.id} · ${escapeHtml(strings[`layer_${layer.id}`])}</strong><br><span class="tag tag--compact">${escapeHtml(strings.weight)} ${Math.round(layer.weight * 10) / 10}%</span></td>
  <td><span class="status">${escapeHtml(layer.disposition)}</span><br>${layer.score === null ? escapeHtml(strings.notScored) : `${layer.maturity} / 4 · ${layer.score} / 100`}</td>
  <td>${escapeHtml(layer.summary)}</td>
  <td><strong>${escapeHtml(layer.gap)}</strong><br>${escapeHtml(layer.impact)}</td>
  <td>${listMarkup(layer.evidence, strings, true)}<span class="tag tag--compact">${escapeHtml(layer.confidence)}</span></td>
</tr>`).join('');
const layersTableHtml = `<table>
  <thead><tr><th>${escapeHtml(strings.designResponsibility)}</th><th>${escapeHtml(strings.maturity)}</th><th>${escapeHtml(strings.summary)}</th><th>${escapeHtml(strings.gap)} / ${escapeHtml(strings.impact)}</th><th>${escapeHtml(strings.evidence)}</th></tr></thead>
  <tbody>${layerRows}</tbody>
</table>`;

const qualityHtml = evaluation.quality.map((quality) => `<article class="quality-card" data-quality="${quality.id}" data-score="${quality.score}">
  <strong>${quality.score}</strong><span> / 100</span>
  <h3>${escapeHtml(strings[`quality_${quality.id}`])}</h3>
  <p>${escapeHtml(quality.summary)}</p>
  <div class="finding-meta">${tagsMarkup(quality.evidence)}</div>
</article>`).join('');

const planRows = input.plan.length ? input.plan.map((item) => `<tr data-plan-id="${escapeHtml(item.id)}">
  <td><span class="tag tag--compact">${escapeHtml(item.priority)}</span></td>
  <td>${escapeHtml(item.target)}</td>
  <td>${escapeHtml(item.action)}</td>
  <td>${escapeHtml(item.authorityNeeded)}</td>
  <td>${escapeHtml(item.validation)}<div class="finding-meta">${tagsMarkup(item.findingIds)}</div></td>
  <td><strong>${escapeHtml(item.id)}</strong><br>${escapeHtml(item.changeClass)}</td>
</tr>`).join('') : `<tr><td colspan="6">${escapeHtml(strings.noItems)}</td></tr>`;
const planTableHtml = `<table>
  <thead><tr><th>${escapeHtml(strings.priority)}</th><th>${escapeHtml(strings.target)}</th><th>${escapeHtml(strings.action)}</th><th>${escapeHtml(strings.authorityNeeded)}</th><th>${escapeHtml(strings.validation)}</th><th>${escapeHtml(strings.changeClass)} / ${escapeHtml(strings.recordId)}</th></tr></thead>
  <tbody>${planRows}</tbody>
</table>`;

const evidenceGroups = [
  [strings.profileConfirmation, [input.assessment.confirmation], false],
  [strings.includedEvidence, input.includedEvidence, true],
  [strings.excludedEvidence, input.excludedEvidence, true],
  [strings.unavailableEvidence, input.unavailableEvidence, true],
  [strings.limitations, input.limitations, false],
  [strings.openQuestions, input.openQuestions, false],
];
const evidenceHtml = evidenceGroups.map(([label, items, code]) => `<article class="evidence-card"><h3>${escapeHtml(label)}</h3>${listMarkup(items, strings, code)}</article>`).join('');

const embeddedModel = JSON.stringify(evaluation).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
const replacements = {
  DOCUMENT_LANG: strings.documentLang,
  SCHEMA_VERSION: input.schemaVersion,
  ASSESSMENT_PROFILE: input.assessment.profile,
  PROFILE_LABEL: strings.profileLabel,
  PROFILE_BOUNDARY: strings.profileBoundary,
  ASSESSMENT_PROFILE_LABEL: strings.assessmentProfile,
  OVERALL_SCORE_DATA: evaluation.overallScore ?? '',
  OVERALL_SCORE: overallScore,
  GRADE: evaluation.grade,
  VERDICT: evaluation.verdict,
  VERDICT_TEXT: strings[`verdict_${evaluation.verdict}`],
  EVIDENCE_COVERAGE: evaluation.evidenceCoverage,
  BLOCKER_COUNT: evaluation.blockerCount,
  REPORT_TITLE: input.title,
  REPORT_SUMMARY: input.summary,
  BRAND_TEXT: strings.brand,
  AUDIENCE_TEXT: strings.audience,
  SKIP_TEXT: strings.skip,
  PRINT_TEXT: strings.print,
  OVERALL_SCORE_LABEL: strings.overallScore,
  VERDICT_LABEL: strings.verdict,
  SAFE_USE_LABEL: strings.safeUse,
  SAFE_USE: input.safeUse,
  NEXT_ACTION_LABEL: strings.nextAction,
  NEXT_ACTION: input.nextAction,
  SOURCE_LABEL: strings.source,
  SOURCE_NAME: input.source.name,
  SOURCE_ROOT: input.source.root,
  VERSION_LABEL: strings.version,
  SOURCE_VERSION: sourceVersion,
  GENERATED_LABEL: strings.generatedAt,
  GENERATED_AT: input.generatedAt,
  SCOPE_LABEL: strings.scope,
  SCOPE: input.scope,
  EVIDENCE_COVERAGE_LABEL: strings.evidenceCoverage,
  GRADE_SCALE_LABEL: strings.gradeScale,
  GRADE_SCALE_HTML: gradeScale,
  CAPABILITIES_TITLE: strings.sectionCapabilities,
  CAPABILITIES_INTRO: strings.capabilitiesIntro,
  CAPABILITIES_HTML: capabilitiesHtml,
  FINDINGS_TITLE: strings.sectionFindings,
  FINDINGS_INTRO: strings.findingsIntro,
  FINDINGS_HTML: findingsHtml,
  LAYERS_TITLE: strings.sectionLayers,
  LAYERS_INTRO: strings.layersIntro,
  LAYERS_TABLE_HTML: layersTableHtml,
  QUALITY_TITLE: strings.sectionQuality,
  QUALITY_INTRO: strings.qualityIntro,
  QUALITY_HTML: qualityHtml,
  PLAN_TITLE: strings.sectionPlan,
  PLAN_INTRO: strings.planIntro,
  PLAN_TABLE_HTML: planTableHtml,
  EVIDENCE_TITLE: strings.sectionEvidence,
  EVIDENCE_INTRO: strings.evidenceIntro,
  EVIDENCE_HTML: evidenceHtml,
  FOOTER_TEXT: strings.footer,
  MODEL_JSON: embeddedModel,
};

const htmlKeys = new Set([
  'GRADE_SCALE_HTML',
  'CAPABILITIES_HTML',
  'FINDINGS_HTML',
  'LAYERS_TABLE_HTML',
  'QUALITY_HTML',
  'PLAN_TABLE_HTML',
  'EVIDENCE_HTML',
  'MODEL_JSON',
]);
const templateKeys = new Set([...template.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]));
for (const key of templateKeys) {
  if (!(key in replacements)) die(`missing template replacement ${key}`);
}
for (const key of Object.keys(replacements)) {
  if (!templateKeys.has(key)) die(`unexpected replacement ${key}`);
}

const rendered = template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => (
  htmlKeys.has(key) ? String(replacements[key]) : escapeHtml(replacements[key])
));
const unresolved = rendered.match(/\{\{[^{}]+\}\}/g) || [];
if (unresolved.length) die(`unresolved template placeholders: ${[...new Set(unresolved)].join(', ')}`);

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, rendered, 'utf8');
console.log(`BUILT: ${outputPath}`);
console.log(`  score=${overallScore} grade=${evaluation.grade} verdict=${evaluation.verdict} evidence=${evaluation.evidenceCoverage}% profile=${input.assessment.profile}`);
