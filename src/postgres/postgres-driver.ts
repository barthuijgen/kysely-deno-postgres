import { Pool } from "../deps/postgres.ts";
import type { PoolClient, ClientOptions } from "../deps/postgres.ts";
import { CompiledQuery } from "../deps/kysely.ts";
import type {
  DatabaseConnection,
  QueryResult,
  Driver,
  TransactionSettings,
} from "../deps/kysely.ts";

const PRIVATE_RELEASE_METHOD = Symbol();

export class PostgresDriver implements Driver {
  readonly #config: ClientOptions;
  readonly #connections = new WeakMap<PoolClient, DatabaseConnection>();
  #pool: Pool | null = null;

  constructor(config: ClientOptions) {
    this.#config = config;
  }

  async init(): Promise<void> {
    // TODO: size is required unlike the node `pg` module.
    // Need to figure out what is a good value to use here
    this.#pool = new Pool(this.#config, 1);
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const client = await this.#pool!.connect();
    let connection = this.#connections.get(client);

    if (!connection) {
      connection = new PostgresConnection(client);
      this.#connections.set(client, connection);

      // The driver must take care of calling `onCreateConnection` when a new
      // connection is created. The `pg` module doesn't provide an async hook
      // for the connection creation. We need to call the method explicitly.
      // if (this.#config.onCreateConnection) {
      //   await this.#config.onCreateConnection(connection);
      // }
    }

    return connection;
  }

  async beginTransaction(
    connection: DatabaseConnection,
    settings: TransactionSettings
  ): Promise<void> {
    if (settings.isolationLevel) {
      await connection.executeQuery(
        CompiledQuery.raw(
          `start transaction isolation level ${settings.isolationLevel}`
        )
      );
    } else {
      await connection.executeQuery(CompiledQuery.raw("begin"));
    }
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("commit"));
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw("rollback"));
  }

  // deno-lint-ignore require-await
  async releaseConnection(connection: DatabaseConnection): Promise<void> {
    const pgConnection = connection as PostgresConnection;
    pgConnection[PRIVATE_RELEASE_METHOD]();
  }

  async destroy(): Promise<void> {
    if (this.#pool) {
      const pool = this.#pool;
      this.#pool = null;
      await pool.end();
    }
  }
}

class PostgresConnection implements DatabaseConnection {
  #client: PoolClient;

  constructor(client: PoolClient) {
    this.#client = client;
  }

  async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    const result = await this.#client.queryObject<O>(
      compiledQuery.sql,
      ...compiledQuery.parameters
    );

    if (result.command === "UPDATE" || result.command === "DELETE") {
      return {
        numUpdatedOrDeletedRows: BigInt(result.rowCount!),
        rows: result.rows ?? [],
      };
    }

    return {
      rows: result.rows ?? [],
    };
  }

  [PRIVATE_RELEASE_METHOD](): void {
    this.#client.release();
  }
}
