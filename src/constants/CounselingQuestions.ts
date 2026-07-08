// ─────────────────────────────────────────────────────────────
// Counseling & Referral Questions — Single Source of Truth
// ─────────────────────────────────────────────────────────────
//
// Every question carries its own metadata:
//   type       → "counseling" | "referral"
//   category   → "mother" | "pregnant" | "postpartum"
//   frequency  → "every_visit" | "one_time"
//
// one_time + category="mother"     → ask once per registered mother (lifetime)
// one_time + category="pregnant"   → ask once per pregnancy registration
// one_time + category="postpartum" → ask once per delivery registration
// every_visit                      → ask on each visit of matching type
// ─────────────────────────────────────────────────────────────

export type QuestionType = "counseling" | "referral";
export type QuestionCategory = "mother" | "pregnant" | "postpartum";
export type QuestionFrequency = "every_visit" | "one_time";

export interface CounselingQuestion {
  id: string;
  en: string;
  ne: string;
  type: QuestionType;
  category: QuestionCategory;
  frequency: QuestionFrequency;
}

// ─── All Questions ───────────────────────────────────────────

export const ALL_QUESTIONS: CounselingQuestion[] = [
  // ━━━ PREGNANT — Every Visit ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "pregnancy_test_referral",
    en: "Was the client referred to a health facility for a pregnancy test?",
    ne: "गर्भ जाँचको लागि स्वास्थ्य संस्थामा पठाउनुभयो?",
    type: "referral",
    category: "pregnant",
    frequency: "every_visit",
  },
  {
    id: "hiv_transmission_counseling",
    en: "Provided HIV transmission counseling and referred for HIV testing?",
    ne: "आमाबाट बच्चामा सर्ने एचआईभीबारे परामर्श दिई रक्त परीक्षणका लागि रेफर गर्नुभयो?",
    type: "referral",
    category: "pregnant",
    frequency: "one_time",
  },

  // ━━━ PREGNANT — One-Time (per pregnancy) ━━━━━━━━━━━━━━━━━
  {
    id: "antenatal_checkups",
    en: "Did the pregnant woman attend antenatal checkups at a health facility?",
    ne: "गर्भवती महिलाले स्वास्थ्य संस्थामा गर्भ जाँच गराउनुभएको थियो?",
    type: "counseling",
    category: "pregnant",
    frequency: "one_time",
  },
  {
    id: "labor_starts_advice",
    en: "Was the client advised to go to a health facility as soon as labor pains start?",
    ne: "सुत्केरी व्यथा लाग्ने बित्तिकै स्वास्थ्य संस्था जान सल्लाह दिनुभयो?",
    type: "counseling",
    category: "pregnant",
    frequency: "every_visit",
  },
  // {
  //   id: "iron_tablets_followup",
  //   en: "Did you provide iron tablets during follow-up visits?",
  //   ne: "दोहोर्‍याएर जाँचका लागि आउँदा गर्भवती महिलालाई आइरन चक्की दिनुभयो?",
  //   type: "counseling",
  //   category: "pregnant",
  //   frequency: "one_time",
  // },
  {
    id: "institutional_delivery_referral",
    en: "Did you refer the pregnant woman for institutional delivery?",
    ne: "सुत्केरी जाँचको लागि स्वास्थ्य संस्थामा रेफर गर्नुभयो?",
    type: "referral",
    category: "pregnant",
    frequency: "one_time",
  },
  {
    id: "health_education_safe_motherhood",
    en: "Did you provide health education on safe motherhood and newborn care using flipcharts/posters?",
    ne: "फ्लिपचार्ट/पोस्टर सामग्री प्रयोग गरी सुरक्षित मातृत्व तथा नवशिशु सम्बन्धि स्वास्थ्य शिक्षा दिनुभयो?",
    type: "counseling",
    category: "pregnant",
    frequency: "one_time",
  },
  {
    id: "abortion_services_referral",
    en: "Did you refer the woman to a health facility for safe abortion services?",
    ne: "सुरक्षित गर्भपतनका लागि स्वास्थ्य संस्थामा रेफर गगर्नुभयो?",
    type: "referral",
    category: "pregnant",
    frequency: "one_time",
  },

  // ━━━ POSTPARTUM — Every Visit ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    id: "danger_signs_postpartum_advice",
    en: "Was the client advised to go to a health facility immediately if any danger signs appear in the mother or newborn?",
    ne: "सुत्केरी आमा वा नवजात शिशुमा कुनै खतराका लक्षण देखिएमा तुरुन्तै स्वास्थ्य संस्था जान सल्लाह दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "every_visit",
  },
  {
    id: "iron_tablets_followup",
    en: "Did you provide iron tablets during follow-up visits?",
    ne: "दोहोर्‍याएर जाँचका लागि आउँदा गर्भवती महिलालाई आइरन चक्की दिनुभयो?",
    type: "counseling",
    category: "pregnant",
    frequency: "every_visit",
  },

  // ━━━ POSTPARTUM — One-Time (per delivery) ━━━━━━━━━━━━━━━━
  {
    id: "postnatal_iron_tablets_given",
    en: "Did you provide 45 iron tablets to the postnatal mother?",
    ne: "सुत्केरीलाई ४५ आइरन चक्की दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "every_visit",
  },
  {
    id: "bathe_within_24_hours",
    en: "Did you bathe within 24 hours after giving birth?",
    ne: "बच्चा जन्मेपछि २४ घण्टाभित्र नुहाउनुभएको थियो?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },
  {
    id: "home_delivery",
    en: "Did the delivery take place at home?",
    ne: "घरमा प्रसूति भएको हो?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },
  {
    id: "home_delivery_misoprostol",
    en: "In case of a home delivery, was misoprostol taken?",
    ne: "घरमै सुत्केरी भईं मिसोप्रोस्टोल सेवन गरेको छ?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },
  {
    id: "early_breastfeeding_advice",
    en: "Was the client advised to start breastfeeding within the first hour of birth?",
    ne: "बच्चा जन्मेको एक घण्टाभित्रै आमाको दूध खुवाउनु भनेर सल्लाह दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },
  {
    id: "skin_to_skin_advice",
    en: "Was the client advised to keep the baby skin-to-skin immediately after birth?",
    ne: "बच्चा जन्मने बित्तिकै आमाको नाङ्गो छातीमा टाँसेर (न्यानो पारेर) राख्न सल्लाह दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },
  {
    id: "vitamin_a_given",
    en: "Did you give Vitamin A to the mother?",
    ne: "आमालाई भिटामिन ए दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "every_visit",
  },
  {
    id: "exclusive_breastfeeding_advice",
    en: "Was the client advised to exclusively breastfeed the baby for the first 6 months?",
    ne: "बच्चा ६ महिना पुगुन्जेल आमाको दूध मात्र खुवाउन (पानी पनि नदिई) सल्लाह दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },
  {
    id: "infant_feeding_practices_counseling",
    en: "Did you provide counseling on infant and young child feeding practices?",
    ne: "शिशु तथा बाल्यकालीन पोषण व्यवहार सम्बन्धि सल्लाह दिनुभयो?",
    type: "counseling",
    category: "postpartum",
    frequency: "one_time",
  },

  // ━━━ MOTHER — One-Time (per registered mother, lifetime) ━━
  {
    id: "family_planning_services_referral",
    en: "Did you refer the couple to a health facility for family planning services?",
    ne: "परिवार नियोजन सेवाका लागि दम्पतीलाई स्वास्थ्य संस्थामा जान रेफर गर्नुभयो?",
    type: "referral",
    category: "mother",
    frequency: "one_time",
  },
  {
    id: "fm_health_education",
    en: "Did you provide health education on family planning using educational materials (flipcharts/posters)?",
    ne: "परिवार नियोजन सम्बन्धी सामग्री (फ्लिपचार्ट/पोस्टर) प्रयोग गरी स्वास्थ्य शिक्षा दिनुभयो?",
    type: "counseling",
    category: "mother",
    frequency: "one_time",
  },
  {
    id: "uterine_prolapse_referral",
    en: "Did you refer the woman with uterine prolapse to a health facility?",
    ne: "पाठेघर खस्ने समस्या भएका आमालाई स्वास्थ्य संस्थामा जान रेफर गर्नुभयो?",
    type: "referral",
    category: "mother",
    frequency: "one_time",
  },
  {
    id: "cervical_cancer_screening_referral",
    en: "Did you refer the woman to a health facility for cervical cancer screening?",
    ne: "पाठेघरको मुखको क्यान्सर जाँचका लागि स्वास्थ्य संस्थामा जान रेफर गर्नुभयो?",
    type: "referral",
    category: "mother",
    frequency: "one_time",
  },
];

/** Check if a question ID is a referral question */
export const isReferralQuestion = (questionId: string): boolean =>
  ALL_QUESTIONS.some((q) => q.id === questionId && q.type === "referral");

/** Get questions filtered by visit type */
export function getQuestionsForVisitType(visitType: "ANC" | "PNC" | "OTHER"): {
  counselingQuestions: CounselingQuestion[];
  referralQuestions: CounselingQuestion[];
} {
  let filtered: CounselingQuestion[];

  switch (visitType) {
    case "ANC":
      // All pregnant questions (every-visit + one-time)
      filtered = ALL_QUESTIONS.filter((q) => q.category === "pregnant");
      break;
    case "PNC":
      // All postpartum questions (every-visit + one-time)
      filtered = ALL_QUESTIONS.filter((q) => q.category === "postpartum");
      break;
    case "OTHER":
      // Mother-level questions only
      filtered = ALL_QUESTIONS.filter((q) => q.category === "mother");
      break;
    default:
      filtered = [];
  }

  return {
    counselingQuestions: filtered.filter((q) => q.type === "counseling"),
    referralQuestions: filtered.filter((q) => q.type === "referral"),
  };
}

/** Get one-time question IDs for a specific category */
export function getOneTimeQuestionIds(category: QuestionCategory): string[] {
  return ALL_QUESTIONS.filter(
    (q) => q.category === category && q.frequency === "one_time",
  ).map((q) => q.id);
}

/** Find a question by ID */
export function getQuestionById(id: string): CounselingQuestion | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

// ─── Backward Compatibility ──────────────────────────────────
// These re-exports allow existing consumers (CounselingReferralSection, etc.)
// to keep working without changes. Remove once those files are updated.

export const COUNCELING_QUESTION_AFTER_PREGNANT = ALL_QUESTIONS.filter(
  (q) => q.category === "pregnant" && q.frequency === "every_visit",
);

export const COUNCELING_QUESTION_AFTER_PREGNANT_ONE_TIME = ALL_QUESTIONS.filter(
  (q) => q.category === "pregnant" && q.frequency === "one_time",
);

export const COUNSELING_REFERRAL_QUESTIONS_AFTER_CHILD_BORN =
  ALL_QUESTIONS.filter(
    (q) => q.category === "postpartum" && q.frequency === "every_visit",
  );

export const COUNSELING_REFERRAL_QUESTIONS_AFTER_CHILD_BORN_ONE_TIME =
  ALL_QUESTIONS.filter(
    (q) => q.category === "postpartum" && q.frequency === "one_time",
  );

export const COUNSELING_REFERRAL_QUESTIONS_ONE_TIME_MOTHER =
  ALL_QUESTIONS.filter((q) => q.category === "mother");

export const REFERRAL_QUESTION_IDS = ALL_QUESTIONS.filter(
  (q) => q.type === "referral",
).map((q) => q.id);

// Questions shown at pregnancy registration time (PrenatalRegisterCounselingModal)
const PRENATAL_REGISTER_IDS = [
  "pregnancy_test_referral",
  "hiv_transmission_counseling",
  "health_education_safe_motherhood",
];
export const COUNSELING_QUESTIONS_ONE_TIME_PREGNANT_REGISTER_TIME =
  ALL_QUESTIONS.filter((q) => PRENATAL_REGISTER_IDS.includes(q.id));
