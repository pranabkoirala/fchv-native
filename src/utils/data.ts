export const JATI_CODES = [
  { code: "1", np_label: "दलित", en_label: "Dalit" },
  { code: "2", np_label: "जनजाति", en_label: "Janajati" },
  { code: "3", np_label: "मधेसी", en_label: "Madhesi" },
  { code: "4", np_label: "मुस्लिम", en_label: "Muslim" },
  { code: "5", np_label: "ब्राह्मण/छेत्री", en_label: "Brahmin/Chhetri" },
  { code: "6", np_label: "अन्य", en_label: "Other" },
];

export const EDUCATION_LEVELS = [
  {
    value: "no_formal",
    np_label: "कुनै औपचारिक शिक्षा छैन",
    en_label: "No Formal Education",
  },
  {
    value: "primary",
    np_label: "प्राथमिक तह – कक्षा १–५",
    en_label: "Primary Level",
  },
  {
    value: "lower_secondary",
    np_label: "निम्न माध्यमिक तह – कक्षा ६–८",
    en_label: "Lower Secondary Level",
  },
  {
    value: "secondary",
    np_label: "माध्यमिक तह – कक्षा ९–१०",
    en_label: "Secondary Level / SEE",
  },
  {
    value: "higher_secondary",
    np_label: "उच्च माध्यमिक तह – कक्षा ११–१२",
    en_label: "Higher Secondary (+2)",
  },
  {
    value: "bachelor",
    np_label: "स्नातक तह",
    en_label: "Bachelor’s Degree",
  },
  {
    value: "master",
    np_label: "स्नातकोत्तर तह",
    en_label: "Master’s Degree",
  },
  {
    value: "doctoral",
    np_label: "विद्यावारिधि तह",
    en_label: "Doctoral / PhD",
  },
];

export const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export const EDUCATION_OPTIONS = [
  {
    value: "No formal education",
    np_label: "कुनै औपचारिक शिक्षा छैन",
    en_label: "No formal education",
  },
  {
    value: "Primary",
    np_label: "प्राथमिक",
    en_label: "Primary",
  },
  {
    value: "Secondary",
    np_label: "माध्यमिक",
    en_label: "Secondary",
  },
  {
    value: "Higher Secondary",
    np_label: "उच्च माध्यमिक",
    en_label: "Higher Secondary",
  },
  {
    value: "Bachelor or above",
    np_label: "स्नातक वा सोभन्दा माथि",
    en_label: "Bachelor or above",
  },
];

export const MONTHLY_INCOME_OPTIONS = [
  {
    value: "below_10000",
    np_label: "१०,००० भन्दा कम",
    en_label: "Below 10,000",
  },
  {
    value: "10000_20000",
    np_label: "१०,००० - २०,०००",
    en_label: "10,000 - 20,000",
  },
  {
    value: "20001_30000",
    np_label: "२०,००१ - ३०,०००",
    en_label: "20,001 - 30,000",
  },
  {
    value: "30001_40000",
    np_label: "३०,००१ - ४०,०००",
    en_label: "30,001 - 40,000",
  },
  {
    value: "40001_50000",
    np_label: "४०,००१ - ५०,०००",
    en_label: "40,001 - 50,000",
  },
  {
    value: "50001_75000",
    np_label: "५०,००१ - ७५,०००",
    en_label: "50,001 - 75,000",
  },
  {
    value: "75001_100000",
    np_label: "७५,००१ - १,००,०००",
    en_label: "75,001 - 100,000",
  },
  {
    value: "above_100000",
    np_label: "१,००,००० भन्दा बढी",
    en_label: "Above 100,000",
  },
];

export const OCCUPATIONS = [
  "Housewife",
  "Agriculture",
  "Government Job",
  "Private Sector",
  "Business",
  "Student",
  "Unemployed",
  "Other",
];

export const OTHER_OCCUPATION_LABEL = "Other";

export const NEWBORN_CARE_OPTIONS = [
  {
    value: "umbilical_ointment",
    np_label: "नाभी मलम लगाएको",
    en_label: "Applied ointment to the umbilical cord",
  },
  {
    value: "skin_to_skin",
    np_label: "जन्मने बित्तिकै छातीमा टाँसेर राखेको",
    en_label: "Placed the baby on the chest immediately after birth",
  },
  {
    value: "early_breastfeeding",
    np_label: "१ घण्टा भित्र स्तनपान गराएको",
    en_label: "Started breastfeeding within 1 hour",
  },
];

export const BIRTH_PLACE_OPTIONS = [
  {
    value: "home",
    np_label: "घर",
    en_label: "Home",
  },
  {
    value: "institution",
    np_label: "स्वास्थ्य संस्था",
    en_label: "Health Institution",
  },
];

export const CHILD_STATUS_OPTIONS = [
  { value: "alive", np_label: "जीवित", en_label: "Alive" },
  { value: "dead", np_label: "मृत", en_label: "Dead" },
];

export interface FchvCounselingField {
  key: string;
  number: boolean;
  name: boolean;
  en: string;
  ne: string;
}

export const FCHV_COUNSELING: FchvCounselingField[] = [
  {
    key: "adolescent_referred_count",
    number: true,
    name: false,
    en: "Number of adolescents referred to a health facility",
    ne: "स्वास्थ्य संस्थामा प्रेषण गरिएका किशोर-किशोरीको संख्या",
  },
  {
    key: "adolescent_referred_names",
    number: false,
    name: true,
    en: "Names of referred adolescents",
    ne: "प्रेषण गरिएका किशोर-किशोरीहरूको नाम",
  },
  {
    key: "cough_referred_count",
    number: true,
    name: false,
    en: "Number of patients referred for cough lasting 2 weeks or more",
    ne: "२ हप्ता वा सोभन्दा बढी समयदेखि खोकी लागेर प्रेषण गरिएका बिरामीको संख्या",
  },
  {
    key: "cough_referred_names",
    number: false,
    name: true,
    en: "Names of referred patients (cough)",
    ne: "प्रेषण गरिएका खोकीका बिरामीहरूको नाम",
  },

  {
    key: "first_aid_count",
    number: true,
    name: false,
    en: "Number of people who received first aid",
    ne: "प्राथमिक उपचार पाएका व्यक्तिको संख्या",
  },
  {
    key: "first_aid_names",
    number: false,
    name: true,
    en: "Names of people who received first aid",
    ne: "प्राथमिक उपचार पाएका व्यक्तिहरूको नाम",
  },
  {
    key: "first_aid_referred_count",
    number: true,
    name: false,
    en: "Number of patients referred after first aid",
    ne: "प्राथमिक उपचारपछि प्रेषण गरिएका बिरामीको संख्या",
  },
  {
    key: "first_aid_referred_names",
    number: false,
    name: true,
    en: "Names of patients referred after first aid",
    ne: "प्राथमिक उपचारपछि प्रेषण गरिएका बिरामीहरूको नाम",
  },
  {
    key: "child_health_education_count",
    number: true,
    name: false,
    en: "How many people received health education on child health using health education materials",
    ne: "बाल स्वास्थ्य सम्बन्धि स्वास्थ्य शिक्षा सामग्री प्रयोग गरी स्वास्थ्य शिक्षा पाएका संख्या",
  },
  {
    key: "child_health_education_names",
    number: false,
    name: true,
    en: "Names of children who received child health education",
    ne: "बाल स्वास्थ्य शिक्षा पाएका व्यक्तिको नाम",
  },
  {
    key: "ncd_health_education_count",
    number: true,
    name: false,
    en: "Number of people who received health education on NCD risk factors and prevention",
    ne: "नसर्ने रोगका जोखिम र रोकथाम सम्बन्धी स्वास्थ्य शिक्षा पाएका व्यक्तिको संख्या",
  },
  {
    key: "ncd_health_education_names",
    number: false,
    name: true,
    en: "Names of people who received health education",
    ne: "स्वास्थ्य शिक्षा पाएका व्यक्तिहरूको नाम",
  },
  {
    key: "ncd_beneficiaries_count",
    number: true,
    name: false,
    en: "Number of beneficiaries of NCD health education",
    ne: "नसर्ने रोग सम्बन्धी स्वास्थ्य शिक्षाबाट लाभान्वित व्यक्तिको संख्या",
  },
  {
    key: "ncd_beneficiaries_names",
    number: false,
    name: true,
    en: "Names of beneficiaries",
    ne: "लाभान्वित व्यक्तिहरूको नाम",
  },
  {
    key: "tb_referred_count",
    number: true,
    name: false,
    en: "Number of suspected TB patients referred",
    ne: "शंकास्पद क्षयरोगका प्रेषण गरिएका बिरामीको संख्या",
  },
  {
    key: "tb_referred_names",
    number: false,
    name: true,
    en: "Names of referred TB patients",
    ne: "प्रेषण गरिएका शंकास्पद क्षयरोगका बिरामीहरूको नाम",
  },
  {
    key: "leprosy_referred_count",
    number: true,
    name: false,
    en: "Number of suspected leprosy patients referred",
    ne: "शंकास्पद कुष्ठरोगका प्रेषण गरिएका बिरामीको संख्या",
  },
  {
    key: "leprosy_referred_names",
    number: false,
    name: true,
    en: "Names of referred leprosy patients",
    ne: "प्रेषण गरिएका शंकास्पद कुष्ठरोगका बिरामीहरूको नाम",
  },
  {
    key: "ncd_referred_count",
    number: true,
    name: false,
    en: "Number of NCD patients referred",
    ne: "नसर्ने रोगका प्रेषण गरिएका बिरामीको संख्या",
  },
  {
    key: "ncd_referred_names",
    number: false,
    name: true,
    en: "Names of referred NCD patients",
    ne: "प्रेषण गरिएका नसर्ने रोगका बिरामीहरूको नाम",
  },
  {
    key: "mental_health_referred_count",
    number: true,
    name: false,
    en: "Number of patients with mental health problems referred",
    ne: "मानसिक स्वास्थ्य समस्या भई प्रेषण गरिएका बिरामीको संख्या",
  },
  {
    key: "mental_health_referred_names",
    number: false,
    name: true,
    en: "Names of referred patients",
    ne: "प्रेषण गरिएका मानसिक स्वास्थ्यका बिरामीहरूको नाम",
  },
  {
    key: "elderly_referred_count",
    number: true,
    name: false,
    en: "Number of elderly people with health problems referred",
    ne: "स्वास्थ्य समस्या भई प्रेषण गरिएका ज्येष्ठ नागरिकको संख्या",
  },
  {
    key: "elderly_referred_names",
    number: false,
    name: true,
    en: "Names of referred elderly people",
    ne: "प्रेषण गरिएका ज्येष्ठ नागरिकहरूको नाम",
  },
  {
    key: "fchv_fund_amount",
    number: true,
    name: false,
    en: "Amount deposited in FCHV fund (NPR)",
    ne: "म.स्वा.स्व. कोषमा जम्मा भएको रकम (रु.)",
  },
  {
    key: "immunization_cleanliness_sessions",
    number: true,
    name: false,
    en: "Participation in immunization/cleanliness sessions (times)",
    ne: "खोप क्लिनिक वा सरसफाइ सेसनमा सहभागिता (पटक)",
  },
  {
    key: "village_clinic_support",
    number: true,
    name: false,
    en: "Assisted at village clinic (times)",
    ne: "गाउँघर क्लिनिक सञ्चालनमा सहयोग गरेको (पटक)",
  },
  {
    key: "ors_for_above_5_years",
    number: true,
    name: false,
    en: "Number of ORS packets distributed to people aged above 5 years",
    ne: "५ वर्ष भन्दा माथिका मानिसहरूलाई वितरण गरेको पुनर्जलीय झोलको पुरिया (संख्या)",
  },
];

export const NEWBORN_GENDER_OPTIONS = [
  { value: "Male", label_en: "Male", label_ne: "छोरा" },
  { value: "Female", label_en: "Female", label_ne: "छोरी" },
];

export const NEWBORN_STATUS_OPTIONS = [
  { value: "alive", label_en: "Alive", label_ne: "जीवित" },
  { value: "dead", label_en: "Dead", label_ne: "मृत" },
];
