import { useLanguage } from "@/context/LanguageContext";
import {
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Stethoscope,
  X,
} from "lucide-react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VisitStoreType } from "../../hooks/database/types/visitModal";
import { toNepaliNumbers } from "../../utils/dateHelper";

interface ANCModalProps {
  visible: boolean;
  onClose: () => void;
  ancVisits: VisitStoreType[];
  record: {
    checkup_12: number | null;
    checkup_20: number | null;
    checkup_26: number | null;
    checkup_30: number | null;
    checkup_34: number | null;
    checkup_36: number | null;
    checkup_38: number | null;
    checkup_40: number | null;
    checkup_other: string | null;
  };
}

const ANC_SCHEDULE = [
  { key: "wk12", field: "checkup_12", week: 12 },
  { key: "wk20", field: "checkup_20", week: 20 },
  { key: "wk26", field: "checkup_26", week: 26 },
  { key: "wk30", field: "checkup_30", week: 30 },
  { key: "wk34", field: "checkup_34", week: 34 },
  { key: "wk36", field: "checkup_36", week: 36 },
  { key: "wk38", field: "checkup_38", week: 38 },
  { key: "wk40", field: "checkup_40", week: 40 },
] as const;

export default function ANCModal({
  visible,
  onClose,
  ancVisits,
  record,
}: ANCModalProps) {
  const { language, t } = useLanguage();

  const toDisplay = (value: string | number) =>
    language === "np" ? toNepaliNumbers(value) : String(value);

  const completedCount = ANC_SCHEDULE.filter(
    (s) => record[s.field as keyof typeof record]
  ).length;
  const totalCount = ANC_SCHEDULE.length;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-blue-50 items-center justify-center mr-3">
              <Stethoscope size={18} color="#2563EB" />
            </View>
            <View>
              <Text className="text-slate-800 text-xl font-bold">
                {t("profile.anc.title")}
              </Text>
              <Text className="text-slate-500 text-[13px] mt-0.5">
                {t("anc_modal.subtitle")}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="bg-slate-50 p-2.5 rounded-full border border-slate-100"
          >
            <X size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Summary Card */}
          <View className="mx-5 mt-5 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/60">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                  <CheckCircle size={20} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-slate-800 text-[16px] font-bold">
                    {t("anc_modal.progress")}
                  </Text>
                  <Text className="text-slate-500 text-[13px] mt-0.5">
                    {t("anc_modal.completed_of", {
                      completed: toDisplay(completedCount),
                      total: toDisplay(totalCount),
                    })}
                  </Text>
                </View>
              </View>
              <View className="bg-white px-3 py-1.5 rounded-full border border-blue-200">
                <Text className="text-blue-700 font-bold text-[14px]">
                  {toDisplay(completedCount)}/{toDisplay(totalCount)}
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* ANC Visit Cards */}
          <View className="px-5 mt-6">
            <Text className="text-slate-700 font-bold text-[16px] mb-4">
              {t("anc_modal.schedule")}
            </Text>

            <View className="gap-y-3">
              {ANC_SCHEDULE.map((schedule, index) => {
                const isCompleted = !!record[schedule.field as keyof typeof record];
                const visitData = ancVisits[index] || null;

                return (
                  <View
                    key={schedule.key}
                    className={`p-4 rounded-xl border flex-row items-center ${isCompleted
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-white border-slate-150"
                      }`}
                  >
                    {/* Status Icon */}
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isCompleted ? "bg-emerald-100" : "bg-slate-100"
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={20} color="#059669" />
                      ) : (
                        <Circle size={20} color="#94A3B8" />
                      )}
                    </View>

                    {/* Visit Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`text-[15px] font-semibold ${isCompleted ? "text-emerald-800" : "text-slate-700"
                            }`}
                        >
                          {t(`profile.anc.${schedule.key}`)}
                        </Text>
                        <View
                          className={`px-2.5 py-1 rounded-full ${isCompleted ? "bg-emerald-100" : "bg-slate-100"
                            }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${isCompleted
                                ? "text-emerald-700"
                                : "text-slate-500"
                              }`}
                          >
                            {isCompleted
                              ? t("anc_modal.done")
                              : t("anc_modal.pending")}
                          </Text>
                        </View>
                      </View>

                      {/* Visit Date */}
                      {isCompleted && visitData?.visit_date && (
                        <View className="flex-row items-center mt-2">
                          <Calendar size={12} color="#64748B" />
                          <Text className="text-slate-500 text-[12px] ml-1.5">
                            {visitData.visit_date}
                          </Text>
                        </View>
                      )}

                      {/* Visit Notes */}
                      {isCompleted && visitData?.visit_place && (
                        <Text className="text-slate-500 text-[12px] mt-1 italic">
                          {visitData.visit_place}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Other Checkup Info */}
          {record.checkup_other && (
            <View className="mx-5 mt-5 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <View className="flex-row items-center mb-2">
                <Clock size={14} color="#92400E" />
                <Text className="text-amber-800 font-semibold text-[13px] ml-2">
                  {t("anc_modal.other_visits")}
                </Text>
              </View>
              <Text className="text-amber-700 text-[13px] leading-relaxed">
                {record.checkup_other}
              </Text>
            </View>
          )}

          {/* Recent ANC Visit Details */}
          {ancVisits.length > 0 && (
            <View className="px-5 mt-6">
              <Text className="text-slate-700 font-bold text-[16px] mb-4">
                {t("anc_modal.visit_history")}
              </Text>

              <View className="gap-y-3">
                {ancVisits.map((visit, idx) => (
                  <View
                    key={visit.id}
                    className="p-4 bg-white rounded-xl border border-slate-100"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="w-7 h-7 rounded-full bg-blue-50 items-center justify-center mr-3">
                          <Text className="text-blue-700 font-bold text-[12px]">
                            {toDisplay(idx + 1)}
                          </Text>
                        </View>
                        <Text className="text-slate-800 font-semibold text-[14px]">
                          {t("anc_modal.visit_number", {
                            number: toDisplay(idx + 1),
                          })}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Calendar size={13} color="#64748B" />
                        <Text className="text-slate-500 text-[13px] ml-1.5">
                          {visit.visit_date}
                        </Text>
                      </View>
                    </View>
                    {visit.visit_place && (
                      <View className="mt-3 pt-3 border-t border-slate-50">
                        <Text className="text-slate-600 text-[13px] leading-relaxed">
                          {visit.visit_place}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
