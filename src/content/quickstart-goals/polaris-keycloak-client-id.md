
Run SQE against an Apache Polaris catalog where **Keycloak** issues the
identities. A user connects to SQE with a username and password; SQE exchanges
those for that user's bearer token using its own confidential client
(`sqe-client` + secret), then passes the token straight through to Polaris.
Polaris decides what the user can see. No service account, no shared
credential: every query runs as the authenticated user.

This is the path you want when an OIDC provider already owns your users and you
want SQE to mint their tokens for them (JDBC tools, the CLI, dbt). If instead
your clients already hold a token and just want SQE to accept it, see the
`polaris-keycloak-user-token` quickstart.

