const RINGS = Object.freeze(["\u539F\u59CB\u9700\u6C42", "decision-log", "\u8C03\u7814\u65B9\u6848", "\u65B9\u6848", "spec", "phase", "\u4EE3\u7801\u5B9E\u73B0", "\u6D4B\u8BD5\u9A8C\u8BC1", "\u6700\u7EC8\u5BA1\u67E5", "\u63D0\u4EA4 PR"].map((name, i) => Object.freeze({ ring: i + 1, name })));
const RING_STATES = Object.freeze(["completed", "skipped", "not_applicable", "incomplete", "unavailable"]);
const LEVELS = Object.freeze(["small", "normal", "complex", "planning"]);
const EVIDENCE_TYPES = Object.freeze(["command_exit", "file_sha256", "record_ref"]);
const LEVEL_APPLICABILITY = Object.freeze(Object.fromEntries(RINGS.map(({ ring }) => [ring, Object.freeze(Object.fromEntries(LEVELS.map((level) => [level, Object.freeze({
  applicability: level === "planning" && ring >= 5 && ring <= 9 || level === "small" && ring === 9 ? "not_applicable" : ring === 10 || level === "small" && ring === 3 ? "on_demand" : "required",
  source: ring < 5 || ring === 10 ? "level-declaration" : "step-table"
})])))])));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const present = (value) => Array.isArray(value) ? value.length > 0 && value.every(present) : typeof value === "string" ? text(value) : value !== null && value !== void 0;
const fail = (code, message) => {
  throw Object.assign(new TypeError(message), { code });
};
const sourceOK = (value) => object(value) && text(value.ref) && value.safe === true && value.readable === true && value.verified === true;
const normalizeLevel = (value) => text(value) ? { small: "small", \u5C0F\u6539\u52A8: "small", \u5355\u70B9\u5C0F\u6539\u52A8: "small", normal: "normal", \u666E\u901A: "normal", complex: "complex", \u590D\u6742: "complex", planning: "planning", \u89C4\u5212: "planning" }[value.trim().toLowerCase()] ?? null : null;
function resolveLevel(materials = {}) {
  const reasons = [];
  const section = typeof materials.decisionLog === "string" ? materials.decisionLog.match(/^## 级别与路线\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] : null;
  const declaration = materials.levelDeclaration;
  const selected = normalizeLevel(declaration?.selected);
  if (!text(section)) reasons.push("\u7EA7\u522B\u4E0E\u8DEF\u7EBF\u8282\u672A\u53D6\u5F97");
  if (!selected || declaration?.confirmed !== true) reasons.push("\u771F\u5B9E\u7528\u6237\u9009\u62E9\u672A\u53D6\u5F97");
  const choices = section ? [...section.matchAll(/(?:用户选择|真实用户选择|用户已确认级别|确认级别)\s*[:：]\s*([^\n；;]+)/g)] : [];
  const effective = choices.filter((match) => normalizeLevel(match[1]));
  const latest = effective.at(-1);
  if (!latest || normalizeLevel(latest[1]) !== selected) reasons.push("选择与最新有效级别不对应");
  if (latest) {
    const next = choices.find((match) => match.index > latest.index);
    const currentText = section.slice(latest.index, next?.index ?? section.length);
    const original = currentText.match(/原\s*ref\s*[:：]\s*([^\s\n]+)/i)?.[1];
    if (!original || original !== declaration?.source?.ref) reasons.push("最新选择自身的原件来源未取得或不对应");
  }
  if (!sourceOK(declaration?.source)) reasons.push("\u9009\u62E9\u539F\u4EF6\u4E0D\u53EF\u5B89\u5168\u56DE\u8BFB");
  if (!sourceOK(declaration?.entrySource)) reasons.push("\u5165\u53E3\u8C03\u7528\u539F\u4EF6\u672A\u53D6\u5F97");
  for (const key of ["scope", "change_kind", "independent_units", "risk", "credentials", "dependencies", "acceptance"]) {
    const fact = declaration?.facts?.[key];
    if (!object(fact) || !present(fact.value) || !sourceOK(fact.source)) reasons.push(`\u5224\u7EA7\u4E8B\u5B9E ${key} \u6216\u6765\u6E90\u672A\u53D6\u5F97`);
  }
  if (declaration?.conflict === true) reasons.push("\u591A\u4E2A\u9009\u62E9\u65E0\u6CD5\u6D88\u6B67");
  if (declaration?.invalidatedByRisk === true) reasons.push("\u65B0\u98CE\u9669\u4F7F\u65E7\u9009\u62E9\u5931\u6548");
  return reasons.length ? { value: "complex", declared: false, source: "fallback-complex", note: "\u7EA7\u522B\u672A\u53D6\u5F97", reasons, owner: "\u5F53\u524D make-decision \u6765\u6E90 owner" } : { value: selected, declared: true, source: "level-declaration" };
}
function evidenceType(value) {
  const type = value?.evidence_type ?? value?.evidence_level ?? null;
  if (type !== null && !EVIDENCE_TYPES.includes(type)) fail("INVALID_EVIDENCE_TYPE", `Unknown evidence type: ${type}`);
  return type;
}
function verifiedEvidence(value) {
  const type = evidenceType(value);
  if (!type || value?.verified !== true || value?.readable !== true || !text(value.ref)) return false;
  if (type === "command_exit") return text(value.command) && Number.isInteger(value.exit_code);
  if (type === "file_sha256") return /^[a-f0-9]{64}$/i.test(value.sha256 ?? "");
  return object(value.fields) && Object.keys(value.fields).length > 0 && Object.values(value.fields).every(present);
}
function basisFor(item = {}) {
  const inputs = Array.isArray(item.basis) && item.basis.length ? item.basis : evidenceType(item) ? [item] : [];
  const seen = /* @__PURE__ */ new Map();
  return inputs.map((entry) => {
    const type = evidenceType(entry), key = JSON.stringify([type, entry.ref, entry.sha256, entry.command, entry.exit_code]);
    const basis = { ...entry, evidence_level: type };
    delete basis.basis;
    if (seen.has(key)) basis.duplicate_of = seen.get(key);
    else {
      delete basis.duplicate_of;
      seen.set(key, text(entry.ref) ? entry.ref : key);
    }
    return basis;
  });
}
function evaluateRing(bundle = {}, ring, level) {
  if (!Number.isInteger(ring) || !RINGS[ring - 1]) fail("INVALID_RING", `Unknown ring: ${ring}`);
  if (!LEVELS.includes(level?.value)) fail("INVALID_LEVEL", `Unknown level: ${level?.value}`);
  const policy = LEVEL_APPLICABILITY[ring][level.value], item = bundle.rings?.[ring];
  if (item?.state !== void 0 && !RING_STATES.includes(item.state)) fail("INVALID_RING_STATE", `Unknown state: ${item.state}`);
  evidenceType(item);
  const basis = basisFor(item), notes = [];
  let state = "incomplete", conflict = item?.conflict || null, type = verifiedEvidence(item) ? evidenceType(item) : null;
  const result = () => {
    if (level.declared === false) notes.push("\u7EA7\u522B\u672A\u53D6\u5F97 (fallback-complex)");
    if (notes.length) {
      if (basis.length) basis[0] = { ...basis[0], notes: [...basis[0].notes ?? [], ...notes] };
      else basis.push({ evidence_level: null, notes });
    }
    return { ring, name: RINGS[ring - 1].name, applicability: policy.applicability, state, evidence_type: type, basis, counted_in_denominator: state !== "not_applicable", conflict };
  };
  if (policy.applicability === "not_applicable") {
    state = "not_applicable";
    type = null;
    notes.push(`\u7EA7\u522B ${level.value} \u7684\u5F53\u524D\u8DEF\u7EBF\u4E0D\u9002\u7528`);
    if (ring === 9) notes.push("\u89C4\u5212\u6587\u6863\u5BA1\u4E0D\u5145\u5F53\u5B9E\u73B0\u5BA1");
    return result();
  }
  if (conflict) {
    notes.push(`冲突: ${String(conflict)}`);
    return result();
  }
  if (ring === 3 && policy.applicability === "on_demand") {
    if (bundle.directionChangingUnknown === false) {
      state = "not_applicable";
      notes.push("\u65E0\u771F\u5B9E\u672A\u77E5");
      return result();
    }
    if (bundle.directionChangingUnknown !== true) {
      state = "unavailable";
      notes.push("\u65E0\u6CD5\u5224\u5B9A\u771F\u5B9E\u672A\u77E5");
      return result();
    }
  }
  if (ring === 10) {
    const delivery = bundle.delivery;
    if (delivery?.declared === false) {
      state = "not_applicable";
      notes.push("\u6709\u6E90\u58F0\u660E\u4E0D\u505A\u4EA4\u4ED8");
      return result();
    }
    if (delivery?.declared !== true) {
      state = "unavailable";
      notes.push("\u4EA4\u4ED8\u58F0\u660E\u672A\u53D6\u5F97");
      return result();
    }
    if (delivery.timing_verified !== true || typeof delivery.reached !== "boolean") {
      state = "unavailable";
      notes.push("\u771F\u5B9E\u4EA4\u4ED8\u65F6\u70B9\u672A\u53D6\u5F97");
      return result();
    }
    if (!delivery.reached) {
      state = "skipped";
      notes.push("\u6D41\u7A0B\u672A\u5230");
      return result();
    }
    const pr = delivery.pr;
    if (pr && Number.isInteger(pr.number) && pr.number > 0 && text(pr.url) && text(pr.head) && text(pr.base) && verifiedEvidence(pr) && (evidenceType(pr) !== "command_exit" || pr.exit_code === 0)) {
      state = "completed";
      type = evidenceType(pr);
      basis.push(...basisFor(pr));
    } else notes.push("\u5DF2\u5230\u4EA4\u4ED8\u65F6\u70B9\uFF0C\u5E94\u6709 PR \u539F\u4EF6\u672A\u53D6\u5F97");
    return result();
  }
  if (ring === 6) {
    if (!Array.isArray(bundle.phaseWriteSet) || !Array.isArray(bundle.specWriteSet)) {
      state = "unavailable";
      notes.push("\u5199\u96C6\u672A\u53D6\u5F97");
      return result();
    }
    const outside = bundle.phaseWriteSet.filter((path) => !bundle.specWriteSet.includes(path));
    if (outside.length) {
      conflict = `Phase \u4E0E spec \u5199\u96C6\u51B2\u7A81: ${outside.join(", ")}`;
      notes.push(conflict);
      return result();
    }
  }
  if (!item || item.readable === false || item.unavailable === true) {
    state = "unavailable";
    notes.push("\u73AF\u539F\u4EF6\u672A\u53D6\u5F97");
    return result();
  }
  if (item.trigger === false && item.executed === false && text(item.rule_ref)) {
    state = "not_applicable";
    notes.push(item.rule_ref);
    return result();
  }
  if (item.reached === false && item.timing_verified === true) {
    state = "skipped";
    notes.push("\u6D41\u7A0B\u672A\u5230");
    return result();
  }
  if (item.executed === false) {
    notes.push("\u5E94\u505A\u4F46\u672A\u6267\u884C");
    return result();
  }
  if (!type) {
    notes.push("\u53EA\u6709\u5B58\u5728\u6027\u6216\u672A\u6838\u5B9E\u5B57\u6BB5\uFF0C\u6CA1\u6709\u53EF\u6838\u6267\u884C\u4E8B\u5B9E");
    return result();
  }
  if (type === "command_exit" && item.exit_code !== 0) {
    notes.push("\u5B9E\u9645\u547D\u4EE4\u5931\u8D25");
    return result();
  }
  if (ring === 2 || ring === 5) {
    if (item.nonempty !== true || !Number.isInteger(item.scan_count) || item.scan_count <= 0 || item.required_sections_present !== true || ring === 2 && !(Number.isInteger(item.decision_count) && item.decision_count > 0) || ring === 5 && item.contract_ok !== true) {
      notes.push("\u626B\u63CF\u4E3A\u7A7A\u3001\u5FC5\u8981\u6BB5\u7F3A\u5931\u6216\u5B9E\u9645\u5408\u540C\u7ED3\u679C\u672A\u901A\u8FC7");
      return result();
    }
    if (ring === 5) notes.push("\u4EC5\u8BC1\u660E\u58F0\u660E\u7EA7\u5408\u540C\uFF0C\u4E0D\u8BC1\u660E\u6267\u884C");
  }
  if (ring === 4) {
    if (item.rows_readable === false) {
      state = "unavailable";
      notes.push("\u5355\u5143\u8FFD\u8E2A\u8868\u4E0D\u53EF\u8BFB");
      return result();
    }
    if (!Array.isArray(item.rows) || !item.rows.length || item.rows.some((row) => !["source", "fr_ac", "phase_task", "oracle"].every((key) => present(row?.[key])))) {
      notes.push("\u5355\u5143\u8FFD\u8E2A\u7F3A\u6765\u6E90/FR\u6216AC/Phase\u6216Task/oracle");
      return result();
    }
  }
  if (ring === 7 && (item.diff_verified !== true || !Array.isArray(item.changed_files) || !item.changed_files.length)) {
    notes.push("\u5F53\u524D\u5B9E\u73B0 diff \u672A\u6838\u5B9E\u6216\u4E3A\u7A7A");
    return result();
  }
  if (ring === 9) {
    const providers = Array.isArray(item.providers) ? item.providers : [item.provider];
    const coverageRows = Array.isArray(item.material_coverage) ? item.material_coverage : [item.material_coverage];
    const coverageOK = (provider) => coverageRows.some((coverage) => object(coverage)
      && text(provider?.provider) && coverage.provider === provider.provider
      && ["read", "unread", "undetermined"].every((key) => Array.isArray(coverage[key]) && coverage[key].every(text)));
    const providerOK = providers.some((p) => p?.status === "completed" && p.parse_outcome === "ok" && text(p.raw_ref) && p.readable === true && coverageOK(p));
    const identityOK = text(bundle.task_id) && item.task_id === bundle.task_id && item.independent === true && item.current_scope === true && ["code", "implementation", "delivery"].includes(item.surface);
    const scopeOK = level.value === "normal" ? item.stage === "build-code" && item.review_scope === "phase" && item.subject_kind === "phase" && item.review_kind === null && item.phase_id === null : item.final === true && item.phase_reviews_verified === true && ["task", "delivery", "stage"].includes(item.review_scope);
    if (!identityOK || !scopeOK || !providerOK) {
      state = "unavailable";
      notes.push("\u73AF 9 \u4E0D\u53EF\u673A\u5224\uFF1A\u5B8C\u6574\u8EAB\u4EFD\u3001\u5F53\u524D\u8303\u56F4\u3001\u539F\u59CB\u610F\u89C1\u6216\u8986\u76D6\u4E8B\u5B9E\u672A\u53D6\u5F97");
      return result();
    }
    notes.push("\u53EA\u8BB0\u5F55\u5B9E\u9645\u72EC\u7ACB\u5BA1\u67E5\u7EC8\u6001\uFF1B\u7A7A findings \u4E0D\u4EE3\u8868\u8D28\u91CF\u901A\u8FC7");
    for (const coverage of coverageRows) if (object(coverage) && Array.isArray(coverage.undetermined)) notes.push(...coverage.undetermined.map((ref) => `审查读取未确认: ${ref}`));
    if (Array.isArray(item.discarded_facts)) notes.push(...item.discarded_facts.map((fact) => `真实丢弃事实: ${JSON.stringify(fact)}`));
    for (const p of providers) if (p && !(p.status === "completed" && p.parse_outcome === "ok")) notes.push(`\u5BA1\u67E5\u8DEF\u9650\u5236: ${p.status ?? "unavailable"}/${p.parse_outcome ?? "unknown"}`);
  }
  state = "completed";
  return result();
}
function summarize(results) {
  if (!Array.isArray(results) || results.length !== 10) fail("INVALID_RESULTS", "Expected exactly ten ring results");
  const seen = /* @__PURE__ */ new Set();
  for (const row of results) {
    if (!Number.isInteger(row?.ring) || row.ring < 1 || row.ring > 10 || seen.has(row.ring) || !RING_STATES.includes(row.state)) fail("INVALID_RESULTS", "Unknown/duplicate ring or state");
    evidenceType(row);
    seen.add(row.ring);
  }
  const applicable = results.filter((row) => row.state !== "not_applicable").length;
  if (!applicable) fail("ZERO_DENOMINATOR", "No applicable ring");
  const completed = results.filter((row) => row.state === "completed").length;
  return { completion: { applicable, completed, rate: completed / applicable }, metrics: { skip_rate: (results.length - applicable) / results.length, attestation_coverage: results.filter((row) => EVIDENCE_TYPES.includes(row.evidence_type)).length / results.length } };
}
const stepKey = (row) => `${row.source}\0${row.step_slug}`;
const noteBasis = (ref, note) => ({ evidence_level: null, ref, note });
function humanReadback(human, step) {
  return object(human) && text(human.ref) && human.readable === true && human.verified === true && human.source === step.source && human.step_slug === step.step_slug && text(human.reader) && present(human.inputs) && present(human.observation) && human.criteria_ref === step.owner_ref && ["completed", "incomplete", "unavailable", "skipped"].includes(human.conclusion) && Array.isArray(human.limits);
}
function evaluateWorkflowSteps({ steps, evidence = [], level, stageScope } = {}) {
  if (!Array.isArray(steps) || !Array.isArray(evidence)) fail("INVALID_WORKFLOW_INPUT", "steps and evidence must be arrays");
  if (!LEVELS.includes(level?.value)) fail("INVALID_LEVEL", "Workflow level must be known");
  const rootSource = "workflows/make-decision/steps.json";
  const hasRoot = steps.some((step) => step?.source === rootSource);
  const selected = steps.filter((step) => {
    if (!text(step?.source) || !text(step.step_slug)) fail("INVALID_STEP", "Step source and slug are required");
    if (step.source === rootSource) return level.value === "complex";
    const flow = step.source.match(/^workflows\/make-decision\/flows\/([^/]+)\/steps\.json$/);
    if (flow) return flow[1] === level.value && !(level.value === "complex" && hasRoot);
    if (step.stage === "build-prd" && level.value === "planning") return stageScope?.actual?.some((stage) => (stage?.stage ?? stage) === "build-prd") === true;
    return !step.route || step.route === level.value;
  });
  const seen = /* @__PURE__ */ new Set();
  return selected.map((step) => {
    const key = stepKey(step);
    if (seen.has(key)) fail("DUPLICATE_STEP", `Duplicate step: ${step.source}#${step.step_slug}`);
    seen.add(key);
    const matches = evidence.filter((row) => row?.source === step.source && row.step_slug === step.step_slug);
    const basis = [], limits = [];
    let state = "unavailable";
    const applicability = step.applicability ?? "required";
    if (!["required", "on_demand", "not_applicable"].includes(applicability)) fail("INVALID_APPLICABILITY", `Unknown applicability: ${applicability}`);
    const legalSkip = step.trigger === false && step.executed === false && text(step.rule_ref);
    const humanRows = matches.filter((row) => row.human).map((row) => row.human);
    const validHumanRows = humanRows.filter((value) => humanReadback(value, step));
    const humanConclusions = validHumanRows.map((value) => value.conclusion);
    const humanConflict = humanRows.some((value) => !humanReadback(value, step))
      || humanConclusions.some((value) => value !== "skipped")
      || new Set(humanConclusions).size > 1;
    const programFailure = matches.some((row) => row.program && ((Number.isInteger(row.program.exit_code) && row.program.exit_code !== 0) || row.program.target_failed === true));
    const skipConflict = matches.some((row) => row.conflict) || humanConflict || programFailure;
    if (legalSkip && !skipConflict) {
      state = "not_applicable";
      basis.push(noteBasis(step.rule_ref, "\u771F\u5B9E\u89C4\u5219\u786E\u8BA4\u672A\u89E6\u53D1\u4E14\u672A\u6267\u884C"));
    } else if (legalSkip && skipConflict) {
      state = "incomplete";
      limits.push("合法跳过观察与同一步真实观察冲突；保留冲突，不能记 not_applicable");
    } else if (step.method_flags_unknown === true) {
      state = "unavailable";
      limits.push("方法 human/program 义务声明 unknown；交当前方法 owner，不能据缺失声明完成");
    } else {
      const programs = matches.filter((row) => row.program).map((row) => row.program);
      const humans = matches.filter((row) => row.human).map((row) => row.human);
      for (const program of programs) basis.push(...basisFor(program));
      const validPrograms = programs.filter(verifiedEvidence);
      const failed = validPrograms.some((p) => p.exit_code !== void 0 && p.exit_code !== 0 || p.target_failed === true);
      const zeroScan = programs.some((p) => p.scan_count === 0 || p.input_count === 0 || p.supported === false);
      const programSatisfied = step.program_required === true
        ? programs.length > 0 && validPrograms.length === programs.length
        : !programs.length || validPrograms.length === programs.length;
      const conclusions = humans.filter((value) => humanReadback(value, step));
      for (const value of humans) {
        if (humanReadback(value, step)) basis.push({ ...value, evidence_level: "record_ref" });
        else {
          basis.push(noteBasis(value?.ref ?? null, "\u4EBA\u8BFB\u539F\u4EF6\u8EAB\u4EFD/\u539F\u5224\u636E/\u89C2\u5BDF\u4E0D\u53EF\u6838"));
          limits.push("human \u539F\u4EF6\u4E0D\u53EF\u53EF\u9760\u63D0\u53D6\u6216 source \u8EAB\u4EFD\u51B2\u7A81\uFF1B\u4EA4\u771F\u5B9E reader");
        }
      }
      const conflict = matches.some((row) => row.conflict) || new Set(conclusions.map((value) => value.conclusion)).size > 1;
      if (failed || conflict || conclusions.some((value) => value.conclusion === "incomplete")) state = "incomplete";
      else if (!text(step.owner_ref)) limits.push("完成判据 consumer 未取得；交当前步骤 owner");
      else if (zeroScan) limits.push("\u574F checker\uFF1A\u96F6\u8F93\u5165/\u96F6\u626B\u63CF/\u4E0D\u652F\u6301\uFF0C\u4E0D\u4F5C\u4E1A\u52A1\u5931\u8D25");
      else if (conclusions.some((value) => value.conclusion === "completed") && programSatisfied) state = "completed";
      else if (step.human_required === false && step.program_required === true && validPrograms.length > 0 && validPrograms.length === programs.length) state = "completed";
      else if (matches.some((row) => row.reached === false && row.timing_verified === true)) {
        state = "skipped";
        limits.push("\u6D41\u7A0B\u672A\u5230");
      } else limits.push("\u7F3A\u771F\u5B9E human \u5B8C\u6210\u539F\u4EF6\u6216\u53EF\u6838\u7A0B\u5E8F\u5B50\u9762\uFF1B\u4EA4\u539F\u65B9\u6CD5 reader");
      if (programs.length > validPrograms.length) limits.push("program \u547D\u4EE4/exit/\u539F\u4EF6\u6765\u6E90\u672A\u6838\u5B9E");
      for (const value of conclusions) limits.push(...value.limits);
      if (!text(step.owner_ref) && state === "incomplete") limits.push("完成判据 consumer 未取得；已核程序失败仍保留");
    }
    if (applicability === "not_applicable" && !legalSkip) limits.push("\u4E0D\u9002\u7528\u7F3A\u771F\u5B9E\u89C4\u5219\u53CA\u672A\u8C03\u7528\u4E8B\u5B9E");
    return { ...step, applicability, state, basis, limits, human: matches.map((row) => row.human).filter(Boolean), program: matches.map((row) => row.program).filter(Boolean) };
  });
}
function summarizeWorkflow(results, stageScope) {
  if (!Array.isArray(results)) fail("INVALID_WORKFLOW_RESULTS", "Workflow results must be an array");
  if (!results.length) return null;
  const declared = results.map((row) => ({ source: row.source, step_slug: row.step_slug }));
  const applicable = results.filter((row) => row.state !== "not_applicable");
  for (const row of results) if (!RING_STATES.includes(row.state)) fail("INVALID_WORKFLOW_STATE", `Unknown step state: ${row.state}`);
  const originals = /* @__PURE__ */ new Set(), attested = [];
  for (const row of applicable) {
    const humanFact = (value) => value?.evidence_level === "record_ref"
      && value.verified === true && value.readable === true && text(value.ref) && text(value.reader)
      && value.source === row.source && value.step_slug === row.step_slug;
    const scopedHumanFact = (value) => humanFact(value) && present(value.inputs) && present(value.observation);
    const scopedProgramFact = (value) => verifiedEvidence(value) && evidenceType(value) !== "record_ref";
    const facts = (row.basis ?? []).filter((value) => verifiedEvidence(value) || humanFact(value));
    const unique = facts.find((value) => {
      if (value.duplicate_of) return false;
      const key = scopedHumanFact(value) || scopedProgramFact(value)
        ? `${row.source}\0${row.step_slug}\0${value.ref}`
        : value.ref;
      return !originals.has(key);
    });
    if (unique) {
      originals.add(scopedHumanFact(unique) || scopedProgramFact(unique)
        ? `${row.source}\0${row.step_slug}\0${unique.ref}`
        : unique.ref);
      attested.push({ source: row.source, step_slug: row.step_slug, ref: unique.ref });
    }
  }
  const stageName = (row) => typeof row === "string" ? row : row?.stage;
  const stageDeclared = Array.isArray(stageScope?.declared) ? [...new Set(stageScope.declared.map(stageName))] : [];
  const actual = Array.isArray(stageScope?.actual) ? stageScope.actual.map(stageName) : [];
  const stageKnown = stageScope?.verified === true && stageDeclared.length > 0 && stageDeclared.every(text) && Array.isArray(stageScope.actual);
  const skipped = stageKnown ? (stageScope.skipped ?? []).filter((row) => row.confirmed === true && text(row.rule_ref) && stageDeclared.includes(row.stage) && !actual.includes(row.stage)) : [];
  const skippedNames = [...new Set(skipped.map((row) => row.stage))];
  return {
    step_attestation_coverage: applicable.length ? attested.length / applicable.length : null,
    stage_skip_rate: stageKnown ? skippedNames.length / stageDeclared.length : null,
    declared_steps: declared,
    applicable_steps: applicable.map(({ source, step_slug }) => ({ source, step_slug })),
    step_attestation_numerator: attested.length,
    step_attestation_denominator: applicable.length,
    attested_steps: attested,
    stage_skip_numerator: stageKnown ? skippedNames.length : null,
    stage_skip_denominator: stageKnown ? stageDeclared.length : null,
    declared_stages: stageDeclared,
    actual_stages: stageScope?.actual ?? null,
    skipped_stages: skipped,
    stage_source_refs: stageScope?.source_refs ?? [],
    limits: [...!applicable.length ? ["\u9002\u7528 step \u5206\u6BCD\u4E3A\u96F6"] : [], ...!stageKnown ? ["\u9636\u6BB5\u58F0\u660E\u96C6\u5408\u6216\u5B9E\u9645\u884C\u6765\u6E90\u672A\u53D6\u5F97"] : []]
  };
}
export {
  EVIDENCE_TYPES,
  LEVELS,
  LEVEL_APPLICABILITY,
  RINGS,
  RING_STATES,
  evaluateRing,
  evaluateWorkflowSteps,
  resolveLevel,
  summarize,
  summarizeWorkflow
};
