import NepaliDate from "nepali-date-converter";

/**
 * Returns the current Nepali year and month as integers.
 * Month is 1-indexed (Baisakh=1, Chaitra=12).
 */
export const getCurrentNepaliDate = (): { year: number; month: number; day: number } => {
    return adToBs(new Date());
};

export const adToBs = (date: Date | string): { year: number; month: number; day: number } => {
    const nd = new NepaliDate(typeof date === 'string' ? new Date(date) : date);
    return {
        year: nd.getYear(),
        month: nd.getMonth() + 1,
        day: nd.getDate(),
    };
};

export const bsToAd = (bsDateStr: string): string => {
    try {
        if (!bsDateStr) return "";
        const nd = new NepaliDate(bsDateStr.replace(/-/g, '/'));
        return nd.toJsDate().toISOString().split('T')[0];
    } catch (e) {
        return bsDateStr;
    }
};

/**
 * Formats a BS date string based on the language.
 * If language is 'np', returns BS date in Nepali numbers.
 * If language is 'en', returns AD date.
 */
export const formatBsDate = (bsDate: string | null | undefined, language: string): string => {
    if (!bsDate || bsDate === "N/A" || bsDate === "-" || bsDate === "---") return "---";
    if (language === "np") return toNepaliNumbers(bsDate);
    return bsToAd(bsDate);
};

/**
 * Formats an AD date string based on the language.
 * If language is 'en', returns AD date.
 * If language is 'np', returns BS date in Nepali numbers.
 */
export const formatAdDate = (adDate: string | null | undefined, language: string): string => {
    if (!adDate || adDate === "N/A" || adDate === "-" || adDate === "---") return "---";
    if (language === "np") {
        try {
            const cleanDate = adDate.includes("T") ? adDate.split("T")[0] : adDate;
            const nd = new NepaliDate(new Date(cleanDate));
            return toNepaliNumbers(nd.format('YYYY-MM-DD'));
        } catch (e) {
            return adDate;
        }
    }
    return adDate.includes("T") ? adDate.split("T")[0] : adDate;
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
export const toNepaliNumbers = (num: number | string): string => {
    const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    return String(num).replace(/[0-9]/g, (match) => nepaliDigits[parseInt(match)]);
};

export type NepaliYearMonth = {
    year: number;
    month: number;
};

export type NepaliTrendBucket = NepaliYearMonth & {
    label: string;
    labelNp: string;
};

const normalizeMonth = (month: number): number | null => {
    if (!Number.isFinite(month)) return null;

    if (month >= 1 && month <= 12) return month;

    return null;
};

export const resolveNepaliYearMonth = (
    regYear?: number | string | null,
    regMonth?: number | string | null,
    createdAt?: string | null,
): NepaliYearMonth | null => {
    const parsedYear = Number(regYear);

    if (regMonth !== null && regMonth !== undefined && regMonth !== "") {
        const monthText = String(regMonth);

        if (monthText.includes("-")) {
            const [yearPart, monthPart] = monthText.split("-");
            const year = Number(yearPart);
            const month = normalizeMonth(Number(monthPart));
            if (Number.isFinite(year) && month) {
                return { year, month };
            }
        }

        const month = normalizeMonth(Number(regMonth));
        if (Number.isFinite(parsedYear) && month) {
            return { year: parsedYear, month };
        }
    }

    if (!createdAt) return null;

    const createdDate = new Date(createdAt);
    if (Number.isNaN(createdDate.getTime())) return null;

    return adToBs(createdDate);
};

export const getRecentNepaliMonthBuckets = (monthCount = 3): NepaliTrendBucket[] => {
    const { year: currentYear, month: currentMonth } = getCurrentNepaliDate();
    const buckets: NepaliTrendBucket[] = [];

    for (let i = monthCount - 1; i >= 0; i--) {
        let month = currentMonth - i;
        let year = currentYear;

        while (month <= 0) {
            month += 12;
            year -= 1;
        }

        buckets.push({
            year,
            month,
            label: NepaliMonthNames[month - 1],
            labelNp: NepaliMonthNamesNp[month - 1],
        });
    }

    return buckets;
};

export const getNepaliMonthKey = ({ year, month }: NepaliYearMonth): string => {
    return `${year}-${String(month).padStart(2, "0")}`;
};

export const getRecentNepaliMonthKeys = (monthCount = 3): string[] => {
    return getRecentNepaliMonthBuckets(monthCount).map(getNepaliMonthKey);
};

