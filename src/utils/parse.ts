import { Primitive } from "@/hooks/database/types/table";

const safeParse = <T>(value: string): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    // fallback for plain string values
    return value as unknown as T;
  }
};

/**
 * Converts a potentially invalid datetime string (e.g. "0", unix timestamp
 * number as string, or null/undefined) to a valid ISO 8601 string required
 * by the Django REST API: YYYY-MM-DDThh:mm:ss.uuuuuuZ
 *
 * If the value is falsy or cannot be parsed, falls back to the current time.
 */
export function toISOStringSafe(value: string | number | null | undefined): string {
  // Null / undefined / empty
  if (value === null || value === undefined || value === "") {
    return new Date().toISOString();
  }

  const str = String(value).trim();

  // "0" or plain "0" unix epoch — treat as missing
  if (str === "0") {
    return new Date().toISOString();
  }

  // Pure numeric string — treat as unix timestamp (seconds)
  if (/^\d+$/.test(str)) {
    const ms = Number(str) * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  // Already an ISO-like string — validate it
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const toSqlParam = (v: any): Primitive => {
  // expo-sqlite accepts numbers/strings/null well; booleans -> 0/1
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
};

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch (e) {
      return null;
    }
  };

export {safeParse, toSqlParam, calculateAge};
