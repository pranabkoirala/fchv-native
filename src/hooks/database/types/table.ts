type TableType =
  | "mother"
  | "mother_staging"
  | "visit"
  | "visit_staging"
  | "todo"
  | "todo_staging"
  | "pregnancy"
  | "pregnancy_staging"
  | "mothers_group_meetings"
  | "mothers_group_meetings_staging"
  | "hmis_maternal_death"
  | "hmis_maternal_death_staging"
  | "hmis_newborn_death"
  | "hmis_newborn_death_staging"
  | "adolescent_ifa"
  | "adolescent_ifa_staging"
  | "child_monitoring"
  | "child_monitoring_staging"
  | "supplements"
  | "supplements_staging"
  | "family_planning"
  | "family_planning_staging"
  | "counseling_referral"
  | "counseling_referral_staging"
  | "child_counseling"
  | "child_counseling_staging"
  | "child_vaccination"
  | "child_vaccination_staging";

type SyncTableType = Extract<
  TableType,
  | "mother"
  | "visit"
  | "todo"
  | "pregnancy"
  | "mothers_group_meetings"
  | "hmis_maternal_death"
  | "hmis_newborn_death"
  | "adolescent_ifa"
  | "child_monitoring"
  | "supplements"
  | "family_planning"
  | "counseling_referral"
  | "child_counseling"
  | "child_vaccination"
>;

type RunAsync = (sql: string, params?: any[]) => Promise<any>;

type Primitive = string | number | null | boolean;

export { Primitive, RunAsync, SyncTableType, TableType };
