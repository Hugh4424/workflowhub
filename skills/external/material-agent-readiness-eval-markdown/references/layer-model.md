# L0–L7 Material Model

## How to use the model

L0–L7 are responsibility domains for an Agent-readable design-system contract. They are not a maturity ladder and do not require eight large files. A small system may resolve a domain in a short section; a large system should modularize it.

Every domain must be one of:

- **substantive** — enough evidence and rules exist for the domain's consumers;
- **partial** — useful content exists but important decisions remain unresolved;
- **TBD** — required information is unknown, with an owner or next action;
- **N/A** — explicitly outside scope, with a reason.

Silent absence is unsafe when it makes an Agent guess. A justified `N/A` is not a defect.

Interpret every content list below through the user-confirmed profile in [assessment-profiles.md](assessment-profiles.md). These lists describe the full model, not unconditional requirements for every consumer. Visual composition excludes runtime implementation requirements while retaining visual states, composition rules, visual accessibility, and visual validation. Interactive implementation includes both visual and applicable behavioral requirements.

## Necessity scale

- **Baseline required** — any executable design-system contract needs substantive content here.
- **Required, may be concise** — the domain must be resolved but can be lightweight for a narrow or product-agnostic system.
- **Scope-dependent content** — the domain must be acknowledged, but details may be `N/A` when the scope genuinely excludes them.
- **Required for maintained use** — prototypes can begin minimally, but shared or evolving systems need substantive policy before relying on the contract over time.

## Cross-layer conventions

Use a small normative vocabulary consistently:

- `MUST` — required; failure blocks completion for the stated scope;
- `SHOULD` — expected; deviation requires recorded rationale;
- `MAY` — allowed but not required;
- `FORBIDDEN` — prohibited; presence blocks completion;
- `TBD` — unresolved; an Agent must not guess, and an owner or next action is needed;
- `N/A` — explicitly not applicable to the stated scope.

Every `MUST` and `FORBIDDEN` rule needs an observable verification method. Classify material values and decisions by source such as user, code, Figma, library, derived, or default; never present a default as a user decision. Distinguish mapping evidence as declared, observed, verified, not verified, `TBD`, or `N/A` rather than collapsing all mappings into “linked.”

## L0 — Entry and governance

**Question:** What is this contract, can it be trusted, and how should an Agent use it?

**Role:** The only required entrypoint and execution router. It defines authority, scope, precedence, task routing, and the finish gate while enabling progressive loading.

**Content to prepare:**

- contract identity, version, status, platforms, themes, component scope, and exclusions;
- canonical source and digest or another durable version identifier;
- owners, update responsibility, source precedence, conflict protocol, and global invariants;
- start sequence, task-to-file routes, normative-level semantics, synchronization status, known gaps, and finish gate.

**How to prepare:** Identify the source that owns design decisions, list intended Agent tasks, name owners, state what is in and out of scope, and decide what evidence proves completion. Turn that into concise imperative routing rather than a summary of every layer.

**Necessity:** **Baseline required.** Without L0, Agents cannot know which source wins or which files to load.

**Healthy evidence:** A new Agent can locate the minimum files for a local task, resolve `MUST`/`SHOULD`/`TBD`/`N/A`, and stop safely on equal-authority conflict.

**Common failure:** A passive table of contents, missing precedence, no finish gate, or requiring every task to load the entire package.

## L1 — Product experience definition

**Question:** Who is the product for, what problem does it solve, and what experience should it create?

**Role:** Grounds design-system decisions in user and product outcomes so components and Foundations are not optimized in a vacuum.

**Content to prepare:** Positioning, target users, jobs to be done, usage contexts, experience goals, non-goals, product or regulatory constraints, and observable success criteria.

**How to prepare:** Gather approved product strategy, research synthesis, accessibility or regulatory obligations, and a small set of measurable outcomes. Extract only facts that constrain design-system choices; link page flows and feature requirements instead of copying them.

**Necessity:** **Required, may be concise.** A product-agnostic library can state that scope and define intended consumers rather than inventing product goals.

**Healthy evidence:** Product claims have sources, non-goals bound the system, and success criteria can influence design tradeoffs.

**Common failure:** Generic mission statements, page-by-page requirements, or unsupported user assumptions.

## L2 — Design principles

**Question:** How should an Agent decide when lower-level rules do not prescribe every detail?

**Role:** Supplies decision rules for tradeoffs across hierarchy, clarity, efficiency, feedback, recovery, accessibility, and content.

**Content to prepare:** A small set of stable principles with IDs, normative force, decision consequence, anti-example, provenance, exceptions, and verification where normative.

**How to prepare:** Review recurring design debates and failures. Keep only principles that would change a choice, then add one positive consequence and one anti-example for each.

**Necessity:** **Required, may be concise.** A few operational principles are better than a long aspirational manifesto.

**Healthy evidence:** Given two plausible designs, an Agent can use a principle to prefer one and explain why.

**Common failure:** Values such as “simple” or “delightful” with no decision consequence.

## L3 — Brand and design language

**Question:** What character and perceptual qualities should the system express?

**Role:** Defines direction and coherence without duplicating concrete Token values.

**Content to prepare:** Brand position and personality; visual, shape, color, typography, density, iconography, motion, voice, and tone character; positive and negative examples.

**How to prepare:** Collect approved brand guidance and representative examples, then translate adjectives into observable design consequences. Keep exact values in L4.

**Necessity:** **Scope-dependent content.** White-label or intentionally neutral systems may mark brand-specific content `N/A`, but should still describe their neutral design language.

**Healthy evidence:** Directional language is specific enough to constrain choices and points to L4 for values.

**Common failure:** A mood-board summary with no design consequence, or hard-coded Token values duplicated from L4.

## L4 — Foundations and Tokens

**Question:** How are design decisions expressed as stable, reusable system values?

**Role:** Owns global values, modes, aliases, naming, constraints, and platform projections.

**Content to prepare:** Color, typography, spacing, sizing, radius, border, elevation, grid/breakpoints when applicable, motion, themes/modes, accessibility constraints, naming and aliasing, Figma mappings, and code mappings.

Each public Token needs a stable semantic name, type, value or mode values, purpose, consumer scope, source, alias target when applicable, constraints, and mapping status.

**How to prepare:** Export or inventory the current Token source, identify primitive-to-semantic relationships, record modes and consumers, capture accessibility rules, and label each value as user, code, Figma, library, derived, or default evidence.

**Necessity:** **Baseline required.** If the system intentionally delegates all values to another library, record that dependency and version rather than leaving L4 empty.

**Healthy evidence:** An Agent can select and apply stable semantic values without guessing or copying raw values from screenshots.

**Common failure:** Color swatches without roles, inconsistent aliases, values without modes, or mappings claimed as verified without evidence.

## L5 — Component contracts

**Question:** What is each component, how does it work, and how may an Agent implement or compose it?

**Role:** Owns component-local semantics and deltas from global rules. Each scoped public component should have one owning contract.

**Content to prepare:** Identity/status, purpose and avoid cases, anatomy, public API and defaults, variants and states, interaction, content/Slots, layout/resizing, part/state-to-Token bindings, composition constraints, accessibility, mappings, examples, forbidden implementations, acceptance criteria, provenance, and open issues.

**How to prepare:** Lock the component inventory first. For each component, use source code, Figma definitions, accessibility behavior, and approved decisions to document public behavior. Describe what changes and what stays invariant in every state.

**Necessity:** **Baseline required** for a component system. A Tokens-only system can mark L5 `N/A` with that explicit scope.

**Healthy evidence:** Under visual composition, an Agent can select and compose components without guessing visual defaults, layout, state appearance, content, or Token bindings. Under interactive implementation, a Coding Agent can additionally implement the public API, transitions, input handling, and accessibility behavior without material guesses.

**Common failure:** Screenshot galleries, state-name lists, undocumented defaults, duplicated global values, or no acceptance criteria.

## L6 — Implementation, mapping, and validation

**Question:** How does an Agent deliver and validate the selected output, and check agreement with external sources when they are included?

**Role:** Turns the contract into an observable delivery and verification protocol: visual checks for composition; visual plus behavioral/API/accessibility checks for interactive implementation. External parity is a separate evidence question in both profiles.

**Content to prepare:** Supported platforms and differences, implementation constraints, stable IDs, Contract↔Figma↔code mappings, acceptance criteria, automated/visual/accessibility validation, evidence requirements, allowed deviations, blockers, and drift/digest policy.

**How to prepare:** Inventory available validation tools and external projections, define mapping status vocabulary, specify pass/fail evidence, and separate declared, observed, and verified claims. Mark unavailable external verification as not observed, not failed.

**Necessity:** **Baseline required** for Agent-ready use. Mappings to an out-of-scope projection may be `N/A`, but the internal finish gate and validation protocol still need to exist.

**Healthy evidence:** Every blocking rule has an observable check, evidence location, and clear consequence.

**Common failure:** “Match the design” as the only criterion, volatile node IDs as identities, or parity claims without readback evidence.

## L7 — Lifecycle

**Question:** How does the contract evolve without silently breaking consumers?

**Role:** Governs versioning, migration, deprecation, ownership, open decisions, and validation history.

**Content to prepare:** Versioning and compatibility policy, change classes, deprecation/replacement, migration steps, breaking-change handling, changelog, open decisions, validation history, and ownership.

**How to prepare:** Identify consumers and release cadence, define editorial/corrective/compatible/breaking changes, set deprecation windows, and connect each change to migration and validation evidence.

**Necessity:** **Required for maintained use.** An early prototype can start with a minimal owner, version, and open-decision log, but a shared system cannot safely omit lifecycle policy.

**Healthy evidence:** Consumers can determine compatibility, migration work, and the status of unresolved decisions.

**Common failure:** A changelog without compatibility rules, ownerless TBDs, or silent changes to defaults and Token names.

## Recommended package shapes

### Minimum viable contract

```text
design-system-contract/
├── AGENT.md                         L0
├── 01-product-experience.md         L1, may be concise
├── 02-design-principles.md          L2, may be concise
├── 03-brand-design-language.md      L3, may contain justified N/A items
├── 04-foundations.md                L4
├── 05-components/
│   ├── index.md
│   └── <component-id>.md            L5
├── 06-implementation-validation.md  L6
└── 07-lifecycle.md                  L7, may begin with minimal policy and owned TBDs
```

“Minimum viable” reduces depth, not responsibility coverage. Keep every domain visible and resolve unknown or inapplicable content explicitly.

### Maintained modular contract

```text
design-system-contract/
├── AGENT.md
├── 01-product-experience.md
├── 02-design-principles.md
├── 03-brand-design-language.md
├── 04-foundations.md
├── 05-components/
│   ├── index.md
│   └── <component-id>.md
├── 06-implementation-validation.md
└── 07-lifecycle.md
```

Package shape is secondary to semantic ownership, direct links, and progressive loading.

## Preparation order

1. Identify authority, consumers, scope, owners, and exclusions for L0.
2. Collect product, principle, and brand evidence for L1–L3.
3. Lock the Token and component inventories before writing L4–L5.
4. Capture implementation mappings and observable validation for L6.
5. Define lifecycle and migration policy for L7.
6. Return to L0 and make it an accurate router and finish gate.
