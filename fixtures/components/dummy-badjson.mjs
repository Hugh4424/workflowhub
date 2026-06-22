#!/usr/bin/env node
// Dummy component: exits 0 but writes invalid JSON output.
process.stdout.write("not-valid-json\n");
process.exit(0);
