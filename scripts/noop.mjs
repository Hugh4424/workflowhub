#!/usr/bin/env node
// noop component — M2 default registry entry (FR-CORE-002 / decision 14).
// Outputs the minimal valid component result: component_id matching the registry.
process.stdout.write(JSON.stringify({ component_id: "noop" }) + "\n");
