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
  Activity,
  Calendar,
  Edit,
  Trash2,
  Baby,
  Pill,
  Heart,
  FileText,
  Info
} from "lucide-react-native";
import "../../../global.css";
import { getHmisRecord, deleteHmisRecord } from "../../../hooks/database/models/HmisRecordModel";
import { getMaternalDeathByMother } from "../../../hooks/database/models/MaternalDeathModel";
import { getNewbornDeathByMother } from "../../../hooks/database/models/NewbornDeathModel";
import { getChildDeathByMother } from "../../../hooks/database/models/ChildDeathModel";
import MaternalDeathModal from "../../../components/forms/MaternalDeathModal";
import NewbornDeathModal from "../../../components/forms/NewbornDeathModal";
import ChildDeathModal from "../../../components/forms/ChildDeathModal";
import { HmisRecordStoreType } from "../../../hooks/database/types/hmisRecordModal";
import { MaternalDeathStoreType } from "../../../hooks/database/types/maternalDeathModal";
import { NewbornDeathStoreType } from "../../../hooks/database/types/newbornDeathModal";
import { ChildDeathStoreType } from "../../../hooks/database/types/childDeathModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { useToast } from "../../../context/ToastContext";
import { useTranslation } from "react-i18next";

// Helper components moved outside to prevent re-renders on every parent state change
const SectionTitle = ({ title, icon: Icon, color }: any) => (
  <View className="flex-row items-center mb-4 mt-2 px-1">
    <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${color}`}>
      <Icon size={16} color="white" />
    </View>
    <Text className="text-slate-800 font-semibold text-base">{title}</Text>
  </View>
);

const VisitBadge = ({ label, val }: any) => (
  <View className={`px-3 py-2 rounded-xl flex-row items-center mr-2 mb-2 border ${val ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
    <View className={`w-1.5 h-1.5 rounded-full ${val ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    <Text className={`ml-2 text-[12px] ${val ? 'text-emerald-700 font-semibold' : 'text-slate-400 font-medium'}`}>{label}</Text>
  </View>
);

export default function HmisRecordProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [record, setRecord] = useState<HmisRecordStoreType | null>(null);
  const [existingDeathRecord, setExistingDeathRecord] = useState<MaternalDeathStoreType | null>(null);
  const [existingNewbornDeathRecord, setExistingNewbornDeathRecord] = useState<NewbornDeathStoreType | null>(null);
  const [existingChildDeathRecord, setExistingChildDeathRecord] = useState<ChildDeathStoreType | null>(null);
  const [loading, setLoading] = useState(true);

  const [maternalDeathModalVisible, setMaternalDeathModalVisible] = useState(false);
  const [newbornDeathModalVisible, setNewbornDeathModalVisible] = useState(false);
  const [childDeathModalVisible, setChildDeathModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchRecord = async () => {
        if (!id) {
          setLoading(false);
          return;
        }
        try {
          const data = await getHmisRecord(id);
          if (isActive) {
            setRecord(data);
            if (data?.id) {
              const deathData = await getMaternalDeathByMother(data.id);
              setExistingDeathRecord(deathData);
              const newbornDeathData = await getNewbornDeathByMother(data.id);
              setExistingNewbornDeathRecord(newbornDeathData);
              const childDeathData = await getChildDeathByMother(data.id);
              setExistingChildDeathRecord(childDeathData);
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

  const handleDelete = () => {
    Alert.alert(
      t("profile.alerts.delete_title"),
      t("profile.alerts.delete_msg"),
      [
        { text: t("profile.alerts.cancel"), style: "cancel" },
        {
          text: t("profile.alerts.delete"),
          style: "destructive",
          onPress: async () => {
            if (record?.id) {
              try {
                await deleteHmisRecord(record.id);
                showToast(t("profile.alerts.delete_success"));
                router.back();
              } catch (error) {
                Alert.alert(t("profile.alerts.error"), t("profile.alerts.delete_error"));
              }
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text className="mt-4 text-slate-400 font-medium">{t("profile.states.loading")}</Text>
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <User size={48} color="#CBD5E1" />
        <Text className="mt-4 text-lg text-slate-500 font-medium">{t("profile.states.not_found")}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-6 px-8 py-3 rounded-2xl bg-primary">
          <Text className="text-white font-semibold">{t("profile.states.go_back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      <CustomHeader
        title={t("profile.title")}
        rightNode={
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/dashboard/record/add-record", params: { id: record.id } } as any)}
              className="p-2"
            >
              <Edit size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="p-2"
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Fixed Identity Section: This stays at the top while details scroll below */}
      <View className="px-5 pt-6 pb-4 bg-white border-b border-slate-50">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center border border-blue-100">
            <User size={32} color={Colors.primary} />
          </View>
          <View className="ml-4 flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-slate-500 font-medium text-xs uppercase tracking-wider">{t("profile.identity.serial_no")} {record.serial_no}</Text>
            </View>
            <Text className="text-slate-900 text-2xl font-semibold leading-tight">
              {record.mother_name}
            </Text>
            <Text className="text-slate-500 font-medium text-sm mt-1">{record.mother_age} {t("profile.identity.years")} • {t("profile.identity.maternal_health")}</Text>
          </View>
        </View>

        {/* Clean Info Grid */}
        <View className="flex-row mt-6 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
          <View className="flex-1 p-4 items-center border-r border-slate-100">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{t("profile.identity.lmp_date")}</Text>
            <Text className="text-slate-700 font-semibold text-base">
              {record.lmp_year ? `${record.lmp_day}/${record.lmp_month}/${record.lmp_year}` : "---"}
            </Text>
          </View>
          <View className="flex-1 p-4 items-center">
            <Text className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1.5">{t("profile.identity.edd_date")}</Text>
            <Text className="text-slate-700 font-semibold text-base">
              {record.edd_year ? `${record.edd_day}/${record.edd_month}/${record.edd_year}` : "---"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }} // Extra padding to ensure content isn't "stuck" behind BottomNavigation
      >
        <View className="px-5 py-6 gap-y-6">

          {/* Quick Stats Row */}
          <View className="flex-row gap-4">
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
              <View className="flex-row items-center mb-2">
                <Info size={14} color={Colors.primary} />
                <Text className="ml-2 text-slate-400 text-[11px] font-bold uppercase">{t("profile.quick_stats.counseling")}</Text>
              </View>
              <Text className="text-slate-800 font-semibold text-base">{record.counseling_given ? t("profile.quick_stats.provided") : t("profile.quick_stats.not_provided")}</Text>
            </View>
            <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/50">
              <View className="flex-row items-center mb-2">
                <Calendar size={14} color="#D97706" />
                <Text className="ml-2 text-slate-400 text-[11px] font-bold uppercase">{t("profile.quick_stats.reg_date")}</Text>
              </View>
              <Text className="text-slate-800 font-semibold text-base">{record.date_day}/{record.date_month}/{record.date_year}</Text>
            </View>
          </View>

          {/* ANC Checkups */}
          <View>
            <SectionTitle title={t("profile.anc.title")} icon={Activity} color="bg-blue-500" />
            <View className="flex-row flex-wrap">
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
              <View className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Text className="text-slate-500 text-xs font-medium">{record.checkup_other}</Text>
              </View>
            )}
          </View>

          {/* Supplements */}
          <View>
            <SectionTitle title={t("profile.supplements.title")} icon={Pill} color="bg-rose-500" />
            <View className="gap-y-2">
              {[
                { label: t("profile.supplements.iron_preg"), val: record.iron_preg_received },
                { label: t("profile.supplements.iron_pnc"), val: record.iron_pnc_received },
                { label: t("profile.supplements.vit_a"), val: record.vit_a_received }
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                  <Text className="text-slate-700 font-medium text-sm">{item.label}</Text>
                  <View className={`px-3 py-1 rounded-full ${item.val ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <Text className="text-white text-[10px] font-bold uppercase">{item.val ? t("profile.supplements.done") : t("profile.supplements.pending")}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Birth & PNC Details */}
          <View>
            <SectionTitle title={t("profile.birth_pnc.title")} icon={Baby} color="bg-indigo-500" />
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 p-4 bg-white rounded-2xl border border-slate-100">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">{t("profile.birth_pnc.place")}</Text>
                <Text className="text-slate-800 font-semibold">{record.delivery_place || t("profile.birth_pnc.unrecorded")}</Text>
              </View>
              <View className="flex-1 p-4 bg-white rounded-2xl border border-slate-100">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">{t("profile.birth_pnc.condition")}</Text>
                <Text className="text-slate-800 font-semibold">{record.newborn_condition || t("profile.birth_pnc.unrecorded")}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap">
              <VisitBadge label={t("profile.birth_pnc.hr24")} val={record.pnc_check_24hr} />
              <VisitBadge label={t("profile.birth_pnc.day3")} val={record.pnc_check_3day} />
              <VisitBadge label={t("profile.birth_pnc.day7_14")} val={record.pnc_check_7_14day} />
              <VisitBadge label={t("profile.birth_pnc.day42")} val={record.pnc_check_42day} />
            </View>

            <View className="mt-4 p-4 rounded-2xl bg-slate-900 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Heart size={16} color="white" />
                <Text className="text-white ml-3 font-medium text-sm">{t("profile.birth_pnc.fp_used")}</Text>
              </View>
              <Text className={`font-semibold text-sm ${record.family_planning_used ? 'text-primary' : 'text-slate-400'}`}>
                {record.family_planning_used ? t("profile.birth_pnc.yes") : t("profile.birth_pnc.no")}
              </Text>
            </View>
          </View>

          {/* Death Reporting Section */}
          <View>
            <SectionTitle title={t("profile.mortality.title")} icon={Activity} color="bg-red-500" />
            <View className="gap-y-3">
              {[
                {
                  title: t("profile.mortality.maternal_title"),
                  subtitle: t("profile.mortality.maternal_sub"),
                  key: 'maternal',
                  exists: !!existingDeathRecord
                },
                {
                  title: t("profile.mortality.newborn_title"),
                  subtitle: t("profile.mortality.newborn_sub"),
                  key: 'newborn',
                  exists: !!existingNewbornDeathRecord
                },
                {
                  title: t("profile.mortality.child_title"),
                  subtitle: t("profile.mortality.child_sub"),
                  key: 'child',
                  exists: !!existingChildDeathRecord
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
                    } else if (item.key === 'child') {
                      setChildDeathModalVisible(true);
                    }
                  }}
                  className={`p-4 rounded-2xl border ${item.exists ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                    }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-slate-800 font-semibold text-sm">{item.title}</Text>
                      <Text className="text-slate-400 text-[10px] font-medium leading-relaxed mt-1">
                        {item.subtitle}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-lg ${item.exists ? 'bg-emerald-100' : 'bg-white border border-slate-200'}`}>
                      <Text className={`text-[10px] font-bold uppercase ${item.exists ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {['newborn', 'child'].includes(item.key)
                          ? (item.exists ? t("profile.mortality.add_more") : t("profile.mortality.add"))
                          : (item.exists ? t("profile.mortality.submitted") : t("profile.mortality.add"))}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Remarks */}
          {record.remarks && (
            <View className="mb-6">
              <SectionTitle title={t("profile.remarks")} icon={FileText} color="bg-slate-400" />
              <View className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Text className="text-slate-600 font-medium leading-relaxed">{record.remarks}</Text>
              </View>
            </View>
          )}

        </View>

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
            <ChildDeathModal
              visible={childDeathModalVisible}
              onClose={() => setChildDeathModalVisible(false)}
              record={record}
              onSuccess={(data) => setExistingChildDeathRecord(data)}
              showToast={showToast}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
