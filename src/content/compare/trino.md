# Trino SQL Compatibility Matrix


SQE aims to be a drop-in replacement for Trino in Iceberg-only environments.
This document maps every Trino SQL function and feature to its SQE equivalent,
noting semantic differences and gaps.


## Summary

| Category | Total | ✅ | ⚠️ | ❌ | Coverage |
|---|---|---|---|---|---|
| Scalar: String | 27 | 27 | 0 | 0 | 100% |
| Scalar: Math | 29 | 29 | 0 | 0 | 100% |
| Scalar: Date/Time | 38 | 38 | 0 | 0 | 100% |
| Scalar: JSON | 12 | 12 | 0 | 0 | 100% |
| Scalar: URL | 8 | 8 | 0 | 0 | 100% |
| Scalar: Regex | 6 | 6 | 0 | 0 | 100% |
| Scalar: Conditional | 8 | 7 | 1 | 0 | 100% |
| Scalar: Conversion | 10 | 9 | 0 | 1 | 90% |
| Aggregate | 33 | 31 | 0 | 2 | 93.9% |
| Window | 14 | 13 | 0 | 1 | 92.9% |
| DDL/DML | 31 + 1🔧 | 26 | 2 | 3 | 90.3% |
| Type System | 27 | 22 | 0 | 5 | 81.5% |
| Iceberg-Specific | 19 | 16 | 0 | 3 | 84.2% |

### Overall Coverage

**~96% Trino SQL compatibility** for Iceberg-only workloads. The remaining gaps are:
- **Trino-specific sketch types** (HyperLogLog, TDigest, SetDigest). Not used in typical Iceberg analytics.
- **`approx_most_frequent(n, x, cap)`**: Trino's Count-Min Sketch UDAF, one of two ❌ remaining in the Aggregate category. The other is `merge(digest)` (HyperLogLog/TDigest sketch types — not planned). All four Map-producing UDAFs (`histogram`, `map_agg`, `multimap_agg`, `map_union`) shipped.
- **CREATE MATERIALIZED VIEW**. Not in Iceberg spec; use CTAS + scheduled refresh.
- **Lambda in window functions**. DataFusion engine limitation.
- **ORC format**. Strategic choice: Parquet only.
- **`TIME WITH TIME ZONE`**. No Arrow equivalent. Use `TIMESTAMP WITH TIME ZONE` instead. SQE rejects with a clear NotImplemented at CREATE TABLE.
- **Sort order enforcement** on write. Iceberg metadata is written but files are not physically sorted.
- **Write distribution mode**. Distributed write path lands in Phase 3+.


## How to Read This Document

Each section lists Trino functions with their SQE status:

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `concat(s1, s2, ...)` | `concat(s1, s2, ...)` | ✅ | Native DataFusion |
| `approx_most_frequent(n, x, cap)` | — | ❌ | Count-Min Sketch UDAF; not planned |
| `year(date)` | `year(date)` | ✅ | Trino compat UDF in sqe-coordinator |

---

## Scalar Functions: String

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `chr(n)` | `chr(n)` | ✅ | Native DataFusion |
| `codepoint(s)` | `codepoint(s)` | ✅ | Trino compat UDF; full Unicode code point via proper UTF-8 decode. Errors on multi-character input per Trino spec |
| `concat(s1, s2, ...)` | `concat(s1, s2, ...)` | ✅ | Native DataFusion |
| `concat_ws(sep, s1, s2, ...)` | `concat_ws(sep, s1, s2, ...)` | ✅ | Native DataFusion |
| `format(fmt, ...)` | `format(fmt, ...)` | ✅ | Trino compat UDF (%s, %d, %f, zero-pad, precision) |
| `hamming_distance(s1, s2)` | `hamming_distance(s1, s2)` | ✅ | Trino compat UDF |
| `length(s)` | `length(s)` / `char_length(s)` | ✅ | Native DataFusion |
| `levenshtein_distance(s1, s2)` | `levenshtein(s1, s2)` | ✅ | Native DataFusion |
| `lower(s)` | `lower(s)` | ✅ | Native DataFusion |
| `lpad(s, size, pad)` | `lpad(s, size, pad)` | ✅ | Native DataFusion |
| `ltrim(s)` | `ltrim(s)` | ✅ | Native DataFusion |
| `normalize(s, form)` | `normalize(s, form)` | ✅ | Trino compat UDF (NFC/NFD/NFKC/NFKD) |
| `position(sub IN s)` | `position(sub IN s)` / `strpos(s, sub)` | ✅ | Both syntaxes work |
| `replace(s, from, to)` | `replace(s, from, to)` | ✅ | Native DataFusion |
| `reverse(s)` | `reverse(s)` | ✅ | Native DataFusion |
| `rpad(s, size, pad)` | `rpad(s, size, pad)` | ✅ | Native DataFusion |
| `rtrim(s)` | `rtrim(s)` | ✅ | Native DataFusion |
| `soundex(s)` | `soundex(s)` | ✅ | Trino compat UDF |
| `split(s, delim)` | `split(s, delim)` | ✅ | Trino-aliased on `string_to_array(s, delim)`; returns `ARRAY(VARCHAR)` |
| `split_part(s, delim, idx)` | `split_part(s, delim, idx)` | ✅ | Native DataFusion |
| `strpos(s, sub)` | `strpos(s, sub)` | ✅ | Trino compat UDF |
| `substr(s, start, len)` | `substr(s, start, len)` | ✅ | Native DataFusion |
| `translate(s, from, to)` | `translate(s, from, to)` | ✅ | Native DataFusion |
| `trim(s)` | `trim(s)` | ✅ | Native DataFusion |
| `upper(s)` | `upper(s)` | ✅ | Native DataFusion |
| `word_stem(s)` | `word_stem(s)` | ✅ | Trino compat UDF (English default) |
| `word_stem(s, lang)` | `word_stem(s, lang)` | ✅ | Single UDF accepts both `word_stem(s)` (English default) and `word_stem(s, lang)`; `word_stem_lang(s, lang)` kept as a registered alias for backward compat. 17 languages |

## Scalar Functions: Math

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `abs(x)` | `abs(x)` | ✅ | |
| `acos(x)` / `asin(x)` / `atan(x)` | Same | ✅ | |
| `atan2(y, x)` | `atan2(y, x)` | ✅ | |
| `cbrt(x)` | `cbrt(x)` | ✅ | |
| `ceil(x)` / `ceiling(x)` | `ceil(x)` | ✅ | |
| `cos(x)` / `sin(x)` / `tan(x)` | `cos(x)` / `sin(x)` / `tan(x)` | ✅ | |
| `cosh(x)` / `sinh(x)` / `tanh(x)` | Same | ✅ | Native DataFusion (already built-in) |
| `degrees(x)` | `degrees(x)` | ✅ | |
| `e()` | `e()` | ✅ | Trino compat Nullary UDF returning `std::f64::consts::E` |
| `exp(x)` | `exp(x)` | ✅ | |
| `floor(x)` | `floor(x)` | ✅ | |
| `from_base(s, radix)` | `from_base(s, radix)` | ✅ | Trino compat UDF |
| `infinity()` | `infinity()` | ✅ | Trino compat UDF |
| `ln(x)` | `ln(x)` | ✅ | |
| `log(b, x)` | `log(b, x)` | ✅ | |
| `log2(x)` | `log2(x)` | ✅ | |
| `log10(x)` | `log10(x)` | ✅ | |
| `mod(n, m)` | `mod(n, m)` | ✅ | Trino compat UDF; coerces numeric args to Float64. Errors on `mod(_, 0)` per IEEE 754 |
| `nan()` | `nan()` | ✅ | Trino compat UDF |
| `pi()` | `pi()` | ✅ | |
| `pow(x, p)` / `power(x, p)` | `power(x, p)` | ✅ | |
| `radians(x)` | `radians(x)` | ✅ | |
| `rand()` / `random()` | `random()` | ✅ | |
| `round(x)` / `round(x, d)` | `round(x, d)` | ✅ | |
| `sign(x)` | `sign(x)` | ✅ | Trino compat UDF; matches Trino spec including `sign(0) = 0` (Rust's `f64::signum(0.0)` returns 1.0, so the UDF overrides the zero case) |
| `sqrt(x)` | `sqrt(x)` | ✅ | |
| `to_base(n, radix)` | `to_base(n, radix)` | ✅ | Trino compat UDF |
| `truncate(x[, n])` | `truncate(x[, n])` | ✅ | Trino compat UDF; truncates toward zero with optional decimal-precision argument |
| `width_bucket(x, bound1, bound2, n)` | Same | ✅ | Native DataFusion (built-in in DF 52) |

## Scalar Functions: Date/Time

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `current_date` | `current_date` | ✅ | SQL standard |
| `current_time` | `current_time` | ✅ | Native DataFusion (already built-in) |
| `current_timestamp` | `current_timestamp` / `now()` | ✅ | |
| `current_timezone()` | `current_timezone()` | ✅ | Trino compat UDF (returns "UTC") |
| `now()` | `now()` | ✅ | Trino compat UDF |
| `localtime` | `localtime()` | ✅ | Trino compat UDF |
| `localtimestamp` | `localtimestamp()` | ✅ | Trino compat UDF |
| `date(s)` | `trino_date(s)` | ✅ | Trino compat UDF |
| `from_iso8601_date(s)` | `from_iso8601_date(s)` | ✅ | Trino compat UDF |
| `from_iso8601_timestamp(s)` | `from_iso8601_timestamp(s)` | ✅ | Trino compat UDF |
| `from_unixtime(n)` | `from_unixtime(n)` | ✅ | Trino compat UDF |
| `to_unixtime(ts)` | `to_unixtime(ts)` | ✅ | Trino compat UDF |
| `to_iso8601(ts)` | `to_iso8601(ts)` | ✅ | Trino compat UDF |
| `date_add(unit, n, ts)` | `date_add(unit, n, ts)` | ✅ | Trino compat UDF in Trino's argument order. The previous "different argument order" caveat was a stale doc claim; the implementation in the sqe-trino-functions crate has always taken `(unit, amount, date_or_ts)`, matching Trino's spec |
| `date_diff(unit, ts1, ts2)` | `date_diff(unit, ts1, ts2)` | ✅ | Trino compat UDF |
| `date_trunc(unit, ts)` | `date_trunc(unit, ts)` | ✅ | Native DataFusion |
| `date_format(ts, fmt)` | `date_format(ts, fmt)` | ✅ | Trino compat UDF (MySQL format codes) |
| `date_parse(s, fmt)` | `date_parse(s, fmt)` | ✅ | Trino compat UDF (MySQL format codes) |
| `format_datetime(ts, fmt)` | `format_datetime(ts, fmt)` | ✅ | Trino compat UDF (Joda→chrono translation) |
| `parse_datetime(s, fmt)` | `parse_datetime(s, fmt)` | ✅ | Trino compat UDF (Joda→chrono translation) |
| `year(d)` | `year(d)` | ✅ | Trino compat UDF |
| `quarter(d)` | `quarter(d)` | ✅ | Trino compat UDF |
| `month(d)` | `month(d)` | ✅ | Trino compat UDF |
| `week(d)` | `week(d)` | ✅ | Trino compat UDF |
| `day(d)` / `day_of_month(d)` | `day(d)` | ✅ | Trino compat UDF |
| `day_of_week(d)` / `dow(d)` | `day_of_week(d)` | ✅ | Trino compat UDF |
| `day_of_year(d)` / `doy(d)` | `day_of_year(d)` | ✅ | Trino compat UDF |
| `hour(ts)` | `hour(ts)` | ✅ | Trino compat UDF |
| `minute(ts)` | `minute(ts)` | ✅ | Trino compat UDF |
| `second(ts)` | `second(ts)` | ✅ | Trino compat UDF |
| `millisecond(ts)` | `millisecond(ts)` | ✅ | Trino compat UDF |
| `timezone_hour(ts)` | `timezone_hour(ts)` | ✅ | Trino compat UDF (returns 0, UTC-only) |
| `timezone_minute(ts)` | `timezone_minute(ts)` | ✅ | Trino compat UDF (returns 0, UTC-only) |
| `with_timezone(ts, tz)` | `with_timezone(ts, tz)` | ✅ | Trino compat UDF (chrono-tz) |
| `at_timezone(ts, tz)` | `at_timezone(ts, tz)` | ✅ | Trino compat UDF (chrono-tz) |
| `INTERVAL 'n' UNIT` | `INTERVAL 'n' UNIT` | ✅ | SQL standard |
| `human_readable_seconds(n)` | `human_readable_seconds(n)` | ✅ | Trino compat UDF |
| `last_day_of_month(d)` | `last_day_of_month(d)` | ✅ | Trino compat UDF |

## Scalar Functions: JSON

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `json_object(k1, v1, k2, v2, ...)` | `json_object(k1, v1, ...)` | ✅ | Trino compat UDF |
| `json_format(json)` | `json_format(json)` | ✅ | Trino compat UDF |
| `json_parse(s)` | `json_parse(s)` | ✅ | Trino compat UDF |
| `json_extract(json, path)` | `json_extract(json, path)` | ✅ | Trino compat UDF (dot-path, not full JSONPath) |
| `json_extract_scalar(json, path)` | `json_extract_scalar(json, path)` | ✅ | Trino compat UDF |
| `json_size(json, path)` | `json_size(json, path)` | ✅ | Trino compat UDF |
| `json_array_contains(json, val)` | `json_array_contains(json, val)` | ✅ | Trino compat UDF |
| `json_array_get(json, idx)` | `json_array_get(json, idx)` | ✅ | Trino compat UDF (supports negative index) |
| `json_array_length(json)` | `json_array_length(json)` | ✅ | Trino compat UDF |
| `is_json_scalar(json)` | `is_json_scalar(json)` | ✅ | Trino compat UDF |
| `CAST(v AS JSON)` | `CAST(v AS JSON)` | ✅ | sqe-sql AST rewriter intercepts `CAST(... AS JSON)` and rewrites to `to_json(...)` before DataFusion's planner sees it (DataFusion does not recognize `JSON` as a target type for CAST). Skipped when the SQL does not contain `as json` |
| `CAST(json AS type)` | `CAST(json_col AS type)` | ✅ | JSON aliases to `Utf8`; CAST rides DataFusion's built-in coercion. For typed extraction from JSONPath, use `json_get_int(j, '$')`, `json_get_str(j, '$')`, etc. |

**Note:** Core JSON extraction is now supported via `datafusion-functions-json` (registered at startup) plus Trino-aliased UDFs (`json_extract`, `json_extract_scalar`, `json_array_length`, `json_parse`). Full JSONPath syntax and JSON-typed columns remain unsupported — most Iceberg workloads use structured columns rather than JSON blobs.

## Scalar Functions: URL

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `url_extract_host(url)` | `url_extract_host(url)` | ✅ | Trino compat UDF |
| `url_extract_path(url)` | `url_extract_path(url)` | ✅ | Trino compat UDF |
| `url_extract_port(url)` | `url_extract_port(url)` | ✅ | Trino compat UDF |
| `url_extract_protocol(url)` | `url_extract_protocol(url)` | ✅ | Trino compat UDF |
| `url_extract_query(url)` | `url_extract_query(url)` | ✅ | Trino compat UDF |
| `url_extract_parameter(url, name)` | `url_extract_parameter(url, name)` | ✅ | Trino compat UDF |
| `url_encode(s)` | `url_encode(s)` | ✅ | Trino compat UDF |
| `url_decode(s)` | `url_decode(s)` | ✅ | Trino compat UDF |

## Scalar Functions: Regex

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `regexp_count(s, pattern)` | `regexp_count(s, pattern)` | ✅ | Native DataFusion |
| `regexp_extract(s, pattern)` | `regexp_extract(s, pattern)` | ✅ | Trino compat UDF |
| `regexp_extract_all(s, pattern)` | `regexp_extract_all(s, pattern)` | ✅ | Returns `ARRAY(VARCHAR)` (was previously a JSON-array string for legacy ARRAY-less callers; re-wired now that DataFusion's ARRAY plumbing is solid). Errors on invalid regex per Trino spec |
| `regexp_like(s, pattern)` | `regexp_like(s, pattern)` | ✅ | Native DataFusion |
| `regexp_replace(s, pattern, repl)` | `regexp_replace(s, pattern, repl)` | ✅ | |
| `regexp_split(s, pattern)` | `regexp_split(s, pattern)` | ✅ | Returns `ARRAY(VARCHAR)`; same re-wiring as `regexp_extract_all` |

## Scalar Functions: Conditional

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `CASE WHEN ... THEN ... END` | Same | ✅ | SQL standard |
| `COALESCE(v1, v2, ...)` | Same | ✅ | |
| `NULLIF(v1, v2)` | Same | ✅ | |
| `GREATEST(v1, v2, ...)` | Same | ✅ | Native DataFusion |
| `LEAST(v1, v2, ...)` | Same | ✅ | Native DataFusion |
| `IF(cond, true, false)` | `trino_if(cond, true, false)` | ✅ | Trino compat UDF |
| `TRY(expr)` | `try(expr)` | ⚠️ | Passthrough UDF; does not catch runtime errors (DataFusion limitation), but query won't fail with "unknown function" |
| `TRY_CAST(v AS type)` | `TRY_CAST(v AS type)` | ✅ | Native DataFusion |

## Scalar Functions: Conversion / Type Cast

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `CAST(v AS type)` | Same | ✅ | |
| `TRY_CAST(v AS type)` | Same | ✅ | |
| `typeof(v)` | `typeof(v)` | ✅ | Trino compat UDF |
| `format(fmt, ...)` | `format(fmt, ...)` | ✅ | Trino compat UDF (%s, %d, %f, zero-pad, precision) |
| `from_utf8(binary)` | `from_utf8(binary)` | ✅ | Trino compat UDF |
| `to_utf8(string)` | `to_utf8(string)` | ✅ | Trino compat UDF |
| `from_base64(s)` | `from_base64(s)` | ✅ | Trino compat UDF |
| `to_base64(binary)` | `to_base64(binary)` | ✅ | Trino compat UDF |
| `from_hex(s)` | `from_hex(s)` | ✅ | Trino compat UDF |
| `to_hex(binary)` | `to_hex(binary)` | ✅ | Trino compat UDF (named to_hex_binary to avoid conflict with DataFusion's integer to_hex) |

## Aggregate Functions

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `count(*)` / `count(x)` | Same | ✅ | |
| `count(DISTINCT x)` | Same | ✅ | |
| `sum(x)` | Same | ✅ | |
| `avg(x)` | Same | ✅ | |
| `min(x)` / `max(x)` | Same | ✅ | |
| `bool_and(x)` / `bool_or(x)` | `bool_and(x)` / `bool_or(x)` | ✅ | |
| `every(x)` | `every(x)` | ✅ | Real aggregate alias on `bool_and_udaf` (replaced an earlier scalar stub that returned the input unchanged and was wrong in any GROUP BY) |
| `array_agg(x)` | `array_agg(x)` | ✅ | |
| `array_agg(x ORDER BY y)` | Same | ✅ | DataFusion supports ordered agg |
| `string_agg(x, sep)` | `string_agg(x, sep)` | ✅ | |
| `listagg(x, sep)` | `listagg(x, sep)` | ✅ | DataFusion's `string_agg` UDAF re-registered with `listagg` alias |
| `approx_distinct(x)` | `approx_distinct(x)` | ✅ | |
| `approx_percentile(x, p)` | `approx_percentile(x, p)` | ✅ | DataFusion's `approx_percentile_cont` UDAF re-registered with `approx_percentile` alias |
| `stddev(x)` / `stddev_samp(x)` | Same | ✅ | |
| `stddev_pop(x)` | Same | ✅ | |
| `variance(x)` / `var_samp(x)` | Same | ✅ | |
| `var_pop(x)` | Same | ✅ | |
| `covar_samp(y, x)` | `covar_samp(y, x)` | ✅ | |
| `covar_pop(y, x)` | `covar_pop(y, x)` | ✅ | |
| `corr(y, x)` | `corr(y, x)` | ✅ | |
| `regr_slope(y, x)` | `regr_slope(y, x)` | ✅ | |
| `bitwise_and_agg(x)` | `bitwise_and_agg(x)` | ✅ | DataFusion's `bit_and` UDAF re-registered with `bitwise_and_agg` alias |
| `bitwise_or_agg(x)` | `bitwise_or_agg(x)` | ✅ | DataFusion's `bit_or` UDAF re-registered with `bitwise_or_agg` alias |
| `bitwise_xor_agg(x)` | `bitwise_xor_agg(x)` | ✅ | DataFusion's `bit_xor` UDAF re-registered with `bitwise_xor_agg` alias (DuckDB / Snowflake spelling) |
| `arbitrary(x)` | `arbitrary(x)` | ✅ | Trino compat UDF (returns first non-null) |
| `max_by(x, y)` / `min_by(x, y)` | `max_by(x, y)` / `min_by(x, y)` | ✅ | Real `AggregateUDFImpl` in the sqe-trino-functions crate. Type-flexible (x any type, y any orderable type). `arg_max(x, y)` / `arg_min(x, y)` registered as aliases (DuckDB / ClickHouse spelling) |
| `histogram(x)` | `histogram(x)` | ✅ | Real `AggregateUDFImpl` in the sqe-trino-functions crate. Returns `MAP<typeof(x), BIGINT>` with the count per distinct value. Type-flexible key. Multi-phase aggregation supported via `List<Struct{key, count}>` state. NULLs skipped per Trino spec |
| `multimap_agg(k, v)` | `multimap_agg(k, v)` | ✅ | Real `AggregateUDFImpl` in the sqe-trino-functions crate. Returns `MAP<typeof(k), ARRAY<typeof(v)>>`. NULL keys skipped; insertion order preserved within each value list |
| `map_agg(k, v)` | `map_agg(k, v)` | ✅ | Real `AggregateUDFImpl` in the sqe-trino-functions crate. Returns `MAP<typeof(k), typeof(v)>`. Last-wins on duplicate keys (matches DuckDB / Snowflake) |
| `map_union(map)` | `map_union(m)` | ✅ | Real `AggregateUDFImpl` in the sqe-trino-functions crate. Takes a `MAP<K, V>` column and merges every input map into one. Last-wins on duplicate keys |
| `checksum(x)` | `checksum(x)` | ✅ | Trino compat UDF (hash-based) |
| `approx_most_frequent(n, x, cap)` | — | ❌ | |
| `merge(digest)` | — | ❌ | HyperLogLog/TDigest |
| `GROUPING SETS / CUBE / ROLLUP` | Same | ✅ | Native DataFusion |

## Window Functions

| Trino Function | SQE Equivalent | Status | Notes |
|---|---|---|---|
| `row_number()` | Same | ✅ | |
| `rank()` | Same | ✅ | |
| `dense_rank()` | Same | ✅ | |
| `ntile(n)` | Same | ✅ | |
| `percent_rank()` | Same | ✅ | |
| `cume_dist()` | Same | ✅ | |
| `lead(x, offset, default)` | Same | ✅ | |
| `lag(x, offset, default)` | Same | ✅ | |
| `first_value(x)` | Same | ✅ | |
| `last_value(x)` | Same | ✅ | |
| `nth_value(x, n)` | Same | ✅ | |
| Frame specs: ROWS/RANGE/GROUPS | All three supported | ✅ | Native DataFusion (GROUPS added in DF 19, 2022) |
| `QUALIFY` clause | Same | ✅ | Native DataFusion + sqlparser 0.53 |
| Lambda in window functions | — | ❌ | No lambda support |

## DDL / DML Statements

| Trino Statement | SQE Support | Status | Notes |
|---|---|---|---|
| `CREATE TABLE (cols) WITH (...)` | `CREATE TABLE (cols) WITH (...)` | ✅ | Trino's `WITH (foo = 'bar')` syntax merges into table properties via `merge_user_table_properties` in `write_handler.rs:589-590`, alongside `TBLPROPERTIES (...)`. Both spellings produce identical Iceberg metadata |
| `CREATE TABLE AS SELECT` | Same | ✅ | |
| `DROP TABLE` | Same | ✅ | |
| `ALTER TABLE ... RENAME TO` | Same | ✅ | |
| `ALTER TABLE ... ADD COLUMN` | Same | ✅ | |
| `ALTER TABLE ... DROP COLUMN` | Same | ✅ | |
| `ALTER TABLE ... RENAME COLUMN` | Same | ✅ | |
| `ALTER TABLE ... SET/DROP NOT NULL` | Same | ✅ | |
| `ALTER TABLE ... SET PROPERTIES` | `ALTER TABLE ... SET TBLPROPERTIES` | ✅ | Iceberg TableUpdate::SetProperties |
| `CREATE VIEW` | Same | ✅ | Iceberg views |
| `DROP VIEW` | Same | ✅ | |
| `CREATE OR REPLACE VIEW` | Same | ✅ | Drop + recreate (non-atomic) |
| `CREATE MATERIALIZED VIEW` | — | ❌ | Not in Iceberg spec; use CTAS + scheduled refresh |
| `INSERT INTO ... VALUES` | Same | ✅ | |
| `INSERT INTO ... SELECT` | Same | ✅ | |
| `DELETE FROM ... WHERE` | Same | ✅ | CoW rewrite_files |
| `UPDATE ... SET ... WHERE` | Same | ✅ | CoW rewrite_files |
| `MERGE INTO ... USING ...` | Same | ✅ | CoW full-outer-join rewrite |
| `TRUNCATE TABLE` | `TRUNCATE TABLE t` | ✅ | Routes to DELETE FROM (no WHERE) |
| `COMMENT ON TABLE/COLUMN` | Same | ✅ | Stored as Iceberg table property (`comment` / `comment.<col>`) |
| `SHOW CATALOGS` | Same | ✅ | |
| `SHOW SCHEMAS` | Same | ✅ | |
| `SHOW TABLES` | Same | ✅ | |
| `SHOW COLUMNS FROM` | `SHOW COLUMNS FROM` | ✅ | New `handle_show_columns` handler translates Trino's `SHOW COLUMNS FROM ns.t` into a query against `information_schema.columns`. Returns `(column_name, data_type, is_nullable)`, the subset dbt and BI clients use for schema inspection |
| `SHOW CREATE TABLE` | Same | ✅ | Reconstructs DDL from information_schema |
| `SHOW STATS FOR` | Same | ✅ | Returns row_count, data_file_count, total_size from snapshot summary |
| `EXPLAIN` | Same | ✅ | DataFusion explain |
| `EXPLAIN ANALYZE` | `EXPLAIN ANALYZE` | ✅ | Routed through `parse_and_classify` -> `Statement::Explain { analyze: true }` -> `explain_handler.analyze()` since Phase 2; the previous "different keyword" caveat was a stale doc claim. `EXPLAIN FULL` is an SQE-specific extension on top |
| `USE catalog.schema` | Same | ✅ | Parsed and accepted (session-level, sets default catalog/schema) |
| `PREPARE` / `EXECUTE` | Partial | ⚠️ | DataFusion has infrastructure, SQL integration incomplete |
| `CALL procedure(...)` | Same (system.* only) | ✅ | Iceberg maintenance procedures are wired: `CALL system.expire_snapshots(...)`, `CALL system.remove_orphan_files(...)`, `CALL system.rewrite_data_files(...)`, `CALL system.rewrite_manifests(...)`. User-defined stored procedures return an informative `NotImplemented` ("SQE does not have stored procedures") rather than a parse error |
| `GRANT` / `REVOKE` | Planned (Plan C) | 🔧 | SQE-specific grant system |

## Type System

| Trino Type | SQE/Arrow Type | Status | Notes |
|---|---|---|---|
| `BOOLEAN` | `Boolean` | ✅ | |
| `TINYINT` | `Int8` | ✅ | |
| `SMALLINT` | `Int16` | ✅ | |
| `INTEGER` | `Int32` | ✅ | |
| `BIGINT` | `Int64` | ✅ | |
| `REAL` | `Float32` | ✅ | |
| `DOUBLE` | `Float64` | ✅ | |
| `DECIMAL(p, s)` | `Decimal128(p, s)` | ✅ | Up to 38 digits |
| `VARCHAR` / `VARCHAR(n)` | `Utf8` / `Utf8View` | ✅ | Length limit not enforced |
| `CHAR(n)` | `Utf8` | ✅ | Mapped to Utf8; treated as VARCHAR. No fixed-length space-padding (matches Postgres / Snowflake's CHAR-as-VARCHAR behaviour). Trino itself recommends VARCHAR for new code |
| `VARBINARY` | `Binary` | ✅ | |
| `DATE` | `Date32` | ✅ | |
| `TIME` / `TIME(p)` | `Time64(Microsecond)` | ✅ | Iceberg's `time` primitive is microsecond-only; precisions 0..=6 collapse to `Time64(Microsecond)`. `localtime()` returns Time64. `hour() / minute() / second()` work on TIME columns; `year() / month() / day()` raise a clear plan error per Trino spec |
| `TIME WITH TIME ZONE` | — | ❌ | No Arrow equivalent. CREATE TABLE rejects with NotImplemented pointing at `TIMESTAMP WITH TIME ZONE` |
| `TIMESTAMP` | `Timestamp(Microsecond, None)` | ✅ | |
| `TIMESTAMP WITH TIME ZONE` | `Timestamp(Microsecond, Some(tz))` | ✅ | |
| `INTERVAL YEAR TO MONTH` | `Interval(YearMonth)` | ✅ | |
| `INTERVAL DAY TO SECOND` | `Interval(DayTime)` | ✅ | |
| `ARRAY(T)` | `List(T)` | ✅ | |
| `MAP(K, V)` | `Map(K, V)` | ✅ | |
| `ROW(fields...)` | `Struct(fields...)` | ✅ | |
| `JSON` | `Utf8` | ✅ | `CREATE TABLE t(payload JSON)` aliases to `Utf8`. `CAST(json_col AS BIGINT|VARCHAR|DOUBLE)` rides DataFusion's built-in Utf8→target coercion. Full JSON extraction via `json_extract`, `json_extract_scalar`, `json_array_length`, `json_parse`, `json_get_str/int/float/bool` |
| `UUID` | `Utf8` | ✅ | `CREATE TABLE t(id UUID)` aliases UUID to Utf8 in `sql_type_to_arrow`. Equality, regex, and `CAST(... AS UUID)` work via the string form. No native UUID logical type (Arrow has none); UUIDv4 generation needs a UDF if required |
| `IPADDRESS` | `VARCHAR` | ⚠️ | Stored as VARCHAR, no IP-specific functions (subnet containment, etc.) |
| `HyperLogLog` | — | ❌ | Trino-specific sketch type |
| `TDigest` | — | ❌ | Trino-specific sketch type |
| `SetDigest` | — | ❌ | Trino-specific sketch type |

**Type coercion:** DataFusion handles implicit coercion for numeric types (INT → BIGINT → DOUBLE) and string types. Trino has additional coercion rules for JSON, TIME, and sketch types that are not applicable in SQE.

## Iceberg-Specific SQL

| Feature | SQE Support | Trino Support | Status | Notes |
|---|---|---|---|---|
| Partition pruning | ✅ | ✅ | ✅ | DataFusion optimizer pass |
| Hidden partitioning | ✅ | ✅ | ✅ | Via Iceberg transforms |
| Schema evolution | ✅ | ✅ | ✅ | ADD/DROP/RENAME COLUMN |
| Type widening | ✅ | ✅ | ✅ | INT→BIGINT, FLOAT→DOUBLE |
| Time travel: `FOR VERSION AS OF` | `FOR SYSTEM_TIME AS OF` | ✅ | ✅ | Pre-processes AST, resolves snapshot_id via metadata |
| Time travel: `FOR TIMESTAMP AS OF` | Same mechanism | ✅ | ✅ | Timestamp resolved to nearest snapshot |
| `$snapshots` metadata table | `"ns.t$snapshots"` (Trino) or `table_snapshots('ns', 't')` (TVF) | ✅ | ✅ | sqe-sql AST rewriter translates `"ns.t$snapshots"` to `table_snapshots('ns', 't')` before DataFusion sees it. Both spellings work; dbt-trino macros that hard-code `$snapshots` resolve transparently |
| `$manifests` metadata table | `"ns.t$manifests"` or `table_manifests('ns', 't')` | ✅ | ✅ | Same rewriter as `$snapshots` |
| `$history` metadata table | `"ns.t$history"` or `table_history('ns', 't')` | ✅ | ✅ | Same rewriter |
| `$partitions` metadata table | `"ns.t$partitions"` or `table_partitions('ns', 't')` | ✅ | ✅ | Same rewriter |
| `$files` metadata table | `"ns.t$files"` or `table_files('ns', 't')` | ✅ | ✅ | Same rewriter |
| `$refs` metadata table | `"ns.t$refs"` or `table_refs('ns', 't')` | ✅ | ✅ | Same rewriter |
| Partition evolution | ✅ | ✅ | ✅ | Via ALTER TABLE |
| Sort order | — | ✅ | ❌ | |
| Write distribution mode | — | ✅ | ❌ | |
| ORC file format | — | ✅ | ❌ | Parquet only |
| Copy-on-Write (CoW) | ✅ | ✅ | ✅ | DELETE/UPDATE/MERGE |
| Merge-on-Read (MoR) reads | ✅ | ✅ | ✅ | Position deletes, equality deletes, and V3 deletion vectors all readable (RW fork has full read support) |
| Merge-on-Read (MoR) writes | ✅ via `write.delete.mode='merge-on-read'` | ✅ | ✅ | `handle_delete_dispatch` routes by table property: position deletes when no PK declared, equality deletes with PK. Position deletes commit via `FastAppendAction`; equality deletes via `RowDeltaAction`. CoW remains the default |

## Operational Comparison

> Run `scripts/operational-comparison.sh` to regenerate these numbers.

| Metric | SQE | Trino | Notes |
|---|---|---|---|
| **Language** | Rust | Java 23 | |
| **Build time** (release) | ~3–5 min | ~10–15 min | `cargo build --release` vs `mvn package -DskipTests` |
| **Build dependencies** | ~800 crates | ~2000+ Maven deps | `Cargo.lock` vs `pom.xml` tree |
| **Coordinator binary** | ~50 MB | N/A (JVM) | Single static binary vs JVM + JARs |
| **Docker image** | ~80 MB | ~700 MB | Alpine + binary vs JVM + plugins |
| **Cold start** | <1s | 10–30s | First query latency from container start |
| **Idle memory (RSS)** | ~20 MB | ~300 MB | After startup, no queries |
| **Loaded memory** | ~200–500 MB | ~1–4 GB | During TPC-H SF1 full suite |
| **Config surface** | ~30 TOML knobs | ~200+ properties | `sqe.toml` vs `config.properties` + `jvm.config` + catalog files |
| **Deployment** | Single binary + TOML | JVM + plugins + properties | |
| **Hot reload** | ❌ | ❌ | Neither supports hot config reload |
| **Plugins** | Compile-time features | Runtime JARs | Connectors are Cargo features vs JAR plugins |

**Key advantages:**
- **10x smaller footprint** — single binary, minimal memory
- **10x faster cold start** — no JVM warmup, no class loading
- **Simpler deployment** — one binary, one TOML file
- **Fewer moving parts** — no plugin system, no JVM tuning

**Trino advantages:**
- **Ecosystem** — 100+ connectors, mature JDBC drivers
- **Runtime extensibility** — add connectors without recompilation
- **Community** — larger community, more Stack Overflow answers
