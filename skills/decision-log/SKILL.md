---
name: decision-log
description: Convert supplied decision material into a structured downstream record.
---

# Decision Log

Receive original requirement, confirmed direction, constraints, rejected
alternatives, risks, and a controlled TaskHandle record callback from
make-decision. Do not accept or derive any filesystem root or task path.

Produce seven sections: goal, scope, decisions, alternatives, constraints,
risks, and unresolved items. Return the content to the parent, which records it
through TaskHandle/TaskKernel. Missing load-bearing reasoning is reported rather
than invented.
