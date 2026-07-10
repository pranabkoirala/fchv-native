import { useLanguage } from "@/context/LanguageContext";
import {
  BarChart3,
  Check,
  ChevronDown,
  MessageSquare,
  Minus,
  Plus,
  Trash2,
} from "lucide-react-native";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import {
  CHILD_COUNSELING_QUESTIONS,
  CHILD_HEALTH_COUNSELLING_QUESTIONS,
  MALNUTRITION_CONTENT,
  ONE_TIME_CHILD_COUNSELING_QUESTIONS,
  REGISTRATION_COUNSELING_QUESTIONS,
} from "../../../constants/ChildCounselingQuestions";
import { useToast } from "../../../context/ToastContext";
import { getChildBirthRegistration } from "../../../hooks/database/models/ChildBirthRegistrationModel";
import {
  ChildCounselingStoreType,
  getChildCounselingByChild,
  getChildCounselingHistory,
  saveChildCounseling,
} from "../../../hooks/database/models/ChildCounselingModel";
import { getChildDeathRegistration } from "../../../hooks/database/models/ChildDeathRegistrationModel";
import { toNepaliNumbers } from "../../../utils/dateHelper";

interface ChildCounselingSectionProps {
  childId: string;
  disabled?: boolean;
  isDead?: boolean;
}

export default function ChildCounselingSection({
  childId,
  disabled,
  isDead,
}: ChildCounselingSectionProps) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [record, setRecord] = useState<ChildCounselingStoreType | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [historyAnswers, setHistoryAnswers] = useState<Record<string, any>>({});
  const [birthRegistered, setBirthRegistered] = useState(false);
  const [deathRegistered, setDeathRegistered] = useState(false);

  // Loading states for individual buttons
  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>(
    {},
  );

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<
    string | null
  >(null);

  // Date editing state
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [editingLogIndex, setEditingLogIndex] = useState<number | null>(null);
  const [editingDateBs, setEditingDateBs] = useState("");

  // New inputs for malnutrition entry
  const [muac, setMuac] = useState<"green" | "yellow" | "red" | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [orsCount, setOrsCount] = useState(1);
  const [orsModalVisible, setOrsModalVisible] = useState(false);
  const [zincCount, setZincCount] = useState(1);
  const [zincModalVisible, setZincModalVisible] = useState(false);
  const [malnutritionExpanded, setMalnutritionExpanded] = useState(true);
  const chevronRotateAnim = useRef(new Animated.Value(0)).current;

  const toggleMalnutrition = () => {
    const toValue = malnutritionExpanded ? 1 : 0;
    Animated.timing(chevronRotateAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
    setMalnutritionExpanded((prev) => !prev);
  };

  const parseMeasurement = (value: string) => {
    const parsed = parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const calculateBmi = (
    weightValue: string | number | null | undefined,
    heightValue: string | number | null | undefined,
  ) => {
    const parsedWeight =
      typeof weightValue === "number"
        ? weightValue
        : parseMeasurement(weightValue || "");
    const parsedHeight =
      typeof heightValue === "number"
        ? heightValue
        : parseMeasurement(heightValue || "");
    if (!parsedWeight || !parsedHeight) return null;

    const heightInMeters = parsedHeight / 100;
    if (heightInMeters <= 0) return null;

    return Number(
      (parsedWeight / (heightInMeters * heightInMeters)).toFixed(1),
    );
  };

  const isWithinOneDay = (date?: string) => {
    if (!date) return false;
    const timestamp = new Date(date).getTime();
    if (Number.isNaN(timestamp)) return false;

    const ageMs = Date.now() - timestamp;
    return ageMs >= 0 && ageMs <= 24 * 60 * 60 * 1000;
  };

  const MUAC_LABELS: Record<string, string> = {
    green: t("counseling_section.muac_normal"),
    yellow: t("counseling_section.muac_risk"),
    red: t("counseling_section.muac_severe"),
  };

  const getMuacLabel = (value?: string) =>
    MUAC_LABELS[value as keyof typeof MUAC_LABELS] ??
    t("counseling_section.not_recorded");

  const MUAC_STYLES: Record<string, { card: string; icon: string; title: string; text: string; dot: string }> = {
    green: {
      card: "bg-emerald-50 border-emerald-100",
      icon: "bg-emerald-100",
      title: "text-emerald-800",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    yellow: {
      card: "bg-amber-50 border-amber-100",
      icon: "bg-amber-100",
      title: "text-amber-800",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    red: {
      card: "bg-rose-50 border-rose-100",
      icon: "bg-rose-100",
      title: "text-rose-800",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
    _default: {
      card: "bg-slate-50 border-slate-100",
      icon: "bg-slate-100",
      title: "text-slate-800",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
  };

  const getMuacHistoryStyle = (value?: string) =>
    MUAC_STYLES[value as keyof typeof MUAC_STYLES] ?? MUAC_STYLES._default;

  const getMuacColor = (muac?: string): string =>
    muac === "red" ? "#F43F5E" : muac === "yellow" ? "#FAB005" : "#10B981";

  const getLogs = (questionId: string): any[] => {
    const value = answers[questionId];
    if (Array.isArray(value)) return value;
    if (value) {
      return [
        { date: record?.updated_at || new Date().toISOString(), value: true },
      ];
    }
    return [];
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
      history.forEach((h) => {
        if (h.answers) {
          const parsed = JSON.parse(h.answers);
          Object.keys(parsed).forEach((key) => {
            if (!aggregated[key]) aggregated[key] = [];
            const logs = Array.isArray(parsed[key])
              ? parsed[key]
              : parsed[key]
                ? [{ date: h.updated_at, value: true }]
                : [];
            aggregated[key] = [...aggregated[key], ...logs];
          });
        }
      });
      setHistoryAnswers(aggregated);
    } catch (e) {
      console.error(e);
    }

    try {
      const birthReg = await getChildBirthRegistration(childId);
      setBirthRegistered(birthReg?.birth_status === 1);
      const deathReg = await getChildDeathRegistration(childId);
      setDeathRegistered(deathReg?.death_status === 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [childId]);

  const saveAnswers = async (
    newAnswers: Record<string, any>,
    loadingKey?: string,
    successMsg?: string,
    failureMsg: string = "Failed to save",
  ): Promise<ChildCounselingStoreType | null> => {
    setAnswers(newAnswers);
    if (loadingKey)
      setLoadingButtons((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const saved = await saveChildCounseling({
        id: record?.id,
        child: childId,
        answers: JSON.stringify(newAnswers),
      });
      if (successMsg) showToast(successMsg);
      return saved;
    } catch (e) {
      console.error(e);
      showToast(failureMsg);
      setAnswers(answers);
      return null;
    } finally {
      if (loadingKey)
        setLoadingButtons((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const handleAdd = async (
    questionId: string,
    customLogValue?: any,
    isOneTime: boolean = false,
  ) => {
    const currentTime = new Date().toISOString();
    const existingLogs = getLogs(questionId);

    // Prevent multiple entries for one-time questions
    if (isOneTime && existingLogs.length > 0) {
      showToast("Already recorded");
      return;
    }

    const newLog = { date: currentTime, value: customLogValue || true };
    const newAnswers = { ...answers, [questionId]: [...existingLogs, newLog] };

    await saveAnswers(
      newAnswers,
      questionId,
      t("counseling_section.added_successfully") || "Recorded successfully",
    );
  };

  const isAnswered = (questionId: string): boolean => {
    const value = answers[questionId];
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  };

  const handleToggleAnswer = async (questionId: string) => {
    const currentTime = new Date().toISOString();
    let newAnswers: Record<string, any>;

    if (isAnswered(questionId)) {
      const { [questionId]: _, ...rest } = answers;
      newAnswers = rest;
    } else {
      newAnswers = {
        ...answers,
        [questionId]: [{ date: currentTime, value: true }],
      };
    }

    await saveAnswers(newAnswers, questionId);
  };

  const renderCheckButton = (questionId: string) => {
    const answered = isAnswered(questionId);
    return (
      <TouchableOpacity
        onPress={() => handleToggleAnswer(questionId)}
        disabled={disabled || loadingButtons[questionId]}
        className={`w-8 h-8 rounded-lg items-center justify-center ${answered ? "bg-green-500" : disabled ? "bg-slate-100" : "bg-slate-200"}`}
      >
        {loadingButtons[questionId] ? (
          <ActivityIndicator color="white" size="small" />
        ) : answered ? (
          <Check size={18} color="white" />
        ) : null}
      </TouchableOpacity>
    );
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
    const currentTime = new Date().toISOString();
    const parsedWeight = parseMeasurement(weight);
    const parsedHeight = parseMeasurement(height);
    const bmi = calculateBmi(parsedWeight, parsedHeight);

    if (!muac) {
      showToast("Please select MUAC condition");
      return;
    }

    let severity = "";
    if (muac === "yellow") severity = "medium";
    if (muac === "red") severity = "high";

    const existingLogs = getLogs(mainQuestionId);

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

    const newAnswers = {
      ...answers,
      [mainQuestionId]: [...existingLogs, newLog],
    };

    const saved = await saveAnswers(
      newAnswers,
      mainQuestionId,
      t("counseling_section.added_successfully") || "Recorded successfully",
    );

    if (saved) {
      // Reset inputs after success
      setMuac(null);
      setWeight("");
      setHeight("");
    }
  };

  const handleSetSubQuestion = async (
    logIndex: number,
    subQuestionId: string,
    value: boolean,
  ) => {
    const mainQuestionId = MALNUTRITION_CONTENT.main_question.id;
    const loadingKey = `${mainQuestionId}_${logIndex}_${subQuestionId}`;

    const logs = [...getLogs(mainQuestionId)];

    if (!logs[logIndex]) return;

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

    await saveAnswers(
      newAnswers,
      loadingKey,
      t("counseling_section.added_successfully") || "Recorded successfully",
    );
  };

  // Open confirmation modal for deleting the latest log
  const requestDeleteLatest = (questionId: string) => {
    const logs = getLogs(questionId);
    if (logs.length === 0) return;
    setPendingDeleteQuestionId(questionId);
    setDeleteModal(true);
  };

  // Actually perform the delete after confirmation
  const confirmDeleteLatest = async () => {
    if (!pendingDeleteQuestionId) return;

    const questionId = pendingDeleteQuestionId;
    const loadingKey = `delete_${questionId}`;
    const logs = [...getLogs(questionId)];

    if (logs.length === 0) {
      setDeleteModal(false);
      setPendingDeleteQuestionId(null);
      return;
    }

    // Remove the last (latest) entry
    logs.pop();

    const newAnswers = { ...answers, [questionId]: logs };

    const saved = await saveAnswers(
      newAnswers,
      loadingKey,
      t("counseling_section.deleted_successfully") || "Deleted successfully",
    );

    if (saved) setRecord(saved);
    setDeleteModal(false);
    setPendingDeleteQuestionId(null);
  };

  const cancelDelete = () => {
    setDeleteModal(false);
    setPendingDeleteQuestionId(null);
  };

  const openDatePicker = (
    questionId: string,
    logIndex: number,
    dateStr: string,
  ) => {
    try {
      const bsDate = AdToBs(dateStr.split("T")[0]);
      setEditingDateBs(bsDate);
    } catch {
      setEditingDateBs("");
    }
    setEditingQuestionId(questionId);
    setEditingLogIndex(logIndex);
    setDatePickerVisible(true);
  };

  const handleDateSelect = async (bsDate: string) => {
    setDatePickerVisible(false);
    if (editingQuestionId === null || editingLogIndex === null) return;

    const adDate = BsToAd(bsDate);
    const questionId = editingQuestionId;
    const logIndex = editingLogIndex;

    const logs = JSON.parse(JSON.stringify(getLogs(questionId)));

    if (logs[logIndex]) {
      logs[logIndex].date = `${adDate}T00:00:00.000Z`;
    }

    const newAnswers = { ...answers, [questionId]: logs };

    await saveAnswers(
      newAnswers,
      undefined,
      t("counseling_section.updated_successfully") || "Updated successfully",
      t("counseling_section.update_date_failed") || "Failed to update date",
    );

    setEditingQuestionId(null);
    setEditingLogIndex(null);
    setEditingDateBs("");
  };

  const renderLogsInline = (questionId: string) => {
    const logs = getLogs(questionId);
    if (logs.length === 0) return null;
    return renderLogBadges(logs, questionId);
  };

  const renderLogsInlineReadOnly = (questionId: string) => {
    const logs = getLogs(questionId);
    if (logs.length === 0) return null;
    return renderLogBadges(logs, questionId, false, true);
  };

  const renderLogBadges = (
    logs: any[],
    questionId: string,
    showSeverity: boolean = false,
    isReadOnly: boolean = false,
  ) => {
    return (
      <View className="flex-row flex-wrap mt-2 gap-2 items-center">
        {logs.map((log: any, index: number) => {
          let dateStr = "";
          try {
            dateStr =
              language === "np"
                ? toNepaliNumbers(AdToBs(log.date.split("T")[0]))
                : log.date.split("T")[0];
          } catch (e) {
            dateStr = log.date.split("T")[0];
          }
          const isLatest = index === logs.length - 1;
          const canDelete = !isReadOnly && isLatest && isWithinOneDay(log.date);

          let extraInfo = "";
          if (log.muac) {
            const muacShort =
              log.muac === "green" ? "G" : log.muac === "yellow" ? "Y" : "R";
            extraInfo += ` [${muacShort}]`;
          }
          if (log.weight) extraInfo += ` ${log.weight}kg`;
          if (log.height) extraInfo += ` ${log.height}cm`;
          if (questionId === "ors_for_child" && typeof log.value === "number") {
            const displayVal =
              language === "np" ? toNepaliNumbers(log.value) : log.value;
            const unit =
              log.value === 1
                ? t("counseling_section.ors_packet_one")
                : t("counseling_section.ors_packet_other");
            extraInfo += ` (${displayVal} ${unit})`;
          }
          if (
            questionId === "zinc_for_child" &&
            typeof log.value === "number"
          ) {
            const displayVal =
              language === "np" ? toNepaliNumbers(log.value) : log.value;
            const unit =
              log.value === 1
                ? t("counseling_section.zinc_tablet_one")
                : t("counseling_section.zinc_tablet_other");
            extraInfo += ` (${displayVal} ${unit})`;
          }

          return (
            <View
              key={index}
              className={`flex-row items-center ${canDelete ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"} px-2.5 py-1 rounded-md`}
            >
              <TouchableOpacity
                onPress={() => openDatePicker(questionId, index, log.date)}
                disabled={disabled || isReadOnly}
                className="flex-row items-center"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text className="text-[11px] text-slate-600 font-bold">
                  {dateStr}
                  {extraInfo}
                </Text>
              </TouchableOpacity>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => requestDeleteLatest(questionId)}
                  disabled={disabled}
                  className={`ml-1.5 bg-white rounded-full p-0.5 border border-blue-100 ${disabled ? "opacity-50" : ""}`}
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

  const renderCountModal = ({
    visible,
    onClose,
    onSave,
    count,
    setCount,
    titleKey,
    descKey,
    iconBgClass,
    iconColor,
    headerBgClass,
    headerBorderClass,
    accentTextClass,
    accentSoftBgClass,
    loading,
  }: {
    visible: boolean;
    onClose: () => void;
    onSave: () => void;
    count: number;
    setCount: Dispatch<SetStateAction<number>>;
    titleKey: string;
    descKey: string;
    iconBgClass: string;
    iconColor: string;
    headerBgClass: string;
    headerBorderClass: string;
    accentTextClass: string;
    accentSoftBgClass: string;
    loading: boolean;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6">
        <View className="bg-white rounded-2xl pb-2 w-full max-w-[320px]">
          {/* Header */}
          <View
            className={`${headerBgClass} rounded-t-2xl px-5 pt-5 pb-4 items-center ${headerBorderClass}`}
          >
            <View
              className={`w-12 h-12 rounded-full ${iconBgClass} items-center justify-center mb-3`}
            >
              <Plus size={22} color={iconColor} />
            </View>
            <Text className="text-slate-800 text-[18px] font-bold text-center">
              {t(titleKey)}
            </Text>
            <Text className="text-slate-500 text-[13px] text-center mt-1">
              {t(descKey)}
            </Text>
          </View>

          {/* Counter Controls */}
          <View className="p-6 items-center justify-center bg-white">
            <View className="flex-row items-center gap-x-4">
              {/* Decrement */}
              <TouchableOpacity
                onPress={() => setCount((prev) => Math.max(1, prev - 1))}
                disabled={count <= 1}
                className="w-11 h-11 rounded-xl items-center justify-center bg-[#475569]"
              >
                <Text className="font-bold text-xl">
                  <Minus color="white" />
                </Text>
              </TouchableOpacity>

              {/* Input field */}
              <TextInput
                keyboardType="number-pad"
                value={String(count)}
                onChangeText={(txt) => {
                  const val = parseInt(txt.replace(/[^0-9]/g, "")) || 0;
                  setCount(val);
                }}
                className="h-14 flex-1 border border-slate-200 bg-white rounded-xl text-center font-bold text-[19px] text-slate-800 p-0"
              />

              {/* Increment */}
              <TouchableOpacity
                onPress={() => setCount((prev) => prev + 1)}
                className="w-11 h-11 rounded-xl items-center justify-center bg-[#475569]"
              >
                <Text className="font-bold text-xl text-white">
                  <Plus color="white" />
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-slate-100">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3.5 items-center justify-center"
            >
              <Text className="text-slate-500 font-semibold text-[15px]">
                {t("counseling_section.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={count <= 0 || loading}
              className={`flex-1 py-3.5 items-center border-l border-slate-100 justify-center ${accentSoftBgClass}`}
            >
              {loading ? (
                <ActivityIndicator color={iconColor} size="small" />
              ) : (
                <Text className={`${accentTextClass} font-semibold text-[15px]`}>
                  {t("common.save")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOrsModal = () =>
    renderCountModal({
      visible: orsModalVisible,
      onClose: () => setOrsModalVisible(false),
      onSave: handleSaveOrs,
      count: orsCount,
      setCount: setOrsCount,
      titleKey: "counseling_section.distribute_ors_title",
      descKey: "counseling_section.distribute_ors_desc",
      iconBgClass: "bg-blue-100",
      iconColor: "#2563EB",
      headerBgClass: "bg-[#eff6ff]",
      headerBorderClass: "border-b border-blue-50",
      accentTextClass: "text-blue-600",
      accentSoftBgClass: "bg-blue-50",
      loading: loadingButtons["ors_for_child"],
    });

  const renderZincModal = () =>
    renderCountModal({
      visible: zincModalVisible,
      onClose: () => setZincModalVisible(false),
      onSave: handleSaveZinc,
      count: zincCount,
      setCount: setZincCount,
      titleKey: "counseling_section.distribute_zinc_title",
      descKey: "counseling_section.distribute_zinc_desc",
      iconBgClass: "bg-amber-100",
      iconColor: "#D97706",
      headerBgClass: "bg-[#fefce8]",
      headerBorderClass: "border-b border-amber-50",
      accentTextClass: "text-amber-600",
      accentSoftBgClass: "bg-amber-50",
      loading: loadingButtons["zinc_for_child"],
    });

  const renderDatePicker = () => (
    <CalendarPicker
      visible={datePickerVisible}
      onClose={() => {
        setDatePickerVisible(false);
        setEditingQuestionId(null);
        setEditingLogIndex(null);
        setEditingDateBs("");
      }}
      onDateSelect={(bsDate) => handleDateSelect(bsDate)}
      language={language === "en" ? "en" : "np"}
      theme="light"
      brandColor="#2563eb"
      date={editingDateBs || undefined}
    />
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
              dateStr =
                language === "np"
                  ? toNepaliNumbers(AdToBs(log.date.split("T")[0]))
                  : log.date.split("T")[0];
            } catch (e) {
              dateStr = log.date?.split("T")[0] || "";
            }

            const style = getMuacHistoryStyle(log.muac);
            const isLatest = index === logs.length - 1;
            const canDelete = isLatest && isWithinOneDay(log.date);
            const bmiValue = log.bmi ?? calculateBmi(log.weight, log.height);
            const recordNumber =
              language === "np" ? toNepaliNumbers(index + 1) : index + 1;

            const displayWeight =
              language === "np" && log.weight
                ? toNepaliNumbers(log.weight)
                : log.weight;
            const displayHeight =
              language === "np" && log.height
                ? toNepaliNumbers(log.height)
                : log.height;
            const displayBmi =
              language === "np" && bmiValue
                ? toNepaliNumbers(bmiValue)
                : bmiValue;

            const muacColor = getMuacColor(log.muac);
            const subAnswers = log.sub_answers || {};
            const malnutritionQuestions =
              MALNUTRITION_CONTENT.sub_questions.filter((q) =>
                log.muac === "green"
                  ? q.id === "malnutrition_cured"
                  : q.id !== "malnutrition_cured",
              );

            return (
              <View
                key={`${log.date}-${index}`}
                className={`rounded-2xl border ${style.card} p-3`}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="bg-white/80 rounded-full px-2 py-0.5 border border-white/50 mr-2">
                      <Text className="text-[10px] font-bold text-slate-500">
                        {t("counseling_section.record")} #{recordNumber}
                      </Text>
                    </View>
                    <Text className="text-slate-600 text-[12px] font-medium">
                      {dateStr}
                    </Text>
                  </View>
                  {canDelete && (
                    <TouchableOpacity
                      onPress={() => requestDeleteLatest(questionId)}
                      disabled={disabled}
                      className={`w-7 h-7 rounded-full bg-white/90 items-center justify-center ${disabled ? "opacity-50" : ""}`}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2
                        size={12}
                        color={disabled ? "#94A3B8" : "#EF4444"}
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: muacColor }}
                    />
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
                    const isSelected =
                      rawAnswer === true || rawAnswer?.value === true;
                    const loadingKey = `${questionId}_${index}_${q.id}`;

                    return (
                      <View
                        key={q.id}
                        className="flex-row items-center justify-between bg-white/70 border border-white/80 rounded-xl px-3 py-2"
                      >
                        <Text className="flex-1 text-slate-700 text-[13px] font-medium leading-5 mr-3">
                          {language === "np" ? q.ne : q.en}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleSetSubQuestion(index, q.id, !isSelected)
                          }
                          disabled={disabled || loadingButtons[loadingKey]}
                          className={`${isSelected ? "bg-primary" : disabled ? "bg-slate-100" : "bg-slate-700"} w-8 h-8 rounded-lg items-center justify-center`}
                        >
                          {loadingButtons[loadingKey] ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : isSelected ? (
                            <Check size={17} color="white" />
                          ) : (
                            <Plus
                              size={17}
                              color={disabled ? "#CBD5E1" : "white"}
                            />
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

    let malnutritionLogs: any[] = getLogs(mainQuestionId);

    const latestLog =
      malnutritionLogs.length > 0
        ? malnutritionLogs[malnutritionLogs.length - 1]
        : null;
    const chevronRotation = chevronRotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "-90deg"],
    });

    const renderCollapsedSummary = () => {
      if (latestLog) {
        const muacColor = getMuacColor(latestLog.muac);
        let dateStr = "";
        try {
          dateStr =
            language === "np"
              ? toNepaliNumbers(AdToBs(latestLog.date.split("T")[0]))
              : latestLog.date.split("T")[0];
        } catch (e) {
          dateStr = latestLog.date?.split("T")[0] || "";
        }
        const recordCount =
          language === "np"
            ? toNepaliNumbers(malnutritionLogs.length)
            : malnutritionLogs.length;
        return (
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full mr-2"
                style={{ backgroundColor: muacColor }}
              />
              <Text className="text-slate-700 font-semibold text-[15px]">
                {getMuacLabel(latestLog.muac)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-slate-400 text-[12px] font-medium mr-3">
                {dateStr}
              </Text>
              <View className="bg-slate-100 rounded-full px-2.5 py-0.5">
                <Text className="text-slate-500 text-[11px] font-bold">
                  {recordCount} {t("counseling_section.records")}
                </Text>
              </View>
            </View>
          </View>
        );
      }
      return (
        <View className="px-4 py-3">
          <Text className="text-slate-400 text-[14px] font-medium italic">
            {t("counseling_section.no_records")}
          </Text>
        </View>
      );
    };

    return (
      <View className="mb-8 bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <TouchableOpacity
          onPress={toggleMalnutrition}
          activeOpacity={0.7}
          className="flex-row items-center p-4 bg-red-50/10 border-b border-slate-50"
        >
          <View className="w-8 h-8 rounded-lg bg-red-100 items-center justify-center mr-3">
            <BarChart3 size={18} color="#DC2626" />
          </View>
          <Text className="text-xl font-bold text-slate-800 flex-1">
            {t("counseling_section.malnutrition_screening")}
          </Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <ChevronDown size={22} color="#DC2626" />
          </Animated.View>
        </TouchableOpacity>

        {!malnutritionExpanded && renderCollapsedSummary()}

        {malnutritionExpanded && (
          <View className="p-4">
            <Text className="text-slate-600 font-semibold mb-3 text-[15px]">
              {t("counseling_section.muac_condition")}
            </Text>
            <View className="flex-row gap-x-2 mb-6">
              <TouchableOpacity
                onPress={() => setMuac("green")}
                disabled={disabled}
                className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${muac === "green" ? "bg-emerald-500 border-emerald-500" : disabled ? "bg-slate-50 border-slate-100" : "bg-white border-slate-201"}`}
              >
                <Text
                  className={`font-bold text-[15px] ${muac === "green" ? "text-white" : disabled ? "text-slate-300" : "text-emerald-700"}`}
                >
                  {t("counseling_section.muac_normal")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMuac("yellow")}
                disabled={disabled}
                className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${muac === "yellow" ? "bg-yellow-400 border-yellow-400" : disabled ? "bg-slate-50 border-slate-100" : "bg-white border-slate-201"}`}
              >
                <Text
                  className={`font-bold text-[15px] ${muac === "yellow" ? "text-white" : disabled ? "text-slate-300" : "text-yellow-700"}`}
                >
                  {t("counseling_section.muac_risk")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMuac("red")}
                disabled={disabled}
                className={`flex-1 py-3 px-1 rounded-xl border items-center justify-center ${muac === "red" ? "bg-rose-500 border-rose-500" : disabled ? "bg-slate-50 border-slate-100" : "bg-white border-slate-201"}`}
              >
                <Text
                  className={`font-bold text-[15px] ${muac === "red" ? "text-white" : disabled ? "text-slate-300" : "text-rose-700"}`}
                >
                  {t("counseling_section.muac_severe")}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-x-4 mb-6">
              <View className="flex-1">
                <Text className="text-slate-600 font-semibold mb-2 text-[15px]">
                  {t("counseling_section.weight_kg")}
                </Text>
                <View
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-4 ${disabled ? "opacity-50" : ""}`}
                >
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
                <View
                  className={`bg-slate-50 border border-slate-200 rounded-xl px-4 ${disabled ? "opacity-50" : ""}`}
                >
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
                  {bmi
                    ? language === "np"
                      ? toNepaliNumbers(bmi)
                      : bmi
                    : "---"}
                </Text>
              </View>
              <Text className="text-slate-500 text-[13px] font-medium max-w-[160px] text-right">
                {t("counseling_section.bmi_auto")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAddMalnutrition}
              disabled={!muac || disabled || loadingButtons[mainQuestionId]}
              className={`w-full py-2.5 rounded-xl items-center justify-center mb-4 ${!muac || disabled || loadingButtons[mainQuestionId] ? "bg-slate-300" : "bg-primary"}`}
            >
              {loadingButtons[mainQuestionId] ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {t("counseling_section.add")}
                </Text>
              )}
            </TouchableOpacity>

            {muac === "green" && (
              <View className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-4 items-center">
                <Text className="text-emerald-700 font-semibold italic text-sm">
                  {t("counseling_section.malnutrition_good")}
                </Text>
              </View>
            )}

            {renderMalnutritionHistory(malnutritionLogs, mainQuestionId)}
          </View>
        )}
      </View>
    );
  };

  const renderCounselingGroup = () => {
    const isConditionBad = answers["good_health_condition"]?.length > 0;
    const hasDiarrhea = answers["has_diarrhea"]?.length > 0;
    const hasBreathingProblems = answers["has_breathing_problems"]?.length > 0;

    let visibleOneTime = ONE_TIME_CHILD_COUNSELING_QUESTIONS;
    let visibleRoutine = CHILD_COUNSELING_QUESTIONS.filter(
      (q) => !ONE_TIME_CHILD_COUNSELING_QUESTIONS.some((oq) => oq.id === q.id)
    );
    let visibleHealth = CHILD_HEALTH_COUNSELLING_QUESTIONS.filter((q) => {
      if (q.id === "good_health_condition") return true;
      if (!isConditionBad) return false;
      if (
        q.id === "diarrhea_treated_with_ors_zinc" ||
        q.id === "ors_for_child" ||
        q.id === "zinc_for_child"
      ) {
        return hasDiarrhea;
      }
      if (
        q.id === "has_pneumonia" ||
        q.id === "referred_breathing_problems" ||
        q.id === "home_treatment_cold"
      ) {
        return hasBreathingProblems;
      }
      return true;
    });
    let visibleReg = REGISTRATION_COUNSELING_QUESTIONS.filter((q) => {
      if (q.id === "birth_registration_counseling") return !birthRegistered || (answers[q.id]?.length > 0);
      if (q.id === "death_registration_counseling") return isDead || (answers[q.id]?.length > 0);
      return true;
    });

    const renderReadOnlySection = (title: string, questions: any[]) => {
      if (questions.length === 0) return null;
      return (
        <View className="mb-4">
          <Text className="text-slate-500 font-bold text-[12px] uppercase tracking-wider mb-2 pl-1">
            {title}
          </Text>
          <View className="bg-slate-50 rounded-xl overflow-hidden border border-slate-100/80">
            {questions.map((q, idx) => {
              const logs = answers[q.id] || [];
              const hasLogs = logs.length > 0;
              return (
                <View
                  key={q.id}
                  className={`py-3 px-4 ${idx > 0 ? "border-t border-slate-200/50" : ""}`}
                >
                  <Text className={`text-[15px] font-semibold ${hasLogs ? "text-slate-800" : "text-slate-400"}`}>
                    {language === "np" ? q.ne : q.en}
                  </Text>
                  {hasLogs ? (
                    renderLogsInlineReadOnly(q.id)
                  ) : (
                    <Text className="text-[12px] text-slate-400 italic mt-1 pl-0.5">
                      {language === "np" ? "अझै थपिएको छैन" : "Not counseling yet"}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      );
    };

    return (
      <View className="bg-white rounded-2xl mb-6 py-4 px-3 border border-slate-100">
        <View className="flex-row items-center mb-4 ml-1">
          <MessageSquare size={20} color="#166534" />
          <Text className="text-[#166534] font-bold text-lg ml-2">
            {t("counseling_section.counseling", { defaultValue: "Counseling Records" })}
          </Text>
        </View>

        {renderReadOnlySection(
          t("visit.sections.one_time_counseling", { defaultValue: "One-Time Counseling" }),
          visibleOneTime
        )}
        {renderReadOnlySection(
          t("visit.sections.routine_counseling", { defaultValue: "Routine Counseling" }),
          visibleRoutine
        )}
        {renderReadOnlySection(
          t("visit.sections.health_status_counseling", { defaultValue: "Health Status & Illness Counseling" }),
          visibleHealth
        )}
        {renderReadOnlySection(
          t("visit.sections.registration_counseling", { defaultValue: "Registration Counseling" }),
          visibleReg
        )}
      </View>
    );
  };

  if (loading) return null;

  return (
    <View className="mt-2">
      {renderDeleteConfirmModal()}
      {renderOrsModal()}
      {renderZincModal()}
      {renderDatePicker()}
      {renderMalnutritionGroup()}
      {renderCounselingGroup()}
    </View>
  );
}
