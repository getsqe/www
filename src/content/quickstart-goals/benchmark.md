
Generate a benchmark dataset, load it into SQE as Iceberg tables, and run the
suite's queries with per-query timings. Everything runs in Docker: a Nessie
catalog over RustFS holds the tables, and `sqe-bench` drives generate, load, and
test. The default is TPC-H at scale factor 0.01, which finishes in seconds.

