import { defineConfig } from "drizzle-kit";

export default {
  dialect: "sqlite",
  driver: "turso",
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    url: process.env.DB_URL!,
    authToken: process.env.DB_TOKEN!,
  },
};
