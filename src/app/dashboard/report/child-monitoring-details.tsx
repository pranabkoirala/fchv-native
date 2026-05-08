import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StatusBar, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { User, Calendar, MapPin, CheckCircle, XCircle } from "lucide-react-native";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { getAllInfantMonitorings } from "../../../hooks/database/models/InfantMonitoringModel";
import { getAllMothersList } from "../../../hooks/database/models/MotherModel";
import { InfantMonitoringStoreType } from "../../../hooks/database/types/infantMonitoringModal";
import { AdToBs } from "react-native-nepali-picker";

// Images
import Umbilical from "../../../assets/fchv-service-images/umbilical-cordcare.jpg"
import NewBornBabyTouchWithChest from "../../../assets/fchv-service-images/new-born-baby-touch-with-chest.jpg"
import breastfeeding from "../../../assets/fchv-service-images/breastfeeding.jpg"
import babyWeighting from "../../../assets/fchv-service-images/weighing-baby.webp"
import breathing from "../../../assets/fchv-service-images/breathing.jpg"
import house from "../../../assets/fchv-service-images/house.jpg"
import hospital from "../../../assets/fchv-service-images/hospital.jpg"
import fchv from "../../../assets/fchv-service-images/fchv.webp"

export default function ChildMonitoringDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [data, setData] = useState<InfantMonitoringStoreType | null>(null);
  const [motherName, setMotherName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [records, mothers] = await Promise.all([
          getAllInfantMonitorings(),
          getAllMothersList()
        ]);
        const record = records.find(r => r.id === id);
        if (record) {
          setData(record);
          const m = mothers.find(m => m.id === record.mother_id);
          setMotherName(m ? m.name : "-");
        }
      } catch (error) {
        console.error("Error loading details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const formatBsDate = (adDate?: string) => {
    if (!adDate) return "-";
    try {
      return AdToBs(adDate);
    } catch {
      return adDate;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <CustomHeader title={t("reports.child_monitoring_report.title")} onBackPress={() => router.back()} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-500 font-medium">{t("reports.common.no_data")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getBirthPlaceDisplay = () => {
    switch (data.birth_place) {
      case 'home': return { label: t("reports.child_monitoring_report.home"), img: house };
      case 'institution': return { label: t("reports.child_monitoring_report.facility"), img: hospital };
      case 'trained_worker': return { label: t("reports.child_monitoring_report.health_worker"), img: fchv };
      default: return { label: "-", img: null };
    }
  };
  const birthPlaceInfo = getBirthPlaceDisplay();

  const CategoryItem = ({ title, icon, value, isNegative = false }: { title: string, icon: any, value: boolean, isNegative?: boolean }) => (
    <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-100">
      <View className="flex-row items-center flex-1 pr-4">
        <Image source={icon} className="w-12 h-12 rounded-lg border border-slate-200 mr-4" resizeMode="cover" />
        <Text className="text-slate-800 font-medium flex-1 leading-snug">{title}</Text>
      </View>
      <View className="w-8 items-center">
        {value ? (
          <CheckCircle size={22} color={isNegative ? "#EF4444" : "#10B981"} />
        ) : (
          <XCircle size={22} color="#CBD5E1" />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title="Monitoring Details"
        onBackPress={() => router.back()}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}>
        {/* Profile Card */}
        <View className="mx-4 bg-white p-5 rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-100 mb-6">
          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-100">
            <View className="w-14 h-14 bg-indigo-50 rounded-full items-center justify-center mr-4">
              <User size={24} color="#6366F1" />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-slate-900">{data.baby_name || "Unnamed Baby"}</Text>
              <Text className="text-slate-500 font-medium text-[13px] mt-0.5">{motherName}</Text>
            </View>
          </View>
          
          <View className="flex-row gap-4">
            <View className="flex-1 bg-slate-50 p-3 rounded-xl flex-row gap-1 items-center">
              <Calendar size={18} color="#64748B" className="mr-3" />
              <View>
                <Text className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">DOB (BS)</Text>
                <Text className="text-sm font-semibold text-slate-800">{formatBsDate(data.date_of_birth)}</Text>
              </View>
            </View>
            <View className="flex-1 bg-slate-50 p-3 rounded-xl flex-row ga[-1] items-center">
              <MapPin size={18} color="#64748B" className="mr-2" />
              <View>
                <Text className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Birth Place</Text>
                <Text className="text-sm font-semibold text-slate-800">{birthPlaceInfo.label}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Indicators Card */}
        <View className="mx-4 bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Health Indicators</Text>
          </View>
          <View>
            <CategoryItem title={t("reports.child_monitoring_report.umbilical_ointment")} icon={Umbilical} value={!!data.umbilical_ointment} />
            <CategoryItem title={t("reports.child_monitoring_report.skin_to_skin")} icon={NewBornBabyTouchWithChest} value={!!data.skin_to_skin} />
            <CategoryItem title={t("reports.child_monitoring_report.early_breastfeeding")} icon={breastfeeding} value={!!data.early_breastfeeding} />
            
            <CategoryItem title={t("reports.child_monitoring_report.normal_weight")} icon={babyWeighting} value={data.baby_weight === 'normal'} />
            <CategoryItem title={t("reports.child_monitoring_report.low_weight")} icon={babyWeighting} value={data.baby_weight === 'low'} isNegative />
            <CategoryItem title={t("reports.child_monitoring_report.very_low_weight")} icon={babyWeighting} value={data.baby_weight === 'very_low'} isNegative />
            
            <CategoryItem title={t("reports.child_monitoring_report.asphyxiated")} icon={breathing} value={!!data.asphyxiated_newborn} isNegative />
          </View>
        </View>

        {/* Attendance Card */}
        <View className="mx-4 bg-white rounded-2xl shadow-sm shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100">
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Attendance</Text>
          </View>
          <View className="p-4 flex-row gap-4">
            <View className={`flex-1 p-4 rounded-xl border ${data.skilled_birth_attended ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} items-center`}>
              <Text className={`font-bold mb-2 text-center ${data.skilled_birth_attended ? 'text-emerald-700' : 'text-slate-500'}`}>
                {t("reports.child_monitoring_report.trained_worker")}
              </Text>
              {data.skilled_birth_attended ? <CheckCircle size={24} color="#10B981" /> : <XCircle size={24} color="#94A3B8" />}
            </View>
            <View className={`flex-1 p-4 rounded-xl border ${data.fchv_present ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} items-center`}>
              <Text className={`font-bold mb-2 text-center ${data.fchv_present ? 'text-emerald-700' : 'text-slate-500'}`}>
                {t("reports.child_monitoring_report.fchv_present")}
              </Text>
              {data.fchv_present ? <CheckCircle size={24} color="#10B981" /> : <XCircle size={24} color="#94A3B8" />}
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
