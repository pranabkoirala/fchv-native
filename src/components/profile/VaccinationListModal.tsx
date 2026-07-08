import { useLanguage } from "@/context/LanguageContext";
import { toNepaliNumbers } from "@/utils/dateHelper";
import { Calendar, Syringe, X } from "lucide-react-native";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

interface VaccinationListModalProps {
    visible: boolean;
    onClose: () => void;
    takenVaccines: any[];
    childName: string;
}

export default function VaccinationListModal({
    visible,
    onClose,
    takenVaccines,
    childName,
}: VaccinationListModalProps) {
    const { language, t } = useLanguage();

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
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-[#F8FAFC]">
                <View className="flex-1">
                    {/* Header */}
                    <View className="px-5 pt-5 pb-4 bg-white border-b border-slate-100">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 rounded-2xl bg-[#F1F5F9] items-center justify-center mr-3">
                                    <Syringe size={24} color="#475569" strokeWidth={1.5} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-slate-800">
                                        {t("child_profile.vaccination.vaccine_list")}
                                    </Text>
                                    <Text className="text-[13px] text-slate-500 font-medium capitalize">
                                        {childName}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                className="bg-[#F1F5F9] p-2.5 rounded-full"
                            >
                                <X size={20} color="#1E293B" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Scrollable list of vaccines */}
                    <ScrollView
                        className="flex-1 px-5 pt-5"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        <View className="gap-y-2.5">
                            {takenVaccines.map((v, idx) => (
                                <View key={idx} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                    {/* Left accent bar */}
                                    <View className="w-full pb-4">
                                        <View className="flex-row items-center justify-between px-4 pt-4">
                                            <View className="flex-row items-center flex-1 mr-2">
                                                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2.5" />
                                                <Text className="text-slate-800 font-bold text-[15px] flex-1">
                                                    {language === 'np' ? v.ne : v.en}
                                                </Text>
                                                <View className="bg-emerald-100 px-2 py-0.5 rounded-md ml-2">
                                                    <Text className="text-emerald-700 font-bold text-[9px] uppercase tracking-tight">
                                                        {language === 'np' ? v.timeNe : v.timeEn}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center ml-2">
                                                <Syringe size={12} color="white" />
                                            </View>
                                        </View>

                                        {v.protectsEn && (
                                            <Text className="text-[12px] text-slate-500 font-medium leading-relaxed px-4 mt-1">
                                                {language === "np" ? v.protectsNe : v.protectsEn}
                                            </Text>
                                        )}

                                        {v.given_date && (
                                            <View className="flex-row items-center px-4 pt-2">
                                                <Calendar size={11} color="#94A3B8" />
                                                <Text className="text-slate-400 text-[11px] ml-1.5 font-semibold">
                                                    {t("child_profile.vaccination.date_label")} {language === 'en' ? v.given_date.split('T')[0] : formatDate(v.given_date)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
