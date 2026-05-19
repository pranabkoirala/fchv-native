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
import { useTranslation } from "react-i18next";
import "../../../global.css";

export default function RecordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
    if (!dateStr || dateStr === "N/A" || dateStr === "-") return t("record_page.na");
    return dateStr;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] pt-10">
      <StatusBar barStyle="dark-content" />

      {/* App Header */}
      <View className="px-4 pt-6 pb-4 flex-row items-center justify-between bg-[#F8FAFC]">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-2 p-2 rounded-2xl">
            <ChevronLeft size={20} color="#1E293B" strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-black text-slate-800 tracking-tight">{t("record_page.title")}</Text>
            <Text className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{t("record_page.subtitle")}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/dashboard/record/add-mother")}
          activeOpacity={0.8}
          className="bg-primary/80 px-3 py-3 rounded-md items-center justify-center flex-row"
        >
          <Plus size={16} color="#ffffff" strokeWidth={3} />
          <Text className="text-white font-bold text-xs ml-1.5 uppercase tracking-wider">{t("record_page.new_entry")}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="text-slate-400 mt-4 font-bold text-sm tracking-wide">{t("record_page.loading")}</Text>
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        >
          {/* Search Bar */}
          <View className="flex-row items-center rounded-2xl bg-white mb-6 px-4 h-12 border border-slate-100 shadow-sm">
            <Search size={18} color="#94A3B8" strokeWidth={2.5} />
            <TextInput
              className="flex-1 ml-3 text-slate-700 font-semibold text-sm h-full"
              placeholder={t("record_page.search_placeholder")}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredRecords.length === 0 ? (
            <View className="py-20 items-center justify-center bg-white rounded-3xl border border-slate-100 border-dashed shadow-sm">
              <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4 border border-slate-100">
                <Search size={28} color="#CBD5E1" strokeWidth={1.5} />
              </View>
              <Text className="text-slate-400 font-bold text-sm tracking-wide">{t("record_page.no_records")}</Text>
            </View>
          ) : (
            filteredRecords.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => router.push({ pathname: "/dashboard/profile", params: { id: item.id, from: "/dashboard/record" } } as any)}
                className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center mr-4 border border-slate-100/50">
                      <User size={22} color="#64748B" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-800 leading-tight mb-1" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">
                          {t("record_page.age")} <Text className="text-slate-700 font-black">{item.age || t("record_page.na")}</Text>
                        </Text>
                        <View className="w-1 h-1 bg-slate-300 rounded-full mx-2.5" />
                        <Text className="text-slate-400 font-bold text-[11px] uppercase tracking-wide">
                          {t("record_page.reg")} <Text className="text-slate-500 font-semibold">{formatDate(item.createdAt?.split('T')[0])}</Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <ChevronRight size={14} color="#94A3B8" strokeWidth={3} />
                  </View>
                </View>

                {/* Minimalist Date Metadata Row */}
                <View className="mt-4 pt-4 border-t border-slate-50 flex-row justify-between">
                  <View className="flex-row items-center">
                    <CalendarDays size={14} color="#94A3B8" strokeWidth={2.5} className="mr-1.5" />
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t("record_page.lmp_date")}: </Text>
                    <Text className="text-slate-700 text-xs font-black">{formatDate(item.lmp)}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <CalendarDays size={14} color="#94A3B8" strokeWidth={2.5} className="mr-1.5" />
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t("record_page.edd_date")}: </Text>
                    <Text className="text-slate-700 text-xs font-black">{formatDate(item.edd)}</Text>
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
