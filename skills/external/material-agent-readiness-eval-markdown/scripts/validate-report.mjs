#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {evaluateReport, ASSESSMENT_PROFILES} from './readiness-model.mjs';

const locales = JSON.parse(fs.readFileSync(new URL('../assets/report-locales.json', import.meta.url), 'utf8'));
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const args = process.argv.slice(2);
if (!args.length || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/validate-report.mjs <report.html> [--data <report-data.json>]');
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
}

const reportPath = path.resolve(args[0]);
const dataFlag = args.indexOf('--data');
const dataPath = dataFlag >= 0 ? args[dataFlag + 1] : null;
if (dataFlag >= 0 && !dataPath) {
  console.error('ERROR: --data requires a report-data JSON path');
  process.exit(1);
}

const errors = [];
const fail = (message) => errors.push(message);
if (!fs.existsSync(reportPath) || !fs.statSync(reportPath).isFile()) {
  console.error(`ERROR: report does not exist: ${reportPath}`);
  process.exit(1);
}
const html = fs.readFileSync(reportPath, 'utf8');

if ((html.match(/\{\{[^{}]+\}\}/g) || []).length) fail('report contains unresolved template placeholders');
if (/<script\b[^>]*\bsrc\s*=/i.test(html)) fail('report contains an external script dependency');
if (/<link\b[^>]*\brel=["']?stylesheet/i.test(html)) fail('report contains an external stylesheet dependency');
if (/url\(\s*["']?https?:/i.test(html)) fail('report CSS contains an external URL dependency');
if (!/<meta\s+name=["']viewport["']/i.test(html)) fail('report is missing a viewport meta tag');
if (!/@media\s+print/i.test(html)) fail('report is missing print styles');
if (!/<button\b[^>]*onclick=["']window\.print\(\)/i.test(html)) fail('report is missing the print action');
if (!/<header\b[^>]*class=["'][^"']*\bhero\b[^"']*["'][^>]*data-layout=["']stacked["']/i.test(html)) {
  fail('report hero must use the stacked score-then-summary layout');
}

for (const id of ['main', 'grade', 'capabilities', 'findings', 'layers', 'quality', 'plan', 'evidence']) {
  if (!new RegExp(`\\bid=["']${id}["']`, 'i').test(html)) fail(`report is missing section #${id}`);
}
const designerSectionOrder = ['grade', 'capabilities', 'layers', 'findings', 'plan', 'quality', 'evidence'];
const sectionPositions = designerSectionOrder.map((id) => html.search(new RegExp(`<section\\b[^>]*\\bid=["']${id}["']`, 'i')));
if (sectionPositions.some((position, index) => index > 0 && position <= sectionPositions[index - 1])) {
  fail(`report sections must follow designer-first order: ${designerSectionOrder.join(' → ')}`);
}

const rootMatch = html.match(/<html\b([^>]*)>/i);
if (!rootMatch) fail('report is missing an html root element');
const attributes = {};
for (const match of (rootMatch?.[1] || '').matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g)) {
  attributes[match[1]] = match[3];
}
for (const name of ['data-audience', 'data-schema-version', 'data-assessment-profile', 'data-overall-score', 'data-grade', 'data-verdict', 'data-evidence-coverage', 'data-blocker-count']) {
  if (!(name in attributes)) fail(`report root is missing ${name}`);
}
if (attributes['data-audience'] !== 'designer') fail('report audience must be designer');
if (attributes['data-schema-version'] !== '1.2.0') fail('report schema must be 1.2.0');
const profileId = attributes['data-assessment-profile'];
if (!Object.hasOwn(ASSESSMENT_PROFILES, profileId)) fail('report must declare a valid assessment profile');
const profileStrings = locales[attributes.lang]?.profiles[profileId];
if (!profileStrings) {
  fail('report profile or locale labels are unavailable');
} else {
  for (const [field, label] of [['assessment-profile', profileStrings.profileLabel], ['profile-boundary', profileStrings.profileBoundary]]) {
    const matches = [...html.matchAll(new RegExp(`<([a-z]+)\\b[^>]*data-field="${field}"[^>]*>([^<]*)<\\/\\1>`, 'g'))];
    if (matches.length !== 1 || matches[0][2] !== escapeHtml(label)) fail(`report must visibly render the correct ${field}`);
  }
}

const modelMatch = html.match(/<script\s+id=["']report-model["']\s+type=["']application\/json["']>([\s\S]*?)<\/script>/i);
let embeddedModel = null;
if (!modelMatch) {
  fail('report is missing the embedded report model');
} else {
  try {
    embeddedModel = JSON.parse(modelMatch[1]);
  } catch (error) {
    fail(`embedded report model is invalid JSON: ${error.message}`);
  }
}

if (embeddedModel?.assessment?.profile !== profileId) fail('embedded assessment profile does not match the report');
if (typeof embeddedModel?.assessment?.confirmation !== 'string' || !embeddedModel.assessment.confirmation.trim()) {
  fail('embedded model must retain the user purpose confirmation');
}

const countMatches = (pattern) => (html.match(pattern) || []).length;
if (countMatches(/\bclass=["'][^"']*\breport-content\b[^"']*["']/g) !== 7) {
  fail('all seven report sections must use the shared aligned content width');
}
if (countMatches(/\bdata-capability=/g) !== 6) fail('report must render six Agent production capabilities');
if (countMatches(/\bdata-layer=/g) !== 8) fail('report must render all eight L0–L7 layers');
if (countMatches(/\bdata-quality=/g) !== 8) fail('report must render all eight cross-layer quality dimensions');
const renderedFindingCount = countMatches(/\bdata-finding-id=/g);
for (const field of ['missing-contract', 'design-impact', 'designer-location', 'designer-action', 'completion-criteria', 'evidence']) {
  if (countMatches(new RegExp(`data-field=["']${field}["']`, 'g')) !== renderedFindingCount) {
    fail(`every finding must render one ${field} field`);
  }
}

if (dataPath) {
  if (!fs.existsSync(dataPath) || !fs.statSync(dataPath).isFile()) {
    fail(`report data does not exist: ${dataPath}`);
  } else {
    try {
      const sourceData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      const expected = evaluateReport(sourceData);
      const expectedRoot = {
        'data-audience': 'designer',
        'data-schema-version': expected.schemaVersion,
        'data-assessment-profile': expected.assessment.profile,
        'data-overall-score': expected.overallScore === null ? '' : String(expected.overallScore),
        'data-grade': expected.grade,
        'data-verdict': expected.verdict,
        'data-evidence-coverage': String(expected.evidenceCoverage),
        'data-blocker-count': String(expected.blockerCount),
      };
      for (const [name, value] of Object.entries(expectedRoot)) {
        if (attributes[name] !== value) fail(`${name} does not match report data: expected ${value}, got ${attributes[name]}`);
      }
      if (JSON.stringify(embeddedModel) !== JSON.stringify(expected)) {
        fail('embedded report model does not match the evaluated report data');
      }
      for (const severity of ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW']) {
        const renderedCount = countMatches(new RegExp(`data-finding-severity=["']${severity}["']`, 'g'));
        if (renderedCount !== expected.findingCounts[severity]) {
          fail(`${severity} finding count mismatch: expected ${expected.findingCounts[severity]}, got ${renderedCount}`);
        }
      }
    } catch (error) {
      fail(`cannot validate report data: ${error.message}`);
    }
  }
}

if (errors.length) {
  console.error(`INVALID: ${reportPath}`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`VALID: ${reportPath}`);
console.log(`  score=${attributes['data-overall-score'] || 'N/A'} grade=${attributes['data-grade']} verdict=${attributes['data-verdict']} evidence=${attributes['data-evidence-coverage']}%`);
