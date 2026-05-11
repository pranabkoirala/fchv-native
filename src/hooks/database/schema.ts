export const SCHEMA_SQL = `
 PRAGMA journal_mode = WAL; -- Improves performance/concurrency

CREATE TABLE IF NOT EXISTS mother(
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

  CREATE TABLE IF NOT EXISTS pregnancy (
    id TEXT PRIMARY KEY,
    mother_id TEXT,
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
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
  );

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

CREATE TABLE IF NOT EXISTS sync (
    table_name TEXT PRIMARY KEY,
    last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS todo (
    id TEXT PRIMARY KEY,
    task TEXT NOT NULL,
    is_completed INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hmis_maternal_death (
    id TEXT PRIMARY KEY,
    mother_id TEXT,
    serial_no INTEGER,
    mother_name TEXT,
    mother_age INTEGER,
    death_condition TEXT, -- 'Pregnant', 'Labor', 'Post-delivery', 'Other'
    death_condition_other TEXT,
    death_day INTEGER,
    death_month INTEGER,
    death_year INTEGER,
    death_place TEXT, -- 'Home', 'Institution', 'Other'
    death_place_other TEXT,
    remarks TEXT,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);

CREATE TABLE IF NOT EXISTS hmis_newborn_death (
    id TEXT PRIMARY KEY,
    mother_id TEXT,
    mother_name TEXT,
    baby_name TEXT,
    birth_day INTEGER,
    birth_month INTEGER,
    birth_year INTEGER,
    birth_condition TEXT, -- 'Preterm', 'LowWeight', 'Normal', 'Other'
    birth_condition_other TEXT,
    death_age_days INTEGER,
    death_age_unit TEXT DEFAULT 'days', -- 'days' or 'months'
    cause_of_death TEXT, -- 'Asphyxia', 'Hypothermia', 'Infection', 'Other'
    cause_of_death_other TEXT,
    death_place TEXT, -- 'Home', 'Institution', 'Other'
    death_place_other TEXT,
    gender TEXT, -- 'Male', 'Female'
    remarks TEXT,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);

CREATE TABLE IF NOT EXISTS child_monitoring (
    id TEXT PRIMARY KEY,
    mother_id TEXT,
    baby_name TEXT,
    date_of_birth TEXT,
    birth_place TEXT, -- 'home', 'institution', 'trained_worker'
    status TEXT, -- 'alive', 'dead'
    fchv_present INTEGER DEFAULT 0,
    skilled_birth_attended INTEGER DEFAULT 0,
    baby_weight TEXT, -- 'normal', 'low', 'very_low'
    umbilical_ointment INTEGER DEFAULT 0,
    skin_to_skin INTEGER DEFAULT 0,
    early_breastfeeding INTEGER DEFAULT 0,
    asphyxiated_newborn INTEGER DEFAULT 0,
    remarks TEXT,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);

CREATE TABLE IF NOT EXISTS supplements (
    id TEXT PRIMARY KEY,
    mother_id TEXT NOT NULL,
    iron_pregnancy INTEGER DEFAULT 0,
    iron_post_delivery INTEGER DEFAULT 0,
    vitamin_a_post_delivery INTEGER DEFAULT 0,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);

CREATE TABLE IF NOT EXISTS family_planning (
    id TEXT PRIMARY KEY,
    mother_id TEXT NOT NULL,
    family_planning TEXT,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);

CREATE TABLE IF NOT EXISTS counseling (
    id TEXT PRIMARY KEY,
    mother_id TEXT NOT NULL,
    is_counseled INTEGER DEFAULT 0,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);
`;
