import { Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { FamilyPlanningStoreType, getFamilyPlanningByMother, saveFamilyPlanning } from '../../hooks/database/models/FamilyPlanningModel';
import { getPregnancyByMotherId } from '../../hooks/database/models/PregnantWomenModal';
import ConfirmActionModal from '../common/ConfirmActionModal';
import FamilyPlanningModal from '../forms/FamilyPlanningModal';

interface FamilyPlanningSectionProps {
  motherId: string;
  disabled?: boolean;
}

export default function FamilyPlanningSection({ motherId, disabled }: FamilyPlanningSectionProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const [record, setRecord] = useState<FamilyPlanningStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPregnancyId, setCurrentPregnancyId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [methodToRemove, setMethodToRemove] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const pregnancy = await getPregnancyByMotherId(motherId);
      const pregId = pregnancy?.id || null;
      setCurrentPregnancyId(pregId);

      const data = await getFamilyPlanningByMother(motherId, pregId);
      setRecord(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = (methodToDelete: string) => {
    setMethodToRemove(methodToDelete);
    setConfirmVisible(true);
  };

  const executeDelete = async () => {
    if (!record || !methodToRemove) return;

    try {
      setIsDeleting(true);
      // Create a payload object starting with current values
      const payload: any = {
        mother: motherId,
        pregnancy_id: currentPregnancyId,
        family_planning: record.family_planning,
        ocp_qty: record.ocp_qty,
        ecp_qty: record.ecp_qty,
        condom_qty: record.condom_qty,
      };

      // Reset the specific quantity and remove from methods string
      const methods = record.family_planning.split(', ');
      const updatedMethods = methods.filter(m => m !== methodToRemove);
      payload.family_planning = updatedMethods.length > 0 ? updatedMethods.join(', ') : 'None';

      if (methodToRemove === 'OCP') payload.ocp_qty = 0;
      if (methodToRemove === 'ECP') payload.ecp_qty = 0;
      if (methodToRemove === 'Condoms') payload.condom_qty = 0;

      await saveFamilyPlanning(payload);

      showToast(t("family_planning.save_success"));
      setConfirmVisible(false);
      setMethodToRemove(null);
      loadData();
    } catch (e) {
      console.error(e);
      showToast(t("family_planning.save_error"));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [motherId]);

  const hasItems = record && (record.ocp_qty > 0 || record.ecp_qty > 0 || record.condom_qty > 0);

  return (
    <View className="flex-row items-center justify-between">
      {hasItems ? (
        <>
          <View className="flex-1 flex-col gap-3">
            <View className="flex-row flex-wrap gap-2">
              {record.ocp_qty > 0 && (
                <View className="bg-indigo-50 border border-indigo-100 pl-3 pr-2 py-1.5 rounded-full flex-row items-center">
                  <Text className="text-indigo-700 font-semibold text-[12px] mr-1">
                    OCP: {record.ocp_qty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod("OCP")}
                    disabled={disabled}
                    className="p-0.5 hover:bg-indigo-100 rounded-full ml-1"
                  >
                    <X size={12} color={disabled ? "#94A3B8" : "#4338ca"} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              )}
              {record.ecp_qty > 0 && (
                <View className="bg-indigo-50 border border-indigo-100 pl-3 pr-2 py-1.5 rounded-full flex-row items-center">
                  <Text className="text-indigo-700 font-semibold text-[12px] mr-1">
                    ECP: {record.ecp_qty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod("ECP")}
                    disabled={disabled}
                    className="p-0.5 hover:bg-indigo-100 rounded-full ml-1"
                  >
                    <X size={12} color={disabled ? "#94A3B8" : "#4338ca"} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              )}
              {record.condom_qty > 0 && (
                <View className="bg-indigo-50 border border-indigo-100 pl-3 pr-2 py-1.5 rounded-full flex-row items-center">
                  <Text className="text-indigo-700 font-semibold text-[12px] mr-1">
                    Condom: {record.condom_qty}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteMethod("Condoms")}
                    disabled={disabled}
                    className="p-0.5 hover:bg-indigo-100 rounded-full ml-1"
                  >
                    <X size={12} color={disabled ? "#94A3B8" : "#4338ca"} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            disabled={disabled}
            className={`px-4 py-1.5 rounded-lg ${disabled ? "bg-slate-100" : "bg-[#475569]"}`}
          >
            <Text className={`font-bold text-[12px] uppercase ${disabled ? "text-slate-300" : "text-white"}`}>
              {t("common.update")}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View className="flex-1 mr-4">
            <Text className="text-slate-600 font-medium text-[15px]">
              {t("profile.birth_pnc.fp_used")}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            disabled={disabled}
            className={`px-2 py-1.5 rounded-lg ${disabled ? "bg-slate-100" : "bg-[#475569]"}`}
          >
            {/* <Text className="text-white font-bold text-[12px]">
              {t("common.add")}
            </Text> */}
            <Plus size={19} color={disabled ? "#CBD5E1" : "white"} strokeWidth={3} />
          </TouchableOpacity>
        </>
      )}

      <FamilyPlanningModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        motherId={motherId}
        pregnancyId={currentPregnancyId}
        onSuccess={loadData}
        showToast={showToast}
        existingRecord={record}
      />

      <ConfirmActionModal
        visible={confirmVisible}
        onClose={() => {
          setConfirmVisible(false);
          setMethodToRemove(null);
        }}
        title={t("family_planning.remove_confirm_title")}
        description={t("family_planning.remove_confirm_msg")}
        actionLabel={t("common.delete")}
        onAction={executeDelete}
        loading={isDeleting}
      />
    </View>
  );
}
