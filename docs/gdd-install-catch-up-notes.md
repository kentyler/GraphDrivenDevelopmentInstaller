# GDD-install Catch-up Notes for Claude Code

## Purpose

This file lists the changes needed to bring the current `GDD-install` materials into alignment with the conceptual work developed today.

The goal is **not** to turn GDD-install into a finished application. The goal is to reposition it as a set of instructions, constitutional invariants, grammar documents, and reference expressions that a future LLM-human situation can use to produce one or more graph-driven systems.

The major conceptual shift is:

```text
application/specification → invariants → logical graph grammar → reference expressions
```

The current install files should be treated as a historical reference expression, not as the canonical form of GDD.

---

# 1. Add new document: `gdd-invariants.md`

## Action

Add the revised invariants document as a first-layer constitutional file.

Suggested location:

```text
docs/gdd-invariants.md
```

or, if the repository is organized around top-level instruction files:

```text
gdd-invariants.md
```

## Purpose

This document defines the constitutional constraints of GDD. It should be treated as conceptually prior to any particular graph implementation.

The invariants are not an app spec, database schema, or complete ontology. They define a possibility space in which many concrete GDD systems may be expressed.

## Required emphasis

Make sure the document includes the following current invariants:

1. The graph is shared ground, written for LLMs.
2. The graph is an agencement, not a representation.
3. The graph is append-only present topology.
4. No one plays the whole graph.
5. Boards are bounded by incompleteness.
6. Granularity is discovered, not imposed.
7. One inscription, many readings.
8. Intent is not task.
9. Tests make satisfaction legible.
10. Readability is board-relative and retroactive.
11. Agents are players, not owners.
12. The field has many kinds of actors.
13. Value is a board activity, not a graph property.
14. The invariant binds; the expression is free.
15. The invariants define the play, not the playbook.

## Important wording to preserve

The invariants exist conceptually before any particular graph comes into existence. They are not themselves required to be inscribed as an axiom board in the first graph they help produce.

Include the short addition to invariant #15:

```text
Because expressions are not determined by the invariants, one graph may project multiple faithful systems. Because artifacts are not complete representations of their originating situation, one working system may support multiple retro-projected graphs. Reference expressions, migrations, and reverse-engineered intent graphs should therefore be treated as situated readings, not canonical translations.
```

---

# 2. Add new document: `gdd-logical-graph-grammar.md`

## Action

Add the logical graph grammar as a second-layer document.

Suggested location:

```text
docs/gdd-logical-graph-grammar.md
```

or:

```text
gdd-logical-graph-grammar.md
```

## Purpose

This document translates the invariants into a logical graph vocabulary without choosing a storage substrate, database schema, UI framework, protocol, or runtime.

It is **not** the constitution and **not** a database schema.

It is a bridge:

```text
invariants → logical graph grammar → storage evaluation → concrete schema → reference expression
```

## Required sections

The grammar should include at least:

1. Foundational distinction
2. Inscription
3. Intent
4. Expression
5. Test
6. Gap
7. Decision
8. Signal
9. Board
10. Edge Node
11. Axiom
12. Actor
13. Projection
14. Projection and retro-projection
15. Commentary
16. Core relation types
17. Satisfaction relations
18. Test relations
19. Dependency relations
20. Composition and participation relations
21. Refinement relations
22. Supersession relations
23. Closure relations
24. Tension and contradiction relations
25. Readability relations
26. Edge relations
27. Projection relations
28. Retro-projection relations
29. Signal relations
30. Authorization relations
31. Derived conditions
32. Forbidden reductions
33. Minimal conformance questions
34. Relationship to implementation

## Especially important new section

Make sure the grammar includes:

```text
14. Projection and retro-projection
```

with the human-readable line:

```text
A graph can make a system; a system can suggest many graphs.
```

This section should define:

```text
graph → possible systems
system → possible graphs
```

and make clear that neither direction is unique.

## Portability section

Add the current portability idea as section 14.9:

```text
14.9 Portability: intent graph as compressed application form
```

with the human-readable line:

```text
The graph is the zip file; the application is one decompression.
```

This section should state:

```text
Intent graphs make applications portable across technologies, organizations, and LLM generations.
```

and explicitly include reverse engineering:

```text
A retro-projected intent graph can be produced by reverse-engineering an existing system or application. This is not extraction of a single true requirements graph. It is a situated graph reading of the artifacts from a particular board.
```

---

# 3. Update `README.md`

## Action

Revise the README so it no longer presents GDD-install primarily as an application installer or fixed build spec.

## New framing

The README should explain that GDD-install contains:

```text
1. Constitutional invariants
2. A logical graph grammar
3. Current install/build instructions
4. Reference expressions
5. Possible future local implementations
```

## Suggested language

```markdown
GDD-install is not a finished application. It is an instruction set for producing graph-driven development systems.

The project begins with invariants, not code. The invariants define the possibility space. The logical graph grammar translates those invariants into a graph vocabulary. Concrete implementations are reference expressions: historical productions that preserve the invariants under particular technology choices.
```

## Avoid

Avoid language that implies:

```text
This repository is the GDD system.
This schema is the canonical graph.
This installer is the required implementation.
This application is the product.
```

## Prefer

Use language like:

```text
reference expression
current expression
one implementation path
current install target
expression-layer choice
future LLM-human production
```

---

# 4. Update `INTRODUCTION.md`

## Action

Revise the conceptual introduction to include the current core claims.

## Add or emphasize

### Graph as shared LLM-oriented substrate

```text
The graph is common ground, written in the native language of LLMs.
```

Explain that human views are projections, not the source of truth.

### Graph as agencement

```text
The graph is not a representation of the work; it is an agencement through which the work becomes locally reason-able.
```

The graph is an artifact inside the situation, not a model standing outside it.

### No whole graph

```text
No one plays the whole graph.
```

The graph may accumulate globally, but reasoning occurs through boards.

### Boards and edges

```text
Boards are bounded by what they cannot yet contain.
```

A board’s edge is discovered through incompleteness.

### Readability

Add the Go-theoretic readability claim:

```text
A stone becomes readable on the board.
```

Readability is distinct from satisfaction. A node may be green but unreadable, red but readable, untested but readable, or unreadable until later play makes its role clear.

### Projection and retro-projection

Add:

```text
A graph can make a system; a system can suggest many graphs.
```

A graph can project multiple systems. A working system can be retro-projected into multiple possible graphs.

### Portability

Add:

```text
Intent graphs make applications portable across technologies, organizations, and LLM generations.
```

and:

```text
The graph is the zip file; the application is one decompression.
```

---

# 5. Update `CLAUDE.md`

## Action

Update the Claude Code instructions so Claude treats the invariants and grammar as the governing documents.

## Required instruction changes

Add a hierarchy:

```text
1. Follow gdd-invariants.md first.
2. Use gdd-logical-graph-grammar.md as the bridge from invariants to implementation.
3. Treat existing install/build files as a reference expression.
4. Treat PostgreSQL, Node, Express, MCP, specific schema tables, and current scripts as expression-layer choices unless explicitly marked otherwise.
```

## Add warning

```markdown
Do not treat the current implementation as canonical. If a current file conflicts with the invariants, preserve the invariant and record the conflict as a gap, decision, or proposed supersession.
```

## Add build guidance

Claude Code should begin future implementation work by asking:

```text
Am I preserving an invariant, implementing the grammar, or copying a reference expression?
```

## Add migration guidance

For legacy systems:

```text
Do not translate old application directly into new application. First retro-project one or more possible intent graphs from the working artifacts. Then choose or refine the board that will govern the new expression.
```

---

# 6. Update existing `foundations.md` or equivalent

## Action

Revise any foundational file that currently over-identifies GDD with a specific database, schema, or application structure.

## Required conceptual corrections

### Replace “the system is the app” with “the app is an expression”

Add:

```text
The application is one expression of the graph. The graph is the portable form.
```

### Replace “history as log” with “history as topology”

Keep append-only, but avoid reducing it to event sourcing.

Use:

```text
The graph is its own history. What is current is derived from topology, especially supersession, closure, satisfaction, and replacement relations.
```

### Add readability

```text
Meaning is board-relative and retroactive. A node’s meaning is determined by the board on which it is played and by later inscriptions that make its role readable.
```

### Add no whole graph

```text
The system may store global inscriptions, but reasoning occurs through boards. There is no privileged whole-graph view.
```

---

# 7. Update board / edge-node documentation

## Action

Strengthen the board and edge-node model.

## Required concepts

A board is not:

```text
project
category
container
department
whole graph slice
```

A board is:

```text
a limited field of play
a situated arrangement of inscriptions
a local reasoning surface
```

An edge node is not merely:

```text
unresolved task
external item
miscellaneous gap
```

An edge node is:

```text
where a board discovers something that matters but cannot yet be contained, resolved, or expressed inside the board
```

Add:

```text
Some gaps become work inside a board. Other gaps become edge nodes.
```

Add:

```text
Boards mean the whole graph cannot be represented. There may be a total database, but there is no total board.
```

---

# 8. Update agent documentation

## Action

Revise agent language to match today’s actor model.

## Required concept

LLM agents are graph actors, not the center of the system.

Add:

```text
Agents are players, not owners.
```

An agent should be defined by:

```text
scope
trust
mode
projection contract
write contract
verification relation
```

Avoid implying:

```text
agent owns workflow
agent plan is source of truth
agent memory is source of truth
agent framework is canonical
```

Add:

```text
An agent’s private memory, plan, scratchpad, chain of thought, or tool execution state is not the source of truth. What matters constitutionally is what the agent inscribes.
```

---

# 9. Update projection documentation

## Action

Create or revise projection documentation to distinguish:

```text
projection
retro-projection
human projection
LLM projection
system expression
```

## Required distinctions

### Projection

```text
graph or board → expression / artifact / system / view
```

### Retro-projection

```text
artifact / system → possible graph reading
```

### Human projection

```text
graph → task list / dashboard / narrative / report / diagram
```

### LLM projection

```text
graph → dense structured context for reasoning and writing
```

## Required warning

```text
Projection is not deterministic. Retro-projection is not extraction of a true requirements graph.
```

---

# 10. Update migration / reverse-engineering documentation

## Action

If the install files include migration language, update it to use the new graph-mediated migration model.

## Required model

Replace:

```text
old system → new system
```

with:

```text
old system → retro-projected graph(s) → selected board → new system expression
```

## Add explicit reverse-engineering language

```text
GDD can reverse-engineer existing systems and applications by retro-projecting one or more possible intent graphs from their working artifacts: code, schema, forms, reports, workflows, permissions, user habits, and operational conventions.
```

## Add warning

```text
Reverse engineering is not extraction of one true graph. It is production of situated graph readings that can be compared, contested, refined, or superseded.
```

---

# 11. Update schema / implementation files only after documents are aligned

## Action

Do not immediately rewrite the database schema or MCP tools based only on the new invariants.

First align the documents.

Then evaluate current implementation against the grammar.

## Evaluation questions

Ask whether the current implementation supports:

```text
inscriptions
boards
edge nodes
intents
expressions
tests
gaps
decisions
signals
actors
projections
retro-projections
readability
supersession
projection-to-system
artifact-to-graph retro-projection
```

## Likely future implementation additions

The current schema may need future support for:

```text
retro_projection inscriptions
projection inscriptions
readability relations
artifact references
source artifact metadata
projection purpose
board-relative projection records
competing retro-projections from same artifact
portable graph package export/import
```

Do not add these blindly. First check the current schema and determine whether existing nodes/edges can express them without new tables.

---

# 12. Add conformance checklist

## Action

Create a short checklist file or README section.

Suggested file:

```text
docs/gdd-conformance-checklist.md
```

## Include questions

1. Does the system preserve a shared graph-like inscription surface rather than reducing work to a task list?
2. Does it optimize internal structure for LLM reasoning while projecting human-usable views?
3. Does it treat the graph as non-representational and incomplete?
4. Does it preserve append-only topology through supersession and explicit change?
5. Does it reason through boards rather than a privileged whole-graph view?
6. Does it allow board edges to emerge from incompleteness?
7. Does it avoid predetermined levels of granularity?
8. Does it distinguish intents from tasks?
9. Does it require tests or evaluable conditions for satisfaction?
10. Does it distinguish satisfaction from readability?
11. Does it treat agents as scoped actors rather than workflow owners?
12. Does it support projection and retro-projection?
13. Does it allow multiple systems to express the same graph?
14. Does it allow multiple graphs to read the same system?
15. Does it treat the graph as the portable form and the application as one expression?
16. Does it leave expression-layer choices open?

---

# 13. Suggested repository structure

This is not mandatory, but it is the recommended organization after catch-up.

```text
GDD-install/
  README.md
  CLAUDE.md
  INTRODUCTION.md

  docs/
    gdd-invariants.md
    gdd-logical-graph-grammar.md
    gdd-conformance-checklist.md
    projection-and-retro-projection.md
    boards-and-edges.md
    agents-as-actors.md
    reference-expressions.md

  reference-expressions/
    current-postgres-mcp/
      existing install/build files
    minimal-local/
      future optional reference
    distributed-peer/
      future optional reference
```

The current install files should eventually move conceptually, and perhaps physically, under:

```text
reference-expressions/current-postgres-mcp/
```

Do not do this move automatically if it will break scripts. First document the conceptual distinction.

---

# 14. Immediate Claude Code task order

## Recommended order

1. Add `docs/gdd-invariants.md`.
2. Add `docs/gdd-logical-graph-grammar.md`.
3. Update `README.md` to explain the new document hierarchy.
4. Update `CLAUDE.md` to instruct future Claude Code sessions to follow invariants first, grammar second, current implementation third.
5. Update `INTRODUCTION.md` to include:
   - graph as agencement
   - no whole graph
   - boards bounded by incompleteness
   - readability
   - projection / retro-projection
   - portability
6. Add `docs/gdd-conformance-checklist.md`.
7. Review existing implementation docs for conflicts with invariants.
8. Only after documentation alignment, evaluate schema and tool changes.

## Do not start with

```text
database schema rewrite
MCP tool rewrite
moving files
renaming tables
new implementation features
```

until the conceptual documents have been added and the current implementation has been assessed as a reference expression.

---

# 15. Key phrases to preserve

Use these phrases consistently:

```text
The graph is common ground, written in the native language of LLMs.
The graph is an agencement, not a representation.
No one plays the whole graph.
Boards are bounded by what they cannot yet contain.
Granularity is discovered, not imposed.
A stone becomes readable on the board.
A task says what to do; an intent says what must become true.
Nothing turns green without a test.
Agents are players, not owners.
Value is played, not possessed.
The invariant binds; the expression is free.
The invariants define the play, not the playbook.
A graph can make a system; a system can suggest many graphs.
The graph is the zip file; the application is one decompression.
Intent graphs make applications portable across technologies, organizations, and LLM generations.
```

---

# 16. Final instruction to Claude Code

Do not treat this catch-up file as a command to implement all features.

Treat it as a document alignment task first.

The repository should be brought into conceptual consistency before implementation changes are made.

When in doubt, preserve the invariants, keep implementation choices demoted to expression-layer status, and record unresolved issues as gaps rather than forcing premature closure.
