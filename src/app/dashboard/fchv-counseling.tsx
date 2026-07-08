import { useFocusEffect, useRouter } from "expo-router";
import { Minus, Plus, Trash2, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import CustomHeader from "../../components/CustomHeader";
import { Button } from "../../components/button";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import {
  getFchvCounseling,
  saveFchvCounseling,
} from "../../hooks/database/models/FchvCounselingModel";
import { getLocalFchvProfile } from "../../hooks/database/models/FchvProfileModel";
import { FCHV_COUNSELING, FchvCounselingField } from "../../utils/data";

type FormData = Record<string, string | string[]>;

export default function FchvCounselingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [fchvName, setFchvName] = useState("");
  const [fchvId, setFchvId] = useState("");
  const [formData, setFormData] = useState<FormData>({});
  const [originalNameCounts, setOriginalNameCounts] = useState<
    Record<string, number>
  >({});
  const [viewAllModal, setViewAllModal] = useState<{
    visible: boolean;
    title: string;
    names: string[];
  }>({ visible: false, title: "", names: [] });

  useFocusEffect(
    useCallback(() => {
      loadExisting();
      loadProfile();
    }, []),
  );

  const loadProfile = async () => {
    try {
      const profile = await getLocalFchvProfile();
      if (profile) {
        setFchvName(profile.user.name);
        setFchvId(profile.id);
      }
    } catch (e) {
      console.error("Error loading FCHV profile:", e);
    }
  };

  const loadExisting = async () => {
    try {
      const existing = await getFchvCounseling();
      if (existing) {
        setExistingId(existing.id);
        setFchvName(existing.fchv_name || "");
        setFchvId(existing.fchv_id || "");
        if (existing.data) {
          const parsed = JSON.parse(existing.data);
          setFormData(parsed);
          const counts: Record<string, number> = {};
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key])) {
              counts[key] = parsed[key].length;
            }
          }
          setOriginalNameCounts(counts);
        }
      }
    } catch (e) {
      console.error("Error loading FCHV counseling:", e);
    }
  };

  const setValue = (key: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateName = (namesKey: string, index: number, value: string) => {
    const names = [...((formData[namesKey] as string[]) || [])];
    names[index] = value;
    setValue(namesKey, names);
  };

  const removeName = (namesKey: string, countKey: string, index: number) => {
    const names = [...((formData[namesKey] as string[]) || [])];
    names.splice(index, 1);
    setValue(namesKey, names);
    const current = parseInt(formData[countKey] as string, 10) || 0;
    setValue(countKey, String(Math.max(0, current - 1)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveFchvCounseling({
        id: existingId || undefined,
        fchv_name: fchvName || null,
        fchv_id: fchvId || null,
        data: JSON.stringify(formData),
      });

      showToast(t("fchv_counseling.save_success"));
      router.back();
    } catch (error) {
      console.error("Error saving FCHV counseling:", error);
      showToast(t("fchv_counseling.save_failed"));
    } finally {
      setLoading(false);
    }
  };

  const numberFields = FCHV_COUNSELING.filter((f) => f.number && !f.name);
  const nameFields = FCHV_COUNSELING.filter((f) => f.name);

  const pairedFields: {
    count: FchvCounselingField;
    names: FchvCounselingField;
  }[] = [];
  for (let i = 0; i < numberFields.length - 3; i++) {
    pairedFields.push({
      count: numberFields[i],
      names: nameFields[i],
    });
  }

  const standaloneFields = numberFields.slice(-3);

  return (
    <View className="flex-1 bg-white pt-9">
      <CustomHeader title={t("fchv_counseling.page_title")} />

      <KeyboardAwareScrollView
        className="flex-1 px-4 bg-gray-50"
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}
        enableOnAndroid={true}
        extraScrollHeight={100}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Paired fields: count + names list */}
        {pairedFields.map(({ count, names }) => {
          const countVal = parseInt(formData[count.key] as string, 10) || 0;
          const allNames = (formData[names.key] as string[]) || [];
          const originalCount = originalNameCounts[names.key] || 0;

          // Saved names from a previous session (read-only chips)
          const oldNames = allNames.slice(0, originalCount);
          // How many new slots the user has added this session via +
          const newSlotsCount = Math.max(0, countVal - originalCount);

          const increment = () => {
            setValue(count.key, String(countVal + 1));
            // Append a blank entry to keep names array in sync with count
            const currentNames = (formData[names.key] as string[]) || [];
            setValue(names.key, [...currentNames, ""]);
          };

          const decrement = () => {
            if (countVal <= 0) return;
            const newCount = countVal - 1;
            // Never go below the number of originally-saved names
            if (newCount < originalCount) return;
            setValue(count.key, String(newCount));
            const currentNames = [...((formData[names.key] as string[]) || [])];
            if (currentNames.length > originalCount) {
              currentNames.pop();
              setValue(names.key, currentNames);
            }
          };

          const showSection = countVal > 0 || oldNames.length > 0;

          // Show only last 2 old names inline; rest behind "+N more"
          const displayedOld = oldNames.slice(-2);
          const remainingOld = oldNames.slice(0, -2);

          return (
            <View
              key={count.key}
              className="bg-white rounded-2xl p-4 mb-4 border border-slate-100"
            >
              {/* Field label */}
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-5 bg-primary rounded-full mr-2" />
                <Text className="text-slate-800 font-semibold text-[15px] flex-1">
                  {t("fchv_counseling.field_labels." + count.key)}
                </Text>
              </View>

              {/* +/- counter row — only interaction allowed */}
              <View className="flex-row items-center justify-center h-14 rounded-xl border border-slate-200 bg-white px-4">
                <TouchableOpacity
                  onPress={decrement}
                  disabled={countVal <= originalCount}
                  className={`w-10 h-10 rounded-full items-center justify-center ${countVal <= originalCount ? "bg-slate-50" : "bg-slate-100"}`}
                >
                  <Minus
                    size={20}
                    color={countVal <= originalCount ? "#cbd5e1" : "#475569"}
                  />
                </TouchableOpacity>

                <Text className="flex-1 text-slate-800 text-xl font-semibold text-center mx-2">
                  {countVal}
                </Text>

                <TouchableOpacity
                  onPress={increment}
                  className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                >
                  <Plus size={20} color="#0891b2" />
                </TouchableOpacity>
              </View>

              {/* Names section — read-only display only */}
              {showSection && (
                <>
                  <View className=" bg-slate-50 my-3" />
                  <Text className="text-slate-500 font-medium text-[13px] mb-2">
                    {t("fchv_counseling.field_labels." + names.key)}
                  </Text>

                  {/* Previously saved name chips */}
                  {oldNames.length > 0 && (
                    <View className="flex-row flex-wrap items-center gap-2 mb-2">
                      {displayedOld.map((name, idx) => (
                        <View
                          key={`old-${idx}`}
                          className="bg-slate-100 rounded-full px-3 py-1.5 flex-row items-center gap-1"
                        >
                          <Text className="text-slate-400 text-[11px] font-medium">
                            {remainingOld.length + idx + 1}.
                          </Text>
                          <Text className="text-slate-600 text-[13px]">
                            {name || "—"}
                          </Text>
                        </View>
                      ))}
                      {remainingOld.length > 0 && (
                        <TouchableOpacity
                          onPress={() =>
                            setViewAllModal({
                              visible: true,
                              title: t(
                                "fchv_counseling.field_labels." + names.key,
                              ),
                              names: oldNames,
                            })
                          }
                          className="bg-primary/10 rounded-full px-3 py-1.5"
                        >
                          <Text className="text-primary text-[11px]">
                            +{remainingOld.length}{" "}
                            {t("fchv_counseling.more", "more")}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* New name slots — editable TextInput per person added */}
                  {newSlotsCount > 0 && (
                    <View className="gap-y-2">
                      {Array.from({ length: newSlotsCount }).map((_, idx) => {
                        const realIdx = originalCount + idx;
                        const name = allNames[realIdx] ?? "";
                        return (
                          <View
                            key={`new-${idx}`}
                            className="flex-row items-center gap-2"
                          >
                            <View className="flex-1 h-12 flex-row items-center border border-slate-200 rounded-xl px-3 bg-white">
                              <Text className="text-slate-400 text-[13px] font-medium mr-2">
                                {realIdx + 1}.
                              </Text>
                              <TextInput
                                className="flex-1 text-slate-800 text-[15px]"
                                placeholder={t(
                                  "fchv_counseling.enter_name",
                                  "Enter name",
                                )}
                                placeholderTextColor="#94a3b8"
                                value={name}
                                onChangeText={(v) =>
                                  updateName(names.key, realIdx, v)
                                }
                              />
                            </View>
                            <TouchableOpacity
                              onPress={() =>
                                removeName(names.key, count.key, realIdx)
                              }
                              className="w-10 h-10 rounded-full bg-rose-50 items-center justify-center"
                            >
                              <Trash2 size={16} color="#E11D48" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}

        {/* Standalone number-only fields (no names) */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
          <View className="flex-row items-center mb-3">
            <View className="w-1 h-5 bg-primary rounded-full mr-2" />
            <Text className="text-slate-800 font-semibold text-[15px] flex-1">
              {t("fchv_counseling.additional_information")}
            </Text>
          </View>
          {standaloneFields.map((field) => {
            const fieldVal = parseInt(formData[field.key] as string, 10) || 0;
            return (
              <View key={field.key} className="mb-4">
                <Text className="text-slate-700 font-medium text-[14px] mb-2">
                  {t("fchv_counseling.field_labels." + field.key)}
                </Text>
                <View className="flex-row items-center justify-center h-14 rounded-xl border border-slate-200 bg-white px-4">
                  <TouchableOpacity
                    onPress={() => {
                      if (fieldVal <= 0) return;
                      setValue(field.key, String(fieldVal - 1));
                    }}
                    disabled={fieldVal <= 0}
                    className={`w-10 h-10 rounded-full items-center justify-center ${fieldVal <= 0 ? "bg-slate-50" : "bg-slate-100"}`}
                  >
                    <Minus
                      size={20}
                      color={fieldVal <= 0 ? "#cbd5e1" : "#475569"}
                    />
                  </TouchableOpacity>
                  <TextInput
                    className="flex-1 text-slate-800 text-xl font-semibold text-center mx-2"
                    keyboardType={
                      field.key === "fchv_fund_amount"
                        ? "decimal-pad"
                        : "numeric"
                    }
                    placeholder="0"
                    placeholderTextColor="#cbd5e1"
                    value={String(formData[field.key] ?? "")}
                    onChangeText={(v) => setValue(field.key, v)}
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    onPress={() => setValue(field.key, String(fieldVal + 1))}
                    className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                  >
                    <Plus size={20} color="#0891b2" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <Button
          title={
            existingId ? t("fchv_counseling.update") : t("fchv_counseling.save")
          }
          onPress={handleSave}
          isLoading={loading}
        />
      </KeyboardAwareScrollView>

      {/* View-all modal for saved names overflow */}
      <Modal
        visible={viewAllModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setViewAllModal((p) => ({ ...p, visible: false }))
        }
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-h-[70%] p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-slate-800 font-semibold text-[17px] flex-1 mr-2"
                numberOfLines={1}
              >
                {viewAllModal.title}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setViewAllModal((p) => ({ ...p, visible: false }))
                }
                className="p-1"
              >
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {viewAllModal.names.map((name, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center py-3 px-3 border-b border-slate-50"
                >
                  <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <Text className="text-primary text-[13px] font-semibold">
                      {idx + 1}
                    </Text>
                  </View>
                  <Text className="text-slate-700 text-[15px] flex-1">
                    {name || "—"}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
