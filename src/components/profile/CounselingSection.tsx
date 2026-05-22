import { CheckCircle, ChevronRight, Info } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { useToast } from "../../context/ToastContext";
import {
  CounselingStoreType,
  getCounselingByMother,
} from "../../hooks/database/models/CounselingModel";
import CounselingModal from "../forms/CounselingModal";

interface CounselingSectionProps {
  motherId: string;
  motherName?: string | null;
}

export default function CounselingSection({
  motherId,
  motherName,
}: CounselingSectionProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [record, setRecord] = useState<CounselingStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const data = await getCounselingByMother(motherId);
      setRecord(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [motherId]);

  const isCounseled = record?.is_counseled === 1;
  const counseledTopics: string[] = record?.counseled_topics ? JSON.parse(record.counseled_topics) : [];

  return (
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className={`p-4 pr-7 py-5 rounded-md border flex-row items-center justify-between ${isCounseled ? "bg-indigo-50 border-indigo-100" : "bg-white border-slate-100"}`}
      >
        <View className="flex flex-row items-center flex-1">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isCounseled ? "bg-indigo-100" : "bg-orange-50"}`}
          >
            {isCounseled ? (
              <CheckCircle size={18} color="#4F46E5" />
            ) : (
              <Info size={18} color="#D97706" />
            )}
          </View>
          <View className="flex-1">
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isCounseled ? "text-indigo-500" : "text-slate-400"}`}
            >
              {t("profile.quick_stats.counseling")}
            </Text>
            <Text
              className={`font-bold text-sm ${isCounseled ? "text-indigo-900" : "text-slate-800"}`}
            >
              {isCounseled
                ? t("profile.quick_stats.provided")
                : t("profile.quick_stats.not_provided")}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#5b6065" />
      </TouchableOpacity>

      {isCounseled && (
        <View className="mt-2 p-4 bg-white rounded-md border border-slate-100">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-sm text-slate-800">
              {t("profile.counseling_card.counseled_topics")}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text className="text-indigo-600 font-medium text-xs">{t("common.add")}</Text>
            </TouchableOpacity>
          </View>
          {counseledTopics.length > 0 ? (
            <View className="flex-row flex-wrap mt-1">
              {counseledTopics.map((topic, index) => (
                <View key={index} className="bg-indigo-50 px-3 py-1.5 rounded-full mr-2 mb-2 border border-indigo-100">
                  <Text className="text-indigo-700 text-xs font-medium">{topic}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-slate-400 text-xs mt-1">
              {t("profile.counseling_card.no_topics")}
            </Text>
          )}
        </View>
      )}

      <CounselingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        motherId={motherId}
        motherName={motherName || "the mother"}
        existingTopics={record?.counseled_topics}
        onSuccess={loadData}
        showToast={showToast}
      />
    </View>
  );
}
