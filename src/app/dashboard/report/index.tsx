import { useFocusEffect, useGlobalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  Baby,
  Calendar,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  User,
  Users,
} from "lucide-react-native";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";

// Database models
import { Skeleton } from "@/components/common/Skeleton";
import CustomHeader from "@/components/CustomHeader";
import { getAllDeliveries } from "../../../hooks/database/models/DeliveryModel";
import { getAllInfantMonitorings } from "../../../hooks/database/models/InfantMonitoringModel";
import { getAllMaternalDeaths } from "../../../hooks/database/models/MaternalDeathModel";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../../hooks/database/models/MotherModel";
import { getAllMothersGroupMeetings } from "../../../hooks/database/models/MothersGroupMeetingModel";
import { getAllNewbornDeaths } from "../../../hooks/database/models/NewbornDeathModel";
import {
  getPregnantWomenList,
  PregnantWomenListItem,
} from "../../../hooks/database/models/PregnantWomenModal";
import { getAllAdolescentIfa } from "../../../hooks/database/models/AdolescentIfaModel";
import { AdolescentIfaStoreType } from "../../../hooks/database/types/adolescentIfaModal";
import { DeliveryStoreType } from "../../../hooks/database/types/deliveryModal";
import { InfantMonitoringStoreType } from "../../../hooks/database/types/infantMonitoringModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import { toNepaliNumbers } from "../../../utils/dateHelper";
import {
  getMunicipalityById,
  getWardById,
} from "../../../utils/locationHelper";

const RecordCardSkeleton = () => (
  <View className="bg-white rounded-2xl mb-3 overflow-hidden border border-slate-100">
    <View className="flex-row">
      <View className="w-1.5 bg-slate-200" />
      <View className="flex-1 flex-row items-center py-4 pr-4 pl-3">
        <Skeleton
          width={48}
          height={48}
          borderRadius={12}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1 gap-2">
          <View className="flex-row items-center justify-between">
            <Skeleton width="45%" height={16} borderRadius={6} />
            <Skeleton width={60} height={22} borderRadius={11} />
          </View>
          <View className="flex-row gap-3">
            <Skeleton width={60} height={12} borderRadius={4} />
            <Skeleton width={100} height={12} borderRadius={4} />
          </View>
          <Skeleton width="55%" height={12} borderRadius={4} />
        </View>
        <Skeleton
          width={24}
          height={24}
          borderRadius={12}
          style={{ marginLeft: 8 }}
        />
      </View>
    </View>
  </View>
);

interface UnifiedRecord {
  id: string;
  motherId?: string;
  childId?: string;
  name: string;
  ward: string;
  municipality?: string;
  registrationDate: string;
  status: "normal" | "high_risk" | "pending" | "deceased";
  statusLabel: string;
  type:
    | "mother"
    | "child"
    | "pregnancy"
    | "dead_mother"
    | "dead_child"
    | "delivery"
    | "mother_meeting"
    | "adolescent";
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
  | "pregnancy"
  | "delivery"
  | "mother_meeting"
  | "adolescent";

interface TabItem {
  key: TabKey;
}

const TAB_KEYS: TabItem[] = [
  { key: "all" },
  { key: "mother" },
  { key: "pregnancy" },
  { key: "child" },
  { key: "adolescent" },
  { key: "delivery" },
  { key: "mother_meeting" },
  { key: "dead_mother" },
  { key: "dead_child" },
];

const TYPE_COLORS: Record<
  string,
  { bg: string; iconBg: string; accent: string; icon: string }
> = {
  mother: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    accent: "#3B82F6",
    icon: "#3B82F6",
  },
  child: {
    bg: "bg-indigo-50",
    iconBg: "bg-indigo-500",
    accent: "#6366F1",
    icon: "#6366F1",
  },
  pregnancy: {
    bg: "bg-purple-50",
    iconBg: "bg-purple-500",
    accent: "#8B5CF6",
    icon: "#8B5CF6",
  },
  dead_mother: {
    bg: "bg-rose-50",
    iconBg: "bg-rose-500",
    accent: "#F43F5E",
    icon: "#F43F5E",
  },
  dead_child: {
    bg: "bg-orange-50",
    iconBg: "bg-orange-500",
    accent: "#EA580C",
    icon: "#EA580C",
  },
  delivery: {
    bg: "bg-teal-50",
    iconBg: "bg-teal-500",
    accent: "#0D9488",
    icon: "#0D9488",
  },
  mother_meeting: {
    bg: "bg-cyan-50",
    iconBg: "bg-cyan-500",
    accent: "#0891B2",
    icon: "#0891B2",
  },
  adolescent: {
    bg: "bg-violet-50",
    iconBg: "bg-violet-500",
    accent: "#7C3AED",
    icon: "#7C3AED",
  },
};

const DANGER_COLORS = {
  bg: "bg-rose-50",
  iconBg: "bg-rose-500",
  accent: "#F43F5E",
  icon: "#F43F5E",
};

const RecordCard = memo(function RecordCard({
  record,
  onPress,
}: {
  record: UnifiedRecord;
  onPress: () => void;
}) {
  const { t } = useLanguage();
  const colors =
    record.status === "deceased"
      ? DANGER_COLORS
      : TYPE_COLORS[record.type] || TYPE_COLORS.mother;

  const getTypeIcon = () => {
    if (
      record.image &&
      record.image !==
        "https://vectorified.com/images/no-profile-picture-icon-13.png"
    ) {
      return (
        <View className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200">
          <Image
            source={{ uri: record.image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
      );
    }

    const iconProps = { size: 22, color: "#FFFFFF" };

    switch (record.type) {
      case "child":
        return <Baby {...iconProps} />;
      case "dead_mother":
        return <Heart {...iconProps} />;
      case "dead_child":
        return <AlertTriangle {...iconProps} />;
      case "pregnancy":
        return <Users {...iconProps} />;
      case "delivery":
        return <Baby {...iconProps} />;
      case "mother_meeting":
        return <Users {...iconProps} />;
      case "adolescent":
        return <Heart {...iconProps} />;
      default:
        return <User {...iconProps} />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const dateOnly = dateStr.split("T")[0].trim();
      const bsDate = AdToBs(dateOnly);
      if (bsDate) return toNepaliNumbers(bsDate);
      return dateOnly;
    } catch {
      return dateStr.split("T")[0].trim();
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl mb-3 overflow-hidden border border-slate-100"
    >
      <View className="flex-row">
        <View className={`w-1.5 ${colors.iconBg}`} />
        <View className="flex-1 flex-row items-center py-4 pr-4 pl-3">
          <View
            className={`w-12 h-12 rounded-xl ${colors.bg} items-center justify-center`}
          >
            {getTypeIcon()}
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row items-center mb-1.5">
              <Text
                className="text-[16px] font-bold text-slate-900 flex-1"
                numberOfLines={1}
              >
                {record.name}
              </Text>
            </View>

            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded-full bg-slate-100 items-center justify-center mr-1.5">
                  <MapPin size={9} color="#94A3B8" />
                </View>
                <Text className="text-[12px] text-slate-500 font-medium">
                  {record.municipality
                    ? getMunicipalityById(record.municipality)
                    : getWardById(record.ward)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded-full bg-slate-100 items-center justify-center mr-1.5">
                  <Calendar size={9} color="#94A3B8" />
                </View>
                <Text className="text-[12px] text-slate-500 font-medium">
                  {formatDate(record.registrationDate)}
                </Text>
              </View>
            </View>

            {record.subtitle && (
              <View className="flex-row items-center mt-1.5">
                <View className="h-1 w-1 rounded-full bg-slate-300 mr-2" />
                <Text
                  className="text-[12px] text-slate-400 font-medium"
                  numberOfLines={1}
                >
                  {record.subtitle}
                </Text>
              </View>
            )}
          </View>

          <View className="ml-2 w-6 h-6 rounded-full bg-slate-50 items-center justify-center">
            <ChevronRight size={14} color="#CBD5E1" strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ReportScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const { tab } = useGlobalSearchParams<{ tab: TabKey }>();
  const [activeTab, setActiveTab] = useState<TabKey>(tab || "all");
  const tabScrollRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const scrollToTab = useCallback((tabKey: TabKey) => {
    const layout = tabLayouts.current[tabKey];
    if (layout && tabScrollRef.current) {
      const screenWidth = Dimensions.get("window").width;
      const scrollX = Math.max(0, layout.x - (screenWidth - layout.width) / 2);
      tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  }, []);

  useEffect(() => {
    scrollToTab(activeTab);
  }, [activeTab, scrollToTab]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [children, setChildren] = useState<InfantMonitoringStoreType[]>([]);
  const [pregnancies, setPregnancies] = useState<PregnantWomenListItem[]>([]);
  const [maternalDeaths, setMaternalDeaths] = useState<
    MaternalDeathStoreType[]
  >([]);
  const [childDeaths, setChildDeaths] = useState<NewbornDeathStoreType[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryStoreType[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [adolescents, setAdolescents] = useState<AdolescentIfaStoreType[]>([]);

  const { motherNameMap, motherWardMap, motherMunicipalityMap } = useMemo(() => {
    const nameMap: Record<string, string> = {};
    const wardMap: Record<string, string> = {};
    const municipalityMap: Record<string, string> = {};
    mothers.forEach((m) => {
      nameMap[m.id] = m.name;
      if (m.ward) wardMap[m.id] = m.ward;
      if (m.municipality) municipalityMap[m.id] = m.municipality;
    });
    return {
      motherNameMap: nameMap,
      motherWardMap: wardMap,
      motherMunicipalityMap: municipalityMap,
    };
  }, [mothers]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        motherList,
        childList,
        pregnancyList,
        maternalDeathList,
        childDeathList,
        deliveryList,
        meetingList,
        adolescentList,
      ] = await Promise.all([
        getAllMothersList(),
        getAllInfantMonitorings(),
        getPregnantWomenList(),
        getAllMaternalDeaths(),
        getAllNewbornDeaths(),
        getAllDeliveries(),
        getAllMothersGroupMeetings(),
        getAllAdolescentIfa(),
      ]);

      setMothers(motherList);
      setChildren(childList);
      setPregnancies(pregnancyList);
      setMaternalDeaths(maternalDeathList);
      setChildDeaths(childDeathList);
      setDeliveries(deliveryList);
      setMeetings(meetingList);
      setAdolescents(adolescentList);
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

  const allRecords = useMemo((): UnifiedRecord[] => {
    const records: UnifiedRecord[] = [];

    if (activeTab === "all" || activeTab === "mother") {
      mothers.forEach((m) => {
        records.push({
          id: m.id,
          name: m.name,
          ward: m.ward || "",
          municipality: m.municipality || "",
          registrationDate: m.createdAt || "",
          status: m.is_dead
            ? "deceased"
            : m.pregnancy_count > 0
              ? "normal"
              : "pending",
          statusLabel: m.is_dead
            ? t("reports.status.deceased")
            : m.pregnancy_count > 0
              ? t("reports.status.normal")
              : t("reports.status.pending"),
          type: "mother",
          image: m.image,
          reg_month:
            m.reg_month || (m.createdAt ? m.createdAt.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "child") {
      children.forEach((c) => {
        const childMotherWard = motherWardMap[c.mother || ""] || "";
        const childMotherMunicipality =
          motherMunicipalityMap[c.mother || ""] || "";
        records.push({
          id: c.id,
          name: c.baby_name || t("reports.unnamed_baby"),
          ward: childMotherWard,
          municipality: childMotherMunicipality,
          registrationDate: c.created_at || "",
          status: c.status === "dead" ? "deceased" : "normal",
          statusLabel:
            c.status === "dead"
              ? t("reports.status.deceased")
              : t("reports.status.normal"),
          type: "child",
          subtitle: `${t("reports.common.mother")}: ${c.mother_name || motherNameMap[c.mother || ""] || "-"}`,
          reg_month:
            c.reg_month || (c.created_at ? c.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "pregnancy") {
      const riskMap: Record<
        string,
        { status: UnifiedRecord["status"]; label: string }
      > = {
        high: { status: "high_risk", label: t("reports.status.high_risk") },
        moderate: { status: "pending", label: t("reports.status.moderate") },
        normal: { status: "normal", label: t("reports.status.normal") },
      };
      pregnancies.forEach((p) => {
        const risk = riskMap[p.risk_level] || riskMap.normal;

        records.push({
          id: p.id,
          motherId: p.mother,
          name: p.name || t("reports.unknown"),
          ward: p.ward || "",
          municipality: motherMunicipalityMap[p.mother] || "",
          registrationDate: p.created_at || "",
          status: risk.status,
          statusLabel: risk.label,
          type: "pregnancy",
          subtitle: `G${p.gravida} P${p.parity}`,
          reg_month:
            p.reg_month || (p.created_at ? p.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "dead_mother") {
      maternalDeaths.forEach((md) => {
        records.push({
          id: md.id || "",
          motherId: md.mother,
          name: md.mother_name || t("reports.unknown"),
          ward: "",
          registrationDate: md.created_at || "",
          status: "deceased",
          statusLabel: t("reports.status.deceased"),
          type: "dead_mother",
          subtitle: md.mother_age
            ? `${t("pregnant_form.basic_info.age_label")}: ${md.mother_age}`
            : "",
          reg_month:
            md.reg_month ||
            (md.created_at ? md.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "dead_child") {
      childDeaths.forEach((cd) => {
        records.push({
          id: cd.id || "",
          motherId: cd.mother,
          childId: cd.child_id || undefined,
          name: cd.baby_name || t("reports.unnamed_baby"),
          ward: "",
          registrationDate: cd.created_at || "",
          status: "deceased",
          statusLabel: t("reports.status.deceased"),
          type: "dead_child",
          subtitle: `${t("reports.common.mother")}: ${cd.mother_name || "-"}`,
          reg_month:
            cd.reg_month ||
            (cd.created_at ? cd.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "delivery") {
      deliveries.forEach((d) => {
        records.push({
          id: d.id,
          motherId: d.mother,
          name: (d as any).mother_name || t("reports.unknown"),
          ward: "",
          registrationDate: d.created_at || "",
          status: "normal",
          statusLabel: t("reports.status.normal"),
          type: "delivery",
          subtitle: d.gender
            ? `${t("newborn_death_modal.gender")}: ${d.gender}`
            : undefined,
          reg_month:
            d.reg_month || (d.created_at ? d.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "mother_meeting") {
      meetings.forEach((m) => {
        records.push({
          id: m.id,
          name: m.meeting_location || t("reports.unknown"),
          ward: m.ward_no || "",
          registrationDate: m.created_at || "",
          status: "normal",
          statusLabel: t("reports.status.normal"),
          type: "mother_meeting",
          subtitle: `${t("reports.visit.attendees")}: ${m.attendees_count}`,
          reg_month:
            m.reg_month || (m.created_at ? m.created_at.substring(0, 7) : null),
        });
      });
    }

    if (activeTab === "all" || activeTab === "adolescent") {
      adolescents.forEach((a) => {
        records.push({
          id: a.id,
          name: a.name,
          ward: "",
          registrationDate: a.created_at || "",
          status: "normal",
          statusLabel: t("reports.status.normal"),
          type: "adolescent",
          subtitle: `${t("adolescent_page.age_group")}: ${a.age_group} ${t("adolescent_page.years")}`,
          reg_month: a.reg_month?.toString() || (a.created_at ? a.created_at.substring(0, 7) : null),
        });
      });
    }

    return records;
  }, [
    activeTab,
    mothers,
    children,
    pregnancies,
    maternalDeaths,
    childDeaths,
    deliveries,
    meetings,
    adolescents,
    motherNameMap,
    motherWardMap,
    motherMunicipalityMap,
    t,
  ]);

  const records = useMemo(() => {
    if (!search.trim()) return allRecords;
    const q = search.toLowerCase();
    return allRecords.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.ward || "").toLowerCase().includes(q),
    );
  }, [allRecords, search]);

  const handleCardPress = useCallback(
    (record: UnifiedRecord) => {
      const fromTab = activeTab;
      switch (record.type) {
        case "mother":
          router.push({
            pathname: "/dashboard/profile",
            params: { id: record.id, from: "/dashboard/report", fromTab },
          } as any);
          break;
        case "child":
          router.push({
            pathname: "/dashboard/child/child-profile",
            params: { id: record.id, from: "/dashboard/report", fromTab },
          } as any);
          break;
        case "pregnancy":
          router.push({
            pathname: "/dashboard/profile",
            params: { id: record.motherId, from: "/dashboard/report", fromTab },
          } as any);
          break;
        case "dead_mother":
          if (record.motherId) {
            router.push({
              pathname: "/dashboard/profile",
              params: { id: record.motherId, from: "/dashboard/report", fromTab },
            } as any);
          } else {
            router.push({
              pathname: "/dashboard/report/maternal-death-details",
              params: { id: record.id, from: "/dashboard/report", fromTab },
            } as any);
          }
          break;
        case "dead_child":
          if (record.childId) {
            router.push({
              pathname: "/dashboard/child/child-profile",
              params: { id: record.childId, from: "/dashboard/report", fromTab },
            } as any);
          } else if (record.motherId) {
            router.push({
              pathname: "/dashboard/profile",
              params: { id: record.motherId, from: "/dashboard/report", fromTab },
            } as any);
          }
          break;
        case "delivery":
          if (record.motherId) {
            router.push({
              pathname: "/dashboard/profile",
              params: { id: record.motherId, from: "/dashboard/report", fromTab },
            } as any);
          }
          break;
        case "mother_meeting":
          router.push({
            pathname: "/dashboard/report/mother-meeting-details",
            params: { id: record.id, from: "/dashboard/report", fromTab },
          } as any);
          break;
        case "adolescent":
          router.push({
            pathname: "/dashboard/report/adolescent-details",
            params: { id: record.id, from: "/dashboard/report", fromTab },
          } as any);
          break;
      }
    },
    [router, activeTab],
  );

  const getTabCount = (key: TabKey): number => {
    switch (key) {
      case "all":
        return (
          mothers.length +
          children.length +
          pregnancies.length +
          adolescents.length +
          maternalDeaths.length +
          childDeaths.length
        );
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
      case "delivery":
        return deliveries.length;
      case "mother_meeting":
        return meetings.length;
      case "adolescent":
        return adolescents.length;
      default:
        return 0;
    }
  };

  const renderRecord = useCallback(
    ({ item }: { item: UnifiedRecord }) => (
      <RecordCard record={item} onPress={() => handleCardPress(item)} />
    ),
    [handleCardPress],
  );

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
            placeholder={t("reports.search_by_name_ward")}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View className="mt-5 pb-1">
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {TAB_KEYS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            const tabBg = isActive ? "bg-indigo-50" : "bg-transparent";
            const tabIcon = () => {
              const s = 14;
              const c = isActive ? "#4338CA" : "#94A3B8";
              switch (tab.key) {
                case "all":
                  return (
                    <View
                      className="w-3.5 h-3.5 rounded-sm border-2"
                      style={{ borderColor: c }}
                    />
                  );
                case "mother":
                  return <User size={s} color={c} />;
                case "pregnancy":
                  return <Users size={s} color={c} />;
                case "child":
                  return <Baby size={s} color={c} />;
                case "delivery":
                  return <Baby size={s} color={c} />;
                case "mother_meeting":
                  return <Users size={s} color={c} />;
                case "dead_mother":
                  return <Heart size={s} color={c} />;
                case "dead_child":
                  return <AlertTriangle size={s} color={c} />;
                case "adolescent":
                  return <Heart size={s} color={c} />;
                default:
                  return null;
              }
            };
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  tabLayouts.current[tab.key] = { x, width };
                  if (tab.key === activeTab) {
                    scrollToTab(tab.key);
                  }
                }}
                activeOpacity={0.7}
                className={`flex-row items-center px-3.5 py-2.5 rounded-xl ${tabBg}`}
              >
                {tabIcon()}
                <Text
                  className={`text-[13px] font-bold ml-2 ${isActive ? "text-indigo-700" : "text-slate-500"}`}
                >
                  {t(`reports.tabs.${tab.key}`)}
                </Text>
                <View
                  className={`ml-2 px-2 py-0.5 rounded-full ${isActive ? "bg-indigo-100" : "bg-slate-100"}`}
                >
                  <Text
                    className={`text-[11px] font-bold ${isActive ? "text-indigo-600" : "text-slate-400"}`}
                  >
                    {count}
                  </Text>
                </View>
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
        ListEmptyComponent={
          loading ? (
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
              <Text className="text-slate-400 font-bold text-base">
                {t("reports.no_results")}
              </Text>
            </View>
          )
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          paddingTop: 10,
        }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
