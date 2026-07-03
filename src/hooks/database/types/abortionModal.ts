export type AbortionStoreType = {
  id: string;
  mother: string;
  pregnancy: string | null;
  aborted: number;
  reg_year: number | null;
  reg_month: number | null;
  is_synced: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
};

export type CreateAbortionPayload = {
  id: string;
  mother: string;
  pregnancy?: string | null;
  aborted: boolean;
  is_synced?: boolean;
};

export type AbortionSyncPayload = {
  id: string;
  mother: string;
  pregnancy: string | null;
  aborted: number;
  reg_year?: number | null;
  reg_month?: number | null;
  updated_at: string;
  deleted: boolean;
};
