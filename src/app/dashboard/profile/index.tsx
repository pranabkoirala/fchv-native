import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  User,
  Calendar,
  Baby,
  FileText,
  Info,
  AlertTriangle,
  Stethoscope,
} from "lucide-react-native";
import "../../../global.css";
import { getMotherProfile } from "../../../hooks/database/models/MotherModel";
import { getMaternalDeathByMother } from "../../../hooks/database/models/MaternalDeathModel";
import { getNewbornDeathByMother } from "../../../hooks/database/models/NewbornDeathModel";
import MaternalDeathModal from "../../../components/forms/MaternalDeathModal";
import NewbornDeathModal from "../../../components/forms/NewbornDeathModal";
import { HmisRecordStoreType } from "../../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { useToast } from "../../../context/ToastContext";
import { useTranslation } from "react-i18next";
import { getSupplementByMother, SupplementStoreType } from "../../../hooks/database/models/SupplementModel";
import SupplementsScreen from "./supplements";
import FamilyPlanningSection from "../../../components/profile/FamilyPlanningSection";
import CounselingSection from "../../../components/profile/CounselingSection";
import { getVisitsByMotherId } from "../../../hooks/database/models/VisitModel";
import { getInfantMonitoringByMother } from "../../../hooks/database/models/InfantMonitoringModel";
import { getPregnancyByMotherId } from "../../../hooks/database/models/PregnantWomenModal";


const SectionTitle = ({ title, icon: Icon, colorClass }: any) => (
  <View className="flex-row items-center mb-4 mt-2">
    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${colorClass}`}>
      <Icon size={16} color="white" />
    </View>
    <Text className="text-slate-800 font-bold text-lg">{title}</Text>
  </View>
);

const VisitBadge = ({ label, val }: any) => (
  <View className={`px-3 py-2 rounded-md flex-row items-center justify-between border mb-3 w-[48%] ${val ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
    <Text className={`text-[12px] ${val ? 'text-emerald-800 font-bold' : 'text-slate-500 font-medium'}`}>{label}</Text>
    <View className={`w-2 h-2 rounded-full ${val ? 'bg-emerald-500' : 'bg-slate-300'}`} />
  </View>
);

export default function HmisRecordProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id, from } = useLocalSearchParams<{ id: string, from?: string }>();
  const { showToast } = useToast();
  
  const [record, setRecord] = useState<HmisRecordStoreType | null>(null);
  const [supplementsRecord, setSupplementsRecord] = useState<SupplementStoreType | null>(null);
  const [existingDeathRecord, setExistingDeathRecord] = useState<MaternalDeathStoreType | null>(null);
  const [existingNewbornDeathRecord, setExistingNewbornDeathRecord] = useState<NewbornDeathStoreType | null>(null);
  const [loading, setLoading] = useState(true);

  const [maternalDeathModalVisible, setMaternalDeathModalVisible] = useState(false);
  const [newbornDeathModalVisible, setNewbornDeathModalVisible] = useState(false);

  const loadSupplements = async (motherId: string) => {
    try {
      const suppData = await getSupplementByMother(motherId);
      setSupplementsRecord(suppData);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchRecord = async () => {
        if (!id) {
          setLoading(false);
          return;
        }
        try {
          const [mother, pregnancy, visits, childMonitoring] = await Promise.all([
            getMotherProfile(id),
            getPregnancyByMotherId(id),
            getVisitsByMotherId(id),
            getInfantMonitoringByMother(id)
          ]);

          if (mother) {
            const lmpParts = pregnancy?.lmp_date ? pregnancy.lmp_date.split(/[-/T]/) : (mother.lmp && mother.lmp !== "N/A" ? mother.lmp.split(/[-/]/) : []);
            const eddParts = pregnancy?.expected_delivery_date ? pregnancy.expected_delivery_date.split(/[-/T]/) : (mother.edd && mother.edd !== "N/A" ? mother.edd.split(/[-/]/) : []);
            const regParts = mother.regDate && mother.regDate !== "N/A" ? mother.regDate.split(/[-/T]/) : [];

            // Map visits to ANC/PNC slots
            const ancVisits = visits.filter(v => v.visit_type === 'ANC');
            const pncVisits = visits.filter(v => v.visit_type === 'PNC');

            const data: HmisRecordStoreType = {
              id: mother.id,
              serial_no: null,
              date_year: regParts.length >= 3 ? parseInt(regParts[0], 10) : null,
              date_month: regParts.length >= 3 ? parseInt(regParts[1], 10) : null,
              date_day: regParts.length >= 3 ? parseInt(regParts[2], 10) : null,
              mother_name: mother.name,
              mother_age: mother.age,
              lmp_year: lmpParts.length >= 3 ? parseInt(lmpParts[0], 10) : null,
              lmp_month: lmpParts.length >= 3 ? parseInt(lmpParts[1], 10) : null,
              lmp_day: lmpParts.length >= 3 ? parseInt(lmpParts[2], 10) : null,
              edd_year: eddParts.length >= 3 ? parseInt(eddParts[0], 10) : null,
              edd_month: eddParts.length >= 3 ? parseInt(eddParts[1], 10) : null,
              edd_day: eddParts.length >= 3 ? parseInt(eddParts[2], 10) : null,
              counseling_given: null,
              // Sequential mapping for demo/simplicity since specific milestones aren't in visit table
              checkup_12: ancVisits.length >= 1 ? 1 : null,
              checkup_16: ancVisits.length >= 2 ? 1 : null,
              checkup_20_24: ancVisits.length >= 3 ? 1 : null,
              checkup_28: ancVisits.length >= 4 ? 1 : null,
              checkup_32: ancVisits.length >= 5 ? 1 : null,
              checkup_34: ancVisits.length >= 6 ? 1 : null,
              checkup_36: ancVisits.length >= 7 ? 1 : null,
              checkup_38_40: ancVisits.length >= 8 ? 1 : null,
              checkup_other: null,
              iron_preg_received: null,
              iron_pnc_received: null,
              vit_a_received: null,
              delivery_place: childMonitoring?.birth_place || null,
              newborn_condition: childMonitoring?.baby_weight || null,
              pnc_check_24hr: pncVisits.length >= 1 ? 1 : null,
              pnc_check_3day: pncVisits.length >= 2 ? 1 : null,
              pnc_check_7_14day: pncVisits.length >= 3 ? 1 : null,
              pnc_check_42day: pncVisits.length >= 4 ? 1 : null,
              pnc_check_other: null,
              family_planning_used: null,
              remarks: childMonitoring?.remarks || null,
              created_at: mother.regDate || "",
              updated_at: mother.regDate || "",
            };

            if (isActive) {
              setRecord(data);
              const deathData = await getMaternalDeathByMother(mother.id);
              setExistingDeathRecord(deathData);
              const newbornDeathData = await getNewbornDeathByMother(mother.id);
              setExistingNewbornDeathRecord(newbornDeathData);
              await loadSupplements(mother.id);
            }
          }
        } catch (error) {
          console.error("Failed to fetch record:", error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      setLoading(true);
      fetchRecord();
      return () => {
        isActive = false;
      };
    }, [id])
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text className="mt-4 text-slate-500 font-medium">{t("profile.states.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <User size={64} color="#CBD5E1" />
        <Text className="mt-4 text-lg text-slate-500 font-medium">{t("profile.states.not_found")}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 px-8 py-3 rounded-full bg-blue-600">
          <Text className="text-white font-semibold">{t("profile.states.go_back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC] py-8">
      <StatusBar barStyle="dark-content" />
      <CustomHeader
        title={t("profile.title")}
        onBackPress={() => {
          if (from) {
            router.replace(from as any);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/dashboard/record");
          }
        }}
      />

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
      >
        <View className="px-3 gap-y-6">
          
          {/* Main Identity Card */}
          <View className="bg-white p-5 rounded-xl border border-slate-100">
            <View className="flex-row items-center mb-5">
              <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mr-4">
                <User size={32} color={Colors.primary} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">
                    {t("profile.identity.serial_no")} {record.serial_no || "N/A"}
                  </Text>
                </View>
                <Text className="text-slate-900 text-xl font-extrabold leading-tight">
                  {record.mother_name}
                </Text>
                <Text className="text-slate-500 font-medium text-[13px] mt-0.5">
                  {record.mother_age} {t("profile.identity.years")} • {t("profile.identity.maternal_health")}
                </Text>
              </View>
            </View>

            {/* Dates Grid */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-slate-50 p-3 rounded-md flex-row items-center border border-slate-100/50">
                <Calendar size={18} color="#64748B" className="mr-3" />
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{t("profile.identity.lmp_date")}</Text>
                  <Text className="text-sm font-semibold text-slate-800">
                    {record.lmp_year ? `${record.lmp_day}/${record.lmp_month}/${record.lmp_year}` : "---"}
                  </Text>
                </View>
              </View>
              <View className="flex-1 bg-blue-50 p-3 rounded-md flex-row items-center border border-blue-100/50">
                <Calendar size={18} color={Colors.primary} className="mr-3" />
                <View>
                  <Text className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-0.5">{t("profile.identity.edd_date")}</Text>
                  <Text className="text-sm font-semibold text-blue-900">
                    {record.edd_year ? `${record.edd_day}/${record.edd_month}/${record.edd_year}` : "---"}
                  </Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/dashboard/record/complete-profile", params: { id: record.id } } as any)}
              className="mt-4 bg-primary/80 py-3.5 flex-row items-center justify-center"
            >
              <FileText size={16} color="white" strokeWidth={2.5} />
              <Text className="text-white font-bold ml-2 text-sm">Edit Mother Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View className="flex-1 flex-row items-center gap-3">
            <View className="flex-1">
           <CounselingSection motherId={record.id} motherName={record?.mother_name} />
            </View>
            <View className="bg-white flex-1 p-4 rounded-md border border-slate-100 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3">
                <Calendar size={18} color="#10B981" />
              </View>
              <View className="">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t("profile.quick_stats.reg_date")}</Text>
                <Text className="text-slate-800 font-bold text-sm">
                  {record.date_day}/{record.date_month}/{record.date_year}
                </Text>
              </View>
            </View>
          </View>

          {/* ANC Checkups Card */}
          <View className="bg-white p-5 rounded-xl border border-slate-100">
            <SectionTitle title={t("profile.anc.title")} icon={Stethoscope} colorClass="bg-blue-500" />
            <View className="flex-row flex-wrap justify-between">
              <VisitBadge label={t("profile.anc.wk12")} val={record.checkup_12} />
              <VisitBadge label={t("profile.anc.wk16")} val={record.checkup_16} />
              <VisitBadge label={t("profile.anc.wk20_24")} val={record.checkup_20_24} />
              <VisitBadge label={t("profile.anc.wk28")} val={record.checkup_28} />
              <VisitBadge label={t("profile.anc.wk32")} val={record.checkup_32} />
              <VisitBadge label={t("profile.anc.wk34")} val={record.checkup_34} />
              <VisitBadge label={t("profile.anc.wk36")} val={record.checkup_36} />
              <VisitBadge label={t("profile.anc.wk38_40")} val={record.checkup_38_40} />
            </View>
            {record.checkup_other && (
              <View className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 flex-row items-center">
                <Info size={16} color="#64748B" className="mr-2" />
                <Text className="text-slate-600 text-[13px] font-medium">{record.checkup_other}</Text>
              </View>
            )}
          </View>

        <SupplementsScreen />
        <FamilyPlanningSection motherId={record.id} />

          {/* Birth & PNC Details Card */}
          <View className="bg-white p-5 rounded-xl border border-slate-100">
            <SectionTitle title={t("profile.birth_pnc.title")} icon={Baby} colorClass="bg-indigo-500" />
            <View className="flex-row gap-3 mb-5">
              <View className="flex-1 p-4 bg-slate-50 rounded-md border border-slate-100/50">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{t("profile.birth_pnc.place")}</Text>
                <Text className="text-slate-800 font-bold text-sm">{record.delivery_place || t("profile.birth_pnc.unrecorded")}</Text>
              </View>
              <View className="flex-1 p-4 bg-slate-50 rounded-md border border-slate-100/50">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{t("profile.birth_pnc.condition")}</Text>
                <Text className="text-slate-800 font-bold text-sm">{record.newborn_condition || t("profile.birth_pnc.unrecorded")}</Text>
              </View>
            </View>

            <Text className="text-slate-800 font-bold text-sm mb-3 ml-1">PNC Checkups</Text>
            <View className="flex-row flex-wrap justify-between">
              <VisitBadge label={t("profile.birth_pnc.hr24")} val={record.pnc_check_24hr} />
              <VisitBadge label={t("profile.birth_pnc.day3")} val={record.pnc_check_3day} />
              <VisitBadge label={t("profile.birth_pnc.day7_14")} val={record.pnc_check_7_14day} />
              <VisitBadge label={t("profile.birth_pnc.day42")} val={record.pnc_check_42day} />
            </View>


          </View>

          {/* Death Reporting Section */}
          <View className="bg-white p-5 rounded-xl border border-slate-100">
            <SectionTitle title={t("profile.mortality.title")} icon={AlertTriangle} colorClass="bg-red-500" />
            <View className="gap-y-3">
              {[
                {
                  title: t("profile.mortality.maternal_title"),
                  subtitle: t("profile.mortality.maternal_sub"),
                  key: 'maternal',
                  exists: !!existingDeathRecord
                },
                {
                  title: t("newborn_death_modal.title"),
                  subtitle: t("newborn_death_modal.subtitle"),
                  key: 'newborn',
                  exists: !!existingNewbornDeathRecord
                },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.key === 'maternal') {
                      if (existingDeathRecord) {
                        Alert.alert(t("profile.alerts.already_reported"), t("profile.alerts.maternal_exists"));
                      } else {
                        setMaternalDeathModalVisible(true);
                      }
                    } else if (item.key === 'newborn') {
                      setNewbornDeathModalVisible(true);
                    }
                  }}
                  className={`p-4 rounded-md border flex-row items-center justify-between ${
                    item.exists ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <View className="flex-1 mr-4">
                    <Text className={`font-bold text-[13px] ${item.exists ? 'text-rose-900' : 'text-slate-800'}`}>{item.title}</Text>
                    <Text className={`text-[11px] font-medium leading-relaxed mt-1 ${item.exists ? 'text-rose-600' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <View className={`px-3 py-2 rounded-md ${item.exists ? 'bg-rose-600' : 'bg-white border border-slate-200'}`}>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider ${item.exists ? 'text-white' : 'text-slate-600'}`}>
                      {item.key === 'newborn'
                        ? (item.exists ? t("profile.mortality.add_more") : t("profile.mortality.add"))
                        : (item.exists ? t("profile.mortality.submitted") : t("profile.mortality.add"))}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Remarks */}
          {record.remarks && (
            <View className="bg-white p-5 rounded-md border border-slate-100 mb-6">
              <SectionTitle title={t("profile.remarks")} icon={FileText} colorClass="bg-slate-500" />
              <View className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <Text className="text-slate-600 font-medium leading-relaxed text-[13px]">{record.remarks}</Text>
              </View>
            </View>
          )}

        </View>

        {/* Modals */}
        {record && (
          <>
            <MaternalDeathModal
              visible={maternalDeathModalVisible}
              onClose={() => setMaternalDeathModalVisible(false)}
              record={record}
              onSuccess={(data) => setExistingDeathRecord(data)}
              showToast={showToast}
            />
            <NewbornDeathModal
              visible={newbornDeathModalVisible}
              onClose={() => setNewbornDeathModalVisible(false)}
              record={record}
              onSuccess={(data) => setExistingNewbornDeathRecord(data)}
              showToast={showToast}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
