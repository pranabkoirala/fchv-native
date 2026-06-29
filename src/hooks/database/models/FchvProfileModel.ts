import { getDb } from "../db";

export interface FchvAddress {
  province: { id: string; name_en: string; name_ne: string };
  district: { id: string; name_en: string; name_ne: string };
  municipality: { id: string; name_en: string; name_ne: string };
  ward: { id: string; number: number };
  locality?: string;
  house_number?: string;
}

export interface Organization {
  name: string;
  link: string;
  code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  type: string;
  address: FchvAddress;
}

export interface FchvProfile {
  id: string;
  user: { username: string; name: string; user_type: string };
  address: FchvAddress;
  phone_number: string;
  description: string;
  date_of_birth: string;
  photo: string | null;
  training_received_on: string;
  is_active: boolean;
  organization: Organization;
}

export async function saveLocalFchvProfile(profile: FchvProfile): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  // We use INSERT OR REPLACE to update existing or insert if not present
  await db.runAsync(
    `INSERT OR REPLACE INTO fchv_profile (
      id,
      user_username,
      user_name,
      user_type,
      address_json,
      phone_number,
      description,
      date_of_birth,
      photo,
      training_received_on,
      is_active,
      organization_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.id,
      profile.user.username,
      profile.user.name,
      profile.user.user_type,
      JSON.stringify(profile.address),
      profile.phone_number || "",
      profile.description || "",
      profile.date_of_birth || "",
      profile.photo || null,
      profile.training_received_on || "",
      profile.is_active ? 1 : 0,
      JSON.stringify(profile.organization),
      now,
      now,
    ]
  );
}

export async function getLocalFchvProfile(): Promise<FchvProfile | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    user_username: string;
    user_name: string;
    user_type: string;
    address_json: string;
    phone_number: string;
    description: string;
    date_of_birth: string;
    photo: string | null;
    training_received_on: string;
    is_active: number;
    organization_json: string;
  }>(`SELECT * FROM fchv_profile LIMIT 1`);

  if (!row) {
    return null;
  }

  try {
    return {
      id: row.id,
      user: {
        username: row.user_username,
        name: row.user_name,
        user_type: row.user_type,
      },
      address: JSON.parse(row.address_json),
      phone_number: row.phone_number,
      description: row.description,
      date_of_birth: row.date_of_birth,
      photo: row.photo,
      training_received_on: row.training_received_on,
      is_active: row.is_active === 1,
      organization: JSON.parse(row.organization_json),
    };
  } catch (e) {
    console.error("Error parsing stored FCHV profile JSON fields:", e);
    return null;
  }
}
