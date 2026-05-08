import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Share
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Download, Filter, Search, Trash2, User, Calendar, ChevronRight } from "lucide-react-native";
import "../../../global.css";
import { getAllMaternalDeaths, deleteMaternalDeath } from "../../../hooks/database/models/MaternalDeathModel";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";

export default function MaternalDeathReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<MaternalDeathStoreType[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDownload = async () => {
    if (data.length === 0) {
      Alert.alert(t("reports.common.no_data"), t("reports.common.no_data_msg"));
      return;
    }

    try {
      const headers = [
        t("reports.common.sn"), t("reports.maternal_death_report.deceased_name"), t("reports.maternal_death_report.age"), 
        t("reports.maternal_death_report.pregnant"), t("reports.maternal_death_report.labor"), t("reports.maternal_death_report.postpartum"), 
        t("reports.maternal_death_report.day"), t("reports.maternal_death_report.month"), t("reports.maternal_death_report.year"), 
        `Birth:${t("reports.maternal_death_report.home")}`, `Birth:${t("reports.maternal_death_report.facility")}`, `Birth:${t("reports.maternal_death_report.other")}`, 
        `Death:${t("reports.maternal_death_report.home")}`, `Death:${t("reports.maternal_death_report.facility")}`, `Death:${t("reports.maternal_death_report.other")}`, 
        t("reports.common.remarks")
      ].join(",");

      const rows = data.map((item, index) => {
        const cond = item.death_condition?.toLowerCase();
        const bPlace = item.delivery_place?.toLowerCase();
        const dPlace = item.death_place?.toLowerCase();

        return [
          index + 1,
          `"${item.mother_name}"`,
          item.mother_age,
          cond === 'pregnant' ? "✔" : "",
          cond === 'labor' ? "✔" : "",
          cond === 'post_delivery' ? "✔" : "",
          item.death_day,
          item.death_month,
          item.death_year,
          bPlace === 'home' ? "✔" : "",
          bPlace === 'institution' ? "✔" : "",
          bPlace === 'other' ? "✔" : "",
          dPlace === 'home' ? "✔" : "",
          dPlace === 'institution' ? "✔" : "",
          dPlace === 'other' ? "✔" : "",
          `"${item.remarks ?? ''}"`
        ].join(",");
      }).join("\n");

      const csvContent = `${headers}\n${rows}`;

      await Share.share({
        message: csvContent,
        title: t("reports.maternal_death_report.title"),
      });
    } catch (error) {
      Alert.alert(t("reports.common.export_error"), t("reports.common.export_error_msg"));
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const records = await getAllMaternalDeaths();
          setData(records);
        } catch (error) {
          console.error("error fetching maternal deaths", error);
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <CustomHeader 
        title={t("reports.maternal_death_report.title")} 
        onBackPress={() => router.replace("/dashboard/report")}
      />

      <View className="flex-1">
        {/* Table Controls */}
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
          {data.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: "/dashboard/report/maternal-death-details", params: { id: item.id } })}
              className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm shadow-slate-200/50"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-3 border border-red-100">
                    <User size={18} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-slate-900 mb-0.5" numberOfLines={1}>{item.mother_name}</Text>
                    <Text className="text-[12px] font-medium text-slate-500">Age: {item.mother_age || "-"}</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row items-center bg-slate-50 rounded-xl p-3">
                <Calendar size={14} color="#64748B" />
                <Text className="text-[13px] font-semibold text-slate-700 ml-2 flex-1">
                  {formatNepaliDate(item.death_year, item.death_month, item.death_day)}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-[12px] font-bold text-primary mr-1">View Details</Text>
                  <ChevronRight size={14} color="#0056D2" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {data.length === 0 && (
            <View className="py-20 items-center justify-center">
              <Text className="text-slate-400 font-medium">{t("reports.common.no_data")}</Text>
            </View>
          )}
          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
