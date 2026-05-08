import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Save, X, Baby, User, ChevronDown } from "lucide-react-native";
import { CalendarPicker, AdToBs, BsToAd } from "react-native-nepali-picker";
import { createNewbornDeath } from "../../hooks/database/models/NewbornDeathModel";
import { NewbornDeathStoreType } from "../../hooks/database/types/newbornDeathModal";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { useTranslation } from "react-i18next";

interface NewbornDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  onSuccess: (updatedDeath: NewbornDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function NewbornDeathModal({ visible, onClose, record, onSuccess, showToast }: NewbornDeathModalProps) {
  const { t } = useTranslation();

  // Form values
  const [babyName, setBabyName] = useState('');
  const [birthCondition, setBirthCondition] = useState('');
  const [birthConditionOther, setBirthConditionOther] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [causeOfDeathOther, setCauseOfDeathOther] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathPlaceOther, setDeathPlaceOther] = useState('');
  const [deathAgeValue, setDeathAgeValue] = useState(0);
  const [deathAgeUnit, setDeathAgeUnit] = useState<'days' | 'months'>('days');
  const [birthDay, setBirthDay] = useState(new Date().getDate());
  const [birthMonth, setBirthMonth] = useState(new Date().getMonth() + 1);
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());

  const getAdString = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const toNepali = (y: number, m: number, d: number) => {
    try { return AdToBs(getAdString(y, m, d)); } catch { return getAdString(y, m, d); }
  };

  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derived: is this a newborn (<28 days)?
  const isNewborn = useMemo(() => {
    if (deathAgeUnit === 'months') return false;
    return deathAgeValue < 28;
  }, [deathAgeUnit, deathAgeValue]);

  // Inline errors
  const [errBirthCondition, setErrBirthCondition] = useState(false);
  const [errBirthConditionOther, setErrBirthConditionOther] = useState(false);
  const [errCauseOfDeath, setErrCauseOfDeath] = useState(false);
  const [errCauseOfDeathOther, setErrCauseOfDeathOther] = useState(false);
  const [errDeathPlace, setErrDeathPlace] = useState(false);
  const [errDeathPlaceOther, setErrDeathPlaceOther] = useState(false);
  const [errGender, setErrGender] = useState(false);

  const [showNewbornDatePicker, setShowNewbornDatePicker] = useState(false);

  // When age unit changes, reset cause of death since the options differ
  const handleAgeUnitChange = (unit: 'days' | 'months') => {
    setDeathAgeUnit(unit);
    setCauseOfDeath('');
    setCauseOfDeathOther('');
    setErrCauseOfDeath(false);
    setErrCauseOfDeathOther(false);
    // If switching to months, clear birth condition
    if (unit === 'months') {
      setBirthCondition('');
      setBirthConditionOther('');
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
    }
  };

  // When age value changes, reset birth condition if no longer newborn
  const handleAgeValueChange = (v: string) => {
    // Remove non-numeric characters and leading zeros
    const cleanValue = v.replace(/[^0-9]/g, '').replace(/^0+/, '');
    const num = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    
    setDeathAgeValue(num);
    
    if (deathAgeUnit === 'days' && num >= 28) {
      setBirthCondition('');
      setBirthConditionOther('');
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
      setCauseOfDeath('');
      setCauseOfDeathOther('');
    }
  };

  const handleSave = async () => {
    let hasError = false;

    // Birth condition only required for newborns
    if (isNewborn) {
      if (!birthCondition) { setErrBirthCondition(true); hasError = true; } else { setErrBirthCondition(false); }
      if (birthCondition === 'Other' && !birthConditionOther.trim()) { setErrBirthConditionOther(true); hasError = true; } else { setErrBirthConditionOther(false); }
    } else {
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
    }

    if (!causeOfDeath) { setErrCauseOfDeath(true); hasError = true; } else { setErrCauseOfDeath(false); }
    if (causeOfDeath === 'Other' && !causeOfDeathOther.trim()) { setErrCauseOfDeathOther(true); hasError = true; } else { setErrCauseOfDeathOther(false); }
    if (!deathPlace) { setErrDeathPlace(true); hasError = true; } else { setErrDeathPlace(false); }
    if (deathPlace === 'Other' && !deathPlaceOther.trim()) { setErrDeathPlaceOther(true); hasError = true; } else { setErrDeathPlaceOther(false); }
    if (!gender) { setErrGender(true); hasError = true; } else { setErrGender(false); }

    if (hasError) return;

    try {
      setSubmitting(true);
      const payload = {
        mother_id: record.id,
        mother_name: record.mother_name,
        baby_name: babyName,
        birth_condition: isNewborn ? birthCondition : '',
        birth_condition_other: isNewborn ? birthConditionOther : '',
        cause_of_death: causeOfDeath,
        cause_of_death_other: causeOfDeathOther,
        death_place: deathPlace,
        death_place_other: deathPlaceOther,
        death_age_days: deathAgeValue,
        death_age_unit: deathAgeUnit,
        birth_day: birthDay,
        birth_month: birthMonth,
        birth_year: birthYear,
        gender: gender,
        remarks: remarks,
      } as any;

      await createNewbornDeath(payload);
      showToast(t("newborn_death_modal.success"));

      // Reset all
      setBabyName('');
      setBirthCondition('');
      setBirthConditionOther('');
      setCauseOfDeath('');
      setCauseOfDeathOther('');
      setDeathPlace('');
      setDeathPlaceOther('');
      setDeathAgeValue(1);
      setDeathAgeUnit('days');
      setBirthDay(new Date().getDate());
      setBirthMonth(new Date().getMonth() + 1);
      setBirthYear(new Date().getFullYear());
      setGender('');
      setRemarks('');
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
      Alert.alert(t("newborn_death_modal.error_title"), t("newborn_death_modal.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const FieldLabel = ({ label, hasError, required = true }: { label: string; hasError: boolean; required?: boolean }) => (
    <View className="flex-row items-center mb-2.5">
      <Text className="text-[14px] text-slate-700 font-semibold">{label}</Text>
      {required && <Text className="text-red-500 ml-1">*</Text>}
    </View>
  );

  // Dynamic cause of death options based on age
  const causeOptions = useMemo(() => {
    if (isNewborn) {
      return [
        { v: 'Asphyxia', l: t("newborn_death_modal.asphyxia") },
        { v: 'Hypothermia', l: t("newborn_death_modal.hypothermia") },
        { v: 'Infection', l: t("newborn_death_modal.infection") },
        { v: 'Other', l: t("newborn_death_modal.other") }
      ];
    }
    return [
      { v: 'Pneumonia', l: t("newborn_death_modal.pneumonia") },
      { v: 'Diarrhea', l: t("newborn_death_modal.diarrhea") },
      { v: 'Malnutrition', l: t("newborn_death_modal.malnutrition") },
      { v: 'Other', l: t("newborn_death_modal.other") }
    ];
  }, [isNewborn, t]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm">
          <View className="flex-1 mr-3">
            <Text className="text-slate-900 text-[18px] font-bold">{t("newborn_death_modal.title")}</Text>
            <Text className="text-slate-500 text-[13px] mt-0.5">{t("newborn_death_modal.subtitle")}</Text>
          </View>
          <Pressable onPress={onClose} className="bg-slate-50 p-2 rounded-full border border-slate-100">
            <X size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="px-5 flex-1 mt-5">
          <View className="gap-y-6 pb-8">

            {/* Baby Name */}
            <View>
              <FieldLabel label={t("newborn_death_modal.baby_name")} hasError={false} required={false} />
              <TextInput
                placeholder={t("newborn_death_modal.baby_name_placeholder")}
                placeholderTextColor="#94A3B8"
                className="bg-white border border-slate-200 p-4 rounded-md text-slate-900 text-[15px]"
                onChangeText={setBabyName}
                value={babyName}
              />
            </View>

            {/* Gender */}
            <View>
              <FieldLabel label={t("newborn_death_modal.gender")} hasError={errGender} />
              <View className="flex-row gap-x-3 mt-1">
                {[
                  { v: 'Male', l: t("newborn_death_modal.male") },
                  { v: 'Female', l: t("newborn_death_modal.female") }
                ].map((g) => (
                  <Pressable
                    key={g.v}
                    onPress={() => { setGender(g.v as any); setErrGender(false); }}
                    className={`flex-1 p-4 rounded-md border flex-row items-center shadow-sm ${gender === g.v
                      ? 'bg-blue-50 border-[#0056D2] shadow-blue-100'
                      : errGender ? 'bg-red-50 border-red-300 shadow-red-100' : 'bg-white border-slate-200 shadow-slate-100'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${gender === g.v ? 'border-[#0056D2]' : errGender ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                      {gender === g.v && <View className="w-2.5 h-2.5 rounded-full bg-[#0056D2]" />}
                    </View>
                    <Text className={`text-[15px] font-medium ${gender === g.v ? 'text-[#0056D2]' : 'text-slate-700'}`}>{g.l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Birth Date */}
            <View>
              <FieldLabel label={t("newborn_death_modal.birth_date")} hasError={false} />
              <Pressable
                onPress={() => setShowNewbornDatePicker(true)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-md flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Text className="text-slate-800 text-[15px] font-medium">
                    {toNepali(birthYear, birthMonth, birthDay)}
                  </Text>
                </View>
                <View className="bg-blue-50 p-2 rounded-full">
                  <Calendar size={18} color="#0056D2" />
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

            <View>
              <FieldLabel label={t("newborn_death_modal.death_age")} hasError={false} />

              {/* Age Input with Integrated Dropdown */}
              <View className="flex-row items-center bg-white border border-slate-200 rounded-md px-4 py-1.5 justify-between">
                <TextInput
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  className="font-semibold text-[15px] py-2.5 flex-1"
                  onChangeText={handleAgeValueChange}
                  value={deathAgeValue === 0 ? '' : deathAgeValue.toString()}
                />
                                
                <Pressable 
                  onPress={() => {
                    Alert.alert(
                      t("newborn_death_modal.death_age"),
                      "",
                      [
                        { text: t("newborn_death_modal.age_unit_days"), onPress: () => handleAgeUnitChange('days') },
                        { text: t("newborn_death_modal.age_unit_months"), onPress: () => handleAgeUnitChange('months') },
                        { text: t("reports.common.cancel"), style: "cancel" }
                      ]
                    );
                  }}
                  className="flex-row items-center px-3 py-2 rounded-lg"
                >
                  <Text className="text-[14px] font-semibold mr-1.5">
                    {deathAgeUnit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}
                  </Text>
                  <View className="bg-blue-50 rounded-full p-1">
                    <ChevronDown size={14} color="#000" /> 
                  </View>
                </Pressable>
              </View>
            </View>

            {isNewborn && (
              <View>
                <FieldLabel label={t("newborn_death_modal.birth_condition")} hasError={errBirthCondition} />
                <View className="mt-1 gap-3">
                  {[
                    { v: 'Preterm', l: t("newborn_death_modal.preterm") },
                    { v: 'LowWeight', l: t("newborn_death_modal.low_weight") },
                    { v: 'Normal', l: t("newborn_death_modal.normal") },
                    { v: 'Other', l: t("newborn_death_modal.other") }
                  ].map((c) => (
                    <Pressable
                      key={c.v}
                      onPress={() => { setBirthCondition(c.v); setErrBirthCondition(false); }}
                      className={`flex-1 p-4 rounded-md border flex-row items-center ${birthCondition === c.v
                        ? 'bg-blue-50 border-[#0056D2]'
                        : errBirthCondition ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                        }`}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 mr-3 ${birthCondition === c.v ? 'border-[#0056D2]' : errBirthCondition ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                        {birthCondition === c.v && <View className="w-2.5 h-2.5 rounded-full bg-[#0056D2]" />}
                      </View>
                      <Text className={`text-[14px] font-medium ${birthCondition === c.v ? 'text-[#0056D2]' : 'text-slate-700'}`}>{c.l}</Text>
                    </Pressable>
                  ))}
                </View>
                {birthCondition === 'Other' && (
                  <View className="mt-3">
                    <TextInput
                      placeholder={t("newborn_death_modal.specify_condition")}
                      className={`bg-white border p-4 rounded-xl text-slate-900 text-[15px] ${errBirthConditionOther ? 'border-red-400' : 'border-slate-200'}`}
                      onChangeText={(v) => { setBirthConditionOther(v); if (v.trim()) setErrBirthConditionOther(false); }}
                      value={birthConditionOther}
                    />
                    {errBirthConditionOther && <Text className="text-red-500 text-[12px] mt-1.5 ml-1">{t("newborn_death_modal.specify_condition_error")}</Text>}
                  </View>
                )}
              </View>
            )}

            <View>
              <FieldLabel label={t("newborn_death_modal.cause_of_death")} hasError={errCauseOfDeath} />
              <View className="mt-1 gap-y-2.5">
                {causeOptions.map((c) => (
                  <Pressable
                    key={c.v}
                    onPress={() => { setCauseOfDeath(c.v); setErrCauseOfDeath(false); }}
                    className={`w-full p-4 rounded-md border flex-row items-center ${causeOfDeath === c.v
                      ? 'bg-blue-50 border-[#0056D2]'
                      : errCauseOfDeath ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${causeOfDeath === c.v ? 'border-[#0056D2]' : errCauseOfDeath ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                      {causeOfDeath === c.v && <View className="w-2.5 h-2.5 rounded-full bg-[#0056D2]" />}
                    </View>
                    <Text className={`text-[14px] font-medium ${causeOfDeath === c.v ? 'text-[#0056D2]' : 'text-slate-700'}`}>{c.l}</Text>
                  </Pressable>
                ))}
              </View>
              {causeOfDeath === 'Other' && (
                <View className="mt-3">
                  <TextInput
                    placeholder={t("newborn_death_modal.specify_cause")}
                    className={`bg-white border p-4 rounded-xl text-slate-900 text-[15px] ${errCauseOfDeathOther ? 'border-red-400' : 'border-slate-200'}`}
                    onChangeText={(v) => { setCauseOfDeathOther(v); if (v.trim()) setErrCauseOfDeathOther(false); }}
                    value={causeOfDeathOther}
                  />
                  {errCauseOfDeathOther && <Text className="text-red-500 text-[12px] mt-1.5 ml-1">{t("newborn_death_modal.specify_cause_error")}</Text>}
                </View>
              )}
            </View>

            {/* Death Place */}
            <View>
              <FieldLabel label={t("newborn_death_modal.death_place")} hasError={errDeathPlace} />
              <View className="mt-1 gap-y-2.5">
                {[
                  { value: 'Home', label: t("newborn_death_modal.home") },
                  { value: 'Institution', label: t("newborn_death_modal.institution") },
                  { value: 'Other', label: t("newborn_death_modal.other") }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeathPlace(c.value); setErrDeathPlace(false); }}
                    className={`w-full p-4 rounded-md border flex-row items-center ${deathPlace === c.value
                      ? 'bg-blue-50 border-[#0056D2]'
                      : errDeathPlace ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${deathPlace === c.value ? 'border-[#0056D2]' : errDeathPlace ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                      {deathPlace === c.value && <View className="w-2.5 h-2.5 rounded-full bg-[#0056D2]" />}
                    </View>
                    <Text className={`text-[14px] font-medium ${deathPlace === c.value ? 'text-[#0056D2]' : 'text-slate-700'}`}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              {deathPlace === 'Other' && (
                <View className="mt-3">
                  <TextInput
                    placeholder={t("newborn_death_modal.specify_place")}
                    className={`bg-white border p-4 rounded-xl text-slate-900 text-[15px] ${errDeathPlaceOther ? 'border-red-400' : 'border-slate-200'}`}
                    onChangeText={(v) => { setDeathPlaceOther(v); if (v.trim()) setErrDeathPlaceOther(false); }}
                    value={deathPlaceOther}
                  />
                  {errDeathPlaceOther && (
                    <Text className="text-red-500 text-[12px] mt-1.5 ml-1">{t("newborn_death_modal.specify_place_error")}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Remarks */}
            <View>
              <FieldLabel label={t("newborn_death_modal.remarks")} hasError={false} required={false} />
              <TextInput
                placeholder={t("newborn_death_modal.remarks_placeholder")}
                className="bg-white border border-slate-200 p-4 rounded-md text-slate-900 min-h-[100px] text-[15px]"
                multiline
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                onChangeText={setRemarks}
                value={remarks}
              />
            </View>

          </View>
        </ScrollView>

        <View className="p-5 bg-white border-t border-slate-100">
          <Pressable
            onPress={handleSave}
            disabled={submitting}
            className={`w-full py-4 flex-row items-center justify-center shadow-sm shadow-blue-200 active:opacity-80 ${submitting ? 'bg-slate-400' : 'bg-primary/80'}`}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text className="text-white font-bold text-[16px] ml-2 tracking-wide">{t("newborn_death_modal.save")}</Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
