import { Calendar, ChevronDown } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, TextInput, View } from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import {
  getAllInfantMonitorings,
  getInfantMonitoringsByMother,
} from "../../hooks/database/models/InfantMonitoringModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../hooks/database/models/MotherModel";
import { createNewbornDeath } from "../../hooks/database/models/NewbornDeathModel";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { InfantMonitoringStoreType } from "../../hooks/database/types/infantMonitoringModal";
import { NewbornDeathStoreType } from "../../hooks/database/types/newbornDeathModal";
import { toNepaliNumbers } from "../../utils/dateHelper";
import { Button } from "../button";
import { FieldLabel } from "../FormElements";
import { ProfilePicker } from "../ProfilePicker";
import TextArea from "../TextArea";

interface NewbornDeathFormProps {
  record?: HmisRecordStoreType;
  children?: InfantMonitoringStoreType[];
  initialChildId?: string;
  initialChildName?: string;
  onSuccess: (updatedDeath: NewbornDeathStoreType) => void;
  showToast: (msg: string) => void;
  /** When the form is rendered inside a Modal, pass this so the parent can
   *  lift CalendarPicker outside the Modal (fixes nested-Modal bug). */
  onRequestOpenDeathDatePicker?: () => void;
  /** Called by the parent to push a selected BS date back into this form. */
  onDeathDateSelected?: (bsDate: string) => void;
  /** Expose a setter so the parent can register the callback imperatively. */
  registerDeathDateSetter?: (setter: (bsDate: string) => void) => void;
}

export default function NewbornDeathForm({
  record,
  children: initialChildren,
  initialChildId,
  initialChildName,
  onSuccess,
  showToast,
  onRequestOpenDeathDatePicker,
  registerDeathDateSetter,
}: NewbornDeathFormProps) {
  const { t, i18n } = useTranslation();

  const [mothersList, setMothersList] = useState<MotherListDbItem[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState<string>("");
  const [loadingMothers, setLoadingMothers] = useState(false);
  const [errMother, setErrMother] = useState(false);
  const [motherIdsWithAliveChildren, setMotherIdsWithAliveChildren] = useState<
    Set<string>
  >(new Set());

  const [motherChildren, setMotherChildren] = useState<
    InfantMonitoringStoreType[]
  >(initialChildren || []);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(initialChildId || "");
  const [birthCondition, setBirthCondition] = useState("");
  const [birthConditionOther, setBirthConditionOther] = useState("");
  const [causeOfDeath, setCauseOfDeath] = useState("");
  const [causeOfDeathOther, setCauseOfDeathOther] = useState("");
  const [deathPlace, setDeathPlace] = useState("");
  const [deathPlaceOther, setDeathPlaceOther] = useState("");
  const [deathAgeValue, setDeathAgeValue] = useState(0);
  const [deathAgeUnit, setDeathAgeUnit] = useState<"days" | "months">("days");

  const [birthDay, setBirthDay] = useState(new Date().getDate());
  const [birthMonth, setBirthMonth] = useState(new Date().getMonth() + 1);
  const [birthYear, setBirthYear] = useState(new Date().getFullYear());

  const [deathDay, setDeathDay] = useState(0);
  const [deathMonth, setDeathMonth] = useState(0);
  const [deathYear, setDeathYear] = useState(0);

  const getAdString = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const adToBsStr = (y: number, m: number, d: number) => {
    try {
      return AdToBs(getAdString(y, m, d));
    } catch {
      return getAdString(y, m, d);
    }
  };
  const formatDate = (y: number, m: number, d: number) => {
    try {
      const ad = getAdString(y, m, d);
      if (i18n.language === "np") return toNepaliNumbers(AdToBs(ad));
      return ad;
    } catch {
      return getAdString(y, m, d);
    }
  };

  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isNewborn = useMemo(() => {
    if (deathAgeUnit === "months") return false;
    return deathAgeValue < 28;
  }, [deathAgeUnit, deathAgeValue]);

  const [errBirthCondition, setErrBirthCondition] = useState(false);
  const [errBirthConditionOther, setErrBirthConditionOther] = useState(false);
  const [errCauseOfDeath, setErrCauseOfDeath] = useState(false);
  const [errCauseOfDeathOther, setErrCauseOfDeathOther] = useState(false);
  const [errDeathPlace, setErrDeathPlace] = useState(false);
  const [errDeathPlaceOther, setErrDeathPlaceOther] = useState(false);
  const [errGender, setErrGender] = useState(false);
  const [errChild, setErrChild] = useState("");

  const [showDeathDatePicker, setShowDeathDatePicker] = useState(false);

  // Allow a parent Modal to push a selected BS date back into this form.
  const applyDeathDate = (bsDate: string) => {
    try {
      const adDate = BsToAd(bsDate);
      const parts = adDate.split("-");
      setDeathYear(parseInt(parts[0], 10));
      setDeathMonth(parseInt(parts[1], 10));
      setDeathDay(parseInt(parts[2], 10));
    } catch (e) {
      console.error("applyDeathDate error", e);
    }
  };

  // Register the setter with the parent once on mount.
  useEffect(() => {
    registerDeathDateSetter?.(applyDeathDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!record) {
      const loadData = async () => {
        setLoadingMothers(true);
        try {
          const [mList, allChildren] = await Promise.all([
            getAllMothersList(),
            getAllInfantMonitorings(),
          ]);
          setMothersList(mList);
          const aliveMotherIds = new Set<string>(
            allChildren
              .filter((c) => c.status !== "dead" && c.mother)
              .map((c) => c.mother as string),
          );
          setMotherIdsWithAliveChildren(aliveMotherIds);
        } catch (error) {
          console.error("Failed to load data:", error);
        } finally {
          setLoadingMothers(false);
        }
      };
      loadData();
    }
  }, [record]);

  const motherOptions = useMemo(() => {
    return mothersList
      .filter((m) => motherIdsWithAliveChildren.has(m.id))
      .map((m) => ({
        value: m.id,
        label: m.name || t("common.unnamed_mother"),
      }));
  }, [mothersList, motherIdsWithAliveChildren, t]);

  useEffect(() => {
    if (initialChildren) {
      setMotherChildren(initialChildren);
    }
  }, [initialChildren]);

  useEffect(() => {
    let isActive = true;

    const loadMotherChildren = async () => {
      const targetMotherId = record?.id || selectedMotherId;
      if (initialChildren?.length || !targetMotherId) {
        if (!targetMotherId) setMotherChildren([]);
        return;
      }

      try {
        setLoadingChildren(true);
        const children = await getInfantMonitoringsByMother(targetMotherId);
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
  }, [initialChildren?.length, record?.id, selectedMotherId]);

  const childOptions = useMemo(
    () =>
      motherChildren
        .filter((child) => child.status !== "dead")
        .map((child, index) => {
          const unnamedChild = t("newborn_death_modal.unnamed_child");
          return {
            value: child.id,
            label: child.baby_name?.trim() || `${unnamedChild} ${index + 1}`,
          };
        }),
    [motherChildren, t],
  );

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    setErrChild("");
  };

  useEffect(() => {
    if (!selectedChildId || motherChildren.length === 0) return;

    const selectedChild = motherChildren.find(
      (child) => child.id === selectedChildId,
    );
    if (selectedChild) {
      if (selectedChild.gender) {
        const g =
          selectedChild.gender.charAt(0).toUpperCase() +
          selectedChild.gender.slice(1).toLowerCase();
        if (g === "Male" || g === "Female") {
          setGender(g);
        }
      }

      if (selectedChild.date_of_birth) {
        const parts = selectedChild.date_of_birth.split(/[-/T ]/);
        if (parts.length >= 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);

          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            setBirthYear(year);
            setBirthMonth(month);
            setBirthDay(day);
          }
        }
      }
    }
  }, [selectedChildId, motherChildren]);

  useEffect(() => {
    if (initialChildId) {
      setSelectedChildId(initialChildId);
    }
  }, [initialChildId]);

  useEffect(() => {
    if (
      birthYear &&
      birthMonth &&
      birthDay &&
      deathYear > 0 &&
      deathMonth > 0 &&
      deathDay > 0
    ) {
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
        setDeathAgeUnit("days");
      } else {
        const months = Math.floor(diffDays / 30);
        setDeathAgeValue(months || 1);
        setDeathAgeUnit("months");
      }
    }
  }, [birthYear, birthMonth, birthDay, deathYear, deathMonth, deathDay]);

  const handleAgeUnitChange = (unit: "days" | "months") => {
    setDeathAgeUnit(unit);
    setCauseOfDeath("");
    setCauseOfDeathOther("");
    setErrCauseOfDeath(false);
    setErrCauseOfDeathOther(false);
    if (unit === "months") {
      setBirthCondition("");
      setBirthConditionOther("");
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
    }
  };

  const handleSave = async () => {
    let hasError = false;

    if (!record && !selectedMotherId) {
      setErrMother(true);
      hasError = true;
    } else {
      setErrMother(false);
    }

    if (!selectedChildId) {
      setErrChild(t("newborn_death_modal.select_child_error"));
      hasError = true;
    } else {
      setErrChild("");
    }

    if (isNewborn) {
      if (!birthCondition) {
        setErrBirthCondition(true);
        hasError = true;
      } else {
        setErrBirthCondition(false);
      }
      if (birthCondition === "Other" && !birthConditionOther.trim()) {
        setErrBirthConditionOther(true);
        hasError = true;
      } else {
        setErrBirthConditionOther(false);
      }
    } else {
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
    }

    if (!causeOfDeath) {
      setErrCauseOfDeath(true);
      hasError = true;
    } else {
      setErrCauseOfDeath(false);
    }
    if (causeOfDeath === "Other" && !causeOfDeathOther.trim()) {
      setErrCauseOfDeathOther(true);
      hasError = true;
    } else {
      setErrCauseOfDeathOther(false);
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
    if (!gender) {
      setErrGender(true);
      hasError = true;
    } else {
      setErrGender(false);
    }

    if (deathYear === 0 || deathMonth === 0 || deathDay === 0) {
      showToast(t("newborn_death_modal.date_error"));
      hasError = true;
    } else {
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
      const deathDate = new Date(deathYear, deathMonth - 1, deathDay);
      if (deathDate < birthDate) {
        showToast(t("newborn_death_modal.date_error"));
        hasError = true;
      }
    }

    if (hasError) return;

    try {
      setSubmitting(true);
      let targetMotherId = record?.id;
      let targetMotherName = record?.mother_name;

      if (!record) {
        const m = mothersList.find((x) => x.id === selectedMotherId);
        targetMotherId = m?.id;
        targetMotherName = m?.name;
      }

      const selectedChild = motherChildren.find(
        (child) => child.id === selectedChildId,
      );
      const payload = {
        mother: targetMotherId,
        mother_name: targetMotherName,
        child_id: selectedChildId,
        baby_name: selectedChild?.baby_name?.trim() || "",
        birth_condition: isNewborn ? birthCondition : "",
        birth_condition_other: isNewborn ? birthConditionOther : "",
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

      if (!record) setSelectedMotherId("");
      setSelectedChildId("");
      setBirthCondition("");
      setBirthConditionOther("");
      setCauseOfDeath("");
      setCauseOfDeathOther("");
      setDeathPlace("");
      setDeathPlaceOther("");
      setDeathAgeValue(1);
      setDeathAgeUnit("days");
      setGender("");
      setRemarks("");
      setErrBirthCondition(false);
      setErrBirthConditionOther(false);
      setErrCauseOfDeath(false);
      setErrCauseOfDeathOther(false);
      setErrDeathPlace(false);
      setErrDeathPlaceOther(false);
      setErrGender(false);
      setErrChild("");
      setErrMother(false);

      onSuccess(payload as NewbornDeathStoreType);
    } catch (error) {
      showToast(t("newborn_death_modal.error"));
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

  const causeOptions = useMemo(() => {
    if (isNewborn) {
      return [
        { v: "Asphyxia", l: t("newborn_death_modal.asphyxia") },
        { v: "Hypothermia", l: t("newborn_death_modal.hypothermia") },
        { v: "Infection", l: t("newborn_death_modal.infection") },
        { v: "Other", l: t("newborn_death_modal.other") },
      ];
    }
    return [
      { v: "Pneumonia", l: t("newborn_death_modal.pneumonia") },
      { v: "Diarrhea", l: t("newborn_death_modal.diarrhea") },
      { v: "Malnutrition", l: t("newborn_death_modal.malnutrition") },
      { v: "Other", l: t("newborn_death_modal.other") },
    ];
  }, [isNewborn, t]);

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
              setSelectedChildId("");
            }}
            options={motherOptions}
            error={errMother ? t("maternal_death_modal.mother_error") : ""}
            isSearchable
            required
          />
        )}
        {(() => {
          const canSelectChild = !!(
            record ||
            selectedMotherId ||
            initialChildren?.length
          );
          return (
            <View className="gap-y-1.5 -mt-6">
              <View className="relative">
                <ProfilePicker
                  label={t("newborn_death_modal.choose_baby")}
                  placeholder={
                    loadingChildren
                      ? t("newborn_death_modal.loading_children")
                      : t("newborn_death_modal.choose_baby_placeholder")
                  }
                  selectedValue={
                    initialChildId && initialChildName
                      ? initialChildId
                      : selectedChildId
                  }
                  onValueChange={handleChildChange}
                  options={childOptions}
                  error={errChild}
                  isSearchable
                  disabled={
                    !canSelectChild ||
                    loadingChildren ||
                    !!(initialChildId && initialChildName)
                  }
                  required
                />
                {!canSelectChild && (
                  <Pressable
                    onPress={() =>
                      showToast(t("newborn_death_modal.select_mother_first"))
                    }
                    className="absolute inset-0 z-10"
                  />
                )}
              </View>
              {loadingChildren && (
                <Text className="text-slate-400 text-[12px] ml-1">
                  {t("newborn_death_modal.loading_children")}
                </Text>
              )}
            </View>
          );
        })()}

        <View className="gap-y-1.5 -mt-6">
          <FieldLabel label={t("newborn_death_modal.gender")} required />
          <View className="flex-row gap-3">
            {[
              { v: "Male", l: t("newborn_death_modal.male") },
              { v: "Female", l: t("newborn_death_modal.female") },
            ].map((g) => (
              <Pressable
                key={g.v}
                onPress={() => {
                  setGender(g.v as any);
                  setErrGender(false);
                }}
                className={`flex-1 h-14 rounded-xl border flex-row items-center justify-center ${
                  gender === g.v
                    ? "bg-slate-50 border-slate-700"
                    : errGender
                      ? "bg-rose-50 border-rose-300"
                      : "bg-white border-slate-200"
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-2 items-center justify-center ${
                    gender === g.v
                      ? "border-slate-700"
                      : errGender
                        ? "border-rose-300"
                        : "border-slate-300"
                  }`}
                >
                  {gender === g.v && (
                    <View className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  )}
                </View>
                <Text
                  className={`text-[15px] ${
                    gender === g.v
                      ? "text-slate-800 font-semibold"
                      : "text-slate-600"
                  }`}
                >
                  {g.l}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1 gap-y-1.5">
            <FieldLabel label={t("newborn_death_modal.birth_date")} required />
            <View className="h-14 bg-white border border-slate-200 px-4 rounded-xl flex-row items-center justify-between">
              <Text
                className="text-slate-500 text-[16px] font-semibold"
                numberOfLines={1}
              >
                {formatDate(birthYear, birthMonth, birthDay)}
              </Text>
              <Calendar size={18} color="#94A3B8" />
            </View>
          </View>
          <View className="flex-1 gap-y-1.5">
            <FieldLabel label={t("newborn_death_modal.death_date")} required />
            <Pressable onPress={() => setShowDeathDatePicker(true)}>
              <View className="h-14 bg-white border border-slate-200 px-4 rounded-xl flex-row items-center justify-between">
                <Text
                  className={`text-[16px] font-normal ${
                    deathYear > 0 ? "text-slate-800" : "text-slate-400"
                  }`}
                  numberOfLines={1}
                >
                  {deathYear > 0
                    ? formatDate(deathYear, deathMonth, deathDay)
                    : t("newborn_death_modal.choose_date")}
                </Text>
                <Calendar size={18} color="#94A3B8" />
              </View>
            </Pressable>
          </View>
        </View>

        {showDeathDatePicker && (
          <CalendarPicker
            visible={true}
            onClose={() => setShowDeathDatePicker(false)}
            onDateSelect={(bsDate) => {
              setShowDeathDatePicker(false);
              applyDeathDate(bsDate);
            }}
            language="np"
            theme="light"
            brandColor="#E11D48"
            date={
              deathYear > 0
                ? adToBsStr(deathYear, deathMonth, deathDay)
                : undefined
            }
            dayTextStyle={{ fontWeight: "normal" }}
            weekTextStyle={{ fontWeight: "normal" }}
            titleTextStyle={{ fontWeight: "normal" }}
          />
        )}

        <View className="gap-y-1.5">
          <FieldLabel label={t("newborn_death_modal.death_age")} />
          <View className="h-14 flex-row items-center bg-white border border-slate-200 rounded-xl px-4 justify-between">
            <Text className="text-slate-800 font-bold text-[16px]">
              {deathAgeValue}{" "}
              {deathAgeUnit === "days"
                ? t("newborn_death_modal.age_unit_days")
                : t("newborn_death_modal.age_unit_months")}
            </Text>
            <Pressable
              onPress={() => {
                const newUnit = deathAgeUnit === "days" ? "months" : "days";
                handleAgeUnitChange(newUnit);
              }}
              className="bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200 flex-row items-center"
            >
              <Text className="text-[11px] font-bold text-slate-700 mr-1 uppercase tracking-wider">
                {deathAgeUnit === "days"
                  ? t("newborn_death_modal.age_unit_days")
                  : t("newborn_death_modal.age_unit_months")}
              </Text>
              <ChevronDown size={12} color="#475569" />
            </Pressable>
          </View>
        </View>

        {isNewborn && (
          <View className="gap-y-1.5">
            <FieldLabel
              label={t("newborn_death_modal.birth_condition")}
              required
            />
            <View className="flex-row flex-wrap gap-2">
              {[
                { v: "Preterm", l: t("newborn_death_modal.preterm") },
                { v: "LowWeight", l: t("newborn_death_modal.low_weight") },
                { v: "Normal", l: t("newborn_death_modal.normal") },
                { v: "Other", l: t("newborn_death_modal.other") },
              ].map((c) => (
                <View className="w-[48%]" key={c.v}>
                  {radio(
                    c.v,
                    c.l,
                    birthCondition,
                    (v) => {
                      setBirthCondition(v);
                      setErrBirthCondition(false);
                    },
                    errBirthCondition,
                  )}
                </View>
              ))}
            </View>
            {birthCondition === "Other" && (
              <View className="gap-y-1.5 mt-1.5">
                <View
                  className={`h-14 flex-row items-center rounded-xl px-4 border ${
                    errBirthConditionOther
                      ? "border-rose-400 bg-rose-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <TextInput
                    placeholder={t("newborn_death_modal.specify_condition")}
                    placeholderTextColor="#94a3b8"
                    className="flex-1 text-slate-800 text-[16px] h-full"
                    onChangeText={(v) => {
                      setBirthConditionOther(v);
                      if (v.trim()) setErrBirthConditionOther(false);
                    }}
                    value={birthConditionOther}
                  />
                </View>
                {errBirthConditionOther && (
                  <Text className="text-rose-500 text-xs ml-1 font-semibold">
                    {t("newborn_death_modal.specify_condition_error")}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <View className="gap-y-1.5">
          <FieldLabel
            label={t("newborn_death_modal.cause_of_death")}
            required
          />
          <View className="flex-row flex-wrap gap-2">
            {causeOptions.map((c) => (
              <View className="w-[48%]" key={c.v}>
                {radio(
                  c.v,
                  c.l,
                  causeOfDeath,
                  (v) => {
                    setCauseOfDeath(v);
                    setErrCauseOfDeath(false);
                  },
                  errCauseOfDeath,
                )}
              </View>
            ))}
          </View>
          {causeOfDeath === "Other" && (
            <View className="gap-y-1.5 mt-1.5">
              <View
                className={`h-14 flex-row items-center rounded-xl px-4 border ${
                  errCauseOfDeathOther
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <TextInput
                  placeholder={t("newborn_death_modal.specify_cause")}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 text-slate-800 text-[16px] h-full"
                  onChangeText={(v) => {
                    setCauseOfDeathOther(v);
                    if (v.trim()) setErrCauseOfDeathOther(false);
                  }}
                  value={causeOfDeathOther}
                />
              </View>
              {errCauseOfDeathOther && (
                <Text className="text-rose-500 text-xs ml-1 font-semibold">
                  {t("newborn_death_modal.specify_cause_error")}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="gap-y-1.5">
          <FieldLabel label={t("newborn_death_modal.death_place")} required />
          <View className="flex-row flex-wrap gap-2">
            {[
              { value: "Home", label: t("newborn_death_modal.home") },
              {
                value: "Institution",
                label: t("newborn_death_modal.institution"),
              },
              { value: "Other", label: t("newborn_death_modal.other") },
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
                  placeholder={t("newborn_death_modal.specify_place")}
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
                  {t("newborn_death_modal.specify_place_error")}
                </Text>
              )}
            </View>
          )}
        </View>

        <TextArea
          label={t("newborn_death_modal.remarks")}
          placeholder={t("newborn_death_modal.remarks_placeholder")}
          value={remarks}
          onChangeText={setRemarks}
          numberOfLines={4}
        />

        <View className="pt-2">
          <Button
            onPress={handleSave}
            isLoading={submitting}
            title={t("newborn_death_modal.save")}
          />
        </View>
      </View>
    </View>
  );
}
