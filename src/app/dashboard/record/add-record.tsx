import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import { User, Calendar, Baby, Activity, CheckCircle2, ChevronLeft, ChevronRight, Save, Pill, Plus, Check } from "lucide-react-native";
import { CalendarPicker, AdToBs, BsToAd } from "react-native-nepali-picker";
import { FieldLabel, BoxInput, SelectInput } from "../../../components/FormElements";
import CustomHeader from "../../../components/CustomHeader";
import { createHmisRecord, getNextSerialNo, getHmisRecord } from "../../../hooks/database/models/HmisRecordModel";
import { useToast } from "../../../context/ToastContext";
import { useTranslation } from "react-i18next";
import "../../../global.css";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const StepIndicator = ({ currentStep, t }: { currentStep: number, t: any }) => {
  const steps = [
    { icon: User, label: t("add_record.steps.mother") },
    { icon: Activity, label: t("add_record.steps.anc") },
    { icon: Pill, label: t("add_record.steps.meds") },
    { icon: Baby, label: t("add_record.steps.pnc") },
  ];

  return (
    <View className="pt-6 pb-8 bg-white border-b border-gray-50">
      <View className="px-8 flex-row items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i <= currentStep;
          const isCurrent = i === currentStep;
          const isLast = i === steps.length - 1;
          const isLineActive = i < currentStep;

          return (
            <View key={i} className={`flex-row items-center ${!isLast ? 'flex-1' : ''}`}>
              <View className="items-center relative">
                <View 
                  className={`w-12 h-12 rounded-full items-center justify-center border-[2.5px] z-10 bg-white
                    ${isCurrent ? 'border-primary bg-primary' : 
                      isActive ? 'border-primary' : 
                      'border-slate-200'}`}
                >
                  {isActive && !isCurrent ? (
                    <Check size={22} color="#5993f0ff" strokeWidth={3.5} />
                  ) : (
                    <Icon 
                      size={20} 
                      color={isCurrent ? "#5993f0ff" : "#94A3B8"} 
                      strokeWidth={isCurrent ? 2.5 : 2} 
                    />
                  )}
                </View>
                <Text 
                  className={`text-[10px] font-black uppercase tracking-wider absolute -bottom-6 w-20 text-center
                    ${isCurrent ? 'text-primary' : isActive ? 'text-slate-700' : 'text-slate-400'}`}
                >
                  {s.label}
                </Text>
              </View>

              {!isLast && (
                <View className="flex-1 h-[3px] mx-2 bg-slate-100 rounded-full overflow-hidden">
                  <View className={`h-full ${isLineActive ? 'bg-primary' : 'bg-transparent'}`} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default function AddRecordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const getAdString = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toNepali = (d: Date | null) => {
    if (!d) return "";
    try { return AdToBs(getAdString(d)); } catch { return getAdString(d); }
  };

  // Date states
  const [lmpDate, setLmpDate] = useState<Date | null>(null);
  const [showLmpPicker, setShowLmpPicker] = useState(false);
  const [eddDate, setEddDate] = useState<Date | null>(null);
  const [showEddPicker, setShowEddPicker] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    serial_no: 0,
    date_day: new Date().getDate(),
    date_month: new Date().getMonth() + 1,
    date_year: new Date().getFullYear(),
    mother_name: "",
    mother_age: "",
    lmp_day: null as number | null,
    lmp_month: null as number | null,
    lmp_year: null as number | null,
    edd_day: null as number | null,
    edd_month: null as number | null,
    edd_year: null as number | null,
    counseling_given: 0,
    checkup_12: 0, checkup_16: 0, checkup_20_24: 0, checkup_28: 0,
    checkup_32: 0, checkup_34: 0, checkup_36: 0, checkup_38_40: 0,
    checkup_other: "",
    iron_preg_received: 0,
    iron_pnc_received: 0,
    vit_a_received: 0,
    delivery_place: "",
    newborn_condition: "Alive",
    pnc_check_24hr: 0, pnc_check_3day: 0, pnc_check_7_14day: 0, pnc_check_42day: 0,
    pnc_check_other: "",
    family_planning_used: 0,
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
        try {
            if (id) {
                const record = await getHmisRecord(id);
                if (record) {
                    setFormData({
                        ...record,
                        mother_age: String(record.mother_age || ""),
                        serial_no: record.serial_no || 0,
                    } as any);
                    let initialLmp = null;
                    if (record.lmp_year && record.lmp_month && record.lmp_day) {
                        initialLmp = new Date(record.lmp_year, record.lmp_month - 1, record.lmp_day);
                        setLmpDate(initialLmp);
                    }
                    if (record.edd_year && record.edd_month && record.edd_day) {
                        setEddDate(new Date(record.edd_year, record.edd_month - 1, record.edd_day));
                    } else if (initialLmp) {
                        const edd = new Date(initialLmp);
                        edd.setDate(edd.getDate() + 7);
                        edd.setMonth(edd.getMonth() + 9);
                        setEddDate(edd);
                    }
                }
            } else {
                const sn = await getNextSerialNo();
                setFormData(prev => ({ ...prev, serial_no: sn }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsInitialLoading(false);
        }
    };
    init();
  }, [id]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: -step * SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [step]);

  // Suggest ANC weeks automatically based on dates
  useEffect(() => {
    if (lmpDate && eddDate) {
      // 1. Calculate Gestational Weeks for the record date
      const recordDate = new Date(formData.date_year, formData.date_month - 1, formData.date_day);
      const diffTime = recordDate.getTime() - lmpDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diffDays / 7);

      // 2. Update Form Data
      setFormData(prev => {
        const newData = {
          ...prev,
          lmp_day: lmpDate.getDate(),
          lmp_month: lmpDate.getMonth() + 1,
          lmp_year: lmpDate.getFullYear(),
          edd_day: eddDate.getDate(),
          edd_month: eddDate.getMonth() + 1,
          edd_year: eddDate.getFullYear(),
        };

        const anyAncSelected = prev.checkup_12 || prev.checkup_16 || prev.checkup_20_24 || prev.checkup_28 || 
                               prev.checkup_32 || prev.checkup_34 || prev.checkup_36 || prev.checkup_38_40;

        if (weeks > 0) {
            newData.checkup_12 = 0; newData.checkup_16 = 0; newData.checkup_20_24 = 0; newData.checkup_28 = 0;
            newData.checkup_32 = 0; newData.checkup_34 = 0; newData.checkup_36 = 0; newData.checkup_38_40 = 0;

            // Set new one
            if (weeks <= 12) newData.checkup_12 = 1;
            else if (weeks <= 16) newData.checkup_16 = 1;
            else if (weeks <= 24) newData.checkup_20_24 = 1;
            else if (weeks <= 28) newData.checkup_28 = 1;
            else if (weeks <= 32) newData.checkup_32 = 1;
            else if (weeks <= 34) newData.checkup_34 = 1;
            else if (weeks <= 36) newData.checkup_36 = 1;
            else if (weeks <= 42) newData.checkup_38_40 = 1;
        }

        return newData;
      });
    }
  }, [lmpDate, eddDate, formData.date_day, formData.date_month, formData.date_year]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!formData.mother_name.trim()) e.mother_name = t("add_record.validation.name_req");
      const ageStr = String(formData.mother_age).trim();
      if (!ageStr) {
        e.mother_age = t("add_record.validation.age_req");
      } else {
        const ageNum = parseInt(ageStr, 10);
        if (isNaN(ageNum) || ageNum < 18) {
          e.mother_age = t("add_record.validation.age_min");
        } else if (ageNum >= 55) {
          e.mother_age = t("add_record.validation.age_max");
        }
      }

      if (!lmpDate) e.lmpDate = t("add_record.validation.lmp_req");
      if (!eddDate) e.eddDate = t("add_record.validation.edd_req");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 3) setStep(step + 1);
      else handleSave();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const skipStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await createHmisRecord({
        id: id || Crypto.randomUUID(),
        serial_no: formData.serial_no,
        date_day: formData.date_day,
        date_month: formData.date_month,
        date_year: formData.date_year,
        mother_name: formData.mother_name,
        mother_age: parseInt(formData.mother_age as any) || null,
        lmp_day: formData.lmp_day,
        lmp_month: formData.lmp_month,
        lmp_year: formData.lmp_year,
        edd_day: formData.edd_day,
        edd_month: formData.edd_month,
        edd_year: formData.edd_year,
        counseling_given: formData.counseling_given,
        checkup_12: formData.checkup_12,
        checkup_16: formData.checkup_16,
        checkup_20_24: formData.checkup_20_24,
        checkup_28: formData.checkup_28,
        checkup_32: formData.checkup_32,
        checkup_34: formData.checkup_34,
        checkup_36: formData.checkup_36,
        checkup_38_40: formData.checkup_38_40,
        checkup_other: formData.checkup_other,
        iron_preg_received: formData.iron_preg_received,
        iron_pnc_received: formData.iron_pnc_received,
        vit_a_received: formData.vit_a_received,
        delivery_place: formData.delivery_place,
        newborn_condition: formData.newborn_condition,
        pnc_check_24hr: formData.pnc_check_24hr,
        pnc_check_3day: formData.pnc_check_3day,
        pnc_check_7_14day: formData.pnc_check_7_14day,
        pnc_check_42day: formData.pnc_check_42day,
        pnc_check_other: formData.pnc_check_other,
        family_planning_used: formData.family_planning_used,
        remarks: formData.remarks,
      });
      showToast(id ? t("add_record.actions.update_success") : t("add_record.actions.save_success"));
      router.back();
    } catch (error) {
      console.error(error);
      showToast(t("add_record.actions.save_failed"));
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleBox = ({ label, value, onToggle }: { label: string, value: number, onToggle: (val: number) => void }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onToggle(value === 1 ? 0 : 1)}
      className={`flex-1 flex-row items-center py-4 rounded-xl px-3 border mb-2 border-gray-300 ${value ===1 ? "border border-primary bg-blue-50/40" : ""} `}
    >
      <View className={`w-4 h-4 rounded mr-2 items-center justify-center border bg-white border-gray-400`}>
        {value === 1 && <Check size={12} color="#6B7280" strokeWidth={3} />}
      </View>
      <Text className={`text-[14px] text-gray-500`}>{label}</Text>
    </TouchableOpacity>
  );

  const showSkip = id ? (step < 3) : (step >= 1 && step < 3);

  if (isInitialLoading) {
      return (
          <View className="flex-1 items-center justify-center bg-white">
              <ActivityIndicator size="large" color="#3B82F6" />
          </View>
      );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <CustomHeader 
        title={id ? t("add_record.title_edit") : t("add_record.title_new")} 
        className="border-b border-slate-100"
      />

      <StepIndicator currentStep={step} t={t} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            flexDirection: "row",
            width: SCREEN_WIDTH * 4,
            transform: [{ translateX: slideAnim }],
          }}
        >
          {/* Step 1: Basic Info & Dates */}
          <View style={{ width: SCREEN_WIDTH }}>
            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FieldLabel label={t("add_record.basic_info.mother_name")} />
              <BoxInput
                placeholder={t("add_record.basic_info.mother_name_placeholder")}
                value={formData.mother_name}
                onChangeText={(v) => updateField("mother_name", v)}
                error={errors.mother_name}
              />

              <FieldLabel label={t("add_record.basic_info.age")} />
              <BoxInput
                placeholder={t("add_record.basic_info.age_placeholder")}
                value={String(formData.mother_age)}
                onChangeText={(v) => updateField("mother_age", v)}
                keyboardType="numeric"
                error={errors.mother_age}
              />

              <FieldLabel label={t("add_record.basic_info.lmp_date")} />
              <View className="mb-6">
                <TouchableOpacity
                  onPress={() => setShowLmpPicker(true)}
                  className={`rounded-xl h-14 border ${errors.lmpDate ? 'border-red-300' : 'border-gray-300'} px-4 flex-row items-center justify-between`}
                >
                  <Text className={`text-base ${lmpDate ? 'text-[#1E293B]' : 'text-gray-400'}`}>
                    {lmpDate ? toNepali(lmpDate) : t("add_record.basic_info.select_lmp")}
                  </Text>
                  <Calendar size={20} color="#94A3B8" />
                </TouchableOpacity>
                {errors.lmpDate && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.lmpDate}</Text>}
              </View>

              <CalendarPicker
                visible={showLmpPicker}
                onClose={() => setShowLmpPicker(false)}
                onDateSelect={(bsDate) => {
                  setShowLmpPicker(false);
                  try {
                    const adDate = BsToAd(bsDate);
                    const parts = adDate.split('-');
                    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    setLmpDate(dateObj);
                    setErrors(prev => { const newErrs = {...prev}; delete newErrs.lmpDate; delete newErrs.eddDate; return newErrs; });
                    const edd = new Date(dateObj);
                    edd.setDate(edd.getDate() + 7);
                    edd.setMonth(edd.getMonth() + 9);
                    setEddDate(edd);
                  } catch (e) { console.error(e); }
                }}
                language="np"
                theme="light"
                brandColor="#5993f0"
                date={lmpDate ? toNepali(lmpDate) : undefined}
                dayTextStyle={{ fontWeight: 'normal' }}
                weekTextStyle={{ fontWeight: 'normal' }}
                titleTextStyle={{ fontWeight: 'normal' }}
              />

              <FieldLabel label={t("add_record.basic_info.edd_date")} />
              <View className="mb-6">
                <TouchableOpacity
                  onPress={() => setShowEddPicker(true)}
                  className={`rounded-xl h-14 border ${errors.eddDate ? 'border-red-300' : 'border-gray-300'} px-4 flex-row items-center justify-between`}
                >
                  <Text className={`text-base ${eddDate ? 'text-[#1E293B]' : 'text-gray-400'}`}>
                    {eddDate ? toNepali(eddDate) : t("add_record.basic_info.select_edd")}
                  </Text>
                  <Calendar size={20} color="#94A3B8" />
                </TouchableOpacity>
                {errors.eddDate && <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.eddDate}</Text>}
              </View>

              <CalendarPicker
                visible={showEddPicker}
                onClose={() => setShowEddPicker(false)}
                onDateSelect={(bsDate) => {
                  setShowEddPicker(false);
                  try {
                    const adDate = BsToAd(bsDate);
                    const parts = adDate.split('-');
                    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    setEddDate(dateObj);
                    setErrors(prev => { const newErrs = {...prev}; delete newErrs.lmpDate; delete newErrs.eddDate; return newErrs; });
                    const lmp = new Date(dateObj);
                    lmp.setDate(lmp.getDate() - 7);
                    lmp.setMonth(lmp.getMonth() - 9);
                    setLmpDate(lmp);
                  } catch (e) { console.error(e); }
                }}
                language="np"
                theme="light"
                brandColor="#5993f0"
                date={eddDate ? toNepali(eddDate) : undefined}
                dayTextStyle={{ fontWeight: 'normal' }}
                weekTextStyle={{ fontWeight: 'normal' }}
                titleTextStyle={{ fontWeight: 'normal' }}
              />

              <FieldLabel label={t("add_record.basic_info.counseling_given")} />
              <View className="flex-row gap-4 mb-4">
                 <ToggleBox label={t("add_record.basic_info.yes")} value={formData.counseling_given} onToggle={(v) => updateField("counseling_given", v)} />
              </View>
            </ScrollView>
          </View>

          {/* Step 3: ANC Visits */}
          <View style={{ width: SCREEN_WIDTH }}>
            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text className="text-gray-700 mb-4 text-md">{t("add_record.anc_visits.subtitle")}</Text>
              <View className="flex-row gap-4">
                 <ToggleBox label={t("add_record.anc_visits.wk12")} value={formData.checkup_12} onToggle={(v) => updateField("checkup_12", v)} />
                 <ToggleBox label={t("add_record.anc_visits.wk16")} value={formData.checkup_16} onToggle={(v) => updateField("checkup_16", v)} />
              </View>
              <View className="flex-row gap-4">
                 <ToggleBox label={t("add_record.anc_visits.wk20_24")} value={formData.checkup_20_24} onToggle={(v) => updateField("checkup_20_24", v)} />
                 <ToggleBox label={t("add_record.anc_visits.wk28")} value={formData.checkup_28} onToggle={(v) => updateField("checkup_28", v)} />
              </View>
              <View className="flex-row gap-4">
                 <ToggleBox label={t("add_record.anc_visits.wk32")} value={formData.checkup_32} onToggle={(v) => updateField("checkup_32", v)} />
                 <ToggleBox label={t("add_record.anc_visits.wk34")} value={formData.checkup_34} onToggle={(v) => updateField("checkup_34", v)} />
              </View>
              <View className="flex-row gap-4">
                 <ToggleBox label={t("add_record.anc_visits.wk36")} value={formData.checkup_36} onToggle={(v) => updateField("checkup_36", v)} />
                 <ToggleBox label={t("add_record.anc_visits.wk38_40")} value={formData.checkup_38_40} onToggle={(v) => updateField("checkup_38_40", v)} />
              </View>
              <FieldLabel label={t("add_record.anc_visits.other_wk")} />
              <BoxInput placeholder={t("add_record.anc_visits.other_wk_placeholder")} value={formData.checkup_other} onChangeText={(v) => updateField("checkup_other", v)} />
            </ScrollView>
          </View>

          {/* Step 4: Meds */}
          <View style={{ width: SCREEN_WIDTH }}>
            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="flex flex-col gap-4">
              <View>
              <FieldLabel label={t("add_record.meds.iron_180")} />
              <ToggleBox label={t("add_record.meds.received")} value={formData.iron_preg_received} onToggle={(v) => updateField("iron_preg_received", v)} />
              </View>
              <View>
                <FieldLabel label={t("add_record.meds.iron_45")} />
                <ToggleBox label={t("add_record.meds.received")} value={formData.iron_pnc_received} onToggle={(v) => updateField("iron_pnc_received", v)} />
              </View>
              <View>
                <FieldLabel label={t("add_record.meds.vit_a")} />
                <ToggleBox label={t("add_record.meds.received")} value={formData.vit_a_received} onToggle={(v) => updateField("vit_a_received", v)} />
              </View>
              </View>
            </ScrollView>
          </View>

          {/* Step 5: PNC & Delivery */}
          <View style={{ width: SCREEN_WIDTH }}>
            <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View className="pb-10">
              <FieldLabel label={t("add_record.pnc_delivery.delivery_place")} />
              <SelectInput
              placeholder={t("add_record.pnc_delivery.delivery_place_placeholder")}
                label={t("add_record.pnc_delivery.place")}
                value={formData.delivery_place}
                options={[
                  { label: t("add_record.pnc_delivery.home"), value: "Home" },
                  { label: t("add_record.pnc_delivery.facility"), value: "Facility" },
                  { label: t("add_record.pnc_delivery.other"), value: "Other" },
                ]}
                onSelect={(v: string) => updateField("delivery_place", v)}
              />

              <FieldLabel label={t("add_record.pnc_delivery.newborn_condition")} />
              <SelectInput
                label={t("add_record.pnc_delivery.condition")}
                value={formData.newborn_condition}
                placeholder={t("add_record.pnc_delivery.select_condition")}
                options={[
                  { label: t("add_record.pnc_delivery.alive"), value: "Alive" },
                  { label: t("add_record.pnc_delivery.dead"), value: "Dead" },
                ]}
                onSelect={(v: string) => updateField("newborn_condition", v)}
              />

              <Text className="text-gray-800 text-[15px] mb-2">{t("add_record.pnc_delivery.pnc_checkups")}</Text>
              <View className="flex-row gap-2">
                 <ToggleBox label={t("add_record.pnc_delivery.hr24")} value={formData.pnc_check_24hr} onToggle={(v) => updateField("pnc_check_24hr", v)} />
                 <ToggleBox label={t("add_record.pnc_delivery.day3")} value={formData.pnc_check_3day} onToggle={(v) => updateField("pnc_check_3day", v)} />
              </View>
              <View className="flex-row gap-2">
                 <ToggleBox label={t("add_record.pnc_delivery.day7_14")} value={formData.pnc_check_7_14day} onToggle={(v) => updateField("pnc_check_7_14day", v)} />
                 <ToggleBox label={t("add_record.pnc_delivery.day42")} value={formData.pnc_check_42day} onToggle={(v) => updateField("pnc_check_42day", v)} />
              </View>

              <FieldLabel label={t("add_record.pnc_delivery.fp_method")} />
              <ToggleBox label={t("add_record.pnc_delivery.used")} value={formData.family_planning_used} onToggle={(v) => updateField("family_planning_used", v)} />

              <FieldLabel label={t("add_record.pnc_delivery.remarks")} />
              <TextInput
                placeholder={t("add_record.pnc_delivery.notes")}
                value={formData.remarks}
                onChangeText={(v) => updateField("remarks", v)}
                className="border border-gray-400 rounded-xl p-3 h-24 text-top"
                textAlignVertical="top"
              />
              </View>
            </ScrollView>
          </View>
        </Animated.View>

        {/* Navigation Buttons */}
        <View className="px-6 pb-16 pt-4 bg-white">
          <View className="flex-row gap-3">
              {step > 0 && (
              <TouchableOpacity
                  onPress={prevStep}
                  className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center border border-gray-200"
              >
                  <ChevronLeft size={20} color="#64748B" />
              </TouchableOpacity>
              )}
              
              <TouchableOpacity
                  onPress={nextStep}
                  disabled={isLoading}
                  className={`flex-1 py-4 rounded-xl bg-primary items-center justify-center`}
              >
              <View className="flex-row items-center">
                  <Text className="text-white font-bold text-md mr-2">
                  {step === 3 ? (isLoading ? t("add_record.actions.saving") : t("add_record.actions.finish")) : t("add_record.actions.next_step")}
                  </Text>
                  {step === 3 ? <Save size={18} color="white" /> : <ChevronRight size={18} color="white" />}
              </View>
              </TouchableOpacity>

              {showSkip && (
                  <TouchableOpacity
                      onPress={skipStep}
                      className="px-4 h-12 rounded-xl bg-orange-50 items-center justify-center border border-orange-100"
                  >
                      <Text className="text-orange-600 font-bold text-xs">{t("add_record.actions.skip")}</Text>
                  </TouchableOpacity>
              )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
