import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Trash2, Edit, ChevronRight, User } from "lucide-react-native";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";

import {
  getAllInfantMonitorings,
  deleteInfantMonitoring,
} from "../../../hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "../../../hooks/database/types/infantMonitoringModal";
import { getAllMothersList } from "../../../hooks/database/models/MotherModel";
import { AdToBs } from "react-native-nepali-picker";

export default function ChildMonitoringReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<InfantMonitoringStoreType[]>([]);
  const [mothers, setMothers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [records, motherList] = await Promise.all([
        getAllInfantMonitorings(),
        getAllMothersList()
      ]);
      
      const motherMap: Record<string, string> = {};
      motherList.forEach(m => {
        motherMap[m.id] = m.name;
      });
      
      setMothers(motherMap);
      setData(records);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDelete = (id: string) => {
    Alert.alert(t("reports.common.delete_confirm_title"), t("reports.common.delete_confirm_msg"), [
      { text: t("reports.common.cancel"), style: "cancel" },
      {
        text: t("reports.common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteInfantMonitoring(id);
            fetchData();
          } catch (error) {
            Alert.alert(t("profile.alerts.error"), t("profile.alerts.delete_error"));
          }
        }
      }
    ]);
  };

  const formatBsDate = (adDate?: string) => {
    if (!adDate) return "";
    try {
      return AdToBs(adDate);
    } catch {
      return adDate;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t("reports.child_monitoring_report.title")}
        onBackPress={() => router.replace("/dashboard/report")}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}>
        <View className="px-4">
          {loading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text className="text-slate-500 mt-4">{t("reports.common.loading")}</Text>
            </View>
          ) : data.length === 0 ? (
            <View className="py-20 items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
              <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                <User size={32} color="#CBD5E1" />
              </View>
              <Text className="text-slate-500 font-medium text-base">{t("reports.common.no_data")}</Text>
            </View>
          ) : (
            data.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() => router.push({ pathname: "/dashboard/report/child-monitoring-details", params: { id: item.id } })}
                className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm shadow-slate-200/50"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-indigo-50 rounded-xl items-center justify-center mr-4">
                    <User size={24} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-900 font-bold text-base leading-tight mb-0.5">
                      {item.baby_name || "Unnamed Baby"}
                    </Text>
                    <Text className="text-slate-500 text-[12px] font-medium">
                      Mother: <Text className="text-slate-700">{mothers[item.mother_id || ""] || "-"}</Text>
                    </Text>
                    <Text className="text-slate-400 text-[11px] font-medium mt-1">
                      DOB: {formatBsDate(item.date_of_birth)}
                    </Text>
                  </View>
                  <View className="bg-slate-50 p-2 rounded-full ml-2">
                    <ChevronRight size={18} color="#94A3B8" strokeWidth={2.5} />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
