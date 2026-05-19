import React, { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
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
import { Users, Filter, Search, Calendar, ChevronRight, Download } from "lucide-react-native";
import "../../../global.css";
import { getPregnantWomenList, PregnantWomenListItem } from "../../../hooks/database/models/PregnantWomenModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";

export default function PregnancyReportScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<PregnantWomenListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDownload = async () => {
    if (data.length === 0) {
      Alert.alert(t("reports.common.no_data"), t("reports.common.no_data_msg"));
      return;
    }

    try {
      const headers = [
        t("reports.common.sn"), 
        t("reports.maternal_death_report.mother_name"), 
        t("pregnant_form.pregnancy.gravida_label"),
        t("pregnant_form.pregnancy.parity_label") || "Parity",
        t("pregnant_form.pregnancy.lmp_label"),
        t("pregnant_form.pregnancy.edd_label"),
        t("mother_form.phone")
      ].join(",");

      const rows = data.map((item, index) => {
        return [
          index + 1,
          `"${item.name}"`,
          item.gravida,
          item.parity,
          item.lmp_date,
          item.edd,
          `"${item.phone}"`
        ].join(",");
      }).join("\n");

      const csvContent = `${headers}\n${rows}`;

      await Share.share({
        message: csvContent,
        title: t("reports.pregnancy.title"),
      });
    } catch (error) {
      Alert.alert(t("reports.common.export_error"), t("reports.common.export_error_msg"));
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const records = await getPregnantWomenList();
          setData(records);
        } catch (error) {
          console.error("error fetching pregnancy list", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );

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
        title={t("reports.pregnancy.title")} 
        onBackPress={() => router.back()}
      />

      <View className="flex-1">
        {/* Table Controls */}
        <View className="flex-row px-4 py-3 gap-3 bg-white border-b border-gray-100">
           <View className="flex-1 flex-row items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
              <Search size={14} color="#64748B" />
              <Text className="ml-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">{t("reports.common.search_placeholder")}</Text>
           </View>
           <TouchableOpacity 
             onPress={handleDownload}
             className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100"
            >
              <Download size={20} color={Colors.primary} />
           </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4 pt-4">
          {data.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: "/dashboard/report/pregnancy-details", params: { id: item.id } })}
              className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 shadow-sm shadow-slate-200/50"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3 border border-purple-100">
                    <Users size={18} color="#8B5CF6" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[16px] font-bold text-slate-900 mb-0.5" numberOfLines={1}>{item.name}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-[12px] font-medium text-slate-500 mr-2">Phone: {item.phone || "-"}</Text>
                      {item.risk_level && (
                        <View className={`px-2 py-0.5 rounded-full ${
                          item.risk_level === 'high' ? 'bg-red-100' : 
                          item.risk_level === 'moderate' ? 'bg-orange-100' : 'bg-green-100'
                        }`}>
                          <Text className={`text-[10px] font-bold uppercase ${
                            item.risk_level === 'high' ? 'text-red-600' : 
                            item.risk_level === 'moderate' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {item.risk_level === 'high' 
                              ? (language === "en" ? "High" : "उच्च जोखिम")
                              : item.risk_level === 'moderate' 
                                ? (language === "en" ? "Moderate" : "मध्यम")
                                : (language === "en" ? "Normal" : "सामान्य")
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View className="bg-slate-50 px-2 py-1 rounded-md">
                   <Text className="text-[10px] font-bold text-slate-400 uppercase">G{item.gravida} P{item.parity}</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-slate-50 rounded-xl p-3">
                <View className="flex-1 flex-row items-center">
                  <Calendar size={14} color="#64748B" />
                  <View className="ml-2">
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Expected Delivery</Text>
                    <Text className="text-[13px] font-semibold text-slate-700">
                      {item.edd || "TBD"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-[12px] font-bold text-primary mr-1">Details</Text>
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
