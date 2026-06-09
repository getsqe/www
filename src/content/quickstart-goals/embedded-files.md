
SQE's engine runs in-process. `sqe-cli --embedded` starts DataFusion, the
Iceberg writers, and the file-reader TVFs in a single binary: no coordinator, no
workers, no network listeners, no catalog. The `read_csv`, `read_json`, and
`read_parquet` table-valued functions read files directly, whether they live on
local disk or behind an HTTPS URL.

This is the fastest way to poke at data with SQL. There is no stack to bring up,
so this quickstart has no `docker-compose.yml`: it just runs the CLI.

