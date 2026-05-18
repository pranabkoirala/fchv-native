import { getDb } from '../db';
import { CreateMotherPayload, MotherStoreType } from '../types/motherModal';

export async function createMother(
  payload: Omit<CreateMotherPayload, 'created_at' | 'updated_at'>
): Promise<MotherStoreType> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO mother 
      (id, code, first_name, last_name, phone_number, date_of_birth, 
       address_province, address_district, address_municipality, address_ward,
       is_synced, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      now,
      now
    ]
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
    alias: null,
    partner_name: null,
    partner_mobile: null,
    partner_age: null,
    is_synced: payload.is_synced ? 1 : 0,
    is_deleted: 0,
    created_at: now,
    updated_at: now
  };
}

export async function updateMother(
  payload: Omit<CreateMotherPayload, 'created_at' | 'updated_at'>
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
      alias = ?,
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
      payload.alias ?? null,
      payload.partner_name ?? null,
      payload.partner_mobile ?? null,
      payload.partner_age ?? null,
      payload.is_synced ? 1 : 0,
      now,
      payload.id
    ]
  );
}

export async function unSyncedMothers(): Promise<CreateMotherPayload[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MotherStoreType>(
    `SELECT * FROM mother WHERE is_synced = 0 AND is_deleted = 0`
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
    alias: row.alias ?? undefined,
    partner_name: row.partner_name ?? undefined,
    partner_mobile: row.partner_mobile ?? undefined,
    partner_age: row.partner_age ?? undefined,
    updated_at: row.updated_at,
    is_synced: false
  }));
}

export async function deleteMother(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE mother SET is_deleted = 1, updated_at = ? WHERE id = ?`,
    [now, id]
  );
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
  createdAt: string;
}

export async function getAllMothersList(): Promise<MotherListDbItem[]> {
  const db = await getDb();

  const query = `
    SELECT 
      m.*,
      COALESCE(p.lmp_date, m.lmp_date) as lmp,
      p.expected_delivery_date as edd,
      (SELECT COUNT(*) FROM pregnancy WHERE mother_id = m.id AND is_deleted = 0) as pregnancy_count,
      cm.birth_place,
      cm.status as baby_status,
      cm.remarks as baby_remarks
    FROM mother m
    LEFT JOIN pregnancy p ON p.id = (
      SELECT id FROM pregnancy 
      WHERE mother_id = m.id AND is_deleted = 0 
      ORDER BY created_at DESC LIMIT 1
    )
    LEFT JOIN child_monitoring cm ON cm.id = (
      SELECT id FROM child_monitoring
      WHERE mother_id = m.id AND is_deleted = 0
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
          eddCalculated = eddDate.toISOString().split('T')[0];
        }
      } catch (e) {}
    }

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
      image: row.photo || "https://vectorified.com/images/no-profile-picture-icon-13.png",
      lmp: lmpRaw,
      edd: eddCalculated,
      anc: 0,
      status: "active",
      risk: "low",
      pregnancy_count: row.pregnancy_count || 0,
      date_of_birth: dob,
      age: age,
      birth_place: row.birth_place || "",
      baby_status: row.baby_status || "",
      remarks: row.baby_remarks || "",
      createdAt: row.created_at || ""
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
  alias?: string;
  addressLocality?: string;
  addressHouseNumber?: string;
  children?: any[]; // Array to hold child monitoring data
}

export async function getMotherProfile(id: string): Promise<MotherProfileDbItem | null> {
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
      m.alias,
      m.address_locality,
      m.address_house_number,
      m.created_at as regDate,
      p.id as pregnancyId,
      COALESCE(p.lmp_date, m.lmp_date) as lmp,
      p.expected_delivery_date as edd,
      COALESCE(p.gravida, m.gravida) as gravida,
      COALESCE(p.parity, m.parity) as parity,
      (SELECT COUNT(*) FROM pregnancy WHERE mother_id = m.id AND is_deleted = 0) as pregnancy_count
    FROM mother m
    LEFT JOIN pregnancy p ON p.id = (
      SELECT id FROM pregnancy 
      WHERE mother_id = m.id AND is_deleted = 0 
      ORDER BY created_at DESC LIMIT 1
    )
    WHERE m.id = ? AND m.is_deleted = 0
  `;
  const row = await db.getFirstAsync<any>(query, [id]);
  if (!row) return null;

  // Fetch child monitoring data
  const childQuery = `SELECT * FROM child_monitoring WHERE mother_id = ? AND is_deleted = 0 ORDER BY created_at DESC`;
  const children = await db.getAllAsync<any>(childQuery, [id]);

  const firstName = row.first_name || "";
  const lastName = row.last_name || "";

  // Calculate EDD if missing but LMP is present
  const lmpRaw = row.lmp || "";
  let eddCalculated = row.edd || "";
  if (lmpRaw && !eddCalculated) {
    try {
      const lmpDate = new Date(lmpRaw);
      if (!isNaN(lmpDate.getTime())) {
        const eddDate = new Date(lmpDate);
        eddDate.setDate(eddDate.getDate() + 280);
        eddCalculated = eddDate.toISOString().split('T')[0];
      }
    } catch (e) {}
  }

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
    alias: row.alias || "",
    addressLocality: row.address_locality || "",
    addressHouseNumber: row.address_house_number || "",
    pregnancyId: row.pregnancyId || null,
    gravida: (row.gravida !== null && row.gravida !== undefined) ? String(row.gravida) : "",
    parity: (row.parity !== null && row.parity !== undefined) ? String(row.parity) : "",
    ward: row.address_ward || "",
    municipality: row.address_municipality || "",
    image: row.photo || "https://vectorified.com/images/no-profile-picture-icon-13.png",
    lmp: lmpRaw,
    edd: eddCalculated || "N/A",
    anc: 0,
    status: "active",
    risk: "low",
    regDate: row.regDate || "N/A",
    createdAt: row.regDate || "",
    pregnancy_count: row.pregnancy_count || 0,
    date_of_birth: row.date_of_birth || "",
    age: 0,
    children: children || []
  };
}

export async function getMotherCount(): Promise<number> {
  const db = await getDb();
  const result = await db.getFirstAsync<any>(
    "SELECT COUNT(*) as count FROM mother WHERE is_deleted = 0"
  );
  const count = result?.count ?? 0;
  return Number(count);
}
