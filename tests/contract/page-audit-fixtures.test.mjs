// ORACLE-C07-FIXTURES: file-only fixture contract; no browser or page verdict.
import {describe, it, expect} from 'vitest';
import {readFileSync} from 'node:fs';

const fixtures = new URL('../fixtures/page-audit/', import.meta.url);
const read = path => readFileSync(new URL(path, fixtures), 'utf8');
const manifest = () => JSON.parse(read('defects.json'));
// Independent literals from P3 T007 and page-audit.md · 附录：九类区域.
const REGIONS = [
  ['r1-hash-tooltip', 'overflow', 'IMPORTANT'],
  ['r2-long-text', 'layout', 'IMPORTANT'],
  ['r3-narrow', 'layout', 'BLOCKER'],
  ['r4-zoom', 'layout', 'BLOCKER'],
  ['r5-scroll-occlude', 'interaction', 'BLOCKER'],
  ['r6-hover-bridge', 'interaction', 'IMPORTANT'],
  ['r7-keyboard-focus', 'a11y', 'BLOCKER'],
  ['r8-reduced-motion', 'interaction', 'IMPORTANT'],
  ['r9-error-permission-repeat', 'interaction', 'IMPORTANT'],
];
const SEVERITIES = ['BLOCKER', 'IMPORTANT', 'MINOR'];
const openingTags = html => [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => match[0]);
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
function localPage(html) {
  expect(html).toMatch(/<html\s+lang="zh-CN"/);
  expect(html).toMatch(/<style>[\s\S]+<\/style>/);
  expect(html).not.toMatch(/(?:https?:)?\/\/|@import|\b(?:src|href)\s*=/i);
}
function controlledPage(data, html) {
  expect(data.schema_version).toBe('1.0.0');
  expect(data.page).toBe('controlled-page.html');
  expect(data.object).toMatchObject({kind: 'controlled-fixture', object_version: '9efb7e57'});
  expect(data.calibration).toBeInstanceOf(Array);
  expect(data.regions.map(region => region.id)).toEqual(REGIONS.map(([id]) => id));
  const tags = openingTags(html);
  expect(tags.filter(tag => attribute(tag, 'data-region'))).toHaveLength(9);
  for (const [index, [id, dimension, severity]] of REGIONS.entries()) {
    const region = data.regions[index];
    for (const key of ['id', 'defect_id', 'selector', 'expected_dimension', 'expected_severity', 'detection']) {
      expect(region[key], `${id}.${key}`).toBeTypeOf('string');
      expect(region[key].trim(), `${id}.${key}`).not.toBe('');
    }
    expect(region.defect_id).toBe(`R${id.slice(1)}`);
    expect(region.selector).toBe(`#${id}`);
    expect(SEVERITIES).toContain(region.expected_severity);
    expect(region.expected_dimension).toBe(dimension);
    expect(region.expected_severity).toBe(severity);
    const marked = tags.filter(tag => attribute(tag, 'id') === id);
    expect(marked, `${id} unique id`).toHaveLength(1);
    expect(attribute(marked[0], 'data-region')).toBe(region.defect_id);
  }
  expect(tags.filter(tag => attribute(tag, 'data-region')).map(tag => attribute(tag, 'id'))).toEqual(REGIONS.map(([id]) => id));
  localPage(html);
  expect(html).toMatch(/<script>[\s\S]+<\/script>/);
  expect(html).toContain('9efb7e57'.repeat(64)); // 64-character hash repeated eight times.
  expect(html).toMatch(/white-space:\s*nowrap/);
  expect(html).toMatch(/@media\s*\(max-width:\s*640px\)/);
  expect(html).toMatch(/@media\s*\(max-width:\s*320px\)/);
  for (const tab of ['3', '1', '2']) expect(html).toContain(`tabindex="${tab}"`);
  expect(html).toMatch(/:focus\s*\{\s*outline:\s*none/);
  expect(html).toContain('prefers-reduced-motion: reduce');
}

// R3 source-local regression from independently checked P3 TCR; runtime hit tests remain P8.
function narrowStructure(html, detection) {
  const region = html.match(/<section id="r3-narrow"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  expect(region).toMatch(/<div id="narrow-cover" class="narrow-column">/);
  expect(region).toMatch(/<div class="narrow-column"><button id="narrow-primary"/);
  expect(region).toContain('data-clicks="0"');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  const cover = css.match(/#narrow-cover\s*\{([^}]+)\}/)?.[1] ?? '';
  const rear = css.match(/\.narrow-column\s*\+\s*\.narrow-column\s*\{([^}]+)\}/)?.[1] ?? '';
  const button = css.match(/#narrow-primary\s*\{([^}]+)\}/)?.[1] ?? '';
  expect(cover).toMatch(/position:\s*relative/);
  expect(rear).toMatch(/position:\s*relative/);
  const coverLevel = Number(cover.match(/z-index:\s*(\d+)/)?.[1]);
  const rearLevel = Number(rear.match(/z-index:\s*(\d+)/)?.[1]);
  expect(coverLevel, 'R3 cover must stack above the rear column').toBeGreaterThan(rearLevel);
  expect(button).toMatch(/width:\s*72px;/);
  expect(button).toMatch(/height:\s*44px;/);
  expect(css).toMatch(/\.narrow-column\s*\{[^}]*min-height:\s*100px;[^}]*padding:\s*16px;/);
  // Planned button centre: 1px column border + 16px padding + 72px/2 = 53px.
  // Both negative margins exceed 53px; vertical centre (1+16+44/2) stays inside 100px.
  for (const [width, overlap] of [[640, 100], [320, 120]]) {
    const media = css.split(`@media (max-width: ${width}px) {`)[1]?.split('@media')[0] ?? '';
    expect(media).toContain(`margin-left: -${overlap}px`);
    const actualOverlap = -Number(media.match(/margin-left:\s*(-\d+)px/)?.[1]);
    expect(actualOverlap).toBeGreaterThan(53);
  }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
  expect(script).toContain("const narrowPrimary = document.getElementById('narrow-primary');");
  expect(script).toMatch(/narrowPrimary\.addEventListener\('click',\s*\(\)\s*=>\s*\{\s*narrowPrimary\.dataset\.clicks = String\(Number\(narrowPrimary\.dataset\.clicks\) \+ 1\);/);
  for (const fact of ['#narrow-primary', '#narrow-cover', 'elementFromPoint', 'data-clicks', '真实指针', '未执行']) {
    expect(detection).toContain(fact);
  }
}

const CALIBRATION = [
  ['font-size', 'calibration/font.html', '20px', '17px', 'font-size', 'IMPORTANT'],
  ['spacing-gap', 'calibration/spacing.html', '16px', '8px', 'gap', 'IMPORTANT'],
  ['text-color', 'calibration/color.html', '#1A73E8', '#3A83E8', 'color', 'IMPORTANT'],
  ['blocker-cover', 'calibration/blocker.html', '#primary-action', '#blocking-cover', 'hit-test', 'BLOCKER'],
];
function calibrationPages(data, pages) {
  expect(data.calibration).toHaveLength(4);
  expect(data.calibration.map(item => item.id)).toEqual(CALIBRATION.map(([id]) => id));
  for (const [index, [id, path, baseline, observed, metric, severity]] of CALIBRATION.entries()) {
    const item = data.calibration[index];
    expect(item).toMatchObject({id, path, baseline, observed, metric, expected_severity: severity});
    expect(SEVERITIES).toContain(item.expected_severity);
    expect(item.threshold).toBeTypeOf('string');
    expect(item.threshold.trim()).not.toBe('');
    expect(path).not.toMatch(/^(?:\/|[a-z]+:)|\.\./i);
    const html = pages.get(path);
    expect(html, `calibration page exists: ${path}`).toBeTypeOf('string');
    localPage(html);
    expect(html).not.toMatch(/<script\b/i);
    const marked = openingTags(html).filter(tag => attribute(tag, 'data-calibration') === id);
    expect(marked).toHaveLength(1);
    expect(attribute(marked[0], 'data-expected-severity')).toBe(severity);
    if (metric !== 'hit-test') {
      const tags = openingTags(html);
      for (const [role, value] of [['baseline', baseline], ['observed', observed]]) {
        const sample = tags.filter(tag => attribute(tag, 'data-role') === role);
        expect(sample).toHaveLength(1);
        expect(attribute(sample[0], 'style')).toContain(`${metric}:${value}`);
      }
    } else {
      expect(marked[0]).toMatch(/^<button\b/);
      expect(marked[0]).toContain('id="primary-action"');
      expect(marked[0]).not.toMatch(/disabled|tabindex="-1"|aria-hidden="true"/);
      expect(html).toMatch(/id="blocking-cover"/);
      expect(html).toMatch(/#blocking-cover\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*z-index:\s*10;[^}]*pointer-events:\s*auto;/);
      expect(item.threshold).toBe('elementFromPoint 命中非按钮即阻断');
      expect(html).toContain('document.elementFromPoint');
    }
  }
  expect(new Set(data.calibration.map(item => item.expected_severity))).toEqual(new Set(['IMPORTANT', 'BLOCKER']));
  expect(pages.get('calibration/font.html')).toMatch(/3px[\s\S]*15%/);
  expect(pages.get('calibration/spacing.html')).toMatch(/8px[\s\S]*50%/);
  expect(pages.get('calibration/color.html')).toContain('4.0');
}
const calibrationFiles = data => new Map(data.calibration.map(item => [item.path, read(item.path)]));

describe('ORACLE-C07-FIXTURES', () => {
  it('controlled page has nine ordered regions and measurable defects', () => {
    controlledPage(manifest(), read('controlled-page.html'));
  });

  it.each(['missing marker', 'unknown severity', 'external resource'])('controlled page rejects %s', mutation => {
    const data = manifest();
    let html = read('controlled-page.html');
    if (mutation === 'missing marker') html = html.replace('data-region="R7-keyboard-focus"', '');
    if (mutation === 'unknown severity') data.regions[2].expected_severity = 'CRITICAL';
    if (mutation === 'external resource') html = html.replace('</head>', '<link href="https://example.invalid/style.css"></head>');
    expect(() => controlledPage(data, html)).toThrow();
  });

  it('controlled page R3 binds a covered primary action to measurable hit and click facts', () => {
    narrowStructure(read('controlled-page.html'), manifest().regions[2].detection);
  });

  it('controlled page R3 rejects removing only the front column stacking level', () => {
    const html = read('controlled-page.html');
    const detection = manifest().regions[2].detection;
    narrowStructure(html, detection);
    const mutated = html.replace(/(#narrow-cover\s*\{[^}]*?)z-index:\s*\d+;/, '$1');
    expect(mutated).not.toBe(html);
    expect(() => narrowStructure(mutated, detection)).toThrow();
    narrowStructure(html, detection); // The unchanged input is still legal after the in-memory probe.
  });

  it('calibration pages exist and are referenced', () => {
    const data = manifest();
    calibrationPages(data, calibrationFiles(data));
  });

  it.each(['unknown severity', 'blocker downgraded', 'empty calibration', 'missing region marker'])('calibration rejects %s', mutation => {
    const data = manifest();
    const pages = calibrationFiles(data);
    let html = read('controlled-page.html');
    // Establish the unchanged valid input before each one-variable mutation.
    controlledPage(data, html);
    calibrationPages(data, pages);
    if (mutation === 'unknown severity') data.calibration[0].expected_severity = 'CRITICAL';
    if (mutation === 'blocker downgraded') data.calibration[3].expected_severity = 'IMPORTANT';
    if (mutation === 'empty calibration') data.calibration = [];
    if (mutation === 'missing region marker') html = html.replace('data-region="R7-keyboard-focus"', '');
    expect(() => {
      controlledPage(data, html);
      calibrationPages(data, pages);
    }).toThrow();
  });
});
