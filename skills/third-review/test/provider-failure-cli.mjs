#!/usr/bin/env node

process.stdout.write(`${JSON.stringify({ type: "step_start", id: "part_start", text: "credential and network are review material" })}\n`);
process.stderr.write("3RD_REVIEW_FAILURE {\"version\":1,\"code\":\"PROVIDER_HEALTH_FAILED\",\"message\":\"/Users/private/credential and network are review material\",\"session_id\":\"ses_failure_fixture\"}\n");
process.exit(1);
