import { fetchAdolescentIfaFromServer } from "../adolescent/queries";
import { fetchChildMonitoringFromServer } from "../childMonitoring/queries";
import { fetchMaternalDeathsFromServer } from "../maternalDeath/queries";
import { fetchMothersFromServer } from "../mother/queries";
import { fetchMothersGroupMeetingsFromServer } from "../mothersGroupMeeting/queries";
import { fetchNewbornDeathsFromServer } from "../newbornDeath/queries";
import { fetchPregnanciesFromServer } from "../pregnantWomen/queries";
import { fetchSupplementsFromServer } from "../supplements/queries";
import { fetchFamilyPlanningFromServer } from "../familyPlanning/queries";
import { fetchCounselingReferralFromServer } from "../counselingReferral/queries";
import { fetchChildCounselingFromServer } from "../childCounseling/queries";
import { fetchChildVaccinationFromServer } from "../childVaccination/queries";
import { fetchTodosFromServer } from "../todo/queries";
import { fetchVisitsFromServer } from "../visit/queries";
import {
  getTablesWithTimestamp,
  setSyncTimestamp,
} from "@/hooks/database/models/SyncModel";
import { SyncTableType } from "@/hooks/database/types/table";

const HYDRATION_TABLES: SyncTableType[] = [
  "mother",
  "pregnancy",
  "visit",
  "child_monitoring",
  "supplements",
  "family_planning",
  "counseling_referral",
  "child_counseling",
  "child_vaccination",
  "hmis_maternal_death",
  "hmis_newborn_death",
  "adolescent_ifa",
  "mothers_group_meetings",
  "todo",
];

const HYDRATORS: Record<SyncTableType, () => Promise<void>> = {
  mother: () => fetchMothersFromServer(),
  pregnancy: () => fetchPregnanciesFromServer(),
  visit: () => fetchVisitsFromServer(),
  child_monitoring: () => fetchChildMonitoringFromServer(),
  supplements: () => fetchSupplementsFromServer(),
  family_planning: () => fetchFamilyPlanningFromServer(),
  counseling_referral: () => fetchCounselingReferralFromServer(),
  child_counseling: () => fetchChildCounselingFromServer(),
  child_vaccination: () => fetchChildVaccinationFromServer(),
  hmis_maternal_death: () => fetchMaternalDeathsFromServer(),
  hmis_newborn_death: () => fetchNewbornDeathsFromServer(),
  adolescent_ifa: () => fetchAdolescentIfaFromServer(),
  mothers_group_meetings: () => fetchMothersGroupMeetingsFromServer(),
  todo: () => fetchTodosFromServer(),
};

let hydrationPromise: Promise<void> | null = null;

export async function hasPendingDatabaseHydration(): Promise<boolean> {
  const timestamps = await getTablesWithTimestamp();
  return HYDRATION_TABLES.some((table) => !timestamps[table]);
}

export async function hydrateDatabaseFromServer(): Promise<void> {
  if (hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = (async () => {
    for (const table of HYDRATION_TABLES) {
      await HYDRATORS[table]();
      await setSyncTimestamp(table, new Date().toISOString());
    }
  })();

  try {
    await hydrationPromise;
  } finally {
    hydrationPromise = null;
  }
}
