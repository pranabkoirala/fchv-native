import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Search, Plus, Baby, Calendar, ChevronRight } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomHeader from "@/components/CustomHeader";
import { getAllInfantMonitorings } from "@/hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";
import { AdToBs } from "react-native-nepali-picker";

export default function ChildManagementScreen() {
  const { t } = useTranslation();
  const [infants, setInfants] = useState<InfantMonitoringStoreType[]>([]);
  const [filteredInfants, setFilteredInfants] = useState<InfantMonitoringStoreType[]>([]);
  const [search, setSearch] = useState("");

  const loadInfants = async () => {
    const data = await getAllInfantMonitorings();
    setInfants(data);
    filterData(data, search);
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

  const handleEdit = (id: string) => {
    router.push({ pathname: "/dashboard/child/child-form", params: { id } });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] pt-8">
      <CustomHeader
        title={t("child_page.title")}
        subtitle={t("child_page.subtitle")}
        onBackPress={() => router.replace('/dashboard')}
        rightNode={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/dashboard/child/child-form")}
            className="bg-primary/80 px-3 py-2.5 rounded-md items-center justify-center flex-row"
          >
            <Plus size={16} color="#ffffff" strokeWidth={3} />
            <Text className="text-white font-bold text-xs ml-1.5 uppercase tracking-wider">{t("child_page.add_new")}</Text>
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
          {filteredInfants.length > 0 ? (
            filteredInfants.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleEdit(item.id)}
                className="bg-white p-4 rounded-md flex-row items-center border border-gray-100 shadow-sm"
              >
                {/* Avatar */}
                <View className="w-14 h-14 bg-indigo-50 rounded-[18px] items-center justify-center border border-indigo-100">
                  <Baby size={24} color="#6366F1" strokeWidth={2} />
                </View>

                {/* Info */}
                <View className="flex-1 ml-4 justify-center">
                  <Text className="text-slate-800 text-base font-bold mb-1" numberOfLines={1}>
                    {item.baby_name || t("child_page.unnamed_baby")}
                  </Text>
                  
                  <View className="flex-row items-center mb-1">
                    <Text className="text-slate-500 font-medium text-[13px]" numberOfLines={1}>
                      {t("child_page.mother")}: <Text className="text-slate-700">{item.mother_name || t("child_page.unknown")}</Text>
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Calendar size={12} color="#94A3B8" />
                    <Text className="text-slate-400 text-[11px] font-medium ml-1" numberOfLines={1}>
                      {item.date_of_birth ? AdToBs(item.date_of_birth) : 'N/A'} {t("child_page.bs")}
                    </Text>
                  </View>
                </View>

                {/* Action */}
                <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                  <ChevronRight size={20} color="#94A3B8" />
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
