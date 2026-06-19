import { Skeleton } from "@/components/common/Skeleton";
import CustomHeader from "@/components/CustomHeader";
import { useLanguage } from "@/context/LanguageContext";
import { getAllMothersGroupMeetings } from "@/hooks/database/models/MothersGroupMeetingModel";
import { MothersGroupMeetingStoreType } from "@/hooks/database/types/mothersGroupMeetingModal";
import { formatAdDate } from "@/utils/dateHelper";
import { useFocusEffect, useRouter } from "expo-router";
import { Calendar, Plus, Users } from "lucide-react-native";
import { memo, useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MeetingListType = Omit<MothersGroupMeetingStoreType, "discussed_topics" | "decisions"> & { discussed_topics: string[]; decisions: string[]; };

const MeetingCard = memo(function MeetingCard({
    meeting,
    language,
    t,
    onPress,
}: {
    meeting: MeetingListType;
    language: string;
    t: (key: string) => string;
    onPress: (meeting: MeetingListType) => void;
}) {
    return (
        <TouchableOpacity
            className="bg-white p-5 rounded-2xl border border-gray-100 mb-2 mx-5"
            activeOpacity={0.7}
            onPress={() => onPress(meeting)}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                    {meeting.discussed_topics[0] || t("mothers_group_meeting.meeting_default_topic")}
                </Text>
                <View className="bg-emerald-100 flex-row items-center px-3 py-1 rounded-full">
                    <Users size={14} color="#065f46" className="mr-1" />
                    <Text className="text-emerald-800 text-xs font-bold flex-row items-center">
                        {meeting.attendees_count} {t("mothers_group_meeting.attendees")}
                    </Text>
                </View>
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-4">{meeting.meeting_location}</Text>

            <View className="flex-row items-center border-t border-gray-100 pt-4 mb-2">
                <View className="flex-row items-center mr-6">
                    <Calendar size={16} color="#6b7280" className="mr-2" />
                    <Text className="text-gray-600">
                        {formatAdDate(meeting.meeting_date, language)}
                    </Text>
                </View>
            </View>

            {meeting.decisions && meeting.decisions.length > 0 && (
                <Text className="text-gray-500 italic mt-3" numberOfLines={2}>
                    "{meeting.decisions.join(", ")}"
                </Text>
            )}
        </TouchableOpacity>
    );
});

export default function MothersGroupMeetings() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [meetings, setMeetings] = useState<MeetingListType[]>([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchMeetings();
        }, [])
    );

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const data = await getAllMothersGroupMeetings();
            setMeetings(data);
        } catch (error) {
            console.error("Error fetching meetings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMeetingPress = useCallback((meeting: MeetingListType) => {
        router.push({
            pathname: "/dashboard/mothers-group/details",
            params: { id: meeting.id }
        });
    }, [router]);

    const renderMeeting = useCallback(({ item }: { item: MeetingListType }) => (
        <MeetingCard meeting={item} language={language} t={t} onPress={handleMeetingPress} />
    ), [handleMeetingPress, language, t]);

    const MeetingSkeleton = () => (
        <View className="bg-white p-5 rounded-2xl border border-gray-100 mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Skeleton width={120} height={16} />
                <Skeleton width={80} height={24} borderRadius={12} />
            </View>
            <Skeleton width="80%" height={24} style={{ marginBottom: 16 }} />
            <View className="flex-row items-center border-t border-gray-50 pt-4">
                <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
                <Skeleton width={100} height={16} />
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white h-full pt-2">
            <CustomHeader
                title={t("mothers_group_meeting.mothers_group")}
                rightNode={
                    <TouchableOpacity
                        onPress={() => router.push("/dashboard/mothers-group/mothers-group-meeting-form")}
                        className="bg-primary flex-1 px-3 py-2 rounded-lg flex-row items-center"
                    >
                        <Plus color="#ffffff" size={17} className="mr-1" />
                        <Text className="text-white text-[14px] font-semibold uppercase">{t("mothers_group_meeting.record_new")}</Text>
                    </TouchableOpacity>
                }
            />
            <FlatList
                className="flex-1"
                data={loading ? [] : meetings}
                renderItem={renderMeeting}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={loading ? (
                        <View className="px-5 mt-4">
                            <MeetingSkeleton />
                            <MeetingSkeleton />
                            <MeetingSkeleton />
                        </View>
                    ) : (
                        <View className="items-center justify-center mt-10 px-2">
                            <View className="bg-white p-8 rounded-lg border border-gray-200 items-center w-full">
                                <View className="bg-emerald-50 p-5 rounded-full mb-6">
                                    <Users size={48} color="#10b981" />
                                </View>
                                <Text className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                                    {t("mothers_group_meeting.empty_title")}
                                </Text>
                                <Text className="text-gray-500 text-center text-base leading-relaxed px-4">
                                    {t("mothers_group_meeting.empty_subtitle")}
                                </Text>
                            </View>
                        </View>
                    )}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={7}
                removeClippedSubviews
            />
        </SafeAreaView>
    );
}
