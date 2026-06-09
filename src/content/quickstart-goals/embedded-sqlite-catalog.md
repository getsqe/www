
`sqe-cli --embedded --warehouse <dir>` runs the engine in-process and attaches a
**SQLite-backed Iceberg catalog** at `<dir>`. Unlike the
[`embedded-files`](../embedded-files/) quickstart (which uses `--memory` and keeps
nothing), here `CREATE TABLE` and the data persist on disk: the catalog is a
`sqe.db` SQLite file and the table data lives next to it as Iceberg metadata +
Parquet. No server, no Polaris, no catalog service.

This is the single-binary, local-first way to keep Iceberg tables on a laptop.

