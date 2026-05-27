import { useLanguage } from "@/context/LanguageContext";
import { BarChart3, Check, MessageSquare, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import {
  CHILD_COUNSELING_QUESTIONS,
  MALNUTRITION_CONTENT
} from "../../../constants/ChildCounselingQuestions";
import { useToast } from "../../../context/ToastContext";
import {
  ChildCounselingStoreType,
  getChildCounselingByChild,
  saveChildCounseling,
} from "../../../hooks/database/models/ChildCounselingModel";

interface ChildCounselingSectionProps {
  childId: string;
}

const toNepaliNumbers = (num: number | string) => {
  const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(num).replace(/[0-9]/g, (match) => nepaliDigits[parseInt(match)]);
};

export default function ChildCounselingSection({
  childId,
}: ChildCounselingSectionProps) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [record, setRecord] = useState<ChildCounselingStoreType | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await getChildCounselingByChild(childId);
      setRecord(data);
      if (data?.answers) {
        setAnswers(JSON.parse(data.answers));
      }
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
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child_id: childId,
        answers: JSON.stringify(newAnswers),
      });
    } catch (e) {
      console.error("Failed to save answer", e);
      showToast("Failed to save");
      setAnswers(answers);
    }
  };

  const handleAdd = async (questionId: string, customLogValue?: any) => {
    const currentTime = new Date().toISOString();

    let existingLogs = [];
    if (Array.isArray(answers[questionId])) {
      existingLogs = answers[questionId];
    } else if (answers[questionId]) {
      existingLogs = [{ date: record?.updated_at || currentTime, value: true }];
    }

    const newLog = { date: currentTime, value: customLogValue || true };
    const newAnswers = { ...answers, [questionId]: [...existingLogs, newLog] };

    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child_id: childId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.added_successfully"));
    } catch (e) {
      console.error("Failed to save answer", e);
      showToast("Failed to save");
      setAnswers(answers);
    }
  };

  // Open confirmation modal for deleting the latest log
  const requestDeleteLatest = (questionId: string) => {
    const logs = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    if (logs.length === 0) return;
    setPendingDeleteQuestionId(questionId);
    setDeleteModal(true);
  };

  // Actually perform the delete after confirmation
  const confirmDeleteLatest = async () => {
    if (!pendingDeleteQuestionId) return;

    const questionId = pendingDeleteQuestionId;
    let logs = Array.isArray(answers[questionId]) ? [...answers[questionId]] : [];

    if (logs.length === 0) {
      setDeleteModal(false);
      setPendingDeleteQuestionId(null);
      return;
    }

    // Remove the last (latest) entry
    logs.pop();

    const newAnswers = { ...answers, [questionId]: logs };
    setAnswers(newAnswers);

    try {
      await saveChildCounseling({
        id: record?.id,
        child_id: childId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.deleted_successfully"));
    } catch (e) {
      console.error("Failed to delete answer", e);
      showToast("Failed to delete");
      setAnswers(answers);
    } finally {
      setDeleteModal(false);
      setPendingDeleteQuestionId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModal(false);
    setPendingDeleteQuestionId(null);
  };

  const getLogsCount = (questionId: string): number => {
    if (Array.isArray(answers[questionId])) return answers[questionId].length;
    if (answers[questionId]) return 1;
    return 0;
  };

  const renderLogsInline = (questionId: string) => {
    let logs = [];
    if (Array.isArray(answers[questionId])) {
      logs = answers[questionId];
    } else if (answers[questionId]) {
      logs = [{ date: record?.updated_at || new Date().toISOString(), value: true }];
    }

    if (logs.length === 0) return null;

    return (
      <View className="flex-1 flex-row flex-wrap mt-2 gap-2 items-center">
        {logs.map((log: any, index: number) => {
          let dateStr = "";
          try {
            dateStr = language === "np" ? toNepaliNumbers(AdToBs(log.date.split("T")[0])) : log.date.split("T")[0];
          } catch (e) {
            dateStr = log.date.split("T")[0];
          }
          const isLatest = index === logs.length - 1;
          const isToday = log.date?.split("T")[0] === new Date().toISOString().split("T")[0];
          const canDelete = isLatest && isToday;
          return (
            <View key={index} className={`flex-row items-center ${canDelete ? "bg-blue-100" : "bg-slate-200"} px-2 py-1 rounded`}>
              <Text className="text-[10px] text-slate-600 font-medium">
                {t("counseling_section.record")} #{language === "np" ? toNepaliNumbers(index + 1) : index + 1}: {dateStr}
              </Text>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => requestDeleteLatest(questionId)}
                  className="ml-1.5"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={10} color="#DC2626" />
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
        <View className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden">
          {/* Header */}
          <View className="bg-red-50 px-5 pt-5 pb-4 items-center">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-3">
              <Trash2 size={22} color="#DC2626" />
            </View>
            <Text className="text-slate-800 text-[16px] font-bold text-center">
              {t("counseling_section.delete_confirm_title")}
            </Text>
          </View>

          {/* Body */}
          <View className="px-5 py-4">
            <Text className="text-slate-600 text-[13px] text-center leading-relaxed">
              {t("counseling_section.delete_confirm_message")}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row border-t border-slate-100">
            <TouchableOpacity
              onPress={cancelDelete}
              className="flex-1 py-3.5 items-center border-r border-slate-100"
              activeOpacity={0.7}
            >
              <Text className="text-slate-500 font-semibold text-[14px]">
                {t("counseling_section.delete_confirm_no")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDeleteLatest}
              className="flex-1 py-3.5 items-center"
              activeOpacity={0.7}
            >
              <Text className="text-red-600 font-bold text-[14px]">
                {t("counseling_section.delete_confirm_yes")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderMalnutritionGroup = () => {
    const hasMalnutrition = answers[MALNUTRITION_CONTENT.main_question.id] || false;
    const severity = answers["malnutrition_severity"] || "";

    return (
      <View className="mb-8">
        <View className="flex-row items-center mb-3 ml-1">
          <BarChart3 size={18} color="#DC2626" />
          <Text className="text-[#DC2626] font-semibold text-lg ml-2">
            {t("counseling_section.malnutrition_screening")}
          </Text>
        </View>

        <View className="bg-white rounded-xl border border-red-50 p-4 px-3">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-slate-800 font-semibold text-[14px] leading-relaxed mr-4">
              {t("counseling_section.is_malnourished")}
            </Text>
            <TouchableOpacity
              onPress={() => handleToggle(MALNUTRITION_CONTENT.main_question.id, !hasMalnutrition)}
              className={`w-[22px] h-[22px] rounded border items-center justify-center ${hasMalnutrition ? "bg-white border-slate-300" : "bg-white border-slate-300"
                }`}
            >
              {hasMalnutrition && <Check size={14} color="#334155" />}
            </TouchableOpacity>
          </View>

          {hasMalnutrition && (
            <View className="mt-5 gap-y-3">
              {/* Severity Buttons */}
              <View className="flex-row gap-x-3 mb-2">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleToggle("malnutrition_severity", "medium")}
                  className={`flex-1 py-3 rounded-lg border items-center justify-center ${severity === "medium" ? "bg-[#DBEAFE] border-[#94A3B8]" : "bg-white border-slate-300"
                    }`}
                >
                  <Text className={`font-medium ${severity === "medium" ? "text-slate-800" : "text-slate-500"}`}>
                    {t("counseling_section.severity_medium")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleToggle("malnutrition_severity", "high")}
                  className={`flex-1 py-3 rounded-lg border items-center justify-center ${severity === "high" ? "bg-[#DBEAFE] border-[#94A3B8]" : "bg-white border-slate-300"
                    }`}
                >
                  <Text className={`font-medium ${severity === "high" ? "text-slate-800" : "text-slate-500"}`}>
                    {t("counseling_section.severity_severe")}
                  </Text>
                </TouchableOpacity>
              </View>

              {MALNUTRITION_CONTENT.sub_questions.map((q) => {
                return (
                  <View
                    key={q.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-200"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-4">
                        <Text className="text-slate-700 text-[14px] font-medium leading-relaxed">
                          {language === "np" ? q.ne : q.en}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleAdd(q.id)}
                        className="bg-[#475569] px-3 py-2 rounded-full flex-row items-center ml-2"
                      >
                        <Plus size={13} color="white" />
                        <Text className="text-white text-[10px] font-medium ml-1.5">
                          {t("counseling_section.add")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {renderLogsInline(q.id)}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCounselingGroup = () => {
    return (
      <View className="mb-6">
        <View className="flex-row items-center mb-3 ml-1">
          <MessageSquare size={20} color="#166534" />
          <Text className="text-[#166534] font-bold text-lg ml-2">{t("counseling_section.counseling")}</Text>
        </View>

        <View className="bg-white rounded-xl border border-slate-100">
          {CHILD_COUNSELING_QUESTIONS.map((q, index) => {
            const isLast = index === CHILD_COUNSELING_QUESTIONS.length - 1;
            return (
              <View
                key={q.id}
                className={`bg-white p-3.5 border border-slate-200 ${!isLast ? "border-b border-slate-100" : ""}`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-slate-700 text-[14px] font-medium leading-relaxed">
                      {language === "np" ? toNepaliNumbers(index + 1) : index + 1}. {language === "np" ? q.ne : q.en}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdd(q.id)}
                    className="bg-[#475569] px-3 py-2 rounded-full flex-row items-center ml-2"
                  >
                    <Plus size={13} color="white" />
                    <Text className="text-white text-[10px] font-medium ml-1.5">
                      {t("counseling_section.add")}
                    </Text>
                  </TouchableOpacity>
                </View>
                {renderLogsInline(q.id)}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return null;
  }

  return (
    <View className="mt-2">
      {renderDeleteConfirmModal()}
      {renderMalnutritionGroup()}
      {renderCounselingGroup()}
    </View>
  );
}
