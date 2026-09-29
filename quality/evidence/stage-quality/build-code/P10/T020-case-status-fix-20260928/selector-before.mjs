// Selection over supplied facts. Authentication belongs to the Task/P9 producer;
// no property of these caller-owned objects independently proves provenance.
const reject = (reason) => Object.freeze({ status: "unavailable", reason, cases: [] });
const nonempty = (value) => typeof value === "string" && value.trim() !== "";
const paths = (value) => Array.isArray(value) && value.length > 0
  && value.every(nonempty) && new Set(value).size === value.length;
const SHA256 = /^[a-f0-9]{64}$/;
const REGISTRY_REF = "docs/quality/test-asset-registry.json";

function preRunRegistryStatus(registry, changeScope) {
  if (registry?.task_id !== changeScope.task_id
      || registry?.snapshot_tree !== changeScope.snapshot_tree
      || registry?.source_digest !== changeScope.source_digest) return "invalid_change_provenance";
  if (registry.status !== "recorded" || registry.registry_ref !== REGISTRY_REF
      || !nonempty(registry.revision) || !SHA256.test(registry.registry_sha256 ?? "")
      || !Array.isArray(registry.targets) || registry.targets.length === 0) return "missing_inventory_identity";
  const targets = registry.targets.map((target) => target?.path);
  if (targets.some((path) => !nonempty(path)) || new Set(targets).size !== targets.length
      || registry.targets.some((target) => !SHA256.test(target.sha256 ?? "")
        || !["active", "retired"].includes(target.status)
        || !Array.isArray(target.registered_test_ids)
        || target.registered_test_ids.length === 0
        || new Set(target.registered_test_ids).size !== target.registered_test_ids.length)) {
    return "missing_inventory_identity";
  }
  return null;
}

function registryHas(registry, execution) {
  const target = registry.targets.find((item) => item.path === execution.target);
  const expected = execution.registered_test_ids;
  return target?.status === "active"
    && target.command === execution.machine_command
    && Array.isArray(expected) && expected.length > 0
    && new Set(expected).size === expected.length
    && expected.length === target.registered_test_ids.length
    && expected.every((id) => nonempty(id) && id.startsWith(`${execution.target} > `)
      && target.registered_test_ids.includes(id));
}

function inventoryHas(inventory, execution) {
  const { target, expected_test_identity: title } = execution;
  const entries = inventory?.tests;
  if (!Array.isArray(entries)) return false;
  if (Array.isArray(execution.registered_test_ids)) {
    const expected = execution.registered_test_ids;
    const observed = entries.map((entry) => entry?.full_id);
    const registered = inventory.registered_test_ids;
    if (inventory.status !== "recorded" || inventory.command !== execution.machine_command
        || inventory.exit_code !== 0 || inventory.missing?.length !== 0
        || inventory.unmatched?.length !== 0 || inventory.skipped?.length !== 0
        || !Array.isArray(registered) || registered.length !== observed.length
        || observed.some((id) => typeof id !== "string" || id.trim() === "")
        || new Set(observed).size !== observed.length || new Set(registered).size !== registered.length
        || registered.some((id) => !observed.includes(id))
        || entries.some((entry) => entry.status !== "passed")
        || expected.length === 0 || new Set(expected).size !== expected.length
        || expected.some((id) => typeof id !== "string" || !id.startsWith(`${target} > `))
        || expected.some((id) => !inventory.registered_test_ids?.includes(id)
          || !entries.some((entry) => entry.full_id === id && entry.status === "passed"))) return false;
    return true;
  }
  // The frozen fixture identifies a test by file and title. The P9 Node TAP
  // collector identifies it by its complete `file > title` runnable ID.
  const matching = entries.filter((entry) => {
    if (!entry || !["registered", "passed"].includes(entry.status)) return false;
    if (entry.test_file === target && entry.full_id === title) return true;
    return entry.test_file === undefined && entry.full_id === `${target} > ${title}`
      && inventory.registered_test_ids?.includes(entry.full_id)
      && inventory.command === `node --test --test-reporter=tap ${target}`;
  });
  return matching.length === 1;
}

export function selectAffectedCases({ changeScope, catalog, inventory, registry } = {}) {
  if (changeScope?.status !== "recorded" || !paths(changeScope.changed_paths)) {
    return reject("unknown_change_scope");
  }
  // Detect an observable contradiction. A tree mismatch cannot be established
  // here without an independent Git/receipt reader; never infer one from a
  // different but otherwise valid-looking tree ID.
  if (nonempty(changeScope.start_commit) && nonempty(changeScope.head_commit)
      && changeScope.start_commit === changeScope.head_commit) {
    return reject("invalid_change_provenance");
  }
  if (registry !== undefined && inventory !== undefined) return reject("missing_inventory_identity");
  if (registry !== undefined) {
    const registryProblem = preRunRegistryStatus(registry, changeScope);
    if (registryProblem) return reject(registryProblem);
  }
  const inventories = registry === undefined ? (Array.isArray(inventory) ? inventory : [inventory]) : [];
  if (inventories.some((item) => item?.status === "recorded"
      && (item.snapshot_tree !== changeScope.snapshot_tree
        || item.source_digest !== changeScope.source_digest
        || item.task_id !== changeScope.task_id))) {
    return reject("invalid_change_provenance");
  }
  if (!nonempty(catalog?.revision) || !Array.isArray(catalog.cases)
      || (registry === undefined && inventories.some((item) => !Array.isArray(item?.tests)))) return reject("missing_inventory_identity");

  const byId = new Map();
  for (const entry of catalog.cases) {
    if (!nonempty(entry?.id) || byId.has(entry.id)
        || !Array.isArray(entry.change_triggers) || !Array.isArray(entry.related_case_ids)) {
      return reject("missing_inventory_identity");
    }
    byId.set(entry.id, entry);
  }
  const selected = new Set();
  const unmappedChangedPaths = [];
  for (const changed of changeScope.changed_paths) {
    const matched = catalog.cases.filter((entry) => entry.status !== "retired"
      && entry.change_triggers.includes(changed));
    if (matched.length === 0) {
      unmappedChangedPaths.push(changed);
      continue;
    }
    for (const entry of matched) selected.add(entry.id);
  }
  if (selected.size === 0) return reject("unmapped_changed_path");
  const queue = [...selected];
  for (let index = 0; index < queue.length; index += 1) {
    const entry = byId.get(queue[index]);
    if (!entry || entry.status === "retired") return reject("missing_inventory_identity");
    for (const relatedId of entry.related_case_ids) {
      if (!byId.has(relatedId) || byId.get(relatedId).status === "retired") {
        return reject("missing_inventory_identity");
      }
      if (!selected.has(relatedId)) { selected.add(relatedId); queue.push(relatedId); }
    }
  }
  const cases = queue.map((id) => byId.get(id));
  if (cases.length === 0 || cases.some((entry) => !nonempty(entry.execution?.target)
      || !nonempty(entry.execution?.expected_test_identity)
      || !(registry === undefined
        ? inventories.some((item) => inventoryHas(item, entry.execution))
        : registryHas(registry, entry.execution)))) {
    return reject("missing_inventory_identity");
  }
  return Object.freeze({
    status: unmappedChangedPaths.length ? "unavailable" : "selected",
    ...(unmappedChangedPaths.length ? { reason: "unmapped_changed_path",
      unmapped_changed_paths: Object.freeze(unmappedChangedPaths) } : {}),
    catalog_revision: catalog.revision,
    // The producer must authenticate these refs before a consumer may use them.
    provenance: "supplied_unverified", task_id: changeScope.task_id,
    snapshot_tree: changeScope.snapshot_tree, source_digest: changeScope.source_digest,
    changed_paths: Object.freeze([...changeScope.changed_paths]),
    ...(registry === undefined ? {} : {
      inventory_basis: "registered_pre_run", test_execution_status: "not_run",
      registry_ref: registry.registry_ref, registry_sha256: registry.registry_sha256,
      registry_revision: registry.revision,
    }),
    cases: Object.freeze(cases),
  });
}
