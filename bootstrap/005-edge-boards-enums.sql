-- Boards: enums (type-board-status, type-board-impact, type-tension-character)
-- Edge node status enum removed: edge nodes are now gdd.nodes with type='edge-node'.
-- Status is derived from topology (superseded, expanded via refines edges) or stored in artifacts.

CREATE TYPE gdd.board_status AS ENUM (
  'active',
  'dormant',
  'superseded'
);

CREATE TYPE gdd.board_impact AS ENUM (
  'stable',
  'shifting',
  'reorganizing'
);

CREATE TYPE gdd.tension_character AS ENUM (
  'generative',
  'destabilizing',
  'expansionary'
);
