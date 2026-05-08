import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { User, Calendar, MapPin, CheckCircle, XCircle, HeartPulse, Activity, Navigation, Info } from "lucide-react-native";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { getAllMaternalDeaths } from "../../../hooks/database/models/MaternalDeathModel";
import { getMotherProfile, MotherProfileDbItem } from "../../../hooks/database/models/MotherModel";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { AdToBs } from "react-native-nepali-picker";
import municipalitiesData from "../../../assets/json/municipalities.json";
import { calculateAge } from "@/utils/parse";

export default function MaternalDeathDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [data, setData] = useState<MaternalDeathStoreType | null>(null);
  const [motherData, setMotherData] = useState<MotherProfileDbItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const records = await getAllMaternalDeaths();
        const record = records.find(r => r.id === id);
        if (record) {
          setData(record);
          if (record.mother_id) {
            const mother = await getMotherProfile(record.mother_id);
            setMotherData(mother);
          }
        }
      } catch (error) {
        console.error("Error loading details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

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
        <CustomHeader title={t("reports.maternal_death_report.title")} onBackPress={() => router.back()} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-500 font-medium">{t("reports.common.no_data")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatNepaliDate = (y?: number, m?: number, d?: number) => {
    if (!y || !m || !d) return "-";
    return `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')} BS`;
  };

  const getConditionLabel = () => {
    switch(data.death_condition?.toLowerCase()) {
      case 'pregnant': return t("maternal_death_modal.pregnant");
      case 'labor': return t("maternal_death_modal.labor");
      case 'post_delivery': return t("maternal_death_modal.postpartum");
      default: return data.death_condition_other || "-";
    }
  };

  const getDeliveryPlaceLabel = () => {
    switch(data.delivery_place?.toLowerCase()) {
      case 'home': return t("maternal_death_modal.home");
      case 'institution': return t("maternal_death_modal.institution");
      case 'other': return data.delivery_place_other || t("maternal_death_modal.other");
      default: return "-";
    }
  };

  const getDeathPlaceLabel = () => {
    switch(data.death_place?.toLowerCase()) {
      case 'home': return t("maternal_death_modal.home");
      case 'institution': return t("maternal_death_modal.institution");
      case 'other': return data.death_place_other || t("maternal_death_modal.other");
      default: return "-";
    }
  };

  const getAddressLabel = () => {
    if (!motherData) return "-";
    
    let muniName = motherData.addressMunicipality || "";
    let wardLabel = motherData.addressWard || "";
    
    // Find Municipality and Ward names from JSON if they look like IDs
    for (const province of (municipalitiesData as any)) {
      if (muniName && muniName.includes('-')) { 
        for (const district of province.districts) {
          const muni = district.municipalities.find((m: any) => m.id === motherData.addressMunicipality);
          if (muni) {
            muniName = muni.name_en;
            const ward = muni.wards.find((w: any) => w.id === motherData.addressWard);
            if (ward) {
              wardLabel = `Ward ${ward.number}`;
            }
            break;
          }
        }
      }
    }
    
    return [muniName, wardLabel, motherData.addressLocality].filter(Boolean).join(", ") || "-";
  };

  const InfoRow = ({ label, value, icon: Icon, color = "#64748B" }: any) => (
    <View className="flex-row items-start mb-4">
      <View className="w-8 items-center mt-0.5">
        <Icon size={18} color={color} />
      </View>
      <View className="flex-1 border-b border-slate-100 pb-3">
        <Text className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">{label}</Text>
        <Text className="text-[15px] font-medium text-slate-800">{value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title="Maternal Death Details"
        onBackPress={() => router.back()}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}>
        {/* Profile Header Card */}
        <View className="mx-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex-row items-center">
          <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mr-4 border border-red-100">
            <User size={28} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{data.mother_name || "Unknown"}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-500 font-medium text-[14px]">Age: </Text>
              <Text className="text-slate-700 font-bold text-[14px]">
                {calculateAge(motherData?.date_of_birth) || data.mother_age || "-"} yrs
              </Text>
            </View>
          </View>
        </View>

        {/* Core Details Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <Activity size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Circumstances</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow 
              label={t("maternal_death_modal.condition_of_death")} 
              value={getConditionLabel()} 
              icon={HeartPulse} 
              color="#F43F5E"
            />
            <InfoRow 
              label={t("reports.maternal_death_report.death_date")} 
              value={formatNepaliDate(data.death_year, data.death_month, data.death_day)} 
              icon={Calendar} 
            />
          </View>
        </View>

        {/* Location Details Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <Navigation size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Location Info</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow 
              label={t("maternal_death_modal.delivery_place")} 
              value={getDeliveryPlaceLabel()} 
              icon={MapPin} 
              color="#0EA5E9"
            />
            <InfoRow 
              label={t("maternal_death_modal.place_of_death")} 
              value={getDeathPlaceLabel()} 
              icon={MapPin} 
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Family & Contact Card */}
        {motherData && (
          <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
            <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
              <User size={16} color="#64748B" className="mr-2" />
              <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Family & Contact</Text>
            </View>
            <View className="p-5 pb-2">
              <InfoRow 
                label="Husband/Partner Name" 
                value={motherData.husbandName || motherData.partnerName || "-"} 
                icon={User} 
              />
              <InfoRow 
                label="Phone Number" 
                value={motherData.phone_number || motherData.partnerMobile || "-"} 
                icon={Info} 
                color="#10B981"
              />
              <InfoRow 
                label="Address" 
                value={getAddressLabel()} 
                icon={MapPin} 
                color="#8B5CF6"
              />
            </View>
          </View>
        )}

        {/* Remarks Card */}
        {!!data.remarks && (
          <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
              <Info size={16} color="#64748B" className="mr-2" />
              <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">{t("reports.common.remarks")}</Text>
            </View>
            <View className="p-5">
              <Text className="text-slate-600 text-[14px] leading-relaxed">{data.remarks}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
