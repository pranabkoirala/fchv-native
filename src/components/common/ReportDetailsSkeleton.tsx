import { Skeleton } from "@/components/common/Skeleton";
import { ScrollView, View } from "react-native";

export const ReportDetailsSkeleton = () => (
    <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
    >
        {/* Profile Header Card */}
        <View className="mx-4 bg-white p-5 rounded-3xl border border-slate-100 mb-6 flex-row items-center">
            <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mr-4 border border-slate-100">
                <Skeleton width={32} height={32} borderRadius={16} />
            </View>
            <View className="flex-1 gap-2">
                <Skeleton width="70%" height={24} borderRadius={6} />
                <Skeleton width="40%" height={16} borderRadius={4} />
            </View>
        </View>

        {/* Section 1 */}
        <View className="mx-4 bg-white rounded-3xl border border-slate-100 mb-6 overflow-hidden">
            <View className="bg-slate-50 px-5 py-4 border-b border-slate-100">
                <Skeleton width="40%" height={16} borderRadius={4} />
            </View>
            <View className="p-5 pb-2">
                <View className="flex-row items-start mb-4">
                    <Skeleton width={18} height={18} borderRadius={4} style={{ marginRight: 16, marginTop: 2 }} />
                    <View className="flex-1 border-b border-slate-100 pb-3 gap-2">
                        <Skeleton width="30%" height={12} borderRadius={4} />
                        <Skeleton width="60%" height={16} borderRadius={4} />
                    </View>
                </View>
                <View className="flex-row items-start mb-4">
                    <Skeleton width={18} height={18} borderRadius={4} style={{ marginRight: 16, marginTop: 2 }} />
                    <View className="flex-1 border-b border-slate-100 pb-3 gap-2">
                        <Skeleton width="30%" height={12} borderRadius={4} />
                        <Skeleton width="50%" height={16} borderRadius={4} />
                    </View>
                </View>
            </View>
        </View>

        {/* Section 2 */}
        <View className="mx-4 bg-white rounded-3xl border border-slate-100 mb-6 overflow-hidden">
            <View className="bg-slate-50 px-5 py-4 border-b border-slate-100">
                <Skeleton width="35%" height={16} borderRadius={4} />
            </View>
            <View className="p-5 pb-2">
                <View className="flex-row items-start mb-4">
                    <Skeleton width={18} height={18} borderRadius={4} style={{ marginRight: 16, marginTop: 2 }} />
                    <View className="flex-1 border-b border-slate-100 pb-3 gap-2">
                        <Skeleton width="25%" height={12} borderRadius={4} />
                        <Skeleton width="45%" height={16} borderRadius={4} />
                    </View>
                </View>
            </View>
        </View>
    </ScrollView>
);
