import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../hooks/database/types/maternalDeathModal";
import MaternalDeathForm from "./MaternalDeathForm";

interface MaternalDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  onSuccess: (updatedDeath: MaternalDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function MaternalDeathModal({
  visible,
  onClose,
  record,
  onSuccess,
  showToast,
}: MaternalDeathModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <View>
            <Text className="text-slate-800 text-xl font-semibold">
              {t("maternal_death_modal.title")}
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="bg-slate-50 p-2 rounded-full border border-slate-100"
          >
            <X size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-5 flex-1 pt-6"
        >
          <MaternalDeathForm
            record={record}
            onSuccess={(updatedDeath) => {
              onSuccess(updatedDeath);
              onClose();
            }}
            showToast={showToast}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
