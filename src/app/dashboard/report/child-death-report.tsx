import { useState, useCallback } from "react";
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
import { Baby, Calendar, ChevronRight, Search, Filter } from "lucide-react-native";
import "../../../global.css";
import { getAllNewbornDeaths } from "../../../hooks/database/models/NewbornDeathModel";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";

export default function ChildDeathReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<NewbornDeathStoreType[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const records = await getAllNewbornDeaths();
          // Filter: 28 days to under 59 months
          const filtered = records.filter((item) => {
            if (item.death_age_unit === 'days') {
              return item.death_age_days >= 28;
            }
            if (item.death_age_unit === 'months') {
              return item.death_age_days < 59;
            }
            return false;
          });
          setData(filtered);
        } catch (error) {
          console.error("error fetching child deaths", error);
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
    if (gender === 'Male') return t("reports.child_death_report.male");
    if (gender === 'Female') return t("reports.child_death_report.female");
    return "-";
  };

  const getGenderStyle = (gender?: string) => {
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
        title={t("reports.child_death_report.title")}
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

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">
          {data.map((item, index) => {
            const genderStyle = getGenderStyle(item.gender);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/dashboard/report/child-death-details", params: { id: item.id } })}
                className="bg-white rounded-3xl p-5 mb-4 border border-slate-100 shadow-sm shadow-slate-200/40"
              >
                {/* Header: Name and Delete */}
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-pink-50 rounded-2xl items-center justify-center mr-4 border border-pink-100">
                      <Baby size={24} color="#EC4899" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[18px] font-bold text-slate-900" numberOfLines={1}>
                        {item.baby_name || "Unnamed Child"}
                      </Text>
                      <Text className="text-[12px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                        Mother: {item.mother_name}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Tags Section */}
                <View className="flex-row items-center mb-4 gap-2">
                  <View className={`px-3 py-1 rounded-full ${genderStyle.bg} border ${genderStyle.border}`}>
                    <Text className={`text-[11px] font-bold ${genderStyle.text}`}>{getGenderLabel(item.gender)}</Text>
                  </View>
                  <View className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                    <Text className="text-[11px] font-bold text-slate-600">
                      {item.death_age_days} {item.death_age_unit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}
                    </Text>
                  </View>
                </View>

                {/* Footer: Date and Cause */}
                <View className="flex-row items-center justify-between pt-4 border-t border-slate-50">
                  <View className="flex-row items-center">
                    <Calendar size={14} color="#64748B" />
                    <Text className="text-[13px] font-semibold text-slate-600 ml-2">
                      {formatNepaliDate(item.birth_year, item.birth_month, item.birth_day)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-[12px] font-bold text-primary mr-1">Details</Text>
                    <ChevronRight size={14} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {data.length === 0 && (
            <View className="py-20 items-center justify-center">
              <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Baby size={40} color="#CBD5E1" />
              </View>
              <Text className="text-slate-400 font-bold text-base">{t("reports.common.no_data")}</Text>
              <Text className="text-slate-300 text-sm mt-1">No child death records found.</Text>
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
