const { pool, q } = require('./db');

// Intents for board infrastructure and edge node operations.
// Edge nodes are now ordinary gdd.nodes with type='edge-node'.
// No separate gdd.edge_nodes table.
const nodes = [
  // Tables
  { id: 'table-boards', type: 'define-table', name: 'Boards table', description: 'Stores board definitions -- design spaces whose boundaries are derived from their axiom sets.', test_condition: "Table gdd.boards exists with columns: id, created_at, created_by, statement, status.", test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='boards'", build_instructions: "CREATE TABLE gdd.boards with columns: id (TEXT PK), created_at (TIMESTAMP DEFAULT NOW()), created_by (TEXT), name (TEXT), statement (TEXT), status (gdd.board_status NOT NULL DEFAULT 'active'). Also ALTER TABLE gdd.nodes ADD COLUMN board_id TEXT REFERENCES gdd.boards(id) if not already present." },
  { id: 'table-sensitivity-readings', type: 'define-table', name: 'Sensitivity readings table', description: 'Accumulating signal readings on edge nodes (which are gdd.nodes with type edge-node).', test_condition: "Table gdd.sensitivity_readings exists with columns: id, edge_node_id, read_at, read_by, signal, board_impact.", test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='sensitivity_readings'", build_instructions: "CREATE TABLE gdd.sensitivity_readings with columns: id (TEXT PK, default gen_random_uuid()::text), edge_node_id (TEXT NOT NULL FK to gdd.nodes), read_at (TIMESTAMP DEFAULT NOW()), read_by (TEXT), signal (TEXT NOT NULL), board_impact (gdd.board_impact DEFAULT 'stable'). The FK references gdd.nodes because edge nodes are ordinary graph nodes." },
  { id: 'table-tension-readings', type: 'define-table', name: 'Tension readings table', description: 'Board-level tension readings.', test_condition: "Table gdd.tension_readings exists with columns: id, board_id, read_at, read_by, signal, edge_node_id, tension_character.", test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='tension_readings'", build_instructions: "CREATE TABLE gdd.tension_readings with columns: id (TEXT PK, default gen_random_uuid()::text), board_id (TEXT NOT NULL FK to gdd.boards), read_at (TIMESTAMP DEFAULT NOW()), read_by (TEXT), signal (TEXT NOT NULL), edge_node_id (TEXT FK to gdd.nodes), tension_character (gdd.tension_character)." },

  // Enums (edge_node_status removed -- status is derived from topology)
  { id: 'type-board-status', type: 'define-type', name: 'Board status enum', description: 'Board lifecycle: active, dormant, superseded.', test_condition: "Enum gdd.board_status exists with values: active, dormant, superseded.", test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.board_status'::regtype", build_instructions: "CREATE TYPE gdd.board_status AS ENUM ('active', 'dormant', 'superseded')." },
  { id: 'type-board-impact', type: 'define-type', name: 'Board impact enum', description: 'Impact of sensitivity readings: stable, shifting, reorganizing.', test_condition: "Enum gdd.board_impact exists with values: stable, shifting, reorganizing.", test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.board_impact'::regtype", build_instructions: "CREATE TYPE gdd.board_impact AS ENUM ('stable', 'shifting', 'reorganizing')." },
  { id: 'type-tension-character', type: 'define-type', name: 'Tension character enum', description: 'Character of board tension: generative, destabilizing, expansionary.', test_condition: "Enum gdd.tension_character exists with values: generative, destabilizing, expansionary.", test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.tension_character'::regtype", build_instructions: "CREATE TYPE gdd.tension_character AS ENUM ('generative', 'destabilizing', 'expansionary')." },

  // Operations
  { id: 'op-create-board', type: 'implement-operation', name: 'Create board', description: 'Create a board with statement. Boundaries are derived from axioms, not proclaimed.', test_condition: 'Can create board with id, name, statement. Board is queryable.', test_verification: 'Integration test: create board, verify fields.', build_instructions: "Implement createBoard(params) that inserts into gdd.boards. Accept: id, name, statement (optional), created_by (optional). Default status to 'active'. Return the created board row." },
  { id: 'op-assign-node-to-board', type: 'implement-operation', name: 'Assign node to board', description: 'Create a node-board membership. A node can participate in multiple boards.', test_condition: 'Can assign node to board. Same node on multiple boards works. Duplicate rejected gracefully.', test_verification: 'Integration test: assign node to two boards, verify both memberships.', build_instructions: "Implement assignNodeToBoard(params) that inserts into gdd.node_board_memberships. Accept: node_id, board_id. Validate both exist. The UNIQUE constraint handles duplicate rejection. Also set nodes.board_id if the node has no primary board yet (first assignment becomes primary). Return the created membership." },
  { id: 'op-query-board-nodes', type: 'implement-traversal', name: 'Query board nodes', description: 'Return all nodes participating in a board via memberships.', test_condition: 'Returns nodes from node_board_memberships. Also includes nodes with board_id FK for backward compatibility.', test_verification: 'Integration test: nodes via membership and via board_id both returned.', build_instructions: "Implement queryBoardNodes(params). Accept: board_id, type (optional filter). Query: SELECT DISTINCT n.* FROM gdd.nodes n LEFT JOIN gdd.node_board_memberships nbm ON n.id = nbm.node_id WHERE (nbm.board_id = $1 OR n.board_id = $1). If type provided, add AND n.type = $2. Return array of nodes." },
  { id: 'op-create-edge-node', type: 'implement-operation', name: 'Create edge node', description: 'Create an edge node on a board. Edge nodes are ordinary graph nodes with type edge-node.', test_condition: 'Can create edge node with board_id, name, content. Edge node is a gdd.nodes row with type edge-node. Can be endpoint of marks-edge edges. Does not appear in queryIncomplete.', test_verification: 'Integration test: create edge node, verify it is a gdd.nodes row, verify marks-edge edge works, verify isolation from queryIncomplete.', build_instructions: "Implement createEdgeNode(params) that inserts into gdd.nodes with type='edge-node'. Accept: name, board_id, id (optional -- generate if not provided), content (optional, stored in notes), weight (optional, stored in artifacts JSONB as {weight: N}), created_by (optional, stored in artifacts JSONB), related_nodes (optional array of node IDs). Steps: (1) validate board exists, (2) insert into gdd.nodes with type='edge-node', name, notes=content, board_id, artifacts={weight, created_by}, (3) for each related_nodes entry, create a marks-edge edge from this edge node to that node, (4) add to node_board_memberships. Return the created node." },
  { id: 'op-convert-gap-to-edge', type: 'implement-operation', name: 'Convert gap to edge node', description: 'Convert a gap node to an edge node -- marks a boundary that should not be resolved.', test_condition: 'Creates decision closing gap, creates edge-node in gdd.nodes. Gap closed by decision. Conversion expressed as graph topology.', test_verification: 'Integration test: create gap, convert, verify decision, edge node, and closes edge.', build_instructions: "Implement convertGapToEdge(params) in a transaction. Accept: gap_id, board_id, content (optional), description (optional), failed_articulation_attempts (optional array), created_by (optional). Steps: (1) validate gap exists and type='gap', (2) create decision node with notes describing the conversion (include failed_articulation_attempts if provided), create closes edge from decision to gap, (3) create edge-node in gdd.nodes with type='edge-node', notes=content, board_id, artifacts={source_gap_id: gap_id, created_by}, (4) create marks-edge edge from edge-node to the board's related intents if applicable. No separate conversion_events table -- the decision and edges ARE the conversion record. Return { edge_node, decision }." },
  { id: 'op-expand-edge-node', type: 'implement-operation', name: 'Expand edge node', description: 'Expand an edge node into a gap -- the boundary becomes interior work.', test_condition: 'New gap node created with refines edge to edge node. Edge node superseded if fully expanded.', test_verification: 'Integration test: create edge node, expand, verify gap and refines edge.', build_instructions: "Implement expandEdgeNode(params) in a transaction. Accept: edge_node_id, gap_name, gap_notes, description (optional), created_by (optional). Validate edge node exists and type='edge-node'. Steps: (1) create gap node with gap_name, gap_notes, board_id from edge node, (2) create refines edge from gap to edge_node_id (the gap refines the edge -- it makes part of the boundary articulable), (3) optionally supersede the edge node if description says 'fully expanded'. No separate expansion_events table -- the gap and refines edge ARE the expansion record. Return { edge_node, gap }." },
  { id: 'op-record-sensitivity', type: 'implement-operation', name: 'Record sensitivity reading', description: 'Record a signal observation on an edge node.', test_condition: 'Sensitivity reading created with edge_node_id, signal, board_impact. Validates edge_node_id is a gdd.nodes row.', test_verification: 'Integration test: create edge node in gdd.nodes, record reading, verify.', build_instructions: "Implement recordSensitivityReading(params) that inserts into gdd.sensitivity_readings. Accept: edge_node_id, signal, read_by (optional), board_impact (optional, default 'stable'). Validate edge node exists in gdd.nodes. Return the created reading." },
  { id: 'op-record-tension', type: 'implement-operation', name: 'Record tension reading', description: 'Record a tension observation on a board.', test_condition: 'Tension reading created with board_id, signal, tension_character. Visible in getBoard.', test_verification: 'Integration test: create board, record tension, verify in detail.', build_instructions: "Implement recordTensionReading(params) that inserts into gdd.tension_readings. Accept: board_id, signal, read_by (optional), edge_node_id (optional -- must reference gdd.nodes), tension_character (optional). Validate board exists. Return the created reading." },
];

const edges = [
  // Tables blocked by foundation
  { from: 'table-boards', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'table-sensitivity-readings', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'table-sensitivity-readings', to: 'table-boards', type: 'blocked-by' },
  { from: 'table-tension-readings', to: 'table-boards', type: 'blocked-by' },

  // Enums blocked by foundation
  { from: 'type-board-status', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'type-board-impact', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'type-tension-character', to: 'foundation-tables', type: 'blocked-by' },

  // Operations blocked by tables/ops
  { from: 'op-create-board', to: 'table-boards', type: 'blocked-by' },
  { from: 'op-assign-node-to-board', to: 'table-node-board-memberships', type: 'blocked-by' },
  { from: 'op-assign-node-to-board', to: 'op-create-board', type: 'blocked-by' },
  { from: 'op-query-board-nodes', to: 'op-assign-node-to-board', type: 'blocked-by' },
  { from: 'op-create-edge-node', to: 'op-create-board', type: 'blocked-by' },
  { from: 'op-create-edge-node', to: 'op-create-intent', type: 'blocked-by' },
  { from: 'op-create-edge-node', to: 'op-create-edge', type: 'blocked-by' },
  { from: 'op-convert-gap-to-edge', to: 'op-create-edge-node', type: 'blocked-by' },
  { from: 'op-convert-gap-to-edge', to: 'op-create-decision', type: 'blocked-by' },
  { from: 'op-expand-edge-node', to: 'op-create-edge-node', type: 'blocked-by' },
  { from: 'op-expand-edge-node', to: 'op-create-gap', type: 'blocked-by' },
  { from: 'op-record-sensitivity', to: 'table-sensitivity-readings', type: 'blocked-by' },
  { from: 'op-record-tension', to: 'table-tension-readings', type: 'blocked-by' },

  // gdd-root contains these
  { from: 'foundation-tables', to: 'table-boards', type: 'contains' },
  { from: 'foundation-tables', to: 'table-sensitivity-readings', type: 'contains' },
  { from: 'foundation-tables', to: 'table-tension-readings', type: 'contains' },
  { from: 'foundation-tables', to: 'type-board-status', type: 'contains' },
  { from: 'foundation-tables', to: 'type-board-impact', type: 'contains' },
  { from: 'foundation-tables', to: 'type-tension-character', type: 'contains' },
];

// Seed edge node: the multi-board architecture vision
// Now created as a gdd.nodes row with type='edge-node'
const seedEdgeNode = {
  id: 'edge-multi-board-architecture',
  name: 'Multi-board / multi-instance architecture',
  content: 'The current system operates as a single board on a single instance. The vision of multiple boards spanning multiple GDD instances -- federated graphs, cross-instance edge nodes, distributed tension readings -- is a design boundary, not a gap to be filled. This edge marks where the current system ends and the next architectural epoch begins. Premature work here would couple the single-instance implementation to speculative federation patterns.',
  weight: 0.9,
  created_by: 'system',
};

async function populate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert nodes (ON CONFLICT updates build_instructions for existing installs)
    let inserted = 0;
    for (const node of nodes) {
      await client.query(q(`
        INSERT INTO gdd.nodes (id, type, name, description, test_condition, test_verification, build_instructions, board_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'default-board')
        ON CONFLICT (id) DO UPDATE SET build_instructions = EXCLUDED.build_instructions
      `), [node.id, node.type, node.name, node.description, node.test_condition ? q(node.test_condition) : null, node.test_verification ? q(node.test_verification) : null, node.build_instructions ? q(node.build_instructions) : null]);
      inserted++;
    }
    console.log(`Inserted/updated ${inserted} nodes.`);

    // Insert edges
    let edgesInserted = 0;
    for (const edge of edges) {
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

    // Insert seed edge node as a gdd.nodes row with type='edge-node'
    await client.query(q(`
      INSERT INTO gdd.nodes (id, type, name, notes, board_id, artifacts)
      VALUES ($1, 'edge-node', $2, $3, 'default-board', $4)
      ON CONFLICT (id) DO NOTHING
    `), [seedEdgeNode.id, seedEdgeNode.name, seedEdgeNode.content,
        JSON.stringify({ weight: seedEdgeNode.weight, created_by: seedEdgeNode.created_by })]);
    console.log('Inserted seed edge node: multi-board architecture vision.');

    // Record expressions on completed intents (tables and enums exist after migration)
    // table-edge-nodes and type-edge-node-status removed -- edge nodes are now gdd.nodes
    const completedIntents = [
      'table-boards', 'table-sensitivity-readings', 'table-tension-readings',
      'type-board-status', 'type-board-impact', 'type-tension-character',
    ];

    const exprId = 'expression-bootstrap-edge-boards';
    await client.query(q(`
      INSERT INTO gdd.nodes (id, type, name, description, artifacts, board_id)
      VALUES ($1, 'expression', $2, $3, $4, 'default-board')
      ON CONFLICT (id) DO NOTHING
    `), [exprId, 'Edge boards schema bootstrap', 'Bootstrap created board tables and enums via SQL migration. Edge nodes are now ordinary gdd.nodes with type edge-node.',
        JSON.stringify({ files: ['005-edge-boards-enums.sql', '006-edge-boards-tables.sql'] })]);

    for (const intentId of completedIntents) {
      const exists = await client.query(q('SELECT 1 FROM gdd.nodes WHERE id = $1'), [intentId]);
      if (exists.rows.length > 0) {
        const edgeExists = await client.query(
          q('SELECT 1 FROM gdd.edges WHERE from_node = $1 AND to_node = $2 AND edge_type = $3 AND superseded_by IS NULL'),
          [exprId, intentId, 'satisfies']
        );
        if (edgeExists.rows.length === 0) {
          await client.query(q(`
            INSERT INTO gdd.edges (from_node, to_node, edge_type)
            VALUES ($1, $2, 'satisfies')
          `), [exprId, intentId]);
        }
      }
    }
    console.log(`Recorded expression satisfying ${completedIntents.length} intents.`);

    await client.query('COMMIT');

    // Summary
    const nodeCount = await client.query(q('SELECT COUNT(*) FROM gdd.nodes'));
    const edgeCount = await client.query(q('SELECT COUNT(*) FROM gdd.edges'));
    const boardCount = await client.query(q('SELECT COUNT(*) FROM gdd.boards'));
    const edgeNodeCount = await client.query(q("SELECT COUNT(*) FROM gdd.nodes WHERE type = 'edge-node'"));
    console.log(`\nGraph: ${nodeCount.rows[0].count} nodes, ${edgeCount.rows[0].count} edges, ${boardCount.rows[0].count} boards, ${edgeNodeCount.rows[0].count} edge nodes (in gdd.nodes).`);

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
