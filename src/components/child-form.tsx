import CustomHeader from "@/components/CustomHeader";
import { BoxInput } from "@/components/FormElements";
import { ProfilePicker } from "@/components/ProfilePicker";
import TextArea from "@/components/TextArea";
import { useToast } from "@/context/ToastContext";
import {
  createInfantMonitoring,
  getAllInfantMonitorings,
} from "@/hooks/database/models/InfantMonitoringModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "@/hooks/database/models/MotherModel";
import {
  BIRTH_PLACE_OPTIONS,
  CHILD_STATUS_OPTIONS,
  NEWBORN_CARE_OPTIONS,
} from "@/utils/data";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar as CalendarIcon, Save } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChildRegistrationForm() {
  const { id, motherId, from } = useLocalSearchParams<{ id: string; motherId?: string; from?: string }>();
  const { showToast } = useToast();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const BABY_WEIGHT_OPTIONS = [
    {
      label_en: "Normal Weight",
      label_np: "सामान्य तौल",
      value: "normal",
    },
    {
      label_en: "Low Weight",
      label_np: "कम तौल",
      value: "low",
    },
    {
      label_en: "Very Low Weight",
      label_np: "धेरै कम तौल",
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

  // Indicators (0 or 1)
  const [fchvPresent, setFchvPresent] = useState(0);
  const [skilledBirthAttended, setSkilledBirthAttended] = useState(0);
  const [asphyxiatedNewborn, setAsphyxiatedNewborn] = useState(0);

  // Newborn care is a comma-separated string based on NEWBORN_CARE_OPTIONS
  const [newbornCare, setNewbornCare] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const motherList = await getAllMothersList();
        setMothers(motherList);

        if (id) {
          const all = await getAllInfantMonitorings();
          const infant = all.find((i) => i.id === id);
          if (infant) {
            setSelectedMotherId(infant.mother_id || "");
            setBabyName(infant.baby_name || "");
            setBirthPlace(infant.birth_place || "institution");
            setBabyWeight(infant.baby_weight || "normal");
            setRemarks(infant.remarks || "");
            setFchvPresent(infant.fchv_present || 0);
            setSkilledBirthAttended(infant.skilled_birth_attended || 0);
            setAsphyxiatedNewborn(infant.asphyxiated_newborn || 0);
            setStatus(infant.status || "alive");
            setAllGiven(infant.is_all_given || 0);

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
    if (!babyName.trim())
      e.babyName = t("child_form.validation.baby_name_required", "Baby name is required");
    if (!birthDateAd)
      e.birthDate = t("child_form.validation.birth_date_required", "Birth date is required");
    return e;
  };

  const handleSave = async () => {
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      Alert.alert(
        t("child_form.validation.error", "Error"),
        t("child_form.validation.fill_fields", "Please fill all required fields"),
      );
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        id: id || Crypto.randomUUID(),
        mother_id: selectedMotherId,
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
        remarks: remarks,
      };

      await createInfantMonitoring(payload);
      showToast(t("child_form.messages.save_success", "Record saved successfully"));
      if (from === "profile" && selectedMotherId) {
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

  const motherOptions = mothers.map((m) => ({ label: m.name, value: m.id }));

  return (
    <SafeAreaView className="flex-1 pb-7">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={
          id
            ? t("child_profile.child_form.edit_child", "Edit Child Monitoring")
            : t("child_profile.child_form.new_child", "New Child Monitoring")
        }
        onBackPress={() => {
          if (from === "profile" && selectedMotherId) {
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
          {/* Mother Selection */}
          <ProfilePicker
            label={t("child_form.select_mother", "आमा छनौट गर्नुहोस्")}
            placeholder={t("child_form.select_mother_placeholder", "Select Mother")}
            options={motherOptions}
            selectedValue={selectedMotherId}
            onValueChange={(val: string) => {
              setSelectedMotherId(val);
              if (errors.motherId) setErrors({ ...errors, motherId: "" });
            }}
            error={errors.motherId}
            isSearchable={true}
          />

          {/* Baby Info */}
          <View className="">
            <BoxInput
              label={t("child_form.baby_name", "शिशुको नाम")}
              placeholder={t("child_form.baby_name_placeholder", "Baby Name")}
              value={babyName}
              onChangeText={(text) => {
                setBabyName(text);
                if (errors.babyName) setErrors({ ...errors, babyName: "" });
              }}
              error={errors.babyName}
            />

            <View className="mb-4">
              <Text className="text-slate-800 text-[16px] mb-1.5 ml-1">
                {t("child_form.date_of_birth", "जन्म मिति (B.S.)")}
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
                    {birthDateBs || t("child_form.select_date", "मिति छान्नुहोस्")}
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
                language={i18n.language === "en" ? "en" : "np"}
                theme="light"
                brandColor="#0056D2"
                date={birthDateBs || undefined}
                dayTextStyle={{ fontWeight: "normal" }}
                weekTextStyle={{ fontWeight: "normal" }}
                titleTextStyle={{ fontWeight: "normal" }}
              />
            </View>
          </View>

          {/* Birth Details */}
          <ProfilePicker
            label={t("child_form.birth_place", "शिशु जन्म स्थान")}
            placeholder={t("child_form.select_birth_place", "Select Birth Place")}
            options={BIRTH_PLACE_OPTIONS.map((opt) => ({
              label: isEn ? opt.en_label : opt.np_label,
              value: opt.value,
            }))}
            selectedValue={birthPlace}
            onValueChange={(val: string) => setBirthPlace(val)}
          />

          <View className="mt-4 gap-y-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setSkilledBirthAttended(skilledBirthAttended ? 0 : 1)
              }
              className={`flex-row items-center p-4 rounded-xl border ${skilledBirthAttended ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${skilledBirthAttended ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}
              >
                {skilledBirthAttended ? (
                  <Text className="text-white text-xs">✔</Text>
                ) : null}
              </View>
              <Text
                className={`text-[16px] flex-1 ${skilledBirthAttended ? "text-emerald-800" : "text-slate-800"}`}
              >
                {t(
                  "child_form.skilled_birth_attended",
                  "दक्ष स्वास्थ्यकर्मीद्वारा प्रसूति गराएको",
                )}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFchvPresent(fchvPresent ? 0 : 1)}
              className={`flex-row items-center p-4 rounded-xl border ${fchvPresent ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${fchvPresent ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}
              >
                {fchvPresent ? (
                  <Text className="text-white text-xs">✔</Text>
                ) : null}
              </View>
              <Text
                className={`text-[16px] flex-1 ${fchvPresent ? "text-emerald-800" : "text-slate-800"}`}
              >
                {t(
                  "child_form.fchv_present",
                  "महिला स्वास्थ्य स्वयंसेविका उपस्थित भएको",
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Child Status */}
          <View className="mt-6">
            <Text className="text-slate-800 text-[16px] mb-3 ml-1">
              {t("child_form.child_status", "शिशुको अवस्था (Status)")}
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
                      <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </View>
                  <Text
                    className={`text-[16px] ${status === opt.value ? "text-primary-800" : "text-slate-800"}`}
                  >
                    {isEn ? opt.en_label : opt.np_label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Health Indicators */}
          <View className="mt-6">
            <ProfilePicker
              label={t("child_form.baby_weight", "शिशुको तौल")}
              placeholder={t("child_form.select_weight", "Select Weight")}
              options={BABY_WEIGHT_OPTIONS.map((opt) => ({
                label: isEn ? opt.label_en : opt.label_np,
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
                  <Text className="text-white text-xs">✔</Text>
                ) : null}
              </View>
              <Text
                className={`text-[16px] flex-1 ${asphyxiatedNewborn ? "text-rose-800" : "text-slate-800"}`}
              >
                {t("child_profile.child_form.asphyxiated_newborn", "निसासिएको शिशु (Asphyxiated)")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Newborn Care Options */}
          <View className="mt-6">
            <Text className="text-slate-800 text-[16px] mb-3 ml-1">
              {t("child_form.newborn_care", "नवजात शिशु स्याहार")}
            </Text>
            <View className="gap-y-3">
              {NEWBORN_CARE_OPTIONS.map((option) => {
                const isSelected = newbornCare.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.7}
                    onPress={() => toggleNewbornCare(option.value)}
                    className={`flex-row items-center p-4 rounded-xl border ${isSelected ? "bg-emerald-50 border-emerald-300" : "bg-white border-slate-200"}`}
                  >
                    <View
                      className={`w-6 h-6 rounded-md border mr-3 items-center justify-center ${isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-white"}`}
                    >
                      {isSelected ? (
                        <Text className="text-white text-xs">✔</Text>
                      ) : null}
                    </View>
                    <Text
                      className={`text-[16px] flex-1 ${isSelected ? "text-emerald-800" : "text-slate-800"}`}
                    >
                      {isEn ? option.en_label : option.np_label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Remarks & Save */}
          <View className="mt-6">
            <TextArea
              label={t("child_profile.child_form.remarks")}
              placeholder={t("child_profile.child_form.remarks_placeholder")}
              value={remarks}
              onChangeText={setRemarks}
              numberOfLines={4}
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className={`h-14 mt-6 mb-5 items-center justify-center rounded-xl flex-row ${isLoading ? "bg-primary" : "bg-primary/80"}`}
            >
              <Save size={22} color="white" />
              <Text className="text-white font-medium text-lg ml-2">
                {isLoading
                  ? t("child_profile.child_form.saving")
                  : t("child_profile.child_form.save_record")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
