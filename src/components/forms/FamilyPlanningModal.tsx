import { useLanguage } from '@/context/LanguageContext';
import { Minus, Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { saveFamilyPlanning } from '../../hooks/database/models/FamilyPlanningModel';
import { Button } from '../button';
import ModalWithSafeArea from '../common/ModalWithSafeArea';

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
  existingRecord
}: FamilyPlanningModalProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [ocpQty, setOcpQty] = useState(0);
  const [ecpQty, setEcpQty] = useState(0);
  const [condomQty, setCondomQty] = useState(0);

  useEffect(() => {
    if (visible) {
      if (existingRecord) {
        setOcpQty(existingRecord.ocp_qty || 0);
        setEcpQty(existingRecord.ecp_qty || 0);
        setCondomQty(existingRecord.condom_qty || 0);
      } else {
        setOcpQty(0);
        setEcpQty(0);
        setCondomQty(0);
      }
      setLoading(false);
    }
  }, [visible, existingRecord]);

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalMethodsArr = [];
      if (ocpQty > 0) finalMethodsArr.push("OCP");
      if (ecpQty > 0) finalMethodsArr.push("ECP");
      if (condomQty > 0) finalMethodsArr.push("Condoms");

      const finalMethods = finalMethodsArr.length > 0 ? finalMethodsArr.join(', ') : 'None';

      await saveFamilyPlanning({
        mother_id: motherId,
        pregnancy_id: pregnancyId,
        family_planning: finalMethods,
        ocp_qty: ocpQty,
        ecp_qty: ecpQty,
        condom_qty: condomQty
      });

      showToast(t("profile.alerts.save_success") || t("family_planning.save_success") || "Saved successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(t("profile.alerts.save_error") || t("family_planning.save_error") || "Error saving");
    } finally {
      setLoading(false);
    }
  };


  return (
    <ModalWithSafeArea visible={visible} onRequestClose={onClose} animationType="slide" transparent>
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 justify-end"
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white w-full rounded-t-3xl p-6 shadow-xl pb-10">

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-semibold text-slate-800">
              {t("family_planning.add_title")}
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Pills Section */}
            <View className="mb-6">
              <Text className="text-slate-800 font-medium text-[16px] mb-3">
                {t("family_planning.pills")}
              </Text>

              {/* OCP */}
              <View className="flex-row justify-between items-center bg-white border border-slate-200 p-3 rounded-xl mb-3">
                <Text className="text-slate-600 text-[15px] font-medium">
                  {t("family_planning.ocp_label")}
                </Text>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => setOcpQty(Math.max(0, ocpQty - 1))}
                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  >
                    <Minus size={16} color="#64748B" />
                  </TouchableOpacity>
                  <Text className="font-medium text-slate-700 w-4 text-center">{ocpQty}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setOcpQty(ocpQty + 1);
                      // Ensure mutually exclusive
                      setEcpQty(0);
                    }}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                  >
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ECP */}
              <View className="flex-row justify-between items-center bg-white border border-slate-200 p-3 rounded-xl">
                <Text className="text-slate-600 text-[15px] font-medium">
                  {t("family_planning.ecp_label")}
                </Text>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => setEcpQty(Math.max(0, ecpQty - 1))}
                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  >
                    <Minus size={16} color="#64748B" />
                  </TouchableOpacity>
                  <Text className="font-medium text-slate-700 w-4 text-center">{ecpQty}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEcpQty(ecpQty + 1);
                      // Ensure mutually exclusive
                      setOcpQty(0);
                    }}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                  >
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Condoms Section */}
            <View className="mb-6">
              <Text className="text-slate-800 text-[16px] mb-3">
                {t("family_planning.condoms_label")}
              </Text>

              <View className="flex-row justify-between items-center bg-white border border-slate-200 p-3 rounded-xl">
                <Text className="text-slate-600 text-[15px] font-medium">
                  {t("family_planning.condom_label")}
                </Text>
                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    onPress={() => setCondomQty(Math.max(0, condomQty - 1))}
                    className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  >
                    <Minus size={16} color="#64748B" />
                  </TouchableOpacity>
                  <Text className="font-medium text-slate-700 w-4 text-center">{condomQty}</Text>
                  <TouchableOpacity
                    onPress={() => setCondomQty(condomQty + 1)}
                    className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                  >
                    <Plus size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 h-14 border border-slate-200 rounded-lg items-center justify-center"
              >
                <Text className="font-semibold text-slate-700 text-lg">
                  {t("family_planning.cancel")}
                </Text>
              </TouchableOpacity>

              <View className="flex-1">
                <Button
                  title={t("common.save") || t("family_planning.save")}
                  onPress={handleSave}
                  isLoading={loading}
                />
              </View>
            </View>
          </ScrollView>

        </Pressable>
      </Pressable>
    </ModalWithSafeArea>
  );
}
