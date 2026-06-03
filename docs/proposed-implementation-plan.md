# Proposed Implementation Plan

Phased plan for aligning the current reference expression with the logical graph grammar. Each phase is independently valuable and can be paused after completion.

Date: 2026-06-03

---

## Phase 1: Vocabulary support

Extend node and edge type vocabularies to support the grammar's inscription and relation kinds.

### Approach decision: enums vs. lookup tables

**Recommendation**: Convert `node_type` and `edge_type` from PostgreSQL enums to lookup tables. These are the types most likely to evolve. Other enums (agent_trust, board_status, etc.) are stable and can remain as enums.

If the enum-to-lookup migration is deferred, use `ALTER TYPE ... ADD VALUE` to extend the existing enums instead. This is simpler but irreversible (values cannot be removed).

### New node type values needed

```text
actor
projection
retro-projection
commentary
```

### New edge type values needed

```text
depends-on        (may remain an alias for blocked-by -- decision needed)
contradicts
clarifies
makes-readable
obscures
marks-edge
projects-as
projects-to
retro-projects
interprets-as
infers-intent
infers-test
infers-gap
infers-decision
signals
authorizes
expresses
tested-by
participates-in
```

Not all need to be added at once. Minimum first batch: `contradicts`, `clarifies`, `makes-readable`, `projects-to`, `retro-projects`, `participates-in`, `tested-by`.

### Files to change

- `bootstrap/001-enums.sql` -- add new enum values or create lookup tables
- `bootstrap/004-populate-graph.js` -- add new intent nodes for projection/retro-projection/readability operations
- `bootstrap/014-create-system-graph.js` -- add new node IDs to system graph membership list

### Schema changes

Option A (enum extension -- simpler, less flexible):
```sql
ALTER TYPE gdd.node_type ADD VALUE 'actor';
ALTER TYPE gdd.node_type ADD VALUE 'projection';
ALTER TYPE gdd.node_type ADD VALUE 'retro-projection';
ALTER TYPE gdd.node_type ADD VALUE 'commentary';

ALTER TYPE gdd.edge_type ADD VALUE 'contradicts';
ALTER TYPE gdd.edge_type ADD VALUE 'clarifies';
ALTER TYPE gdd.edge_type ADD VALUE 'makes-readable';
ALTER TYPE gdd.edge_type ADD VALUE 'projects-to';
ALTER TYPE gdd.edge_type ADD VALUE 'retro-projects';
ALTER TYPE gdd.edge_type ADD VALUE 'participates-in';
ALTER TYPE gdd.edge_type ADD VALUE 'tested-by';
```

Option B (lookup table -- more flexible, larger migration):
```sql
CREATE TABLE gdd.node_types (id TEXT PRIMARY KEY, description TEXT);
CREATE TABLE gdd.edge_types (id TEXT PRIMARY KEY, description TEXT);
-- Populate from current enum values + new values
-- Alter gdd.nodes.type from enum to TEXT with FK
-- Alter gdd.edges.edge_type from enum to TEXT with FK
```

### Tests

- Verify new node types can be created, queried, and participate in edges
- Verify new edge types can be created between appropriate node pairs
- Verify `queryIncomplete` correctly handles new node types (projection, retro-projection, actor, commentary should probably be excluded like expression/decision/signal)

### Rollback risks

- Option A: enum values cannot be removed once added, but this is low risk since the values come from the grammar
- Option B: requires data migration; rollback means restoring enum columns from backup

### Open questions

1. Should `depends-on` be a distinct edge type or remain folded into `blocked-by`?
2. Should `participates-in` edges replace the `board_id` FK column, or coexist?
3. Which new node types should be excluded from `queryIncomplete`? (Likely: projection, retro-projection, commentary, actor)

---

## Phase 2: Board participation as many-to-many

Currently nodes have a single `board_id` FK. The grammar says nodes can participate in multiple boards and readability is board-relative. This requires many-to-many.

### Files to change

- `bootstrap/006-edge-boards-tables.sql` -- add `node_board_memberships` table or use `participates-in` edges
- `bootstrap/004-populate-graph.js` -- update `queryIncomplete` build_instructions for board_id scoping
- `skills/mcp-server.md` -- update tool documentation

### Schema changes

**Option A** (dedicated table):
```sql
CREATE TABLE gdd.node_board_memberships (
  node_id TEXT NOT NULL REFERENCES gdd.nodes(id),
  board_id TEXT NOT NULL REFERENCES gdd.boards(id),
  UNIQUE(node_id, board_id)
);
```

**Option B** (use `participates-in` edges):
No new table. Board participation is expressed as `participates-in` edges from nodes to board nodes. This requires boards to be in the `gdd.nodes` table (currently they're in a separate `gdd.boards` table).

**Recommendation**: Option A for now. It's simpler and doesn't require restructuring boards as graph nodes. The `board_id` column on `gdd.nodes` can be kept for backward compatibility (primary board) or deprecated.

### Tests

- Node participates in two boards
- Board queries return nodes from memberships, not just `board_id` column
- Readability can differ per board (placeholder for Phase 3)

### Rollback risks

Low -- additive change. Old `board_id` column remains functional.

### Open questions

1. Deprecate `board_id` on nodes or keep as "primary board"?
2. Should existing `board_id` values be migrated to the membership table?

---

## Phase 3: Readability support

Add the ability to distinguish readability from satisfaction. Readability is board-relative and retroactive.

### Files to change

- `bootstrap/001-enums.sql` or lookup tables -- readability edge types already added in Phase 1
- `bootstrap/004-populate-graph.js` -- add readability operation intents
- New operation: `recordReadabilityGap` / `recordClarification`
- `skills/mcp-server.md` -- new tools

### Schema changes

Minimal. Readability can be expressed using existing graph substrate:
- `clarifies` edges (from commentary/decision to opaque node)
- `makes-readable` edges (from new inscription to previously unreadable node)
- `obscures` edges (marking that a node has become harder to read)
- Gap nodes of a "readability-gap" convention (still type `gap`, but with notes indicating readability concern)

No new tables needed. The edge types from Phase 1 are sufficient.

### New operations / MCP tools

```text
recordReadabilityGap(node_id, board_id, notes)
  -- Creates a gap node noting that a specific node is unreadable on a specific board

recordClarification(node_id, board_id, content, actor)
  -- Creates a commentary node with a makes-readable edge to the target node

queryBoardReadability(board_id)
  -- Returns nodes on the board with readability status:
  --   readable (has makes-readable edges, no unresolved readability gaps)
  --   unreadable (has active readability gaps)
  --   unclarified (no readability relations at all -- unknown)
```

### Tests

- Satisfied but unreadable node (green, but has readability gap on board)
- Unsatisfied but readable node (red, but has clarification on board)
- Untested but readable node
- Readable on one board, unreadable on another

### Rollback risks

Low -- additive. Readability features can be ignored by existing tools.

### Open questions

1. Should readability be computed or explicitly inscribed? Grammar allows both. Recommendation: explicitly inscribed via edges, derivable via query.

---

## Phase 4: Projection and retro-projection as inscriptions

Add the ability to record projections and retro-projections as graph inscriptions.

### Files to change

- `bootstrap/004-populate-graph.js` -- add intent nodes for projection/retro-projection operations
- New operations: `recordProjection`, `queryProjections`, `recordRetroProjection`, `queryRetroProjections`
- `skills/mcp-server.md` -- new tools

### Schema changes

None -- use existing nodes and edges. Projections and retro-projections are nodes of type `projection` / `retro-projection` (added in Phase 1) with edges:
- `projects-to` from board/intent to projection node
- `retro-projects` from artifact/system reference to retro-projection node
- `infers-intent`, `infers-test`, `infers-gap` from retro-projection to inferred nodes

### New operations / MCP tools

```text
recordProjection(params)
  -- Creates a projection node with:
  --   name, description, board_id, purpose, audience, register
  --   artifacts (JSONB -- the projected view/system/document)
  --   Creates projects-to edges from source intents/board to projection

queryProjections(board_id?, purpose?)
  -- Returns recorded projection inscriptions, optionally filtered

recordRetroProjection(params)
  -- Creates a retro-projection node with:
  --   name, description, source_artifact (text or JSONB reference)
  --   board_id (the board from which the artifact is being read)
  --   purpose, confidence_notes
  --   Optionally creates inferred nodes (intents, tests, gaps) with
  --   infers-intent/infers-test/infers-gap edges

queryRetroProjections(source?, board_id?)
  -- Returns retro-projection inscriptions, optionally filtered
  -- Supports finding competing retro-projections from the same artifact
```

### Tests

- One graph projected into two different system descriptions
- One artifact retro-projected into two different graph readings
- Retro-projection preserving uncertainty as gaps
- Competing retro-projections from the same source queryable together

### Rollback risks

Low -- additive. New node/edge types, new operations.

### Open questions

1. Should retro-projection automatically create inferred nodes, or just record the reading and let the actor create nodes separately?
2. How much artifact metadata should the retro-projection inscription carry?

---

## Phase 5: Actor inscriptions and commentary

Add first-class actor and commentary inscriptions.

### Files to change

- `bootstrap/004-populate-graph.js` -- add intent nodes for actor/commentary operations
- New operations: `recordActor`, `recordCommentary`, `queryCommentary`
- `skills/mcp-server.md` -- new tools

### Schema changes

None -- use existing nodes table with new node types (added in Phase 1).

### New operations / MCP tools

```text
recordActor(params)
  -- Creates an actor node with:
  --   name, actor_kind (human, llm-agent, system, test-runner, etc.)
  --   scope, trust_level, mode_of_participation
  --   Stored in nodes table with type='actor'

recordCommentary(params)
  -- Creates a commentary node with:
  --   name, content (the interpretive text)
  --   target_node_id -- creates a clarifies edge
  --   board_id, actor

queryCommentary(node_id?, board_id?)
  -- Returns commentary nodes, optionally filtered by target or board
```

### Tests

- Actor node created and queryable
- Commentary node with clarifies edge to target
- Commentary does not change satisfaction status of target

### Rollback risks

Minimal.

### Open questions

1. How do actor inscriptions relate to the existing `gdd.agents` table? Should agents become a specialization of actor nodes, or remain separate?
2. Should the `gdd.agents` table be deprecated in favor of actor nodes with agent-specific metadata in JSONB?

---

## Phase 6: Portable graph package export/import

Add the ability to export a graph (or subgraph) as a portable package and import it into another GDD instance.

### Prerequisite

Phases 1-4 must be complete. Projection and retro-projection must be representable before portability makes sense.

### Files to change

- New operations: `exportGraphPackage`, `importGraphPackage`
- `skills/mcp-server.md` -- new tools

### Schema changes

None for export. Import may need conflict resolution logic (duplicate node IDs, schema version compatibility).

### New operations / MCP tools

```text
exportGraphPackage(graph_id, options?)
  -- Exports a graph as a JSON package containing:
  --   nodes (all types), edges, boards, edge_nodes, graph memberships
  --   projection records, retro-projection records
  --   metadata: source instance, export date, schema version
  -- Options: include_superseded (default false), include_expressions (default true)

importGraphPackage(package, options?)
  -- Imports a graph package into the current instance
  -- Options: merge_strategy (create-new | map-existing | interactive)
  -- Returns: import report (created, skipped, conflicts)
```

### Tests

- Export graph, import into fresh instance, verify node/edge counts
- Export with superseded nodes excluded, verify they're absent
- Import with conflicting node IDs, verify conflict handling
- Round-trip: export, import, re-export, compare

### Rollback risks

Import is the risky direction -- it creates nodes and edges. Should be wrapped in a transaction with dry-run option.

### Open questions

1. Package format: JSON? SQLite? Something else?
2. How to handle cross-graph edges during partial export?
3. Schema version compatibility checks?

---

## Implementation sequence summary

```text
Phase 1: Vocabulary support (node/edge types)          -- unblocks everything
Phase 2: Board participation as many-to-many            -- unblocks readability
Phase 3: Readability support                            -- unblocks conformance question #10
Phase 4: Projection / retro-projection as inscriptions  -- unblocks portability
Phase 5: Actor inscriptions and commentary              -- enriches the graph
Phase 6: Portable graph package export/import           -- the portability payoff
```

Phases 1-3 are the minimal set for grammar conformance. Phase 4 is the most conceptually significant addition. Phases 5-6 can be deferred.

### Estimated scope

- Phase 1: 1 migration script + bootstrap updates
- Phase 2: 1 migration script + operation updates
- Phase 3: 3 new operations + MCP tools
- Phase 4: 4 new operations + MCP tools
- Phase 5: 3 new operations + MCP tools
- Phase 6: 2 new operations + MCP tools + package format design

All phases are additive. No existing functionality is removed or broken.
