
A second access-control option for Apache Polaris. SQE translates `GRANT` /
`REVOKE` / `SHOW GRANTS` into Apache Ranger Admin REST calls (the `ranger`
access-control backend). Polaris 1.5's embedded Ranger authorizer enforces those
policies when SQE asks Polaris for table access on behalf of a user. On top of
that, SQE reads Ranger column masks directly and renders them byte-identically
to Apache Spark + Kyuubi.

This is the path for shops that already run Ranger as their authorization plane
and want SQE and Spark to share one policy set rather than maintaining separate
grants per engine. Pick it over the OPA/Cedar policy engine when Ranger is the
existing source of truth.

