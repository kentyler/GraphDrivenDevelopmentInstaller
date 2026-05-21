const { pool, q } = require('./db');

// P2P peer messaging intents -- sovereign instances exchanging messages about red intents via email
const nodes = [
  // Compose
  { id: 'peer-messaging', type: 'compose', name: 'P2P peer messaging', description: 'Sovereign GDD instances exchange structured messages about unsatisfied intents via email. No shared graph, no central server. Intelligence at the edges, dumb transport in the middle.', build_instructions: null },

  // Enums
  { id: 'type-peer-message-direction', type: 'define-type', name: 'Peer message direction enum', description: 'Direction of a peer message: sent or received.', test_condition: "Enum gdd.peer_message_direction exists with values: sent, received.", test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.peer_message_direction'::regtype", build_instructions: "CREATE TYPE gdd.peer_message_direction AS ENUM ('sent', 'received')." },
  { id: 'type-peer-message-type', type: 'define-type', name: 'Peer message type enum', description: 'Type of peer message: broadcast, response, add-peer, remove-peer.', test_condition: "Enum gdd.peer_message_type exists with values: broadcast, response, add-peer, remove-peer.", test_verification: "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'gdd.peer_message_type'::regtype", build_instructions: "CREATE TYPE gdd.peer_message_type AS ENUM ('broadcast', 'response', 'add-peer', 'remove-peer')." },

  // Table
  { id: 'table-peer-messages', type: 'define-table', name: 'Peer messages table', description: 'Stores sent and received peer messages with direction, type, peer reference, and optional linkage to original broadcasts.', test_condition: "Table gdd.peer_messages exists with columns: id, direction, message_type, peer_id, subject, content, linked_message_id, intent_ids, created_at.", test_verification: "SELECT * FROM information_schema.columns WHERE table_schema='gdd' AND table_name='peer_messages'", build_instructions: "CREATE TABLE gdd.peer_messages with columns: id (TEXT PK, default gen_random_uuid()::text), direction (gdd.peer_message_direction NOT NULL), message_type (gdd.peer_message_type NOT NULL), peer_id (TEXT), subject (TEXT NOT NULL), content (TEXT), linked_message_id (TEXT FK to gdd.peer_messages), intent_ids (TEXT[]), created_at (TIMESTAMP DEFAULT NOW()). Self-referential FK for linked_message_id enables response-to-broadcast linking." },

  // Operations
  { id: 'op-peer-directory', type: 'implement-operation', name: 'Peer directory', description: 'CRUD operations for the peer directory stored as peers.json at project root.', test_condition: "Can add, list, and remove peers. Missing file returns empty array. Duplicate peer id rejected.", test_verification: "Integration test with temp file: add peers, list, remove, verify.", build_instructions: "Implement loadPeers(), savePeers(peers), addPeer({id, name, email}), removePeer(peer_id), listPeers() that manage a peers.json file at project root. Handle ENOENT (missing file = empty array = P2P disabled). Validate id/name/email required for addPeer. Reject duplicate peer ids. Add peers.json to .gitignore." },
  { id: 'op-broadcast-red-nodes', type: 'implement-operation', name: 'Broadcast red nodes to peers', description: 'Send workable red intents to all peers via email. Abstracted descriptions only -- no edges or graph topology.', test_condition: "Returns {sent:0} with no peers. Returns {sent:0} with no red nodes. With peers and red nodes, sends emails and records in peer_messages.", test_verification: "Integration test: no peers returns 0, no red nodes returns 0. Email transport mocked for send test.", build_instructions: "Implement broadcastRedNodes({graph_id}) that sends workable red nodes to all peers via email. Steps: (1) loadPeers() -- return {sent:0} if empty, (2) create nodemailer transport from GDD_SMTP_* env vars -- return {sent:0} if no config, (3) queryIncomplete({workable:true, graph_id}) -- return {sent:0} if no red nodes, (4) abstract each node to {id, name, description, test_condition} -- no edges or topology, (5) send email to each peer with subject GDD:broadcast:<timestamp> and JSON body, (6) record each sent message in gdd.peer_messages. Dependencies: nodemailer, peerDirectory, queryIncomplete." },
  { id: 'op-receive-peer-messages', type: 'implement-operation', name: 'Receive peer messages via IMAP', description: 'Fetch unseen GDD: emails via IMAP, parse, and record in peer_messages table.', test_condition: "Returns {received:0} with no IMAP config. Parses GDD: subject correctly. Links responses to original broadcasts.", test_verification: "Integration test: no IMAP returns 0. Email parsing mocked for receive test.", build_instructions: "Implement receivePeerMessages() that fetches unseen GDD: emails via IMAP. Steps: (1) return {received:0} if no GDD_IMAP_HOST, (2) connect via imap-simple with GDD_IMAP_* config, (3) search UNSEEN with subject GDD:, markSeen, (4) parse each: extract message type from subject (GDD:broadcast|response|add-peer|remove-peer), match FROM to peer directory, (5) for responses: extract broadcast_ref from JSON body and link to original sent message, (6) insert into gdd.peer_messages. Dependencies: imap-simple, mailparser, peerDirectory." },
  { id: 'op-respond-to-peer-broadcast', type: 'implement-operation', name: 'Respond to peer broadcast', description: 'Search local graph for green nodes matching a received broadcast and reply with descriptions.', test_condition: "Responds with matching green nodes. Links response to broadcast. Returns {sent:false} if no matches or peer not found.", test_verification: "Integration test: create broadcast message, search with known green nodes, verify response linkage.", build_instructions: "Implement respondToPeerBroadcast(messageId) that responds to a received broadcast with matching local green nodes. Steps: (1) fetch broadcast from gdd.peer_messages, (2) parse red node descriptions from content, (3) search local graph for green nodes (have satisfies edge) with similar names/descriptions via LIKE match, (4) compose response JSON with matches, (5) send email to peer with subject GDD:response:<timestamp> and broadcast_ref in body, (6) record sent response in peer_messages linked to broadcast. Dependencies: nodemailer (via createTransport from broadcastRedNodes), peerDirectory." },
];

const edges = [
  // gdd-root contains peer-messaging
  { from: 'gdd-root', to: 'peer-messaging', type: 'contains' },

  // peer-messaging contains all children
  { from: 'peer-messaging', to: 'type-peer-message-direction', type: 'contains' },
  { from: 'peer-messaging', to: 'type-peer-message-type', type: 'contains' },
  { from: 'peer-messaging', to: 'table-peer-messages', type: 'contains' },
  { from: 'peer-messaging', to: 'op-peer-directory', type: 'contains' },
  { from: 'peer-messaging', to: 'op-broadcast-red-nodes', type: 'contains' },
  { from: 'peer-messaging', to: 'op-receive-peer-messages', type: 'contains' },
  { from: 'peer-messaging', to: 'op-respond-to-peer-broadcast', type: 'contains' },

  // Enums blocked by foundation
  { from: 'type-peer-message-direction', to: 'foundation-tables', type: 'blocked-by' },
  { from: 'type-peer-message-type', to: 'foundation-tables', type: 'blocked-by' },

  // Table blocked by its enums
  { from: 'table-peer-messages', to: 'type-peer-message-direction', type: 'blocked-by' },
  { from: 'table-peer-messages', to: 'type-peer-message-type', type: 'blocked-by' },

  // Operations blocked by their dependencies
  // op-peer-directory has no DB dependency (reads/writes peers.json)
  { from: 'op-broadcast-red-nodes', to: 'table-peer-messages', type: 'blocked-by' },
  { from: 'op-broadcast-red-nodes', to: 'op-peer-directory', type: 'blocked-by' },
  { from: 'op-broadcast-red-nodes', to: 'op-query-incomplete', type: 'blocked-by' },
  { from: 'op-receive-peer-messages', to: 'table-peer-messages', type: 'blocked-by' },
  { from: 'op-receive-peer-messages', to: 'op-peer-directory', type: 'blocked-by' },
  { from: 'op-respond-to-peer-broadcast', to: 'table-peer-messages', type: 'blocked-by' },
  { from: 'op-respond-to-peer-broadcast', to: 'op-peer-directory', type: 'blocked-by' },
  { from: 'op-respond-to-peer-broadcast', to: 'op-broadcast-red-nodes', type: 'blocked-by' },

  // MCP tools blocked by peer operations
  { from: 'mcp-tools', to: 'op-peer-directory', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-broadcast-red-nodes', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-receive-peer-messages', type: 'blocked-by' },
  { from: 'mcp-tools', to: 'op-respond-to-peer-broadcast', type: 'blocked-by' },
];

async function populate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert nodes
    let inserted = 0;
    for (const node of nodes) {
      await client.query(q(`
        INSERT INTO gdd.nodes (id, type, name, description, test_condition, test_verification, build_instructions)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET build_instructions = EXCLUDED.build_instructions
      `), [node.id, node.type, node.name, node.description, node.test_condition ? q(node.test_condition) : null, node.test_verification ? q(node.test_verification) : null, node.build_instructions ? q(node.build_instructions) : null]);
      inserted++;
    }
    console.log(`Inserted/updated ${inserted} peer messaging nodes.`);

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
    console.log(`Inserted ${edgesInserted} peer messaging edges.`);

    // Record bootstrap expression satisfying peer DDL intents created by SQL
    const bootstrapCompleted = [
      'type-peer-message-direction', 'type-peer-message-type', 'table-peer-messages',
    ];
    const bootstrapExprId = 'expression-bootstrap-peer-schema';
    await client.query(q(`
      INSERT INTO gdd.nodes (id, type, name, description, artifacts)
      VALUES ($1, 'expression', $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `), [
      bootstrapExprId,
      'Peer messaging schema bootstrap',
      'Bootstrap created peer message enums and table via SQL migration.',
      JSON.stringify({ files: ['015-peer-messages.sql'] }),
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
    console.log(`Recorded bootstrap expression satisfying ${bootstrapCompleted.length} peer DDL intents.`);

    // Register peer-network agent
    await client.query(q(`
      INSERT INTO gdd.agents (id, name, scope, trust_level, trigger, status)
      VALUES ('peer-network', 'Peer Network',
        '{"type":"p2p","description":"Sovereign GDD instances exchanging messages about red intents via email"}',
        'gaps-only', '{"type":"manual"}', 'defined')
      ON CONFLICT (id) DO NOTHING
    `));
    console.log('Registered peer-network agent.');

    await client.query('COMMIT');
    console.log('Peer messaging population complete.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Peer messaging population failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

populate();
