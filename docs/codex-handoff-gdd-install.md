# Codex Handoff: GDD-install Technical Catch-up

## Purpose

This document is a handoff for Codex or another repo-native coding agent.

The repository may or may not already contain the new conceptual documents. If the repo is based on the updated zip produced in ChatGPT, those files should already exist. If the repo is the original local repository, they probably do not exist yet.

The current GDD framing is:

```text
invariants → logical graph grammar → reference expressions → implementation
```

Codex should not treat the current implementation as canonical. The current implementation is a reference expression: a historical, concrete production that may need to be revised so it can express the newer conceptual layer.

The immediate goal is not to rewrite the system. The immediate goal is to ensure the conceptual documents exist, audit the implementation against them, and only then propose the smallest safe technical changes needed to support the new grammar.

---

# 0. Preflight: verify or create required documents

Before auditing or changing implementation files, Codex must check whether these files exist:

```text
docs/gdd-invariants.md
docs/gdd-logical-graph-grammar.md
docs/gdd-conformance-checklist.md
docs/gdd-install-catch-up-notes.md
```

If they exist, read them first.

If they do not exist, Codex should not proceed with the implementation audit yet. First add them from the provided handoff materials or from the updated repository zip.

If the user has only this handoff file and not the updated zip, ask for the missing document contents or ask the user to provide the updated zip before proceeding.

Do not invent shortened placeholder versions of these documents. The audit depends on the full versions.

---

# 1. Read these files first

Once the required docs exist, Codex should read, in order:

```text
docs/gdd-invariants.md
docs/gdd-logical-graph-grammar.md
docs/gdd-conformance-checklist.md
docs/gdd-install-catch-up-notes.md
README.md
INTRODUCTION.md
CLAUDE.md
```

Then inspect the implementation files.

Do not begin by editing schema, MCP tools, or bootstrap scripts before reading the conceptual documents.

---

# 2. Governing hierarchy

When files conflict, use this hierarchy:

```text
1. gdd-invariants.md
2. gdd-logical-graph-grammar.md
3. gdd-conformance-checklist.md
4. README / INTRODUCTION / CLAUDE
5. existing implementation files
```

The implementation is allowed to lag the documents.

Do not silently resolve conceptual conflicts by changing implementation details. First identify the conflict as a gap, tension, or required refinement.

---

# 3. Core conceptual changes Codex must preserve

Codex must preserve these ideas:

```text
The graph is common ground, written in the native language of LLMs.
The graph is an agencement, not a representation.
No one plays the whole graph.
Boards are bounded by what they cannot yet contain.
Granularity is discovered, not imposed.
A stone becomes readable on the board.
Intent is not task.
Nothing turns green without a test.
Agents are players, not owners.
Value is played, not possessed.
The invariant binds; the expression is free.
A graph can make a system; a system can suggest many graphs.
The graph is the zip file; the application is one decompression.
Intent graphs make applications portable across technologies, organizations, and LLM generations.
```

---

# 4. Immediate task: audit before implementation

Codex’s first task is an audit, not a rewrite.

Produce a report named:

```text
docs/implementation-audit-against-grammar.md
```

The report should answer:

1. Which current tables, enums, scripts, and MCP tools already support the grammar?
2. Which grammar concepts are partially supported?
3. Which grammar concepts are missing?
4. Which missing concepts can be expressed with existing generic nodes and edges?
5. Which missing concepts require schema changes?
6. Which concepts require MCP tool changes?
7. Which concepts require bootstrap changes?
8. Which changes should be deferred until a reference expression is intentionally redesigned?

---

# 5. Concepts to audit specifically

Audit support for:

```text
Intent
Expression
Test
Gap
Decision
Signal
Board
Edge Node
Axiom
Actor
Projection
Retro-projection
Commentary
Artifact reference
Readability
Supersession
Board-relative projection
Artifact-to-graph reverse engineering
Graph-to-system projection
Portable graph package export/import
Multiple systems from one graph
Multiple graphs from one system
```

---

# 6. Database schema audit

Inspect the current database/schema files.

Determine whether the current schema supports these as first-class or derivable concepts:

```text
projection
retro-projection
artifact
commentary
test
actor
readability relation
source artifact metadata
projection purpose
retro-projection purpose
board-relative projection records
competing retro-projections from the same artifact
portable graph package export/import metadata
```

## Important caution

Do not immediately create specialized tables for every concept.

First decide whether the generic graph substrate can express the concept using:

```text
nodes
edges
node types
edge types
boards
edge nodes
artifacts / metadata fields
```

Only add specialized tables when the generic substrate clearly becomes insufficient.

---

# 7. Enum / lookup-table decision

If the current implementation uses PostgreSQL enums for node and edge types, Codex should evaluate whether that remains appropriate.

The grammar may require evolving node and edge vocabularies. PostgreSQL enums can be awkward to revise repeatedly.

Codex should consider whether node and edge types should remain enums or become lookup tables.

Do not refactor enums into lookup tables automatically. First produce a recommendation with tradeoffs.

---

# 8. Likely schema changes to consider

Potential node kinds:

```text
intent
expression
test
gap
decision
signal
board
edge-node
axiom
actor
projection
retro-projection
artifact
commentary
```

Potential edge/relation kinds:

```text
satisfies
tested-by
blocked-by
depends-on
contains
participates-in
refines
supersedes
closes
tensions-with
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
```

These are logical grammar terms, not necessarily required enum values. Codex should decide whether to implement them as:

```text
enum values
lookup rows
relation records
derived relations
metadata
tool-level conventions
```

---

# 9. MCP tool audit

Inspect current MCP tools and handlers.

Determine whether existing tools can support:

```text
create intent
create expression
create test
create gap
create decision
create signal
create board
create edge node
create projection
create retro-projection
record readability issue
record clarification
query board
query board readability
query red/workable intents
query projections
query retro-projections
reverse-engineer artifact into candidate graph
compare retro-projections
export portable graph package
import portable graph package
```

Do not implement all tools at once.

Recommend a minimal first set.

Likely first additions:

```text
recordProjection
queryProjections
recordRetroProjection
queryRetroProjections
recordReadabilityGap
queryBoardReadability
```

---

# 10. Bootstrap script audit

Inspect bootstrap/populate scripts.

Determine whether the current bootstrap seeds or expresses the following conceptual layer:

```text
readability is board-relative and retroactive
projection and retro-projection
graph portability
reverse engineering existing systems and applications
reference expressions are moves, not the game
the current implementation is a reference expression
```

Codex should recommend whether these should be seeded as nodes, docs, tests, comments, or not seeded at all.

Important: the invariants exist conceptually before the graph. Do not automatically inscribe them as an axiom board unless explicitly instructed.

---

# 11. Implementation sequence after audit

After the audit, Codex should propose an implementation plan in phases.

Recommended phases:

```text
Phase 1: vocabulary support
Phase 2: projection / retro-projection records
Phase 3: readability support
Phase 4: MCP tools for projection and retro-projection
Phase 5: bootstrap updates
Phase 6: export/import portable graph package
```

Each phase should include:

```text
files to change
schema changes
tool changes
test changes
rollback risks
open questions
```

---

# 12. Minimal first implementation target

If asked to implement after the audit, Codex should prefer the smallest useful target:

```text
Add support for projection, retro-projection, and readability using the existing generic graph model where possible.
```

Avoid large rewrites.

A minimal target might include:

```text
1. Extend node/edge vocabulary or lookup rows.
2. Add helper operations for projection and retro-projection nodes.
3. Add helper operations for readability gaps or readability relations.
4. Add tests showing:
   - one graph can project multiple systems
   - one system can retro-project multiple graphs
   - readability is distinct from satisfaction
   - retro-projection is not requirements extraction
```

---

# 13. Tests Codex should add or update

Add tests for:

```text
Satisfied but unreadable node
Unsatisfied but readable node
Untested but readable node
One artifact retro-projected into two different graph readings
One board projected into two different system expressions
Retro-projection preserving uncertainty as gaps
Projection preserving edge nodes rather than collapsing them
Supersession preserving old inscriptions
```

Tests may be unit tests, integration tests, or documented conformance examples, depending on current repo structure.

---

# 14. Explicit reverse-engineering requirement

GDD should support reverse-engineering existing systems and applications.

The required concept is:

```text
existing artifacts → retro-projected graph(s) → selected board → new expression
```

Reverse engineering should read:

```text
code
schema
forms
reports
queries
workflows
permissions
configuration
user habits
operational conventions
documentation
```

into possible graph inscriptions:

```text
intents
tests
expressions
gaps
decisions
actors
signals
boards
edge nodes
constraints
```

Reverse engineering must not assume that one existing application contains one true recoverable requirements graph.

---

# 15. Portable graph package requirement

GDD should eventually support a portable graph package.

The package should be able to carry:

```text
boards
intents
tests
expressions
gaps
decisions
signals
actors
edge nodes
projection records
retro-projection records
artifact references
supersession relations
readability relations or readability gaps
```

This supports the claim:

```text
Intent graphs make applications portable across technologies, organizations, and LLM generations.
```

Do not implement export/import until projection and retro-projection are represented clearly.

---

# 16. Safety instructions for Codex

Do not:

```text
rewrite the whole schema first
collapse grammar concepts into a task list
treat the current implementation as canonical
turn reference expressions into invariants
represent the whole graph as one view
make value a global required field
make status fields the source of truth
replace append-only topology with mutation
turn retro-projection into requirements extraction
turn portability into reproduction of the same app
```

Do:

```text
audit first
make minimal changes
preserve append-only semantics
derive red/green from satisfaction topology
derive current/superseded from supersession topology
keep boards as local fields of play
preserve edge nodes as incompleteness boundaries
record uncertainty as gaps
treat agents as scoped actors
treat projections as views, not source of truth
```

---

# 17. Deliverables from first Codex run

The first Codex run should produce:

```text
docs/implementation-audit-against-grammar.md
docs/proposed-implementation-plan.md
```

Optionally, it may also produce:

```text
docs/schema-change-proposal.md
docs/mcp-tool-change-proposal.md
docs/bootstrap-change-proposal.md
```

Do not require code changes in the first run unless the audit reveals a trivial documentation-only fix.

---

# 18. Recommended first Codex prompt

Use this prompt when switching to Codex:

```text
You are working in the GDD-install repository.

First check whether these files exist:
- docs/gdd-invariants.md
- docs/gdd-logical-graph-grammar.md
- docs/gdd-conformance-checklist.md
- docs/gdd-install-catch-up-notes.md

If they do not exist, stop and report that the conceptual documents must be added before the implementation audit. Do not invent placeholder versions.

If they do exist, read them first, followed by README.md, INTRODUCTION.md, and CLAUDE.md.

Do not begin by rewriting schema or tools.

Audit the current implementation against the invariants and logical graph grammar. Produce docs/implementation-audit-against-grammar.md and docs/proposed-implementation-plan.md.

Pay special attention to readability, projection, retro-projection, reverse-engineering existing applications into possible intent graphs, and portable graph packages.

Treat the current implementation as a reference expression, not as canonical GDD. Identify the smallest safe technical changes needed before any larger refactor.
```

---

# 19. Notes on tool choice

This task is appropriate for Codex or Claude Code because it requires repository-native work: inspecting many files, updating schema and scripts, running tests, and iterating on failures.

Use official tooling only. Avoid unofficial packages, extensions, or apps that claim to provide Codex access.
