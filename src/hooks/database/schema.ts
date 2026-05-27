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
    reg_year INTEGER,
    reg_month INTEGER,
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
    ended INTEGER NOT NULL DEFAULT 0,
    delivered INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'normal', -- 'high', 'moderate', 'normal'
    reg_year INTEGER,
    reg_month INTEGER,
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
    reg_year INTEGER,
    reg_month INTEGER,
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
    description TEXT,
    task_date TEXT,
    task_time TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    reg_year INTEGER,
    reg_month INTEGER,
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
    reg_year INTEGER,
    reg_month INTEGER,
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
    reg_year INTEGER,
    reg_month INTEGER,
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
    reg_year INTEGER,
    reg_month INTEGER,
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
    calcium INTEGER DEFAULT 0,
    reg_year INTEGER,
    reg_month INTEGER,
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
    ocp_qty INTEGER DEFAULT 0,
    ecp_qty INTEGER DEFAULT 0,
    condom_qty INTEGER DEFAULT 0,
    reg_year INTEGER,
    reg_month INTEGER,
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
    counseled_topics TEXT,
    reg_year INTEGER,
    reg_month INTEGER,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id)
);

CREATE TABLE IF NOT EXISTS adolescent_ifa (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age_group TEXT NOT NULL, -- '10-14' or '15-19'
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
CREATE TABLE IF NOT EXISTS counseling_referral (
    id TEXT PRIMARY KEY,
    mother_id TEXT NOT NULL,
    answers TEXT,
    reg_year INTEGER,
    reg_month INTEGER,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(mother_id) REFERENCES mother(id),
    UNIQUE(mother_id, reg_year, reg_month)
);
CREATE INDEX IF NOT EXISTS idx_counseling_referral_mother_id ON counseling_referral(mother_id);
CREATE INDEX IF NOT EXISTS idx_counseling_referral_reg ON counseling_referral(reg_year, reg_month);

CREATE TABLE IF NOT EXISTS child_counseling (
    id TEXT PRIMARY KEY,
    child_id TEXT NOT NULL,
    answers TEXT,
    reg_year INTEGER,
    reg_month INTEGER,
    is_synced INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(child_id) REFERENCES child_monitoring(id),
    UNIQUE(child_id, reg_year, reg_month)
);
CREATE INDEX IF NOT EXISTS idx_child_counseling_child_id ON child_counseling(child_id);
CREATE INDEX IF NOT EXISTS idx_child_counseling_reg ON child_counseling(reg_year, reg_month);
`;
