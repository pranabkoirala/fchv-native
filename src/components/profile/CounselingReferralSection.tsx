import { useLanguage } from "@/context/LanguageContext";
import { ClipboardList, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import {
  COUNCELING_QUESTION_AFTER_PREGNANT,
  COUNCELING_QUESTION_AFTER_PREGNANT_ONE_TIME,
  COUNSELING_REFERRAL_QUESTIONS,
  COUNSELING_REFERRAL_QUESTIONS_AFTER_CHILD_BORN,
  COUNSELING_REFERRAL_QUESTIONS_ONE_TIME_MOTHER
} from "../../constants/CounselingQuestions";
import { useToast } from "../../context/ToastContext";

import { CounselingReferralStoreType, getCounselingReferralByMother, getCounselingReferralHistory, saveCounselingReferral } from "@/hooks/database/models/CounselingReferralModel";
import { getInfantMonitoringsByMother } from "@/hooks/database/models/InfantMonitoringModel";
import { getPregnancyByMotherId } from "../../hooks/database/models/PregnantWomenModal";
import { toNepaliNumbers } from "../../utils/dateHelper";

interface CounselingReferralSectionProps {
  motherId: string;
  disabled?: boolean;
}

export default function CounselingReferralSection({
  motherId,
  disabled
}: CounselingReferralSectionProps) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();

  const [record, setRecord] = useState<CounselingReferralStoreType | null>(
    null,
  );
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [historyAnswers, setHistoryAnswers] = useState<Record<string, any>>({});
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasChild, setHasChild] = useState(false);
  const [currentPregnancyId, setCurrentPregnancyId] = useState<string | null>(null);
  const [addingQuestionId, setAddingQuestionId] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const pregnancy = await getPregnancyByMotherId(motherId);
      setIsPregnant(!!pregnancy);
      const pregId = pregnancy?.id || null;
      setCurrentPregnancyId(pregId);

      const children = await getInfantMonitoringsByMother(motherId);
      setHasChild(children && children.length > 0);

      const data = await getCounselingReferralByMother(motherId, pregId);
      setRecord(data);
      if (data?.answers) {
        setAnswers(JSON.parse(data.answers));
      }

      // Load full history for disabling already added ones
      const history = await getCounselingReferralHistory(motherId, pregId);
      const aggregated: Record<string, any> = {};
      history.forEach(h => {
        if (h.answers) {
          const parsed = JSON.parse(h.answers);
          Object.keys(parsed).forEach(key => {
            if (!aggregated[key]) aggregated[key] = [];
            const logs = Array.isArray(parsed[key]) ? parsed[key] : (parsed[key] === true ? [{ date: h.updated_at, value: true }] : []);
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
  }, [motherId]);

  const handleAdd = async (questionId: string) => {
    if (addingQuestionId) return;

    const currentTime = new Date().toISOString();

    let existingLogs = [];
    if (Array.isArray(answers[questionId])) {
      existingLogs = answers[questionId];
    } else if (answers[questionId] === true) {
      // Migrate old boolean format if it exists
      existingLogs = [{ date: record?.updated_at || currentTime, value: true }];
    }

    const newLog = { date: currentTime, value: true };
    const newAnswers = { ...answers, [questionId]: [...existingLogs, newLog] };

    setAnswers(newAnswers);
    setAddingQuestionId(questionId);

    try {
      await saveCounselingReferral({
        id: record?.id,
        mother_id: motherId,
        pregnancy_id: currentPregnancyId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.added_successfully"));
      await loadData(); // Refresh history
    } catch (e) {
      console.error("Failed to save answer", e);
      showToast(t("counseling_section.failed_to_save"));
      setAnswers(answers);
    } finally {
      setAddingQuestionId(null);
    }
  };

  const requestDeleteLatest = (questionId: string) => {
    setPendingDeleteQuestionId(questionId);
    setDeleteModal(true);
  };

  const confirmDeleteLatest = async () => {
    if (!pendingDeleteQuestionId) return;

    const questionId = pendingDeleteQuestionId;
    const logs = Array.isArray(answers[questionId]) ? [...answers[questionId]] : [];

    if (logs.length === 0) {
      setDeleteModal(false);
      return;
    }

    logs.pop(); // Remove the latest entry

    const newAnswers = { ...answers, [questionId]: logs };
    setAnswers(newAnswers);

    try {
      await saveCounselingReferral({
        id: record?.id,
        mother_id: motherId,
        pregnancy_id: currentPregnancyId,
        answers: JSON.stringify(newAnswers),
      });
      showToast(t("counseling_section.deleted_successfully"));
      loadData(); // Refresh history
    } catch (e) {
      console.error("Failed to delete", e);
      showToast(t("counseling_section.failed_to_delete"));
      setAnswers(answers);
    } finally {
      setDeleteModal(false);
      setPendingDeleteQuestionId(null);
    }
  };

  const renderDeleteConfirmModal = () => (
    <Modal
      visible={deleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setDeleteModal(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-6 pb-3">
        <View className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden">
          <View className="bg-red-50 px-5 pt-5 pb-4 items-center">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-3">
              <Trash2 size={22} color="#DC2626" />
            </View>
            <Text className="text-slate-800 text-xl font-semibold text-center">
              {t("counseling_section.delete_confirm_title")}
            </Text>
          </View>
          <View className="px-5 py-4">
            <Text className="text-slate-600 text-[15px] text-center leading-relaxed">
              {t("counseling_section.delete_confirm_message")}
            </Text>
          </View>
          <View className="flex-row border-t pb-5 border-slate-100">
            <TouchableOpacity
              onPress={() => setDeleteModal(false)}
              className="flex-1 py-3.5 items-center"
            >
              <Text className="text-slate-500 font-medium text-[15px]">
                {t("counseling_section.delete_confirm_no")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmDeleteLatest}
              className="flex-1 py-3.5 items-center"
            >
              <Text className="text-red-600 font-medium text-[15px]">
                {t("counseling_section.delete_confirm_yes")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLogs = (questionId: string) => {
    const logs = Array.isArray(historyAnswers[questionId]) ? historyAnswers[questionId] : [];
    if (logs.length === 0) return null;

    return (
      <View className="flex-1 flex-row flex-wrap mt-2 gap-2 items-center">
        {logs.map((log: any, index: number) => {
          const isLatest = index === logs.length - 1;
          const isToday = log.date?.split("T")[0] === new Date().toISOString().split("T")[0];
          const canDelete = isLatest && isToday; // ONLY allow deletion if it was recorded today

          let dateStr = "";
          try {
            const pureDate = log.date.split("T")[0];
            dateStr = language === "np" ? toNepaliNumbers(AdToBs(pureDate)) : pureDate;
          } catch (e) {
            dateStr = log.date.split("T")[0];
          }

          return (
            <View key={index} className={`flex-row items-center ${canDelete ? "bg-red-50 border border-red-100" : "bg-slate-50 border border-slate-100"} px-2 py-1 rounded-md`}>
              <Text className={`text-[13px] font-medium ${canDelete ? "text-red-700" : "text-slate-500"}`}>
                {t("counseling_section.log_prefix", { index: language === "np" ? toNepaliNumbers(index + 1) : index + 1, date: dateStr })}
              </Text>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => requestDeleteLatest(questionId)}
                  disabled={disabled}
                  className="ml-1.5"
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

  const renderQuestionList = (questions: any[], isOneTime: boolean = false) => {
    return questions.map((question) => {
      const logs = Array.isArray(historyAnswers[question.id]) ? historyAnswers[question.id] : [];
      const isRecordedEver = logs.length > 0;
      const disableAdd = isOneTime && isRecordedEver;
      const isAdding = addingQuestionId === question.id;
      const isAddDisabled = disableAdd || disabled || isAdding;
      const isUnavailable = disableAdd || disabled;

      return (
        <View
          key={question.id}
          className="p-4 border-b border-slate-50"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-4">
              <Text
                className={"text-slate-800 font-semibold text-[16px] leading-relaxed"}
              >
                {t(`counseling_section.questions.${question.id}`)}
              </Text>
            </View>
            <TouchableOpacity
              disabled={isAddDisabled}
              onPress={() => handleAdd(question.id)}
              activeOpacity={0.75}
              style={{ opacity: 1, width: 32, height: 32, minWidth: 32, flexShrink: 0 }}
              className={`items-center justify-center rounded-lg ${isUnavailable && !isAdding ? "bg-slate-100" : "bg-[#475569]"}`}
            >
              {isAdding ? (
                <ActivityIndicator size={15} color="white" />
              ) : (
                <Plus size={19} color={isUnavailable ? "#94a3b8" : "white"} strokeWidth={3} />
              )}
            </TouchableOpacity>
          </View>
          {isRecordedEver && renderLogs(question.id)}
        </View>
      );
    });
  };

  if (loading) return null;

  return (
    <View className="gap-y-4">
      {renderDeleteConfirmModal()}

      {/* General Counseling Section */}
      <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <View className="flex-row items-center px-4 py-3 bg-amber-50/10 border-b border-slate-50">
          <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
            <ClipboardList size={18} color="#64748B" />
          </View>
          <Text className="text-xl font-medium text-slate-800">
            {t("counseling_section.general_details")}
          </Text>
        </View>
        <View>
          {renderQuestionList(COUNSELING_REFERRAL_QUESTIONS, false)}
          {renderQuestionList(COUNSELING_REFERRAL_QUESTIONS_ONE_TIME_MOTHER, true)}
        </View>
      </View>

      {/* Pregnancy Specific Counseling Section */}
      {isPregnant && (
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <View className="flex-row items-center px-4 py-3 bg-gray-50/30 border-b border-gray-50">
            <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
              <ClipboardList size={18} color="#64748B" />
            </View>
            <Text className="text-xl font-semibold text-gray-800">
              {t("counseling_section.after_pregnancy")}
            </Text>
          </View>
          <View>
            {renderQuestionList(COUNCELING_QUESTION_AFTER_PREGNANT, false)}
            {renderQuestionList(COUNCELING_QUESTION_AFTER_PREGNANT_ONE_TIME, true)}
          </View>
        </View>
      )}

      {/* Post-Birth Specific Counseling Section */}
      {hasChild && (
        <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <View className="flex-row items-center px-4 py-3 bg-gray-50/30 border-b border-gray-50">
            <View className="w-8 h-8 rounded-lg bg-gray-100 items-center justify-center mr-3">
              <ClipboardList size={18} color="#64748B" />
            </View>
            <Text className="text-xl font-semibold text-gray-800">
              {t("counseling_section.after_child_birth")}
            </Text>
          </View>
          <View>
            {renderQuestionList(COUNSELING_REFERRAL_QUESTIONS_AFTER_CHILD_BORN, false)}
          </View>
        </View>
      )}
    </View>
  );
}
