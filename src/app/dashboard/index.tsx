import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  Plus,
  Smile,
  Baby,
  Activity,
  Users,
  Heart,
  ClipboardList,
  CheckCircle,
} from "lucide-react-native";

import { useTodo } from "../../hooks/useTodo";
import TopHeader from "@/components/layout/TopHeader";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { doSync } from "../../api/services/sync/sync";
import { getMotherCount } from "../../hooks/database/models/MotherModel";
import { getPregnantWomenList, getPregnancyTrend } from "../../hooks/database/models/PregnantWomenModal";
import { getAllInfantMonitorings, getChildTrend } from "../../hooks/database/models/InfantMonitoringModel";
import { getTotalMaternalDeaths } from "../../hooks/database/models/MaternalDeathModel";
import { getTotalNewbornDeaths } from "../../hooks/database/models/NewbornDeathModel";

import StatCard from "@/components/dashboard/StatCard";
import TrendChart from "@/components/dashboard/TrendChart";
import TodoItem from "@/components/dashboard/TodoItem";
import { Skeleton } from "@/components/common/Skeleton"; // Checking if this exists, if not I'll use a View

import "../../global.css";

const parseDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr || dateStr === "N/A") return null;

  let d = new Date(dateStr);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1970 && d.getFullYear() < 2100) return d;

  const parts = dateStr.split(/[-/T ]/);
  if (parts.length >= 3) {
    let y = parseInt(parts[0]);
    let m = parseInt(parts[1]) - 1;
    let day = parseInt(parts[2]);

    if (y < 100 && day > 1000) {
      const temp = y;
      y = day;
      day = temp;
    }

    d = new Date(y, m, day);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1970 && d.getFullYear() < 2100) return d;
  }
  return null;
};

export default function DashboardScreen() {
  const { isConnected } = useOnlineStatus();
  const [motherCount, setMotherCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [maternalDeathCount, setMaternalDeathCount] = useState(0);
  const [childDeathCount, setChildDeathCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // Initial 12 months placeholder
  const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const initialTrend = Array.from({ length: 12 }, (_, i) => {
    return { label: monthsNames[i], value: i > now.getMonth() ? null : 0 };
  });

  const [pregnancyTrend, setPregnancyTrend] = useState<{ label: string; value: number | null }[]>(initialTrend);
  const [childTrend, setChildTrend] = useState<{ label: string; value: number | null }[]>(initialTrend);

  const scrollRef = useRef<ScrollView>(null);
  const todoInputRef = useRef<TextInput>(null);
  const { todos, fetchTodos, addTodo, editTodo, removeTodo, toggleTodo } = useTodo();
  const [newTodo, setNewTodo] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  const pageAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected) doSync();
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      pageAnim.setValue(0);

      const load = async () => {
        setLoading(true);
        try {
          const [mCount, pregnancies, children, mDeaths, cDeaths, pTrend, cTrend] = await Promise.all([
            getMotherCount(),
            getPregnantWomenList(),
            getAllInfantMonitorings(),
            getTotalMaternalDeaths(),
            getTotalNewbornDeaths(),
            getPregnancyTrend(),
            getChildTrend(),
          ]);

          setMotherCount(mCount);
          setPregnancyCount(pregnancies.length);
          setChildCount(children.length);
          setMaternalDeathCount(mDeaths);
          setChildDeathCount(cDeaths);

          const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const trend: { year: number; month: number; label: string; pregnant: number | null; child: number | null }[] = [];

          const now = new Date();
          const currentYear = now.getFullYear();
          for (let i = 0; i < 12; i++) {
            trend.push({
              year: currentYear,
              month: i,
              label: monthsNames[i],
              pregnant: i > now.getMonth() ? null : 0,
              child: i > now.getMonth() ? null : 0,
            });
          }

          pTrend.forEach((row: any) => {
            const bucket = trend.find(b => b.month === row.month && b.year === row.year);
            if (bucket) bucket.pregnant = row.count;
          });

          cTrend.forEach((row: any) => {
            const bucket = trend.find(b => b.month === row.month && b.year === row.year);
            if (bucket) bucket.child = row.count;
          });
          
          setPregnancyTrend(trend.map((b) => ({ label: b.label, value: b.pregnant })));
          setChildTrend(trend.map((b) => ({ label: b.label, value: b.child })));
          await fetchTodos();

          Animated.timing(pageAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        } catch (err) {
          console.error("Dashboard fetch error:", err);
          pageAnim.setValue(1);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="dark-content" />
      <TopHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: pageAnim,
              transform: [{ translateY: pageAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            }}
          >
          {/* Greeting */}
          <View style={{ paddingHorizontal: 20, marginTop: 16, marginBottom: 20 }}>
            <Text style={{ color: "#1E293B", fontSize: 22, fontWeight: "800" }}>Namaste, Laxmi</Text>
            <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "500", marginTop: 4 }}>
              Here is your health tracking trend
            </Text>
          </View>

          {/* Stats Cards - 2 per row */}
          <View style={{ paddingHorizontal: 16, gap: 10 }}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard icon={Users} iconColor="#E11D48" iconBg="#FFF1F2" value={motherCount} label="Mothers" delay={0} />
              <StatCard icon={Smile} iconColor="#3B82F6" iconBg="#EFF6FF" value={pregnancyCount} label="Pregnant" delay={100} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard icon={Baby} iconColor="#10B981" iconBg="#ECFDF5" value={childCount} label="Children" delay={200} />
              <StatCard icon={Heart} iconColor="#F43F5E" iconBg="#FFF1F2" value={maternalDeathCount} label="Mat. Death" delay={300} />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard icon={Baby} iconColor="#64748B" iconBg="#F1F5F9" value={childDeathCount} label="Child Death" delay={400} />
              <StatCard
                icon={ClipboardList}
                iconColor="#8B5CF6"
                iconBg="#F5F3FF"
                value={todos.filter((t) => !t.is_completed).length}
                label="Pending Tasks"
                delay={500}
              />
            </View>
          </View>

          {/* Charts Section */}
          <View
            style={{
              paddingHorizontal: 16,
              marginTop: 24,
              gap: 20
            }}
          >
            {/* Pregnancy Chart */}
            <View
              style={{
                backgroundColor: "white",
                paddingVertical: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#F1F5F9",
                overflow: "hidden",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingHorizontal: 20 }}>
                <View>
                  <Text style={{ color: "#1E293B", fontSize: 15, fontWeight: "800" }}>Pregnancy Trends</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>
                    Monthly registrations
                  </Text>
                </View>
                <View style={{ backgroundColor: "#EEF2FF", width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                  <Activity size={18} color="#6366F1" strokeWidth={2} />
                </View>
              </View>
              {loading ? (
                <Skeleton height={140} borderRadius={12} />
              ) : (
                <TrendChart data={pregnancyTrend} color="#6366F1" label="Pregnant" />
              )}
            </View>

            {/* Child Chart */}
            <View
              style={{
                backgroundColor: "white",
                paddingVertical: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#F1F5F9",
                overflow: "hidden",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingHorizontal: 20 }}>
                <View>
                  <Text style={{ color: "#1E293B", fontSize: 15, fontWeight: "800" }}>Child Birth Trends</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "600", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>
                    Monthly births
                  </Text>
                </View>
                <View style={{ backgroundColor: "#ECFDF5", width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                  <Baby size={18} color="#10B981" strokeWidth={2} />
                </View>
              </View>
              {loading ? (
                <Skeleton height={140} borderRadius={12} />
              ) : (
                <TrendChart data={childTrend} color="#10B981" label="Children" />
              )}
            </View>
          </View>

          {/* Tasks Section */}
          <View
            style={{
              paddingHorizontal: 16,
              marginTop: 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                paddingHorizontal: 2,
              }}
            >
              <Text style={{ color: "#1E293B", fontSize: 15, fontWeight: "800" }}>My Tasks</Text>
              <View
                style={{
                  backgroundColor: "#ECFDF5",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#D1FAE5",
                }}
              >
                <Text
                  style={{
                    color: "#059669",
                    fontSize: 10,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  {todos.filter((t) => !t.is_completed).length} Pending
                </Text>
              </View>
            </View>

            {/* Add Task Input */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                  borderRadius: 12,
                  height: 48,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <TextInput
                  ref={todoInputRef}
                  style={{ flex: 1, color: "#1E293B", fontWeight: "500", fontSize: 13 }}
                  placeholder="Add a new task..."
                  placeholderTextColor="#CBD5E1"
                  value={newTodo}
                  onChangeText={setNewTodo}
                  onSubmitEditing={() => {
                    if (newTodo.trim()) {
                      addTodo(newTodo.trim());
                      setNewTodo("");
                    }
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (newTodo.trim()) {
                    addTodo(newTodo.trim());
                    setNewTodo("");
                  }
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#3B82F6",
                }}
              >
                <Plus size={20} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Todo List */}
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggleTodo(todo.id, todo.is_completed)}
                onDelete={() => removeTodo(todo.id)}
                onEdit={(text: string) => editTodo(todo.id, text)}
                isEditing={editingTodoId === todo.id}
                setEditingId={setEditingTodoId}
              />
            ))}

            {todos.length === 0 && (
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 14,
                  padding: 28,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#F1F5F9",
                  borderStyle: "dashed",
                }}
              >
                <CheckCircle size={26} color="#E2E8F0" strokeWidth={1.5} />
                <Text style={{ color: "#94A3B8", fontWeight: "500", fontSize: 12, marginTop: 8 }}>
                  All caught up!
                </Text>
              </View>
            )}
          </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
