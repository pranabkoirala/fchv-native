import { useFocusEffect, useRouter } from "expo-router";
import {
  Baby,
  Bell,
  Calendar,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  User,
  AlertTriangle,
} from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../../hooks/database/models/MotherModel";

const ANC_MILESTONES = [12, 16, 20, 24, 28, 32, 36, 40];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getWeekInfo = (lmp: string) => {
  if (!lmp) return null;
  const lmpDate = new Date(lmp);
  if (isNaN(lmpDate.getTime())) return null;
  const wks = Math.floor(
    (Date.now() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  return wks;
};

const getStatus = (wks: number | null) => {
  if (wks === null) return { label: "New", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" };
  if (wks > 42) return { label: "Post-Term", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" };
  if (wks < 12) return { label: `${wks} wks`, color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" };
  if (wks < 28) return { label: `${wks} wks`, color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" };
  return { label: `${wks} wks`, color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" };
};

const getRiskStyle = (risk: string) => {
  switch (risk) {
    case "high": return { border: "border-red-200", bg: "bg-red-50", text: "text-red-700", label: "High Risk" };
    case "moderate": return { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", label: "Moderate" };
    default: return { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700", label: "Normal" };
  }
};

const getPregnancySuffix = (n: number) => {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
};

const MotherCard = memo(function MotherCard({
  mother,
  onPress,
}: {
  mother: MotherListDbItem;
  onPress: (mother: MotherListDbItem) => void;
}) {
  const wks = getWeekInfo(mother.lmp);
  const status = getStatus(wks);

  let completedVisits = 0;
  let nextVisit = "";
  if (wks !== null) {
    ANC_MILESTONES.forEach((m, i) => {
      if (wks >= m) completedVisits = i + 1;
    });
    const next = ANC_MILESTONES.find((m) => m > wks);
    nextVisit = next ? `Week ${next}` : "Completed";
  }

  const risk = getRiskStyle(mother.risk);
  const initials = getInitials(mother.name);
  const hasPhoto = mother.image && !mother.image.includes("no-profile-picture-icon");

  const ord = getPregnancySuffix(mother.pregnancy_count || 1);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(mother)}
      className={`mx-5 mb-4 bg-white rounded-2xl overflow-hidden ${
        mother.hasHealthProblem ? "border border-red-300" : "border border-gray-100"
      }`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Top section: avatar + info */}
      <View className="flex-row p-4 pb-3">
        {/* Avatar */}
        <View className="mr-3">
          {hasPhoto ? (
            <Image
              source={{ uri: mother.image }}
              className="w-14 h-14 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center">
              <Text className="text-slate-500 text-lg font-semibold">
                {initials}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-slate-800 text-lg font-bold leading-tight flex-1 mr-2" numberOfLines={1}>
              {mother.name}
            </Text>
            <View className={`px-2.5 py-1 rounded-full flex-row items-center ${status.bg}`}>
              <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status.dot}`} />
              <Text className={`text-[11px] font-semibold ${status.color}`}>
                {status.label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-1.5 flex-wrap">
            {mother.age > 0 && (
              <Text className="text-slate-400 text-[13px] font-medium">
                {mother.age} yrs
              </Text>
            )}
            <Text className="text-slate-400 text-[13px] font-medium mx-1.5">•</Text>
            <Text className="text-slate-400 text-[13px] font-medium">
              {ord} Pregnancy
            </Text>
            <Text className="text-slate-400 text-[13px] font-medium mx-1.5">•</Text>
            <View className="flex-row items-center">
              <MapPin size={11} color="#94A3B8" />
              <Text className="text-slate-400 text-[13px] font-medium ml-1">
                Ward {mother.ward || "-"}
              </Text>
            </View>
          </View>

          {/* Risk badge */}
          <View className="flex-row items-center mt-2">
            <View className={`px-2 py-0.5 rounded-md ${risk.bg} ${risk.border} border`}>
              <Text className={`text-[10px] font-semibold ${risk.text}`}>
                {risk.label}
              </Text>
            </View>
            {mother.hasHealthProblem && (
              <View className="flex-row items-center ml-2">
                <AlertTriangle size={12} color="#DC2626" />
                <Text className="text-red-600 text-[10px] font-semibold ml-1">
                  Health Issue
                </Text>
              </View>
            )}
          </View>
        </View>

        <ChevronRight size={18} color="#CBD5E1" className="ml-1 self-center" />
      </View>

      {/* Divider */}
      <View className="h-px bg-gray-100 mx-4" />

      {/* Bottom section: LMP/EDD + ANC progress */}
      <View className="px-4 py-3">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center">
            <Calendar size={13} color="#64748B" />
            <Text className="text-slate-500 text-[12px] font-medium ml-1.5">
              LMP: {mother.lmp || "—"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Calendar size={13} color="#64748B" />
            <Text className="text-slate-500 text-[12px] font-medium ml-1.5">
              EDD: {mother.edd || "—"}
            </Text>
          </View>
        </View>

        {/* ANC progress bar */}
        <View className="flex-row items-center">
          <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min((completedVisits / 8) * 100, 100)}%` }}
            />
          </View>
          {wks !== null && wks <= 42 && (
            <Text className="text-slate-400 text-[11px] font-medium ml-2 min-w-[65px] text-right">
              {completedVisits < 8 ? `Next: ${nextVisit}` : "All done"}
            </Text>
          )}
        </View>

        {/* Visit dots */}
        <View className="flex-row items-center mt-2 justify-between">
          {ANC_MILESTONES.map((milestone, i) => {
            const done = wks !== null && wks >= milestone;
            return (
              <View
                key={milestone}
                className={`w-3 h-1.5 rounded-full ${
                  done ? "bg-blue-500" : "bg-gray-100"
                }`}
                style={{ marginRight: i < 7 ? 3 : 0 }}
              />
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function MotherListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMothers = async () => {
    try {
      const list = await getAllMothersList();
      setMothers(list);
    } catch (error) {
      console.error("Failed to fetch mothers:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMothers();
    }, []),
  );

  const { refreshing, onRefresh } = usePullToRefresh(loadMothers);

  const filtered = useMemo(() => mothers.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      (m.nameNp || "").includes(search) ||
      (m.ward || "").toLowerCase().includes(q);
    return matchSearch;
  }), [mothers, search]);

  const handleMotherPress = useCallback((mother: MotherListDbItem) => {
    router.push({
      pathname: "/dashboard/mother-profile",
      params: { id: mother.id },
    } as any);
  }, [router]);

  const renderMother = useCallback(({ item }: { item: MotherListDbItem }) => (
    <MotherCard mother={item} onPress={handleMotherPress} />
  ), [handleMotherPress]);

  const listHeader = (
    <>
      {/* Search bar */}
      <View className="px-5 mt-3">
        <View className="flex-row items-center bg-white px-4 h-12 rounded-xl border border-gray-200">
          <Search size={18} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-2.5 text-base text-slate-700 font-medium"
            placeholder="Search by name, ward..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} className="p-1">
              <View className="w-4 h-4 rounded-full bg-gray-300 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">✕</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick actions */}
      <View className="flex-row px-5 mt-5 gap-3 mb-5">
        <TouchableOpacity
          onPress={() =>
            router.push("/dashboard/mother-list/add-mother" as any)
          }
          className="flex-1 bg-blue-600 py-4 rounded-2xl items-center justify-center flex-row"
          style={{
            shadowColor: "#2563EB",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="bg-white/20 p-2 rounded-xl mr-3">
            <Plus size={18} color="white" strokeWidth={3} />
          </View>
          <Text className="text-white font-bold text-[14px]">
            New Registration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-emerald-600 py-4 rounded-2xl items-center justify-center flex-row"
          style={{
            shadowColor: "#059669",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="bg-white/20 p-2 rounded-xl mr-3">
            <Baby size={18} color="white" strokeWidth={3} />
          </View>
          <Text className="text-white font-bold text-[14px]">
            Record Birth
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section header */}
      {filtered.length > 0 && (
        <View className="flex-row items-center justify-between px-5 mb-3">
          <Text className="text-slate-800 text-lg font-bold">
            Registered Mothers
          </Text>
          <Text className="text-slate-400 text-[13px] font-medium">
            {filtered.length} total
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-5 pt-12 pb-4 flex-row justify-between items-center bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="bg-blue-50 p-1.5 rounded-xl mr-3">
            <Image
              source={require("../../../assets/fchv-logo.png")}
              className="w-9 h-9"
              resizeMode="contain"
            />
          </View>
          <View>
            <Text className="text-slate-900 text-lg font-bold">
              FCHV Assistant
            </Text>
            <Text className="text-slate-400 text-[11px] font-medium -mt-0.5">
              Mother Tracking Dashboard
            </Text>
          </View>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-xl">
          <Bell size={20} color="#1E293B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        className="flex-1"
        showsVerticalScrollIndicator={false}
        data={loading ? [] : filtered}
        renderItem={renderMother}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={loading ? (
          <View className="items-center py-24">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
            <Text className="text-slate-400 font-medium text-sm">
              Loading mothers...
            </Text>
          </View>
        ) : (
          <View className="items-center py-24 px-10">
            <View className="w-20 h-20 rounded-full bg-slate-50 items-center justify-center mb-4">
              <User size={36} color="#CBD5E1" strokeWidth={1.5} />
            </View>
            <Text className="text-slate-400 font-semibold text-base mb-1">
              No mothers found
            </Text>
            <Text className="text-slate-300 text-[13px] text-center leading-relaxed">
              {search
                ? "Try adjusting your search query"
                : "Register a new mother to get started"}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}
