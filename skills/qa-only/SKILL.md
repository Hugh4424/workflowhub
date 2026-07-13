---
name: qa-only
description: Report-only acceptance lens for user outcomes, reproducible evidence, and incomplete scenarios.
---

# qa-only

Source: adapted from the project acceptance review baseline. Mode: `lens-only`.

## Check

1. Map each acceptance criterion to supplied evidence.
2. Check happy path, boundary path, failure path, and recovery path.
3. Distinguish fresh evidence from historical claims.
4. Record an exact missing proof instead of inferring success.
5. For UI scope, require isolated browser evidence supplied in the packet.

## Result

Return acceptance gaps and observed user impact without proposing implementation work.
