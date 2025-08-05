import { defineConfig } from "drizzle-kit";

// 如果没有DATABASE_URL，使用SQLite
const config = !process.env.DATABASE_URL ? {
  out: "./migrations",
  schema: "./shared/schema-sqlite.ts",
  dialect: "sqlite" as const,
  dbCredentials: {
    url: "./database.sqlite",
  },
} : {
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql" as const,
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};

if (!process.env.DATABASE_URL) {
  console.log("No DATABASE_URL found, using SQLite configuration");
}

export default defineConfig(config);
