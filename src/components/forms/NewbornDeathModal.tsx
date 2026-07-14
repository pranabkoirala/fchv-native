import { X } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { InfantMonitoringStoreType } from "../../hooks/database/types/infantMonitoringModal";
import { NewbornDeathStoreType } from "../../hooks/database/types/newbornDeathModal";
import NewbornDeathForm from "./NewbornDeathForm";

interface NewbornDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  children?: InfantMonitoringStoreType[];
  initialChildId?: string;
  initialChildName?: string;
  onSuccess: (updatedDeath: NewbornDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function NewbornDeathModal({
  visible,
  onClose,
  record,
  children: initialChildren,
  initialChildId,
  initialChildName,
  onSuccess,
  showToast,
}: NewbornDeathModalProps) {
  const { t } = useTranslation();

  const [showDeathDatePicker, setShowDeathDatePicker] = useState(false);
  const [currentDeathBsDate, setCurrentDeathBsDate] = useState<
    string | undefined
  >(undefined);
  // Ref to the form's applyDeathDate callback, registered on form mount.
  const applyDeathDateRef = useRef<((bsDate: string) => void) | null>(null);

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
            <View className="flex-1 mr-3">
              <Text className="text-slate-800 text-[18px] font-semibold">
                {t("newborn_death_modal.title")}
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
            className="px-5 flex-1 pt-3"
            keyboardShouldPersistTaps="handled"
          >
            <NewbornDeathForm
              record={record}
              children={initialChildren}
              initialChildId={initialChildId}
              initialChildName={initialChildName}
              onSuccess={(updatedDeath) => {
                onSuccess(updatedDeath);
                onClose();
              }}
              showToast={showToast}
              // ── Lifted CalendarPicker props (fixes nested-Modal bug) ───────
              onRequestOpenDeathDatePicker={() => setShowDeathDatePicker(true)}
              registerDeathDateSetter={(setter) => {
                applyDeathDateRef.current = setter;
              }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* CalendarPicker lives OUTSIDE the Modal so it renders at window level */}
      {showDeathDatePicker && (
        <CalendarPicker
          visible={true}
          onClose={() => setShowDeathDatePicker(false)}
          onDateSelect={(bsDate) => {
            setShowDeathDatePicker(false);
            setCurrentDeathBsDate(bsDate);
            applyDeathDateRef.current?.(bsDate);
          }}
          language="np"
          theme="light"
          brandColor="#E11D48"
          date={currentDeathBsDate}
        />
      )}
    </>
  );
}
