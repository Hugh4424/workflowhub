---
name: spec-tasks
description: Convert supplied specification and plan content into dependency-ordered work items.
---

# Spec Tasks

Receive frozen `spec.md` and `plan.md` content and a controlled writer from
build-plan. Do not locate artifacts or accept path/root/task parameters.

Generate concrete, dependency-ordered tasks. Each task includes an ID, action,
affected area, requirement IDs, dependency IDs, verification, and parallelism
notes. Tasks must be executable without rediscovering requirements. Write only
named artifact `tasks.md` and return counts/mapping as structured output.
