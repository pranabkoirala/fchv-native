import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Baby, Calendar, MapPin, Activity, Clock, Info, User } from "lucide-react-native";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { getAllNewbornDeaths } from "../../../hooks/database/models/NewbornDeathModel";
import { getMotherProfile, MotherProfileDbItem } from "../../../hooks/database/models/MotherModel";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import municipalitiesData from "../../../assets/json/municipalities.json";

export default function NewbornDeathDetailsScreen() {
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
        <CustomHeader title="Newborn Death Details" onBackPress={() => router.back()} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-500 font-medium">{t("reports.common.no_data")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getBirthConditionLabel = () => {
    switch (data.birth_condition) {
      case 'Preterm': return t("newborn_death_modal.preterm");
      case 'LowWeight': return t("newborn_death_modal.low_weight");
      case 'Normal': return t("newborn_death_modal.normal");
      case 'Other': return data.birth_condition_other || t("newborn_death_modal.other");
      default: return "-";
    }
  };

  const getCauseLabel = () => {
    switch (data.cause_of_death) {
      case 'Asphyxia': return t("reports.newborn_death_report.asphyxia");
      case 'Hypothermia': return t("reports.newborn_death_report.hypothermia");
      case 'Infection': return t("reports.newborn_death_report.infection");
      case 'Pneumonia': return 'Pneumonia';
      case 'Diarrhea': return 'Diarrhea';
      case 'Malnutrition': return 'Malnutrition';
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
    if (data.gender === 'Male') return t("reports.newborn_death_report.male");
    if (data.gender === 'Female') return t("reports.newborn_death_report.female");
    return "-";
  };

  const genderColor = data.gender === 'Male' ? '#3B82F6' : data.gender === 'Female' ? '#EC4899' : '#94A3B8';

  const InfoRow = ({ label, value, icon: Icon, color = "#64748B" }: any) => (
    <View className="flex-row items-start mb-4">
      <View className="w-8 items-center mt-0.5">
        <Icon size={16} color={color} />
      </View>
      <View className="flex-1 ml-2">
        <Text className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</Text>
        <Text className="text-[15px] font-semibold text-slate-800">{value || "-"}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title="Newborn Death Details"
        onBackPress={() => router.back()}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}>
        {/* Profile Header Card */}
        <View className="mx-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6 flex-row items-center">
          <View className="w-16 h-16 bg-orange-50 rounded-full items-center justify-center mr-4 border border-orange-100">
            <Baby size={28} color="#EA580C" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-slate-900">{data.baby_name || "Unnamed Baby"}</Text>
            <View className="flex-row items-center mt-1 gap-2">
              <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: data.gender === 'Male' ? '#EFF6FF' : '#FDF2F8' }}>
                <Text className="text-[12px] font-bold" style={{ color: genderColor }}>{getGenderLabel()}</Text>
              </View>
              <View className="px-2 py-0.5 rounded-md bg-orange-50">
                <Text className="text-[12px] font-bold text-orange-600">
                  {data.death_age_days} {data.death_age_unit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Birth Details Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <Calendar size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Birth Details</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow
              label={t("newborn_death_modal.birth_date")}
              value={formatNepaliDate(data.birth_year, data.birth_month, data.birth_day)}
              icon={Calendar}
              color="#0EA5E9"
            />
            <InfoRow
              label={t("newborn_death_modal.birth_condition")}
              value={getBirthConditionLabel()}
              icon={Activity}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Death Circumstances Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <Activity size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Death Circumstances</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow
              label={t("newborn_death_modal.death_age")}
              value={`${data.death_age_days} ${data.death_age_unit === 'days' ? t("newborn_death_modal.age_unit_days") : t("newborn_death_modal.age_unit_months")}`}
              icon={Clock}
              color="#F59E0B"
            />
            <InfoRow
              label={t("newborn_death_modal.cause_of_death")}
              value={getCauseLabel()}
              icon={Info}
              color="#EF4444"
            />
            <InfoRow
              label={t("newborn_death_modal.death_place")}
              value={getDeathPlaceLabel()}
              icon={MapPin}
              color="#10B981"
            />
          </View>
        </View>

        {/* Mother & Contact Card */}
        <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
            <User size={16} color="#64748B" className="mr-2" />
            <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">Mother & Contact</Text>
          </View>
          <View className="p-5 pb-2">
            <InfoRow
              label="Mother's Name"
              value={data.mother_name}
              icon={User}
            />
            {motherData && (
              <>
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
              </>
            )}
          </View>
        </View>

        {/* Remarks Card */}
        {!!data.remarks && (
          <View className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <View className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex-row items-center">
              <Info size={16} color="#64748B" className="mr-2" />
              <Text className="text-slate-700 font-bold text-sm uppercase tracking-wider">{t("newborn_death_modal.remarks")}</Text>
            </View>
            <View className="p-5">
              <Text className="text-slate-700 text-[15px] leading-relaxed font-medium">{data.remarks}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
