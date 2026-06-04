# Reference Expression v1.2 Status

## Summary

Reference Expression v1.2 resolves the two remaining residual gaps from v1.1:

1. **Test nodes** -- `tested-by` edge existed but tests were only embedded fields on intents. Now test conditions can be inscribed as first-class `test` nodes, targetable by `infers-test`, commentary, and refinement edges.

2. **Signal relations** -- `signals` edge existed but was unused. Now `op-create-signal-relation` creates signal nodes with `signals` edges to target nodes, enabling signals-first retro-projection methodology.

## Changes Since v1.1

### Node Types

- **27 values** (was 26). Added `'test'` to `gdd.node_type` enum.
- Test nodes are structural inscriptions -- they make test conditions addressable but do not change the red/green derivation. Satisfaction still comes from `satisfies` edges.

### Edge Types

- All 27 edge types now have documented use paths. `tested-by` and `signals` were previously defined but unused; they are now exercised by the new operations.

### New Operations (4)

| Operation | Type | Purpose |
|-----------|------|---------|
| `op-create-test` | implement-operation | Create test node, link to intents via `tested-by` edges |
| `op-query-tests` | implement-traversal | Query test nodes by intent or board |
| `op-create-signal-relation` | implement-operation | Create signal node with `signals` edges to targets |
| `op-query-signals` | implement-traversal | Query signal nodes by target, board, or source |

### Updated Operations

- **`op-query-incomplete`**: Now excludes `test` nodes (along with expression, decision, signal, axiom, actor, projection, retro-projection, commentary, edge-node)
- **`op-create-intent`**: Forces `test_condition` to null for `test` type nodes
- **`type-node-type`**: Updated to reflect 27 values

### New Edges

- `op-create-test` blocked-by `op-create-intent`, `op-create-edge`
- `op-query-tests` blocked-by `op-create-test`
- `op-create-signal-relation` blocked-by `op-create-intent`, `op-create-edge`
- `op-query-signals` blocked-by `op-create-signal-relation`

### System Graph

- `gdd-system` membership increased by 4 nodes: `op-create-test`, `op-query-tests`, `op-create-signal-relation`, `op-query-signals`

### Skill Files Updated

- `skills/mcp-server.md`: 4 new tool blocks (`create_test`, `query_tests`, `create_signal_relation`, `query_signals`). `create_edge` description updated to mention all 27 edge types.
- `skills/intent-graph-layers.md`: `type-node-type` updated to 27 values. 4 new operation JSON blocks added to Layer 1. Edge Summary updated with new dependency edges.
- `skills/intent-graph.md`: Node kinds list updated to include test. New "Test type" section with node structure and semantics.

### New Documentation

- `docs/github-repo-retro-projection-test-plan.md`: Signals-first methodology for retro-projecting GitHub repositories. Three-phase process (signal inscription, retro-projection, contestation) with example walkthrough.

## Design Decisions

1. **Test nodes don't change green/red.** Satisfaction is still derived from `satisfies` edges. Test nodes are structural -- they make tests addressable but don't alter the derivation.

2. **Embedded fields remain.** `test_condition`/`test_verification` on intents stay as backward-compatible summaries. `op-create-test` optionally populates them when they're currently null.

3. **Signal is standalone.** `op-create-signal-relation` is independent of `op-transduce-external`. Many signals won't go through LLM transduction -- they are observations that may never be interpreted, or that are interpreted later by a different actor.

4. **Signal direction.** Signal --signals--> Target (signal is source, thing it affects is target). This matches the grammar: "this observation signals something about that node."

5. **Test nodes excluded from queryIncomplete.** They're structural inscriptions, not work to be done. Like expression, decision, axiom, and commentary nodes, they serve the graph but are not themselves intents to satisfy.

## Readiness for GitHub Retro-Projection

With test nodes and signal relations in place, the graph now supports the full retro-projection pipeline:

1. **Signal inscription** via `op-create-signal-relation` -- observe artifacts, create signal nodes
2. **Retro-projection** via `op-record-retro-projection` -- read signals, infer intents/tests/gaps
3. **Test inference** via `infers-test` edges to real `test` nodes -- retro-projected tests are addressable
4. **Contestation** via commentary, competing retro-projections, gap creation

See `docs/github-repo-retro-projection-test-plan.md` for the full methodology.

## Residual Gaps

None from v1.1. All 17/20 conformance checklist items from v1.0 remain satisfied. Items #4 and #5 (low priority) remain as before.

## Verification

After bootstrap, verify:
- Node count increases by 4 (new operations)
- Edge count increases by 6 (new blocked-by edges)
- `gdd-system` membership increases by 4
- `'test'` appears in `SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.node_type'::regtype`
- Red intent query excludes test nodes
