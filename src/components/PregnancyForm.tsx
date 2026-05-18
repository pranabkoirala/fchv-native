import React, { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Calendar } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { CalendarPicker, BsToAd } from "react-native-nepali-picker";
import { getAllMothersList, getMotherProfile, MotherListDbItem } from "../hooks/database/models/MotherModel";
import { createPregnancy, getPregnancyByMotherId } from "../hooks/database/models/PregnantWomenModal";
import { useToast } from "../context/ToastContext";
import { FieldLabel, BoxInput, SelectInput } from "./FormElements";
import { ProfilePicker } from "./ProfilePicker";
import { Button } from "./button";
import { useLanguage } from "../context/LanguageContext";

const RISK_OPTIONS = [
  { value: "normal", en: "Normal", np: "सामान्य" },
  { value: "moderate", en: "Moderate", np: "मध्यम" },
  { value: "high", en: "High", np: "उच्च जोखिम" },
];

export default function PregnancyForm({ id }: { id?: string, onSwitchToMother?: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState<string>(id || "");
  const [gravida, setGravida] = useState("");
  const [parity, setParity] = useState("");
  const [lmp, setLmp] = useState("");
  const [edd, setEdd] = useState("");
  const [caretakersName, setCaretakersName] = useState("");
  const [caretakersPhone, setCaretakersPhone] = useState("");
  const [riskLevel, setRiskLevel] = useState<"normal" | "moderate" | "high">("normal");
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [selectedMotherName, setSelectedMotherName] = useState("");

  const [showLmpPicker, setShowLmpPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const fetchMothers = async () => {
      try {
        const list = await getAllMothersList();
        setMothers(list);
      } catch (err) {
        console.error("Error fetching mothers:", err);
      }
    };
    fetchMothers();
  }, []);

  useEffect(() => {
    if (selectedMotherId) {
      const fetchData = async () => {
        try {
          setIsLoading(true);
          // Clear previous data before loading new mother's data
          setGravida("");
          setParity("");
          setLmp("");
          setEdd("");
          setCaretakersName("");
          setCaretakersPhone("");
          setRiskLevel("normal");
          setPregnancyId(null);

          // Try to load existing pregnancy for this mother
          const pregnancy = await getPregnancyByMotherId(selectedMotherId);
          
          // Also get mother name for display
          const motherData = await getMotherProfile(selectedMotherId);

          if (motherData) {
            setSelectedMotherName(motherData.name || "");
            if (!pregnancy) {
              if (motherData.gravida !== undefined && motherData.gravida !== null) setGravida(String(motherData.gravida));
              if (motherData.parity !== undefined && motherData.parity !== null) setParity(String(motherData.parity));
              if (motherData.lmp) setLmp(motherData.lmp);
              if (motherData.edd && motherData.edd !== "N/A") setEdd(motherData.edd);
            }
          }

          if (pregnancy) {
            setGravida(pregnancy.gravida !== null ? String(pregnancy.gravida) : "");
            setParity(pregnancy.parity !== null ? String(pregnancy.parity) : "");
            setLmp(pregnancy.lmp_date || "");
            setEdd(pregnancy.expected_delivery_date || "");
            setCaretakersName(pregnancy.caretakers_name || "");
            setCaretakersPhone(pregnancy.caretakers_phone || "");
            setRiskLevel((pregnancy.risk_level as "normal" | "moderate" | "high") || "normal");
            setPregnancyId(pregnancy.id || null);
          }
        } catch (e) {
          console.error("error fetching mother/pregnancy data", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedMotherId]);

  const calcEddFromLmp = (lmpAd: string) => {
    try {
      const lmpDate = new Date(lmpAd);
      if (!isNaN(lmpDate.getTime())) {
        const eddDate = new Date(lmpDate);
        eddDate.setDate(eddDate.getDate() + 280);
        return eddDate.toISOString().split("T")[0];
      }
    } catch (e) {}
    return "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMotherId) e.motherId = t("pregnancy_form.validation.mother_req");
    if (!gravida.trim()) e.gravida = t("pregnancy_form.validation.gravida_req");
    if (!parity.trim()) e.parity = t("pregnancy_form.validation.parity_req");
    if (!lmp) e.lmp = t("pregnancy_form.validation.lmp_req");
    if (gravida.trim() && parity.trim()) {
      if (parseInt(parity, 10) > parseInt(gravida, 10)) {
        e.parity = t("pregnancy_form.validation.parity_invalid");
      }
    }
    if (caretakersPhone && caretakersPhone.length !== 10) {
      e.caretakersPhone = t("pregnancy_form.validation.phone_digits");
    }
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);
    try {
      await createPregnancy({
        id: pregnancyId || Crypto.randomUUID(),
        mother_id: selectedMotherId,
        gravida: parseInt(gravida) || 0,
        parity: parseInt(parity) || 0,
        lmp_date: lmp,
        expected_delivery_date: edd,
        caretakers_name: caretakersName || undefined,
        caretakers_phone: caretakersPhone || undefined,
        is_current: true,
        selected: true,
        risk_level: riskLevel,
      });
      showToast(t("pregnancy_form.messages.save_success"));
      router.back();
    } catch (err) {
      console.error("Error saving form:", err);
      showToast(t("pregnancy_form.messages.save_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const motherOptions = mothers.map(m => ({ label: m.name, value: m.id }));

  return (
    <>
      <View className="pt-3">
        <ProfilePicker
          key={`picker-${mothers.length}-${id || "new"}`}
          label={t("pregnancy_form.select_mother")}
          placeholder={isLoading ? t("pregnancy_form.loading_mothers") : t("pregnancy_form.choose_mother")}
          selectedValue={selectedMotherId}
          disabled={Boolean(id && id !== "undefined" && id !== "")}
          isSearchable={true}
          options={motherOptions}
          onValueChange={(val) => { setSelectedMotherId(val); setErrors({ ...errors, motherId: "" }); }}
          error={errors.motherId}
        />
      </View>

      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <FieldLabel label={t("pregnancy_form.gravida")} />
          <BoxInput
            placeholder="e.g. 1"
            value={gravida}
            onChangeText={(t) => { setGravida(t.replace(/\D/g, "")); setErrors({ ...errors, gravida: "" }); }}
            keyboardType="numeric"
            error={errors.gravida}
          />
        </View>
        <View className="flex-1">
          <FieldLabel label={t("pregnancy_form.parity")} />
          <BoxInput
            placeholder="e.g. 0"
            value={parity}
            onChangeText={(t) => { setParity(t.replace(/\D/g, "")); setErrors({ ...errors, parity: "" }); }}
            keyboardType="numeric"
            error={errors.parity}
          />
        </View>
      </View>

      <FieldLabel label={t("pregnancy_form.lmp_date")} />
      <Pressable onPress={() => setShowLmpPicker(true)} className="mb-6">
        <View className={`rounded-md px-4 h-14 border flex-row items-center justify-between bg-white ${errors.lmp ? "border-red-300" : "border-gray-300"}`}>
          <Text className={`text-base ${lmp ? "text-[#1E293B]" : "text-[#9CA3AF]"}`}>
            {lmp || t("pregnancy_form.select_lmp")}
          </Text>
          <Calendar size={18} color="#0056D2" />
        </View>
      </Pressable>
      {errors.lmp ? <Text className="text-red-500 text-xs -mt-5 mb-4 ml-1 font-medium">{errors.lmp}</Text> : null}

      {edd ? (
        <View className="mb-6">
          <FieldLabel label={t("pregnancy_form.edd_date")} />
          <View className="rounded-xl px-4 h-14 border border-gray-200 bg-gray-50 justify-center">
            <Text className="text-[#1E293B] text-base font-semibold">{edd}</Text>
          </View>
        </View>
      ) : null}

      <View className="mb-4">
        <ProfilePicker
          label={language === "np" ? "जोखिम स्तर" : "Risk Level"}
          placeholder={language === "np" ? "जोखिम स्तर छान्नुहोस्" : "Select Risk Level"}
          selectedValue={riskLevel}
          onValueChange={(val) => setRiskLevel(val as "normal" | "moderate" | "high")}
          options={RISK_OPTIONS.map((opt) => ({
            label: language === "np" ? opt.np : opt.en,
            value: opt.value,
          }))}
        />
      </View>

      <FieldLabel label={t("pregnancy_form.caretaker_name")} />
      <BoxInput placeholder={t("add_record.basic_info.mother_name_placeholder")} value={caretakersName} onChangeText={setCaretakersName} />

      <FieldLabel label={t("pregnancy_form.caretaker_phone")} />
      <BoxInput
        placeholder="98*******"
        value={caretakersPhone}
        onChangeText={setCaretakersPhone}
        keyboardType="phone-pad"
        maxLength={10}
        error={errors.caretakersPhone}
      />

      <Button
        onPress={save}
        isLoading={isLoading}
        title={pregnancyId ? t("pregnancy_form.buttons.update") : t("pregnancy_form.buttons.save")}
      />

       <CalendarPicker
                visible={showLmpPicker}
                onClose={() => setShowLmpPicker(false)}
                onDateSelect={(bsDate) => {
                  setShowLmpPicker(false);
                  setLmp(bsDate);
                  setErrors({ ...errors, lmp: "" });
                  try {
                    const adDate = BsToAd(bsDate);
                    setEdd(calcEddFromLmp(adDate));
                  } catch (e) {
                    console.error("BS to AD conversion error:", e);
                  }
                }}
                language={language === "np" ? "np" : "en"}
                theme="light"
                brandColor="#0056D2"
                date={lmp || undefined}
                dayTextStyle={{ fontWeight: 'normal' }}
                weekTextStyle={{ fontWeight: 'normal' }}
                titleTextStyle={{ fontWeight: 'normal' }}
              />
    </>
  );
}
