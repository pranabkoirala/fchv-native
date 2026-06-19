import * as Crypto from "expo-crypto";
import { getDb } from "../db";
import { bulkInsertToTempTable } from "./CommonModal";
import { setSyncTimestamp } from "./SyncModel";

export interface ChildVaccinationStoreType {
    id: string;
    child: string;
    vaccine_id: string;
    is_given: number;
    given_date: string | null;
    is_synced: number;
    is_deleted: number;
    created_at: string;
    updated_at: string;
}

export async function getChildVaccinations(child: string): Promise<ChildVaccinationStoreType[]> {
    const db = await getDb();
    const results = await db.getAllAsync<ChildVaccinationStoreType>(
        "SELECT * FROM child_vaccination WHERE child = ? AND is_deleted = 0",
        [child]
    );
    return results;
}

export async function toggleVaccineStatus(
    child: string,
    vaccine_id: string,
    is_given: boolean,
    given_date?: string
): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    const existing = await db.getFirstAsync<ChildVaccinationStoreType>(
        "SELECT id FROM child_vaccination WHERE child = ? AND vaccine_id = ?",
        [child, vaccine_id]
    );

    if (existing) {
        await db.runAsync(
            `UPDATE child_vaccination 
       SET is_given = ?, given_date = ?, updated_at = ?, is_synced = 0 
       WHERE id = ?`,
            [is_given ? 1 : 0, given_date || (is_given ? now : null), now, existing.id]
        );
    } else {
        const id = Crypto.randomUUID();
        await db.runAsync(
            `INSERT INTO child_vaccination (id, child, vaccine_id, is_given, given_date, created_at, updated_at, is_synced, is_deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
            [id, child, vaccine_id, is_given ? 1 : 0, given_date || (is_given ? now : null), now, now]
        );
    }
}

const CHILD_VACCINATION_COLUMNS = [
    "id",
    "child",
    "vaccine_id",
    "is_given",
    "given_date",
    "is_synced",
    "is_deleted",
    "created_at",
    "updated_at",
];

const getChildVaccinationValues = (
    item: Partial<ChildVaccinationStoreType>,
    options: {
        isSynced: number;
        isDeleted: number;
        createdAt: string;
        updatedAt: string;
    },
) => [
    item.id ?? null,
    item.child ?? null,
    item.vaccine_id ?? null,
    item.is_given ?? 0,
    item.given_date ?? null,
    options.isSynced,
    options.isDeleted,
    options.createdAt,
    options.updatedAt,
];

export async function unSyncedChildVaccination(): Promise<ChildVaccinationStoreType[]> {
    const db = await getDb();
    return await db.getAllAsync<ChildVaccinationStoreType>(
        "SELECT * FROM child_vaccination WHERE is_synced = 0",
    );
}

export async function insertToTempChildVaccinationTable(apiRes: any[]) {
    if (!apiRes.length) return;

    const db = await getDb();
    await bulkInsertToTempTable<any>(
        {
            db,
            table: "child_vaccination_staging",
            columns: CHILD_VACCINATION_COLUMNS,
            onConflict: "replace",
            rows: (item) => {
                const createdAt = item.created_at ?? new Date().toISOString();
                const updatedAt = item.updated_at ?? createdAt;
                const deleted = item.deleted ?? item.is_deleted ?? false;

                return getChildVaccinationValues(
                    {
                        id: item.id,
                        child: item.child ?? item.child_id ?? null,
                        vaccine_id: item.vaccine_id ?? null,
                        is_given: item.is_given ?? 0,
                        given_date: item.given_date ?? null,
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

export async function moveTempToRealChildVaccinationTable() {
    const db = await getDb();

    const staged = await db.getAllAsync<ChildVaccinationStoreType>(
        "SELECT * FROM child_vaccination_staging",
    );

    if (!staged.length) return;

    const placeholders = CHILD_VACCINATION_COLUMNS.map(() => "?").join(", ");
    const updateSet = CHILD_VACCINATION_COLUMNS
        .filter((column) => column !== "id")
        .map((column) => `${column} = excluded.${column}`)
        .join(", ");

    for (const item of staged) {
        await db.runAsync(
            `INSERT INTO child_vaccination (${CHILD_VACCINATION_COLUMNS.join(", ")})
            VALUES (${placeholders})
            ON CONFLICT(id) DO UPDATE SET
                ${updateSet}
            WHERE datetime(excluded.updated_at) > datetime(child_vaccination.updated_at)
                OR child_vaccination.updated_at IS NULL;`,
            getChildVaccinationValues(item, {
                isSynced: 1,
                isDeleted: item.is_deleted ?? 0,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            }),
        );
    }

    await setSyncTimestamp("child_vaccination", new Date().toISOString());
}
