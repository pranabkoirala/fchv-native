export interface Vaccine {
  id: string;
  ne: string;
  en: string;
  timeEn: string;
  timeNe: string;
  protectsEn?: string;
  protectsNe?: string;
}

export interface VaccineSchedule {
  timeEn: string;
  timeNe: string;
  minAgeDays: number;
  vaccines: Vaccine[];
}

export const VACCINE_SCHEDULE: VaccineSchedule[] = [
  {
    timeEn: "At birth",
    timeNe: "जन्मने बित्तिकै",
    minAgeDays: 0,
    vaccines: [
      {
        id: "bcg",
        ne: "बि.सि.जी.",
        en: "BCG",
        timeEn: "At birth",
        timeNe: "जन्मने बित्तिकै",
        protectsEn: "Tuberculosis",
        protectsNe: "क्षयरोग",
      },
    ],
  },
  {
    timeEn: "6 weeks",
    timeNe: "६ हप्ताको",
    minAgeDays: 42,
    vaccines: [
      {
        id: "rota_1",
        ne: "रोटा (पहिलो मात्रा)",
        en: "Rota (1st dose)",
        timeEn: "6 weeks",
        timeNe: "६ हप्तामा",
        protectsEn: "Diarrhea caused by Rotavirus",
        protectsNe: "रोटा भाइरसबाट हुने झाडापखाला",
      },
      {
        id: "polio_1",
        ne: "पोलियो (पहिलो मात्रा)",
        en: "Polio (1st dose)",
        timeEn: "6 weeks",
        timeNe: "६ हप्तामा",
        protectsEn: "Polio",
        protectsNe: "पोलियो",
      },
      {
        id: "pcv_1",
        ne: "पि.सि.भी. (पहिलो मात्रा)",
        en: "PCV (1st dose)",
        timeEn: "6 weeks",
        timeNe: "६ हप्तामा",
        protectsEn: "Pneumonia",
        protectsNe: "निमोनिया",
      },
      {
        id: "dpt_hepb_hib_1",
        ne: "डि.पि.टी. हेप-बी हिब (पहिलो मात्रा)",
        en: "DPT-HepB-Hib (1st dose)",
        timeEn: "6 weeks",
        timeNe: "६ हप्तामा",
        protectsEn: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib",
        protectsNe:
          "भ्यागुते रोग, लहरे खोकी, धनुष्टंकार, हेपाटाइटिस-बी, हेमोफिलस इन्फ्लुएन्जा बी",
      },
    ],
  },
  {
    timeEn: "10 weeks",
    timeNe: "१० हप्ताको",
    minAgeDays: 70,
    vaccines: [
      {
        id: "rota_2",
        ne: "रोटा (दोस्रो मात्रा)",
        en: "Rota (2nd dose)",
        timeEn: "10 weeks",
        timeNe: "१० हप्तामा",
        protectsEn: "Diarrhea caused by Rotavirus",
        protectsNe: "रोटा भाइरसबाट हुने झाडापखाला",
      },
      {
        id: "polio_2",
        ne: "पोलियो (दोस्रो मात्रा)",
        en: "Polio (2nd dose)",
        timeEn: "10 weeks",
        timeNe: "१० हप्तामा",
        protectsEn: "Polio",
        protectsNe: "पोलियो",
      },
      {
        id: "pcv_2",
        ne: "पि.सि.भी. (दोस्रो मात्रा)",
        en: "PCV (2nd dose)",
        timeEn: "10 weeks",
        timeNe: "१० हप्तामा",
        protectsEn: "Pneumonia",
        protectsNe: "निमोनिया",
      },
      {
        id: "dpt_hepb_hib_2",
        ne: "डि.पि.टी. हेप-बी हिब (दोस्रो मात्रा)",
        en: "DPT-HepB-Hib (2nd dose)",
        timeEn: "10 weeks",
        timeNe: "१० हप्तामा",
        protectsEn: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib",
        protectsNe:
          "भ्यागुते रोग, लहरे खोकी, धनुष्टंकार, हेपाटाइटिस-बी, हेमोफिलस इन्फ्लुएन्जा बी",
      },
    ],
  },
  {
    timeEn: "14 weeks",
    timeNe: "१४ हप्ताको",
    minAgeDays: 98,
    vaccines: [
      {
        id: "polio_3",
        ne: "पोलियो (तेस्रो मात्रा)",
        en: "Polio (3rd dose)",
        timeEn: "14 weeks",
        timeNe: "१४ हप्तामा",
        protectsEn: "Polio",
        protectsNe: "पोलियो",
      },
      {
        id: "fipv_1",
        ne: "एफ.आई.पि.भी. (पहिलो मात्रा)",
        en: "fIPV (1st dose)",
        timeEn: "14 weeks",
        timeNe: "१४ हप्तामा",
        protectsEn: "Polio",
        protectsNe: "पोलियो",
      },
      {
        id: "dpt_hepb_hib_3",
        ne: "डि.पि.टी. हेप-बी हिब (तेस्रो मात्रा)",
        en: "DPT-HepB-Hib (3rd dose)",
        timeEn: "14 weeks",
        timeNe: "१४ हप्तामा",
        protectsEn: "Diphtheria, Pertussis, Tetanus, Hepatitis B, Hib",
        protectsNe:
          "भ्यागुते रोग, लहरे खोकी, धनुष्टंकार, हेपाटाइटिस-बी, हेमोफिलस इन्फ्लुएन्जा बी",
      },
    ],
  },
  {
    timeEn: "9 months",
    timeNe: "९ महिनाको",
    minAgeDays: 274,
    vaccines: [
      {
        id: "mr_1",
        ne: "दादुरा-रुबेला (पहिलो मात्रा)",
        en: "Measles-Rubella (1st dose)",
        timeEn: "9 months",
        timeNe: "९ महिनामा",
        protectsEn: "Measles and Rubella",
        protectsNe: "दादुरा र रुबेला",
      },
      {
        id: "fipv_2",
        ne: "एफ.आई.पि.भी. (दोस्रो मात्रा)",
        en: "fIPV (2nd dose)",
        timeEn: "9 months",
        timeNe: "९ महिनामा",
        protectsEn: "Polio",
        protectsNe: "पोलियो",
      },
      {
        id: "pcv_3",
        ne: "पि.सि.भी. (तेस्रो मात्रा)",
        en: "PCV (3rd dose)",
        timeEn: "9 months",
        timeNe: "९ महिनामा",
        protectsEn: "Pneumonia",
        protectsNe: "निमोनिया",
      },
    ],
  },
  {
    timeEn: "12 months",
    timeNe: "१२ महिनाको",
    minAgeDays: 365,
    vaccines: [
      {
        id: "je",
        ne: "जापानिज इन्सेफलाइटिस",
        en: "Japanese Encephalitis",
        timeEn: "12 months",
        timeNe: "१२ महिनामा",
        protectsEn: "Japanese Encephalitis",
        protectsNe: "जापानिज इन्सेफलाईटिस",
      },
    ],
  },
  {
    timeEn: "15 months",
    timeNe: "१५ महिनाको",
    minAgeDays: 456,
    vaccines: [
      {
        id: "mr_2",
        ne: "दादुरा-रुबेला (दोस्रो मात्रा)",
        en: "Measles-Rubella (2nd dose)",
        timeEn: "15 months",
        timeNe: "१५ महिनामा",
        protectsEn: "Measles and Rubella",
        protectsNe: "दादुरा र रुबेला",
      },
      {
        id: "typhoid",
        ne: "टाइफाईड",
        en: "Typhoid",
        timeEn: "15 months",
        timeNe: "१५ महिनामा",
        protectsEn: "Typhoid",
        protectsNe: "टाइफाईड",
      },
    ],
  },
];
