import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable, ScrollView, TextInput } from 'react-native';
import { X, CheckCircle, Circle } from 'lucide-react-native';
import { saveFamilyPlanning } from '../../hooks/database/models/FamilyPlanningModel';
import ModalWithSafeArea from '../common/ModalWithSafeArea';
import { useTranslation } from 'react-i18next';

interface FamilyPlanningModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
  onSuccess: () => void;
  showToast: (msg: string) => void;
  existingMethods?: string | null;
}

const METHODS = [
  'Condoms',
  'Pills',
  'Implants',
  'Depo (Injectable)',
  'I-Pills (Emergency)',
  'IUCD',
  'Female Sterilization',
  'Male Sterilization',
  'Other'
];

export default function FamilyPlanningModal({
  visible,
  onClose,
  motherId,
  onSuccess,
  showToast,
  existingMethods
}: FamilyPlanningModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isUsing, setIsUsing] = useState<boolean | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [otherMethod, setOtherMethod] = useState<string>('');

  // Initialize state when modal opens
  useEffect(() => {
    if (visible) {
      if (existingMethods) {
        if (existingMethods === 'None') {
          setIsUsing(false);
          setSelectedMethods([]);
          setOtherMethod('');
        } else {
          setIsUsing(true);
          const methodsArray = existingMethods.split(', ');
          const standardMethods: string[] = [];
          let customMethod = '';

          methodsArray.forEach(m => {
            if (METHODS.includes(m)) {
              standardMethods.push(m);
            } else {
              standardMethods.push('Other');
              customMethod = m;
            }
          });

          setSelectedMethods(standardMethods);
          setOtherMethod(customMethod);
        }
      } else {
        setIsUsing(null);
        setSelectedMethods([]);
        setOtherMethod('');
      }
      setLoading(false);
    }
  }, [visible, existingMethods]);

  const handleSave = async () => {
    if (isUsing === null) return;
    if (isUsing === true && selectedMethods.length === 0) {
      showToast(t("family_planning.validation.select_one"));
      return;
    }

    if (isUsing === true && selectedMethods.includes('Other') && !otherMethod.trim()) {
      showToast(t("family_planning.validation.enter_custom"));
      return;
    }

    setLoading(true);
    try {
      let finalMethods = '';
      if (isUsing) {
        const methodsToSave = selectedMethods.map(m => m === 'Other' ? otherMethod.trim() : m);
        finalMethods = methodsToSave.join(', ');
      } else {
        finalMethods = 'None';
      }
      
      await saveFamilyPlanning({
        mother_id: motherId,
        family_planning: finalMethods
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
    <ModalWithSafeArea visible={visible} onRequestClose={onClose} animationType="fade" transparent>
      <Pressable 
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center px-4"
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white w-full max-h-[85%] rounded-3xl p-6 shadow-xl">
          
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-slate-800">{t("family_planning.title")}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text className="text-slate-700 text-base font-medium mb-4">
              {t("family_planning.question")}
            </Text>

            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsUsing(true)}
                className={`flex-1 flex-row items-center justify-center p-3 border ${isUsing === true ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'}`}
              >
                <Text className={`ml-2 font-bold text-[15px] ${isUsing === true ? 'text-indigo-700' : 'text-slate-600'}`}>{t("family_planning.yes")}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsUsing(false);
                  setSelectedMethods([]);
                  setOtherMethod('');
                }}
                className={`flex-1 flex-row items-center justify-center p-3 border ${isUsing === false ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-slate-200'}`}
              >
                <Text className={`ml-2 font-bold text-[15px] ${isUsing === false ? 'text-indigo-700' : 'text-slate-600'}`}>{t("family_planning.no")}</Text>
              </TouchableOpacity>
            </View>

            {isUsing && (
              <View>
                <Text className="text-slate-700 text-base font-medium mb-4">
                  {t("family_planning.select_method")}
                </Text>
                <View className="gap-y-3 mb-4 flex-1 flex-row flex-wrap gap-2">
                  {METHODS.map((method) => {
                    const isSelected = selectedMethods.includes(method);
                    return (
                      <TouchableOpacity
                        key={method}
                        activeOpacity={0.7}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedMethods(prev => prev.filter(m => m !== method));
                          } else {
                            setSelectedMethods(prev => [...prev, method]);
                          }
                        }}
                        className={`flex-row items-center py-2 px-4 rounded-full border ${isSelected ? 'bg-indigo-50 border-indigo-500' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <Text className={`font-medium text-[13px] ${isSelected ? 'text-indigo-900 font-bold' : 'text-slate-600'}`}>
                          {t(`family_planning.methods.${method}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedMethods.includes('Other') && (
                  <View className="mb-4">
                    <Text className="text-slate-700 text-[13px] font-medium mb-2">{t("family_planning.specify_method")}</Text>
                    <TextInput
                      placeholder={t("family_planning.placeholder")}
                      value={otherMethod}
                      onChangeText={setOtherMethod}
                      className="bg-white border border-slate-300 p-3.5 rounded-xl text-slate-800 text-[14px]"
                    />
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity 
              onPress={handleSave}
              disabled={loading || isUsing === null || (isUsing && selectedMethods.length === 0) || (selectedMethods.includes('Other') && !otherMethod.trim())}
              className={`w-full mt-4 py-3 flex-row justify-center items-center ${(isUsing === null || (isUsing && selectedMethods.length === 0)) ? 'bg-slate-400' : 'bg-primary/80'}`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">{t("family_planning.save")}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

        </Pressable>
      </Pressable>
    </ModalWithSafeArea>
  );
}

