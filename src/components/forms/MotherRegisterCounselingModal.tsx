import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { saveCounselingReferral } from "@/hooks/database/models/CounselingReferralModel";
import { Check, X } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COUNSELING_REFERRAL_QUESTIONS_ONE_TIME_MOTHER } from "../../constants/CounselingQuestions";
import ModalWithSafeArea from "../common/ModalWithSafeArea";

interface MotherRegisterCounselingModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
}

export default function MotherRegisterCounselingModal({
  visible,
  onClose,
  motherId,
}: MotherRegisterCounselingModalProps) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const toggleQuestion = (questionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    try {
      const answersForSave: Record<string, any> = {};
      Object.entries(answers).forEach(([questionId, completed]) => {
        if (completed) {
          answersForSave[questionId] = [
            { date: new Date().toISOString(), value: true },
          ];
        }
      });

      await saveCounselingReferral({
        mother: motherId,
        pregnancy: null,
        answers: JSON.stringify(answersForSave),
      });

      showToast(t("counseling_section.added_successfully"));
    } catch (e) {
      console.error("Failed to save counseling answers", e);
      showToast(t("counseling_section.failed_to_save"));
    } finally {
      setSaving(false);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <ModalWithSafeArea
      visible={visible}
      onRequestClose={handleSkip}
      animationType="fade"
      transparent
    >
      <Pressable onPress={handleSkip} className="flex-1 bg-black/50 justify-center items-center px-5">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-sm rounded-2xl max-h-[90%]"
        >
          {/* Header */}
          <View className="px-5 pt-5 pb-3 flex-row items-center justify-between border-b border-slate-100">
            <Text className="text-[16px] font-bold text-slate-800">
              {t("counseling_section.mother_register_title")}
            </Text>
            <TouchableOpacity onPress={handleSkip} className="p-1.5 bg-slate-100 rounded-full active:bg-slate-200">
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Questions */}
          <ScrollView className="px-5 py-3" showsVerticalScrollIndicator={false}>
            {COUNSELING_REFERRAL_QUESTIONS_ONE_TIME_MOTHER.map((question) => {
              const isCompleted = !!answers[question.id];
              return (
                <TouchableOpacity
                  key={question.id}
                  onPress={() => toggleQuestion(question.id)}
                  activeOpacity={0.7}
                  className={`flex-row items-center p-3.5 rounded-xl mb-2.5 border ${
                    isCompleted
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full items-center justify-center mr-3 ${
                      isCompleted
                        ? "bg-emerald-500"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {isCompleted && <Check size={12} color="white" strokeWidth={4} />}
                  </View>
                  <Text
                    className={`flex-1 text-[13px] leading-relaxed ${
                      isCompleted ? "font-semibold text-slate-800" : "font-medium text-slate-600"
                    }`}
                  >
                    {language === "np" ? question.ne : question.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Action buttons */}
          <View className="px-5 pb-5 pt-2 border-t border-slate-100 mt-1">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleSkip}
                className="flex-1 h-12 border border-slate-200 rounded-xl items-center justify-center active:bg-slate-50"
                disabled={saving}
              >
                <Text className="font-semibold text-slate-600 text-[14px]">
                  {t("counseling_section.skip")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveAndContinue}
                disabled={saving}
                className="flex-1 h-12 bg-slate-800 rounded-xl items-center justify-center active:bg-slate-900"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-bold text-white text-[14px]">
                    {t("counseling_section.save_continue")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </ModalWithSafeArea>
  );
}
