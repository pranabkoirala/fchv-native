import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Search, Plus, Heart, ChevronRight, Trash2 } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import CustomHeader from "@/components/CustomHeader";
import { getAllAdolescentIfa } from "@/hooks/database/models/AdolescentIfaModel";
import { AdolescentIfaStoreType } from "@/hooks/database/types/adolescentIfaModal";

export default function AdolescentManagementScreen() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<AdolescentIfaStoreType[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<
    AdolescentIfaStoreType[]
  >([]);
  const [search, setSearch] = useState("");

  const loadRecords = async () => {
    try {
      const data = await getAllAdolescentIfa();
      setRecords(data);
      filterData(data, search);
    } catch (err) {
      console.error("Failed to load adolescent records:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, []),
  );

  const filterData = (data: AdolescentIfaStoreType[], query: string) => {
    let result = data;
    if (query) {
      result = result.filter((v) =>
        v.name?.toLowerCase().includes(query.toLowerCase()),
      );
    }
    setFilteredRecords(result);
  };

  useEffect(() => {
    filterData(records, search);
  }, [search, records]);

  const handleEdit = (id: string) => {
    router.push({
      pathname: "/dashboard/adolescent/adolescent-form",
      params: { id },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] pt-10">
      <CustomHeader
        title={t("adolescent_page.title", "Adolescent Girls IFA")}
        subtitle={t(
          "adolescent_page.subtitle",
          "Iron Folic Acid (IFA) distribution records",
        )}
        onBackPress={() => router.replace("/dashboard")}
        rightNode={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/dashboard/adolescent/adolescent-form")}
            className="bg-primary/80 px-3 py-2.5 rounded-md items-center justify-center flex-row"
          >
            <Plus size={16} color="#ffffff" strokeWidth={3} />
            <Text className="text-white font-bold text-xs ml-1.5 uppercase tracking-wider">
              {t("adolescent_page.add_new", "Add New")}
            </Text>
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
              placeholder={t(
                "adolescent_page.search_placeholder",
                "Search by name...",
              )}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* List Content */}
        <View className="px-3 gap-y-4 pt-3">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => handleEdit(item.id)}
                className="bg-white p-4 rounded-md flex-row items-center border border-gray-100 shadow-sm"
              >
                {/* Avatar */}
                <View className="w-14 h-14 bg-purple-50 rounded-[18px] items-center justify-center border border-purple-100">
                  <Heart size={24} color="#A855F7" strokeWidth={2} />
                </View>

                {/* Info */}
                <View className="flex-1 ml-4 justify-center">
                  <Text
                    className="text-slate-800 text-base font-bold mb-1"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>

                  <View className="flex-row items-center mb-1.5">
                    <Text className="text-slate-500 font-medium text-[13px]">
                      {t("adolescent_page.age_group", "Age Group")}:{" "}
                      <Text className="text-purple-700 font-bold">
                        {item.age_group} {t("adolescent_page.years", "Yrs")}
                      </Text>
                    </Text>
                  </View>

                  <View className="flex-row gap-x-2 flex-wrap gap-y-1">
                    <View
                      className={`px-2 py-0.5 rounded-full ${item.phase1_completed ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${item.phase1_completed ? "text-emerald-700" : "text-slate-500"}`}
                      >
                        {item.phase1_completed
                          ? t(
                              "adolescent_page.phase1_done",
                              "Phase 1: Completed",
                            )
                          : t(
                              "adolescent_page.phase1_pending",
                              "Phase 1: In Progress",
                            )}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-full ${item.phase2_completed ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}
                    >
                      <Text
                        className={`text-[10px] font-semibold ${item.phase2_completed ? "text-emerald-700" : "text-slate-500"}`}
                      >
                        {item.phase2_completed
                          ? t(
                              "adolescent_page.phase2_done",
                              "Phase 2: Completed",
                            )
                          : t(
                              "adolescent_page.phase2_pending",
                              "Phase 2: In Progress",
                            )}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Delete and Edit Chevron */}
                <View className="flex-row items-center gap-x-2">
                  <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                    <ChevronRight size={20} color="#94A3B8" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View className="py-16 items-center justify-center px-4">
              <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Heart size={40} color="#CBD5E1" strokeWidth={1.5} />
              </View>
              <Text className="text-slate-600 font-bold text-lg text-center mb-2">
                {t("adolescent_page.no_records", "No Records Found")}
              </Text>
              <Text className="text-slate-400 text-sm text-center leading-5 px-6">
                {search
                  ? t(
                      "adolescent_page.no_results_msg",
                      "We couldn't find any adolescent girls matching your search.",
                    )
                  : t(
                      "adolescent_page.no_records_msg",
                      "Start by adding a new adolescent girl distribution record.",
                    )}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
