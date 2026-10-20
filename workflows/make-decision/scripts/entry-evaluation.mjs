// Migrated entry assessment. Only choices[0] changes branding: shrink-mini-task → shrink-scope.
function object(value, label) { if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`); return value; }

export function evaluateEntryRoute(input = {}) {
  const value = object(input, "mini-task scope input");
  const unresolved = [];
  const booleanFact = (name, alias, optional = false) => {
    const keys = [name, alias].filter(key => Object.hasOwn(value, key));
    if (keys.length === 0) { if (!optional) unresolved.push(`${name}: missing assessment`); return false; }
    if (keys.some(key => typeof value[key] !== "boolean")) { unresolved.push(`${name}: non-boolean assessment`); return false; }
    if (keys.length === 2 && value[name] !== value[alias]) { unresolved.push(`${name}: conflicting aliases`); return false; }
    return value[keys[0]];
  };
  const userRequested = booleanFact("user_requested", "userRequested", true);
  const flags = {
    boundary_clear: booleanFact("boundary_clear", "boundaryClear"),
    single_outcome: booleanFact("single_outcome", "singleOutcome"),
    limited_impact: booleanFact("limited_impact", "limitedImpact"),
    major_architecture: booleanFact("major_architecture", "majorArchitecture"),
    migration: booleanFact("migration", "migrationRisk"),
    permission: booleanFact("permission", "permissionRisk"),
    security: booleanFact("security", "securityRisk"),
  };
  // Explicit risk evidence must survive even when its other alias is invalid.
  const expanded = [["major_architecture", "majorArchitecture"], ["migration", "migrationRisk"], ["permission", "permissionRisk"], ["security", "securityRisk"]]
    .filter(([name, alias]) => value[name] === true || value[alias] === true).map(([name]) => name);
  const suitable = flags.boundary_clear && flags.single_outcome && flags.limited_impact && expanded.length === 0;
  if (expanded.length > 0 || unresolved.length > 0) {
    return Object.freeze({
      status: "paused",
      user_requested: userRequested,
      reason: [expanded.length > 0 ? `mini-task scope includes materially expanded risks: ${expanded.join(", ")}; an explicit route choice is required` : "mini-task suitability is not established",
        ...(unresolved.length > 0 ? [`unassessed or invalid evidence: ${unresolved.join("; ")}; false flags for these items are placeholders, not evidence of absent risk`] : [])].join("; "),
      expanded_risks: expanded,
      choices: ["shrink-scope", "create-ordinary-five-stage-task"],
      flags,
    });
  }
  if (suitable) return Object.freeze({ status: "suitable", user_requested: userRequested, risks: userRequested ? ["用户显式指定了精简流程，仍需关注范围扩大"] : [], flags });
  if (userRequested) return Object.freeze({ status: "suitable_with_risk", user_requested: true, risks: expanded.length > 0 ? expanded : ["需求边界或影响面需要持续监控"], execution_boundary: "若执行中继续扩大，必须重新评估并暂停让用户选择", flags });
  return Object.freeze({ status: "paused", user_requested: false, reason: "mini-task suitability is not established", expanded_risks: expanded, choices: ["shrink-scope", "create-ordinary-five-stage-task"], flags });
}
