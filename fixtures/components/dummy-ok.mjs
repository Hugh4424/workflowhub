#!/usr/bin/env node
// Dummy component: exits 0, writes valid JSON with component_id "dummy-ok".
process.stdout.write(JSON.stringify({ component_id: "dummy-ok", status: "ok" }) + "\n");
process.exit(0);
