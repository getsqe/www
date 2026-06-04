# SQL Feature Comparison: SQE vs Trino vs Spark SQL vs DuckDB

SQE is built on **Apache DataFusion 53.1** which provides the SQL execution engine. All standard SQL features come from DataFusion; SQE adds catalog integration (Polaris / Iceberg / Glue / HMS / Nessie / S3 Tables / JDBC / Hadoop), pluggable auth, distributed execution, DDL routing, and a single-binary embedded mode that competes with DuckDB on laptop analytics.

> For a detailed function-by-function Trino compatibility matrix, see [trino-compatibility.md](/compare/trino). For the audit-driven DuckDB compatibility track (V8 through V12.1, with status per item), see [duckdb-comparision.md](/compare/duckdb). For the embedded CLI reference, see [cli-embedded.md](https://github.com/schubergphilis/sqe/blob/main/docs/cli-embedded.md).

## Quick Summary

| Category | SQE (DataFusion 53.1) | Trino | Spark SQL | DuckDB |
|----------|:---:|:---:|:---:|:---:|
| Window functions | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Aggregate functions | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| Joins | ✅ Full (7 types) | ✅ Full | ✅ Full | ✅ Full |
| Subqueries | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| CTEs | ✅ WITH + recursive | ✅ WITH + recursive | ✅ WITH + recursive | ✅ WITH + recursive |
| Set operations | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| JSON | ✅ via `datafusion-functions-json` | ✅ Full | ✅ Full | ✅ Full |
| Array/Map types | ⚠️ Partial | ✅ Full | ✅ Full | ✅ Full |
| MERGE INTO | ✅ CoW + MoR (V12) | ✅ | ✅ | ❌ |
| DELETE | ✅ CoW + MoR (V12) | ✅ | ✅ | ✅ |
| UPDATE | ✅ CoW + MoR (V12) | ✅ | ✅ | ✅ |
| PIVOT/UNPIVOT | ❌ | ❌ | ⚠️ PIVOT only | ✅ |
| QUALIFY | ❌ | ❌ | ❌ | ✅ |
| Lambda expressions | ❌ | ✅ | ✅ | ✅ |
| GROUPING SETS | ✅ | ✅ | ✅ | ✅ |
| Iceberg time travel | ✅ FOR VERSION / SYSTEM\_TIME AS OF | ✅ | ✅ | ⚠️ Read-only via extension |
| Iceberg branches & tags | ✅ ALTER TABLE CREATE BRANCH / TAG | ⚠️ Limited | ✅ | ❌ |
| Iceberg compaction (`rewrite_data_files`) | ✅ CALL system.rewrite_data_files() | ✅ OPTIMIZE | ✅ | ❌ |
| Iceberg maintenance procedures | ✅ expire_snapshots / remove_orphan_files / rewrite_manifests | ✅ | ✅ | ❌ |
| Delta Lake read | ✅ `read_delta()` (V11) | ⚠️ via connector | ✅ Native | ✅ via extension |
| File-format TVFs | ✅ `read_parquet`/`read_csv`/`read_json`/`read_delta` | ⚠️ Hive table only | ✅ | ✅ |
| `SELECT * FROM 'file.ext'` auto-detect | ✅ (V8) | ❌ | ❌ | ✅ |
| HuggingFace `hf://` URLs | ✅ TVF + auto-detect (V10/V12) | ❌ | ❌ | ✅ via extension |
| HTTPS / `httpfs` | ✅ (V10) | ⚠️ HTTP table function | ❌ | ✅ via extension |
| AWS S3 / S3-compatible (R2 / MinIO / Ceph / SeaweedFS / Garage) | ✅ provider chain + inline | ✅ | ✅ | ✅ via extension |
| Azure ADLS Gen2 / Blob | ✅ shared key + SAS + Azurite; `abfss://`/`azure://`/`az://` | ✅ | ✅ | ✅ via extension |
| Google Cloud Storage | ✅ service-account JSON or ADC; `gs://`/`gcs://` | ✅ | ✅ | ✅ via extension |
| Federated queries | ❌ | ✅ (connectors) | ✅ (connectors) | ⚠️ Postgres / SQLite extensions |
| UDFs | ⚠️ Rust API only | ✅ Java/Python | ✅ Java/Scala/Python | ✅ Python / C++ |
| Single-binary embedded mode | ✅ (V8/V11) | ❌ Cluster only | ❌ Cluster only | ✅ Default |
| Distributed execution | ✅ Coordinator + workers | ✅ Coordinator + workers | ✅ Driver + executors | ❌ Single-process |
| OIDC bearer-token passthrough | ✅ Per-user identity | ❌ Service account | ❌ Service account | ❌ |

---

## Window Functions

**✅ LEAD, LAG, PARTITION BY, ORDER BY, and frame specs are all supported.**

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `ROW_NUMBER()` | ✅ | ✅ | ✅ |
| `RANK()` | ✅ | ✅ | ✅ |
| `DENSE_RANK()` | ✅ | ✅ | ✅ |
| `NTILE(n)` | ✅ | ✅ | ✅ |
| `LEAD(col, offset, default)` | ✅ | ✅ | ✅ |
| `LAG(col, offset, default)` | ✅ | ✅ | ✅ |
| `FIRST_VALUE(col)` | ✅ | ✅ | ✅ |
| `LAST_VALUE(col)` | ✅ | ✅ | ✅ |
| `NTH_VALUE(col, n)` | ✅ | ✅ | ✅ |
| `CUME_DIST()` | ✅ | ✅ | ✅ |
| `PERCENT_RANK()` | ✅ | ✅ | ✅ |
| `PARTITION BY` | ✅ | ✅ | ✅ |
| `ORDER BY` in window | ✅ | ✅ | ✅ |
| `ROWS BETWEEN ... AND ...` | ✅ | ✅ | ✅ |
| `RANGE BETWEEN ... AND ...` | ✅ | ✅ | ✅ |
| `GROUPS BETWEEN` | ✅ | ❌ | ❌ |

**Example, works identically in SQE:**

```sql
SELECT
  customer_id,
  order_date,
  amount,
  LEAD(amount, 1) OVER (PARTITION BY customer_id ORDER BY order_date) AS next_amount,
  LAG(amount, 1) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_amount,
  SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM orders;
```

---

## Aggregate Functions

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` | ✅ | ✅ | ✅ |
| `COUNT(DISTINCT col)` | ✅ | ✅ | ✅ |
| `STDDEV`, `STDDEV_POP`, `STDDEV_SAMP` | ✅ | ✅ | ✅ |
| `VARIANCE`, `VAR_POP`, `VAR_SAMP` | ✅ | ✅ | ✅ |
| `COVAR_POP`, `COVAR_SAMP` | ✅ | ✅ | ✅ |
| `CORR` | ✅ | ✅ | ✅ |
| `APPROX_DISTINCT` | ✅ | ✅ | ✅ |
| `APPROX_PERCENTILE_CONT` | ✅ | ✅ | ✅ |
| `APPROX_MEDIAN` | ✅ | ❌ | ❌ |
| `MEDIAN` | ✅ | ❌ | ❌ |
| `BOOL_AND`, `BOOL_OR` | ✅ | ✅ | ✅ |
| `BIT_AND`, `BIT_OR`, `BIT_XOR` | ✅ | ✅ | ✅ |
| `ARRAY_AGG` | ✅ | ✅ | ✅ |
| `STRING_AGG` / `LISTAGG` | ✅ | ✅ | ❌ |
| `GROUPING SETS` | ✅ | ✅ | ✅ |
| `CUBE` | ✅ | ✅ | ✅ |
| `ROLLUP` | ✅ | ✅ | ✅ |
| `FILTER` clause | ✅ | ✅ | ✅ |
| `GROUPING()` function | ✅ | ✅ | ✅ |
| `REGR_SLOPE`, `REGR_INTERCEPT`, etc. | ✅ | ✅ | ❌ |

---

## String Functions

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `CONCAT`, `\|\|` | ✅ | ✅ | ✅ |
| `SUBSTRING` | ✅ | ✅ | ✅ |
| `TRIM`, `LTRIM`, `RTRIM`, `BTRIM` | ✅ | ✅ | ✅ |
| `UPPER`, `LOWER` | ✅ | ✅ | ✅ |
| `LENGTH`, `CHAR_LENGTH` | ✅ | ✅ | ✅ |
| `REPLACE` | ✅ | ✅ | ✅ |
| `REGEXP_REPLACE` | ✅ | ✅ | ✅ |
| `REGEXP_MATCH` | ✅ | ✅ | ✅ |
| `REGEXP_LIKE` | ✅ | ✅ | ❌ |
| `REGEXP_COUNT` | ✅ | ❌ | ❌ |
| `SPLIT_PART` | ✅ | ✅ | ❌ |
| `STARTS_WITH`, `ENDS_WITH` | ✅ | ✅ | ✅ |
| `LPAD`, `RPAD` | ✅ | ✅ | ✅ |
| `REVERSE` | ✅ | ✅ | ✅ |
| `REPEAT` | ✅ | ✅ | ✅ |
| `TRANSLATE` | ✅ | ✅ | ✅ |
| `INITCAP` | ✅ | ✅ | ✅ |
| `LEFT`, `RIGHT` | ✅ | ✅ | ✅ |
| `POSITION`, `STRPOS` | ✅ | ✅ | ✅ |
| `CHR`, `ASCII` | ✅ | ✅ | ✅ |
| `OVERLAY` | ✅ | ✅ | ✅ |
| `ENCODE`, `DECODE` | ✅ | ✅ | ✅ |
| `MD5`, `SHA256`, `SHA512` | ✅ | ✅ | ✅ |
| `TO_HEX` | ✅ | ✅ | ✅ |
| `UUID` | ✅ | ✅ | ✅ |
| `LEVENSHTEIN` | ✅ | ✅ | ✅ |
| `CONTAINS` | ✅ | ❌ | ✅ |

---

## Math Functions

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `ABS`, `SIGN` | ✅ | ✅ | ✅ |
| `CEIL`, `FLOOR` | ✅ | ✅ | ✅ |
| `ROUND`, `TRUNC` | ✅ | ✅ | ✅ |
| `POWER`, `SQRT`, `CBRT` | ✅ | ✅ | ✅ |
| `LOG`, `LOG2`, `LOG10`, `LN` | ✅ | ✅ | ✅ |
| `EXP` | ✅ | ✅ | ✅ |
| `MOD`, `%` | ✅ | ✅ | ✅ |
| `PI`, `RANDOM` | ✅ | ✅ | ✅ |
| `GCD`, `LCM` | ✅ | ✅ | ❌ |
| `FACTORIAL` | ✅ | ❌ | ✅ |
| `SIN`, `COS`, `TAN` | ✅ | ✅ | ✅ |
| `ASIN`, `ACOS`, `ATAN`, `ATAN2` | ✅ | ✅ | ✅ |
| `SINH`, `COSH`, `TANH` | ✅ | ✅ | ❌ |
| `DEGREES`, `RADIANS` | ✅ | ✅ | ✅ |
| `NANVL` | ✅ | ❌ | ✅ |
| `ISNAN` | ✅ | ✅ | ✅ |
| `ISZERO` | ✅ | ❌ | ❌ |

---

## Date/Time Functions

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `NOW()`, `CURRENT_TIMESTAMP` | ✅ | ✅ | ✅ |
| `CURRENT_DATE`, `CURRENT_TIME` | ✅ | ✅ | ✅ |
| `DATE_TRUNC` | ✅ | ✅ | ✅ |
| `DATE_PART` / `EXTRACT` | ✅ | ✅ | ✅ |
| `DATE_BIN` | ✅ | ❌ | ❌ |
| `TO_TIMESTAMP` | ✅ | ❌ | ✅ |
| `TO_DATE` | ✅ | ❌ | ✅ |
| `TO_CHAR` | ✅ | ✅ | ✅ |
| `INTERVAL` arithmetic | ✅ | ✅ | ✅ |
| `MAKE_DATE` | ✅ | ❌ | ✅ |
| `MAKE_TIMESTAMP` | ✅ | ❌ | ✅ |
| `FROM_UNIXTIME` | ✅ | ✅ | ✅ |
| `DATE_ADD`, `DATE_SUB` | ✅ via `sqe-trino-functions` | ✅ | ✅ |
| `DATEDIFF` | ✅ via `sqe-trino-functions` | ✅ | ✅ |
| Timezone (`AT TIME ZONE`) | ✅ | ✅ | ✅ |
| `EPOCH` | ✅ | ✅ | ✅ |

---

## Type System & Casting

| Feature | SQE | Trino | Spark SQL |
|---------|:---:|:---:|:---:|
| `CAST(x AS type)` | ✅ | ✅ | ✅ |
| `TRY_CAST(x AS type)` | ✅ | ✅ | ❌ |
| `::type` shorthand | ✅ | ✅ | ❌ |
| `BOOLEAN` | ✅ | ✅ | ✅ |
| `TINYINT`/`SMALLINT`/`INT`/`BIGINT` | ✅ | ✅ | ✅ |
| `FLOAT`/`DOUBLE`/`REAL` | ✅ | ✅ | ✅ |
| `DECIMAL(p,s)` | ✅ | ✅ | ✅ |
| `VARCHAR`/`TEXT` | ✅ | ✅ | ✅ |
| `DATE`/`TIMESTAMP`/`TIME` | ✅ | ✅ | ✅ |
| `TIMESTAMP WITH TIME ZONE` | ✅ | ✅ | ✅ |
| `BINARY`/`VARBINARY` | ✅ | ✅ | ✅ |
| `INTERVAL` | ✅ | ✅ | ✅ |
| `ARRAY` | ✅ | ✅ | ✅ |
| `MAP` | ⚠️ Partial | ✅ | ✅ |
| `STRUCT`/`ROW` | ✅ | ✅ | ✅ |
| `JSON` type | ❌ | ✅ | ❌ |
| `UUID` type | ❌ | ✅ | ❌ |

---

## Joins

| Join Type | SQE | Trino | Spark SQL |
|-----------|:---:|:---:|:---:|
| `INNER JOIN` | ✅ | ✅ | ✅ |
| `LEFT OUTER JOIN` | ✅ | ✅ | ✅ |
| `RIGHT OUTER JOIN` | ✅ | ✅ | ✅ |
| `FULL OUTER JOIN` | ✅ | ✅ | ✅ |
| `CROSS JOIN` | ✅ | ✅ | ✅ |
| `LEFT SEMI JOIN` | ✅ | ✅ | ✅ |
| `LEFT ANTI JOIN` | ✅ | ✅ | ✅ |
| `NATURAL JOIN` | ✅ | ✅ | ✅ |
| `LATERAL JOIN` | ✅ | ✅ | ✅ |
| `USING` clause | ✅ | ✅ | ✅ |
| Non-equi joins | ✅ | ✅ | ✅ |
| `ASOF JOIN` | ❌ | ❌ | ❌ |

---

## Subqueries

| Feature | SQE | Trino | Spark SQL |
|---------|:---:|:---:|:---:|
| Scalar subquery | ✅ | ✅ | ✅ |
| `IN (subquery)` | ✅ | ✅ | ✅ |
| `EXISTS (subquery)` | ✅ | ✅ | ✅ |
| `NOT EXISTS` | ✅ | ✅ | ✅ |
| Correlated subqueries | ✅ | ✅ | ✅ |
| Subquery in FROM | ✅ | ✅ | ✅ |
| Subquery in SELECT | ✅ | ✅ | ✅ |

---

## Common Table Expressions (CTEs)

| Feature | SQE | Trino | Spark SQL |
|---------|:---:|:---:|:---:|
| `WITH ... AS` | ✅ | ✅ | ✅ |
| Multiple CTEs | ✅ | ✅ | ✅ |
| Recursive CTEs | ✅ | ✅ | ❌ |
| CTE in INSERT | ✅ | ✅ | ✅ |
| CTE in CREATE TABLE AS | ✅ | ✅ | ✅ |

---

## Set Operations

| Operation | SQE | Trino | Spark SQL |
|-----------|:---:|:---:|:---:|
| `UNION` | ✅ | ✅ | ✅ |
| `UNION ALL` | ✅ | ✅ | ✅ |
| `INTERSECT` | ✅ | ✅ | ✅ |
| `INTERSECT ALL` | ✅ | ✅ | ✅ |
| `EXCEPT` | ✅ | ✅ | ✅ |
| `EXCEPT ALL` | ✅ | ✅ | ✅ |

---

## Conditional Expressions

| Expression | SQE | Trino | Spark SQL |
|------------|:---:|:---:|:---:|
| `CASE WHEN ... THEN ... END` | ✅ | ✅ | ✅ |
| `COALESCE(a, b, ...)` | ✅ | ✅ | ✅ |
| `NULLIF(a, b)` | ✅ | ✅ | ✅ |
| `GREATEST(a, b, ...)` | ✅ | ✅ | ✅ |
| `LEAST(a, b, ...)` | ✅ | ✅ | ✅ |
| `NVL` / `NVL2` | ✅ | ❌ | ✅ |
| `IF(cond, then, else)` (Trino) | ✅ via `sqe-trino-functions` | ✅ | ✅ |
| `IFF(cond, then, else)` (Snowflake) | ✅ via `sqe-trino-functions` | ❌ | ❌ |
| `IIF` (T-SQL) | ❌ | ❌ | ❌ |
| `DECODE` (Oracle / Snowflake conditional) | ❌ name collides with binary `decode()` | ❌ | ✅ |

---

## Array & Map Functions

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `ARRAY[1, 2, 3]` / `MAKE_ARRAY` | ✅ | ✅ | ✅ |
| `ARRAY_AGG` | ✅ | ✅ | ✅ |
| `ARRAY_APPEND` / `ARRAY_PREPEND` | ✅ | ✅ | ❌ |
| `ARRAY_CONCAT` | ✅ | ✅ | ✅ |
| `ARRAY_LENGTH` / `CARDINALITY` | ✅ | ✅ | ✅ |
| `ARRAY_CONTAINS` / `ARRAY_HAS` | ✅ | ✅ | ✅ |
| `ARRAY_POSITION` | ✅ | ✅ | ❌ |
| `ARRAY_REMOVE` | ✅ | ✅ | ✅ |
| `ARRAY_SORT` | ✅ | ✅ | ✅ |
| `ARRAY_DISTINCT` | ✅ | ✅ | ✅ |
| `ARRAY_INTERSECT` | ✅ | ✅ | ✅ |
| `ARRAY_UNION` | ✅ | ✅ | ✅ |
| `ARRAY_EXCEPT` | ✅ | ✅ | ✅ |
| `ARRAY_MIN` / `ARRAY_MAX` | ✅ | ✅ | ❌ |
| `FLATTEN` | ✅ | ✅ | ✅ |
| `UNNEST` / `EXPLODE` | ✅ | ✅ | ✅ |
| `MAP(keys, values)` | ✅ | ✅ | ✅ |
| `MAP_KEYS` / `MAP_VALUES` | ✅ | ✅ | ✅ |
| `MAP_EXTRACT` | ✅ | ✅ | ✅ |
| Lambda (`x -> x + 1`) | ❌ | ✅ | ✅ |

---

## Table & Generator Functions

| Function | SQE | Trino | Spark SQL |
|----------|:---:|:---:|:---:|
| `UNNEST(array)` | ✅ | ✅ | ✅ |
| `generate_series(start, stop)` | ✅ | ✅ | ✅ |
| `VALUES` clause | ✅ | ✅ | ✅ |
| Table functions in FROM | ✅ | ✅ | ✅ |

---

## DDL & DML (via SQE + Iceberg)

| Statement | SQE | Trino + Iceberg | Spark + Iceberg |
|-----------|:---:|:---:|:---:|
| `SELECT` | ✅ | ✅ | ✅ |
| `CREATE TABLE AS SELECT` | ✅ | ✅ | ✅ |
| `CREATE OR REPLACE TABLE AS SELECT` | ✅ | ✅ | ✅ |
| `INSERT INTO ... SELECT` | ✅ | ✅ | ✅ |
| `CREATE VIEW` | ✅ | ✅ | ✅ |
| `DROP VIEW` | ✅ | ✅ | ✅ |
| `DROP TABLE` | ✅ | ✅ | ✅ |
| `ALTER TABLE RENAME` | ✅ | ✅ | ✅ |
| `MERGE INTO` | ✅ (CoW) | ✅ | ✅ |
| `DELETE FROM` | ✅ (CoW) | ✅ | ✅ |
| `UPDATE` | ✅ (CoW) | ✅ | ✅ |
| `ALTER TABLE ADD COLUMN` | ✅ (with `DEFAULT`) | ✅ | ✅ |
| `ALTER TABLE DROP COLUMN` | ✅ (with `IF EXISTS`) | ✅ | ✅ |
| `ALTER TABLE RENAME COLUMN` | ✅ | ✅ | ✅ |
| `ALTER TABLE ALTER COLUMN ... SET / DROP NOT NULL` | ✅ | ✅ | ✅ |
| `ALTER COLUMN ... SET DEFAULT` | ✅ (Iceberg V3 column defaults) | ⚠️ | ⚠️ |
| `ALTER TABLE ADD / DROP PARTITION FIELD` | ✅ Iceberg partition evolution | ✅ | ✅ |
| `CREATE SCHEMA` | ✅ | ✅ | ✅ |
| `DROP SCHEMA` | ✅ | ✅ | ✅ |
| `TRUNCATE TABLE` | ✅ rewrites to `DELETE FROM` | ✅ | ✅ |

---

## Iceberg-Specific Features

| Feature | SQE | Trino + Iceberg | Spark + Iceberg |
|---------|:---:|:---:|:---:|
| Partition pruning (predicate -> manifest filter) | ✅ Full | ✅ Full | ✅ Full |
| Hidden partitioning (transforms: bucket, truncate, year, month, day, hour) | ✅ | ✅ | ✅ |
| Schema evolution (add / drop / rename / promote / set null) | ✅ | ✅ | ✅ |
| Partition evolution (add / drop / rename partition field) | ✅ | ✅ | ✅ |
| Iceberg V3 (column defaults, nanosecond timestamps, geometry/geography stubs) | ✅ | ⚠️ Partial | ⚠️ Partial |
| Time travel (`FOR VERSION AS OF`, `FOR SYSTEM_TIME AS OF`) | ✅ | ✅ | ✅ |
| Snapshot queries (`table$snapshots`, `table_snapshots()` TVF) | ✅ Trino + DuckDB syntax | ✅ | ✅ |
| Metadata TVFs (`table_history`, `table_files`, `table_partitions`, `table_manifests`, `table_refs`) | ✅ | ✅ | ✅ |
| Merge-on-Read deletes (position + equality) | ✅ V12 | ✅ | ✅ |
| Copy-on-Write deletes | ✅ default | ✅ | ✅ |
| `CALL system.rewrite_data_files()` (compaction with bin-packing) | ✅ | ✅ OPTIMIZE | ✅ |
| `CALL system.expire_snapshots()` | ✅ | ✅ | ✅ |
| `CALL system.remove_orphan_files()` | ✅ | ✅ | ✅ |
| `CALL system.rewrite_manifests()` | ✅ | ✅ | ✅ |
| `suggest_bloom_filter_columns()` | ✅ SQE-specific | ❌ | ❌ |
| Manifest caching (in-process moka cache) | ✅ | ✅ | ✅ |
| Branches and tags (`ALTER TABLE CREATE BRANCH/TAG`, query `table@branch`) | ✅ | ⚠️ Limited | ✅ |
| Position deletes | ✅ | ✅ | ✅ |
| Equality deletes | ⚠️ Read; write deferred | ✅ | ✅ |
| MERGE INTO (CoW + MoR) | ✅ V12 | ✅ | ✅ |
| Row-level security | ✅ OPA / Cedar plan rewrite | ❌ needs Ranger | ❌ needs Ranger |
| Column masking | ✅ OPA / Cedar plan rewrite | ❌ | ❌ |
| Per-user OIDC bearer to Polaris / S3 | ✅ | ❌ service account | ❌ service account |

---

## Metadata Queries

| Query | SQE | Trino | Spark SQL |
|-------|:---:|:---:|:---:|
| `SHOW CATALOGS` | ✅ | ✅ | ✅ |
| `SHOW SCHEMAS` | ✅ | ✅ | ✅ |
| `SHOW TABLES` | ✅ | ✅ | ✅ |
| `SHOW COLUMNS FROM ns.table` | ✅ Trino syntax (rewrites to `information_schema`) | ✅ | ✅ |
| `SHOW CREATE TABLE` | ❌ | ✅ | ✅ |
| `DESCRIBE table` | ✅ DataFusion native | ✅ | ✅ |
| `SUMMARIZE table` (column stats) | ✅ V9 | ❌ | ❌ |
| CLI `.schema` / `.describe` / `.summarize` | ✅ embedded mode V9 | n/a | n/a |
| `information_schema.tables` | ✅ | ✅ | ✅ |
| `information_schema.columns` | ✅ | ✅ | ✅ |
| `information_schema.schemata` | ✅ | ✅ | ✅ |
| `EXPLAIN` | ✅ | ✅ | ✅ |
| `EXPLAIN ANALYZE` | ✅ | ✅ | ❌ |

---

## Protocol & Connectivity

| Feature | SQE | Trino | Spark SQL |
|---------|:---:|:---:|:---:|
| Arrow Flight SQL (gRPC) | ✅ primary | ❌ | ❌ |
| Trino HTTP protocol | ✅ compat | ✅ native | ❌ |
| JDBC | ✅ via Flight SQL | ✅ native | ✅ Thrift |
| ODBC | ✅ via Flight SQL | ✅ | ✅ |
| Python (ADBC) | ✅ | ✅ trino-python | ✅ PySpark |
| dbt | 🔜 dbt-sqe | ✅ dbt-trino | ✅ dbt-spark |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully supported |
| ⚠️ | Partially supported / workaround available |
| 🔜 | Planned / in roadmap |
| ❌ | Not supported |

---

## Key Advantages of SQE over Trino

1. **Arrow-native**: no serialization overhead; Flight SQL transfers columnar Arrow batches directly
2. **Rust performance**: no JVM GC pauses, lower memory footprint, faster startup
3. **Fine-grained security**: row-level filters and column masks via OPA/Cedar policy engine, enforced at the query plan level before optimization
4. **Bearer token passthrough**: every query runs as the authenticated user against Polaris; no service account with god-mode access
5. **Iceberg-native**: built specifically for Iceberg via iceberg-rust; no connector abstraction layer

## Key Advantages of SQE over DuckDB

The V8-V12 audit closed the file-format TVF and httpfs / hf:// gaps. SQE now matches DuckDB on the embedded developer-experience side and keeps several distributed-engine differentiators DuckDB cannot match in its single-process model.

1. **OIDC bearer-token passthrough**: every query runs as the authenticated user. No service account. DuckDB has no concept of an authenticated user.
2. **Distributed execution**: coordinator + stateless workers, shuffle, spill across machines, adaptive sort. DuckDB is single-process.
3. **Multi-catalog cluster**: Polaris, Nessie, AWS Glue, Hive Metastore, JDBC, AWS S3 Tables, Hadoop in one engine, behind one auth chain. DuckDB is extension-by-extension and runs on one machine.
4. **Iceberg V3 read AND write**: position deletes, equality deletes, MoR + CoW for DELETE / UPDATE / MERGE, branches, tags, partition evolution, schema evolution, nanosecond timestamps, column defaults. DuckDB's Iceberg extension is read-only.
5. **Trino HTTP wire compatibility**: dbt models that work against Trino 465 work against SQE without changes. DuckDB has no Trino wire support.
6. **One binary, two modes**: the same `sqe` binary serves both the embedded laptop persona and the cluster mode. Same SQL surface, same TVFs, same dot-commands. See [`cli-embedded.md`](https://github.com/schubergphilis/sqe/blob/main/docs/cli-embedded.md).

## What DuckDB still has that SQE does not

The V12.x roadmap and parser-blocked items both feed this list. None of these are on the immediate roadmap.

1. **PIVOT / UNPIVOT / QUALIFY / ASOF JOIN / FROM-first syntax**: DataFusion parser does not support. Tracked upstream.
2. **List comprehensions and lambda expressions**: same, parser-blocked.
3. **Spatial, vector search, full-text search, Excel, Postgres scanner**: out of scope for our positioning. Use the right tool for each.
4. **A 30 MB binary**: SQE's embedded build lands around 180 MB. The floor is higher because DataFusion + iceberg-rust + AWS SDK + delta-rs add up.
5. **Glob expansion on `hf://` URLs (`**/*.parquet`)**: V12.2 in progress; the HF tree-API cache prerequisite shipped on `a feature branch`.
6. **Smart-CSV inference deeper than extension**: DuckDB samples bytes to detect delimiter, quote, header. SQE's V12 follow-up uses extension-based heuristics; byte-sampling is a future enhancement.

For the audit-driven detail with per-item status, see [`duckdb-comparision.md`](/compare/duckdb). For the user-facing "how did we get here" narrative, see [the blog](/blog/2026-05-07-accidentally-duckdb) and ebook chapter [16d "The DuckDB Drift"](https://github.com/schubergphilis/sqe/blob/main/docs/ebook/chapters/16d-the-duckdb-drift.md).

## Key Limitations vs Trino

1. **No federated queries**: SQE reads only from Iceberg / Polaris / Glue / HMS / Nessie / S3 Tables / JDBC (Trino has 50+ connectors)
2. **No UDFs in SQL**: custom functions require Rust; no CREATE FUNCTION support
3. **Trino-style ASOF JOIN**: not yet implemented (DataFusion parser limitation)
4. **PIVOT / UNPIVOT / QUALIFY**: parser-blocked upstream
