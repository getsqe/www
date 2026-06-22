
`sqe-cli --embedded --catalog NAME=PATH` (repeatable) mounts several persistent,
SQLite-backed Iceberg catalogs in one in-process session. Each catalog shows up
under its name in 3-part SQL identifiers (`name.namespace.table`), and a single
query can JOIN across them. No server, no catalog service, no config file.

This is the path for local analysis that spans more than one warehouse: a
`sales` warehouse and a `ref` (reference-data) warehouse, joined in one query.
Each warehouse stays on disk between runs, so you can rebuild one without
touching the other.

