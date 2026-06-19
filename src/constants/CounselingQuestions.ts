export interface CounselingQuestion {
  id: string;
  en: string;
  ne: string;
}

export const COUNCELING_QUESTION_AFTER_PREGNANT: CounselingQuestion[] = [
  {
    id: 'pregnancy_test_referral',
    en: 'Was the client referred to a health facility for a pregnancy test?',
    ne: 'गर्भ जाँचको लागि स्वास्थ्य संस्थामा पठाउनुभयो (रेफर गर्नुभयो)?'
  },
  {
    id: 'labor_starts_advice',
    en: 'Was the client advised to go to a health facility as soon as labor pains start?',
    ne: 'सुत्केरी व्यथा लाग्ने बित्तिकै स्वास्थ्य संस्था जान सल्लाह दिनुभयो?'
  },
]

export const COUNCELING_QUESTION_AFTER_PREGNANT_ONE_TIME: CounselingQuestion[] = [
  // {
  //   id: 'delivery_transport_arranged',
  //   en: 'Has transportation been arranged to take the client to a health facility for delivery?',
  //   ne: 'सुत्केरी हुन स्वास्थ्य संस्था जानका लागि गाडी वा यातायातको व्यवस्था मिलाइएको छ?'
  // },
  {
    id: "bathed_after_24_hours",
    en: "Did you bathe the baby only after 24 hours of birth?",
    ne: "बच्चा जन्मिएको २४ घण्टा पूरा भएपछि मात्र नुहाउनुभएको थियो?",
  },
  {
    id: "antenatal_checkups",
    en: "Did the pregnant woman attend antenatal checkups at a health facility?",
    ne: "गर्भवती महिलाले स्वास्थ्य संस्थामा गर्भ जाँच गराउनुभएको थियो?",
  },
  {
    id: "iron_tablets_followup",
    en: "Did you provide iron tablets during follow-up visits?",
    ne: "दोहोर्‍याएर जाँचका लागि आउँदा गर्भवती महिलालाई आइरन चक्की दिनुभयो?",
  },
  {
    id: "institutional_delivery_referral",
    en: "Did you refer the pregnant woman for institutional delivery?",
    ne: "सुत्केरी जाँचको लागि स्वास्थ्य संस्थामा रेफर गर्नुभयो?",
  },
  {
    id: "health_education_safe_motherhood",
    en: "Did you provide health education on safe motherhood and newborn care using flipcharts/posters?",
    ne: "फ्लिपचार्ट/पोस्टर सामग्री प्रयोग गरी सुरक्षित मातृत्व तथा नवशिशु सम्बन्धि स्वास्थ्य शिक्षा दिनुभयो?",
  },
  {
    id: "abortion_services_referral",
    en: "Did you refer the woman to a health facility for safe abortion services?",
    ne: "सुरक्षित गर्भपतनका लागि स्वास्थ्य संस्थामा रेफर गगर्नुभयो?",
  },
]


// export const COUNSELING_REFERRAL_QUESTIONS: CounselingQuestion[] = [
//   {
//     id: 'danger_signs_pregnancy_advice',
//     en: 'Was the client advised to go to a health facility immediately if danger signs like bleeding or severe lower abdominal pain appear?',
//     ne: 'रगत बग्ने वा तल्लो पेट धेरै दुख्ने जस्ता खतराका लक्षण देखिएमा तुरुन्तै स्वास्थ्य संस्था जान सल्लाह दिनुभयो?'
//   },
// ];

export const COUNSELING_REFERRAL_QUESTIONS_AFTER_CHILD_BORN: CounselingQuestion[] = [
  {
    id: 'danger_signs_postpartum_advice',
    en: 'Was the client advised to go to a health facility immediately if any danger signs appear in the mother or newborn?',
    ne: 'सुत्केरी आमा वा नवजात शिशुमा कुनै खतराका लक्षण देखिएमा तुरुन्तै स्वास्थ्य संस्था जान सल्लाह दिनुभयो?'
  },
  // {
  //   id: 'problem_referral',
  //   en: 'Was the mother or baby referred to a health facility immediately if a problem arose?',
  //   ne: 'आमा वा बच्चामा कुनै समस्या देखिएमा तुरुन्तै स्वास्थ्य संस्थामा पठाउनुभयो (रेफर गर्नुभयो)?'
  // },

]

export const COUNSELING_REFERRAL_QUESTIONS_AFTER_CHILD_BORN_ONE_TIME: CounselingQuestion[] = [
  {
    id: 'early_breastfeeding_advice',
    en: 'Was the client advised to start breastfeeding within the first hour of birth?',
    ne: 'बच्चा जन्मेको एक घण्टाभित्रै आमाको दूध खुवाउनु भनेर सल्लाह दिनुभयो?'
  },
  {
    id: 'skin_to_skin_advice',
    en: 'Was the client advised to keep the baby skin-to-skin immediately after birth?',
    ne: 'बच्चा जन्मने बित्तिकै आमाको नाङ्गो छातीमा टाँसेर (न्यानो पारेर) राख्न सल्लाह दिनुभयो?'
  },
  {
    id: "vitamin_a_given",
    en: "Did you give Vitamin A to the mother?",
    ne: "आमालाई भिटामिन ए दिनुभयो?",
  },
  {
    id: "home_delivery",
    en: "Did the delivery take place at home?",
    ne: "घरमा प्रसूति भएको हो?",
  },
  {
    id: "postnatal_iron_tablets_given",
    en: "Did you provide 45 iron tablets to the postnatal mother?",
    ne: "सुत्केरीलाई ४५ आइरन चक्की दिनुभयो?",
  },
  {
    id: "home_delivery_misoprostol",
    en: "In case of a home delivery, was misoprostol taken?",
    ne: "घरमै सुत्केरी भईं मिसोप्रोस्टोल सेवन गरेको छ?",
  },
  {
    id: 'exclusive_breastfeeding_advice',
    en: 'Was the client advised to exclusively breastfeed the baby for the first 6 months?',
    ne: 'बच्चा ६ महिना पुगुन्जेल आमाको दूध मात्र खुवाउन (पानी पनि नदिई) सल्लाह दिनुभयो?'
  },
  {
    id: 'infant_feeding_practices_counseling',
    en: 'Did you provide counseling on infant and young child feeding practices?',
    ne: 'शिशु तथा बाल्यकालीन पोषण व्यवहार सम्बन्धि सल्लाह दिनुभयो?'
  },
]

export const COUNSELING_REFERRAL_QUESTIONS_ONE_TIME_MOTHER: CounselingQuestion[] = [
  // {
  //   id: 'postnatal_family_care',
  //   en: 'Are family members taking good care of the postnatal mother?',
  //   ne: 'परिवारका सदस्यहरूले सुत्केरी आमाको राम्रोसँग हेरचाह गरिरहेका छन्?'
  // },
  // {
  //   id: 'family_planning_advice',
  //   en: 'Was counseling provided on family planning methods?',
  //   ne: 'परिवार नियोजनका साधनहरूका बारेमा सल्लाह दिनुभयो?'
  // },
  {
    id: 'family_planning_services_referral',
    en: 'Did you refer the couple to a health facility for family planning services?',
    ne: 'परिवार नियोजन सेवाका लागि दम्पतीलाई स्वास्थ्य संस्थामा प्रेषण गर्नुभयो?'
  },
  {
    id: 'fm_health_education',
    en: 'Did you provide health education on family planning using educational materials (flipcharts/posters)?',
    ne: 'परिवार नियोजन सम्बन्धी सामग्री (फ्लिपचार्ट/पोस्टर) प्रयोग गरी स्वास्थ्य शिक्षा दिनुभयो?'
  },
  {
    id: 'hiv_transmission_counseling',
    en: 'Provided HIV transmission counseling and referred for HIV testing?',
    ne: 'आमाबाट बच्चामा सर्ने एचआईभीबारे परामर्श दिई रक्त परीक्षणका लागि रेफर गर्नुभयो?'
  },
  {
    id: 'uterine_prolapse_referral',
    en: 'Did you refer the woman with uterine prolapse to a health facility?',
    ne: 'पाठेघर खस्ने समस्या भएका आमालाई स्वास्थ्य संस्थामा जान रेफर गर्नुभयो?'
  },
  {
    id: 'cervical_cancer_screening_referral',
    en: 'Did you refer the woman to a health facility for cervical cancer screening?',
    ne: 'पाठेघरको मुखको क्यान्सर जाँचका लागि स्वास्थ्य संस्थामा जान रेफर गर्नुभयो?'
  },
]
