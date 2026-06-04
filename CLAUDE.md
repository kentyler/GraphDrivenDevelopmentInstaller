# GDD

Graph-Driven Development.

The intent graph is the source of truth for a graph-driven system, but this repository is not itself the canonical GDD application. This repository contains instructions, constitutional documents, grammar documents, and a current reference expression.

## Governing document order

Before building or modifying anything, read in this order:

1. `docs/gdd-invariants.md` — constitutional layer. These constraints govern all faithful GDD expressions.
2. `docs/gdd-logical-graph-grammar.md` — second-layer grammar. This translates invariants into graph vocabulary without choosing a storage substrate.
3. `docs/gdd-conformance-checklist.md` — practical checklist for evaluating candidate expressions.
4. `INTRODUCTION.md` — conceptual orientation.
5. The current `skills/` and `bootstrap/` files — reference material for the current PostgreSQL/Node/MCP expression.

If a current implementation file conflicts with the invariants, preserve the invariant and record the conflict as a gap, decision, or proposed supersession. Do not silently force the invariant into the current implementation.

## Expression-layer warning

PostgreSQL, Node, Express, MCP, the current schema, the current bootstrap order, and current table names are expression-layer choices unless explicitly marked otherwise.

When making any change, ask:

```text
Am I preserving an invariant, implementing the grammar, or copying the current reference expression?
```

The current implementation is useful because it is concrete. It is not canonical.

## Projection and retro-projection

A graph can make a system; a system can suggest many graphs.

Do not treat migration or reverse engineering as direct translation:

```text
old system → new system
```

Use the graph-mediated model:

```text
old system → retro-projected graph(s) → selected board → new system expression
```

Reverse engineering an existing system or application means retro-projecting one or more possible intent graphs from working artifacts: code, schema, forms, reports, workflows, permissions, user habits, and operational conventions. It is not extraction of one true requirements graph.

## Agent stance

Agents are players, not owners.

An LLM agent may read projections, reason over unresolved intents, create gaps, propose or record expressions, add refinements, test candidate satisfactions, communicate with peer graphs, or render projections for other actors. Its authority is defined by scope, trust, mode, and verification constraints.

An agent's private memory, plan, scratchpad, chain of thought, or tool execution state is not the source of truth. What matters constitutionally is what the agent inscribes.

## First run

**Build in a separate directory.** This folder contains the skill files — the instructions. Do not write build output (source code, package.json, node_modules, etc.) here. The bootstrap will create a build folder for you (default: sibling `GDD` directory). This folder should remain read-only reference material.

If the database doesn't exist yet:

1. Read `skills/foundations.md` for design philosophy (reference, not build instructions)
2. Read `skills/intent-graph.md` for vocabulary and conventions (reference, not build instructions)
3. Set up PostgreSQL (the bootstrap will create the database for you)
4. Run the bootstrap: `cd bootstrap && npm install && GDD_DB_PASSWORD=yourpassword node run.js`
   - You will be prompted for database name, schema name, and build folder (defaults: `gdd`, `gdd`, `../GDD`)
   - For non-interactive/CI use, set env vars: `GDD_DB_NAME`, `GDD_SCHEMA_NAME`, `GDD_BUILD_DIR`. Names may only contain letters, digits, and underscores (e.g. `my_project`, not `my-project`)
   - This creates the database, schema, enums, tables, root intent, populates all intents with `build_instructions`, creates the `gdd-system` graph, and creates the build folder
5. **Bootstrap phase (raw SQL)**: The server and MCP endpoint don't exist yet — they are among the intents you're about to build. Query the graph directly to find your first workable intents:
   ```sql
   SELECT n.id, n.name, n.build_instructions
   FROM gdd.nodes n
   JOIN gdd.graph_memberships gm ON gm.node_id = n.id AND gm.graph_id = 'gdd-system'
   WHERE n.type NOT IN ('compose', 'expression', 'decision', 'signal', 'test', 'axiom', 'actor', 'projection', 'retro-projection', 'commentary', 'edge-node')
   AND n.id NOT IN (SELECT e.to_node FROM gdd.edges e WHERE e.edge_type = 'satisfies' AND e.superseded_by IS NULL)
   AND n.id NOT IN (SELECT e.to_node FROM gdd.edges e WHERE e.edge_type = 'supersedes' AND e.superseded_by IS NULL)
   AND n.build_instructions IS NOT NULL
   ORDER BY n.id;
   ```
   Among the workable intents you'll find the Express server, REST API, and MCP endpoint. **Build these first** — they are the system's own interaction surface. Read `skills/mcp-server.md` for tool definitions and wiring details.
6. For each workable intent, read its `build_instructions` and build it in the build folder. Record an expression when done (via raw SQL during this phase — INSERT into `gdd.nodes` with type 'expression' and a row in `gdd.edges` with type 'satisfies').
7. **Switch to MCP**: Once the Express server and MCP endpoint are running, stop using raw SQL. From this point forward, use the MCP tools (`query_incomplete`, `build_projection`, `record_expression`, etc.) for all graph interaction. The brief raw-SQL phase is over — the system now has its own API.
8. Continue the loop: `query_incomplete(graph_id: 'gdd-system', workable: true)` → read `build_instructions` from the projection → build → `record_expression` → repeat until all intents in `gdd-system` are green.

The build sequence comes from the graph — each intent carries its own `build_instructions` field describing what to create. The skill files are reference material for vocabulary, conventions, and design rationale. The system builds its own interaction surface as one of its first acts.

After the system is built, ask the user: **"Do you have an API key for an LLM provider (Anthropic, OpenAI, Google)?"** If yes, add it via the `/api/settings/llm` endpoint or the `configure_provider` MCP tool. Multiple providers can be configured; one is set as active. The active provider powers natural language intake, human-to-graph translation, and agent activation. Without an active provider the system is fully functional for actors who work against the graph directly, but natural language surfaces return 501. LLM provider keys are stored in `gdd.llm_providers` and the server resolves the active provider dynamically per request — no restart needed.

Then ask: **"Would you like to participate in the GDD community feedback loop?"** If yes, see `skills/community.md` for setup. This is entirely optional — it enables posting build reports and gap nodes to the project's GitHub Discussions, which helps improve the skill files across different models and environments. It requires a GitHub personal access token with `write:discussion` scope.

## Ongoing work

Once the system exists, the graph is your entry point — not the skill files.

### Session startup

Before doing anything else, check for your session bookmark:

```
GET /api/projection/session-context-{your-actor-id}/llm
```

If it exists and has expressions, read the latest one — it tells you what was done, what's next, and what's unresolved. If it doesn't exist, create one (see `skills/session-continuity.md`). At the end of every session, record a new expression on your session-context intent capturing what you did and what comes next.

**Example — daily startup in Claude Code:**

```
1. Start the GDD server        node src/server.js (in the build folder)
2. Pull your session context    GET /api/projection/session-context-claude-code/llm
3. Read the latest expression   It tells you what was done last, what's next, and what's open
4. Orient and go                Pick up where you left off, or query_incomplete for fresh work
```

This is the entire routine. The server must be running before any API or MCP calls work. The session-context projection is your continuity — it replaces the need to re-read files or reconstruct state from scratch. If you're a different actor (a human in Claude Desktop, an agent, another LLM tool), substitute your own actor ID.

### Actors

Every actor — human, agent, client, or external force — runs the same loop: find what's red, read the projection, work (create nodes and edges, record expressions as expression nodes with satisfies edges), pull the andon cord if stuck, watch the graph turn green. The loop does not vary by actor type. See `skills/foundations.md` for the full account of why.

What varies between actors is two things: **how they enter the graph** and **what they can write**.

How they enter: some actors work against the graph directly — creating intents, querying projections, recording expressions. Others enter through natural language, with the LLM constructing the intent from the ask — inferring name, type, test condition, and expression — and satisfying it immediately. The actor who asks naturally never sees the graph machinery. Every ask still produces a real intent that persists in the graph, accumulating operational memory over time. The LLM provider configuration determines whether natural language entry is available; without it, direct graph access works fully and natural language surfaces return 501.

What they can write: agents are direct graph actors with defined scope (which intents they can see), trust level (what they can write), and trigger (when they activate). A human employing agents sets scope and trust — that is the mission assignment. The agent executes within it. Both are running the same loop; the difference is who initiates each iteration.

### Skill directory

The `gdd.skills` table is the registry of everything the system can do — local skill files, API endpoints, MCP connectors, Office tool capabilities. The LLM consults it before every request to know what capabilities exist and how to reach them. When the LLM writes a new skill file, it registers it here. See `skills/foundations.md` (Full kitting at the constraint) for why this matters.

### Skill file authoring

The LLM writes its own skill files. When it does preparation work for a request — discovers which tables to consult, what domain rules apply, what output format the user expects — it encodes that preparation as a skill file and registers it in `gdd.skills`. This happens on first encounter, not after detecting a pattern. If the preparation recurs, the skill file is already there. If it never recurs, it sits quietly. The LLM is writing instructions for its own future self.

### Composing agents and applications

A micro-app is a set of skill files that together cover a complete operation — preparation through execution. The graph UI allows users to compose these bundles. Assigning a trigger and authorization to a skill file bundle produces an agent. Assigning a UI surface produces an application. The difference is only the interface — an agent has a programmatic trigger, an app has a human-facing UI. A traditional application is an agent designed to be manipulated by human users.

### Execution surfaces

Any tool with an API or MCP connector is both an execution surface (the system targets it to produce output) and an interaction surface (a human reaches the graph through it). The system should expose an MCP server so external tools — Excel, Word, other MCP-capable applications — can connect to the graph. Each connector has its own skill file covering setup and configuration, registered in `gdd.skills`. See `skills/foundations.md` (Execution surfaces) for the full account.

### Defining agents

Agents are first-class graph entities with their own table (`gdd.agents`). An agent definition carries:

- **Scope** — which intents it operates on (a projection, a subgraph, a tag)
- **Trust level** — what it can write back (create intents? only record expressions? only create gaps?)
- **Trigger** — when to activate (manual, event, schedule, continuous)

Defining an agent is the mission assignment. The human creates an agent definition with scope, trust, and trigger — that's the directive. The agent executes within that scope autonomously. Gap nodes created by the agent surface back to whoever defined it.

"Run agent" means: hand the agent `renderLLM` output scoped to its jurisdiction, let it execute until it exhausts red intents in scope or creates a gap. The agent's work is fully auditable through the nodes, edges, and expressions it created.

Multiple agents with overlapping scopes create `tensions-with` edges worth surfacing.

### Projects are graphs, not separate systems

All work lives in one global intent graph. A "project" is a named graph (`gdd.graphs`) whose memberships scope which nodes are visible. Creating a project is creating a graph and adding nodes to it. Nodes can belong to multiple graphs — a shared utility intent belongs to every project that uses it.

When you want focus, project through a graph scope (`?graph_id=...`). When you want the big picture, project without a scope. Cross-cutting dependencies stay visible because they're edges in the same global graph, not hidden behind project boundaries.

Do not create separate databases, schemas, or GDD instances for different projects. Scope attention with graph memberships, not infrastructure.

### Working on the graph

Work is creating graph elements — nodes and edges. There is no session container.

1. Query the graph (`queryIncomplete` with `board_id` or `graph_id`) to see what's red
2. Build a projection for the intent you're working on
3. Do the work — create nodes and edges (including expression nodes with satisfies edges)
4. Record the expression on the intent you satisfied
5. If the work produced source artifacts (code, schema, configuration), commit and push

`skills/intent-graph.md` — model, vocabulary, edge types, and conventions.
`skills/intent-graph-layers.md` — layer definitions (Layer 0-7 intent JSON blocks).
`skills/system-origins.md` — Layer -1: founding decisions inscribed as already-green graph citizens.
`skills/agents.md` — agent definitions: scope, trust levels, activation, the agents table.
`skills/mcp-server.md` — MCP server: build instructions, tool definitions, connector setup.
`skills/ui-client.md` — UI client: build the human surfaces as an external MCP client app.
`skills/session-continuity.md` — session bookmarks: per-actor context recovery, team-level views, the startup routine.

## Stack

- **Database**: PostgreSQL — schema and database names are configurable at bootstrap (default: `gdd` schema in `gdd` database)
- **Backend**: Node.js/Express (src/server.js)
- **API**: REST endpoints on port 3000
- **MCP**: Protocol endpoint at `/mcp` — see `skills/mcp-server.md`
- **Admin surfaces**: Backend-served web dashboard for direct graph actors — dashboard (what's red), intent detail, gap surface. Served as static files from `public/`, calls the REST API. See Layer 5 `ui-admin-surfaces`.
- **User surfaces**: External MCP clients. Natural language intake and any user-facing application — Claude Desktop, Excel, Word, CLI — connect through the MCP server. The backend does not serve user-facing surfaces. See Layer 5 `ui-user-surfaces` and `skills/ui-client.md`.

## Conventions

- All graph state lives in the configured schema (default `gdd`)
- The graph is write-only — intents are superseded, never removed or modified. Edges are also supersedable via `supersedeEdge` — wrong structural relationships are corrected by creating a replacement edge, not by deleting the old one. Edges carry optional `description` (rationale) and `created_by` (provenance).
- Never hardcode credentials
- Test conditions are optional on intents — an untested intent is "uncollapsed" (recognized but not yet evaluable). It cannot turn green until a test is added via `setTestCondition` and an expression satisfies it. Test conditions are **write-once** — once set, immutable. To change a test, supersede the intent.
- Expressions can be recorded without linking to intents — an unlinked expression is "produced but not yet claimed." Use `linkExpression` to connect it later. Query unlinked expressions via `GET /api/unlinked`.
- The LLM manages the graph autonomously — the human prompts, the LLM structures. Graph operations map to individual reasoning acts (recognize intent, produce artifact, add test, claim satisfaction), each independent and in any order.
- Commit and push only when source files in the build workspace changed. Graph-only mutations and configuration changes do not produce commits.
