import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: databaseUrl && databaseUrl.startsWith('postgresql') ? "postgresql" : "sqlite",
  dbCredentials: databaseUrl && databaseUrl.startsWith('postgresql') 
    ? { url: databaseUrl }
    : { url: "dev.db" },
});
