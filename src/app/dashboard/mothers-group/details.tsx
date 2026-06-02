import CustomHeader from "@/components/CustomHeader";
import { useLanguage } from "@/context/LanguageContext";
import { getDb } from "@/hooks/database/db";
import { MothersGroupMeetingStoreType } from "@/hooks/database/types/mothersGroupMeetingModal";
import { useLocalSearchParams } from "expo-router";
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

export default function MeetingDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { language, t } = useLanguage();
    const [meeting, setMeeting] = useState<MothersGroupMeetingStoreType | null>(null);
    const [topics, setTopics] = useState<string[]>([]);
    const [decisions, setDecisions] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            fetchMeetingDetails();
        }
    }, [id]);

    const fetchMeetingDetails = async () => {
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
    };

    const getTopicIcon = (topic: string) => {
        const lower = topic.toLowerCase();
        if (lower.includes('anc')) return <User size={24} color="#059669" />;
        if (lower.includes('pnc')) return <Heart size={24} color="#059669" />;
        if (lower.includes('family')) return <Users size={24} color="#059669" />;
        if (lower.includes('vaccin') || lower.includes('immun')) return <Activity size={24} color="#059669" />;
        return <FileText size={24} color="#059669" />;
    };

    if (!meeting) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <Text className="text-gray-500">{t("mothers_group_meeting.loading")}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#F8FAFC] pb-16 pt-7">
            <StatusBar barStyle="dark-content" />
            <CustomHeader title={t("mothers_group_meeting.title")} />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}>
                {/* Main Header Card */}
                <View className="bg-white rounded-lg p-6 mb-6 border border-gray-100">
                    <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-1">
                            <View className="flex-row">
                                <View className="bg-gray-50 p-2 rounded-lg">
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
                            <View key={i} className="bg-white p-5 rounded-lg mb-3 flex-row items-center border border-gray-50">
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
        </SafeAreaView >
    );
}
