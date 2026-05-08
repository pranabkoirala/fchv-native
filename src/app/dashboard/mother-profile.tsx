// import React, { useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   SafeAreaView,
//   StatusBar,
//   Image,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
// import {
//   ChevronLeft,
//   Search,
//   MoreVertical,
//   User,
//   Activity,
//   ClipboardList,
//   Calendar,
//   Phone,
//   CheckCircle2,
//   Circle,
//   PlusCircle,
//   Edit,
//   Trash2,
//   FileText
// } from "lucide-react-native";
// import "../../global.css";
// import { getMotherProfile, MotherProfileDbItem, deleteMother } from "../../hooks/database/models/MotherModel";
// import Colors from "../../constants/Colors";
// import CustomHeader from "../../components/CustomHeader";
// import { EDUCATION_LEVELS, JATI_CODES } from "@/utils/data";

// export default function MotherProfileScreen() {
//   const router = useRouter();
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const [mother, setMother] = useState<MotherProfileDbItem | null>(null);
//   const [loading, setLoading] = useState(true);

//   useFocusEffect(
//     useCallback(() => {
//       let isActive = true;
//       const fetchMother = async () => {
//         if (!id) {
//           setLoading(false);
//           return;
//         }
//         try {
//           const data = await getMotherProfile(id);
//           if (isActive) {
//             setMother(data);
//           }
//         } catch (error) {
//           console.error("Failed to fetch mother profile:", error);
//         } finally {
//           if (isActive) setLoading(false);
//         }
//       };

//       setLoading(true);
//       fetchMother();
//       return () => {
//         isActive = false;
//       };
//     }, [id])
//   );

//   const getGA = (lmp?: string) => {
//     if (!lmp || lmp === "N/A") return { weeks: 0, days: 0, months: 0 };
//     const lmpDate = new Date(lmp);
//     const now = new Date();
//     const diffTime = now.getTime() - lmpDate.getTime();
//     if (diffTime < 0) return { weeks: 0, days: 0, months: 0 };
//     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
//     return {
//       weeks: Math.floor(diffDays / 7),
//       days: diffDays % 7,
//       months: Math.floor(diffDays / 30.44),
//     };
//   };
//   const ga = mother ? getGA(mother.lmp) : { weeks: 0, days: 0, months: 0 };

//   const formatShortDate = (dateStr: string) => {
//     if (!dateStr || dateStr === "N/A") return "N/A";
//     const d = new Date(dateStr);
//     if (isNaN(d.getTime())) return dateStr;
//     const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
//     return months[d.getMonth()];
//   };

//   const handleDelete = () => {
//     Alert.alert(
//       "Delete Mother",
//       "Are you sure you want to delete this mother record?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             if (mother?.id) {
//               try {
//                 await deleteMother(mother.id);
//                 router.back();
//               } catch (error) {
//                 Alert.alert("Error", "Could not delete mother.");
//               }
//             }
//           }
//         }
//       ]
//     );
//   };

//   if (loading) {
//     return (
//       <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: Colors.background }}>
//         <ActivityIndicator size="large" color={Colors.primary} />
//         <Text className="mt-4 font-bold" style={{ color: Colors.textSecondary }}>Loading profile...</Text>
//       </SafeAreaView>
//     );
//   }

//   if (!mother) {
//     return (
//       <SafeAreaView className="flex-1 justify-center items-center" style={{ backgroundColor: Colors.background }}>
//         <User size={48} color={Colors.textSecondary} />
//         <Text className="mt-4 font-bold text-lg" style={{ color: Colors.textSecondary }}>Mother not found</Text>
//         <TouchableOpacity onPress={() => router.back()} className="mt-6 px-6 py-3 rounded-full" style={{ backgroundColor: Colors.nepali }}>
//           <Text className="text-white font-bold">Go Back</Text>
//         </TouchableOpacity>
//       </SafeAreaView>
//     );
//   }

//   const displayEthnicity = mother?.ethnicity ? (JATI_CODES.find(j => j.code === mother.ethnicity)?.name || mother.ethnicity) : "N/A";
//   const displayEducation = mother?.education ? (EDUCATION_LEVELS.find(e => e.value === mother.education)?.label || mother.education) : "N/A";

//   const getInitials = (name: string) => {
//     return name.slice(0, 2).toUpperCase(); // mock logic, ideally should be NP if nameNp exists
//   };

//   return (
//     <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.background }}>
//       <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

//       {/* ── App Header ── */}
//       <CustomHeader
//         title="Mother Profile"
//         rightNode={
//           <TouchableOpacity 
//             onPress={() => router.push({ pathname: "/dashboard/mother-list/add-mother", params: { id: mother.id } } as any)}
//             className="bg-white shadow-sm border border-slate-100 p-2 rounded-xl"
//           >
//             <Edit size={20} color={Colors.textPrimary} />
//           </TouchableOpacity>
//         }
//       />

//       {/* ── Profile Top Container ── */}
//       <View style={{ backgroundColor: Colors.primary }} className="rounded-b-[24px] rounded-t-[24px] mx-4 mt-2 mb-4 p-1 shadow-sm">
//         <View className="flex-row items-center bg-black/10 rounded-[20px] p-4">
//           {mother.image && !mother.image.includes("vectorified") ? (
//             <Image
//               source={{ uri: mother.image }}
//               className="w-16 h-16 rounded-full border-2 border-white/30"
//             />
//           ) : (
//             <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center border-2 border-white/30">
//               <Text className="text-white text-xl font-bold">{getInitials(mother.name)}</Text>
//             </View>
//           )}

//           <View className="ml-4 flex-1">
//             <Text className="text-white text-xl font-bold capitalize" numberOfLines={1}>{mother.name}</Text>
//             <Text className="text-white/80 text-xs mt-0.5 font-medium">FCHV ID: {mother.code}</Text>

//             <View className="flex-row items-center mt-2.5 gap-2">
//               <View className="bg-white/20 px-2.5 py-1 rounded-full">
//                 <Text className="text-white text-[10px] font-bold">{mother.ward}</Text>
//               </View>
//               <View className="bg-white/90 px-2.5 py-1 rounded-full">
//                 <Text className="text-[10px] font-bold" style={{ color: Colors.primary }}>{mother.status === 'active' ? 'Active' : 'Delivered'}</Text>
//               </View>
//             </View>
//           </View>
//         </View>
//       </View>

//       <ScrollView
//         className="flex-1"
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
//       >
//         {/* ── Complete Profile Action ── */}
//         <TouchableOpacity
//           onPress={() => router.push({ pathname: "/dashboard/record/complete-profile", params: { id: mother.id } } as any)}
//           className="mx-4 mb-4 bg-primary py-3.5 rounded-[24px] flex-row items-center justify-center shadow-sm"
//         >
//           <FileText size={18} color="white" strokeWidth={2.5} />
//           <Text className="text-white font-bold ml-2 text-base">Complete Mother Profile</Text>
//         </TouchableOpacity>

//         {/* ── Personal Information ── */}
//         <View className="bg-white mx-4 rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
//           <View className="flex-row items-center mb-4 border-b border-slate-50 pb-3">
//             <User size={18} color={Colors.textSecondary} />
//             <Text className="ml-2 font-bold text-base" style={{ color: Colors.textPrimary }}>Personal information</Text>
//           </View>

//           <View className="flex-row flex-wrap">
//             <View className="w-1/2 mb-4 pr-2">
//               <Text className="text-[11px] font-bold mb-1" style={{ color: Colors.textSecondary }}>Age</Text>
//               <Text className="text-[14px] font-bold" style={{ color: Colors.textPrimary }}>{mother.age} years</Text>
//             </View>
//             <View className="w-1/2 mb-4 pl-2">
//               <Text className="text-[11px] font-bold mb-1" style={{ color: Colors.textSecondary }}>Ethnicity</Text>
//               <Text className="text-[13px] font-bold" style={{ color: Colors.textPrimary }} numberOfLines={2}>{displayEthnicity}</Text>
//             </View>

//             <View className="w-1/2 mb-4 pr-2">
//               <Text className="text-[11px] font-bold mb-1" style={{ color: Colors.textSecondary }}>Education</Text>
//               <Text className="text-[13px] font-bold" style={{ color: Colors.textPrimary }} numberOfLines={2}>{displayEducation}</Text>
//             </View>
//             <View className="w-1/2 mb-4 pl-2">
//               <Text className="text-[11px] font-bold mb-1" style={{ color: Colors.textSecondary }}>Phone</Text>
//               <Text className="text-[14px] font-bold" style={{ color: Colors.textPrimary }}>{mother.phone || "N/A"}</Text>
//             </View>

//             <View className="w-1/2 mb-2 pr-2">
//               <Text className="text-[11px] font-bold mb-1" style={{ color: Colors.textSecondary }}>Husband's name</Text>
//               <Text className="text-[14px] font-bold" style={{ color: Colors.textPrimary }} numberOfLines={1}>{mother.husbandName || "N/A"}</Text>
//             </View>
//             <View className="w-1/2 mb-2 pl-2">
//               <Text className="text-[11px] font-bold mb-1" style={{ color: Colors.textSecondary }}>No. of children</Text>
//               <Text className="text-[14px] font-bold" style={{ color: Colors.textPrimary }}>{mother.parity || "0"}</Text>
//             </View>
//           </View>
//         </View>

//         {/* ── Pregnancy Status ── */}
//         <View className="bg-white mx-4 rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
//           <View className="flex-row items-center justify-between mb-4 border-b border-slate-50 pb-3">
//             <View className="flex-row items-center">
//               <Activity size={18} color={Colors.textSecondary} />
//               <Text className="ml-2 font-bold text-base" style={{ color: Colors.textPrimary }}>Pregnancy status</Text>
//             </View>
//             <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
//               <Text className="text-orange-600 text-[10px] font-bold uppercase tracking-widest">Pregnant</Text>
//             </View>
//           </View>

//           <View className="flex-row justify-between mb-5 gap-2">
//             <View className="bg-slate-50 rounded-2xl flex-1 items-center justify-center py-4 border border-slate-100">
//               <Text className="text-2xl font-black" style={{ color: Colors.primary }}>{ga.months}</Text>
//               <Text className="text-[10px] font-bold mt-1" style={{ color: Colors.textSecondary }}>months</Text>
//             </View>
//             <View className="bg-slate-50 rounded-2xl flex-1 items-center justify-center py-4 border border-slate-100">
//               <Text className="text-2xl font-black" style={{ color: Colors.primary }}>3</Text>
//               <Text className="text-[10px] font-bold mt-1" style={{ color: Colors.textSecondary }}>ANC visits</Text>
//             </View>
//             <View className="bg-slate-50 rounded-2xl flex-1 items-center justify-center py-4 border border-slate-100">
//               <Text className="text-2xl font-black" style={{ color: Colors.primary }}>{formatShortDate(mother.edd)}</Text>
//               <Text className="text-[10px] font-bold mt-1 uppercase" style={{ color: Colors.textSecondary }}>EDD</Text>
//             </View>
//           </View>

//           <View className="flex-row justify-between items-end mb-2">
//             <Text className="text-[10px] font-bold" style={{ color: Colors.textSecondary }}>Gestational age</Text>
//             <Text className="text-[10px] font-bold" style={{ color: Colors.textPrimary }}>{ga.weeks}/40 weeks</Text>
//           </View>
//           <View className="h-1.5 bg-slate-100 rounded-full w-full overflow-hidden">
//             <View className="h-full rounded-full" style={{ width: `${Math.min((ga.weeks / 40) * 100, 100)}%`, backgroundColor: Colors.primary }} />
//           </View>

//           <View className="flex-row justify-between items-center mt-5 pt-4 border-t border-slate-50">
//             <View>
//               <Text className="text-[10px] font-bold mb-1" style={{ color: Colors.textSecondary }}>LMP Date</Text>
//               <Text className="text-[13px] font-bold" style={{ color: Colors.textPrimary }}>{mother.lmp || "N/A"}</Text>
//             </View>
//             <View className="items-end">
//               <Text className="text-[10px] font-bold mb-1" style={{ color: Colors.textSecondary }}>EDD Date</Text>
//               <Text className="text-[13px] font-bold" style={{ color: Colors.textPrimary }}>{mother.edd || "N/A"}</Text>
//             </View>
//           </View>
//         </View>

//         {/* ── Health Indicators ── */}
//         <View className="bg-white mx-4 rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
//           <View className="flex-row items-center mb-4 border-b border-slate-50 pb-3">
//             <Activity size={18} color={Colors.textSecondary} />
//             <Text className="ml-2 font-bold text-base" style={{ color: Colors.textPrimary }}>Health indicators</Text>
//           </View>

//           <View className="flex-row items-center justify-between mb-4">
//             <Text className="text-[13px] font-bold" style={{ color: Colors.textSecondary }}>Blood pressure</Text>
//             <View className="flex-row items-center">
//               <Text className="text-[13px] font-bold mr-3" style={{ color: Colors.textPrimary }}>118/76 mmHg</Text>
//               <View className="bg-green-50 px-2.5 py-1 rounded-md border border-green-100"><Text className="text-[10px] font-bold text-green-700">Normal</Text></View>
//             </View>
//           </View>

//           <View className="flex-row items-center justify-between mb-4">
//             <Text className="text-[13px] font-bold" style={{ color: Colors.textSecondary }}>Hemoglobin</Text>
//             <View className="flex-row items-center">
//               <Text className="text-[13px] font-bold mr-3" style={{ color: Colors.textPrimary }}>10.2 g/dL</Text>
//               <View className="bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100"><Text className="text-[10px] font-bold text-orange-600">Mild anemia</Text></View>
//             </View>
//           </View>

//           <View className="flex-row items-center justify-between mb-4">
//             <Text className="text-[13px] font-bold" style={{ color: Colors.textSecondary }}>Weight</Text>
//             <View className="flex-row items-center">
//               <Text className="text-[13px] font-bold mr-3" style={{ color: Colors.textPrimary }}>56 kg</Text>
//               <View className="bg-green-50 px-2.5 py-1 rounded-md border border-green-100"><Text className="text-[10px] font-bold text-green-700">Normal</Text></View>
//             </View>
//           </View>

//           <View className="flex-row items-center justify-between">
//             <Text className="text-[13px] font-bold" style={{ color: Colors.textSecondary }}>IFA tablets</Text>
//             <View className="flex-row items-center">
//               <Text className="text-[13px] font-bold mr-3" style={{ color: Colors.textPrimary }}>90 days</Text>
//               <View className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200"><Text className="text-[10px] font-bold text-slate-600">Dispensed</Text></View>
//             </View>
//           </View>
//         </View>

//         {/* ── Services Received ── */}
//         <View className="bg-white mx-4 rounded-[24px] p-5 shadow-sm border border-slate-100 mb-4">
//           <View className="flex-row items-center mb-4 border-b border-slate-50 pb-3">
//             <ClipboardList size={18} color={Colors.textSecondary} />
//             <Text className="ml-2 font-bold text-base" style={{ color: Colors.textPrimary }}>Services received</Text>
//           </View>

//           <View className="gap-y-4">
//             <View className="flex-row items-center justify-between">
//               <View className="flex-row items-center">
//                 <CheckCircle2 size={18} color={Colors.primary} fill={Colors.primary + "1A"} />
//                 <Text className="ml-3 font-bold text-[13px]" style={{ color: Colors.textPrimary }}>TT vaccination (2nd dose)</Text>
//               </View>
//             </View>
//             <View className="flex-row items-center justify-between">
//               <View className="flex-row items-center">
//                 <CheckCircle2 size={18} color={Colors.primary} fill={Colors.primary + "1A"} />
//                 <Text className="ml-3 font-bold text-[13px]" style={{ color: Colors.textPrimary }}>Nutrition counselling</Text>
//               </View>
//             </View>
//             <View className="flex-row items-center justify-between">
//               <View className="flex-row items-center">
//                 <CheckCircle2 size={18} color={Colors.primary} fill={Colors.primary + "1A"} />
//                 <Text className="ml-3 font-bold text-[13px]" style={{ color: Colors.textPrimary }}>Safe delivery planning</Text>
//               </View>
//             </View>
//             <View className="flex-row items-center justify-between">
//               <View className="flex-row items-center opacity-60">
//                 <PlusCircle size={18} color={Colors.secondary} />
//                 <Text className="ml-3 font-bold text-[13px]" style={{ color: Colors.textPrimary }}>Deworming tablet</Text>
//               </View>
//               <Text className="text-[10px] font-bold" style={{ color: Colors.secondary }}>Pending</Text>
//             </View>
//             <View className="flex-row items-center justify-between">
//               <View className="flex-row items-center opacity-60">
//                 <PlusCircle size={18} color={Colors.secondary} />
//                 <Text className="ml-3 font-bold text-[13px]" style={{ color: Colors.textPrimary }}>4th ANC check-up</Text>
//               </View>
//               <Text className="text-[10px] font-bold" style={{ color: Colors.secondary }}>Pending</Text>
//             </View>
//           </View>
//         </View>

//         {/* ── Last Home Visit ── */}
//         <View className="bg-white mx-4 rounded-[24px] p-5 shadow-sm border border-slate-100 flex-row items-center justify-between mb-4">
//           <View className="flex-row items-center">
//             <View style={{ backgroundColor: Colors.primary + "15" }} className="p-3 rounded-2xl border border-green-100">
//               <Calendar size={22} color={Colors.primary} strokeWidth={2.5} />
//             </View>
//             <View className="ml-3">
//               <Text className="text-[10px] font-bold" style={{ color: Colors.textSecondary }}>Last home visit</Text>
//               <Text className="text-[14px] font-black mt-0.5" style={{ color: Colors.textPrimary }}>April 10, 2026</Text>
//             </View>
//           </View>
//           <View className="items-end">
//             <Text className="text-[10px] font-bold" style={{ color: Colors.textSecondary }}>Next visit</Text>
//             <Text className="text-[12px] font-bold mt-1" style={{ color: Colors.primary }}>May 5, 2026</Text>
//           </View>
//         </View>

//         {/* ── Delete Button ─────────────── */}
//         <View className="items-end mx-4 mb-8">
//           <TouchableOpacity
//             activeOpacity={0.8}
//             onPress={handleDelete}
//             className="flex-row items-center border border-red-200 bg-red-50 px-4 py-3 rounded-2xl"
//           >
//             <Trash2 size={18} color={Colors.nepali} strokeWidth={2.5} />
//             <Text className="ml-2 font-black text-sm" style={{ color: Colors.nepali }}>Delete Mother</Text>
//           </TouchableOpacity>
//         </View>

//       </ScrollView>

//       {/* ── Bottom Fixed Actions ── */}
//       {/* <View className="absolute bottom-0 w-full bg-white border-t border-slate-100 px-5 py-4 flex-row gap-4 pb-8">
//         <TouchableOpacity 
//           activeOpacity={0.8}
//           onPress={() => router.push({ pathname: "/dashboard/mother-list/add-mother", params: { id: mother.id } } as any)}
//           className="flex-1 h-14 rounded-2xl flex-row items-center justify-center shadow-sm shadow-green-100"
//           style={{ backgroundColor: Colors.primary }}
//         >
//           <Edit size={18} color="#FFF" />
//           <Text className="text-white font-bold text-base ml-2">Update record</Text>
//         </TouchableOpacity>

//         <TouchableOpacity 
//           activeOpacity={0.8}
//           className="flex-1 h-14 rounded-2xl flex-row items-center justify-center border-2"
//           style={{ borderColor: Colors.textSecondary + "30", backgroundColor: "#F8FAFC" }}
//         >
//           <Phone size={18} color={Colors.primary} />
//           <Text className="font-bold text-base ml-2" style={{ color: Colors.primary }}>Refer / Call</Text>
//         </TouchableOpacity>
//       </View> */}
//     </SafeAreaView>
//   );
// }

import { View, Text } from "react-native";

export default function MotherProfileScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Mother Profile (Coming Soon)</Text>
    </View>
  );
}
