# Introduction

Intent graphs represent the field of work in a form LLMs can reason over.

GDD begins from a simple distinction: a task says what someone plans to do; an intent says what must become true. The same intent may be expressible through many different tasks, artifacts, procedures, or systems. A test constrains that possibility space by specifying what would count as a satisfactory expression of the intent. Actions then produce artifacts — code, documents, schemas, interfaces, procedures, reports, workflows — and those artifacts are tested to determine whether they actually express one or more intents.

An artifact is not an expression merely because it was produced. It becomes an expression only when it satisfies the intent's test.

## The graph as shared ground

The graph is common ground, written in the native language of LLMs.

Humans and LLMs do not need to encounter the graph in the same form. Humans may prefer task lists, dashboards, diagrams, reports, calendars, roadmaps, or narratives. LLMs can reason over denser relational context: nodes, edges, tests, expressions, gaps, decisions, supersessions, boards, and edge conditions.

The graph is the shared substrate from which these different projections can be produced. Human-facing views are projections from the graph, not replacements for it.

## The graph as agencement

The graph is not a representation of the work. It is an agencement: a situated arrangement of heterogeneous actors, inscriptions, artifacts, tests, gaps, decisions, expressions, signals, boards, and edge conditions through which work becomes locally reason-able.

The graph does not stand outside the situation it helps organize. It is one of the artifacts through which the situation is arranged, contested, extended, and acted upon.

This is why the graph has no duty to be complete, comprehensive, balanced, current in every respect, or adequate to the whole. The situation always exceeds the graph. The graph contains only what has become relevant enough to inscribe.

## Boards and edges

No one plays the whole graph.

The graph may accumulate inscriptions globally, but reasoning occurs on boards: limited fields of play that make some region of the graph actionable, interpretable, and contestable.

A board is not a project, department, product, category, or fixed container, although human projections may render it that way. A board is a situated arrangement of intents, expressions, gaps, decisions, axioms, tensions, actors, and edge nodes.

Boards are bounded by what they cannot yet contain. The edge of a board appears where its actors encounter something that matters to the work but cannot be fully resolved inside the board: an external dependency, an incompatible axiom, a cross-board relation, a persistent tension, an unarticulated intent, or a gap that should not be collapsed into ordinary work.

## Append-only present topology

The graph is append-only. Nodes and edges are not rewritten into new meanings and are not deleted as ordinary operations. Change is expressed by adding graph structure: supersession, refinement, satisfaction, closure, contradiction, tension, decision, signal, edge node, or gap.

The graph does not maintain a separate history layer. It is its own history. What is current is derived from topology, not from an external log.

The graph also does not model future states. If something needs to exist, it is a red intent now. If it cannot yet be articulated, it is a gap now. If it depends on other work, it is blocked now. What appears as the future is only the topology of present incompleteness.

## Readability

Satisfaction and readability are different.

Satisfaction asks whether an expression passes a test. Readability asks whether an inscription can currently be interpreted as a meaningful move within a board: what it bears on, what it enables, what it blocks, what it contests, what it exposes, or why it remains present.

A stone becomes readable on the board.

A node may be green but unreadable, red but readable, untested but readable, readable on one board and unreadable on another, or unreadable now but readable later. Because the graph is append-only, unreadability is not repaired by rewriting the earlier inscription. It is repaired by adding new inscriptions: clarification, commentary, gap, refinement, projection, edge condition, decision, or supersession.

## Projection and retro-projection

A graph can make a system; a system can suggest many graphs.

A graph may project expressions: artifacts, systems, procedures, interfaces, schemas, documents, routines, reference implementations, or other concrete productions that satisfy its intents. This projection is not deterministic. Multiple systems may faithfully express the same graph.

A working system may also be retro-projected into one or more graphs. Retro-projection infers a playable graph of intents, expressions, gaps, decisions, constraints, tests, and actors from an existing artifact or system.

Retro-projection is not extraction of the artifact's true meaning. A single working system may support multiple retro-projected graphs depending on the board from which it is read and the activity being played.

## Portability

Intent graphs make applications portable across technologies, organizations, and LLM generations.

The graph is the zip file; the application is one decompression.

A working application includes code, schema, UI, workflows, reports, permissions, deployment assumptions, local habits, and operational conventions. These artifacts are expressions. They may be difficult to move directly into a new environment.

A retro-projected intent graph can compress those artifacts into a portable field of intents, tests, expressions, decisions, gaps, actors, boards, and edge relations. The graph is not a complete representation of the application. It is a playable package from which new expressions may be projected.

Migration is therefore not direct translation:

```text
old system → new system
```

It is graph-mediated transformation:

```text
old system → retro-projected graph(s) → selected board → new system expression
```

## Instructions, not application

This project is offered not as an already constructed artifact, but as a set of instructions and reference expressions that LLMs can use to construct graph-driven infrastructure.

The invariant binds; the expression is free. The included PostgreSQL/Node/MCP path is a current reference expression, not the constitutional form of GDD.
