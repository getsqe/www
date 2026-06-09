
Point SQE at an AWS Glue database that **Lake Formation governs**. Unlike the
[`aws-glue`](../aws-glue/) quickstart, which lets SQE create the database (making
the caller its owner to side-step LF), here the database is created by
CloudFormation. In a Lake-Formation-enabled account that means it is governed
with no grants, so SQE is **denied** until you grant it LF permissions
explicitly. The run shows the denial, the grant, and the same statement
succeeding.

