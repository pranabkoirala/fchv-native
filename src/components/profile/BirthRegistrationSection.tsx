import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { getChildBirthRegistration, saveChildBirthRegistration } from "@/hooks/database/models/ChildBirthRegistrationModel";
import { ChildBirthRegistrationStoreType } from "@/hooks/database/types/childBirthRegistration";
import { Baby, Check } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

interface Props {
  childId: string;
  disabled?: boolean;
}

export default function BirthRegistrationSection({ childId, disabled }: Props) {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const [record, setRecord] = useState<ChildBirthRegistrationStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRecord = useCallback(async () => {
    try {
      const data = await getChildBirthRegistration(childId);
      setRecord(data);
    } catch (e) {
      console.error("Failed to fetch birth registration:", e);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const handleToggle = async () => {
    if (record?.birth_status === 1) return;
    setSaving(true);
    try {
      const saved = await saveChildBirthRegistration({
        id: record?.id,
        child: childId,
        birth_status: 1,
      });
      setRecord(saved);
      showToast(t("birth_registration.marked_done"));
    } catch (e) {
      console.error("Failed to save birth registration:", e);
      showToast(t("common.save_failed") || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="bg-white rounded-2xl border border-slate-100 p-5 items-center">
        <ActivityIndicator color="#3B82F6" size="small" />
      </View>
    );
  }

  const isRegistered = record?.birth_status === 1;

  return (
    <View className={`rounded-2xl border overflow-hidden mb-3 ${isRegistered ? "bg-emerald-50/30 border-emerald-200" : "bg-white border-slate-100"}`}>
      <View className="p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isRegistered ? "bg-emerald-100" : "bg-slate-100"}`}>
            <Baby size={20} color={isRegistered ? "#059669" : "#94A3B8"} />
          </View>
          <View className="flex-1">
            <Text className="text-slate-800 font-bold text-[16px]">{t("birth_registration.title")}</Text>
            <View className="flex-row items-center mt-0.5">
              {isRegistered ? (
                <>
                  <Check size={12} color="#059669" />
                  <Text className="text-emerald-600 font-semibold text-[13px] ml-1">{t("birth_registration.registered")}</Text>
                </>
              ) : (
                <Text className="text-slate-400 text-[13px]">{t("birth_registration.not_recorded")}</Text>
              )}
            </View>
          </View>
        </View>
        {!disabled && !isRegistered && (
          <TouchableOpacity
            onPress={handleToggle}
            disabled={saving}
            className="w-14 h-14 rounded-full items-center justify-center bg-emerald-100"
          >
            {saving ? (
              <ActivityIndicator color="#059669" size="small" />
            ) : (
              <Check size={22} color="#059669" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
