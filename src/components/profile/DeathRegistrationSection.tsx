import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { getChildDeathRegistration, saveChildDeathRegistration } from "@/hooks/database/models/ChildDeathRegistrationModel";
import { ChildDeathRegistrationStoreType } from "@/hooks/database/types/childDeathRegistration";
import { Activity, Check } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface Props {
  childId: string;
  disabled?: boolean;
}

export default function DeathRegistrationSection({ childId, disabled }: Props) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [record, setRecord] = useState<ChildDeathRegistrationStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRecord = useCallback(async () => {
    try {
      const data = await getChildDeathRegistration(childId);
      setRecord(data);
    } catch (e) {
      console.error("Failed to fetch death registration:", e);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const handleToggle = async () => {
    if (record?.death_status === 1) return;
    setSaving(true);
    try {
      const saved = await saveChildDeathRegistration({
        id: record?.id,
        child: childId,
        death_status: 1,
      });
      setRecord(saved);
      showToast(t("death_registration.marked_done"));
    } catch (e) {
      console.error("Failed to save death registration:", e);
      showToast(t("common.save_failed") || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="bg-white rounded-2xl border border-slate-100 p-5 items-center">
        <ActivityIndicator color="#EF4444" size="small" />
      </View>
    );
  }

  const isRegistered = record?.death_status === 1;

  return (
    <View className={`rounded-2xl border overflow-hidden mb-3 ${isRegistered ? "bg-rose-50/30 border-rose-200" : "bg-white border-slate-100"}`}>
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isRegistered ? "bg-rose-100" : "bg-slate-100"}`}>
            <Activity size={20} color={isRegistered ? "#E11D48" : "#94A3B8"} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-800 font-bold text-[16px]">{t("death_registration.title")}</Text>
            <View className="flex-row items-center mt-0.5">
              {isRegistered ? (
                <>
                  <Check size={12} color="#E11D48" />
                  <Text className="text-rose-600 font-semibold text-[13px] ml-1">{t("death_registration.registered")}</Text>
                </>
              ) : (
                <Text className="text-slate-400 text-[13px]">{t("death_registration.not_recorded")}</Text>
              )}
            </View>
          </View>
        </View>
        {!disabled && !isRegistered && (
          <TouchableOpacity
            onPress={handleToggle}
            disabled={saving}
            className="w-14 h-14 rounded-full items-center justify-center bg-rose-100"
          >
            {saving ? (
              <ActivityIndicator color="#E11D48" size="small" />
            ) : (
              <Check size={22} color="#E11D48" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
