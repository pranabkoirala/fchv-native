import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  Modal,
  TextInput,
  Alert
} from "react-native";
import { Calendar, Edit, X, Save, ArrowLeft, Check } from "lucide-react-native";
import { CalendarPicker, AdToBs, BsToAd } from "react-native-nepali-picker";
import * as Crypto from 'expo-crypto';
import { createMaternalDeath } from "../../hooks/database/models/MaternalDeathModel";
import { MaternalDeathStoreType } from "../../hooks/database/types/maternalDeathModal";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";

interface MaternalDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  onSuccess: (updatedDeath: MaternalDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function MaternalDeathModal({ visible, onClose, record, onSuccess, showToast }: MaternalDeathModalProps) {
  // Form values
  const [deathCondition, setDeathCondition] = useState('');
  const [deathConditionOther, setDeathConditionOther] = useState('');
  const [deliveryPlace, setDeliveryPlace] = useState('');
  const [deliveryPlaceOther, setDeliveryPlaceOther] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathPlaceOther, setDeathPlaceOther] = useState('');

  const [deathDay, setDeathDay] = useState(new Date().getDate());
  const [deathMonth, setDeathMonth] = useState(new Date().getMonth() + 1);
  const [deathYear, setDeathYear] = useState(new Date().getFullYear());

  const getAdString = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const toNepali = (y: number, m: number, d: number) => {
    try { return AdToBs(getAdString(y, m, d)); } catch { return getAdString(y, m, d); }
  };
  const [remarks, setRemarks] = useState('');

  // Inline errors
  const [errDeathCondition, setErrDeathCondition] = useState(false);
  const [errDeathConditionOther, setErrDeathConditionOther] = useState(false);
  const [errDeliveryPlace, setErrDeliveryPlace] = useState(false);
  const [errDeliveryPlaceOther, setErrDeliveryPlaceOther] = useState(false);
  const [errDeathPlace, setErrDeathPlace] = useState(false);
  const [errDeathPlaceOther, setErrDeathPlaceOther] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSaveMaternalDeath = async () => {
    let hasError = false;

    if (!deathCondition) { setErrDeathCondition(true); hasError = true; } else { setErrDeathCondition(false); }
    if (deathCondition === 'Other' && !deathConditionOther.trim()) { setErrDeathConditionOther(true); hasError = true; } else { setErrDeathConditionOther(false); }
    if (!deliveryPlace) { setErrDeliveryPlace(true); hasError = true; } else { setErrDeliveryPlace(false); }
    if (deliveryPlace === 'Other' && !deliveryPlaceOther.trim()) { setErrDeliveryPlaceOther(true); hasError = true; } else { setErrDeliveryPlaceOther(false); }
    if (!deathPlace) { setErrDeathPlace(true); hasError = true; } else { setErrDeathPlace(false); }
    if (deathPlace === 'Other' && !deathPlaceOther.trim()) { setErrDeathPlaceOther(true); hasError = true; } else { setErrDeathPlaceOther(false); }

    if (hasError) return;

    try {
      const payload = {
        id: Crypto.randomUUID(),
        mother_id: record.id,
        mother_name: record.mother_name,
        mother_age: record.mother_age,
        death_condition: deathCondition,
        death_condition_other: deathConditionOther,
        delivery_place: deliveryPlace,
        delivery_place_other: deliveryPlaceOther,
        death_place: deathPlace,
        death_place_other: deathPlaceOther,
        death_day: deathDay,
        death_month: deathMonth,
        death_year: deathYear,
        remarks: remarks,
      } as any;

      await createMaternalDeath(payload);
      showToast("Maternal death record updated successfully.");

      // Reset form fields
      setDeathCondition('');
      setDeathConditionOther('');
      setDeliveryPlace('');
      setDeliveryPlaceOther('');
      setDeathPlace('');
      setDeathPlaceOther('');
      setDeathDay(new Date().getDate());
      setDeathMonth(new Date().getMonth() + 1);
      setDeathYear(new Date().getFullYear());
      setRemarks('');
      
      // Reset errors
      setErrDeathCondition(false);
      setErrDeathConditionOther(false);
      setErrDeliveryPlace(false);
      setErrDeliveryPlaceOther(false);
      setErrDeathPlace(false);
      setErrDeathPlaceOther(false);

      onSuccess(payload as MaternalDeathStoreType);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save record.");
    }
  };

  // Helper: renders a field label row with optional REQUIRED badge
  const FieldLabel = ({ label, hasError }: { label: string; hasError: boolean }) => (
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-[13px] text-slate-700 font-medium">{label} <Text className="text-red-500">*</Text></Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        <View className="flex-row items-center justify-between p-5 bg-white">
          <Text className="text-slate-900 text-[17px] font-semibold">मातृ मृत्यु विवरण</Text>
          <Pressable onPress={onClose} className="bg-slate-100 p-1 rounded-full">
            <X size={18} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="px-6 flex-1 mt-6">
          <View className="gap-y-6 pb-6">

            {/* Death Date */}
            <View>
              <Text className="text-[13px] text-slate-700 mb-2 font-medium">मृत्यु भएको मिति (Date of Death)</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-slate-200 p-3.5 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Calendar size={18} color="#0056D2" />
                  <Text className="text-slate-800 text-[14px] ml-3">
                    {toNepali(deathYear, deathMonth, deathDay)}
                  </Text>
                </View>
                <View className="bg-blue-50 p-2 rounded-lg">
                  <Edit size={14} color="#0056D2" />
                </View>
              </Pressable>
              <CalendarPicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={(bsDate) => {
                  setShowDatePicker(false);
                  try {
                    const adDate = BsToAd(bsDate);
                    const parts = adDate.split('-');
                    setDeathYear(parseInt(parts[0], 10));
                    setDeathMonth(parseInt(parts[1], 10));
                    setDeathDay(parseInt(parts[2], 10));
                  } catch (e) { console.error(e); }
                }}
                language="np"
                theme="light"
                brandColor="#0056D2"
                date={toNepali(deathYear, deathMonth, deathDay)}
                dayTextStyle={{ fontWeight: 'normal' }}
                weekTextStyle={{ fontWeight: 'normal' }}
                titleTextStyle={{ fontWeight: 'normal' }}
              />
            </View>

            {/* Condition of Death */}
            <View>
              <FieldLabel label="मृत्यु हुँदाको अवस्था (Condition of Death)" hasError={errDeathCondition} />
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {[
                  { value: 'Pregnant', label: 'गर्भवती (Pregnant)' },
                  { value: 'Labor', label: 'सुत्केरी व्यथा (Labor)' },
                  { value: 'Post_delivery', label: 'सुत्केरी (Postpartum)' }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeathCondition(c.value); setErrDeathCondition(false); }}
                    className={`w-[48%] p-3.5 rounded-xl border flex-row items-center justify-between ${deathCondition === c.value
                      ? 'bg-blue-50/40 border-[#0056D2]'
                      : errDeathCondition ? 'bg-white border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[12px] font-medium leading-relaxed ${deathCondition === c.value ? 'text-[#0056D2]' : 'text-slate-500'}`}>{c.label}</Text>
                    {deathCondition === c.value ? (
                      <View className="w-5 h-5 rounded-full bg-[#0056D2] items-center justify-center">
                        <Check size={12} color="white" strokeWidth={3} />
                      </View>
                    ) : (
                      <View className={`w-5 h-5 rounded-full border-2 ${errDeathCondition ? 'border-red-300' : 'border-slate-300'}`} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Delivery Place */}
            <View>
              <FieldLabel label="प्रसूति भएको स्थान (Delivery Place)" hasError={errDeliveryPlace} />
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {[
                  { value: 'Home', label: 'घर' },
                  { value: 'Institution', label: 'संस्था' },
                  { value: 'Other', label: 'अन्य' }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeliveryPlace(c.value); setErrDeliveryPlace(false); }}
                    className={`w-[31%] p-3 rounded-xl border items-center justify-center ${deliveryPlace === c.value
                      ? 'bg-blue-50/40 border-primary'
                      : errDeliveryPlace ? 'bg-white border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[13px] font-medium text-center ${deliveryPlace === c.value ? 'text-primary' : 'text-slate-500'}`}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              {deliveryPlace === 'Other' && (
                <TextInput
                  placeholder="स्थान खुलाउनुहोस् (Specify)..."
                  className={`mt-3 bg-white border p-3.5 rounded-xl text-slate-900 text-[13px] ${errDeliveryPlaceOther ? 'border-red-400' : 'border-slate-200'}`}
                  onChangeText={(v) => { setDeliveryPlaceOther(v); if (v.trim()) setErrDeliveryPlaceOther(false); }}
                  value={deliveryPlaceOther}
                />
              )}
              {errDeliveryPlaceOther && (
                <Text className="text-red-500 text-[11px] mt-1">स्थान खुलाउनुहोस् (Please specify).</Text>
              )}
            </View>

            {/* Death Place */}
            <View>
              <FieldLabel label="मृत्यु भएको स्थान (Death Place)" hasError={errDeathPlace} />
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {[
                  { value: 'Home', label: 'घर' },
                  { value: 'Institution', label: 'संस्था' },
                  { value: 'Other', label: 'अन्य' }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeathPlace(c.value); setErrDeathPlace(false); }}
                    className={`w-[31%] p-3.5 rounded-xl border items-center justify-center ${deathPlace === c.value
                      ? 'bg-blue-50/40 border-primary'
                      : errDeathPlace ? 'bg-white border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[13px] font-medium text-center ${deathPlace === c.value ? 'text-primary' : 'text-slate-500'}`}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              {deathPlace === 'Other' && (
                <TextInput
                  placeholder="स्थान खुलाउनुहोस् (Specify)..."
                  className={`mt-3 bg-white border p-3.5 rounded-xl text-slate-900 text-[13px] ${errDeathPlaceOther ? 'border-red-400' : 'border-slate-200'}`}
                  onChangeText={(v) => { setDeathPlaceOther(v); if (v.trim()) setErrDeathPlaceOther(false); }}
                  value={deathPlaceOther}
                />
              )}
              {errDeathPlaceOther && (
                <Text className="text-red-500 text-[11px] mt-1">स्थान खुलाउनुहोस् (Please specify).</Text>
              )}
            </View>

            {/* Remarks */}
            <View>
              <Text className="text-[13px] text-slate-700 mb-2 font-medium">कैफियत (Remarks)</Text>
              <TextInput
                placeholder="Remarks..."
                className="bg-white border border-slate-200 p-4 rounded-xl text-slate-900 min-h-[80px]"
                multiline
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                onChangeText={setRemarks}
                value={remarks}
              />
            </View>

          </View>
        </ScrollView>

        <View className="p-4 bg-white border-t border-slate-100">
          <Pressable
            onPress={handleSaveMaternalDeath}
            className="bg-primary w-full py-4 rounded-xl flex-row items-center justify-center mt-1 mb-1"
          >
            <Save size={18} color="white" />
            <Text className="text-white font-bold text-[15px] ml-2">विवरण सुरक्षित गर्नुहोस्</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
