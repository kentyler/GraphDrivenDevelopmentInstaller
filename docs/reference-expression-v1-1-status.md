# Reference Expression v1.1 -- Board-Scoped and Graph-Native Edge Nodes

Status document for the current PostgreSQL/Node/MCP reference expression.

Date: 2026-06-03

---

## Commits since v1.0

```
3f14044  Require scope on queryIncomplete -- no one plays the whole graph
90847ce  Migrate edge nodes from side table to gdd.nodes with type='edge-node'
4c8a380  Clean stale edge-node references from skill files, add migration verification
```

## What changed

**v1.0** moved conformance from 11/20 to 17/20 checklist items and established the grammar-conformant vocabulary (26 node types, 27 edge types, readability operations, projection/retro-projection inscriptions, actor/commentary inscriptions, portable graph packages).

**v1.1** resolves three of the five residual gaps from v1.0:

1. **Board-scoped queryIncomplete** (commit `3f14044`). `queryIncomplete` now requires `board_id`, `graph_id`, or explicit `scope: "global"`. Unscoped queries are rejected. No one plays the whole graph.

2. **Graph-native edge nodes** (commits `90847ce`, `4c8a380`). Edge nodes converted from a separate `gdd.edge_nodes` table to ordinary `gdd.nodes` rows with type `'edge-node'`. Content stored in `notes`, weight/created_by in `artifacts` JSONB. Related nodes linked via `marks-edge` edges. Edge nodes now participate fully in the graph topology -- they can be endpoints of any edge type, targets of `clarifies` or `tensions-with` edges, and subjects of projection or retro-projection.

3. **Graph-as-its-own-history** (commit `90847ce`). `expansion_events` and `conversion_events` tables removed. Lifecycle transitions are now expressed through ordinary graph topology:
   - Conversion (gap becomes edge node): decision node + `closes` edge to gap + `marks-edge` edge from new edge node to original gap
   - Expansion (edge node spawns gap): gap node + `refines` edge to edge node
   - Status: derived from topology (incoming `refines` edges = expanded; supersession = fully resolved). No `edge_node_status` enum.

## Conformance

- **17/20** checklist items satisfied (unchanged from v1.0 -- the resolved gaps were not checklist items but structural tensions within the existing conformance)
- **6 target invariants preserved** (unchanged)
- **2 residual gaps** retained as known, acceptable gaps (down from 5)
- Checklist item #5 (boards rather than whole-graph) is now fully satisfied by the `queryIncomplete` scope requirement -- this was listed as partial in v1.0

## Residual gaps

1. **`signals` edge available but unused** -- low risk. The edge type exists in the vocabulary. Good candidate for a small example or test when a natural use case arises. Not a structural problem.

2. **`tested-by` edge available but tests remain embedded fields** -- explicitly permitted by the grammar. Embedded tests (`test_condition`, `test_verification` on nodes) are fine as long as satisfaction remains derivable and test changes are explicit (write-once test conditions, supersede to change). Forcing tests into separate nodes adds complexity without conceptual gain at this stage.

Neither gap requires action. Both are usage/example gaps, not structural problems.

## This version is suitable as

- The current PostgreSQL/Node/MCP reference expression
- A basis for testing projection, retro-projection, readability, and portable graph packaging
- An instruction set from which a fresh GDD build can bootstrap with grammar-conformant vocabulary
- A stable milestone for the edge-node and board-scoping design

## This version is not

- A final or canonical GDD implementation
- A complete expression of the logical graph grammar
- A portable graph system (the export/import operations are specified but not yet built)

## Files changed since v1.0

| File | Change |
|------|--------|
| `bootstrap/001-enums.sql` | Added `'edge-node'` to `node_type` enum (26 values) |
| `bootstrap/004-populate-graph.js` | Updated `type-node-type` build_instructions, `queryIncomplete` scope requirement |
| `bootstrap/005-edge-boards-enums.sql` | Removed `edge_node_status` enum |
| `bootstrap/006-edge-boards-tables.sql` | Removed `gdd.edge_nodes`, `expansion_events`, `conversion_events` tables |
| `bootstrap/009-populate-edge-boards.js` | All edge node intents rewritten for `gdd.nodes` |
| `bootstrap/014-create-system-graph.js` | Removed deleted intent IDs from system graph |
| `skills/foundations.md` | Updated edge node and boundary register descriptions |
| `skills/intent-graph.md` | Updated table list in build order |
| `skills/intent-graph-layers.md` | Removed 4 old intent blocks, updated operation descriptions and edge summary |
| `skills/mcp-server.md` | Updated edge node tool docs, `queryIncomplete` scope requirement |
| `CLAUDE.md` | Updated `queryIncomplete` example with scope |
| `docs/reference-expression-v1-status.md` | Marked gaps #1-3 resolved |
| `docs/post-edge-node-migration-note.md` | Migration verification (6 checks) |
