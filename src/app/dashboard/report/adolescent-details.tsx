import CustomHeader from "@/components/CustomHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { getAdolescentIfaById } from "@/hooks/database/models/AdolescentIfaModel";
import { AdolescentIfaStoreType } from "@/hooks/database/types/adolescentIfaModal";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle2,
  FileText,
  Heart,
  Pencil,
  User,
  XCircle,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DetailSkeleton = () => (
  <ScrollView
    className="flex-1 px-4"
    contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
  >
    <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
      <View className="flex-row items-center mb-6">
        <Skeleton width={56} height={56} borderRadius={16} />
        <View className="flex-1 ml-4 gap-2">
          <Skeleton width="65%" height={22} borderRadius={6} />
          <Skeleton width="45%" height={14} borderRadius={4} />
        </View>
      </View>
      <View className="h-[1px] bg-gray-100 w-full mb-6" />
      <View className="flex-row flex-wrap gap-y-6">
        {[1, 2].map((i) => (
          <View key={i} className="flex-row items-center mr-8">
            <Skeleton width={44} height={44} borderRadius={12} />
            <View className="ml-3 gap-1.5">
              <Skeleton width={70} height={12} borderRadius={4} />
              <Skeleton width={100} height={18} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
  </ScrollView>
);

const PhaseWeekGrid = ({
  record,
  phase,
  label,
  completedLabel,
  pendingLabel,
  t,
  countLabel,
}: {
  record: AdolescentIfaStoreType;
  phase: 1 | 2;
  label: string;
  completedLabel: string;
  pendingLabel: string;
  t: any;
  countLabel: string;
}) => {
  const isCompleted =
    phase === 1 ? record.phase1_completed === 1 : record.phase2_completed === 1;

  let completedCount = 0;
  for (let i = 1; i <= 13; i++) {
    const key = `phase${phase}_week_${i}` as keyof AdolescentIfaStoreType;
    if (record[key] === 1) completedCount++;
  }
  const pct = Math.round((completedCount / 13) * 100);

  return (
    <View className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center gap-2.5">
            <Text className="text-[15px] font-bold text-slate-800">
              {label}
            </Text>
          </View>
          {isCompleted ? (
            <View className="flex-row items-center bg-emerald-50 px-2 py-2 rounded-full">
              <CheckCircle2 size={16} color="#059669" />
              <Text className="text-[12px] font-bold text-emerald-700 ml-2">
                {completedLabel}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center bg-amber-50 px-3.5 py-2 rounded-full">
              <XCircle size={16} color="#D97706" />
              <Text className="text-[13px] font-bold text-amber-700 ml-2">
                {pendingLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="px-5 pb-1">
        <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <View
            className={`h-full rounded-full ${isCompleted ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }}
          />
        </View>
        <Text className="text-[13px] font-bold text-slate-500 mt-2 mb-3">
          {completedCount}/13 ({pct}%)
        </Text>
      </View>

      <View className="px-5 pb-5">
        <View className="flex-row flex-wrap gap-2.5">
          {Array.from({ length: 13 }, (_, i) => {
            const key =
              `phase${phase}_week_${i + 1}` as keyof AdolescentIfaStoreType;
            const done = record[key] === 1;
            return (
              <View
                key={i}
                className={`w-9 h-9 rounded-xl items-center justify-center ${
                  done ? "bg-emerald-100" : "bg-slate-100"
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    done ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {i + 1}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default function AdolescentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [record, setRecord] = useState<AdolescentIfaStoreType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
  }, [id]);

  const fetchDetails = async () => {
    try {
      const data = await getAdolescentIfaById(id);
      setRecord(data);
    } catch (e) {
      console.error("Failed to fetch adolescent details:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader
        title={t("adolescent_page.title")}
        onBackPress={() => router.back()}
        rightNode={
          record ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/dashboard/adolescent/adolescent-form",
                  params: { id: record.id, from: "details" },
                } as any)
              }
              className="w-10 h-10 bg-violet-50 rounded-xl items-center justify-center active:bg-violet-100"
            >
              <Pencil size={20} color="#7C3AED" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <DetailSkeleton />
      ) : !record ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-6">
            <Heart size={44} color="#CBD5E1" />
          </View>
          <Text className="text-slate-400 font-bold text-[18px] text-center leading-7">
            {t("adolescent_page.no_records")}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 12,
            backgroundColor: "#F8FAFC",
          }}
        >
          {/* Profile Header */}
          <View className="mx-4 bg-white p-5 rounded-3xl border border-slate-100 mb-5 shadow-sm">
            <View className="flex-row items-center">
              <View
                className="w-16 h-16 bg-gradient-to-b from-violet-400 to-violet-600 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: "#7C3AED" }}
              >
                <User size={30} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[18px] font-bold text-slate-900">
                  {record.name}
                </Text>
                <View className="flex-row items-center mt-1.5">
                  <View className="w-5 h-5 bg-violet-50 rounded-lg items-center justify-center mr-2">
                    <Calendar size={12} color="#7C3AED" />
                  </View>
                  <Text className="text-[14px] font-semibold text-slate-500">
                    {t("adolescent_page.age_group")}:{" "}
                    <Text className="text-slate-800">{record.age_group}</Text>{" "}
                    {t("adolescent_page.years")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Phase Progress */}
          <View className="mx-4 mb-5 gap-4">
            <PhaseWeekGrid
              record={record}
              phase={1}
              label={t("adolescent_page.form.phase1")}
              completedLabel={t("adolescent_page.phase1_done")}
              pendingLabel={t("adolescent_page.phase1_pending")}
              t={t}
              countLabel={t("adolescent_page.form.weekly_check")}
            />

            <PhaseWeekGrid
              record={record}
              phase={2}
              label={t("adolescent_page.form.phase2")}
              completedLabel={t("adolescent_page.phase2_done")}
              pendingLabel={t("adolescent_page.phase2_pending")}
              t={t}
              countLabel={t("adolescent_page.form.weekly_check_phase2")}
            />
          </View>

          {/* Remarks */}
          {record.remarks ? (
            <View className="mx-4 mb-5">
              <View className="bg-white p-5 rounded-3xl border border-slate-100">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="w-8 h-8 bg-slate-50 rounded-lg items-center justify-center">
                    <FileText size={16} color="#64748B" />
                  </View>
                  <Text className="text-[15px] font-bold text-slate-700 uppercase tracking-wider">
                    {t("reports.common.remarks")}
                  </Text>
                </View>
                <Text className="text-[16px] text-slate-600 font-medium leading-6">
                  {record.remarks}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
