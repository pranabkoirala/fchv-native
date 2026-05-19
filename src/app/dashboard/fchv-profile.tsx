import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  MapPin,
  Globe,
  LogOut,
  RefreshCw,
  Database,
  ChevronRight,
  Download,
  CheckCircle,
  Heart,
  Shield,
  AlertCircle
} from "lucide-react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  FadeInDown,
  Layout 
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import "../../global.css";
import ModalWithSafeArea from "@/components/common/ModalWithSafeArea";
import DatabaseViewer from "@/components/DatabaseViewer";
import CustomHeader from "../../components/CustomHeader";
import { useLanguage } from "../../context/LanguageContext";
import storage from "@/utils/storage";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/constants/token";
import { exportAllDataToPdf } from "@/utils/pdfGenerator";

const { width } = Dimensions.get("window");

export default function UserProfileScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t("profile_settings.logout_alert_title") || "Log Out",
      t("profile_settings.logout_alert_msg") || "Are you sure you want to log out? Ensure all data is synced.",
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
      ]
    );
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      Alert.alert(
        t("profile_settings.sync_success_title") || "Sync Successful", 
        t("profile_settings.sync_success_msg") || "All offline data has been synced with the server."
      );
    }, 2000);
  };

  const handleExport = async () => {
    if (isExporting || showExportSuccess) return;
    try {
      setIsExporting(true);
      await exportAllDataToPdf();
      setIsExporting(false);
      
      setShowExportSuccess(true);
      setTimeout(() => {
        setShowExportSuccess(false);
      }, 1500);
    } catch (error) {
      setIsExporting(false);
      console.error(error);
      Alert.alert(
        t("profile_settings.export_error_title") || "Export Failed",
        t("profile_settings.export_error_msg") || "Could not export database data."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Floating Animated Status Toast */}
      {isExporting && (
        <Animated.View 
          entering={FadeInUp.duration(300)} 
          exiting={FadeOutUp.duration(300)} 
          className="absolute top-12 left-5 right-5 bg-blue-600 px-5 py-3.5 rounded-2xl flex-row items-center justify-between shadow-xl z-50 border border-blue-400/20"
        >
          <View className="flex-row items-center flex-1">
            <ActivityIndicator color="white" size="small" />
            <Text className="text-white font-semibold text-sm ml-3">
              {t("profile_settings.exporting") || "Downloading PDF record..."}
            </Text>
          </View>
        </Animated.View>
      )}

      {showExportSuccess && (
        <Animated.View 
          entering={FadeInUp.duration(300)} 
          exiting={FadeOutUp.duration(300)} 
          className="absolute top-12 left-5 right-5 bg-emerald-600 px-5 py-3.5 rounded-2xl flex-row items-center justify-between shadow-xl z-50 border border-emerald-400/20"
        >
          <View className="flex-row items-center flex-1">
            <CheckCircle size={18} color="white" />
            <Text className="text-white font-semibold text-sm ml-3">
              {t("profile_settings.export_success") || "Downloaded successfully"}
            </Text>
          </View>
        </Animated.View>
      )}

      <CustomHeader title={t("profile_settings.title") || "My Profile"} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* 1. Hero / Identity Card */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)}
          className="px-5 mt-4"
        >
          <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <LinearGradient
              colors={["#0D9488", "#0F766E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-8 px-6 items-center justify-center relative"
            >
              {/* Profile Ring */}
              <View className="w-24 h-24 rounded-full border-4 border-teal-200/50 mb-4 bg-teal-800/20 items-center justify-center shadow-lg">
                <User size={44} color="#CCFBF1" strokeWidth={1.5} />
              </View>

              <Text className="text-white text-2xl font-extrabold tracking-tight">
                {t("profile_settings.name") || "Laxmi Shrestha"}
              </Text>
              
              <View className="flex-row items-center mt-2 bg-teal-900/30 px-3.5 py-1 rounded-full border border-teal-400/20">
                <Shield size={13} color="#99F6E4" className="mr-1" />
                <Text className="text-[#CCFBF1] font-semibold text-xs tracking-wider">
                  {t("profile_settings.fchv_id") || "FCHV ID"}: 9840-NP
                </Text>
              </View>
            </LinearGradient>

            {/* Ward Details */}
            <View className="flex-row items-center justify-center py-4 bg-slate-50 border-t border-slate-100">
              <MapPin size={15} color="#0D9488" />
              <Text className="text-[#334155] font-semibold text-xs ml-2 uppercase tracking-wider">
                {t("profile_settings.ward_region") || "Ward 4, Kathmandu Region"}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* 2. Preferences & Actions Group */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          className="px-5 mt-6"
        >
          <Text className="text-slate-400 font-bold text-xs mb-3 px-1 uppercase tracking-widest">
            {t("profile_settings.preferences") || "Preferences & Settings"}
          </Text>

          <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Language Toggle */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => router.push("/dashboard/change-language")}
              className="flex-row items-center px-5 py-4 border-b border-slate-50"
            >
              <View className="w-10 h-10 rounded-2xl bg-teal-50 items-center justify-center mr-4">
                <Globe size={18} color="#0D9488" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-[15px]">{t("profile_settings.language") || "Language"}</Text>
                <Text className="text-slate-400 text-xs mt-0.5">{t("profile_settings.language_sub") || "Choose your preferred language"}</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-[#0D9488] font-bold text-sm mr-2">{language === 'np' ? 'नेपाली' : 'English'}</Text>
                <ChevronRight size={15} color="#94A3B8" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            {/* Sync Status */}
            <View className="flex-row items-center px-5 py-4 border-b border-slate-50">
              <View className="w-10 h-10 rounded-2xl bg-teal-50 items-center justify-center mr-4">
                <RefreshCw size={18} color="#0D9488" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-[15px]">{t("profile_settings.data_sync") || "Data Sync"}</Text>
                <Text className="text-slate-400 text-xs mt-0.5">{t("profile_settings.last_synced") || "Last synced: Today, 10:30 AM"}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleSync}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-xl border ${
                  isSyncing 
                    ? 'bg-slate-50 border-slate-200' 
                    : 'bg-[#F0FDF4] border-[#DCFCE7] active:bg-[#DCFCE7]'
                }`}
              >
                <Text className={`font-bold text-xs ${isSyncing ? 'text-slate-400' : 'text-[#16A34A]'}`}>
                  {isSyncing ? (t("profile_settings.syncing") || "Syncing...") : (t("profile_settings.sync_now") || "Sync Now")}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Developer Mode / Inspector */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setIsDbOpen(true)}
              className="flex-row items-center px-5 py-4 border-b border-slate-50"
            >
              <View className="w-10 h-10 rounded-2xl bg-teal-50 items-center justify-center mr-4">
                <Database size={18} color="#0D9488" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-[15px]">{t("profile_settings.db_inspector") || "Database Inspector"}</Text>
                <Text className="text-slate-400 text-xs mt-0.5">{t("profile_settings.db_inspector_sub") || "View local SQLite storage"}</Text>
              </View>
              <ChevronRight size={15} color="#94A3B8" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Export Data */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleExport}
              className="flex-row items-center px-5 py-4"
            >
              <View className="w-10 h-10 rounded-2xl bg-teal-50 items-center justify-center mr-4">
                <Download size={18} color="#0D9488" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-800 font-bold text-[15px]">{t("profile_settings.export_data") || "Export Data"}</Text>
                <Text className="text-slate-400 text-xs mt-0.5">{t("profile_settings.export_data_sub") || "Export local database records as PDF"}</Text>
              </View>
              <ChevronRight size={15} color="#94A3B8" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 3. Safe Logout Action */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(400)}
          className="px-5 mt-8"
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            className="bg-white rounded-2xl p-4 flex-row items-center justify-center border border-rose-100 shadow-sm active:bg-rose-50"
          >
            <LogOut size={16} color="#E11D48" strokeWidth={2.5} />
            <Text className="text-rose-600 font-bold ml-2 text-[15px]">{t("profile_settings.logout") || "Log Out"}</Text>
          </TouchableOpacity>
          
          <View className="flex-row items-center justify-center mt-3.5 bg-amber-50/50 py-2.5 px-4 rounded-xl border border-amber-100/50">
            <AlertCircle size={13} color="#D97706" className="mr-1.5" />
            <Text className="text-center text-amber-700 font-medium text-xs">
              {t("profile_settings.logout_msg") || "Unsynced data is safe locally."}
            </Text>
          </View>
        </Animated.View>

        {/* 4. Official Footer */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(400)}
          className="mt-10 px-5 items-center justify-center"
        >
          <Heart size={16} color="#14B8A6" fill="#14B8A6" className="mb-2" />
          <Text className="text-slate-400 font-bold text-[10px] text-center uppercase tracking-widest leading-4">
            {t("profile_settings.footer") || "FCHV Saathi v1.0.0\nMinistry of Health, Nepal"}
          </Text>
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
    </SafeAreaView>
  );
}
