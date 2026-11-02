import { readFileSync, writeFileSync } from 'node:fs';
const root='/Users/Hugh/Hugh/Project/workflowhub-workflowhub-ui-frontend-c07-real-page-verification-20261028/quality/evidence/build-code/2026-10-31-p12-writeside-experiment';
const spec=readFileSync(`${root}/spec-fragment.md`,'utf8');
const phase=readFileSync(`${root}/phase-fragment.md`,'utf8');
const ac=spec.slice(spec.indexOf('### 验收 1：'), spec.indexOf('## Appendix B'));
const accept=phase.slice(phase.indexOf('## 这一 Phase 怎么验收？'), phase.indexOf('## 为什么现在做'));
const out=`# 作者那条标准（逐字）\n\n## 来源：spec-fragment.md 的 AC-EFFECT-001 与 phase-fragment.md 的「这一 Phase 怎么验收？」\n\n${ac.trim()}\n\n---\n\n${accept.trim()}\n`;
writeFileSync('/tmp/p12-greenbutwrong/blind/standard.md', out);
console.log('bytes', Buffer.byteLength(out), 'sha256', (await import('node:crypto')).createHash('sha256').update(out).digest('hex'));
