
This quickstart shows how a client connects to SQE with its **own** OAuth2
`client_id` and `client_secret` (instead of a human username/password), and how
that service principal is authorized by Apache Ranger at the Polaris boundary.

It is the answer to: "can I create a service principal in Keycloak and use its
client_id/client_secret with SQE to connect and forward to Polaris, instead of
the ROPC user/password flow?" Yes. The provider is `client_credentials_passthrough`.

