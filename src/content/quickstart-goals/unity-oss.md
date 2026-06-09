
[Unity Catalog OSS](https://github.com/unitycatalog/unitycatalog) exposes an
Iceberg REST adapter, so SQE connects to it through the same `rest` catalog code
path it uses for Polaris and Nessie. This quickstart points SQE at Unity and
**browses the catalog**: it lists namespaces and tables.

Be clear-eyed about the limitation: **Unity OSS's Iceberg REST adapter is
read-only at this version**. Create / drop / commit are not supported, and the
bundled table is not served as a loadable Iceberg table, so `SELECT` does not
work either ([unitycatalog#3](https://github.com/unitycatalog/unitycatalog/issues/3)).
For full read and write against an Iceberg REST catalog, use the
[Polaris](../polaris-keycloak-client-id/) or [Nessie](../nessie/) quickstarts.
This one exists to show the connection works and to document the boundary.

