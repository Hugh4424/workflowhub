---
name: ui-interaction-states
description: Specify complete UI behavior and state coverage for screens, flows, and components, including loading, empty, error, success, offline, permission, disabled, destructive, and interrupted states. Use before implementation or when a UI works only on the happy path; do not use for decorative motion alone.
metadata:
  short-description: Specify complete UI states and transitions
---

# UI Interaction States

Turn a brief and flow into an implementation-ready state model. Optimize for clarity, recovery, continuity, and accessible feedback rather than animation volume.

## Inputs

Use the active `.design/<feature>/DESIGN_BRIEF.md` and `INFORMATION_ARCHITECTURE.md` when present. Also inspect existing components, data-fetching patterns, platform conventions, and product terminology. If evidence is absent, label assumptions instead of inventing backend behavior.

## State Inventory

Consider only states relevant to the feature, but explicitly decide whether each category applies:

- **Lifecycle:** initial, loading, progressive loading, refreshing, loaded, stale, empty, partial, offline, unavailable.
- **Outcome:** success, recoverable error, blocking error, validation error, conflict, timeout, rate limit.
- **Access:** signed out, insufficient permission, permission request, permission denied, expired session.
- **Component:** default, focus-visible, active/pressed, selected, expanded, disabled, read-only, dragging, invalid.
- **Risk:** confirmation, destructive pending, undo window, irreversible completion.
- **Interruption:** navigation away, background/resume, retry, duplicate submission, cancellation, interrupted upload.

Do not create a separate screen for every state. Choose among inline feedback, preserved content, skeletons, banners, dialogs, toasts, dedicated states, and optimistic updates according to impact and recovery needs.

## Workflow

1. Identify the user's critical tasks and the system events that can change each screen.
2. Build a screen-state matrix. Include happy path, first-use, latency, no-data, partial-data, failure, access, and recovery paths.
3. Define transitions as `trigger → system response → visible feedback → next state → recovery`.
4. Specify content priority and action hierarchy in each state. Error copy must say what happened, what remains safe, and what the user can do next.
5. Specify focus movement, keyboard/touch behavior, announcements for dynamic changes, reduced-motion behavior, and interruption handling.
6. Reconcile states with existing components and tokens. Flag missing component variants rather than silently inventing incompatible ones.
7. Save the result to `.design/<feature-slug>/INTERACTION_STATES.md`, unless the user requests another location.

## Output Contract

```markdown
# Interaction States: [Feature]

## Scope and evidence
- Brief: [path or absent]
- IA: [path or absent]
- Existing implementation/components: [paths]
- Assumptions: [items]

## Screen-state matrix
| Screen/component | Trigger | State | User sees | Primary action | Recovery/next | Data preserved? |
| --- | --- | --- | --- | --- | --- | --- |

## Transition specifications
### [Transition name]
- Trigger:
- Preconditions:
- Immediate feedback:
- In progress:
- Success:
- Failure and recovery:
- Cancellation/interruption:

## Component state coverage
| Component | Default | Focus | Active | Disabled | Loading | Error | Selected/open |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Feedback and content
| Event | Pattern | Message intent | Persistence | Announcement |
| --- | --- | --- | --- | --- |

## Accessibility and input
- Focus and keyboard:
- Touch/pointer:
- Live-region or status announcements:
- Reduced motion:

## Acceptance criteria
- [Observable behavior]

## Open questions
- [Question that changes behavior]
```

## Quality Rules

- Preserve the user's work across failures whenever technically possible.
- Never use color or motion as the only state signal.
- Avoid indefinite spinners; expose progress or recovery when duration is meaningful.
- Prevent duplicate destructive or transactional actions.
- Use optimistic UI only when failure is rare, reversible, and clearly reconciled.
- Keep focus stable unless moving it helps the user understand a major context change.
- Toasts supplement visible state; they do not carry critical or unrecoverable information alone.
- State names describe observable product behavior, not internal implementation details.

The result is a behavior specification, not authorization to implement or publish changes. Implement only when the user also asks for implementation.
