# Reference Expression v1

Status document for the current PostgreSQL/Node/MCP reference expression.

Date: 2026-06-03

---

## Commits covered

```
63996aa  Conceptual docs added (invariants, grammar, conformance, catch-up)
8eaaaef  Implementation audit against grammar
01c0a83  Phase 1: Vocabulary support (node/edge types)
e93c20b  Phase 2: Board participation as many-to-many
a25aef3  Phase 3: Readability support
bd38dd7  Phase 4: Projection and retro-projection as inscriptions
6657fc4  Phase 5: Actor inscriptions and commentary
f5a0bc7  Phase 6: Portable graph package export/import
9729413  Post-implementation invariant review
```

## Conformance

- **17/20** checklist items satisfied (was 11/20 before this pass)
- **6 target invariants preserved**: readability/satisfaction distinction, projection non-determinism, retro-projection as situated reading, portability without cloning, expression-layer openness, boards as local fields
- **5 residual gaps** retained as known gaps (see below)
- **10 implementation decisions** documented as reference-expression choices, not invariants

## This version is suitable as

- The current PostgreSQL/Node/MCP reference expression
- A basis for testing projection, retro-projection, readability, and portable graph packaging
- An instruction set from which a fresh GDD build can bootstrap with grammar-conformant vocabulary

## This version is not

- A final or canonical GDD implementation
- A complete expression of the logical graph grammar
- A portable graph system (the export/import operations are specified but not yet built)

## Residual gaps (priority order)

1. ~~`queryIncomplete` defaults to whole-graph scope~~ **Resolved.** `queryIncomplete` now requires `board_id`, `graph_id`, or explicit `scope: "global"`. Unscoped queries are rejected. (Commit after v1 tag.)

2. ~~**Edge nodes isolated in separate table**~~ **Resolved.** Edge nodes are now ordinary `gdd.nodes` rows with type `'edge-node'`. The `gdd.edge_nodes` table has been removed. Content stored in `notes`, weight/created_by in `artifacts` JSONB. Related nodes linked via `marks-edge` edges. Edge nodes participate fully in the graph as first-class inscriptions.

3. ~~**Event tables vs. graph-as-its-own-history**~~ **Resolved.** `expansion_events` and `conversion_events` tables removed. Transitions are now expressed as graph topology: conversions use decision nodes with `closes` edges, expansions use gap nodes with `refines` edges. The graph is its own history.

4. **`signals` edge available but unused** -- low risk. Good candidate for a small example or test later.

5. **`tested-by` edge available but tests remain embedded fields** -- leave alone. The grammar permits embedded tests. Forcing tests into separate nodes adds complexity without conceptual gain at this stage.

## What changed (checklist items that moved to "yes")

| # | Question | Change |
|---|----------|--------|
| 10 | Satisfaction vs. readability? | Readability operations, edge types, board-scoped queries |
| 11 | Gaps and unreadability as non-failures? | Readability gaps as first-class inscriptions |
| 13 | Nonhuman actors graph-significant? | Actor node type and record_actor operation |
| 14 | Projection without determinism? | Projection inscriptions, multiple projections allowed |
| 15 | Retro-projection without requirements extraction? | Situated readings, competing graphs, confidence notes |
| 17 | Multiple graphs from one system? | Multiple retro-projections from same artifact |
| 18 | Portable graph package? | Export/import with merge strategies |

## What remains partial

| # | Question | Why |
|---|----------|-----|
| 5 | Boards rather than whole-graph? | `queryIncomplete` defaults to whole-graph scope |
| 7 | No predetermined granularity? | 21 implementation-specific node subtypes impose some granularity categories |
