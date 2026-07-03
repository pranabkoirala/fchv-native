// db/index.ts
import * as SQLite from "expo-sqlite";
import { MIGRATIONS, SCHEMA_VERSION } from "./migrations";
import { SCHEMA_SQL } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

// Get the DB singleton (async open)
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("myapp.db");
  }
  return dbPromise;
}

export function isDatabaseInitInProgress(): boolean {
  return initPromise !== null;
}

async function initSyncDefaultColumns(): Promise<void> {
  const db = await getDb();

  await db.runAsync(
    `INSERT OR IGNORE INTO sync (table_name, last_synced_at)
     VALUES (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL), (?, NULL);`,
    [
      "mother",
      "visit",
      "pnc_visit",
      "todo",
      "pregnancy",
      "adolescent_ifa",
      "child_monitoring",
      "mothers_group_meetings",
      "hmis_maternal_death",
      "hmis_newborn_death",
      "supplements",
      "family_planning",
      "counseling_referral",
      "child_counseling",
      "child_vaccination",
      "delivery",
      "child_birth_registration",
      "child_death_registration",
      "fchv_counseling",
      "child_nutrition",
    ],
  );
}
                                                                                                         

async function getUserVersion(
  db: SQLite.SQLiteDatabase
): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;"
  );
  return row?.user_version ?? 0;
}

async function setUserVersion(
  db: SQLite.SQLiteDatabase,
  version: number
): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}


async function hasAnyUserTables(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'android_metadata'"
  );
  return (row?.count ?? 0) > 0;
}

async function tableHasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
  return columns.some((row) => row.name === column);
}

async function repairLegacyChildColumn(
  db: SQLite.SQLiteDatabase,
  table: string
): Promise<void> {
  const hasChild = await tableHasColumn(db, table, "child");
  const hasChildId = await tableHasColumn(db, table, "child_id");

  if (hasChild && hasChildId) {
    await db.execAsync(
      `UPDATE ${table} SET child = child_id WHERE child IS NULL OR child = '';`
    );
    return;
  }

  if (!hasChild && hasChildId) {
    await db.execAsync(`ALTER TABLE ${table} RENAME COLUMN child_id TO child;`);
  }
}

async function repairLegacyColumnsBeforeSchema(
  db: SQLite.SQLiteDatabase
): Promise<void> {
  await db.execAsync(`
    DROP INDEX IF EXISTS idx_child_vaccination_child_id;
    DROP INDEX IF EXISTS idx_child_counseling_child_id;
  `);

  const childTables = [
    "child_counseling",
    "child_counseling_staging",
    "child_vaccination",
    "child_vaccination_staging",
  ];

  for (const table of childTables) {
    await repairLegacyChildColumn(db, table);
  }
}

async function applyMigrations(
  db: SQLite.SQLiteDatabase,
  fromVersion: number
): Promise<number> {
  const pending = [...MIGRATIONS]
    .sort((a, b) => a.version - b.version)
    .filter((m) => m.version > fromVersion);

  let currentVersion = fromVersion;
  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await setUserVersion(db, migration.version);
    });
    currentVersion = migration.version;
  }

  return currentVersion;
}

export async function initDatabase(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await getDb();

    const hadTables = await hasAnyUserTables(db);
    if (hadTables) {
      await repairLegacyColumnsBeforeSchema(db);
    }

    await db.execAsync(SCHEMA_SQL); // Executes all schema SQL at once

    let userVersion = await getUserVersion(db);
    if (userVersion === 0) {
      if (hadTables) {
        userVersion = await applyMigrations(db, 0);
      } else {
        await setUserVersion(db, SCHEMA_VERSION);
        userVersion = SCHEMA_VERSION;
      }
    }

    if (userVersion < SCHEMA_VERSION) {
      await applyMigrations(db, userVersion);
    }

    await initSyncDefaultColumns();
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null;
    throw err;
  }

  return initPromise;
}

export async function clearDatabase(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    await db.closeAsync();
    dbPromise = null;
  }

  initPromise = null;

  await SQLite.deleteDatabaseAsync("myapp.db");

  await initDatabase();

  console.log("DATABASE FULLY RESET");
}
