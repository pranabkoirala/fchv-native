import { useLanguage } from "@/context/LanguageContext";
import { VisitStoreType } from "@/hooks/database/types/visitModal";
import { Calendar as CalendarIcon, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CalendarPicker, AdToBs } from "react-native-nepali-picker";

interface PNCModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
  slotIndex: number; // 0..3
  existingVisits: VisitStoreType[];
  editingVisit?: VisitStoreType | null;
  onDone: (dateBs: string, place: "home" | "health_post") => void;
}

export default function PNCModal({
  visible,
  onClose,
  motherId,
  slotIndex,
  existingVisits,
  editingVisit,
  onDone,
}: PNCModalProps) {
  const { t, language } = useLanguage();
  const [selectedBs, setSelectedBs] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<"home" | "health_post" | "">("");
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date();
  const todayAd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const maxDateBs = AdToBs(todayAd);

  useEffect(() => {
    const visit = editingVisit ?? existingVisits?.[slotIndex];
    if (visit) {
      setSelectedBs(visit.visit_date || "");
      setSelectedPlace(
        visit.visit_place === "health_post"
          ? "health_post"
          : visit.visit_place === "home"
          ? "home"
          : "",
      );
    } else {
      setSelectedBs("");
      setSelectedPlace("");
    }
  }, [visible, slotIndex, existingVisits, editingVisit]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/30 items-center justify-center">
        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden w-[92%]" style={{ maxHeight: '80%' }}>
          <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-amber-50 items-center justify-center mr-3">
              <CalendarIcon size={18} color="#92400E" />
            </View>
            <View>
              <Text className="text-slate-800 text-lg font-bold">{t("profile.pnc_modal.title")}</Text>
              <Text className="text-slate-500 text-[13px] mt-0.5">{t("profile.pnc_modal.subtitle")}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} className="bg-slate-50 p-2.5 rounded-full border border-slate-100">
            <X size={20} color="#64748B" />
          </Pressable>
        </View>
          <View className="px-5 py-4">
            <Text className="text-slate-700 text-[14px] mb-2">{t("profile.pnc_modal.select_date")}</Text>

            <Pressable
              onPress={() => setShowCalendar((s) => !s)}
              className="flex-row items-center justify-between border border-slate-200 rounded-lg px-4 py-3 bg-white"
            >
              <Text className={`text-[14px] ${selectedBs ? 'text-slate-800' : 'text-slate-400'}`}>
                {selectedBs || t("profile.pnc_modal.select_date")}
              </Text>
              <CalendarIcon size={18} color="#92400E" />
            </Pressable>

            {showCalendar && (
              <View style={{ height: 260 }} className="mt-3">
                <CalendarPicker
                  visible={true}
                  onClose={() => setShowCalendar(false)}
                  onDateSelect={(bsDate) => {
                    setSelectedBs(bsDate);
                    setShowCalendar(false);
                  }}
                  language={language === "en" ? "en" : "np"}
                  theme="light"
                  brandColor="#92400E"
                  date={selectedBs || undefined}
                  maxDate={maxDateBs}
                />
              </View>
            )}

            <Text className="text-slate-700 text-[14px] mt-4 mb-2">{t("profile.pnc_modal.select_place")}</Text>
            <View className="flex-row gap-3">
              {[
                { key: "home", label: t("profile.pnc_modal.home") },
                { key: "health_post", label: t("profile.pnc_modal.health_post") },
              ].map((option) => {
                const value = option.key as "home" | "health_post";
                const active = selectedPlace === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSelectedPlace(value)}
                    className={`flex-1 rounded-lg border px-4 py-3 items-center justify-center ${active ? 'bg-amber-800 border-amber-800' : 'bg-white border-slate-200'}`}
                  >
                    <Text className={`text-[14px] font-semibold ${active ? 'text-white' : 'text-slate-800'}`}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row gap-3 mt-4">
              <Pressable
                onPress={() => {
                  setShowCalendar(false);
                  onClose();
                }}
                className="flex-1 rounded-md py-3 items-center justify-center bg-slate-100 border border-slate-200"
              >
                <Text className="font-semibold text-slate-800">{t("profile.pnc_modal.cancel")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!selectedBs || !selectedPlace) return;
                  onDone(selectedBs, selectedPlace);
                }}
                className={
                  `flex-1 rounded-md py-3 items-center justify-center bg-amber-800 ${
                    !selectedBs || !selectedPlace ? 'opacity-60' : ''
                  }`
                }
              >
                <Text className="font-semibold text-white">{t("profile.pnc_modal.done")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
