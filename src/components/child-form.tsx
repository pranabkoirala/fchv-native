import CustomHeader from "@/components/CustomHeader";
import { BoxInput } from "@/components/FormElements";
import { ProfilePicker } from "@/components/ProfilePicker";
import TextArea from "@/components/TextArea";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import {
  createInfantMonitoring,
  getAllInfantMonitorings,
} from "@/hooks/database/models/InfantMonitoringModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "@/hooks/database/models/MotherModel";
import { getPregnanciesByMotherId } from "@/hooks/database/models/PregnantWomenModal";
import { PregnancyStoreType } from "@/hooks/database/types/pregnancyModal";
import {
  BIRTH_PLACE_OPTIONS,
  CHILD_STATUS_OPTIONS,
  NEWBORN_CARE_OPTIONS,
} from "@/utils/data";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar as CalendarIcon, Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "./button";

export default function ChildRegistrationForm() {
  const { id, motherId, pregnancyId, from } = useLocalSearchParams<{ id: string; motherId?: string; pregnancyId?: string; from?: string }>();
  const { showToast } = useToast();
  const router = useRouter();
  const { t, language } = useLanguage();

  const BABY_WEIGHT_OPTIONS = [
    {
      label: t("child_form.options.normal"),
      value: "normal",
    },
    {
      label: t("child_form.options.low"),
      value: "low",
    },
    {
      label: t("child_form.options.very_low"),
      value: "very_low",
    },
  ];

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState("");
  const [babyName, setBabyName] = useState("");
  const [birthDateAd, setBirthDateAd] = useState("");
  const [birthDateBs, setBirthDateBs] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthPlace, setBirthPlace] = useState("institution");
  const [babyWeight, setBabyWeight] = useState("normal");
  const [status, setStatus] = useState("alive");
  const [remarks, setRemarks] = useState("");
  const [allGiven, setAllGiven] = useState(0);
  const [gender, setGender] = useState<"Male" | "Female" | "">("");

  // Indicators (0 or 1)
  const [fchvPresent, setFchvPresent] = useState(0);
  const [skilledBirthAttended, setSkilledBirthAttended] = useState(0);
  const [asphyxiatedNewborn, setAsphyxiatedNewborn] = useState(0);

  // Newborn care is a comma-separated string based on NEWBORN_CARE_OPTIONS
  const [newbornCare, setNewbornCare] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pregnancy linking: default YES when pregnancyId is passed in or when redirected from profile
  const [linkToPregnancy, setLinkToPregnancy] = useState(!!pregnancyId || from === "profile");

  // Suggestion states
  const [motherPregnancies, setMotherPregnancies] = useState<PregnancyStoreType[]>([]);
  const [suggestedPregnancy, setSuggestedPregnancy] = useState<PregnancyStoreType | null>(null);

  // Fetch mother's pregnancies when selectedMotherId changes
  useEffect(() => {
    if (selectedMotherId) {
      getPregnanciesByMotherId(selectedMotherId)
        .then((res) => {
          setMotherPregnancies(res);
        })
        .catch(console.error);
    } else {
      setMotherPregnancies([]);
    }
  }, [selectedMotherId]);

  // Pregnancy matching logic based on child DOB (birthDateAd)
  useEffect(() => {
    if (!pregnancyId && birthDateAd && motherPregnancies.length > 0) {
      const childDob = new Date(birthDateAd);
      if (isNaN(childDob.getTime())) return;

      // Find a pregnancy whose EDD is within 45 days of child's DOB
      const match = motherPregnancies.find((p) => {
        if (!p.expected_delivery_date) return false;
        try {
          const edd = new Date(p.expected_delivery_date);
          if (isNaN(edd.getTime())) return false;
          const diffTime = Math.abs(childDob.getTime() - edd.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 45;
        } catch {
          return false;
        }
      });

      if (match) {
        setSuggestedPregnancy(match);
      } else {
        setSuggestedPregnancy(null);
      }
    } else {
      setSuggestedPregnancy(null);
    }
  }, [birthDateAd, motherPregnancies, pregnancyId]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const motherList = await getAllMothersList();
        setMothers(motherList);

        if (id) {
          const all = await getAllInfantMonitorings();
          const infant = all.find((i) => i.id === id);
          if (infant) {
            setSelectedMotherId(infant.mother || "");
            setBabyName(infant.baby_name || "");
            setBirthPlace(infant.birth_place || "institution");
            setBabyWeight(infant.baby_weight || "normal");
            setRemarks(infant.remarks || "");
            setFchvPresent(infant.fchv_present || 0);
            setSkilledBirthAttended(infant.skilled_birth_attended || 0);
            setAsphyxiatedNewborn(infant.asphyxiated_newborn || 0);
            setStatus(infant.status || "alive");
            setAllGiven(infant.is_all_given || 0);
            setGender(infant.gender || "");

            const care = [];
            if (infant.umbilical_ointment) care.push("umbilical_ointment");
            if (infant.skin_to_skin) care.push("skin_to_skin");
            if (infant.early_breastfeeding) care.push("early_breastfeeding");
            setNewbornCare(care);

            if (infant.date_of_birth) {
              setBirthDateAd(infant.date_of_birth);
              try {
                setBirthDateBs(AdToBs(infant.date_of_birth));
              } catch (e) { }
            }
          }
        } else if (motherId) {
          setSelectedMotherId(motherId);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMotherId)
      e.motherId = t("child_form.validation.mother_required", "Mother is required");
    if (!birthDateAd)
      e.birthDate = t("child_form.validation.birth_date_required", "Birth date is required");
    if (!gender)
      e.gender = t("child_form.validation.gender_required", "Gender is required");
    return e;
  };

  const handleSave = async () => {
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id: id || Crypto.randomUUID(),
        mother: selectedMotherId,
        baby_name: babyName,
        date_of_birth: birthDateAd,
        birth_place: birthPlace,
        fchv_present: fchvPresent,
        skilled_birth_attended: skilledBirthAttended,
        baby_weight: babyWeight,
        umbilical_ointment: newbornCare.includes("umbilical_ointment") ? 1 : 0,
        skin_to_skin: newbornCare.includes("skin_to_skin") ? 1 : 0,
        early_breastfeeding: newbornCare.includes("early_breastfeeding")
          ? 1
          : 0,
        asphyxiated_newborn: asphyxiatedNewborn,
        status: status,
        is_all_given: allGiven,
        gender: gender || undefined,
        remarks: remarks,
        // Pregnancy linkage
        pregnancy_id: linkToPregnancy && (pregnancyId || suggestedPregnancy?.id) ? (pregnancyId || suggestedPregnancy?.id) : null,
        registration_source: (linkToPregnancy && (pregnancyId || suggestedPregnancy?.id)
          ? 'PREGNANCY'
          : 'DIRECT_CHILD_REGISTRATION') as 'PREGNANCY' | 'DIRECT_CHILD_REGISTRATION',
      };
      await createInfantMonitoring(payload);
      showToast(t("child_form.messages.save_success", "Record saved successfully"));
      if (!id && from === "profile" && selectedMotherId) {
        router.replace({
          pathname: "/dashboard/profile",
          params: { id: selectedMotherId }
        } as any);
      } else {
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        t("child_form.validation.error", "Error"),
        t("child_form.messages.save_failed", "Failed to save record."),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (text: string) => {
    setBirthDateBs(text);
    // basic validation to convert
    if (text.length === 10) {
      try {
        const ad = BsToAd(text);
        setBirthDateAd(ad);
        if (errors.birthDate) {
          setErrors({ ...errors, birthDate: "" });
        }
      } catch (e) {
        // invalid bs date
      }
    }
  };

  const toggleNewbornCare = (val: string) => {
    if (newbornCare.includes(val)) {
      setNewbornCare(newbornCare.filter((item) => item !== val));
    } else {
      setNewbornCare([...newbornCare, val]);
    }
  };

  const motherOptions = mothers
    .filter((m) => !m.is_dead)
    .map((m) => ({ label: m.name, value: m.id }));

  return (
    <SafeAreaView className="flex-1 pb-5">
      <StatusBar barStyle="dark-content" className="bg-white" />
      <CustomHeader
        title={
          id
            ? t("child_form.edit_child", "Edit Child Monitoring")
            : t("child_form.new_child", "New Child Monitoring")
        }
        onBackPress={() => {
          if (!id && from === "profile" && selectedMotherId) {
            router.replace({
              pathname: "/dashboard/profile",
              params: { id: selectedMotherId }
            } as any);
          } else {
            router.back();
          }
        }}
      />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white px-4 mb-16 py-5">
          {/* Pregnancy Link Card — only shown when redirected from mother profile */}
          {!id && from === "profile" && (
            <View className="mb-5 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <View className="flex-row items-center gap-3 px-5 py-3 bg-slate-50">
                <View className="w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center">
                  <CalendarIcon size={20} color="#0F172A" />
                </View>
                <Text className="text-slate-900 font-semibold text-base">
                  {t("child_form.link_to_pregnancy.title")}
                </Text>
              </View>
              <View className="px-5 py-4">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => setLinkToPregnancy(true)}
                    activeOpacity={0.8}
                    className={`flex-1 rounded-md py-3 items-center justify-center ${linkToPregnancy ? 'bg-slate-900' : 'bg-slate-100'}`}
                  >
                    <Text className={`font-semibold ${linkToPregnancy ? 'text-white' : 'text-slate-900'}`}>
                      {t("child_form.link_to_pregnancy.yes")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLinkToPregnancy(false)}
                    activeOpacity={0.8}
                    className={`flex-1 rounded-md py-3 items-center justify-center ${!linkToPregnancy ? 'bg-slate-900' : 'bg-slate-100'}`}
                  >
                    <Text className={`font-semibold ${!linkToPregnancy ? 'text-white' : 'text-slate-900'}`}>
                      {t("child_form.link_to_pregnancy.no")}
                    </Text>
                  </TouchableOpacity>
                </View>
                 <View className="flex-row items-start gap-3 mt-4">
                  <View className="w-5 h-5 rounded-full bg-slate-200 items-center justify-center mt-1">
                    <Check size={12} color="#0F172A" strokeWidth={3} />
                  </View>
                  <Text className="text-slate-600 text-sm leading-6">
                    {linkToPregnancy
                      ? t("child_form.link_to_pregnancy.linked_description")
                      : t("child_form.link_to_pregnancy.unlinked_description")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Mother Selection */}
          <ProfilePicker
            label={t("child_form.select_mother")}
            placeholder={t("child_form.select_mother_placeholder")}
            options={motherOptions}
            selectedValue={selectedMotherId}
            onValueChange={(val: string) => {
              setSelectedMotherId(val);
              if (errors?.motherId) setErrors({ ...errors, motherId: "" });
            }}
            error={errors?.motherId}
            isSearchable={true}
          />

          {/* Baby Info */}
          <View className="">
            <BoxInput
              label={t("child_form.baby_name")}
              placeholder={t("child_form.baby_name_placeholder")}
              value={babyName}
              onChangeText={(text) => {
                setBabyName(text);
                if (errors.babyName) setErrors({ ...errors, babyName: "" });
              }}
              error={errors.babyName}
            />

            <View className="mb-4">
              <Text className="text-slate-800 text-[16px] mb-1.5 ml-1">
                {t("child_form.date_of_birth")}
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className={`h-14 flex-row items-center rounded-xl px-4 border ${errors.birthDate
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200 bg-white"
                  } justify-between`}
              >
                <View className="flex-row items-center">
                  <CalendarIcon size={18} color="#94a3b8" />
                  <Text
                    className={`text-[16px] ml-3 ${birthDateBs ? "text-slate-800" : "text-slate-400"}`}
                  >
                    {birthDateBs || t("child_form.select_date")}
                  </Text>
                </View>
              </Pressable>
              {errors.birthDate ? (
                <Text className="text-rose-500 text-xs mt-1.5 ml-1 font-medium">
                  {errors.birthDate}
                </Text>
              ) : null}
              <CalendarPicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={(bsDate) => {
                  setShowDatePicker(false);
                  setBirthDateBs(bsDate);
                  setErrors({ ...errors, birthDate: "" });
                  try {
                    const adDate = BsToAd(bsDate);
                    setBirthDateAd(adDate);
                  } catch (e) {
                    console.error("BS to AD conversion error:", e);
                  }
                }}
                language={language === "en" ? "en" : "np"}
                theme="light"
                brandColor="#0056D2"
                date={birthDateBs || undefined}
                dayTextStyle={{ fontWeight: "normal" }}
                weekTextStyle={{ fontWeight: "normal" }}
                titleTextStyle={{ fontWeight: "normal" }}
              />
            </View>

            {/* Suggested Pregnancy Match Selection */}
            {!pregnancyId && suggestedPregnancy && (
              <View className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/40 overflow-hidden">
                <View className="flex-row items-center px-4 py-3 bg-amber-50 border-b border-amber-100">
                  <View className="w-7 h-7 rounded-full bg-amber-100 items-center justify-center mr-2">
                    <CalendarIcon size={14} color="#D97706" />
                  </View>
                  <Text className="font-semibold text-amber-900 text-[15px]">
                    {t("child_form.matching_pregnancy.title")}
                  </Text>
                </View>
                <View className="p-4 bg-white border-b border-amber-50">
                  <Text className="text-slate-600 text-[13px] leading-relaxed">
                    {t("child_form.matching_pregnancy.description", {
                      date: suggestedPregnancy.lmp_date,
                    })}
                  </Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => setLinkToPregnancy(true)}
                    className={`flex-1 py-3 items-center border-r border-amber-100 ${
                      linkToPregnancy ? 'bg-amber-600' : 'bg-white'
                    }`}
                  >
                    <Text className={`font-semibold text-[14px] ${
                      linkToPregnancy ? 'text-white' : 'text-slate-500'
                    }`}>
                      {t("child_form.matching_pregnancy.yes")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLinkToPregnancy(false)}
                    className={`flex-1 py-3 items-center ${
                      !linkToPregnancy ? 'bg-slate-600' : 'bg-white'
                    }`}
                  >
                    <Text className={`font-semibold text-[14px] ${
                      !linkToPregnancy ? 'text-white' : 'text-slate-500'
                    }`}>
                      {t("child_form.matching_pregnancy.no")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Gender Selection */}
            <View className="mb-4">
              <Text className="text-slate-800 text-[16px] mb-3 ml-1">
                {t("child_form.gender")}
              </Text>
              <View className="flex-row gap-x-4">
                {[
                  { value: "Male", label: t("child_form.options.male") },
                  { value: "Female", label: t("child_form.options.female") },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    activeOpacity={0.7}
                    onPress={() => {
                      setGender(opt.value as any);
                      if (errors.gender) setErrors({ ...errors, gender: "" });
                    }}
                    className={`flex-1 flex-row items-center p-4 rounded-xl border ${gender === opt.value ? "bg-primary/5 border-primary" : "bg-white border-slate-200"}`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border items-center justify-center mr-2 ${gender === opt.value ? "border-primary" : "border-slate-300"}`}
                    >
                      {gender === opt.value && (
                        <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </View>
                    <Text
                      className={`text-[16px] font-medium ${gender === opt.value ? "text-primary-800" : "text-slate-800"}`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender ? (
                <Text className="text-rose-500 text-xs mt-1.5 ml-1 font-medium">
                  {errors.gender}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Birth Details */}
          <ProfilePicker
            label={t("child_form.birth_place")}
            placeholder={t("child_form.select_birth_place")}
            options={BIRTH_PLACE_OPTIONS.map((opt) => ({
              label: language === "en" ? opt.en_label : opt.np_label,
              value: opt.value,
            }))}
            selectedValue={birthPlace}
            onValueChange={(val: string) => setBirthPlace(val)}
          />

          <View className="gap-y-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setSkilledBirthAttended(skilledBirthAttended ? 0 : 1)
              }
              className={`flex-row items-center p-4 rounded-xl border ${skilledBirthAttended ? "bg-primary/5 border-primary" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${skilledBirthAttended ? "bg-primary/5 border-primary" : "border-slate-300 bg-white"}`}
              >
                {skilledBirthAttended ? (
                  <Check color="#555" strokeWidth={3} size={15} />
                ) : null}
              </View>
              <Text
                className={`text-[16px] flex-1 ${skilledBirthAttended ? "text-black" : "text-slate-800"}`}
              >
                {t(
                  "child_form.skilled_birth_attended"
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFchvPresent(fchvPresent ? 0 : 1)}
              className={`flex-row items-center p-4 rounded-xl border ${fchvPresent ? "bg-primary/5 border-primary" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${fchvPresent ? "bg-primary/5 border-primary" : "border-slate-300 bg-white"}`}
              >
                {fchvPresent ? (
                  <Check color="#555" strokeWidth={3} size={15} />
                ) : null}
              </View>
              <Text
                className={`text-[16px] flex-1 ${fchvPresent ? "text-black" : "text-slate-800"}`}
              >
                {t(
                  "child_form.fchv_present"
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Child Status */}
          <View className="mt-6">
            <Text className="text-slate-800 text-[16px] mb-3 ml-1">
              {t("child_form.child_status")}
            </Text>
            <View className="flex-row gap-x-4">
              {CHILD_STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => setStatus(opt.value)}
                  className={`flex-1 flex-row items-center p-4 rounded-xl border ${status === opt.value ? "bg-primary/5 border-primary" : "bg-white border-slate-200"}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border items-center justify-center mr-2 ${status === opt.value ? "border-primary" : "border-slate-300"}`}
                  >
                    {status === opt.value && (
                      <View className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text
                    className={`text-[16px] ${status === opt.value ? "text-primary-800" : "text-slate-800"}`}
                  >
                    {language === "en" ? opt.en_label : opt.np_label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Health Indicators */}
          <View className="mt-6">
            <ProfilePicker
              label={t("child_form.baby_weight")}
              placeholder={t("child_form.select_weight")}
              options={BABY_WEIGHT_OPTIONS.map((opt) => ({
                label: opt.label,
                value: opt.value,
              }))}
              selectedValue={babyWeight}
              onValueChange={(val: string) => setBabyWeight(val)}
            />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setAsphyxiatedNewborn(asphyxiatedNewborn ? 0 : 1)
              }
              className={`flex-row items-center p-4 mt-4 rounded-xl border ${asphyxiatedNewborn ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${asphyxiatedNewborn ? "bg-rose-500 border-rose-500" : "border-slate-300 bg-white"}`}
              >
                {asphyxiatedNewborn ? (
                  <Check color="#fff" strokeWidth={3} size={15} />
                ) : null}
              </View>
              <Text
                className={`text-[16px] flex-1 ${asphyxiatedNewborn ? "text-rose-800" : "text-slate-800"}`}
              >
                {t("child_form.asphyxiated_newborn")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Newborn Care Options */}
          <View className="mt-6">
            <Text className="text-slate-800 text-[16px] mb-3 ml-1">
              {t("child_form.newborn_care")}
            </Text>
            <View className="gap-y-3">
              {NEWBORN_CARE_OPTIONS.map((option) => {
                const isSelected = newbornCare.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.7}
                    onPress={() => toggleNewbornCare(option.value)}
                    className={`flex-row items-center p-4 rounded-xl border ${isSelected ? "bg-primary/5 border-primary" : "bg-white border-slate-200"}`}
                  >
                    <View
                      className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${isSelected ? "bg-primary/5 border-primary" : "border-slate-300 bg-white"}`}
                    >
                      {isSelected ? (
                        <Check color="#555" strokeWidth={3} size={15} />
                      ) : null}
                    </View>
                    <Text
                      className={`text-[16px] flex-1 ${isSelected ? "text-black" : "text-slate-800"}`}
                    >
                      {t(`child_form.options.${option.value}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Remarks & Save */}
          <View className="mt-6">
            <TextArea
              label={t("child_form.remarks")}
              placeholder={t("child_form.remarks_placeholder")}
              value={remarks}
              onChangeText={setRemarks}
              numberOfLines={4}
            />

            <Button
              onPress={handleSave}
              isLoading={isLoading}
              title={
                t("child_form.save_record")
              }
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
