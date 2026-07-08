import { Minus, Plus, Trash2, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BoxInput } from "./FormElements";
import { Button } from "./button";
import { FCHV_COUNSELING, FchvCounselingField } from "../utils/data";
import {
  getFchvCounseling,
  saveFchvCounseling,
} from "../hooks/database/models/FchvCounselingModel";

type FormData = Record<string, string | string[]>;

export default function FchvCounseling({
  onClose,
  showToast,
}: {
  onClose: () => void;
  showToast: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [fchvName, setFchvName] = useState("");
  const [fchvId, setFchvId] = useState("");
  const [formData, setFormData] = useState<FormData>({});
  const [originalNameCounts, setOriginalNameCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    loadExisting();
  }, []);

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

  const addName = (key: string) => {
    const names = (formData[key] as string[]) || [];
    setValue(key, [...names, ""]);
  };

  const updateName = (key: string, index: number, value: string) => {
    const names = [...((formData[key] as string[]) || [])];
    names[index] = value;
    setValue(key, names);
  };

  const removeName = (key: string, index: number) => {
    const names = [...((formData[key] as string[]) || [])];
    names.splice(index, 1);
    if (names.length === 0) {
      const updated = { ...formData };
      delete updated[key];
      setFormData(updated);
    } else {
      setValue(key, names);
    }
  };

  const updateCount = (countKey: string, namesKey: string, newVal: number) => {
    const min = originalNameCounts[namesKey] || 0;
    const clamped = Math.max(min, newVal);
    setFormData((prev) => {
      const currentNames = (prev[namesKey] as string[]) || [];
      const updated: FormData = { ...prev, [countKey]: String(clamped) };
      if (clamped > currentNames.length) {
        updated[namesKey] = [
          ...currentNames,
          ...Array(clamped - currentNames.length).fill(""),
        ];
      } else if (clamped < currentNames.length) {
        updated[namesKey] = currentNames.slice(0, clamped);
      }
      return updated;
    });
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

      showToast("FCHV Counseling saved successfully");
      onClose();
    } catch (error) {
      console.error("Error saving FCHV counseling:", error);
      showToast("Error saving FCHV counseling");
    } finally {
      setLoading(false);
    }
  };

  const numberFields = FCHV_COUNSELING.filter((f) => f.number && !f.name);
  const nameFields = FCHV_COUNSELING.filter((f) => f.name);
  const standaloneFields = numberFields.slice(-3);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-50"
    >
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-slate-100">
        <Text className="text-xl font-semibold text-slate-800">
          FCHV Counseling
        </Text>
        <Pressable
          onPress={onClose}
          className="p-2 bg-slate-100 rounded-full"
        >
          <X size={20} color="#64748B" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 16 }}
      >
        <View className="bg-white rounded-2xl p-4 mb-5 border border-slate-100">
          <Text className="text-slate-800 font-semibold text-[17px] mb-3">
            FCHV Details
          </Text>
          <BoxInput
            label="FCHV Name"
            placeholder="Enter FCHV name"
            value={fchvName}
            onChangeText={setFchvName}
          />
          <BoxInput
            label="FCHV ID"
            placeholder="Enter FCHV ID"
            value={fchvId}
            onChangeText={setFchvId}
          />
        </View>

        {pairedFields.map(({ count, names }) => (
          <View
            key={count.key}
            className="bg-white rounded-2xl p-4 mb-4 border border-slate-100"
          >
            <View className="flex-row items-center mb-3">
              <View className="w-1 h-5 bg-primary rounded-full mr-2" />
              <Text className="text-slate-800 font-semibold text-[15px] flex-1">
                {count.en}
              </Text>
            </View>
            <View className="mb-4">
              <Text className="text-slate-800 font-medium text-[16px] mb-1.5 ml-1">
                {count.ne}
              </Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={() =>
                    updateCount(
                      count.key,
                      names.key,
                      (parseInt(formData[count.key] as string, 10) || 0) - 1,
                    )
                  }
                  className="w-12 h-12 rounded-full bg-rose-100 items-center justify-center"
                >
                  <Minus size={22} color="#E11D48" strokeWidth={3} />
                </TouchableOpacity>
                <View className="flex-1">
                  <View className="h-14 rounded-xl px-4 border border-slate-200 bg-white items-center justify-center">
                    <TextInput
                      className="text-slate-800 text-[18px] font-bold text-center w-full h-full"
                      value={String(formData[count.key] ?? "0")}
                      editable={false}
                      placeholder="0"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    updateCount(
                      count.key,
                      names.key,
                      (parseInt(formData[count.key] as string, 10) || 0) + 1,
                    )
                  }
                  className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center"
                >
                  <Plus size={22} color="#059669" strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </View>
            <View className="h-px bg-slate-100 my-3" />
            <Text className="text-slate-700 font-medium text-[14px] mb-2">
              {names.ne}
            </Text>
            {((formData[names.key] as string[]) || []).map((name, idx) => (
              <View key={idx} className="flex-row items-center mb-2">
                <View className="flex-1 h-12 border border-slate-200 rounded-xl px-4 bg-white flex-row items-center">
                  <Text className="text-slate-400 mr-2 text-sm">
                    {idx + 1}.
                  </Text>
                  <TextInput
                    className="flex-1 text-slate-800 text-[15px]"
                    placeholder="Enter name"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={(t) => updateName(names.key, idx, t)}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => removeName(names.key, idx)}
                  className="ml-2 p-2"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => addName(names.key)}
              className="flex-row items-center justify-center h-11 border border-dashed border-primary rounded-xl mt-1"
            >
              <Plus size={18} color="#475569" />
              <Text className="text-slate-700 font-medium ml-2">
                Add Name
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-100">
          <View className="flex-row items-center mb-3">
            <View className="w-1 h-5 bg-primary rounded-full mr-2" />
            <Text className="text-slate-800 font-semibold text-[15px] flex-1">
              Additional Information
            </Text>
          </View>
          {standaloneFields.map((field) => (
            <BoxInput
              key={field.key}
              label={field.ne}
              placeholder="0"
              value={String(formData[field.key] ?? "")}
              onChangeText={(t) => setValue(field.key, t)}
              keyboardType={
                field.key === "fchv_fund_amount" ? "decimal-pad" : "numeric"
              }
              helperText={field.en}
            />
          ))}
        </View>

        <Button
          title={existingId ? "Update" : "Save"}
          onPress={handleSave}
          isLoading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
