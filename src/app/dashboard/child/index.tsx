import CustomHeader from "@/components/CustomHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { getAllInfantMonitorings } from "@/hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";
import { router, useFocusEffect } from "expo-router";
import { Baby, Calendar, ChevronRight, Plus, Search } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const ChildCardSkeleton = () => (
  <View className="bg-white p-4 rounded-2xl flex-row items-center border border-gray-100">
    <Skeleton width={56} height={56} borderRadius={8} />
    <View className="flex-1 ml-4 gap-2">
      <Skeleton width="55%" height={22} borderRadius={6} />
      <Skeleton width="70%" height={14} borderRadius={4} />
      <Skeleton width="40%" height={12} borderRadius={4} />
    </View>
    <Skeleton width={40} height={40} borderRadius={20} />
  </View>
);

export default function ChildManagementScreen() {
  const { t, language } = useLanguage();
  const [infants, setInfants] = useState<InfantMonitoringStoreType[]>([]);
  const [filteredInfants, setFilteredInfants] = useState<InfantMonitoringStoreType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadInfants = async () => {
    try {
      const data = await getAllInfantMonitorings();
      setInfants(data);
      filterData(data, search);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInfants();
    }, [])
  );

  const filterData = (data: InfantMonitoringStoreType[], query: string) => {
    let result = data;
    if (query) {
      result = result.filter(v =>
        v.baby_name?.toLowerCase().includes(query.toLowerCase()) ||
        v.mother_name?.toLowerCase().includes(query.toLowerCase())
      );
    }
    setFilteredInfants(result);
  };

  useEffect(() => {
    filterData(infants, search);
  }, [search, infants]);

  const handleProfileClick = (id: string) => {
    router.push({ pathname: "/dashboard/child/child-profile", params: { id } });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" className="bg-white" />
      <CustomHeader
        title={t("child_page.title")}
        onBackPress={() => router.back()}
        rightNode={
          <TouchableOpacity
            onPress={() => router.push("/dashboard/child/add-child")}
            className="bg-primary/80 px-3 py-2.5 rounded-md items-center justify-center flex-row"
          >
            <Plus size={16} color="#ffffff" strokeWidth={3} />
            <Text className="text-white font-semibold text-[15px] ml-1.5 uppercase tracking-wider">{t("child_page.add_new")}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Search Section */}
        <View className="px-5 mt-3 flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-white px-4 h-14 rounded-md border border-gray-100">
            <Search size={20} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-3 text-base text-[#1E293B]"
              placeholder={t("child_page.search_placeholder")}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* List Content */}
        <View className="px-3 gap-y-4 pt-3">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => <ChildCardSkeleton key={i} />)
          ) : filteredInfants.length > 0 ? (
            filteredInfants.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleProfileClick(item.id)}
                className="bg-white p-4 rounded-2xl flex-row items-center border border-gray-200"
              >
                {/* Avatar */}
                <View className="w-14 h-14 bg-indigo-50 rounded-md items-center justify-center border border-indigo-100">
                  <Baby size={24} color="#6366F1" strokeWidth={2} />
                </View>

                {/* Info */}
                <View className="flex-1 ml-4 justify-center">
                  <Text className="text-slate-800 text-xl font-bold mb-1" numberOfLines={1}>
                    {item.baby_name || t("child_page.unnamed_baby")}
                    {item.status === "dead" && (
                      <Text className="text-rose-600 ml-2"> ({t("reports.status.deceased")})</Text>
                    )}
                  </Text>

                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-600 font-medium text-[15px]" numberOfLines={1}>
                      {t("child_page.mother")}: <Text className="text-slate-800">{item.mother_name || t("child_page.unknown")}</Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Calendar size={12} color="#5f6670ff" />
                    <Text className="text-slate-500 text-[13px] font-medium ml-1" numberOfLines={1}>
                      {language === 'en' ? item.date_of_birth : AdToBs(item.date_of_birth || '')}
                    </Text>
                  </View>
                </View>

                {/* Action */}
                <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                  <ChevronRight size={22} color="#778291ff" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="py-16 items-center justify-center px-4">
              <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Baby size={40} color="#CBD5E1" strokeWidth={1.5} />
              </View>
              <Text className="text-slate-600 font-bold text-lg text-center mb-2">{t("child_page.no_records")}</Text>
              <Text className="text-slate-400 text-sm text-center leading-5 px-6">
                {search
                  ? t("child_page.no_results_msg")
                  : t("child_page.no_records_msg")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
