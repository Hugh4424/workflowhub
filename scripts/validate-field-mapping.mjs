#!/usr/bin/env node
import { readFileSync } from "node:fs";

const VALID_TYPES = ["direct", "proxy", "weak_proxy"];

// 1. Validate schema structure
const schema = JSON.parse(readFileSync("contracts/field-mapping.schema.json", "utf-8"));
if (!schema.title) { console.error("FAIL: missing schema title"); process.exit(1); }
if (schema.properties.mappings.minItems !== 5) { console.error("FAIL: minItems != 5"); process.exit(1); }
if (schema.properties.mappings.items.required.length !== 7) { console.error("FAIL: required != 7 columns"); process.exit(1); }
const enumOk = schema.properties.mappings.items.properties.source_type.enum.every(t => VALID_TYPES.includes(t));
if (!enumOk) { console.error("FAIL: source_type enum mismatch"); process.exit(1); }

// 2. Validate real field-mapping.md has exactly 5 data rows × 7 columns
const md = readFileSync("specs/m10-baseline-switch/field-mapping.md", "utf-8");
const rows = md.split("\n").filter(l => {
  const t = l.trim();
  return t.startsWith("|") && VALID_TYPES.some(v => t.includes(v));
});
if (rows.length !== 5) { console.error(`FAIL: expected exactly 5 data rows, got ${rows.length}`); process.exit(1); }
for (const r of rows) {
  const cols = r.split("|").map(c => c.trim()).filter(Boolean);
  if (cols.length !== 7) { console.error(`FAIL: expected 7 columns, got ${cols.length} in row: ${cols.slice(0,2).join("|")}`); process.exit(1); }
  const st = cols[5]; // source_type is 6th column
  if (!VALID_TYPES.includes(st)) { console.error(`FAIL: invalid source_type "${st}"`); process.exit(1); }
}

console.log(`M10 field-mapping: PASS (schema valid, ${rows.length} rows × ${rows[0]?.split("|").map(c=>c.trim()).filter(Boolean).length||"?"} cols with valid source_types)`);
