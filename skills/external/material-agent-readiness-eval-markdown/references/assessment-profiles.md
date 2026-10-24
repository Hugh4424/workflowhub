# Intended use and assessment profiles

Use this reference after the user confirms the intended use in `SKILL.md`. These are two definitions of completeness, not two labels on the same audit. Choose applicable requirements first, assess their evidence and maturity second, and calculate the score last.

## Evaluation boundary

| Decision | `VISUAL_COMPOSITION` — 仅视觉设计组合 | `INTERACTIVE_IMPLEMENTATION` — 完整交互组件实现 |
|---|---|---|
| Delegated outcome | Select, arrange, and adapt components into consistent visual designs and represent required states. This may use Figma, another design tool, or static UI code. | Independently implement the scoped components as working interactive components, including all visual requirements. |
| L0: entry and scope | Declare visual output, component reuse rules, authority, routes, finish gate, and the exclusion of runtime implementation. | Additionally declare target platform, implementation responsibility, dependencies, and behavioral scope. |
| L1–L3: intent | Product goals, decision principles, hierarchy, density, brand, and language sufficient to guide composition. | The same intent, including feedback and recovery decisions that constrain behavior. |
| L4: Foundations | Semantic Token values, aliases, themes, typography, layout/breakpoints, visual accessibility, and bindings needed for composition. | Additionally specify platform representations and constraints sufficient to implement values and modes consistently. Existing code parity remains optional evidence. |
| L5: components | Purpose/avoid cases, identity, anatomy, variants and default visual configuration, content/Slots, geometry/resizing, allowed nesting/combinations, state-to-Token bindings, and required visual states. | Additionally define the public API, types/options/defaults, events and payloads, state ownership, transitions and triggers, input handling, keyboard/focus, assistive semantics, edge cases, and acceptance criteria. |
| L6: validation | Observable visual checks for Token use, component/variant selection, states, content extremes, viewport/theme differences, contrast, visible focus indicators when in scope, and allowed deviations. | Additionally define behavioral/API/accessibility checks, expected outcomes, failure/recovery paths, and how a Coding Agent verifies completion. |
| L7: lifecycle | Owner, version, changes, component/Token replacement, and effect on existing compositions. | Additionally cover public API and behavior compatibility, deprecation, migration, and regression obligations. |

L0, L4, and L6 remain required in both profiles. L5 remains required whenever components are in scope. Excluding runtime implementation does not make the whole L5 or L6 domain `N/A`. A genuinely Tokens-only package may mark L5 `N/A`, but cannot claim component readiness. Evaluate individual requirements for applicability: a static Icon does not need invented keyboard interaction; a Dialog, Input, or other interactive component cannot exclude its central behavior while retaining an independent implementation claim.

## Visual composition assessment

Read L4–L6 against these questions:

- Can the Agent select semantic values and the right component/variant without copying a screenshot or guessing a default?
- Are anatomy, spacing, sizing, resizing, alignment, content overflow, and allowed combinations explicit enough to produce consistent layouts?
- For each required visual state, are appearance, content, geometry, visibility, Token bindings, and invariants specified? A loading/error/focus/disabled name alone is insufficient. The Agent must know when the design brief calls for each representation; runtime trigger algorithms are outside this profile.
- Can the designer verify visual state coverage, themes/viewports, contrast, non-color cues, visible focus styling where applicable, and permitted deviations from observable criteria?

Do not lower any maturity, score, grade, verdict, or quality dimension, or create findings/plans, solely because the package omits implementation-only props/types, event payloads, controlled/uncontrolled behavior, runtime state machines, keyboard event handling, focus management algorithms, DOM/ARIA implementation details, or executable interaction tests. Record these as outside the assessed delegation boundary. A package can reach maturity 4 without them.

Keep visual accessibility in scope: contrast, readable typography, non-color state distinctions, focus appearance for represented focus states, and target-size guidance where relevant. A visual-only result is not proof of runtime accessibility.

**L5 maturity anchor:** 2 when visual defaults, states, or composition rules still force material guesses; 3 when the scoped visual components can be composed with explicit acceptance; 4 when those rules are also traceable, maintained, and verifiable.

**L6 maturity anchor:** 2 when visual review is largely subjective or state/theme coverage is unclear; 3 when visual pass/fail checks and allowed deviations are explicit; 4 when checks also have maintained evidence requirements and repeatable procedures. A manual visual checklist can be executable; automation is not mandatory.

**Visual blockers:** missing component selection/anatomy/defaults or required visual state deltas that prevent reliable composition; conflicting visual values or combination rules; no observable visual finish gate. Use the shared blocker rules for authority, navigation, unsupported claims, and identity as well.

**Safe conclusion:** “可按契约完成指定主题和尺寸下的视觉组合；本次不评估完整交互组件的独立实现能力。” Qualify further when gaps remain.

## Interactive implementation assessment

Require the visual baseline above plus enough contract detail for the Coding Agent to make no material implementation decisions on the user's behalf. For every scoped component inspect:

- **Public interface:** property names, types/allowed values, requiredness, defaults, Slots/content constraints, invalid combinations, events/callbacks and payloads where applicable.
- **State and behavior:** state ownership, controlled/uncontrolled policy when applicable, triggers, transition results, precedence for overlapping states, disabled/read-only distinctions, loading/error/empty handling, cancellation/recovery, and async/race behavior when relevant.
- **Interaction accessibility:** pointer and keyboard actions, focus entry/movement/return, accessible names/roles/states, announcement behavior, and reduced-motion behavior where relevant. Shared rules or a precise versioned normative reference may satisfy these; avoid duplicating them in every component.
- **Acceptance:** expected outcomes for normal, boundary, invalid, and recovery cases; API and interaction checks; keyboard/focus/assistive checks; visual regression criteria. Procedures can be manual or automated but must be observable and repeatable.

A property list, a visual state gallery, or “follow standard behavior” is insufficient when multiple reasonable implementations remain. Calling an existing library does not resolve a contract gap unless its authoritative version, relevant rules, and local overrides are identified. An unavailable source needed to understand the contract is an evidence limit; an unavailable repository used only to compare parity is neutral.

**L5 maturity anchor:** at most 2 if a required API, transition, or accessibility responsibility remains materially unspecified, even when visual coverage is excellent. Use 3 only when both visual and applicable behavioral responsibilities are executable; 4 also requires governance and verifiability.

**L6 maturity anchor:** at most 2 if validation covers only screenshots/visual rules while interactive components are in scope. Use 3 only when behavioral and accessibility outcomes can also be checked; 4 adds maintained, traceable verification procedures.

**Implementation blockers:** absence or contradiction of a required API/default, core interaction/transition, keyboard/focus/assistive behavior, or behavioral acceptance criteria that prevents independent implementation. An owned `TBD` makes a gap honest but does not make required behavior executable. Do not infer a blocker from an irrelevant interaction, a minor bounded omission, or an unavailable optional code repository.

**Safe conclusion:** name the component scope and platform: “契约足以支持 Coding Agent 独立实现所列 Web 组件并按视觉、交互和无障碍标准验收。” This judges specification sufficiency; without direct evidence it does not assert that shipped code works or matches the contract.

## Weights and shared gates

| Capability | Layers | Visual composition | Interactive implementation |
|---|---|---:|---:|
| Locate and trust | L0 | 10% | 10% |
| Interpret intent | L1–L3 | 15% | 10% |
| Apply Foundations | L4 | 25% | 20% |
| Compose / implement components | L5 | 30% | 30% |
| Validate the output | L6 | 15% | 20% |
| Maintain changes | L7 | 5% | 10% |

Visual composition emphasizes intent and consistent visual values. Interactive implementation gives more weight to delivery verification and compatibility. These are fixed assessment policy weights, not empirically calibrated performance probabilities. Both profiles retain the 0–4 maturity rubric, A–F bands, core-layer gates, and evidence threshold in [audit-method.md](audit-method.md). Profile-specific requirements determine maturity and blockers before weights apply; changing weights alone is not a second assessment.

For each finding, set `appliesTo` to the profile(s) whose requirement it violates. A missing visual state may affect both; absent runtime focus management affects only `INTERACTIVE_IMPLEMENTATION`. Every finding in a report must apply to its selected profile. Reassess evidence rather than copying findings or maturity unchanged across profiles.

## Calibration examples

| Inspected evidence | Visual conclusion | Interactive conclusion |
|---|---|---|
| Complete visual contract; Input has no event payload, value ownership, or keyboard specification | No defect from these omissions; a high visual score is possible. | L5 is incomplete; missing core behavior can block independent implementation. |
| Error/loading are only state names, with no appearance, content, or layout differences | L5 gap; cannot reliably render required states. | L5 gap; both visual and behavioral completeness need inspection. |
| Complete internal API, state, and acceptance contract; no code repository supplied for parity | Code parity is outside or unavailable evidence. | Credit internal completeness; no deduction solely for the absent repository. |
| A visual checklist verifies themes, states, and layouts but contains no interaction outcomes | May satisfy L6 for visual output. | L6 at most 2 for interactive components; core behavioral acceptance may be a blocker. |
| The user asks for both outcomes | Evaluate with the interactive profile including visual requirements, or produce two separate reports if comparison is requested. | Never claim one blended score or interpret a profile switch as improvement. |
