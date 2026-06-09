
Point SQE at **AWS S3 Tables**, AWS's managed Iceberg product. Unlike Glue
(metadata only), S3 Tables bundles the catalog *and* the storage into one
service: you create a *table bucket*, and namespaces + tables live inside it.
SQE talks to it over the AWS SDK with your IAM credentials.

A small CDK stack bootstraps the throwaway table bucket and tears it down, so the
quickstart leaves nothing behind.

