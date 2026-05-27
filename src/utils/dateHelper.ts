import NepaliDate from "nepali-date-converter";

/**
 * Returns the current Nepali year and month as integers.
 * Month is 1-indexed (Baisakh=1, Chaitra=12).
 */
export const getCurrentNepaliDate = (): { year: number; month: number } => {
    const now = new NepaliDate();
    return {
        year: now.getYear(),
        month: now.getMonth() + 1, // getMonth() is 0-indexed
    };
};

/** @deprecated Use getCurrentNepaliDate() instead */
export const getCurrentNepaliMonth = (): string => {
    const { year, month } = getCurrentNepaliDate();
    return `${year}-${month.toString().padStart(2, '0')}`;
};

export const NepaliMonthNames = [
    "Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

export const NepaliMonthNamesNp = [
    "बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "असोज",
    "कार्तिक", "मंसिर", "पौष", "माघ", "फाल्गुन", "चैत्र"
];

export const getNepaliMonthName = (monthIndex: number): string => {
    return NepaliMonthNames[monthIndex - 1] || "";
};

export const getNepaliMonthNameNp = (monthIndex: number): string => {
    return NepaliMonthNamesNp[monthIndex - 1] || "";
};
