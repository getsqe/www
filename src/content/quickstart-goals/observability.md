
SQE exposes Prometheus metrics on its `metrics.prometheus_port` (`/metrics`, port
9090 in this quickstart). This stack scrapes them with **VictoriaMetrics** and
renders them in **Grafana**, so you can watch query rate, cache hit/miss,
active sessions, scan pruning, and coordinator memory while you run queries.

A minimal queryable SQE (Nessie catalog + RustFS, anonymous auth) sits underneath
just to generate real metrics; the focus here is the monitoring pipeline.

