import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, ChevronLeft, Search, User, CalendarDays, ChevronRight } from 'lucide-react-native';
import { getAllMothersList, MotherListDbItem } from '../../../hooks/database/models/MotherModel';
import Colors from '../../../constants/Colors';
import "../../../global.css";

export default function RecordScreen() {
  const router = useRouter();
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
    }, [])
  );

  const filteredRecords = records.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "N/A" || dateStr === "-") return "N/A";
    return dateStr;
  };

  return (
    <SafeAreaView className="flex-1 pt-10 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* App Header */}
      <View className="px-4 pt-4 pb-4 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-2 p-2 -ml-2">
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-extrabold text-slate-900">Maternal Record</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">FCHV Maternal Health</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/dashboard/record/add-mother")}
          className="bg-primary/80 px-4 py-2.5 items-center justify-center flex-row"
        >
          <Plus size={18} color="#ffffff" strokeWidth={3} />
          <Text className="text-white font-bold text-sm ml-1.5">New Entry</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-slate-500 mt-4 font-medium">Loading records...</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 7, paddingBottom: 100 }}
        >
        <View className="flex-row items-center rounded-md bg-white mb-3 px-4 h-12 border border-slate-200">
          <Search size={20} color="#64748b" />
          <TextInput
            className="flex-1 text-slate-800 font-medium text-base h-full"
            placeholder="Search by mother's name..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
          {filteredRecords.length === 0 ? (
            <View className="py-20 items-center justify-center bg-white rounded-md border border-slate-100 border-dashed">
              <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Search size={32} color="#CBD5E1" />
              </View>
              <Text className="text-slate-500 font-medium text-base">No records found</Text>
            </View>
          ) : (
            filteredRecords.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/dashboard/profile", params: { id: item.id } } as any)}
                className="bg-white rounded-md p-4 mb-4 border border-slate-200"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row flex-1 mr-3">
                    <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center mr-4">
                      <User size={24} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-slate-900 leading-tight mb-1" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-slate-500 font-medium text-[13px]">
                          Age: <Text className="text-slate-700 font-bold">{item.age || "N/A"}</Text>
                        </Text>
                        <View className="w-1 h-1 bg-slate-300 rounded-full mx-2" />
                        <Text className="text-slate-500 font-medium text-[13px]">
                          Reg: <Text className="text-slate-700">{formatDate(item.createdAt?.split('T')[0])}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="bg-slate-50 p-2 rounded-full">
                    <ChevronRight size={18} color="#94A3B8" strokeWidth={2.5} />
                  </View>
                </View>

                <View className="mt-4 pt-3 border-t border-slate-100 flex-row">
                  <View className="flex-1 bg-slate-50 rounded-md p-2.5 flex-row items-center mr-2 border border-slate-100/50">
                    <CalendarDays size={16} color="#64748B" className="mr-2" />
                    <View>
                      <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">LMP Date</Text>
                      <Text className="text-[13px] font-semibold text-slate-700">{formatDate(item.lmp)}</Text>
                    </View>
                  </View>
                  <View className="flex-1 bg-slate-50 rounded-md p-2.5 flex-row items-center border border-slate-100/50">
                    <CalendarDays size={16} color="#64748B" className="mr-2" />
                    <View>
                      <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">EDD Date</Text>
                      <Text className="text-[13px] font-semibold text-slate-700">{formatDate(item.edd)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
