import { Calendar, ChevronDown, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { getInfantMonitoringsByMother } from "../../hooks/database/models/InfantMonitoringModel";
import { createNewbornDeath } from "../../hooks/database/models/NewbornDeathModel";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { InfantMonitoringStoreType } from "../../hooks/database/types/infantMonitoringModal";
import { NewbornDeathStoreType } from "../../hooks/database/types/newbornDeathModal";
import { Button } from "../button";
import { ProfilePicker } from "../ProfilePicker";

interface NewbornDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  children?: InfantMonitoringStoreType[];
  initialChildId?: string;
  initialChildName?: string;
  onSuccess: (updatedDeath: NewbornDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function NewbornDeathModal({
  visible,
  onClose,
  record,
  children: initialChildren,
  initialChildId,
  initialChildName,
  onSuccess,
  showToast
}: NewbornDeathModalProps) {
  const { t } = useTranslation();

  // Form values
  const [motherChildren, setMotherChildren] = useState<InfantMonitoringStoreType[]>(initialChildren || []);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(initialChildId || '');
  const [birthCondition, setBirthCondition] = useState('');
  const [birthConditionOther, setBirthConditionOther] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [causeOfDeathOther, setCauseOfDeathOther] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathPlaceOther, setDeathPlaceOther] = useState('');
  const [deathAgeValue, setDeathAgeValue] = useState(0);
  const [deathAgeUnit, setDeathAgeUnit] = useState<'days' | 'months'>('days');

  // Birth Date
  const [birthDay, setBirthDay] = useState(new Date().getDate());
  const [birthMonth, setBirthMonth] = useState(new Date().getMonth() + 1);
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());

  // Death Date
  const [deathDay, setDeathDay] = useState(new Date().getDate());
  const [deathMonth, setDeathMonth] = useState(new Date().getMonth() + 1);
  const [deathYear, setDeathYear] = useState(new Date().getFullYear());

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
  const [errChild, setErrChild] = useState('');

  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [showDeathDatePicker, setShowDeathDatePicker] = useState(false);

  useEffect(() => {
    if (initialChildren) {
      setMotherChildren(initialChildren);
    }
  }, [initialChildren]);

  useEffect(() => {
    let isActive = true;

    const loadMotherChildren = async () => {
      if (!visible || initialChildren?.length || !record.id) return;

      try {
        setLoadingChildren(true);
        const children = await getInfantMonitoringsByMother(record.id);
        if (isActive) setMotherChildren(children);
      } catch (error) {
        console.error("Failed to load mother children:", error);
      } finally {
        if (isActive) setLoadingChildren(false);
      }
    };

    loadMotherChildren();

    return () => {
      isActive = false;
    };
  }, [visible, initialChildren?.length, record.id]);

  const childOptions = useMemo(
    () =>
      motherChildren
        .filter((child) => child.status !== 'dead')
        
        .map((child, index) => {
          const unnamedChild = t("newborn_death_modal.unnamed_child", {
            defaultValue: "Unnamed child",
          });

          return {
            value: child.id,
            label: child.baby_name?.trim() || `${unnamedChild} ${index + 1}`,
          };
        }),
    [motherChildren, t],
  );

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    setErrChild('');
  };

  // Sync child details when selectedChildId or motherChildren changes
  useEffect(() => {
    if (!selectedChildId || motherChildren.length === 0) return;

    const selectedChild = motherChildren.find((child) => child.id === selectedChildId);
    if (selectedChild) {
      // Robust gender sync
      if (selectedChild.gender) {
        const g = selectedChild.gender.charAt(0).toUpperCase() + selectedChild.gender.slice(1).toLowerCase();
        if (g === 'Male' || g === 'Female') {
          setGender(g);
        }
      }

      // Robust birth date sync
      if (selectedChild.date_of_birth) {
        // Handle various formats: YYYY-MM-DD or YYYY/MM/DD or ISO string
        const parts = selectedChild.date_of_birth.split(/[-/T ]/);
        if (parts.length >= 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);

          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            // Check if it's likely a BS date (year > 2000) or AD date
            // Note: Our system stores AD in date_of_birth according to child-form.tsx
            setBirthYear(year);
            setBirthMonth(month);
            setBirthDay(day);
          }
        }
      }
    }
  }, [selectedChildId, motherChildren]);

  // Sync initialChildId to selectedChildId
  useEffect(() => {
    if (visible && initialChildId) {
      setSelectedChildId(initialChildId);
    }
  }, [visible, initialChildId]);

  // Auto-calculate age
  useEffect(() => {
    if (birthYear && birthMonth && birthDay && deathYear && deathMonth && deathDay) {
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
      const deathDate = new Date(deathYear, deathMonth - 1, deathDay);

      const diffTime = deathDate.getTime() - birthDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        setDeathAgeValue(0);
        return;
      }

      if (diffDays < 28) {
        setDeathAgeValue(diffDays);
        setDeathAgeUnit('days');
      } else {
        const months = Math.floor(diffDays / 30);
        setDeathAgeValue(months || 1);
        setDeathAgeUnit('months');
      }
    }
  }, [birthYear, birthMonth, birthDay, deathYear, deathMonth, deathDay]);

  const handleAgeUnitChange = (unit: 'days' | 'months') => {
    setDeathAgeUnit(unit);
    setCauseOfDeath('');
    setCauseOfDeathOther('');
    setErrCauseOfDeath(false);
    setErrCauseOfDeathOther(false);
    if (unit === 'months') {
      setBirthCondition('');
      setBirthConditionOther('');
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
    }
  };

  const handleAgeValueChange = (v: string) => {
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

    if (!selectedChildId) {
      setErrChild(t("newborn_death_modal.select_child_error", {
        defaultValue: "Please choose a child.",
      }));
      hasError = true;
    } else {
      setErrChild('');
    }

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

    const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
    const deathDate = new Date(deathYear, deathMonth - 1, deathDay);
    if (deathDate < birthDate) {
      Alert.alert(t("newborn_death_modal.error_title"), t("newborn_death_modal.date_error", { defaultValue: "Death date cannot be before birth date." }));
      hasError = true;
    }

    if (hasError) return;

    try {
      setSubmitting(true);
      const selectedChild = motherChildren.find((child) => child.id === selectedChildId);
      const payload = {
        mother_id: record.id,
        mother_name: record.mother_name,
        child_id: selectedChildId,
        baby_name: selectedChild?.baby_name?.trim() || "",
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
        death_day: deathDay,
        death_month: deathMonth,
        death_year: deathYear,
        gender: gender,
        remarks: remarks,
      } as any;

      await createNewbornDeath(payload);
      showToast(t("newborn_death_modal.success"));

      // Reset
      setSelectedChildId('');
      setBirthCondition('');
      setBirthConditionOther('');
      setCauseOfDeath('');
      setCauseOfDeathOther('');
      setDeathPlace('');
      setDeathPlaceOther('');
      setDeathAgeValue(1);
      setDeathAgeUnit('days');
      setGender('');
      setRemarks('');
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
      setErrCauseOfDeath(false);
      setErrCauseOfDeathOther(false);
      setErrDeathPlace(false);
      setErrDeathPlaceOther(false);
      setErrGender(false);
      setErrChild('');

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
      <Text className="text-[16px] text-slate-700 font-semibold">{label}</Text>
      {required && <Text className="text-red-500 ml-1">*</Text>}
    </View>
  );

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
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <View className="flex-1 mr-3">
            <Text className="text-slate-800 text-[18px] font-semibold">{t("newborn_death_modal.title")}</Text>
          </View>
          <Pressable onPress={onClose} className="bg-slate-50 p-2 rounded-full border border-slate-100">
            <X size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="px-5 flex-1 mt-3">
          <View className="b-8">

            {/* Choose Baby (Only if not from Child Profile) */}

            <View>
              <FieldLabel label={t("newborn_death_modal.choose_baby", { defaultValue: "Choose Baby" })} hasError={!!errChild} />
              <ProfilePicker
                label=""
                placeholder={
                  loadingChildren
                    ? t("newborn_death_modal.loading_children", { defaultValue: "Loading children..." })
                    : t("newborn_death_modal.choose_baby_placeholder", { defaultValue: "Select child" })
                }
                selectedValue={initialChildId && initialChildName ? initialChildId : selectedChildId}
                onValueChange={handleChildChange}
                options={childOptions}
                error={errChild}
                isSearchable
                disabled={!!initialChildId && !!initialChildName}
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
                    className={`flex-1 p-4 rounded-xl border flex-row items-center ${gender === g.v
                      ? 'bg-475569/5 border-[#475569]'
                      : errGender ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${gender === g.v ? 'border-[#475569]' : errGender ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                      {gender === g.v && <View className="w-2.5 h-2.5 rounded-full bg-[#475569]" />}
                    </View>
                    <Text className={`text-[15px] font-medium ${gender === g.v ? 'text-black' : 'text-slate-700'}`}>{g.l}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Dates Row */}
            <View className="flex-row gap-x-4 pt-6">
              {/* Birth Date (Read-Only) */}
              <View className="flex-1">
                <FieldLabel label={t("newborn_death_modal.birth_date")} hasError={false} />
                <View
                  className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl flex-row items-center justify-between"
                >
                  <Text className="text-slate-500 text-[14px] font-medium" numberOfLines={1}>
                    {toNepali(birthYear, birthMonth, birthDay)}
                  </Text>
                  <Calendar size={16} color="#94A3B8" />
                </View>
              </View>

              {/* Death Date */}
              <View className="flex-1">
                <FieldLabel label={t("newborn_death.death_date", { defaultValue: "Death Date" })} hasError={false} />
                <Pressable
                  onPress={() => setShowDeathDatePicker(true)}
                  className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex-row items-center justify-between"
                >
                  <Text className="text-slate-800 text-[14px] font-medium" numberOfLines={1}>
                    {toNepali(deathYear, deathMonth, deathDay)}
                  </Text>
                  <Calendar size={16} color="#E11D48" />
                </Pressable>
              </View>
            </View>

            {/* Date Pickers */}
            <CalendarPicker
              visible={showDeathDatePicker}
              onClose={() => setShowDeathDatePicker(false)}
              onDateSelect={(bsDate) => {
                setShowDeathDatePicker(false);
                try {
                  const adDate = BsToAd(bsDate);
                  const parts = adDate.split('-');
                  setDeathYear(parseInt(parts[0], 10));
                  setDeathMonth(parseInt(parts[1], 10));
                  setDeathDay(parseInt(parts[2], 10));
                } catch (e) { console.error(e); }
              }}
              language="np" theme="light" brandColor="#E11D48"
              date={toNepali(deathYear, deathMonth, deathDay)}
            />

            {/* Age Display */}
            <View className="pt-6">
              <FieldLabel label={t("newborn_death_modal.death_age")} hasError={false} />
              <View className="flex-row items-center bg-primary/5 border border-[#475569] rounded-xl px-4 py-3 justify-between">
                <View>
                  <Text className="text-[#475569] font-bold text-[18px]">
                    {deathAgeValue} {deathAgeUnit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      t("newborn_death_modal.death_age"),
                      t("newborn_death_modal.manual_override", { defaultValue: "Manual override unit" }),
                      [
                        { text: t("newborn_death_modal.age_unit_days"), onPress: () => handleAgeUnitChange('days') },
                        { text: t("newborn_death_modal.age_unit_months"), onPress: () => handleAgeUnitChange('months') },
                        { text: t("reports.common.cancel"), style: "cancel" }
                      ]
                    );
                  }}
                  className="bg-white px-3 py-2 rounded-lg border border-[#475569] flex-row items-center"
                >
                  <Text className="text-[13px] font-semibold text-[#475569] mr-2 uppercase tracking-wide">
                    {deathAgeUnit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}
                  </Text>
                  <ChevronDown size={14} color="#475569" />
                </Pressable>
              </View>
            </View>

            {isNewborn && (
              <View className="pt-6">
                <FieldLabel label={t("newborn_death_modal.birth_condition")} hasError={errBirthCondition} />
                <View className="mt-1 gap-3 flex-row flex-wrap gap-4">
                  {[
                    { v: 'Preterm', l: t("newborn_death_modal.preterm") },
                    { v: 'LowWeight', l: t("newborn_death_modal.low_weight") },
                    { v: 'Normal', l: t("newborn_death_modal.normal") },
                    { v: 'Other', l: t("newborn_death_modal.other") }
                  ].map((c) => (
                    <Pressable
                      key={c.v}
                      onPress={() => { setBirthCondition(c.v); setErrBirthCondition(false); }}
                      className={`w-[45%] p-4 rounded-xl border flex-row items-center ${birthCondition === c.v
                        ? 'bg-primary/5 border-[#475569]'
                        : errBirthCondition ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                        }`}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 mr-3 ${birthCondition === c.v ? 'border-[#475569]' : errBirthCondition ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                        {birthCondition === c.v && <View className="w-2.5 h-2.5 rounded-full bg-[#475569]" />}
                      </View>
                      <Text className={`text-[16px] font-medium ${birthCondition === c.v ? 'text-black' : 'text-slate-700'}`}>{c.l}</Text>
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
                  </View>
                )}
              </View>
            )}

            <View className="pt-6">
              <FieldLabel label={t("newborn_death_modal.cause_of_death")} hasError={errCauseOfDeath} />
              <View className="mt-1 gap-y-2.5 flex-row flex-wrap gap-4">
                {causeOptions.map((c) => (
                  <Pressable
                    key={c.v}
                    onPress={() => { setCauseOfDeath(c.v); setErrCauseOfDeath(false); }}
                    className={`w-[45%] p-4 rounded-xl border flex-row items-center ${causeOfDeath === c.v
                      ? 'bg-primary/5 border-[#475569]'
                      : errCauseOfDeath ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${causeOfDeath === c.v ? 'border-[#475569]' : errCauseOfDeath ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                      {causeOfDeath === c.v && <View className="w-2.5 h-2.5 rounded-full bg-[#475569]" />}
                    </View>
                    <Text className={`text-[16px] font-medium ${causeOfDeath === c.v ? 'text-black' : 'text-slate-700'}`}>{c.l}</Text>
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
                </View>
              )}
            </View>

            <View className="pt-6">
              <FieldLabel label={t("newborn_death_modal.death_place")} hasError={errDeathPlace} />
              <View className="mt-1 gap-y-2.5 flex-row flex-wrap gap-4">
                {[
                  { value: 'Home', label: t("newborn_death_modal.home") },
                  { value: 'Institution', label: t("newborn_death_modal.institution") },
                  { value: 'Other', label: t("newborn_death_modal.other") }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeathPlace(c.value); setErrDeathPlace(false); }}
                    className={`p-4 w-[45%] rounded-xl border flex-row items-center ${deathPlace === c.value
                      ? 'bg-primary/5 border-[#475569]'
                      : errDeathPlace ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${deathPlace === c.value ? 'border-[#475569]' : errDeathPlace ? 'border-red-300' : 'border-slate-300'} items-center justify-center`}>
                      {deathPlace === c.value && <View className="w-2.5 h-2.5 rounded-full bg-[#475569]" />}
                    </View>
                    <Text className={`text-[16px] font-medium ${deathPlace === c.value ? 'text-black' : 'text-slate-700'}`}>{c.label}</Text>
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
                </View>
              )}
            </View>

            <View className="pt-6">
              <FieldLabel label={t("newborn_death_modal.remarks")} hasError={false} required={false} />
              <TextInput
                placeholder={t("newborn_death_modal.remarks_placeholder")}
                className="bg-white border border-slate-200 p-4 rounded-xl text-slate-900 min-h-[100px] text-[16px]"
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
          <Button
            onPress={handleSave}
            isLoading={submitting}
            title={t("newborn_death_modal.save")}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
