import { defineConfig } from "drizzle-kit";

if (!process.env.DB_URL || !process.env.DB_TOKEN) {
  throw new Error("DB_URL and DB_TOKEN missing");
}
export default defineConfig({
  dialect: "sqlite",
  driver: "turso",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DB_URL!,
    authToken: process.env.DB_TOKEN!,
  },
});
