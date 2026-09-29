from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[6]
out = Path(__file__).resolve().parent / "candidate"
files = [
    "tests/contract/decision-freeze-current-oi.test.mjs",
    "runtime/stage/stage-content-contracts.mjs",
    "runtime/stage/stage-handlers.mjs",
]
for relative in files:
    target = out / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(root / relative, target)

def change(relative, old, new):
    target = out / relative
    text = target.read_text()
    assert text.count(old) == 1, (relative, text.count(old), old[:80])
    target.write_text(text.replace(old, new))

test = "tests/contract/decision-freeze-current-oi.test.mjs"
change(test, '  expect(fact.errors).toContain("freeze packet is missing data_states");\n});', '''  expect(fact.errors).toContain("freeze packet is missing data_states");
});

it("does not fill a missing current OI from historical prose or YAML", () => {
  const old = `${oi("OI-099", "data_state", "confirmed")}\\n数据状态已覆盖。`;
  const decisionLog = authority().replace(oi("OI-002", "data_state", "confirmed"), "") + `\\n\\n## 旧记录\\n${old}`;
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.coverage).not.toContain("data_states");
  expect(fact.errors).toContain("freeze packet is missing data_states");
});

it("takes current open OI and current CF status over historical resolved prose", () => {
  const openOi = validateDecisionFreeze({ decisionLog: authority("open") + "\\n旧版本已经 RESOLVED。", ...identity });
  expect(openOi.errors).toContain("direction-level questions remain unresolved");
  const openCf = validateDecisionFreeze({ decisionLog: `${authority()}\\n\\n## 独立替代审查发现的未决冲突（须用户裁决）\\n### CF-1（当前冲突）\\n| 字段 | 内容 |\\n|---|---|\\n| **状态（当前）** | open，待用户裁决 |\\n\\n## 历史裁决\\nCF-1 RESOLVED by D-001`, ...identity });
  expect(openCf.errors).toContain("direction-level questions remain unresolved");
});

it.each([
  ["broken YAML", authority().replace("category: data_state", "category: [")],
  ["duplicate OI", authority().replace("## 历史说明", `${oi("OI-001", "data_state", "confirmed")}\\n## 历史说明`)],
  ["missing category", authority().replace("category: data_state\\n", "")],
  ["invalid category", authority().replace("category: data_state", "category: invented")],
  ["missing status", authority().replace("status: confirmed\\n", "")],
  ["invalid status", authority().replace("status: confirmed", "status: invented")],
  ["empty authority", authority().replace(/```yaml[\\s\\S]*?```/g, "")],
  ["duplicate authority heading", `${authority()}\\n### OI 记录（解析器权威记录，YAML）\\n${oi("OI-099", "data_state", "confirmed")}`],
])("fails closed for %s even when old text claims completion", (_case, decisionLog) => {
  const fact = validateDecisionFreeze({ decisionLog: `${decisionLog}\\n\\n## 旧状态\\n全部类别已确认，方向问题已解决。`, ...identity });
  expect(fact.ok).toBe(false);
  expect(fact.errors.some((error) => error.startsWith("current OI authority "))).toBe(true);
});

it.each([
  ["missing", ""],
  ["ambiguous", "| **状态（当前）** | maybe |"],
])("fails closed when current CF status is %s", (_case, statusRow) => {
  const decisionLog = `${authority()}\\n\\n## 独立替代审查发现的未决冲突（须用户裁决）\\n### CF-1（当前冲突）\\n| 字段 | 内容 |\\n|---|---|\\n${statusRow}\\n历史文字写着 RESOLVED by D-001`;
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.ok).toBe(false);
  expect(fact.errors.some((error) => error.startsWith("current CF "))).toBe(true);
});''')

contracts = "runtime/stage/stage-content-contracts.mjs"
anchor = 'function decisionFreezeModel(value) {\n'
helper = '''function currentOiFreezeProjection(markdown) {
  const heading = /^### OI 记录（解析器权威记录，YAML）\\s*$/gm;
  const matches = [...markdown.matchAll(heading)];
  if (matches.length === 0) return null;
  const errors = [];
  if (matches.length !== 1) errors.push("current OI authority has duplicate headings");
  const start = matches[0].index + matches[0][0].length;
  const tail = markdown.slice(start);
  const next = /^#{1,3}\\s+/m.exec(tail);
  const body = tail.slice(0, next ? next.index : undefined);
  const records = [];
  const fences = [...body.matchAll(/```(?:ya?ml|json)\\s*\\n([\\s\\S]*?)```/gi)];
  for (const fence of fences) {
    let parsed;
    try { parsed = /^\\s*\\{/.test(fence[1]) ? JSON.parse(fence[1]) : yaml.load(fence[1]); }
    catch { errors.push("current OI authority contains invalid YAML or JSON"); continue; }
    const entries = Array.isArray(parsed) ? parsed : object(parsed) && Array.isArray(parsed.ois) ? parsed.ois : [parsed];
    for (const entry of entries) {
      if (!object(entry)) { errors.push("current OI authority contains an invalid record"); continue; }
      records.push(entry);
    }
  }
  if (records.length === 0) errors.push("current OI authority has no records");
  const seen = new Set();
  const categories = new Set();
  const unresolved = [];
  const map = {
    complete_user_flow: "user_flow",
    data_state: "data_states",
    success_failure_boundary: "success_failure_boundaries",
    non_goals: "non_goals",
  };
  for (const record of records) {
    const id = record.oi_id ?? record.id;
    if (typeof id !== "string" || !/^OI-[A-Za-z0-9][A-Za-z0-9_-]*$/i.test(id)) {
      errors.push("current OI authority has a record without a valid OI id");
    } else if (seen.has(id)) {
      errors.push(`current OI authority duplicates ${id}`);
    } else seen.add(id);
    if (!DECISION_OUTLINE_FIXED_CATEGORIES.includes(record.category)) errors.push(`current OI authority ${id ?? "record"} category is missing or invalid`);
    else if (map[record.category]) categories.add(map[record.category]);
    if (!OI_STATUSES.has(record.status)) errors.push(`current OI authority ${id ?? "record"} status is missing or invalid`);
    else if (record.status === "open") unresolved.push(id ?? "open OI");
  }
  return {
    coverage: FREEZE_PACKET_COVERAGE.filter((category) => categories.has(category)),
    unresolved,
    errors,
  };
}

function currentCfFreezeProjection(markdown) {
  const heading = /^## 独立替代审查发现的未决冲突（须用户裁决）\\s*$/gm;
  const matches = [...markdown.matchAll(heading)];
  if (matches.length === 0) return { unresolved: [], errors: [] };
  const errors = [];
  if (matches.length !== 1) errors.push("current CF authority has duplicate headings");
  const tail = markdown.slice(matches[0].index + matches[0][0].length);
  const next = /^#{1,2}\\s+/m.exec(tail);
  const body = tail.slice(0, next ? next.index : undefined);
  const entries = [...body.matchAll(/^#{3,4}\\s+(CF-\\d+)(?!\\s*[–-])[^\\n]*$/gm)];
  if (entries.length === 0) errors.push("current CF authority has no numbered conflicts");
  const seen = new Set();
  const unresolved = [];
  for (const [index, entry] of entries.entries()) {
    const id = entry[1];
    if (seen.has(id)) errors.push(`current CF authority duplicates ${id}`);
    seen.add(id);
    const section = body.slice(entry.index + entry[0].length, entries[index + 1]?.index);
    if (id === "CF-5" && /已由用户裁决/.test(entry[0])) {
      if (!/^\\|\\s*\\*\\*用户裁决（[^\\n]*）\\*\\*\\s*\\|\\s*用户已\\*\\*显式批准\\*\\*/m.test(section)) {
        errors.push("current CF CF-5 has no explicit user decision");
      }
      continue;
    }
    const statuses = [...section.matchAll(/^\\|\\s*\\*\\*状态（(?:当前|[^）]*用户裁决)）\\*\\*\\s*\\|\\s*([^|]*)\\|/gm)];
    if (statuses.length !== 1) { errors.push(`current CF ${id} has no unique current status`); continue; }
    const status = statuses[0][1].replace(/\\*/g, "").trim();
    if (/^RESOLVED by D-\\d+/i.test(status)) continue;
    if (/^(?:open|未决)/i.test(status)) { unresolved.push(id); continue; }
    errors.push(`current CF ${id} status is invalid`);
  }
  return { unresolved, errors };
}

'''
change(contracts, anchor, helper + anchor)
change(contracts, '  const active = value.match(/### M6[\\s\\S]*?(?=\\n### |\\n## |$)/i)?.[0] ?? value;\n', '''  const oi = currentOiFreezeProjection(value);
  const cf = oi ? currentCfFreezeProjection(value) : { unresolved: [], errors: [] };
  const active = value.match(/### M6[\\s\\S]*?(?=\\n### |\\n## |$)/i)?.[0] ?? value;
''')
change(contracts, '    unresolved_direction_questions: unresolved,\n    freeze_packet: { coverage },', '''    unresolved_direction_questions: oi ? [...oi.unresolved, ...cf.unresolved] : unresolved,
    freeze_packet: { coverage: oi?.coverage ?? coverage },
    _decision_freeze_content_errors: oi ? [...oi.errors, ...cf.errors] : [],''')
change(contracts, '  const errors = [];\n  const binding = freezeSource(model.approval_binding);', '''  const errors = Array.isArray(model._decision_freeze_content_errors)
    ? [...model._decision_freeze_content_errors] : [];
  const binding = freezeSource(model.approval_binding);''')

handlers = "runtime/stage/stage-handlers.mjs"
change(handlers, '  let checked = validateDecisionFreeze({ decisionLog, ...current });\n', '''  let checked = validateDecisionFreeze({ decisionLog, ...current });
  const contentErrors = checked.errors.filter((error) => /^(?:current OI authority|current CF )/.test(error));
''')
change(handlers, '      checked = validateDecisionFreeze({ decisionLog: model, ...current, currentDecisionScopeRevision: sources.currentDecisionScopeRevision });\n', '''      checked = validateDecisionFreeze({ decisionLog: model, ...current, currentDecisionScopeRevision: sources.currentDecisionScopeRevision });
      if (contentErrors.length > 0) {
        const errors = [...new Set([...checked.errors, ...contentErrors])];
        checked = Object.freeze({
          ...checked, ok: false, status: "paused", next_action: "return_to_make_decision",
          errors: Object.freeze(errors),
          reason_codes: Object.freeze(errors.map((error) => error.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase())),
        });
      }
''')

print("candidate copies written")
