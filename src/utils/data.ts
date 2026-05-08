export const JATI_CODES = [
  { code: "1", name: "दलित (Dalit)" },
  { code: "2", name: "जनजाति (Janajati)" },
  { code: "3", name: "मधेसी (Madhesi)" },
  { code: "4", name: "मुस्लिम (Muslim)" },
  { code: "5", name: "ब्राह्मण/छेत्री (Brahmin/Chhetri)" },
  { code: "6", name: "अन्य (Other)" },
];

export const EDUCATION_LEVELS = [
  { value: "no_formal", label: "कुनै औपचारिक शिक्षा छैन (No Formal Education)" },
  { value: "primary", label: "प्राथमिक तह – कक्षा १–५ (Primary Level)" },
  { value: "lower_secondary", label: "निम्न माध्यमिक तह – कक्षा ६–८ (Lower Secondary Level)" },
  { value: "secondary", label: "माध्यमिक तह – कक्षा ९–१० (Secondary Level / SEE)" },
  { value: "higher_secondary", label: "उच्च माध्यमिक तह – कक्षा ११–१२ (+2 / Higher Secondary)" },
  { value: "bachelor", label: "स्नातक तह (Bachelor’s Degree)" },
  { value: "master", label: "स्नातकोत्तर तह (Master’s Degree)" },
  { value: "doctoral", label: "विद्यावारिधि तह (Doctoral / PhD)" },
];


export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const EDUCATION_OPTIONS = [
  {
    value: "No formal education",
    labelKey:
      "home.profile.complete-profile.education-options.no-formal-education",
    label: "No formal education"
  },
  {
    value: "Primary",
    labelKey: "home.profile.complete-profile.education-options.primary",
    label: "Primary"
  },
  {
    value: "Secondary",
    labelKey: "home.profile.complete-profile.education-options.secondary",
    label: "Secondary"
  },
  {
    value: "Higher Secondary",
    labelKey: "home.profile.complete-profile.education-options.higher-secondary",
    label: "Higher Secondary"
  },
  {
    value: "Bachelor or above",
    labelKey:
      "home.profile.complete-profile.education-options.bachelor-or-above",
    label: "Bachelor or above"
  }
];

export const MONTHLY_INCOME_OPTIONS = [
  {
    value: "below_10000",
    label: "Below 10,000",
    labelKey: "home.profile.complete-profile.monthly-income-options.below_10000"
  },
  {
    value: "10000_20000",
    label: "10,000 - 20,000",
    labelKey: "home.profile.complete-profile.monthly-income-options.10000_20000"
  },
  {
    value: "20001_30000",
    label: "20,001 - 30,000",
    labelKey: "home.profile.complete-profile.monthly-income-options.20001_30000"
  },
  {
    value: "30001_40000",
    label: "30,001 - 40,000",
    labelKey: "home.profile.complete-profile.monthly-income-options.30001_40000"
  },
  {
    value: "40001_50000",
    label: "40,001 - 50,000",
    labelKey: "home.profile.complete-profile.monthly-income-options.40001_50000"
  },
  {
    value: "50001_75000",
    label: "50,001 - 75,000",
    labelKey: "home.profile.complete-profile.monthly-income-options.50001_75000"
  },
  {
    value: "75001_100000",
    label: "75,001 - 100,000",
    labelKey:
      "home.profile.complete-profile.monthly-income-options.75001_100000"
  },
  {
    value: "above_100000",
    label: "Above 100,000",
    labelKey:
      "home.profile.complete-profile.monthly-income-options.above_100000"
  }
];

export const OCCUPATIONS = [
  "Housewife", "Agriculture", "Government Job", "Private Sector", "Business", "Student", "Unemployed", "Other"
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
  }
];

export const CHILD_STATUS_OPTIONS = [
  { value: "alive", np_label: "जीवित", en_label: "Alive" },
  { value: "dead", np_label: "मृत", en_label: "Dead" }
];