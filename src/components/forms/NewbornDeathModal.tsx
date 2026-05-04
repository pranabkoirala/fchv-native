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
import { Calendar, Edit, Save, ArrowLeft, X, Check } from "lucide-react-native";
import { CalendarPicker, AdToBs, BsToAd } from "react-native-nepali-picker";
import * as Crypto from 'expo-crypto';
import { createNewbornDeath } from "../../hooks/database/models/NewbornDeathModel";
import { NewbornDeathStoreType } from "../../hooks/database/types/newbornDeathModal";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";

interface NewbornDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  onSuccess: (updatedDeath: NewbornDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function NewbornDeathModal({ visible, onClose, record, onSuccess, showToast }: NewbornDeathModalProps) {
  // Form values
  const [babyName, setBabyName] = useState('');
  const [deliveryPlace, setDeliveryPlace] = useState('');
  const [deliveryPlaceOther, setDeliveryPlaceOther] = useState('');
  const [birthCondition, setBirthCondition] = useState('');
  const [birthConditionOther, setBirthConditionOther] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [causeOfDeathOther, setCauseOfDeathOther] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathPlaceOther, setDeathPlaceOther] = useState('');
  const [deathAgeDays, setDeathAgeDays] = useState(1);
  const [birthDay, setBirthDay] = useState(new Date().getDate());
  const [birthMonth, setBirthMonth] = useState(new Date().getMonth() + 1);
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());

  const getAdString = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const toNepali = (y: number, m: number, d: number) => {
    try { return AdToBs(getAdString(y, m, d)); } catch { return getAdString(y, m, d); }
  };

  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [remarks, setRemarks] = useState('');

  // Inline errors
  const [errDeliveryPlace, setErrDeliveryPlace] = useState(false);
  const [errDeliveryPlaceOther, setErrDeliveryPlaceOther] = useState(false);
  const [errBirthCondition, setErrBirthCondition] = useState(false);
  const [errBirthConditionOther, setErrBirthConditionOther] = useState(false);
  const [errCauseOfDeath, setErrCauseOfDeath] = useState(false);
  const [errCauseOfDeathOther, setErrCauseOfDeathOther] = useState(false);
  const [errDeathPlace, setErrDeathPlace] = useState(false);
  const [errDeathPlaceOther, setErrDeathPlaceOther] = useState(false);
  const [errGender, setErrGender] = useState(false);

  const [showNewbornDatePicker, setShowNewbornDatePicker] = useState(false);

  const handleSaveNewbornDeath = async () => {
    let hasError = false;

    if (!deliveryPlace) { setErrDeliveryPlace(true); hasError = true; } else { setErrDeliveryPlace(false); }
    if (deliveryPlace === 'Other' && !deliveryPlaceOther.trim()) { setErrDeliveryPlaceOther(true); hasError = true; } else { setErrDeliveryPlaceOther(false); }
    if (!birthCondition) { setErrBirthCondition(true); hasError = true; } else { setErrBirthCondition(false); }
    if (birthCondition === 'Other' && !birthConditionOther.trim()) { setErrBirthConditionOther(true); hasError = true; } else { setErrBirthConditionOther(false); }
    if (!causeOfDeath) { setErrCauseOfDeath(true); hasError = true; } else { setErrCauseOfDeath(false); }
    if (causeOfDeath === 'Other' && !causeOfDeathOther.trim()) { setErrCauseOfDeathOther(true); hasError = true; } else { setErrCauseOfDeathOther(false); }
    if (!deathPlace) { setErrDeathPlace(true); hasError = true; } else { setErrDeathPlace(false); }
    if (deathPlace === 'Other' && !deathPlaceOther.trim()) { setErrDeathPlaceOther(true); hasError = true; } else { setErrDeathPlaceOther(false); }
    if (!gender) { setErrGender(true); hasError = true; } else { setErrGender(false); }

    if (hasError) return;

    try {
      const payload = {
        id: Crypto.randomUUID(),
        mother_id: record.id,
        mother_name: record.mother_name,
        baby_name: babyName,
        delivery_place: deliveryPlace,
        delivery_place_other: deliveryPlaceOther,
        birth_condition: birthCondition,
        birth_condition_other: birthConditionOther,
        cause_of_death: causeOfDeath,
        cause_of_death_other: causeOfDeathOther,
        death_place: deathPlace,
        death_place_other: deathPlaceOther,
        death_age_days: deathAgeDays,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: birthYear,
        gender: gender,
        remarks: remarks,
      } as any;

      await createNewbornDeath(payload);
      showToast("Newborn death record updated successfully.");

      // Reset form fields
      setBabyName('');
      setDeliveryPlace('');
      setDeliveryPlaceOther('');
      setBirthCondition('');
      setBirthConditionOther('');
      setCauseOfDeath('');
      setCauseOfDeathOther('');
      setDeathPlace('');
      setDeathPlaceOther('');
      setDeathAgeDays(1);
      setBirthDay(new Date().getDate());
      setBirthMonth(new Date().getMonth() + 1);
      setBirthYear(new Date().getFullYear());
      setGender('');
      setRemarks('');
      
      // Reset errors
      setErrDeliveryPlace(false);
      setErrDeliveryPlaceOther(false);
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
      setErrCauseOfDeath(false);
      setErrCauseOfDeathOther(false);
      setErrDeathPlace(false);
      setErrDeathPlaceOther(false);
      setErrGender(false);

      onSuccess(payload as NewbornDeathStoreType);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save record.");
    }
  };

  // Reusable field label with inline REQUIRED badge
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
        <View className="flex-row items-center justify-between p-4 bg-white">
          <Text className="text-slate-900 text-[17px] font-bold">नवजात शिशु मृत्यु विवरण</Text>
          <Pressable onPress={onClose} className="bg-slate-100 p-1 rounded-full">
            <X size={18} color="#64748B" />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} className="px-6 flex-1 mt-2">
          <View className="gap-y-6 pb-6">

            {/* Baby Name */}
            <View>
              <Text className="text-[13px] text-slate-700 mb-2 font-medium">
                मृतक नवजात शिशुको नाम 
              </Text>
              <TextInput
                placeholder="शिशुको नाम लेख्नुहोस्..."
                placeholderTextColor="#94A3B8"
                className="bg-white border border-slate-200 p-3.5 rounded-xl text-slate-900 text-[13px]"
                onChangeText={setBabyName}
                value={babyName}
              />
            </View>

            {/* Gender */}
            <View>
              <FieldLabel label="बच्चाको लिङ्ग (Gender)" hasError={errGender} />
              <View className="flex-row gap-x-4">
                {[
                  { v: 'Male', l: 'छोरा (Male)' },
                  { v: 'Female', l: 'छोरी (Female)' }
                ].map((g) => (
                  <Pressable
                    key={g.v}
                    onPress={() => { setGender(g.v as any); setErrGender(false); }}
                    className={`flex-1 p-3.5 rounded-xl border flex-row items-center justify-between ${gender === g.v
                      ? 'bg-blue-50/40 border-primary'
                      : errGender ? 'border-red-400 bg-white' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[13px] font-medium ${gender === g.v ? 'text-primary' : 'text-slate-500'}`}>{g.l}</Text>
                    <View className={`w-5 h-5 rounded-full border-2 ${gender === g.v ? 'bg-primary border-primary' : 'border-slate-300'} items-center justify-center`}>
                      {gender === g.v && <Check size={12} color="white" strokeWidth={3} />}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Birth Date */}
            <View>
              <Text className="text-[13px] text-slate-700 mb-2 font-medium">जन्म मिति (Birth Date) <Text className="text-red-500">*</Text></Text>
              <Pressable
                onPress={() => setShowNewbornDatePicker(true)}
                className="bg-white border border-slate-200 p-3 rounded-xl flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Calendar size={18} color="#0056D2" />
                  <Text className="text-slate-800 text-[14px] ml-3">
                    {toNepali(birthYear, birthMonth, birthDay)}
                  </Text>
                </View>
                <View className="bg-blue-50 p-2 rounded-lg">
                  <Edit size={14} color="#0056D2" />
                </View>
              </Pressable>
              <CalendarPicker
                visible={showNewbornDatePicker}
                onClose={() => setShowNewbornDatePicker(false)}
                onDateSelect={(bsDate) => {
                  setShowNewbornDatePicker(false);
                  try {
                    const adDate = BsToAd(bsDate);
                    const parts = adDate.split('-');
                    setBirthYear(parseInt(parts[0], 10));
                    setBirthMonth(parseInt(parts[1], 10));
                    setBirthDay(parseInt(parts[2], 10));
                  } catch (e) { console.error(e); }
                }}
                language="np"
                theme="light"
                brandColor="#0056D2"
                date={toNepali(birthYear, birthMonth, birthDay)}
                dayTextStyle={{ fontWeight: 'normal' }}
                weekTextStyle={{ fontWeight: 'normal' }}
                titleTextStyle={{ fontWeight: 'normal' }}
              />
            </View>

            {/* Birth Place */}
            <View>
              <FieldLabel label="जन्मस्थान (Birth Place)" hasError={errDeliveryPlace} />
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {[
                  { value: 'Home', label: 'घर' },
                  { value: 'Institution', label: 'संस्था' },
                  { value: 'Other', label: 'अन्य' }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeliveryPlace(c.value); setErrDeliveryPlace(false); }}
                    className={`w-[31%] p-3.5 rounded-xl border items-center justify-center ${deliveryPlace === c.value
                      ? 'border-primary bg-blue-50/40'
                      : errDeliveryPlace ? 'bg-white border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[12px] font-medium text-center ${deliveryPlace === c.value ? 'text-primary' : 'text-slate-500'}`}>{c.label}</Text>
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
              {errDeathPlaceOther && (
                <Text className="text-red-500 text-[11px] mt-1">स्थान खुलाउनुहोस् (Please specify).</Text>
              )}
            </View>



            {/* Birth Condition */}
            <View>
              <FieldLabel label="जन्मको अवस्था (Birth Condition)" hasError={errBirthCondition} />
              <View className="flex-row flex-wrap gap-2.5">
                {[
                  { v: 'Preterm', l: 'समय नपुगेको (Preterm)' },
                  { v: 'LowWeight', l: 'कम तौल (Low Weight)' },
                  { v: 'Normal', l: 'सामान्य (Normal)' },
                  { v: 'Other', l: 'अन्य (Other)' }
                ].map((c) => (
                  <Pressable
                    key={c.v}
                    onPress={() => { setBirthCondition(c.v); setErrBirthCondition(false); }}
                    className={`px-4 py-2.5 rounded-xl border ${birthCondition === c.v
                      ? 'bg-blue-50/40 border-primary'
                      : errBirthCondition ? 'bg-white border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[12px] font-medium ${birthCondition === c.v ? 'text-primary' : 'text-slate-600'}`}>{c.l}</Text>
                  </Pressable>
                ))}
              </View>
              {birthCondition === 'Other' && (
                <TextInput
                  placeholder="अवस्था खुलाउनुहोस् (Specify)..."
                  className={`mt-3 bg-white border p-3.5 rounded-xl text-slate-900 text-[13px] ${errBirthConditionOther ? 'border-red-400' : 'border-slate-200'}`}
                  onChangeText={(v) => { setBirthConditionOther(v); if (v.trim()) setErrBirthConditionOther(false); }}
                  value={birthConditionOther}
                />
              )}
              {errBirthConditionOther && <Text className="text-red-500 text-[11px] mt-1">अवस्था खुलाउनुहोस् (Please specify).</Text>}
            </View>

            {/* Age at Death */}
            <View>
              <Text className="text-[13px] text-slate-700 mb-2 font-medium">मृत्यु भएको उमेर (Age at Death in days)</Text>
              <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4 py-1 justify-between">
                <TextInput
                  keyboardType="numeric"
                  className="font-medium text-primary text-[15px] py-2.5 flex-1"
                  onChangeText={(v) => setDeathAgeDays(parseInt(v) || 0)}
                  value={deathAgeDays?.toString() || ''}
                />
                <Text className="text-slate-500 text-[13px]">दिन (Days)</Text>
              </View>
            </View>

            {/* Cause of Death */}
            <View>
              <FieldLabel label="सम्भावित कारण (Probable Cause)" hasError={errCauseOfDeath} />
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {[
                  { v: 'Asphyxia', l: 'निसासिएको (Asphyxia)' },
                  { v: 'Hypothermia', l: 'शितलहर (Hypothermia)' },
                  { v: 'Infection', l: 'संक्रमण (Infection)' },
                  { v: 'Other', l: 'अन्य (Other)' }
                ].map((c) => (
                  <Pressable
                    key={c.v}
                    onPress={() => { setCauseOfDeath(c.v); setErrCauseOfDeath(false); }}
                    className={`w-[48%] p-3.5 rounded-xl border flex-row items-center justify-between ${causeOfDeath === c.v
                      ? 'bg-blue-50/40 border-primary'
                      : errCauseOfDeath ? 'bg-white border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <Text className={`text-[12px] font-medium leading-relaxed ${causeOfDeath === c.v ? 'text-[#0056D2]' : 'text-slate-500'}`}>{c.l}</Text>
                  </Pressable>
                ))}
              </View>
              {causeOfDeath === 'Other' && (
                <TextInput
                  placeholder="कारण खुलाउनुहोस् (Specify)..."
                  className={`mt-3 bg-white border p-3.5 rounded-xl text-slate-900 text-[13px] ${errCauseOfDeathOther ? 'border-red-400' : 'border-slate-200'}`}
                  onChangeText={(v) => { setCauseOfDeathOther(v); if (v.trim()) setErrCauseOfDeathOther(false); }}
                  value={causeOfDeathOther}
                />
              )}
              {errCauseOfDeathOther && <Text className="text-red-500 text-[11px] mt-1">कारण खुलाउनुहोस् (Please specify).</Text>}
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
                    <Text className={`text-[12px] font-medium text-center ${deathPlace === c.value ? 'text-primary' : 'text-slate-500'}`}>{c.label}</Text>
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
            onPress={handleSaveNewbornDeath}
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
