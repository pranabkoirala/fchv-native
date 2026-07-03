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
import { fetchPncVisitsFromServer } from "../pnc_visit/queries";
import { fetchDeliveriesFromServer } from "../delivery/queries";
import { fetchFromServer as fetchBirthRegistrationsFromServer } from "../childBirthRegistration/queries";
import { fetchFromServer as fetchDeathRegistrationsFromServer } from "../childDeathRegistration/queries";
import { fetchFromServer as fetchFchvCounselingFromServer } from "../fchvCounseling/queries";
import { fetchChildNutritionFromServer } from "../child_nutrition/queries";
import { fetchAbortionsFromServer } from "../abortion/queries";
import {
  getTablesWithTimestamp,
  setSyncTimestamp,
} from "@/hooks/database/models/SyncModel";
import { SyncTableType } from "@/hooks/database/types/table";

const HYDRATION_TABLES: SyncTableType[] = [
  "mother",
  "pregnancy",
  "visit",
  "pnc_visit",
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
  "delivery",
  "child_birth_registration",
  "child_death_registration",
  "fchv_counseling",
  "child_nutrition",
  "abortion",
];

const HYDRATORS: Record<SyncTableType, () => Promise<void>> = {
  mother: () => fetchMothersFromServer(),
  pregnancy: () => fetchPregnanciesFromServer(),
  visit: () => fetchVisitsFromServer(),
  pnc_visit: () => fetchPncVisitsFromServer(),
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
  delivery: () => fetchDeliveriesFromServer(),
  child_birth_registration: () => fetchBirthRegistrationsFromServer(),
  child_death_registration: () => fetchDeathRegistrationsFromServer(),
  fchv_counseling: () => fetchFchvCounselingFromServer(),
  child_nutrition: () => fetchChildNutritionFromServer(),
  abortion: () => fetchAbortionsFromServer(),
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
