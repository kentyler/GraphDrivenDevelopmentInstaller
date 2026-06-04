# Graph-Driven Development Installer

GDD-install is not a finished application. It is an instruction set for producing graph-driven development systems.

The project begins with **invariants**, not code. The invariants define the possibility space. The logical graph grammar translates those invariants into a graph vocabulary. Concrete implementations are **reference expressions**: historical productions that preserve the invariants under particular technology choices.

The current bootstrap builds one reference expression: a PostgreSQL + Node/Express + MCP-oriented graph system. That current expression is useful and concrete, but it is not the constitutional form of GDD.

## Core claim

Intent graphs represent the field of work in a form LLMs can reason over.

A task says what to do. An intent says what must become true. An expression is an artifact that satisfies an intent's test. Boards make limited fields of play. Edges appear where a board encounters what it cannot yet contain.

The graph is the portable form. The application is one expression.

Intent graphs make applications portable across technologies, organizations, and LLM generations.

## Document hierarchy

Read the documents in this order:

```text
docs/gdd-invariants.md                 Constitutional layer: what must remain true
docs/gdd-logical-graph-grammar.md      Grammar layer: graph vocabulary and relations
docs/gdd-conformance-checklist.md      Evaluation checklist for candidate expressions
INTRODUCTION.md                        Conceptual introduction
CLAUDE.md                              Build/session instructions for Claude Code and similar tools
skills/                                Reference skill files for the current expression
bootstrap/                             Current PostgreSQL/Node bootstrap reference expression
```

## What this is

GDD is a way to build and use systems through an intent graph.

The graph is:

- shared ground for humans, LLMs, agents, software systems, tests, and external forces
- optimized internally for LLM reading and writing
- projected outward into human-usable forms such as task lists, dashboards, diagrams, and narratives
- append-only, with change represented through supersession, refinement, satisfaction, closure, contradiction, tension, decisions, signals, gaps, and edge nodes
- board-relative: no one plays the whole graph
- non-representational: the graph participates in the work rather than representing the whole situation

## Projection and retro-projection

A graph can make a system; a system can suggest many graphs.

A graph may project more than one faithful system. A working system may be retro-projected into more than one possible graph. Migration and modernization therefore should not be treated as direct translation:

```text
old system → new system
```

Instead, they should be treated as graph-mediated transformation:

```text
old system → retro-projected graph(s) → selected board → new system expression
```

Reverse engineering an existing system or application means producing one or more situated intent-graph readings from its working artifacts: code, schema, forms, reports, workflows, permissions, user habits, and operational conventions. It is not extraction of one true requirements graph.

## What's in the folder

```text
INTRODUCTION.md                  Conceptual introduction
CLAUDE.md                        Entry point for Claude Code and other LLM coding tools
docs/
  gdd-invariants.md              Constitutional invariants
  gdd-logical-graph-grammar.md   Second-layer graph grammar
  gdd-conformance-checklist.md   Checklist for evaluating candidate systems
  gdd-install-catch-up-notes.md  Notes describing the current conceptual catch-up
bootstrap/
  run.js                         Current reference-expression bootstrap
  db.js                          Database connection (reads GDD_DB_* env vars)
  package.json                   Dependencies (pg)
  001-enums.sql                  Current reference-expression enums
  002-tables.sql                 Current reference-expression tables
  003-bootstrap.sql              Root intent (gdd-root)
  004-populate-graph.js          Current Layer 0-6 intents with build_instructions
  005-edge-boards-enums.sql      Board/edge-node enums
  006-edge-boards-tables.sql     Board/edge-node tables
  009-populate-edge-boards.js    Edge/board intents with build_instructions
  014-create-system-graph.js     Creates gdd-system graph with memberships
  015-peer-messages.sql          Peer messaging tables
  016-populate-peer-messaging.js Peer messaging intents
skills/
  foundations.md                 Why the current expression is shaped this way
  intent-graph.md                Current technical vocabulary and conventions
  intent-graph-layers.md         Layer-by-layer intent definitions
  system-origins.md              Layer -1 — founding decisions
  agents.md                      Agent definitions — scope, trust, triggers
  graph-completeness.md          Red/green completeness model
  graph-merge.md                 Cross-graph collaboration
  mcp-server.md                  MCP server tool definitions
  ui-client.md                   UI client surfaces as external MCP clients
  session-continuity.md          Session bookmarks and recovery
  community.md                   Optional build reports to GitHub Discussions
```

## Getting started with the current reference expression

1. Clone this repo.
2. Read `docs/gdd-invariants.md`.
3. Read `docs/gdd-logical-graph-grammar.md`.
4. Read `CLAUDE.md`.
5. Install PostgreSQL and Node.js if not already present.
6. Run the bootstrap:

```bash
cd bootstrap
npm install
GDD_DB_PASSWORD=yourpassword node run.js
```

For non-interactive use, set:

```text
GDD_DB_NAME
GDD_SCHEMA_NAME
GDD_BUILD_DIR
```

Database and schema names may only contain letters, digits, and underscores, and must start with a letter or underscore (e.g. `my_project`, not `my-project`).

The bootstrap creates the database, schema, enums, tables, root intent, current self-hosting intents, the `gdd-system` graph, and the build folder.

## Important distinction

Do not treat PostgreSQL, Node, Express, MCP, the current schema, or the current bootstrap order as invariants.

They are expression-layer choices in the current reference expression. A future LLM-human situation may produce a different graph-driven system if it preserves the invariants and can explain its departures from prior expressions.

## Requirements for the current reference expression

- PostgreSQL
- Node.js
- A frontier LLM capable of reading instructions and writing code

These requirements apply to the current reference expression, not to all possible GDD systems.

## Community feedback

The [Discussions](https://github.com/kentyler/GraphDrivenDevelopmentInstaller/discussions) page collects build reports from different models and environments. If you run a build, consider posting what worked and where the instructions were unclear.

Gap nodes — places where the skill files were not precise enough — are especially valuable.

See `skills/community.md` for optional automated reporting.

## License

MIT
