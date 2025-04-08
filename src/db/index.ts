import { createClient, type ResultSet } from "@libsql/client";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

if (!import.meta.env.DB_URL || !import.meta.env.DB_TOKEN) {
  throw new Error("DB_URL and DB_TOKEN environment variables are required");
}

const client = createClient({
  url: import.meta.env.DB_URL,
  authToken: import.meta.env.DB_TOKEN,
});

export const db = drizzle(client, {
  schema,
  logger: false,
  casing: "snake_case",
});

type Schema = typeof schema;

export type Transaction = SQLiteTransaction<
  "async",
  ResultSet,
  Schema,
  ExtractTablesWithRelations<Schema>
>;
