import { Plus, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { saveCounseling } from "../../hooks/database/models/CounselingModel";
import ModalWithSafeArea from "../common/ModalWithSafeArea";

interface CounselingModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
  motherName: string;
  existingTopics?: string | null;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

export default function CounselingModal({
  visible,
  onClose,
  motherId,
  motherName,
  existingTopics,
  onSuccess,
  showToast,
}: CounselingModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<string[]>(
    existingTopics ? JSON.parse(existingTopics) : [""],
  );

  const handleAddTopic = () => {
    setTopics([...topics, ""]);
  };

  const handleRemoveTopic = (index: number) => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const handleTopicChange = (text: string, index: number) => {
    const newTopics = [...topics];
    newTopics[index] = text;
    setTopics(newTopics);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const validTopics = topics.filter((t) => t.trim().length > 0);
      const payload = {
        mother_id: motherId,
        is_counseled: 1,
        counseled_topics: JSON.stringify(validTopics),
      };
      await saveCounseling(payload);
      showToast(
        t("profile.alerts.save_success") ||
          "Counseling status updated successfully",
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(t("profile.alerts.save_error") || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWithSafeArea
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
      transparent
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center px-4"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white w-full rounded-3xl p-6 shadow-xl max-h-[80%]"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-slate-800">
              {t("profile.counseling_card.add_topic") || "Add Counseling"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 bg-slate-100 rounded-full"
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-600 text-base mb-4">
            {t("profile.counseling_card.title")}
          </Text>

          <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
            {topics.map((topic, index) => (
              <View key={index} className="flex-row items-center mb-3">
                <TextInput
                  value={topic}
                  onChangeText={(text) => handleTopicChange(text, index)}
                  placeholder={
                    t("profile.counseling_card.enter_topic") || "Enter topic..."
                  }
                  className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-slate-800 bg-slate-50"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveTopic(index)}
                  className="ml-2 p-2 bg-red-50 rounded-md"
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAddTopic}
              className="flex-row items-center mt-2 py-2"
            >
              <Plus size={20} color="#4F46E5" />
              <Text className="text-indigo-600 font-medium ml-2">
                {t("profile.counseling_card.add_topic") || "Add Topic"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className={`w-full py-3 rounded-md flex-row justify-center items-center bg-primary/80`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-md">
                {topics.length > 1 ? t("common.update") : t("common.add")}
              </Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </ModalWithSafeArea>
  );
}
