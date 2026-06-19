import {
  getCurrentNepaliDate,
  resolveNepaliYearMonth,
} from "../../../utils/dateHelper";
import { getDb } from "../db";
import { CreateMotherPayload, MotherStoreType } from "../types/motherModal";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export async function createMother(
  payload: Omit<CreateMotherPayload, "created_at" | "updated_at">,
): Promise<MotherStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();
  const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

  await db.runAsync(
    `INSERT INTO mother 
      (id, code, first_name, last_name, phone_number, date_of_birth, 
       address_province, address_district, address_municipality, address_ward,
       is_synced, is_deleted, reg_year, reg_month, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.id,
      payload.code ?? null,
      payload.first_name ?? null,
      payload.last_name ?? null,
      payload.phone_number ?? null,
      payload.date_of_birth ?? null,
      payload.address_province ?? null,
      payload.address_district ?? null,
      payload.address_municipality ?? null,
      payload.address_ward ?? null,
      payload.is_synced ? 1 : 0,
      0,
      currentYear,
      currentMonth,
      now,
      now,
    ],
  );

  return {
    id: payload.id,
    code: payload.code ?? null,
    husband_name: null,
    ethnicity: null,
    education: null,
    photo: null,
    first_name: payload.first_name ?? null,
    last_name: payload.last_name ?? null,
    phone_number: payload.phone_number ?? null,
    date_of_birth: payload.date_of_birth ?? null,
    address_locality: null,
    address_house_number: null,
    address_province: payload.address_province ?? null,
    address_district: payload.address_district ?? null,
    address_municipality: payload.address_municipality ?? null,
    address_ward: payload.address_ward ?? null,
    income: null,
    occupation: null,
    blood_group: null,
    jati_code: null,
    lmp_date: null,
    parity: null,
    gravida: null,
    cover_photo: null,
    emergency_contact_number: null,
    partner_name: null,
    partner_mobile: null,
    partner_age: null,
    is_synced: payload.is_synced ? 1 : 0,
    is_deleted: 0,
    reg_year: currentYear,
    reg_month: currentMonth,
    created_at: now,
    updated_at: now,
  };
}

export async function updateMother(
  payload: Omit<CreateMotherPayload, "created_at" | "updated_at">,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE mother SET
      code = ?,
      husband_name = ?,
      ethnicity = ?,
      education = ?,
      photo = ?,
      first_name = ?,
      last_name = ?,
      phone_number = ?,
      date_of_birth = ?,
      address_locality = ?,
      address_house_number = ?,
      address_province = ?,
      address_district = ?,
      address_municipality = ?,
      address_ward = ?,
      income = ?,
      occupation = ?,
      blood_group = ?,
      jati_code = ?,
      lmp_date = ?,
      parity = ?,
      gravida = ?,
      cover_photo = ?,
      emergency_contact_number = ?,
      partner_name = ?,
      partner_mobile = ?,
      partner_age = ?,
      is_synced = ?,
      updated_at = ?
    WHERE id = ?`,
    [
      payload.code ?? null,
      payload.husband_name ?? null,
      payload.ethnicity ?? null,
      payload.education ?? null,
      payload.photo ?? null,
      payload.first_name ?? null,
      payload.last_name ?? null,
      payload.phone_number ?? null,
      payload.date_of_birth ?? null,
      payload.address_locality ?? null,
      payload.address_house_number ?? null,
      payload.address_province ?? null,
      payload.address_district ?? null,
      payload.address_municipality ?? null,
      payload.address_ward ?? null,
      payload.income ?? null,
      payload.occupation ?? null,
      payload.blood_group ?? null,
      payload.jati_code ?? null,
      payload.lmp_date ?? null,
      payload.parity ?? null,
      payload.gravida ?? null,
      payload.cover_photo ?? null,
      payload.emergency_contact_number ?? null,
      payload.partner_name ?? null,
      payload.partner_mobile ?? null,
      payload.partner_age ?? null,
      0,
      now,
      payload.id,
    ],
  );
}

export async function unSyncedMothers(): Promise<CreateMotherPayload[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MotherStoreType>(
    `SELECT * FROM mother WHERE is_synced = 0 AND is_deleted = 0`,
  );

  return rows.map((row) => ({
    id: row.id,
    code: row.code ?? undefined,
    first_name: row.first_name ?? undefined,
    last_name: row.last_name ?? undefined,
    phone_number: row.phone_number ?? undefined,
    date_of_birth: row.date_of_birth ?? undefined,
    address_province: row.address_province ?? undefined,
    address_district: row.address_district ?? undefined,
    address_municipality: row.address_municipality ?? undefined,
    address_ward: row.address_ward ?? undefined,
    address_locality: row.address_locality ?? undefined,
    address_house_number: row.address_house_number ?? undefined,
    husband_name: row.husband_name ?? undefined,
    ethnicity: row.ethnicity ?? undefined,
    education: row.education ?? undefined,
    photo: row.photo ?? undefined,
    income: row.income ?? undefined,
    occupation: row.occupation ?? undefined,
    blood_group: row.blood_group ?? undefined,
    jati_code: row.jati_code ?? undefined,
    lmp_date: row.lmp_date ?? undefined,
    parity: row.parity ?? undefined,
    gravida: row.gravida ?? undefined,
    emergency_contact_number: row.emergency_contact_number ?? undefined,
    partner_name: row.partner_name ?? undefined,
    partner_mobile: row.partner_mobile ?? undefined,
    partner_age: row.partner_age ?? undefined,
    updated_at: row.updated_at,
    is_synced: false,
  }));
}

export async function deleteMother(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE mother SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [now, id],
  );
}

export function checkHasHealthProblem(riskLevel: string | null | undefined, counselingAnswersJson: string | null | undefined): boolean {
  if (riskLevel === "high" || riskLevel === "moderate") {
    return true;
  }
  if (counselingAnswersJson) {
    try {
      const answers = JSON.parse(counselingAnswersJson);
      for (const key in answers) {
        const logs = answers[key];
        if (Array.isArray(logs) && logs.length > 0) {
          return true;
        } else if (logs === true) {
          return true;
        }
      }
    } catch (e) {
      console.error("Error parsing counseling answers", e);
    }
  }
  return false;
}

export interface MotherListDbItem {
  id: string;
  code?: string;
  name: string;
  firstName: string;
  lastName: string;
  first_name: string;
  last_name: string;
  phone: string;
  phone_number: string;
  edd: string;
  lmp: string;
  anc: number;
  status: string;
  risk: string;
  ward: string;
  municipality: string;
  image: string;
  pregnancy_count: number;
  date_of_birth: string;
  nameNp?: string;
  remarks?: string;
  age: number;
  birth_place?: string;
  baby_status?: string;
  reg_year?: number;
  reg_month?: number;
  createdAt: string;
  is_dead: boolean;
  hasHealthProblem?: boolean;
}

export async function getAllMothersList(): Promise<MotherListDbItem[]> {
  const db = await getDb();

  const query = `
    SELECT 
      m.*,
      COALESCE(p.lmp_date, m.lmp_date) as lmp,
      p.expected_delivery_date as edd,
      p.risk_level,
      (SELECT COUNT(*) FROM pregnancy WHERE mother = m.id AND is_deleted = 0) as pregnancy_count,
      cm.birth_place,
      cm.status as baby_status,
      cm.remarks as baby_remarks,
      (SELECT COUNT(*) FROM hmis_maternal_death hmd WHERE hmd.mother = m.id AND hmd.is_deleted = 0) > 0 as is_dead,
      (SELECT answers FROM counseling_referral cr 
       WHERE cr.mother = m.id AND cr.is_deleted = 0 
       ORDER BY cr.created_at DESC LIMIT 1) as counseling_answers
    FROM mother m
    LEFT JOIN pregnancy p ON p.id = (
      SELECT id FROM pregnancy 
      WHERE mother = m.id AND is_deleted = 0 
      ORDER BY created_at DESC LIMIT 1
    )
    LEFT JOIN child_monitoring cm ON cm.id = (
      SELECT id FROM child_monitoring
      WHERE mother = m.id AND is_deleted = 0
      ORDER BY created_at DESC LIMIT 1
    )
    WHERE m.is_deleted = 0 
    ORDER BY m.created_at ASC
  `;

  const rows = await db.getAllAsync<any>(query);

  return rows.map((row) => {
    const firstName = row.first_name || "";
    const lastName = row.last_name || "";
    const dob = row.date_of_birth || "";

    let age = 0;
    if (dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Get LMP and calculate EDD (LMP + 280 days)
    const lmpRaw = row.lmp || "";
    let eddCalculated = row.edd || "";
    if (lmpRaw && !eddCalculated) {
      try {
        const lmpDate = new Date(lmpRaw);
        if (!isNaN(lmpDate.getTime())) {
          const eddDate = new Date(lmpDate);
          eddDate.setDate(eddDate.getDate() + 280);
          eddCalculated = eddDate.toISOString().split("T")[0];
        }
      } catch (e) { }
    }

    const hasHealthProblem = checkHasHealthProblem(row.risk_level, row.counseling_answers);

    return {
      id: row.id,
      code: row.code || "",
      name: [firstName, lastName].filter(Boolean).join(" ") || "Unknown",
      firstName,
      lastName,
      first_name: firstName,
      last_name: lastName,
      phone: row.phone_number || "",
      phone_number: row.phone_number || "",
      ward: row.address_ward || "",
      municipality: row.address_municipality || "",
      image:
        row.photo ||
        "https://vectorified.com/images/no-profile-picture-icon-13.png",
      lmp: lmpRaw,
      edd: eddCalculated,
      anc: 0,
      status: "active",
      risk: row.risk_level || "low",
      pregnancy_count: row.pregnancy_count || 0,
      date_of_birth: dob,
      age: age,
      birth_place: row.birth_place || "",
      baby_status: row.baby_status || "",
      remarks: row.baby_remarks || "",
      reg_year: row.reg_year,
      reg_month: row.reg_month,
      createdAt: row.created_at || "",
      is_dead: !!row.is_dead,
      hasHealthProblem,
    };
  });
}

export interface MotherProfileDbItem extends MotherListDbItem {
  code: string;
  regDate: string;
  pregnancyId: string | null;
  husbandName: string;
  ethnicity: string;
  education: string;
  gravida: string;
  parity: string;
  dateOfBirth: string;
  addressProvince: string;
  addressDistrict: string;
  addressMunicipality: string;
  addressWard: string;
  income?: string;
  occupation?: string;
  bloodGroup?: string;
  partnerName?: string;
  partnerMobile?: string;
  partnerAge?: string;
  emergencyContactNumber?: string;
  addressLocality?: string;
  addressHouseNumber?: string;
  children?: any[]; // Array to hold child monitoring data
}

export async function getMotherProfile(
  id: string,
): Promise<MotherProfileDbItem | null> {
  const db = await getDb();
  const query = `
    SELECT 
      m.id,
      m.code,
      m.first_name,
      m.last_name,
      m.phone_number,
      m.date_of_birth,
      m.husband_name,
      m.ethnicity,
      m.education,
      m.photo,
      m.address_province,
      m.address_district,
      m.address_municipality,
      m.address_ward,
      m.income,
      m.occupation,
      m.blood_group,
      m.partner_name,
      m.partner_mobile,
      m.partner_age,
      m.emergency_contact_number,
      m.address_locality,
      m.address_house_number,
      m.created_at as regDate,
      p.id as pregnancyId,
      p.risk_level,
      COALESCE(p.lmp_date, m.lmp_date) as lmp,
      p.expected_delivery_date as edd,
      COALESCE(p.gravida, m.gravida) as gravida,
      COALESCE(p.parity, m.parity) as parity,
      (SELECT COUNT(*) FROM pregnancy WHERE mother = m.id AND is_deleted = 0) as pregnancy_count,
      (SELECT COUNT(*) FROM hmis_maternal_death hmd WHERE hmd.mother = m.id AND hmd.is_deleted = 0) > 0 as is_dead,
      (SELECT answers FROM counseling_referral cr 
       WHERE cr.mother = m.id AND cr.is_deleted = 0 
       ORDER BY cr.created_at DESC LIMIT 1) as counseling_answers
    FROM mother m
    LEFT JOIN pregnancy p ON p.id = (
      SELECT id FROM pregnancy 
      WHERE mother = m.id AND is_deleted = 0 
      ORDER BY created_at DESC LIMIT 1
    )
    WHERE m.id = ? AND m.is_deleted = 0
  `;
  const row = await db.getFirstAsync<any>(query, [id]);
  if (!row) return null;

  // Fetch child monitoring data
  const childQuery = `SELECT * FROM child_monitoring WHERE mother = ? AND is_deleted = 0 ORDER BY created_at DESC`;
  const children = await db.getAllAsync<any>(childQuery, [id]);

  const firstName = row.first_name || "";
  const lastName = row.last_name || "";
  const dob = row.date_of_birth || "";

  let age = 0;
  if (dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Calculate EDD if missing but LMP is present
  const lmpRaw = row.lmp || "";
  let eddCalculated = row.edd || "";
  if (lmpRaw && !eddCalculated) {
    try {
      const lmpDate = new Date(lmpRaw);
      if (!isNaN(lmpDate.getTime())) {
        const eddDate = new Date(lmpDate);
        eddDate.setDate(eddDate.getDate() + 280);
        eddCalculated = eddDate.toISOString().split("T")[0];
      }
    } catch (e) { }
  }

  const hasHealthProblem = checkHasHealthProblem(row.risk_level, row.counseling_answers);

  return {
    id: row.id,
    code: row.code || "",
    name: [firstName, lastName].filter(Boolean).join(" ") || "Unknown",
    firstName,
    lastName,
    first_name: firstName,
    last_name: lastName,
    phone: row.phone_number || "",
    phone_number: row.phone_number || "",
    husbandName: row.husband_name || "",
    ethnicity: row.ethnicity || "",
    education: row.education || "",
    dateOfBirth: row.date_of_birth || "",
    addressProvince: row.address_province || "",
    addressDistrict: row.address_district || "",
    addressMunicipality: row.address_municipality || "",
    addressWard: row.address_ward || "",
    income: row.income || "",
    occupation: row.occupation || "",
    bloodGroup: row.blood_group || "",
    partnerName: row.partner_name || row.husband_name || "",
    partnerMobile: row.partner_mobile || "",
    partnerAge: row.partner_age !== null ? String(row.partner_age) : "",
    emergencyContactNumber: row.emergency_contact_number || "",
    addressLocality: row.address_locality || "",
    addressHouseNumber: row.address_house_number || "",
    pregnancyId: row.pregnancyId || null,
    gravida:
      row.gravida !== null && row.gravida !== undefined
        ? String(row.gravida)
        : "",
    parity:
      row.parity !== null && row.parity !== undefined ? String(row.parity) : "",
    ward: row.address_ward || "",
    municipality: row.address_municipality || "",
    image:
      row.photo ||
      "https://vectorified.com/images/no-profile-picture-icon-13.png",
    lmp: lmpRaw,
    edd: eddCalculated || "N/A",
    anc: 0,
    status: "active",
    risk: row.risk_level || "low",
    regDate: row.regDate || "N/A",
    createdAt: row.regDate || "",
    pregnancy_count: row.pregnancy_count || 0,
    is_dead: !!row.is_dead,
    date_of_birth: row.date_of_birth || "",
    age: age,
    children: children || [],
    hasHealthProblem,
  };
}

export async function getMotherCount(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<any>(
    "SELECT COUNT(*) as count FROM mother WHERE is_deleted = 0",
  );
  const count = result?.count ?? 0;
  return Number(count);
}

export async function getMotherTrend(): Promise<
  { month: number; year: number; count: number }[]
> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT reg_year, reg_month, created_at
     FROM mother
     WHERE is_deleted = 0`,
  );
  const counts = new Map<string, { month: number; year: number; count: number }>();

  rows.forEach((row: any) => {
    const resolved = resolveNepaliYearMonth(
      row.reg_year,
      row.reg_month,
      row.created_at,
    );
    if (!resolved) return;

    const key = `${resolved.year}-${resolved.month}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        month: resolved.month - 1,
        year: resolved.year,
        count: 1,
      });
    }
  });

  return Array.from(counts.values());
}

export async function insertToTempMotherTable(apiRes: any[]) {
  if (!apiRes.length) return;

  const db = await getDb();
  const columns = [
    "id",
    "code",
    "husband_name",
    "ethnicity",
    "education",
    "photo",
    "first_name",
    "last_name",
    "phone_number",
    "date_of_birth",
    "address_locality",
    "address_house_number",
    "address_province",
    "address_district",
    "address_municipality",
    "address_ward",
    "income",
    "occupation",
    "blood_group",
    "jati_code",
    "lmp_date",
    "parity",
    "gravida",
    "cover_photo",
    "emergency_contact_number",
    "partner_name",
    "partner_mobile",
    "partner_age",
    "is_synced",
    "is_deleted",
    "created_at",
    "updated_at",
  ];

  await bulkInsertToTempTable<any>(
    {
      db,
      table: "mother_staging",
      columns,
      onConflict: "replace",
      rows: (item) => {
        const createdAt = item.created_at ?? new Date().toISOString();
        const updatedAt = item.updated_at ?? createdAt;
        const deleted = (item as { deleted?: boolean | number }).deleted ?? item.is_deleted ?? false;
        const address = item.address ?? {};

        return [
          item.id,
          item.code ?? null,
          item.husband_name ?? null,
          item.ethnicity ?? null,
          item.education ?? null,
          item.photo ?? null,
          item.first_name ?? null,
          item.last_name ?? null,
          item.phone_number ?? null,
          item.date_of_birth ?? null,
          item.address_locality ?? address.locality ?? null,
          item.address_house_number ?? address.house_number ?? null,
          item.address_province ?? address.province ?? null,
          item.address_district ?? address.district ?? null,
          item.address_municipality ?? address.municipality ?? null,
          item.address_ward ?? address.ward ?? null,
          item.income ?? null,
          item.occupation ?? null,
          item.blood_group ?? null,
          item.jati_code ?? null,
          item.lmp_date ?? null,
          item.parity ?? null,
          item.gravida ?? null,
          item.cover_photo ?? null,
          item.emergency_contact_number ?? null,
          item.partner_name ?? null,
          item.partner_mobile ?? null,
          item.partner_age ?? null,
          1,
          deleted ? 1 : 0,
          createdAt,
          updatedAt,
        ];
      },
    },
    apiRes,
  );
}

export async function moveTempToRealMotherTable() {
  const db = await getDb();

  const staged = await db.getAllAsync<any>(`SELECT * FROM mother_staging`);
  if (!staged.length) return;

  for (const item of staged) {
    await db.runAsync(
      `
      INSERT INTO mother
        (id, code, husband_name, ethnicity, education, photo, first_name, last_name, phone_number, date_of_birth,
         address_locality, address_house_number, address_province, address_district, address_municipality, address_ward,
         income, occupation, blood_group, jati_code, lmp_date, parity, gravida, cover_photo,
         emergency_contact_number, partner_name, partner_mobile, partner_age, is_synced, is_deleted, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code = excluded.code,
        husband_name = excluded.husband_name,
        ethnicity = excluded.ethnicity,
        education = excluded.education,
        photo = excluded.photo,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        phone_number = excluded.phone_number,
        date_of_birth = excluded.date_of_birth,
        address_locality = excluded.address_locality,
        address_house_number = excluded.address_house_number,
        address_province = excluded.address_province,
        address_district = excluded.address_district,
        address_municipality = excluded.address_municipality,
        address_ward = excluded.address_ward,
        income = excluded.income,
        occupation = excluded.occupation,
        blood_group = excluded.blood_group,
        jati_code = excluded.jati_code,
        lmp_date = excluded.lmp_date,
        parity = excluded.parity,
        gravida = excluded.gravida,
        cover_photo = excluded.cover_photo,
        emergency_contact_number = excluded.emergency_contact_number,
        partner_name = excluded.partner_name,
        partner_mobile = excluded.partner_mobile,
        partner_age = excluded.partner_age,
        is_synced = excluded.is_synced,
        is_deleted = excluded.is_deleted,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at
      WHERE datetime(excluded.updated_at) > datetime(mother.updated_at)
         OR mother.updated_at IS NULL;
      `,
      [
        item.id,
        item.code,
        item.husband_name,
        item.ethnicity,
        item.education,
        item.photo,
        item.first_name,
        item.last_name,
        item.phone_number,
        item.date_of_birth,
        item.address_locality,
        item.address_house_number,
        item.address_province,
        item.address_district,
        item.address_municipality,
        item.address_ward,
        item.income,
        item.occupation,
        item.blood_group,
        item.jati_code,
        item.lmp_date,
        item.parity,
        item.gravida,
        item.cover_photo,
        item.emergency_contact_number,
        item.partner_name,
        item.partner_mobile,
        item.partner_age,
        1,
        item.is_deleted ? 1 : 0,
        item.created_at,
        item.updated_at,
      ],
    );
  }

  const now = new Date().toISOString();
  await setSyncTimestamp("mother", now);
}
