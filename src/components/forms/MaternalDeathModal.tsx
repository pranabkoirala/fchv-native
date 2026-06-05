import { Calendar, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaternalDeath } from "../../hooks/database/models/MaternalDeathModel";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../hooks/database/types/maternalDeathModal";
import { Button } from "../button";

interface MaternalDeathModalProps {
  visible: boolean;
  onClose: () => void;
  record: HmisRecordStoreType;
  onSuccess: (updatedDeath: MaternalDeathStoreType) => void;
  showToast: (msg: string) => void;
}

export default function MaternalDeathModal({ visible, onClose, record, onSuccess, showToast }: MaternalDeathModalProps) {
  const { t } = useTranslation();

  // Form values
  const [deathCondition, setDeathCondition] = useState('');
  const [deathConditionOther, setDeathConditionOther] = useState('');
  const [deathPlace, setDeathPlace] = useState('');
  const [deathPlaceOther, setDeathPlaceOther] = useState('');
  const [childCondition, setChildCondition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deathDay, setDeathDay] = useState(new Date().getDate());
  const [deathMonth, setDeathMonth] = useState(new Date().getMonth() + 1);
  const [deathYear, setDeathYear] = useState(new Date().getFullYear());

  const getAdString = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const toNepali = (y: number, m: number, d: number) => {
    try { return AdToBs(getAdString(y, m, d)); } catch { return getAdString(y, m, d); }
  };

  // Inline errors
  const [errDeathCondition, setErrDeathCondition] = useState(false);
  const [errDeathConditionOther, setErrDeathConditionOther] = useState(false);
  const [errDeathPlace, setErrDeathPlace] = useState(false);
  const [errDeathPlaceOther, setErrDeathPlaceOther] = useState(false);
  const [errChildCondition, setErrChildCondition] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSaveMaternalDeath = async () => {
    let hasError = false;

    if (!deathCondition) { setErrDeathCondition(true); hasError = true; } else { setErrDeathCondition(false); }
    if (deathCondition === 'Other' && !deathConditionOther.trim()) { setErrDeathConditionOther(true); hasError = true; } else { setErrDeathConditionOther(false); }
    if (!deathPlace) { setErrDeathPlace(true); hasError = true; } else { setErrDeathPlace(false); }
    if (deathPlace === 'Other' && !deathPlaceOther.trim()) { setErrDeathPlaceOther(true); hasError = true; } else { setErrDeathPlaceOther(false); }
    if (!childCondition) { setErrChildCondition(true); hasError = true; } else { setErrChildCondition(false); }

    if (hasError) return;

    try {
      setSubmitting(true);
      const payload = {
        mother_id: record.id,
        serial_no: record.serial_no,
        mother_name: record.mother_name,
        mother_age: record.mother_age,
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

      // Reset form fields
      setDeathCondition('');
      setDeathConditionOther('');
      setDeathPlace('');
      setDeathPlaceOther('');
      setChildCondition('');
      setDeathDay(new Date().getDate());
      setDeathMonth(new Date().getMonth() + 1);
      setDeathYear(new Date().getFullYear());
      setRemarks('');

      // Reset errors
      setErrDeathCondition(false);
      setErrDeathConditionOther(false);
      setErrDeathPlace(false);
      setErrDeathPlaceOther(false);
      setErrChildCondition(false);

      onSuccess(savedRecord);
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert(t("maternal_death_modal.error_title"), t("maternal_death_modal.error"));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper: renders a field label row
  const FieldLabel = ({ label, hasError, required = true }: { label: string; hasError: boolean; required?: boolean }) => (
    <View className="flex-row items-center mb-2.5">
      <Text className="text-[16px] text-slate-700 font-semibold">{label}</Text>
      {required && <Text className="text-red-500 ml-1">*</Text>}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm">
          <View>
            <Text className="text-slate-800 text-xl font-semibold">{t("maternal_death_modal.title")}</Text>
          </View>
          <Pressable onPress={onClose} className="bg-slate-50 p-2 rounded-full border border-slate-100">
            <X size={20} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="px-5 flex-1 mt-5">
          <View className="gap-y-6 pb-8">

            {/* Death Date */}
            <View>
              <FieldLabel label={t("maternal_death_modal.date_of_death")} hasError={false} />
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl flex-row items-center justify-between shadow-sm shadow-slate-100"
              >
                <View className="flex-row items-center">
                  <Text className="text-slate-800 text-[16px] font-medium">
                    {toNepali(deathYear, deathMonth, deathDay)}
                  </Text>
                </View>
                <View className="bg-blue-50 p-2 rounded-full">
                  <Calendar size={18} color="#0056D2" />
                </View>
              </Pressable>
              <CalendarPicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={(bsDate) => {
                  setShowDatePicker(false);
                  try {
                    const adDate = BsToAd(bsDate);
                    const parts = adDate.split('-');
                    setDeathYear(parseInt(parts[0], 10));
                    setDeathMonth(parseInt(parts[1], 10));
                    setDeathDay(parseInt(parts[2], 10));
                  } catch (e) { console.error(e); }
                }}
                language="np"
                theme="light"
                brandColor="#0056D2"
                date={toNepali(deathYear, deathMonth, deathDay)}
                dayTextStyle={{ fontWeight: 'normal' }}
                weekTextStyle={{ fontWeight: 'normal' }}
                titleTextStyle={{ fontWeight: 'normal' }}
              />
            </View>

            {/* Condition of Death */}
            <View>
              <FieldLabel label={t("maternal_death_modal.condition_of_death")} hasError={errDeathCondition} />
              <View className="mt-1 gap-4 flex-row flex-wrap ">
                {[
                  { value: 'Pregnant', label: t("maternal_death_modal.pregnant") },
                  { value: 'Labor', label: t("maternal_death_modal.labor") },
                  { value: 'Post_delivery', label: t("maternal_death_modal.postpartum") }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeathCondition(c.value); setErrDeathCondition(false); }}
                    className={`w-[46%] p-4 rounded-xl border flex-row items-center ${deathCondition === c.value
                      ? 'bg-primary/5 border-[#475569]'
                      : errDeathCondition ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${deathCondition === c.value ? 'border-[#475569]' : errDeathCondition ? 'border-red-300' : 'border-slate-300'
                      }`}>
                      {deathCondition === c.value && <View className="w-2.5 h-2.5 rounded-full bg-[#475569]" />}
                    </View>
                    <Text className={`text-[16px] font-medium ${deathCondition === c.value ? 'text-[#475569]' : 'text-slate-700'
                      }`}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Death Place */}
            <View>
              <FieldLabel label={t("maternal_death_modal.place_of_death")} hasError={errDeathPlace} />
              <View className="mt-1 gap-4 flex-row flex-wrap ">
                {[
                  { value: 'Home', label: t("maternal_death_modal.home") },
                  { value: 'Institution', label: t("maternal_death_modal.institution") },
                  { value: 'Other', label: t("maternal_death_modal.other") }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setDeathPlace(c.value); setErrDeathPlace(false); }}
                    className={`w-[46%] p-4 rounded-xl border flex-row items-center ${deathPlace === c.value
                      ? 'bg-primary/5 border-[#475569]'
                      : errDeathPlace ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${deathPlace === c.value ? 'border-[#475569]' : errDeathPlace ? 'border-red-300' : 'border-slate-300'
                      }`}>
                      {deathPlace === c.value && <View className="w-2.5 h-2.5 rounded-full bg-[#475569]" />}
                    </View>
                    <Text className={`text-[16px] font-medium ${deathPlace === c.value ? 'text-[#475569]' : 'text-slate-700'
                      }`}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
              {deathPlace === 'Other' && (
                <View className="mt-3">
                  <TextInput
                    placeholder={t("maternal_death_modal.specify_place")}
                    className={`bg-white border p-4 rounded-xl text-slate-800 text-[16px] ${errDeathPlaceOther ? 'border-red-400' : 'border-slate-200'
                      }`}
                    onChangeText={(v) => { setDeathPlaceOther(v); if (v.trim()) setErrDeathPlaceOther(false); }}
                    value={deathPlaceOther}
                  />
                  {errDeathPlaceOther && (
                    <Text className="text-red-500 text-[12px] mt-1.5 ml-1">{t("maternal_death_modal.specify_place_error")}</Text>
                  )}
                </View>
              )}
            </View>

            {/* Child Condition */}
            <View>
              <FieldLabel label={t("maternal_death_modal.child_condition")} hasError={errChildCondition} />
              <View className="mt-1 flex-row gap-x-3">
                {[
                  { value: 'Alive', label: t("maternal_death_modal.child_alive") },
                  { value: 'Dead', label: t("maternal_death_modal.child_dead") }
                ].map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => { setChildCondition(c.value); setErrChildCondition(false); }}
                    className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center ${childCondition === c.value
                      ? 'bg-primary/5 border-primary'
                      : errChildCondition ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                      }`}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 border-primary`}>
                      {childCondition === c.value && (
                        <View className={`w-2.5 h-2.5 rounded-full bg-primary`} />
                      )}
                    </View>
                    <Text className={`text-[16px] font-medium ${childCondition === c.value
                      ? 'text-primary'
                      : 'text-slate-700'
                      }`}>{c.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Remarks */}
            <View>
              <FieldLabel label={t("maternal_death_modal.remarks")} hasError={false} required={false} />
              <TextInput
                placeholder={t("maternal_death_modal.remarks_placeholder")}
                className="bg-white border border-slate-200 p-4 rounded-xl text-slate-800 min-h-[100px] text-[16px]"
                multiline
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                onChangeText={setRemarks}
                value={remarks}
              />
            </View>

          </View>
        </ScrollView>

        {/* Footer / Submit */}
        <View className="p-5 bg-white border-t border-slate-100">

          <Button
            onPress={handleSaveMaternalDeath}
            isLoading={submitting}
            title={t("maternal_death_modal.save")}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
