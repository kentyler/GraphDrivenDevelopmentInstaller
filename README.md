# Graph-Driven Development

A set of skill files that teach a frontier LLM to build a graph-driven development system. You download the folder, point your LLM at it, and it builds the system from the instructions.

## What this is

The intent graph is a development system where every piece of work — what needs to exist, what depends on what, what "done" looks like, and what was produced — is represented as a testable node in a dependency graph. It applies TDD at the architecture level: intents have test conditions, expressions satisfy them, and "what to do next" is always "what's red."

The system supports multiple actor types — humans, LLM agents, application users, external forces — all running the same loop through the same graph. Agents are first-class graph entities with scoped jurisdiction, trust-bounded write permissions, and auditable sessions.

## What's in the folder

```
INTRODUCTION.md                  Philosophical introduction — what intent graphs are and why
CLAUDE.md                        Entry point — read this first
bootstrap/
  run.js                         Single entry point — runs everything below in order
  db.js                          Database connection (reads GDD_DB_* env vars)
  package.json                   Dependencies (pg)
  001-enums.sql                  Node type, edge type, agent trust/status enums
  002-tables.sql                 Core tables: nodes, edges, graphs, memberships, agents, skills, providers
  003-bootstrap.sql              Root intent (gdd-root)
  005-edge-boards-enums.sql      Board/edge-node enums
  006-edge-boards-tables.sql     Board/edge-node tables
  004-populate-graph.js          All Layer 0-6 intents with build_instructions (~50 nodes, ~90 edges)
  009-populate-edge-boards.js    Edge/board intents with build_instructions (~14 nodes)
  014-create-system-graph.js     Creates gdd-system graph with memberships for all 65 system intents
skills/
  foundations.md                 Why the system is shaped this way
  intent-graph.md                The technical spec — node model, edge types, conventions
  intent-graph-layers.md         Layer-by-layer intent definitions (Layers 0-6)
  system-origins.md              Layer -1 — founding decisions as already-green graph citizens
  agents.md                      Agent definitions — scope, trust, triggers
  graph-completeness.md          The completeness model — red/green, no tension scores
  graph-merge.md                 Cross-graph collaboration
  mcp-server.md                  MCP server — tool definitions, connector setup
  ui-client.md                   UI client — user-facing surfaces as external MCP clients
  session-continuity.md          Session bookmarks — per-actor context recovery, team views
  community.md                   Optional — post build reports to GitHub Discussions
```

## Getting started

1. Clone this repo
2. Install PostgreSQL and Node.js if not already present
3. Run the bootstrap: `cd bootstrap && npm install && GDD_DB_PASSWORD=yourpassword node run.js`
   - You'll be prompted for database name, schema name, and build folder (defaults: `gdd`, `gdd`, `../GDD`)
   - The bootstrap creates the database, schema, tables, and populates the intent graph
   - For non-interactive use, set env vars: `GDD_DB_NAME`, `GDD_SCHEMA_NAME`, `GDD_BUILD_DIR`
4. Open the repo in your LLM tool of choice (Claude Code, Cursor, Windsurf, etc.)
5. The LLM reads `CLAUDE.md`, queries the graph (`queryIncomplete(graph_id: 'gdd-system', workable: true)`), reads each intent's `build_instructions`, builds it in the build folder, records an expression, and repeats until all intents are green
6. User-facing surfaces (natural language intake, application UIs) are built separately as MCP clients — see `skills/ui-client.md`

The `bootstrap/` directory contains the founding scripts — schema, enums, tables, and all intent definitions with actionable `build_instructions`. After bootstrap, the graph is the source of build instructions. The skill files in `skills/` are reference material (vocabulary, conventions, design philosophy). The LLM reads from here but builds in a separate directory created by the bootstrap.

## Requirements

- PostgreSQL (the graph stores all state in PostgreSQL)
- Node.js (the system is built in JavaScript with Express)
- A frontier LLM capable of reading instructions and writing code

## Community feedback

The [Discussions](https://github.com/kentyler/GraphDrivenDevelopmentInstaller/discussions) page collects build reports from different models and environments. If you run a build, consider posting what worked and where the instructions were unclear. Gap nodes — places where the skill files weren't precise enough — are especially valuable.

See `skills/community.md` for optional automated reporting.

## License

MIT
