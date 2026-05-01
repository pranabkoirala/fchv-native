import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { Baby, Calendar, Info, Save } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { getAllMothersList, getMotherProfile, MotherListDbItem } from "../hooks/database/models/MotherModel";
import { createPregnancy } from "../hooks/database/models/PregnantWomenModal";
import { useToast } from "../context/ToastContext";
import { FieldLabel, BoxInput, SelectInput } from "./FormElements";
import { Button } from "./button";
import InputField from "./InputField";

export default function PregnancyForm({ id, onSwitchToMother }: { id?: string, onSwitchToMother?: () => void }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [selectedMotherId, setSelectedMotherId] = useState<string>(id || "");
  const [gravida, setGravida] = useState("");
  const [parity, setParity] = useState("");
  const [lmp, setLmp] = useState("");
  const [edd, setEdd] = useState("");
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);

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
    if (id) {
      setSelectedMotherId(id);
      const fetchEditData = async () => {
        try {
          setIsLoading(true);
          const data = await getMotherProfile(id);
          if (data) {
            setGravida(data.gravida || "");
            setParity(data.parity || "");
            setLmp(data.lmp || "");
            setEdd(data.edd || "");
            setPregnancyId(data.pregnancyId || null);
          }
        } catch (e) {
          console.error("error fetching pregnancy profile", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEditData();
    }
  }, [id]);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const calcEDD = (d: Date) => {
    const e = new Date(d);
    e.setDate(e.getDate() + 280);
    return formatDate(e);
  };

  const onLmpChange = (_: any, selected?: Date) => {
    setShowLmpPicker(false);
    if (selected) {
      setLmp(formatDate(selected));
      setEdd(calcEDD(selected));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMotherId) e.motherId = "Please select a mother";
    if (!gravida.trim()) e.gravida = "Gravida is required";
    if (!parity.trim()) e.parity = "Parity is required";
    if (!lmp) e.lmp = "LMP date is required";
    
    if (gravida.trim() && parity.trim()) {
      const g = parseInt(gravida, 10);
      const p = parseInt(parity, 10);
      if (p > g) {
        e.parity = "Parity cannot be greater than Gravida";
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
      await createPregnancy({
        id: pregnancyId || Crypto.randomUUID(),
        mother_id: selectedMotherId,
        gravida: parseInt(gravida) || 0,
        parity: parseInt(parity) || 0,
        lmp_date: lmp,
        expected_delivery_date: edd,
        is_current: true,
        selected: true,
      });
      
      showToast("Pregnancy details saved successfully");
      router.back();
    } catch (err) {
      console.error("Error saving form:", err);
      showToast("Failed to save pregnancy data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <View className="mb-6 mt-2">
        <Text className="text-[#1E293B] font-black text-2xl mb-1">Pregnancy Details</Text>
        <Text className="text-gray-500 text-[13px] font-medium leading-5">
          Please enter the correct obstetric history and timeline information below for accurate tracking.
        </Text>
      </View>

      <View className="mb-6">
        <FieldLabel label="Select Mother" />
        <SelectInput
          label="Select Mother"
          placeholder={isLoading ? "Loading mothers..." : "Choose a mother"}
          value={selectedMotherId}
          disabled={!!id}
          options={mothers.length > 0 ? mothers.map(m => ({ value: m.id, label: `${m.name} (${m.ward})` })) : (id ? [{value: id, label: "Loading..."}] : [])}
          onSelect={(val: string) => {
            setSelectedMotherId(val);
            setErrors({ ...errors, motherId: "" });
          }}
          error={errors.motherId}
        />
      </View>

      <View className="bg-white rounded-3xl p-5 mb-6 border border-gray-100 shadow-sm shadow-gray-200/40">
        <View className="flex-row items-center mb-6">
          <View className="bg-orange-50 w-11 h-11 rounded-2xl items-center justify-center mr-3 border border-orange-100">
            <Baby size={22} color="#F97316" strokeWidth={2.5} />
          </View>
          <View>
            <Text className="text-[#1E293B] font-bold text-lg">Obstetric History</Text>
            <Text className="text-gray-400 text-xs font-medium mt-0.5">Gravida & Parity counts</Text>
          </View>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <FieldLabel label="Gravida" />
            <BoxInput
              placeholder="e.g. 1"
              value={gravida}
              onChangeText={(t) => { setGravida(t.replace(/\D/g, "")); setErrors({ ...errors, gravida: "" }); }}
              keyboardType="numeric"
              error={errors.gravida}
            />
          </View>
          <View className="flex-1">
            <FieldLabel label="Parity" />
            <BoxInput
              placeholder="e.g. 0"
              value={parity}
              onChangeText={(t) => { setParity(t.replace(/\D/g, "")); setErrors({ ...errors, parity: "" }); }}
              keyboardType="numeric"
              error={errors.parity}
            />
          </View>
        </View>
      </View>
      
       <Pressable onPress={() => setShowLmpPicker(true)}>
                  <View pointerEvents="none">
                    <InputField
                      label="LMP Date"
                      subLabel="अन्तिम महिनावारी मिति"
                      placeholder="YYYY-MM-DD"
                      value={lmp}
                      leftIcon={<Calendar size={18} color="#64748B" />}
                      editable={false}
                      error={errors.lmp}
                    />
                  </View>
                </Pressable>
                {showLmpPicker && (() => {
                  const maxDate = new Date();
                  maxDate.setMonth(maxDate.getMonth() + 9);
      
                  return (
                    <DateTimePicker
                      value={lmp ? new Date(lmp) : new Date()}
                      mode="date"
                      display="spinner"
                      maximumDate={maxDate}
                      onChange={onLmpChange}
                    />
                  );
                })()}

      <Button
        onPress={save}
        isLoading={isLoading}
        title="Save Pregnancy Info"
      />
     
    </>
  );
}
