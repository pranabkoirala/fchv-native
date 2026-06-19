import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import TaskModal, { TaskModalData } from "@/components/common/TaskModal";
import TopHeader from "@/components/layout/TopHeader";
import { createTodo, updateTodo } from "@/hooks/database/models/TodoModel";
import { scheduleTaskNotificationAsync } from "@/utils/notificationHelper";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Activity,
  AlertCircle,
  Baby,
  Check,
  Clock,
  Heart,
  Smile,
  Trash2,
  UserPlus,
  Users
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { doSync } from "../../api/services/sync/sync";
import { getAdolescentIfaCount } from "../../hooks/database/models/AdolescentIfaModel";
import {
  getAllInfantMonitorings,
  getChildTrend,
} from "../../hooks/database/models/InfantMonitoringModel";
import { getTotalMaternalDeaths } from "../../hooks/database/models/MaternalDeathModel";
import {
  getAllMothersList,
  getMotherCount,
  getMotherTrend,
} from "../../hooks/database/models/MotherModel";
import { getTotalNewbornDeaths } from "../../hooks/database/models/NewbornDeathModel";
import {
  getPregnancyTrend,
  getPregnantWomenList,
} from "../../hooks/database/models/PregnantWomenModal";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useTodo } from "../../hooks/useTodo";

import { Skeleton } from "@/components/common/Skeleton"; // Checking if this exists, if not I'll use a View
import StatCard from "@/components/dashboard/StatCard";
import TrendChart from "@/components/dashboard/TrendChart";
import { useLanguage } from "@/context/LanguageContext";
import { getRecentNepaliMonthBuckets } from "../../utils/dateHelper";
import { getMunicipalityById, getWardById } from "../../utils/locationHelper";

type TrendRow = {
  month: number;
  year: number;
  count: number;
};

const buildDashboardTrend = (rows: TrendRow[], isNepali: boolean) => {
  const buckets = getRecentNepaliMonthBuckets(3);

  return buckets.map((bucket) => {
    const row = rows.find(
      (item) => item.year === bucket.year && item.month === bucket.month - 1,
    );

    return {
      label: isNepali ? bucket.labelNp : bucket.label,
      value: row?.count ?? 0,
    };
  });
};

export default function DashboardScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { isConnected } = useOnlineStatus();
  const [motherCount, setMotherCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [adolescentCount, setAdolescentCount] = useState(0);
  const [maternalDeathCount, setMaternalDeathCount] = useState(0);
  const [childDeathCount, setChildDeathCount] = useState(0);
  const [under29Days, setUnder29Days] = useState(0);
  const [days29To59Months, setDays29To59Months] = useState(0);
  const [highRiskPregnancyCount, setHighRiskPregnancyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  
  // Initial 3-month BS placeholder
  const initialTrend = Array.from({ length: 3 }, () => {
    return { label: "", value: 0 };
  });

  const [pregnancyTrend, setPregnancyTrend] =
    useState<{ label: string; value: number }[]>(initialTrend);
  const [childTrend, setChildTrend] =
    useState<{ label: string; value: number }[]>(initialTrend);
  const [motherTrend, setMotherTrend] =
    useState<{ label: string; value: number }[]>(initialTrend);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const { todos, fetchTodos, toggleTodo, removeTodo } = useTodo();

  const todayBsDate = (() => {
    try {
      return AdToBs(new Date().toISOString().split("T")[0]);
    } catch (e) {
      return "";
    }
  })();

  const todaysTasks = todos.filter((t) => t.task_date === todayBsDate);

  const handleDashboardTaskSubmit = async (data: TaskModalData) => {
    setIsTaskSubmitting(true);
    try {
      const newItem = await createTodo(
        JSON.stringify({
          title: data.title,
          patient: data.patient || undefined,
          time: data.task_time,
          location: data.location,
          priority: data.priority,
        }),
        data.description || null,
        data.task_date,
        data.task_time,
      );

      const notificationId = await scheduleTaskNotificationAsync({
        id: newItem.id,
        title: data.title,
        taskDate: newItem.task_date,
        taskTime: newItem.task_time,
      });

      if (notificationId) {
        await updateTodo(newItem.id, { notification_id: notificationId });
      }

      await fetchTodos();
      setTaskModalVisible(false);
    } catch (error) {
      console.error("Failed to add dashboard task:", error);
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  useEffect(() => {
    if (isConnected) doSync();
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const [
            mCount,
            pregnancies,
            children,
            mDeaths,
            cDeaths,
            pTrend,
            cTrend,
            mTrend,
            mothers,
            adolCount,
          ] = await Promise.all([
            getMotherCount(),
            getPregnantWomenList(),
            getAllInfantMonitorings(),
            getTotalMaternalDeaths(),
            getTotalNewbornDeaths(),
            getPregnancyTrend(),
            getChildTrend(),
            getMotherTrend(),
            getAllMothersList(),
            getAdolescentIfaCount(),
          ]);

          const activities: any[] = [];
          mothers.forEach((m: any) => {
            const muniName = getMunicipalityById(m.municipality);
            const wardNum = getWardById(m.ward);
            const loc =
              [muniName, wardNum ? `Ward ${wardNum}` : ""]
                .filter(Boolean)
                .join(", ") || "";
            activities.push({
              id: `m-${m.id}`,
              title: `${t("dashboard.activity.new_mother")}: ${m.name || "Unknown"}`,
              subtitle: loc,
              date: m.createdAt || m.created_at || new Date().toISOString(),
              icon: Users,
              color: "#059669",
              bg: "#D1FAE5",
            });
          });
          pregnancies.forEach((p: any) => {
            const mother = mothers.find((m: any) => m.id === p.mother);
            const muniName = mother
              ? getMunicipalityById(mother.municipality)
              : "";
            const wardNum = mother ? getWardById(mother.ward) : "";
            const loc =
              [muniName, wardNum ? `Ward ${wardNum}` : ""]
                .filter(Boolean)
                .join(", ") || "";
            activities.push({
              id: `p-${p.id}`,
              title: `${t("dashboard.activity.new_pregnancy")}: ${p.name || "Unknown"}`,
              subtitle: loc,
              date: p.created_at || new Date().toISOString(),
              icon: Activity,
              color: "#0284C7",
              bg: "#E0F2FE",
            });
          });
          children.forEach((c: any) => {
            const mother = mothers.find((m: any) => m.id === c.mother);
            const muniName = mother
              ? getMunicipalityById(mother.municipality)
              : "";
            const wardNum = mother ? getWardById(mother.ward) : "";
            const loc =
              [muniName, wardNum ? `Ward ${wardNum}` : ""]
                .filter(Boolean)
                .join(", ") || "";
            activities.push({
              id: `c-${c.id}`,
              title: `${t("dashboard.activity.child_added")}: ${c.baby_name || c.mother_name || "Baby"}`,
              subtitle: loc,
              date: c.created_at || new Date().toISOString(),
              icon: Smile,
              color: "#D97706",
              bg: "#FEF3C7",
            });
          });

          await fetchTodos();
          activities.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          setRecentActivity(activities.slice(0, 2));

          setMotherCount(mCount);
          setPregnancyCount(pregnancies.length);
          setChildCount(children.length);
          setAdolescentCount(adolCount);
          setMaternalDeathCount(mDeaths);
          setChildDeathCount(cDeaths);

          const highRisk = pregnancies.filter(
            (p: any) => p.risk_level === "high",
          ).length;
          setHighRiskPregnancyCount(highRisk);

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
                  let m =
                    (todayDate.getFullYear() - dob.getFullYear()) * 12 +
                    todayDate.getMonth() -
                    dob.getMonth();
                  if (todayDate.getDate() < dob.getDate()) {
                    m--;
                  }
                  if (m < 60) {
                    u59m++;
                  }
                }
              }
            }
          });
          setUnder29Days(u29);
          setDays29To59Months(u59m);
          const isNepali = language === "np";
          setPregnancyTrend(buildDashboardTrend(pTrend, isNepali));
          setChildTrend(buildDashboardTrend(cTrend, isNepali));
          setMotherTrend(buildDashboardTrend(mTrend, isNepali));
        } catch (err) {
          console.error("Dashboard fetch error:", err);
        } finally {
          setLoading(false);
        }
      };

      load();
    }, [fetchTodos, language, t]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar backgroundColor="#fff" />
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
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: "column",
                gap: 12,
                marginTop: 20,
                marginBottom: 24,
              }}
            >
              <View className="flex-1 gap-4 flex-row">

                <TouchableOpacity
                  onPress={() => router.push("/dashboard/record")}
                  style={{
                    flex: 1,
                    backgroundColor: "#E0F2FE",
                    padding: 18,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(186, 230, 253, 0.5)",
                      padding: 6,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <UserPlus size={25} color="#0284C7" />
                  </View>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontWeight: "600",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {t("dashboard.quick_actions.register_mother")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/dashboard/child")}
                  style={{
                    flex: 1,
                    backgroundColor: "#D1FAE5",
                    padding: 18,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(167, 243, 208, 0.5)",
                      padding: 6,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <Smile size={25} color="#059669" />
                  </View>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontWeight: "600",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {t("dashboard.quick_actions.register_child")}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-1 gap-4 flex-row">

                <TouchableOpacity
                  onPress={() => router.push("/dashboard/adolescent")}
                  style={{
                    flex: 1,
                    backgroundColor: "#F3E8FF",
                    padding: 16,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(216, 180, 254, 0.4)",
                      padding: 2,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <Heart size={25} color="#7C3AED" />
                  </View>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontWeight: "600",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {t("dashboard.quick_actions.add_adolescent")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push("/dashboard/mothers-group" as any)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FEF3C7",
                    padding: 18,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "rgba(253, 224, 71, 0.4)",
                      padding: 6,
                      borderRadius: 26,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <Users size={25} color="#D97706" />
                  </View>
                  <Text
                    style={{
                      color: "#0F172A",
                      fontWeight: "600",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {language === "np" ? "आमा समूहको बैठक" : "Mother's Group Meeting"}
                  </Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* Stats Section - Community Pulse */}
            <Text
              style={{
                paddingHorizontal: 20,
                fontSize: 16,
                fontWeight: "600",
                color: "#282c33ff",
                letterSpacing: 1,
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              {t("dashboard.sections.community_pulse")}
            </Text>
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  path="/dashboard/report?tab=mother"
                  icon={Users}
                  iconColor="#475569"
                  bg="white"
                  value={motherCount}
                  label={t("dashboard.stats_labels.mothers")}
                  delay={0}
                />
                <StatCard
                  path="/dashboard/report?tab=pregnancy"
                  icon={Baby}
                  iconColor="#475569"
                  bg="white"
                  value={pregnancyCount}
                  label={t("dashboard.stats_labels.pregnant")}
                  delay={100}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  path="/dashboard/report?tab=child"
                  icon={Smile}
                  iconColor="#475569"
                  bg="white"
                  value={childCount}
                  label={t("dashboard.stats_labels.children", "Total Children")}
                  delay={200}
                />
                <StatCard
                  path="/dashboard/adolescent"
                  icon={Heart}
                  iconColor="#7C3AED"
                  bg="white"
                  value={adolescentCount}
                  label={t(
                    "dashboard.stats_labels.adolescents",
                    "Adolescent Girls",
                  )}
                  delay={250}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  path="/dashboard/risk"
                  icon={AlertCircle}
                  iconColor="#E11D48"
                  bg="#FFE4E6"
                  value={highRiskPregnancyCount}
                  label={t("dashboard.stats_labels.high_risk")}
                  delay={300}
                />
              </View>
            </View>

            {/* Death Stats - Minimal */}
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: "row",
                gap: 12,
                marginTop: 20,
              }}
            >
              <StatCard
                layout="minimal"
                path="/dashboard/report?tab=dead_mother"
                iconColor="#E11D48"
                bg="white"
                value={maternalDeathCount}
                label={t("dashboard.stats_labels.mother_deaths")}
                delay={400}
              />
              <StatCard
                layout="minimal"
                path="/dashboard/report?tab=dead_child"
                iconColor="#FCA5A5"
                bg="white"
                value={childDeathCount}
                label={t("dashboard.stats_labels.child_deaths")}
                delay={500}
              />
            </View>

            {/* Health Summary Mini Cards */}
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: "column",
                gap: 12,
                marginTop: 16,
              }}
            >
              <StatCard
                layout="compact"
                path="/dashboard/report/child-monitoring-report"
                icon={Baby}
                iconColor="#059669"
                iconBg="#D1FAE5"
                value={under29Days}
                label={t("dashboard.health_summary.under_29_days")}
                delay={100}
              />
              <StatCard
                layout="compact"
                path="/dashboard/report/child-monitoring-report"
                icon={Baby}
                iconColor="#0284C7"
                iconBg="#E0F2FE"
                value={days29To59Months}
                label={t("dashboard.health_summary.29_to_59_months")}
                delay={200}
              />
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
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    paddingHorizontal: 24,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: "#15213bff",
                        fontSize: 18,
                        fontWeight: "700",
                        letterSpacing: -0.5,
                      }}
                    >
                      {t("dashboard.charts.monthly_trend")}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#F1F5F9",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#475569",
                        fontSize: 11,
                        fontWeight: "600",
                      }}
                    >
                      {t("dashboard.charts.last_3_months")}
                    </Text>
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

            {/* Recent Activity */}
            <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#475569",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {t("dashboard.sections.recent_activity")}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/dashboard/report?tab=all")}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#475569",
                    }}
                  >
                    {t("dashboard.sections.view_all")}
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={{ gap: 12 }}>
                  <Skeleton height={80} borderRadius={16} />
                  <Skeleton height={80} borderRadius={16} />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const Icon = activity.icon;
                      const d = new Date(activity.date);
                      const isToday =
                        new Date().toDateString() === d.toDateString();
                      const timeStr = isToday
                        ? t("dashboard.activity.today")
                        : d.toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                        });

                      return (
                        <View
                          key={activity.id}
                          style={{
                            backgroundColor: "white",
                            borderRadius: 20,
                            padding: 16,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: activity.bg,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 16,
                            }}
                          >
                            <Icon size={20} color={activity.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: "#0F172A",
                                fontSize: 14,
                                fontWeight: "700",
                              }}
                            >
                              {activity.title}
                            </Text>
                            <Text
                              style={{
                                color: "#64748B",
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {activity.subtitle}
                            </Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text
                      style={{
                        color: "#64748B",
                        fontSize: 13,
                        textAlign: "center",
                        paddingVertical: 20,
                      }}
                    >
                      {t("dashboard.activity.no_activity")}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Tasks Section */}
            {
              todaysTasks.length > 0 && (
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
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: "#475569",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {t("dashboard.sections.tasks_today")}
                    </Text>
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
                        <View
                          key={todo.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "white",
                            borderRadius: 20,
                            overflow: "hidden",
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => toggleTodo(todo.id, todo.is_completed)}
                            style={{
                              flex: 1,
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 16,
                              paddingHorizontal: 16,
                              opacity: isDone ? 0.6 : 1,
                            }}
                          >
                            <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 8,
                              borderWidth: isDone ? 0 : 2,
                              borderColor: "#CBD5E1",
                              backgroundColor: isDone ? "#10B981" : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 14,
                            }}
                          >
                            {isDone && (
                              <Check size={14} color="white" strokeWidth={3} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: isDone ? "#94A3B8" : "#0F172A",
                                fontSize: 15,
                                fontWeight: "700",
                                textDecorationLine: isDone
                                  ? "line-through"
                                  : "none",
                              }}
                              numberOfLines={1}
                            >
                              {title}
                            </Text>
                            {time || parsed.patient ? (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 4,
                                }}
                              >
                                {time ? (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      marginRight: 10,
                                    }}
                                  >
                                    <Clock size={12} color="#64748B" />
                                    <Text
                                      style={{
                                        color: "#64748B",
                                        fontSize: 12,
                                        marginLeft: 4,
                                        fontWeight: "500",
                                      }}
                                    >
                                      {time}
                                    </Text>
                                  </View>
                                ) : null}
                                {parsed.patient ? (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                    }}
                                  >
                                    <UserPlus size={12} color="#64748B" />
                                    <Text
                                      style={{
                                        color: "#64748B",
                                        fontSize: 12,
                                        marginLeft: 4,
                                        fontWeight: "500",
                                      }}
                                    >
                                      {parsed.patient}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            ) : null}
                          </View>
                          </TouchableOpacity>
                          {isDone && (
                            <TouchableOpacity
                              onPress={() => {
                                setTaskToDeleteId(todo.id);
                                setDeleteConfirmVisible(true);
                              }}
                              style={{
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#FEE2E2",
                                marginRight: 10,
                              }}
                            >
                              <Trash2 size={15} color="#DC2626" />
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    onPress={() => setTaskModalVisible(true)}
                    style={{
                      marginTop: 20,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: "#356169",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>
                      {t("todo_tasks.add_task")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TaskModal
        visible={isTaskModalVisible}
        onClose={() => setTaskModalVisible(false)}
        onSubmit={handleDashboardTaskSubmit}
        submitLabel={t("todo_tasks.create_task")}
        headerTitle={t("todo_tasks.add_task")}
        submitting={isTaskSubmitting}
      />

      <ConfirmActionModal
        visible={isDeleteConfirmVisible}
        onClose={() => {
          setDeleteConfirmVisible(false);
          setTaskToDeleteId(null);
        }}
        title={t("reports.common.delete_confirm_title")}
        description={t("reports.common.delete_confirm_msg")}
        actionLabel={t("common.delete")}
        onAction={async () => {
          if (!taskToDeleteId) return;
          await removeTodo(taskToDeleteId);
          setDeleteConfirmVisible(false);
          setTaskToDeleteId(null);
        }}
      />
    </View>
  );
}
