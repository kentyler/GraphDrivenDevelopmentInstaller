# Implementation Audit Against Grammar

Audit of the current GDD-install reference expression (PostgreSQL/Node/MCP) against `docs/gdd-invariants.md` and `docs/gdd-logical-graph-grammar.md`.

Date: 2026-06-03

---

## 1. Inscription kinds: grammar vs. current schema

The grammar defines 13 primary inscription kinds. The current `gdd.node_type` enum has 21 values. Here is the mapping:

| Grammar kind | Current support | How |
|---|---|---|
| **Intent** | Supported | Multiple node_type values serve as intent kinds: `define-table`, `implement-operation`, `compose`, etc. These are implementation-granularity subtypes of "intent." |
| **Expression** | Supported | `expression` is a node_type value. Expressions carry `artifacts` (JSONB). |
| **Test** | Partially supported | Tests are embedded as `test_condition` and `test_verification` fields on intent nodes, not as separate nodes. Grammar allows this but notes the logical relation must exist. |
| **Gap** | Supported | `gap` is a node_type value. Requires `notes`. |
| **Decision** | Supported | `decision` is a node_type value. Can create `closes` edges to gaps. |
| **Signal** | Supported | `signal` is a node_type value. |
| **Board** | Supported | Separate `gdd.boards` table with `statement`, `status`. Nodes link to boards via `board_id`. |
| **Edge Node** | Supported | Separate `gdd.edge_nodes` table with `board_id`, `weight`, `status`, `source_gap_id`. Supporting tables: `sensitivity_readings`, `tension_readings`, `expansion_events`, `conversion_events`. |
| **Axiom** | Supported | `axiom` is a node_type value. Requires `notes` and `board_id`. |
| **Actor** | **Not supported** | No `actor` node type. No actor inscription table. Agents (`gdd.agents`) exist but are specialized LLM agents, not the grammar's general actor concept (which includes humans, systems, tests, deadlines, etc.). |
| **Projection** | **Not supported as inscription** | `buildProjection` is an operation that produces a transient view. Projections are not recorded as graph inscriptions. The grammar says projections "may be recorded as an inscription when it affects subsequent work." |
| **Retro-projection** | **Not supported** | No concept exists in schema, operations, or MCP tools. |
| **Commentary** | **Not supported** | No commentary node type or relation. |

### Node type assessment

The current `node_type` enum mixes grammar-level kinds (gap, decision, signal, expression, axiom) with implementation-granularity subtypes of "intent" (define-table, implement-operation, implement-endpoint, etc.). The grammar does not require these subtypes -- they are expression-layer choices that happen to be useful for the current build system.

**Gap**: The grammar kinds `actor`, `projection`, `retro-projection`, and `commentary` have no representation. Of these, `retro-projection` is the most significant conceptual gap because projection/retro-projection is central to the grammar's portability and migration claims.

---

## 2. Relation types: grammar vs. current schema

The grammar defines 23+ core relation kinds. The current `gdd.edge_type` enum has 7:

| Grammar relation | Current support | Notes |
|---|---|---|
| **satisfies** | Supported | Expression -> Intent |
| **tested-by** | **Not supported as edge** | Tests are fields on nodes, not separate nodes with edges |
| **blocked-by** | Supported | |
| **depends-on** | Not distinct from blocked-by | Grammar treats these as potentially separate; current impl uses only blocked-by |
| **contains** | Supported | Compose -> children |
| **participates-in** | **Not supported as edge** | Board participation is via `board_id` column, not an edge |
| **refines** | Supported | |
| **supersedes** | Supported | For both nodes and edges (via `superseded_by` on edges) |
| **closes** | Supported | Decision -> Gap |
| **tensions-with** | Supported | |
| **contradicts** | **Not supported** | |
| **clarifies** | **Not supported** | |
| **makes-readable** | **Not supported** | |
| **obscures** | **Not supported** | |
| **marks-edge** | **Not supported as edge** | Edge nodes exist in separate table with FK, not as graph edges |
| **projects-as** | **Not supported** | |
| **projects-to** | **Not supported** | |
| **retro-projects** | **Not supported** | |
| **interprets-as** | **Not supported** | |
| **infers-intent** | **Not supported** | |
| **infers-test** | **Not supported** | |
| **infers-gap** | **Not supported** | |
| **signals** | **Not supported as edge** | Signals are nodes, but there's no edge connecting a signal to what it affects |
| **authorizes** | **Not supported** | |
| **expresses** | **Not supported** | Overlaps with satisfies but grammar distinguishes them |

**Assessment**: 7 of 23+ relation kinds are supported. The missing kinds fall into clusters:

1. **Readability relations** (clarifies, makes-readable, obscures) -- entirely absent
2. **Projection/retro-projection relations** (projects-as, projects-to, retro-projects, interprets-as, infers-*) -- entirely absent
3. **Authorization relations** (authorizes) -- absent
4. **Signal relations** (signals) -- signals exist as nodes but lack edges connecting them to effects

The grammar notes that "a concrete implementation may use fewer primitive edge types if it can derive the same logical relations without ambiguity." The current implementation cannot derive the missing relations -- they simply don't exist yet.

---

## 3. Derived conditions

The grammar requires these conditions to be derivable from topology:

| Condition | Current support | Notes |
|---|---|---|
| red/green | **Supported** | Derived from presence/absence of `satisfies` edges. Not stored as mutable status. Correct. |
| tested/untested | **Supported** | Derived from whether `test_condition` is null. |
| gap (open/closed) | **Supported** | Derived from `closes` edges. |
| current/superseded | **Supported** | Derived from `supersedes` edges and `superseded_by` on edges. |
| blocked/workable | **Supported** | Derived from `blocked-by` edge topology. `queryIncomplete` computes workability. |
| inside board | **Supported** | Via `board_id` column. |
| at board edge | **Partially** | Edge nodes exist in separate table. No topological derivation from the main graph. |
| readable in board | **Not supported** | No readability mechanism. |
| unreadable in board | **Not supported** | |
| projected expression | **Not supported** | |
| retro-projected reading | **Not supported** | |

**Assessment**: Core satisfaction and dependency topology is sound. Board-relative readability and projection/retro-projection tracking are absent.

---

## 4. Conformance checklist evaluation

Against `docs/gdd-conformance-checklist.md`:

1. **Shared graph inscription surface?** Yes -- the graph is the source of truth.
2. **Optimized for LLM reasoning with human projections?** Yes -- `renderLLM` and `renderHuman` produce dual views.
3. **Non-representational and incomplete?** Partially -- the graph admits gaps and unevenness, but the documentation didn't explicitly frame it this way until the new docs.
4. **Append-only topology?** Yes -- supersession, no deletion. Correct.
5. **Boards rather than whole-graph view?** Partially -- boards exist but `queryIncomplete` defaults to whole-graph queries. Board scoping is optional, not primary.
6. **Board edges from incompleteness?** Yes -- edge nodes with `source_gap_id`, conversion/expansion events.
7. **No predetermined granularity?** Partially -- the 20 implementation-specific node types (define-table, implement-operation, etc.) impose granularity categories, though the grammar allows this as an expression-layer choice.
8. **Intent vs. task distinction?** Yes in concept. The node model records conditions, not actions.
9. **Tests for satisfaction?** Yes -- test_condition required for green. Untested intents stay red. Write-once test conditions.
10. **Satisfaction vs. readability?** **No** -- readability is not represented at all.
11. **Gaps and unreadability as non-failures?** Gaps yes. Unreadability not represented.
12. **Agents as scoped actors?** Yes -- `gdd.agents` has scope, trust_level, trigger.
13. **Nonhuman actors?** Partially -- signals can transduce external events, but there's no first-class actor inscription beyond agents.
14. **Projection without determinism?** N/A -- projection operations exist but projection-as-inscription doesn't.
15. **Retro-projection without requirements extraction?** **No** -- retro-projection doesn't exist.
16. **Multiple systems from one graph?** Not prevented, but not explicitly supported.
17. **Multiple graphs from one system?** Not supported.
18. **Portable graph package?** **No** -- no export/import mechanism.
19. **Value as board activity?** Yes -- no global value/priority fields.
20. **Expression-layer choices open?** The new docs frame it correctly. Schema is still tightly coupled to PostgreSQL specifics.

---

## 5. Enum vs. lookup table assessment

The current implementation uses PostgreSQL enums for:
- `gdd.node_type` (21 values)
- `gdd.edge_type` (7 values)
- `gdd.agent_trust` (3 values)
- `gdd.agent_status` (3 values)
- `gdd.edge_node_status` (3 values)
- `gdd.board_status` (3 values)
- `gdd.board_impact` (3 values)
- `gdd.tension_character` (3 values)
- `gdd.peer_message_direction` (2 values)
- `gdd.peer_message_type` (4 values)

**Problem**: PostgreSQL enums cannot have values removed (only added via `ALTER TYPE ... ADD VALUE`). The grammar anticipates evolving vocabularies. Adding new node/edge types is possible but removing or renaming is not.

**Recommendation**: Convert `node_type` and `edge_type` to lookup tables. These are the two enums most likely to evolve as the grammar develops. The smaller enums (agent_trust, board_status, etc.) are stable enough to remain as enums.

**Tradeoffs**:
- Lookup tables lose compile-time type safety but gain runtime flexibility
- Migration requires: create lookup table, populate, add FK column, migrate data, drop enum column
- The `q()` helper in `db.js` handles schema name replacement but would need no changes for this
- Existing bootstrap scripts reference enum values as strings -- these would continue to work against a lookup table with a TEXT PK

---

## 6. Schema-specific findings

### What works well
- Nodes and edges as the core substrate with no `created_at` (history is topology -- correct per invariants)
- `superseded_by` on edges enabling edge supersession
- `artifacts` JSONB on nodes for flexible expression content
- `build_instructions` on nodes for self-hosting
- `graph_memberships` for multi-graph node participation
- Board/edge-node infrastructure with sensitivity and tension readings

### What needs attention
- `board_id` on nodes should probably be a many-to-many relation (nodes can participate in multiple boards per grammar), not a single FK. Currently `participates-in` is not an edge type, and a node can only be on one board.
- Edge nodes are in a separate table (`gdd.edge_nodes`) rather than being graph nodes with edges. This isolates them from the main graph topology. The grammar treats edge nodes as inscriptions that participate in the graph.
- `expansion_events` and `conversion_events` are event log tables, but the grammar says "the graph does not maintain a separate history layer -- it is its own history." These events should arguably be expressed as graph inscriptions (decision nodes, edges) rather than separate event tables.
- No `is_superseded` column on nodes -- supersession is derived from edges, which is correct per the grammar, but `queryIncomplete` has to check for supersedes edges at query time.

---

## 7. MCP tool audit

### Currently supported tools that align with grammar
- `create_intent`, `record_expression`, `link_expression`, `create_gap`, `create_decision` -- core inscription operations
- `query_incomplete`, `build_projection` -- core traversal/projection
- `supersede_intent`, `supersede_edge`, `set_test_condition` -- append-only change
- `create_board`, `create_edge_node`, `convert_gap_to_edge`, `expand_edge_node` -- board/edge operations
- `record_tension_reading`, `record_sensitivity_reading` -- board observation
- Graph management tools (create_graph, add/remove node, query)
- Peer messaging tools (broadcast, receive, respond)

### Missing tools per grammar
- **No projection recording tool** -- projections are computed but not inscribed
- **No retro-projection tools** -- `recordRetroProjection`, `queryRetroProjections` don't exist
- **No readability tools** -- `recordReadabilityGap`, `queryBoardReadability` don't exist
- **No commentary tool** -- no way to add interpretive commentary to inscriptions
- **No actor inscription tool** -- no way to register non-agent actors
- **No artifact reference tool** -- expressions carry artifacts inline but there's no way to reference external artifacts
- **No export/import tools** -- no portable graph package

---

## 8. Bootstrap audit

### What the bootstrap seeds
- Root intent (`gdd-root`)
- 56+ intent nodes with `build_instructions` across Layers 0-6
- ~100 edges (blocked-by, contains)
- Bootstrap expressions satisfying DDL intents
- `gdd-system` graph with 68 members
- One seed edge node (multi-board architecture vision)
- One default board

### What the bootstrap does NOT seed
- The conceptual layer: readability, projection/retro-projection, graph portability, reverse engineering
- Actor inscriptions
- Axiom nodes representing the GDD invariants (this is correct per the invariants document, which says invariants are "not required to be inscribed as an axiom board in the first graph")
- Commentary nodes
- Any retro-projection or projection inscription

### Recommendation
The bootstrap should NOT automatically inscribe invariants as axioms. The invariants document explicitly states they exist "conceptually before any particular graph." However, the bootstrap could:
1. Add intent nodes for projection/retro-projection operations (new Layer 1-2 intents)
2. Add new node/edge type vocabulary to support the grammar's missing inscription kinds
3. Add a readability intent recognizing the concept without implementing it

---

## 9. Summary of gaps by severity

### Critical (grammar capabilities entirely absent)
1. **Retro-projection** -- no inscription kind, no relations, no tools, no operations
2. **Readability** -- no distinction from satisfaction, no board-relative readability mechanism
3. **Actor inscription** -- no general actor concept beyond LLM agents

### Important (grammar capabilities partially present)
4. **Projection as inscription** -- projections are computed but not recordable as graph inscriptions
5. **Commentary** -- no interpretive layer
6. **Board participation** -- single `board_id` FK instead of many-to-many
7. **Edge type vocabulary** -- 7 of 23+ grammar relations supported
8. **Edge nodes isolation** -- separate table instead of graph-integrated inscriptions

### Low priority (can be deferred)
9. **Portable graph package** -- depends on projection/retro-projection being represented first
10. **Authorization relations** -- depends on actor inscriptions
11. **Enum-to-lookup migration** -- valuable but not blocking grammar conformance
12. **Event tables** (expansion_events, conversion_events) -- conceptually impure but functionally adequate
