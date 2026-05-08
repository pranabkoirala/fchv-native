import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Heart, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getFamilyPlanningByMother, FamilyPlanningStoreType } from '../../hooks/database/models/FamilyPlanningModel';
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
             <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="px-4 py-2 bg-slate-50 rounded-md border border-slate-200"
          >
            <Text className="text-indigo-600 font-bold text-[12px] uppercase">Update</Text>
          </TouchableOpacity>
          </View>
          <View className='flex-1 mr-4'>
            {record.family_planning === 'None' ? (
              <Text className="text-slate-500 font-medium text-[13px]">Not Using</Text>
            ) : (
              <View className="flex-row flex-wrap gap-2">
                {record.family_planning.split(', ').map((method, index) => (
                  <View key={index} className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    <Text className="text-indigo-700 font-semibold text-[11px]">{method}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
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
            <Text className="text-white font-bold text-[12px] uppercase">Add</Text>
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
