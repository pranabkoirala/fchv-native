import ConfirmActionModal from "@/components/common/ConfirmActionModal";
import TaskModal, { TaskModalData } from "@/components/common/TaskModal";
import TopHeader from "@/components/layout/TopHeader";
import { createTodo, updateTodo } from "@/hooks/database/models/TodoModel";
import { scheduleTaskNotificationAsync } from "@/utils/notificationHelper";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Activity,
  AlertCircle,
  Apple,
  Baby,
  Building2,
  Calendar,
  Check,
  Clock,
  Heart,
  Smile,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { doSync } from "../../api/services/sync/sync";
import { getAdolescentIfaCount } from "../../hooks/database/models/AdolescentIfaModel";
import { getAllDeliveries } from "../../hooks/database/models/DeliveryModel";
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
import { getAllMothersGroupMeetings } from "../../hooks/database/models/MothersGroupMeetingModel";
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
import {
  getRecentNepaliMonthBuckets,
  toNepaliNumbers,
} from "../../utils/dateHelper";
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

const buildLocation = (municipality?: any, ward?: any) => {
  const muniName = municipality ? getMunicipalityById(municipality) : "";
  const wardNum = ward ? getWardById(ward) : "";
  return (
    [muniName, wardNum ? `Ward ${wardNum}` : ""].filter(Boolean).join(", ") || ""
  );
};

const cardStyle = {
  flex: 1,
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  paddingVertical: 20,
  paddingHorizontal: 8,
  alignItems: "center",
  justifyContent: "center",
  minHeight: 120,
  borderWidth: 1,
  borderColor: "#F0F2F5",
} as const;

const cardIconWrapStyle = {
  borderRadius: 16,
  width: 48,
  height: 48,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
} as const;

const cardLabelStyle = {
  color: "#1E293B",
  fontWeight: "600",
  fontSize: 13,
  textAlign: "center",
  lineHeight: 18,
} as const;

type QuickActionCardProps = {
  onPress: () => void;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  className?: string;
};

const QuickActionCard = ({
  onPress,
  Icon,
  iconColor,
  iconBg,
  label,
  className,
}: QuickActionCardProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={className}
    style={className ? { ...cardStyle, flex: undefined } : cardStyle}
  >
    <View style={{ ...cardIconWrapStyle, backgroundColor: iconBg }}>
      <Icon size={24} color={iconColor} />
    </View>
    <Text style={cardLabelStyle}>{label}</Text>
  </TouchableOpacity>
);

const sectionBarStyle = {
  width: 3,
  height: 20,
  backgroundColor: "#0891B2",
  borderRadius: 2,
} as const;

const sectionTitleStyle = {
  fontSize: 17,
  fontWeight: "700",
  color: "#0F172A",
  letterSpacing: 0.5,
} as const;

const sectionSubtitleStyle = {
  fontSize: 13,
  color: "#94A3B8",
  fontWeight: "400",
  marginLeft: 13,
} as const;

export default function DashboardScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { isConnected } = useOnlineStatus();
  const formatNum = useCallback(
    (n: number) => (language === "np" ? toNepaliNumbers(n) : String(n)),
    [language],
  );
  const [motherCount, setMotherCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [adolescentCount, setAdolescentCount] = useState(0);
  const [maternalDeathCount, setMaternalDeathCount] = useState(0);
  const [childDeathCount, setChildDeathCount] = useState(0);
  const [highRiskPregnancyCount, setHighRiskPregnancyCount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const [mothersMeetingCount, setMothersMeetingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTaskModalVisible, setTaskModalVisible] = useState(false);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);
  const [isDeleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  // Initial 3-month BS placeholder
  const initialTrend = useMemo(
    () => Array.from({ length: 3 }, () => ({ label: "", value: 0 })),
    [],
  );

  const [pregnancyTrend, setPregnancyTrend] =
    useState<{ label: string; value: number }[]>(initialTrend);
  const [childTrend, setChildTrend] =
    useState<{ label: string; value: number }[]>(initialTrend);
  const [motherTrend, setMotherTrend] =
    useState<{ label: string; value: number }[]>(initialTrend);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const scrollRef = useRef<ScrollView>(null);
  const { todos, fetchTodos, toggleTodo, removeTodo } = useTodo();

  const todayBsDate = useMemo(() => {
    try {
      return AdToBs(new Date().toISOString().split("T")[0]);
    } catch (e) {
      return "";
    }
  }, []);

  const todaysTasks = useMemo(
    () => todos.filter((t) => t.task_date === todayBsDate),
    [todos, todayBsDate],
  );

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

  const loadDashboardData = useCallback(async () => {
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
        deliveries,
        mothersMeetings,
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
        getAllDeliveries(),
        getAllMothersGroupMeetings(),
      ]);

      const nowIso = new Date().toISOString();
      const motherById = new Map<any, any>(
        mothers.map((m: any) => [m.id, m]),
      );

      const activities: any[] = [];
      mothers.forEach((m: any) => {
        activities.push({
          id: `m-${m.id}`,
          title: `${t("dashboard.activity.new_mother")}: ${m.name || "Unknown"}`,
          subtitle: buildLocation(m.municipality, m.ward),
          date: m.createdAt || m.created_at || nowIso,
          icon: Users,
          color: "#059669",
          bg: "#D1FAE5",
        });
      });
      pregnancies.forEach((p: any) => {
        const mother = motherById.get(p.mother);
        activities.push({
          id: `p-${p.id}`,
          title: `${t("dashboard.activity.new_pregnancy")}: ${p.name || "Unknown"}`,
          subtitle: buildLocation(mother?.municipality, mother?.ward),
          date: p.created_at || nowIso,
          icon: Activity,
          color: "#0284C7",
          bg: "#E0F2FE",
        });
      });
      children.forEach((c: any) => {
        const mother = motherById.get(c.mother);
        activities.push({
          id: `c-${c.id}`,
          title: `${t("dashboard.activity.child_added")}: ${c.baby_name || c.mother_name || "Baby"}`,
          subtitle: buildLocation(mother?.municipality, mother?.ward),
          date: c.created_at || nowIso,
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
      setDeliveryCount(deliveries.length);
      setMothersMeetingCount(mothersMeetings.length);

      const highRisk = pregnancies.filter(
        (p: any) => p.risk_level === "high",
      ).length;
      setHighRiskPregnancyCount(highRisk);

      const isNepali = language === "np";
      setPregnancyTrend(buildDashboardTrend(pTrend, isNepali));
      setChildTrend(buildDashboardTrend(cTrend, isNepali));
      setMotherTrend(buildDashboardTrend(mTrend, isNepali));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchTodos, language, t]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
  );

  const { refreshing, onRefresh } = usePullToRefresh(loadDashboardData);

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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View>
            {/* Quick Access — 6 flat cards */}
            <View
              style={{ paddingHorizontal: 20, marginTop: 15, marginBottom: 28 }}
            >
              {/* quick add form section */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <View style={sectionBarStyle} />
                  <Text style={sectionTitleStyle}>
                    {t(
                      "dashboard.sections.quick_forms",
                      "Quick Registration & Services",
                    )}
                  </Text>
                </View>
                <Text style={sectionSubtitleStyle}>
                  {t(
                    "dashboard.sections.quick_forms_subtitle",
                    "Fast data entry for maternal and child healthcare",
                  )}
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {/* Row 1 */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <QuickActionCard
                    onPress={() => router.push("/dashboard/record/add-mother")}
                    Icon={Activity}
                    iconColor="#4F46E5"
                    iconBg="#EEF2FF"
                    label={t("dashboard.quick_actions.pregnant_woman")}
                  />
                  <QuickActionCard
                    onPress={() =>
                      router.push("/dashboard/child/add-child" as any)
                    }
                    Icon={Baby}
                    iconColor="#059669"
                    iconBg="#D1FAE5"
                    label={t("dashboard.quick_actions.newborn")}
                  />
                  <QuickActionCard
                    onPress={() => router.push("/dashboard/visit" as any)}
                    Icon={Heart}
                    iconColor="#E11D48"
                    iconBg="#FFE4E6"
                    label={t("dashboard.quick_actions.follow_up")}
                  />
                </View>

                {/* Row 2 */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <QuickActionCard
                    onPress={() => router.push("/dashboard/delivery" as any)}
                    Icon={Smile}
                    iconColor="#0284C7"
                    iconBg="#E0F2FE"
                    label={t("dashboard.quick_actions.delivery")}
                  />
                  <QuickActionCard
                    onPress={() =>
                      router.push(
                        "/dashboard/mothers-group/mothers-group-meeting-form" as any,
                      )
                    }
                    Icon={Users}
                    iconColor="#D97706"
                    iconBg="#FEF3C7"
                    label={t("dashboard.quick_actions.group_meeting")}
                  />
                  <QuickActionCard
                    onPress={() =>
                      router.push("/dashboard/death-report" as any)
                    }
                    Icon={AlertCircle}
                    iconColor="#475569"
                    iconBg="#F1F5F9"
                    label={t("dashboard.quick_actions.death_report")}
                  />
                </View>

                {/* Row 3 - Adolescent, FCHV Council & Nutrition */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <QuickActionCard
                    onPress={() =>
                      router.push(
                        "/dashboard/adolescent/adolescent-form" as any,
                      )
                    }
                    className="w-[31%]"
                    Icon={UserPlus}
                    iconColor="#7C3AED"
                    iconBg="#F3E8FF"
                    label={t("dashboard.quick_actions.add_adolescent")}
                  />
                  <QuickActionCard
                    onPress={() =>
                      router.push("/dashboard/fchv-counseling" as any)
                    }
                    className="w-[31%]"
                    Icon={Building2}
                    iconColor="#16A34A"
                    iconBg="#F0FDF4"
                    label={t("dashboard.quick_actions.fchv_council")}
                  />
                  <QuickActionCard
                    onPress={() =>
                      router.push("/dashboard/child-nutrition" as any)
                    }
                    className="w-[31%]"
                    Icon={Apple}
                    iconColor="#059669"
                    iconBg="#D1FAE5"
                    label={t("dashboard.quick_actions.nutrition")}
                  />
                </View>
              </View>
            </View>

            {/* Stats Section - Community Pulse */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 4,
                }}
              >
                <View style={sectionBarStyle} />
                <Text style={sectionTitleStyle}>
                  {t("dashboard.sections.community_pulse")}
                </Text>
              </View>
              <Text style={sectionSubtitleStyle}>
                {t(
                  "dashboard.sections.community_pulse_subtitle",
                  "Key health indicators at a glance",
                )}
              </Text>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  path="/dashboard/report?tab=mother"
                  icon={Users}
                  iconColor="#475569"
                  iconBg="#F1F5F9"
                  bg="white"
                  value={formatNum(motherCount)}
                  label={t("dashboard.stats_labels.mothers")}
                  delay={0}
                />
                <StatCard
                  path="/dashboard/report?tab=pregnancy"
                  icon={Baby}
                  iconColor="#0891B2"
                  iconBg="#CFFAFE"
                  bg="white"
                  value={formatNum(pregnancyCount)}
                  label={t("dashboard.stats_labels.pregnant")}
                  delay={100}
                />
                <StatCard
                  path="/dashboard/report?tab=child"
                  icon={Smile}
                  iconColor="#059669"
                  iconBg="#D1FAE5"
                  bg="white"
                  value={formatNum(childCount)}
                  label={t("dashboard.stats_labels.children", "Total Children")}
                  delay={200}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  path="/dashboard/report?tab=adolescent"
                  icon={Heart}
                  iconColor="#7C3AED"
                  iconBg="#EDE9FE"
                  bg="white"
                  value={formatNum(adolescentCount)}
                  label={t(
                    "dashboard.stats_labels.adolescents",
                    "Adolescent Girls",
                  )}
                  delay={300}
                />
                <StatCard
                  path="/dashboard/report?tab=delivery"
                  icon={Activity}
                  iconColor="#0284C7"
                  iconBg="#E0F2FE"
                  bg="white"
                  value={formatNum(deliveryCount)}
                  label={t("dashboard.stats_labels.deliveries")}
                  delay={500}
                />
                <StatCard
                  path="/dashboard/report?tab=mother_meeting"
                  icon={Calendar}
                  iconColor="#D97706"
                  iconBg="#FEF3C7"
                  bg="white"
                  value={formatNum(mothersMeetingCount)}
                  label={t("dashboard.stats_labels.mothers_meetings")}
                  delay={600}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <StatCard
                  path="/dashboard/risk"
                  icon={AlertCircle}
                  iconColor="#E11D48"
                  iconBg="#FFE4E6"
                  bg="#FFE4E6"
                  value={formatNum(highRiskPregnancyCount)}
                  label={t("dashboard.stats_labels.high_risk")}
                  delay={400}
                />
              </View>
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

            {/* Death Stats */}
            <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{ ...sectionBarStyle, backgroundColor: "#E11D48" }}
                />
                <Text style={sectionTitleStyle}>
                  {t("dashboard.sections.death_stats", "Death Statistics")}
                </Text>
              </View>
            </View>
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: "row",
                gap: 12,
              }}
            >
              <StatCard
                layout="minimal"
                path="/dashboard/report?tab=dead_mother"
                icon={AlertCircle}
                iconColor="#E11D48"
                iconBg="#FFE4E6"
                bg="white"
                value={formatNum(maternalDeathCount)}
                label={t("dashboard.stats_labels.mother_deaths")}
                delay={400}
              />
              <StatCard
                layout="minimal"
                path="/dashboard/report?tab=dead_child"
                icon={AlertCircle}
                iconColor="#F97316"
                iconBg="#FFF7ED"
                bg="white"
                value={formatNum(childDeathCount)}
                label={t("dashboard.stats_labels.child_deaths")}
                delay={500}
              />
            </View>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
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
                    {recentActivity.map((activity) => {
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
                              borderWidth: 1,
                              borderColor: "#E2E8F0",
                              overflow: "hidden",
                            }}
                          >
                            <View
                              style={{
                                padding: 14,
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 16,
                                  backgroundColor: activity.bg,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  marginRight: 14,
                                }}
                              >
                                <Icon size={22} color={activity.color} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    color: "#0F172A",
                                    fontSize: 14,
                                    fontWeight: "600",
                                  }}
                                  numberOfLines={1}
                                >
                                  {activity.title}
                                </Text>
                                {activity.subtitle ? (
                                  <Text
                                    style={{
                                      color: "#64748B",
                                      fontSize: 12,
                                      fontWeight: "500",
                                      marginTop: 3,
                                    }}
                                    numberOfLines={1}
                                  >
                                    {activity.subtitle}
                                  </Text>
                                ) : null}
                              </View>
                              <View
                                style={{
                                  backgroundColor: "#F8FAFC",
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderRadius: 8,
                                  marginLeft: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    color: "#94A3B8",
                                    fontSize: 11,
                                    fontWeight: "600",
                                  }}
                                >
                                  {timeStr}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Tasks Section */}
            {todaysTasks.length > 0 && (
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
                              backgroundColor: isDone
                                ? "#10B981"
                                : "transparent",
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
                    borderRadius: 8,
                    backgroundColor: "#475569",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{ color: "white", fontWeight: "700", fontSize: 15 }}
                  >
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
