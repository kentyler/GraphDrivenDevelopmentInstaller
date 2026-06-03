const { pool, q } = require('./db');

// All nodes from Layers 0-7 of intent-graph-layers.md
const nodes = [
  // Layer 0: Foundation
  { id: 'foundation-tables', type: 'compose', name: 'Graph foundation tables', description: 'The database tables that store the global intent graph.', build_instructions: null },
  { id: 'table-nodes', type: 'define-table', name: 'Intent nodes table', description: 'Stores all nodes in the global graph.', test_condition: 'Table exists with columns: id, type, name, description, test_condition, test_verification, notes, artifacts.', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='nodes'", build_instructions: "CREATE TABLE gdd.nodes with columns: id (TEXT PK), type (gdd.node_type NOT NULL), name (TEXT NOT NULL), description (TEXT), test_condition (TEXT), test_verification (TEXT), notes (TEXT), artifacts (JSONB), build_instructions (TEXT), board_id (TEXT FK to gdd.boards). No created_at or created_by -- graph history is topology, not timestamps." },
  { id: 'table-edges', type: 'define-table', name: 'Intent edges table', description: 'Stores directed edges between nodes.', test_condition: 'Table exists with columns: id, from_node, to_node, edge_type', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='edges'", build_instructions: "CREATE TABLE gdd.edges with columns: id (TEXT PK, default gen_random_uuid()::text), from_node (TEXT NOT NULL FK to gdd.nodes), to_node (TEXT NOT NULL FK to gdd.nodes), edge_type (gdd.edge_type NOT NULL), description (TEXT), created_by (TEXT), superseded_by (TEXT FK to gdd.edges). No created_at." },
  { id: 'table-graphs', type: 'define-table', name: 'Graphs table', description: 'Stores graph identities.', test_condition: 'Table exists with columns: id, name, owner, created_at', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='graphs'", build_instructions: "CREATE TABLE gdd.graphs with columns: id (TEXT PK), name (TEXT NOT NULL), owner (TEXT), created_at (TIMESTAMP DEFAULT NOW()). Graphs table is the only core graph table with created_at -- administrative metadata." },
  { id: 'table-graph-memberships', type: 'define-table', name: 'Graph memberships table', description: 'Join table linking nodes to graphs.', test_condition: 'Table exists with columns: graph_id, node_id, unique constraint on (graph_id, node_id)', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='graph_memberships'", build_instructions: "CREATE TABLE gdd.graph_memberships with columns: graph_id (TEXT NOT NULL FK to gdd.graphs), node_id (TEXT NOT NULL FK to gdd.nodes), UNIQUE(graph_id, node_id). No PK column -- the unique constraint serves as the key." },
  { id: 'table-agents', type: 'define-table', name: 'Agents table', description: 'Stores agent definitions.', test_condition: 'Table exists with columns: id, name, scope, trust_level, trigger, status, created_at', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='agents'", build_instructions: "CREATE TABLE gdd.agents with columns: id (TEXT PK), name (TEXT NOT NULL), scope (JSONB), trust_level (gdd.agent_trust NOT NULL DEFAULT 'gaps-only'), trigger (JSONB DEFAULT '{\"type\":\"manual\"}'), status (gdd.agent_status NOT NULL DEFAULT 'defined'), created_at (TIMESTAMP DEFAULT NOW())." },
  { id: 'table-skills', type: 'define-table', name: 'Skill directory table', description: 'Indexes all skill files and external capabilities.', test_condition: 'Table exists with columns: id, name, description, file_path, endpoint, category, created_at', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='skills'", build_instructions: "CREATE TABLE gdd.skills with columns: id (TEXT PK, default gen_random_uuid()::text), name (TEXT NOT NULL), description (TEXT), file_path (TEXT), endpoint (TEXT), category (TEXT), created_at (TIMESTAMP DEFAULT NOW()). file_path is null for external capabilities; endpoint is null for local files." },
  { id: 'table-llm-providers', type: 'define-table', name: 'LLM providers table', description: 'Stores LLM provider configurations.', test_condition: 'Table exists with columns: id, name, provider, api_key, model, is_active, created_at', test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='llm_providers'", build_instructions: "CREATE TABLE gdd.llm_providers with columns: id (TEXT PK, default gen_random_uuid()::text), name (TEXT NOT NULL), provider (TEXT NOT NULL), api_key (TEXT NOT NULL), model (TEXT), is_active (BOOLEAN DEFAULT FALSE), created_at (TIMESTAMP DEFAULT NOW()). Only one provider should be active at a time." },
  { id: 'type-node-type', type: 'define-type', name: 'Node type enum', description: 'All node types: implementation subtypes of intent plus grammar inscription kinds.', test_condition: 'Enum type exists in database with all 25 values', test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.node_type'::regtype", build_instructions: "CREATE TYPE gdd.node_type AS ENUM ('define-table', 'define-type', 'define-schema', 'implement-operation', 'implement-endpoint', 'implement-traversal', 'implement-projection', 'implement-mutation', 'integrate', 'derive', 'translate', 'constrain-permission', 'constrain-invariant', 'establish-convention', 'define-vocabulary', 'compose', 'gap', 'decision', 'signal', 'expression', 'axiom', 'actor', 'projection', 'retro-projection', 'commentary'). 25 values total. The first 21 are implementation-granularity subtypes of intent. The last 4 are grammar inscription kinds added for grammar conformance." },
  { id: 'type-edge-type', type: 'define-type', name: 'Edge type enum', description: 'All edge/relation types from the logical graph grammar.', test_condition: 'Enum type exists in database with all 27 values', test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.edge_type'::regtype", build_instructions: "CREATE TYPE gdd.edge_type AS ENUM ('blocked-by', 'contains', 'tensions-with', 'refines', 'supersedes', 'closes', 'satisfies', 'depends-on', 'tested-by', 'participates-in', 'contradicts', 'clarifies', 'makes-readable', 'obscures', 'marks-edge', 'projects-as', 'projects-to', 'retro-projects', 'interprets-as', 'infers-intent', 'infers-test', 'infers-gap', 'infers-decision', 'signals', 'authorizes', 'expresses', 'comments-on'). 27 values total. First 7 are original. Last 20 added for grammar conformance." },
  { id: 'type-agent-trust', type: 'define-type', name: 'Agent trust level enum', description: 'What an agent can write back: full, express-only, gaps-only.', test_condition: 'Enum type exists in database', test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.agent_trust'::regtype", build_instructions: "CREATE TYPE gdd.agent_trust AS ENUM ('full', 'express-only', 'gaps-only')." },
  { id: 'type-agent-status', type: 'define-type', name: 'Agent status enum', description: 'Agent lifecycle: defined, active, paused.', test_condition: 'Enum type exists in database', test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.agent_status'::regtype", build_instructions: "CREATE TYPE gdd.agent_status AS ENUM ('defined', 'active', 'paused')." },

  // Layer 1: Core Operations
  { id: 'op-create-intent', type: 'implement-operation', name: 'Create intent node', description: 'Insert a new node into the global graph with type validation.', test_condition: 'Can create nodes of all types with proper validation. Rejects intent-type creation if test_condition is null/empty.', test_verification: 'Integration test: create intent, gap, decision, signal, expression, compose nodes.', build_instructions: "Implement createIntent(params) that inserts a node into gdd.nodes. Accept: id, type, name, description, test_condition, test_verification, notes, artifacts, blocked_by[], board_id, build_instructions. Validate: id/type/name required. Gap/signal/decision require notes. Expression requires artifacts (JSONB). Axiom requires notes and board_id. Force test_condition and test_verification to null for gap/decision/signal/expression/compose/axiom. If blocked_by[] provided, create blocked-by edges in same transaction. Return the created node." },
  { id: 'op-create-edge', type: 'implement-operation', name: 'Create edge', description: 'Insert a directed edge between two nodes.', test_condition: 'Can create edges of all seven types. Validates both nodes exist.', test_verification: 'Integration test: create nodes, add edges, verify structure.', build_instructions: "Implement createEdge(params) that inserts into gdd.edges. Accept: from_node, to_node, edge_type, description (optional), created_by (optional). Validate both nodes exist in gdd.nodes. Validate edge_type is one of the seven enum values. Return the created edge with generated id." },
  { id: 'op-record-expression', type: 'implement-operation', name: 'Record expression', description: 'Create expression node with satisfies edges to specified intents.', test_condition: 'Creates expression node and satisfies edges. Linked intents become green.', test_verification: 'Integration test: create chain, record expression, verify green status.', build_instructions: "Implement recordExpression(params) that creates an expression node (type='expression') with artifacts JSONB. Accept: intent_ids[] (optional), name, description, artifacts. Generate id. If intent_ids provided, create satisfies edges from expression to each intent. If intent_ids empty/omitted, expression is unlinked. Use a transaction." },
  { id: 'op-link-expression', type: 'implement-operation', name: 'Link expression to additional intent', description: 'Add a satisfies edge from an existing expression to another intent.', test_condition: 'Linking expression to intent creates satisfies edge. Intent becomes green. Rejects non-expression nodes.', test_verification: 'Integration test: link expression to additional intent, verify green.', build_instructions: "Implement linkExpression(params) that adds a satisfies edge from an existing expression node to another intent. Accept: expression_id, intent_id. Validate expression_id is type='expression'. Create satisfies edge (expression -> intent). Return the created edge." },
  { id: 'op-traverse-dependencies', type: 'implement-traversal', name: 'Traverse dependency chain', description: 'Traverse blocked-by edges in both directions.', test_condition: 'Given chain A->B->C->D, traversing from C returns A,B upstream and D downstream.', test_verification: 'Integration test with a known chain.', build_instructions: "Implement traverseDependencies(intentId) that follows blocked-by edges in both directions. Forward traversal (from_node = current) collects upstream dependencies. Reverse traversal (to_node = current) collects downstream dependents. Only follow non-superseded edges. Return { vantage, upstream[], downstream[] } with full node data at each position." },
  { id: 'op-query-incomplete', type: 'implement-traversal', name: 'Query incomplete intents', description: 'Return red, current intents and gaps within a board or graph scope.', test_condition: 'Requires board_id, graph_id, or explicit scope=global. Returns only red, current intents and gaps within scope. Excludes expression, decision, signal, axiom, actor, projection, retro-projection, commentary nodes. Supports workable filter. Orders by downstream count.', test_verification: 'Integration test with mixed node states. Test rejection when no scope provided.', build_instructions: "Implement queryIncomplete(params) that returns red (no incoming satisfies edge), current (not superseded) intents and gaps. Accept: workable (bool), graph_id (optional), board_id (optional), scope (optional, only valid value is 'global'). SCOPE REQUIREMENT: at least one of board_id, graph_id, or scope='global' must be provided. If none provided, return an error: 'queryIncomplete requires board_id, graph_id, or scope=global. No one plays the whole graph.' Board_id filter: join with node_board_memberships or match nodes.board_id. Graph_id filter: join with graph_memberships. scope='global' is the explicit opt-in for whole-graph queries -- it works but should be treated as a diagnostic mode, not the normal operating mode. Exclude expression/decision/signal/axiom/actor/projection/retro-projection/commentary nodes. Include gap nodes. Workable filter: only return nodes whose blocked-by dependencies are all green. Order by downstream dependent count desc. Compose nodes are green when all contains children are green." },
  { id: 'op-query-skills', type: 'implement-traversal', name: 'Query skill directory', description: 'Return skill entries from gdd.skills with optional category filter.', test_condition: 'Returns all skills unfiltered, filtered by category, empty for no matches.', test_verification: 'Insert test skills, verify queries.', build_instructions: "Implement querySkills(params) that queries gdd.skills. Accept: category (optional). If category provided, filter by it. Return array of skill rows. Empty array if no matches." },
  { id: 'op-create-gap', type: 'implement-operation', name: 'Create gap node', description: 'Convenience for creating gap nodes with required notes.', test_condition: 'Creates gap with null test_condition and required notes. Rejects if notes empty.', test_verification: 'Create gap, verify in queryIncomplete.', build_instructions: "Implement createGap(params) as a convenience wrapper around createIntent with type='gap'. Accept: name, notes (required), id (optional -- generate if not provided), blocked_by[] (optional). Reject if notes empty. Return the created gap node." },
  { id: 'op-create-decision', type: 'implement-operation', name: 'Create decision node', description: 'Create decision node with optional closes edges to gaps.', test_condition: 'Creates decision with notes. Creates closes edges if closes[] provided. Not in queryIncomplete.', test_verification: 'Create decision with closes[], verify edges and exclusion from queryIncomplete.', build_instructions: "Implement createDecision(params) that creates a decision node. Accept: name, description, notes (required), closes[] (optional array of gap IDs), id (optional). Reject if notes empty. If closes[] provided, create closes edges (decision -> gap) for each. Use a transaction. Return the created decision with edges." },
  { id: 'op-supersede', type: 'implement-operation', name: 'Supersede intent', description: 'Create supersedes edge marking old intent as superseded.', test_condition: 'Creates supersedes edge. Old intent excluded from queryIncomplete.', test_verification: 'Supersede intent, verify exclusion.', build_instructions: "Implement supersedeIntent(params) that creates a supersedes edge from new_intent_id to old_intent_id. Accept: new_intent_id, old_intent_id. Validate both nodes exist. Create supersedes edge. The old intent is now superseded (excluded from queryIncomplete). Return the created edge." },
  { id: 'op-supersede-edge', type: 'implement-operation', name: 'Supersede edge', description: 'Create a replacement edge and mark the old edge as superseded. The replacement inherits from_node, to_node, and edge_type from the old edge unless overridden.', test_condition: 'Creates a replacement edge and sets superseded_by on the old edge. Old edge no longer appears in projections. Attempting to supersede an already-superseded edge fails.', test_verification: 'Integration test: create edge, supersede it, verify old edge has superseded_by set, new edge exists, only new edge appears in projection.', build_instructions: "Implement supersedeEdge(params) that creates a replacement edge and marks the old edge as superseded. Accept: old_edge_id, from_node (optional override), to_node (optional override), edge_type (optional override), description (optional), created_by (optional). Load the old edge. Create a new edge inheriting from_node/to_node/edge_type from the old edge unless overridden. Set old edge's superseded_by to the new edge's id. Return { old_edge, new_edge }." },
  { id: 'op-set-test-condition', type: 'implement-operation', name: 'Set test condition on untested intent', description: 'Set the test condition on an untested intent. Write-once: once set, test_condition is immutable. To change a test, supersede the intent.', test_condition: 'Sets test_condition on an untested intent. Rejects if intent already has a test condition (write-once). Rejects if node is not an intent type.', test_verification: 'Create untested intent, set test condition, verify it is set. Attempt to set again, verify rejection.', build_instructions: "Implement setTestCondition(params) that sets test_condition on an untested intent. Accept: intent_id, test_condition (REQUIRED non-empty), test_verification (optional). Validate: node exists and is an intent type (not expression/decision/signal/compose/axiom). Reject if test_condition is already set (write-once). Update gdd.nodes SET test_condition, test_verification. Return the updated node." },
  { id: 'op-query-unlinked', type: 'implement-traversal', name: 'Query unlinked expressions', description: 'Return expression nodes that have no outgoing satisfies edges -- produced but not yet claimed to satisfy any intent.', test_condition: 'Returns only expression nodes with no satisfies edges. Linked expressions are excluded. Supports board_id scoping.', test_verification: 'Integration test: record linked and unlinked expressions, verify only unlinked are returned.', build_instructions: "Implement queryUnlinked(params) that returns expression nodes with no outgoing satisfies edges. Accept: board_id (optional filter). Query gdd.nodes WHERE type='expression' AND NOT EXISTS (SELECT 1 FROM gdd.edges WHERE from_node = nodes.id AND edge_type = 'satisfies'). If board_id provided, filter by it. Return array of unlinked expression nodes." },
  { id: 'op-create-graph', type: 'implement-operation', name: 'Create graph', description: 'Create a graph identity in gdd.graphs.', test_condition: 'Can create and retrieve graph by id.', test_verification: 'Integration test: create graph, verify fields.', build_instructions: "Implement createGraph(params) that inserts into gdd.graphs. Accept: id, name, owner (optional). Return the created graph row." },
  { id: 'op-add-node-to-graph', type: 'implement-operation', name: 'Add node to graph', description: 'Create membership linking node to graph.', test_condition: 'Can add node to graph. Same node in multiple graphs works. Duplicate rejected.', test_verification: 'Integration test with memberships.', build_instructions: "Implement addNodeToGraph(params) that inserts into gdd.graph_memberships. Accept: graph_id, node_id. The UNIQUE constraint handles duplicate rejection. Return the created membership row." },
  { id: 'op-remove-node-from-graph', type: 'implement-operation', name: 'Remove node from graph', description: 'Delete membership. Node itself not deleted.', test_condition: 'Remove from one graph, still in other graphs and nodes table.', test_verification: 'Integration test: add to two, remove from one.', build_instructions: "Implement removeNodeFromGraph(params) that deletes from gdd.graph_memberships. Accept: graph_id, node_id. Only deletes the membership, not the node. Return confirmation." },
  { id: 'op-query-graph-nodes', type: 'implement-traversal', name: 'Query graph nodes', description: 'Return all nodes belonging to a graph.', test_condition: 'Returns all nodes in graph. Supports type filter. Empty for empty graph.', test_verification: 'Integration test with type filters.', build_instructions: "Implement queryGraphNodes(params) that joins gdd.graph_memberships with gdd.nodes. Accept: graph_id, type (optional filter). Return array of nodes belonging to the graph." },
  { id: 'op-node-graphs', type: 'implement-traversal', name: "Query node's graphs", description: 'Return all graphs a node belongs to.', test_condition: 'Returns all graphs for a node. Empty if no memberships.', test_verification: 'Integration test: node in two graphs.', build_instructions: "Implement nodeGraphs(nodeId) that joins gdd.graph_memberships with gdd.graphs for the given node. Return array of graphs the node belongs to." },

  // Layer 2: Projection
  { id: 'projection-mechanism', type: 'compose', name: 'Projection mechanism', description: 'The ability to construct a situated view of the graph from a specific vantage point.', build_instructions: null },
  { id: 'op-build-projection', type: 'implement-projection', name: 'Build projection from intent', description: 'Construct projection: intent, dependencies, red/green status, test conditions, gaps, decisions, expressions, supersession.', test_condition: 'Projection from middle of chain includes all context. Supports graph_id scoping.', test_verification: 'Integration test: build known graph, project from middle node.', build_instructions: "Implement buildProjection(intentId, { graph_id }) that constructs a situated view. Steps: (1) call traverseDependencies to get upstream/downstream, (2) if graph_id, filter to nodes in that graph via graph_memberships, (3) fetch all non-superseded edges involving these nodes, (4) find gaps in neighborhood, (5) find decisions that close those gaps, (6) find expression nodes linked via satisfies edges, (7) compute is_green (has satisfies edge), is_superseded (has supersedes edge), has_test for each node, (8) if vantage has board_id, include board with latest tension, active edge nodes with latest sensitivity, and current axioms. Return { vantage, upstream, downstream, edges, gaps, decisions, expressions, axioms, nodes (map), board, edgeNodes }." },

  // Layer 3: Dual Representation
  { id: 'dual-repr', type: 'compose', name: 'Dual representation', description: 'LLM-legible and human-legible representations of the graph.', build_instructions: null },
  { id: 'op-render-human', type: 'translate', name: 'Render human-legible view', description: 'Produce human-readable summary from projection.', test_condition: 'Projection with 5 intents (2 green, 2 red workable, 1 blocked) produces understandable summary.', test_verification: 'Generate summary from known projection.', build_instructions: "Implement renderHuman(projection) as a deterministic markdown formatter. Group intents by status: green (done), red+workable (ready to work on), red+blocked (waiting on dependencies). Show intent name, description, test condition. Include board section if present (statement, tension). Include axioms section. Include edge nodes section with latest sensitivity readings. No LLM needed -- pure formatting." },
  { id: 'op-render-llm', type: 'translate', name: 'Render LLM-legible view', description: 'Produce dense structured JSON from projection.', test_condition: 'Includes all node fields, edges, status, test conditions. LLM can identify priority work.', test_verification: 'Feed to LLM, verify correct identification.', build_instructions: "Implement renderLLM(projection) that serializes the projection as structured JSON optimized for LLM consumption. Include all node fields, all edges, red/green status, test conditions, dependency chains, board context. Compute summary statistics (total/red/green/blocked counts). The output replaces the system prompt -- an LLM reading it should know what to work on next." },
  { id: 'op-translate-repr', type: 'translate', name: 'Translate between representations', description: 'Bidirectional: human-to-graph (LLM) and graph-to-human (deterministic).', test_condition: 'NL requirement produces intent nodes. Graph mutation produces readable description.', test_verification: 'Round-trip test.', build_instructions: "Implement translateRepresentation(params). Two directions: (1) human-to-graph: accept NL input + llm function + projection context, use LLM to produce candidate graph mutations (createIntent, createEdge, etc.), validate referential integrity before committing, transduction failures become gaps. Do NOT use regex/keyword parsing. (2) graph-to-human: accept structured mutations, deterministic switch over mutation types to produce readable descriptions. No LLM needed for this direction." },

  // Layer 4: Actor Integration
  { id: 'actor-integration', type: 'compose', name: 'Actor integration', description: 'All actor types interact through the graph.', build_instructions: null },
  { id: 'op-transduce-external', type: 'implement-operation', name: 'Transduce external force', description: 'Create signal node for external event, then interpret into graph elements via LLM.', test_condition: 'External event creates signal node plus operational elements linked back to signal.', test_verification: 'Integration test: simulate event, verify signal and graph elements.', build_instructions: "Implement transduceExternal(event_description, { interpreter, context_intent_id }). Steps: (1) create a signal node recording the raw event, (2) build projection from context_intent_id (or root), (3) call LLM with projection + event to produce candidate graph mutations, (4) validate referential integrity, (5) commit valid mutations with blocked-by edges linking back to the signal. If impact cannot be articulated as testable intents, create gap nodes. Signal persists regardless of transduction outcome." },
  { id: 'op-client-intake', type: 'implement-operation', name: 'Client intake', description: 'Natural language transduced into graph elements via LLM.', test_condition: 'Clear requirement creates intent with test. Vague input creates gap.', test_verification: 'Integration test: clear and vague inputs.', build_instructions: "Implement clientSession(input, { client_id, context_intent_id }). Use LLM to transduce NL input into graph elements. If client can articulate what done looks like, create intent with test condition. If not, create gap node. Operate against a projection of the relevant subgraph. Validate candidate mutations for referential integrity. The MCP tool 'ask' is a transport wrapper over this -- do not reimplement." },
  { id: 'op-define-agent', type: 'implement-operation', name: 'Define agent', description: 'Create agent definition with scope, trust, trigger.', test_condition: 'Can create agent with scope and trust. Agent is queryable.', test_verification: 'Integration test: define agent, verify metadata.', build_instructions: "Implement defineAgent(params) that inserts into gdd.agents. Accept: id, name, scope (JSONB -- projection spec or intent_ids), trust_level (full|express-only|gaps-only), trigger (JSONB, default {type:'manual'}). Set status to 'defined'. Agents use the globally configured active LLM provider at runtime -- do not store provider reference on agent." },
  { id: 'op-activate-agent', type: 'implement-operation', name: 'Activate agent', description: 'Start agent running against scoped jurisdiction.', test_condition: 'Agent with 2 red intents produces expressions. Stops when green or gap. Respects trust.', test_verification: 'Integration test: activate, verify scope and trust boundaries.', build_instructions: "Implement activateAgent(agentId). Load agent definition, resolve active LLM provider. Provide renderLLM output scoped to agent's intents. Run loop: queryIncomplete within scope -> build projection -> execute (LLM produces graph mutations) -> record expression -> loop. Stop when: scope is all green, gap is created, or max iterations reached. Enforce trust level boundaries. Return work summary." },
  { id: 'op-query-agents', type: 'implement-operation', name: 'Query agents', description: 'List agents with state, filterable by status and scope overlap.', test_condition: 'Can list, filter by status, filter by scope overlap. Returns gap counts.', test_verification: 'Integration test: multiple agents, verify filters.', build_instructions: "Implement queryAgents(params) that queries gdd.agents. Accept: status (optional filter), intent_id (optional -- filter to agents whose scope includes this intent). For each agent, compute gap count within scope. Return array of agent definitions with current state." },

  // Layer 5: Human Surfaces
  { id: 'human-surfaces', type: 'compose', name: 'Human-facing surfaces', description: 'Surfaces for human actors to perceive and act on the graph.', build_instructions: null },
  { id: 'ui-admin-surfaces', type: 'compose', name: 'Admin surfaces', description: 'Backend-served for direct graph actors.', build_instructions: null },
  { id: 'ui-user-surfaces', type: 'compose', name: 'User-facing surfaces', description: 'External MCP clients for natural language actors.', build_instructions: null },
  { id: 'ui-dashboard', type: 'implement-operation', name: 'Dashboard surface', description: 'Primary entry: what is red, ordered by impact.', test_condition: 'Human can see: what needs work, gap count, active agents, recent activity.', test_verification: 'Create mixed graph, verify dashboard content.', build_instructions: "Build a web dashboard (HTML/CSS/JS served from public/) that shows: (1) all red intents ordered by downstream dependent count (call GET /api/incomplete), (2) gap count, (3) active agent summaries (call GET /api/agents?status=active), (4) recent graph activity. Use tabs or sections for Red/All/Gaps/Agents/Sessions/Settings views. Call REST API endpoints -- do not query the database directly." },
  { id: 'ui-intent-detail', type: 'implement-operation', name: 'Intent detail surface', description: 'Full projection for selected intent.', test_condition: 'Human can see: intent, test condition, deps, decisions, expressions.', test_verification: 'Build projection, verify all context present.', build_instructions: "Build an intent detail view that shows the full projection for a selected intent. Call GET /api/projection/{id}/human for the rendered markdown view. Show: intent name/description/test_condition, upstream dependencies with status, downstream dependents, gaps and decisions, expression history, board context if present. Navigable from the dashboard." },
  { id: 'ui-gap-surface', type: 'implement-operation', name: 'Gap surface', description: 'All gaps with notes, blocked work, and resolution status.', test_condition: 'Human can see every unresolved gap, its notes, and what it blocks.', test_verification: 'Create gaps resolved and unresolved, verify display.', build_instructions: "Build a gap surface view showing all gap nodes. For each gap: show notes, what work it blocks (downstream deps via edges), and whether it has been closed (closes edges from decisions). Separate unresolved and resolved gaps. Call GET /api/incomplete and filter for type='gap', or query nodes directly." },
  { id: 'ui-client-intake', type: 'implement-operation', name: 'Client intake surface', description: 'Natural language entry via MCP.', test_condition: 'User states requirement in NL, sees created intents/gaps. Transduction visible.', test_verification: 'Simulate client input, verify feedback.', build_instructions: "This is an external MCP client surface -- not served by the backend. Any MCP-capable tool (Claude Desktop, Excel, Word) can serve as this surface by connecting to the /mcp endpoint. The 'ask' MCP tool is the entry point. Show the user what was created from their input: intents (with test conditions) or gaps (with notes). Transduction should be visible." },

  // Layer 6: MCP Server
  { id: 'mcp-server', type: 'compose', name: 'MCP server for execution surfaces', description: 'Exposes graph operations over Model Context Protocol.', build_instructions: null },
  { id: 'mcp-endpoint', type: 'implement-endpoint', name: 'MCP protocol endpoint', description: 'Express endpoint serving MCP protocol.', test_condition: '/mcp responds to handshake and returns tool list.', test_verification: 'Send initialize request, verify capabilities.', build_instructions: "Create a single Express endpoint at /mcp using @modelcontextprotocol/sdk. Use StreamableHTTPServerTransport with sessionIdGenerator: undefined (stateless). Create McpServer instance, register tools, then in the route handler: create transport, connect server, handle request. Use app.all('/mcp', ...) to handle all HTTP methods." },
  { id: 'mcp-tools', type: 'implement-operation', name: 'MCP tool definitions', description: 'Register all graph operations as MCP tools.', test_condition: 'All tools registered and callable. Same results as REST endpoints.', test_verification: 'Call each tool, compare with REST.', build_instructions: "Register all core graph operations as MCP tools using server.tool(name, zodSchema, handler). Tools: query_incomplete, build_projection, create_intent, record_expression, link_expression, set_test_condition, query_unlinked, create_gap, create_decision, supersede_intent, supersede_edge, create_edge, query_skills, query_agents, ask, configure_provider, create_graph, add_node_to_graph, remove_node_from_graph, query_graph_nodes, node_graphs. Peer tools: list_peers, add_peer (id/name/email), remove_peer (peer_id), broadcast_red_nodes (graph_id optional), check_peer_messages, respond_to_broadcast (message_id), view_peer_messages (direction/message_type/peer_id optional filters). Each tool calls the existing operation function -- no new logic, just protocol translation. Use zod for input schemas." },
  { id: 'mcp-connectors', type: 'implement-operation', name: 'Connector skill file generation', description: 'Write connector skill files when external tools connect.', test_condition: 'After connecting tool, skill file exists and gdd.skills has entry.', test_verification: 'Connect test client, verify skill file and registry.', build_instructions: "When a user connects an external tool to the MCP server, write a connector skill file capturing: what tool connected, setup steps, capabilities available, any limitations discovered. Register the skill file in gdd.skills with the connector's category and endpoint. The LLM generates the skill file content based on what it learned during setup." },

  // Layer 7: Grammar conformance operations
  // Phase 2: Board participation
  { id: 'table-node-board-memberships', type: 'define-table', name: 'Node-board memberships table', description: 'Many-to-many relation between nodes and boards. Replaces single board_id FK to allow nodes to participate in multiple boards.', test_condition: "Table gdd.node_board_memberships exists with columns: node_id, board_id, unique constraint.", test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='node_board_memberships'", build_instructions: "CREATE TABLE gdd.node_board_memberships (node_id TEXT NOT NULL REFERENCES gdd.nodes(id), board_id TEXT NOT NULL REFERENCES gdd.boards(id), UNIQUE(node_id, board_id)). This supplements the existing board_id column on nodes. The board_id column remains as 'primary board' for backward compatibility. Use participates-in edges or this table for multi-board queries." },

  // Phase 3: Readability
  { id: 'op-record-readability-gap', type: 'implement-operation', name: 'Record readability gap', description: 'Record that a node is unreadable on a specific board. Creates a gap node with readability context.', test_condition: 'Creates a gap node noting unreadability. Gap linked to target node and board. Queryable by board.', test_verification: 'Integration test: create node, record readability gap on board, verify gap exists with board context.', build_instructions: "Implement recordReadabilityGap(params). Accept: node_id, board_id, notes (why unreadable), created_by (optional). Steps: (1) validate node and board exist, (2) create gap node with notes prefixed 'Readability gap: ', board_id set, (3) create obscures edge from gap to node_id (the gap marks what is unreadable), (4) return the gap. The gap is a normal gap -- it appears in queryIncomplete and can be closed by decisions or clarifications." },
  { id: 'op-record-clarification', type: 'implement-operation', name: 'Record clarification', description: 'Add a clarification that makes a node readable on a board. Creates a commentary node with makes-readable edge.', test_condition: 'Creates commentary node with makes-readable edge to target. Readability gap resolved if present.', test_verification: 'Integration test: record readability gap, then clarification. Verify makes-readable edge and gap closure.', build_instructions: "Implement recordClarification(params). Accept: node_id, board_id, content (the clarifying text), actor (optional), close_gap_id (optional -- readability gap to close). Steps: (1) create commentary node with content as notes and board_id, (2) create clarifies edge from commentary to node_id, (3) create makes-readable edge from commentary to node_id, (4) if close_gap_id provided, create closes edge from a new decision to that gap. Return { commentary, edges }." },
  { id: 'op-query-board-readability', type: 'implement-traversal', name: 'Query board readability', description: 'Return nodes on a board with readability status: readable, unreadable, or unclarified.', test_condition: 'Returns nodes grouped by readability status. Nodes with makes-readable edges are readable. Nodes with active readability gaps are unreadable. Others are unclarified.', test_verification: 'Integration test: create mix of readable, unreadable, unclarified nodes on board. Verify grouping.', build_instructions: "Implement queryBoardReadability(board_id). Query all nodes where board_id matches or where node has participates-in edge to board. For each node: check for makes-readable edges (readable), active readability gaps via obscures edges (unreadable), or neither (unclarified). Return { readable: [...], unreadable: [...], unclarified: [...] } with node details and clarification/gap info." },

  // Phase 4: Projection / retro-projection
  { id: 'op-record-projection', type: 'implement-operation', name: 'Record projection inscription', description: 'Record a projection as a graph inscription -- the act of projecting a graph region into an expression, system, or view.', test_condition: 'Creates projection node with projects-to edges from source intents. Projection carries purpose, audience, register.', test_verification: 'Integration test: record projection from board, verify node and edges.', build_instructions: "Implement recordProjection(params). Accept: name, description, board_id (optional), purpose (text), audience (text -- human/llm/system), register (text -- narrative/structured/technical), source_intent_ids (optional array -- what was projected), artifacts (JSONB -- the projected output). Steps: (1) create node with type='projection', (2) if source_intent_ids provided, create projects-to edges from each source to the projection, (3) return the projection node with edges." },
  { id: 'op-query-projections', type: 'implement-traversal', name: 'Query projection inscriptions', description: 'Return recorded projection inscriptions, optionally filtered by board, purpose, or audience.', test_condition: 'Returns projection nodes with filters. Includes source intents via projects-to edges.', test_verification: 'Integration test: record multiple projections, query with filters.', build_instructions: "Implement queryProjections(params). Accept: board_id (optional), purpose (optional), audience (optional). Query gdd.nodes WHERE type='projection', filter by board_id if provided. For each projection, load incoming projects-to edges to identify source intents. Return array of projection nodes with source intent summaries." },
  { id: 'op-record-retro-projection', type: 'implement-operation', name: 'Record retro-projection', description: 'Record a retro-projection -- a situated graph reading of an existing artifact or system. Not extraction of one true graph.', test_condition: 'Creates retro-projection node with retro-projects edge from artifact reference. Can create inferred intents/gaps with infers-* edges.', test_verification: 'Integration test: retro-project artifact, verify node, edges, and inferred intents.', build_instructions: "Implement recordRetroProjection(params). Accept: name, description, source_artifact (text -- reference to what is being retro-projected), board_id (optional -- the board from which the artifact is being read), confidence_notes (text -- how situated/uncertain this reading is), inferred_intents (optional array of {name, description, test_condition}), inferred_gaps (optional array of {name, notes}). Steps: (1) create node with type='retro-projection' and source_artifact in artifacts JSONB, (2) for each inferred intent, create intent node and infers-intent edge from retro-projection, (3) for each inferred gap, create gap node and infers-gap edge, (4) return { retro_projection, inferred_intents, inferred_gaps }." },
  { id: 'op-query-retro-projections', type: 'implement-traversal', name: 'Query retro-projections', description: 'Return retro-projection inscriptions. Supports finding competing readings of the same artifact.', test_condition: 'Returns retro-projection nodes. Can filter by source artifact. Includes inferred nodes via infers-* edges.', test_verification: 'Integration test: two retro-projections from same artifact, query both.', build_instructions: "Implement queryRetroProjections(params). Accept: source_artifact (optional text filter), board_id (optional). Query gdd.nodes WHERE type='retro-projection'. If source_artifact provided, filter by artifacts JSONB containing that reference. For each, load outgoing infers-intent/infers-gap/infers-test edges to show what was inferred. Return array." },

  // Phase 5: Actor inscriptions and commentary
  { id: 'op-record-actor', type: 'implement-operation', name: 'Record actor inscription', description: 'Record an actor as a graph inscription. Actors include humans, LLM agents, systems, tests, external forces.', test_condition: 'Creates actor node with scope, trust, and mode metadata. Does not replace gdd.agents table.', test_verification: 'Integration test: record human actor and system actor, verify both queryable.', build_instructions: "Implement recordActor(params). Accept: id (optional), name, description, actor_kind (text -- human/llm-agent/system/test-runner/external), scope (optional JSONB), trust_level (optional text), mode (optional text -- how actor participates). Steps: (1) create node with type='actor', storing actor_kind/scope/trust_level/mode in artifacts JSONB. This is distinct from gdd.agents which is specifically for LLM agent definitions. Actor nodes inscribe the existence and participation constraints of any kind of actor. Return the created node." },
  { id: 'op-record-commentary', type: 'implement-operation', name: 'Record commentary', description: 'Record interpretive commentary on a graph inscription. Commentary does not change satisfaction status.', test_condition: 'Creates commentary node with comments-on edge to target. Target satisfaction unchanged.', test_verification: 'Integration test: add commentary to green intent, verify still green. Add to red intent, verify still red.', build_instructions: "Implement recordCommentary(params). Accept: name, content (the commentary text), target_node_id, board_id (optional), actor (optional). Steps: (1) create node with type='commentary', content in notes field, (2) create comments-on edge from commentary to target_node_id, (3) if board_id provided, set board_id on commentary node. Return { commentary, edge }. Commentary never changes satisfaction -- it is interpretive, not operational." },
  { id: 'op-query-commentary', type: 'implement-traversal', name: 'Query commentary', description: 'Return commentary nodes, optionally filtered by target node or board.', test_condition: 'Returns commentary nodes with their comments-on targets. Filterable by node_id and board_id.', test_verification: 'Integration test: add commentaries to multiple targets, query by target and board.', build_instructions: "Implement queryCommentary(params). Accept: node_id (optional -- return commentary on this node), board_id (optional). Query gdd.nodes WHERE type='commentary'. If node_id provided, filter to commentaries that have a comments-on edge to that node. If board_id provided, filter by board_id. Return array with target node summaries." },

  // Phase 6: Portable graph package
  { id: 'op-export-graph-package', type: 'implement-operation', name: 'Export portable graph package', description: 'Export a graph or subgraph as a portable JSON package. The graph is the zip file; the application is one decompression.', test_condition: 'Exports graph as JSON containing nodes, edges, boards, edge_nodes, memberships. Package is self-contained.', test_verification: 'Integration test: export graph, parse JSON, verify all referenced nodes and edges present.', build_instructions: "Implement exportGraphPackage(params). Accept: graph_id (required), include_superseded (bool, default false), include_expressions (bool, default true). Steps: (1) query all nodes in graph via memberships, (2) query all edges where both endpoints are in the set, (3) query all boards referenced by nodes, (4) query edge_nodes on those boards, (5) include graph and membership data, (6) package as JSON with metadata: source_instance, export_date, schema_version. If !include_superseded, filter out superseded nodes/edges. Return the JSON package." },
  { id: 'op-import-graph-package', type: 'implement-operation', name: 'Import portable graph package', description: 'Import a graph package into the current instance. Supports merge strategies for conflict resolution.', test_condition: 'Imports package creating nodes, edges, boards, memberships. Handles ID conflicts per merge strategy. Wrapped in transaction.', test_verification: 'Integration test: export then import into fresh instance, verify counts match. Test with conflicting IDs.', build_instructions: "Implement importGraphPackage(params). Accept: package (JSON), merge_strategy ('create-new'|'skip-existing'|'error-on-conflict', default 'skip-existing'), dry_run (bool, default false). Steps: (1) validate package structure and schema_version, (2) begin transaction, (3) for each node: check if id exists, apply merge_strategy, (4) for each edge: same, (5) for boards, edge_nodes, memberships: same, (6) if dry_run, rollback and return report, (7) else commit. Return { created, skipped, conflicts } counts with details." },
];

// All edges from the Edge Summary
const edges = [
  // gdd-root contains top-level compose nodes
  { from: 'gdd-root', to: 'foundation-tables', type: 'contains' },
  { from: 'gdd-root', to: 'projection-mechanism', type: 'contains' },
  { from: 'gdd-root', to: 'dual-repr', type: 'contains' },
  { from: 'gdd-root', to: 'actor-integration', type: 'contains' },
  { from: 'gdd-root', to: 'human-surfaces', type: 'contains' },
  { from: 'gdd-root', to: 'mcp-server', type: 'contains' },

  // foundation-tables contains
  { from: 'foundation-tables', to: 'table-nodes', type: 'contains' },
  { from: 'foundation-tables', to: 'table-edges', type: 'contains' },
  { from: 'foundation-tables', to: 'table-graphs', type: 'contains' },
  { from: 'foundation-tables', to: 'table-graph-memberships', type: 'contains' },
  { from: 'foundation-tables', to: 'table-agents', type: 'contains' },
  { from: 'foundation-tables', to: 'table-skills', type: 'contains' },
  { from: 'foundation-tables', to: 'table-llm-providers', type: 'contains' },
  { from: 'foundation-tables', to: 'type-node-type', type: 'contains' },
  { from: 'foundation-tables', to: 'type-edge-type', type: 'contains' },
  { from: 'foundation-tables', to: 'type-agent-trust', type: 'contains' },
  { from: 'foundation-tables', to: 'type-agent-status', type: 'contains' },

  // Layer 1 blocked-by
  { from: 'op-create-intent', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'op-create-edge', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'op-record-expression', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-record-expression', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-link-expression', to: 'op-record-expression', type: 'blocked-by' },
  { from: 'op-traverse-dependencies', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-traverse-dependencies', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-query-incomplete', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-query-incomplete', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-query-skills', to: 'table-skills', type: 'blocked-by' },
  { from: 'op-create-gap', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-create-decision', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-create-decision', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-supersede', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-supersede', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-supersede-edge', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-set-test-condition', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-query-unlinked', to: 'op-record-expression', type: 'blocked-by' },
  { from: 'op-create-graph', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'op-add-node-to-graph', to: 'op-create-graph', type: 'blocked-by' },
  { from: 'op-add-node-to-graph', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-remove-node-from-graph', to: 'op-add-node-to-graph', type: 'blocked-by' },
  { from: 'op-query-graph-nodes', to: 'op-add-node-to-graph', type: 'blocked-by' },
  { from: 'op-node-graphs', to: 'op-add-node-to-graph', type: 'blocked-by' },

  // Layer 2 contains + blocked-by
  { from: 'projection-mechanism', to: 'op-build-projection', type: 'contains' },
  { from: 'op-build-projection', to: 'op-traverse-dependencies', type: 'blocked-by' },

  // Layer 3 contains + blocked-by
  { from: 'dual-repr', to: 'op-render-human', type: 'contains' },
  { from: 'dual-repr', to: 'op-render-llm', type: 'contains' },
  { from: 'dual-repr', to: 'op-translate-repr', type: 'contains' },
  { from: 'op-render-human', to: 'projection-mechanism', type: 'blocked-by' },
  { from: 'op-render-llm', to: 'projection-mechanism', type: 'blocked-by' },
  { from: 'op-translate-repr', to: 'op-render-human', type: 'blocked-by' },
  { from: 'op-translate-repr', to: 'op-render-llm', type: 'blocked-by' },

  // Layer 4 contains + blocked-by
  { from: 'actor-integration', to: 'op-transduce-external', type: 'contains' },
  { from: 'actor-integration', to: 'op-client-intake', type: 'contains' },
  { from: 'actor-integration', to: 'op-define-agent', type: 'contains' },
  { from: 'actor-integration', to: 'op-activate-agent', type: 'contains' },
  { from: 'actor-integration', to: 'op-query-agents', type: 'contains' },
  { from: 'op-transduce-external', to: 'op-build-projection', type: 'blocked-by' },
  { from: 'op-transduce-external', to: 'op-translate-repr', type: 'blocked-by' },
  { from: 'op-client-intake', to: 'op-build-projection', type: 'blocked-by' },
  { from: 'op-client-intake', to: 'op-translate-repr', type: 'blocked-by' },
  { from: 'op-define-agent', to: 'projection-mechanism', type: 'blocked-by' },
  { from: 'op-activate-agent', to: 'op-define-agent', type: 'blocked-by' },
  { from: 'op-query-agents', to: 'op-define-agent', type: 'blocked-by' },

  // Layer 5 contains + blocked-by
  { from: 'human-surfaces', to: 'ui-admin-surfaces', type: 'contains' },
  { from: 'human-surfaces', to: 'ui-user-surfaces', type: 'contains' },
  { from: 'ui-admin-surfaces', to: 'ui-dashboard', type: 'contains' },
  { from: 'ui-admin-surfaces', to: 'ui-intent-detail', type: 'contains' },
  { from: 'ui-admin-surfaces', to: 'ui-gap-surface', type: 'contains' },
  { from: 'ui-user-surfaces', to: 'ui-client-intake', type: 'contains' },
  { from: 'ui-dashboard', to: 'op-query-incomplete', type: 'blocked-by' },
  { from: 'ui-dashboard', to: 'op-render-human', type: 'blocked-by' },
  { from: 'ui-dashboard', to: 'op-query-agents', type: 'blocked-by' },
  { from: 'ui-intent-detail', to: 'op-build-projection', type: 'blocked-by' },
  { from: 'ui-intent-detail', to: 'op-render-human', type: 'blocked-by' },
  { from: 'ui-gap-surface', to: 'op-render-human', type: 'blocked-by' },
  { from: 'ui-client-intake', to: 'op-client-intake', type: 'blocked-by' },
  { from: 'ui-client-intake', to: 'op-render-human', type: 'blocked-by' },
  { from: 'ui-client-intake', to: 'mcp-tools', type: 'blocked-by' },

  // Layer 6 contains + blocked-by
  { from: 'mcp-server', to: 'mcp-endpoint', type: 'contains' },
  { from: 'mcp-server', to: 'mcp-tools', type: 'contains' },
  { from: 'mcp-server', to: 'mcp-connectors', type: 'contains' },
  { from: 'mcp-endpoint', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'mcp-endpoint', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-query-incomplete', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-query-skills', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-build-projection', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-record-expression', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-link-expression', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-create-gap', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-client-intake', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-query-agents', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-create-decision', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-supersede', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-supersede-edge', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-set-test-condition', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-query-unlinked', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-create-graph', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-add-node-to-graph', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-remove-node-from-graph', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-query-graph-nodes', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-node-graphs', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'table-llm-providers', type: 'blocked-by' },
  { from: 'mcp-connectors', to: 'mcp-endpoint', type: 'blocked-by' },
  { from: 'mcp-connectors', to: 'table-skills', type: 'blocked-by' },

  // Layer 7: Grammar conformance edges

  // Phase 2: Board participation table
  { from: 'foundation-tables', to: 'table-node-board-memberships', type: 'contains' },
  { from: 'table-node-board-memberships', to: 'table-boards', type: 'blocked-by' },

  // Phase 3: Readability operations
  { from: 'op-record-readability-gap', to: 'op-create-gap', type: 'blocked-by' },
  { from: 'op-record-readability-gap', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-record-clarification', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-record-clarification', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-query-board-readability', to: 'table-node-board-memberships', type: 'blocked-by' },

  // Phase 4: Projection / retro-projection operations
  { from: 'op-record-projection', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-record-projection', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-query-projections', to: 'op-record-projection', type: 'blocked-by' },
  { from: 'op-record-retro-projection', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-record-retro-projection', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-record-retro-projection', to: 'op-create-gap', type: 'blocked-by' },
  { from: 'op-query-retro-projections', to: 'op-record-retro-projection', type: 'blocked-by' },

  // Phase 5: Actor and commentary operations
  { from: 'op-record-actor', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-record-commentary', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-record-commentary', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-query-commentary', to: 'op-record-commentary', type: 'blocked-by' },

  // Phase 6: Portable graph package operations
  { from: 'op-export-graph-package', to: 'op-query-graph-nodes', type: 'blocked-by' },
  { from: 'op-import-graph-package', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-import-graph-package', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-import-graph-package', to: 'op-create-graph', type: 'blocked-by' },

];

async function populate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert all nodes (ON CONFLICT updates build_instructions for existing installs)
    let inserted = 0;
    for (const node of nodes) {
      await client.query(q(`
        INSERT INTO gdd.nodes (id, type, name, description, test_condition, test_verification, build_instructions)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET build_instructions = EXCLUDED.build_instructions
      `), [node.id, node.type, node.name, node.description, node.test_condition ? q(node.test_condition) : null, node.test_verification ? q(node.test_verification) : null, node.build_instructions ? q(node.build_instructions) : null]);
      inserted++;
    }
    console.log(`Inserted/updated ${inserted} nodes.`);

    // Insert all edges
    let edgesInserted = 0;
    for (const edge of edges) {
      // Check if edge already exists to avoid duplicates
      const existing = await client.query(
        q('SELECT 1 FROM gdd.edges WHERE from_node = $1 AND to_node = $2 AND edge_type = $3 AND superseded_by IS NULL'),
        [edge.from, edge.to, edge.type]
      );
      if (existing.rows.length === 0) {
        await client.query(q(`
          INSERT INTO gdd.edges (from_node, to_node, edge_type)
          VALUES ($1, $2, $3)
        `), [edge.from, edge.to, edge.type]);
        edgesInserted++;
      }
    }
    console.log(`Inserted ${edgesInserted} edges.`);

    // Record bootstrap expression satisfying DDL/enum intents that the SQL files already created
    const bootstrapCompleted = [
      'table-nodes', 'table-edges', 'table-graphs', 'table-graph-memberships',
      'table-agents', 'table-skills', 'table-llm-providers',
      'type-node-type', 'type-edge-type', 'type-agent-trust', 'type-agent-status',
    ];
    const bootstrapExprId = 'expression-bootstrap-core-schema';
    await client.query(q(`
      INSERT INTO gdd.nodes (id, type, name, description, artifacts)
      VALUES ($1, 'expression', $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `), [
      bootstrapExprId,
      'Core schema bootstrap',
      'Bootstrap created core tables and enums via SQL migration.',
      JSON.stringify({ files: ['001-enums.sql', '002-tables.sql', '003-bootstrap.sql'] }),
    ]);
    for (const intentId of bootstrapCompleted) {
      const existing = await client.query(
        q('SELECT 1 FROM gdd.edges WHERE from_node = $1 AND to_node = $2 AND edge_type = $3 AND superseded_by IS NULL'),
        [bootstrapExprId, intentId, 'satisfies']
      );
      if (existing.rows.length === 0) {
        await client.query(q(`
          INSERT INTO gdd.edges (from_node, to_node, edge_type)
          VALUES ($1, $2, 'satisfies')
        `), [bootstrapExprId, intentId]);
      }
    }
    console.log(`Recorded bootstrap expression satisfying ${bootstrapCompleted.length} core DDL intents.`);

    await client.query('COMMIT');

    // Summary
    const nodeCount = await client.query(q('SELECT COUNT(*) FROM gdd.nodes'));
    const edgeCount = await client.query(q('SELECT COUNT(*) FROM gdd.edges'));
    console.log(`\nGraph populated: ${nodeCount.rows[0].count} nodes, ${edgeCount.rows[0].count} edges.`);

    // Show what's red (workable)
    const red = await client.query(q(`
      SELECT n.id, n.name FROM gdd.nodes n
      WHERE n.type NOT IN ('compose', 'expression', 'decision', 'signal')
      AND NOT EXISTS (SELECT 1 FROM gdd.edges e WHERE e.to_node = n.id AND e.edge_type = 'satisfies')
      AND NOT EXISTS (SELECT 1 FROM gdd.edges e WHERE e.to_node = n.id AND e.edge_type = 'supersedes')
      ORDER BY n.id
      LIMIT 10
    `));
    console.log(`\nFirst 10 red intents:`);
    red.rows.forEach(r => console.log(`  ${r.id}: ${r.name}`));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Population failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

populate();
