import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Heart, Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getFamilyPlanningByMother, FamilyPlanningStoreType, saveFamilyPlanning } from '../../hooks/database/models/FamilyPlanningModel';
import FamilyPlanningModal from '../forms/FamilyPlanningModal';
import { useToast } from '../../context/ToastContext';

interface FamilyPlanningSectionProps {
  motherId: string;
}

export default function FamilyPlanningSection({ motherId }: FamilyPlanningSectionProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [record, setRecord] = useState<FamilyPlanningStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const data = await getFamilyPlanningByMother(motherId);
      setRecord(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMethod = async (methodToDelete: string) => {
    if (!record) return;
    
    try {
      const methods = record.family_planning.split(', ');
      const updatedMethods = methods.filter(m => m !== methodToDelete);
      const finalMethods = updatedMethods.length > 0 ? updatedMethods.join(', ') : 'None';
      
      await saveFamilyPlanning({
        mother_id: motherId,
        family_planning: finalMethods
      });
      
      showToast(t("family_planning.save_success"));
      loadData();
    } catch (e) {
      console.error(e);
      showToast(t("family_planning.save_error"));
    }
  };

  useEffect(() => {
    loadData();
  }, [motherId]);

  return (
    <View className="rounded-xl bg-white border border-gray-100 flex-row items-center justify-between p-4">
      { record ? (
        <>
        <View className='flex-1 flex-col gap-3'>
          <View className="flex-row justify-between items-center">
            <Text className="text-slate-800 font-bold text-[14px] mb-2">{t("profile.birth_pnc.fp_used")}</Text>
            {record.family_planning !== 'None' ? (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="px-4 py-2 bg-slate-50 rounded-md border border-slate-200"
              >
                <Text className="text-indigo-600 font-bold text-[12px] uppercase">{t("common.update")}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="px-4 py-2 bg-primary/80 rounded-md flex-row items-center"
              >
                <Text className="text-white font-bold text-[12px] uppercase">{t("common.add")}</Text>
              </TouchableOpacity>
            )}
          </View>
            {record.family_planning !== 'None' && (
              <View className="flex-row flex-wrap gap-2">
                {record.family_planning.split(', ').map((method, index) => (
                  <View key={index} className="bg-indigo-50 border border-indigo-100 pl-3 pr-2 py-1 rounded-full flex-row items-center">
                    <Text className="text-indigo-700 font-semibold text-[11px] mr-1">{method}</Text>
                    <TouchableOpacity 
                      onPress={() => handleDeleteMethod(method)}
                      className="p-0.5 hover:bg-indigo-100 rounded-full"
                    >
                      <X size={10} color="#4338ca" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
        </View>
         
        </>
      ) : (
        <>
          <View className="flex-1">
            <Text className="font-semibold text-[13px]">{t("profile.birth_pnc.fp_used")}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="px-4 py-2 bg-primary/80 rounded-md flex-row items-center"
          >
            <Text className="text-white font-bold text-[12px] uppercase">{t("common.add")}</Text>
          </TouchableOpacity>
        </>
      )}

      <FamilyPlanningModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        motherId={motherId}
        onSuccess={loadData}
        showToast={showToast}
        existingMethods={record?.family_planning}
      />
    </View>
  );
}
