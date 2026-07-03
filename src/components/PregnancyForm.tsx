import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StatusBar, Text, View } from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  getAllMothersList,
  getMotherProfile,
  MotherListDbItem,
  updateMotherPregnancyData,
} from "../hooks/database/models/MotherModel";
import {
  createPregnancy,
  getPregnancyByMotherId,
} from "../hooks/database/models/PregnantWomenModal";
import { toNepaliNumbers } from "../utils/dateHelper";
import { BoxInput, FieldLabel } from "./FormElements";
import { ProfilePicker } from "./ProfilePicker";
import { Button } from "./button";
import PrenatalRegisterCounselingModal from "./forms/PrenatalRegisterCounselingModal";

const RISK_OPTIONS = [
  { value: "normal", en: "Normal", np: "सामान्य" },
  { value: "moderate", en: "Moderate", np: "मध्यम" },
  { value: "high", en: "High", np: "उच्च जोखिम" },
];

export default function PregnancyForm({
  id,
  from,
  mode,
  onSwitchToMother,
  lockMotherSelection = false,
}: {
  id?: string;
  from?: string;
  mode?: string;
  onSwitchToMother?: () => void;
  lockMotherSelection?: boolean;
}) {
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
  const [riskLevel, setRiskLevel] = useState<"normal" | "moderate" | "high">(
    "normal",
  );
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [selectedMotherName, setSelectedMotherName] = useState("");

  const [showLmpPicker, setShowLmpPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [savedPregnancyId, setSavedPregnancyId] = useState<string | null>(null);

  const initialMotherId = id && id !== "undefined" ? id : "";

  const fetchMothers = useCallback(async () => {
    try {
      const list = await getAllMothersList();
      setMothers(list);
    } catch (err) {
      console.error("Error fetching mothers:", err);
    }
  }, []);

  useEffect(() => {
    fetchMothers();
  }, [fetchMothers, initialMotherId]);

  useEffect(() => {
    if (!initialMotherId) return;

    setSelectedMotherId(initialMotherId);
    setErrors((current) => ({ ...current, motherId: "" }));
  }, [initialMotherId]);

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
              if (
                motherData.gravida !== undefined &&
                motherData.gravida !== null
              )
                setGravida(String(motherData.gravida));
              if (motherData.parity !== undefined && motherData.parity !== null)
                setParity(String(motherData.parity));
              if (motherData.lmp) setLmp(motherData.lmp);
              if (motherData.edd && motherData.edd !== "N/A")
                setEdd(motherData.edd);
            }
          }

          if (pregnancy) {
            if (mode === "new") {
              // If mode is new, we want to create a NEW record based on the previous pregnancy
              // Increment gravida for the new pregnancy
              const nextGravida = (pregnancy.gravida || 0) + 1;
              setGravida(String(nextGravida));
              setParity(
                pregnancy.parity !== null ? String(pregnancy.parity) : "",
              );
              // Clean out dates for the new pregnancy
              setLmp("");
              setEdd("");
              // Keep caretakers info as it's likely the same
              setCaretakersName(pregnancy.caretakers_name || "");
              setCaretakersPhone(pregnancy.caretakers_phone || "");
              setRiskLevel("normal");
              // IMPORTANT: Do not set pregnancyId so save() creates a new record
              setPregnancyId(null);
            } else {
              // Standard edit or fill mode
              setGravida(
                pregnancy.gravida !== null ? String(pregnancy.gravida) : "",
              );
              setParity(
                pregnancy.parity !== null ? String(pregnancy.parity) : "",
              );
              setLmp(pregnancy.lmp_date || "");
              setEdd(pregnancy.expected_delivery_date || "");
              setCaretakersName(pregnancy.caretakers_name || "");
              setCaretakersPhone(pregnancy.caretakers_phone || "");
              setRiskLevel(
                (pregnancy.risk_level as "normal" | "moderate" | "high") ||
                  "normal",
              );
              setPregnancyId(pregnancy.id || null);
            }
          }
        } catch (e) {
          console.error("error fetching mother/pregnancy data", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [mode, selectedMotherId]);

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

  const toNepaliDate = (dateStr: string) => {
    if (!dateStr || dateStr === "N/A") return "";
    try {
      const year = parseInt(dateStr.split("-")[0], 10);
      if (year >= 2070) {
        return dateStr;
      }
      return AdToBs(dateStr);
    } catch {
      return dateStr;
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMotherId)
      e.motherId = t("pregnancy_form.validation.mother_req");
    if (!gravida.trim()) e.gravida = t("pregnancy_form.validation.gravida_req");
    else if (parseInt(gravida, 10) < 1) e.gravida = t("pregnancy_form.validation.gravida_min");
    if (!parity.trim()) e.parity = t("pregnancy_form.validation.parity_req");
    if (!lmp) e.lmp = t("pregnancy_form.validation.lmp_req");
    if (gravida.trim() && parity.trim()) {
      if (parseInt(parity, 10) > parseInt(gravida, 10)) {
        e.parity = t("pregnancy_form.validation.parity_invalid");
      }
    }
    const phoneVal = caretakersPhone.trim();
    if (phoneVal) {
      if (phoneVal.length !== 10) {
        e.caretakersPhone = t("pregnancy_form.validation.phone_digits");
      } else if (!phoneVal.startsWith("98") && !phoneVal.startsWith("97")) {
        e.caretakersPhone = t("pregnancy_form.validation.phone_invalid");
      }
    }
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);
    try {
      const newPregId = pregnancyId || Crypto.randomUUID();
      await createPregnancy({
        id: newPregId,
        mother: selectedMotherId,
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

      await updateMotherPregnancyData(selectedMotherId, {
        lmp_date: lmp,
        gravida: parseInt(gravida) || 0,
        parity: parseInt(parity) || 0,
      });

      showToast(t("pregnancy_form.messages.save_success"));

      setSavedPregnancyId(newPregId);
      setShowCounselingModal(true);
    } catch (err) {
      console.error("Error saving form:", err);
      showToast(t("pregnancy_form.messages.save_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCounselingModalClose = () => {
    setShowCounselingModal(false);
    if (from === "profile") {
      router.replace({
        pathname: "/dashboard/profile",
        params: { id: selectedMotherId },
      } as any);
    } else {
      router.replace("/dashboard");
    }
  };

  const motherOptions = mothers
    .filter((m) => !m.is_dead)
    .map((m) => ({ label: m.name, value: m.id }));

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" className="bg-white" />
      <View className="pt-3">
        <ProfilePicker
          label={t("pregnancy_form.select_mother")}
          required
          placeholder={
            isLoading
              ? t("pregnancy_form.loading_mothers")
              : t("pregnancy_form.choose_mother")
          }
          selectedValue={selectedMotherId}
          disabled={lockMotherSelection}
          isSearchable={true}
          options={motherOptions}
          onValueChange={(val) => {
            setSelectedMotherId(val);
            setErrors({ ...errors, motherId: "" });
          }}
          error={errors.motherId}
        />
      </View>

      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <FieldLabel label={t("pregnancy_form.gravida")} required />
          <BoxInput
            placeholder="e.g. 1"
            value={gravida}
            onChangeText={(t) => {
              setGravida(t.replace(/\D/g, ""));
              setErrors({ ...errors, gravida: "" });
            }}
            keyboardType="numeric"
            error={errors.gravida}
            helperText={t("pregnancy_form.gravida_help")}
          />
        </View>
        <View className="flex-1">
          <FieldLabel label={t("pregnancy_form.parity")} required />
          <BoxInput
            placeholder="e.g. 0"
            value={parity}
            onChangeText={(t) => {
              setParity(t.replace(/\D/g, ""));
              setErrors({ ...errors, parity: "" });
            }}
            keyboardType="numeric"
            error={errors.parity}
            helperText={t("pregnancy_form.parity_help")}
          />
        </View>
      </View>

      <FieldLabel label={t("pregnancy_form.lmp_date")} required />
      <Pressable onPress={() => setShowLmpPicker(true)} className="mb-6">
        <View
          className={`rounded-xl px-4 h-14 border flex-row items-center justify-between bg-white ${errors.lmp ? "border-red-300" : "border-gray-300"}`}
        >
          <Text
            className={`text-base ${lmp ? "text-[#1E293B]" : "text-[#9CA3AF]"}`}
          >
            {lmp
              ? language === "np"
                ? toNepaliNumbers(lmp)
                : lmp
              : t("pregnancy_form.select_lmp")}
          </Text>
          <Calendar size={18} color="#475569" />
        </View>
      </Pressable>
      {errors.lmp ? (
        <Text className="text-red-500 text-xs -mt-5 mb-4 ml-1 font-medium">
          {errors.lmp}
        </Text>
      ) : null}

      {edd ? (
        <View className="mb-6">
          <FieldLabel label={t("pregnancy_form.edd_date")} />
          <View className="rounded-xl px-4 h-14 border border-gray-200 bg-gray-50 justify-center">
            <Text className="text-[#1E293B] text-base font-semibold">
              {language === "np"
                ? toNepaliNumbers(toNepaliDate(edd))
                : toNepaliDate(edd)}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mb-4">
        <ProfilePicker
          label={t("add_record.basic_info.risk_label")}
          placeholder={t("add_record.basic_info.risk_placeholder")}
          selectedValue={riskLevel}
          onValueChange={(val) =>
            setRiskLevel(val as "normal" | "moderate" | "high")
          }
          options={RISK_OPTIONS.map((opt) => ({
            label: language === "np" ? opt.np : opt.en,
            value: opt.value,
          }))}
        />
      </View>

      <FieldLabel label={t("pregnancy_form.caretaker_name")} />
      <BoxInput
        placeholder={t("add_record.basic_info.mother_name_placeholder")}
        value={caretakersName}
        onChangeText={(text) => {
          setCaretakersName(text);
          setErrors({ ...errors, caretakersName: "" });
        }}
        error={errors.caretakersName}
      />

      <FieldLabel label={t("pregnancy_form.caretaker_phone")} />
      <BoxInput
        placeholder="98*******"
        value={caretakersPhone}
        onChangeText={(text) => {
          setCaretakersPhone(text);
          setErrors({ ...errors, caretakersPhone: "" });
        }}
        keyboardType="phone-pad"
        maxLength={10}
        error={errors.caretakersPhone}
      />

      <Button
        onPress={save}
        isLoading={isLoading}
        title={
          pregnancyId
            ? t("pregnancy_form.buttons.update")
            : t("pregnancy_form.buttons.save")
        }
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
            const eddAd = calcEddFromLmp(adDate);
            const eddBs = AdToBs(eddAd);
            setEdd(eddBs);
          } catch (e) {
            console.error("BS to AD conversion error:", e);
          }
        }}
        language={language === "np" ? "np" : "en"}
        theme="light"
        brandColor="#0056D2"
        date={lmp || undefined}
        dayTextStyle={{ fontWeight: "normal" }}
        weekTextStyle={{ fontWeight: "normal" }}
        titleTextStyle={{ fontWeight: "normal" }}
      />

      {savedPregnancyId && (
        <PrenatalRegisterCounselingModal
          visible={showCounselingModal}
          onClose={handleCounselingModalClose}
          motherId={selectedMotherId}
          pregnancyId={savedPregnancyId}
        />
      )}
    </View>
  );
}
