import { FieldLabel } from "@/components/FormElements";
import { ProfilePicker } from "@/components/ProfilePicker";
import TextArea from "@/components/TextArea";
import { Button } from "@/components/button";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { createDelivery } from "@/hooks/database/models/DeliveryModel";
import { createInfantMonitoring } from "@/hooks/database/models/InfantMonitoringModel";
import { getAllMothersList, MotherListDbItem } from "@/hooks/database/models/MotherModel";
import { getPregnanciesByMotherId, getPregnantWomenList, updatePregnancy } from "@/hooks/database/models/PregnantWomenModal";
import { BIRTH_PLACE_OPTIONS, CHILD_STATUS_OPTIONS, NEWBORN_CARE_OPTIONS } from "@/utils/data";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { Calendar as CalendarIcon, Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomHeader from "@/components/CustomHeader";

export default function DeliveryRegistrationForm() {
  const { showToast } = useToast();
  const router = useRouter();
  const { t, language } = useLanguage();

  const BABY_WEIGHT_OPTIONS = [
    { label: t("delivery.options.normal", "Normal"), value: "normal" },
    { label: t("delivery.options.low", "Low"), value: "low" },
    { label: t("delivery.options.very_low", "Very Low"), value: "very_low" },
  ];

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [pregnantMotherIds, setPregnantMotherIds] = useState<Set<string>>(new Set());
  const [selectedMotherId, setSelectedMotherId] = useState("");
  const [deliveryDateAd, setDeliveryDateAd] = useState("");
  const [deliveryDateBs, setDeliveryDateBs] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deliveryPlace, setDeliveryPlace] = useState("institution");
  const [babyWeight, setBabyWeight] = useState("normal");
  const [status, setStatus] = useState("alive");
  const [remarks, setRemarks] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");

  const [fchvPresent, setFchvPresent] = useState(0);
  const [skilledBirthAttended, setSkilledBirthAttended] = useState(0);
  const [asphyxiatedNewborn, setAsphyxiatedNewborn] = useState(0);

  const [newbornCare, setNewbornCare] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formKey, setFormKey] = useState(0);

  const [motherPregnancies, setMotherPregnancies] = useState<any[]>([]);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedMotherId) {
      getPregnanciesByMotherId(selectedMotherId)
        .then((res) => {
          setMotherPregnancies(res);
          const active = res.find((p) => p.is_current === 1);
          setPregnancyId(active?.id || null);
        })
        .catch(console.error);
    } else {
      setMotherPregnancies([]);
      setPregnancyId(null);
    }
  }, [selectedMotherId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [motherList, pregnantWomen] = await Promise.all([
          getAllMothersList(),
          getPregnantWomenList(),
        ]);
        setMothers(motherList);
        setPregnantMotherIds(new Set(pregnantWomen.map((p) => p.mother)));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMotherId) e.motherId = t("delivery.validation.mother_required", "Mother is required");
    if (!deliveryDateAd) e.deliveryDate = t("delivery.validation.delivery_date_required", "Delivery date is required");
    if (!gender) e.gender = t("delivery.validation.gender_required", "Gender is required");
    return e;
  };

  const resetForm = () => {
    setSelectedMotherId("");
    setDeliveryDateAd("");
    setDeliveryDateBs("");
    setDeliveryPlace("institution");
    setBabyWeight("normal");
    setStatus("alive");
    setRemarks("");
    setGender("");
    setFchvPresent(0);
    setSkilledBirthAttended(0);
    setAsphyxiatedNewborn(0);
    setNewbornCare([]);
    setErrors({});
    setMotherPregnancies([]);
    setPregnancyId(null);
    setFormKey((k) => k + 1);
  };

  const handleSave = async () => {
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      return;
    }

    setIsLoading(true);
    try {
      const deliveryId = Crypto.randomUUID();
        const payload = {
        id: deliveryId,
        mother: selectedMotherId,
        delivery_date: deliveryDateBs,
        delivery_place: deliveryPlace,
        fchv_present: fchvPresent,
        skilled_birth_attended: skilledBirthAttended,
        baby_weight: babyWeight,
        umbilical_ointment: newbornCare.includes("umbilical_ointment") ? 1 : 0,
        skin_to_skin: newbornCare.includes("skin_to_skin") ? 1 : 0,
        early_breastfeeding: newbornCare.includes("early_breastfeeding") ? 1 : 0,
        asphyxiated_newborn: asphyxiatedNewborn,
        status: status,
        gender: gender || undefined,
        remarks: remarks,
        pregnancy_id: pregnancyId || null,
      } as any;

      // Save to delivery table
      await createDelivery(payload);

      // Also save to child_monitoring table
      const infantPayload = {
        id: deliveryId,
        mother: selectedMotherId,
        date_of_birth: deliveryDateBs,
        birth_place: deliveryPlace,
        fchv_present: fchvPresent,
        skilled_birth_attended: skilledBirthAttended,
        baby_weight: babyWeight,
        umbilical_ointment: newbornCare.includes("umbilical_ointment") ? 1 : 0,
        skin_to_skin: newbornCare.includes("skin_to_skin") ? 1 : 0,
        early_breastfeeding: newbornCare.includes("early_breastfeeding") ? 1 : 0,
        asphyxiated_newborn: asphyxiatedNewborn,
        status: status,
        gender: gender || undefined,
        remarks: remarks,
        pregnancy_id: pregnancyId || null,
        registration_source: pregnancyId ? "PREGNANCY" : "DIRECT_CHILD_REGISTRATION",
      } as any;
      await createInfantMonitoring(infantPayload);

      // Deactivate pregnancy and mark as delivered
      if (pregnancyId) {
        try {
          await updatePregnancy(pregnancyId, { is_current: false, delivered: true });
        } catch (e) {
          console.error("Failed to deactivate pregnancy:", e);
        }
      }

      showToast(t("delivery.messages.save_success", "Delivery registered successfully"));
      resetForm();
    } catch (error) {
      console.error(error);
      showToast(t("delivery.messages.save_failed", "Failed to register delivery."));
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

  const motherOptions = mothers
    .filter((m) => !m.is_dead)
    .filter((m) => pregnantMotherIds.has(m.id))
    .map((m) => ({ label: m.name, value: m.id }));

  return (
    <SafeAreaView className="flex-1 pb-16 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader
        title={t("delivery.title", "Delivery Registration")}
        onBackPress={() => router.back()}
      />
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        enableOnAndroid
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-6 pb-10 gap-y-5">
          {/* Mother */}
          <View className="gap-y-1.5">
            <FieldLabel
              label={t("delivery.select_mother", "Mother")}
              required
            />
            <ProfilePicker
              placeholder={t("delivery.select_mother_placeholder", "Choose Mother")}
              options={motherOptions}
              selectedValue={selectedMotherId}
              onValueChange={(val: string) => {
                setSelectedMotherId(val);
                if (errors.motherId) setErrors({ ...errors, motherId: "" });
              }}
              error={errors.motherId}
              isSearchable
            />
          </View>

          {/* Delivery Date */}
          <View className="gap-y-1.5 -mt-5">
            <FieldLabel
              label={t("delivery.delivery_date")}
              required
            />
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className={`h-14 flex-row items-center rounded-xl px-4 border ${errors.deliveryDate ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"}`}
            >
              <CalendarIcon size={18} color="#94a3b8" />
              <Text className={`text-[16px] ml-3 flex-1 ${deliveryDateBs ? "text-slate-800" : "text-slate-400"}`}>
                {deliveryDateBs || t("delivery.select_date", "Select Date")}
              </Text>
            </Pressable>
            {errors.deliveryDate ? (
              <Text className="text-rose-500 text-xs mt-0.5 ml-1 font-medium">{errors.deliveryDate}</Text>
            ) : null}

            <CalendarPicker
              visible={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onDateSelect={(bsDate) => {
                setShowDatePicker(false);
                setDeliveryDateBs(bsDate);
                setErrors({ ...errors, deliveryDate: "" });
                try {
                  setDeliveryDateAd(BsToAd(bsDate));
                } catch (e) {}
              }}
              language={language === "en" ? "en" : "np"}
              theme="light"
              brandColor="#2563eb"
              date={deliveryDateBs || undefined}
              dayTextStyle={{ fontWeight: "normal" }}
              weekTextStyle={{ fontWeight: "normal" }}
              titleTextStyle={{ fontWeight: "normal" }}
            />
          </View>

          {/* Gender */}
          <View className="gap-y-1.5">
            <FieldLabel
              label={t("delivery.gender")}
              required
            />
            <View className="flex-row gap-x-3">
              {[
                { value: "Male", label: t("delivery.options.male", "Male") },
                { value: "Female", label: t("delivery.options.female", "Female") },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setGender(opt.value as any);
                    if (errors.gender) setErrors({ ...errors, gender: "" });
                  }}
                  className={`flex-1 flex-row items-center p-4 rounded-xl border ${gender === opt.value ? "bg-blue-50/70 border-blue-200" : "bg-white border-slate-200"}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2.5 ${gender === opt.value ? "border-blue-500" : "border-slate-300"}`}
                  >
                    {gender === opt.value && (
                      <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                  </View>
                  <Text className={`text-[15px] font-medium ${gender === opt.value ? "text-blue-700" : "text-slate-700"}`}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.gender ? (
              <Text className="text-rose-500 text-xs mt-0.5 ml-1 font-medium">{errors.gender}</Text>
            ) : null}
          </View>

          {/* Delivery Place */}
          <View className="gap-y-1.5">
            <FieldLabel label={t("delivery.birth_place", "Delivery Place")} />
            <ProfilePicker
              placeholder={t("delivery.select_birth_place", "Select Delivery Place")}
              options={BIRTH_PLACE_OPTIONS.map((opt) => ({
                label: language === "en" ? opt.en_label : opt.np_label,
                value: opt.value,
              }))}
              selectedValue={deliveryPlace}
              onValueChange={(val: string) => setDeliveryPlace(val)}
            />
          </View>

          {/* Indicators */}
          <View className="gap-y-3">
            <TouchableOpacity
              onPress={() => setSkilledBirthAttended(skilledBirthAttended ? 0 : 1)}
              className={`flex-row items-center p-4 rounded-xl border ${skilledBirthAttended ? "bg-blue-50/70 border-blue-200" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 mr-3.5 items-center justify-center ${skilledBirthAttended ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"}`}
              >
                {skilledBirthAttended ? <Check color="#fff" strokeWidth={3} size={15} /> : null}
              </View>
              <Text className={`text-[15px] flex-1 ${skilledBirthAttended ? "text-slate-800 font-semibold" : "text-slate-600"}`}>
                {t("delivery.skilled_birth_attended", "Skilled birth attendant present")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFchvPresent(fchvPresent ? 0 : 1)}
              className={`flex-row items-center p-4 rounded-xl border ${fchvPresent ? "bg-blue-50/70 border-blue-200" : "bg-white border-slate-200"}`}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 mr-3.5 items-center justify-center ${fchvPresent ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"}`}
              >
                {fchvPresent ? <Check color="#fff" strokeWidth={3} size={15} /> : null}
              </View>
              <Text className={`text-[15px] flex-1 ${fchvPresent ? "text-slate-800 font-semibold" : "text-slate-600"}`}>
                {t("delivery.fchv_present", "FCHV present at delivery")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Child Status */}
          <View className="gap-y-1.5">
            <FieldLabel label={t("delivery.child_status", "Child Status")} />
            <View className="flex-row gap-x-3">
              {CHILD_STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setStatus(opt.value)}
                  className={`flex-1 flex-row items-center p-4 rounded-xl border ${status === opt.value ? "bg-blue-50/70 border-blue-200" : "bg-white border-slate-200"}`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2.5 ${status === opt.value ? "border-blue-500" : "border-slate-300"}`}
                  >
                    {status === opt.value && (
                      <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    )}
                  </View>
                  <Text className={`text-[15px] ${status === opt.value ? "text-blue-700 font-medium" : "text-slate-600"}`}>
                    {language === "en" ? opt.en_label : opt.np_label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Baby Weight */}
          <View className="gap-y-1.5">
            <FieldLabel label={t("delivery.baby_weight", "Baby Weight")} />
            <ProfilePicker
              placeholder={t("delivery.select_weight", "Select Weight")}
              options={BABY_WEIGHT_OPTIONS}
              selectedValue={babyWeight}
              onValueChange={(val: string) => setBabyWeight(val)}
            />
          </View>

          {/* Asphyxiated */}
          <TouchableOpacity
            onPress={() => setAsphyxiatedNewborn(asphyxiatedNewborn ? 0 : 1)}
            className={`flex-row items-center p-4 rounded-xl border ${asphyxiatedNewborn ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200"}`}
          >
            <View
              className={`w-6 h-6 rounded-md border-2 mr-3.5 items-center justify-center ${asphyxiatedNewborn ? "bg-rose-500 border-rose-500" : "border-slate-300 bg-white"}`}
            >
              {asphyxiatedNewborn ? <Check color="#fff" strokeWidth={3} size={15} /> : null}
            </View>
            <Text className={`text-[15px] flex-1 ${asphyxiatedNewborn ? "text-rose-800 font-semibold" : "text-slate-600"}`}>
              {t("delivery.asphyxiated_newborn", "Asphyxiated newborn")}
            </Text>
          </TouchableOpacity>

          {/* Newborn Care */}
          <View className="gap-y-1.5">
            <FieldLabel label={t("delivery.newborn_care", "Newborn Care Practices")} />
            <View className="gap-y-2">
              {NEWBORN_CARE_OPTIONS.map((option) => {
                const isSelected = newbornCare.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleNewbornCare(option.value)}
                    className={`flex-row items-center p-4 rounded-xl border ${isSelected ? "bg-blue-50/70 border-blue-200" : "bg-white border-slate-200"}`}
                  >
                    <View
                      className={`w-6 h-6 rounded-md border-2 mr-3.5 items-center justify-center ${isSelected ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"}`}
                    >
                      {isSelected ? <Check color="#fff" strokeWidth={3} size={15} /> : null}
                    </View>
                    <Text className={`text-[15px] flex-1 ${isSelected ? "text-slate-800 font-semibold" : "text-slate-600"}`}>
                      {language === "en" ? option.en_label : option.np_label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Remarks */}
          <TextArea
            label={t("delivery.remarks", "Remarks")}
            placeholder={t("delivery.remarks_placeholder", "Write here...")}
            value={remarks}
            onChangeText={setRemarks}
            numberOfLines={4}
          />

          {/* Save */}
          <Button
            onPress={handleSave}
            isLoading={isLoading}
            title={t("delivery.save", "Register Delivery")}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
