
Quack is DuckDB's RPC protocol. A DuckDB client can `ATTACH 'quack:host:port'`
and query a remote engine as though it were a local database.

SQE speaks Quack **both ways**:

- **As a server** -- a DuckDB client queries SQE's catalogs over Quack
  (`coordinator.quack_port`).
- **As a client** -- SQE's `quack_query()` table function pulls rows from a
  remote Quack endpoint (another SQE, or a DuckDB running `quack_serve`).

`run.sh` turns the server on, proves it with the `GET /` probe, and -- if a
quack-capable DuckDB CLI is on your PATH -- runs the forward round-trip (DuckDB
querying an SQE Iceberg table). The reverse direction (SQE as the client) is a
manual demo documented below.

