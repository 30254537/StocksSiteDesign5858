import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// 如果没有设置DATABASE_URL，使用SQLite作为fallback
let db;

if (process.env.DATABASE_URL) {
  // 使用PostgreSQL (原来的配置)
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle: drizzleNeon } = await import('drizzle-orm/neon-serverless');
  const ws = await import("ws");
  const schema = await import("@shared/schema");
  
  neonConfig.webSocketConstructor = ws.default;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
} else {
  // 使用SQLite作为fallback
  const schema = await import("@shared/schema-sqlite");
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  const sqlite = new Database(dbPath);
  db = drizzle({ client: sqlite, schema });
  
  console.log(`Using SQLite database at: ${dbPath}`);
}

export { db };
