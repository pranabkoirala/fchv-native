import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../assets/i18n/en.json";
import np from "../assets/i18n/np.json";
import storage from "@/utils/storage";

const resources = {
  en: { translation: en },
  np: { translation: np },
};

// Initialize i18n
const initI18n = async () => {
  const savedLanguage = await storage.get<string>("language");

  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources,
    lng: savedLanguage || "np",
    fallbackLng: "np",
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
