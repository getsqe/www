
[Project Nessie](https://projectnessie.org/) is a transactional, git-like
catalog for Iceberg tables. It exposes the **Iceberg REST protocol**, the same
surface Polaris exposes, so SQE talks to it through the identical `rest` catalog
code path. Swapping Polaris for Nessie is a one-line config change: point
`polaris_url` at Nessie's `/iceberg` endpoint.

This quickstart is about the **catalog**, not auth. Nessie runs auth-less and
SQE uses its `anonymous` provider, so there is no Keycloak and no token to
manage. For the auth story (real identities, RBAC, token passthrough) see the
[polaris-keycloak-client-id](../polaris-keycloak-client-id/) and
[polaris-keycloak-user-token](../polaris-keycloak-user-token/) quickstarts.

