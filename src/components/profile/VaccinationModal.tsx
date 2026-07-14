import { VACCINE_SCHEDULE } from "@/constants/VaccineConstants";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import {
  getChildVaccinations,
  toggleVaccineStatus,
} from "@/hooks/database/models/ChildVaccinationModel";
import { updateAllVaccinatedStatus } from "@/hooks/database/models/InfantMonitoringModel";
import { toNepaliNumbers } from "@/utils/dateHelper";
import { Calendar, Check, Syringe, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

interface VaccinationModalProps {
  visible: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
  childDateOfBirth?: string;
  onSuccess?: () => void;
}

export default function VaccinationModal({
  visible,
  onClose,
  childId,
  childName,
  childDateOfBirth,
  onSuccess,
}: VaccinationModalProps) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vaccinations, setVaccinations] = useState<
    Record<string, { is_given: boolean; date: string | null }>
  >({});
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);

  const totalVaccinesCount = VACCINE_SCHEDULE.reduce(
    (acc, slot) => acc + slot.vaccines.length,
    0,
  );

  const givenCount = Object.values(vaccinations).filter(
    (v) => v.is_given,
  ).length;

  const getChildAgeInDays = (): number | null => {
    if (!childDateOfBirth) return null;
    let dobAd = childDateOfBirth;
    const [dobYear] = childDateOfBirth.split("-").map(Number);
    if (dobYear >= 2070) {
      try {
        dobAd = BsToAd(childDateOfBirth);
      } catch (e) {}
    }
    const dob = new Date(dobAd);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    const diff = now.getTime() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const childAgeInDays = getChildAgeInDays();

  const isSlotEligible = (minAgeDays: number): boolean => {
    if (childAgeInDays === null) return true;
    return childAgeInDays >= minAgeDays;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getChildVaccinations(childId);
      const statusMap: Record<
        string,
        { is_given: boolean; date: string | null }
      > = {};
      data.forEach((v) => {
        statusMap[v.vaccine_id] = {
          is_given: v.is_given === 1,
          date: v.given_date,
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

  const checkAndUpdateCompletion = async (
    currentVaccinations: Record<
      string,
      { is_given: boolean; date: string | null }
    >,
  ) => {
    const givenCount = Object.values(currentVaccinations).filter(
      (v) => v.is_given,
    ).length;
    const isCompleted = givenCount === totalVaccinesCount;
    await updateAllVaccinatedStatus(childId, isCompleted);
  };

  const handleToggle = async (vaccineId: string) => {
    const current = vaccinations[vaccineId] || { is_given: false, date: null };
    const newStatus = !current.is_given;

    const today = new Date();
    const todayAd = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayBs = AdToBs(todayAd);
    const newDate = newStatus ? current.date || todayBs : null;

    // Optimistic update
    const updatedVaccinations = {
      ...vaccinations,
      [vaccineId]: { is_given: newStatus, date: newDate },
    };
    setVaccinations(updatedVaccinations);

    try {
      await toggleVaccineStatus(
        childId,
        vaccineId,
        newStatus,
        newDate || undefined,
      );
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
      const updatedVaccinations = {
        ...vaccinations,
        [vaccineId]: { ...vaccinations[vaccineId], date: bsDate },
      };
      setVaccinations(updatedVaccinations);

      await toggleVaccineStatus(childId, vaccineId, true, bsDate);
      if (onSuccess) onSuccess();
      setShowDatePicker(null);
      showToast(t("common.success") || "Date updated");
    } catch (error) {
      console.error("Failed to update vaccine date:", error);
      showToast(t("common.error") || "Failed to update date");
    }
  };

  const toBsDateString = (value: string | null): string | null => {
    if (!value) return null;
    const datePart = value.split("T")[0];
    const [y] = datePart.split("-").map(Number);
    if (y >= 2070) return datePart; // already BS
    try {
      return AdToBs(datePart); // AD -> BS
    } catch (e) {
      return datePart;
    }
  };

  const formatDateDisplay = (isoDate: string | null) => {
    const bs = toBsDateString(isoDate);
    if (!bs) return "---";
    return language === "np" ? toNepaliNumbers(bs) : bs;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#fff]">
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
                    {t("child_profile.vaccination.title")}
                  </Text>
                  <Text className="text-[13px] text-slate-500 font-medium capitalize">
                    {childName}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="bg-[#F1F5F9] px-3 py-1.5 rounded-full">
                  <Text className="text-[13px] font-bold text-slate-600">
                    {language === "np"
                      ? `${toNepaliNumbers(givenCount)}/${toNepaliNumbers(totalVaccinesCount)}`
                      : `${givenCount}/${totalVaccinesCount}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  className="bg-[#F1F5F9] p-2.5 rounded-full"
                >
                  <X size={20} color="#1E293B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#475569" />
            </View>
          ) : (
            <ScrollView
              className="flex-1 px-5 pt-5"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {VACCINE_SCHEDULE.map((slot, index) => {
                const eligible = isSlotEligible(slot.minAgeDays);
                return (
                  <View key={index} className="mb-7">
                    {/* Time label as a pill badge */}
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`px-3 py-1 rounded-full ${eligible ? "bg-emerald-50" : "bg-slate-100"}`}
                      >
                        <Text
                          className={`text-[12px] font-bold tracking-wide ${eligible ? "text-emerald-700" : "text-slate-400"}`}
                        >
                          {language === "np" ? slot.timeNe : slot.timeEn}
                        </Text>
                      </View>
                      {!eligible && (
                        <View className="ml-2 flex-row items-center">
                          <Text className="text-[11px] text-slate-400 italic">
                            {t("child_profile.vaccination.not_old_enough", {
                              time:
                                language === "np" ? slot.timeNe : slot.timeEn,
                            })}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Vaccines in this slot */}
                    <View className="gap-y-2.5">
                      {slot.vaccines.map((v) => {
                        const status = vaccinations[v.id] || {
                          is_given: false,
                          date: null,
                        };
                        const isTaken = status.is_given;
                        const canToggle = eligible || isTaken;
                        return (
                          <View
                            key={v.id}
                            className={`bg-white rounded-2xl overflow-hidden border ${isTaken ? "border-emerald-200" : eligible ? "border-slate-200" : "border-slate-100"}`}
                          >
                            <TouchableOpacity
                              onPress={() => canToggle && handleToggle(v.id)}
                              activeOpacity={canToggle ? 0.7 : 1}
                              className={`p-4 flex-row items-center justify-between ${!eligible && !isTaken ? "opacity-40" : ""}`}
                              disabled={!canToggle}
                            >
                              <View className="flex-1 mr-3">
                                <View className="flex-row items-center">
                                  <Text className="text-[15px] font-bold text-slate-800">
                                    {language === "np" ? v.ne : v.en}
                                  </Text>
                                </View>
                                <Text className="text-[11px] text-slate-500 italic mt-0.5 leading-relaxed">
                                  {language === "np"
                                    ? v.protectsNe
                                    : v.protectsEn}
                                </Text>
                              </View>

                              <View
                                className={`w-9 h-9 rounded-full items-center justify-center border-2 ${isTaken ? "bg-emerald-500 border-emerald-500" : eligible ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50"}`}
                              >
                                {isTaken ? (
                                  <Check
                                    size={18}
                                    color="white"
                                    strokeWidth={3.5}
                                  />
                                ) : eligible ? (
                                  <View className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                                ) : null}
                              </View>
                            </TouchableOpacity>

                            {isTaken && (
                              <View className="px-4 pb-3.5 flex-row items-center justify-between">
                                <Text className="text-[12px] text-slate-500 font-medium">
                                  {t("child_profile.vaccination.date_given")}
                                </Text>
                                <Pressable
                                  onPress={() => setShowDatePicker(v.id)}
                                  className="flex-row items-center bg-[#F1F5F9] px-3 py-1.5 rounded-lg"
                                >
                                  <Calendar size={13} color="#64748B" />
                                  <Text className="text-[12px] font-bold text-slate-700 ml-1.5">
                                    {formatDateDisplay(status.date)}
                                  </Text>
                                </Pressable>
                              </View>
                            )}

                            {showDatePicker === v.id &&
                              (() => {
                                const today = new Date();
                                const todayAd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                                const maxDateBs = AdToBs(todayAd);
                                return (
                                  <CalendarPicker
                                    visible={true}
                                    onClose={() => setShowDatePicker(null)}
                                    onDateSelect={(date) =>
                                      handleDateChange(v.id, date)
                                    }
                                    date={
                                      status.date
                                        ? toBsDateString(status.date) ?? AdToBs(todayAd)
                                        : AdToBs(todayAd)
                                    }
                                    language={language === "np" ? "np" : "en"}
                                    maxDate={maxDateBs}
                                  />
                                );
                              })()}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
