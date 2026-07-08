import { VACCINE_SCHEDULE } from "@/constants/VaccineConstants";
import { useLanguage } from "@/context/LanguageContext";
import { getChildVaccinations } from "@/hooks/database/models/ChildVaccinationModel";
import { toNepaliNumbers } from "@/utils/dateHelper";
import { useFocusEffect } from "expo-router";
import { Calendar, Syringe } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import VaccinationListModal from "./VaccinationListModal";
import VaccinationModal from "./VaccinationModal";

interface VaccinationSectionProps {
    childId: string;
    childName: string;
    dateOfBirth?: string;
    disabled?: boolean;
}

export default function VaccinationSection({ childId, childName, dateOfBirth, disabled }: VaccinationSectionProps) {
    const { language, t } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);
    const [listModalVisible, setListModalVisible] = useState(false);
    const [takenVaccines, setTakenVaccines] = useState<any[]>([]);

    const takenCount = takenVaccines.length;
    const totalVaccines = VACCINE_SCHEDULE.reduce((acc, slot) => acc + slot.vaccines.length, 0);

    const isFullyVaccinated = takenCount === totalVaccines && totalVaccines > 0;
    const isEntryDisabled = isFullyVaccinated || disabled;

    const loadTakenData = async () => {
        try {
            const data = await getChildVaccinations(childId);
            const taken = data.filter(v => v.is_given === 1);

            // Enrich with schedule info
            const enriched = taken.map(tv => {
                let found: any = {};
                VACCINE_SCHEDULE.forEach(slot => {
                    const match = slot.vaccines.find(v => v.id === tv.vaccine_id);
                    if (match) found = match;
                });
                return { ...tv, ...found };
            });

            setTakenVaccines(enriched);
        } catch (error) {
            console.error("Failed to load taken vaccines:", error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadTakenData();
        }, [childId])
    );

    const formatDate = (isoDate: string | null) => {
        if (!isoDate) return "";
        try {
            const date = isoDate.split("T")[0];
            const bsDate = AdToBs(date);
            return language === "np" ? toNepaliNumbers(bsDate) : bsDate;
        } catch (e) {
            return isoDate.split("T")[0];
        }
    };

    return (
        <View className="mb-4">

            <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                }}
            >
                {/* Header with progress */}
                <View className="px-5 pt-5 pb-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3">
                                <Syringe size={20} color="#475569" strokeWidth={2} />
                            </View>
                            <View>
                                <Text className="text-[17px] font-bold text-slate-800">
                                    {t("child_profile.vaccination.title")}
                                </Text>
                                <Text className="text-[12px] text-slate-500 font-medium mt-0.5">
                                    {takenCount > 0
                                        ? t("child_profile.vaccination.vaccines_taken", {
                                            taken: language === "np" ? toNepaliNumbers(takenCount) : String(takenCount),
                                            total: language === "np" ? toNepaliNumbers(totalVaccines) : String(totalVaccines),
                                          })
                                        : t("child_profile.vaccination.no_vaccinations")
                                    }
                                </Text>
                            </View>
                        </View>
                        {isFullyVaccinated && (
                            <View className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex-row items-center">
                                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                                <Text className="text-emerald-700 font-bold text-[11px]">
                                    {t("child_profile.vaccination.fully_vaccinated")}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Progress bar */}
                    <View className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <View
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${totalVaccines > 0 ? (takenCount / totalVaccines) * 100 : 0}%` }}
                        />
                    </View>
                </View>

                {/* Taken vaccines list */}
                {takenCount > 0 && (
                    <View className="px-5 pb-4 gap-y-2">
                        {takenVaccines.slice(0, 3).map((v, idx) => (
                            <View key={idx} className="bg-[#F8FAFC] px-4 py-3 rounded-xl border border-slate-100">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1 mr-2">
                                        <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5" />
                                        <Text className="text-slate-800 font-bold text-[14px] flex-1">
                                            {language === 'np' ? v.ne : v.en}
                                        </Text>
                                        <View className="bg-emerald-100 px-2 py-0.5 rounded-md ml-2">
                                            <Text className="text-emerald-700 font-bold text-[9px] uppercase tracking-tight">
                                                {language === 'np' ? v.timeNe : v.timeEn}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="w-5 h-5 rounded-full bg-emerald-500 items-center justify-center ml-2">
                                        <Syringe size={10} color="white" />
                                    </View>
                                </View>
                                {v.given_date && (
                                    <View className="flex-row items-center mt-2 ml-4.5">
                                        <Calendar size={10} color="#94A3B8" />
                                        <Text className="text-slate-400 text-[11px] ml-1.5 font-medium">
                                            {t("child_profile.vaccination.date_label")} {language === 'en' ? v.given_date.split('T')[0] : formatDate(v.given_date)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {takenCount > 3 && (
                            <TouchableOpacity
                                onPress={() => setListModalVisible(true)}
                                activeOpacity={0.7}
                                className="flex-row items-center justify-center py-2.5"
                            >
                                <Text className="text-slate-500 font-semibold text-[13px]">
                                    {t("child_profile.vaccination.show_all", {
                                        count: language === "np" ? toNepaliNumbers(takenCount) : String(takenCount),
                                    })}
                                </Text>
                                <Text className="text-slate-400 ml-1 text-[16px]">{">"}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Empty state */}
                {takenCount === 0 && (
                    <View className="px-5 pb-6 items-center">
                        <View className="w-14 h-14 rounded-2xl bg-[#F1F5F9] items-center justify-center mb-3">
                            <Syringe size={26} color="#94A3B8" strokeWidth={1.5} />
                        </View>
                        <Text className="text-slate-400 text-[13px] font-medium text-center">
                            {t("child_profile.vaccination.no_vaccinations_yet")}
                        </Text>
                    </View>
                )}

                {/* Action button */}
                <View className="px-5 pb-5">
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.8}
                        disabled={isEntryDisabled}
                        className={`${isEntryDisabled ? "bg-slate-100" : "bg-[#475569]"} py-3.5 rounded-xl flex-row items-center justify-center`}
                    >
                        <Syringe size={18} color={isEntryDisabled ? "#94A3B8" : "white"} strokeWidth={2.5} />
                        <Text className={`${isEntryDisabled ? "text-slate-400" : "text-white"} font-bold ml-2 text-[15px]`}>
                            {isFullyVaccinated
                                ? t("child_profile.vaccination.all_taken")
                                : t("child_profile.vaccination.add_vaccination")
                            }
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <VaccinationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                childId={childId}
                childName={childName}
                childDateOfBirth={dateOfBirth}
                onSuccess={loadTakenData}
            />

            <VaccinationListModal
                visible={listModalVisible}
                onClose={() => setListModalVisible(false)}
                takenVaccines={takenVaccines}
                childName={childName}
            />
        </View>
    );
}
