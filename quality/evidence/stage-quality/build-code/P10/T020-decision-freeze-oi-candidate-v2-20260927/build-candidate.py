from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[6]
out = Path(__file__).resolve().parent / "candidate"
files = [
    "tests/contract/decision-freeze-current-oi.test.mjs",
    "tests/integration/vnext-official-stage-run.test.mjs",
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

change(test, 'it("retains the legacy M6 freeze packet interpretation", () => {', '''it.each([
  ["unsupported fence", "```toml\\noi_id = 'OI-099'\\n```"],
  ["unclosed fence", "```yaml\\noi_id: OI-099"],
  ["stray close", "```"],
])("rejects %s even after four valid current OI categories", (_case, badFence) => {
  const decisionLog = authority().replace("## 历史说明", `${badFence}\\n## 历史说明`);
  const fact = validateDecisionFreeze({ decisionLog, ...identity });
  expect(fact.coverage).toEqual(["user_flow", "data_states", "success_failure_boundaries", "non_goals"]);
  expect(fact.errors.some((error) => error.startsWith("current OI authority "))).toBe(true);
});

it.each([
  ["open overrides approval", "| **状态（当前）** | open，待裁决 |", "confirmed", true],
  ["OI still open", "", "open", true],
  ["decision missing", "", "confirmed", false],
])("does not let a CF approval note hide %s", (_case, statusRow, oiStatus, includeDecision) => {
  const currentOi = authority().replace("## 历史说明", `${oi("OI-031", "success_failure_boundary", oiStatus)}\\n## 历史说明`);
  const decision = includeDecision ? "\\n### D-021\\n- decision: 用户已显式批准 OI-031 的处置。" : "";
  const cf = `\\n## 独立替代审查发现的未决冲突（须用户裁决）\\n### CF-5（已由用户裁决）\\n| 字段 | 内容 |\\n|---|---|\\n${statusRow}\\n| **用户裁决（当前）** | 用户已**显式批准** OI-031 的处置。 |\\n| 本修复的落地 | D-021 的决定已更新。 |`;
  const fact = validateDecisionFreeze({ decisionLog: `${currentOi}${decision}${cf}`, ...identity });
  expect(fact.ok).toBe(false);
  expect(fact.errors.some((error) => /(?:current CF|direction-level questions remain unresolved)/.test(error))).toBe(true);
});

it("retains the legacy M6 freeze packet interpretation", () => {''')

integration = "tests/integration/vnext-official-stage-run.test.mjs"
change(integration, 'function p3ApprovedDecision(state, { decisionId = "D-FIXTURE-1" } = {}) {', 'function p3ApprovedDecision(state, { decisionId = "D-FIXTURE-1", decisionLogTail = "" } = {}) {')
change(integration, '- freeze packet covers 用户流程、数据状态、成败边界、非目标。\\n`);', '- freeze packet covers 用户流程、数据状态、成败边界、非目标。\\n${decisionLogTail}`);')
change(integration, '  it.each(["approved scope", "stale scope", "missing scope", "no sources", "existing ID"])("decision-scope identity through the real build-plan handler: %s", async (scenario) => {', '''  it("keeps a current OI content failure after authenticated freeze sources are reconstructed", async () => {
    const state = fixture("p3-current-oi-bad-yaml");
    const decisionLogTail = `\\n### OI 记录（解析器权威记录，YAML）\\n\\`\\`\\`yaml\\noi_id: OI-001\\ncategory: complete_user_flow\\nstatus: confirmed\\n\\`\\`\\`\\n\\`\\`\\`yaml\\noi_id: OI-002\\ncategory: data_state\\nstatus: confirmed\\n\\`\\`\\`\\n\\`\\`\\`yaml\\noi_id: OI-003\\ncategory: success_failure_boundary\\nstatus: confirmed\\n\\`\\`\\`\\n\\`\\`\\`yaml\\noi_id: OI-004\\ncategory: non_goals\\nstatus: confirmed\\n\\`\\`\\`\\n\\`\\`\\`yaml\\noi_id: OI-099\\ncategory: [\\n\\`\\`\\`\\n`;
    const approved = p3ApprovedDecision(state, { decisionLogTail });
    const result = await runOfficialStage("build-plan", p3Context(state, "build-plan"), { decision_freeze: approved.input });
    expect(p3FreezeWarnings(result)).toEqual(expect.arrayContaining([
      expect.stringMatching(/decision freeze: current OI authority contains invalid YAML or JSON/),
    ]));
    expect(p3FreezeWarnings(result).join("; ")).not.toMatch(/not for the current decision scope revision/);
    expect(result.quality_status).toBe("incomplete");
  });

  it.each(["approved scope", "stale scope", "missing scope", "no sources", "existing ID"])("decision-scope identity through the real build-plan handler: %s", async (scenario) => {''')

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
  let fence = null;
  const parseFence = () => {
    let parsed;
    const content = fence.lines.join("\\n");
    try { parsed = fence.language === "json" ? JSON.parse(content) : yaml.load(content); }
    catch { errors.push("current OI authority contains invalid YAML or JSON"); return; }
    const entries = Array.isArray(parsed) ? parsed : object(parsed) && Array.isArray(parsed.ois) ? parsed.ois : [parsed];
    for (const entry of entries) {
      if (!object(entry)) { errors.push("current OI authority contains an invalid record"); continue; }
      records.push(entry);
    }
  };
  for (const line of body.split(/\\r?\\n/)) {
    const marker = /^[ \\t]*(`{3,}|~{3,})([^\\r\\n]*)$/.exec(line);
    if (fence === null) {
      if (!marker) continue;
      const language = marker[2].trim().toLowerCase();
      if (language === "") { errors.push("current OI authority has a stray closing fence"); continue; }
      fence = { marker: marker[1], language, lines: [] };
      if (marker[1] !== "```" || !["yaml", "yml", "json"].includes(language)) {
        errors.push("current OI authority contains an unsupported fence");
      }
    } else if (marker && marker[1] === fence.marker && marker[2].trim() === "") {
      if (fence.marker === "```" && ["yaml", "yml", "json"].includes(fence.language)) parseFence();
      fence = null;
    } else if (marker) {
      errors.push("current OI authority contains a malformed nested fence");
      fence = null;
    } else {
      fence.lines.push(line);
    }
  }
  if (fence !== null) errors.push("current OI authority contains an unclosed fence");
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
    records,
  };
}

function currentCfFreezeProjection(markdown, oiRecords) {
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
    const statuses = [...section.matchAll(/^\\|\\s*\\*\\*状态（(?:当前|[^）]*用户裁决)）\\*\\*\\s*\\|\\s*([^|]*)\\|/gm)];
    if (statuses.length > 1) { errors.push(`current CF ${id} has no unique current status`); continue; }
    if (statuses.length === 0) {
      const approval = /^\\|\\s*\\*\\*用户裁决（[^\\n]*）\\*\\*\\s*\\|\\s*(用户已\\*\\*显式批准\\*\\*[^|]*)\\|/m.exec(section);
      const landing = /^\\|\\s*本修复的落地\\s*\\|\\s*([^|]*)\\|/m.exec(section);
      const oiIds = [...new Set(approval?.[1].match(/\\bOI-\\d+\\b/g) ?? [])];
      const decisionId = landing?.[1].match(/\\b(D-\\d+)\\s+的 (?:decision|决定)/)?.[1] ?? null;
      const oi = oiIds.length === 1 ? oiRecords.find((record) => record.oi_id === oiIds[0]) : null;
      const decisionHeading = decisionId ? new RegExp(`^### ${decisionId}\\\\s*$`, "m").exec(markdown) : null;
      const decisionTail = decisionHeading ? markdown.slice(decisionHeading.index + decisionHeading[0].length) : "";
      const nextDecision = /^#{1,3}\\s+/m.exec(decisionTail);
      const decisionBody = decisionTail.slice(0, nextDecision ? nextDecision.index : undefined);
      if (approval && /已由用户裁决/.test(entry[0]) && oi?.status === "confirmed"
          && decisionHeading && decisionBody.includes(oiIds[0]) && /显式批准/.test(decisionBody)) continue;
      errors.push(`current CF ${id} has no verified current disposition`);
      continue;
    }
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
  const cf = oi ? currentCfFreezeProjection(value, oi.records) : { unresolved: [], errors: [] };
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
