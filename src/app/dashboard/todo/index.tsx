import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import TopHeader from "@/components/layout/TopHeader";
import { useRouter } from "expo-router";
import {
  Bell,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Square,
  Clock,
  MapPin,
  Plus,
  X,
  Trash2,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  Layout,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { CalendarPicker } from "react-native-nepali-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  TodoItem,
} from "../../../hooks/database/models/TodoModel";
import { useLanguage } from "../../../context/LanguageContext";
import { useTranslation } from "react-i18next";

type Priority = "URGENT" | "MEDIUM" | "NORMAL";

interface RichTaskData {
  title: string;
  patient?: string;
  time?: string;
  location?: string;
  priority: Priority;
}

// Helper to parse the DB string which could be plain text or JSON
function parseTaskString(raw: string): RichTaskData {
  try {
    const data = JSON.parse(raw);
    if (data && data.title) {
      return data as RichTaskData;
    }
  } catch (e) {
    // ignore
  }
  return {
    title: raw,
    priority: "NORMAL",
  };
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function TasksScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [newTaskPatient, setNewTaskPatient] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("");
  const [newTaskLocation, setNewTaskLocation] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("NORMAL");

  // Time Picker State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await getAllTodos();
      setTodos(data);
    } catch (error) {
      console.error("Failed to load todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTodo = async (id: string, isCompleted: number) => {
    try {
      const newStatus = isCompleted === 1 ? 0 : 1;
      await updateTodo(id, { is_completed: newStatus });
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, is_completed: newStatus } : todo
        )
      );
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const onTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes.toString().padStart(2, '0');
      setNewTaskTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const payload: RichTaskData = {
      title: newTaskTitle.trim(),
      patient: newTaskPatient.trim() || undefined,
      time: newTaskTime.trim() || undefined,
      location: newTaskLocation.trim() || undefined,
      priority: newTaskPriority,
    };

    try {
      // Create todo with new DB schema fields
      const newItem = await createTodo(
        JSON.stringify(payload),
        newTaskDescription.trim() || undefined,
        newTaskDate.trim() || undefined,
        newTaskTime.trim() || undefined
      );
      setTodos([newItem, ...todos]);
      setModalVisible(false);
      
      // Reset form
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskDate("");
      setNewTaskPatient("");
      setNewTaskTime("");
      setNewTaskLocation("");
      setNewTaskPriority("NORMAL");
      setSelectedTime(new Date());
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const stats = useMemo(() => {
    let pending = 0;
    let done = 0;
    let urgent = 0;

    todos.forEach((t) => {
      if (t.is_completed === 1) {
        done++;
      } else {
        pending++;
        const parsed = parseTaskString(t.task);
        if (parsed.priority === "URGENT") {
          urgent++;
        }
      }
    });

    return { pending, done, urgent };
  }, [todos]);

  const renderTitleSection = () => (
    <View className="px-6 pb-4">
      <Animated.Text
        entering={FadeIn.duration(400)}
        className="text-3xl font-bold text-slate-700"
      >
        {t("todo_tasks.title")}
      </Animated.Text>
      
      <Animated.View 
        entering={FadeInDown.delay(100).duration(400)}
        className="flex-row mt-2"
      >
        <View className="bg-emerald-100 px-3 py-1.5 rounded-full flex-row items-center">
          <ClipboardList size={14} color="#059669" strokeWidth={2.5} />
          <Text className="text-emerald-700 text-[12px] font-bold ml-1.5">
            {t("todo_tasks.pending_tasks_today", { count: stats.pending })}
          </Text>
        </View>
      </Animated.View>
    </View>
  );

  const renderSummaryCards = () => (
    <View className="px-6 flex-row justify-between mb-6 gap-3">
      {/* Pending */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(500)}
        className="flex-1 bg-[#E8F3FF] rounded-2xl p-4 items-center"
      >
        <ClipboardList size={26} color="#475569" strokeWidth={2} />
        <Text className="text-[22px] font-black text-slate-700 mt-2">
          {String(stats.pending).padStart(2, "0")}
        </Text>
        <Text className="text-[13px] font-medium text-slate-500 mt-0.5">
          {t("todo_tasks.pending")}
        </Text>
      </Animated.View>

      {/* Done */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(500)}
        className="flex-1 bg-[#D1FAE5] rounded-2xl p-4 items-center"
      >
        <CheckCircle size={26} color="#059669" strokeWidth={2} />
        <Text className="text-[22px] font-black text-emerald-700 mt-2">
          {String(stats.done).padStart(2, "0")}
        </Text>
        <Text className="text-[13px] font-medium text-emerald-600 mt-0.5">
          {t("todo_tasks.done")}
        </Text>
      </Animated.View>

      {/* Urgent */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(500)}
        className="flex-1 bg-[#FFE4E6] rounded-2xl p-4 items-center"
      >
        <AlertCircle size={26} color="#E11D48" strokeWidth={2} />
        <Text className="text-[22px] font-black text-rose-700 mt-2">
          {String(stats.urgent).padStart(2, "0")}
        </Text>
        <Text className="text-[13px] font-medium text-rose-600 mt-0.5">
          {t("todo_tasks.urgent")}
        </Text>
      </Animated.View>
    </View>
  );

  const renderTaskCard = (todo: TodoItem, index: number) => {
    const isDone = todo.is_completed === 1;
    const parsed = parseTaskString(todo.task);
    
    // Priority Badge Styles
    const pStyles: Record<string, { bg: string, text: string }> = {
      URGENT: { bg: "bg-rose-100", text: "text-rose-700" },
      MEDIUM: { bg: "bg-amber-100", text: "text-amber-700" },
      NORMAL: { bg: "bg-emerald-100", text: "text-emerald-700" },
    };
    const pStyle = pStyles[parsed.priority] || pStyles.NORMAL;

    return (
      <Animated.View
        key={todo.id}
        entering={FadeInDown.delay(100 + index * 50).duration(400)}
        layout={Layout.springify()}
        className={`bg-white rounded-2xl p-4 mb-4 border border-slate-100 flex-row ${
          isDone ? "opacity-60" : ""
        }`}
      >
        {/* Checkbox */}
        <TouchableOpacity
          className="mr-3 mt-0.5"
          onPress={() => handleToggleTodo(todo.id, todo.is_completed)}
        >
          {isDone ? (
            <View className="w-6 h-6 rounded-md bg-emerald-500 items-center justify-center">
              <CheckSquare size={16} color="#FFFFFF" strokeWidth={3} />
            </View>
          ) : (
            <View className="w-6 h-6 rounded-md border-2 border-slate-300 bg-slate-50 items-center justify-center" />
          )}
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <Text 
              className={`text-[16px] font-bold flex-1 mr-2 ${
                isDone ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {parsed.title}
            </Text>
            
            {/* Priority Badge */}
            <View className={`px-2 py-0.5 rounded ${pStyle.bg}`}>
              <Text className={`text-[10px] font-bold ${pStyle.text}`}>
                {t(`todo_tasks.priority_levels.${parsed.priority}`)}
              </Text>
            </View>
          </View>

          {todo.description ? (
            <Text className="text-[13px] text-slate-500 font-medium mt-1 mb-1">
              {todo.description}
            </Text>
          ) : null}

          {parsed.patient && (
            <Text className="text-[13px] text-slate-500 font-medium mt-1">
              {t("todo_tasks.patient", { name: parsed.patient })}
            </Text>
          )}

          {/* Metadata Row */}
          <View className="flex-row items-center mt-2.5">
            {todo.task_date && (
              <View className="flex-row items-center mr-4">
                <Text className="text-[12px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
                  {todo.task_date}
                </Text>
              </View>
            )}
            <View className="flex-row items-center mr-4">
              <Clock size={14} color="#64748B" />
              <Text className="text-[12px] text-slate-600 font-medium ml-1.5">
                {todo.task_time || parsed.time || t("todo_tasks.anytime")}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              {isDone ? (
                <>
                  <CheckCircle size={14} color="#64748B" />
                  <Text className="text-[12px] text-slate-600 font-medium ml-1.5">
                    {t("todo_tasks.completed")}
                  </Text>
                </>
              ) : (
                <>
                  <MapPin size={14} color="#64748B" />
                  <Text className="text-[12px] text-slate-600 font-medium ml-1.5" numberOfLines={1}>
                    {parsed.location || t("todo_tasks.general")}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Delete Button */}
        {isDone && (
          <TouchableOpacity 
            className="absolute -top-2 -right-2 bg-rose-50 p-2 rounded-full border border-rose-100"
            onPress={() => handleDeleteTodo(todo.id)}
          >
            <Trash2 size={14} color="#EF4444" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const renderAddTaskModal = () => (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <View className="flex-1 bg-black/40 justify-end">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Animated.View 
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(300)}
            className="bg-white rounded-t-3xl p-6 pb-10"
          >
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-black text-slate-900">{t("todo_tasks.add_task")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-slate-100 p-2 rounded-full">
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Title Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.task_title")}</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
                  placeholder={t("todo_tasks.task_title_ph")}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.description")}</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 h-24"
                  placeholder={t("todo_tasks.description_ph")}
                  value={newTaskDescription}
                  onChangeText={setNewTaskDescription}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Date & Time Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.date")}</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-[50px] justify-center"
                  >
                    <Text className={`text-base ${newTaskDate ? "text-slate-800" : "text-slate-400"}`}>
                      {newTaskDate || t("todo_tasks.select_date")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.time")}</Text>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-[50px] justify-center"
                  >
                    <Text className={`text-base ${newTaskTime ? "text-slate-800" : "text-slate-400"}`}>
                      {newTaskTime || t("todo_tasks.select_time")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Patient & Location Row */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.patient_label")}</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
                    placeholder={t("todo_tasks.patient_ph")}
                    value={newTaskPatient}
                    onChangeText={setNewTaskPatient}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.location")}</Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800"
                    placeholder={t("todo_tasks.location_ph")}
                    value={newTaskLocation}
                    onChangeText={setNewTaskLocation}
                  />
                </View>
              </View>

              {/* Priority */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("todo_tasks.priority")}</Text>
                <View className="flex-row bg-slate-50 border border-slate-200 rounded-xl overflow-hidden h-[48px]">
                  {(["NORMAL", "MEDIUM", "URGENT"] as Priority[]).map((p) => {
                    const isSelected = newTaskPriority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setNewTaskPriority(p)}
                        className={`flex-1 items-center justify-center ${isSelected ? "bg-slate-800" : ""}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-500"}`}>
                          {t(`todo_tasks.priority_levels.${p}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className={`w-full py-4 items-center bg-primary/80`}
              >
                <Text className={`font-bold text-base text-white`}>
                  {t("todo_tasks.create_task")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
      <CalendarPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(bsDate) => {
          setNewTaskDate(bsDate);
          setShowDatePicker(false);
        }}
        language={language === "np" ? "np" : "en"}
        theme="light"
        brandColor="#356169"
        date={newTaskDate || undefined}
        dayTextStyle={{ fontWeight: 'normal' }}
        weekTextStyle={{ fontWeight: 'normal' }}
        titleTextStyle={{ fontWeight: 'normal' }}
      />

      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onTimeChange}
        />
      )}

      {showTimePicker && Platform.OS === 'ios' && (
        <Modal transparent visible={showTimePicker} animationType="slide">
          <View className="flex-1 justify-end bg-black/30">
            <View className="bg-white p-4 rounded-t-2xl pb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-800">{t("todo_tasks.select_time")}</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text className="text-[#356169] font-bold text-base">{t("todo_tasks.done")}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={onTimeChange}
                style={{ alignSelf: 'center', width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC] pt-14">
      <StatusBar barStyle="dark-content" />
      
      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 10 }}
      >
        {renderTitleSection()}
        {renderSummaryCards()}

        <View className="px-6">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#356169" />
            </View>
          ) : todos.length === 0 ? (
            <View className="py-10 items-center justify-center bg-white rounded-3xl border border-slate-100">
              <CheckSquare size={40} color="#E2E8F0" />
              <Text className="text-slate-400 font-bold mt-3">{t("todo_tasks.no_tasks")}</Text>
            </View>
          ) : (
            todos.map((todo, index) => renderTaskCard(todo, index))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <AnimatedTouchableOpacity
        entering={FadeInDown.delay(500).springify()}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        className="absolute bottom-28 right-6 w-[60px] h-[60px] rounded-full bg-[#356169] items-center justify-center"
      >
        <Plus size={30} color="#FFFFFF" />
      </AnimatedTouchableOpacity>

      {/* Add Task Modal */}
      {renderAddTaskModal()}
    </View>
  );
}
