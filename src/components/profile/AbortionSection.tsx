import { AlertTriangle, HeartOff, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { useToast } from "../../context/ToastContext";
import {
  getAbortionByMotherAndPregnancy,
  saveAbortion,
} from "../../hooks/database/models/AbortionModel";
import { updatePregnancy } from "../../hooks/database/models/PregnantWomenModal";
import { AbortionStoreType } from "../../hooks/database/types/abortionModal";
import ConfirmActionModal from "../common/ConfirmActionModal";

interface AbortionSectionProps {
  motherId: string;
  pregnancyId: string | null;
  disabled?: boolean;
  onAbortionRecorded?: () => void;
}

export default function AbortionSection({
  motherId,
  pregnancyId,
  disabled,
  onAbortionRecorded,
}: AbortionSectionProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [record, setRecord] = useState<AbortionStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      const data = await getAbortionByMotherAndPregnancy(motherId, pregnancyId);
      setRecord(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const executeAbortion = async () => {
    try {
      setIsSaving(true);

      await saveAbortion({
        mother: motherId,
        pregnancy: pregnancyId,
        aborted: true,
      });

      if (pregnancyId) {
        await updatePregnancy(pregnancyId, {
          ended: true,
          is_current: false,
        });
      }

      setConfirmVisible(false);
      await loadData();
      onAbortionRecorded?.();
      showToast(t("profile.abortion.save_success") || "Abortion recorded");
    } catch (e) {
      console.error(e);
      showToast(t("profile.abortion.save_error"));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [motherId, pregnancyId]);

  if (loading) return null;

  const hasAbortion = record?.aborted === 1;

  return (
    <View>
      <View
        className={`rounded-2xl border overflow-hidden ${hasAbortion ? "border-red-200" : "border-slate-100"}`}
      >
        <View
          className={`px-4 py-3.5 ${hasAbortion ? "bg-red-50/50" : "bg-slate-50"}`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className={`w-9 h-9 rounded-full items-center justify-center ${hasAbortion ? "bg-red-100" : "bg-slate-100"}`}
              >
                <HeartOff
                  size={16}
                  color={hasAbortion ? "#BE123C" : "#64748B"}
                  strokeWidth={1.5}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className={`font-semibold text-[15px] ${hasAbortion ? "text-red-700" : "text-slate-800"}`}
                >
                  {t("profile.abortion.title")}
                </Text>
                <Text
                  className={`text-[13px] font-medium mt-0.5 ${hasAbortion ? "text-red-400" : "text-slate-500"}`}
                >
                  {hasAbortion
                    ? t("profile.abortion.yes")
                    : t("profile.abortion.question")}
                </Text>
              </View>
            </View>
            {hasAbortion && (
              <View className="px-2.5 py-1 rounded-full bg-red-100 border border-red-200">
                <Text className="text-[11px] font-bold uppercase tracking-wide text-red-600">
                  {t("profile.abortion.already_recorded")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!hasAbortion && (
          <View className="px-4 py-3 bg-white">
            <TouchableOpacity
              onPress={() => setConfirmVisible(true)}
              disabled={disabled || isSaving}
              className={`flex-row items-center justify-center py-3 rounded-xl border-2 border-dashed ${
                disabled || isSaving
                  ? "border-slate-200 opacity-50"
                  : "border-red-200"
              }`}
            >
              <Plus
                size={16}
                color={disabled ? "#CBD5E1" : "#BE123C"}
                strokeWidth={3}
              />
              <Text
                className={`font-bold text-[13px] ml-1.5 ${disabled ? "text-slate-300" : "text-red-600"}`}
              >
                {t("profile.abortion.add_action")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {hasAbortion && (
          <View className="px-4 py-3 bg-white">
            <View className="flex-row items-center justify-center py-2 rounded-xl bg-red-50 border border-red-100">
              <HeartOff size={15} color="#BE123C" strokeWidth={2} />
              <Text className="text-red-600 font-semibold text-[13px] ml-1.5">
                {t("profile.abortion.yes")}
              </Text>
            </View>
          </View>
        )}
      </View>

      <ConfirmActionModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        title={t("profile.abortion.confirm_title")}
        description={t("profile.abortion.confirm_message")}
        actionLabel={t("profile.abortion.confirm_action")}
        onAction={executeAbortion}
        loading={isSaving}
      />
    </View>
  );
}
