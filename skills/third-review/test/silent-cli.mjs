#!/usr/bin/env node

const duration = Number(process.env.THIRD_REVIEW_TEST_DURATION_MS ?? 180);
setTimeout(() => process.exit(0), duration);
