
Point SQE at the **AWS Glue Data Catalog**. Glue is the catalog (table metadata)
and S3 is the storage; SQE talks to both over the AWS SDK using your IAM
credentials. No Polaris, no Keycloak, no RustFS.

A small CDK stack bootstraps the throwaway test resource (an S3 warehouse
bucket) and tears it back down, so the quickstart leaves nothing behind.

