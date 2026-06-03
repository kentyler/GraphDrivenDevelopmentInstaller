-- Layer 0: Enums (type-node-type, type-edge-type, type-agent-trust, type-agent-status)

CREATE TYPE gdd.node_type AS ENUM (
  'define-table',
  'define-type',
  'define-schema',
  'implement-operation',
  'implement-endpoint',
  'implement-traversal',
  'implement-projection',
  'implement-mutation',
  'integrate',
  'derive',
  'translate',
  'constrain-permission',
  'constrain-invariant',
  'establish-convention',
  'define-vocabulary',
  'compose',
  'gap',
  'decision',
  'signal',
  'expression',
  'axiom',
  -- Grammar inscription kinds (added for grammar conformance)
  'actor',
  'projection',
  'retro-projection',
  'commentary'
);

CREATE TYPE gdd.edge_type AS ENUM (
  'blocked-by',
  'contains',
  'tensions-with',
  'refines',
  'supersedes',
  'closes',
  'satisfies',
  -- Grammar relation kinds (added for grammar conformance)
  'depends-on',
  'tested-by',
  'participates-in',
  'contradicts',
  'clarifies',
  'makes-readable',
  'obscures',
  'marks-edge',
  'projects-as',
  'projects-to',
  'retro-projects',
  'interprets-as',
  'infers-intent',
  'infers-test',
  'infers-gap',
  'infers-decision',
  'signals',
  'authorizes',
  'expresses',
  'comments-on'
);

CREATE TYPE gdd.agent_trust AS ENUM (
  'full',
  'express-only',
  'gaps-only'
);

CREATE TYPE gdd.agent_status AS ENUM (
  'defined',
  'active',
  'paused'
);
