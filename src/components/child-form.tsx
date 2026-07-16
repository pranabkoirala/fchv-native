import CustomHeader from "@/components/CustomHeader";
import { BoxInput } from "@/components/FormElements";
import { ProfilePicker } from "@/components/ProfilePicker";
import TextArea from "@/components/TextArea";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { createDelivery } from "@/hooks/database/models/DeliveryModel";
import {
  createInfantMonitoring,
  getAllInfantMonitorings,
} from "@/hooks/database/models/InfantMonitoringModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "@/hooks/database/models/MotherModel";
import { createNewbornDeath } from "@/hooks/database/models/NewbornDeathModel";
import {
  getPregnanciesByMotherId,
  updatePregnancy,
} from "@/hooks/database/models/PregnantWomenModal";

import { PregnancyStoreType } from "@/hooks/database/types/pregnancyModal";
import {
  BIRTH_PLACE_OPTIONS,
  NEWBORN_CARE_OPTIONS,
  NEWBORN_GENDER_OPTIONS,
  NEWBORN_STATUS_OPTIONS,
} from "@/utils/data";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar as CalendarIcon, Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "./button";

type SelectRowProps = {
  selected: boolean;
  onPress: () => void;
  label: string;
  variant?: "primary" | "rose";
  shape?: "box" | "circle";
};

const SelectRow = ({
  selected,
  onPress,
  label,
  variant = "primary",
  shape = "box",
}: SelectRowProps) => {
  const containerSelected =
    variant === "rose"
      ? "bg-rose-50 border-rose-300"
      : "bg-primary/5 border-primary";
  const boxSelected =
    variant === "rose"
      ? "bg-rose-500 border-rose-500"
      : "bg-primary/5 border-primary";
  const checkColor = variant === "rose" ? "#fff" : "#555";
  const textSelected =
    variant === "rose"
      ? "text-rose-800"
      : shape === "circle"
        ? "text-primary-800"
        : "text-black";
  const boxShape =
    shape === "circle" ? "rounded-full w-5 h-5" : "rounded-md w-6 h-6";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`flex-1 flex-row items-center p-4 rounded-xl border ${selected ? containerSelected : "bg-white border-slate-200"}`}
    >
      <View
        className={`${boxShape} border mr-3 items-center justify-center ${selected ? boxSelected : "border-slate-300 bg-white"}`}
      >
        {selected &&
          (shape === "circle" ? (
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          ) : (
            <Check color={checkColor} strokeWidth={3} size={15} />
          ))}
      </View>
      <View className="">
        <Text
          className={`text-[16px]${selected ? textSelected : "text-slate-800"}`}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ChildRegistrationForm() {
  const { id, motherId, pregnancyId, from } = useLocalSearchParams<{
    id: string;
    motherId?: string;
    pregnancyId?: string;
    from?: string;
  }>();
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

  // Pregnancy linking: default YES when pregnancyId is passed in or from profile
  const [linkToPregnancy, setLinkToPregnancy] = useState(
    !!pregnancyId || from === "profile",
  );

  // Suggestion states
  const [motherPregnancies, setMotherPregnancies] = useState<
    PregnancyStoreType[]
  >([]);
  const [suggestedPregnancy, setSuggestedPregnancy] =
    useState<PregnancyStoreType | null>(null);
  const [hasCurrentPregnancy, setHasCurrentPregnancy] = useState(false);

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

  // Check if selected mother has a current (active) pregnancy
  useEffect(() => {
    const hasCurrent = motherPregnancies.some((p) => p.is_current === 1);
    setHasCurrentPregnancy(hasCurrent);
    if (!pregnancyId && from !== "profile") {
      setLinkToPregnancy(hasCurrent);
    }
  }, [motherPregnancies, pregnancyId, from]);

  // Pregnancy matching logic based on child DOB (birthDateAd)
  useEffect(() => {
    if (!pregnancyId && birthDateAd && motherPregnancies.length > 0) {
      const childDob = new Date(birthDateAd);
      if (isNaN(childDob.getTime())) return;

      // Find a pregnancy whose EDD is within 45 days of child's DOB
      const match = motherPregnancies.find((p) => {
        if (!p.expected_delivery_date) return false;
        try {
          let eddAd = p.expected_delivery_date;
          const year = parseInt(eddAd.split("-")[0], 10);
          if (year >= 2070) {
            eddAd = BsToAd(eddAd);
          }
          const edd = new Date(eddAd);
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
              const storedDate = infant.date_of_birth;
              const storedYear = parseInt(storedDate.split("-")[0], 10);
              const isBs = !isNaN(storedYear) && storedYear >= 2070;
              try {
                if (isBs) {
                  setBirthDateBs(storedDate);
                  setBirthDateAd(BsToAd(storedDate));
                } else {
                  const bsDate = AdToBs(storedDate);
                  setBirthDateBs(bsDate);
                  setBirthDateAd(storedDate);
                }
              } catch (e) {
                setBirthDateBs(storedDate);
              }
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
      e.motherId = t(
        "child_form.validation.mother_required",
        "Mother is required",
      );
    if (!birthDateAd)
      e.birthDate = t(
        "child_form.validation.birth_date_required",
        "Birth date is required",
      );
    if (!gender)
      e.gender = t(
        "child_form.validation.gender_required",
        "Gender is required",
      );
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
      const activePregnancyObj =
        motherPregnancies.find((p) => p.is_current === 1) || null;
      const targetPregnancyId =
        pregnancyId || activePregnancyObj?.id || suggestedPregnancy?.id;
      const linkedPregId =
        linkToPregnancy && targetPregnancyId ? targetPregnancyId : null;
      const childId = id || Crypto.randomUUID();

      const care = {
        umbilical_ointment: newbornCare.includes("umbilical_ointment") ? 1 : 0,
        skin_to_skin: newbornCare.includes("skin_to_skin") ? 1 : 0,
        early_breastfeeding: newbornCare.includes("early_breastfeeding")
          ? 1
          : 0,
      };

      const payload = {
        id: childId,
        mother: selectedMotherId,
        baby_name: babyName,
        date_of_birth: birthDateBs,
        birth_place: birthPlace,
        fchv_present: fchvPresent,
        skilled_birth_attended: skilledBirthAttended,
        baby_weight: babyWeight,
        ...care,
        asphyxiated_newborn: asphyxiatedNewborn,
        status: status,
        is_all_given: allGiven,
        gender: gender || undefined,
        remarks: remarks,
        pregnancy_id: linkedPregId,
        registration_source: (linkedPregId
          ? "PREGNANCY"
          : "DIRECT_CHILD_REGISTRATION") as
          "PREGNANCY" | "DIRECT_CHILD_REGISTRATION",
      };
      const savedChild = await createInfantMonitoring(payload);
      const savedChildId = savedChild.id || childId;

      // Create delivery record if child was born from a pregnancy
      if (linkedPregId) {
        try {
          const deliveryPayload = {
            id: Crypto.randomUUID(),
            mother: selectedMotherId,
            delivery_date: birthDateBs,
            delivery_place: birthPlace,
            baby_weight: babyWeight,
            gender: gender || undefined,
            status: status,
            fchv_present: fchvPresent,
            skilled_birth_attended: skilledBirthAttended,
            asphyxiated_newborn: asphyxiatedNewborn,
            ...care,
            remarks: remarks,
            pregnancy_id: linkedPregId,
          };
          await createDelivery(deliveryPayload);
        } catch (e) {
          console.error("Failed to create delivery record:", e);
        }

        // Deactivate current pregnancy and mark as delivered
        try {
          await updatePregnancy(linkedPregId, {
            is_current: false,
            delivered: true,
          });
        } catch (e) {
          console.error("Failed to deactivate pregnancy:", e);
        }
      }

      // If child is dead, also record in hmis_newborn_death table
      if (status === "dead") {
        try {
          const motherObj = mothers.find((m) => m.id === selectedMotherId);
          const motherName = motherObj?.name || "";
          const [birthYear, birthMonth, birthDay] = birthDateBs
            .split("-")
            .map(Number);

          const deathPlaceMap: Record<string, string> = {
            home: "Home",
            institution: "Institution",
          };

          const birthConditionMap: Record<string, string> = {
            normal: "Normal",
            low: "LowWeight",
            very_low: "LowWeight",
          };

          await createNewbornDeath({
            child_id: savedChildId,
            mother: selectedMotherId,
            mother_name: motherName,
            baby_name: babyName,
            birth_day: birthDay,
            birth_month: birthMonth,
            birth_year: birthYear,
            death_day: birthDay,
            death_month: birthMonth,
            death_year: birthYear,
            death_age_days: 0,
            death_age_unit: "days",
            birth_condition: birthConditionMap[babyWeight] || "Normal",
            death_place: deathPlaceMap[birthPlace] || "",
            gender: gender || undefined,
            remarks: remarks,
          });
        } catch (e) {
          console.error("Failed to create newborn death record:", e);
        }
      }

      showToast(
        t("child_form.messages.save_success", "Record saved successfully"),
      );
      resetForm();

      if (id) {
        router.replace({
          pathname: "/dashboard/child/child-profile",
          params: { id: childId },
        } as any);
      } else {
        router.replace({
          pathname: "/dashboard/visit",
          params: { motherId: selectedMotherId, visitType: "PNC", childId },
        } as any);
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

  const toggleNewbornCare = (val: string) => {
    if (newbornCare.includes(val)) {
      setNewbornCare(newbornCare.filter((item) => item !== val));
    } else {
      setNewbornCare([...newbornCare, val]);
    }
  };

  const resetForm = () => {
    setSelectedMotherId("");
    setBabyName("");
    setBirthDateAd("");
    setBirthDateBs("");
    setBirthPlace("institution");
    setBabyWeight("normal");
    setStatus("alive");
    setRemarks("");
    setAllGiven(0);
    setGender("");
    setFchvPresent(0);
    setSkilledBirthAttended(0);
    setAsphyxiatedNewborn(0);
    setNewbornCare([]);
    setErrors({});
    setMotherPregnancies([]);
    setSuggestedPregnancy(null);
    setHasCurrentPregnancy(false);
  };

  const motherOptions = mothers
    .filter((m) => !m.is_dead)
    .map((m) => ({ label: m.name, value: m.id }));

  return (
    <SafeAreaView className="flex-1 pb-5 bg-white">
      <StatusBar
        barStyle="dark-content"
        className="bg-white"
        backgroundColor="#fff"
      />
      <CustomHeader
        title={id ? t("child_form.edit_child") : t("child_form.new_child")}
        onBackPress={() => {
          if (!id && from === "profile" && selectedMotherId) {
            router.replace({
              pathname: "/dashboard/profile",
              params: { id: selectedMotherId },
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
          {/* Pregnancy Link Card — shown when redirected from profile or mother has current pregnancy */}
          {!id && hasCurrentPregnancy && (
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
                    className={`flex-1 rounded-md py-3 items-center justify-center ${linkToPregnancy ? "bg-slate-900" : "bg-slate-100"}`}
                  >
                    <Text
                      className={`font-semibold ${linkToPregnancy ? "text-white" : "text-slate-900"}`}
                    >
                      {t("child_form.link_to_pregnancy.yes")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setLinkToPregnancy(false)}
                    activeOpacity={0.8}
                    className={`flex-1 rounded-md py-3 items-center justify-center ${!linkToPregnancy ? "bg-slate-900" : "bg-slate-100"}`}
                  >
                    <Text
                      className={`font-semibold ${!linkToPregnancy ? "text-white" : "text-slate-900"}`}
                    >
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
            required={true}
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
                <Text className="text-red-500"> *</Text>
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className={`h-14 flex-row items-center rounded-xl px-4 border ${
                  errors.birthDate
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

            {/* Gender Selection */}
            <View className="mb-4">
              <Text className="text-slate-800 text-[16px] mb-3 ml-1">
                {t("child_form.gender")}
                <Text className="text-red-500"> *</Text>
              </Text>
              <View className="flex-row gap-x-4">
                {NEWBORN_GENDER_OPTIONS.map((opt) => (
                  <SelectRow
                    key={opt.value}
                    selected={gender === opt.value}
                    onPress={() => {
                      setGender(opt.value as any);
                      if (errors.gender) setErrors({ ...errors, gender: "" });
                    }}
                    label={language === "np" ? opt.label_ne : opt.label_en}
                    shape="circle"
                  />
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

          {/* Child Status */}
          <View className="mb-7">
            <Text className="text-slate-800 text-[16px] mb-3 ml-1">
              {t("child_form.child_status")}
            </Text>
            <View className="flex-row gap-x-4">
              {NEWBORN_STATUS_OPTIONS.map((opt) => (
                <SelectRow
                  key={opt.value}
                  selected={status === opt.value}
                  onPress={() => setStatus(opt.value)}
                  label={language === "np" ? opt.label_ne : opt.label_en}
                  shape="circle"
                />
              ))}
            </View>
          </View>

          {status !== "dead" && (
            <>
              {/* Indicators */}
              <View className="gap-y-3">
                <SelectRow
                  selected={!!skilledBirthAttended}
                  onPress={() =>
                    setSkilledBirthAttended(skilledBirthAttended ? 0 : 1)
                  }
                  label={t("child_form.skilled_birth_attended")}
                />
                <SelectRow
                  selected={!!fchvPresent}
                  onPress={() => setFchvPresent(fchvPresent ? 0 : 1)}
                  label={t("child_form.fchv_present")}
                />
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

                <SelectRow
                  selected={!!asphyxiatedNewborn}
                  onPress={() =>
                    setAsphyxiatedNewborn(asphyxiatedNewborn ? 0 : 1)
                  }
                  label={t("child_form.asphyxiated_newborn")}
                  variant="rose"
                />
              </View>

              {/* Newborn Care Options */}
              <View className="mt-6">
                <Text className="text-slate-800 text-[16px] mb-3 ml-1">
                  {t("child_form.newborn_care")}
                </Text>
                <View className="gap-y-3">
                  {NEWBORN_CARE_OPTIONS.map((option) => (
                    <SelectRow
                      key={option.value}
                      selected={newbornCare.includes(option.value)}
                      onPress={() => toggleNewbornCare(option.value)}
                      label={t(`child_form.options.${option.value}`)}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
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
              title={t("child_form.save_record")}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
