import { VACCINE_SCHEDULE } from "@/constants/VaccineConstants";
import { useLanguage } from "@/context/LanguageContext";
import { getChildVaccinations } from "@/hooks/database/models/ChildVaccinationModel";
import { toNepaliNumbers } from "@/utils/dateHelper";
import { useFocusEffect } from "expo-router";
import { Calendar, Syringe } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import VaccinationModal from "./VaccinationModal";

interface VaccinationSectionProps {
    childId: string;
    childName: string;
    disabled?: boolean;
}

export default function VaccinationSection({ childId, childName, disabled }: VaccinationSectionProps) {
    const { language } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);
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

            <View className="bg-white p-6 rounded-2xl border border-slate-100">
                <View className="flex-row items-center mb-3 ml-1">
                    <Syringe size={20} color="#475569" strokeWidth={2.5} />
                    <Text className="text-slate-800 font-semibold text-xl ml-2">
                        {language === "np" ? "खोप विवरण" : "Vaccination Details"}
                    </Text>
                </View>
                <View className="mb-5 flex-row items-center justify-between">
                    <View>
                        <Text className="text-slate-600 text-[15px] font-semibold mb-1">
                            {takenCount > 0
                                ? (language === "np"
                                    ? `${toNepaliNumbers(takenCount)}/${toNepaliNumbers(totalVaccines)} खोप लगाइएको छ`
                                    : `${takenCount}/${totalVaccines} vaccines taken`)
                                : (language === "np" ? "खोप रेकर्ड गरिएको छैन" : "No vaccinations recorded")
                            }
                        </Text>
                        <View className="w-16 h-1 bg-emerald-500 rounded-full" />
                    </View>
                    {takenCount === totalVaccines && totalVaccines > 0 && (
                        <View className="bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                            <Text className="text-emerald-700 font-bold text-[12px]">
                                {language === "np" ? "पूर्ण खोप" : "Fully Vaccinated"}
                            </Text>
                        </View>
                    )}
                </View>

                {takenCount > 0 && (
                    <View className="w-full mb-6 gap-y-2">
                        {takenVaccines.map((v, idx) => (
                            <View key={idx} className="bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100/50">
                                <View className="flex-row items-center justify-between mb-1.5">
                                    <View className="flex-row items-center flex-1 mr-2">
                                        <Text className="text-slate-800 font-bold text-[14px]">
                                            {language === 'np' ? v.ne : v.en}
                                        </Text>
                                        <View className="bg-emerald-100 px-1.5 py-0.5 rounded ml-2">
                                            <Text className="text-emerald-700 font-bold text-[8px] uppercase tracking-tighter">
                                                {language === 'np' ? v.timeNe : v.timeEn}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="w-5 h-5 rounded-full bg-emerald-500 items-center justify-center">
                                        <Syringe size={10} color="white" />
                                    </View>
                                </View>
                                {v.given_date && (
                                    <View className="flex-row items-center">
                                        <Calendar size={10} color="#64748B" />
                                        <Text className="text-slate-500 text-[11px] ml-1 font-medium">
                                            {language === 'np' ? "मिति:" : "Date:"} {language === 'en' ? v.given_date.split('T')[0] : formatDate(v.given_date)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {takenCount === 0 && (
                    <Text className="text-slate-400 text-[14px] font-medium mb-6 text-center">
                        {language === "np" ? "अहिलेसम्म कुनै खोप रेकर्ड गरिएको छैन।" : "No vaccinations recorded yet."}
                    </Text>
                )}

                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                    disabled={isEntryDisabled}
                    className={`${isEntryDisabled ? "bg-slate-200" : "bg-[#475569]"} px-6 py-3 rounded-full flex-row items-center justify-center`}
                >
                    <Syringe size={18} color={isEntryDisabled ? "#94a3b8" : "white"} strokeWidth={2.5} />
                    <Text className={`${isEntryDisabled ? "text-slate-400" : "text-white"} font-bold ml-2 text-[15px]`}>
                        {isFullyVaccinated
                            ? (language === "np" ? "सबै खोप पुरा भयो" : "All Vaccines Taken")
                            : (language === "np" ? "खोप थप्नुहोस्" : "Add Vaccination")
                        }
                    </Text>
                </TouchableOpacity>
            </View>

            <VaccinationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                childId={childId}
                childName={childName}
                onSuccess={loadTakenData}
            />
        </View>
    );
}
