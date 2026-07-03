import { useFocusEffect, useRouter } from "expo-router";
import { Minus, Plus, Trash2, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
  const [originalNameCounts, setOriginalNameCounts] = useState<Record<string, number>>({});
  const [viewAllModal, setViewAllModal] = useState<{
    visible: boolean;
    title: string;
    names: string[];
  }>({ visible: false, title: "", names: [] });

  useFocusEffect(
    useCallback(() => {
      loadExisting();
      loadProfile();
    }, [])
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

  const getCountKey = (namesKey: string) => namesKey.replace(/_names$/, "_count");

  const setValue = (key: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const addName = (namesKey: string) => {
    const countKey = getCountKey(namesKey);
    const names = (formData[namesKey] as string[]) || [];
    const current = parseInt(formData[countKey] as string, 10) || 0;
    setValue(countKey, String(current + 1));
    setValue(namesKey, [...names, ""]);
  };

  const updateName = (key: string, index: number, value: string) => {
    const names = [...((formData[key] as string[]) || [])];
    names[index] = value;
    setValue(key, names);
  };

  const removeName = (namesKey: string, index: number) => {
    const countKey = getCountKey(namesKey);
    const names = [...((formData[namesKey] as string[]) || [])];
    const current = parseInt(formData[countKey] as string, 10) || 0;
    names.splice(index, 1);
    if (names.length === 0) {
      const updated = { ...formData };
      delete updated[namesKey];
      setFormData(updated);
    } else {
      setValue(namesKey, names);
    }
    setValue(countKey, String(Math.max(0, current - 1)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const nameKeys = FCHV_COUNSELING.filter((f) => f.name).map((f) => f.key);
      const cleaned: Record<string, string | string[]> = {};
      for (const [key, value] of Object.entries(formData)) {
        if (nameKeys.includes(key)) {
          const arr = value as string[];
          cleaned[key] = arr.filter((n) => n.trim() !== "");
        } else {
          cleaned[key] = value;
        }
      }

      await saveFchvCounseling({
        id: existingId || undefined,
        fchv_name: fchvName || null,
        fchv_id: fchvId || null,
        data: JSON.stringify(cleaned),
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white pt-7"
    >
      <CustomHeader title={t("fchv_counseling.page_title")} />

      <ScrollView
        className="flex-1 px-4 bg-gray-50"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 200, paddingTop: 16 }}
      >
        {pairedFields.map(({ count, names }) => {
          const countVal = parseInt(formData[count.key] as string, 10) || 0;
          const showNames = countVal > 0;
          const originalCount = originalNameCounts[names.key] || 0;

          const increment = () => {
            setValue(count.key, String(countVal + 1));
            const currentNames = (formData[names.key] as string[]) || [];
            setValue(names.key, [...currentNames, ""]);
          };

          const decrement = () => {
            if (countVal <= 0) return;
            setValue(count.key, String(countVal - 1));
            const currentNames = [...((formData[names.key] as string[]) || [])];
            currentNames.pop();
            if (currentNames.length === 0) {
              const updated = { ...formData };
              delete updated[names.key];
              setFormData(updated);
            } else {
              setValue(names.key, currentNames);
            }
          };

          return (
            <View
              key={count.key}
              className="bg-white rounded-2xl p-4 mb-4 border border-slate-100"
            >
              <View className="flex-row items-center mb-3">
                <View className="w-1 h-5 bg-primary rounded-full mr-2" />
                <Text className="text-slate-800 font-semibold text-[15px] flex-1">
                  {t("fchv_counseling.field_labels." + count.key)}
                </Text>
              </View>

              <View className="flex-row items-center justify-center h-14 rounded-xl border border-slate-200 bg-white px-4">
                <TouchableOpacity
                  onPress={decrement}
                  className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Minus size={20} color="#475569" />
                </TouchableOpacity>
                <TextInput
                  className="flex-1 text-slate-800 text-xl font-semibold text-center mx-2"
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#cbd5e1"
                  value={String(formData[count.key] ?? "")}
                  onChangeText={(t) => setValue(count.key, t)}
                  selectTextOnFocus
                />
                <TouchableOpacity
                  onPress={increment}
                  className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center"
                >
                  <Plus size={20} color="#0891b2" />
                </TouchableOpacity>
              </View>

              {showNames && (
                <>
                  <View className="h-px bg-slate-100 my-3" />

                  <Text className="text-slate-700 font-medium text-[14px] mb-2">
                    {t("fchv_counseling.field_labels." + names.key)}
                  </Text>

                  {(() => {
                    const allNames = (formData[names.key] as string[]) || [];
                    const oldNames = allNames.slice(0, originalCount);
                    const newNames = allNames.slice(originalCount);
                    const displayedOld = oldNames.slice(-2);
                    const remainingOld = oldNames.slice(0, -2);
                    return (
                      <>
                        <View className="flex-row flex-wrap items-center gap-2 mb-2">
                          {displayedOld.map((name, idx) => (
                            <View key={`old-${idx}`} className="bg-slate-100 rounded-full px-3 py-1.5">
                              <Text className="text-slate-600 text-[13px]">
                                {name}
                              </Text>
                            </View>
                          ))}
                          {remainingOld.length > 0 && (
                            <TouchableOpacity
                              onPress={() =>
                                setViewAllModal({
                                  visible: true,
                                  title: t("fchv_counseling.field_labels." + names.key),
                                  names: oldNames,
                                })
                              }
                            >
                              <Text className="text-primary text-[13px] font-medium">
                                +{remainingOld.length} more
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        {newNames.map((name, idx) => {
                          const realIdx = originalCount + idx;
                          return (
                            <View key={`new-${idx}`} className="flex-row items-center mb-2">
                              <View className="flex-1 h-12 border border-slate-200 rounded-xl px-4 bg-white flex-row items-center">
                                <Text className="text-slate-400 mr-2 text-sm">
                                  {realIdx + 1}.
                                </Text>
                                <TextInput
                                  className="flex-1 text-slate-800 text-[15px]"
                                  placeholder={t("fchv_counseling.enter_name")}
                                  placeholderTextColor="#94a3b8"
                                  value={name}
                                  onChangeText={(t) =>
                                    updateName(names.key, realIdx, t)
                                  }
                                />
                              </View>
                              <TouchableOpacity
                                onPress={() => removeName(names.key, realIdx)}
                                className="ml-2 p-2"
                              >
                                <Trash2 size={18} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </>
                    );
                  })()}

                  <TouchableOpacity
                    onPress={() => addName(names.key)}
                    className="flex-row items-center justify-center h-11 border border-dashed border-primary rounded-xl mt-1"
                  >
                    <Plus size={18} color="#475569" />
                    <Text className="text-slate-700 font-medium ml-2">
                      {t("fchv_counseling.add_name")}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}

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
                      const current = parseInt(formData[field.key] as string, 10) || 0;
                      if (current <= 0) return;
                      setValue(field.key, String(current - 1));
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
                  >
                    <Minus size={20} color="#475569" />
                  </TouchableOpacity>
                  <TextInput
                    className="flex-1 text-slate-800 text-xl font-semibold text-center mx-2"
                    keyboardType={field.key === "fchv_fund_amount" ? "decimal-pad" : "numeric"}
                    placeholder="0"
                    placeholderTextColor="#cbd5e1"
                    value={String(formData[field.key] ?? "")}
                    onChangeText={(t) => setValue(field.key, t)}
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const current = parseInt(formData[field.key] as string, 10) || 0;
                      setValue(field.key, String(current + 1));
                    }}
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
      </ScrollView>
      <Modal
        visible={viewAllModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewAllModal((p) => ({ ...p, visible: false }))}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-h-[70%] p-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-slate-800 font-semibold text-[17px] flex-1 mr-2" numberOfLines={1}>
                {viewAllModal.title}
              </Text>
              <TouchableOpacity
                onPress={() => setViewAllModal((p) => ({ ...p, visible: false }))}
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
                  <Text className="text-slate-700 text-[15px] flex-1">{name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
