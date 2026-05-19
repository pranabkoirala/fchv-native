import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  ChevronRight,
  Bell,
  User,
  Baby,
  Heart,
  AlertTriangle,
  Users,
} from "lucide-react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useLanguage } from "../../../context/LanguageContext";
import Animated, {
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import "../../../global.css";
import Colors from "../../../constants/Colors";

// Database models
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../../hooks/database/models/MotherModel";
import {
  getAllInfantMonitorings,
} from "../../../hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "../../../hooks/database/types/infantMonitoringModal";
import {
  getPregnantWomenList,
  PregnantWomenListItem,
} from "../../../hooks/database/models/PregnantWomenModal";
import {
  getAllMaternalDeaths,
} from "../../../hooks/database/models/MaternalDeathModel";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import {
  getAllNewbornDeaths,
} from "../../../hooks/database/models/NewbornDeathModel";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import TopHeader from "@/components/layout/TopHeader";
import { getWardById } from "../../../utils/locationHelper";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface UnifiedRecord {
  id: string;
  name: string;
  ward: string;
  registrationDate: string;
  status: "normal" | "high_risk" | "pending" | "deceased";
  statusLabel: string;
  type: "mother" | "child" | "pregnancy" | "dead_mother" | "dead_child";
  image?: string;
  subtitle?: string;
}

type TabKey =
  | "all"
  | "child"
  | "mother"
  | "dead_mother"
  | "dead_child"
  | "pregnancy";

interface TabItem {
  key: TabKey;
}

const TAB_KEYS: TabItem[] = [
  { key: "all" },
  { key: "mother" },
  { key: "pregnancy" },
  { key: "child" },
  { key: "dead_mother" },
  { key: "dead_child" },
];

function StatusBadge({
  status,
  label,
}: {
  status: UnifiedRecord["status"];
  label: string;
}) {
  const styles: Record<
    string,
    { bg: string; text: string; border: string }
  > = {
    normal: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-100",
    },
    high_risk: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
    },
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    deceased: {
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
    },
  };

  const s = styles[status] || styles.normal;

  return (
    <View
      className={`px-3 py-1 rounded-full ${s.bg} border ${s.border}`}
    >
      <Text className={`text-[11px] font-bold ${s.text}`}>{label}</Text>
    </View>
  );
}

function RecordCard({
  record,
  index,
  onPress,
  language,
}: {
  record: UnifiedRecord;
  index: number;
  onPress: () => void;
  language: string;
}) {
  const getTypeIcon = () => {
    switch (record.type) {
      case "child":
        return (
          <View className="w-[52px] h-[52px] rounded-full bg-indigo-50 border-2 border-indigo-100 items-center justify-center">
            <Baby size={22} color="#6366F1" />
          </View>
        );
      case "dead_mother":
        return (
          <View className="w-[52px] h-[52px] rounded-full bg-rose-50 border-2 border-rose-100 items-center justify-center">
            <Heart size={22} color="#F43F5E" />
          </View>
        );
      case "dead_child":
        return (
          <View className="w-[52px] h-[52px] rounded-full bg-orange-50 border-2 border-orange-100 items-center justify-center">
            <AlertTriangle size={22} color="#EA580C" />
          </View>
        );
      case "pregnancy":
        return (
          <View className="w-[52px] h-[52px] rounded-full bg-purple-50 border-2 border-purple-100 items-center justify-center">
            <Users size={22} color="#8B5CF6" />
          </View>
        );
      default:
        // mother
        if (record.image && record.image !== "https://vectorified.com/images/no-profile-picture-icon-13.png") {
          return (
            <Image
              source={{ uri: record.image }}
              className="w-[52px] h-[52px] rounded-full"
              style={{ borderWidth: 2, borderColor: "#E2E8F0" }}
            />
          );
        }
        return (
          <View className="w-[52px] h-[52px] rounded-full bg-blue-50 border-2 border-blue-100 items-center justify-center">
            <User size={22} color="#3B82F6" />
          </View>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, "0")}, ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(index * 60).duration(400).springify()}
      activeOpacity={0.7}
      onPress={onPress}
      className="bg-white rounded-2xl px-4 py-4 mb-3 flex-row items-center border border-slate-100"
    >
      {/* Avatar / Icon */}
      {getTypeIcon()}

      {/* Content */}
      <View className="flex-1 ml-4 mr-3">
        <View className="flex-row items-center mb-1">
          <Text
            className="text-[16px] font-bold text-slate-900 flex-1 mr-2"
            numberOfLines={1}
          >
            {record.name}
          </Text>
          <StatusBadge status={record.status} label={record.statusLabel} />
        </View>
        <Text className="text-[13px] text-slate-500 font-medium" numberOfLines={1}>
          {record.ward ? `Ward No. ${getWardById(record.ward)}` : ""}
          {record.subtitle ? (record.ward ? ` • ${record.subtitle}` : record.subtitle) : ""}
        </Text>
        {record.registrationDate ? (
          <Text className="text-[12px] text-slate-400 font-medium mt-0.5">
            {language === "np" ? "दर्ता:" : "Reg:"} {formatDate(record.registrationDate)}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <View className="bg-slate-50 p-2 rounded-full">
        <ChevronRight size={18} color="#94A3B8" strokeWidth={2.5} />
      </View>
    </AnimatedTouchableOpacity>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const { tab } = useLocalSearchParams<{ tab: TabKey }>();
  const [activeTab, setActiveTab] = useState<TabKey>(tab || "all");
  const tabScrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  // Auto-scroll tab bar to make the active tab visible
  useEffect(() => {
    const layout = tabLayouts.current[activeTab];
    if (layout && tabScrollRef.current) {
      // Scroll so the active tab is roughly centered
      const scrollX = Math.max(0, layout.x - 100);
      tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [activeTab]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Raw data
  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [children, setChildren] = useState<InfantMonitoringStoreType[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnantWomenListItem[]>([]);
  const [maternalDeaths, setMaternalDeaths] = useState<MaternalDeathStoreType[]>([]);
  const [childDeaths, setChildDeaths] = useState<NewbornDeathStoreType[]>([]);

  // Mother name lookup for child / death records
  const [motherNameMap, setMotherNameMap] = useState<Record<string, string>>({});

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [motherList, childList, pregnancyList, maternalDeathList, childDeathList] =
        await Promise.all([
          getAllMothersList(),
          getAllInfantMonitorings(),
          getPregnantWomenList(),
          getAllMaternalDeaths(),
          getAllNewbornDeaths(),
        ]);

      setMothers(motherList);
      setChildren(childList);
      setPregnancies(pregnancyList);
      setMaternalDeaths(maternalDeathList);
      setChildDeaths(childDeathList);

      // Build mother name map
      const nameMap: Record<string, string> = {};
      motherList.forEach((m) => {
        nameMap[m.id] = m.name;
      });
      setMotherNameMap(nameMap);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  const getUnifiedRecords = useCallback((): UnifiedRecord[] => {
    const records: UnifiedRecord[] = [];

    // Mothers
    if (activeTab === "all" || activeTab === "mother") {
      mothers.forEach((m) => {
        records.push({
          id: m.id,
          name: m.name,
          ward: m.ward || "",
          registrationDate: m.createdAt || "",
          status: m.pregnancy_count > 0 ? "normal" : "pending",
          statusLabel:
            m.pregnancy_count > 0
              ? t("reports.status.normal")
              : t("reports.status.pending"),
          type: "mother",
          image: m.image,
        });
      });
    }
    // Children
    if (activeTab === "all" || activeTab === "child") {
      children.forEach((c) => {
        records.push({
          id: c.id,
          name: c.baby_name || (language === "np" ? "अज्ञात बालक" : "Unnamed Baby"),
          ward: "",
          registrationDate: c.created_at || "",
          status: "normal",
          statusLabel: t("reports.status.normal"),
          type: "child",
          subtitle: `${t("reports.common.mother")}: ${c.mother_name || motherNameMap[c.mother_id || ""] || "-"}`,
        });
      });
    }

    // Pregnancies
    if (activeTab === "all" || activeTab === "pregnancy") {
      pregnancies.forEach((p) => {
        const riskMap: Record<string, { status: UnifiedRecord["status"]; label: string }> = {
          high: {
            status: "high_risk",
            label: t("reports.status.high_risk"),
          },
          moderate: {
            status: "pending",
            label: t("reports.status.moderate"),
          },
          normal: {
            status: "normal",
            label: t("reports.status.normal"),
          },
        };
        const risk = riskMap[p.risk_level] || riskMap.normal;

        records.push({
          id: p.id,
          name: p.name || (language === "np" ? "अज्ञात" : "Unknown"),
          ward: p.ward || "",
          registrationDate: p.created_at || "",
          status: risk.status,
          statusLabel: risk.label,
          type: "pregnancy",
          subtitle: `G${p.gravida} P${p.parity}`,
        });
      });
    }

    // Maternal Deaths
    if (activeTab === "all" || activeTab === "dead_mother") {
      maternalDeaths.forEach((md) => {
        records.push({
          id: md.id || "",
          name: md.mother_name || (language === "np" ? "अज्ञात" : "Unknown"),
          ward: "",
          registrationDate: md.created_at || "",
          status: "deceased",
          statusLabel: t("reports.status.deceased"),
          type: "dead_mother",
          subtitle: md.mother_age ? `${t("pregnant_form.basic_info.age_label")}: ${md.mother_age}` : "",
        });
      });
    }

    // Child Deaths
    if (activeTab === "all" || activeTab === "dead_child") {
      childDeaths.forEach((cd) => {
        records.push({
          id: cd.id || "",
          name: cd.baby_name || (language === "np" ? "अज्ञात बालक" : "Unnamed Child"),
          ward: "",
          registrationDate: cd.created_at || "",
          status: "deceased",
          statusLabel: t("reports.status.deceased"),
          type: "dead_child",
          subtitle: `${t("reports.common.mother")}: ${cd.mother_name || "-"}`,
        });
      });
    }

    return records;
  }, [activeTab, mothers, children, pregnancies, maternalDeaths, childDeaths, motherNameMap, language]);

  const filteredRecords = useCallback(() => {
    const records = getUnifiedRecords();
    if (!search.trim()) return records;

    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.ward.toLowerCase().includes(q) ||
        (r.subtitle || "").toLowerCase().includes(q)
    );
  }, [getUnifiedRecords, search]);

  const records = filteredRecords();

  const handleCardPress = (record: UnifiedRecord) => {
    switch (record.type) {
      case "mother":
        router.push({
          pathname: "/dashboard/profile",
          params: { id: record.id, from: "/dashboard/report" },
        } as any);
        break;
      case "child":
        router.push({
          pathname: "/dashboard/report/child-monitoring-details",
          params: { id: record.id },
        } as any);
        break;
      case "pregnancy":
        router.push({
          pathname: "/dashboard/report/pregnancy-details",
          params: { id: record.id },
        } as any);
        break;
      case "dead_mother":
        router.push({
          pathname: "/dashboard/report/maternal-death-details",
          params: { id: record.id },
        } as any);
        break;
      case "dead_child":
        router.push({
          pathname: "/dashboard/report/newborn-death-details",
          params: { id: record.id },
        } as any);
        break;
    }
  };

  const getTabCount = (key: TabKey): number => {
    switch (key) {
      case "all":
        return mothers.length + children.length + pregnancies.length + maternalDeaths.length + childDeaths.length;
      case "mother":
        return mothers.length;
      case "child":
        return children.length;
      case "pregnancy":
        return pregnancies.length;
      case "dead_mother":
        return maternalDeaths.length;
      case "dead_child":
        return childDeaths.length;
      default:
        return 0;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <View className="px-6 pt-4 pb-2">
        <Animated.Text
          entering={FadeIn.duration(500)}
          className="text-2xl font-bold text-slate-700 leading-tight"
        >
          {t("reports.title")}
        </Animated.Text>
        <Text className="text-slate-400 text-[14px] font-medium mt-1">
          {t("reports.subtitle")}
        </Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        className="px-5 mt-3 mb-2"
      >
        <View
          className="flex-row items-center bg-slate-50 px-4 h-[52px] rounded-2xl border border-slate-100"
        >
          <Search size={20} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-3 text-[15px] text-slate-800 font-medium"
            placeholder={t("reports.search_by_name_ward")}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {TAB_KEYS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
                onLayout={(e) => {
                  const layout = {
                    x: e.nativeEvent.layout.x,
                    width: e.nativeEvent.layout.width,
                  };
                  tabLayouts.current[tab.key] = layout;
                  if (tab.key === activeTab && tabScrollRef.current) {
                    const scrollX = Math.max(0, layout.x - 100);
                    tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
                  }
                }}
                className={`px-4 py-2.5 rounded-full flex-row items-center ${
                  isActive
                    ? "bg-slate-900"
                    : "bg-white border border-slate-200"
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    isActive ? "text-white" : "text-slate-600"
                  }`}
                >
                  {t(`reports.tabs.${tab.key}`)}
                </Text>
                {count > 0 && (
                  <View
                    className={`ml-2 px-1.5 py-0.5 rounded-full min-w-[20px] items-center ${
                      isActive ? "bg-white/20" : "bg-slate-100"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-black ${
                        isActive ? "text-white" : "text-slate-500"
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 }}
      >
        {loading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text className="text-slate-400 font-bold text-sm mt-4">
              {t("reports.loading_reports")}
            </Text>
          </View>
        ) : records.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="py-20 items-center justify-center"
          >
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
              <User size={40} color="#CBD5E1" strokeWidth={1.5} />
            </View>
            <Text className="text-slate-400 font-bold text-base">
              {search
                ? t("reports.no_results")
                : t("reports.common.no_data")}
            </Text>
            <Text className="text-slate-300 text-sm mt-1">
              {search
                ? t("reports.try_different")
                : t("reports.no_records_category")}
            </Text>
          </Animated.View>
        ) : (
          records.map((record, index) => (
            <RecordCard
              key={`${record.type}-${record.id}`}
              record={record}
              index={index}
              onPress={() => handleCardPress(record)}
              language={language}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
