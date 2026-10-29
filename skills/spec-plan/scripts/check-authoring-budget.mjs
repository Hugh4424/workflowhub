import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const REPORT_KEYS = Object.freeze(['chars', 'id_total', 'id_unique', 'id_repeat_ratio', 'longest_line', 'constant_field_lines', 'per_1k_ids', 'sentences', 'long_sentences', 'long_sentence_ratio', 'repeated_statement_ratio', 'abbreviation_candidates', 'unexplained_abbreviations']);
const size = text => [...text].length;
const ratio = (numerator, denominator) => denominator ? numerator / denominator : 0;

// Observations of the supplied bytes, never a readability verdict or a gate.
export function measureBudget(input) {
  const text = String(input), lines = text.split(/\r?\n/), chars = size(text);
  const ids = [...text.matchAll(/\b(?:(?:FR|AC|R|U|PRD|CARD|ORACLE|SCN|PFACT)-[A-Z0-9-]+|[PT]\d{3,})\b/g)].map(m => m[0]);
  const sentences = text.split(/[。！？.!?\n]+/u).map(s => s.trim()).filter(Boolean);
  const longSentences = sentences.filter(s => size(s) > 60).length;
  const statements = lines.map(s => s.trim()).filter(s => s && !/^(?:#|[-*]\s*\*\*|\||```|~~~)/.test(s));
  const prose = text.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '').replace(/`[^`\n]*`/g, '').replace(/\b[A-Z]+-[A-Z0-9-]+\b/g, '');
  const abbreviations = [...new Set(prose.match(/\b[A-Z]{2,8}\b/g) ?? [])];
  const unexplained = abbreviations.filter(id => {
    const index = prose.indexOf(id), nearby = prose.slice(Math.max(0, index - 30), index + id.length + 30);
    return !new RegExp(`(?:[\\p{Script=Han}][^\\n()（）]{0,24}[（(]${id}[）)]|${id}[（(][\\p{Script=Han}][^\\n()（）]*[）)]|${id}[^\\n]{0,20}见术语表)`, 'u').test(nearby);
  });
  return {
    chars, id_total: ids.length, id_unique: new Set(ids).size,
    id_repeat_ratio: ratio(ids.length, new Set(ids).size),
    longest_line: Math.max(0, ...lines.map(size)),
    constant_field_lines: lines.filter(line => /^\s*[-*]\s+\*\*[^*]+\*\*[:：]\s*(?:none|无|同上|固定常量|N\/A)\s*$/i.test(line)).length,
    per_1k_ids: ratio(ids.length * 1000, chars), sentences: sentences.length,
    long_sentences: longSentences, long_sentence_ratio: ratio(longSentences, sentences.length),
    repeated_statement_ratio: ratio(statements.length - new Set(statements).size, statements.length),
    abbreviation_candidates: abbreviations.length, unexplained_abbreviations: unexplained,
  };
}

export function runCli(argv) {
  try {
    if (argv.length !== 1) throw new Error('expected one material path');
    console.log(JSON.stringify(measureBudget(readFileSync(argv[0], 'utf8'))));
    return 0;
  } catch (error) {
    console.error(JSON.stringify({ error: error.code ?? 'AUTHORING_INPUT_UNREADABLE', message: error.message }));
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = runCli(process.argv.slice(2));
