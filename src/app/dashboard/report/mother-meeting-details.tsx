import CustomHeader from "@/components/CustomHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { getDb } from "@/hooks/database/db";
import { MothersGroupMeetingStoreType } from "@/hooks/database/types/mothersGroupMeetingModal";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  Activity,
  Calendar,
  CheckCircle,
  CheckCircle2,
  FileText,
  Heart,
  Info,
  ListChecks,
  MapPin,
  Pencil,
  User,
  Users,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const MeetingDetailsSkeleton = () => (
  <ScrollView
    className="flex-1 px-4"
    contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
  >
    <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-1 flex-row items-center">
          <Skeleton width={48} height={48} borderRadius={16} />
          <View className="flex-1 ml-3 gap-2">
            <Skeleton width="65%" height={24} borderRadius={6} />
            <Skeleton width="45%" height={14} borderRadius={4} />
          </View>
        </View>
        <Skeleton width={56} height={56} borderRadius={16} />
      </View>
      <View className="h-[1px] bg-gray-100 w-full mb-6" />
      <View className="flex-row flex-wrap gap-y-6">
        {[1, 2, 3].map((i) => (
          <View key={i} className="flex-row items-center mr-8">
            <Skeleton width={40} height={40} borderRadius={12} />
            <View className="ml-3 gap-1.5">
              <Skeleton width={60} height={11} borderRadius={4} />
              <Skeleton width={95} height={16} borderRadius={4} />
            </View>
          </View>
        ))}
      </View>
    </View>
    <View className="mb-6">
      <View className="flex-row items-center mb-4 ml-1 gap-2">
        <Skeleton width={20} height={20} borderRadius={6} />
        <Skeleton width={150} height={20} borderRadius={6} />
      </View>
      {[1, 2].map((i) => (
        <View
          key={i}
          className="bg-white px-5 py-4 rounded-2xl mb-3 flex-row items-center border border-gray-100"
        >
          <Skeleton width={48} height={48} borderRadius={14} />
          <View className="ml-4 flex-1">
            <Skeleton width="60%" height={18} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
    <View className="mb-2">
      <View className="flex-row items-center mb-4 ml-1 gap-2">
        <Skeleton width={20} height={20} borderRadius={6} />
        <Skeleton width={120} height={20} borderRadius={6} />
      </View>
      {[1, 2].map((i) => (
        <View
          key={i}
          className="bg-emerald-50/30 p-5 rounded-2xl mb-3 flex-row items-center border border-emerald-100/50"
        >
          <Skeleton width={24} height={24} borderRadius={12} />
          <View className="ml-4 flex-1">
            <Skeleton width="75%" height={16} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  </ScrollView>
);

const InfoRow = ({ label, value, icon: Icon, color = "#64748B" }: any) => (
  <View className="flex-row items-center">
    <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-3">
      <Icon size={18} color={color} />
    </View>
    <View>
      <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
        {label}
      </Text>
      <Text className="text-[15px] font-bold text-slate-800">{value}</Text>
    </View>
  </View>
);

export default function MeetingDetails() {
  const { id, from, fromTab } = useLocalSearchParams<{ id: string; from?: string; fromTab?: string }>();
  const { language, t } = useLanguage();
  const router = useRouter();
  const [meeting, setMeeting] = useState<MothersGroupMeetingStoreType | null>(
    null,
  );
  const [topics, setTopics] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onBackPress = () => {
      if (from) {
        router.replace({
          pathname: from,
          params: fromTab ? { tab: fromTab } : undefined,
        } as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/dashboard/report");
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => backHandler.remove();
  }, [from, fromTab, router]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchMeetingDetails();
      }
    }, [id]),
  );

  const fetchMeetingDetails = async () => {
    try {
      const db = await getDb();
      const row = await db.getFirstAsync<MothersGroupMeetingStoreType>(
        "SELECT * FROM mothers_group_meetings WHERE id = ?",
        [id],
      );
      if (row) {
        setMeeting(row);
        setTopics(row.discussed_topics ? JSON.parse(row.discussed_topics) : []);
        setDecisions(row.decisions ? JSON.parse(row.decisions) : []);
      }
    } catch (e) {
      console.error("Failed to fetch meeting details:", e);
    } finally {
      setLoading(false);
    }
  };

  const getTopicIcon = (topic: string) => {
    const lower = topic.toLowerCase();
    if (lower.includes("anc")) return <User size={22} color="#0EA5E9" />;
    if (lower.includes("pnc")) return <Heart size={22} color="#EC4899" />;
    if (lower.includes("family")) return <Users size={22} color="#8B5CF6" />;
    if (lower.includes("vaccin") || lower.includes("immun"))
      return <Activity size={22} color="#10B981" />;
    return <FileText size={22} color="#64748B" />;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader
        title={t("mothers_group_meeting.title")}
        onBackPress={() => {
          if (from) {
            router.replace({
              pathname: from,
              params: fromTab ? { tab: fromTab } : undefined,
            } as any);
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/dashboard/report");
          }
        }}
        rightNode={
          meeting ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname:
                    "/dashboard/report/mothers-group-meeting-form",
                  params: {
                    id: meeting.id,
                    meeting_date: meeting.meeting_date,
                    meeting_location: meeting.meeting_location,
                    ward_no: meeting.ward_no || "",
                    attendees_count: String(meeting.attendees_count),
                    discussed_topics: JSON.stringify(topics),
                    decisions: JSON.stringify(decisions),
                    from: "details",
                  },
                } as any)
              }
              className="w-9 h-9 bg-cyan-50 rounded-xl items-center justify-center"
            >
              <Pencil size={18} color="#0891B2" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <MeetingDetailsSkeleton />
      ) : !meeting ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-5">
            <FileText size={36} color="#94A3B8" />
          </View>
          <Text className="text-slate-400 font-semibold text-lg text-center">
            {t("mothers_group_meeting.not_found", "Meeting Not Found")}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 16,
            backgroundColor: "#F8FAFC",
          }}
        >
          {/* Profile Header Card */}
          <View className="mx-4 bg-white p-5 rounded-3xl border border-slate-100 mb-5 flex-row items-center">
            <View className="w-14 h-14 bg-cyan-50 rounded-2xl items-center justify-center mr-4">
              <MapPin size={26} color="#0891B2" />
            </View>
            <View className="flex-1">
              <Text
                className="text-xl font-bold text-slate-900"
                numberOfLines={2}
              >
                {meeting.meeting_location}
              </Text>
              <Text className="text-slate-400 font-medium text-[13px] mt-0.5">
                {t("mothers_group_meeting.title")}
              </Text>
            </View>
            <View className="w-12 h-12 bg-emerald-50 rounded-xl items-center justify-center">
              <Users size={24} color="#10B981" />
            </View>
          </View>

          {/* Meeting Details Card */}
          <View className="mx-4 bg-white rounded-3xl border border-slate-100 mb-5 overflow-hidden">
            <View className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex-row items-center">
              <Info size={15} color="#64748B" />
              <Text className="text-slate-700 font-bold text-xs uppercase tracking-wider ml-2">
                {t(
                  "mothers_group_meeting.meeting_information",
                  "Meeting Information",
                )}
              </Text>
            </View>
            <View className="p-5 gap-6">
              <InfoRow
                label={t("mothers_group_meeting.meeting_date")}
                value={
                  meeting.meeting_date ? AdToBs(meeting.meeting_date) : "-"
                }
                icon={Calendar}
                color="#0891B2"
              />
              <InfoRow
                label={t("mothers_group_meeting.attendees_count")}
                value={`${meeting.attendees_count} ${t("mothers_group_meeting.attendees")}`}
                icon={Users}
                color="#10B981"
              />
              <InfoRow
                label={t("mothers_group_meeting.ward_no")}
                value={`Ward No. ${meeting.ward_no || "N/A"}`}
                icon={MapPin}
                color="#8B5CF6"
              />
            </View>
          </View>

          {/* Discussed Topics Section */}
          <View className="mx-4 mb-5">
            <View className="flex-row items-center mb-4 ml-1">
              <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-2.5">
                <ListChecks size={16} color="#3B82F6" />
              </View>
              <Text className="text-slate-800 font-bold text-base">
                {t("mothers_group_meeting.discussed_topics")}
              </Text>
              <View className="ml-2 bg-blue-50 px-2 py-0.5 rounded-full">
                <Text className="text-blue-600 text-[11px] font-bold">
                  {topics.length}
                </Text>
              </View>
            </View>

            {topics.length > 0 ? (
              topics.map((topic, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  className="bg-white px-4 py-3.5 rounded-2xl mb-2.5 flex-row items-center border border-slate-100"
                >
                  <View className="w-11 h-11 bg-slate-50 rounded-xl items-center justify-center mr-3.5">
                    {getTopicIcon(topic)}
                  </View>
                  <Text className="text-slate-800 font-semibold text-[15px] flex-1">
                    {topic}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-white py-8 rounded-2xl border border-slate-100 items-center">
                <FileText size={22} color="#CBD5E1" />
                <Text className="text-slate-400 text-[14px] mt-2 italic">
                  {t("mothers_group_meeting.no_topics_recorded")}
                </Text>
              </View>
            )}
          </View>

          {/* Decisions Section */}
          <View className="mx-4 mb-2">
            <View className="flex-row items-center mb-4 ml-1">
              <View className="w-8 h-8 bg-emerald-50 rounded-lg items-center justify-center mr-2.5">
                <CheckCircle2 size={16} color="#10B981" />
              </View>
              <Text className="text-slate-800 font-bold text-base">
                {t("mothers_group_meeting.decisions")}
              </Text>
              <View className="ml-2 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Text className="text-emerald-600 text-[11px] font-bold">
                  {decisions.length}
                </Text>
              </View>
            </View>

            {decisions.length > 0 ? (
              decisions.map((decision, i) => (
                <View
                  key={i}
                  className="bg-[#F0FDF9] px-4 py-4 rounded-2xl mb-2.5 flex-row items-start border border-[#CCF5E3]"
                >
                  <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center mr-3.5 mt-0.5">
                    <CheckCircle size={14} color="#059669" strokeWidth={3} />
                  </View>
                  <Text className="text-emerald-800 font-semibold text-[15px] leading-relaxed flex-1">
                    {decision}
                  </Text>
                </View>
              ))
            ) : (
              <View className="bg-white py-8 rounded-2xl border border-slate-100 items-center">
                <CheckCircle2 size={22} color="#CBD5E1" />
                <Text className="text-slate-400 text-[14px] mt-2 italic">
                  {t("mothers_group_meeting.no_decisions_recorded")}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
