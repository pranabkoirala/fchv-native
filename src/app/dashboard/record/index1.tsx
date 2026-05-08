// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   ActivityIndicator,
//   TextInput
// } from 'react-native';
// import { useRouter, useFocusEffect } from 'expo-router';
// import { Plus, ChevronLeft, Search, Check, X } from 'lucide-react-native';
// import { getAllMothersList, MotherListDbItem } from '../../../hooks/database/models/MotherModel';
// import Colors from '../../../constants/Colors';

// const colWidths = {
//   sn: 40,
//   date: 40,
//   mother: 150,
//   age: 40,
//   lmpEdd: 40,
//   anc: 50,
//   counsel: 35,
//   meds: 48,
//   delivery: 52,
//   condition: 52,
//   pnc: 52,
//   fp: 48,
//   remarks: 140
// };

// // Unified Cell Component
// const GridCell = ({
//   children,
//   width,
//   height,
//   isFirstCol = false,
//   isFirstRow = false,
//   isHeader = false,
//   textStyle = {},
//   center = true,
// }: any) => (
//   <View style={[
//     styles.gridCell,
//     { width, height: height || '100%' },
//     isFirstCol && { borderLeftWidth: 1.5 },
//     isFirstRow && { borderTopWidth: 1.5 },
//     isHeader && { backgroundColor: '#F3F4F6' },
//     center ? { alignItems: 'center' } : { paddingHorizontal: 6 }
//   ]}>
//     <Text style={[styles.cellText, isHeader && styles.headerText, textStyle]}>
//       {children || "-"}
//     </Text>
//   </View>
// );

// const Tick = ({ val, color = "#3B82F6" }: { val: number | null, color?: string }) => (
//   val === 1 ? <Check size={14} color={color} strokeWidth={3} /> : <Text style={styles.cellText}>-</Text>
// );

// const Cross = ({ val }: { val: number | null }) => (
//   val === 0 ? <X size={14} color="#CBD5E1" strokeWidth={2} /> : <Text style={styles.cellText}>-</Text>
// );

// export default function RecordScreen() {
//   const router = useRouter();
//   const [records, setRecords] = useState<MotherListDbItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");

//   useFocusEffect(
//     useCallback(() => {
//       const fetchRecords = async () => {
//         try {
//           const data = await getAllMothersList();
//           setRecords(data);
//         } catch (error) {
//           console.error(error);
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetchRecords();
//     }, [])
//   );

//   const filteredRecords = records.filter(r =>
//     r.name?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const parseDate = (dateStr: string) => {
//     if (!dateStr || dateStr === "N/A") return { day: "-", month: "-", year: "-" };
//     try {
//       const d = new Date(dateStr);
//       if (isNaN(d.getTime())) {
//         // Try simple split if it's not a standard date
//         const parts = dateStr.split(/[-/]/);
//         if (parts.length === 3) {
//           return { day: parts[2], month: parts[1], year: parts[0] };
//         }
//         return { day: "-", month: "-", year: "-" };
//       }
//       return { 
//         day: d.getDate().toString(), 
//         month: (d.getMonth() + 1).toString(), 
//         year: d.getFullYear().toString() 
//       };
//     } catch {
//       return { day: "-", month: "-", year: "-" };
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <StatusBar barStyle="dark-content" />

//       {/* App Header */}
//       <View className="px-6 pt-14 pb-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
//         <View className="flex-row items-center">
//           <TouchableOpacity onPress={() => router.back()} className="mr-4">
//             <ChevronLeft size={24} color="#1E293B" />
//           </TouchableOpacity>
//           <View>
//             <Text className="text-2xl font-bold text-[#1E293B]">Maternal Record</Text>
//             <Text className="text-xs text-gray-400 font-medium">FCHV Maternal Health</Text>
//           </View>
//         </View>
//         <TouchableOpacity
//           onPress={() => router.push("/dashboard/record/add-mother")}
//           className="border border-primary px-4 py-3 rounded-xl items-center justify-center flex-row"
//         >
//           <Plus size={16} color="#5993f0ff" strokeWidth={3} />
//           <Text className="text-primary font-medium text-sm ml-2">New Entry</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Search & Filters */}
//       <View className="px-6 py-4">
//         <View className="flex-row items-center bg-slate-50 rounded-2xl px-4 h-12 border border-slate-100 shadow-sm shadow-slate-200/50">
//           <Search size={18} color="#94a3b8" />
//           <TextInput
//             className="flex-1 ml-3 text-slate-700 font-medium"
//             placeholder="Search by mother's name..."
//             placeholderTextColor="#94a3b8"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//           />
//         </View>
//       </View>

//       {loading ? (
//         <View className="flex-1 items-center justify-center">
//           <ActivityIndicator size="small" color={Colors.primary} />
//         </View>
//       ) : (
//         <View className="flex-1">
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             <View>
//               {/* Header Grouping Tier 1 */}
//               <View className="flex-row h-[36px]">
//                 <GridCell width={colWidths.sn} height={72} isFirstCol isFirstRow isHeader>क्र.सं.</GridCell>
//                 <GridCell width={colWidths.date * 3} height={36} isHeader>दर्ता मिति</GridCell>
//                 <GridCell width={colWidths.mother} height={36} isHeader>विवरण</GridCell>
//                 <GridCell width={colWidths.age} height={36} isHeader>उमेर</GridCell>
//                 <GridCell width={colWidths.lmpEdd * 3} height={36} isHeader>LMP मिति</GridCell>
//                 <GridCell width={colWidths.lmpEdd * 3} height={36} isHeader>EDD मिति</GridCell>
//                 <GridCell width={colWidths.counsel * 2} height={36} isHeader>परामर्श</GridCell>
//                 <GridCell width={colWidths.anc * 9} height={36} isHeader>गर्भावस्था जाँच (ANC)</GridCell>
//                 <GridCell width={colWidths.meds * 6} height={36} isHeader>औषधि वितरण</GridCell>
//                 <GridCell width={colWidths.delivery * 3} height={36} isHeader>सुत्केरी भएको स्थान</GridCell>
//                 <GridCell width={colWidths.condition * 2} height={36} isHeader>बच्चाको अवस्था</GridCell>
//                 <GridCell width={colWidths.pnc * 5} height={36} isHeader>सुत्केरी जाँच (PNC)</GridCell>
//                 <GridCell width={colWidths.fp * 2} height={36} isHeader>परिवार नियोजन</GridCell>
//                 <GridCell width={colWidths.remarks} height={36} isHeader>कैफियत</GridCell>
//               </View>

//               {/* Tier 2: Sub-Groups / Descriptions */}
//               <View className="flex-row h-[36px]">
//                 <View style={{ width: colWidths.sn }} />
//                 <GridCell width={colWidths.date} height={36} isHeader>गते</GridCell>
//                 <GridCell width={colWidths.date} height={36} isHeader>महिना</GridCell>
//                 <GridCell width={colWidths.date} height={36} isHeader>साल</GridCell>
//                 <GridCell width={colWidths.mother} height={36} isHeader>नाम थर</GridCell>
//                 <GridCell width={colWidths.age} height={36} isHeader>उमेर</GridCell>
//                 <GridCell width={colWidths.lmpEdd} height={36} isHeader>गते</GridCell>
//                 <GridCell width={colWidths.lmpEdd} height={36} isHeader>महिना</GridCell>
//                 <GridCell width={colWidths.lmpEdd} height={36} isHeader>साल</GridCell>
//                 <GridCell width={colWidths.lmpEdd} height={36} isHeader>गते</GridCell>
//                 <GridCell width={colWidths.lmpEdd} height={36} isHeader>महिना</GridCell>
//                 <GridCell width={colWidths.lmpEdd} height={36} isHeader>साल</GridCell>
//                 <GridCell width={colWidths.counsel} height={36} isHeader>छ</GridCell>
//                 <GridCell width={colWidths.counsel} height={36} isHeader>छैन</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>१२ हप्ता</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>१६ हप्ता</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>२०-२४</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>२८ हप्ता</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>३२ हप्ता</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>३४ हप्ता</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>३६ हप्ता</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>३८-४०</GridCell>
//                 <GridCell width={colWidths.anc} height={36} isHeader>अन्य</GridCell>
//                 <GridCell width={colWidths.meds * 2} height={36} isHeader textStyle={{ fontSize: 7 }}>गर्भावस्थामा १८० चक्की</GridCell>
//                 <GridCell width={colWidths.meds * 2} height={36} isHeader textStyle={{ fontSize: 7 }}>सुत्केरी भएपछि ४५ चक्की</GridCell>
//                 <GridCell width={colWidths.meds * 2} height={36} isHeader textStyle={{ fontSize: 7 }}>भिटामिन ए क्याप्सुल</GridCell>
//                 <GridCell width={colWidths.delivery} height={36} isHeader>घर</GridCell>
//                 <GridCell width={colWidths.delivery} height={36} isHeader>संस्था</GridCell>
//                 <GridCell width={colWidths.delivery} height={36} isHeader>अन्य</GridCell>
//                 <GridCell width={colWidths.condition} height={36} isHeader>जीवित</GridCell>
//                 <GridCell width={colWidths.condition} height={36} isHeader>मृत</GridCell>
//                 <GridCell width={colWidths.pnc} height={36} isHeader>२४ घण्टा</GridCell>
//                 <GridCell width={colWidths.pnc} height={36} isHeader>३ दिन</GridCell>
//                 <GridCell width={colWidths.pnc} height={36} isHeader>७-१४ दिन</GridCell>
//                 <GridCell width={colWidths.pnc} height={36} isHeader>४२ दिन</GridCell>
//                 <GridCell width={colWidths.pnc} height={36} isHeader>अन्य</GridCell>
//                 <GridCell width={colWidths.fp} height={36} isHeader>छ</GridCell>
//                 <GridCell width={colWidths.fp} height={36} isHeader>छैन</GridCell>
//                 <GridCell width={colWidths.remarks} height={36} />
//               </View>

//               {/* Data Rows */}
//               <ScrollView showsVerticalScrollIndicator={false}>
//                 {filteredRecords.map((item, index) => {
//                   const lmp = parseDate(item.lmp);
//                   const edd = parseDate(item.edd);
                  
//                   return (
//                     <TouchableOpacity
//                       key={item.id}
//                       onPress={() => router.push({ pathname: "/dashboard/profile", params: { id: item.id } } as any)}
//                       activeOpacity={0.7}
//                       className={`flex-row ${index % 2 === 1 ? 'bg-blue-50/10' : 'bg-white'}`}
//                       style={{ height: 48 }}
//                     >
//                       <GridCell width={colWidths.sn} height={48} isFirstCol>{index + 1}</GridCell>
//                       <GridCell width={colWidths.date} height={48}>{parseDate(item.createdAt).day}</GridCell>
//                       <GridCell width={colWidths.date} height={48}>{parseDate(item.createdAt).month}</GridCell>
//                       <GridCell width={colWidths.date} height={48}>{parseDate(item.createdAt).year}</GridCell>
//                       <GridCell width={colWidths.mother} height={48} center={false} textStyle={{ fontWeight: '900', fontSize: 10 }}>{item.name}</GridCell>
//                       <GridCell width={colWidths.age} height={48}>{item.age || "-"}</GridCell>
//                       <GridCell width={colWidths.lmpEdd} height={48}>{lmp.day}</GridCell>
//                       <GridCell width={colWidths.lmpEdd} height={48}>{lmp.month}</GridCell>
//                       <GridCell width={colWidths.lmpEdd} height={48}>{lmp.year}</GridCell>
//                       <GridCell width={colWidths.lmpEdd} height={48}>{edd.day}</GridCell>
//                       <GridCell width={colWidths.lmpEdd} height={48}>{edd.month}</GridCell>
//                       <GridCell width={colWidths.lmpEdd} height={48}>{edd.year}</GridCell>

//                       <GridCell width={colWidths.counsel} height={48}>-</GridCell>
//                       <GridCell width={colWidths.counsel} height={48}>-</GridCell>

//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.anc} height={48}>-</GridCell>

//                       <GridCell width={colWidths.meds} height={48}>-</GridCell>
//                       <GridCell width={colWidths.meds} height={48}>-</GridCell>
//                       <GridCell width={colWidths.meds} height={48}>-</GridCell>
//                       <GridCell width={colWidths.meds} height={48}>-</GridCell>
//                       <GridCell width={colWidths.meds} height={48}>-</GridCell>
//                       <GridCell width={colWidths.meds} height={48}>-</GridCell>

//                       <GridCell width={colWidths.delivery} height={48}><Tick val={item.birth_place === 'home' ? 1 : 0} /></GridCell>
//                       <GridCell width={colWidths.delivery} height={48}><Tick val={item.birth_place === 'institution' ? 1 : 0} /></GridCell>
//                       <GridCell width={colWidths.delivery} height={48}><Tick val={(item.birth_place && item.birth_place !== 'home' && item.birth_place !== 'institution') ? 1 : 0} /></GridCell>

//                       <GridCell width={colWidths.condition} height={48}><Tick val={item.baby_status === 'alive' ? 1 : 0} /></GridCell>
//                       <GridCell width={colWidths.condition} height={48}><Tick val={item.baby_status === 'dead' ? 1 : 0} /></GridCell>

//                       <GridCell width={colWidths.pnc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.pnc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.pnc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.pnc} height={48}>-</GridCell>
//                       <GridCell width={colWidths.pnc} height={48}>-</GridCell>

//                       <GridCell width={colWidths.fp} height={48}>-</GridCell>
//                       <GridCell width={colWidths.fp} height={48}>-</GridCell>

//                       <GridCell width={colWidths.remarks} height={48} center={false} textStyle={{ fontSize: 8 }}>{item?.remarks}</GridCell>
//                     </TouchableOpacity>
//                   );
//                 })}
//                 <View className="h-40" />
//               </ScrollView>
//             </View>
//           </ScrollView>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   headerStack: {
//     borderBottomWidth: 1,
//     borderColor: '#D1D5DB',
//   },
//   gridCell: {
//     justifyContent: 'center',
//     borderRightWidth: 1.5,
//     borderBottomWidth: 1.5,
//     borderColor: '#D1D5DB',
//   },
//   cellText: {
//     fontSize: 9,
//     color: '#334155',
//     textAlign: 'center',
//   },
//   headerText: {
//     fontSize: 8,
//     fontWeight: '900',
//     color: '#1F2937',
//   },
//   colNumText: {
//     fontSize: 7.5,
//     fontWeight: 'bold',
//     color: '#4B5563',
//   }
// });
