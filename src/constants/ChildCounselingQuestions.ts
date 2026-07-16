export interface ChildCounselingQuestion {
  id: string;
  en: string;
  ne: string;
}

export const ONE_TIME_CHILD_COUNSELING_QUESTIONS = [
  {
    id: "bathed_after_24_hours",
    en: "Did you bathe the baby only after 24 hours of birth?",
    ne: "बच्चा जन्मिएको २४ घण्टा पूरा भएपछि मात्र नुहाउनुभएको थियो?",
  },
];

export const CHILD_COUNSELING_QUESTIONS: ChildCounselingQuestion[] = [
  {
    id: "newborn_vaccination_facility",
    en: "Did you send the newborn baby to the health facility for vaccination?",
    ne: "नवजात शिशुलाई खोप लगाउन स्वास्थ्य संस्थामा पठाउनु भएको हो?",
  },
];

export const CHILD_HEALTH_COUNSELLING_QUESTIONS = [
  {
    id: "not_good_health_condition",
    en: "Is the baby's health condition bad?",
    ne: "शिशुको स्वास्थ्य अवस्था राम्रो छैन?",
  },
  {
    id: "has_diarrhea",
    en: "Does the child have diarrhea?",
    ne: "बच्चालाई झाडापखाला लागेको छ?",
  },
  {
    id: "diarrhea_treated_with_ors_zinc",
    en: "Did you treat the child's diarrhea with ORS and zinc tablets?",
    ne: "के बच्चाको झाडापखालाको उपचार पुनर्जलीय झोल र जिंक चक्कीबाट गर्नुभएको छ?",
  },
  {
    id: "referred_to_health_facility_due_to_diarrhea",
    en: "Did you refer the child to a health facility due to diarrhea?",
    ne: "के तपाईंले झाडापखालाको कारणले बच्चालाई स्वास्थ्य संस्थामा रेफर गर्नुभयो?",
  },
  {
    id: "ors_for_child",
    en: "Would you like to get ORS for the child?",
    ne: "बच्चाका लागि जीवनजल लिनुहुन्छ?",
  },
  {
    id: "zinc_for_child",
    en: "Would you like to get zinc tablets for the child?",
    ne: "बच्चाका लागि जिंक चक्की लिनुहुन्छ?",
  },
  {
    id: "referred_to_health_facility_due_to_phuknas",
    en: "Was the child referred to a health facility due to Phuknas?",
    ne: "फुकेनास रोग लागेर स्वास्थ्य संस्थामा रेफर गर्नु भएको हो?",
  },
  {
    id: "has_breathing_problems",
    en: "Does the child have breathing problems?",
    ne: "बच्चालाई श्वासप्रश्वास सम्बन्धी समस्या भएको छ?",
  },
  {
    id: "has_pneumonia",
    en: "Does the child have pneumonia?",
    ne: "बच्चालाई निमोनिया भएको छ?",
  },
  {
    id: "referred_breathing_problems",
    en: "Did you refer to the health facility for breathing problems?",
    ne: "बच्चालाई श्वासप्रश्वास सम्बन्धी समस्या भएर स्वास्थ्य संस्थामा रेफर गर्नु भएको हो?",
  },
  {
    id: "home_treatment_cold",
    en: "Did you advise home treatment for common respiratory problems like a cold?",
    ne: "रुघाखोकी जस्ता सामान्य श्वासप्रश्वास समस्या लागेर घरमै उपचारका लागि सल्लाह दिनुभएको हो?",
  },
];

export const PNC_CHILD_COUNSELING_QUESTIONS: ChildCounselingQuestion[] = [
  {
    id: "exclusive_breastfeeding",
    en: "Did you counsel on exclusive breastfeeding?",
    ne: "केवल स्तनपान गराउन परामर्श दिनुभयो?",
  },
  {
    id: "baby_warmth",
    en: "Did you counsel on keeping the baby warm?",
    ne: "बच्चालाई न्यानो राख्न परामर्श दिनुभयो?",
  },
  {
    id: "cord_care",
    en: "Did you counsel on cord care?",
    ne: "नाइटो हेरचाहको बारेमा परामर्श दिनुभयो?",
  },
  {
    id: "danger_signs",
    en: "Did you counsel on danger signs (difficulty breathing, fever, hypothermia, etc.)?",
    ne: "खतरा संकेतहरू (सास फेर्न गाह्रो, ज्वरो, शरीर चिसो हुनु, आदि) बारे परामर्श दिनुभयो?",
  },
  {
    id: "immunization_counseling",
    en: "Did you counsel on immunization schedule?",
    ne: "खोप तालिकाको बारेमा परामर्श दिनुभयो?",
  },
  {
    id: "growth_monitoring_counseling",
    en: "Did you counsel on growth monitoring?",
    ne: "वृद्धि निगरानीको बारेमा परामर्श दिनुभयो?",
  },
];

export const REGISTRATION_COUNSELING_QUESTIONS = [
  {
    id: "birth_registration_counseling",
    en: "Did you counsel the family to register the newborn's birth within 35 days?",
    ne: "के तपाईंले नवजात शिशुको ३५ दिनभित्र जन्म दर्ता गराउन परिवारलाई परामर्श दिनुभयो?",
  },
  {
    id: "death_registration_counseling",
    en: "Did you counsel the family to register the death within 35 days?",
    ne: "के तपाईंले मृत्यु भएको ३५ दिनभित्र मृत्यु दर्ता गराउन परिवारलाई परामर्श दिनुभयो?",
  },
];

export const MALNUTRITION_CONTENT = {
  title: { en: "Malnutrition", ne: "कुपोषण" },
  main_question: {
    id: "has_malnutrition",
    en: "Does the child have malnutrition?",
    ne: "बच्चालाई कुपोषण लागेको छ?",
  },
  severity_medium: { en: "Medium", ne: "मध्यम" },
  severity_high: { en: "High", ne: "कडा" },
  sub_questions: [
    {
      id: "malnutrition_cured",
      en: "Cured after treatment?",
      ne: "उपचारपछि निको भएको हो?",
    },
    {
      id: "malnutrition_not_cured",
      en: "Not cured after treatment?",
      ne: "उपचारपछि निको भएको छैन?",
    },
    {
      id: "malnutrition_dropped_out",
      en: "Stopped going to health facility during treatment?",
      ne: "उपचार गर्दा गर्दै स्वास्थ्य संस्था जान छोडेको हो?",
    },
    {
      id: "malnutrition_no_weight_gain",
      en: "No weight gain even after treatment?",
      ne: "उपचार गर्दा पनि तौल वृद्धि भएको छैन?",
    },
  ],
};
