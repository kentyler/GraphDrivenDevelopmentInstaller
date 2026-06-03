# GDD Logical Graph Grammar

## Status of this document

This document is not the constitution of Graph-Driven Development (GDD), and it is not a database schema.

The constitutional layer is the GDD invariants. The invariants define what must remain true across any faithful graph system.

This document is a second-layer grammar: a current proposal for the minimal logical vocabulary needed to express those invariants in graph form. It names the kinds of inscriptions, relations, derived states, and projections that a GDD system should probably support.

A concrete implementation may express this grammar through relational tables, RDF triples, property graphs, append-only ledgers, documents, files, object stores, or another substrate. Those choices belong to the expression layer. This grammar should constrain such choices without predetermining them.

The grammar is therefore binding only in a limited sense: a faithful implementation must preserve the capabilities described here, but it may express them differently if it preserves the invariants and can explain the substitution.

---

# 1. Foundational distinction

The graph is an inscription surface, not a representation of a situation.

The graph does not attempt to model the whole work, the current state, the past state, or the future state. It accumulates inscriptions that make some field of work reason-able by human and nonhuman actors.

The grammar therefore does not define a complete ontology of reality. It defines a set of graph moves by which actors can inscribe intentions, expressions, gaps, decisions, tests, boards, edges, and projections.

The logical unit of the grammar is the **inscription**.

---

# 2. Inscription

An inscription is anything that enters the graph as a durable graph-significant element.

An inscription must have:

```text
id
kind
human label or name
LLM-readable description
optional human-orienting summary
optional board participation
optional provenance
```

An inscription should not rely on mutable hidden state for its meaning. If its meaning changes, the change should be expressed through additional inscriptions and relations.

The grammar recognizes the following primary inscription kinds:

```text
Intent
Expression
Test
Gap
Decision
Signal
Board
Edge Node
Axiom
Actor
Projection
Retro-projection
Commentary
```

This list is not a final ontology. It is a current grammar. Future systems may refine, merge, split, or supersede these kinds if the invariants remain satisfied.

---

# 3. Intent

An **Intent** names something that must become true.

An intent is not a task. A task says what someone plans to do. An intent says what condition must be satisfied.

An intent may exist at any granularity. The grammar does not impose levels such as mission, goal, project, epic, story, task, or subtask.

An intent may be:

```text
tested
untested
satisfied
unsatisfied
blocked
workable
readable
unreadable
superseded
current
```

These are derived conditions, not necessarily stored statuses.

An intent should minimally include:

```text
id
name
description
optional test relation
optional board participation
optional notes or orientation text
```

An intent becomes satisfied only when an expression satisfies an applicable test.

An untested intent may exist. It records a recognized need whose success condition is not yet articulable.

---

# 4. Expression

An **Expression** is an artifact, act, configuration, document, procedure, code change, schema, message, design, or other produced thing that may satisfy one or more intents.

An expression does not satisfy an intent merely because it was produced. It satisfies an intent only through a satisfaction relation evaluated against a test.

An expression should minimally include:

```text
id
name
description
artifact reference or artifact body
actor or source, if known
optional board participation
```

An expression may satisfy multiple intents.

An intent may be satisfied by multiple expressions, either cooperatively or through alternative expressions.

An expression may initially be unlinked. An unlinked expression records production without yet claiming satisfaction.

---

# 5. Test

A **Test** names the condition under which an expression counts as satisfying an intent.

A test may be:

```text
formal
procedural
inspectable
human-judged
LLM-evaluated
external-system-evaluated
```

A test should minimally include:

```text
id or embedded identity
condition
verification method
scope of applicability
```

A system may implement tests as separate nodes, fields on intent nodes, relations, executable checks, human judgments, or hybrid structures. The grammar requires the capability, not a single representation.

Tests make satisfaction legible. Nothing turns green without a test or evaluable satisfaction condition.

Changing a test should not silently mutate the old test. It should be handled through supersession, refinement, or another explicit graph relation.

---

# 6. Gap

A **Gap** records an inability to articulate, evaluate, connect, or proceed.

A gap is not a failure. It is a first-class inscription of incompleteness.

A gap may indicate:

```text
an intent cannot yet be named
a test cannot yet be formulated
a relation cannot yet be determined
an expression cannot yet be evaluated
a board edge has been encountered
a node has become unreadable in the current board
an actor cannot proceed safely
```

A gap should minimally include:

```text
id
name
notes
context or board
what could not be articulated or resolved
```

A gap may later be closed by a decision, refined into an intent, converted into an edge node, or left open as a persistent incompleteness.

---

# 7. Decision

A **Decision** records a closure, commitment, interpretation, or governing choice.

A decision may:

```text
close a gap
authorize an expression
select among alternatives
supersede a prior inscription
establish an axiom
clarify readability
define a board boundary
```

A decision should minimally include:

```text
id
name
description
notes or rationale
actor or source, if known
relations to what it closes, supersedes, authorizes, or clarifies
```

A decision is not merely a note. It changes the playable arrangement by making some relation, closure, or commitment explicit.

---

# 8. Signal

A **Signal** records an event, observation, interruption, external change, system output, user behavior, market movement, failure, test result, or other field disturbance.

A signal may come from:

```text
human actor
LLM actor
software system
test runner
CI pipeline
database
customer
vendor
regulator
peer graph
artifact
deadline
failure
environment
```

A signal should minimally include:

```text
id
name
description
source or actor, if known
observed content
board or context, if applicable
```

A signal may trigger creation of intents, gaps, decisions, expressions, tensions, or edge nodes.

Signals allow non-reasoning actors to become graph-significant.

---

# 9. Board

A **Board** is a limited field of play.

A board is not a project, category, department, product, or fixed container, although human projections may render it that way.

A board is a situated arrangement of inscriptions that makes some region of the graph actionable, interpretable, and contestable.

A board should minimally include:

```text
id
name
orientation statement
participating inscriptions
active axioms or constraints
edge nodes
optional actors or permissions
```

The graph may accumulate globally, but no one plays the whole graph. Reasoning occurs through boards.

A board is not a slice of a prior whole. It is the condition under which some part of the graph becomes playable.

---

# 10. Edge Node

An **Edge Node** marks a board boundary discovered through incompleteness.

An edge node is not simply an unresolved task. It records something the board must keep in view without prematurely resolving.

An edge node may arise from:

```text
a gap that should not be collapsed into ordinary work
an external dependency
an incompatible axiom
a cross-board relation
a persistent tension
an uncontained actor
a domain boundary
a question that cannot yet be internalized
```

An edge node should minimally include:

```text
id
name
description
board
source gap or signal, if any
related inscriptions
current interpretation
```

An edge node may later be expanded into interior work, converted into another board relation, superseded, or left as a persistent boundary condition.

---

# 11. Axiom

An **Axiom** is a governing claim that constrains play on a board.

An axiom is not necessarily universal. It may be local to a board, provisional, contested, or superseded.

An axiom may:

```text
establish a rule of admissible expression
constrain interpretation
define a board posture
shape tests
limit actors
make certain moves impermissible
```

An axiom should minimally include:

```text
id
name
claim
board or scope
rationale or notes
```

The GDD invariants exist conceptually before any particular graph and are not required to be inscribed as axioms in the first graph they help produce. But particular graph systems may choose to represent local governing claims as axioms.

---

# 12. Actor

An **Actor** is anything that can affect the graph-significant field.

Not every actor reasons. Some actors judge, build, test, signal, constrain, disturb, authorize, or force decisions.

Actor kinds may include:

```text
Human
LLM Agent
Software System
Test Runner
CI Pipeline
Database
Customer
Vendor
Regulator
Peer Graph
Artifact
Deadline
Failure
Market Condition
Environmental Condition
```

An actor inscription should minimally include:

```text
id
name
actor kind
scope or jurisdiction, if applicable
trust level or authority, if applicable
mode of participation
```

LLM agents are actors, not owners. Their private memory, scratchpad, plan, or tool state is not the source of truth. What matters constitutionally is what they inscribe.

---

# 13. Projection

A **Projection** is a situated rendering of some graph region for some actor and purpose.

A projection is not the graph itself. It is a view produced from the graph.

Projection kinds may include:

```text
LLM-native projection
human-orienting projection
task list
dashboard
board view
timeline
roadmap
valuation view
risk view
dependency view
readability view
agent work queue
system expression
reference expression
```

A projection should specify:

```text
vantage point
board or scope
actor or audience
purpose
included inscriptions
excluded or hidden inscriptions, if known
rendering register
```

A projection may be recorded as an inscription when it affects subsequent work, but ordinary projections need not all become graph nodes.

There is no privileged whole-graph projection.

---

# 14. Projection and retro-projection

**Human form:**  
A graph can make a system; a system can suggest many graphs.

Projection and retro-projection are paired operations, but neither is deterministic and neither produces a final representation.

A graph may project expressions: artifacts, systems, procedures, interfaces, schemas, documents, routines, reference implementations, or other concrete productions that satisfy its intents.

A working artifact or system may also be retro-projected into a graph. Retro-projection infers a playable graph of intents, expressions, gaps, decisions, constraints, tests, and actors from an existing artifact or system.

Projection asks how a graph may become expressed.

Retro-projection asks how an artifact may become readable as graph.

---

## 14.1 Projection

Projection is the operation by which a graph produces, guides, or constrains an expression.

A projection may produce:

```text
software system
schema
interface
document
workflow
test suite
organizational routine
message
decision memo
reference implementation
```

Projection begins from a board or graph region, not from the whole graph.

Projection asks:

```text
Which intents are currently in play?
Which tests determine satisfaction?
Which gaps must remain visible?
Which axioms constrain expression?
Which actors or systems are authorized to act?
Which edge nodes mark boundaries that should not be collapsed?
Which expressions already exist and should be preserved, superseded, or refined?
```

Projection is not deterministic. The same graph region may project multiple faithful expressions.

A projected expression is faithful when it satisfies the relevant intents, preserves the governing invariants, and makes its departures from prior expressions explicit.

---

## 14.2 Retro-projection

Retro-projection is the operation by which an existing artifact or system is read back into a graph.

A retro-projection may begin from:

```text
working application
legacy database
spreadsheet
codebase
business process
document set
user interface
reports
conversation history
organizational routine
```

Retro-projection asks:

```text
What intents does this artifact appear to express?
What tests are implicit in its working use?
What actors does it organize?
What decisions are sedimented in it?
What gaps does it hide?
What dependencies does it reveal?
What constraints or axioms does it assume?
What boards could make this artifact readable?
```

Retro-projection is not extraction of the artifact’s true meaning. A single artifact may support multiple retro-projected graphs.

For example, the same legacy application may be retro-projected as:

```text
data-entry graph
reporting graph
compliance graph
workflow coordination graph
customer-service graph
migration-risk graph
throughput-constraint graph
user-habit graph
```

None of these is automatically the true graph. Each is a playable reading produced from a board.

---

## 14.3 Non-uniqueness

Projection and retro-projection are both non-unique.

One graph may produce many systems.

One system may suggest many graphs.

Therefore, neither operation should be treated as a translation between equivalent forms. A graph is not simply “requirements,” and a system is not simply “implementation.” A system is an expression of some graph reading, and a graph is an arrangement that can produce or read expressions.

The grammar must therefore allow competing projections and retro-projections to coexist.

---

## 14.4 Retro-projection as inscription

A retro-projection should be recorded as an inscription when it affects future work.

A retro-projection inscription should include:

```text
id
name
source artifact or system
board from which the artifact is being read
purpose of retro-projection
inferred intents
inferred expressions
inferred tests
inferred actors
inferred gaps
inferred decisions
confidence or uncertainty notes
```

The retro-projection should not overwrite the artifact or claim final authority over it. It should become one graph-readable interpretation.

A retro-projection may be contested, refined, superseded, compared with another retro-projection, or used to govern a future projection.

---

## 14.5 Relations introduced by projection and retro-projection

The grammar may support relations such as:

```text
projects-to
projected-from
retro-projects
retro-projected-from
interprets-as
infers-intent
infers-test
infers-gap
infers-decision
expressed-by
contests-projection
supersedes-projection
```

A concrete implementation may choose different relation names, but it must preserve the ability to distinguish:

```text
an intent that directly governs a produced expression
an expression that satisfies an intent
a graph inferred from an existing artifact
a competing graph inferred from the same artifact
a later refinement or supersession of a projection
```

---

## 14.6 Projection quality

A projection should be evaluated by asking:

```text
Does the resulting artifact satisfy the relevant intents?
Does it preserve the board’s active axioms?
Does it avoid collapsing edge nodes into premature work?
Does it make gaps visible rather than hiding them?
Does it preserve append-only trace through explicit decisions and supersessions?
Does it remain readable to the actors who must use or judge it?
```

---

## 14.7 Retro-projection quality

A retro-projection should be evaluated by asking:

```text
Does it make the artifact more readable on the chosen board?
Does it distinguish observed artifact behavior from inferred intent?
Does it preserve uncertainty as gaps rather than pretending certainty?
Does it allow alternative readings?
Does it avoid treating the artifact as a complete representation of its original situation?
Does it produce a graph that can guide future expression, migration, repair, critique, or redesign?
```

---

## 14.8 Legacy migration implication

In migration work, retro-projection comes before projection.

The existing artifact is first read into one or more possible graphs. Those graphs are then compared, contested, refined, or merged. Only then does the system project a new expression.

Migration is therefore not direct translation:

```text
old system → new system
```

It is a graph-mediated transformation:

```text
old system → retro-projected graph(s) → selected board → new system expression
```

This protects migration work from assuming that the existing artifact contains a single recoverable set of requirements.

---

## 14.9 Portability: intent graph as compressed application form

**Human form:**  
The graph is the zip file; the application is one decompression.

An intent graph may function as a portable compressed form of an application.

A working application includes code, schema, UI, workflows, reports, permissions, deployment assumptions, local habits, and operational conventions. These artifacts are expressions. They may be difficult to move directly into a new environment.

A retro-projected intent graph can compress those artifacts into a portable field of intents, tests, expressions, decisions, gaps, actors, boards, and edge relations. This graph is not a complete representation of the application. It is a playable package from which new expressions may be projected.

Portability does not mean reproducing the same application. A portable intent graph may project different systems in different environments while preserving the governing intents, satisfaction conditions, board boundaries, and unresolved gaps.

Therefore, migration, cloning, modernization, adaptation, and reimplementation should be understood as graph-mediated operations:

```text
old application → retro-projected graph package → target-board projection → new expression
```

The graph is the portable form. The application is one expression.

---

# 15. Commentary

**Commentary** is interpretive material that helps actors understand inscriptions without changing their satisfaction state.

Commentary may:

```text
clarify a node
explain a decision
interpret a board
make a node readable
record disagreement
orient a human actor
prepare an LLM actor
```

Commentary should not silently replace the inscription it comments on. If commentary changes the operative meaning of an inscription, that change should be expressed through refinement, decision, supersession, or another explicit relation.

---

# 16. Core relation types

The grammar requires typed relations among inscriptions.

A relation should minimally include:

```text
id
relation kind
from inscription
to inscription
optional description
optional board or scope
optional actor or provenance
```

The core relation kinds are:

```text
satisfies
tested-by
blocked-by
depends-on
contains
participates-in
refines
supersedes
closes
tensions-with
contradicts
clarifies
makes-readable
obscures
marks-edge
projects-as
projects-to
retro-projects
interprets-as
infers-intent
infers-test
infers-gap
signals
authorizes
expresses
```

A concrete implementation may use fewer primitive edge types if it can derive the same logical relations without ambiguity.

---

# 17. Satisfaction relations

The **satisfies** relation connects an expression to an intent.

```text
Expression satisfies Intent
```

Satisfaction is valid only relative to a test or evaluable condition.

A satisfied intent is green.

An unsatisfied intent is red.

Red/green is derived from satisfaction topology, not stored as an authoritative mutable field.

---

# 18. Test relations

The **tested-by** relation connects an intent to a test.

```text
Intent tested-by Test
```

A system may embed tests inside intents rather than representing them as separate nodes. Even then, the logical relation must exist.

Changing the test should be explicit. A new test may refine, supersede, or replace an old test, but the earlier test should remain recoverable as an inscription or prior condition.

---

# 19. Dependency relations

The **blocked-by** or **depends-on** relation connects an intent to another inscription that must be resolved, satisfied, clarified, or otherwise addressed before the intent becomes workable.

```text
Intent blocked-by Intent
Intent blocked-by Gap
Intent blocked-by Decision
Intent blocked-by Signal
Intent blocked-by Edge Node
```

A blocked intent may still be readable.

A workable intent is red but has no unsatisfied blocking dependencies.

Workability is derived from dependency topology.

---

# 20. Composition and participation relations

The **contains** relation may express structural grouping.

The **participates-in** relation expresses board participation.

```text
Board contains or includes Inscription
Inscription participates-in Board
```

Composition should not imply that the board represents a whole. Board membership is a situated relation, not a claim of complete containment.

An inscription may participate in multiple boards.

---

# 21. Refinement relations

The **refines** relation connects a more specific inscription to a broader or less articulated one.

```text
Intent refines Intent
Test refines Test
Decision refines Decision
Gap refines Gap
Retro-projection refines Retro-projection
```

Refinement is not mutation. The earlier inscription remains. The new inscription gives it a more specific playable expression.

Refinement may change readability without changing satisfaction.

---

# 22. Supersession relations

The **supersedes** relation marks one inscription or relation as no longer current.

```text
New Inscription supersedes Old Inscription
New Relation supersedes Old Relation
New Retro-projection supersedes Old Retro-projection
```

Supersession is the primary way the graph changes without hidden mutation.

A superseded inscription remains in the graph. It may be hidden from ordinary current projections but must remain recoverable.

Currentness is derived from supersession topology.

---

# 23. Closure relations

The **closes** relation connects a decision, expression, or later inscription to a gap or unresolved matter.

```text
Decision closes Gap
Expression closes Gap
Decision closes Edge Condition
```

Closing a gap does not erase the gap. It records that the board now has a way to proceed.

A closed gap may still remain historically or interpretively important.

---

# 24. Tension and contradiction relations

The **tensions-with** relation marks productive or unresolved pressure between inscriptions.

The **contradicts** relation marks stronger incompatibility.

```text
Intent tensions-with Intent
Axiom tensions-with Intent
Board tensions-with Board
Expression contradicts Axiom
Test contradicts Test
Retro-projection tensions-with Retro-projection
```

Tension is not necessarily an error. It may be the source of board movement.

Contradiction may require a gap, decision, refinement, split, or supersession.

---

# 25. Readability relations

Readability is board-relative and retroactive.

A node’s meaning is not determined only by its own fields. It is determined by the board on which it is played and by later inscriptions that change what earlier inscriptions can be seen to have done.

Relevant relations may include:

```text
clarifies
makes-readable
obscures
reframes
projects-as
comments-on
interprets-as
```

A system may derive readability through projection rather than storing readability relations. But it must preserve the distinction between satisfaction and readability.

A node may be:

```text
satisfied but unreadable
unsatisfied but readable
untested but readable
readable on one board and unreadable on another
unreadable now but readable later
```

Unreadability should not be repaired by rewriting the node. It should be made explicit through clarification, commentary, gap, refinement, projection, edge condition, or supersession.

---

# 26. Edge relations

The **marks-edge** relation connects an edge node to the board or gap whose boundary it marks.

```text
Edge Node marks-edge Board
Edge Node derived-from Gap
Edge Node related-to External Actor
```

Edges are not merely borders. They are sites where a board encounters what it cannot yet contain, resolve, or express.

Some gaps become internal work. Some gaps become edge nodes.

---

# 27. Projection relations

The **projects-as** relation connects an inscription or board to a rendering in a particular register.

```text
Board projects-as Human Dashboard
Board projects-as LLM Projection
Intent projects-as Task List Item
Gap projects-as Human Question
```

The **projects-to** relation may connect a graph region or board to a concrete expression or system produced from it.

```text
Board projects-to System
Intent projects-to Expression
Graph Region projects-to Reference Expression
```

Human-facing forms are projections, not replacements for the graph.

A task list projection may be useful, but it must not collapse the underlying distinction between intent and task.

---

# 28. Retro-projection relations

The **retro-projects** relation connects an artifact or system to a retro-projected graph reading.

```text
System retro-projects Retro-projection
Artifact retro-projects Retro-projection
Legacy Application retro-projects Migration Board
```

The **interprets-as** relation may connect a retro-projection to inferred graph inscriptions.

```text
Retro-projection interprets-as Intent
Retro-projection infers-intent Intent
Retro-projection infers-test Test
Retro-projection infers-gap Gap
```

Retro-projection relations must preserve uncertainty. They should not imply that the inferred graph is the artifact’s single true meaning.

---

# 29. Signal relations

The **signals** relation connects a signal to the graph inscriptions it affects or generates.

```text
Signal signals Gap
Signal signals Intent
Signal signals Tension
Signal signals Decision Need
```

Signals allow events and non-reasoning actors to enter the graph without pretending that they are intents or decisions.

---

# 30. Authorization relations

The **authorizes** relation records permission, approval, or delegation.

```text
Human Actor authorizes Agent
Decision authorizes Expression
Axiom authorizes Move Type
Board authorizes Actor Scope
```

Authorization may constrain who can write what kinds of inscriptions.

Authorization should be explicit when it affects trust, scope, or admissible action.

---

# 31. Derived conditions

The grammar distinguishes stored inscriptions from derived conditions.

A faithful implementation should derive at least the following conditions from topology or projection:

```text
red
green
tested
untested
gap
open gap
closed gap
current
superseded
blocked
workable
inside board
at board edge
readable in board
unreadable in board
projected expression
retro-projected reading
```

A concrete system may cache these conditions for performance, but cached values must not become the source of truth.

---

# 32. Forbidden reductions

A faithful graph system should avoid the following reductions:

```text
Intent reduced to task
Graph reduced to project management database
Board reduced to category or container
Value reduced to global priority field
History reduced to external event log
Future reduced to roadmap state
Satisfaction reduced to mutable status
Readability reduced to UI formatting
Agent reduced to workflow owner
Projection reduced to source of truth
Retro-projection reduced to requirements extraction
Migration reduced to direct translation
Portability reduced to reproducing the same application
Storage substrate treated as invariant
Reference implementation treated as canonical system
```

These reductions may appear as human projections, implementation conveniences, or diagnostic tools. They must not become governing ontology.

---

# 33. Minimal conformance questions

A candidate logical grammar or implementation should be tested by asking:

1. Can it distinguish intent from task?
2. Can it distinguish expression from satisfaction?
3. Can it represent or derive tests as satisfaction conditions?
4. Can it admit untested intents without forcing premature clarity?
5. Can it admit gaps without treating them as failures?
6. Can it preserve append-only change through supersession or equivalent structure?
7. Can it derive red/green from graph relations rather than mutable status?
8. Can it derive current/superseded from topology?
9. Can it support boards as local fields of play rather than categories?
10. Can it represent board edges as incompleteness rather than simple boundaries?
11. Can it distinguish readability from satisfaction?
12. Can it support board-relative and retroactive readability?
13. Can it support multiple actors with different agency models?
14. Can it support human and LLM projections from the same inscriptions?
15. Can it support graph-to-system projection without treating it as deterministic?
16. Can it support artifact-to-graph retro-projection without treating it as requirements extraction?
17. Can it allow multiple systems to express the same graph?
18. Can it allow multiple graphs to read the same system?
19. Can it treat an intent graph as a portable compressed application form without treating decompression as reproduction?
20. Can it treat value as a board activity rather than a global graph property?
21. Can it allow expression-layer choices without mistaking them for invariants?

If the answer to one of these questions is no, the correct response is not immediate rejection. The correct response is to identify the gap, tension, or required refinement.

---

# 34. Relationship to implementation

This grammar should be used before selecting a storage substrate or database schema.

The recommended order is:

```text
1. Invariants
2. Logical graph grammar
3. Storage substrate evaluation
4. Concrete schema or data model
5. Reference expression
6. Local implementation
```

A storage substrate should be evaluated by asking how naturally it can express this grammar without violating the invariants.

A relational database, graph database, RDF store, document store, ledger, file system, or hybrid system may all be admissible if they preserve the grammar’s required capabilities.

The grammar does not ask: “Which database is best?”

It asks: “What must any database, file system, ledger, or graph substrate be able to preserve for GDD to remain itself?”
