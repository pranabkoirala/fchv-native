// import CustomHeader from "@/components/CustomHeader";
// import { Skeleton } from "@/components/common/Skeleton";
// import { getAllAdolescentIfa } from "@/hooks/database/models/AdolescentIfaModel";
// import { AdolescentIfaStoreType } from "@/hooks/database/types/adolescentIfaModal";
// import { router, useFocusEffect } from "expo-router";
// import { Edit, Heart, Plus, Search } from "lucide-react-native";
// import { memo, useCallback, useMemo, useState } from "react";
// import { useTranslation } from "react-i18next";
// import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const AdolescentCardSkeleton = () => (
//   <View className="bg-white p-4 rounded-2xl flex-row items-center border border-gray-100 mb-3 mx-1">
//     <View className="w-14 h-14 bg-slate-50 rounded-[18px] items-center justify-center border border-slate-100">
//       <Skeleton width={32} height={32} borderRadius={16} />
//     </View>
//     <View className="flex-1 ml-4 gap-2">
//       <Skeleton width="60%" height={20} borderRadius={6} />
//       <Skeleton width="45%" height={14} borderRadius={4} />
//       <View className="flex-row gap-2 mt-1">
//         <Skeleton width="35%" height={22} borderRadius={11} />
//         <Skeleton width="35%" height={22} borderRadius={11} />
//       </View>
//     </View>
//     <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
//       <Skeleton width={20} height={20} borderRadius={10} />
//     </View>
//   </View>
// );

// const AdolescentCard = memo(function AdolescentCard({
//   item,
//   t,
//   onPress,
// }: {
//   item: AdolescentIfaStoreType;
//   t: any;
//   onPress: (id: string) => void;
// }) {
//   return (
//     <TouchableOpacity
//       activeOpacity={0.7}
//       onPress={() => onPress(item.id)}
//       className="bg-white p-4 rounded-xl flex-row items-center border border-gray-200 mx-3 mb-4"
//     >
//       <View className="w-14 h-14 bg-purple-50 rounded-[18px] items-center justify-center border border-purple-100">
//         <Heart size={24} color="#A855F7" strokeWidth={2} />
//       </View>

//       <View className="flex-1 ml-4 justify-center">
//         <Text
//           className="text-slate-800 text-[17px] font-bold mb-1"
//           numberOfLines={1}
//         >
//           {item.name}
//         </Text>

//         <View className="flex-row items-center mb-1.5">
//           <Text className="text-slate-500 font-medium text-[15px]">
//             {t("adolescent_page.age_group", "Age Group")}:{" "}
//             <Text className="text-purple-700 font-bold">
//               {item.age_group} {t("adolescent_page.years", "Yrs")}
//             </Text>
//           </Text>
//         </View>

//         <View className="flex-row gap-x-2 flex-wrap gap-y-1">
//           <View
//             className={`px-2 py-0.5 rounded-full ${item.phase1_completed ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}
//           >
//             <Text
//               className={`text-[11px] font-semibold ${item.phase1_completed ? "text-emerald-700" : "text-slate-500"}`}
//             >
//               {item.phase1_completed
//                 ? t("adolescent_page.phase1_done", "Phase 1: Completed")
//                 : t("adolescent_page.phase1_pending", "Phase 1: In Progress")}
//             </Text>
//           </View>
//           <View
//             className={`px-2 py-0.5 rounded-full ${item.phase2_completed ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50 border border-slate-200"}`}
//           >
//             <Text
//               className={`text-[11px] font-semibold ${item.phase2_completed ? "text-emerald-700" : "text-slate-500"}`}
//             >
//               {item.phase2_completed
//                 ? t("adolescent_page.phase2_done", "Phase 2: Completed")
//                 : t("adolescent_page.phase2_pending", "Phase 2: In Progress")}
//             </Text>
//           </View>
//         </View>
//       </View>

//       <View className="flex-row items-center gap-x-2">
//         <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
//           <Edit size={20} color="#94A3B8" />
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// });

// export default function AdolescentManagementScreen() {
//   const { t } = useTranslation();
//   const [records, setRecords] = useState<AdolescentIfaStoreType[]>([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(true);

//   const loadRecords = async () => {
//     try {
//       const data = await getAllAdolescentIfa();
//       setRecords(data);
//     } catch (err) {
//       console.error("Failed to load adolescent records:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useFocusEffect(
//     useCallback(() => {
//       loadRecords();
//     }, []),
//   );

//   const filteredRecords = useMemo(() => {
//     const query = search.trim().toLowerCase();
//     if (!query) return records;
//     return records.filter((v) => v.name?.toLowerCase().includes(query));
//   }, [records, search]);

//   const handleEdit = useCallback((id: string) => {
//     router.push({
//       pathname: "/dashboard/adolescent/adolescent-form",
//       params: { id },
//     });
//   }, []);

//   const renderRecord = useCallback(({ item }: { item: AdolescentIfaStoreType }) => (
//     <AdolescentCard item={item} t={t} onPress={handleEdit} />
//   ), [handleEdit, t]);

//   const listHeader = !loading ? (
//     <View className="px-5 mt-3 flex-row items-center gap-3">
//       <View className="flex-1 flex-row items-center bg-white px-4 py-1.5 rounded-md border border-gray-200">
//         <Search size={20} color="#94A3B8" />
//         <TextInput
//           className="flex-1 ml-3 text-[15px] text-[#1E293B]"
//           placeholder={t(
//             "adolescent_page.search_placeholder",
//             "Search by name...",
//           )}
//           placeholderTextColor="#94A3B8"
//           value={search}
//           onChangeText={setSearch}
//         />
//       </View>
//     </View>
//   ) : null;

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <CustomHeader
//         title={t("adolescent_page.title", "Adolescent Girls IFA")}
//         onBackPress={() => router.back()}
//         rightNode={
//           <TouchableOpacity
//             activeOpacity={0.8}
//             onPress={() => router.push("/dashboard/adolescent/adolescent-form")}
//             className="bg-primary px-3 py-2.5 rounded-md items-center justify-center flex-row"
//           >
//             <Plus size={16} color="#ffffff" strokeWidth={3} />
//             <Text className="text-white font-semibold text-[15px] ml-1.5 uppercase tracking-wider">
//               {t("adolescent_page.add_new", "Add New")}
//             </Text>
//           </TouchableOpacity>
//         }
//       />

//       <FlatList
//         className="flex-1"
//         showsVerticalScrollIndicator={false}
//         keyboardShouldPersistTaps="handled"
//         data={loading ? [] : filteredRecords}
//         renderItem={renderRecord}
//         keyExtractor={(item) => item.id}
//         ListHeaderComponent={listHeader}
//         ListEmptyComponent={loading ? (
//           <View className="px-3 pt-3">
//             {[1, 2, 3, 4, 5].map((i) => <AdolescentCardSkeleton key={i} />)}
//           </View>
//         ) : (
//             <View className="py-16 items-center justify-center px-4">
//               <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-4">
//                 <Heart size={40} color="#CBD5E1" strokeWidth={1.5} />
//               </View>
//               <Text className="text-slate-600 font-bold text-lg text-center mb-2">
//                 {t("adolescent_page.no_records", "No Records Found")}
//               </Text>
//               <Text className="text-slate-400 text-sm text-center leading-5 px-6">
//                 {search
//                   ? t(
//                     "adolescent_page.no_results_msg",
//                     "We couldn't find any adolescent girls matching your search.",
//                   )
//                   : t(
//                     "adolescent_page.no_records_msg",
//                     "Start by adding a new adolescent girl distribution record.",
//                   )}
//               </Text>
//             </View>
//         )}
//         contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
//         initialNumToRender={8}
//         maxToRenderPerBatch={8}
//         windowSize={7}
//         removeClippedSubviews
//       />
//     </SafeAreaView>
//   );
// }
