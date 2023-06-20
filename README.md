# Lambda Processing Unit

A lambda processing unit implementation in JavaScript

## The idea

An interaction net reduction consists of local graph reductions. However, in a modern CPU, these are only superficially local. In the RAM, the interaction nodes might be stored very far apart. This adds an large overhead to computation. It would be better if interaction net reductions were truly local. A chip could be designed that executed graph reductions quickly, locally, and in parallel.

## The features

- Completely local; execution only needs to take into account 4 adjacent memory cells at a time.
- Completely confluent; It has been proved that interaction nets are confluent, which means it does not matter in what order reduction is done. This allows for safe massive parallelism.
- Completely minimal; interaction combinators are the minimal set of combinators needed to be turing-complete

## Details

There are 5 node types.
- Constructor node, with one principal port and two auxiliary ones.
- Duplicator node, with one principal port and two auxiliary ones.
- Eraser node, with one principal port
Then, two special implementation nodes
- Relay node, with one principal and one auxiliary port.
- A userdata node, with no principal port.

Each node has a type, and at most three ports. Each port contains a wire ID that is present in exactly one other node, and the direction that node is in (either to the right or to the left in memory).

