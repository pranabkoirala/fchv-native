import * as Crypto from "expo-crypto";
import { getCurrentNepaliDate } from "../../../utils/dateHelper";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";
import { isReferralQuestion } from "@/constants/CounselingQuestions";

export interface CounselingReferralStoreType {
    id: string;
    mother: string;
    pregnancy: string | null;
    answers: string | null; // JSON string of question ID to array of logs
    counseling_answers: string | null; // JSON string of question ID to array of logs (only counseling questions)
    referral_answers: string | null; // JSON string of question ID to array of logs (only referral questions)
    reg_year: number;
    reg_month: number;
    is_synced: number;
    is_deleted: number;
    created_at: string;
    updated_at: string;
}

export function splitAnswers(answersStr: string | null) {
  if (!answersStr) return { counseling: null, referral: null };
  try {
    const parsed = JSON.parse(answersStr);
    const counseling: Record<string, any> = {};
    const referral: Record<string, any> = {};
    Object.entries(parsed).forEach(([qId, val]) => {
      if (isReferralQuestion(qId)) {
        referral[qId] = val;
      } else {
        counseling[qId] = val;
      }
    });
    return {
      counseling: Object.keys(counseling).length ? JSON.stringify(counseling) : null,
      referral: Object.keys(referral).length ? JSON.stringify(referral) : null
    };
  } catch (e) {
    console.error("Error splitting answers:", e);
    return { counseling: null, referral: null };
  }
}

export function mergeAnswers(counselingStr: string | null, referralStr: string | null) {
  const merged: Record<string, any> = {};
  if (counselingStr) {
    try {
      Object.assign(merged, JSON.parse(counselingStr));
    } catch (e) {
      console.error(e);
    }
  }
  if (referralStr) {
    try {
      Object.assign(merged, JSON.parse(referralStr));
    } catch (e) {
      console.error(e);
    }
  }
  return Object.keys(merged).length ? JSON.stringify(merged) : null;
}

export async function getCounselingReferralByMother(
    mother: string,
    pregnancy?: string | null,
    reg_year: number = getCurrentNepaliDate().year,
    reg_month: number = getCurrentNepaliDate().month,
): Promise<CounselingReferralStoreType | null> {
    const db = await getDb();
    let query = `SELECT * FROM counseling_referral WHERE mother = ? AND reg_year = ? AND reg_month = ? AND is_deleted = 0`;
    const params: any[] = [mother, reg_year, reg_month];

    if (pregnancy !== undefined) {
        if (pregnancy) {
            query += ` AND pregnancy = ?`;
            params.push(pregnancy);
        } else {
            query += ` AND pregnancy IS NULL`;
        }
    }

    const result = await db.getFirstAsync<CounselingReferralStoreType>(query, params);
    return result || null;
}

export async function saveCounselingReferral(payload: {
    id?: string;
    mother: string;
    pregnancy?: string | null;
    answers?: string | null;
    counseling_answers?: string | null;
    referral_answers?: string | null;
    reg_year?: number;
    reg_month?: number;
}): Promise<CounselingReferralStoreType> {
    const db = await getDb();
    const now = new Date().toISOString();
    const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();

    const regYear = payload.reg_year || currentYear;
    const regMonth = payload.reg_month || currentMonth;

    // Harmonize answers
    let answers = payload.answers ?? null;
    let counseling_answers = payload.counseling_answers ?? null;
    let referral_answers = payload.referral_answers ?? null;

    if (answers && !counseling_answers && !referral_answers) {
        const split = splitAnswers(answers);
        counseling_answers = split.counseling;
        referral_answers = split.referral;
    } else if ((counseling_answers || referral_answers) && !answers) {
        answers = mergeAnswers(counseling_answers, referral_answers);
    } else if (counseling_answers && referral_answers) {
        // If all are provided, make sure answers is the combined set
        answers = mergeAnswers(counseling_answers, referral_answers);
    }

    try {
        // Check for existing record in this specific context
        const existing = await getCounselingReferralByMother(
            payload.mother,
            payload.pregnancy,
            regYear,
            regMonth
        );

        if (existing) {
            await db.runAsync(
                `UPDATE counseling_referral 
                 SET answers = ?, counseling_answers = ?, referral_answers = ?, updated_at = ?, is_synced = 0 
                 WHERE id = ?`,
                [answers, counseling_answers, referral_answers, now, existing.id],
            );
            return {
                ...existing,
                answers,
                counseling_answers,
                referral_answers,
                updated_at: now,
                is_synced: 0,
            };
        } else {
            const id = payload.id || Crypto.randomUUID();
            // Use INSERT OR REPLACE to handle any unique constraint issues gracefully
            await db.runAsync(
                `INSERT OR REPLACE INTO counseling_referral (id, mother, pregnancy, answers, counseling_answers, referral_answers, reg_year, reg_month, created_at, updated_at, is_synced, is_deleted) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
                [
                    id,
                    payload.mother,
                    payload.pregnancy ?? null,
                    answers,
                    counseling_answers,
                    referral_answers,
                    regYear,
                    regMonth,
                    now,
                    now,
                ],
            );
            return {
                id,
                mother: payload.mother,
                pregnancy: payload.pregnancy ?? null,
                answers,
                counseling_answers,
                referral_answers,
                reg_year: regYear,
                reg_month: regMonth,
                created_at: now,
                updated_at: now,
                is_synced: 0,
                is_deleted: 0,
            };
        }
    } catch (error) {
        console.error("saveCounselingReferral failed:", error);
        throw error;
    }
}

export async function getCounselingReferralHistory(
    mother: string,
    pregnancy?: string | null,
): Promise<CounselingReferralStoreType[]> {
    const db = await getDb();
    let query = `SELECT * FROM counseling_referral WHERE mother = ? AND is_deleted = 0`;
    const params: any[] = [mother];

    if (pregnancy !== undefined) {
        if (pregnancy) {
            query += ` AND pregnancy = ?`;
            params.push(pregnancy);
        } else {
            query += ` AND pregnancy IS NULL`;
        }
    }

    query += ` ORDER BY reg_year DESC, reg_month DESC`;

    const results = await db.getAllAsync<CounselingReferralStoreType>(query, params);
    return results;
}

const COUNSELING_REFERRAL_COLUMNS = [
    "id",
    "mother",
    "pregnancy",
    "answers",
    "counseling_answers",
    "referral_answers",
    "reg_year",
    "reg_month",
    "is_synced",
    "is_deleted",
    "created_at",
    "updated_at",
];

const getCounselingReferralValues = (
    item: Partial<CounselingReferralStoreType>,
    options: {
        isSynced: number;
        isDeleted: number;
        createdAt: string;
        updatedAt: string;
    },
) => {
    let answers = item.answers ?? null;
    let counseling_answers = item.counseling_answers ?? null;
    let referral_answers = item.referral_answers ?? null;

    // Auto-harmonize if any are missing
    if (answers && !counseling_answers && !referral_answers) {
        const split = splitAnswers(answers);
        counseling_answers = split.counseling;
        referral_answers = split.referral;
    } else if ((counseling_answers || referral_answers) && !answers) {
        answers = mergeAnswers(counseling_answers, referral_answers);
    }

    return [
        item.id ?? null,
        item.mother ?? null,
        item.pregnancy ?? null,
        answers,
        counseling_answers,
        referral_answers,
        item.reg_year ?? null,
        item.reg_month ?? null,
        options.isSynced,
        options.isDeleted,
        options.createdAt,
        options.updatedAt,
    ];
};

export async function unSyncedCounselingReferral(): Promise<CounselingReferralStoreType[]> {
    const db = await getDb();
    return await db.getAllAsync<CounselingReferralStoreType>(
        `SELECT * FROM counseling_referral WHERE is_synced = 0`,
    );
}

export async function insertToTempCounselingReferralTable(apiRes: any[]) {
    if (!apiRes.length) return;

    const db = await getDb();
    await bulkInsertToTempTable<any>(
        {
            db,
            table: "counseling_referral_staging",
            columns: COUNSELING_REFERRAL_COLUMNS,
            onConflict: "replace",
            rows: (item) => {
                const createdAt = item.created_at ?? new Date().toISOString();
                const updatedAt = item.updated_at ?? createdAt;
                const deleted = item.deleted ?? item.is_deleted ?? false;

                return getCounselingReferralValues(
                    {
                        id: item.id,
                        mother: item.mother ?? item.mother?.id ?? (typeof item.mother === "string" ? item.mother : null),
                        pregnancy: item.pregnancy ?? item.pregnancy_id ?? null,
                        answers: item.answers ?? null,
                        counseling_answers: item.counseling_answers ?? null,
                        referral_answers: item.referral_answers ?? null,
                        reg_year: item.reg_year,
                        reg_month: item.reg_month,
                    },
                    {
                        isSynced: 1,
                        isDeleted: deleted ? 1 : 0,
                        createdAt,
                        updatedAt,
                    },
                );
            },
        },
        apiRes,
    );
}

export async function moveTempToRealCounselingReferralTable() {
    const db = await getDb();

    const staged = await db.getAllAsync<CounselingReferralStoreType>(
        `SELECT * FROM counseling_referral_staging`,
    );

    if (!staged.length) return;

    const placeholders = COUNSELING_REFERRAL_COLUMNS.map(() => "?").join(", ");
    const updateSet = COUNSELING_REFERRAL_COLUMNS
        .filter((column) => column !== "id")
        .map((column) => `${column} = excluded.${column}`)
        .join(", ");

    for (const item of staged) {
        await db.runAsync(
            `
            INSERT INTO counseling_referral (${COUNSELING_REFERRAL_COLUMNS.join(", ")})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET
                ${updateSet}
            WHERE datetime(excluded.updated_at) > datetime(counseling_referral.updated_at)
                OR counseling_referral.updated_at IS NULL;
            `,
            getCounselingReferralValues(item, {
                isSynced: 1,
                isDeleted: item.is_deleted ?? 0,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            }),
        );
    }

    await setSyncTimestamp("counseling_referral", new Date().toISOString());
}
