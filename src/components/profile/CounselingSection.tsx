import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MessageCircle, Plus, CheckCircle, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getCounselingByMother, CounselingStoreType } from '../../hooks/database/models/CounselingModel';
import CounselingModal from '../forms/CounselingModal';
import { useToast } from '../../context/ToastContext';

interface CounselingSectionProps {
  motherId: string;
  motherName?: string | null;
}

export default function CounselingSection({ motherId, motherName }: CounselingSectionProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  
  const [record, setRecord] = useState<CounselingStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const loadData = async () => {
    try {
      const data = await getCounselingByMother(motherId);
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

  const isCounseled = record?.is_counseled === 1;

  return (
    <View className="">
      <TouchableOpacity 
        onPress={() => setModalVisible(!isCounseled && true)} 
        className={`p-4 rounded-md border flex-row items-center ${isCounseled ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}
      >
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isCounseled ? 'bg-indigo-100' : 'bg-orange-50'}`}>
          {isCounseled ? <CheckCircle size={18} color="#4F46E5" /> : <Info size={18} color="#D97706" />}
        </View>
        <View className="flex-1">
          <Text className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isCounseled ? 'text-indigo-500' : 'text-slate-400'}`}>
            {t("profile.quick_stats.counseling")}
          </Text>
          <Text className={`font-bold text-sm ${isCounseled ? 'text-indigo-900' : 'text-slate-800'}`}>
            {isCounseled ? t("profile.quick_stats.provided") : t("profile.quick_stats.not_provided")}
          </Text>
        </View>
      </TouchableOpacity>

      <CounselingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        motherId={motherId}
        motherName={motherName || "the mother"}
        onSuccess={loadData}
        showToast={showToast}
      />
    </View>
  );
}
