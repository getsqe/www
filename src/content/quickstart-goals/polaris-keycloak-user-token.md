
The bring-your-own-token path. An upstream application or identity provider has
already authenticated the user and holds their bearer token. The client sends
that token to SQE with `--token`; SQE validates it (signature, issuer, expiry)
against the realm's public keys and passes it through to Polaris. SQE never sees
a password and holds no client secret.

This is the path for pre-authenticated callers: a backend that already did the
OIDC dance, a CI job with a service-account token, a gateway that injects the
user's JWT. If instead you want SQE to mint tokens from a username + password,
use the [`polaris-keycloak-client-id`](../polaris-keycloak-client-id/) quickstart.

