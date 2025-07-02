#!/usr/bin/env node

import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "../.env") });

const useLocal = process.env.USE_LOCAL_DB === "true";

const database = useLocal
  ? createClient({ url: "file:database/dev.db" })
  : createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

const migrationName = process.argv[2];

if (!migrationName) {
  console.log(`
🗑️  Clean Migration Tool

Usage:
  node scripts/clean-migration.js <migration-filename>

Examples:
  node scripts/clean-migration.js 001_create_notes_table.sql
  node scripts/clean-migration.js 002_add_indexes.sql

This will remove the migration record from migrations_log, allowing it to be re-executed.
`);
  process.exit(1);
}

try {
  const result = await database.execute({
    sql: 'DELETE FROM migrations_log WHERE filename = ?',
    args: [migrationName]
  });
  
  if (result.rowsAffected > 0) {
    console.log(`✅ Cleaned migration record: ${migrationName}`);
    console.log(`🗄️  Database: ${useLocal ? 'Local SQLite' : 'Turso Cloud'}`);
  } else {
    console.log(`❌ Migration record not found: ${migrationName}`);
  }
} catch (error) {
  console.error("Error:", error.message);
}