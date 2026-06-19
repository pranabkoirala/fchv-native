import { InputText } from "@/components/InputText";
import { useLanguage } from "@/context/LanguageContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Clock, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarPicker } from "react-native-nepali-picker";

export type Priority = "URGENT" | "MEDIUM" | "NORMAL";

export type TaskModalData = {
  title: string;
  description?: string | null;
  task_date: string;
  task_time: string;
  patient?: string | null;
  location: string;
  priority: Priority;
};

type TaskModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TaskModalData) => Promise<void> | void;
  initialData?: TaskModalData;
  headerTitle?: string;
  submitLabel?: string;
  submitting?: boolean;
};

const EMPTY_FORM: TaskModalData = {
  title: "",
  description: null,
  task_date: "",
  task_time: "",
  patient: null,
  location: "",
  priority: "NORMAL",
};

function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function parseTimeString(value: string): Date {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return new Date();
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) {
    hours += 12;
  }
  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  const result = new Date();
  result.setHours(hours, minutes, 0, 0);
  return result;
}

export default function TaskModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  headerTitle,
  submitLabel,
  submitting,
}: TaskModalProps) {
  const { language, t } = useLanguage();
  const [form, setForm] = useState<TaskModalData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextForm = {
      ...EMPTY_FORM,
      ...initialData,
      description: initialData?.description ?? null,
      patient: initialData?.patient ?? null,
    };

    setForm(nextForm);
    setErrors({});
    setSelectedTime(
      initialData?.task_time ? parseTimeString(initialData.task_time) : new Date(),
    );
  }, [visible, initialData]);

  const handleChange = (key: keyof TaskModalData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      const nextErrors = { ...errors };
      delete nextErrors[key];
      setErrors(nextErrors);
    }
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      nextErrors.title = t("todo_tasks.title_required");
    }
    if (!form.task_date.trim()) {
      nextErrors.date = t("todo_tasks.date_required");
    }
    if (!form.task_time.trim()) {
      nextErrors.time = t("todo_tasks.time_required");
    }
    if (!form.location.trim()) {
      nextErrors.location = t("todo_tasks.location_required");
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      ...form,
      description: form.description?.trim() || null,
      patient: form.patient?.trim() || null,
      task_date: form.task_date.trim(),
      task_time: form.task_time.trim(),
      location: form.location.trim(),
    });
  };

  const showTimeValue = form.task_time || t("todo_tasks.select_time");
  const showDateValue = form.task_date || t("todo_tasks.select_date");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white pt-5">
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
          <Text className="text-slate-900 text-[19px] font-bold">
            {headerTitle || t("todo_tasks.add_task")}
          </Text>
          <Pressable
            onPress={onClose}
            className="bg-slate-50 p-2 rounded-full border border-slate-100"
          >
            <X size={20} color="#64748B" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="px-5 flex-1 mt-5"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="gap-y-1 pb-8">
              <InputText
                label={t("todo_tasks.task_title") + " *"}
                placeholder={t("todo_tasks.task_title_ph")}
                value={form.title}
                onChangeText={(value) => handleChange("title", value)}
                errors={errors}
                setErrors={setErrors}
                errorKey="title"
              />

              <View className="flex-row gap-x-4 mb-4">
                <View className="flex-1">
                  <Text className="text-[16px] text-slate-700 font-semibold mb-2.5">
                    {t("todo_tasks.date")} *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className={`bg-white border rounded-md px-4 py-3 h-[50px] flex-row items-center justify-between ${errors.date ? "border-rose-300" : "border-slate-200"}`}
                  >
                    <Text className={`text-[15px] ${form.task_date ? "text-slate-800" : "text-slate-400"}`}>
                      {showDateValue}
                    </Text>
                    <Calendar size={18} color="#64748B" />
                  </TouchableOpacity>
                  {errors.date && (
                    <Text className="text-rose-500 text-[12px] mt-1 ml-1">
                      {errors.date}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[16px] text-slate-700 font-semibold mb-2.5">
                    {t("todo_tasks.time")} *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    className={`bg-white border rounded-md px-4 py-3 h-[50px] flex-row items-center justify-between ${errors.time ? "border-rose-300" : "border-slate-200"}`}
                  >
                    <Text className={`text-[15px] ${form.task_time ? "text-slate-800" : "text-slate-400"}`}>
                      {showTimeValue}
                    </Text>
                    <Clock size={18} color="#64748B" />
                  </TouchableOpacity>
                  {errors.time && (
                    <Text className="text-rose-500 text-[12px] mt-1 ml-1">
                      {errors.time}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <InputText
                    label={t("todo_tasks.patient_label")}
                    placeholder={t("todo_tasks.patient_ph")}
                    value={form.patient || ""}
                    onChangeText={(value) => handleChange("patient", value)}
                    errors={errors}
                    setErrors={setErrors}
                    errorKey="patient"
                  />
                </View>
                <View className="flex-1">
                  <InputText
                    label={t("todo_tasks.location") + " *"}
                    placeholder={t("todo_tasks.location_ph")}
                    value={form.location}
                    onChangeText={(value) => handleChange("location", value)}
                    errors={errors}
                    setErrors={setErrors}
                    errorKey="location"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-[14px] text-slate-700 font-semibold mb-2.5">
                  {t("todo_tasks.priority")}
                </Text>
                <View className="flex-row bg-white border border-slate-200 rounded-md overflow-hidden h-[48px]">
                  {(["NORMAL", "MEDIUM", "URGENT"] as Priority[]).map((p) => {
                    const selected = form.priority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => handleChange("priority", p)}
                        className={`flex-1 items-center justify-center ${selected ? "bg-primary" : ""}`}
                      >
                        <Text className={`text-[14px] font-semibold ${selected ? "text-white" : "text-slate-600"}`}>
                          {t(`todo_tasks.priority_levels.${p}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <InputText
                label={t("todo_tasks.description")}
                placeholder={t("todo_tasks.description_ph")}
                value={form.description || ""}
                onChangeText={(value) => handleChange("description", value)}
                errors={errors}
                setErrors={setErrors}
                errorKey="description"
                multiline
                numberOfLines={4}
              />
          <View className="bg-white border-t border-slate-100">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              className={`w-full py-4 flex-row items-center justify-center rounded-md ${submitting ? "bg-slate-300" : "bg-primary"}`}
            >
              <Text className="text-white font-bold text-[16px] tracking-wide">
                {submitLabel || t("todo_tasks.create_task")}
              </Text>
            </TouchableOpacity>
          </View>
            </View>
          </ScrollView>

        </KeyboardAvoidingView>

        <CalendarPicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={(bsDate) => {
            handleChange("task_date", bsDate);
            setShowDatePicker(false);
          }}
          language={language === "np" ? "np" : "en"}
          theme="light"
          brandColor="#0056D2"
          date={form.task_date || undefined}
          dayTextStyle={{ fontWeight: "normal" }}
          weekTextStyle={{ fontWeight: "normal" }}
          titleTextStyle={{ fontWeight: "normal" }}
        />

        {showTimePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                setShowTimePicker(false);
              }
              if (date) {
                setSelectedTime(date);
                handleChange("task_time", formatTime(date));
              }
            }}
          />
        )}

        {showTimePicker && Platform.OS === "ios" && (
          <Modal transparent visible={showTimePicker} animationType="slide">
            <View className="flex-1 justify-end bg-black/30">
              <View className="bg-white p-4 rounded-t-2xl pb-8">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-slate-800">
                    {t("todo_tasks.select_time")}
                  </Text>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text className="text-[#0056D2] font-bold text-base">
                      {t("todo_tasks.done")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={false}
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) {
                      setSelectedTime(date);
                      handleChange("task_time", formatTime(date));
                    }
                  }}
                  style={{ alignSelf: "center", width: "100%" }}
                />
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}
