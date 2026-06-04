# GitHub Repository Retro-Projection Test Plan

## Purpose

This document describes how to retro-project a GitHub repository into a GDD intent graph. The methodology uses signals-first inscription: every artifact observation starts as a signal node before being interpreted into candidate intents, tests, or gaps.

Retro-projection is NOT requirements extraction. A working system can suggest many possible graphs. The goal is to produce one situated reading of the repository, acknowledge its partiality, and make it contestable.

## Signals-First Methodology

Every observation about the repository enters the graph as a signal node first, using `op-create-signal-relation` with `signals` edges to relevant target nodes. Signals are pre-interpretive: they record what was observed, not what it means. Interpretation happens in the retro-projection phase, where signals are read through a board's axioms and constraints to produce candidate intents, tests, and gaps.

Why signals first:
- The raw observation is never lost to a failed or partial interpretation
- Multiple retro-projections can read the same signals differently
- Signal nodes accumulate as the repository is explored, building a comprehensive observation layer before any interpretation begins
- Contested interpretations are traceable back to the specific signals that motivated them

## Artifact Categories

When scanning a GitHub repository, observe and inscribe signals for:

1. **README and documentation** -- project purpose, stated architecture, usage patterns, contribution guidelines
2. **package.json / build configuration** -- dependencies, scripts, entry points, dev tooling
3. **CI/CD workflows** -- GitHub Actions, test pipelines, deployment targets, environment configurations
4. **Test directories** -- test framework, coverage patterns, test naming conventions, fixture structure
5. **Source structure** -- directory layout, module boundaries, import patterns, layer separation
6. **Issue templates and PR templates** -- what the project considers reportable, contribution process
7. **Deployment configurations** -- Dockerfiles, infrastructure-as-code, environment variable conventions
8. **TODO/FIXME comments** -- embedded gap indicators, deferred decisions, known debt
9. **Stale dependencies** -- outdated packages, deprecated APIs, version constraints
10. **Git history patterns** -- commit frequency, branch strategy, release cadence (observable, not extracted)

## Three-Phase Process

### Phase 1: Signal Inscription

Scan the repository and create signal nodes for each observation. Each signal records:
- `source`: the file path or artifact category
- `observed_content`: what was found (concrete, factual, not interpreted)
- `target_ids`: initially empty or pointing to a board root node

```
op-create-signal-relation({
  name: "README describes Express REST API on port 3000",
  source: "README.md",
  observed_content: "## Stack\n- Backend: Node.js/Express\n- API: REST endpoints on port 3000",
  target_ids: [board-root-id],
  board_id: retro-board-id
})
```

Do not create intents during this phase. The temptation to immediately say "this means there's an intent to have an Express server" is the premature collapse that retro-projection is designed to avoid.

### Phase 2: Retro-Projection

Read the accumulated signals through the board's axioms and produce candidate graph elements using `op-record-retro-projection`:

- **Inferred intents** (via `infers-intent` edges) -- what the signals suggest needs to exist
- **Inferred tests** (via `infers-test` edges to test nodes) -- what the signals suggest about satisfaction conditions
- **Inferred gaps** (via `infers-gap` edges) -- where signals are ambiguous, contradictory, or insufficient

Each retro-projection records its confidence notes: how situated the reading is, what axioms shaped it, what alternative readings were considered.

### Phase 3: Contestation

The retro-projected graph is contestable. Actors can:
- Create commentary nodes (`comments-on` edges) challenging specific inferences
- Create competing retro-projections from the same signals
- Create gaps where the retro-projection assumed something it shouldn't have
- Refine inferred intents with `refines` edges
- Supersede inferred intents that were wrong

The signal layer remains stable through all this. Only the interpretation layer changes.

## Example: Small Node.js Repository

### Phase 1 signals (partial):

| Signal | Source | Observed Content |
|--------|--------|-----------------|
| sig-readme-stack | README.md | "Node.js/Express, PostgreSQL, port 3000" |
| sig-pkg-deps | package.json | "express: ^4.18, pg: ^8.11, jest: ^29.7" |
| sig-test-dir | tests/ | "3 test files: api.test.js, db.test.js, utils.test.js" |
| sig-ci-workflow | .github/workflows/test.yml | "runs jest on push to main, node 18/20 matrix" |
| sig-no-dockerfile | repository root | "No Dockerfile or docker-compose.yml found" |
| sig-todo-auth | src/routes/users.js:42 | "// TODO: add authentication middleware" |

### Phase 2 retro-projection:

From these signals, one possible reading:

- **Inferred intent**: "Express server exists and responds on port 3000" (from sig-readme-stack + sig-pkg-deps)
- **Inferred intent**: "PostgreSQL database connection configured" (from sig-readme-stack + sig-pkg-deps)
- **Inferred test**: "Jest test suite passes" (from sig-test-dir + sig-ci-workflow) -- creates test node with `infers-test` edge
- **Inferred gap**: "Authentication mechanism undecided" (from sig-todo-auth) -- the TODO is a signal that the decision hasn't been made
- **Inferred gap**: "Deployment strategy unclear" (from sig-no-dockerfile) -- absence is also a signal

### Phase 3 contestation:

Another actor might contest: "The lack of a Dockerfile doesn't indicate an unclear deployment strategy -- this repo might deploy to a PaaS that doesn't need one." That commentary attaches to the gap via `comments-on` edge, and the original signal (sig-no-dockerfile) is still there to support either reading.

## Key Principles

1. **Retro-projection is not requirements extraction.** There is no "true" intent graph hiding in the code. Every reading is situated.

2. **Signals persist independently.** Failed interpretations don't destroy the observations they were based on.

3. **Multiple readings coexist.** Two retro-projections of the same repository can disagree. The graph holds both.

4. **Test nodes make satisfaction legible.** Retro-projected tests via `infers-test` edges create real test nodes that can be refined, contested, or used to evaluate candidate expressions.

5. **The board shapes the reading.** A security-focused board and a performance-focused board will produce different retro-projections from the same signals. This is by design.

6. **Absence is a signal.** Missing tests, missing documentation, missing CI -- these are observations worth inscribing. The gap between "what exists" and "what is expected" is where the most valuable inferences live.
