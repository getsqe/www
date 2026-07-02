
A real distributed cluster: one SQE coordinator and two stateless DataFusion
workers over Arrow Flight, querying Iceberg tables in the shared Polaris +
RustFS test stack. The coordinator plans and schedules; the workers execute plan
fragments and stream results back over Flight.

This is the scenario for seeing distribution actually happen: query history,
worker dispatch, the system tables, and the Trino HTTP endpoint, all against a
four-container cluster rather than the single-process coordinator the other
quickstarts run.

