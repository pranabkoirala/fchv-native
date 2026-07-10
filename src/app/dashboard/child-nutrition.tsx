import { Button } from "@/components/button";
import CustomHeader from "@/components/CustomHeader";
import { ProfilePicker } from "@/components/ProfilePicker";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { getDb } from "@/hooks/database/db";
import {
  getChildNutritionCountByMonth,
  saveChildNutrition,
} from "@/hooks/database/models/ChildNutritionModel";
import { getCurrentNepaliDate } from "@/utils/dateHelper";
import { useFocusEffect, useRouter } from "expo-router";
import { Apple, Minus, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BsToAd } from "react-native-nepali-picker";

const AGE_GROUP_OPTIONS = [
  { label: "6-11 months", value: "6-11" },
  { label: "12-17 months", value: "12-17" },
  { label: "18-23 months", value: "18-23" },
];

const getTimesOptions = (ageGroup: string, existingCount: number = 0) => {
  const maxTimes = ageGroup === "6-11" ? 1 : ageGroup === "12-17" ? 2 : 3;
  return Array.from({ length: maxTimes }, (_, i) => ({
    label: String(i + 1),
    value: String(i + 1),
    disabled: i + 1 <= existingCount,
  }));
};

const getMaxTimesForAgeGroup = (group: string) =>
  group === "6-11" ? 1 : group === "12-17" ? 2 : 3;

const getAgeGroupFromMonths = (months: number): string => {
  if (months >= 6 && months <= 11) return "6-11";
  if (months >= 12 && months <= 17) return "12-17";
  if (months >= 18 && months <= 23) return "18-23";
  return "";
};

const getAgeInMonths = (dobString: string): number => {
  if (!dobString) return -1;
  try {
    const datePart = dobString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return -1;

    let adDateStr = datePart;
    if (year >= 2070) {
      try {
        adDateStr = BsToAd(datePart);
      } catch (e) {
        console.error("Failed to convert BS to AD:", e);
      }
    }

    const dob = new Date(adDateStr);
    if (isNaN(dob.getTime())) return -1;

    const now = new Date();
    let yearsDiff = now.getFullYear() - dob.getFullYear();
    let monthsDiff = now.getMonth() - dob.getMonth();
    let daysDiff = now.getDate() - dob.getDate();

    if (daysDiff < 0) {
      monthsDiff--;
    }

    const totalMonths = yearsDiff * 12 + monthsDiff;
    return totalMonths >= 0 ? totalMonths : 0;
  } catch (error) {
    console.error("Error calculating age in months:", error);
    return -1;
  }
};

export default function ChildNutritionScreen() {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [motherOptions, setMotherOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedMotherId, setSelectedMotherId] = useState("");
  const [motherChildrenMap, setMotherChildrenMap] = useState<
    Map<
      string,
      { id: string; name: string; ageMonths: number; date_of_birth: string }[]
    >
  >(new Map());
  const [childOptions, setChildOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [childInfo, setChildInfo] = useState<{
    id: string;
    name: string;
    ageMonths: number;
  } | null>(null);
  const [childAgeGroup, setChildAgeGroup] = useState("");
  const [timesPerMonth, setTimesPerMonth] = useState("");
  const [nutritionItems, setNutritionItems] = useState<string[]>([""]);
  const [balvitaPackets, setBalvitaPackets] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingCount, setExistingCount] = useState(0);
  const [maxTimesForAge, setMaxTimesForAge] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const router = useRouter();

  // When a child is selected, only the age group matching the child's actual
  // age is selectable; the others are disabled.
  const eligibleAgeGroup = childInfo
    ? getAgeGroupFromMonths(childInfo.ageMonths)
    : "";
  const ageGroupOptions = AGE_GROUP_OPTIONS.map((opt) => ({
    ...opt,
    disabled: eligibleAgeGroup ? opt.value !== eligibleAgeGroup : false,
  }));

  const resetForm = () => {
    setSelectedMotherId("");
    setChildInfo(null);
    setChildAgeGroup("");
    setTimesPerMonth("");
    setNutritionItems([""]);
    setBalvitaPackets("");
    setErrors({});
    setExistingCount(0);
    setMaxTimesForAge(0);
    setIsLimitReached(false);
  };

  useFocusEffect(
    useCallback(() => {
      resetForm();
      loadMothers();
    }, []),
  );

  const loadMothers = async () => {
    try {
      setLoading(true);
      const db = await getDb();

      // Fetch children from child_monitoring joined with mother.
      // Filter mothers having at least one child aged 6-24 months.
      const rows = await db.getAllAsync<any>(
        `SELECT cm.id as child, cm.baby_name, cm.date_of_birth, cm.status,
                m.id as mother, m.first_name, m.last_name
         FROM child_monitoring cm
         JOIN mother m ON m.id = cm.mother
         WHERE cm.is_deleted = 0 AND m.is_deleted = 0 AND (cm.status IS NULL OR cm.status != 'dead')
         ORDER BY m.first_name ASC`,
      );

      const motherMap = new Map<
        string,
        {
          motherName: string;
          children: {
            id: string;
            name: string;
            ageMonths: number;
            date_of_birth: string;
          }[];
        }
      >();

      for (const row of rows) {
        if (!row.date_of_birth) continue;
        const months = getAgeInMonths(row.date_of_birth);
        // Only 6-24 months child (i.e. >= 6 and < 24 months)
        if (months >= 6 && months < 24) {
          const motherName = [row.first_name, row.last_name]
            .filter(Boolean)
            .join(" ");

          if (!motherMap.has(row.mother)) {
            motherMap.set(row.mother, {
              motherName,
              children: [],
            });
          }

          motherMap.get(row.mother)!.children.push({
            id: row.child,
            name: row.baby_name || t("reports.unnamed_baby"),
            ageMonths: months,
            date_of_birth: row.date_of_birth,
          });
        }
      }

      const eligibleMothers: { label: string; value: string }[] = [];
      const tempChildrenMap = new Map<
        string,
        { id: string; name: string; ageMonths: number; date_of_birth: string }[]
      >();

      motherMap.forEach((data, motherId) => {
        eligibleMothers.push({ label: data.motherName, value: motherId });
        tempChildrenMap.set(motherId, data.children);
      });

      setMotherOptions(eligibleMothers);
      setMotherChildrenMap(tempChildrenMap);
    } catch (e) {
      console.error("Error loading mothers:", e);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingMonthRecords = async (childId: string, group: string) => {
    const { year, month } = getCurrentNepaliDate();
    const count = await getChildNutritionCountByMonth(childId, year, month);
    const max = getMaxTimesForAgeGroup(group);
    setExistingCount(count);
    setMaxTimesForAge(max);
    setIsLimitReached(count >= max);
    return { count, max };
  };

  const handleMotherChange = async (motherId: string) => {
    setSelectedMotherId(motherId);
    setSelectedChildId("");
    setChildOptions([]);
    setChildInfo(null);
    setChildAgeGroup("");
    setTimesPerMonth("");
    setErrors({});
    setExistingCount(0);
    setMaxTimesForAge(0);
    setIsLimitReached(false);

    if (!motherId) return;

    const children = motherChildrenMap.get(motherId) || [];
    if (children.length > 0) {
      const options = children.map((c) => ({
        label: `${c.name} (${c.ageMonths} ${t("dashboard.nutrition_page.months")})`,
        value: c.id,
      }));
      setChildOptions(options);

      // Auto-select first child
      const child = children[0];
      await handleChildChange(child.id, children);
    }
  };

  const handleChildChange = async (
    childId: string,
    currentChildrenList?: {
      id: string;
      name: string;
      ageMonths: number;
      date_of_birth: string;
    }[],
  ) => {
    setSelectedChildId(childId);
    setChildAgeGroup("");
    setTimesPerMonth("");
    setErrors((prev) => ({ ...prev, child: "" }));
    setExistingCount(0);
    setMaxTimesForAge(0);
    setIsLimitReached(false);

    if (!childId) {
      setChildInfo(null);
      return;
    }

    const children =
      currentChildrenList || motherChildrenMap.get(selectedMotherId) || [];
    const child = children.find((c) => c.id === childId);
    if (child) {
      setChildInfo({
        id: child.id,
        name: child.name,
        ageMonths: child.ageMonths,
      });

      const detectedGroup = getAgeGroupFromMonths(child.ageMonths);
      if (detectedGroup) {
        setChildAgeGroup(detectedGroup);
        const maxTimes = getMaxTimesForAgeGroup(detectedGroup);
        const { count } = await checkExistingMonthRecords(
          child.id,
          detectedGroup,
        );
        const nextAvailable = count + 1;
        setTimesPerMonth(
          nextAvailable <= maxTimes ? String(nextAvailable) : String(maxTimes),
        );
      }
    }
  };

  const handleAgeGroupChange = async (value: string) => {
    setChildAgeGroup(value);
    setErrors({ ...errors, childAgeGroup: "" });
    const maxTimes = getMaxTimesForAgeGroup(value);
    if (childInfo) {
      const { count } = await checkExistingMonthRecords(childInfo.id, value);
      const nextAvailable = count + 1;
      setTimesPerMonth(
        nextAvailable <= maxTimes ? String(nextAvailable) : String(maxTimes),
      );
    } else {
      setTimesPerMonth(String(maxTimes));
    }
  };

  const addNutritionItem = () => {
    setNutritionItems([...nutritionItems, ""]);
  };

  const removeNutritionItem = (index: number) => {
    if (nutritionItems.length <= 1) return;
    const updated = nutritionItems.filter((_, i) => i !== index);
    setNutritionItems(updated);
  };

  const updateNutritionItem = (index: number, value: string) => {
    const updated = [...nutritionItems];
    updated[index] = value;
    setNutritionItems(updated);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedMotherId) {
      newErrors.mother = t("dashboard.nutrition_page.select_mother_first");
    }

    const filledItems = nutritionItems.filter((item) => item.trim());
    if (filledItems.length === 0) {
      newErrors.nutrition = t("dashboard.nutrition_page.add_nutrition_first");
    }

    if (!balvitaPackets || parseInt(balvitaPackets, 10) <= 0) {
      newErrors.balvita = t("dashboard.nutrition_page.balvita_required");
    }

    if (!selectedChildId || !childInfo) {
      newErrors.child = t("dashboard.nutrition_page.child_not_found");
    }

    if (!childAgeGroup) {
      newErrors.childAgeGroup = t(
        "dashboard.nutrition_page.select_mother_first",
      );
    }

    if (!timesPerMonth) {
      newErrors.timesPerMonth = t(
        "dashboard.nutrition_page.select_mother_first",
      );
    }

    if (isLimitReached) {
      newErrors.timesPerMonth = t("dashboard.nutrition_page.already_given");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const filledItems = nutritionItems.filter((item) => item.trim());

      await saveChildNutrition({
        mother: selectedMotherId,
        child: childInfo!.id,
        nutrition_names: filledItems,
        balvita_packets: parseInt(balvitaPackets, 10),
        child_age_group: childAgeGroup,
        times_per_month: parseInt(timesPerMonth, 10),
      });
      router.back();
      showToast(t("dashboard.nutrition_page.success"));
      setSelectedMotherId("");
      setSelectedChildId("");
      setChildOptions([]);
      setChildInfo(null);
      setChildAgeGroup("");
      setTimesPerMonth("");
      setExistingCount(0);
      setMaxTimesForAge(0);
      setIsLimitReached(false);
      setNutritionItems([""]);
      setBalvitaPackets("");
      setErrors({});
    } catch (e) {
      console.error("Error saving nutrition record:", e);
      showToast(t("dashboard.nutrition_page.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 40 }}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <CustomHeader
        title={t("dashboard.nutrition_page.title")}
        // subtitle={t("dashboard.nutrition_page.subtitle")}
        rightNode={
          <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
            <Apple size={22} color="#059669" strokeWidth={2} />
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ paddingVertical: 20, paddingHorizontal: 15, gap: 20 }}>
            <ProfilePicker
              label={t("dashboard.nutrition_page.select_mother")}
              subtitle={t("dashboard.nutrition_page.mother_subtitle")}
              required
              placeholder={t(
                "dashboard.nutrition_page.select_mother_placeholder",
              )}
              selectedValue={selectedMotherId}
              onValueChange={handleMotherChange}
              options={motherOptions}
              isSearchable={true}
              error={errors.mother}
            />

            {loading && <View className="h-10 bg-slate-100 rounded-xl" />}

            {selectedMotherId && childOptions.length > 0 && (
              <View className="-mt-6">
                <ProfilePicker
                  label={t("newborn_death_modal.choose_baby")}
                  required
                  placeholder={t("newborn_death_modal.choose_baby_placeholder")}
                  selectedValue={selectedChildId}
                  onValueChange={handleChildChange}
                  options={childOptions}
                  isSearchable={false}
                  error={errors.child}
                />
              </View>
            )}

            {selectedMotherId && childOptions.length === 0 && (
              <View className="bg-rose-50 rounded-xl p-4 border border-rose-200 -mt-6">
                <Text className="text-rose-700 text-sm font-medium">
                  {t("dashboard.nutrition_page.child_not_found")}
                </Text>
              </View>
            )}

            <View className="-mt-6">
              <ProfilePicker
                label={t("dashboard.nutrition_page.child_age_group")}
                required
                placeholder={t(
                  "dashboard.nutrition_page.child_age_group_placeholder",
                )}
                selectedValue={childAgeGroup}
                onValueChange={handleAgeGroupChange}
                options={ageGroupOptions}
                isSearchable={false}
                error={errors.childAgeGroup}
              />
            </View>

            {isLimitReached && (
              <View className="bg-amber-50 rounded-xl p-4 border border-amber-200 -mt-6">
                <Text className="text-amber-700 text-sm font-medium">
                  {t("dashboard.nutrition_page.already_given")} ({existingCount}
                  /{maxTimesForAge})
                </Text>
                <Text className="text-amber-600 text-xs mt-1">
                  {t("dashboard.nutrition_page.times_per_month")}:{" "}
                  {existingCount}
                </Text>
              </View>
            )}

            <View className="-mt-6">
              <ProfilePicker
                label={t("dashboard.nutrition_page.times_per_month")}
                required
                placeholder={t(
                  "dashboard.nutrition_page.times_per_month_placeholder",
                )}
                selectedValue={timesPerMonth}
                onValueChange={(value) => {
                  setTimesPerMonth(value);
                  setErrors({ ...errors, timesPerMonth: "" });
                }}
                options={getTimesOptions(childAgeGroup, existingCount)}
                isSearchable={false}
                disabled={isLimitReached}
                error={errors.timesPerMonth}
              />
            </View>

            <Text className="text-slate-800 text-[17px] -mt-6 font-semibold">
              {t("dashboard.nutrition_page.nutrition_names")}
            </Text>

            {errors.nutrition && (
              <Text className="text-rose-500 text-xs ml-1 font-semibold">
                {errors.nutrition}
              </Text>
            )}

            <View style={{ gap: 10 }} className="-mt-4">
              {nutritionItems.map((item, index) => (
                <View key={index} className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <TextInput
                      className="h-14 bg-white border border-slate-200 rounded-xl px-4 text-slate-800 text-[16px]"
                      placeholder={t(
                        "dashboard.nutrition_page.nutrition_placeholder",
                      )}
                      placeholderTextColor="#94a3b8"
                      value={item}
                      onChangeText={(val) => updateNutritionItem(index, val)}
                    />
                  </View>
                  {nutritionItems.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeNutritionItem(index)}
                      className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center"
                    >
                      <Trash2 size={16} color="#E11D48" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={addNutritionItem}
              className="flex-row items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50"
            >
              <Plus size={18} color="#059669" strokeWidth={3} />
              <Text className="text-emerald-700 font-semibold text-[15px]">
                {t("dashboard.nutrition_page.add_nutrition")}
              </Text>
            </TouchableOpacity>

            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-slate-800 font-medium text-[16px] ml-1">
                  {t("dashboard.nutrition_page.balvita_packets")}
                  <Text className="text-red-500"> *</Text>
                </Text>
              </View>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={() =>
                    setBalvitaPackets((prev) =>
                      String(Math.max(0, (parseInt(prev, 10) || 0) - 1)),
                    )
                  }
                  className="w-12 h-12 rounded-full bg-rose-100 items-center justify-center"
                >
                  <Minus size={22} color="#E11D48" strokeWidth={3} />
                </TouchableOpacity>
                <View className="flex-1">
                  <TextInput
                    className={`h-14 rounded-xl px-4 border text-center text-slate-800 text-[18px] font-bold ${
                      errors.balvita
                        ? "border-rose-400 bg-rose-50"
                        : "border-slate-200 bg-white"
                    }`}
                    value={balvitaPackets}
                    onChangeText={(val) => {
                      const cleaned = val.replace(/[^0-9]/g, "");
                      setBalvitaPackets(cleaned);
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setBalvitaPackets((prev) =>
                      String((parseInt(prev, 10) || 0) + 1),
                    )
                  }
                  className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center"
                >
                  <Plus size={22} color="#059669" strokeWidth={3} />
                </TouchableOpacity>
              </View>
              {errors.balvita && (
                <Text className="text-rose-500 text-xs mt-1.5 ml-1 font-semibold">
                  {errors.balvita}
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleSave}
              isLoading={saving}
              title={
                saving
                  ? t("dashboard.nutrition_page.saving")
                  : t("dashboard.nutrition_page.save")
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
