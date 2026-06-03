-- Boards and observation tables.
-- Edge nodes are now ordinary gdd.nodes with type='edge-node'.
-- expansion_events and conversion_events removed: those transitions are
-- expressed as graph topology (decision nodes with closes edges, gap nodes
-- with refines edges). The graph is its own history.

CREATE TABLE gdd.boards (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT,
  name TEXT,
  statement TEXT,
  status gdd.board_status NOT NULL DEFAULT 'active'
);

-- Sensitivity readings observe edge node behavior over time.
-- edge_node_id references gdd.nodes (type='edge-node'), not a separate table.
CREATE TABLE gdd.sensitivity_readings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  edge_node_id TEXT NOT NULL REFERENCES gdd.nodes(id),
  read_at TIMESTAMP DEFAULT NOW(),
  read_by TEXT,
  signal TEXT,
  board_impact gdd.board_impact
);

-- Tension readings observe board-level stress.
-- Optional edge_node_id references gdd.nodes.
CREATE TABLE gdd.tension_readings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  board_id TEXT NOT NULL REFERENCES gdd.boards(id),
  read_at TIMESTAMP DEFAULT NOW(),
  read_by TEXT,
  signal TEXT,
  edge_node_id TEXT REFERENCES gdd.nodes(id),
  tension_character gdd.tension_character
);

-- Add board_id to existing nodes table (primary board -- backward compatible)
ALTER TABLE gdd.nodes ADD COLUMN IF NOT EXISTS board_id TEXT REFERENCES gdd.boards(id);

-- Many-to-many node-board participation (grammar: nodes can participate in multiple boards)
CREATE TABLE gdd.node_board_memberships (
  node_id TEXT NOT NULL REFERENCES gdd.nodes(id),
  board_id TEXT NOT NULL REFERENCES gdd.boards(id),
  UNIQUE(node_id, board_id)
);
