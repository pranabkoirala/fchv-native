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
  Check,
  UserPlus,
  AlertCircle,
  Stethoscope,
  ChevronRight,
  Clock
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTodo } from "../../hooks/useTodo";
import { AdToBs } from "react-native-nepali-picker";
import TopHeader from "@/components/layout/TopHeader";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { doSync } from "../../api/services/sync/sync";
import { getMotherCount, getAllMothersList } from "../../hooks/database/models/MotherModel";
import { getPregnantWomenList, getPregnancyTrend } from "../../hooks/database/models/PregnantWomenModal";
import { getAllInfantMonitorings, getChildTrend } from "../../hooks/database/models/InfantMonitoringModel";
import { getTotalMaternalDeaths } from "../../hooks/database/models/MaternalDeathModel";
import { getTotalNewbornDeaths } from "../../hooks/database/models/NewbornDeathModel";

import StatCard from "@/components/dashboard/StatCard";
import TrendChart from "@/components/dashboard/TrendChart";
import TodoItem from "@/components/dashboard/TodoItem";
import { Skeleton } from "@/components/common/Skeleton"; // Checking if this exists, if not I'll use a View
import { getMunicipalityById, getWardById } from "../../utils/locationHelper";

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
  const router = useRouter();
  const { t } = useTranslation();
  const { isConnected } = useOnlineStatus();
  const [motherCount, setMotherCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [maternalDeathCount, setMaternalDeathCount] = useState(0);
  const [childDeathCount, setChildDeathCount] = useState(0);
  const [under29Days, setUnder29Days] = useState(0);
  const [days29To59Months, setDays29To59Months] = useState(0);
  const [loading, setLoading] = useState(true);
  // Initial 12 months placeholder
  const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const initialTrend = Array.from({ length: 12 }, (_, i) => {
    return { label: monthsNames[i], value: 0 };
  });

  const [pregnancyTrend, setPregnancyTrend] = useState<{ label: string; value: number }[]>(initialTrend);
  const [childTrend, setChildTrend] = useState<{ label: string; value: number }[]>(initialTrend);
  const [motherTrend, setMotherTrend] = useState<{ label: string; value: number }[]>(initialTrend);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const { todos, fetchTodos, removeTodo, toggleTodo } = useTodo();
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  const todayBsDate = (() => {
    try {
      return AdToBs(new Date().toISOString().split('T')[0]);
    } catch (e) {
      return "";
    }
  })();

  const todaysTasks = todos.filter(t => t.task_date === todayBsDate);


  useEffect(() => {
    if (isConnected) doSync();
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const [mCount, pregnancies, children, mDeaths, cDeaths, pTrend, cTrend, mothers] = await Promise.all([
            getMotherCount(),
            getPregnantWomenList(),
            getAllInfantMonitorings(),
            getTotalMaternalDeaths(),
            getTotalNewbornDeaths(),
            getPregnancyTrend(),
            getChildTrend(),
            getAllMothersList(),
          ]);

          const activities: any[] = [];
          mothers.forEach((m: any) => {
            const muniName = getMunicipalityById(m.municipality);
            const wardNum = getWardById(m.ward);
            const loc = [muniName, wardNum ? `Ward ${wardNum}` : ''].filter(Boolean).join(', ') || '';
            activities.push({
              id: `m-${m.id}`,
              title: `${t("dashboard.activity.new_mother")}: ${m.name || "Unknown"}`,
              subtitle: loc,
              date: m.createdAt || m.created_at || new Date().toISOString(),
              icon: Users,
              color: "#059669",
              bg: "#D1FAE5"
            });
          });
          pregnancies.forEach((p: any) => {
            // Pregnancy doesn't have its own address — find the mother
            const mother = mothers.find((m: any) => m.id === p.mother_id);
            const muniName = mother ? getMunicipalityById(mother.municipality) : '';
            const wardNum = mother ? getWardById(mother.ward) : '';
            const loc = [muniName, wardNum ? `Ward ${wardNum}` : ''].filter(Boolean).join(', ') || '';
            activities.push({
              id: `p-${p.id}`,
              title: `${t("dashboard.activity.new_pregnancy")}: ${p.name || "Unknown"}`,
              subtitle: loc,
              date: p.created_at || new Date().toISOString(),
              icon: Activity,
              color: "#0284C7",
              bg: "#E0F2FE"
            });
          });
          children.forEach((c: any) => {
            const mother = mothers.find((m: any) => m.id === c.mother_id);
            const muniName = mother ? getMunicipalityById(mother.municipality) : '';
            const wardNum = mother ? getWardById(mother.ward) : '';
            const loc = [muniName, wardNum ? `Ward ${wardNum}` : ''].filter(Boolean).join(', ') || '';
            activities.push({
              id: `c-${c.id}`,
              title: `${t("dashboard.activity.child_added")}: ${c.baby_name || c.mother_name || "Baby"}`,
              subtitle: loc,
              date: c.created_at || new Date().toISOString(),
              icon: Smile,
              color: "#D97706",
              bg: "#FEF3C7"
            });
          });

          activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecentActivity(activities.slice(0, 2));

          setMotherCount(mCount);
          setPregnancyCount(pregnancies.length);
          setChildCount(children.length);
          setMaternalDeathCount(mDeaths);
          setChildDeathCount(cDeaths);

          let u29 = 0;
          let u59m = 0;
          const todayDate = new Date();
          children.forEach((c: any) => {
            if (c.date_of_birth) {
              const dob = new Date(c.date_of_birth);
              if (!isNaN(dob.getTime())) {
                const diffTime = todayDate.getTime() - dob.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0 && diffDays < 29) {
                  u29++;
                } else if (diffDays >= 29) {
                  let m = (todayDate.getFullYear() - dob.getFullYear()) * 12 + todayDate.getMonth() - dob.getMonth();
                  if (todayDate.getDate() < dob.getDate()) {
                    m--;
                  }
                  if (m < 60) { // Up to 59 months
                    u59m++;
                  }
                }
              }
            }
          });
          setUnder29Days(u29);
          setDays29To59Months(u59m);

          const monthsNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const trend: { year: number; month: number; label: string; pregnant: number; child: number; mother: number }[] = [];

          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth();
          
          for (let i = 2; i >= 0; i--) {
            let m = currentMonth - i;
            let y = currentYear;
            if (m < 0) {
              m += 12;
              y -= 1;
            }
            trend.push({
              year: y,
              month: m,
              label: monthsNames[m],
              pregnant: 0,
              child: 0,
              mother: 0,
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

          mothers.forEach((row: any) => {
            const d = new Date(row.createdAt || row.created_at || new Date());
            let bucket = trend.find(b => b.month === d.getMonth() && b.year === d.getFullYear());
            // If the mother was created before the chart window, count in the earliest bucket
            if (!bucket) {
              const earliestBucket = trend[0];
              const motherTime = d.getTime();
              const earliestDate = new Date(earliestBucket.year, earliestBucket.month, 1).getTime();
              if (motherTime < earliestDate) {
                bucket = earliestBucket;
              }
            }
            if (bucket) bucket.mother++;
          });
          
          setPregnancyTrend(trend.map((b) => ({ label: b.label, value: b.pregnant })));
          setChildTrend(trend.map((b) => ({ label: b.label, value: b.child })));
          setMotherTrend(trend.map((b) => ({ label: b.label, value: b.mother })));
          await fetchTodos();
        } catch (err) {
          console.error("Dashboard fetch error:", err);
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
          <View>
          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 24 }}>
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push("/dashboard/record")}
              style={{ flex: 1, backgroundColor: "#E0F2FE", padding: 18, borderRadius: 20, alignItems: "center" }}
            >
              <View style={{ backgroundColor: "rgba(186, 230, 253, 0.5)", width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <UserPlus size={24} color="#0284C7" />
              </View>
              <Text style={{ color: "#0F172A", fontWeight: "600", fontSize: 13 }}>{t("dashboard.quick_actions.register_mother")}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => router.push("/dashboard/child")}
              style={{ flex: 1, backgroundColor: "#D1FAE5", padding: 18, borderRadius: 20, alignItems: "center" }}
            >
              <View style={{ backgroundColor: "rgba(167, 243, 208, 0.5)", width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Smile size={24} color="#059669" />
              </View>
              <Text style={{ color: "#0F172A", fontWeight: "600", fontSize: 13 }}>{t("dashboard.quick_actions.register_child")}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Section - Community Pulse */}
          <Text style={{ paddingHorizontal: 20, fontSize: 11, fontWeight: "800", color: "#475569", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
            {t("dashboard.sections.community_pulse")}
          </Text>
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <StatCard path="/dashboard/report?tab=mother" icon={Users} iconColor="#475569" bg="white" value={motherCount} label={t("dashboard.stats_labels.mothers", "Total Mothers")} delay={0} />
              <StatCard path="/dashboard/report?tab=pregnancy" icon={Baby} iconColor="#475569" bg="white" value={pregnancyCount} label={t("dashboard.stats_labels.pregnant", "Pregnant Women")} delay={100} />
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <StatCard path="/dashboard/report?tab=child" icon={Smile} iconColor="#475569" bg="white" value={childCount} label={t("dashboard.stats_labels.children", "Total Children")} delay={200} />
              <StatCard path="/dashboard/report/pregnancy-report" icon={AlertCircle} iconColor="#E11D48" bg="white" value={0} label={t("dashboard.stats_labels.high_risk")} delay={300} />
            </View>
          </View>

          {/* Death Stats - Minimal */}
          <View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 12, marginTop: 20 }}>
            <StatCard layout="minimal" path="/dashboard/report?tab=dead_mother" iconColor="#E11D48" bg="white" value={maternalDeathCount} label={t("dashboard.stats_labels.mother_deaths")} delay={400} />
            <StatCard layout="minimal" path="/dashboard/report?tab=dead_child" iconColor="#FCA5A5" bg="white" value={childDeathCount} label={t("dashboard.stats_labels.child_deaths")} delay={500} />
          </View>

          {/* Charts Section */}
          <View
            style={{
              paddingHorizontal: 20,
              marginTop: 28,
            }}
          >
            {/* Pregnancy Chart */}
            <View
              style={{
                backgroundColor: "white",
                paddingVertical: 24,
                borderRadius: 24,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingHorizontal: 24 }}>
                <View>
                  <Text style={{ color: "#0F172A", fontSize: 18, fontWeight: "800", letterSpacing: -0.5 }}>{t("dashboard.charts.monthly_trend")}</Text>
                </View>
                <View style={{ backgroundColor: "#F1F5F9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: "#475569", fontSize: 11, fontWeight: "600" }}>{t("dashboard.charts.last_3_months")}</Text>
                </View>
              </View>
              {loading ? (
                <Skeleton height={140} borderRadius={12} />
              ) : (
                <View style={{ marginTop: -10 }}>
                  <TrendChart 
                    pregnancyData={pregnancyTrend} 
                    childData={childTrend} 
                    motherData={motherTrend}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Health Summary Mini Cards */}
          <View style={{ paddingHorizontal: 20, flexDirection: "row", gap: 12, marginTop: 24 }}>
            <StatCard layout="compact" path="/dashboard/report/child-monitoring-report" icon={Baby} iconColor="#059669" iconBg="#D1FAE5" value={under29Days} label={t("dashboard.health_summary.under_29_days")} delay={100} />
            <StatCard layout="compact" path="/dashboard/report/child-monitoring-report" icon={Baby} iconColor="#0284C7" iconBg="#E0F2FE" value={days29To59Months} label={t("dashboard.health_summary.29_to_59_months")} delay={200} />
          </View>

          {/* Recent Activity */}
          <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#475569", letterSpacing: 1, textTransform: "uppercase" }}>
                {t("dashboard.sections.recent_activity")}
              </Text>
              <TouchableOpacity onPress={() => router.push("/dashboard/report?tab=all")}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#475569" }}>{t("dashboard.sections.view_all")}</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={{ gap: 12 }}>
                <Skeleton height={80} borderRadius={16} />
                <Skeleton height={80} borderRadius={16} />
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {recentActivity.length > 0 ? recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  const d = new Date(activity.date);
                  const isToday = new Date().toDateString() === d.toDateString();
                  const timeStr = isToday ? t("dashboard.activity.today") : d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                  
                  return (
                    <View key={activity.id} style={{ backgroundColor: "white", borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: activity.bg, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                        <Icon size={20} color={activity.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#0F172A", fontSize: 14, fontWeight: "700" }}>{activity.title}</Text>
                        <Text style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{activity.subtitle}</Text>
                      </View>
                    </View>
                  );
                }) : (
                  <Text style={{ color: "#64748B", fontSize: 13, textAlign: "center", paddingVertical: 20 }}>{t("dashboard.activity.no_activity")}</Text>
                )}
              </View>
            )}
          </View>

          {/* Tasks Section */}
          <View
            style={{
              paddingHorizontal: 20,
              marginTop: 32,
              marginBottom: 40,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#475569", letterSpacing: 1, textTransform: "uppercase" }}>{t("dashboard.sections.tasks_today")}</Text>
            </View>

            {/* Todo List */}
            <View style={{ gap: 10 }}>
              {todaysTasks.map((todo) => {
                const isDone = todo.is_completed === 1;
                const parsed = (() => {
                  try {
                    return JSON.parse(todo.task);
                  } catch {
                    return { title: todo.task };
                  }
                })();
                const title = parsed.title || todo.task;
                const time = todo.task_time || parsed.time || "";

                return (
                  <TouchableOpacity
                    key={todo.id}
                    activeOpacity={0.7}
                    onPress={() => toggleTodo(todo.id, todo.is_completed)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      paddingHorizontal: 16,
                      backgroundColor: "white",
                      borderRadius: 20,
                      opacity: isDone ? 0.6 : 1,
                    }}
                  >
                    <View style={{
                      width: 24, height: 24, borderRadius: 8, 
                      borderWidth: isDone ? 0 : 2, borderColor: "#CBD5E1", 
                      backgroundColor: isDone ? "#10B981" : "transparent",
                      alignItems: "center", justifyContent: "center",
                      marginRight: 14
                    }}>
                      {isDone && <Check size={14} color="white" strokeWidth={3} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        color: isDone ? "#94A3B8" : "#0F172A",
                        fontSize: 15, fontWeight: "700",
                        textDecorationLine: isDone ? "line-through" : "none",
                      }} numberOfLines={1}>
                        {title}
                      </Text>
                      {(time || parsed.patient) ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          {time ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
                              <Clock size={12} color="#64748B" />
                              <Text style={{ color: "#64748B", fontSize: 12, marginLeft: 4, fontWeight: "500" }}>{time}</Text>
                            </View>
                          ) : null}
                          {parsed.patient ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <UserPlus size={12} color="#64748B" />
                              <Text style={{ color: "#64748B", fontSize: 12, marginLeft: 4, fontWeight: "500" }}>{parsed.patient}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {todaysTasks.length === 0 && (
                <View
                  style={{
                    padding: 28,
                    alignItems: "center",
                    backgroundColor: "white",
                    borderRadius: 20,
                  }}
                >
                  <CheckCircle size={26} color="#E2E8F0" strokeWidth={1.5} />
                  <Text style={{ color: "#94A3B8", fontWeight: "500", fontSize: 12, marginTop: 8 }}>
                    {t("dashboard.tasks.all_caught_up")}
                  </Text>
                </View>
              )}
            </View>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
