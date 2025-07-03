#!/usr/bin/env node

import { createClient } from "@libsql/client";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config({ path: join(__dirname, "../.env") });

// Database configuration
const useLocal = process.env.USE_LOCAL_DB === "true";

const database = useLocal
  ? createClient({ url: "file:database/dev.db" })
  : createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

const MIGRATIONS_DIR = join(__dirname, "../database/migrations");

// Create migrations_log table if it doesn't exist
async function createMigrationsTable() {
  try {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS migrations_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT
      )
    `);
    console.log("✅ Migrations log table ready");
  } catch (error) {
    console.error("❌ Error creating migrations table:", error.message);
    process.exit(1);
  }
}

// Get list of executed migrations
async function getExecutedMigrations() {
  try {
    const result = await database.execute(
      "SELECT filename FROM migrations_log ORDER BY id"
    );
    return result.rows.map((row) => row.filename);
  } catch (error) {
    console.error("❌ Error getting executed migrations:", error.message);
    return [];
  }
}

// Calculate simple checksum for a file content
function calculateChecksum(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Execute a single migration file
/**
 * Executes a database migration by running SQL statements from the provided content.
 *
 * The SQL statements in the content must be separated by semicolons (`;`), and each statement
 * should be a valid SQL command. Lines starting with `--` (SQL comments) are ignored.
 * Empty statements or whitespace-only statements are also ignored.
 *
 * After executing all statements, the migration is logged in the `migrations_log` table
 * with the filename and a checksum of the content.
 *
 * @async
 * @param {string} filename - The name of the migration file being executed.
 * @param {string} content - The raw SQL content to execute. Statements must be separated by semicolons (`;`).
 * @throws Will throw an error if any SQL statement fails to execute.
 */
async function executeMigration(filename, content) {
  const checksum = calculateChecksum(content);

  try {
    // Split SQL file by statements (basic approach)
    // Remove SQL comments and split by semicolon, handling single-line and multi-line cases
    const statements = content
      .split(";")
      .map((stmt) => stmt.replace(/--.*$/gm, "").trim())
      .filter((stmt) => stmt.length > 0);

    if (statements.length === 0) {
      console.warn(`⚠️  No valid SQL statements found in ${filename}`);
      return;
    }

    try {
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await database.execute(statement);
        }
      }

      // Log the migration
      await database.execute({
        sql: "INSERT INTO migrations_log (filename, checksum) VALUES (?, ?)",
        args: [filename, checksum],
      });

      console.log(`✅ Executed migration: ${filename}`);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error(`❌ Error executing migration ${filename}:`, error.message);
    throw error;
  }
}

// Main migration function
async function runMigrations() {
  console.log("🚀 Starting database migrations...");
  console.log(`📁 Migrations directory: ${MIGRATIONS_DIR}`);
  console.log(`🗄️  Database: ${useLocal ? "Local SQLite" : "Turso Cloud"}\n`);

  try {
    // Create migrations table
    await createMigrationsTable();

    // Get list of migration files
    const migrationFiles = await readdir(MIGRATIONS_DIR);
    const sqlFiles = migrationFiles
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Ensure proper order

    if (sqlFiles.length === 0) {
      console.log("📝 No migration files found");
      return;
    }

    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Find pending migrations
    const pendingMigrations = sqlFiles.filter(
      (file) => !executedMigrations.includes(file)
    );

    if (pendingMigrations.length === 0) {
      console.log("✨ All migrations are up to date!");
      return;
    }

    console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach((file) => console.log(`   - ${file}`));
    console.log();

    // Execute pending migrations
    for (const filename of pendingMigrations) {
      const filePath = join(MIGRATIONS_DIR, filename);
      const content = await readFile(filePath, "utf-8");
      await executeMigration(filename, content);
    }

    console.log(
      `\n🎉 Successfully executed ${pendingMigrations.length} migration(s)!`
    );
  } catch (error) {
    console.error("\n💥 Migration failed:", error.message);
    process.exit(1);
  }
}

// Status command - show migration status
async function showStatus() {
  console.log("📊 Migration Status\n");

  try {
    await createMigrationsTable();

    // Get all migration files
    const migrationFiles = await readdir(MIGRATIONS_DIR);
    const sqlFiles = migrationFiles
      .filter((file) => file.endsWith(".sql"))
      .sort();

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();

    if (sqlFiles.length === 0) {
      console.log("📝 No migration files found");
      return;
    }

    console.log("Migration files:");
    sqlFiles.forEach((file) => {
      const status = executedMigrations.includes(file)
        ? "✅ EXECUTED"
        : "⏳ PENDING";
      console.log(`  ${status} ${file}`);
    });

    const pendingCount = sqlFiles.length - executedMigrations.length;
    console.log(
      `\n📈 Total: ${sqlFiles.length} migrations, ${pendingCount} pending`
    );
  } catch (error) {
    console.error("❌ Error checking status:", error.message);
    process.exit(1);
  }
}

// Main execution
const command = process.argv[2];

switch (command) {
  case "status":
    await showStatus();
    break;
  case "run":
  case undefined:
    await runMigrations();
    break;
  default:
    console.log(`
🗄️  Database Migration Tool

Usage:
  node scripts/migrate.js [command]

Commands:
  run      Run pending migrations (default)
  status   Show migration status

Examples:
  node scripts/migrate.js          # Run migrations
  node scripts/migrate.js run      # Run migrations
  node scripts/migrate.js status   # Show status
`);
    break;
}

process.exit(0);
