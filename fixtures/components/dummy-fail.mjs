#!/usr/bin/env node
// Dummy component: exits non-zero to signal failure.
process.stdout.write(JSON.stringify({ component_id: "dummy-fail", status: "error" }) + "\n");
process.exit(1);
