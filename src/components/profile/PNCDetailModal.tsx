import { useLanguage } from "@/context/LanguageContext";
import { VisitStoreType } from "@/hooks/database/types/visitModal";
import { formatBsDate } from "@/utils/dateHelper";
import { Pencil, X } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";

interface PNCDetailModalProps {
  visible: boolean;
  onClose: () => void;
  visit: VisitStoreType | null;
  onEdit: () => void;
}

const placeLabel = (place: string, t: (key: string) => string) => {
  if (place === "home") return t("profile.pnc_modal.home");
  if (place === "health_post") return t("profile.pnc_modal.health_post");
  return t("profile.pnc_modal.unrecorded_place");
};

export default function PNCDetailModal({ visible, onClose, visit, onEdit }: PNCDetailModalProps) {
  const { t, language } = useLanguage();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 items-center justify-center px-4">
        <View className="w-full bg-white rounded-2xl overflow-hidden border border-slate-100 py-2" style={{ maxHeight: '72%' }}>
          <View className="flex-col items-cente px-5 py-4 border-b border-slate-100">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-900 text-lg font-bold">{t("profile.pnc_modal.details_title")}</Text>
              <Pressable onPress={onClose} className="bg-slate-100 p-2 rounded-full">
                <X size={20} color="#475569" />
              </Pressable>
            </View>
              <Text className="text-slate-500 text-[13px] mt-1">{t("profile.pnc_modal.details_subtitle")}</Text>
          </View>
          <View className="px-5 py-5">
            <Text className="text-slate-500 text-[12px] uppercase tracking-[1px] mb-2">
              {t("profile.pnc_modal.details_date")}
            </Text>
            <Text className="text-slate-900 text-[16px] font-semibold mb-4">
              {visit ? formatBsDate(visit.visit_date, language) : t("profile.pnc_modal.unrecorded")}
            </Text>

            <Text className="text-slate-500 text-[12px] uppercase tracking-[1px] mb-2">
              {t("profile.pnc_modal.details_location")}
            </Text>
            <Text className="text-slate-900 text-[16px] font-semibold mb-6">
              {visit ? placeLabel(visit.visit_place ?? "", t) : t("profile.pnc_modal.unrecorded")}
            </Text>

            <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-6">
              <Text className="text-slate-600 text-[14px] leading-6">
                {t("profile.pnc_modal.details_hint")}
              </Text>
            </View>

            <Pressable
              onPress={onEdit}
              className="flex-row items-center justify-center rounded-md bg-amber-800 py-3"
            >
              <Pencil size={18} color="#fff" />
              <Text className="text-white font-semibold text-[15px] ml-2">
                {t("profile.pnc_modal.edit")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
