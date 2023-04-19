# Kysely Deno Postgres driver

## usage

```ts
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { Kysely, Generated } from "https://esm.sh/kysely@0.23.4";
import { PostgresDialect } from "https://deno.land/x/kysely_postgres/mod.ts";

// Create a database pool with three connections that are lazily established.
const pool = new Pool(
  {
    database: "postgres",
    hostname: "localhost",
    user: "postgres",
    port: 54322,
    password: Deno.env.get("DB_PASSWORD"),
  },
  3,
  true
);

// You'd create one of these when you start your app.
const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
```

## Reference

Based on node driver for postgres https://github.com/koskimas/kysely/tree/master/src/dialect/postgres
