import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Baby, Calendar, ChevronRight, Clock, Search, Filter } from "lucide-react-native";
import "../../../global.css";
import { getAllNewbornDeaths } from "../../../hooks/database/models/NewbornDeathModel";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";

export default function NewbornDeathReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<NewbornDeathStoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const records = await getAllNewbornDeaths();
          // Filter: only show deaths under 29 days
          const filtered = records.filter((item) => {
            if (item.death_age_unit === 'days') {
              return item.death_age_days < 29;
            }
            return false; // months = not a newborn
          });
          setData(filtered);
        } catch (error) {
          console.error("error fetching newborn deaths", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );

  const formatNepaliDate = (y?: number, m?: number, d?: number) => {
    if (!y || !m || !d) return "-";
    return `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')} BS`;
  };

  const getGenderLabel = (gender?: string) => {
    if (gender === 'Male') return t("reports.newborn_death_report.male");
    if (gender === 'Female') return t("reports.newborn_death_report.female");
    return "-";
  };

  const getGenderColor = (gender?: string) => {
    if (gender === 'Male') return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
    if (gender === 'Female') return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100' };
    return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100' };
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t("reports.newborn_death_report.title")}
        onBackPress={() => router.replace("/dashboard/report")}
      />

      <View className="flex-1">
        {/* Search Bar */}
        <View className="flex-row px-4 py-3 gap-3 bg-white border-b border-gray-100">
          <View className="flex-1 flex-row items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <Search size={14} color="#64748B" />
            <Text className="ml-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">{t("reports.common.search_placeholder")}</Text>
          </View>
          <TouchableOpacity className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
            <Filter size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-2">
          {data.map((item) => {
            const genderStyle = getGenderColor(item.gender);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/dashboard/report/newborn-death-details", params: { id: item.id } })}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-100 shadow-sm shadow-slate-200/50"
              >
                {/* Top Row: Baby info + Gender badge */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-11 h-11 bg-orange-50 rounded-full items-center justify-center mr-3 border border-orange-100">
                      <Baby size={20} color="#EA580C" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[16px] font-bold text-slate-900 mb-0.5" numberOfLines={1}>
                        {item.baby_name || "Unnamed Baby"}
                      </Text>
                      <Text className="text-[12px] font-medium text-slate-500">
                        Mother: {item.mother_name}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2.5 py-1 rounded-lg ${genderStyle.bg} border ${genderStyle.border}`}>
                    <Text className={`text-[11px] font-bold ${genderStyle.text}`}>{getGenderLabel(item.gender)}</Text>
                  </View>
                </View>

                {/* Bottom Row: Date + Age + Arrow */}
                <View className="flex-row items-center bg-slate-50 rounded-xl p-3">
                  <Calendar size={14} color="#64748B" />
                  <Text className="text-[13px] font-semibold text-slate-700 ml-2">
                    {formatNepaliDate(item.birth_year, item.birth_month, item.birth_day)}
                  </Text>
                  <View className="mx-2 w-1 h-1 rounded-full bg-slate-300" />
                  <Clock size={12} color="#64748B" />
                  <Text className="text-[12px] font-bold text-orange-600 ml-1">
                    {item.death_age_days} {t("newborn_death_modal.age_unit_days")}
                  </Text>
                  <View className="flex-1" />
                  <View className="flex-row items-center">
                    <Text className="text-[12px] font-bold text-primary mr-1">View</Text>
                    <ChevronRight size={14} color="#0056D2" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {data.length === 0 && (
            <View className="py-20 items-center justify-center">
              <Baby size={48} color="#CBD5E1" />
              <Text className="text-slate-400 font-medium mt-4">{t("reports.common.no_data")}</Text>
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
