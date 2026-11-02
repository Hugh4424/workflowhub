// Read-only extraction of the reviewer text and findings object from one raw
// provider event stream. Never writes into the broker runtime.
import { readFileSync, writeFileSync } from "node:fs";
const [rawPath, outPrefix] = process.argv.slice(2);
const raw = readFileSync(rawPath, "utf8");

function responsesFromEvents(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let j; try { j = JSON.parse(line); } catch { continue; }
    if (typeof j === "string") { out.push(j); continue; }
    if (j.type === "item.completed" && typeof j.item?.text === "string") out.push(j.item.text);
    if (typeof j.message === "string") out.push(j.message);
    if (typeof j.response === "string") out.push(j.response);
    if (typeof j.text === "string") out.push(j.text);
    if (j.role === "assistant" && typeof j.content === "string" && j.content.trim()) out.push(j.content);
    if (j.result && typeof j.result.response === "string") out.push(j.result.response);
    if (j.result && typeof j.result.text === "string") out.push(j.result.text);
    if (j.item && typeof j.item.content === "string") out.push(j.item.content);
  }
  return out;
}

function lastFindingsObject(text) {
  const key = '"findings"';
  let at = text.lastIndexOf(key);
  while (at >= 0) {
    // walk left to the enclosing '{'
    let start = -1;
    for (let i = at; i >= 0; i -= 1) {
      if (text[i] === "{") { start = i; break; }
      if (text[i] === "}" || text[i] === "]" || text[i] === "\n") { if (text[i] === "\n") continue; }
    }
    if (start >= 0) {
      let depth = 0, quoted = false, escaped = false;
      for (let i = start; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) { if (escaped) escaped = false; else if (c === "\\") escaped = true; else if (c === '"') quoted = false; continue; }
        if (c === '"') quoted = true;
        else if (c === "{") depth += 1;
        else if (c === "}" && --depth === 0) {
          const candidate = text.slice(start, i + 1);
          try { const parsed = JSON.parse(candidate); if (parsed && Object.hasOwn(parsed, "findings")) return { json: candidate, parsed, start, end: i + 1 }; } catch { /* keep looking */ }
          break;
        }
      }
    }
    at = text.lastIndexOf(key, at - 1);
  }
  return null;
}

const responses = responsesFromEvents(raw);
const text = responses.length ? responses.at(-1) : raw;
const found = lastFindingsObject(text) ?? lastFindingsObject(raw);
writeFileSync(`${outPrefix}.response.txt`, text);
if (found) writeFileSync(`${outPrefix}.findings.json`, JSON.stringify(found.parsed, null, 2) + "\n");
console.log(JSON.stringify({
  raw_bytes: Buffer.byteLength(raw),
  event_texts: responses.length,
  response_bytes: Buffer.byteLength(text),
  findings_parsed: Boolean(found),
  findings_count: found ? found.parsed.findings.length : null,
  findings_sha256_input_bytes: found ? Buffer.byteLength(found.json) : null,
}, null, 2));
