import { useLanguage } from "@/context/LanguageContext";
import { Minus, Plus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { saveFamilyPlanning } from "../../hooks/database/models/FamilyPlanningModel";
import ModalWithSafeArea from "../common/ModalWithSafeArea";

interface FamilyPlanningModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
  pregnancyId: string | null;
  onSuccess: () => void;
  showToast: (msg: string) => void;
  existingRecord?: any; // To pass the full record instead of just the string
}

export default function FamilyPlanningModal({
  visible,
  onClose,
  motherId,
  pregnancyId,
  onSuccess,
  showToast,
  existingRecord,
}: FamilyPlanningModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [ocpQty, setOcpQty] = useState(0);
  const [ecpQty, setEcpQty] = useState(0);
  const [condomQty, setCondomQty] = useState(0);

  useEffect(() => {
    // Each open is a fresh addition, so always start the steppers at 0.
    if (visible) {
      setOcpQty(0);
      setEcpQty(0);
      setCondomQty(0);
      setLoading(false);
    }
  }, [visible]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Accumulate the new quantities onto any existing record so repeated
      // additions are summed (e.g. 2 condoms + 2 condoms = 4 condoms).
      const exOcp = existingRecord?.ocp_qty || 0;
      const exEcp = existingRecord?.ecp_qty || 0;
      const exCondom = existingRecord?.condom_qty || 0;

      let totalOcp = exOcp + ocpQty;
      let totalEcp = exEcp + ecpQty;
      const totalCondom = exCondom + condomQty;

      const methods = new Set<string>();
      if (
        existingRecord?.family_planning &&
        existingRecord.family_planning !== "None"
      ) {
        existingRecord.family_planning
          .split(", ")
          .forEach((m: string) => methods.add(m.trim()));
      }
      if (totalOcp > 0) methods.add("OCP");
      if (totalEcp > 0) methods.add("ECP");
      if (totalCondom > 0) methods.add("Condoms");

      const finalMethods =
        methods.size > 0 ? Array.from(methods).join(", ") : "None";

      await saveFamilyPlanning({
        mother: motherId,
        pregnancy_id: pregnancyId,
        family_planning: finalMethods,
        ocp_qty: totalOcp,
        ecp_qty: totalEcp,
        condom_qty: totalCondom,
      });

      showToast(
        t("profile.alerts.save_success") ||
          t("family_planning.save_success") ||
          "Saved successfully",
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(
        t("profile.alerts.save_error") ||
          t("family_planning.save_error") ||
          "Error saving",
      );
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
        className="flex-1 bg-black/50 justify-center items-center px-7"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl"
        >
          <View className="mb-4">
            <Text className="text-lg font-bold text-slate-800">
              {t("family_planning.add_title")}
            </Text>
            <Text className="text-slate-400 text-[11px] mt-0.5">
              {t("family_planning.subtitle")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 bg-slate-100 rounded-full"
          >
            <X size={16} color="#64748B" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 4 }}
          >
            {/* Pills Section */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-3.5 rounded-full bg-primary mr-2" />
                <Text className="text-slate-800 font-semibold text-[14px]">
                  {t("family_planning.pills")}
                </Text>
              </View>

              {/* OCP */}
              <View className="flex-row justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-2xl mb-2.5">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-white border border-slate-100 items-center justify-center mr-2.5">
                    <Plus size={14} color="#6366F1" />
                  </View>
                  <Text className="text-slate-700 text-[14px] font-medium">
                    {t("family_planning.ocp_label")}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2.5">
                  <TouchableOpacity
                    onPress={() => setOcpQty(Math.max(0, ocpQty - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center"
                  >
                    <Minus size={14} color="#64748B" />
                  </TouchableOpacity>
                  <Text className="font-bold text-slate-800 w-4 text-center text-[15px]">
                    {ocpQty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setOcpQty(ocpQty + 1);
                      // Ensure mutually exclusive
                      setEcpQty(0);
                    }}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                  >
                    <Plus size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ECP */}
              <View className="flex-row justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-2xl">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-white border border-slate-100 items-center justify-center mr-2.5">
                    <Plus size={14} color="#6366F1" />
                  </View>
                  <Text className="text-slate-700 text-[14px] font-medium">
                    {t("family_planning.ecp_label")}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2.5">
                  <TouchableOpacity
                    onPress={() => setEcpQty(Math.max(0, ecpQty - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center"
                  >
                    <Minus size={14} color="#64748B" />
                  </TouchableOpacity>
                  <Text className="font-bold text-slate-800 w-4 text-center text-[15px]">
                    {ecpQty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEcpQty(ecpQty + 1);
                      // Ensure mutually exclusive
                      setOcpQty(0);
                    }}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                  >
                    <Plus size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Condoms Section */}
            <View className="mb-4">
              <View className="flex-row items-center mb-2.5">
                <View className="w-1 h-3.5 rounded-full bg-primary mr-2" />
                <Text className="text-slate-800 font-semibold text-[14px]">
                  {t("family_planning.condoms_label")}
                </Text>
              </View>

              <View className="flex-row justify-between items-center bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-2xl">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-xl bg-white border border-slate-100 items-center justify-center mr-2.5">
                    <Plus size={14} color="#6366F1" />
                  </View>
                  <Text className="text-slate-700 text-[14px] font-medium">
                    {t("family_planning.condom_label")}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2.5">
                  <TouchableOpacity
                    onPress={() => setCondomQty(Math.max(0, condomQty - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 items-center justify-center"
                  >
                    <Minus size={14} color="#64748B" />
                  </TouchableOpacity>
                  <Text className="font-bold text-slate-800 w-4 text-center text-[15px]">
                    {condomQty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setCondomQty(condomQty + 1)}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                  >
                    <Plus size={14} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="flex-row justify-between gap-3 mt-2">
              <TouchableOpacity
                onPress={onClose}
                className="px-6 h-12 bg-slate-100 rounded-xl items-center justify-center active:opacity-80"
              >
                <Text className="font-semibold text-slate-600 text-[15px]">
                  {t("family_planning.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={loading}
                className="px-5 h-12 bg-primary rounded-xl flex-row items-center justify-center active:opacity-90"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text className="font-semibold text-white text-[15px] ml-1.5">
                      {t("common.save") || t("family_planning.save")}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </ModalWithSafeArea>
  );
}
