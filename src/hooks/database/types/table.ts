type TableType =
  | "mother"
  | "pregnancy"
  | "pregnancy_staging"

type SyncTableType = Extract<
  TableType,
  | "mother"
  | "pregnancy"
  | "pregnancy_staging"
>;

type RunAsync = (sql: string, params?: any[]) => Promise<any>;

type Primitive = string | number | null | boolean;

export { Primitive, RunAsync, SyncTableType, TableType };
