import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Baby, Calendar, MapPin, Activity, Clock, Info, User, Phone } from "lucide-react-native";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { getAllNewbornDeaths } from "../../../hooks/database/models/NewbornDeathModel";
import { getMotherProfile, MotherProfileDbItem } from "../../../hooks/database/models/MotherModel";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import municipalitiesData from "../../../assets/json/municipalities.json";

export default function ChildDeathDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [data, setData] = useState<NewbornDeathStoreType | null>(null);
  const [motherData, setMotherData] = useState<MotherProfileDbItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const records = await getAllNewbornDeaths();
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

  const formatNepaliDate = (y?: number, m?: number, d?: number) => {
    if (!y || !m || !d) return "-";
    return `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')} BS`;
  };

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
            if (ward) { wardLabel = `Ward ${ward.number}`; }
            break;
          }
        }
      }
    }
    return [muniName, wardLabel, motherData.addressLocality].filter(Boolean).join(", ") || "-";
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC] justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]">
        <CustomHeader title={t("reports.child_death_report.title")} onBackPress={() => router.back()} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-500 font-medium">{t("reports.common.no_data")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getCauseLabel = () => {
    switch (data.cause_of_death) {
      case 'Pneumonia': return 'Pneumonia';
      case 'Diarrhea': return 'Diarrhea';
      case 'Malnutrition': return 'Malnutrition';
      case 'Asphyxia': return t("reports.newborn_death_report.asphyxia");
      case 'Hypothermia': return t("reports.newborn_death_report.hypothermia");
      case 'Infection': return t("reports.newborn_death_report.infection");
      case 'Other': return data.cause_of_death_other || t("newborn_death_modal.other");
      default: return "-";
    }
  };

  const getDeathPlaceLabel = () => {
    switch (data.death_place) {
      case 'Home': return t("newborn_death_modal.home");
      case 'Institution': return t("newborn_death_modal.institution");
      case 'Other': return data.death_place_other || t("newborn_death_modal.other");
      default: return "-";
    }
  };

  const getGenderLabel = () => {
    if (data.gender === 'Male') return t("reports.child_death_report.male");
    if (data.gender === 'Female') return t("reports.child_death_report.female");
    return "-";
  };

  const genderColor = data.gender === 'Male' ? '#3B82F6' : data.gender === 'Female' ? '#EC4899' : '#94A3B8';

  const InfoRow = ({ label, value, icon: Icon, color = "#64748B" }: any) => (
    <View className="flex-row items-start mb-5">
      <View className="w-10 h-10 rounded-xl bg-slate-50 items-center justify-center mr-3 border border-slate-100">
        <Icon size={18} color={color} />
      </View>
      <View className="flex-1 justify-center">
        <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</Text>
        <Text className="text-[15px] font-semibold text-slate-900">{value || "-"}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t("reports.child_death_report.title")}
        onBackPress={() => router.back()}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}>
        {/* Main Info Card */}
        <View className="mx-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
          <View className="flex-row items-center mb-6">
            <View className="w-16 h-16 bg-pink-50 rounded-full items-center justify-center mr-4 border border-pink-100">
              <Baby size={32} color="#EC4899" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-slate-900">{data.baby_name || "Unnamed Child"}</Text>
              <View className="flex-row items-center mt-1 gap-2">
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: data.gender === 'Male' ? '#EFF6FF' : '#FDF2F8' }}>
                  <Text className="text-[12px] font-bold" style={{ color: genderColor }}>{getGenderLabel()}</Text>
                </View>
                <View className="px-3 py-1 rounded-full bg-slate-100">
                  <Text className="text-[12px] font-bold text-slate-600">
                    {data.death_age_days} {data.death_age_unit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="h-[1px] bg-slate-100 mb-6" />

          <InfoRow
            label={t("reports.child_death_report.birth_date")}
            value={formatNepaliDate(data.birth_year, data.birth_month, data.birth_day)}
            icon={Calendar}
            color="#3B82F6"
          />
          <InfoRow
            label={t("reports.child_death_report.cause_of_death")}
            value={getCauseLabel()}
            icon={Activity}
            color="#EF4444"
          />
          <InfoRow
            label={t("newborn_death_modal.death_place")}
            value={getDeathPlaceLabel()}
            icon={MapPin}
            color="#10B981"
          />
        </View>

        {/* Family Details Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex-row items-center">
            <User size={18} color="#64748B" className="mr-2" />
            <Text className="text-slate-800 font-bold text-sm uppercase tracking-wider">Family Details</Text>
          </View>
          <View className="p-6">
            <InfoRow
              label="Mother's Name"
              value={data.mother_name}
              icon={User}
              color="#64748B"
            />
            {motherData && (
              <>
                <InfoRow
                  label="Contact Number"
                  value={motherData.phone_number || motherData.partnerMobile || "-"}
                  icon={Phone}
                  color="#64748B"
                />
                <InfoRow
                  label="Residential Address"
                  value={getAddressLabel()}
                  icon={MapPin}
                  color="#64748B"
                />
              </>
            )}
          </View>
        </View>

        {/* Remarks Section */}
        {!!data.remarks && (
          <View className="mx-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <View className="flex-row items-center mb-4">
              <Info size={18} color="#64748B" className="mr-2" />
              <Text className="text-slate-800 font-bold text-sm uppercase tracking-wider">{t("newborn_death_modal.remarks")}</Text>
            </View>
            <Text className="text-slate-600 text-[15px] leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">
              {data.remarks}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
