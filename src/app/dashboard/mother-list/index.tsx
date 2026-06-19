import { useFocusEffect, useRouter } from "expo-router";
import { Baby, Bell, Check, Plus, Search, User } from "lucide-react-native";
import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getAllMothersList,
  MotherListDbItem,
} from "../../../hooks/database/models/MotherModel";

const ANC_MILESTONES = [12, 16, 20, 24, 28, 32, 36, 40];

const MotherTrackerCard = memo(function MotherTrackerCard({
  mother,
  onPress,
}: {
  mother: MotherListDbItem;
  onPress: (mother: MotherListDbItem) => void;
}) {
  const lmpDate = mother.lmp ? new Date(mother.lmp) : null;
  const wks = lmpDate
    ? Math.floor((Date.now() - lmpDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
    : 0;

  let currentVisit = 0;
  ANC_MILESTONES.forEach((m, i) => {
    if (wks >= m) currentVisit = i + 1;
  });

  const status = !mother.lmp
    ? { status: "New Case", color: "blue" }
    : wks > 42
      ? { status: "Post-Term", color: "red" }
      : currentVisit === 0
        ? { status: "New Case", color: "blue" }
        : { status: `Visit ${currentVisit} Complete`, color: "blue" };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(mother)}
      className={`bg-white p-5 rounded-[32px] mb-6 border mx-5 ${
        mother.hasHealthProblem ? "border-red-500 bg-red-50/10" : "border-gray-100"
      }`}
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-4">
          <Text className="text-[#1E293B] text-2xl font-black leading-tight">
            {mother.name}
          </Text>
          <Text className="text-gray-400 font-bold text-xs mt-1">
            Age: {mother.age || "26"} • {mother.pregnancy_count || "1"}st Pregnancy
          </Text>
        </View>
        <View
          className={`px-3 py-1.5 rounded-xl ${status.color === "red" ? "bg-rose-50" : "bg-blue-50"}`}
        >
          <Text
            className={`text-[11px] font-black ${status.color === "red" ? "text-rose-600" : "text-blue-600"}`}
          >
            {status.status}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <Text className="text-gray-400 font-black text-[10px] uppercase">LMP</Text>
          <Text className="text-[#1E293B] font-black text-base mt-0.5">
            {mother.lmp || "Jan 12, 2024"}
          </Text>
        </View>
        <View className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <Text className="text-gray-400 font-black text-[10px] uppercase">EDD</Text>
          <Text className="text-[#1E293B] font-black text-base mt-0.5">
            {mother.edd || "Oct 18, 2024"}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-[#1E293B] font-bold text-[13px]">
          ANC Schedule (8 Visits)
        </Text>
        <Text className="text-blue-600 font-black text-[13px]">
          {wks < 40
            ? `Next Visit: Week ${ANC_MILESTONES.find((m) => m > wks)}`
            : "Completed"}
        </Text>
      </View>

      <View className="flex-row items-center justify-between px-1">
        {ANC_MILESTONES.map((milestone, i) => {
          const v = i + 1;
          const completed = wks >= milestone;
          const current = !completed && (i === 0 || wks >= ANC_MILESTONES[i - 1]);

          return (
            <View key={v} className="flex-row items-center flex-1">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                  completed
                    ? "bg-[#006F62] border-[#006F62]"
                    : current
                      ? "border-primary"
                      : "bg-gray-100 border-gray-100"
                }`}
              >
                {completed ? (
                  <Check size={14} color="white" strokeWidth={4} />
                ) : (
                  <Text className={`text-[11px] font-black ${current ? "text-primary" : "text-gray-400"}`}>
                    {v}
                  </Text>
                )}
              </View>
              {i < 7 && (
                <View className={`h-[2px] flex-1 mx-1 ${completed ? "bg-[#006F62]" : "bg-gray-100"}`} />
              )}
            </View>
          );
        })}
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
    <MotherTrackerCard mother={item} onPress={handleMotherPress} />
  ), [handleMotherPress]);

  const listHeader = (
    <>
      <View className="px-5 mt-4">
        <View className="flex-row items-center bg-white px-4 h-14 rounded-2xl border border-gray-100">
          <Search size={20} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-3 text-base text-[#1E293B] font-medium"
            placeholder="Search pregnant women by name..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View className="flex-row px-5 mt-6 gap-4 mb-6">
        <TouchableOpacity
          onPress={() =>
            router.push("/dashboard/mother-list/add-mother" as any)
          }
          className="flex-1 bg-[#0262C4] p-5 rounded-[28px] items-center justify-center"
        >
          <View className="bg-white/20 p-2 rounded-xl mb-3">
            <Plus size={24} color="white" strokeWidth={3} />
          </View>
          <Text className="text-white font-black text-center text-[13px] leading-tight">
            New{"\n"}Registration
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 bg-[#006F62] p-5 rounded-[28px] items-center justify-center">
          <View className="bg-white/20 p-2 rounded-xl mb-3">
            <Baby size={24} color="white" strokeWidth={3} />
          </View>
          <Text className="text-white font-black text-center text-[13px] leading-tight">
            Record Birth
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Custom FCHV Header */}
      <View className="px-6 pt-14 pb-4 flex-row justify-between items-center bg-white">
        <View className="flex-row items-center">
          <View className="bg-blue-50 p-1.5 rounded-xl mr-3">
            <Image
              source={require("../../../assets/fchv-logo.png")}
              className="w-10 h-10"
              resizeMode="contain"
            />
          </View>
          <Text className="text-primary text-xl font-black">
            FCHV Assistant
          </Text>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-2xl">
          <Bell size={24} color="#1E293B" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <FlatList
        className="flex-1 bg-[#F8FAFC]"
        showsVerticalScrollIndicator={false}
        data={loading ? [] : filtered}
        renderItem={renderMother}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={loading ? (
            <View className="items-center py-20">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-400 font-black text-sm mt-4 italic">
                Loading trackers...
              </Text>
            </View>
          ) : (
            <View className="py-20 items-center justify-center opacity-50">
              <User size={48} color="#CBD5E1" strokeWidth={1.5} />
              <Text className="text-gray-400 font-black text-base italic mt-4">
                No trackers found
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
