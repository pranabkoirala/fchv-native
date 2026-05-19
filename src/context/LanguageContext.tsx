import storage from "@/utils/storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useTranslation as useI18nTranslation } from "react-i18next";
import "../i18n/config";

type Language = "en" | "np";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { t, i18n } = useI18nTranslation();
  const [language, setLanguageState] = useState<Language>("np");

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await storage.get<Language>("language");
      const initialLang = savedLanguage || "np";
      await i18n.changeLanguage(initialLang);
      setLanguageState(initialLang);
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    await storage.set("language", lang);
    await i18n.changeLanguage(lang);
    setLanguageState(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
