import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Search, Plus, Edit2 } from "lucide-react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import CustomHeader from "@/components/CustomHeader";
import { getAllInfantMonitorings } from "@/hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";
import { AdToBs } from "react-native-nepali-picker";

export default function ChildManagementScreen() {
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
    <SafeAreaView className="flex-1 bg-white pt-12">
      <CustomHeader
        title="Child Registration"
        subtitle=""
        onBackPress={() => router.replace('/dashboard')}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View className="flex-row items-center px-5 mt-6 gap-3">
          <View className="flex-1 flex-row items-center bg-white px-4 h-14 rounded-2xl border border-gray-200">
            <Search size={20} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-3 text-base text-[#1E293B] font-medium"
              placeholder="Search By Name..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/dashboard/child/child-form")}
            className="bg-primary w-14 h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-900/20"
          >
            <Plus size={28} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-center px-6 mt-10 mb-4">
          <Text className="text-[#1E293B] text-xl font-bold">Child Health Logs</Text>
        </View>

        <View className="px-5">
          {filteredInfants.length > 0 ? (
            filteredInfants.map((item) => (
              <View
                key={item.id}
                className="bg-white p-4 rounded-[28px] mb-4 flex-row items-center border border-gray-100 shadow-sm"
              >
                  <View className="flex-1 ml-4 justify-center">
                  <Text className="text-[#1E293B] text-lg font-black leading-tight" numberOfLines={1}>
                    {item.baby_name || 'Unnamed Baby'}
                  </Text>
                  <Text className="text-gray-400 font-bold text-[13px] mt-0.5" numberOfLines={1}>
                    Mother: {item.mother_name || 'Unknown'}
                  </Text>
                  <Text className="text-gray-400 text-[11px] mt-1" numberOfLines={1}>
                    Born: {item.date_of_birth ? AdToBs(item.date_of_birth) : 'N/A'} (B.S.)
                  </Text>
                </View>

                <View className="flex-row items-center pr-1 gap-1">
                  <TouchableOpacity
                    onPress={() => handleEdit(item.id)}
                    className="p-2.5 rounded-full bg-blue-50"
                  >
                    <Edit2 size={18} color="#3B82F6" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="py-10 items-center justify-center opacity-50">
              <Text className="text-gray-400 font-black text-base italic">No child records found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
