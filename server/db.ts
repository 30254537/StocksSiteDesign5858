import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Use SQLite for development if no DATABASE_URL is provided
const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle>;

if (databaseUrl && databaseUrl.startsWith('postgresql')) {
  // Use PostgreSQL for production
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle: drizzleNeon } = await import('drizzle-orm/neon-serverless');
  const ws = await import('ws');
  
  neonConfig.webSocketConstructor = ws.default;
  const pool = new Pool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool, schema });
} else {
  // Use SQLite for development
  const dbPath = path.join(process.cwd(), 'dev.db');
  const sqlite = new Database(dbPath);
  db = drizzle(sqlite, { schema });
}

export { db };
