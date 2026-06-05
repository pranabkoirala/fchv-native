import { Skeleton } from "@/components/common/Skeleton";
import CustomHeader from "@/components/CustomHeader";
import { useLanguage } from "@/context/LanguageContext";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronRight,
  Plus,
  Search,
  User
} from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../../hooks/database/models/MotherModel";
import { formatAdDate, formatBsDate, toNepaliNumbers } from "../../../utils/dateHelper";

const RecordSkeleton = () => (
  <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1 mr-3">
        <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: 16 }} />
        <View className="flex-1 gap-2">
          <Skeleton width="60%" height={20} borderRadius={6} />
          <Skeleton width="40%" height={14} borderRadius={4} />
        </View>
      </View>
    </View>
    <View className="mt-4 pt-4 border-t border-slate-50 flex-row justify-between">
      <View className="flex-col gap-2 flex-1">
        <Skeleton width="80%" height={12} borderRadius={4} />
        <Skeleton width="50%" height={16} borderRadius={4} />
      </View>
      <View className="flex-col gap-2 flex-1 items-end">
        <Skeleton width="80%" height={12} borderRadius={4} />
        <Skeleton width="50%" height={16} borderRadius={4} />
      </View>
    </View>
  </View>
);

const RecordCard = memo(function RecordCard({
  item,
  language,
  t,
  onPress,
}: {
  item: MotherListDbItem;
  language: string;
  t: (key: string) => string;
  onPress: (item: MotherListDbItem) => void;
}) {
  const formatAge = (age: string | number | null | undefined) => {
    if (age === null || age === undefined || age === "") return t("record_page.na");
    return language === "np" ? toNepaliNumbers(String(age)) : String(age);
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="bg-white rounded-2xl p-5 mb-4 border border-gray-200 shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center mr-4 border border-slate-100/50">
            <User size={22} color="#64748B" strokeWidth={2.5} />
          </View>
          <View className="flex-1">
            <Text
              className="text-lg font-bold text-slate-800 leading-tight mb-1"
              numberOfLines={1}
            >
              {item.name}
              {item.is_dead && (
                <Text className="text-rose-600 ml-2"> ({t("reports.status.deceased")})</Text>
              )}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-slate-600 font-semibold text-[14px] uppercase tracking-wide">
                {t("record_page.age")}{" "}
                <Text className="text-slate-700 font-semibold">
                  {formatAge(item.age)}
                </Text>
              </Text>
              <View className="w-1 h-1 bg-slate-300 rounded-full mx-2.5" />
              <Text className="text-slate-700 font-semibold text-[14px] uppercase tracking-wide">
                {t("record_page.reg")}{" "}
                <Text className="text-slate-700 font-semibold text-[15px]">
                  {formatAdDate(item.createdAt, language)}
                </Text>
              </Text>
            </View>
          </View>
        </View>
        <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <ChevronRight size={16} color="#8195afff" strokeWidth={3} />
        </View>
      </View>

      <View className="mt-4 pt-4 border-t border-slate-50 flex-row justify-between">
        <View className="flex-col gap-1 items-center">
          <View className="flex-row gap-1 items-center">
            <CalendarDays
              size={14}
              color="#646f7eff"
              strokeWidth={2.5}
              className="mr-1.5"
            />
            <Text className="text-slate-600 text-[13px] font-semibold uppercase tracking-wider">
              {t("record_page.lmp_date")}:{" "}
            </Text>
          </View>
          <Text className="text-slate-700 ml-5 text-[15px] font-semibold">
            {formatBsDate(item.lmp, language)}
          </Text>
        </View>
        <View className="flex-col gap-1 items-center">
          <View className="flex-row items-center gap-1">
            <CalendarDays
              size={14}
              color="#646f7eff"
              strokeWidth={2.5}
              className="mr-1.5"
            />
            <Text className="text-slate-600 text-[13px] font-semibold uppercase tracking-wider">
              {t("record_page.edd_date")}:{" "}
            </Text>
          </View>
          <Text className="text-slate-700 ml-5 text-[15px] font-semibold">
            {formatAdDate(item.edd, language)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function RecordScreen() {
  const router = useRouter();
  const { language, t } = useLanguage()
  const [records, setRecords] = useState<MotherListDbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchRecords = async () => {
        try {
          const data = await getAllMothersList();
          setRecords(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    }, []),
  );

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return records;
    return records.filter((r) => r.name?.toLowerCase().includes(query));
  }, [records, searchQuery]);

  const handleRecordPress = useCallback((item: MotherListDbItem) => {
    router.push({
      pathname: "/dashboard/profile",
      params: { id: item.id, from: "/dashboard/record" },
    } as any);
  }, [router]);

  const renderRecord = useCallback(({ item }: { item: MotherListDbItem }) => (
    <RecordCard item={item} language={language} t={t} onPress={handleRecordPress} />
  ), [handleRecordPress, language, t]);

  const listHeader = (
    <View className="flex-row items-center rounded-xl bg-white mb-6 px-4 border border-gray-200 mt-2">
      <Search size={18} color="#94A3B8" strokeWidth={2.5} />
      <TextInput
        className="flex-1 ml-3 text-slate-700 font-semibold text-md py-4 h-full"
        placeholder={t("record_page.search_placeholder")}
        placeholderTextColor="#94A3B8"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* App Header */}
      <CustomHeader
        title={t("record_page.title")}
        onBackPress={() => router.back()}
        rightNode={
          <TouchableOpacity
            onPress={() => router.push("/dashboard/record/add-mother")}
            className="bg-primary px-4 py-2.5 rounded-md items-center justify-center flex-row"
          >
            <Plus size={16} color="#ffffff" strokeWidth={3} />
            <Text className="text-white font-semibold text-md ml-1.5 uppercase tracking-wider">{t("record_page.new_entry")}</Text>
          </TouchableOpacity>
        }
      />
      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        data={loading ? [] : filteredRecords}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={loading ? (
          <View>
            {[1, 2, 3, 4, 5].map((i) => <RecordSkeleton key={i} />)}
          </View>
        ) : (
          <View className="py-20 items-center justify-center bg-white rounded-3xl border border-gray-100 border-dashed">
            <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4 border border-slate-100">
              <Search size={28} color="#CBD5E1" strokeWidth={1.5} />
            </View>
            <Text className="text-slate-400 font-bold text-sm tracking-wide">
              {t("record_page.no_records")}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
