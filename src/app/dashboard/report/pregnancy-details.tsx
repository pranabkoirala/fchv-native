import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useLanguage } from "../../../context/LanguageContext";
import { User, Calendar, MapPin, Activity, Info, Phone, Heart } from "lucide-react-native";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { getPregnancyById } from "../../../hooks/database/models/PregnantWomenModal";
import { getMotherProfile, MotherProfileDbItem } from "../../../hooks/database/models/MotherModel";
import municipalitiesData from "../../../assets/json/municipalities.json";
import { calculateAge } from "@/utils/parse";

export default function PregnancyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [data, setData] = useState<any>(null);
  const [motherData, setMotherData] = useState<MotherProfileDbItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        if (typeof id !== 'string') return;
        const record = await getPregnancyById(id);
        if (record) {
          setData(record);
          const mother = await getMotherProfile(record.mother_id);
          setMotherData(mother);
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
        <CustomHeader title="Pregnancy Details" onBackPress={() => router.back()} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-500 font-medium">{t("reports.common.no_data")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getAddressLabel = () => {
    if (!motherData) return "-";
    
    let muniName = motherData.addressMunicipality || "";
    let wardLabel = motherData.addressWard || "";
    
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
        title="Pregnancy Details"
        onBackPress={() => router.back()}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}>
        {/* Profile Header Card */}
        <View className="mx-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex-row items-center">
          <View className="w-16 h-16 bg-purple-50 rounded-full items-center justify-center mr-4 border border-purple-100">
            <User size={28} color="#8B5CF6" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{data.mother_name || "Unknown"}</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-500 font-medium text-[14px]">Age: </Text>
              <Text className="text-slate-700 font-bold text-[14px]">
                {calculateAge(motherData?.date_of_birth) || "-"} yrs
              </Text>
            </View>
          </View>
          <View className="bg-purple-100 px-3 py-1.5 rounded-2xl">
            <Text className="text-purple-700 font-bold text-[12px]">G{data.gravida} P{data.parity}</Text>
          </View>
        </View>

        {/* Clinical Details Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <Activity size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Maternal Health Info</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow 
              label={t("pregnant_form.pregnancy.lmp_label")} 
              value={data.lmp_date || "-"} 
              icon={Calendar} 
              color="#0EA5E9"
            />
            <InfoRow 
              label={t("pregnant_form.pregnancy.edd_label")} 
              value={data.expected_delivery_date || "TBD"} 
              icon={Calendar} 
              color="#10B981"
            />
            <InfoRow 
              label={language === "en" ? "Risk Level" : "जोखिम स्तर"} 
              value={data.risk_level === 'high' 
                ? (language === "en" ? "High" : "उच्च जोखिम")
                : data.risk_level === 'moderate' 
                  ? (language === "en" ? "Moderate" : "मध्यम")
                  : (language === "en" ? "Normal" : "सामान्य")
              } 
              icon={Activity} 
              color={
                data.risk_level === 'high' ? "#EF4444" : 
                data.risk_level === 'moderate' ? "#F59E0B" : "#10B981"
              }
            />
            <InfoRow 
              label="Status" 
              value={data.is_current ? "Active Pregnancy" : "Closed/Historical"} 
              icon={Heart} 
              color={data.is_current ? "#F43F5E" : "#64748B"}
            />
          </View>
        </View>

        {/* Caretaker Details Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <Phone size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Caretaker Info</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow 
              label={t("pregnancy_form.caretaker_name")} 
              value={data.caretakers_name || "-"} 
              icon={User} 
            />
            <InfoRow 
              label={t("pregnancy_form.caretaker_phone")} 
              value={data.caretakers_phone || "-"} 
              icon={Phone} 
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Mother Details Card */}
        {motherData && (
          <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
            <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
              <Info size={16} color="#64748B" className="mr-2" />
              <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Mother's Details</Text>
            </View>
            <View className="p-5 pb-2">
              <InfoRow 
                label="Husband/Partner Name" 
                value={motherData.husbandName || motherData.partnerName || "-"} 
                icon={User} 
              />
              <InfoRow 
                label="Mother's Phone" 
                value={motherData.phone_number || "-"} 
                icon={Phone} 
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
      </ScrollView>
    </SafeAreaView>
  );
}
