# MCP Server

The GDD system exposes an MCP (Model Context Protocol) server so external tools can connect to the intent graph. This makes the graph reachable from inside any MCP-capable application — Excel, Word, PowerPoint, Claude Desktop, or any tool with an MCP connector.

The MCP server is not a separate service. It runs inside the existing Express app.

## Dependencies

```
npm install @modelcontextprotocol/sdk
```

## Setup

Add the MCP server alongside the existing Express routes. A single endpoint — `/mcp` — serves the MCP protocol using Streamable HTTP transport. The SDK provides `McpServer` for tool registration and `StreamableHTTPServerTransport` for wiring into Express routes. Check the SDK version you installed for the exact API — the transport class and middleware helpers have changed across versions. The builder should consult the SDK's README or examples for the current wiring pattern.

The essential shape:

1. Create an `McpServer` instance with name `"gdd"` and version `"1.0.0"`
2. Register all tools (see below)
3. Mount a route at `/mcp` that creates a `StreamableHTTPServerTransport`, connects it to the server, and handles the request/response cycle

The SDK handles protocol negotiation. The builder chooses the exact wiring based on the installed SDK version.

## Tools

Most MCP tools map directly to existing graph operations. Some — like `ask` (composes intent construction with expression recording) and `configure_provider` (infrastructure configuration) — compose multiple operations or expose capabilities not separately named in the graph layer. Board tools, edge node tools, and working-intent tools extend the core graph with board-based inquiry, edge phenomena tracking, and session focus management.

### ask

Natural language entry point. The user says something; the LLM constructs the intent (name, type, test condition, expression) and satisfies it in the same session. Returns the result to the caller.

- **Input**: `{ input: string, client_id?: string, context_intent_id?: string }` — the natural language ask; client_id identifies the caller; context_intent_id scopes the ask to a specific intent's projection
- **Maps to**: `clientSession` / `translateRepresentation` + intent creation + expression recording
- **Requires**: Active LLM provider configured

### query_incomplete

What's red. Returns intents and gaps with no incoming satisfies edges (excluding expression, decision, and signal nodes). Supports a workable filter to return only red intents whose dependencies are all green.

- **Input**: `{ workable?: boolean, graph_id?: string, board_id?: string }` — when workable is true, returns only red intents whose blocked-by dependencies all have incoming satisfies edges; graph_id scopes the query to nodes within that graph's memberships; board_id scopes the query to nodes assigned to that board
- **Maps to**: `queryIncomplete`

### query_skills

What capabilities exist. Returns skill directory entries.

- **Input**: `{ category?: string }` — optional category filter
- **Maps to**: `SELECT` on `gdd.skills`

### build_projection

Full context for a given intent — dependencies, test condition, expression nodes, gaps, decisions, supersession chains.

- **Input**: `{ intent_id: string, graph_id?: string }` — optional graph_id scopes the projection to nodes within that graph's memberships
- **Maps to**: `buildProjection` + `renderHuman` or `renderLLM`

### create_intent

Direct graph operation for actors who speak graph. Handles all node types -- intent types require test_condition, gap/decision/signal nodes require notes, expression nodes require artifacts.

- **Input**: `{ id: string, type: string, name: string, description?: string, test_condition?: string, test_verification?: string, blocked_by?: string, build_instructions?: string }` — blocked_by is a comma-separated string of node IDs (parsed to array server-side); build_instructions is actionable text describing how to satisfy this intent
- **Maps to**: `createIntent`

### record_expression

Record work done against one or more intents. Creates an expression node and satisfies edges linking it to the specified intents.

- **Input**: `{ name: string, artifacts: string, intent_ids?: string, description?: string }` — intent_ids is a comma-separated string of node IDs (parsed to array server-side); artifacts is a JSON string (parsed server-side). intent_ids is optional — an expression recorded without intent_ids is "unlinked" and can be claimed later via `link_expression`.
- **Maps to**: `recordExpression`

### link_expression

Link an existing expression node to an additional intent it also satisfies.

- **Input**: `{ expression_id: string, intent_id: string }`
- **Maps to**: `linkExpression`

### create_graph

Create a named graph for organizing nodes.

- **Input**: `{ id: string, name: string, owner?: string }`
- **Maps to**: `createGraph`

### add_node_to_graph

Add a node to a graph (create a membership).

- **Input**: `{ graph_id: string, node_id: string }`
- **Maps to**: `addNodeToGraph`

### remove_node_from_graph

Remove a node from a graph (delete a membership). The node itself is not deleted.

- **Input**: `{ graph_id: string, node_id: string }`
- **Maps to**: `removeNodeFromGraph`

### query_graph_nodes

List all nodes belonging to a graph.

- **Input**: `{ graph_id: string, type?: string }`
- **Maps to**: `queryGraphNodes`

### node_graphs

List all graphs a node belongs to.

- **Input**: `{ node_id: string }`
- **Maps to**: `nodeGraphs`

### create_gap

Pull the andon cord.

- **Input**: `{ name: string, notes: string, id?: string }`
- **Maps to**: `createGap`

### create_decision

Record what was chosen, alternatives considered, and scope governed. Optionally closes one or more gaps.

- **Input**: `{ name: string, notes: string, description?: string, closes?: string, id?: string }` — closes is a comma-separated string of gap IDs (parsed to array server-side); creates `closes` edges from the decision to each gap
- **Maps to**: `createDecision`

### supersede_intent

Replace an old intent with a new one. The old intent remains in the graph as history.

- **Input**: `{ new_intent_id: string, old_intent_id: string }`
- **Maps to**: `supersedeIntent`

### query_agents

What agents exist and their status.

- **Input**: `{ status?: string, intent_id?: string }` — intent_id filters to agents whose scope includes the given intent
- **Maps to**: `queryAgents`

### configure_provider

List, add, or activate an LLM provider.

- **Input**: `{ action: "list" | "add" | "activate", name?: string, provider?: string, api_key?: string, model?: string, id?: string }` — `list` returns all providers; `add` creates a new provider (requires name, provider, api_key, model); `activate` sets a provider as active by id (deactivates all others first)
- **Maps to**: CRUD on `gdd.llm_providers`

### set_test_condition

Add or set the test condition on an existing intent. Test conditions are write-once -- once set, they are immutable. To change a test, supersede the intent.

- **Input**: `{ intent_id: string, test_condition: string, test_verification?: string }`
- **Maps to**: `setTestCondition`

### query_unlinked

Find expression nodes that have no satisfies edges to any intent. These are "produced but not yet claimed" expressions. Optionally scoped to a board.

- **Input**: `{ board_id?: string }`
- **Maps to**: `queryUnlinked`

### create_edge

Create an edge between two nodes. Supports all edge types (blocked-by, satisfies, closes, tensions-with, supersedes, contains, refines).

- **Input**: `{ from_node: string, to_node: string, edge_type: string, description?: string, created_by?: string }`
- **Maps to**: `createEdge`

### supersede_edge

Replace an existing edge with a new one. The old edge remains in the graph as history. Any field not provided is carried forward from the old edge.

- **Input**: `{ old_edge_id: string, from_node?: string, to_node?: string, edge_type?: string, description?: string, created_by?: string }`
- **Maps to**: `supersedeEdge`

### create_board

Create a board -- a container for tension readings and edge nodes. Boards organize ongoing inquiry around a focal question or domain.

- **Input**: `{ id: string, name: string, statement?: string, created_by?: string }`
- **Maps to**: `createBoard`

### query_boards

List boards, optionally filtered by status.

- **Input**: `{ status?: string }`
- **Maps to**: `queryBoards`

### get_board

Full context for a board -- its details, tension readings, assigned nodes, and edge nodes.

- **Input**: `{ board_id: string }`
- **Maps to**: `getBoard`

### record_tension_reading

Record a tension signal on a board. Tension readings are observations of friction, surprise, or dissonance. They accumulate on the board and inform edge node creation.

- **Input**: `{ board_id: string, signal: string, read_by?: string, edge_node_id?: string, tension_character?: string }`
- **Maps to**: `recordTensionReading`

### assign_node_to_board

Assign an existing graph node (intent, gap, decision, etc.) to a board. A node can participate in multiple boards. The first assignment also sets the node's primary board_id if unset.

- **Input**: `{ node_id: string, board_id: string }`
- **Maps to**: `assignNodeToBoard` (inserts into `gdd.node_board_memberships`)

### query_board_nodes

List all nodes participating in a board (via memberships or primary board_id).

- **Input**: `{ board_id: string, type?: string }`
- **Maps to**: `queryBoardNodes`

### query_board_axioms

List axiom nodes belonging to a board (excluding superseded axioms).

- **Input**: `{ board_id: string }`
- **Maps to**: `SELECT` on `gdd.nodes` filtered by type 'axiom' and board_id, excluding superseded

### record_readability_gap

Record that a node is unreadable on a specific board. Creates a gap node with readability context and an `obscures` edge to the target node. Readability is board-relative -- a node may be readable on one board and unreadable on another.

- **Input**: `{ node_id: string, board_id: string, notes: string, created_by?: string }`
- **Maps to**: `recordReadabilityGap`

### record_clarification

Add a clarification that makes a node readable on a board. Creates a commentary node with `clarifies` and `makes-readable` edges to the target. Can optionally close an existing readability gap.

- **Input**: `{ node_id: string, board_id: string, content: string, actor?: string, close_gap_id?: string }`
- **Maps to**: `recordClarification`

### query_board_readability

Return nodes on a board grouped by readability status: readable (has `makes-readable` edges), unreadable (has active readability gaps via `obscures` edges), or unclarified (no readability relations).

- **Input**: `{ board_id: string }`
- **Maps to**: `queryBoardReadability`

### create_edge_node

Create an edge node -- a node representing something that resists clean articulation. Edge nodes live on a board and can relate to other graph nodes.

- **Input**: `{ name: string, board_id: string, id?: string, content?: string, related_nodes?: string, weight?: number, created_by?: string }` — related_nodes is a comma-separated string of node IDs (parsed to array server-side)
- **Maps to**: `createEdgeNode`

### query_edge_nodes

List edge nodes, optionally filtered by board or status.

- **Input**: `{ board_id?: string, status?: string }`
- **Maps to**: `queryEdgeNodes`

### get_edge_node

Full context for an edge node -- its details, sensitivity readings, and related nodes.

- **Input**: `{ id: string }`
- **Maps to**: `getEdgeNode`

### record_sensitivity_reading

Record a sensitivity signal on an edge node. Sensitivity readings track how the edge node responds to changes or interactions elsewhere in the graph.

- **Input**: `{ edge_node_id: string, signal: string, read_by?: string, board_impact?: string }`
- **Maps to**: `recordSensitivityReading`

### convert_gap_to_edge

Convert an existing gap node into an edge node. The gap remains in the graph; a new edge node is created on the specified board with the gap's context carried forward. Use when a gap resists resolution and the team recognizes it as a persistent edge phenomenon rather than a solvable problem.

- **Input**: `{ gap_id: string, board_id: string, content?: string, description?: string, failed_articulation_attempts?: string, created_by?: string }` — failed_articulation_attempts is a pipe-separated string (parsed to array server-side)
- **Maps to**: `convertGapToEdge`

### expand_edge_node

Expand an edge node by creating a new gap that represents a specific facet of the edge's resistance. The gap is linked to the edge node. Use when an edge node's tension becomes partially articulable.

- **Input**: `{ edge_node_id: string, gap_name: string, gap_notes: string, description?: string, created_by?: string }`
- **Maps to**: `expandEdgeNode`

### select_working_intent

Set the working intent(s) for the current session. Writes a file at `~/.claude/hooks/gdd-working-intent.json` that hooks and other tools can read to know what the actor is currently working on. Validates that all specified intents exist in the graph.

- **Input**: `{ intent_ids: string, graph_id?: string }` — intent_ids is a comma-separated string of node IDs
- **Maps to**: file write + validation query

### clear_working_intent

Clear the current working intent. Removes the working-intent file.

- **Input**: `{}` (no parameters)
- **Maps to**: file delete

### get_working_intent

Read the current working intent. Returns the intent IDs, names, types, graph scope, and selection timestamp.

- **Input**: `{}` (no parameters)
- **Maps to**: file read

## Connecting from external tools

### Claude for Excel

1. Ensure the GDD server is running (default: `http://localhost:3000`)
2. In Excel, open the Claude add-in
3. Go to Settings → Connectors → Custom Connectors
4. Add a new connector with URL: `http://localhost:3000/mcp`
5. The graph is now reachable from inside Excel — ask questions, query intents, surface gaps

### Claude for Word

Same steps as Excel, using the Claude for Word add-in.

### Claude for PowerPoint

Same steps as Excel, using the Claude for PowerPoint add-in.

### Claude Code

Claude Code is likely where the builder works. Connecting it to the GDD MCP server means the builder (and any LLM agent working through Claude Code) can query the graph, record expressions, and pull the andon cord without leaving their coding session.

Add to the project-level settings file (`.claude/settings.json` in the build workspace) or global settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "gdd": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

This uses Streamable HTTP transport -- Claude Code connects to the running Express server. The GDD server must be running before starting the Claude Code session. If the server is not running, the MCP tools will be unavailable but Claude Code will function normally otherwise.

Project-level settings are preferred -- they keep the GDD connection scoped to the build workspace. Global settings make the graph available in all Claude Code sessions, which is useful if the user works across multiple projects that share the same graph.

Once connected, Claude Code gains all GDD MCP tools as available tool calls. The builder can ask Claude Code to query what's red, build a projection, record an expression, or create a gap -- all within the same session where they're writing code. This closes the loop: the builder writes code in Claude Code, and the graph that tracks that work is accessible from the same environment.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gdd": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Any MCP-capable tool

Point the tool's MCP connector at `http://localhost:3000/mcp`. The protocol is standard -- any tool that speaks MCP can connect.

## Connector skill files

When a new connector is set up, the LLM should write a skill file capturing the setup steps and any tool-specific details (what works well, what limitations exist, what the user typically does through that surface). Register it in `gdd.skills` with the connector's category. Future setups of the same connector type can reuse the skill file.

## Security

The MCP server runs on localhost by default. For remote access, the server should be placed behind authentication. The MCP protocol supports authentication headers — configure these when exposing the server beyond localhost.

Do not expose the MCP endpoint to the public internet without authentication. The graph operations include write access (create intents, record expressions), and unauthenticated access would allow arbitrary graph mutations.
