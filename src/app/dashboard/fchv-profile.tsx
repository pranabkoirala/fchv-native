import { useRouter } from "expo-router";
import {
  Award,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileText,
  Globe,
  Home,
  LogOut,
  Map,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getFchvData } from "@/api/services/fchv";
import { doSync } from "@/api/services/sync/sync";
import ModalWithSafeArea from "@/components/common/ModalWithSafeArea";
import DatabaseViewer from "@/components/DatabaseViewer";
import { clearDatabase } from "@/hooks/database/db";
import {
  exportAdolescentIfaToPdf,
  exportAllDataToPdf,
  exportChildDeathToPdf,
  exportInfantCareToPdf,
  exportMaternalDeathToPdf,
  exportNewbornDeathToPdf,
  exportPregnancyToPdf,
} from "@/utils/pdfGenerator";
import storage from "@/utils/storage";
import { useLanguage } from "../../context/LanguageContext";

type FchvAddress = {
  province: { id: string; name_en: string; name_ne: string };
  district: { id: string; name_en: string; name_ne: string };
  municipality: { id: string; name_en: string; name_ne: string };
  ward: { id: string; number: number };
  locality?: string;
  house_number?: string;
};

type Organization = {
  name: string;
  link: string;
  code: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  type: string;
  address: FchvAddress;
};

type FchvProfile = {
  id: string;
  user: { username: string; name: string; user_type: string };
  address: FchvAddress;
  phone_number: string;
  description: string;
  date_of_birth: string;
  photo: string | null;
  training_received_on: string;
  is_active: boolean;
  organization: Organization;
};

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState<FchvProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [exportingItem, setExportingItem] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFchvData();
        setProfile(data);
      } catch (e) {
        console.error("error fetching fchv profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      t("profile_settings.logout_alert_title") || "Log Out",
      t("profile_settings.logout_alert_msg") ||
        "Are you sure you want to log out? Ensure all data is synced.",
      [
        { text: t("profile_settings.cancel") || "Cancel", style: "cancel" },
        {
          text: t("profile_settings.logout") || "Log Out",
          style: "destructive",
          onPress: async () => {
            await clearDatabase();
            await storage.clear();
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await doSync();
      const data = await getFchvData();
      if (data) {
        setProfile(data);
      }
      Alert.alert(
        t("profile_settings.sync_success_title") || "Sync Successful",
        t("profile_settings.sync_success_msg") ||
          "All offline data has been synced with the server.",
      );
    } catch (e) {
      console.error("error syncing data", e);
      Alert.alert(
        t("profile_settings.sync_failed_title") || "Sync Failed",
        t("profile_settings.sync_failed_msg") ||
          "An error occurred while syncing data.",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = async (exportFn: () => Promise<void>, label: string) => {
    if (exportingItem) return;
    try {
      setExportingItem(label);
      setIsExporting(true);
      await exportFn();
      setIsExporting(false);
      setExportingItem(null);
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 1500);
    } catch (error) {
      setIsExporting(false);
      setExportingItem(null);
      console.error(error);
      Alert.alert(
        t("profile_settings.export_error_title") || "Export Failed",
        t("profile_settings.export_error_msg") ||
          "Could not export database data.",
      );
    }
  };

  const reportItems = [
    {
      key: "pregnancy",
      label: t("profile_settings.report_pregnancy") || "Pregnancy Records",
      fn: exportPregnancyToPdf,
    },
    {
      key: "maternal_death",
      label: t("profile_settings.report_maternal_death") || "Maternal Death",
      fn: exportMaternalDeathToPdf,
    },
    {
      key: "newborn_death",
      label: t("profile_settings.report_newborn_death") || "Newborn Death",
      fn: exportNewbornDeathToPdf,
    },
    {
      key: "child_death",
      label:
        t("profile_settings.report_child_death") || "Child Death (28d–59m)",
      fn: exportChildDeathToPdf,
    },
    {
      key: "infant_care",
      label: t("profile_settings.report_infant_care") || "Infant Care",
      fn: exportInfantCareToPdf,
    },
    {
      key: "adolescent_ifa",
      label:
        t("profile_settings.report_adolescent_ifa") ||
        "Iron-consuming adolescent",
      fn: exportAdolescentIfaToPdf,
    },
  ];

  const name = profile?.user?.name || "—";
  const initials =
    name === "—"
      ? ""
      : name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
  const userType = profile?.user?.user_type || "FCHV";
  const username = profile?.user?.username || "";

  const addrName = (a?: { name_en: string; name_ne: string }) => {
    if (!a) return "—";
    return language === "np" ? a.name_ne : a.name_en;
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0E7490" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC] pb-32">
      <StatusBar backgroundColor="#F8FAFC" barStyle="dark-content" />

      {isExporting && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(300)}
          style={{ paddingTop: insets.top + 10 }}
          className="absolute left-5 right-5 z-50 animate-bounce"
        >
          <View className="bg-blue-600 px-5 py-4 rounded-2xl flex-row items-center">
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-semibold text-[15px] ml-3">
              {t("profile_settings.exporting") || "Downloading PDF record..."}
            </Text>
          </View>
        </Animated.View>
      )}

      {showExportSuccess && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(300)}
          style={{ paddingTop: insets.top + 10 }}
          className="absolute left-5 right-5 z-50"
        >
          <View className="bg-emerald-500 px-5 py-4 rounded-2xl flex-row items-center">
            <CheckCircle size={20} color="white" />
            <Text className="text-white font-semibold text-[15px] ml-3">
              {t("profile_settings.export_success") ||
                "Downloaded successfully"}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 12 }}
        className="bg-white px-5 pb-4 flex-row items-center gap-28"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl items-center justify-center border border-slate-100"
        >
          <ChevronLeft size={20} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-slate-900">
          {t("profile_settings.title") || "My Profile"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Profile Avatar section */}
        <Animated.View
          entering={FadeInDown.delay(50).duration(450)}
          className="mx-5 mt-6"
        >
          <View className="bg-white rounded-3xl border border-slate-100 px-5 pt-8 pb-6 items-center">
            <View className="relative w-24 h-24 self-center items-center justify-center">
              {profile?.photo ? (
                <Image
                  source={{ uri: profile.photo }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-[#0E7490] items-center justify-center">
                  <Text className="text-2xl font-bold text-white">
                    {initials}
                  </Text>
                </View>
              )}
              {profile?.is_active !== false && (
                <View className="absolute bottom-0 right-1 bg-emerald-500 rounded-full p-0.5">
                  <CheckCircle size={16} color="white" />
                </View>
              )}
            </View>
            <Text className="text-[22px] font-bold text-slate-900 mt-4">
              {name}
            </Text>
            <Text className="text-[14px] text-slate-400 mt-0.5">
              {username}
            </Text>
            <View className="flex-row items-center gap-2.5 mt-3">
              <View className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <Text className="text-[11px] font-bold text-emerald-700">
                  {userType}
                </Text>
              </View>
              {profile?.is_active !== false && (
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-[12px] font-semibold text-slate-500">
                    Active
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(450)}
          className="flex-row mx-5 mt-5 gap-3"
        >
          <View className="flex-1 bg-slate-50 rounded-2xl py-4 px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center mb-2">
              <MapPin size={18} color="#0284C7" />
            </View>
            <Text
              className="text-[13px] font-bold text-slate-800 text-center"
              numberOfLines={1}
            >
              {profile?.address?.municipality
                ? addrName(profile.address.municipality)
                : "—"}
            </Text>
            <Text className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center">
              {language === "np" ? "नगरपालिका" : "Municipality"}
            </Text>
          </View>

          <View className="flex-1 bg-slate-50 rounded-2xl py-4 px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-xl bg-violet-50 items-center justify-center mb-2">
              <Building2 size={18} color="#7C3AED" />
            </View>
            <Text
              className="text-[13px] font-bold text-slate-800 text-center"
              numberOfLines={1}
            >
              {profile?.organization?.code || "—"}
            </Text>
            <Text className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center">
              Org Code
            </Text>
          </View>

          <View className="flex-1 bg-slate-50 rounded-2xl py-4 px-2 items-center justify-center">
            <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center mb-2">
              <Shield size={18} color="#059669" />
            </View>
            <Text
              className="text-[13px] font-bold text-slate-800 text-center"
              numberOfLines={1}
            >
              {language === "np"
                ? `वडा ${profile?.address?.ward?.number || "—"}`
                : `Ward ${profile?.address?.ward?.number || "—"}`}
            </Text>
            <Text className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-1 text-center">
              Ward
            </Text>
          </View>
        </Animated.View>

        {/* Section: Personal Details */}
        <Animated.View entering={FadeInDown.delay(150).duration(450)}>
          <Text className="text-[13px] font-bold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
            {language === "np" ? "व्यक्तिगत विवरण" : "Personal Details"}
          </Text>
          <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 gap-3">
            <View className="flex-row items-center py-1">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                <Phone size={15} color="#64748B" />
              </View>
              <Text className="text-[14px] text-slate-500 flex-1">
                {language === "np" ? "फोन" : "Phone"}
              </Text>
              <Text className="text-[14px] font-bold text-slate-800">
                {profile?.phone_number || "—"}
              </Text>
            </View>
            <View className="h-px bg-slate-100" />

            <View className="flex-row items-center py-1">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                <Calendar size={15} color="#64748B" />
              </View>
              <Text className="text-[14px] text-slate-500 flex-1">
                {language === "np" ? "जन्म मिति" : "Date of Birth"}
              </Text>
              <Text className="text-[14px] font-bold text-slate-800">
                {profile?.date_of_birth || "—"}
              </Text>
            </View>
            <View className="h-px bg-slate-100" />

            <View className="flex-row items-center py-1">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-3 border border-slate-100">
                <Award size={15} color="#64748B" />
              </View>
              <Text className="text-[14px] text-slate-500 flex-1">
                {language === "np" ? "तालिम मिति" : "Training Date"}
              </Text>
              <Text className="text-[14px] font-bold text-slate-800">
                {profile?.training_received_on || "—"}
              </Text>
            </View>

            {profile?.description ? (
              <>
                <View className="h-px bg-slate-100" />
                <View className="pt-2">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === "np" ? "मेरो बारेमा" : "About Me"}
                  </Text>
                  <Text className="text-[13px] italic text-slate-600 mt-1">
                    {profile.description}
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* Section: Organization */}
        {profile?.organization && (
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <Text className="text-[13px] font-bold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
              {language === "np" ? "संस्था" : "Organization"}
            </Text>
            <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-amber-50 rounded-2xl items-center justify-center mr-3.5 border border-amber-100">
                  <Building2 size={22} color="#D97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-slate-800">
                    {profile.organization.name || "—"}
                  </Text>
                  <Text className="text-[11px] font-bold text-slate-400 uppercase mt-0.5">
                    {profile.organization.type || "—"} •{" "}
                    {profile.organization.code || "—"}
                  </Text>
                </View>
              </View>

              {(profile.organization.contact_name ||
                profile.organization.contact_phone) && (
                <View className="bg-slate-50 rounded-xl p-3 mt-3.5 gap-2 border border-slate-100">
                  {profile.organization.contact_name && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[13px] text-slate-500">
                        {language === "np"
                          ? "सम्पर्क व्यक्ति"
                          : "Contact Person"}
                      </Text>
                      <Text className="text-[13px] font-bold text-slate-700">
                        {profile.organization.contact_name}
                      </Text>
                    </View>
                  )}
                  {profile.organization.contact_phone && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-[13px] text-slate-500">
                        {language === "np" ? "फोन" : "Phone"}
                      </Text>
                      <Text className="text-[13px] font-bold text-slate-700">
                        {profile.organization.contact_phone}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Section: Address Details */}
        <Animated.View entering={FadeInDown.delay(250).duration(450)}>
          <Text className="text-[13px] font-bold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
            {language === "np" ? "ठेगाना विवरण" : "Address Details"}
          </Text>

          {/* Card 1: Org Address */}
          <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 relative overflow-hidden mb-3">
            {/* Watermark Map Icon */}
            <View
              className="absolute right-4 bottom-2 opacity-[0.07]"
              pointerEvents="none"
            >
              <Map size={72} color="#475569" strokeWidth={1.5} />
            </View>

            <View className="flex-row items-center mb-4">
              <Building2 size={15} color="#64748B" />
              <Text className="text-[11px] font-bold text-slate-500 ml-2 uppercase tracking-wide">
                {language === "np" ? "संस्थाको ठेगाना" : "Organization Address"}
              </Text>
            </View>

            <View className="flex-row gap-10 mb-3">
              <View>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {language === "np" ? "प्रदेश" : "Province"}
                </Text>
                <Text className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {profile?.organization?.address
                    ? addrName(profile.organization.address.province)
                    : "—"}
                </Text>
              </View>
              <View>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {language === "np" ? "जिल्ला" : "District"}
                </Text>
                <Text className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {profile?.organization?.address
                    ? addrName(profile.organization.address.district)
                    : "—"}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {language === "np" ? "गाउँपालिका/नगरपालिका" : "Municipality"}
              </Text>
              <Text className="text-[14px] font-bold text-slate-800 mt-0.5">
                {profile?.organization?.address
                  ? `${addrName(profile.organization.address.municipality)} (${language === "np" ? `वडा ${profile.organization.address.ward.number}` : `Ward ${profile.organization.address.ward.number}`})`
                  : "—"}
              </Text>
            </View>
          </View>

          {/* Card 2: FCHV Address */}
          <View className="mx-5 bg-white rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
            {/* Watermark Home Icon */}
            <View
              className="absolute right-4 bottom-2 opacity-[0.07]"
              pointerEvents="none"
            >
              <Home size={72} color="#475569" strokeWidth={1.5} />
            </View>

            <View className="flex-row items-center mb-4">
              <MapPin size={15} color="#64748B" />
              <Text className="text-[11px] font-bold text-slate-500 ml-2 uppercase tracking-wide">
                {language === "np" ? "स्वयंसेविकाको ठेगाना" : "FCHV Address"}
              </Text>
            </View>

            <View className="flex-row gap-10 mb-3">
              <View>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {language === "np" ? "प्रदेश" : "Province"}
                </Text>
                <Text className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {profile?.address ? addrName(profile.address.province) : "—"}
                </Text>
              </View>
              <View>
                <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {language === "np" ? "जिल्ला" : "District"}
                </Text>
                <Text className="text-[14px] font-bold text-slate-800 mt-0.5">
                  {profile?.address ? addrName(profile.address.district) : "—"}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {language === "np"
                  ? "गाउँपालिका/नगरपालिका, टोल"
                  : "Municipality, Locality"}
              </Text>
              <Text className="text-[14px] font-bold text-slate-800 mt-0.5">
                {profile?.address
                  ? `${addrName(profile.address.municipality)}${profile.address.locality ? `, ${profile.address.locality}` : ""} (${language === "np" ? `वडा ${profile.address.ward.number}` : `Ward ${profile.address.ward.number}`})`
                  : "—"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Section: Settings */}
        <Animated.View entering={FadeInDown.delay(300).duration(450)}>
          <Text className="text-[13px] font-bold px-5 mt-6 mb-2.5 text-slate-500 uppercase tracking-wider">
            {language === "np" ? "सेटिङ्गहरू" : "Settings"}
          </Text>
          <View className="mx-5 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Language */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/dashboard/change-language")}
              className="flex-row items-center px-4 py-3.5 border-b border-slate-100"
            >
              <View className="w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center mr-3 border border-indigo-100">
                <Globe size={15} color="#6366F1" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 flex-1">
                {t("profile_settings.language") || "Language"}
              </Text>
              <Text className="text-[13px] font-bold text-slate-400 mr-2">
                {language === "np" ? "नेपाली" : "English"}
              </Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Sync */}
            <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
              <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
                <RefreshCw size={15} color="#10B981" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 flex-1">
                {t("profile_settings.data_sync") || "Data Sync"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSync}
                disabled={isSyncing}
                className="px-4 py-1.5 rounded-lg bg-[#2D4A43] items-center justify-center"
              >
                <Text className="text-[12px] font-bold text-white">
                  {isSyncing
                    ? t("profile_settings.syncing") || "Syncing..."
                    : t("profile_settings.sync_now") || "Sync Now"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* DB Inspector */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDbOpen(true)}
              className="flex-row items-center px-4 py-3.5 border-b border-slate-100"
            >
              <View className="w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mr-3 border border-amber-100">
                <Database size={15} color="#F59E0B" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 flex-1">
                {t("profile_settings.db_inspector") || "Database Inspector"}
              </Text>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>

            {/* Export Reports */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowReports(!showReports)}
              className="flex-row items-center px-4 py-3.5 border-b border-slate-100"
            >
              <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3 border border-blue-100">
                <Download size={15} color="#3B82F6" />
              </View>
              <Text className="text-[14px] font-bold text-slate-800 flex-1">
                {t("profile_settings.export_data") || "Export Reports as PDF"}
              </Text>
              {showReports ? (
                <ChevronDown size={16} color="#94A3B8" />
              ) : (
                <ChevronRight size={16} color="#94A3B8" />
              )}
            </TouchableOpacity>

            {/* Reports Expandable Submenu */}
            {showReports && (
              <View className="bg-slate-50 px-4 py-2 border-b border-slate-100 gap-1.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleExport(exportAllDataToPdf, "all")}
                  disabled={!!exportingItem}
                  className="flex-row items-center py-2 border-b border-slate-100"
                >
                  <View className="w-7 h-7 rounded-lg bg-blue-600 items-center justify-center mr-3">
                    <Download size={12} color="white" />
                  </View>
                  <Text className="flex-1 text-[13px] font-bold text-blue-900">
                    {t("profile_settings.download_all") ||
                      "Download All Reports"}
                  </Text>
                  {exportingItem === "all" ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : null}
                </TouchableOpacity>

                {reportItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => handleExport(item.fn, item.key)}
                    disabled={!!exportingItem}
                    className={`flex-row items-center py-2.5 ${idx !== reportItems.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <View className="w-7 h-7 rounded-lg bg-white border border-slate-100 items-center justify-center mr-3">
                      <FileText size={12} color="#64748B" />
                    </View>
                    <Text className="flex-1 text-[13px] font-semibold text-slate-700">
                      {item.label}
                    </Text>
                    {exportingItem === item.key ? (
                      <ActivityIndicator size="small" color="#64748B" />
                    ) : (
                      <Download size={12} color="#CBD5E1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Log Out */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              className="flex-row items-center px-4 py-3.5"
            >
              <View className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center mr-3 border border-red-100">
                <LogOut size={15} color="#EF4444" />
              </View>
              <Text className="text-[14px] font-bold text-red-500 flex-1">
                {t("profile_settings.logout") || "Log Out"}
              </Text>
              <ChevronRight size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Database Inspector Modal */}
      <ModalWithSafeArea
        visible={isDbOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsDbOpen(false)}
      >
        <DatabaseViewer onClose={() => setIsDbOpen(false)} />
      </ModalWithSafeArea>
    </View>
  );
}
