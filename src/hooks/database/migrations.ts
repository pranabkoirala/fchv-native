import * as SQLite from "expo-sqlite";

export const SCHEMA_VERSION = 85;

type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

type TableInfoRow = {
  name: string;
};

async function tableHasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table});`);
  return columns.some((row) => row.name === column);
}

async function getMotherSelectExpression(
  db: SQLite.SQLiteDatabase,
  table: string,
): Promise<string> {
  const hasMother = await tableHasColumn(db, table, "mother");
  const hasMotherId = await tableHasColumn(db, table, "mother_id");

  if (hasMother && hasMotherId) return "COALESCE(NULLIF(mother, ''), mother_id)";
  if (hasMother) return "mother";
  if (hasMotherId) return "mother_id";

  return "''";
}

async function repairMotherColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
): Promise<void> {
  const columns = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table});`);
  if (!columns.length) return;

  const hasMother = columns.some((row) => row.name === "mother");
  const hasMotherId = columns.some((row) => row.name === "mother_id");
  if (hasMother && hasMotherId) {
    await db.execAsync(
      `UPDATE ${table} SET mother = mother_id WHERE mother IS NULL OR mother = '';`,
    );
    return;
  }

  if (hasMother) return;

  if (hasMotherId) {
    await db.execAsync(`ALTER TABLE ${table} RENAME COLUMN mother_id TO mother;`);
    return;
  }

  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN mother TEXT;`);
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    up: async (db) => { }
  },
  {
    version: 2,
    up: async (db) => {
      // Force table refresh for the new schema since development db may have dirty state
      await db.execAsync(`
        DROP TABLE IF EXISTS pregnancy;
        DROP TABLE IF EXISTS mother;
        DROP TABLE IF EXISTS sync;
      `);

      const { SCHEMA_SQL } = require('./schema');
      await db.execAsync(SCHEMA_SQL);
    }
  },
  {
    version: 3,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE mother ADD COLUMN photo TEXT;`);
      } catch (e) {
        console.log("Migration 3 (photo column) already applied or failed:", e);
      }
    }
  },
  {
    version: 4,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE mother ADD COLUMN ethnicity TEXT;
          ALTER TABLE mother ADD COLUMN education TEXT;
        `);
      } catch (e) {
        console.log("Migration 4 failed or columns already exist:", e);
      }
    }
  },
  {
    version: 5,
    up: async (db) => {
      try {
        await db.execAsync(`
          DROP TABLE IF EXISTS visit;
          CREATE TABLE IF NOT EXISTS visit (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            address TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
            visit_notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );
        `);
      } catch (e) {
        console.log("Migration 5 (visit table) failed:", e);
      }
    }
  },
  {
    version: 6,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE mother ADD COLUMN code TEXT;
        `);
      } catch (e) {
        console.log("Migration 6 (code column) already applied or failed:", e);
      }
      try {
        await db.execAsync(`
          ALTER TABLE pregnancy ADD COLUMN mother TEXT;
        `);
      } catch (e) {
        console.log("Migration 6 (mother column) already applied or failed:", e);
      }
    }
  },
  {
    version: 7,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS hmis_record (
            id TEXT PRIMARY KEY,
            serial_no INTEGER,
            date_day INTEGER,
            date_month INTEGER,
            date_year INTEGER,
            mother_name TEXT,
            mother_age INTEGER,
            lmp_day INTEGER,
            lmp_month INTEGER,
            lmp_year INTEGER,
            edd_day INTEGER,
            edd_month INTEGER,
            edd_year INTEGER,
            counseling_given INTEGER,
            checkup_12 INTEGER,
            checkup_16 INTEGER,
            checkup_20_24 INTEGER,
            checkup_28 INTEGER,
            checkup_32 INTEGER,
            checkup_34 INTEGER,
            checkup_36 INTEGER,
            checkup_38_40 INTEGER,
            checkup_other TEXT,
            iron_preg_received INTEGER,
            iron_pnc_received INTEGER,
            vit_a_received INTEGER,
            delivery_place TEXT,
            newborn_condition TEXT,
            pnc_check_24hr INTEGER,
            pnc_check_3day INTEGER,
            pnc_check_7_14day INTEGER,
            pnc_check_42day INTEGER,
            pnc_check_other TEXT,
            family_planning_used INTEGER,
            remarks TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 7 (hmis_record table) failed:", e);
      }
    }
  },
  {
    version: 8,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS hmis_maternal_death (
            id TEXT PRIMARY KEY,
            mother TEXT,
            serial_no INTEGER,
            mother_name TEXT,
            mother_age INTEGER,
            death_condition TEXT,
            death_day INTEGER,
            death_month INTEGER,
            death_year INTEGER,
            delivery_place TEXT,
            death_place TEXT,
            remarks TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );
        `);
      } catch (e) {
        console.log("Migration 8 (hmis_maternal_death table) failed:", e);
      }
    }
  },
  {
    version: 9,
    up: async (db) => {
      const queries = [
        "ALTER TABLE hmis_maternal_death ADD COLUMN death_condition_other TEXT;",
        "ALTER TABLE hmis_maternal_death ADD COLUMN delivery_place_other TEXT;",
        "ALTER TABLE hmis_maternal_death ADD COLUMN death_place_other TEXT;",
        "ALTER TABLE hmis_newborn_death ADD COLUMN delivery_place_other TEXT;",
        "ALTER TABLE hmis_newborn_death ADD COLUMN birth_condition_other TEXT;",
        "ALTER TABLE hmis_newborn_death ADD COLUMN cause_of_death_other TEXT;",
        "ALTER TABLE hmis_newborn_death ADD COLUMN death_place_other TEXT;"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 9 query failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 10,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE hmis_newborn_death ADD COLUMN baby_name TEXT;`);
      } catch (e) {
        console.log("Migration 10 (baby_name column) already applied or failed:", e);
      }
    }
  },
  {
    version: 11,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS hmis_child_death (
            id TEXT PRIMARY KEY,
            mother TEXT,
            mother_name TEXT,
            child_name TEXT,
            birth_day INTEGER,
            birth_month INTEGER,
            birth_year INTEGER,
            death_age_months INTEGER,
            cause_of_death TEXT,
            remarks TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );
        `);
      } catch (e) {
        console.log("Migration 11 (hmis_child_death table) failed:", e);
      }
    }
  },
  {
    version: 12,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE hmis_newborn_death ADD COLUMN gender TEXT;`);
      } catch (e) {
        console.log("Migration 12 (gender newborn) failed:", e);
      }
      try {
        await db.execAsync(`ALTER TABLE hmis_child_death ADD COLUMN gender TEXT;`);
      } catch (e) {
        console.log("Migration 12 (gender child) failed:", e);
      }
    }
  },
  {
    version: 13,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS hmis_infant_monitoring (
              id TEXT PRIMARY KEY,
              mother TEXT,
              mother_name TEXT,
              baby_name TEXT,
              baby_birth_day INTEGER,
              baby_birth_month INTEGER,
              baby_birth_year INTEGER,
              tole TEXT,
              birth_place TEXT,
              fchv_present INTEGER DEFAULT 0,
              asphyxia_management INTEGER DEFAULT 0,
              serial_no INTEGER,
              umbilical_care INTEGER DEFAULT 0,
              chest_to_chest INTEGER DEFAULT 0,
              breastfeeding_1hr INTEGER DEFAULT 0,
              baby_weight TEXT,
              pnc_check_24hr INTEGER DEFAULT 0,
              pnc_check_3day INTEGER DEFAULT 0,
              pnc_check_7_14day INTEGER DEFAULT 0,
              pnc_check_42day INTEGER DEFAULT 0,
              remarks TEXT,
              is_synced INTEGER NOT NULL DEFAULT 0,
              is_deleted INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(mother) REFERENCES mother(id)
          );
        `);
      } catch (e) {
        console.log("Migration 13 (hmis_infant_monitoring table) failed:", e);
      }
    }
  },
  {
    version: 14,
    up: async (db) => {
      const queries = [
        "ALTER TABLE mother ADD COLUMN first_name TEXT;",
        "ALTER TABLE mother ADD COLUMN last_name TEXT;",
        "ALTER TABLE mother ADD COLUMN phone_number TEXT;",
        "ALTER TABLE mother ADD COLUMN date_of_birth TEXT;",
        "ALTER TABLE mother ADD COLUMN address_locality TEXT;",
        "ALTER TABLE mother ADD COLUMN address_house_number TEXT;",
        "ALTER TABLE mother ADD COLUMN address_province TEXT;",
        "ALTER TABLE mother ADD COLUMN address_district TEXT;",
        "ALTER TABLE mother ADD COLUMN address_municipality TEXT;",
        "ALTER TABLE mother ADD COLUMN address_ward TEXT;",
        "ALTER TABLE mother ADD COLUMN income TEXT;",
        "ALTER TABLE mother ADD COLUMN occupation TEXT;",
        "ALTER TABLE mother ADD COLUMN blood_group TEXT;",
        "ALTER TABLE mother ADD COLUMN jati_code TEXT;",
        "ALTER TABLE mother ADD COLUMN lmp_date TEXT;",
        "ALTER TABLE mother ADD COLUMN parity INTEGER;",
        "ALTER TABLE mother ADD COLUMN gravida INTEGER;",
        "ALTER TABLE mother ADD COLUMN cover_photo TEXT;",
        "ALTER TABLE mother ADD COLUMN emergency_contact_number TEXT;",
        "ALTER TABLE mother ADD COLUMN alias TEXT;",
        "ALTER TABLE mother ADD COLUMN partner_name TEXT;",
        "ALTER TABLE mother ADD COLUMN partner_mobile TEXT;",
        "ALTER TABLE mother ADD COLUMN partner_age TEXT;"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 14 query failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 15,
    up: async (db) => {
      try {
        // SQLite doesn't support DROP COLUMN easily. 
        // We recreate the table without the legacy name, age, phone, address columns.
        await db.execAsync(`
          CREATE TABLE mother_new (
            id TEXT PRIMARY KEY,
            code TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            husband_name TEXT,
            ethnicity TEXT,
            education TEXT,
            photo TEXT,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            date_of_birth TEXT,
            address_locality TEXT,
            address_house_number TEXT,
            address_province TEXT,
            address_district TEXT,
            address_municipality TEXT,
            address_ward TEXT,
            income TEXT,
            occupation TEXT,
            blood_group TEXT,
            jati_code TEXT,
            lmp_date TEXT,
            parity INTEGER,
            gravida INTEGER,
            cover_photo TEXT,
            emergency_contact_number TEXT,
            alias TEXT,
            partner_name TEXT,
            partner_mobile TEXT,
            partner_age TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          
          INSERT INTO mother_new (
            id, code, is_synced, is_deleted, husband_name, ethnicity, education, photo,
            first_name, last_name, phone_number, date_of_birth, address_locality, 
            address_house_number, address_province, address_district, address_municipality, 
            address_ward, income, occupation, blood_group, jati_code, lmp_date, parity, 
            gravida, cover_photo, emergency_contact_number, alias, partner_name, 
            partner_mobile, partner_age, created_at, updated_at
          )
          SELECT 
            id, code, is_synced, is_deleted, husband_name, ethnicity, education, photo,
            first_name, last_name, phone_number, date_of_birth, address_locality, 
            address_house_number, address_province, address_district, address_municipality, 
            address_ward, income, occupation, blood_group, jati_code, lmp_date, parity, 
            gravida, cover_photo, emergency_contact_number, alias, partner_name, 
            partner_mobile, partner_age, created_at, updated_at
          FROM mother;
          
          DROP TABLE mother;
          ALTER TABLE mother_new RENAME TO mother;
        `);
      } catch (e) {
        console.log("Migration 15 (mother table cleanup) failed:", e);
      }
    }
  },
  {
    version: 16,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE pregnancy ADD COLUMN caretakers_name TEXT;
          ALTER TABLE pregnancy ADD COLUMN caretakers_phone TEXT;
        `);
      } catch (e) {
        console.log("Migration 16 (pregnancy caretaker columns) failed or already applied:", e);
      }
    }
  },
  {
    version: 17,
    up: async (db) => {
      const queries = [
        "ALTER TABLE child_monitoring ADD COLUMN umbilical_ointment INTEGER DEFAULT 0;",
        "ALTER TABLE child_monitoring ADD COLUMN skin_to_skin INTEGER DEFAULT 0;",
        "ALTER TABLE child_monitoring ADD COLUMN early_breastfeeding INTEGER DEFAULT 0;"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 17 query failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 18,
    up: async (db) => {
      const queries = [
        "ALTER TABLE child_monitoring ADD COLUMN status TEXT DEFAULT 'alive';",
        "ALTER TABLE child_monitoring ADD COLUMN asphyxiated_newborn INTEGER DEFAULT 0;"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 18 query failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 19,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE hmis_newborn_death ADD COLUMN death_age_unit TEXT DEFAULT 'days';`);
      } catch (e) {
        console.log("Migration 19 (death_age_unit column) already applied or failed:", e);
      }
    }
  },
  {
    version: 20,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE pregnancy ADD COLUMN ended INTEGER NOT NULL DEFAULT 0;
          ALTER TABLE pregnancy ADD COLUMN delivered INTEGER NOT NULL DEFAULT 0;
        `);
      } catch (e) {
        console.log("Migration 20 (pregnancy ended/delivered) failed or already applied:", e);
      }
    }
  },
  {
    version: 21,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE pregnancy ADD COLUMN risk_level TEXT NOT NULL DEFAULT 'normal';`);
      } catch (e) {
        console.log("Migration 21 (risk_level) already applied or failed:", e);
      }
    }
  },
  {
    version: 22,
    up: async (db) => {
      const queries = [
        "ALTER TABLE todo ADD COLUMN description TEXT;",
        "ALTER TABLE todo ADD COLUMN task_date TEXT;",
        "ALTER TABLE todo ADD COLUMN task_time TEXT;"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 22 query failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 23,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS adolescent_ifa (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age_group TEXT NOT NULL,
            phase1_week_1 INTEGER DEFAULT 0,
            phase1_week_2 INTEGER DEFAULT 0,
            phase1_week_3 INTEGER DEFAULT 0,
            phase1_week_4 INTEGER DEFAULT 0,
            phase1_week_5 INTEGER DEFAULT 0,
            phase1_week_6 INTEGER DEFAULT 0,
            phase1_week_7 INTEGER DEFAULT 0,
            phase1_week_8 INTEGER DEFAULT 0,
            phase1_week_9 INTEGER DEFAULT 0,
            phase1_week_10 INTEGER DEFAULT 0,
            phase1_week_11 INTEGER DEFAULT 0,
            phase1_week_12 INTEGER DEFAULT 0,
            phase1_week_13 INTEGER DEFAULT 0,
            phase1_completed INTEGER DEFAULT 0,
            phase2_week_1 INTEGER DEFAULT 0,
            phase2_week_2 INTEGER DEFAULT 0,
            phase2_week_3 INTEGER DEFAULT 0,
            phase2_week_4 INTEGER DEFAULT 0,
            phase2_week_5 INTEGER DEFAULT 0,
            phase2_week_6 INTEGER DEFAULT 0,
            phase2_week_7 INTEGER DEFAULT 0,
            phase2_week_8 INTEGER DEFAULT 0,
            phase2_week_9 INTEGER DEFAULT 0,
            phase2_week_10 INTEGER DEFAULT 0,
            phase2_week_11 INTEGER DEFAULT 0,
            phase2_week_12 INTEGER DEFAULT 0,
            phase2_week_13 INTEGER DEFAULT 0,
            phase2_completed INTEGER DEFAULT 0,
            remarks TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 23 (adolescent_ifa table) failed:", e);
      }
    }
  },
  {
    version: 24,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE supplements ADD COLUMN calcium INTEGER DEFAULT 0;`);
      } catch (e) {
        console.log("Migration 24 (calcium column in supplements) already applied or failed:", e);
      }
    }
  },
  {
    version: 25,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE counseling ADD COLUMN counseled_topics TEXT;`);
      } catch (e) {
        console.log("Migration 25 (counseled_topics column in counseling) already applied or failed:", e);
      }
    }
  },
  {
    version: 26,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE hmis_maternal_death ADD COLUMN child_condition TEXT;`);
      } catch (e) {
        console.log("Migration 26 (child_condition column in hmis_maternal_death) already applied or failed:", e);
      }
    }
  },
  {
    version: 27,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS counseling_referral (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            answers TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );
        `);
      } catch (e) {
        console.log("Migration 27 (counseling_referral table) failed:", e);
      }
    }
  },
  {
    version: 28,
    up: async (db) => {
      const queries = [
        "ALTER TABLE family_planning ADD COLUMN ocp_qty INTEGER DEFAULT 0;",
        "ALTER TABLE family_planning ADD COLUMN ecp_qty INTEGER DEFAULT 0;",
        "ALTER TABLE family_planning ADD COLUMN condom_qty INTEGER DEFAULT 0;"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 28 query failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 29,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS child_counseling (
            id TEXT PRIMARY KEY,
            child_id TEXT NOT NULL,
            answers TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(child_id) REFERENCES child_monitoring(id)
          );
        `);
      } catch (e) {
        console.log("Migration 29 (child_counseling table) failed:", e);
      }
    }
  },
  {
    version: 30,
    up: async (db) => {
      const tables = [
        "mother",
        "pregnancy",
        "visit",
        "todo",
        "hmis_maternal_death",
        "hmis_newborn_death",
        "child_monitoring",
        "supplements",
        "family_planning",
        "counseling",
        "adolescent_ifa",
        "counseling_referral",
        "child_counseling"
      ];
      for (const table of tables) {
        try {
          await db.execAsync(`ALTER TABLE ${table} ADD COLUMN reg_month TEXT;`);
        } catch (e) {
          console.log(`Migration 30 query failed or already applied for ${table}:`, e);
        }
      }
    },
  },
  {
    version: 31,
    up: async (db) => {
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_child_counseling_child_id ON child_counseling(child_id);
        CREATE INDEX IF NOT EXISTS idx_child_counseling_reg_month ON child_counseling(reg_month);
      `);
    },
  },
  {
    version: 32,
    up: async (db) => {
      // Add reg_year INTEGER column to all tables
      const tables = [
        "mother",
        "pregnancy",
        "visit",
        "todo",
        "hmis_maternal_death",
        "hmis_newborn_death",
        "child_monitoring",
        "supplements",
        "family_planning",
        "counseling",
        "adolescent_ifa",
        "counseling_referral",
        "child_counseling"
      ];
      for (const table of tables) {
        try {
          await db.execAsync(`ALTER TABLE ${table} ADD COLUMN reg_year INTEGER;`);
        } catch (e) {
          console.log(`Migration 32: reg_year already exists for ${table}:`, e);
        }
      }

      // Migrate existing TEXT reg_month (format "YYYY-MM") to INTEGER reg_year + reg_month
      for (const table of tables) {
        try {
          await db.execAsync(`
            UPDATE ${table}
            SET reg_year = CAST(SUBSTR(reg_month, 1, 4) AS INTEGER),
                reg_month = CAST(SUBSTR(reg_month, 6, 2) AS INTEGER)
            WHERE reg_month IS NOT NULL AND LENGTH(reg_month) >= 7 AND TYPEOF(reg_month) = 'text';
          `);
        } catch (e) {
          console.log(`Migration 32: data migration failed for ${table}:`, e);
        }
      }

      // Create new composite indexes
      try {
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_counseling_referral_reg ON counseling_referral(reg_year, reg_month);
          CREATE INDEX IF NOT EXISTS idx_child_counseling_reg ON child_counseling(reg_year, reg_month);
        `);
      } catch (e) {
        console.log("Migration 32: index creation failed:", e);
      }
    },
  },
  {
    version: 33,
    up: async (db) => {
      const tables = ["counseling", "counseling_referral"];
      for (const table of tables) {
        try {
          await db.execAsync(`ALTER TABLE ${table} ADD COLUMN pregnancy_id TEXT;`);
        } catch (e) {
          console.log(`Migration 33: pregnancy_id already exists for ${table}:`, e);
        }
      }
    },
  },
  {
    version: 34,
    up: async (db) => {
      // Ensure pregnancy_id exists before recreation
      try {
        await db.execAsync(`ALTER TABLE counseling ADD COLUMN pregnancy_id TEXT;`);
      } catch (e) { }
      try {
        await db.execAsync(`ALTER TABLE counseling_referral ADD COLUMN pregnancy_id TEXT;`);
      } catch (e) { }

      // Recreate counseling table to ensure proper definition
      try {
        const motherSelect = await getMotherSelectExpression(db, "counseling");

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS counseling_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            pregnancy_id TEXT,
            is_counseled INTEGER DEFAULT 0,
            counseled_topics TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id),
            FOREIGN KEY(pregnancy_id) REFERENCES pregnancy(id)
          );
          
          INSERT OR IGNORE INTO counseling_new (id, mother, pregnancy_id, is_counseled, counseled_topics, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
          SELECT id, ${motherSelect}, pregnancy_id, is_counseled, counseled_topics, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at FROM counseling;
          
          DROP TABLE counseling;
          ALTER TABLE counseling_new RENAME TO counseling;
        `);
      } catch (e) {
        console.log("Migration 34: counseling recreation failed:", e);
      }

      // Recreate counseling_referral table to add UNIQUE constraint
      try {
        const motherSelect = await getMotherSelectExpression(db, "counseling_referral");

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS counseling_referral_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            pregnancy_id TEXT,
            answers TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id),
            FOREIGN KEY(pregnancy_id) REFERENCES pregnancy(id),
            UNIQUE(mother, pregnancy_id, reg_year, reg_month)
          );
          
          INSERT OR IGNORE INTO counseling_referral_new (id, mother, pregnancy_id, answers, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at)
          SELECT id, ${motherSelect}, pregnancy_id, answers, reg_year, reg_month, is_synced, is_deleted, created_at, updated_at FROM counseling_referral;
          
          DROP TABLE counseling_referral;
          ALTER TABLE counseling_referral_new RENAME TO counseling_referral;
        `);
      } catch (e) {
        console.log("Migration 34: counseling_referral recreation failed:", e);
      }
    },
  },
  {
    version: 35,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS child_vaccination (
          id TEXT PRIMARY KEY,
          child_id TEXT NOT NULL,
          vaccine_id TEXT NOT NULL,
          is_given INTEGER DEFAULT 0,
          given_date TEXT,
          is_synced INTEGER NOT NULL DEFAULT 0,
          is_deleted INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(child_id) REFERENCES child_monitoring(id),
          UNIQUE(child_id, vaccine_id)
        );
        CREATE INDEX IF NOT EXISTS idx_child_vaccination_child_id ON child_vaccination(child_id);
      `);
    },
  },
  {
    version: 36,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE mother_new (
            id TEXT PRIMARY KEY,
            code TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            husband_name TEXT,
            ethnicity TEXT,
            education TEXT,
            photo TEXT,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            date_of_birth TEXT,
            address_locality TEXT,
            address_house_number TEXT,
            address_province TEXT,
            address_district TEXT,
            address_municipality TEXT,
            address_ward TEXT,
            income TEXT,
            occupation TEXT,
            blood_group TEXT,
            jati_code TEXT,
            lmp_date TEXT,
            parity INTEGER,
            gravida INTEGER,
            cover_photo TEXT,
            emergency_contact_number TEXT,
            partner_name TEXT,
            partner_mobile TEXT,
            partner_age TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
          
          INSERT INTO mother_new (
            id, code, is_synced, is_deleted, husband_name, ethnicity, education, photo,
            first_name, last_name, phone_number, date_of_birth, address_locality, 
            address_house_number, address_province, address_district, address_municipality, 
            address_ward, income, occupation, blood_group, jati_code, lmp_date, parity, 
            gravida, cover_photo, emergency_contact_number, partner_name, 
            partner_mobile, partner_age, reg_year, reg_month, created_at, updated_at
          )
          SELECT 
            id, code, is_synced, is_deleted, husband_name, ethnicity, education, photo,
            first_name, last_name, phone_number, date_of_birth, address_locality, 
            address_house_number, address_province, address_district, address_municipality, 
            address_ward, income, occupation, blood_group, jati_code, lmp_date, parity, 
            gravida, cover_photo, emergency_contact_number, partner_name, 
            partner_mobile, partner_age, reg_year, reg_month, created_at, updated_at
          FROM mother;
          
          DROP TABLE mother;
          ALTER TABLE mother_new RENAME TO mother;
        `);
      } catch (e) {
        console.log("Migration 36 (remove alias column) failed:", e);
      }
    }
  },
  {
    version: 37,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE child_monitoring ADD COLUMN is_all_given INTEGER DEFAULT 0;`);
      } catch (e) {
        console.log("Migration 37 (is_all_given) failed or already applied:", e);
      }
    }
  },
  {
    version: 38,
    up: async (db) => {
      try {
        await db.execAsync(`ALTER TABLE child_monitoring ADD COLUMN is_all_given INTEGER DEFAULT 0;`);
      } catch (e) {
        console.log("Migration 38 (is_all_given) failed or already applied:", e);
      }
    }
  },
  {
    version: 39,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE supplements ADD COLUMN pregnancy_id TEXT;
          ALTER TABLE family_planning ADD COLUMN pregnancy_id TEXT;
        `);
      } catch (e) {
        console.log("Migration 39 failed or already applied:", e);
      }
    }
  },
  {
    version: 40,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE hmis_newborn_death ADD COLUMN child_id TEXT;
        `);
      } catch (e) {
        console.log("Migration 40 failed or already applied:", e);
      }
    }
  },
  {
    version: 41,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE child_monitoring ADD COLUMN gender TEXT;
        `);
      } catch (e) {
        console.log("Migration 41 failed or already applied:", e);
      }
    }
  },
  {
    version: 42,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE hmis_newborn_death ADD COLUMN death_day INTEGER;
          ALTER TABLE hmis_newborn_death ADD COLUMN death_month INTEGER;
          ALTER TABLE hmis_newborn_death ADD COLUMN death_year INTEGER;
        `);
      } catch (e) {
        console.log("Migration 42 failed or already applied:", e);
      }
    }
  },
  {
    version: 43,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE hmis_maternal_death ADD COLUMN child_condition TEXT;
        `);
      } catch (e) {
        console.log("Migration 43 failed or already applied:", e);
      }
    }
  },
  {
    version: 44,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE todo ADD COLUMN notification_id TEXT;
        `);
      } catch (e) {
        console.log("Migration 44 failed or already applied:", e);
      }
    }
  },
  {
    version: 45,
    up: async (db) => {
      const queries = [
        "ALTER TABLE child_monitoring ADD COLUMN pregnancy_id TEXT;",
        "ALTER TABLE child_monitoring ADD COLUMN registration_source TEXT DEFAULT 'DIRECT_CHILD_REGISTRATION';"
      ];
      for (const query of queries) {
        try {
          await db.execAsync(query);
        } catch (e) {
          console.log(`Migration 45 failed or already applied: ${query}`, e);
        }
      }
    }
  },
  {
    version: 46,
    up: async (db) => {
      // SQLite doesn't support DROP COLUMN, so we recreate visit without address
      try {
        const motherSelect = await getMotherSelectExpression(db, "visit");

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
            visit_notes TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );

          INSERT INTO visit_new (id, mother, name, is_synced, is_deleted, visit_date, visit_type, visit_notes, reg_year, reg_month, created_at, updated_at)
          SELECT id, ${motherSelect}, name, is_synced, is_deleted, visit_date, visit_type, visit_notes, reg_year, reg_month, created_at, updated_at
          FROM visit;

          DROP TABLE visit;
          ALTER TABLE visit_new RENAME TO visit;
        `);
      } catch (e) {
        console.log("Migration 46 (remove address from visit) failed:", e);
      }
    }
  },
  {
    version: 47,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS mother_staging(
            id TEXT PRIMARY KEY,
            code TEXT,
            husband_name TEXT,
            ethnicity TEXT,
            education TEXT,
            photo TEXT,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            date_of_birth TEXT,
            address_locality TEXT,
            address_house_number TEXT,
            address_province TEXT,
            address_district TEXT,
            address_municipality TEXT,
            address_ward TEXT,
            income TEXT,
            occupation TEXT,
            blood_group TEXT,
            jati_code TEXT,
            lmp_date TEXT,
            parity INTEGER,
            gravida INTEGER,
            cover_photo TEXT,
            emergency_contact_number TEXT,
            partner_name TEXT,
            partner_mobile TEXT,
            partner_age TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 47 (mother_staging table) failed:", e);
      }
    }
  },
  {
    version: 48,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS adolescent_ifa_staging (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age_group TEXT NOT NULL,
            phase1_week_1 INTEGER DEFAULT 0,
            phase1_week_2 INTEGER DEFAULT 0,
            phase1_week_3 INTEGER DEFAULT 0,
            phase1_week_4 INTEGER DEFAULT 0,
            phase1_week_5 INTEGER DEFAULT 0,
            phase1_week_6 INTEGER DEFAULT 0,
            phase1_week_7 INTEGER DEFAULT 0,
            phase1_week_8 INTEGER DEFAULT 0,
            phase1_week_9 INTEGER DEFAULT 0,
            phase1_week_10 INTEGER DEFAULT 0,
            phase1_week_11 INTEGER DEFAULT 0,
            phase1_week_12 INTEGER DEFAULT 0,
            phase1_week_13 INTEGER DEFAULT 0,
            phase1_completed INTEGER DEFAULT 0,
            phase2_week_1 INTEGER DEFAULT 0,
            phase2_week_2 INTEGER DEFAULT 0,
            phase2_week_3 INTEGER DEFAULT 0,
            phase2_week_4 INTEGER DEFAULT 0,
            phase2_week_5 INTEGER DEFAULT 0,
            phase2_week_6 INTEGER DEFAULT 0,
            phase2_week_7 INTEGER DEFAULT 0,
            phase2_week_8 INTEGER DEFAULT 0,
            phase2_week_9 INTEGER DEFAULT 0,
            phase2_week_10 INTEGER DEFAULT 0,
            phase2_week_11 INTEGER DEFAULT 0,
            phase2_week_12 INTEGER DEFAULT 0,
            phase2_week_13 INTEGER DEFAULT 0,
            phase2_completed INTEGER DEFAULT 0,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 48 (adolescent_ifa_staging table) failed:", e);
      }
    }
  },
  {
    version: 49,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS child_monitoring_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            baby_name TEXT,
            date_of_birth TEXT,
            birth_place TEXT,
            status TEXT,
            fchv_present INTEGER DEFAULT 0,
            skilled_birth_attended INTEGER DEFAULT 0,
            baby_weight TEXT,
            umbilical_ointment INTEGER DEFAULT 0,
            skin_to_skin INTEGER DEFAULT 0,
            early_breastfeeding INTEGER DEFAULT 0,
            asphyxiated_newborn INTEGER DEFAULT 0,
            is_all_given INTEGER DEFAULT 0,
            gender TEXT,
            remarks TEXT,
            pregnancy_id TEXT,
            registration_source TEXT DEFAULT 'DIRECT_CHILD_REGISTRATION',
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 49 (child_monitoring_staging table) failed:", e);
      }
    }
  },
  {
    version: 50,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS pregnancy_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            gravida INTEGER,
            parity INTEGER,
            lmp_date TEXT NOT NULL,
            expected_delivery_date TEXT,
            caretakers_name TEXT,
            caretakers_phone TEXT,
            is_current INTEGER NOT NULL DEFAULT 0,
            selected INTEGER NOT NULL DEFAULT 0,
            ended INTEGER NOT NULL DEFAULT 0,
            delivered INTEGER NOT NULL DEFAULT 0,
            risk_level TEXT NOT NULL DEFAULT 'normal',
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 50 (pregnancy_staging table) failed:", e);
      }
    }
  },
  {
    version: 51,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS mothers_group_meetings_staging (
            id TEXT PRIMARY KEY,
            meeting_date TEXT NOT NULL,
            meeting_location TEXT NOT NULL,
            ward_no TEXT,
            attendees_count INTEGER DEFAULT 0,
            discussed_topics TEXT,
            decisions TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 51 (mothers_group_meetings_staging table) failed:", e);
      }
    }
  },
  {
    version: 52,
    up: async (db) => {
      try {
        const columns = await db.getAllAsync<{ name: string }>(
          `PRAGMA table_info(visit);`,
        );
        const columnNames = new Set(columns.map((column) => column.name));
        const hasVisitTable = columnNames.size > 0;
        const hasVisitPlace = columnNames.has("visit_place");
        const hasVisitNotes = columnNames.has("visit_notes");
        const motherSelect = columnNames.has("mother") && columnNames.has("mother_id")
          ? "COALESCE(NULLIF(mother, ''), mother_id)"
          : columnNames.has("mother")
            ? "mother"
            : columnNames.has("mother_id")
              ? "mother_id"
              : "''";

        if (!hasVisitTable) {
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS visit (
              id TEXT PRIMARY KEY,
              mother TEXT NOT NULL,
              name TEXT,
              is_synced INTEGER NOT NULL DEFAULT 0,
              is_deleted INTEGER NOT NULL DEFAULT 0,
              visit_date TEXT NOT NULL,
              visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
              visit_place TEXT,
              reg_year INTEGER,
              reg_month INTEGER,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(mother) REFERENCES mother(id)
            );
          `);
        } else if (!hasVisitPlace) {
          const visitPlaceSelect = hasVisitNotes ? "visit_notes" : "NULL";

          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS visit_new (
              id TEXT PRIMARY KEY,
              mother TEXT NOT NULL,
              name TEXT,
              is_synced INTEGER NOT NULL DEFAULT 0,
              is_deleted INTEGER NOT NULL DEFAULT 0,
              visit_date TEXT NOT NULL,
              visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
              visit_place TEXT,
              reg_year INTEGER,
              reg_month INTEGER,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(mother) REFERENCES mother(id)
            );

            INSERT INTO visit_new (id, mother, name, is_synced, is_deleted, visit_date, visit_type, visit_place, reg_year, reg_month, created_at, updated_at)
            SELECT id, ${motherSelect}, name, is_synced, is_deleted, visit_date, visit_type, ${visitPlaceSelect}, reg_year, reg_month, created_at, updated_at
            FROM visit;

            DROP TABLE visit;
            ALTER TABLE visit_new RENAME TO visit;
          `);
        }

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_staging (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 52 (visit_place and visit_staging) failed:", e);
      }
    }
  },
  {
    version: 53,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );

          CREATE TABLE IF NOT EXISTS visit_staging (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 53 (ensure visit tables) failed:", e);
      }
    }
  },
  {
    version: 54,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS todo (
            id TEXT PRIMARY KEY,
            task TEXT NOT NULL,
            description TEXT,
            task_date TEXT,
            task_time TEXT,
            notification_id TEXT,
            is_completed INTEGER NOT NULL DEFAULT 0,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS todo_staging (
            id TEXT PRIMARY KEY,
            task TEXT NOT NULL,
            description TEXT,
            task_date TEXT,
            task_time TEXT,
            notification_id TEXT,
            is_completed INTEGER NOT NULL DEFAULT 0,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 54 (ensure todo tables) failed:", e);
      }

      try {
        await db.execAsync(`ALTER TABLE todo ADD COLUMN is_synced INTEGER NOT NULL DEFAULT 0;`);
      } catch (e) {
        console.log("Migration 54 (todo is_synced column) already applied or failed:", e);
      }
    }
  },
  {
    version: 55,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS hmis_maternal_death_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            serial_no INTEGER,
            mother_name TEXT,
            mother_age INTEGER,
            death_condition TEXT,
            death_condition_other TEXT,
            death_day INTEGER,
            death_month INTEGER,
            death_year INTEGER,
            death_place TEXT,
            death_place_other TEXT,
            child_condition TEXT,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 55 (hmis_maternal_death_staging table) failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["hmis_maternal_death"],
        );
      } catch (e) {
        console.log("Migration 55 (hmis_maternal_death sync row) failed:", e);
      }
    }
  },
  {
    version: 56,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS hmis_newborn_death_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            child_id TEXT,
            mother_name TEXT,
            baby_name TEXT,
            birth_day INTEGER,
            birth_month INTEGER,
            birth_year INTEGER,
            death_day INTEGER,
            death_month INTEGER,
            death_year INTEGER,
            birth_condition TEXT,
            birth_condition_other TEXT,
            death_age_days INTEGER,
            death_age_unit TEXT DEFAULT 'days',
            cause_of_death TEXT,
            cause_of_death_other TEXT,
            death_place TEXT,
            death_place_other TEXT,
            gender TEXT,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 56 (hmis_newborn_death_staging table) failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["hmis_newborn_death"],
        );
      } catch (e) {
        console.log("Migration 56 (hmis_newborn_death sync row) failed:", e);
      }
    }
  },
  {
    version: 57,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS supplements_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            pregnancy_id TEXT,
            iron_pregnancy INTEGER DEFAULT 0,
            iron_post_delivery INTEGER DEFAULT 0,
            vitamin_a_post_delivery INTEGER DEFAULT 0,
            calcium INTEGER DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 57 (supplements_staging table) failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["supplements"],
        );
      } catch (e) {
        console.log("Migration 57 (supplements sync row) failed:", e);
      }
    }
  },
  {
    version: 58,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS family_planning_staging (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            family_planning TEXT,
            ocp_qty INTEGER DEFAULT 0,
            ecp_qty INTEGER DEFAULT 0,
            condom_qty INTEGER DEFAULT 0,
            pregnancy_id TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 58 (family_planning_staging table) failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["family_planning"],
        );
      } catch (e) {
        console.log("Migration 58 (family_planning sync row) failed:", e);
      }
    }
  },
  {
    version: 59,
    up: async (db) => {
      const tables = [
        "child_monitoring",
        "supplements",
        "family_planning",
        "hmis_newborn_death",
      ];

      for (const table of tables) {
        try {
          await db.execAsync(
            `ALTER TABLE ${table} RENAME COLUMN mother_id TO mother;`,
          );
        } catch (e) {
          console.log(`Migration 59: ${table} already has mother column or rename failed:`, e);
        }
      }
    }
  },
  {
    version: 60,
    up: async (db) => {
      await repairMotherColumn(db, "family_planning");
      await repairMotherColumn(db, "family_planning_staging");
    }
  },
  {
    version: 61,
    up: async (db) => {
      const tables = [
        "pregnancy",
        "pregnancy_staging",
        "visit",
        "visit_staging",
        "child_monitoring",
        "child_monitoring_staging",
        "supplements",
        "supplements_staging",
        "family_planning",
        "family_planning_staging",
        "counseling",
        "counseling_referral",
        "hmis_maternal_death",
        "hmis_maternal_death_staging",
        "hmis_newborn_death",
        "hmis_newborn_death_staging",
      ];

      for (const table of tables) {
        await repairMotherColumn(db, table);
      }
    }
  },
  {
    version: 62,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS counseling_referral_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            pregnancy TEXT,
            answers TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
      `);
    }
  },
  {
    version: 63,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS child_counseling_staging (
            id TEXT PRIMARY KEY,
            child TEXT,
            answers TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
      `);
    }
  },
  {
    version: 64,
    up: async (db) => {
      const tables = ["child_counseling", "child_counseling_staging"];

      for (const table of tables) {
        if (await tableHasColumn(db, table, "child_id")) {
          await db.execAsync(
            `ALTER TABLE ${table} RENAME COLUMN child_id TO child;`,
          );
        }
      }

      await db.execAsync(
        `DROP INDEX IF EXISTS idx_child_counseling_child_id;`,
      );
    }
  },
  {
    version: 65,
    up: async (db) => {
      const tables = ["counseling_referral", "counseling_referral_staging"];

      for (const table of tables) {
        if (await tableHasColumn(db, table, "pregnancy_id")) {
          await db.execAsync(
            `ALTER TABLE ${table} RENAME COLUMN pregnancy_id TO pregnancy;`,
          );
        }
      }
    }
  },
  {
    version: 66,
    up: async (db) => {
      await db.execAsync(`DROP TABLE IF EXISTS counseling;`);
    }
  },
  {
    version: 67,
    up: async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS child_vaccination_staging (
            id TEXT PRIMARY KEY,
            child_id TEXT,
            vaccine_id TEXT,
            is_given INTEGER DEFAULT 0,
            given_date TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
      `);
    }
  },
  {
    version: 68,
    up: async (db) => {
      const tables = ["child_vaccination", "child_vaccination_staging"];

      for (const table of tables) {
        if (await tableHasColumn(db, table, "child_id")) {
          await db.execAsync(
            `ALTER TABLE ${table} RENAME COLUMN child_id TO child;`,
          );
        }
      }

      await db.execAsync(
        `DROP INDEX IF EXISTS idx_child_vaccination_child_id;`,
      );
    }
  },
  {
    version: 69,
    up: async (db) => {
      const getSelectExpression = (
        columns: Set<string>,
        column: string,
        fallback: string,
      ) => columns.has(column) ? column : fallback;

      const getChildSelectExpression = (columns: Set<string>) => {
        if (columns.has("child") && columns.has("child_id")) {
          return "COALESCE(NULLIF(child, ''), child_id)";
        }
        if (columns.has("child")) return "child";
        if (columns.has("child_id")) return "child_id";
        return "''";
      };

      const migrateTable = async (table: string, withConstraints: boolean) => {
        const columns = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table});`);
        const columnNames = new Set(columns.map((column) => column.name));

        if (!columns.length) {
          await db.execAsync(withConstraints
            ? `
              CREATE TABLE IF NOT EXISTS child_vaccination (
                id TEXT PRIMARY KEY,
                child TEXT NOT NULL,
                vaccine_id TEXT NOT NULL,
                is_given INTEGER DEFAULT 0,
                given_date TEXT,
                is_synced INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(child) REFERENCES child_monitoring(id),
                UNIQUE(child, vaccine_id)
              );
            `
            : `
              CREATE TABLE IF NOT EXISTS child_vaccination_staging (
                id TEXT PRIMARY KEY,
                child TEXT,
                vaccine_id TEXT,
                is_given INTEGER DEFAULT 0,
                given_date TEXT,
                is_synced INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
              );
            `);
          return;
        }

        const tableNew = `${table}_new`;
        const childSelect = getChildSelectExpression(columnNames);
        const idSelect = getSelectExpression(columnNames, "id", "lower(hex(randomblob(16)))");
        const vaccineSelect = getSelectExpression(columnNames, "vaccine_id", "''");
        const isGivenSelect = getSelectExpression(columnNames, "is_given", "0");
        const givenDateSelect = getSelectExpression(columnNames, "given_date", "NULL");
        const isSyncedSelect = getSelectExpression(columnNames, "is_synced", "0");
        const isDeletedSelect = getSelectExpression(columnNames, "is_deleted", "0");
        const createdAtSelect = columnNames.has("created_at")
          ? "COALESCE(created_at, datetime('now'))"
          : "datetime('now')";
        const updatedAtSelect = columnNames.has("updated_at")
          ? "COALESCE(updated_at, datetime('now'))"
          : "datetime('now')";

        await db.execAsync(`DROP TABLE IF EXISTS ${tableNew};`);
        await db.execAsync(withConstraints
          ? `
            CREATE TABLE ${tableNew} (
              id TEXT PRIMARY KEY,
              child TEXT NOT NULL,
              vaccine_id TEXT NOT NULL,
              is_given INTEGER DEFAULT 0,
              given_date TEXT,
              is_synced INTEGER NOT NULL DEFAULT 0,
              is_deleted INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY(child) REFERENCES child_monitoring(id),
              UNIQUE(child, vaccine_id)
            );
          `
          : `
            CREATE TABLE ${tableNew} (
              id TEXT PRIMARY KEY,
              child TEXT,
              vaccine_id TEXT,
              is_given INTEGER DEFAULT 0,
              given_date TEXT,
              is_synced INTEGER NOT NULL DEFAULT 0,
              is_deleted INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
          `);

        await db.execAsync(`
          INSERT OR IGNORE INTO ${tableNew}
            (id, child, vaccine_id, is_given, given_date, is_synced, is_deleted, created_at, updated_at)
          SELECT
            ${idSelect},
            ${childSelect},
            ${vaccineSelect},
            ${isGivenSelect},
            ${givenDateSelect},
            ${isSyncedSelect},
            ${isDeletedSelect},
            ${createdAtSelect},
            ${updatedAtSelect}
          FROM ${table}
          WHERE ${childSelect} IS NOT NULL
            AND ${childSelect} != ''
            AND ${vaccineSelect} IS NOT NULL
            AND ${vaccineSelect} != '';
        `);

        await db.execAsync(`
          DROP TABLE ${table};
          ALTER TABLE ${tableNew} RENAME TO ${table};
        `);
      };

      await db.execAsync(`
        DROP INDEX IF EXISTS idx_child_vaccination_child_id;
        DROP INDEX IF EXISTS idx_child_vaccination_reg;
      `);

      await migrateTable("child_vaccination", true);
      await migrateTable("child_vaccination_staging", false);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_child_vaccination_reg ON child_vaccination(child);
      `);

      await db.runAsync(
        `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
        ["child_vaccination"],
      );
    }
  },
  {
    version: 70,
    up: async (db) => {
      // 1. Create the new anc_visit table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS anc_visit (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );
        `);
      } catch (e) {
        console.log("Migration 70: anc_visit table creation failed or already exists:", e);
      }

      // 2. Create the anc_visit_staging table
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS anc_visit_staging (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 70: anc_visit_staging table creation failed or already exists:", e);
      }

      // 3. Copy ANC visits from visit to anc_visit
      try {
        await db.execAsync(`
          INSERT OR IGNORE INTO anc_visit (id, mother, name, is_synced, is_deleted, visit_date, visit_place, reg_year, reg_month, created_at, updated_at)
          SELECT id, mother, name, is_synced, is_deleted, visit_date, visit_place, reg_year, reg_month, created_at, updated_at
          FROM visit
          WHERE visit_type = 'ANC';
        `);
      } catch (e) {
        console.log("Migration 70: copying ANC visits failed:", e);
      }

      // 4. Copy ANC visits from visit_staging to anc_visit_staging
      try {
        await db.execAsync(`
          INSERT OR IGNORE INTO anc_visit_staging (id, mother, name, is_synced, is_deleted, visit_date, visit_place, reg_year, reg_month, created_at, updated_at)
          SELECT id, mother, name, is_synced, is_deleted, visit_date, visit_place, reg_year, reg_month, created_at, updated_at
          FROM visit_staging
          WHERE visit_type = 'ANC';
        `);
      } catch (e) {
        console.log("Migration 70: copying ANC staging visits failed:", e);
      }

      // 5. Delete ANC visits from visit table
      try {
        await db.execAsync(`DELETE FROM visit WHERE visit_type = 'ANC';`);
      } catch (e) {
        console.log("Migration 70: deleting ANC visits from visit table failed:", e);
      }

      // 6. Delete ANC visits from visit_staging table
      try {
        await db.execAsync(`DELETE FROM visit_staging WHERE visit_type = 'ANC';`);
      } catch (e) {
        console.log("Migration 70: deleting ANC visits from visit_staging table failed:", e);
      }

      // 7. Recreate visit table without ANC in CHECK constraint
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('PNC')),
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );

          INSERT OR IGNORE INTO visit_new (id, mother, name, is_synced, is_deleted, visit_date, visit_type, visit_place, reg_year, reg_month, created_at, updated_at)
          SELECT id, mother, name, is_synced, is_deleted, visit_date, visit_type, visit_place, reg_year, reg_month, created_at, updated_at
          FROM visit;

          DROP TABLE visit;
          ALTER TABLE visit_new RENAME TO visit;
        `);
      } catch (e) {
        console.log("Migration 70: recreating visit table failed:", e);
      }

      // 8. Recreate visit_staging table without ANC in CHECK constraint
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_staging_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('PNC')),
            visit_place TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          INSERT OR IGNORE INTO visit_staging_new (id, mother, name, is_synced, is_deleted, visit_date, visit_type, visit_place, reg_year, reg_month, created_at, updated_at)
          SELECT id, mother, name, is_synced, is_deleted, visit_date, visit_type, visit_place, reg_year, reg_month, created_at, updated_at
          FROM visit_staging;

          DROP TABLE visit_staging;
          ALTER TABLE visit_staging_new RENAME TO visit_staging;
        `);
      } catch (e) {
        console.log("Migration 70: recreating visit_staging table failed:", e);
      }

      // 9. Seed sync tracker for anc_visit
      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["anc_visit"],
        );
      } catch (e) {
        console.log("Migration 70: seeding sync for anc_visit failed:", e);
      }
    }
  },
  {
    version: 71,
    up: async (db) => {
      try {
        await db.execAsync(`
          ALTER TABLE counseling_referral ADD COLUMN counseling_answers TEXT;
          ALTER TABLE counseling_referral ADD COLUMN referral_answers TEXT;
        `);
      } catch (e) {
        console.log("Migration 71: altering counseling_referral table failed:", e);
      }
      try {
        await db.execAsync(`
          ALTER TABLE counseling_referral_staging ADD COLUMN counseling_answers TEXT;
          ALTER TABLE counseling_referral_staging ADD COLUMN referral_answers TEXT;
        `);
      } catch (e) {
        console.log("Migration 71: altering counseling_referral_staging table failed:", e);
      }
    }
  },
  {
    version: 72,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS delivery (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            delivery_date TEXT,
            delivery_place TEXT,
            baby_weight TEXT,
            gender TEXT,
            status TEXT DEFAULT 'alive',
            fchv_present INTEGER DEFAULT 0,
            skilled_birth_attended INTEGER DEFAULT 0,
            asphyxiated_newborn INTEGER DEFAULT 0,
            umbilical_ointment INTEGER DEFAULT 0,
            skin_to_skin INTEGER DEFAULT 0,
            early_breastfeeding INTEGER DEFAULT 0,
            remarks TEXT,
            pregnancy_id TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id),
            FOREIGN KEY(pregnancy_id) REFERENCES pregnancy(id)
          );
          CREATE INDEX IF NOT EXISTS idx_delivery_mother ON delivery(mother);
          CREATE TABLE IF NOT EXISTS delivery_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            delivery_date TEXT,
            delivery_place TEXT,
            baby_weight TEXT,
            gender TEXT,
            status TEXT,
            fchv_present INTEGER DEFAULT 0,
            skilled_birth_attended INTEGER DEFAULT 0,
            asphyxiated_newborn INTEGER DEFAULT 0,
            umbilical_ointment INTEGER DEFAULT 0,
            skin_to_skin INTEGER DEFAULT 0,
            early_breastfeeding INTEGER DEFAULT 0,
            remarks TEXT,
            pregnancy_id TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 72: creating delivery tables failed:", e);
      }
    }
  },
  {
    version: 73,
    up: async (db) => {
      const DELIVERY_COLUMNS = [
        { name: "delivery_date", type: "TEXT" },
        { name: "delivery_place", type: "TEXT" },
        { name: "baby_weight", type: "TEXT" },
        { name: "gender", type: "TEXT" },
        { name: "status", type: "TEXT DEFAULT 'alive'" },
        { name: "fchv_present", type: "INTEGER DEFAULT 0" },
        { name: "skilled_birth_attended", type: "INTEGER DEFAULT 0" },
        { name: "asphyxiated_newborn", type: "INTEGER DEFAULT 0" },
        { name: "umbilical_ointment", type: "INTEGER DEFAULT 0" },
        { name: "skin_to_skin", type: "INTEGER DEFAULT 0" },
        { name: "early_breastfeeding", type: "INTEGER DEFAULT 0" },
        { name: "remarks", type: "TEXT" },
        { name: "pregnancy_id", type: "TEXT" },
        { name: "reg_year", type: "INTEGER" },
        { name: "reg_month", type: "INTEGER" },
        { name: "is_synced", type: "INTEGER NOT NULL DEFAULT 0" },
        { name: "is_deleted", type: "INTEGER NOT NULL DEFAULT 0" },
        { name: "created_at", type: "TEXT NOT NULL" },
        { name: "updated_at", type: "TEXT NOT NULL" },
      ];

      try {
        for (const col of DELIVERY_COLUMNS) {
          if (!(await tableHasColumn(db, "delivery", col.name))) {
            await db.execAsync(`ALTER TABLE delivery ADD COLUMN ${col.name} ${col.type};`);
          }
          if (!(await tableHasColumn(db, "delivery_staging", col.name))) {
            await db.execAsync(`ALTER TABLE delivery_staging ADD COLUMN ${col.name} ${col.type};`);
          }
        }
      } catch (e) {
        console.log("Migration 73: adding missing delivery columns failed:", e);
      }
    }
  },
  {
    version: 74,
    up: async (db) => {
      try {
        if (!(await tableHasColumn(db, "delivery", "delivery_date"))) {
          await db.execAsync(`ALTER TABLE delivery ADD COLUMN delivery_date TEXT;`);
        }
        if (!(await tableHasColumn(db, "delivery", "delivery_place"))) {
          await db.execAsync(`ALTER TABLE delivery ADD COLUMN delivery_place TEXT;`);
        }
        if (!(await tableHasColumn(db, "delivery_staging", "delivery_date"))) {
          await db.execAsync(`ALTER TABLE delivery_staging ADD COLUMN delivery_date TEXT;`);
        }
        if (!(await tableHasColumn(db, "delivery_staging", "delivery_place"))) {
          await db.execAsync(`ALTER TABLE delivery_staging ADD COLUMN delivery_place TEXT;`);
        }
      } catch (e) {
        console.log("Migration 74: adding missing delivery columns failed:", e);
      }
    }
  },
  {
    version: 75,
    up: async (db) => {
      const tables = [
        "visit",
        "visit_staging",
        "anc_visit",
        "anc_visit_staging",
      ];
      for (const table of tables) {
        try {
          if (!(await tableHasColumn(db, table, "visit_number"))) {
            await db.execAsync(`ALTER TABLE ${table} ADD COLUMN visit_number INTEGER DEFAULT 1;`);
          }
        } catch (e) {
          console.log(`Migration 75: adding visit_number to ${table} failed:`, e);
        }
      }
    }
  },
  {
    version: 76,
    up: async (db) => {
      const tables = ["anc_visit", "anc_visit_staging"];
      for (const table of tables) {
        try {
          if (!(await tableHasColumn(db, table, "visit_type"))) {
            await db.execAsync(`ALTER TABLE ${table} ADD COLUMN visit_type TEXT DEFAULT 'ANC';`);
            await db.execAsync(`UPDATE ${table} SET visit_type = 'ANC' WHERE visit_type IS NULL;`);
          }
        } catch (e) {
          console.log(`Migration 76: adding visit_type to ${table} failed:`, e);
        }
      }
    }
  },
  {
    version: 77,
    up: async (db) => {
      // Drop old anc_visit tables (FCHV only uses PNC)
      try {
        await db.execAsync(`DROP TABLE IF EXISTS anc_visit;`);
      } catch (e) {
        console.log("Migration 77: dropping anc_visit failed:", e);
      }
      try {
        await db.execAsync(`DROP TABLE IF EXISTS anc_visit_staging;`);
      } catch (e) {
        console.log("Migration 77: dropping anc_visit_staging failed:", e);
      }

      // Remove anc_visit from sync tracker
      try {
        await db.runAsync(`DELETE FROM sync WHERE table_name = 'anc_visit';`);
      } catch (e) {
        console.log("Migration 77: removing anc_visit from sync failed:", e);
      }

      // Ensure pnc_visit is in sync tracker
      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["pnc_visit"],
        );
      } catch (e) {
        console.log("Migration 77: seeding sync for pnc_visit failed:", e);
      }

      // Fix visit table constraint to allow ANC, PNC, OTHER
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('PNC', 'ANC', 'OTHER')),
            visit_place TEXT,
            visit_number INTEGER DEFAULT 1,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );

          INSERT OR IGNORE INTO visit_new SELECT * FROM visit;

          DROP TABLE visit;
          ALTER TABLE visit_new RENAME TO visit;
        `);
      } catch (e) {
        console.log("Migration 77: recreating visit table failed:", e);
      }

      // Fix visit_staging table constraint to allow ANC, PNC, OTHER
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_staging_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('PNC', 'ANC', 'OTHER')),
            visit_place TEXT,
            visit_number INTEGER DEFAULT 1,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          INSERT OR IGNORE INTO visit_staging_new SELECT * FROM visit_staging;

          DROP TABLE visit_staging;
          ALTER TABLE visit_staging_new RENAME TO visit_staging;
        `);
      } catch (e) {
        console.log("Migration 77: recreating visit_staging table failed:", e);
      }
    }
  },
  {
    version: 78,
    up: async (db) => {
      // Fix visit table constraint to allow ANC, PNC, OTHER
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('PNC', 'ANC', 'OTHER')),
            visit_place TEXT,
            visit_number INTEGER DEFAULT 1,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id)
          );

          INSERT OR IGNORE INTO visit_new SELECT * FROM visit;

          DROP TABLE IF EXISTS visit;
          ALTER TABLE visit_new RENAME TO visit;
        `);
      } catch (e) {
        console.log("Migration 78: recreating visit table failed:", e);
      }

      // Fix visit_staging table constraint to allow ANC, PNC, OTHER
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS visit_staging_new (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            name TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('PNC', 'ANC', 'OTHER')),
            visit_place TEXT,
            visit_number INTEGER DEFAULT 1,
            reg_year INTEGER,
            reg_month INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          INSERT OR IGNORE INTO visit_staging_new SELECT * FROM visit_staging;

          DROP TABLE IF EXISTS visit_staging;
          ALTER TABLE visit_staging_new RENAME TO visit_staging;
        `);
      } catch (e) {
        console.log("Migration 78: recreating visit_staging table failed:", e);
      }
    }
  },
  {
    version: 79,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS fchv_profile (
            id TEXT PRIMARY KEY,
            user_username TEXT,
            user_name TEXT,
            user_type TEXT,
            address_json TEXT,
            phone_number TEXT,
            description TEXT,
            date_of_birth TEXT,
            photo TEXT,
            training_received_on TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            organization_json TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 79: creating fchv_profile table failed:", e);
      }
    },
  },
  {
    version: 80,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS child_birth_registration (
            id TEXT PRIMARY KEY,
            child TEXT NOT NULL,
            certificate_number TEXT,
            issued_date TEXT,
            issued_district TEXT,
            issued_municipality TEXT,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(child) REFERENCES child_monitoring(id),
            UNIQUE(child)
          );
          CREATE INDEX IF NOT EXISTS idx_child_birth_registration_child ON child_birth_registration(child);

          CREATE TABLE IF NOT EXISTS child_birth_registration_staging (
            id TEXT PRIMARY KEY,
            child TEXT,
            certificate_number TEXT,
            issued_date TEXT,
            issued_district TEXT,
            issued_municipality TEXT,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS child_death_registration (
            id TEXT PRIMARY KEY,
            child TEXT NOT NULL,
            certificate_number TEXT,
            death_date TEXT,
            cause_of_death TEXT,
            issued_date TEXT,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(child) REFERENCES child_monitoring(id),
            UNIQUE(child)
          );
          CREATE INDEX IF NOT EXISTS idx_child_death_registration_child ON child_death_registration(child);

          CREATE TABLE IF NOT EXISTS child_death_registration_staging (
            id TEXT PRIMARY KEY,
            child TEXT,
            certificate_number TEXT,
            death_date TEXT,
            cause_of_death TEXT,
            issued_date TEXT,
            remarks TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 80: creating registration certificate tables failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["child_birth_registration"],
        );
      } catch (e) {
        console.log("Migration 80: child_birth_registration sync row failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["child_death_registration"],
        );
      } catch (e) {
        console.log("Migration 80: child_death_registration sync row failed:", e);
      }
    },
  },
  {
    version: 81,
    up: async (db) => {
      try {
        await db.execAsync(`
          DROP TABLE IF EXISTS child_birth_registration_staging;
          DROP TABLE IF EXISTS child_birth_registration;
          DROP TABLE IF EXISTS child_death_registration_staging;
          DROP TABLE IF EXISTS child_death_registration;

          CREATE TABLE IF NOT EXISTS child_birth_registration (
            id TEXT PRIMARY KEY,
            child TEXT NOT NULL,
            birth_status INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(child) REFERENCES child_monitoring(id),
            UNIQUE(child)
          );
          CREATE INDEX IF NOT EXISTS idx_child_birth_registration_child ON child_birth_registration(child);

          CREATE TABLE IF NOT EXISTS child_birth_registration_staging (
            id TEXT PRIMARY KEY,
            child TEXT,
            birth_status INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS child_death_registration (
            id TEXT PRIMARY KEY,
            child TEXT NOT NULL,
            death_status INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(child) REFERENCES child_monitoring(id),
            UNIQUE(child)
          );
          CREATE INDEX IF NOT EXISTS idx_child_death_registration_child ON child_death_registration(child);

          CREATE TABLE IF NOT EXISTS child_death_registration_staging (
            id TEXT PRIMARY KEY,
            child TEXT,
            death_status INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 81: recreate registration tables failed:", e);
      }
    },
  },
  {
    version: 82,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS fchv_counseling (
            id TEXT PRIMARY KEY,
            fchv_name TEXT,
            fchv_id TEXT,
            data TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS fchv_counseling_staging (
            id TEXT PRIMARY KEY,
            fchv_name TEXT,
            fchv_id TEXT,
            data TEXT,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 82: fchv_counseling tables creation failed:", e);
      }
    },
  },
  {
    version: 83,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS child_nutrition (
            id TEXT PRIMARY KEY,
            mother_id TEXT NOT NULL,
            child_id TEXT NOT NULL,
            nutrition_names TEXT NOT NULL,
            balvita_packets INTEGER DEFAULT 0,
            child_age_group TEXT,
            times_per_month INTEGER DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother_id) REFERENCES mother(id),
            FOREIGN KEY(child_id) REFERENCES child_monitoring(id)
          );

          CREATE TABLE IF NOT EXISTS child_nutrition_staging (
            id TEXT PRIMARY KEY,
            mother_id TEXT,
            child_id TEXT,
            nutrition_names TEXT,
            balvita_packets INTEGER DEFAULT 0,
            child_age_group TEXT,
            times_per_month INTEGER DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 83: child_nutrition tables creation failed:", e);
      }
    },
  },
  {
    version: 84,
    up: async (db) => {
      try {
        const hasAgeGroup = await tableHasColumn(db, "child_nutrition", "child_age_group");
        if (!hasAgeGroup) {
          await db.execAsync(`ALTER TABLE child_nutrition ADD COLUMN child_age_group TEXT;`);
        }
        const hasTimesPerMonth = await tableHasColumn(db, "child_nutrition", "times_per_month");
        if (!hasTimesPerMonth) {
          await db.execAsync(`ALTER TABLE child_nutrition ADD COLUMN times_per_month INTEGER DEFAULT 0;`);
        }
        const hasStagingAgeGroup = await tableHasColumn(db, "child_nutrition_staging", "child_age_group");
        if (!hasStagingAgeGroup) {
          await db.execAsync(`ALTER TABLE child_nutrition_staging ADD COLUMN child_age_group TEXT;`);
        }
        const hasStagingTimesPerMonth = await tableHasColumn(db, "child_nutrition_staging", "times_per_month");
        if (!hasStagingTimesPerMonth) {
          await db.execAsync(`ALTER TABLE child_nutrition_staging ADD COLUMN times_per_month INTEGER DEFAULT 0;`);
        }
      } catch (e) {
        console.log("Migration 84: add child_age_group and times_per_month columns failed:", e);
      }
    },
  },
  {
    version: 85,
    up: async (db) => {
      try {
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS abortion (
            id TEXT PRIMARY KEY,
            mother TEXT NOT NULL,
            pregnancy TEXT,
            aborted INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother) REFERENCES mother(id),
            FOREIGN KEY(pregnancy) REFERENCES pregnancy(id)
          );

          CREATE TABLE IF NOT EXISTS abortion_staging (
            id TEXT PRIMARY KEY,
            mother TEXT,
            pregnancy TEXT,
            aborted INTEGER NOT NULL DEFAULT 0,
            reg_year INTEGER,
            reg_month INTEGER,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);
      } catch (e) {
        console.log("Migration 85: creating abortion tables failed:", e);
      }

      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO sync (table_name, last_synced_at) VALUES (?, NULL);`,
          ["abortion"],
        );
      } catch (e) {
        console.log("Migration 85: seeding sync for abortion failed:", e);
      }
    },
  },
];
