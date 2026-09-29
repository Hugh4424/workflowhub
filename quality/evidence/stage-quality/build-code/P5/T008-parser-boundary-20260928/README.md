# P5/T008 declaration section boundary repair, 2026-09-28

This is a local implementation and test record, not P5 completion or user approval. The existing `test-before.mjs` and `before-sha256.txt` freeze the local state before this repair.

Independent review found that the parser accepted a second JSON fence under the same declaration heading and accepted JSON from a later `##` section after an empty declaration section. Added one negative test for each case. On the old parser, both failed (`red.txt`, exit 1). The parser now considers only the declaration heading's own section and requires exactly one JSON fence pair there. The new cases and prior valid declaration case passed (`green-focused.txt`, 3 passed, exit 0).

The full P5 source test passed: 15 passed, 6 historical cases skipped (`green-target.txt`, exit 0). The adjacent T007 report converter test passed: 55 passed (`adjacent-t007.txt`, exit 0). `node --check` for the two touched files and `git diff --check` for the tracked source succeeded. The worktree's original `node_modules` directory was restored after each command by a shell EXIT trap; the main repository's installed dependencies were only linked temporarily, not edited.

No report or current Task fact was published. The true human confirmation source remains unavailable, and those six skipped positive/recovery cases remain unproven.
