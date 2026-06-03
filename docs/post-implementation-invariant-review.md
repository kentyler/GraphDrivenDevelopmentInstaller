# Post-Implementation Invariant Review

Review of commits `01c0a83` through `f5a0bc7` (Phases 1-6) against the governing documents.

Date: 2026-06-03

---

## Method

Each invariant, grammar section, and conformance question is evaluated against what the six phase commits actually changed in the reference expression. The review distinguishes three outcomes:

- **Preserved**: the implementation respects the invariant
- **Tension**: the implementation partially satisfies the invariant but introduces a reference-expression choice that should be made explicit
- **Residual gap**: the invariant is not yet fully expressible in the current reference expression

---

## 1. Readability as distinct from satisfaction

**Invariant 10**: "Readability is board-relative and retroactive... Satisfaction asks whether an expression passes a test. Readability asks whether an inscription can currently be interpreted as a meaningful move within a board."

**What was implemented**: Three operations (`record_readability_gap`, `record_clarification`, `query_board_readability`) using `obscures`, `clarifies`, and `makes-readable` edge types. Readability gaps are normal gap nodes that appear in `queryIncomplete`. Clarifications are commentary nodes.

**Assessment: Preserved, with one tension.**

The implementation correctly separates readability from satisfaction. A green node can have an `obscures` edge (satisfied but unreadable). A red node can have a `makes-readable` edge (unsatisfied but readable). The mechanisms are independent.

**Tension**: The build_instructions for `op-record-readability-gap` prefix gap notes with `'Readability gap: '` -- a string convention rather than a structural distinction. This is a reference-expression choice. The grammar does not require readability gaps to be a separate node type; using regular gaps with edge-based discrimination (the `obscures` edge) is sufficient. But the string prefix is fragile -- a future builder might omit it and the gap would still function correctly via its `obscures` edge. The prefix is convenience, not structure. It should be documented as a reference-expression convention, not an invariant.

---

## 2. Projection and retro-projection as non-deterministic

**Grammar 14.3**: "Projection and retro-projection are both non-unique. One graph may produce many systems. One system may suggest many graphs."

**What was implemented**: `record_projection` and `record_retro_projection` as inscription operations. Retro-projections accept `confidence_notes` and can create inferred intents/gaps with `infers-*` edges. Multiple retro-projections from the same artifact are queryable together via `query_retro_projections`.

**Assessment: Preserved.**

The implementation does not force uniqueness. Multiple projections from the same board are allowed. Multiple retro-projections from the same artifact are allowed and queryable together. The `confidence_notes` field explicitly invites uncertainty. The `infers-*` edges (rather than `satisfies` or `creates`) correctly mark inferred nodes as situated readings, not authoritative extractions.

No mechanism forces a "winning" retro-projection. Competing readings coexist. This is correct.

---

## 3. Reverse engineering as situated retro-projection

**Grammar 14.2**: "Retro-projection is not extraction of the artifact's true meaning. A single artifact may support multiple retro-projected graphs."

**Grammar 14.8**: "Migration is therefore not direct translation... It is a graph-mediated transformation."

**What was implemented**: `record_retro_projection` accepts `source_artifact` (what is being read) and `board_id` (the board from which the reading is situated). Build_instructions explicitly state "Not extraction of one true graph."

**Assessment: Preserved.**

The tool documentation and build_instructions correctly frame retro-projection as situated reading. The `board_id` parameter on retro-projection anchors the reading to a board, not to a global view. The ability to create multiple retro-projections from the same source artifact, each with different inferred intents and gaps, directly preserves non-uniqueness.

**No residual gap here.** The CLAUDE.md already has the `old system -> retro-projected graph(s) -> selected board -> new system expression` pattern.

---

## 4. Graph portability without app cloning

**Grammar 14.9**: "Portability does not mean reproducing the same application. A portable intent graph may project different systems in different environments while preserving the governing intents, satisfaction conditions, board boundaries, and unresolved gaps."

**What was implemented**: `export_graph_package` exports nodes, edges, boards, edge_nodes, memberships as JSON. `import_graph_package` imports with merge strategies.

**Assessment: Preserved, with residual gaps.**

The export/import mechanism correctly packages graph structure, not application code. A graph package is a field of intents and relations from which new expressions can be projected -- not a clone of the source application.

**Residual gap 1**: The export format is specified as JSON but there is no schema version contract yet. The build_instructions mention `schema_version` in metadata but don't define what version checking means. A future expression must define versioning or risk silent incompatibility on import.

**Residual gap 2**: Cross-graph edges during partial export are not addressed. If a node in the exported graph has edges to nodes outside the graph, those edges will reference non-existent nodes in the target. The build_instructions don't specify how to handle dangling references. Options: include referenced external nodes, drop the edges, create placeholder gap nodes. This is a design decision that should be recorded when the operation is built.

**Residual gap 3**: The grammar says "projected expression" and "retro-projected reading" should be derivable conditions (section 31). The export package includes projection and retro-projection nodes if they exist in the graph, but there's no mechanism to verify that the imported package preserves these derived conditions correctly in the target.

---

## 5. Expression-layer openness

**Invariant 14**: "Technology choices, schemas, APIs, UI frameworks, storage substrates, protocols, model providers, agent frameworks, and build sequences are expressions, not invariants, unless explicitly marked otherwise."

**What was implemented**: All 6 phases are additive changes to PostgreSQL enums, SQL tables, and MCP tool documentation. No invariant was promoted to a technology requirement.

**Assessment: Preserved, with one tension.**

**Tension: PostgreSQL enums as vocabulary carriers.** The implementation added 4 node types and 20 edge types to PostgreSQL enums. PostgreSQL enums cannot have values removed (only added). This is a storage-substrate constraint bleeding into the grammar. The grammar says its vocabulary is "not a final ontology" and can be "refined, merged, split, or superseded." The enum implementation can add but not remove or rename. A future expression using a different substrate (or even lookup tables within PostgreSQL) would not have this constraint.

This is correctly an expression-layer choice, but it should be documented as such. The enum approach was chosen for simplicity in the current reference expression. It is not an invariant that vocabulary must be implemented as enums.

---

## 6. Boards as local fields of play

**Invariant 4**: "No one plays the whole graph."

**Invariant 5**: "Boards are bounded by what they cannot yet contain."

**What was implemented**: `node_board_memberships` table for many-to-many board participation. `query_board_readability` scoped to a board. All readability, projection, and retro-projection operations accept `board_id`.

**Assessment: Preserved, with one tension.**

The implementation correctly makes board participation many-to-many, allows board-scoped readability queries, and does not create a privileged whole-graph readability view.

**Tension: `queryIncomplete` still defaults to whole-graph.** The existing `queryIncomplete` operation (not modified in these commits) accepts an optional `board_id` but defaults to querying all nodes if no board is specified. The grammar says "no one plays the whole graph," but the primary "what's red" entry point defaults to exactly that. This is a pre-existing tension, not introduced by these commits, but it's worth noting: the default operating mode of the system's most-used query is a whole-graph view.

This is acceptable as a reference-expression convenience (the builder needs a quick way to see everything during bootstrap), but a conformant system should treat board-scoped queries as the primary mode and whole-graph queries as a diagnostic projection.

---

## Conformance checklist evaluation

Evaluating the 20 main questions from `docs/gdd-conformance-checklist.md` after the 6 phase commits:

| # | Question | Before | After | Notes |
|---|----------|--------|-------|-------|
| 1 | Shared graph inscription surface? | Yes | Yes | Unchanged |
| 2 | LLM-optimized with human projections? | Yes | Yes | Unchanged |
| 3 | Non-representational and incomplete? | Yes | Yes | Unchanged |
| 4 | Append-only topology? | Yes | Yes | Unchanged |
| 5 | Boards rather than whole-graph? | Partial | Better | Many-to-many participation added. Readability is board-scoped. queryIncomplete still defaults to whole-graph. |
| 6 | Board edges from incompleteness? | Yes | Yes | Unchanged |
| 7 | No predetermined granularity? | Partial | Partial | 21 implementation-specific node subtypes still impose some granularity. Documented as expression-layer choice. |
| 8 | Intent vs. task? | Yes | Yes | Unchanged |
| 9 | Tests for satisfaction? | Yes | Yes | Unchanged |
| 10 | Satisfaction vs. readability? | **No** | **Yes** | Readability operations, edge types, and board-scoped queries now exist. |
| 11 | Gaps and unreadability as non-failures? | Partial | **Yes** | Readability gaps are first-class. Commentary for clarification. |
| 12 | Agents as scoped actors? | Yes | Yes | Clarified agent vs. actor distinction. |
| 13 | Nonhuman actors graph-significant? | Partial | **Yes** | Actor node type and record_actor operation. |
| 14 | Projection without determinism? | N/A | **Yes** | Projection inscriptions exist. Multiple projections allowed. |
| 15 | Retro-projection without requirements extraction? | **No** | **Yes** | Retro-projection inscriptions with situated readings, competing graphs, confidence notes. |
| 16 | Multiple systems from one graph? | Not prevented | Supported | Projection and export mechanisms. |
| 17 | Multiple graphs from one system? | **No** | **Yes** | Multiple retro-projections from same artifact. |
| 18 | Portable graph package? | **No** | **Yes** | Export/import with merge strategies. |
| 19 | Value as board activity? | Yes | Yes | No global priority fields added. |
| 20 | Expression-layer choices open? | Yes | Yes | All changes documented as reference-expression choices. |

**Before these commits: 11 yes, 4 partial, 5 no.**

**After these commits: 17 yes, 2 partial, 1 was N/A now yes.**

The two remaining "partial" answers (5 and 7) are pre-existing conditions not introduced by these commits.

---

## Residual gaps

These are capabilities the grammar describes that are not yet fully expressed. They are not violations -- the grammar permits incremental expression.

### 1. Edge nodes remain in a separate table

Edge nodes (`gdd.edge_nodes`) are isolated from the main graph topology. The grammar treats edge nodes as inscriptions that participate in the graph alongside intents, expressions, and gaps. In the current expression, edge nodes don't have edges in `gdd.edges` connecting them to other graph nodes (they use `related_nodes` TEXT[] instead).

**Why this matters**: `marks-edge` is now an available edge type, but edge nodes can't use it because they're not in `gdd.nodes`. An edge node can't participate in a `tensions-with` edge, can't be the target of a `clarifies` edge, and can't be projected or retro-projected.

**Recommendation**: Record as a tension. A future phase could make edge nodes a subtype of graph node rather than a separate table, or add bridge edges connecting the two tables.

### 2. Event tables vs. graph topology

`gdd.expansion_events` and `gdd.conversion_events` record gap-to-edge and edge-to-gap transitions as separate event logs. The grammar says "the graph does not maintain a separate history layer -- it is its own history" (invariant 3).

These events should arguably be expressed as decision nodes with edges, not as separate tables. The current implementation functions correctly but carries a conceptual impurity.

**Recommendation**: Record as a reference-expression decision. The event tables are functionally adequate but conceptually non-conformant.

### 3. `queryIncomplete` default scope

As noted in section 6, the primary "what's red" query defaults to whole-graph scope. This is useful during bootstrap but conflicts with invariant 4 ("no one plays the whole graph").

**Recommendation**: Not a code change. A conformant builder should treat `queryIncomplete(board_id: ...)` as the normal mode and unscoped queries as diagnostic. The CLAUDE.md could note this.

### 4. `tested-by` relation not exercised

The `tested-by` edge type was added to the enum but no operation creates it. Tests remain embedded as fields on intent nodes (`test_condition`, `test_verification`). The grammar explicitly permits this: "A system may implement tests as separate nodes, fields on intent nodes, relations, executable checks, human judgments, or hybrid structures" (grammar section 5).

No gap here -- the grammar allows the current approach. But the `tested-by` edge type is available if a future builder wants separate test nodes.

### 5. No `signals` edge in practice

The `signals` edge type was added but no operation creates it. Signal nodes exist but don't have edges connecting them to what they affect. The grammar describes `signals` relations as how events enter the graph (section 29).

**Recommendation**: Record as a minor tension. Signal nodes work fine without explicit `signals` edges -- the content of the signal describes what it affects. But the edge type is available for builders who want structural signal-effect tracking.

---

## Reference-expression decisions (not invariants)

The following choices made in these commits are expression-layer decisions. They should not be treated as invariants by future builders:

1. **PostgreSQL enums for vocabulary** -- could be lookup tables, could be unconstrained text, could be a different substrate entirely
2. **String prefix `'Readability gap: '`** for readability gaps -- a convention, not a structural requirement
3. **`node_board_memberships` as a separate table** -- could be `participates-in` edges if boards were nodes in `gdd.nodes`
4. **`board_id` column retained as "primary board"** -- backward compatibility choice; a fresh expression could use only the membership table
5. **`artifacts` JSONB for actor metadata** -- storing actor_kind, scope, trust_level, mode in artifacts works but overloads the field; a dedicated table or structured fields would also work
6. **`comments-on` edge type** -- added as a relation kind not in the grammar's section 16 core list. The grammar's `clarifies` might suffice. `comments-on` was added because commentary that merely interprets (without making readable) needed a distinct relation from `clarifies`
7. **JSON as export package format** -- could be SQLite, CBOR, protobuf, or any serialization
8. **Import merge strategies** -- `create-new`, `skip-existing`, `error-on-conflict` are reference-expression choices; other strategies (prefix-namespace, interactive, graph-merge) would also be valid
9. **`op-record-clarification` creates both `clarifies` and `makes-readable` edges** -- the grammar distinguishes these; the implementation bundles them. A future expression might allow clarification without making-readable (commentary that explains but doesn't resolve)
10. **Layer 7 numbering** -- the new operations were placed in "Layer 7: Grammar conformance." This is a reference-expression organizational choice. The grammar does not define layers.
