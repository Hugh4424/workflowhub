const CAPABILITY_DEFINITIONS = [
  {id: 'LOCATE_TRUST', layers: ['L0']},
  {id: 'INTERPRET_INTENT', layers: ['L1', 'L2', 'L3']},
  {id: 'APPLY_FOUNDATIONS', layers: ['L4']},
  {id: 'COMPOSE_COMPONENTS', layers: ['L5']},
  {id: 'VALIDATE_OUTPUT', layers: ['L6']},
  {id: 'MAINTAIN_CHANGE', layers: ['L7']},
];

const LAYER_DEFINITIONS = CAPABILITY_DEFINITIONS.flatMap(({layers}) => layers.map((id) => ({
  id,
  core: ['L0', 'L4', 'L5', 'L6'].includes(id),
})));

const ASSESSMENT_PROFILES = {
  VISUAL_COMPOSITION: {
    LOCATE_TRUST: 10, INTERPRET_INTENT: 15, APPLY_FOUNDATIONS: 25,
    COMPOSE_COMPONENTS: 30, VALIDATE_OUTPUT: 15, MAINTAIN_CHANGE: 5,
  },
  INTERACTIVE_IMPLEMENTATION: {
    LOCATE_TRUST: 10, INTERPRET_INTENT: 10, APPLY_FOUNDATIONS: 20,
    COMPOSE_COMPONENTS: 30, VALIDATE_OUTPUT: 20, MAINTAIN_CHANGE: 10,
  },
};
const PROFILE_IDS = Object.keys(ASSESSMENT_PROFILES);

const QUALITY_IDS = [
  'NAVIGATION',
  'PRECISION',
  'OWNERSHIP',
  'CONSISTENCY',
  'TRACEABILITY',
  'IMPLEMENTABILITY',
  'VERIFIABILITY',
  'MAINTAINABILITY',
];

const DISPOSITIONS = new Set(['SUBSTANTIVE', 'PARTIAL', 'TBD', 'N/A', 'MISSING', 'UNOBSERVED']);
const CONFIDENCE_LEVELS = new Set(['HIGH', 'MEDIUM', 'LOW']);
const SEVERITIES = new Set(['BLOCKER', 'HIGH', 'MEDIUM', 'LOW']);
const FINDING_TYPES = new Set([
  'COVERAGE',
  'CONTRADICTION',
  'AMBIGUITY',
  'MISPLACEMENT',
  'DUPLICATION',
  'TRACEABILITY',
  'IMPLEMENTABILITY',
  'VERIFICATION',
  'ACCESSIBILITY',
  'LIFECYCLE',
  'EVIDENCE_LIMIT',
]);
const DEFECT_KINDS = new Set(['DOCUMENT_DEFECT', 'EVIDENCE_LIMITATION']);
const CHANGE_CLASSES = new Set(['EDITORIAL', 'STRUCTURAL', 'SEMANTIC']);
const DESIGNER_JARGON = /document readiness|unavailable downstream evidence|observed validation failure|neutral\s*\/\s*unavailable evidence|manifest blocker|contract tool owner|\bprojection\b|\bnot-run\b|中性状态模型|中性状态|下游证据|观测验证失败|投影记录|清单阻塞项|合同工具负责人/iu;

const round1 = (value) => Math.round((value + Number.EPSILON) * 10) / 10;

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const requireString = (errors, value, path) => {
  if (typeof value !== 'string' || !value.trim()) errors.push(`${path} must be a non-empty string`);
};

const requireDesignerString = (errors, value, path) => {
  requireString(errors, value, path);
  if (typeof value === 'string' && DESIGNER_JARGON.test(value)) {
    errors.push(`${path} contains internal audit jargon; translate it into what the designer needs to find, add, or decide`);
  }
};

const requireStringArray = (errors, value, path, allowEmpty = true) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${path} must be an array of non-empty strings`);
    return;
  }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must not be empty`);
};

const validateExactIds = (errors, records, expectedIds, path) => {
  if (!Array.isArray(records)) {
    errors.push(`${path} must be an array`);
    return new Map();
  }
  const byId = new Map();
  for (const [index, record] of records.entries()) {
    if (!isObject(record)) {
      errors.push(`${path}[${index}] must be an object`);
      continue;
    }
    if (byId.has(record.id)) errors.push(`${path} contains duplicate id ${record.id}`);
    byId.set(record.id, record);
  }
  for (const id of expectedIds) {
    if (!byId.has(id)) errors.push(`${path} is missing ${id}`);
  }
  for (const id of byId.keys()) {
    if (!expectedIds.includes(id)) errors.push(`${path} contains unexpected id ${id}`);
  }
  return byId;
};

export const gradeForScore = (score) => {
  if (score === null) return 'N/A';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};

export const validateReportData = (data) => {
  const errors = [];
  if (!isObject(data)) return ['report data must be an object'];
  if (data.schemaVersion !== '1.2.0') errors.push('schemaVersion must be 1.2.0; legacy data requires a user-confirmed profile and reassessment');
  if (!['zh-CN', 'en'].includes(data.locale)) errors.push('locale must be zh-CN or en');
  if (!isObject(data.assessment)) {
    errors.push('assessment must record the user-confirmed profile before scoring');
  } else {
    if (!PROFILE_IDS.includes(data.assessment.profile)) errors.push(`assessment.profile must be one of ${PROFILE_IDS.join(', ')}`);
    requireString(errors, data.assessment.confirmation, 'assessment.confirmation');
  }

  for (const field of ['title', 'generatedAt', 'scope']) {
    requireString(errors, data[field], field);
  }
  for (const field of ['summary', 'safeUse', 'nextAction']) {
    requireDesignerString(errors, data[field], field);
  }
  if (!isObject(data.source)) {
    errors.push('source must be an object');
  } else {
    requireString(errors, data.source.name, 'source.name');
    requireString(errors, data.source.root, 'source.root');
    if (data.source.version !== undefined && data.source.version !== null) {
      requireString(errors, data.source.version, 'source.version');
    }
  }

  requireStringArray(errors, data.includedEvidence, 'includedEvidence', false);
  requireStringArray(errors, data.excludedEvidence, 'excludedEvidence');
  requireStringArray(errors, data.unavailableEvidence, 'unavailableEvidence');
  requireStringArray(errors, data.limitations, 'limitations');
  requireStringArray(errors, data.openQuestions, 'openQuestions');

  const layersById = validateExactIds(
    errors,
    data.layers,
    LAYER_DEFINITIONS.map((item) => item.id),
    'layers',
  );
  for (const definition of LAYER_DEFINITIONS) {
    const layer = layersById.get(definition.id);
    if (!layer) continue;
    if (!DISPOSITIONS.has(layer.disposition)) errors.push(`layers.${definition.id}.disposition is invalid`);
    if (['L0', 'L4', 'L6'].includes(definition.id) && layer.disposition === 'N/A') {
      errors.push(`layers.${definition.id} is required in both assessment profiles and cannot be N/A`);
    }
    if (['N/A', 'UNOBSERVED'].includes(layer.disposition)) {
      if (layer.maturity !== null) errors.push(`layers.${definition.id}.maturity must be null for ${layer.disposition}`);
    } else if (!Number.isInteger(layer.maturity) || layer.maturity < 0 || layer.maturity > 4) {
      errors.push(`layers.${definition.id}.maturity must be an integer from 0 to 4`);
    }
    for (const field of ['summary', 'gap', 'impact']) requireDesignerString(errors, layer[field], `layers.${definition.id}.${field}`);
    if (!CONFIDENCE_LEVELS.has(layer.confidence)) errors.push(`layers.${definition.id}.confidence is invalid`);
    requireStringArray(errors, layer.evidence, `layers.${definition.id}.evidence`);
  }

  const qualitiesById = validateExactIds(errors, data.quality, QUALITY_IDS, 'quality');
  for (const id of QUALITY_IDS) {
    const quality = qualitiesById.get(id);
    if (!quality) continue;
    if (!Number.isInteger(quality.maturity) || quality.maturity < 0 || quality.maturity > 4) {
      errors.push(`quality.${id}.maturity must be an integer from 0 to 4`);
    }
    requireDesignerString(errors, quality.summary, `quality.${id}.summary`);
    requireStringArray(errors, quality.evidence, `quality.${id}.evidence`);
  }

  if (!Array.isArray(data.findings)) {
    errors.push('findings must be an array');
  } else {
    const ids = new Set();
    for (const [index, finding] of data.findings.entries()) {
      const path = `findings[${index}]`;
      if (!isObject(finding)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      for (const field of ['id', 'evidence']) {
        requireString(errors, finding[field], `${path}.${field}`);
      }
      for (const field of ['title', 'missingContract', 'agentImpact', 'designerLocation', 'designerAction', 'completionCriteria']) {
        requireDesignerString(errors, finding[field], `${path}.${field}`);
      }
      if (ids.has(finding.id)) errors.push(`findings contains duplicate id ${finding.id}`);
      ids.add(finding.id);
      requireStringArray(errors, finding.appliesTo, `${path}.appliesTo`, false);
      if (Array.isArray(finding.appliesTo)) {
        if (finding.appliesTo.some((profile) => !PROFILE_IDS.includes(profile))) errors.push(`${path}.appliesTo contains an invalid profile`);
        if (!finding.appliesTo.includes(data.assessment?.profile)) errors.push(`${path} does not apply to the selected assessment profile`);
      }
      if (!SEVERITIES.has(finding.severity)) errors.push(`${path}.severity is invalid`);
      if (!FINDING_TYPES.has(finding.type)) errors.push(`${path}.type is invalid`);
      if (!DEFECT_KINDS.has(finding.defectKind)) errors.push(`${path}.defectKind is invalid`);
      if (!CONFIDENCE_LEVELS.has(finding.confidence)) errors.push(`${path}.confidence is invalid`);
      if (!CAPABILITY_DEFINITIONS.some((item) => item.id === finding.capability)) {
        errors.push(`${path}.capability is invalid`);
      }
      requireStringArray(errors, finding.layers, `${path}.layers`, false);
      if (Array.isArray(finding.layers) && finding.layers.some((id) => !LAYER_DEFINITIONS.some((item) => item.id === id))) {
        errors.push(`${path}.layers contains an invalid layer`);
      }
      requireStringArray(errors, finding.evidenceRefs, `${path}.evidenceRefs`);
      if (finding.severity === 'BLOCKER' && finding.defectKind === 'EVIDENCE_LIMITATION') {
        errors.push(`${path}: an evidence limitation cannot be a document BLOCKER`);
      }
    }
  }

  if (!Array.isArray(data.plan)) {
    errors.push('plan must be an array');
  } else {
    for (const [index, item] of data.plan.entries()) {
      const path = `plan[${index}]`;
      if (!isObject(item)) {
        errors.push(`${path} must be an object`);
        continue;
      }
      for (const field of ['id', 'priority', 'target']) {
        requireString(errors, item[field], `${path}.${field}`);
      }
      for (const field of ['action', 'authorityNeeded', 'validation']) {
        requireDesignerString(errors, item[field], `${path}.${field}`);
      }
      if (!CHANGE_CLASSES.has(item.changeClass)) errors.push(`${path}.changeClass is invalid`);
      requireStringArray(errors, item.findingIds, `${path}.findingIds`, false);
      if (Array.isArray(item.findingIds) && Array.isArray(data.findings)) {
        for (const id of item.findingIds) {
          if (!data.findings.some((finding) => finding?.id === id)) errors.push(`${path}.findingIds references unknown finding ${id}`);
        }
      }
    }
  }

  return errors;
};

export const evaluateReport = (data) => {
  const errors = validateReportData(data);
  if (errors.length) throw new Error(errors.join('\n'));

  const layersById = new Map(data.layers.map((layer) => [layer.id, layer]));
  const profileWeights = ASSESSMENT_PROFILES[data.assessment.profile];
  const capabilityDefinitions = CAPABILITY_DEFINITIONS.map((definition) => ({
    ...definition, weight: profileWeights[definition.id],
  }));
  const layerWeights = new Map(capabilityDefinitions.flatMap(({layers, weight}) => (
    layers.map((id) => [id, weight / layers.length])
  )));
  const layerResults = LAYER_DEFINITIONS.map((definition) => {
    const source = layersById.get(definition.id);
    const applicable = source.disposition !== 'N/A';
    const observed = applicable && source.disposition !== 'UNOBSERVED';
    return {
      ...source,
      weight: layerWeights.get(definition.id),
      core: definition.core,
      score: observed ? source.maturity * 25 : null,
      applicable,
      observed,
    };
  });

  const applicableWeight = layerResults.filter((item) => item.applicable).reduce((sum, item) => sum + item.weight, 0);
  const observedWeight = layerResults.filter((item) => item.observed).reduce((sum, item) => sum + item.weight, 0);
  const evidenceCoverage = applicableWeight ? round1((observedWeight / applicableWeight) * 100) : 0;
  const unobservedCore = layerResults.some((item) => item.core && item.applicable && !item.observed);
  const insufficientEvidence = evidenceCoverage < 75 || unobservedCore;

  let overallScore = null;
  if (!insufficientEvidence && observedWeight > 0) {
    const weightedTotal = layerResults
      .filter((item) => item.observed)
      .reduce((sum, item) => sum + item.weight * item.score, 0);
    overallScore = round1(weightedTotal / observedWeight);
  }
  const grade = gradeForScore(overallScore);

  const capabilities = capabilityDefinitions.map((definition) => {
    const layers = definition.layers.map((id) => layerResults.find((item) => item.id === id));
    const applicable = layers.filter((item) => item.applicable);
    const observed = applicable.filter((item) => item.observed);
    return {
      ...definition,
      score: observed.length ? round1(observed.reduce((sum, item) => sum + item.score, 0) / observed.length) : null,
      evidenceCoverage: applicable.length ? round1((observed.length / applicable.length) * 100) : 100,
      status: applicable.length === 0 ? 'N/A' : observed.length === 0 ? 'UNOBSERVED' : 'OBSERVED',
    };
  });

  const blockerCount = data.findings.filter((finding) => finding.severity === 'BLOCKER').length;
  const coreScores = layerResults.filter((item) => item.core && item.applicable).map((item) => item.score);
  let verdict = 'INSUFFICIENT_EVIDENCE';
  if (!insufficientEvidence) {
    if (overallScore >= 85 && blockerCount === 0 && coreScores.every((score) => score >= 75)) {
      verdict = 'READY';
    } else if (overallScore >= 70 && blockerCount === 0 && coreScores.every((score) => score >= 50)) {
      verdict = 'CONDITIONALLY_READY';
    } else {
      verdict = 'NOT_READY';
    }
  }

  const findingCounts = Object.fromEntries([...SEVERITIES].map((severity) => [
    severity,
    data.findings.filter((finding) => finding.severity === severity).length,
  ]));

  return {
    schemaVersion: data.schemaVersion,
    assessment: {...data.assessment},
    overallScore,
    grade,
    verdict,
    evidenceCoverage,
    blockerCount,
    findingCounts,
    layers: layerResults,
    capabilities,
    quality: data.quality.map((item) => ({...item, score: item.maturity * 25})),
  };
};

export {ASSESSMENT_PROFILES, CAPABILITY_DEFINITIONS, LAYER_DEFINITIONS, QUALITY_IDS};
