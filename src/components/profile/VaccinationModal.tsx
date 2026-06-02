import { SafeAreaView } from "react-native-safe-area-context";
import { VACCINE_SCHEDULE } from "@/constants/VaccineConstants";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { getChildVaccinations, toggleVaccineStatus } from "@/hooks/database/models/ChildVaccinationModel";
import { updateAllVaccinatedStatus } from "@/hooks/database/models/InfantMonitoringModel";
import { toNepaliNumbers } from "@/utils/dateHelper";
import { Calendar, Check, Syringe, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";

interface VaccinationModalProps {
    visible: boolean;
    onClose: () => void;
    childId: string;
    childName: string;
    onSuccess?: () => void;
}

export default function VaccinationModal({
    visible,
    onClose,
    childId,
    childName,
    onSuccess,
}: VaccinationModalProps) {
    const { language, t } = useLanguage();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [vaccinations, setVaccinations] = useState<Record<string, { is_given: boolean; date: string | null }>>({});
    const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

    const totalVaccinesCount = VACCINE_SCHEDULE.reduce((acc, slot) => acc + slot.vaccines.length, 0);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getChildVaccinations(childId);
            const statusMap: Record<string, { is_given: boolean; date: string | null }> = {};
            data.forEach((v) => {
                statusMap[v.vaccine_id] = {
                    is_given: v.is_given === 1,
                    date: v.given_date
                };
            });
            setVaccinations(statusMap);
        } catch (error) {
            console.error("Failed to load vaccinations:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible, childId]);

    const checkAndUpdateCompletion = async (currentVaccinations: Record<string, { is_given: boolean; date: string | null }>) => {
        const givenCount = Object.values(currentVaccinations).filter(v => v.is_given).length;
        const isCompleted = givenCount === totalVaccinesCount;
        await updateAllVaccinatedStatus(childId, isCompleted);
    };

    const handleToggle = async (vaccineId: string) => {
        const current = vaccinations[vaccineId] || { is_given: false, date: null };
        const newStatus = !current.is_given;
        const newDate = newStatus ? (current.date || new Date().toISOString()) : null;

        // Optimistic update
        const updatedVaccinations = {
            ...vaccinations,
            [vaccineId]: { is_given: newStatus, date: newDate }
        };
        setVaccinations(updatedVaccinations);

        try {
            await toggleVaccineStatus(childId, vaccineId, newStatus, newDate || undefined);
            await checkAndUpdateCompletion(updatedVaccinations);
            showToast(t("common.success") || "Updated successfully");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Failed to update vaccine status:", error);
            showToast(t("common.error") || "Failed to update");
            // Revert on error
            setVaccinations((prev) => ({ ...prev, [vaccineId]: current }));
        }
    };

    const handleDateChange = async (vaccineId: string, bsDate: string) => {
        try {
            const adDate = BsToAd(bsDate);
            const adIso = new Date(adDate).toISOString();

            const updatedVaccinations = {
                ...vaccinations,
                [vaccineId]: { ...vaccinations[vaccineId], date: adIso }
            };
            setVaccinations(updatedVaccinations);

            await toggleVaccineStatus(childId, vaccineId, true, adIso);
            if (onSuccess) onSuccess();
            setShowDatePicker(null);
            showToast(t("common.success") || "Date updated");
        } catch (error) {
            console.error("Failed to update vaccine date:", error);
            showToast(t("common.error") || "Failed to update date");
        }
    };

    const formatDateDisplay = (isoDate: string | null) => {
        if (!isoDate) return "---";
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
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1">
                    {/* Header */}
                    <View className="px-6 pt-6 pb-6 flex-row items-center justify-between border-b border-slate-50">
                        <View className="flex-row items-center">
                            <View className="w-14 h-14 rounded-full bg-[#F1F5F9] items-center justify-center mr-4">
                                <Syringe size={28} color="#475569" strokeWidth={1.5} />
                            </View>
                            <View>
                                <Text className="text-[20px] font-semibold text-slate-800">
                                    {language === "np" ? "खोप विवरण" : "Vaccination Details"}
                                </Text>
                                <Text className="text-[15px] text-slate-500 font-medium capitalize">
                                    {childName}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="bg-[#F1F5F9] p-3 rounded-full"
                        >
                            <X size={24} color="#1E293B" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="#3B82F6" />
                        </View>
                    ) : (
                        <ScrollView
                            className="flex-1 px-6 pt-4"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                        >
                            {VACCINE_SCHEDULE.map((slot, index) => (
                                <View key={index} className="mb-8">
                                    {/* Time label */}
                                    <View className="flex-row items-center mb-5">
                                        <Text className="text-[15px] font-semibold text-slate-400">
                                            {language === "np" ? slot.timeNe : slot.timeEn}
                                        </Text>
                                        <View className="h-[1px] flex-1 bg-slate-100 ml-3" />
                                    </View>

                                    {/* Vaccines in this slot */}
                                    <View className="gap-y-3">
                                        {slot.vaccines.map((v) => {
                                            const status = vaccinations[v.id] || { is_given: false, date: null };
                                            const isTaken = status.is_given;
                                            return (
                                                <View key={v.id} className="bg-gray-50 rounded-xl overflow-hidden border border-slate-100">
                                                    <TouchableOpacity
                                                        onPress={() => handleToggle(v.id)}
                                                        activeOpacity={0.7}
                                                        className="p-4 flex-row items-center justify-between"
                                                    >
                                                        <View className="flex-1 mr-4">
                                                            <Text className="text-[16px] font-semibold text-slate-800 mb-1">
                                                                {language === "np" ? v.ne : v.en}
                                                            </Text>
                                                            <Text className="text-[12px] text-slate-500 font-medium leading-relaxed">
                                                                {language === "np" ? v.protectsNe : v.protectsEn}
                                                            </Text>
                                                        </View>
                                                        <View
                                                            className={`w-8 h-8 rounded-full items-center justify-center ${isTaken ? "bg-emerald-500" : "bg-gray-200"}`}
                                                        >
                                                            {isTaken && <Check size={17} color="white" strokeWidth={3.5} />}
                                                        </View>
                                                    </TouchableOpacity>

                                                    {isTaken && (
                                                        <View className="px-4 pb-4 pt-1 border-t border-slate-100 flex-row items-center justify-between">
                                                            <Text className="text-[13px] text-slate-500 font-medium">
                                                                {language === "np" ? "खोप लगाएको मिति:" : "Date Given:"}
                                                            </Text>
                                                            <Pressable
                                                                onPress={() => setShowDatePicker(v.id)}
                                                                className="flex-row items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                                                            >
                                                                <Calendar size={14} color="#64748B" className="mr-2" />
                                                                <Text className="text-[13px] font-semibold text-slate-700">
                                                                    {formatDateDisplay(status.date)}
                                                                </Text>
                                                            </Pressable>
                                                        </View>
                                                    )}

                                                    {showDatePicker === v.id && (
                                                        <CalendarPicker
                                                            visible={true}
                                                            onClose={() => setShowDatePicker(null)}
                                                            onDateSelect={(date) => handleDateChange(v.id, date)}
                                                            date={status.date ? AdToBs(status.date.split("T")[0]) : AdToBs(new Date().toISOString().split("T")[0])}
                                                            language={language === "np" ? "np" : "en"}
                                                        />
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}
