# React and Next.js Best Practices

This file is a read-only, compiled reference for the frontend-component-quality skill.
It is advisory guidance for implementation review, not a WorkflowHub gate.

## Eliminating Waterfalls

Start independent requests together, keep dependent requests explicit, and avoid
serial data fetching in component trees when the product contract permits parallel work.

## Bundle Size Optimization

Keep client boundaries narrow, avoid importing unused modules, and load expensive
features only when the interaction needs them. Measure before claiming a gain.

## Component boundaries

Keep state ownership near the consumer, pass typed view models to display components,
and preserve stable props/events when modifying shared components.

Source is pinned in `UPSTREAM.md`; this copy is not an independently maintained rule engine.
