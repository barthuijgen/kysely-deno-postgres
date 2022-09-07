# Kysely Deno Postgres driver

## usage

```ts
import { Kysely } from "https://cdn.jsdelivr.net/npm/kysely/dist/esm/index.js";
import { PostgresDialect } from "https://deno.land/x/kysely_postgres/mod.ts";

const db = new Kysely<{}>({
  dialect: new PostgresDialect({
    // ...
  }),
});
```

## Reference

Based on node driver for postgres https://github.com/koskimas/kysely/tree/master/src/dialect/postgres
