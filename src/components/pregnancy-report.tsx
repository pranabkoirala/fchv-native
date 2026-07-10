import { ReportListSkeleton } from "@/components/common/ReportListSkeleton";
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar, ChevronRight, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import {
  getPregnantWomenList,
  PregnantWomenListItem,
} from "../hooks/database/models/PregnantWomenModal";
import CustomHeader from "./CustomHeader";

type RiskLevel = "high" | "moderate" | "normal";

const RISK_STYLES: Record<
  RiskLevel,
  { badge: string; text: string; dot: string; bar: string }
> = {
  high: {
    badge: "bg-red-100",
    text: "text-red-600",
    dot: "bg-red-500",
    bar: "border-l-red-500",
  },
  moderate: {
    badge: "bg-orange-100",
    text: "text-orange-600",
    dot: "bg-orange-500",
    bar: "border-l-orange-400",
  },
  normal: {
    badge: "bg-green-100",
    text: "text-green-600",
    dot: "bg-green-500",
    bar: "border-l-green-500",
  },
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function PregnancyReportScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [data, setData] = useState<PregnantWomenListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const records = await getPregnantWomenList();
      setData(records);
    } catch (error) {
      console.error("error fetching pregnancy list", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(q) ||
        (item.phone || "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const handleDownload = useCallback(async () => {
    if (data.length === 0) {
      Alert.alert(t("reports.common.no_data"), t("reports.common.no_data_msg"));
      return;
    }
    try {
      const headers = [
        t("reports.common.sn"),
        t("reports.maternal_death_report.mother_name"),
        t("pregnant_form.pregnancy.gravida_label"),
        t("pregnant_form.pregnancy.parity_label") || "Parity",
        t("pregnant_form.pregnancy.lmp_label"),
        t("pregnant_form.pregnancy.edd_label"),
        t("mother_form.phone"),
      ].join(",");

      const rows = data
        .map((item, index) =>
          [
            index + 1,
            `"${item.name}"`,
            item.gravida,
            item.parity,
            item.lmp_date,
            item.edd,
            `"${item.phone}"`,
          ].join(","),
        )
        .join("\n");

      await Share.share({
        message: `${headers}\n${rows}`,
        title: t("reports.pregnancy.title"),
      });
    } catch (error) {
      Alert.alert(
        t("reports.common.export_error"),
        t("reports.common.export_error_msg"),
      );
    }
  }, [data, t]);

  const openProfile = useCallback(
    (motherId: string) => {
      router.push({
        pathname: "/dashboard/profile",
        params: { id: motherId, from: "/dashboard/risk" },
      });
    },
    [router],
  );

  const renderRiskBadge = (level?: string) => {
    if (!level) return null;
    const style = RISK_STYLES[level as RiskLevel] ?? RISK_STYLES.normal;
    const label =
      level === "high"
        ? t("reports.pregnancy.risk_high")
        : level === "moderate"
          ? t("reports.pregnancy.risk_moderate")
          : t("reports.pregnancy.risk_normal");
    return (
      <View className={`px-2 py-0.5 rounded-full ${style.badge}`}>
        <Text className={`text-[10px] font-bold uppercase ${style.text}`}>
          {label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader
        title={t("reports.pregnancy.risk_title")}
        onBackPress={() => router.replace("/dashboard/")}
      />

      {/* Search + summary */}
      <View className="px-4 py-3 gap-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-slate-50 px-4 py-1 rounded-2xl border border-slate-100">
          <Search size={16} color="#64748B" />
          <TextInput
            className="flex-1 ml-2 text-[15px] text-slate-800 font-medium"
            placeholder={t("reports.pregnancy.search_placeholder")}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4 pt-4"
      >
        {loading ? (
          <View>
            {[1, 2, 3, 4, 5].map((i) => (
              <ReportListSkeleton key={i} />
            ))}
          </View>
        ) : filteredData.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Text className="text-slate-400 font-medium">
              {search.trim()
                ? t("reports.pregnancy.no_results")
                : t("reports.common.no_data")}
            </Text>
          </View>
        ) : (
          filteredData.map((item) => {
            const riskStyle =
              RISK_STYLES[(item.risk_level as RiskLevel) ?? "normal"] ??
              RISK_STYLES.normal;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => openProfile(item.mother)}
                className={`bg-white rounded-2xl p-4 mb-3 border border-slate-100 border-l-4 ${riskStyle.bar}`}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-11 h-11 rounded-full bg-purple-50 items-center justify-center mr-3 border border-purple-100">
                      <Text className="font-bold text-purple-700 text-[13px]">
                        {getInitials(item.name)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-[16px] font-bold text-slate-900 mb-0.5"
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </View>
                  </View>
                  {renderRiskBadge(item.risk_level)}
                </View>

                <View className="flex-row items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                  <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#64748B" />
                      <View className="ml-2">
                        <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {t("reports.pregnancy.expected_delivery")}
                        </Text>
                        <Text className="text-[13px] font-semibold text-slate-700">
                          {item.edd || "TBD"}
                        </Text>
                      </View>
                    </View>
                    <View className="items-center">
                      <Text className="text-[10px] text-slate-400 font-bold uppercase">
                        {t("reports.pregnancy.gravida")}
                      </Text>
                      <Text className="text-[13px] font-semibold text-slate-700">
                        {item.gravida || "-"}
                      </Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-[10px] text-slate-400 font-bold uppercase">
                        {t("reports.pregnancy.parity")}
                      </Text>
                      <Text className="text-[13px] font-semibold text-slate-700">
                        {item.parity || "-"}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-[12px] font-bold text-primary mr-1">
                      {t("reports.pregnancy.details")}
                    </Text>
                    <ChevronRight size={14} color="#0056D2" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
