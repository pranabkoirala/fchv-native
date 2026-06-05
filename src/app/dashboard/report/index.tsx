import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Baby,
  Calendar,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  User,
  Users
} from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";

// Database models
import { Skeleton } from "@/components/common/Skeleton";
import CustomHeader from "@/components/CustomHeader";
import { getAllInfantMonitorings } from "../../../hooks/database/models/InfantMonitoringModel";
import { getAllMaternalDeaths } from "../../../hooks/database/models/MaternalDeathModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../../hooks/database/models/MotherModel";
import { getAllNewbornDeaths } from "../../../hooks/database/models/NewbornDeathModel";
import {
  getPregnantWomenList,
  PregnantWomenListItem,
} from "../../../hooks/database/models/PregnantWomenModal";
import { InfantMonitoringStoreType } from "../../../hooks/database/types/infantMonitoringModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import { toNepaliNumbers } from "../../../utils/dateHelper";
import { getWardById } from "../../../utils/locationHelper";

const RecordCardSkeleton = () => (
  <View className="bg-white rounded-2xl px-3 py-5 mb-4 flex-row items-center border border-slate-200">
    <View className="w-16 h-16 rounded-full bg-slate-50 items-center justify-center border border-slate-100">
      <Skeleton width={32} height={32} borderRadius={16} />
    </View>
    <View className="flex-1 ml-5 gap-2.5">
      <View className="flex-row items-center justify-between">
        <Skeleton width="50%" height={20} borderRadius={6} />
        <Skeleton width={64} height={24} borderRadius={12} />
      </View>
      <View className="flex-row items-center">
        <Skeleton width={14} height={14} borderRadius={4} style={{ marginRight: 6 }} />
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
      <View className="flex-row items-center">
        <Skeleton width={14} height={14} borderRadius={4} style={{ marginRight: 6 }} />
        <Skeleton width="45%" height={14} borderRadius={4} />
      </View>
    </View>
    <View className="ml-4">
      <Skeleton width={20} height={20} borderRadius={10} />
    </View>
  </View>
);

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
  reg_month?: string | number | null;
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

const StatusBadge = memo(function StatusBadge({
  status,
  label,
}: {
  status: UnifiedRecord["status"];
  label: string;
}) {
  const styles: Record<string, { bg: string; text: string }> = {
    normal: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
    },
    high_risk: {
      bg: "bg-rose-100",
      text: "text-rose-600",
    },
    pending: {
      bg: "bg-amber-100",
      text: "text-amber-700",
    },
    deceased: {
      bg: "bg-slate-200",
      text: "text-slate-600",
    },
  };

  const s = styles[status] || styles.normal;

  return (
    <View className={`px-3 py-1 rounded-xl ${s.bg}`}>
      <Text className={`text-[12px] font-bold ${s.text}`}>{label}</Text>
    </View>
  );
});

const RecordCard = memo(function RecordCard({
  record,
  onPress,
}: {
  record: UnifiedRecord;
  onPress: () => void;
}) {
  const getTypeIcon = () => {
    if (
      record.image &&
      record.image !== "https://vectorified.com/images/no-profile-picture-icon-13.png"
    ) {
      return (
        <Image
          source={{ uri: record.image }}
          className="w-16 h-16 rounded-full"
        />
      );
    }

    switch (record.type) {
      case "child":
        return (
          <View className="w-16 h-16 rounded-full bg-indigo-50 items-center justify-center">
            <Baby size={28} color="#6366F1" />
          </View>
        );
      case "dead_mother":
        return (
          <View className="w-16 h-16 rounded-full bg-rose-50 items-center justify-center">
            <Heart size={28} color="#F43F5E" />
          </View>
        );
      case "dead_child":
        return (
          <View className="w-16 h-16 rounded-full bg-orange-50 items-center justify-center">
            <AlertTriangle size={28} color="#EA580C" />
          </View>
        );
      case "pregnancy":
        return (
          <View className="w-16 h-16 rounded-full bg-purple-50 items-center justify-center">
            <Users size={28} color="#8B5CF6" />
          </View>
        );
      default:
        return (
          <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center">
            <User size={28} color="#3B82F6" />
          </View>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      // Strip time/timezone — keep only YYYY-MM-DD
      const dateOnly = dateStr.split("T")[0].trim();
      const bsDate = AdToBs(dateOnly);
      if (bsDate) return toNepaliNumbers(bsDate);
      return dateOnly;
    } catch {
      // If AdToBs fails, show the date portion only
      return dateStr.split("T")[0].trim();
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl px-3 py-5 mb-4 flex-row items-center border border-slate-200"
    >
      {/* Profile Image */}
      {getTypeIcon()}

      {/* Content */}
      <View className="flex-1 ml-5">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-[18px] font-semibold text-slate-800 flex-1 mr-2" numberOfLines={1}>
            {record.name}
          </Text>
          <StatusBadge status={record.status} label={record.statusLabel} />
        </View>

        <View className="flex-row items-center mb-1">
          <MapPin size={14} color="#94A3B8" />
          <Text className="text-[14px] text-slate-500 font-medium ml-1">
            Ward No. {getWardById(record.ward)}
          </Text>
        </View>

        <View className="flex-row items-center">
          <Calendar size={14} color="#94A3B8" />
          <Text className="text-[14px] text-slate-500 font-medium ml-1">
            दर्ता: {formatDate(record.registrationDate)}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <View className="ml-2">
        <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
});

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

  useEffect(() => {
    const layout = tabLayouts.current[activeTab];
    if (layout && tabScrollRef.current) {
      const scrollX = Math.max(0, layout.x - 100);
      tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, [activeTab]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [children, setChildren] = useState<InfantMonitoringStoreType[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnantWomenListItem[]>([]);
  const [maternalDeaths, setMaternalDeaths] = useState<MaternalDeathStoreType[]>([]);
  const [childDeaths, setChildDeaths] = useState<NewbornDeathStoreType[]>([]);

  const [motherNameMap, setMotherNameMap] = useState<Record<string, string>>({});
  const [motherWardMap, setMotherWardMap] = useState<Record<string, string>>({});

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [motherList, childList, pregnancyList, maternalDeathList, childDeathList] = await Promise.all([
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

      const nameMap: Record<string, string> = {};
      const wardMap: Record<string, string> = {};
      motherList.forEach((m) => {
        nameMap[m.id] = m.name;
        if (m.ward) wardMap[m.id] = m.ward;
      });
      setMotherNameMap(nameMap);
      setMotherWardMap(wardMap);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData]),
  );

  const getUnifiedRecords = useCallback((): UnifiedRecord[] => {
    const records: UnifiedRecord[] = [];

    if (activeTab === "all" || activeTab === "mother") {
      mothers.forEach((m) => {
        records.push({
          id: m.id,
          name: m.name,
          ward: m.ward || "",
          registrationDate: m.createdAt || "",
          status: m.pregnancy_count > 0 ? "normal" : "pending",
          statusLabel: m.pregnancy_count > 0 ? t("reports.status.normal") : t("reports.status.pending"),
          type: "mother",
          image: m.image,
          reg_month: m.reg_month || (m.createdAt ? m.createdAt.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "child") {
      children.forEach((c) => {
        const childMotherWard = motherWardMap[c.mother_id || ""] || "";
        records.push({
          id: c.id,
          name: c.baby_name || (language === "np" ? "अज्ञात बालक" : "Unnamed Baby"),
          ward: childMotherWard,
          registrationDate: c.created_at || "",
          status: "normal",
          statusLabel: t("reports.status.normal"),
          type: "child",
          subtitle: `${t("reports.common.mother")}: ${c.mother_name || motherNameMap[c.mother_id || ""] || "-"}`,
          reg_month: c.reg_month || (c.created_at ? c.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "pregnancy") {
      pregnancies.forEach((p) => {
        const riskMap: Record<string, { status: UnifiedRecord["status"]; label: string }> = {
          high: { status: "high_risk", label: t("reports.status.high_risk") },
          moderate: { status: "pending", label: t("reports.status.moderate") },
          normal: { status: "normal", label: t("reports.status.normal") },
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
          reg_month: p.reg_month || (p.created_at ? p.created_at.substring(0, 7) : null),
        });
      });
    }

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
          reg_month: md.reg_month || (md.created_at ? md.created_at.substring(0, 7) : null),
        });
      });
    }

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
          reg_month: cd.reg_month || (cd.created_at ? cd.created_at.substring(0, 7) : null),
        });
      });
    }

    return records;
  }, [activeTab, mothers, children, pregnancies, maternalDeaths, childDeaths, motherNameMap, motherWardMap, language, t]);

  const availableMonths = useMemo(() => {
    const allRecords = getUnifiedRecords();
    const months = new Set<string>();
    allRecords.forEach((r: any) => {
      if (r.reg_month) months.add(r.reg_month);
    });
    return Array.from(months).sort().reverse();
  }, [getUnifiedRecords]);

  const records = useMemo(() => {
    let records = getUnifiedRecords();
    if (selectedMonth !== "all") {
      records = records.filter((r: any) => r.reg_month === selectedMonth);
    }
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter((r) =>
      r.name.toLowerCase().includes(q) || (r.ward || "").toLowerCase().includes(q)
    );
  }, [getUnifiedRecords, search, selectedMonth]);

  const handleCardPress = useCallback((record: UnifiedRecord) => {
    switch (record.type) {
      case "mother":
        router.push({ pathname: "/dashboard/profile", params: { id: record.id, from: "/dashboard/report" } } as any);
        break;
      case "child":
        router.push({ pathname: "/dashboard/report/child-monitoring-details", params: { id: record.id } } as any);
        break;
      case "pregnancy":
        router.push({ pathname: "/dashboard/report/pregnancy-details", params: { id: record.id } } as any);
        break;
      case "dead_mother":
        router.push({ pathname: "/dashboard/report/maternal-death-details", params: { id: record.id } } as any);
        break;
      case "dead_child":
        router.push({ pathname: "/dashboard/report/newborn-death-details", params: { id: record.id } } as any);
        break;
    }
  }, [router]);

  const getTabCount = (key: TabKey): number => {
    switch (key) {
      case "all": return mothers.length + children.length + pregnancies.length + maternalDeaths.length + childDeaths.length;
      case "mother": return mothers.length;
      case "child": return children.length;
      case "pregnancy": return pregnancies.length;
      case "dead_mother": return maternalDeaths.length;
      case "dead_child": return childDeaths.length;
      default: return 0;
    }
  };

  const renderRecord = useCallback(({ item }: { item: UnifiedRecord }) => (
    <RecordCard
      record={item}
      onPress={() => handleCardPress(item)}
    />
  ), [handleCardPress]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <CustomHeader
        title={t("reports.title")}
        onBackPress={() => router.back()}
      />

      {/* Search Bar */}
      <View className="px-4 mt-4">
        <View className="flex-row items-center bg-white px-5 py-1 rounded-lg border border-slate-200">
          <Search size={22} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-3 text-[16px] text-slate-800 font-medium"
            placeholder={language === "np" ? "नाम वा वडा नम्बर खोज्नुहोस्..." : "Search by name or ward..."}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Months Chips */}
      <View className="mt-5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSelectedMonth("all")}
            className={`px-5 py-2.5 rounded-xl ${selectedMonth === "all" ? "bg-slate-700" : "bg-slate-200/50"}`}
          >
            <Text className={`text-[14px] font-bold ${selectedMonth === "all" ? "text-white" : "text-slate-600"}`}>
              {language === "np" ? "सबै महिना" : "All Months"}
            </Text>
          </TouchableOpacity>
          {availableMonths.map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonth(m)}
              className={`px-5 py-2.5 rounded-xl ${selectedMonth === m ? "bg-slate-700" : "bg-slate-200/50"}`}
            >
              <Text className={`text-[14px] font-bold ${selectedMonth === m ? "text-white" : "text-slate-600"}`}>
                {m} {language === "np" ? "महिना" : "Month"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Tabs */}
      <View className="mt-5 pb-2">
        <ScrollView ref={tabScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}>
          {TAB_KEYS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                onLayout={(e) => {
                  tabLayouts.current[tab.key] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
                }}
                className={`px-5 py-2.5 rounded-xl ${isActive ? "bg-emerald-100" : "bg-slate-200/50"}`}
              >
                <Text className={`text-[14px] font-bold ${isActive ? "text-emerald-700" : "text-slate-600"}`}>
                  {t(`reports.tabs.${tab.key}`)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List */}
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        data={loading ? [] : records}
        renderItem={renderRecord}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListEmptyComponent={loading ? (
          <View>
            {[1, 2, 3, 4, 5].map((i) => (
              <RecordCardSkeleton key={i} />
            ))}
          </View>
        ) : (
          <View className="py-20 items-center justify-center">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
              <User size={40} color="#CBD5E1" strokeWidth={1.5} />
            </View>
            <Text className="text-slate-400 font-bold text-base">{t("reports.no_results")}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
