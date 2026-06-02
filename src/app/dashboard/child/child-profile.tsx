import { SafeAreaView } from "react-native-safe-area-context";
import ChildCounselingSection from "@/app/dashboard/child/ChildCounselingSection";
import CustomHeader from "@/components/CustomHeader";
import VaccinationSection from "@/components/profile/VaccinationSection";
import Colors from "@/constants/Colors";
import { useLanguage } from "@/context/LanguageContext";
import { getInfantMonitoringById } from "@/hooks/database/models/InfantMonitoringModel";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Activity, Baby, Edit2, MapPin, Smile } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";

const toNepaliNumbers = (num: number | string) => {
    const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    return String(num).replace(/[0-9]/g, (match) => nepaliDigits[parseInt(match)]);
};

const calculateAge = (dobString: string, currentLanguage: string, t: any) => {
    if (!dobString) return "---";
    const dob = new Date(dobString);
    const now = new Date();

    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();

    if (days < 0) {
        months--;
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += lastMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (currentLanguage === 'np') {
        const yearStr = years > 0 ? `${toNepaliNumbers(years)} ${t("child_profile.identity.years")}` : "";
        const monthStr = months > 0 ? `${toNepaliNumbers(months)} ${t("child_profile.identity.months")}` : "";
        const dayStr = days > 0 ? `${toNepaliNumbers(days)} ${t("child_profile.identity.days")}` : "";
        return `${yearStr} ${monthStr} ${dayStr}`.trim() || `० ${t("child_profile.identity.days")}`;
    } else {
        const yearStr = years > 0 ? `${years} ${years === 1 ? 'Year' : 'Years'}` : "";
        const monthStr = months > 0 ? `${months} ${months === 1 ? 'Month' : 'Months'}` : "";
        const dayStr = days > 0 ? `${days} ${days === 1 ? 'Day' : 'Days'}` : "";
        return `${yearStr} ${monthStr} ${dayStr}`.trim() || `0 Days`;
    }
};

export default function ChildProfileScreen() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const { id, from } = useLocalSearchParams<{ id: string, from?: string }>();

    const [record, setRecord] = useState<InfantMonitoringStoreType | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const fetchRecord = async () => {
                if (!id) {
                    setLoading(false);
                    return;
                }
                try {
                    const childData = await getInfantMonitoringById(id);
                    if (isActive) {
                        setRecord(childData);
                    }
                } catch (error) {
                    console.error("Failed to fetch child record:", error);
                } finally {
                    if (isActive) setLoading(false);
                }
            };

            setLoading(true);
            fetchRecord();
            return () => {
                isActive = false;
            };
        }, [id]),
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text className="mt-4 text-slate-500 font-medium">
                    {t("profile.states.loading")}
                </Text>
            </SafeAreaView>
        );
    }

    if (!record) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-[#F8FAFC]">
                <Baby size={64} color="#CBD5E1" />
                <Text className="mt-4 text-lg text-slate-500 font-medium">
                    {t("profile.states.not_found")}
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-6 px-8 py-3 rounded-full bg-blue-600"
                >
                    <Text className="text-white font-semibold">
                        {t("profile.states.go_back")}
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white pb-5">
            <StatusBar barStyle="dark-content" />
            <CustomHeader
                title={t("child_profile.title")}
                onBackPress={() => {
                    if (from === "profile" && record?.mother_id) {
                        router.replace({
                            pathname: "/dashboard/profile",
                            params: { id: record.mother_id },
                        } as any);
                    } else if (router.canGoBack()) {
                        router.back();
                    } else {
                        router.replace("/dashboard/child");
                    }
                }}
            />

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
            >
                <View className="px-4 gap-y-3">
                    <View className="bg-white p-5 rounded-2xl border border-slate-100">
                        <View className="flex-row items-start">
                            <View className="w-14 h-14 rounded-full bg-[#E5F5E9] items-center justify-center mr-4">
                                <Smile size={28} color="#10B981" />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-slate-800 text-[17px] font-bold">
                                        {record.baby_name || t("child_page.unnamed_baby")}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push({
                                                pathname: "/dashboard/child/add-child",
                                                params: { id: record.id, from },
                                            })
                                        }
                                        className="ml-2 p-3 bg-gray-50 rounded-full"
                                    >
                                        <Edit2 size={16} color="#899bb4ff" />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-[#64748B] text-[15px] mt-1 font-medium">
                                    {t("child_profile.dob_label")}: {language === 'en' ? record.date_of_birth : record.date_of_birth ? toNepaliNumbers(AdToBs(record.date_of_birth)) : "---"}
                                </Text>
                                <TouchableOpacity onPress={() => router.push({
                                    pathname: "/dashboard/profile",
                                    params: { id: record.mother_id, from: `/dashboard/child/child-profile?id=${id}${from ? `&from=${from}` : ""}` },
                                })} className="flex-row items-center mb-1">
                                    <Text className="text-slate-500 font-medium text-[15px]" numberOfLines={1}>
                                        {t("child_page.mother")}: <Text className="text-slate-700">{record.mother_name || t("child_page.unknown")}</Text>
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row gap-3 mt-5">
                            <View className="flex-1 bg-[#F8FAFC] py-3 rounded-xl items-center border border-slate-100">
                                <Text className="text-[13px] text-slate-600 font-medium mb-1">
                                    {t("child_profile.age")}
                                </Text>
                                <Text className="text-[15px] font-bold text-[#334155]">
                                    {calculateAge(record.date_of_birth || "", language, t)}
                                </Text>
                            </View>
                            <View className="flex-1 bg-[#F8FAFC] py-3 rounded-xl items-center border border-slate-100">
                                <Text className="text-[13px] text-slate-600 font-medium mb-1">
                                    {t("child_profile.reg_date")}
                                </Text>
                                <Text className="text-[15px] font-bold text-[#334155]">
                                    {language === 'en' ? record.created_at.split('T')[0] : record.created_at ? toNepaliNumbers(AdToBs(record.created_at.split('T')[0])) : "---"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Birth Info Grid */}
                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                                <MapPin size={20} color="#3B82F6" />
                            </View>
                            <View>
                                <Text className="text-[13px] text-slate-500 font-medium uppercase tracking-tight">
                                    {t("child_profile.identity.birth_place")}
                                </Text>
                                <Text className="text-[15px] font-bold text-slate-700 capitalize">
                                    {record.birth_place ? t(`child_profile.values.${record.birth_place}`, { defaultValue: record.birth_place.replace("_", " ") }) : "---"}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-1 bg-white p-4 rounded-2xl border border-slate-100 flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center mr-3">
                                <Activity size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text className="text-[13px] text-slate-500 font-medium uppercase tracking-tight">
                                    {t("child_profile.identity.status")}
                                </Text>
                                <Text className="text-[15px] font-bold text-slate-700 capitalize">
                                    {record.status ? t(`child_profile.values.${record.status}`, { defaultValue: record.status }) : t("child_profile.values.alive")}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="mt-2">
                        <VaccinationSection childId={record.id} childName={record.baby_name || ""} />
                        <ChildCounselingSection childId={record.id} />
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
