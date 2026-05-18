import * as SQLite from "expo-sqlite";

export const SCHEMA_VERSION = 22;

type Migration = {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
};

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
            mother_id TEXT NOT NULL,
            name TEXT,
            address TEXT,
            is_synced INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            visit_date TEXT NOT NULL,
            visit_type TEXT NOT NULL CHECK(visit_type IN ('ANC', 'PNC')),
            visit_notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(mother_id) REFERENCES mother(id)
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
          ALTER TABLE pregnancy ADD COLUMN mother_id TEXT;
        `);
      } catch (e) {
        console.log("Migration 6 (mother_id column) already applied or failed:", e);
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
            mother_id TEXT,
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
            FOREIGN KEY(mother_id) REFERENCES mother(id)
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
            mother_id TEXT,
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
            FOREIGN KEY(mother_id) REFERENCES mother(id)
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
              mother_id TEXT,
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
              FOREIGN KEY(mother_id) REFERENCES mother(id)
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
  }
];
