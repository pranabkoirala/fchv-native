import { useLanguage } from "@/context/LanguageContext";
import { BarChart3, Check, MessageSquare, Minus, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import {
  CHILD_COUNSELING_QUESTIONS,
  CHILD_HEALTH_COUNSELLING_QUESTIONS,
  MALNUTRITION_CONTENT,
} from "../../../constants/ChildCounselingQuestions";
import { useToast } from "../../../context/ToastContext";
import {
  ChildCounselingStoreType,
  getChildCounselingByChild,
  getChildCounselingHistory,
  saveChildCounseling,
} from "../../../hooks/database/models/ChildCounselingModel";
import { toNepaliNumbers } from "../../../utils/dateHelper";

interface ChildCounselingSectionProps {
  childId: string;
  disabled?: boolean;
}

export default function ChildCounselingSection({
  childId,
  disabled
}: ChildCounselingSectionProps) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [record, setRecord] = useState<ChildCounselingStoreType | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [historyAnswers, setHistoryAnswers] = useState<Record<string, any>>({});

  // Loading states for individual buttons
  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>({});

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null);

  // New inputs for malnutrition entry
  const [muac, setMuac] = useState<'green' | 'yellow' | 'red' | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [orsCount, setOrsCount] = useState(1);
  const [orsModalVisible, setOrsModalVisible] = useState(false);
  const [zincCount, setZincCount] = useState(1);
  const [zincModalVisible, setZincModalVisible] = useState(false);

  const parseMeasurement = (value: string) => {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const calculateBmi = (weightValue: string | number | null | undefined, heightValue: string | number | null | undefined) => {
    const parsedWeight = typeof weightValue === "number" ? weightValue : parseMeasurement(weightValue || "");
    const parsedHeight = typeof heightValue === "number" ? heightValue : parseMeasurement(heightValue || "");
    if (!parsedWeight || !parsedHeight) return null;

    const heightInMeters = parsedHeight / 100;
    if (heightInMeters <= 0) return null;

    return Number((parsedWeight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const isWithinOneDay = (date?: string) => {
    if (!date) return false;
    const timestamp = new Date(date).getTime();
    if (Number.isNaN(timestamp)) return false;

    const ageMs = Date.now() - timestamp;
    return ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;
  };

  const getMuacLabel = (value?: string) => {
    if (value === "green") return t("counseling_section.muac_normal");
    if (value === "yellow") return t("counseling_section.muac_risk");
    if (value === "red") return t("counseling_section.muac_severe");
    return t("counseling_section.not_recorded");
  };

  const getMuacHistoryStyle = (value?: string) => {
    if (value === "green") {
      return {
        card: "bg-emerald-50 border-emerald-100",
        icon: "bg-emerald-100",
        title: "text-emerald-800",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    }
    if (value === "yellow") {
      return {
        card: "bg-amber-50 border-amber-100",
        icon: "bg-amber-100",
        title: "text-amber-800",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    }
    if (value === "red") {
      return {
        card: "bg-rose-50 border-rose-100",
        icon: "bg-rose-100",
        title: "text-rose-800",
        text: "text-rose-700",
        dot: "bg-rose-500",
      };
    }
    return {
      card: "bg-slate-50 border-slate-100",
      icon: "bg-slate-100",
      title: "text-slate-800",
      text: "text-slate-600",
      dot: "bg-slate-400",
    };
  };

  const loadData = async () => {
    try {
      const data = await getChildCounselingByChild(childId);
      setRecord(data);
      if (data?.answers) {
        setAnswers(JSON.parse(data.answers));
      }

      // Load full history for one-time questions check
      const history = await getChildCounselingHistory(childId);
      const aggregated: Record<string, any> = {};
      history.forEach(h => {
        if (h.answers) {
          const parsed = JSON.parse(h.answers);
          Object.keys(parsed).forEach(key => {
            if (!aggregated[key]) aggregated[key] = [];
            const logs = Array.isArray(parsed[key]) ? parsed[key] : (parsed[key] ? [{ date: h.updated_at, value: true }] : []);
            aggregated[key] = [...aggregated[key], ...logs];
          });
        }
      });
      setHistoryAnswers(aggregated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childId]);

  const handleToggle = async (questionId: string, value: any) => {
    setLoadingButtons(prev => ({ ...prev, [questionId]: true }));
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child: childId,
        answers: JSON.stringify(newAnswers),
      });
    } catch (e) {
      console.error("Failed to save answer", e);
      showToast("Failed to save");
      setAnswers(answers);
    } finally {
      setLoadingButtons(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleAdd = async (questionId: string, customLogValue?: any, isOneTime: boolean = false) => {
    setLoadingButtons(prev => ({ ...prev, [questionId]: true }));
    const currentTime = new Date().toISOString();

    let existingLogs = [];
    if (Array.isArray(answers[questionId])) {
      existingLogs = answers[questionId];
    } else if (answers[questionId]) {
      existingLogs = [{ date: record?.updated_at || currentTime, value: true }];
    }

    // Prevent multiple entries for one-time questions
    if (isOneTime && existingLogs.length > 0) {
      showToast("Already recorded");
      setLoadingButtons(prev => ({ ...prev, [questionId]: false }));
      return;
    }

    const newLog = { date: currentTime, value: customLogValue || true };
    const newAnswers = { ...answers, [questionId]: [...existingLogs, newLog] };

    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child: childId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.added_successfully") || "Recorded successfully");
    } catch (e) {
      console.error("Failed to save answer", e);
      showToast("Failed to save");
      setAnswers(answers);
    } finally {
      setLoadingButtons(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSaveOrs = async () => {
    await handleAdd("ors_for_child", orsCount);
    setOrsModalVisible(false);
  };

  const handleSaveZinc = async () => {
    await handleAdd("zinc_for_child", zincCount);
    setZincModalVisible(false);
  };

  const handleAddMalnutrition = async () => {
    const mainQuestionId = MALNUTRITION_CONTENT.main_question.id;
    setLoadingButtons(prev => ({ ...prev, [mainQuestionId]: true }));
    const currentTime = new Date().toISOString();
    const parsedWeight = parseMeasurement(weight);
    const parsedHeight = parseMeasurement(height);
    const bmi = calculateBmi(parsedWeight, parsedHeight);

    if (!muac) {
      showToast("Please select MUAC condition");
      setLoadingButtons(prev => ({ ...prev, [mainQuestionId]: false }));
      return;
    }

    let severity = "";
    if (muac === "yellow") severity = "medium";
    if (muac === "red") severity = "high";

    let existingLogs = [];
    if (Array.isArray(answers[mainQuestionId])) {
      existingLogs = answers[mainQuestionId];
    } else if (answers[mainQuestionId]) {
      existingLogs = [{ date: record?.updated_at || currentTime, value: true }];
    }

    const newLog = {
      date: currentTime,
      value: true,
      muac,
      weight: parsedWeight,
      height: parsedHeight,
      bmi,
      severity,
      sub_answers: {},
    };

    const newAnswers = { ...answers, [mainQuestionId]: [...existingLogs, newLog] };
    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child: childId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.added_successfully") || "Recorded successfully");

      // Reset inputs after success
      setMuac(null);
      setWeight("");
      setHeight("");
    } catch (e) {
      console.error("Failed to save malnutrition", e);
      showToast("Failed to save");
      setAnswers(answers);
    } finally {
      setLoadingButtons(prev => ({ ...prev, [mainQuestionId]: false }));
    }
  };

  const handleSetSubQuestion = async (logIndex: number, subQuestionId: string, value: boolean) => {
    const mainQuestionId = MALNUTRITION_CONTENT.main_question.id;
    const loadingKey = `${mainQuestionId}_${logIndex}_${subQuestionId}`;
    setLoadingButtons(prev => ({ ...prev, [loadingKey]: true }));

    let logs: any[] = [];

    if (Array.isArray(answers[mainQuestionId])) {
      logs = [...answers[mainQuestionId]];
    } else if (answers[mainQuestionId]) {
      logs = [{ date: record?.updated_at || new Date().toISOString(), value: true }];
    }

    if (!logs[logIndex]) {
      setLoadingButtons(prev => ({ ...prev, [loadingKey]: false }));
      return;
    }

    const targetLog = { ...logs[logIndex] };
    if (!targetLog.sub_answers) targetLog.sub_answers = {};

    if (value) {
      targetLog.sub_answers[subQuestionId] = {
        value: true,
        date: new Date().toISOString(),
      };
    } else {
      delete targetLog.sub_answers[subQuestionId];
    }

    logs[logIndex] = targetLog;

    const newAnswers = { ...answers, [mainQuestionId]: logs };
    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child: childId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.added_successfully") || "Recorded successfully");
    } catch (e) {
      console.error("Failed to save sub-question", e);
      showToast("Failed to save");
      setAnswers(answers);
    } finally {
      setLoadingButtons(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Open confirmation modal for deleting the latest log
  const requestDeleteLatest = (questionId: string) => {
    const rawValue = answers[questionId];
    const logs = Array.isArray(rawValue)
      ? rawValue
      : rawValue
        ? [{ date: record?.updated_at || new Date().toISOString(), value: true }]
        : [];
    if (logs.length === 0) return;
    setPendingDeleteQuestionId(questionId);
    setDeleteModal(true);
  };

  // Actually perform the delete after confirmation
  const confirmDeleteLatest = async () => {
    if (!pendingDeleteQuestionId) return;

    const questionId = pendingDeleteQuestionId;
    setLoadingButtons(prev => ({ ...prev, [`delete_${questionId}`]: true }));
    const rawValue = answers[questionId];
    let logs = Array.isArray(rawValue)
      ? [...rawValue]
      : rawValue
        ? [{ date: record?.updated_at || new Date().toISOString(), value: true }]
        : [];

    if (logs.length === 0) {
      setDeleteModal(false);
      setPendingDeleteQuestionId(null);
      setLoadingButtons(prev => ({ ...prev, [`delete_${questionId}`]: false }));
      return;
    }

    // Remove the last (latest) entry
    logs.pop();

    const newAnswers = { ...answers, [questionId]: logs };
    setAnswers(newAnswers);

    try {
      const savedRecord = await saveChildCounseling({
        id: record?.id,
        child: childId,
        answers: JSON.stringify(newAnswers),
      });
      setRecord(savedRecord);
      showToast(t("counseling_section.deleted_successfully") || "Deleted successfully");
    } catch (e) {
      console.error("Failed to delete answer", e);
      showToast("Failed to delete");
      setAnswers(answers);
    } finally {
      setLoadingButtons(prev => ({ ...prev, [`delete_${questionId}`]: false }));
      setDeleteModal(false);
      setPendingDeleteQuestionId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal(false);
    setPendingDeleteQuestionId(null);
  };

  const renderLogsInline = (questionId: string) => {
    let logs = [];
    if (Array.isArray(answers[questionId])) {
      logs = answers[questionId];
    } else if (answers[questionId]) {
      logs = [{ date: record?.updated_at || new Date().toISOString(), value: true }];
    }

    if (logs.length === 0) return null;

    return renderLogBadges(logs, questionId);
  };

  const renderMalnutritionLogs = (questionId: string) => {
    let logs: any[] = [];
    if (Array.isArray(answers[questionId])) {
      logs = answers[questionId];
    } else if (answers[questionId]) {
      logs = [{ date: record?.updated_at || new Date().toISOString(), value: true }];
    }

    if (logs.length === 0) return null;

    return renderLogBadges(logs, questionId, true);
  };

  const renderLogBadges = (logs: any[], questionId: string, showSeverity: boolean = false) => {
    return (
      <View className="flex-row flex-wrap mt-2 gap-2 items-center">
        {logs.map((log: any, index: number) => {
          let dateStr = "";
          try {
            dateStr = language === "np" ? toNepaliNumbers(AdToBs(log.date.split("T")[0])) : log.date.split("T")[0];
          } catch (e) {
            dateStr = log.date.split("T")[0];
          }
          const isLatest = index === logs.length - 1;
          const canDelete = isLatest && isWithinOneDay(log.date);

          let extraInfo = "";
          if (log.muac) {
            const muacShort = log.muac === 'green' ? 'G' : log.muac === 'yellow' ? 'Y' : 'R';
            extraInfo += ` [${muacShort}]`;
          }
          if (log.weight) extraInfo += ` ${log.weight}kg`;
          if (log.height) extraInfo += ` ${log.height}cm`;
          if (questionId === "ors_for_child" && typeof log.value === "number") {
            const displayVal = language === "np" ? toNepaliNumbers(log.value) : log.value;
            const unit = log.value === 1 ? t("counseling_section.ors_packet_one") : t("counseling_section.ors_packet_other");
            extraInfo += ` (${displayVal} ${unit})`;
          }
          if (questionId === "zinc_for_child" && typeof log.value === "number") {
            const displayVal = language === "np" ? toNepaliNumbers(log.value) : log.value;
            const unit = log.value === 1 ? t("counseling_section.zinc_tablet_one") : t("counseling_section.zinc_tablet_other");
            extraInfo += ` (${displayVal} ${unit})`;
          }

          return (
            <View key={index} className={`flex-row items-center ${canDelete ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"} px-2.5 py-1 rounded-md`}>
              <Text className="text-[11px] text-slate-600 font-bold">
                {dateStr}
                {extraInfo}
              </Text>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => requestDeleteLatest(questionId)}
                  disabled={disabled}
                  className={`ml-1.5 bg-white rounded-full p-0.5 border border-blue-100 ${disabled ? 'opacity-50' : ''}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={10} color={disabled ? "#94A3B8" : "#DC2626"} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderDeleteConfirmModal = () => (
    <Modal
      visible={deleteModal}
      transparent
      animationType="fade"
      onRequestClose={cancelDelete}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <View className="bg-white rounded-2xl w-full  pb-4 max-w-[320px] overflow-hidden">
          {/* Header */}
          <View className="bg-red-50 px-5 pt-5 pb-4 items-center">
            <View className="w-12 h-12 rounded-lg bg-red-100 items-center justify-center mb-3">
              <Trash2 size={22} color="#DC2626" />
            </View>
            <Text className="text-slate-800 text-[16px] font-semibold text-center">
              {t("counseling_section.delete_confirm_title")}
            </Text>
          </View>

          {/* Body */}
          <View className="px-5 py-4">
            <Text className="text-slate-600 text-[15px] text-center leading-relaxed">
              {t("counseling_section.delete_confirm_message")}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-slate-100">
            <TouchableOpacity
              onPress={cancelDelete}
              className="flex-1 py-3.5 items-center"
            >
              <Text className="text-slate-500 font-semibold text-[15px]">
                {t("counseling_section.delete_confirm_no")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDeleteLatest}
              disabled={loadingButtons[`delete_${pendingDeleteQuestionId}`]}
              className="flex-1 py-3.5 items-center border-l border-slate-100 justify-center"
            >
              {loadingButtons[`delete_${pendingDeleteQuestionId}`] ? (
                <ActivityIndicator color="#DC2626" size="small" />
              ) : (
                <Text className="text-red-600 font-semibold text-[15px]">
                  {t("counseling_section.delete_confirm_yes")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOrsModal = () => (
    <Modal
      visible={orsModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setOrsModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <View className="bg-white rounded-2xl pb-2 w-full max-w-[320px]">
          {/* Header */}
          <View className="bg-[#eff6ff] rounded-t-2xl px-5 pt-5 pb-4 items-center border-b border-blue-50">
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mb-3">
              <Plus size={22} color="#2563EB" />
            </View>
            <Text className="text-slate-800 text-[18px] font-bold text-center">
              {t("counseling_section.distribute_ors_title")}
            </Text>
            <Text className="text-slate-500 text-[13px] text-center mt-1">
              {t("counseling_section.distribute_ors_desc")}
            </Text>
          </View>

          {/* Counter Controls */}
          <View className="p-6 items-center justify-center bg-white">
            <View className="flex-row items-center gap-x-4">
              {/* Decrement */}
              <TouchableOpacity
                onPress={() => setOrsCount(prev => Math.max(1, prev - 1))}
                disabled={orsCount <= 1}
                className={`w-11 h-11 rounded-xl items-center justify-center bg-[#475569]`}
              >
                <Text className={`font-bold text-xl`}>
                  <Minus color="white" />
                </Text>
              </TouchableOpacity>

              {/* Input field */}
              <TextInput
                keyboardType="number-pad"
                value={String(orsCount)}
                onChangeText={(txt) => {
                  const val = parseInt(txt.replace(/[^0-9]/g, "")) || 0;
                  setOrsCount(val);
                }}
                className="h-14 flex-1 border border-slate-200 bg-white rounded-xl text-center font-bold text-[19px] text-slate-800 p-0"
              />

              {/* Increment */}
              <TouchableOpacity
                onPress={() => setOrsCount(prev => prev + 1)}
                className="w-11 h-11 rounded-xl items-center justify-center border bg-[#475569]"
              >
                <Text className="font-bold text-xl text-white"><Plus color="white" /></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-slate-100">
            <TouchableOpacity
              onPress={() => setOrsModalVisible(false)}
              className="flex-1 py-3.5 items-center justify-center"
            >
              <Text className="text-slate-500 font-semibold text-[15px]">
                {t("counseling_section.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveOrs}
              disabled={orsCount <= 0 || loadingButtons["ors_for_child"]}
              className="flex-1 py-3.5 items-center border-l border-slate-100 justify-center bg-blue-50"
            >
              {loadingButtons["ors_for_child"] ? (
                <ActivityIndicator color="#2563EB" size="small" />
              ) : (
                <Text className="text-blue-600 font-semibold text-[15px]">
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderZincModal = () => (
    <Modal
      visible={zincModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setZincModalVisible(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <View className="bg-white rounded-2xl pb-2 w-full max-w-[320px]">
          {/* Header */}
          <View className="bg-[#fefce8] rounded-t-2xl px-5 pt-5 pb-4 items-center border-b border-amber-50">
            <View className="w-12 h-12 rounded-full bg-amber-100 items-center justify-center mb-3">
              <Plus size={22} color="#D97706" />
            </View>
            <Text className="text-slate-800 text-[18px] font-bold text-center">
              {t("counseling_section.distribute_zinc_title")}
            </Text>
            <Text className="text-slate-500 text-[13px] text-center mt-1">
              {t("counseling_section.distribute_zinc_desc")}
            </Text>
          </View>

          {/* Counter Controls */}
          <View className="p-6 items-center justify-center bg-white">
            <View className="flex-row items-center gap-x-4">
              {/* Decrement */}
              <TouchableOpacity
                onPress={() => setZincCount(prev => Math.max(1, prev - 1))}
                disabled={zincCount <= 1}
                className={`w-11 h-11 rounded-xl items-center justify-center bg-[#475569]`}
              >
                <Text className={`font-bold text-xl rounded-md`}>
                  <Minus color="white" />
                </Text>
              </TouchableOpacity>

              {/* Input field */}
              <TextInput
                keyboardType="number-pad"
                value={String(zincCount)}
                onChangeText={(txt) => {
                  const val = parseInt(txt.replace(/[^0-9]/g, "")) || 0;
                  setZincCount(val);
                }}
                className="h-14 flex-1 border border-slate-200 bg-white rounded-xl text-center font-bold text-[19px] text-slate-800 p-0"
              />

              {/* Increment */}
              <TouchableOpacity
                onPress={() => setZincCount(prev => prev + 1)}
                className="w-11 h-11 rounded-xl items-center justify-center bg-[#475569]"
              >
                <Text className="font-bold text-xl text-white"><Plus color="white"/></Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-slate-100">
            <TouchableOpacity
              onPress={() => setZincModalVisible(false)}
              className="flex-1 py-3.5 items-center justify-center"
            >
              <Text className="text-slate-500 font-semibold text-[15px]">
                {t("counseling_section.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveZinc}
              disabled={zincCount <= 0 || loadingButtons["zinc_for_child"]}
              className="flex-1 py-3.5 items-center border-l border-slate-100 justify-center bg-amber-50"
            >
              {loadingButtons["zinc_for_child"] ? (
                <ActivityIndicator color="#D97706" size="small" />
              ) : (
                <Text className="text-amber-600 font-semibold text-[15px]">
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMalnutritionHistory = (logs: any[], questionId: string) => {
    if (logs.length === 0) return null;

    // Show latest first
    const reversedLogs = [...logs].reverse();

    return (
      <View className="mt-4 mb-4">
        <View className="flex-row items-center justify-between mb-3 px-1">
          <Text className="text-slate-500 font-bold text-[12px] uppercase tracking-wider">
            {t("counseling_section.history")}
          </Text>
          <View className="h-[1px] flex-1 bg-slate-100 ml-3" />
        </View>

        <View className="gap-y-2.5">
          {reversedLogs.map((log: any, revIdx: number) => {
            const index = logs.length - 1 - revIdx;
            let dateStr = "";
            try {
              dateStr = language === "np" ? toNepaliNumbers(AdToBs(log.date.split("T")[0])) : log.date.split("T")[0];
            } catch (e) {
              dateStr = log.date?.split("T")[0] || "";
            }

            const style = getMuacHistoryStyle(log.muac);
            const isLatest = index === logs.length - 1;
            const canDelete = isLatest && isWithinOneDay(log.date);
            const bmiValue = log.bmi ?? calculateBmi(log.weight, log.height);
            const recordNumber = language === "np" ? toNepaliNumbers(index + 1) : index + 1;

            const displayWeight = language === "np" && log.weight ? toNepaliNumbers(log.weight) : log.weight;
            const displayHeight = language === "np" && log.height ? toNepaliNumbers(log.height) : log.height;
            const displayBmi = language === "np" && bmiValue ? toNepaliNumbers(bmiValue) : bmiValue;

            const muacColor = log.muac === 'red' ? '#F43F5E' : log.muac === 'yellow' ? '#FAB005' : '#10B981';
            const subAnswers = log.sub_answers || {};
            const malnutritionQuestions = MALNUTRITION_CONTENT.sub_questions.filter((q) =>
              log.muac === "green" ? q.id === "malnutrition_cured" : q.id !== "malnutrition_cured",
            );

            return (
              <View key={`${log.date}-${index}`} className={`rounded-2xl border ${style.card} p-3`}>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="bg-white/80 rounded-full px-2 py-0.5 border border-white/50 mr-2">
                      <Text className="text-[10px] font-bold text-slate-500">
                        {t("counseling_section.record")} #{recordNumber}
                      </Text>
                    </View>
                    <Text className="text-slate-600 text-[12px] font-medium">{dateStr}</Text>
                  </View>
                  {canDelete && (
                    <TouchableOpacity
                      onPress={() => requestDeleteLatest(questionId)}
                      disabled={disabled}
                      className={`w-7 h-7 rounded-full bg-white/90 items-center justify-center ${disabled ? 'opacity-50' : ''}`}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={12} color={disabled ? "#94A3B8" : "#EF4444"} />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: muacColor }} />
                    <Text className={`font-bold text-[15px] ${style.title}`}>
                      {getMuacLabel(log.muac)}
                    </Text>
                  </View>

                  <View className="flex-row gap-x-4">
                    <View className="items-end">
                      <Text className="text-slate-400 text-[9px] uppercase font-bold tracking-tight">
                        {t("counseling_section.weight_short")}
                      </Text>
                      <Text className="text-slate-700 font-bold text-[13px]">
                        {displayWeight ? `${displayWeight}kg` : "--"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-400 text-[9px] uppercase font-bold tracking-tight">
                        {t("counseling_section.height_short")}
                      </Text>
                      <Text className="text-slate-700 font-bold text-[13px]">
                        {displayHeight ? `${displayHeight}cm` : "--"}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-400 text-[9px] uppercase font-bold tracking-tight">
                        {t("counseling_section.bmi")}
                      </Text>
                      <Text className="text-slate-700 font-bold text-[13px]">
                        {displayBmi || "--"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-3 pt-3 border-t border-white/70 gap-y-2">
                  {malnutritionQuestions.map((q) => {
                    const rawAnswer = subAnswers[q.id];
                    const isSelected = rawAnswer === true || rawAnswer?.value === true;
                    const loadingKey = `${questionId}_${index}_${q.id}`;

                    return (
                      <View key={q.id} className="flex-row items-center justify-between bg-white/70 border border-white/80 rounded-xl px-3 py-2">
                        <Text className="flex-1 text-slate-700 text-[13px] font-medium leading-5 mr-3">
                          {language === "np" ? q.ne : q.en}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleSetSubQuestion(index, q.id, !isSelected)}
                          disabled={disabled || loadingButtons[loadingKey]}
                          className={`${isSelected ? "bg-primary" : disabled ? "bg-slate-100" : "bg-slate-700"} w-8 h-8 rounded-lg items-center justify-center`}
                        >
                          {loadingButtons[loadingKey] ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : isSelected ? (
                            <Check size={17} color="white" />
                          ) : (
                            <Plus size={17} color={disabled ? "#CBD5E1" : "white"} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderMalnutritionGroup = () => {
    const mainQuestionId = MALNUTRITION_CONTENT.main_question.id;
    const bmi = calculateBmi(weight, height);

    let malnutritionLogs: any[] = [];
    if (Array.isArray(answers[mainQuestionId])) {
      malnutritionLogs = answers[mainQuestionId];
    } else if (answers[mainQuestionId]) {
      malnutritionLogs = [{ date: record?.updated_at || new Date().toISOString(), value: true }];
    }

    return (
      <View className="mb-8 bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <View className="flex-row items-center p-4 bg-red-50/10 border-b border-slate-50">
          <View className="w-8 h-8 rounded-lg bg-red-100 items-center justify-center mr-3">
            <BarChart3 size={18} color="#DC2626" />
          </View>
          <Text className="text-xl font-bold text-slate-800">
            {t("counseling_section.malnutrition_screening")}
          </Text>
        </View>

        <View className="p-4">
          <Text className="text-slate-600 font-semibold mb-3 text-[15px]">
            {t("counseling_section.muac_condition")}
          </Text>
          <View className="flex-row gap-x-2 mb-6">
            <TouchableOpacity
              onPress={() => setMuac('green')}
              disabled={disabled}
              className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${muac === 'green' ? "bg-emerald-500 border-emerald-500" : (disabled ? "bg-slate-50 border-slate-100" : "bg-white border-slate-201")}`}
            >
              <Text className={`font-bold text-[15px] ${muac === 'green' ? "text-white" : (disabled ? "text-slate-300" : "text-emerald-700")}`}>
                {t("counseling_section.muac_normal")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMuac('yellow')}
              disabled={disabled}
              className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${muac === 'yellow' ? "bg-yellow-400 border-yellow-400" : (disabled ? "bg-slate-50 border-slate-100" : "bg-white border-slate-201")}`}
            >
              <Text className={`font-bold text-[15px] ${muac === 'yellow' ? "text-white" : (disabled ? "text-slate-300" : "text-yellow-700")}`}>
                {t("counseling_section.muac_risk")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMuac('red')}
              disabled={disabled}
              className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${muac === 'red' ? "bg-rose-500 border-rose-500" : (disabled ? "bg-slate-50 border-slate-100" : "bg-white border-slate-201")}`}
            >
              <Text className={`font-bold text-[15px] ${muac === 'red' ? "text-white" : (disabled ? "text-slate-300" : "text-rose-700")}`}>
                {t("counseling_section.muac_severe")}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-x-4 mb-6">
            <View className="flex-1">
              <Text className="text-slate-600 font-semibold mb-2 text-[15px]">
                {t("counseling_section.weight_kg")}
              </Text>
              <View className={`bg-slate-50 border border-slate-200 rounded-xl px-4 ${disabled ? 'opacity-50' : ''}`}>
                <TextInput
                  placeholder="0.00"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  editable={!disabled}
                  className="text-slate-800 font-semibold text-lg"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-slate-600 font-semibold mb-2 text-[15px]">
                {t("counseling_section.height_cm")}
              </Text>
              <View className={`bg-slate-50 border border-slate-200 rounded-xl px-4 ${disabled ? 'opacity-50' : ''}`}>
                <TextInput
                  placeholder="0.0"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  editable={!disabled}
                  className="text-slate-800 font-semibold text-lg"
                />
              </View>
            </View>
          </View>

          <View className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-slate-500 font-medium text-[15px]">
                {t("counseling_section.bmi")}
              </Text>
              <Text className="text-slate-800 font-semibold text-[20px] mt-0.5">
                {bmi ? (language === "np" ? toNepaliNumbers(bmi) : bmi) : "---"}
              </Text>
            </View>
            <Text className="text-slate-500 text-[13px] font-medium max-w-[160px] text-right">
              {t("counseling_section.bmi_auto")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAddMalnutrition}
            disabled={!muac || disabled || loadingButtons[mainQuestionId]}
            className={`w-full py-2.5 rounded-xl items-center justify-center mb-4 ${(!muac || disabled || loadingButtons[mainQuestionId]) ? "bg-slate-300" : "bg-primary"}`}
          >
            {loadingButtons[mainQuestionId] ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {t("counseling_section.add")}
              </Text>
            )}
          </TouchableOpacity>

          {muac === 'green' && (
            <View className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-4 items-center">
              <Text className="text-emerald-700 font-semibold italic text-sm">
                {t("counseling_section.malnutrition_good")}
              </Text>
            </View>
          )}

          {renderMalnutritionHistory(malnutritionLogs, mainQuestionId)}
        </View>
      </View>
    );
  };

  const renderCounselingGroup = () => {
    return (
      <View className="bg-white rounded-2xl mb-6 py-3 px-2">
        <View className="flex-row items-center mb-3 ml-1">
          <MessageSquare size={20} color="#166534" />
          <Text className="text-[#166534] font-bold text-lg ml-2">{t("counseling_section.counseling")}</Text>
        </View>

        <View className="bg-white rounded-xl">
          {CHILD_COUNSELING_QUESTIONS.map((q, index) => (
            <View key={q.id} className="bg-white py-4 px-2 border-t border-slate-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-slate-700 text-[16px] font-medium leading-relaxed">
                    {language === "np" ? q.ne : q.en}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleAdd(q.id)}
                  disabled={disabled || loadingButtons[q.id]}
                  className={`${disabled ? 'bg-slate-100' : 'bg-[#475569]'} px-2 py-2 rounded-lg flex-row items-center ml-2 justify-center`}
                >
                  {loadingButtons[q.id] ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Plus size={19} color={disabled ? "#CBD5E1" : "white"} />
                  )}
                </TouchableOpacity>
              </View>
              {renderLogsInline(q.id)}
            </View>
          ))}

          {CHILD_HEALTH_COUNSELLING_QUESTIONS.slice(0, 1).map((q: any) => {
            const logs = Array.isArray(answers[q.id]) ? answers[q.id] : [];
            const isConditionBad = logs.length > 0;

            return (
              <View key={q.id} className="bg-white py-4 px-2 border-t border-slate-100">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-slate-700 text-[16px] font-medium leading-relaxed">
                      {language === "np" ? q.ne : q.en}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleAdd(q.id)}
                    disabled={disabled || loadingButtons[q.id]}
                    className={`${disabled ? 'bg-slate-100' : 'bg-[#475569]'} p-2 rounded-lg flex-row items-center ml-2 justify-center`}
                  >
                    {loadingButtons[q.id] ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Plus size={19} color={disabled ? "#CBD5E1" : "white"} />
                    )}
                  </TouchableOpacity>
                </View>
                {renderLogsInline(q.id)}

                {isConditionBad && (
                  <View className="mt-4 ml-1">
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="flex-1">
                      {CHILD_HEALTH_COUNSELLING_QUESTIONS.slice(1).map((subQ: any, subIndex: number) => {
                        // Diarrhea-dependent questions only shown if child has diarrhea
                        if (subQ.id === "diarrhea_treated_with_ors_zinc" || subQ.id === "ors_for_child" || subQ.id === "zinc_for_child") {
                          const hasDiarrheaLogs = Array.isArray(answers["has_diarrhea"]) ? answers["has_diarrhea"] : [];
                          if (hasDiarrheaLogs.length === 0) return null;
                        }

                        if (subQ.id === "ors_for_child") {
                          return (
                            <View key={subQ.id} className="py-4">
                              <View className="flex-row items-start justify-between">
                                <View className="flex-1 mr-2">
                                  <Text className="text-slate-700 text-[16px] font-medium leading-relaxed">
                                    {language === "np" ? subQ.ne : subQ.en}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => {
                                    setOrsCount(1);
                                    setOrsModalVisible(true);
                                  }}
                                  disabled={disabled || loadingButtons[subQ.id]}
                                  className={`${disabled ? 'bg-slate-100' : 'bg-[#475569]'} px-2 py-2 rounded-lg flex-row items-center ml-2 justify-center`}
                                >
                                  {loadingButtons[subQ.id] ? (
                                    <ActivityIndicator color="white" size="small" />
                                  ) : (
                                    <Plus size={19} color={disabled ? "#CBD5E1" : "white"} />
                                  )}
                                </TouchableOpacity>
                              </View>
                              {renderLogsInline(subQ.id)}
                            </View>
                          );
                        }

                        if (subQ.id === "zinc_for_child") {
                          return (
                            <View key={subQ.id} className="py-4">
                              <View className="flex-row items-start justify-between">
                                <View className="flex-1 mr-2">
                                  <Text className="text-slate-700 text-[16px] font-medium leading-relaxed">
                                    {language === "np" ? subQ.ne : subQ.en}
                                  </Text>
                                </View>
                                <TouchableOpacity
                                  onPress={() => {
                                    setZincCount(1);
                                    setZincModalVisible(true);
                                  }}
                                  disabled={disabled || loadingButtons[subQ.id]}
                                  className={`${disabled ? 'bg-slate-100' : 'bg-[#475569]'} px-2 py-2 rounded-lg flex-row items-center ml-2 justify-center`}
                                >
                                  {loadingButtons[subQ.id] ? (
                                    <ActivityIndicator color="white" size="small" />
                                  ) : (
                                    <Plus size={19} color={disabled ? "#CBD5E1" : "white"} />
                                  )}
                                </TouchableOpacity>
                              </View>
                              {renderLogsInline(subQ.id)}
                            </View>
                          );
                        }

                        return (
                          <View key={subQ.id} className="py-4">
                            <View className="flex-row items-start justify-between">
                              <View className="flex-1 mr-2">
                                <Text className="text-slate-700 text-[16px] font-medium leading-relaxed">
                                  {language === "np" ? subQ.ne : subQ.en}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleAdd(subQ.id)}
                                disabled={disabled || loadingButtons[subQ.id]}
                                className={`${disabled ? 'bg-slate-100' : 'bg-[#475569]'} px-2 py-2 rounded-lg flex-row items-center ml-2 justify-center`}
                              >
                                {loadingButtons[subQ.id] ? (
                                  <ActivityIndicator color="white" size="small" />
                                ) : (
                                  <Plus size={19} color={disabled ? "#CBD5E1" : "white"} />
                                )}
                              </TouchableOpacity>
                            </View>
                            {renderLogsInline(subQ.id)}
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) return null;

  return (
    <View className="mt-2">
      {renderDeleteConfirmModal()}
      {renderOrsModal()}
      {renderZincModal()}
      {renderMalnutritionGroup()}
      {renderCounselingGroup()}
    </View>
  );
}
