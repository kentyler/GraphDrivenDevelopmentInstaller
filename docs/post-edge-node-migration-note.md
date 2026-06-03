# Post Edge-Node Migration Verification

Date: 2026-06-03

Verification that the edge-node migration (commit `90847ce`) left no orphaned code paths and that all previous capabilities are expressible through ordinary graph inscriptions.

---

## 1. Edge nodes are created only as gdd.nodes with type='edge-node'

**Verified.** All code paths create edge nodes as `gdd.nodes` rows:

- `bootstrap/001-enums.sql`: `'edge-node'` is in the `gdd.node_type` enum (value 22 of 26).
- `bootstrap/009-populate-edge-boards.js`: `op-create-edge-node` build_instructions say `INSERT INTO gdd.nodes with type='edge-node'`. Seed edge node inserts into `gdd.nodes`.
- `skills/mcp-server.md`: `create_edge_node` maps to `INSERT into gdd.nodes with type 'edge-node'`.
- `skills/intent-graph-layers.md`: Operation block updated -- no reference to a separate table.

No code path creates rows in a `gdd.edge_nodes` table.

## 2. No code path still reads or writes gdd.edge_nodes, expansion_events, conversion_events, or edge_node_status

**Verified.** Full-text search across all bootstrap scripts, skill files, and SQL files found:

- **Zero active references** to `gdd.edge_nodes` as a table to read/write.
- **Zero active references** to `expansion_events` or `conversion_events` as tables to read/write.
- **Zero active references** to `edge_node_status` as an enum to use.

All remaining mentions are explanatory comments (e.g., "No separate gdd.edge_nodes table", "expansion_events and conversion_events removed") that document the migration, not use the old structures.

Files cleaned:
- `bootstrap/005-edge-boards-enums.sql` -- `edge_node_status` enum removed
- `bootstrap/006-edge-boards-tables.sql` -- `gdd.edge_nodes`, `expansion_events`, `conversion_events` tables removed
- `bootstrap/009-populate-edge-boards.js` -- `table-edge-nodes` and `type-edge-node-status` intents removed
- `bootstrap/014-create-system-graph.js` -- removed from system graph membership
- `skills/foundations.md` -- updated edge node descriptions
- `skills/intent-graph.md` -- updated table list
- `skills/intent-graph-layers.md` -- removed JSON blocks, updated children/blocked-by arrays, updated operation descriptions

## 3. Edge nodes can be endpoints of ordinary gdd.edges

**Verified.** Edge nodes are `gdd.nodes` rows. The `gdd.edges` table's `from_node` and `to_node` columns have FK constraints to `gdd.nodes(id)`. Any edge node can be a source or target of any edge type. This was the core motivation for the migration -- edge nodes were previously isolated from the graph topology.

## 4. marks-edge is usable as a real relation

**Verified.** `marks-edge` is in the `gdd.edge_type` enum (`bootstrap/001-enums.sql`, line 49). The `op-create-edge-node` build_instructions explicitly create `marks-edge` edges from the edge node to each related node. `op-get-edge-node` joins via `gdd.edges WHERE edge_type = 'marks-edge'` to find related nodes. The `mcp-server.md` tool docs describe `marks-edge` as the relation used for edge node associations.

## 5. Previous expansion/conversion concepts are now expressible through ordinary graph inscriptions

**Verified.** The mapping:

| Old concept | Old mechanism | New graph-native mechanism |
|---|---|---|
| **Conversion event** (gap becomes edge node) | `conversion_events` table with FK to `gdd.edge_nodes` | Decision node + `closes` edge to gap + new edge-node in `gdd.nodes` + `marks-edge` edge. The decision's notes carry the conversion context (including `failed_articulation_attempts`). |
| **Expansion event** (edge node spawns gap) | `expansion_events` table with FK to `gdd.edge_nodes` | Gap node + `refines` edge from gap to edge node. Optional supersession of the edge node if fully expanded. |
| **Edge node status** (`active`, `expanded`, `converted`) | `gdd.edge_node_status` enum, `status` column on `gdd.edge_nodes` | Derived from topology: an edge node with incoming `refines` edges has been expanded; supersession marks it as fully resolved. No status column needed. |
| **source_gap_id** (which gap was converted) | Column on `gdd.edge_nodes` | Stored in `artifacts` JSONB (`{ source_gap_id: ... }`) and visible via `marks-edge` edge from edge node to original gap. |
| **related_nodes** (associated nodes) | `TEXT[]` column on `gdd.edge_nodes` | `marks-edge` edges in `gdd.edges` -- proper graph relations, not array storage. |
| **content, weight, created_by** | Columns on `gdd.edge_nodes` | `notes` (content), `artifacts` JSONB (`{ weight, created_by }`). |

Every operation that previously depended on the event tables now produces equivalent graph topology. The graph is its own history.

## 6. Test coverage specifications

**Verified.** The following test conditions are specified in the `build_instructions` and `test_condition` fields of the relevant intents:

| Operation | Test condition |
|---|---|
| `op-create-edge-node` | Edge node is a `gdd.nodes` row with type `edge-node`. Can be endpoint of `marks-edge` edges. Does not appear in `queryIncomplete`. |
| `op-convert-gap-to-edge` | Creates decision closing gap. Creates edge-node in `gdd.nodes`. Gap closed by decision. Conversion expressed as graph topology. |
| `op-expand-edge-node` | New gap node created with `refines` edge to edge node. Edge node superseded if fully expanded. |
| `op-record-sensitivity` | Sensitivity reading created with `edge_node_id`. Validates `edge_node_id` is a `gdd.nodes` row. |
| `op-assign-node-to-board` | Can assign node to board. Same node on multiple boards works. Duplicate rejected gracefully. |
| `op-query-board-nodes` | Returns nodes from `node_board_memberships`. Also includes nodes with `board_id` FK for backward compatibility. |

These test conditions cover edge-node board participation (via `node_board_memberships`), conversion/expansion as graph topology, and sensitivity reading validation against `gdd.nodes`. Readability/clarification tests are covered by the Phase 3 operations (`op-record-readability-gap`, `op-record-clarification`, `op-query-board-readability`). Supersession is covered by `op-expand-edge-node` ("Edge node superseded if fully expanded") and the general `op-supersede` operation.

Actual test implementation is deferred to the builder -- these are specifications, not executable tests.

---

## Summary

The migration is clean. No orphaned code paths. All previous capabilities are expressible through ordinary graph inscriptions. The edge node subsystem is now fully integrated into the graph topology.
