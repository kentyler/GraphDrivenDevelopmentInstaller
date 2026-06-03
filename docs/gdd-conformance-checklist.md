# GDD Conformance Checklist

Use this checklist to evaluate whether a candidate implementation remains a faithful expression of Graph-Driven Development.

This checklist is not a database schema or implementation plan. It is a practical companion to:

- `docs/gdd-invariants.md`
- `docs/gdd-logical-graph-grammar.md`

A failed answer is not automatically a rejection. It should usually become a gap, tension, refinement, decision, or proposed supersession.

## Checklist

1. Does the system preserve a shared graph-like inscription surface rather than reducing work to a task list?
2. Does it optimize internal structure for LLM reasoning while projecting human-usable views?
3. Does it treat the graph as non-representational and incomplete rather than as a model of the whole situation?
4. Does it preserve append-only topology through supersession and explicit change rather than hidden mutation?
5. Does it reason through boards rather than a privileged whole-graph view?
6. Does it allow board edges to emerge from incompleteness?
7. Does it avoid predetermined levels of granularity?
8. Does it distinguish intents from tasks?
9. Does it require tests or evaluable conditions for satisfaction?
10. Does it distinguish satisfaction from board-relative readability?
11. Does it admit gaps and unreadability without treating them as failures?
12. Does it treat agents as scoped actors rather than workflow owners?
13. Does it allow nonhuman and non-LLM actors to become graph-significant?
14. Does it support graph-to-system projection without treating projection as deterministic?
15. Does it support artifact-to-graph retro-projection without treating it as requirements extraction?
16. Does it allow multiple systems to express the same graph?
17. Does it allow multiple graphs to read the same system?
18. Does it treat an intent graph as a portable compressed application form without treating decompression as reproduction?
19. Does it treat value as a board activity rather than a global graph property?
20. Does it leave expression-layer choices open while preserving the invariants?

## Migration-specific questions

1. Does migration proceed as `old system → retro-projected graph(s) → selected board → new system expression`, rather than `old system → new system`?
2. Does reverse engineering produce situated graph readings rather than a single supposed requirements graph?
3. Does the migration preserve old artifacts as evidence without forcing them to govern the new expression?
4. Does the new expression satisfy selected intents rather than merely copy existing screens, tables, and workflows?

## Agent-specific questions

1. Is the agent a scoped actor rather than the owner of the workflow?
2. Are scope, trust, mode, projection contract, write contract, and verification relation explicit?
3. Is the agent's private plan or memory kept subordinate to graph inscriptions?
4. Are agent actions recorded as admissible inscriptions, expressions, decisions, gaps, or signals?

## Projection-specific questions

1. Is every projection tied to a board, purpose, audience, and register?
2. Is there any whole-graph projection being treated as privileged?
3. Can a human projection differ from an LLM projection while referring to the same inscriptions?
4. Can a node be readable on one board and unreadable on another?

