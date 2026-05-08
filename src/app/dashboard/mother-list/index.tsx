import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import {
  Search,
  Plus,
  Baby,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  Bell,
  Check,
} from "lucide-react-native";
import { getAllMothersList, MotherListDbItem } from "../../../hooks/database/models/MotherModel";

export default function MotherListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMothers = async () => {
    try {
      const list = await getAllMothersList();
      setMothers(list);
    } catch (error) {
      console.error("Failed to fetch mothers:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMothers();
    }, [])
  );

  const filtered = mothers.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.nameNp || "").includes(search) ||
      (m.ward || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const getAncStatus = (lmp: string | null) => {
    if (!lmp) return { status: 'New Case', color: 'blue' };
    const lmpDate = new Date(lmp);
    const now = new Date();
    const dif = now.getTime() - lmpDate.getTime();
    const wks = Math.floor(dif / (1000 * 60 * 60 * 24 * 7));

    const milestones = [12, 16, 20, 24, 28, 32, 36, 40];
    let currentVisit = 0;
    milestones.forEach((m, i) => {
      if (wks >= m) currentVisit = i + 1;
    });

    if (wks > 42) return { status: 'Post-Term', color: 'red' };
    if (currentVisit === 0) return { status: 'New Case', color: 'blue' };
    return { status: `Visit ${currentVisit} Complete`, color: 'blue' };
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Custom FCHV Header */}
      <View className="px-6 pt-14 pb-4 flex-row justify-between items-center bg-white">
        <View className="flex-row items-center">
          <View className="bg-blue-50 p-1.5 rounded-xl mr-3">
            <Image
              source={require("../../../assets/fchv-logo.png")}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </View>
          <Text className="text-primary text-xl font-black">FCHV Assistant</Text>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-2xl">
          <Bell size={24} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Search Bar */}
        <View className="px-5 mt-4">
          <View className="flex-row items-center bg-white px-4 h-14 rounded-2xl border border-gray-100 shadow-sm">
            <Search size={20} color="#94A3B8" />
            <TextInput
              className="flex-1 ml-3 text-base text-[#1E293B] font-medium"
              placeholder="Search pregnant women by name..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row px-5 mt-6 gap-4">
          <TouchableOpacity
            onPress={() => router.push("/dashboard/mother-list/add-mother" as any)}
            className="flex-1 bg-[#0262C4] p-5 rounded-[28px] items-center justify-center shadow-lg shadow-blue-900/20"
          >
            <View className="bg-white/20 p-2 rounded-xl mb-3">
              <Plus size={24} color="white" strokeWidth={3} />
            </View>
            <Text className="text-white font-black text-center text-[13px] leading-tight">New{"\n"}Registration</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-[#006F62] p-5 rounded-[28px] items-center justify-center shadow-lg shadow-teal-900/20"
          >
            <View className="bg-white/20 p-2 rounded-xl mb-3">
              <Baby size={24} color="white" strokeWidth={3} />
            </View>
            <Text className="text-white font-black text-center text-[13px] leading-tight">Record Birth</Text>
          </TouchableOpacity>
        </View>

        <View className="px-5">
          {loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 font-black text-sm mt-4 italic">Loading trackers...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="py-20 items-center justify-center opacity-50">
              <User size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text className="text-gray-400 font-black text-base italic mt-4">No trackers found</Text>
            </View>
          ) : (
            filtered?.map((mother) => {
              const status = getAncStatus(mother.lmp);
              const lmpTime = mother.lmp ? new Date(mother.lmp).getTime() : 0;
              const wks = mother.lmp ? Math.floor((new Date().getTime() - lmpTime) / (1000 * 60 * 60 * 24 * 7)) : 0;

              return (
                <TouchableOpacity
                  key={mother.id}
                  activeOpacity={0.8}
                  onPress={() => router.push({ pathname: "/dashboard/mother-profile", params: { id: mother.id } } as any)}
                  className="bg-white p-5 rounded-[32px] mb-6 border border-gray-100 shadow-sm"
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 pr-4">
                      <Text className="text-[#1E293B] text-2xl font-black leading-tight">{mother.name}</Text>
                      <Text className="text-gray-400 font-bold text-xs mt-1">
                        Age: {mother.age || '26'} • {mother.pregnancy_count || '1'}st Pregnancy
                      </Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-xl ${status.color === 'red' ? 'bg-rose-50' : 'bg-blue-50'}`}>
                      <Text className={`text-[11px] font-black ${status.color === 'red' ? 'text-rose-600' : 'text-blue-600'}`}>
                        {status.status}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 mb-6">
                    <View className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <Text className="text-gray-400 font-black text-[10px] uppercase">LMP</Text>
                      <Text className="text-[#1E293B] font-black text-base mt-0.5">{mother.lmp || 'Jan 12, 2024'}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <Text className="text-gray-400 font-black text-[10px] uppercase">EDD</Text>
                      <Text className="text-[#1E293B] font-black text-base mt-0.5">{mother.edd || 'Oct 18, 2024'}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-[#1E293B] font-bold text-[13px]">ANC Schedule (8 Visits)</Text>
                    <Text className="text-blue-600 font-black text-[13px]">
                      {wks < 40 ? `Next Visit: Week ${[12, 16, 20, 24, 28, 32, 36, 40].find(m => m > wks)}` : 'Completed'}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between px-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((v, i) => {
                      const completed = wks >= [12, 16, 20, 24, 28, 32, 36, 40][i];
                      const current = !completed && (i === 0 || wks >= [12, 16, 20, 24, 28, 32, 36, 40][i - 1]);

                      return (
                        <View key={v} className="flex-row items-center flex-1">
                          <View className={`w-8 h-8 rounded-full items-center justify-center border-2 ${completed ? 'bg-[#006F62] border-[#006F62]' :
                              current ? 'border-primary' : 'bg-gray-100 border-gray-100'
                            }`}>
                            {completed ? (
                              <Check size={14} color="white" strokeWidth={4} />
                            ) : (
                              <Text className={`text-[11px] font-black ${current ? 'text-primary' : 'text-gray-400'}`}>{v}</Text>
                            )}
                          </View>
                          {i < 7 && (
                            <View className={`h-[2px] flex-1 mx-1 ${completed ? 'bg-[#006F62]' : 'bg-gray-100'}`} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
