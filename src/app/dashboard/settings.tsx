import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Switch,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  User,
  Shield,
  MapPin,
  Phone,
  Mail,
  Bell,
  Globe,
  LogOut,
  ChevronRight,
  Camera,
  Star,
  TrendingUp,
  Users,
  Award,
  Lock,
  HelpCircle,
  MessageSquare,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import "../../global.css";
import ModalWithSafeArea from "@/components/common/ModalWithSafeArea";
import DatabaseViewer from "@/components/DatabaseViewer";
import CustomHeader from "../../components/CustomHeader";
import { useLanguage } from "../../context/LanguageContext";

interface SettingItem {
  icon: any;
  label: string;
  color: string;
  bg: string;
  toggle?: boolean;
  value?: string;
  onPress?: (router: any) => void;
}

interface SettingSection {
  section: string;
  items: SettingItem[];
}

const STATS = [
  { label: "Mothers\nRegistered", value: "42", icon: Users, color: "#3B82F6", bg: "#EFF6FF" },
  { label: "Visits\nCompleted", value: "128", icon: TrendingUp, color: "#22C55E", bg: "#F0FFF4" },
  { label: "Years\nActive", value: "3", icon: Star, color: "#F97316", bg: "#FFF7ED" },
];

const SETTINGS: SettingSection[] = [
  {
    section: "Account",
    items: [
      { icon: User, label: "Edit Profile", color: "#3B82F6", bg: "#EFF6FF" },
      { icon: Lock, label: "Change Password", color: "#8B5CF6", bg: "#F5F3FF" },
      { icon: Phone, label: "Update Phone", color: "#22C55E", bg: "#F0FFF4" },
    ],
  },
  {
    section: "Preferences",
    items: [
      { 
        icon: Bell, 
        label: "Notifications", 
        color: "#F97316", 
        bg: "#FFF7ED", 
        toggle: true 
      },
      { 
        icon: Globe, 
        label: "Language", 
        color: "#06B6D4", 
        bg: "#ECFEFF", 
        value: "नेपाली",
        onPress: (router: any) => router.push("/dashboard/change-language")
      },
    ],
  },
  {
    section: "Support",
    items: [
      { icon: HelpCircle, label: "Help & FAQ", color: "#64748B", bg: "#F8FAFC" },
      { icon: MessageSquare, label: "Send Feedback", color: "#22C55E", bg: "#F0FFF4" },
    ],
  },
];

export default function UserProfileScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [isDbOpen, setIsDbOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const registryItems = [
    { label: "मातृ मृत्यु विवरण", sub: "Maternal Death Details", color: "#EF4444", bg: "#FEF2F2", onPress: (router: any) => router.push("/dashboard/maternal-death-report") },
    { label: "नवजात शिशु मृत्यु विवरण", sub: "Newborn Death Details", color: "#8B5CF6", bg: "#F5F3FF", onPress: (router: any) => router.push("/dashboard/newborn-death-report") },
    { label: "२८ दिन देखि ५९ महिना सम्मका बच्चाहरूको मृत्यु विवरण", sub: "Child Death (28d-59m)", color: "#F59E0B", bg: "#FFFBEB", onPress: (router: any) => router.push("/dashboard/child-death-report") },
  ];


  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      <CustomHeader title="My Profile" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >

        <View className="px-5 mt-6">
          <View className="items-center">
            <View className="relative">
              <View className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <Image
                  source={{ uri: "https://i.pravatar.cc/200?u=anita_sharma" }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <TouchableOpacity className="absolute bottom-0 right-0 bg-white w-7 h-7 rounded-full items-center justify-center shadow-sm border border-gray-100">
                <Camera size={14} color="#64748B" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text className="text-[#1E293B] text-xl font-semibold mt-4">Laxmi Shrestha</Text>
            <Text className="text-gray-500 text-sm font-medium mt-1">
              Female Community Health Volunteer
            </Text>
            
            <TouchableOpacity 
              onPress={() => setIsDbOpen(true)}
              className="mt-2"
            >
              <Text className="text-xs text-gray-400 font-medium py-1 px-3 bg-gray-100 rounded-full">Dev Tools</Text>
            </TouchableOpacity>

            <ModalWithSafeArea
              visible={isDbOpen}
              animationType="slide"
              presentationStyle="fullScreen"
              onRequestClose={() => setIsDbOpen(false)}
            >
              <DatabaseViewer onClose={() => setIsDbOpen(false)} />
            </ModalWithSafeArea>
          </View>

          {/* Minimal Stats Row */}
          <View className="flex-row justify-between mt-8 bg-white p-5 rounded-3xl border border-gray-50 shadow-sm">
            {STATS.map((stat, index) => (
              <View key={index} className="items-center flex-1">
                <Text className="text-[#1E293B] text-lg font-semibold">{stat.value}</Text>
                <Text className="text-gray-400 text-[10px] uppercase font-medium text-center mt-1">
                  {stat.label.replace('\n', ' ')}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Registry & Reporting Section */}
        <View className="px-5 mt-8">
          <Text className="text-gray-500 font-medium text-xs mb-3 px-1">
            Registry & Reporting (दर्ता तथा रिपोर्टिङ)
          </Text>
          <View className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsRegisterOpen(!isRegisterOpen)}
              className={`flex-row items-center px-5 py-5 ${isRegisterOpen ? "bg-slate-50/50" : ""}`}
            >
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4 bg-emerald-50">
                <Users size={18} color="#10B981" strokeWidth={2} />
              </View>
              <Text className="text-[#1E293B] font-medium text-base flex-1">Register (दर्ता)</Text>
              <View style={{ transform: [{ rotate: isRegisterOpen ? '90deg' : '0deg' }] }}>
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
              </View>
            </TouchableOpacity>

            {isRegisterOpen && (
              <View className="bg-white border-t border-gray-50">
                {registryItems.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => item.onPress && item.onPress(router)}
                    className={`flex-row items-center px-6 py-4 ${idx !== registryItems.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <View 
                      className="w-1.5 h-1.5 rounded-full mr-4"
                      style={{ backgroundColor: item.color }}
                    />
                    <View className="flex-1">
                      <Text className="text-[#1E293B] font-medium text-sm">{item.label}</Text>
                      <Text className="text-gray-400 font-medium text-[10px] uppercase tracking-wider mt-0.5">{item.sub}</Text>
                    </View>
                    <ChevronRight size={14} color="#CBD5E1" strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {SETTINGS.map((section, si) => (
          <View key={si} className="px-5 mt-8">
            <Text className="text-gray-500 font-medium text-xs mb-3 px-1">
              {section.section}
            </Text>
            <View className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
              {section.items.map((item, ii) => {
                const Icon = item.icon;
                const isLast = ii === section.items.length - 1;
                return (
                  <TouchableOpacity
                    key={ii}
                    activeOpacity={0.7}
                    onPress={() => item.onPress && item.onPress(router)}
                    className={`flex-row items-center px-5 py-4 ${!isLast ? "border-b border-gray-50" : ""}`}
                  >
                    <View
                      className="w-10 h-10 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: item.bg }}
                    >
                      <Icon size={18} color={item.color} strokeWidth={2} />
                    </View>
                    <Text className="text-[#1E293B] font-medium text-base flex-1">{item.label}</Text>

                    {(item as any).toggle !== undefined ? (
                      <Switch
                        value={notifications}
                        onValueChange={setNotifications}
                        trackColor={{ false: "#F1F5F9", true: "#DCFCE7" }}
                        thumbColor={notifications ? "#10B981" : "#94A3B8"}
                      />
                    ) : item.label === "Language" ? (
                      <View className="flex-row items-center">
                        <Text className="text-gray-400 font-medium text-sm mr-2">{language === 'np' ? 'नेपाली' : 'English'}</Text>
                        <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
                      </View>
                    ) : (item as any).value ? (
                      <View className="flex-row items-center">
                        <Text className="text-gray-400 font-medium text-sm mr-2">{(item as any).value}</Text>
                        <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
                      </View>
                    ) : (
                      <ChevronRight size={16} color="#CBD5E1" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View className="px-5 mt-10">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace("/" as any)}
            className="bg-white rounded-3xl p-5 flex-row items-center border border-gray-50 shadow-sm"
          >
            <View className="bg-rose-50 w-10 h-10 rounded-2xl items-center justify-center mr-4">
              <LogOut size={18} color="#E11D48" strokeWidth={2} />
            </View>
            <Text className="text-rose-600 font-medium text-base flex-1">Log Out</Text>
            <ChevronRight size={16} color="#FDA4AF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text className="text-gray-400 font-medium text-[10px] text-center mt-10 uppercase tracking-widest">
          FCHV Saathi v1.0.0 • Ministry of Health, Nepal
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}
