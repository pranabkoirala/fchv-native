import { Calendar } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { CalendarPicker } from "react-native-nepali-picker";
import { createMaternalDeath } from "../../hooks/database/models/MaternalDeathModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../hooks/database/models/MotherModel";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../hooks/database/types/maternalDeathModal";
import { toNepaliNumbers } from "../../utils/dateHelper";
import { Button } from "../button";
import { FieldLabel } from "../FormElements";
import { ProfilePicker } from "../ProfilePicker";
import TextArea from "../TextArea";

interface MaternalDeathFormProps {
  record?: HmisRecordStoreType;
  onSuccess: (updatedDeath: MaternalDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function MaternalDeathForm({
  record,
  onSuccess,
  showToast,
}: MaternalDeathFormProps) {
  const { t, i18n } = useTranslation();

  const [mothersList, setMothersList] = useState<MotherListDbItem[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState<string>("");
  const [loadingMothers, setLoadingMothers] = useState(false);

  const [deathCondition, setDeathCondition] = useState("");
  const [deathConditionOther, setDeathConditionOther] = useState("");
  const [deathPlace, setDeathPlace] = useState("");
  const [deathPlaceOther, setDeathPlaceOther] = useState("");
  const [childCondition, setChildCondition] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deathDay, setDeathDay] = useState(0);
  const [deathMonth, setDeathMonth] = useState(0);
  const [deathYear, setDeathYear] = useState(0);

  const getAdString = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const formatDate = (y: number, m: number, d: number) => {
    const bs = getAdString(y, m, d);
    if (i18n.language === "np") return toNepaliNumbers(bs);
    return bs;
  };

  const [errMother, setErrMother] = useState(false);
  const [errDeathCondition, setErrDeathCondition] = useState(false);
  const [errDeathConditionOther, setErrDeathConditionOther] = useState(false);
  const [errDeathPlace, setErrDeathPlace] = useState(false);
  const [errDeathPlaceOther, setErrDeathPlaceOther] = useState(false);
  const [errChildCondition, setErrChildCondition] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!record) {
      const loadMothers = async () => {
        setLoadingMothers(true);
        try {
          const mList = await getAllMothersList();
          setMothersList(mList);
        } catch (error) {
          console.error("Failed to load mothers:", error);
        } finally {
          setLoadingMothers(false);
        }
      };
      loadMothers();
    }
  }, [record]);

  const motherOptions = useMemo(() => {
    return mothersList
      .filter((m) => !m.is_dead)
      .map((m) => ({
        value: m.id,
        label:
          m.name ||
          t("common.unnamed_mother", { defaultValue: "Unnamed Mother" }),
      }));
  }, [mothersList, t]);

  const handleSaveMaternalDeath = async () => {
    let hasError = false;

    if (!record && !selectedMotherId) {
      setErrMother(true);
      hasError = true;
    } else {
      setErrMother(false);
    }

    if (deathYear === 0 || deathMonth === 0 || deathDay === 0) {
      Alert.alert(
        t("maternal_death_modal.error_title"),
        t("newborn_death_modal.date_error"),
      );
      hasError = true;
    }

    if (!deathCondition) {
      setErrDeathCondition(true);
      hasError = true;
    } else {
      setErrDeathCondition(false);
    }
    if (deathCondition === "Other" && !deathConditionOther.trim()) {
      setErrDeathConditionOther(true);
      hasError = true;
    } else {
      setErrDeathConditionOther(false);
    }
    if (deathCondition === "Other" && !deathConditionOther.trim()) {
      setErrDeathConditionOther(true);
      hasError = true;
    } else {
      setErrDeathConditionOther(false);
    }
    if (!deathPlace) {
      setErrDeathPlace(true);
      hasError = true;
    } else {
      setErrDeathPlace(false);
    }
    if (deathPlace === "Other" && !deathPlaceOther.trim()) {
      setErrDeathPlaceOther(true);
      hasError = true;
    } else {
      setErrDeathPlaceOther(false);
    }
    if (deathCondition === "Pregnant") {
      if (!childCondition) {
        setErrChildCondition(true);
        hasError = true;
      } else {
        setErrChildCondition(false);
      }
    } else {
      setErrChildCondition(false);
    }

    if (hasError) return;

    try {
      setSubmitting(true);
      let payloadRecord: any;

      if (record) {
        payloadRecord = {
          mother: record.id,
          serial_no: record.serial_no,
          mother_name: record.mother_name,
          mother_age: record.mother_age,
        };
      } else {
        const selectedMother = mothersList.find(
          (m) => m.id === selectedMotherId,
        );
        payloadRecord = {
          mother: selectedMother?.id,
          serial_no: selectedMother?.code,
          mother_name: selectedMother?.name,
          mother_age: selectedMother?.age,
        };
      }

      const payload = {
        ...payloadRecord,
        death_condition: deathCondition,
        death_condition_other: deathConditionOther,
        death_place: deathPlace,
        death_place_other: deathPlaceOther,
        child_condition: childCondition,
        death_day: deathDay,
        death_month: deathMonth,
        death_year: deathYear,
        remarks: remarks,
      } as any;

      const savedRecord = await createMaternalDeath(payload);
      showToast(t("maternal_death_modal.success"));

      if (!record) setSelectedMotherId("");
      setDeathCondition("");
      setDeathConditionOther("");
      setDeathPlace("");
      setDeathPlaceOther("");
      setChildCondition("");
      setDeathDay(0);
      setDeathMonth(0);
      setDeathYear(0);
      setRemarks("");

      setErrMother(false);
      setErrDeathCondition(false);
      setErrDeathConditionOther(false);
      setErrDeathPlace(false);
      setErrDeathPlaceOther(false);
      setErrChildCondition(false);

      onSuccess(savedRecord);
    } catch (error) {
      console.error(error);
      Alert.alert(
        t("maternal_death_modal.error_title"),
        t("maternal_death_modal.error"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const radio = (
    value: string,
    label: string,
    selected: string,
    onSelect: (v: string) => void,
    hasError: boolean,
  ) => (
    <Pressable
      key={value}
      onPress={() => onSelect(value)}
      className={`flex-row items-center py-3 px-4 rounded-xl border ${
        selected === value
          ? "bg-slate-50 border-slate-700"
          : hasError
            ? "bg-rose-50 border-rose-300"
            : "bg-white border-slate-200"
      }`}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2.5 ${
          selected === value
            ? "border-slate-700"
            : hasError
              ? "border-rose-300"
              : "border-slate-300"
        }`}
      >
        {selected === value && (
          <View className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        )}
      </View>
      <Text
        className={`text-[15px] ${
          selected === value ? "text-slate-800 font-semibold" : "text-slate-600"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 pt-2">
      <View className="gap-y-5 pb-32">
        {!record && (
          <ProfilePicker
            label={t("maternal_death_modal.choose_mother")}
            placeholder={
              loadingMothers
                ? t("common.loading")
                : t("maternal_death_modal.choose_mother_placeholder")
            }
            selectedValue={selectedMotherId}
            onValueChange={(val) => {
              setSelectedMotherId(val);
              setErrMother(false);
            }}
            options={motherOptions}
            error={errMother ? t("maternal_death_modal.mother_error") : ""}
            isSearchable
            required
          />
        )}

        <View className="gap-y-1.5 -mt-6">
          <FieldLabel
            label={t("maternal_death_modal.date_of_death")}
            required
          />
          <Pressable onPress={() => setShowDatePicker(true)}>
            <View className="h-14 flex-row items-center rounded-xl px-4 border border-slate-200 bg-white">
              <Text
                className={`flex-1 text-[16px] ${
                  deathYear > 0
                    ? "text-slate-800 font-semibold"
                    : "text-slate-400"
                }`}
              >
                {deathYear > 0
                  ? formatDate(deathYear, deathMonth, deathDay)
                  : t("newborn_death_modal.choose_date")}
              </Text>
              <Calendar size={18} color="#475569" />
            </View>
          </Pressable>
        </View>

        <CalendarPicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={(bsDate) => {
            setShowDatePicker(false);
            try {
              const parts = bsDate.split("-");
              setDeathYear(parseInt(parts[0], 10));
              setDeathMonth(parseInt(parts[1], 10));
              setDeathDay(parseInt(parts[2], 10));
            } catch (e) {
              console.error(e);
            }
          }}
          language="np"
          theme="light"
          brandColor="#E11D48"
          date={
            deathYear > 0
              ? getAdString(deathYear, deathMonth, deathDay)
              : undefined
          }
          dayTextStyle={{ fontWeight: "normal" }}
          weekTextStyle={{ fontWeight: "normal" }}
          titleTextStyle={{ fontWeight: "normal" }}
        />

        <View className="gap-y-1.5">
          <FieldLabel
            label={t("maternal_death_modal.condition_of_death")}
            required
          />
          <View className="flex-row flex-wrap gap-2">
            {[
              { value: "Pregnant", label: t("maternal_death_modal.pregnant") },
              { value: "Labor", label: t("maternal_death_modal.labor") },
              {
                value: "Post_delivery",
                label: t("maternal_death_modal.postpartum"),
              },
              { value: "Other", label: t("maternal_death_modal.other") },
            ].map((c) => (
              <View className="w-[48%]" key={c.value}>
                {radio(
                  c.value,
                  c.label,
                  deathCondition,
                  (v) => {
                    setDeathCondition(v);
                    setErrDeathCondition(false);
                    if (v !== "Pregnant") {
                      setChildCondition("");
                      setErrChildCondition(false);
                    }
                  },
                  errDeathCondition,
                )}
              </View>
            ))}
          </View>
          {errDeathCondition && (
            <Text className="text-rose-500 text-xs mt-1 ml-1 font-semibold">
              {t("maternal_death_modal.condition_error")}
            </Text>
          )}
          {deathCondition === "Other" && (
            <View className="gap-y-1.5 mt-1.5">
              <View
                className={`h-14 flex-row items-center rounded-xl px-4 border ${
                  errDeathConditionOther
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <TextInput
                  placeholder={t("maternal_death_modal.specify_condition")}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-slate-800 text-[16px] h-full"
                  onChangeText={(v) => {
                    setDeathConditionOther(v);
                    if (v.trim()) setErrDeathConditionOther(false);
                  }}
                  value={deathConditionOther}
                />
              </View>
              {errDeathConditionOther && (
                <Text className="text-rose-500 text-xs ml-1 font-semibold">
                  {t("maternal_death_modal.specify_condition_error")}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="gap-y-1.5">
          <FieldLabel
            label={t("maternal_death_modal.place_of_death")}
            required
          />
          <View className="flex-row flex-wrap gap-2">
            {[
              { value: "Home", label: t("maternal_death_modal.home") },
              {
                value: "Institution",
                label: t("maternal_death_modal.institution"),
              },
              { value: "Other", label: t("maternal_death_modal.other") },
            ].map((c) => (
              <View className="w-[31%]" key={c.value}>
                {radio(
                  c.value,
                  c.label,
                  deathPlace,
                  (v) => {
                    setDeathPlace(v);
                    setErrDeathPlace(false);
                  },
                  errDeathPlace,
                )}
              </View>
            ))}
          </View>
          {deathPlace === "Other" && (
            <View className="gap-y-1.5 mt-1.5">
              <View
                className={`h-14 flex-row items-center rounded-xl px-4 border ${
                  errDeathPlaceOther
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <TextInput
                  placeholder={t("maternal_death_modal.specify_place")}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-slate-800 text-[16px] h-full"
                  onChangeText={(v) => {
                    setDeathPlaceOther(v);
                    if (v.trim()) setErrDeathPlaceOther(false);
                  }}
                  value={deathPlaceOther}
                />
              </View>
              {errDeathPlaceOther && (
                <Text className="text-rose-500 text-xs ml-1 font-semibold">
                  {t("maternal_death_modal.specify_place_error")}
                </Text>
              )}
            </View>
          )}
        </View>

        {deathCondition === "Pregnant" && (
        <View className="gap-y-1.5">
          <FieldLabel
            label={t("maternal_death_modal.child_condition")}
            required
          />
          <View className="flex-row gap-3">
            {[
              { value: "Alive", label: t("maternal_death_modal.child_alive") },
              { value: "Dead", label: t("maternal_death_modal.child_dead") },
            ].map((c) => (
              <Pressable
                key={c.value}
                onPress={() => {
                  setChildCondition(c.value);
                  setErrChildCondition(false);
                }}
                className={`flex-1 h-12 rounded-xl border flex-row items-center justify-center ${
                  childCondition === c.value
                    ? "bg-slate-50 border-slate-700"
                    : errChildCondition
                      ? "bg-rose-50 border-rose-300"
                      : "bg-white border-slate-200"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-2 items-center justify-center ${
                    childCondition === c.value
                      ? "border-slate-700"
                      : errChildCondition
                        ? "border-rose-300"
                        : "border-slate-300"
                  }`}
                >
                  {childCondition === c.value && (
                    <View className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  )}
                </View>
                <Text
                  className={`text-[15px] ${
                    childCondition === c.value
                      ? "text-slate-800 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        )}

        <TextArea
          label={t("maternal_death_modal.remarks")}
          placeholder={t("maternal_death_modal.remarks_placeholder")}
          value={remarks}
          onChangeText={setRemarks}
          numberOfLines={4}
        />

        <View className="pt-2">
          <Button
            onPress={handleSaveMaternalDeath}
            isLoading={submitting}
            title={t("maternal_death_modal.save")}
          />
        </View>
      </View>
    </View>
  );
}
