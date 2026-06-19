import CustomHeader from "@/components/CustomHeader";
import { Skeleton } from "@/components/common/Skeleton";
import { useLanguage } from "@/context/LanguageContext";
import { getDb } from "@/hooks/database/db";
import { MothersGroupMeetingStoreType } from "@/hooks/database/types/mothersGroupMeetingModal";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Activity,
    Calendar,
    CheckCircle,
    CheckCircle2,
    FileText,
    Heart,
    ListChecks,
    MapPin,
    User,
    Users
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const MeetingDetailsSkeleton = () => (
    <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}>
        {/* Header Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100 ">
            <View className="flex-row justify-between items-start mb-6">
                <View className="flex-1 flex-row items-center">
                    <View className="p-2 bg-slate-50 rounded-lg mr-3">
                        <Skeleton width={24} height={24} borderRadius={6} />
                    </View>
                    <View className="flex-1 gap-2">
                        <Skeleton width="60%" height={28} borderRadius={8} />
                        <Skeleton width="40%" height={16} borderRadius={4} />
                    </View>
                </View>
                <View className="bg-slate-50 p-4 rounded-xl">
                    <Skeleton width={32} height={32} borderRadius={8} />
                </View>
            </View>

            <View className="h-[1px] bg-slate-50 w-full mb-6" />

            <View className="flex-row flex-wrap justify-between">
                {[1, 2, 3].map((i) => (
                    <View key={i} className="flex-row items-center mb-6" style={{ width: i === 2 ? '45%' : 'auto' }}>
                        <View className="bg-slate-50 p-2 rounded-lg mr-3">
                            <Skeleton width={20} height={20} borderRadius={6} />
                        </View>
                        <View className="gap-1.5">
                            <Skeleton width={60} height={12} borderRadius={4} />
                            <Skeleton width={90} height={18} borderRadius={4} />
                        </View>
                    </View>
                ))}
            </View>
        </View>

        {/* Topics Section */}
        <View className="mb-6">
            <View className="flex-row items-center mb-4 ml-1 gap-2">
                <Skeleton width={20} height={20} borderRadius={6} />
                <Skeleton width={150} height={22} borderRadius={6} />
            </View>
            {[1, 2].map((i) => (
                <View key={i} className="bg-white px-5 py-4 rounded-2xl mb-3 flex-row items-center border border-gray-100">
                    <View className="bg-slate-50 p-3 rounded-xl mr-4">
                        <Skeleton width={24} height={24} borderRadius={8} />
                    </View>
                    <Skeleton width="60%" height={20} borderRadius={8} />
                </View>
            ))}
        </View>

        {/* Decisions Section */}
        <View className="mb-2">
            <View className="flex-row items-center mb-4 ml-1 gap-2">
                <Skeleton width={20} height={20} borderRadius={6} />
                <Skeleton width={120} height={22} borderRadius={6} />
            </View>
            {[1, 2].map((i) => (
                <View key={i} className="bg-emerald-50/30 p-5 rounded-2xl mb-3 flex-row items-center border border-emerald-100/50">
                    <View className="mr-4">
                        <Skeleton width={22} height={22} borderRadius={11} />
                    </View>
                    <Skeleton width="75%" height={18} borderRadius={6} />
                </View>
            ))}
        </View>
    </ScrollView>
);

export default function MeetingDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { language, t } = useLanguage();
    const router = useRouter();
    const [meeting, setMeeting] = useState<MothersGroupMeetingStoreType | null>(null);
    const [topics, setTopics] = useState<string[]>([]);
    const [decisions, setDecisions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchMeetingDetails();
        }
    }, [id]);

    const fetchMeetingDetails = async () => {
        try {
            const db = await getDb();
            const row = await db.getFirstAsync<MothersGroupMeetingStoreType>(
                "SELECT * FROM mothers_group_meetings WHERE id = ?",
                [id]
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
        if (lower.includes('anc')) return <User size={24} color="#059669" />;
        if (lower.includes('pnc')) return <Heart size={24} color="#059669" />;
        if (lower.includes('family')) return <Users size={24} color="#059669" />;
        if (lower.includes('vaccin') || lower.includes('immun')) return <Activity size={24} color="#059669" />;
        return <FileText size={24} color="#059669" />;
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" className="bg-white" />
            <CustomHeader
                title={t("mothers_group_meeting.title")}
                onBackPress={() => router.back()}
            />

            {loading ? (
                <MeetingDetailsSkeleton />
            ) : !meeting ? (
                <View className="flex-1 items-center justify-center p-10">
                    <View className="bg-slate-50 p-6 rounded-full mb-4">
                        <FileText size={40} color="#94A3B8" />
                    </View>
                    <Text className="text-slate-500 font-bold text-lg text-center">
                        {t("mothers_group_meeting.not_found", "Meeting Not Found")}
                    </Text>
                </View>
            ) : (
                <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}>
                    {/* Main Header Card */}
                    <View className="bg-white rounded-lg p-6 mb-6 border border-gray-100">
                        <View className="flex-row justify-between items-start mb-1">
                            <View className="flex-1">
                                <View className="flex-row">
                                    <View className="p-2 rounded-lg">
                                        <MapPin size={22} color="#1d1e20ff" />
                                    </View>
                                    <View>
                                        <Text className="text-3xl font-bold text-gray-900 mb-1">{meeting?.meeting_location}</Text>
                                        <Text className="text-gray-500 font-medium mb-6">{t("mothers_group_meeting.title")}</Text>
                                    </View>
                                </View>
                            </View>
                            <View className="bg-emerald-50 p-4 rounded-lg">
                                <Users size={32} color="#10b981" />
                            </View>
                        </View>

                        <View className="h-[1px] bg-gray-100 w-full mb-6" />

                        <View className="flex-row flex-wrap justify-between">
                            {/* Date */}
                            <View className="flex-row items-center mb-6">
                                <View className="bg-gray-50 p-2 rounded-lg mr-2">
                                    <Calendar size={20} color="#64748b" />
                                </View>
                                <View>
                                    <Text className="text-gray-600 text-[13px] font-medium mb-1">{t("mothers_group_meeting.meeting_date")}</Text>
                                    <Text className="text-gray-800 font-bold text-[15px]">
                                        {meeting.meeting_date ? AdToBs(meeting.meeting_date) : ""}
                                    </Text>
                                </View>
                            </View>

                            {/* Participants */}
                            <View className="w-[50%] flex-row items-center mb-6">
                                <View className="bg-gray-50 p-2 rounded-lg mr-2">
                                    <Users size={20} color="#64748b" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-600 text-[13px] font-medium mb-1">{t("mothers_group_meeting.attendees_count")}</Text>
                                    <Text className="text-gray-800 font-bold text-[15px]" numberOfLines={1}>
                                        {meeting.attendees_count} {t("mothers_group_meeting.attendees")}
                                    </Text>
                                </View>
                            </View>

                            {/* Ward */}
                            <View className="flex-row items-center">
                                <View className="bg-gray-50 p-2 rounded-lg mr-2">
                                    <MapPin size={20} color="#64748b" />
                                </View>
                                <View>
                                    <Text className="text-gray-600 text-[13px] font-medium mb-1">{t("mothers_group_meeting.ward_no")}</Text>
                                    <Text className="text-gray-800 font-bold text-[15px]">{meeting?.ward_no || "N/A"}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Topics Section */}
                    <View className="mb-6">
                        <View className="flex-row items-center mb-4 ml-1">
                            <ListChecks size={20} color="#334155" />
                            <Text className="text-lg font-bold text-gray-800 ml-2">{t("mothers_group_meeting.discussed_topics")}</Text>
                        </View>

                        {topics.length > 0 ? (
                            topics.map((topic, i) => (
                                <View key={i} className="bg-white px-5 py-3 rounded-lg mb-3 flex-row items-center border border-gray-100">
                                    <View className="bg-emerald-50/50 p-3 rounded-xl mr-4">
                                        {getTopicIcon(topic)}
                                    </View>
                                    <Text className="text-gray-800 font-bold text-lg flex-1">{topic}</Text>
                                </View>
                            ))
                        ) : (
                            <View className="bg-white p-6 rounded-lg border border-gray-100 items-center">
                                <Text className="text-gray-400 italic">{t("mothers_group_meeting.no_topics_recorded")}</Text>
                            </View>
                        )}
                    </View>

                    {/* Decisions Section */}
                    <View className="mb-2">
                        <View className="flex-row items-center mb-4 ml-1">
                            <CheckCircle2 size={20} color="#334155" />
                            <Text className="text-lg font-bold text-gray-800 ml-2">{t("mothers_group_meeting.decisions")}</Text>
                        </View>

                        {decisions.length > 0 ? (
                            decisions.map((decision, i) => (
                                <View key={i} className="bg-[#EFFDF5] p-5 rounded-lg mb-3 flex-row items-center border border-[#DCFCE7]">
                                    <View className="mr-4">
                                        <CheckCircle size={22} color="#059669" strokeWidth={3} />
                                    </View>
                                    <Text className="text-emerald-900 font-semibold text-[17px] leading-relaxed flex-1">{decision}</Text>
                                </View>
                            ))
                        ) : (
                            <View className="bg-white p-6 rounded-lg border border-gray-100 items-center">
                                <Text className="text-gray-400 italic">{t("mothers_group_meeting.no_decisions_recorded")}</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView >
    );
}
