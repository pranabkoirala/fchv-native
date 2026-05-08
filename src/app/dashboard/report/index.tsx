import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FileText,
  ChevronRight,
  Baby,
  Activity,
  Heart,
  AlertTriangle
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";
import "../../../global.css";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const reportItems = [
    {
      id: "service",
      title: t("reports.service_recipients.title"),
      subtitle: t("reports.service_recipients.subtitle"),
      path: "/dashboard/report/service-report",
      icon: <FileText size={22} color={Colors.primary} />,
      bgColor: "bg-blue-50"
    },
    {
      id: "child-monitoring",
      title: t("reports.child_monitoring.title"),
      subtitle: t("reports.child_monitoring.subtitle"),
      path: "/dashboard/report/child-monitoring-report",
      icon: <Baby size={22} color="#6366F1" />,
      bgColor: "bg-indigo-50"
    },
    {
      id: "maternal-death",
      title: t("reports.maternal_death.title"),
      subtitle: t("reports.maternal_death.subtitle"),
      path: "/dashboard/report/maternal-death-report",
      icon: <Heart size={22} color="#F43F5E" />,
      bgColor: "bg-rose-50"
    },
    {
      id: "newborn-death",
      title: t("reports.newborn_death.title"),
      subtitle: t("reports.newborn_death.subtitle"),
      path: "/dashboard/report/newborn-death-report",
      icon: <Activity size={22} color="#0D9488" />,
      bgColor: "bg-teal-50"
    },
    {
      id: "child-death",
      title: t("reports.child_death.title"),
      subtitle: t("reports.child_death.subtitle"),
      path: "/dashboard/report/child-death-report",
      icon: <AlertTriangle size={22} color="#EA580C" />,
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />
      <CustomHeader title={t("reports.title")} onBackPress={() => router.replace("/dashboard")} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-3">
          {reportItems.map((item, index) => (
            <AnimatedTouchableOpacity
              key={item.id}
              entering={FadeIn.delay(index * 100)}
              activeOpacity={0.7}
              onPress={() => router.push(item.path as any)}
              className="bg-white rounded-md p-5 flex-row items-center justify-between border border-slate-100 mb-4"
            >
              <View className="flex-row items-center flex-1 pr-4">
                <View className={`w-12 h-12 rounded-2xl ${item.bgColor} items-center justify-center mr-4`}>
                  {item.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 font-semibold text-[15px] leading-tight">
                    {item.title}
                  </Text>
                  <Text className="text-slate-400 font-medium text-[11px] mt-1 uppercase tracking-tight">
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <View className="bg-slate-50 p-2 rounded-full">
                <ChevronRight size={18} color="#94A3B8" strokeWidth={2.5} />
              </View>
            </AnimatedTouchableOpacity>
          ))}
        </View>

        <Animated.View 
          entering={FadeIn.delay(reportItems.length * 100)}
          className="mx-5 mt-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50"
        >
          <Text className="text-blue-900 font-semibold text-[14px] mb-2">{t("reports.instructions_title")}</Text>
          <Text className="text-blue-800/70 text-[12px] leading-relaxed">
            {t("reports.instructions_content")}
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

