import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Share from "expo-sharing";
import { PDFDocument } from "pdf-lib";
import { Platform } from "react-native";
import { AdToBs, BsToAd } from "react-native-nepali-picker";
import {
  CHILD_COUNSELING_QUESTIONS,
  CHILD_HEALTH_COUNSELLING_QUESTIONS,
  ONE_TIME_CHILD_COUNSELING_QUESTIONS,
  REGISTRATION_COUNSELING_QUESTIONS,
} from "../constants/ChildCounselingQuestions";
import { ALL_QUESTIONS } from "../constants/CounselingQuestions";
import { VACCINE_SCHEDULE } from "../constants/VaccineConstants";
import { getDb } from "../hooks/database/db";
import { getAllAdolescentIfa } from "../hooks/database/models/AdolescentIfaModel";
import {
  getAllDeliveries,
  getDeliveriesByMother,
} from "../hooks/database/models/DeliveryModel";
import { getAllFamilyPlanning } from "../hooks/database/models/FamilyPlanningModel";
import { getAllInfantMonitorings } from "../hooks/database/models/InfantMonitoringModel";
import { getAllMaternalDeaths } from "../hooks/database/models/MaternalDeathModel";
import { getAllMothersGroupMeetings } from "../hooks/database/models/MothersGroupMeetingModel";
import { getAllNewbornDeaths } from "../hooks/database/models/NewbornDeathModel";
import {
  getPregnantWomenList,
  PregnantWomenListItem,
} from "../hooks/database/models/PregnantWomenModal";
import { resolveNepaliYearMonth } from "./dateHelper";
import storage from "./storage";

const {
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
  StorageAccessFramework,
} = FileSystem;

/** Optional filter for year/month-wise PDF export */
export type MonthFilter = { year: number; month?: number | null } | null;

const matchesMonthFilter = (
  filter: MonthFilter,
  record: {
    reg_year?: number | null;
    reg_month?: number | string | null;
    created_at?: string | null;
  },
): boolean => {
  if (!filter) return true; // no filter = show all
  const resolved = resolveNepaliYearMonth(
    record.reg_year,
    record.reg_month,
    record.created_at,
  );
  if (!resolved) return false;
  return (
    resolved.year === filter.year &&
    (!filter.month || resolved.month === filter.month)
  );
};

const escapeHtml = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const convertToNepaliNumber = (
  num: number | string | null | undefined,
): string => {
  if (num === null || num === undefined) return "";
  const nepaliNumbers = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(
    /[0-9]/g,
    (match) => nepaliNumbers[parseInt(match)],
  );
};

const parseDateToNepali = (dateStr: string | null | undefined) => {
  if (!dateStr) return { year: "", month: "", day: "" };
  try {
    const yearPart = parseInt(dateStr.split("-")[0], 10);
    const bsDate = yearPart >= 2070 ? dateStr : AdToBs(dateStr);
    const [year, month, day] = bsDate.split("-");
    return {
      year: convertToNepaliNumber(year),
      month: convertToNepaliNumber(month),
      day: convertToNepaliNumber(day),
    };
  } catch (e) {
    return { year: "", month: "", day: "" };
  }
};

const convertAdYmdToBs = (
  y: number | string | null | undefined,
  m: number | string | null | undefined,
  d: number | string | null | undefined,
) => {
  if (!y || !m || !d) return { year: "", month: "", day: "" };
  const adString = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return parseDateToNepali(adString);
};

const getOcpBlisterPackSvg = () => {
  let pills = "";
  for (let i = 0; i < 21; i++) {
    pills += `<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#fff;border:0.5px solid #546e7a;vertical-align:middle;"></span>`;
  }
  pills += `<span style="display:inline-block;width:2px;"></span>`;
  for (let i = 0; i < 7; i++) {
    pills += `<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:#8d6e63;border:0.5px solid #5d4037;vertical-align:middle;"></span>`;
  }
  return `
    <div style="display:inline-block;border:1px solid #37474f;border-radius:2px;background:#eceff1;text-align:center;padding:2px;line-height:1.2;">
      <div style="background:#1e88e5;height:4px;margin-bottom:2px;"></div>
      ${pills}
    </div>
  `;
};

const getCss = () => `
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: sans-serif; font-size: 10px; color: #333; padding: 20px; }
    h2, h3, h4 { text-align: center; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 9px; word-wrap: break-word; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .page-break { page-break-before: always; }
    .title { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
    .subtitle { font-size: 12px; margin-bottom: 5px; }
    .collected-title { text-align: center; font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .collected-table { table-layout: fixed; border: 1.4px solid #111; }
    .collected-table th { background: #e8e8e8; font-size: 9px; padding: 6px 3px; }
    .collected-table td { font-size: 9px; padding: 6px 3px; vertical-align: middle; }
    .collected-table .sn-col { width: 38px; }
    .collected-table .activity-col { width: 33%; }
    .collected-table .activity-cell { text-align: left; line-height: 1.45; }
    .collected-table .section-row td { background: #f7e4dc; font-weight: 700; text-align: left; }
    .collected-table .section-row td:first-child { text-align: center; }
    .collected-table .total-cell { background: #f3f4f6; font-weight: 700; }
    .muac-container { display: flex; flex-direction: row; align-items: center; justify-content: space-between; height: 100%; min-height: 48px; box-sizing: border-box; }
    .muac-badge { display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; width: 44px; align-self: stretch; font-size: 9px; border-right: 1.2px solid #000; text-align: center; padding: 2px; box-sizing: border-box; }
    .muac-green-badge { background-color: #2e7d32; }
    .muac-yellow-badge { background-color: #fbc02d; color: black; }
    .muac-red-badge { background-color: #d32f2f; }
    .muac-content { flex: 1; text-align: left; padding: 4px 6px; font-size: 8.5px; line-height: 1.25; font-weight: 600; }
    .muac-illustrations { display: flex; align-items: center; gap: 4px; padding-right: 4px; }
    .muac-circle-img { border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; box-sizing: border-box; }
    .muac-circle-green { border: 1.8px solid #2e7d32; background-color: #e8f5e9; }
    .muac-circle-yellow { border: 1.8px solid #fbc02d; background-color: #fffde7; }
    .muac-circle-red { border: 1.8px solid #d32f2f; background-color: #ffebee; }
  </style>
`;

const getEmptyRows = (cols: number, count = 3) => {
  let rows = "";
  for (let i = 0; i < count; i++) {
    rows += "<tr>";
    for (let j = 0; j < cols; j++) {
      rows += "<td></td>";
    }
    rows += "</tr>";
  }
  return rows;
};

/** Safe checkmark/cross for expo-print (no emoji — they crash Android PDF writer) */
const CHECK = "&#10003;"; // ✓
const CROSS = "-"; // simple dash instead of ❌

const NEPALI_MONTHS = [
  "बैशाख",
  "जेठ",
  "आषाढ",
  "श्रावण",
  "भाद्र",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पौष",
  "माघ",
  "फाल्गुण",
  "चैत्र",
];

type SummaryPeriod = { key: number; label: string };
type SummaryCounts = Record<number, Record<number, number>>;

/** nutrition sub-column counts: rowNo → month → subCol(1|2|3) → count */
type NutritionSubCounts = Record<
  number,
  Record<number, Record<number, number>>
>;

const NUTRITION_ROWS = [55, 56, 57]; // rows that use 3-sub-column layout

const selectedPeriods = (filter: MonthFilter): SummaryPeriod[] => {
  if (filter?.month) {
    return [{ key: filter.month, label: NEPALI_MONTHS[filter.month - 1] }];
  }
  return NEPALI_MONTHS.map((label, index) => ({ key: index + 1, label }));
};

const getRecordMonth = (
  record: {
    reg_year?: number | null;
    reg_month?: number | string | null;
    created_at?: string | null;
  },
  filter: MonthFilter,
) => {
  const resolved = resolveNepaliYearMonth(
    record.reg_year,
    record.reg_month,
    record.created_at,
  );

  if (!resolved) return null;
  if (filter && resolved.year !== filter.year) return null;
  if (filter?.month && resolved.month !== filter.month) return null;
  return resolved.month;
};

const addCount = (
  counts: SummaryCounts,
  rowNo: number,
  month: number | null,
  amount = 1,
) => {
  if (!month || month < 1 || month > 12) return;
  counts[rowNo][month] = (counts[rowNo][month] || 0) + amount;
};

const hasPositiveAnswer = (answers: string | null | undefined, id: string) => {
  if (!answers) return false;
  try {
    const parsed = JSON.parse(answers);
    const value = parsed?.[id];
    if (Array.isArray(value)) {
      return value.some((entry) => {
        if (typeof entry === "boolean") return entry;
        if (typeof entry === "number") return entry > 0;
        return Boolean(entry?.value);
      });
    }
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    return Boolean(value?.value);
  } catch (e) {
    return false;
  }
};

/** Check a counseling answer, validating the question exists in ALL_QUESTIONS and matching expected category */
const hasCounselingAnswer = (
  record: any,
  questionId: string,
  expectedCategory?: string,
): boolean => {
  const question = ALL_QUESTIONS.find((q) => q.id === questionId);
  if (!question) return false;
  if (expectedCategory && question.category !== expectedCategory) return false;

  if (hasPositiveAnswer(record.answers, questionId)) return true;
  if (question.type === "referral") {
    return hasPositiveAnswer(record.referral_answers, questionId);
  }
  return hasPositiveAnswer(record.counseling_answers, questionId);
};

/** Check a child-counseling answer against the child-counseling question definitions */
const hasChildCounselingAnswer = (record: any, questionId: string): boolean => {
  const definedInChild =
    CHILD_COUNSELING_QUESTIONS.some((q) => q.id === questionId) ||
    CHILD_HEALTH_COUNSELLING_QUESTIONS.some((q) => q.id === questionId) ||
    ONE_TIME_CHILD_COUNSELING_QUESTIONS.some((q) => q.id === questionId) ||
    REGISTRATION_COUNSELING_QUESTIONS.some((q) => q.id === questionId);
  if (!definedInChild) return false;
  return hasPositiveAnswer(record.answers, questionId);
};

/** Sum the quantity values for a child-counseling question (e.g. ORS packets, zinc tablets) */
const sumChildCounselingQuantity = (
  answers: string | null | undefined,
  questionId: string,
): number => {
  if (!answers) return 0;
  try {
    const parsed = JSON.parse(answers);
    const value = parsed?.[questionId];
    if (!Array.isArray(value)) return 0;
    return value.reduce((sum: number, entry: any) => {
      if (typeof entry === "number") return sum + entry;
      if (typeof entry?.value === "number") return sum + entry.value;
      return sum;
    }, 0);
  } catch {
    return 0;
  }
};

const parseDateForAge = (value: string | null | undefined) => {
  if (!value) return null;
  const datePart = value.split("T")[0];
  const year = parseInt(datePart.split("-")[0], 10);
  const adDate = year >= 2070 ? null : datePart;
  if (!adDate) return null;
  const parsed = new Date(`${adDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getAgeInDays = (
  birthDate: string | null | undefined,
  recordDate: string | null | undefined,
) => {
  const birth = parseDateForAge(birthDate);
  const record = parseDateForAge(recordDate);
  if (!birth || !record) return null;
  return Math.floor((record.getTime() - birth.getTime()) / 86400000);
};

const getAllRows = async <T>(table: string): Promise<T[]> => {
  const db = await getDb();
  return db.getAllAsync<T>(
    `SELECT * FROM ${table} WHERE is_deleted = 0 ORDER BY created_at DESC`,
  );
};

const buildCollectedDataCounts = async (filter: MonthFilter) => {
  const counts: SummaryCounts = {};
  const rowsToInit = [...Array.from({ length: 85 }, (_, i) => i + 1), 420, 430];
  rowsToInit.forEach((rowNo) => {
    counts[rowNo] = {};
    for (let month = 1; month <= 12; month++) counts[rowNo][month] = 0;
  });

  const [
    pregnancies,
    counselingRecords,
    childCounselingRecords,
    supplements,
    vaccinations,
    deliveries,
    infants,
    deaths,
    familyPlanningRecords,
    mothersGroupMeetings,
    maternalDeaths,
    adolescentIfaRecords,
    childBirthRegistrations,
    childDeathRegistrations,
    fchvCounselingRecords,
  ] = await Promise.all([
    getPregnantWomenList(),
    getAllRows<any>("counseling_referral"),
    getAllRows<any>("child_counseling"),
    getAllRows<any>("supplements"),
    getAllRows<any>("child_vaccination"),
    getAllDeliveries(),
    getAllInfantMonitorings(),
    getAllNewbornDeaths(),
    getAllFamilyPlanning(),
    getAllMothersGroupMeetings(),
    getAllMaternalDeaths(),
    getAllAdolescentIfa(),
    getAllRows<any>("child_birth_registration"),
    getAllRows<any>("child_death_registration"),
    getAllRows<any>("fchv_counseling"),
  ]);

  const childById = infants.reduce<Record<string, any>>((acc, child) => {
    acc[child.id] = child;
    return acc;
  }, {});

  pregnancies.forEach((item) => {
    addCount(counts, 1, getRecordMonth(item, filter));
  });

  counselingRecords.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (hasCounselingAnswer(item, "pregnancy_test_referral", "pregnant")) {
      addCount(counts, 2, month);
    }
    if (hasCounselingAnswer(item, "hiv_transmission_counseling", "pregnant")) {
      addCount(counts, 3, month);
    }
    if (hasCounselingAnswer(item, "antenatal_checkups", "pregnant")) {
      addCount(counts, 4, month);
    }
    if (hasCounselingAnswer(item, "iron_tablets_followup", "pregnant")) {
      addCount(counts, 5, month);
    }
    if (
      hasCounselingAnswer(item, "institutional_delivery_referral", "postpartum")
    ) {
      addCount(counts, 6, month);
    }
    if (hasCounselingAnswer(item, "home_delivery_misoprostol", "postpartum")) {
      addCount(counts, 7, month);
    }
    if (
      hasCounselingAnswer(item, "health_education_safe_motherhood", "pregnant")
    ) {
      addCount(counts, 8, month);
    }
    if (
      hasCounselingAnswer(
        item,
        "infant_feeding_practices_counseling",
        "postpartum",
      )
    ) {
      addCount(counts, 12, month);
    }
    if (
      hasCounselingAnswer(item, "institutional_delivery_referral", "postpartum")
    ) {
      addCount(counts, 13, month);
    }
    if (
      hasCounselingAnswer(item, "postnatal_iron_tablets_given", "postpartum")
    ) {
      addCount(counts, 14, month);
    }
    if (hasCounselingAnswer(item, "vitamin_a_given", "postpartum")) {
      addCount(counts, 15, month);
    }
    if (hasCounselingAnswer(item, "bathed_after_24_hours", "postpartum")) {
      addCount(counts, 11, month);
    }
    if (hasCounselingAnswer(item, "abortion_services_referral", "pregnant")) {
      addCount(counts, 37, month);
    }
    if (
      hasCounselingAnswer(item, "family_planning_services_referral", "mother")
    ) {
      addCount(counts, 46, month);
    }
    if (hasCounselingAnswer(item, "fm_health_education", "mother")) {
      addCount(counts, 47, month);
    }
    if (hasCounselingAnswer(item, "uterine_prolapse_referral", "mother")) {
      addCount(counts, 73, month);
    }
    if (
      hasCounselingAnswer(item, "cervical_cancer_screening_referral", "mother")
    ) {
      addCount(counts, 74, month);
    }
  });

  infants.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (item.status === "alive") addCount(counts, 9, month);
    if (item.status === "dead") addCount(counts, 10, month);
  });

  const homeBirthRows = ([...deliveries, ...infants] as any[]).filter(
    (item) => item.birth_place === "home" || item.delivery_place === "home",
  );
  homeBirthRows.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (
      item.bathed_after_24_hours ||
      item.is_all_given ||
      item.early_breastfeeding
    ) {
      addCount(counts, 11, month);
    }
  });

  childCounselingRecords.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (hasChildCounselingAnswer(item, "bathed_after_24_hours")) {
      addCount(counts, 11, month);
    }
    if (hasChildCounselingAnswer(item, "newborn_vaccination_facility")) {
      addCount(counts, 17, month);
    }

    // ── Diarrhoea rows (28-33) ────────────────────────────────
    if (hasChildCounselingAnswer(item, "has_diarrhea")) {
      addCount(counts, 28, month);
    }
    if (hasChildCounselingAnswer(item, "diarrhea_treated_with_ors_zinc")) {
      addCount(counts, 29, month);
    }
    const orsQty = sumChildCounselingQuantity(item.answers, "ors_for_child");
    if (orsQty > 0) {
      addCount(counts, 30, month, orsQty);
    }
    const zincQty = sumChildCounselingQuantity(item.answers, "zinc_for_child");
    if (zincQty > 0) {
      addCount(counts, 32, month, zincQty);
    }
    if (
      hasChildCounselingAnswer(
        item,
        "referred_to_health_facility_due_to_diarrhea",
      )
    ) {
      addCount(counts, 33, month);
    }

    // ── Respiratory rows (34-36) ──────────────────────────────
    if (
      hasChildCounselingAnswer(item, "has_breathing_problems") ||
      hasChildCounselingAnswer(item, "has_pneumonia")
    ) {
      addCount(counts, 34, month);
    }
    if (hasChildCounselingAnswer(item, "home_treatment_cold")) {
      addCount(counts, 35, month);
    }
    if (hasChildCounselingAnswer(item, "referred_breathing_problems")) {
      addCount(counts, 36, month);
    }

    // ── Malnutrition rows (48-54) ────────────────────────────
    let malnutritionAnswers: any[] = [];
    try {
      const parsed = JSON.parse(item.answers || "{}");
      const logs = parsed?.has_malnutrition;
      if (Array.isArray(logs)) malnutritionAnswers = logs;
    } catch {}
    if (malnutritionAnswers.length > 0) {
      const latest = malnutritionAnswers[malnutritionAnswers.length - 1];
      if (latest.muac === "green") addCount(counts, 48, month);
      if (latest.muac === "yellow") addCount(counts, 49, month);
      if (latest.muac === "red") addCount(counts, 50, month);
      const sub = latest.sub_answers || {};
      if (sub.malnutrition_cured?.value) addCount(counts, 52, month);
      if (sub.malnutrition_no_weight_gain?.value) addCount(counts, 53, month);
      if (sub.malnutrition_dropped_out?.value) addCount(counts, 54, month);
    }
    if (
      hasChildCounselingAnswer(
        item,
        "referred_to_health_facility_due_to_phuknas",
      )
    ) {
      addCount(counts, 51, month);
    }

    // ── Registration counseling (77, 79) ─────────────────────
    if (hasChildCounselingAnswer(item, "birth_registration_counseling")) {
      addCount(counts, 77, month);
    }
    if (hasChildCounselingAnswer(item, "death_registration_counseling")) {
      addCount(counts, 79, month);
    }

    // ── Sick infant by age (20-22) ────────────────────────────
    const hasSickInfantAnswer = [
      "has_diarrhea",
      "has_breathing_problems",
      "has_pneumonia",
      "has_malnutrition",
    ].some((id) => hasChildCounselingAnswer(item, id));
    if (!hasSickInfantAnswer) return;

    const child = childById[item.child];
    const ageInDays = getAgeInDays(
      child?.date_of_birth,
      item.updated_at || item.created_at,
    );
    if (ageInDays === null) return;
    if (ageInDays >= 0 && ageInDays <= 7) addCount(counts, 20, month);
    if (ageInDays >= 8 && ageInDays <= 28) addCount(counts, 21, month);
    if (ageInDays >= 29 && ageInDays <= 59) addCount(counts, 22, month);
  });

  childBirthRegistrations.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (item.birth_status === 1) {
      addCount(counts, 78, month);
    }
  });

  childDeathRegistrations.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (item.death_status === 1) {
      addCount(counts, 80, month);
    }
  });

  supplements.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (item.iron_pregnancy) addCount(counts, 5, month);
    if (item.iron_post_delivery) addCount(counts, 14, month);
    if (item.vitamin_a_post_delivery) addCount(counts, 15, month);
  });

  const vaccineIds = VACCINE_SCHEDULE.flatMap((slot) =>
    slot.vaccines.map((vaccine) => vaccine.id),
  );
  const childVaccineData = vaccinations.reduce<
    Record<string, { given: Set<string>; maxDate: string | null }>
  >((acc, item) => {
    if (!item.child || item.is_given !== 1) return acc;
    if (!acc[item.child]) {
      acc[item.child] = { given: new Set<string>(), maxDate: null };
    }
    acc[item.child].given.add(item.vaccine_id);
    const dateStr = item.given_date || item.created_at;
    const prevMax = acc[item.child].maxDate;
    if (dateStr && (!prevMax || dateStr > prevMax)) {
      acc[item.child].maxDate = dateStr;
    }
    return acc;
  }, {});
  Object.entries(childVaccineData).forEach(([childId, data]) => {
    if (!vaccineIds.every((id) => data.given.has(id))) return;
    const child = childById[childId];
    if (!child) return;
    const ageDays = getAgeInDays(child.date_of_birth, data.maxDate);
    if (ageDays === null || ageDays >= 700) return;
    const completionMonth = getRecordMonth(
      { created_at: data.maxDate },
      filter,
    );
    addCount(counts, 18, completionMonth);
  });

  deaths.forEach((item) => {
    const month = getRecordMonth(item, filter);
    const age = Number(item.death_age_days || 0);
    if (item.death_age_unit === "days" && age <= 7) addCount(counts, 23, month);
    if (item.death_age_unit === "days" && age >= 8 && age <= 28) {
      addCount(counts, 24, month);
    }
    if (
      (item.death_age_unit === "days" && age >= 29 && age <= 59) ||
      (item.death_age_unit === "months" && age < 2)
    ) {
      addCount(counts, 25, month);
    }
    if (item.death_age_unit === "months") {
      if (age >= 2 && age <= 11) {
        addCount(counts, 26, month);
      } else if (age >= 12 && age <= 59) {
        addCount(counts, 27, month);
      }
    }
    if (item.death_place !== "Institution") {
      if (
        (item.death_age_unit === "days" && age >= 29 && age <= 59) ||
        (item.death_age_unit === "months" && age < 2)
      ) {
        addCount(counts, 64, month);
      }
      if (item.death_age_unit === "months" && age >= 2 && age <= 59) {
        addCount(counts, 65, month);
      }
    }
  });

  familyPlanningRecords.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (item.ocp_qty > 0) addCount(counts, 42, month);
    if (item.ecp_qty > 0) addCount(counts, 420, month);
    if (item.ocp_qty > 0) addCount(counts, 43, month, item.ocp_qty);
    if (item.ecp_qty > 0) addCount(counts, 430, month, item.ecp_qty);
    if (item.condom_qty > 0) {
      addCount(counts, 44, month);
      addCount(counts, 45, month, item.condom_qty);
    }
  });

  mothersGroupMeetings.forEach((item) => {
    const month = getRecordMonth(item, filter);
    addCount(counts, 58, month);
    addCount(counts, 59, month, item.attendees_count || 0);
    addCount(counts, 60, month);
  });

  maternalDeaths.forEach((item) => {
    if (item.death_place === "Institution") return;
    const month = getRecordMonth(item, filter);
    if (item.death_condition === "Pregnant") addCount(counts, 61, month);
    if (item.death_condition === "Labor") addCount(counts, 62, month);
    if (item.death_condition === "Post-delivery") addCount(counts, 63, month);
  });

  adolescentIfaRecords.forEach((item) => {
    const month = getRecordMonth(item, filter);
    const hasPhase1 =
      item.phase1_week_1 > 0 ||
      item.phase1_week_2 > 0 ||
      item.phase1_week_3 > 0 ||
      item.phase1_week_4 > 0 ||
      item.phase1_week_5 > 0 ||
      item.phase1_week_6 > 0 ||
      item.phase1_week_7 > 0 ||
      item.phase1_week_8 > 0 ||
      item.phase1_week_9 > 0 ||
      item.phase1_week_10 > 0 ||
      item.phase1_week_11 > 0 ||
      item.phase1_week_12 > 0 ||
      item.phase1_week_13 > 0;
    const hasPhase2 =
      item.phase2_week_1 > 0 ||
      item.phase2_week_2 > 0 ||
      item.phase2_week_3 > 0 ||
      item.phase2_week_4 > 0 ||
      item.phase2_week_5 > 0 ||
      item.phase2_week_6 > 0 ||
      item.phase2_week_7 > 0 ||
      item.phase2_week_8 > 0 ||
      item.phase2_week_9 > 0 ||
      item.phase2_week_10 > 0 ||
      item.phase2_week_11 > 0 ||
      item.phase2_week_12 > 0 ||
      item.phase2_week_13 > 0;
    if (hasPhase1) addCount(counts, 81, month);
    if (hasPhase2) addCount(counts, 82, month);
  });

  const FCHV_COUNSELING_ROW_MAP: Record<number, string> = {
    16: "immunization_cleanliness_sessions",
    19: "village_clinic_support",
    31: "ors_for_above_5_years",
    38: "adolescent_referred_count",
    39: "cough_referred_count",
    40: "first_aid_count",
    41: "first_aid_referred_count",
    66: "child_health_education_count",
    67: "ncd_health_education_count",
    68: "ncd_beneficiaries_count",
    69: "tb_referred_count",
    70: "leprosy_referred_count",
    71: "ncd_referred_count",
    72: "mental_health_referred_count",
    75: "elderly_referred_count",
    76: "fchv_fund_amount",
  };

  fchvCounselingRecords.forEach((record: any) => {
    const month = getRecordMonth(record, filter);
    if (!month) return;
    let data: Record<string, any> = {};
    try {
      data = JSON.parse(record.data || "{}");
    } catch {
      return;
    }
    for (const [rowNoStr, key] of Object.entries(FCHV_COUNSELING_ROW_MAP)) {
      const rowNo = Number(rowNoStr);
      const value = data[key];
      if (value !== undefined && value !== null && value !== "") {
        const num = Number(value);
        if (!isNaN(num) && num > 0) {
          addCount(counts, rowNo, month, num);
        }
      }
    }
  });

  return counts;
};

/** Build sub-column counts for child nutrition rows 55/56/57 */
const buildNutritionCounts = async (
  filter: MonthFilter,
): Promise<NutritionSubCounts> => {
  // rowNo → month → subCol → count
  const nc: NutritionSubCounts = {};
  for (const rowNo of NUTRITION_ROWS) {
    nc[rowNo] = {};
    for (let m = 1; m <= 12; m++) {
      nc[rowNo][m] = { 1: 0, 2: 0, 3: 0 };
    }
  }

  const db = await getDb();
  const records = await db.getAllAsync<any>(
    `SELECT * FROM child_nutrition WHERE is_deleted = 0`,
  );

  records.forEach((item) => {
    const month = getRecordMonth(item, filter);
    if (!month) return;

    const ageGroup = item.child_age_group;
    const timesPerMonth = item.times_per_month ?? 0;

    if (ageGroup === "6-11") {
      for (let sc = 1; sc <= Math.min(timesPerMonth, 1); sc++) {
        nc[55][month][sc] += 1;
      }
    } else if (ageGroup === "12-17") {
      for (let sc = 1; sc <= Math.min(timesPerMonth, 2); sc++) {
        nc[56][month][sc] += 1;
      }
    } else if (ageGroup === "18-23") {
      for (let sc = 1; sc <= Math.min(timesPerMonth, 3); sc++) {
        nc[57][month][sc] += 1;
      }
    }
  });

  return nc;
};

const COLLECTED_DATA_ROWS = [
  { no: 0, activity: "विविध", section: "(क)" },
  {
    no: 1,
    activity: "आफ्नो क्षेत्रमा भेट गरिएका गर्भवती महिलाहरूको संख्या (जना)",
  },
  {
    no: 2,
    activity:
      "गर्भ जाँचको लागि स्वास्थ्य संस्थामा प्रेषण गरेको गर्भवती महिलाहरूको संख्या (जना)",
  },
  {
    no: 3,
    activity:
      "आमाबाट बच्चामा सर्ने एचआइभि सम्बन्धि सूचना दिएका गर्भवतीलाई रक्त परिक्षणका लागि रेफर गरेको संख्या (जना)",
  },
  {
    no: 4,
    activity:
      "पहिलो पटक स्वास्थ्य संस्थामा गर्भ जाँच गरेको सुनिश्चित गरेको महिलाहरूको संख्या (जना)",
  },
  {
    no: 5,
    activity:
      "दोहोऱ्याई आएको वेला आईरन चक्की वितरण गरेको गर्भवती महिलाहरूको संख्या (जना)",
  },
  {
    no: 6,
    activity:
      "प्रसूति सेवाको लागि स्वास्थ्य संस्थामा प्रेषण गरेको गर्भवती महिलाहरूको संख्या (जना)",
  },
  {
    no: 7,
    activity:
      "स्वास्थ्यकर्मी विना घरमै सुत्केरी भई मातृसुरक्षा चक्की (मिसोप्रोस्टोल) खाएको सुनिश्चित गरिएका महिलाहरूको संख्या (जना)",
  },
  {
    no: 8,
    activity:
      "सुरक्षित मातृत्व र नवशिशु सम्बन्धि सामग्री (फ्लिप चार्ट/पोस्टर/श्रव्य दृश्य सामग्री) प्रयोग गरी स्वास्थ्य शिक्षा पाएका संख्या",
  },
  { no: 0, activity: "घरमा जन्मेका शिशुहरू", section: "(ख)" },
  { no: 9, activity: "जिवित जन्म भएका शिशुहरू (जना)" },
  { no: 10, activity: "मृत जन्म भएका शिशुहरू (जना)" },
  {
    no: 11,
    activity:
      "जन्मेको २४ घण्टासम्म ननुहाएको सुनिश्चित गरिएको नवजात शिशुहरूको संख्या (जना)",
  },
  { no: 0, activity: "आमा र नवजात शिशु स्वास्थ्य", section: "(ग)" },
  {
    no: 12,
    activity:
      "शिशु तथा बाल्यकालिन पोषण व्यवहार सम्बन्धी सल्लाह दिएको आमाहरूको संख्या (जना)",
  },
  {
    no: 13,
    activity: "सुत्केरी जाँचको लागि प्रेषण गरेको महिलाहरूको संख्या (जना)",
  },
  {
    no: 14,
    activity:
      "घरमा प्रसूती भएका सुत्केरीलाई ४५ आइरन चक्की वितरण गरेको महिलाहरूको संख्या (जना)",
  },
  { no: 15, activity: "भिटामिन ए दिएको सुत्केरी महिलाहरूको संख्या (जना)" },
  { no: 0, activity: "खोप कार्यक्रम", section: "(घ)" },
  { no: 16, activity: "खोप क्लिनिक र सरसफाई सेसनमा सहभागी भएको (पटक)" },
  { no: 17, activity: "खोप लगाउन पठाएको नयाँ बच्चाको संख्या (जना)" },
  {
    no: 18,
    activity: "२३ महिना भित्रमा पूर्ण खोप प्राप्त गरेको बच्चा संख्या (जना)",
  },
  { no: 19, activity: "गाउँघर क्लिनिकमा सहभागी भई सघाएको (पटक)" },
  {
    no: 0,
    activity: "२ महिना मुनिको बिरामि शिशुको उपचार तथा प्रेषण",
    section: "(ङ)",
  },
  { no: 20, activity: "०-७ दिन सम्मका बिरामी शिशुहरूको संख्या (जना)" },
  { no: 21, activity: "८-२८ दिनसम्मका बिरामी शिशुहरूको संख्या (जना)" },
  { no: 22, activity: "२९-५९ दिन सम्मका बिरामी शिशुहरूको संख्या (जना)" },
  { no: 23, activity: "०-७ दिन भित्र मृत्यु भएका नवजात शिशु संख्या (जना)" },
  { no: 24, activity: "८-२८ दिन भित्र मृत्यु भएका नवजात शिशु संख्या (जना)" },
  { no: 25, activity: "२९-५९ दिन भित्र मृत्यु भएका बच्चा संख्या (जना)" },
  {
    no: 0,
    activity: "२-५९ महिना भित्रका शिशु/ बालबालिकाको मृत्यु विवरण",
    section: "(च)",
  },
  { no: 26, activity: "२-११ महिना भित्र मृत्यु भएका बच्चा संख्या (जना)" },
  {
    no: 27,
    activity: "१२-५९ महिना भित्र मृत्यु भएका बालबालिकाको संख्या (जना)",
  },
  {
    no: 0,
    activity: "२-५९ महिना सम्मका बिरामी शिशुको उपचार तथा प्रेषण: झाडापखाला",
    section: "(छ)",
  },
  {
    no: 28,
    activity:
      "झाडापखाला लागेका २ महिनादेखि ५ वर्ष मुनिका जम्मा बिरामी बच्चाहरूको संख्या (जना)",
  },
  {
    no: 29,
    activity:
      "पुनर्जलीय झोल र जिंक चक्कीबाट उपचार गरेका बच्चाहरूको संख्या (जना)",
  },
  {
    no: 30,
    activity:
      "५ वर्ष मुनिका बच्चाहरूलाई वितरण गरेको पुनर्जलीय झोलको पुरिया (संख्या)",
  },
  {
    no: 31,
    activity:
      "५ वर्ष भन्दा माथिका मानिसहरूलाई वितरण गरेको पुनर्जलीय झोलको पुरिया (संख्या)",
  },
  { no: 32, activity: "वितरण गरेको जिंक चक्की संख्या (चक्की)" },
  {
    no: 33,
    activity:
      "झाडापखाला लागेका २ महिना देखि ५ वर्ष सम्मका बिरामी बच्चाहरूलाई प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 0,
    activity:
      "२-५९ महिना सम्मका बिरामी शिशुको उपचार तथा प्रेषण: श्वासप्रश्वास रोग",
    section: "(ज)",
  },
  {
    no: 34,
    activity:
      "श्वास प्रश्वास रोग लागेका २ देखि ५९ महिनाका बिरामी बच्चाहरूको संख्या (जना)",
  },
  {
    no: 35,
    activity:
      "न्यूमोनिया नभएको (रुघाखोकी भएका) ५ वर्ष मुनिका बच्चालाई घरेलु उपचार सल्लाह दिएको बच्चाहरूको संख्या (जना)",
  },
  {
    no: 36,
    activity:
      "श्वास प्रश्वास रोग भई स्वास्थ्य संस्थामा प्रेषण गरिएका २ देखि ५९ महिनाका बालबालिकाहरूको संख्या (जना)",
  },
  { no: 0, activity: "प्रेषण", section: "(झ)" },
  {
    no: 37,
    activity:
      "सुरक्षित गर्भपतनको लागि स्वास्थ्य संस्थामा प्रेषण गरेका महिलाहरूको संख्या (जना)",
  },
  {
    no: 38,
    activity:
      "स्वास्थ्य संस्थामा सेवा लिन प्रेषण गरिएका किशोर किशोरीहरूको संख्या (जना)",
  },
  {
    no: 39,
    activity:
      "लगातार २ हप्ता सम्म खोकी लागी स्वास्थ्य संस्थामा प्रेषण गरेका बिरामीहरूको संख्या (जना)",
  },
  { no: 40, activity: "प्राथमिक उपचार गरेको संख्या (जना)" },
  {
    no: 41,
    activity: "प्राथमिक उपचारको क्रममा प्रेषण गरेको बिरामीहरूको संख्या (जना)",
  },
  { no: 0, activity: "परिवार नियोजन" },
  { no: 42, activity: "पिल्स वितरण गरिएका महिलाहरूको संख्या (जना)" },
  { no: 43, activity: "वितरण गरेको पिल्सको संख्या" },
  { no: 44, activity: "कण्डम वितरण गरेको (जना)" },
  { no: 45, activity: "वितरण गरेको कण्डमको संख्या (गोटा)" },
  {
    no: 46,
    activity:
      "परिवार नियोजन सेवाको लागि स्वास्थ्य संस्थामा प्रेषण गरेको दम्पतीहरूको संख्या",
  },
  {
    no: 47,
    activity:
      "परिवार नियोजन सम्बन्धि सामग्री (फिलप चार्ट/पोस्टर/श्रव्य दृश्य) प्रयोग गरी स्वास्थ्य शिक्षा पाएको संख्या",
  },
  {
    no: 0,
    activity: "शीघ्र कुपोषणको एकीकृत व्यवस्थापन: एम.यु.ए.सी. छनौट",
    section: "(ट)",
  },
  { no: 48, activity: "हरियो | हृष्टपुष्ट (जना): खुसी परिवार" },
  {
    no: 49,
    activity:
      "पहेलो | मध्यम शीघ्र कुपोषण (जना): घरमा म.स्वा.स्व.से. द्वारा परामर्श",
  },
  {
    no: 50,
    activity: "रातो | कडा शीघ्र कुपोषण (जना): स्वास्थ्य संस्थामा प्रेषण",
  },
  { no: 51, activity: "फुकेनास (जना): स्वा. संस्थामा प्रेषण" },
  {
    no: 0,
    activity: "शीघ्र कुपोषणको एकीकृत व्यवस्थापन: घरभेट र अनुगमन",
    section: "(ठ)",
  },
  {
    no: 52,
    activity: "रातो: कडा शीघ्र कुपोषित बच्चा: उपचार पछि निको भएको (जना)",
  },
  {
    no: 53,
    activity:
      "रातो: कडा शीघ्र कुपोषित बच्चा: उपचार गरिरहँदा पनि तौल वृद्धि नभएको (जना)",
  },
  {
    no: 54,
    activity:
      "रातो: कडा शीघ्र कुपोषित बच्चा: उपचार गर्दा गर्दै स्वास्थ्य संस्था जान छाडेका (जना)",
  },

  { no: 0, activity: "विविध", section: "(ढ)" },
  { no: 58, activity: "आमा समूहको बैठक बसेको पटक" },
  { no: 59, activity: "आमा समूहको बैठक सहभागी संख्या (जना)" },
  { no: 60, activity: "आमा समूहको बैठकमा स्वास्थ्यकर्मी सहभागी भएको पटक" },
  {
    no: 61,
    activity:
      "गर्भवती अवस्थामा मातृ मृत्यु संख्या (स्वास्थ्य संस्थामा बाहेक अन्य स्थानमा भएको मात्र) (जना)",
  },
  {
    no: 62,
    activity:
      "प्रसव अवस्थामा मातृ मृत्यु संख्या (स्वास्थ्य संस्थामा बाहेक अन्य स्थानमा भएको मात्र) (जना)",
  },
  {
    no: 63,
    activity:
      "सुत्केरी अवस्थामा मातृ मृत्यु संख्या (स्वास्थ्य संस्थामा बाहेक अन्य स्थानमा भएको मात्र) (जना)",
  },
  {
    no: 64,
    activity:
      "२९-५९ दिन सम्मको बच्चाको मृत्यु संख्या (स्वास्थ्य संस्थामा बाहेक अन्य स्थानमा भएको मात्र) (जना)",
  },
  {
    no: 65,
    activity:
      "२ महिना देखि ५९ महिना सम्मका बालबालिकाको मृत्यु संख्या (स्वास्थ्य संस्थामा बाहेक) (जना)",
  },
  {
    no: 66,
    activity:
      "बाल स्वास्थ्य सम्बन्धि स्वास्थ्य शिक्षा सामग्री (फ्लिप चार्ट/पोस्टर/श्रव्य दृश्य सामग्री) प्रयोग गरी स्वास्थ्य शिक्षा पाएका संख्या",
  },
  {
    no: 67,
    activity:
      "स्वस्थ जीवनशैलीको लागि नसर्ने रोगका जोखिम तत्व र रोकथामको बारेमा फ्लिप चार्ट/पोस्टर/श्रव्य दृश्य सामग्री प्रयोग गरी स्वास्थ्य शिक्षा दिएको (पटक)",
  },
  {
    no: 68,
    activity:
      "स्वस्थ जीवनशैलीको लागि नसर्ने रोगका जोखिम तत्वको बारेमा फ्लिप चार्ट/पोस्टर/श्रव्य दृश्य सामग्री प्रयोग गरी स्वास्थ्य शिक्षाबाट लाभान्वित संख्या",
  },
  {
    no: 69,
    activity:
      "आफ्नो क्षेत्रका शंकास्पद क्षयरोगका बिरामीको प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 70,
    activity:
      "आफ्नो क्षेत्रका शंकास्पद कुष्ठरोगका बिरामीको प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 71,
    activity:
      "नसर्ने रोग (मधुमेह, मृगौला, दीर्घ श्वासप्रश्वास, अर्बुद रोग, मुटुरोग) का बिरामीको प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 72,
    activity: "मानसिक स्वास्थ्य समस्या भएका बिरामीको प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 73,
    activity: "पाठेघर खस्ने समस्या भएका आमाको प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 74,
    activity: "पाठेघरको मुखको क्यान्सरको जाँचको लागि प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 75,
    activity:
      "स्वास्थ्य समस्या भएका जेष्ठ नागरिकको पहिचान गरी प्रेषण गरेको संख्या (जना)",
  },
  {
    no: 76,
    activity:
      "महिला सामुदायिक स्वास्थ्य स्वयंसेविका कोषमा जम्मा भएको रकम रू. (लगानी समेत)",
  },
  {
    no: 77,
    activity:
      "नवजात शिशुको ३५ दिनभित्र जन्म दर्ताका लागि परामर्श दिएको परिवार संख्या (परिवार)",
  },
  {
    no: 78,
    activity: "नवजात शिशुको जन्म दर्ता भएको सुनिश्चित गरिएको संख्या (जना)",
  },
  {
    no: 79,
    activity:
      "मृत्यु भएको ३५ दिनभित्र मृत्यु दर्ताका लागि परामर्श दिएको परिवार संख्या (परिवार)",
  },
  { no: 80, activity: "मृत्यु दर्ता भएको सुनिश्चित गरिएको संख्या (जना)" },
  {
    no: 81,
    activity:
      "१३ हप्तासम्म आइरन फोलिक एसिड चक्की पाएका किशोरीको संख्या (संख्या)",
  },
  {
    no: 82,
    activity:
      "२६ हप्तासम्म आइरन फोलिक एसिड चक्की पाएका किशोरीको संख्या (संख्या)",
  },
];

/** Separate table for nutrition rows 55/56/57 */
const generateNutritionTable = (
  periods: SummaryPeriod[],
  nutritionCounts: NutritionSubCounts,
): string => {
  const subColLabels = ["पहिलो पटक", "दोस्रो पटक", "तेस्रो पटक"];

  // display number → original NUTRITION_ROWS key → max active sub-cols
  const nutritionDisplayRows: Array<{
    displayNo: number;
    rowKey: number;
    activity: string;
    subCols: number;
  }> = [
    {
      displayNo: 55,
      rowKey: 55,
      activity: "६ देखि ११ महिनाका बालबालिका",
      subCols: 1,
    },
    {
      displayNo: 56,
      rowKey: 56,
      activity: "१२ देखि १७ महिनाका बालबालिका",
      subCols: 2,
    },
    {
      displayNo: 57,
      rowKey: 57,
      activity: "१८ देखि २३ महिनाका बालबालिका",
      subCols: 3,
    },
  ];

  let html = `
    <div style="display: flex; background: #f7e4dc; font-weight: 700; font-size: 9px; border: 1.4px solid #111; border-bottom: none; margin-top: 24px;">
      <div style="width: 38px; text-align: center; padding: 6px 3px; border-right: 1px solid #000; box-sizing: border-box;">(ड)</div>
      <div style="flex: 1; text-align: left; padding: 6px 10px;">एकीकृत शिशु तथा बाल्यकालीन पोषण र बालभिटा समुदाय प्रवर्धन कार्यक्रम</div>
    </div>
    <table class="collected-table">
      <thead>
        <tr>
          <th class="sn-col" rowspan="2">क्र.सं.</th>
          <th class="activity-col" rowspan="2">गतिविधिहरू</th>
          ${periods
            .map(
              (p) =>
                `<th colspan="3" style="text-align:center;">${p.label}</th>`,
            )
            .join("")}
          <th rowspan="2">जम्मा</th>
        </tr>
        <tr>
          ${periods
            .map(() =>
              subColLabels
                .map(
                  (l) =>
                    `<th style="font-size:8px;background:#e8e8e8;padding:3px;">${l}</th>`,
                )
                .join(""),
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
  `;

  nutritionDisplayRows.forEach(({ displayNo, rowKey, activity, subCols }) => {
    const nc = nutritionCounts[rowKey] ?? {};
    let grandTotal = 0;

    const dataCells = periods
      .map((period) => {
        let cells = "";
        for (let sc = 1; sc <= 3; sc++) {
          if (sc <= subCols) {
            const val = nc[period.key]?.[sc] || 0;
            grandTotal += val;
            cells += `<td style="border:1px solid #000;padding:4px;text-align:center;font-size:9px;">${convertToNepaliNumber(val)}</td>`;
          } else {
            cells += `<td style="border:1px solid #000;padding:4px;background:#b0b0b0;"></td>`;
          }
        }
        return cells;
      })
      .join("");

    html += `
      <tr>
        <td>${convertToNepaliNumber(displayNo)}</td>
        <td class="activity-cell">${activity}</td>
        ${dataCells}
        <td class="total-cell">${convertToNepaliNumber(grandTotal)}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  return html;
};

const generateCollectedDataTable = async (filter: MonthFilter) => {
  const periods = selectedPeriods(filter);
  const counts = await buildCollectedDataCounts(filter);
  const nutritionCounts = await buildNutritionCounts(filter);

  const title = filter?.month
    ? `मासिक संकलित तथ्याङ्क (${NEPALI_MONTHS[filter.month - 1]} ${convertToNepaliNumber(filter.year)})`
    : `वार्षिक संकलित तथ्याङ्क${filter?.year ? ` (${convertToNepaliNumber(filter.year)})` : ""}`;

  // Main table columns: SN + Activity (colspan=3) + 1 per period + Total
  const mainTotalCols = 3 + periods.length + 1;

  let html = `
    <div class="collected-title">${title}</div>
    <table class="collected-table">
      <thead>
        <tr>
          <th class="sn-col">क्र.सं.</th>
          <th class="activity-col" colspan="3">गतिविधिहरू</th>
          ${periods.map((p) => `<th>${p.label}</th>`).join("")}
          <th>जम्मा</th>
        </tr>
      </thead>
      <tbody>
  `;

  COLLECTED_DATA_ROWS.forEach((row) => {
    // ── Section header ────────────────────────────────────────────
    if (row.no === 0) {
      if (row.section === "(ढ)") {
        html += `</tbody></table>`;
        html += generateNutritionTable(periods, nutritionCounts);
        html += `
          <table class="collected-table" style="margin-top:24px;">
            <thead>
              <tr>
                <th class="sn-col">क्र.सं.</th>
                <th class="activity-col" colspan="3">गतिविधिहरू</th>
                ${periods.map((p) => `<th>${p.label}</th>`).join("")}
                <th>जम्मा</th>
              </tr>
            </thead>
            <tbody>
        `;
      }
      html += `
        <tr class="section-row">
          <td>${row.section || ""}</td>
          <td colspan="${mainTotalCols}">${row.activity}</td>
        </tr>
      `;
      return;
    }

    // ── Regular row — one plain cell per month ────────────────────
    const total = periods.reduce(
      (sum, period) => sum + (counts[row.no]?.[period.key] || 0),
      0,
    );

    if (row.no === 42) {
      const ocpTotal = periods.reduce(
        (sum, p) => sum + (counts[42]?.[p.key] || 0),
        0,
      );
      const ecpTotal = periods.reduce(
        (sum, p) => sum + (counts[420]?.[p.key] || 0),
        0,
      );

      html += `
        <tr>
          <td rowspan="2" style="vertical-align: middle;">${convertToNepaliNumber(42)}</td>
          <td rowspan="2" colspan="2" class="activity-cell" style="width: 14%; vertical-align: middle;">पिल्स वितरण गरिएका महिलाहरूको संख्या (जना)</td>
          <td class="activity-cell" style="width: 11%; vertical-align: middle;">खाने चक्की पिल्स (OCP)</td>
          ${periods.map((p) => `<td>${convertToNepaliNumber(counts[42]?.[p.key] || 0)}</td>`).join("")}
          <td class="total-cell">${convertToNepaliNumber(ocpTotal)}</td>
        </tr>
        <tr>
          <td class="activity-cell" style="vertical-align: middle;">आकस्मिक चक्की (ECP)</td>
          ${periods.map((p) => `<td>${convertToNepaliNumber(counts[420]?.[p.key] || 0)}</td>`).join("")}
          <td class="total-cell">${convertToNepaliNumber(ecpTotal)}</td>
        </tr>
      `;
      return;
    }

    if (row.no === 43) {
      const ocpTotal = periods.reduce(
        (sum, p) => sum + (counts[43]?.[p.key] || 0),
        0,
      );
      const ecpTotal = periods.reduce(
        (sum, p) => sum + (counts[430]?.[p.key] || 0),
        0,
      );

      html += `
        <tr>
          <td rowspan="2" style="vertical-align: middle;">${convertToNepaliNumber(43)}</td>
          <td rowspan="2" colspan="2" class="activity-cell" style="width: 14%; vertical-align: middle;">वितरण गरेको पिल्सको संख्या</td>
          <td class="activity-cell" style="width: 11%; vertical-align: middle;">खाने चक्की पिल्स (साइकल)</td>
          ${periods.map((p) => `<td>${convertToNepaliNumber(counts[43]?.[p.key] || 0)}</td>`).join("")}
          <td class="total-cell">${convertToNepaliNumber(ocpTotal)}</td>
        </tr>
        <tr>
          <td class="activity-cell" style="vertical-align: middle;">आकस्मिक चक्की (डोज)</td>
          ${periods.map((p) => `<td>${convertToNepaliNumber(counts[430]?.[p.key] || 0)}</td>`).join("")}
          <td class="total-cell">${convertToNepaliNumber(ecpTotal)}</td>
        </tr>
      `;
      return;
    }

    let activityCellContent = "";
    let tdStyle = "";

    if (row.no >= 48 && row.no <= 51) {
      tdStyle = `style="padding:0; vertical-align:stretch;"`;
      if (row.no === 48) {
        activityCellContent = `
          <div class="muac-container">
            <div class="muac-badge muac-green-badge">हरियो</div>
            <div class="muac-content">हृष्टपुष्ट (जना):<br/>खुसी परिवार</div>
          </div>
        `;
      } else if (row.no === 49) {
        activityCellContent = `
          <div class="muac-container">
            <div class="muac-badge muac-yellow-badge">पहेलो</div>
            <div class="muac-content">मध्यम शीघ्र कुपोषण (जना):<br/>घरमा म.स्वा.स्व.से. द्वारा परामर्श</div>
          </div>
        `;
      } else if (row.no === 50) {
        activityCellContent = `
          <div class="muac-container">
            <div class="muac-badge muac-red-badge">रातो</div>
            <div class="muac-content">कडा शीघ्र कुपोषण (जना):<br/>स्वास्थ्य संस्थामा प्रेषण</div>
          </div>
        `;
      } else if (row.no === 51) {
        activityCellContent = `
          <div class="muac-container">
            <div class="muac-badge" style="background-color: transparent; border-right: none; width: 0; padding: 0;"></div>
            <div class="muac-content" style="padding-left: 10px;">फुकेनास (जना):<br/>स्वा. संस्थामा प्रेषण</div>
          </div>
        `;
      }
    } else {
      activityCellContent = row.activity;
    }

    html += `
      <tr>
        <td>${convertToNepaliNumber(row.no)}</td>
        <td class="activity-cell" colspan="3" ${tdStyle}>${activityCellContent}</td>
        ${periods
          .map(
            (period) =>
              `<td>${convertToNepaliNumber(counts[row.no]?.[period.key] || 0)}</td>`,
          )
          .join("")}
        <td class="total-cell">${convertToNepaliNumber(total)}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;

  return html;
};

const generatePregnancyTable = async (data: PregnantWomenListItem[]) => {
  const db = await getDb();
  const motherIds = data.map((item) => item.mother);

  // If motherIds is empty, we don't query
  let allVisits: any[] = [];
  if (motherIds.length > 0) {
    const placeholders = motherIds.map(() => "?").join(",");
    allVisits = await db.getAllAsync<any>(
      `SELECT mother, visit_date FROM visit WHERE mother IN (${placeholders}) AND visit_type = 'ANC' AND is_deleted = 0 ORDER BY visit_date ASC`,
      motherIds,
    );
  }

  // Create a map of mother ID to her visits
  const visitsByMother: Record<string, string[]> = {};
  allVisits.forEach((v) => {
    if (!visitsByMother[v.mother]) {
      visitsByMother[v.mother] = [];
    }
    visitsByMother[v.mother].push(v.visit_date);
  });

  const formatDateShort = (bsDateStr: string): string => {
    try {
      const parts = bsDateStr.split("-");
      if (parts.length >= 3) {
        const month = convertToNepaliNumber(parts[1]);
        const day = convertToNepaliNumber(parts[2]);
        return `${day}/${month}`;
      }
      return convertToNepaliNumber(bsDateStr);
    } catch (e) {
      return "";
    }
  };

  const calculateGestationalWeeks = (
    lmpBs: string | null | undefined,
    visitBs: string | null | undefined,
  ): number | null => {
    if (!lmpBs || !visitBs) return null;
    try {
      const lmpYear = parseInt(lmpBs.split("-")[0], 10);
      const visitYear = parseInt(visitBs.split("-")[0], 10);
      if (isNaN(lmpYear) || isNaN(visitYear)) return null;

      const lmpAdStr = lmpYear >= 2000 ? BsToAd(lmpBs) : lmpBs;
      const visitAdStr = visitYear >= 2000 ? BsToAd(visitBs) : visitBs;

      const lmpDate = new Date(lmpAdStr);
      const visitDate = new Date(visitAdStr);
      const diffTime = visitDate.getTime() - lmpDate.getTime();
      if (diffTime < 0) return null;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return Math.floor(diffDays / 7);
    } catch (e) {
      console.error("Error calculating gestational weeks:", e);
      return null;
    }
  };

  let html = `
    <div class="title" style="text-align: center;">मातृ तथा नवजात शिशु सम्बन्धि विवरण</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th colspan="3">मिति</th>
          <th colspan="2">गर्भवती महिलाको</th>
          <th colspan="3">अन्तिम रजश्वला भएको<br>(LMP)<br>(ग.म.सा.)</th>
          <th colspan="3">प्रसूतिको अनुमानित मिति<br>(EDD)<br>(ग.म.सा.)</th>
          <th colspan="2">जीवन सुरक्षा परामर्श दिएको</th>
          <th colspan="9">स्वास्थ्य संस्थामा गर्भ जाँच गरेको पटक (औं हप्तामा)</th>
        </tr>
        <tr>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>नाम, थर</th><th>उमेर</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>छ</th><th>छैन</th>
          <th>१२ हप्ता सम्म</th><th>१६ हप्ता सम्म</th><th>२०-२४ हप्ता</th><th>२८ हप्ता</th><th>३२ हप्ता</th><th>३४ हप्ता</th><th>३६ हप्ता</th><th>३८-४० हप्ता</th><th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 23; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  for (let index = 0; index < data.length; index++) {
    const item = data[index];
    const regDate = parseDateToNepali(
      item.created_at ? item.created_at.split("T")[0] : null,
    );
    const lmp = parseDateToNepali(item.lmp_date);
    const edd = parseDateToNepali(item.edd);

    const motherVisits = visitsByMother[item.mother] || [];

    // Convert LMP to AD for range limit
    let minTime = 0;
    let maxTime = 0;
    try {
      const lmpAdStr = BsToAd(item.lmp_date);
      const lmpDateObj = new Date(lmpAdStr);
      minTime = lmpDateObj.getTime();
      maxTime = minTime + 305 * 24 * 60 * 60 * 1000; // 305 days max duration
    } catch (e) {
      console.error("Error parsing LMP date for range check:", e);
    }

    const col12: string[] = [];
    const col16: string[] = [];
    const col20_24: string[] = [];
    const col28: string[] = [];
    const col32: string[] = [];
    const col34: string[] = [];
    const col36: string[] = [];
    const col38_40: string[] = [];
    const col_other: string[] = [];

    motherVisits.forEach((visitDate) => {
      try {
        const visitAdStr = BsToAd(visitDate);
        const visitTime = new Date(visitAdStr).getTime();

        // Ensure visit is within this pregnancy's timeframe
        if (minTime > 0 && (visitTime < minTime || visitTime > maxTime)) {
          return;
        }

        const diffTime = visitTime - minTime;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(diffDays / 7);

        const dateDisplay = formatDateShort(visitDate);
        if (weeks <= 12) col12.push(dateDisplay);
        else if (weeks <= 16) col16.push(dateDisplay);
        else if (weeks <= 24) col20_24.push(dateDisplay);
        else if (weeks <= 29) col28.push(dateDisplay);
        else if (weeks <= 32) col32.push(dateDisplay);
        else if (weeks <= 34) col34.push(dateDisplay);
        else if (weeks <= 36) col36.push(dateDisplay);
        else if (weeks <= 40) col38_40.push(dateDisplay);
        else col_other.push(dateDisplay);
      } catch (e) {
        console.error("Error processing visit date:", e);
      }
    });

    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${regDate.day}</td><td>${regDate.month}</td><td>${regDate.year}</td>
        <td>${escapeHtml(item.name)}</td><td>${convertToNepaliNumber(item.age)}</td>
        <td>${lmp.day}</td><td>${lmp.month}</td><td>${lmp.year}</td>
        <td>${edd.day}</td><td>${edd.month}</td><td>${edd.year}</td>
        <td>${item.has_counseling ? CHECK : ""}</td><td>${!item.has_counseling ? CHECK : ""}</td>
        <td>${col12.join("<br/>")}</td>
        <td>${col16.join("<br/>")}</td>
        <td>${col20_24.join("<br/>")}</td>
        <td>${col28.join("<br/>")}</td>
        <td>${col32.join("<br/>")}</td>
        <td>${col34.join("<br/>")}</td>
        <td>${col36.join("<br/>")}</td>
        <td>${col38_40.join("<br/>")}</td>
        <td>${col_other.join("<br/>")}</td>
      </tr>
    `;
  }

  if (data.length === 0) {
    html += getEmptyRows(23, 5);
  }

  html += `</tbody></table>`;
  return html;
};

const generateMaternalDeathTable = async (data: any[]) => {
  let html = `
    <div class="title" style="text-align: center; margin-top: 20px;">मातृ मृत्यु विवरण</div>
    <div class="subtitle" style="text-align: center;">(गर्भवती अवस्था, प्रशव अवस्था तथा सुत्केरी भएको ४२ दिन भित्र मृत्यु भएका महिलाको लागि मात्र)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">मृतक महिलाको नाम</th>
          <th rowspan="2">उमेर<br>(वर्षमा)</th>
          <th colspan="3">मृत्यु हुँदाको अवस्था*</th>
          <th colspan="3">मृत्यु भएको मिति</th>
          <th colspan="3">प्रसुति भएको स्थान*</th>
          <th colspan="3">मृत्यु भएको स्थान*</th>
          <th rowspan="2">कैफियत</th>
        </tr>
        <tr>
          <th>गर्भवती</th><th>प्रशव</th><th>सुत्केरी</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>घर</th><th>संस्था</th><th>अन्य</th>
          <th>घर</th><th>संस्था</th><th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 16; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  for (const item of data) {
    const deathDate = convertAdYmdToBs(
      item.death_year,
      item.death_month,
      item.death_day,
    );

    // Fetch delivery data for this mother to get delivery place
    let deliveryPlace: string | null = null;
    if (item.mother) {
      try {
        const deliveries = await getDeliveriesByMother(item.mother);
        if (deliveries.length > 0) {
          deliveryPlace = deliveries[0].delivery_place ?? null;
        }
      } catch (e) {
        console.log("Error fetching delivery data:", e);
      }
    }

    const isDeathPregnant =
      item.death_condition && item.death_condition.toLowerCase() === "pregnant";
    const isDeathLabor =
      item.death_condition && item.death_condition.toLowerCase() === "labor";
    const isDeathPostpartum =
      item.death_condition &&
      (item.death_condition.toLowerCase() === "post_delivery" ||
        item.death_condition.toLowerCase() === "post-delivery");

    const isDeliveredHome =
      deliveryPlace && deliveryPlace.toLowerCase() === "home";
    const isDeliveredInst =
      deliveryPlace && deliveryPlace.toLowerCase() === "institution";
    const isDeliveredOther =
      deliveryPlace &&
      deliveryPlace.toLowerCase() !== "home" &&
      deliveryPlace.toLowerCase() !== "institution";

    const isDeathHome =
      item.death_place && item.death_place.toLowerCase() === "home";
    const isDeathInst =
      item.death_place && item.death_place.toLowerCase() === "institution";
    const isDeathOther =
      item.death_place &&
      item.death_place.toLowerCase() !== "home" &&
      item.death_place.toLowerCase() !== "institution";

    html += `
      <tr>
        <td>${convertToNepaliNumber(data.indexOf(item) + 1)}</td>
        <td>${escapeHtml(item.mother_name)}</td>
        <td>${convertToNepaliNumber(item.mother_age)}</td>
        <td>${isDeathPregnant ? CHECK : CROSS}</td>
        <td>${isDeathLabor ? CHECK : CROSS}</td>
        <td>${isDeathPostpartum ? CHECK : CROSS}</td>
        <td>${deathDate.day}</td>
        <td>${deathDate.month}</td>
        <td>${deathDate.year}</td>
        <td>${isDeliveredHome ? CHECK : CROSS}</td>
        <td>${isDeliveredInst ? CHECK : CROSS}</td>
        <td>${isDeliveredOther ? CHECK : CROSS}</td>
        <td>${isDeathHome ? CHECK : CROSS}</td>
        <td>${isDeathInst ? CHECK : CROSS}</td>
        <td>${isDeathOther ? CHECK : CROSS}</td>
        <td>${escapeHtml(item.remarks)}</td>
      </tr>
    `;
  }

  if (data.length === 0) {
    html += getEmptyRows(16, 3);
  }

  html += `</tbody></table>`;
  return html;
};

const generateNewbornDeathTable = (data: any[]) => {
  let html = `
    <div class="title" style="text-align: center; margin-top: 20px;">नवजात शिशु मृत्यु विवरण</div>
    <div class="subtitle" style="text-align: center;">(जन्मेको २८ दिन भित्र मृत्यु भएका नवजात शिशुको लागि मात्र)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">मृतक नवजात<br>शिशुको नाम</th>
          <th colspan="2">आमाको</th>
          <th colspan="3">नवजात शिशु<br>जन्मेको मिति</th>
          <th colspan="4">बच्चा जन्मदाको अवस्था*</th>
          <th rowspan="2">मृत्यु हुँदा<br>शिशुको उमेर<br>(दिनमा)</th>
          <th colspan="4">मृत्युको सम्भाव्य कारण*</th>
          <th colspan="3">मृत्यु भएको स्थान*</th>
          <th rowspan="2">कैफियत</th>
        </tr>
        <tr>
          <th>नाम, थर</th><th>पुरा<br>गरेको<br>उमेर</th>
          <th>गते</th><th>महिना</th><th>साल</th>
          <th>समय नपुगेको<br>(३७ हप्ता<br>भन्दा कम)</th><th>कम तौल<br>(२५०० ग्राम<br>भन्दा कम)</th><th>सामान्य</th><th>अन्य</th>
          <th>निसासिएको</th><th>शिताङ्ग</th><th>संक्रमण</th><th>अन्य</th>
          <th>घर</th><th>संस्था</th><th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 20; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  const newbornData = data.filter((item) => item.death_age_unit === "days");

  newbornData.forEach((item, index) => {
    const birthDate = convertAdYmdToBs(
      item.birth_year,
      item.birth_month,
      item.birth_day,
    );
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${escapeHtml(item.baby_name)}</td>
        <td>${escapeHtml(item.mother_name)}</td>
        <td>${convertToNepaliNumber(item.mother_age)}</td>
        <td>${birthDate.day}</td>
        <td>${birthDate.month}</td>
        <td>${birthDate.year}</td>
        <td>${item.birth_condition === "Preterm" ? CHECK : CROSS}</td>
        <td>${item.birth_condition === "LowWeight" ? CHECK : CROSS}</td>
        <td>${item.birth_condition === "Normal" ? CHECK : CROSS}</td>
        <td>${item.birth_condition === "Other" ? CHECK : CROSS}</td>
        <td>${convertToNepaliNumber(item.death_age_days)}</td>
        <td>${item.cause_of_death === "Asphyxia" ? CHECK : CROSS}</td>
        <td>${item.cause_of_death === "Hypothermia" ? CHECK : CROSS}</td>
        <td>${item.cause_of_death === "Infection" ? CHECK : CROSS}</td>
        <td>${item.cause_of_death === "Other" ? CHECK : CROSS}</td>
        <td>${item.death_place === "Home" ? CHECK : CROSS}</td>
        <td>${item.death_place === "Institution" ? CHECK : CROSS}</td>
        <td>${item.death_place === "Other" ? CHECK : CROSS}</td>
        <td>${escapeHtml(item.remarks)}</td>
      </tr>
    `;
  });

  if (newbornData.length === 0) {
    html += getEmptyRows(20, 3);
  }

  html += `</tbody></table>`;
  return html;
};

const generateChildDeathTable = (data: any[]) => {
  let html = `
    <div class="title" style="text-align: center; margin-top: 20px;">२८ दिन देखि ५९ महिना सम्मको बच्चाहरू मृत्यु विवरण</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">मृतक बच्चाको नाम</th>
          <th rowspan="2">मृतक बच्चाको आमा वा बाबुको नाम,<br>थर</th>
          <th colspan="3">बच्चा जन्मेको मिति</th>
          <th rowspan="2">मृत्यु हुँदा बच्चाको<br>उमेर (महिनामा)</th>
          <th rowspan="2">मृत्युको सम्भाव्य कारण*</th>
          <th rowspan="2">कैफियत</th>
        </tr>
        <tr>
          <th>गते</th><th>महिना</th><th>साल</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 9; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  const childData = data.filter((item) => item.death_age_unit === "months");

  childData.forEach((item, index) => {
    const birthDate = convertAdYmdToBs(
      item.birth_year,
      item.birth_month,
      item.birth_day,
    );
    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${escapeHtml(item.baby_name)}</td>
        <td>${escapeHtml(item.mother_name)}</td>
        <td>${birthDate.day}</td>
        <td>${birthDate.month}</td>
        <td>${birthDate.year}</td>
        <td>${convertToNepaliNumber(item.death_age_days)}</td>
        <td>${escapeHtml(item.cause_of_death)}</td>
        <td>${escapeHtml(item.remarks)}</td>
      </tr>
    `;
  });

  if (childData.length === 0) {
    html += getEmptyRows(9, 3);
  }

  html += `</tbody></table>`;
  return html;
};

const generateInfantCareTable = (data: any[]) => {
  let html = `
    <div class="page-break"></div>
    <div class="title" style="text-align: center;">नवजात शिशु स्याहार कार्यक्रम</div>
    <div class="subtitle" style="text-align: center;">(कार्यक्रम लागु भएका जिल्लाहरुका म.स्वा.स्व.से. हरुले मात्र भर्ने)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">शिशु जन्म<br>मिति<br>(ग.म.सा.)</th>
          <th rowspan="2">आमाको नाम र थर</th>
          <th rowspan="2">शिशुको नाम</th>
          <th rowspan="2">टोल</th>
          <th colspan="3">शिशु जन्म</th>
          <th rowspan="2">शिशु जन्मदा<br>म.स्वा.स्व.से.<br>उपस्थित भएका</th>
          <th rowspan="2">निसासिएको<br>शिशुको<br>व्यवस्थापन</th>
        </tr>
        <tr>
          <th>घर</th><th>स्वास्थ्य संस्था</th><th>तालिम प्राप्त<br>स्वास्थ्यकर्मीबाट</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 9; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item) => {
    const dob = parseDateToNepali(item.date_of_birth);
    html += `
      <tr>
        <td>${dob.day}/${dob.month}/${dob.year}</td>
        <td>${escapeHtml(item.mother_name)}</td>
        <td>${escapeHtml(item.baby_name)}</td>
        <td></td>
        <td>${item.birth_place === "home" ? CHECK : CROSS}</td>
        <td>${item.birth_place === "institution" ? CHECK : CROSS}</td>
        <td>${item.skilled_birth_attended ? CHECK : CROSS}</td>
        <td>${item.fchv_present ? CHECK : CROSS}</td>
        <td>${item.asphyxiated_newborn ? CHECK : CROSS}</td>
      </tr>
    `;
  });

  if (data.length === 0) {
    html += getEmptyRows(9, 10);
  }

  html += `</tbody></table>`;
  return html;
};

/**
 * PNC Follow-up Monitoring Table — शिशुको अनुगमन भेट
 *
 * Columns:
 *   (from child_monitoring) baby info + birth-care flags
 *   (from visit PNC) tick if an FCHV visit happened within:
 *     - 24 hrs  : child record itself (child was registered/added)
 *     - 3 days  : visit_date within 3 days of date_of_birth
 *     - 7-14 days: visit_date within 7–14 days of date_of_birth
 *     - 42 days : visit_date within 40–42 days of date_of_birth
 *     - Other   : any PNC visit outside those windows
 */
const generatePncMonitoringTable = async (data: any[]) => {
  const db = await getDb();

  // Fetch all PNC visits for the mothers of children in data
  const motherIds = [
    ...new Set(data.map((c: any) => c.mother).filter(Boolean)),
  ];
  const visitsByMother: Record<string, any[]> = {};

  if (motherIds.length > 0) {
    const placeholders = motherIds.map(() => "?").join(",");
    const visits = await db.getAllAsync<any>(
      `SELECT mother, visit_date FROM visit
       WHERE mother IN (${placeholders})
         AND visit_type = 'PNC'
         AND is_deleted = 0
       ORDER BY visit_date ASC`,
      motherIds,
    );
    visits.forEach((v) => {
      if (!visitsByMother[v.mother]) visitsByMother[v.mother] = [];
      visitsByMother[v.mother].push(v.visit_date);
    });
  }

  /**
   * Calculate the difference in days between a visit date string (AD YYYY-MM-DD)
   * and a birth date string (AD or BS YYYY-MM-DD).
   * Birth date stored in child_monitoring.date_of_birth may be AD.
   */
  const daysDiff = (
    birthDateStr: string,
    visitDateStr: string,
  ): number | null => {
    try {
      const birth = new Date(birthDateStr);
      const visit = new Date(visitDateStr);
      if (isNaN(birth.getTime()) || isNaN(visit.getTime())) return null;
      return Math.round(
        (visit.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24),
      );
    } catch {
      return null;
    }
  };

  let html = `
    <div class="page-break"></div>
    <div class="title" style="text-align: center;">शिशुको अनुगमन भेट</div>
    <div class="subtitle" style="text-align: center;">(नवजात शिशु र आमाको स्याहार अनुगमन)</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">क्र.सं.</th>
          <th rowspan="2">शिशु जन्म<br>मिति<br>(ग.म.सा.)</th>
          <th rowspan="2">आमाको<br>नाम र थर</th>
          <th rowspan="2">शिशुको नाम</th>
          <th rowspan="2">नाभी मलम<br>लगाएको</th>
          <th rowspan="2">जन्मने बित्तिकै<br>आमाको छातीमा<br>टाँसेर राखेको</th>
          <th rowspan="2">१ घण्टा भित्र<br>स्तनपान<br>गराएको</th>
          <th colspan="3">तौल</th>
          <th colspan="5">शिशुको अनुगमन भेट</th>
        </tr>
        <tr>
          <th>सामान्य<br>तौल</th>
          <th>कम तौल</th>
          <th>धेरै कम<br>तौल</th>
          <th>सुत्केरी भएको<br>२४ घण्टा भित्र</th>
          <th>सुत्केरी भएको<br>३ दिनमा</th>
          <th>सुत्केरी भएको<br>७-१४ दिनमा</th>
          <th>सुत्केरी भएको<br>४२ दिनमा</th>
          <th>अन्य</th>
        </tr>
        <tr>
  `;
  for (let i = 1; i <= 15; i++) html += `<th>${convertToNepaliNumber(i)}</th>`;
  html += `</tr></thead><tbody>`;

  data.forEach((item, index) => {
    const dob = parseDateToNepali(item.date_of_birth);
    const dobStr: string = item.date_of_birth || "";

    // Birth-care flags from child_monitoring
    const umbilical = item.umbilical_ointment ? CHECK : CROSS;
    const skinToSkin = item.skin_to_skin ? CHECK : CROSS;
    const breastfeed = item.early_breastfeeding ? CHECK : CROSS;

    // Weight category
    const weightNormal = item.baby_weight === "normal" ? CHECK : CROSS;
    const weightLow = item.baby_weight === "low" ? CHECK : CROSS;
    const weightVeryLow = item.baby_weight === "very_low" ? CHECK : CROSS;

    // 24-hr: mark CHECK if the child was added to the system (child record exists)
    const visit24hr = CHECK;

    // PNC visit windows (based on visit_date vs date_of_birth, in days)
    let visit3d = CROSS;
    let visit7_14 = CROSS;
    let visit42 = CROSS;
    let visitOther = CROSS;

    if (dobStr) {
      const pncVisits = visitsByMother[item.mother] || [];
      pncVisits.forEach((vDate: string) => {
        const diff = daysDiff(dobStr, vDate);
        if (diff === null) return;
        if (diff >= 1 && diff <= 3) {
          visit3d = CHECK;
        } else if (diff >= 7 && diff <= 14) {
          visit7_14 = CHECK;
        } else if (diff >= 40 && diff <= 45) {
          visit42 = CHECK;
        } else if (diff > 0) {
          visitOther = CHECK;
        }
      });
    }

    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td>${dob.day}/${dob.month}/${dob.year}</td>
        <td>${escapeHtml(item.mother_name)}</td>
        <td>${escapeHtml(item.baby_name)}</td>
        <td>${umbilical}</td>
        <td>${skinToSkin}</td>
        <td>${breastfeed}</td>
        <td>${weightNormal}</td>
        <td>${weightLow}</td>
        <td>${weightVeryLow}</td>
        <td>${visit24hr}</td>
        <td>${visit3d}</td>
        <td>${visit7_14}</td>
        <td>${visit42}</td>
        <td>${visitOther}</td>
      </tr>
    `;
  });

  if (data.length === 0) {
    html += getEmptyRows(15, 5);
  }

  html += `</tbody></table>`;
  return html;
};

const stripEmojis = (str: string): string => {
  if (!str) return "";
  return str.replace(
    /[\uD800-\uDBFF][\uDC00-\uDFFF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83D[\uDE00-\uDE4F]|\uD83D[\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]|[\u2600-\u27BF]|[\uFE0E\uFE0F]/g,
    "",
  );
};

const savePdfToDevice = async (htmlContent: string, fileName: string) => {
  const sanitizedHtml = stripEmojis(htmlContent);
  const { uri } = await Print.printToFileAsync({
    html: sanitizedHtml,
    base64: false,
  });

  if (Platform.OS === "android") {
    try {
      let directoryUri = await storage.get<string>("export_directory_uri");

      if (!directoryUri && StorageAccessFramework) {
        try {
          const permissions =
            await StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) return;

          directoryUri = permissions.directoryUri;
          await storage.set("export_directory_uri", directoryUri);
        } catch (permError) {
          console.error("StorageAccessFramework error:", permError);
          await storage.remove("export_directory_uri");
          alert(
            "Storage Access Framework not available. Download to device not supported on Android.",
          );
          return;
        }
      }

      if (!directoryUri || !StorageAccessFramework) {
        // Fallback to Share if permissions were denied or SAF is not loaded
        await Share.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Export ${fileName}`,
        });
        return;
      }

      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      try {
        const newUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          "application/pdf",
        );
        await writeAsStringAsync(newUri, base64, {
          encoding: EncodingType.Base64,
        });
      } catch (e) {
        // If file creation fails (e.g., folder deleted or permission revoked), clear cached URI
        await storage.remove("export_directory_uri");
        alert(
          "Download folder not found or permission revoked. Please try again.",
        );
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during download.");
    }
  } else {
    await Share.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Export ${fileName}`,
    });
  }
};

const wrapHtml = (bodyHtml: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      ${getCss()}
    </head>
    <body>
      ${bodyHtml}
    </body>
  </html>
`;

/**
 * Render a single HTML section into its own PDF file and return the file uri.
 * Rendering each section separately avoids the native Android PDF writer
 * running out of memory when a very large combined document is produced in
 * one pass (which caused: "An error occured while writing the PDF data").
 */
const renderHtmlToPdf = async (bodyHtml: string): Promise<string> => {
  const sanitizedHtml = stripEmojis(wrapHtml(bodyHtml));
  const { uri } = await Print.printToFileAsync({
    html: sanitizedHtml,
    base64: false,
  });
  return uri;
};

/**
 * Merge multiple PDF files (by uri) into a single PDF file and return the
 * merged file uri. Uses pdf-lib (pure JS) so it works inside Expo/RN.
 */
const mergePdfFiles = async (uris: string[]): Promise<string> => {
  const mergedPdf = await PDFDocument.create();

  for (const uri of uris) {
    const base64 = await readAsStringAsync(uri, {
      encoding: EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);
    const srcPdf = await PDFDocument.load(bytes);
    const copiedPages = await mergedPdf.copyPages(
      srcPdf,
      srcPdf.getPageIndices(),
    );
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBase64 = await mergedPdf.saveAsBase64();
  const cacheDir = FileSystem.cacheDirectory ?? "";
  const outUri = `${cacheDir}FCHV_Merged_${Date.now()}.pdf`;
  await writeAsStringAsync(outUri, mergedBase64, {
    encoding: EncodingType.Base64,
  });
  return outUri;
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const cleaned = base64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = cleaned.length;
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  const byteLength = (len * 3) / 4 - padding;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[cleaned.charCodeAt(i)];
    const e2 = lookup[cleaned.charCodeAt(i + 1)];
    const e3 = lookup[cleaned.charCodeAt(i + 2)];
    const e4 = lookup[cleaned.charCodeAt(i + 3)];

    const chunk = (e1 << 18) | (e2 << 12) | (e3 << 6) | e4;
    if (p < byteLength) bytes[p++] = (chunk >> 16) & 0xff;
    if (p < byteLength) bytes[p++] = (chunk >> 8) & 0xff;
    if (p < byteLength) bytes[p++] = chunk & 0xff;
  }

  return bytes;
};

/**
 * Save an already-generated PDF file (by uri) to the device / share sheet.
 * Mirrors the behaviour of savePdfToDevice but skips the printToFileAsync
 * step since the PDF already exists on disk.
 */
const savePdfUriToDevice = async (uri: string, fileName: string) => {
  if (Platform.OS === "android") {
    try {
      let directoryUri = await storage.get<string>("export_directory_uri");

      if (!directoryUri && StorageAccessFramework) {
        try {
          const permissions =
            await StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (!permissions.granted) return;

          directoryUri = permissions.directoryUri;
          await storage.set("export_directory_uri", directoryUri);
        } catch (permError) {
          console.error("StorageAccessFramework error:", permError);
          await storage.remove("export_directory_uri");
          alert(
            "Storage Access Framework not available. Download to device not supported on Android.",
          );
          return;
        }
      }

      if (!directoryUri || !StorageAccessFramework) {
        await Share.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Export ${fileName}`,
        });
        return;
      }

      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      try {
        const newUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName,
          "application/pdf",
        );
        await writeAsStringAsync(newUri, base64, {
          encoding: EncodingType.Base64,
        });
      } catch (e) {
        await storage.remove("export_directory_uri");
        alert(
          "Download folder not found or permission revoked. Please try again.",
        );
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during download.");
    }
  } else {
    await Share.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Export ${fileName}`,
    });
  }
};

const getMonthSuffix = (filter: MonthFilter): string => {
  if (!filter) return "";
  if (!filter.month) return `_${filter.year}`;
  return `_${filter.year}_${String(filter.month).padStart(2, "0")}`;
};

export const exportCollectedDataToPdf = async (filter: MonthFilter = null) => {
  try {
    const htmlContent = wrapHtml(await generateCollectedDataTable(filter));
    await savePdfToDevice(
      htmlContent,
      `FCHV_Collected_Data${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Collected Data PDF:", error);
    throw error;
  }
};

export const exportAllDataToPdf = async (filter: MonthFilter = null) => {
  try {
    const pregnancies = (await getPregnantWomenList()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const maternalDeaths = (await getAllMaternalDeaths()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const newbornDeaths = (await getAllNewbornDeaths()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const infants = (await getAllInfantMonitorings()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const adolescents = (await getAllAdolescentIfa()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const collectedDataTable = await generateCollectedDataTable(filter);

    // Render each section into its own PDF to avoid the native Android PDF
    // writer running out of memory on a single huge document, then merge
    // the sections into one final PDF with pdf-lib.
    const sections: string[] = [
      collectedDataTable,
      await generatePregnancyTable(pregnancies),
      await generateMaternalDeathTable(maternalDeaths),
      generateNewbornDeathTable(newbornDeaths),
      generateChildDeathTable(newbornDeaths),
      generateInfantCareTable(infants) +
        (await generatePncMonitoringTable(infants)),
      generateAdolescentIfaTable(adolescents),
    ];

    const pdfUris: string[] = [];
    for (const section of sections) {
      pdfUris.push(await renderHtmlToPdf(section));
    }

    const mergedUri = await mergePdfFiles(pdfUris);

    await savePdfUriToDevice(
      mergedUri,
      `FCHV_Export_All${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

export const exportPregnancyToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getPregnantWomenList()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const htmlContent = wrapHtml(await generatePregnancyTable(data));
    await savePdfToDevice(
      htmlContent,
      `FCHV_Pregnancy${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Pregnancy PDF:", error);
    throw error;
  }
};

export const exportMaternalDeathToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getAllMaternalDeaths()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const htmlContent = wrapHtml(await generateMaternalDeathTable(data));
    await savePdfToDevice(
      htmlContent,
      `FCHV_Maternal_Death${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Maternal Death PDF:", error);
    throw error;
  }
};

export const exportNewbornDeathToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getAllNewbornDeaths()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const htmlContent = wrapHtml(generateNewbornDeathTable(data));
    await savePdfToDevice(
      htmlContent,
      `FCHV_Newborn_Death${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Newborn Death PDF:", error);
    throw error;
  }
};

export const exportChildDeathToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getAllNewbornDeaths()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const htmlContent = wrapHtml(generateChildDeathTable(data));
    await savePdfToDevice(
      htmlContent,
      `FCHV_Child_Death${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Child Death PDF:", error);
    throw error;
  }
};

export const exportInfantCareToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getAllInfantMonitorings()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const pncHtml = await generatePncMonitoringTable(data);
    const htmlContent = wrapHtml(generateInfantCareTable(data) + pncHtml);
    await savePdfToDevice(
      htmlContent,
      `FCHV_Infant_Care${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Infant Care PDF:", error);
    throw error;
  }
};

export const exportPncMonitoringToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getAllInfantMonitorings()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const htmlContent = wrapHtml(await generatePncMonitoringTable(data));
    await savePdfToDevice(
      htmlContent,
      `FCHV_PNC_Monitoring${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating PNC Monitoring PDF:", error);
    throw error;
  }
};

const generateAdolescentIfaTable = (data: any[]) => {
  let html = `
    <div style="background-color: #A9D1EC; padding: 12px; text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 22px; color: #000; letter-spacing: 0.5px; border-radius: 4px;">
      किशोरी लक्षित आइरन फोलिक एसिड वितरण अभिलेख
    </div>
    
    <table style="width: 100%; border: none; margin-bottom: 15px; font-size: 11px; border-collapse: collapse;">
      <tr style="border: none;">
        <td style="width: 60%; text-align: left; border: none; padding: 5px;">महिला सामुदायिक स्वास्थ्य स्वयं सेविकाको नाम : ............................................</td>
        <td style="width: 40%; text-align: left; border: none; padding: 5px;">प्रदेश : ............................................</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 60%; text-align: left; border: none; padding: 5px;">महा/उप/न.पा/गाउँपालिकाको नाम : ............................................</td>
        <td style="width: 40%; text-align: left; border: none; padding: 5px;">वडा नं. : ...........</td>
      </tr>
      <tr style="border: none;">
        <td style="width: 60%; text-align: left; border: none; padding: 5px;">साल : ............................</td>
        <td style="width: 40%; text-align: left; border: none; padding: 5px;">वडा भित्र विद्यालय नजाने किशोरीहरुको संख्या: ...........</td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr>
          <th rowspan="3" style="width: 3%;">क्र.सं.</th>
          <th rowspan="3" style="width: 15%;">किशोरीको नाम</th>
          <th colspan="2" rowspan="2" style="width: 8%;">उमेर समूह<br>(वर्षमा)</th>
          <th colspan="13">पहिलो चरण (साउन देखि असोज सम्म)</th>
          <th rowspan="3" style="width: 4%;">१३ हप्ता<br>खाएको</th>
          <th colspan="13">दोस्रो चरण (माघ देखि चैत्र सम्म)</th>
          <th rowspan="3" style="width: 4%;">२६ हप्ता<br>खाएको</th>
          <th rowspan="3" style="width: 10%;">कैफियत</th>
        </tr>
        <tr>
          <th colspan="13">हप्ता</th>
          <th colspan="13">हप्ता</th>
        </tr>
        <tr>
          <th style="font-size: 8px; font-weight: normal; padding: 2px;">१०-१४</th>
          <th style="font-size: 8px; font-weight: normal; padding: 2px;">१५-१९</th>
          ${Array.from({ length: 13 })
            .map(
              (_, i) =>
                `<th style="padding: 2px; font-size: 8px;">${convertToNepaliNumber(i + 1)}</th>`,
            )
            .join("")}
          ${Array.from({ length: 13 })
            .map(
              (_, i) =>
                `<th style="padding: 2px; font-size: 8px;">${convertToNepaliNumber(i + 1)}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
  `;

  // Dynamically calculate totals
  let total10_14 = 0;
  let total15_19 = 0;
  const totalP1Weeks = Array(13).fill(0);
  let totalP1Completed = 0;
  const totalP2Weeks = Array(13).fill(0);
  let totalP2Completed = 0;

  data.forEach((item, index) => {
    const is10_14 = item.age_group === "10-14";
    const is15_19 = item.age_group === "15-19";

    if (is10_14) total10_14++;
    if (is15_19) total15_19++;
    if (item.phase1_completed === 1) totalP1Completed++;
    if (item.phase2_completed === 1) totalP2Completed++;

    // Calculate weekly sums
    for (let w = 1; w <= 13; w++) {
      if (item[`phase1_week_${w}`] === 1) totalP1Weeks[w - 1]++;
      if (item[`phase2_week_${w}`] === 1) totalP2Weeks[w - 1]++;
    }

    html += `
      <tr>
        <td>${convertToNepaliNumber(index + 1)}</td>
        <td style="text-align: left; padding-left: 5px;">${escapeHtml(item.name)}</td>
        <td>${is10_14 ? CHECK : ""}</td>
        <td>${is15_19 ? CHECK : ""}</td>
        ${Array.from({ length: 13 })
          .map(
            (_, i) =>
              `<td>${item[`phase1_week_${i + 1}`] === 1 ? CHECK : ""}</td>`,
          )
          .join("")}
        <td>${item.phase1_completed === 1 ? CHECK : ""}</td>
        ${Array.from({ length: 13 })
          .map(
            (_, i) =>
              `<td>${item[`phase2_week_${i + 1}`] === 1 ? CHECK : ""}</td>`,
          )
          .join("")}
        <td>${item.phase2_completed === 1 ? CHECK : ""}</td>
        <td style="text-align: left; padding-left: 5px; font-size: 8px;">${escapeHtml(item.remarks)}</td>
      </tr>
    `;
  });

  // If empty, add placeholder rows
  if (data.length === 0) {
    html += getEmptyRows(33, 5);
  }

  // Add the "जम्मा" footer row
  html += `
    <tr style="background-color: #f2f2f2; font-weight: bold;">
      <td colspan="2" style="text-align: center; font-weight: bold;">जम्मा</td>
      <td>${total10_14 > 0 ? convertToNepaliNumber(total10_14) : "०"}</td>
      <td>${total15_19 > 0 ? convertToNepaliNumber(total15_19) : "०"}</td>
      ${totalP1Weeks.map((v) => `<td>${v > 0 ? convertToNepaliNumber(v) : "०"}</td>`).join("")}
      <td>${totalP1Completed > 0 ? convertToNepaliNumber(totalP1Completed) : "०"}</td>
      ${totalP2Weeks.map((v) => `<td>${v > 0 ? convertToNepaliNumber(v) : "०"}</td>`).join("")}
      <td>${totalP2Completed > 0 ? convertToNepaliNumber(totalP2Completed) : "०"}</td>
      <td></td>
    </tr>
  `;

  html += `</tbody></table>`;
  return html;
};

export const exportAdolescentIfaToPdf = async (filter: MonthFilter = null) => {
  try {
    const data = (await getAllAdolescentIfa()).filter((r) =>
      matchesMonthFilter(filter, r),
    );
    const htmlContent = wrapHtml(generateAdolescentIfaTable(data));
    await savePdfToDevice(
      htmlContent,
      `FCHV_Iron_Adolescent${getMonthSuffix(filter)}.pdf`,
    );
  } catch (error) {
    console.error("Error generating Adolescent IFA PDF:", error);
    throw error;
  }
};
