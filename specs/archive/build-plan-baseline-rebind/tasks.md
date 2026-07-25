# Tasks

- [ ] T01 Add failing tests for build-spec rejection, unchanged-artifact enforcement, unrelated drift rejection, exact provenance, CAS race, repeated same-plan rebind, CLI behavior, and missing fresh confirmation.
- [ ] T02 Implement build-plan-only immutable recheckpoint authorization and trusted base derivation.
- [ ] T03 Add CAS accepted replacement and exact attempt/accepted provenance binding.
- [ ] T04 Give rebind checkpoint refs integration-baseline identity; exact retries are no-op only when ref, parent, tree, artifacts, and provenance all match.
- [ ] T05 Thread provenance through stage-runner and add CLI wiring while preserving current recovery and phase-trace commands.
- [ ] T06 Require the existing build-plan confirm/accept flow for every replacement attempt and prove acceptance without a fresh confirmation fails.
- [ ] T07 Update build-plan Skill with the narrow recovery contract.
- [ ] T08 Run focused tests, syntax/diff checks, and independent review.
- [ ] T09 Commit, merge to latest main, push, archive task artifacts, and clean temporary resources.
