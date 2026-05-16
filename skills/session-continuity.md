# Session Continuity

LLM actors arrive without context. The graph solves this with supersede chains — each session creates a new intent that supersedes the previous one.

## The mechanism

Each actor gets a chain of intents starting with `session-context-{actor-id}`. Each session creates a new intent (e.g. `session-context-claude-code-20260429T1430`) with an expression recording the session's work, then supersedes the previous tip. The non-superseded node is always the current bookmark.

The `/api/current` endpoint finds the tip of the chain: it queries for nodes matching an ID pattern that have no incoming `supersedes` edge.

## Startup routine

An arriving LLM's first actions:

```
GET /api/current?pattern=session-context-{actor-id}
```

This returns the non-superseded node(s). Take the returned node's ID and project from it:

```
GET /api/projection/{id}/llm
```

The response contains the current bookmark intent, its expression (the last session's summary), and any gaps or decisions in the neighborhood. The actor reads the expression's artifacts and is oriented.

### Multiple tips

If `/api/current` returns more than one node, previous sessions exited abnormally (no supersede edge was written). This is honest, not broken — it means multiple sessions ran without cleanly handing off. The arriving LLM reconciles the tips: read each projection, merge the context, then create a single new intent that supersedes all of them.

## Session end routine

At session end, the actor:

1. Notes the current tip's ID (from startup)
2. Creates a new intent with a timestamped ID:

```
POST /api/intents
{
  "id": "session-context-{actor-id}-{timestamp}",
  "type": "implement-operation",
  "name": "Session continuity for {actor-id} — {date}",
  "description": "Bookmark for {actor-id} session on {date}. Supersedes previous bookmark.",
  "test_condition": "{actor-id} projecting from this node can state current project status, identify next task, and list open questions without reading any other source."
}
```

3. Records an expression on the new intent:

```
POST /api/expressions
{
  "name": "Session {date}: {headline}",
  "description": "{narrative of what happened}",
  "intent_ids": ["session-context-{actor-id}-{timestamp}"],
  "artifacts": {
    "actor": "{actor-id}",
    "session_date": "{date}",
    "project": "{project}",
    "completed": ["..."],
    "next": ["..."],
    "open_questions": ["..."]
  }
}
```

4. Supersedes the previous tip:

```
POST /api/supersede
{
  "old_id": "{previous-tip-id}",
  "new_id": "session-context-{actor-id}-{timestamp}"
}
```

After supersession, `/api/current?pattern=session-context-{actor-id}` returns only the new node.

## Per-actor scoping

Session context is scoped per actor, not shared. Each actor maintains its own supersede chain:

- `session-context-claude-code` → `session-context-claude-code-20260429T1430` → ...
- `session-context-ken` → `session-context-ken-20260429T1500` → ...

This prevents interleaving. An arriving actor reads only its own chain tip.

## Creating the initial session-context intent

When an actor first connects and `/api/current?pattern=session-context-{actor-id}` returns empty, create the root:

```
POST /api/intents
{
  "id": "session-context-{actor-id}",
  "type": "implement-operation",
  "name": "Session continuity for {actor-id} actor",
  "description": "An arriving {actor-id} instance projects from this intent to recover its working context.",
  "test_condition": "{actor-id} projecting from this node can state current project status, identify next task, and list open questions without reading any other source."
}
```

This becomes the first tip. The first session end will create a timestamped successor and supersede it.

## Team-level view

A team gets a graph (in `gdd.graphs`) whose members are the `session-context-*` chain tips of all actors on the team, plus the team's own `session-context-team-{project}` bookmark.

Querying the team graph gives the full picture: where the project stands and what each individual is doing.

## No new machinery

This mechanism uses only existing graph primitives — intents, expressions, satisfies edges, supersedes edges, graphs. No new node types, no special tables. The graph already knows how to do this.

## Working-intent tracking

A simpler complement to the session bookmark pattern: file-based state tracking for the current focus within a session.

Three MCP tools manage a "working intent" -- the intent the actor is currently focused on:

- **`select_working_intent`** — sets the current focus to a specific intent ID. Writes to a JSON file on disk.
- **`get_working_intent`** — reads the current focus. Returns the intent ID or null if none is set.
- **`clear_working_intent`** — removes the current focus.

This is not graph state -- it is ephemeral session state stored in a local file. It answers the narrower question "what am I working on right now?" rather than the broader question the session bookmark answers ("what is the full context of my ongoing work?"). The two mechanisms coexist: the working intent tracks intra-session focus, the session bookmark tracks inter-session continuity.
