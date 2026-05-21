import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileText,
  Globe,
  LogOut,
  MapPin,
  RefreshCw,
  Shield,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import ModalWithSafeArea from "@/components/common/ModalWithSafeArea";
import DatabaseViewer from "@/components/DatabaseViewer";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/token";
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

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [exportingItem, setExportingItem] = useState<string | null>(null);

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
            await storage.remove(ACCESS_TOKEN_KEY);
            await storage.remove(REFRESH_TOKEN_KEY);
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert(
        t("profile_settings.sync_success_title") || "Sync Successful",
        t("profile_settings.sync_success_msg") ||
          "All offline data has been synced with the server.",
      );
    }, 2000);
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
      setTimeout(() => {
        setShowExportSuccess(false);
      }, 1500);
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

  return (
    <View className="flex-1 bg-[#F1F5F9] pb-10">
      <StatusBar backgroundColor="#f9fafb" />

      {/* Floating Animated Status Toast */}
      {isExporting && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          exiting={FadeOutUp.duration(300)}
          style={{ paddingTop: insets.top + 10 }}
          className="absolute left-5 right-5 z-50"
        >
          <View className="bg-blue-600 px-5 py-4 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold text-[15px] ml-3">
                {t("profile_settings.exporting") || "Downloading PDF record..."}
              </Text>
            </View>
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
          <View className="bg-emerald-500 px-5 py-4 rounded-2xl flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <CheckCircle size={20} color="white" />
              <Text className="text-white font-semibold text-[15px] ml-3">
                {t("profile_settings.export_success") ||
                  "Downloaded successfully"}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        bounces={false}
      >
        {/* 1. Hero / Identity Card with Premium Gradient */}
        <LinearGradient
          colors={["#1E3A8A", "#3B82F6", "#60A5FA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="pb-8 px-6 rounded-b-[40px]"
          style={{ paddingTop: insets.top + 20 }}
        >
          {/* Custom Header within Gradient */}
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center backdrop-blur-md"
            >
              <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text className="text-white font-bold text-lg tracking-wide">
              {t("profile_settings.title") || "My Profile"}
            </Text>
            <View className="w-10 h-10" />
          </View>

          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="items-center"
          >
            {/* Glowing Profile Avatar */}
            <View className="mb-5">
              <View className="w-28 h-28 rounded-full border-[4px] border-white/30 bg-white/10 items-center justify-center overflow-hidden backdrop-blur-lg">
                <User size={50} color="#FFFFFF" strokeWidth={1.5} />
              </View>
              {/* Active Badge */}
              <View className="absolute bottom-1 right-3 w-6 h-6 bg-emerald-400 rounded-full border-4 border-[#3B82F6]" />
            </View>

            <Text className="text-white text-3xl font-extrabold tracking-tight mb-2 text-center">
              {t("profile_settings.name") || "Laxmi Shrestha"}
            </Text>

            <View className="flex-row items-center bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-md">
              <Shield size={14} color="#E0F2FE" className="mr-1.5" />
              <Text className="text-blue-50 font-semibold text-xs tracking-wider">
                {t("profile_settings.fchv_id") || "FCHV ID"}: 9840-NP
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 2. Quick Info Grid (Overlapping the gradient slightly) */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-5 -mt-6"
        >
          <View className="bg-white rounded-2xl p-5 flex-row justify-between items-center border border-slate-100">
            <View className="items-center flex-1 border-r border-slate-100">
              <MapPin size={22} color="#3B82F6" className="mb-2" />
              <Text className="text-slate-800 font-bold text-[15px] text-center">
                Ward 4
              </Text>
              <Text className="text-slate-400 text-[11px] font-medium mt-1">
                Kathmandu
              </Text>
            </View>
            <View className="items-center flex-1">
              <Shield size={22} color="#10B981" className="mb-2" />
              <Text className="text-slate-800 font-bold text-[15px] text-center">
                Active
              </Text>
              <Text className="text-slate-400 text-[11px] font-medium mt-1">
                Status
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 3. Preferences & Actions Group */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5 mt-8"
        >
          <Text className="text-slate-500 font-bold text-xs mb-3 px-2 uppercase tracking-widest">
            {t("profile_settings.preferences") || "Preferences & Settings"}
          </Text>

          <View className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            {/* Language Toggle */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/dashboard/change-language")}
              className="flex-row items-center px-5 py-4 border-b border-slate-50"
            >
              <View className="w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center mr-4">
                <Globe size={22} color="#6366F1" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-semibold text-[16px] mb-0.5">
                  {t("profile_settings.language") || "Language"}
                </Text>
                <Text className="text-slate-400 text-[13px]">
                  {t("profile_settings.language_sub") ||
                    "Choose your preferred language"}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-xs font-semibold mr-2">
                  {language === "np" ? "नेपाली" : "English"}
                </Text>
                <ChevronRight size={18} color="#CBD5E1" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Sync Status */}
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50">
              <View className="w-12 h-12 rounded-2xl bg-emerald-50 items-center justify-center mr-4">
                <RefreshCw size={22} color="#10B981" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-semibold text-[15px] mb-0.5">
                  {t("profile_settings.data_sync") || "Data Sync"}
                </Text>
                <Text className="text-slate-400 text-[13px]">
                  {t("profile_settings.last_synced") ||
                    "Last synced: Today, 10:30 AM"}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSync}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-xl ${
                  isSyncing
                    ? "bg-slate-100"
                    : "bg-emerald-50 active:bg-emerald-100"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${isSyncing ? "text-slate-400" : "text-emerald-600"}`}
                >
                  {isSyncing
                    ? t("profile_settings.syncing") || "Syncing..."
                    : t("profile_settings.sync_now") || "Sync Now"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Developer Mode / Inspector */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDbOpen(true)}
              className="flex-row items-center px-5 py-4"
            >
              <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center mr-4">
                <Database size={22} color="#F59E0B" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-semibold text-[15px] mb-0.5">
                  {t("profile_settings.db_inspector") || "Database Inspector"}
                </Text>
                <Text className="text-slate-400 text-[13px]">
                  {t("profile_settings.db_inspector_sub") ||
                    "View local SQLite storage"}
                </Text>
              </View>
              <ChevronRight size={18} color="#CBD5E1" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 4. Download Reports Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          className="px-5 mt-8"
        >
          <Text className="text-slate-500 font-semibold text-xs mb-3 px-2 uppercase tracking-widest">
            {t("profile_settings.download_reports") || "Download Reports"}
          </Text>

          <View className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowReports(!showReports)}
              className="flex-row items-center px-5 py-4"
            >
              <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mr-4">
                <Download size={22} color="#3B82F6" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-semibold text-[15px] mb-0.5">
                  {t("profile_settings.export_data") || "Export Reports as PDF"}
                </Text>
                <Text className="text-slate-400 text-[13px]">
                  {t("profile_settings.export_data_sub") ||
                    "Download all or individual tables"}
                </Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                {showReports ? (
                  <ChevronDown size={18} color="#94A3B8" strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={18} color="#94A3B8" strokeWidth={2.5} />
                )}
              </View>
            </TouchableOpacity>

            {showReports && (
              <View className="border-t border-slate-50 bg-slate-50/30">
                {/* Download All */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleExport(exportAllDataToPdf, "all")}
                  disabled={!!exportingItem}
                  className="flex-row items-center px-5 py-4 border-b border-slate-100 bg-blue-600/5"
                >
                  <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-4">
                    <Download size={18} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <Text className="flex-1 text-blue-900 font-semibold text-[15px]">
                    {t("profile_settings.download_all") ||
                      "Download All Reports"}
                  </Text>
                  {exportingItem === "all" ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <ChevronRight size={16} color="#93C5FD" strokeWidth={3} />
                  )}
                </TouchableOpacity>

                {/* Individual tables */}
                {reportItems.map((item, idx) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => handleExport(item.fn, item.key)}
                    disabled={!!exportingItem}
                    className={`flex-row items-center px-6 py-3.5 ${idx !== reportItems.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <View className="w-8 h-8 rounded-lg bg-white border border-slate-200 items-center justify-center mr-4">
                      <FileText size={14} color="#64748B" strokeWidth={2.5} />
                    </View>
                    <Text className="flex-1 text-slate-700 font-semibold text-[14px]">
                      {item.label}
                    </Text>
                    {exportingItem === item.key ? (
                      <ActivityIndicator size="small" color="#64748B" />
                    ) : (
                      <Download size={16} color="#CBD5E1" strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* 5. Safe Logout Action */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          className="px-5 mt-10"
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            className="bg-rose-50 rounded-2xl py-4 flex-row items-center justify-center border border-rose-100"
          >
            <LogOut size={18} color="#E11D48" strokeWidth={2.5} />
            <Text className="text-rose-600 font-bold ml-2.5 text-[16px] tracking-wide">
              {t("profile_settings.logout") || "Log Out"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center justify-center mt-4">
            <AlertCircle size={14} color="#94A3B8" className="mr-1.5" />
            <Text className="text-center text-slate-500 font-medium text-xs">
              {t("profile_settings.logout_msg") ||
                "Unsynced data is safe locally."}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Database Viewer Modal */}
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
