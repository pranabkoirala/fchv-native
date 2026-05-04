import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, ChevronLeft, Search, Check, X } from 'lucide-react-native';
import { getAllHmisRecords } from '../../../hooks/database/models/HmisRecordModel';
import { HmisRecordStoreType } from '../../../hooks/database/types/hmisRecordModal';
import Colors from '../../../constants/Colors';

const colWidths = {
  sn: 40,
  date: 40,
  mother: 150,
  age: 40,
  lmpEdd: 40,
  anc: 50,
  counsel: 35,
  meds: 48,
  delivery: 52,
  condition: 52,
  pnc: 52,
  fp: 48,
  remarks: 140
};

// Unified Cell Component
const GridCell = ({
  children,
  width,
  height,
  isFirstCol = false,
  isFirstRow = false,
  isHeader = false,
  textStyle = {},
  center = true,
}: any) => (
  <View style={[
    styles.gridCell,
    { width, height: height || '100%' },
    isFirstCol && { borderLeftWidth: 1.5 },
    isFirstRow && { borderTopWidth: 1.5 },
    isHeader && { backgroundColor: '#F3F4F6' },
    center ? { alignItems: 'center' } : { paddingHorizontal: 6 }
  ]}>
    <Text style={[styles.cellText, isHeader && styles.headerText, textStyle]}>
      {children}
    </Text>
  </View>
);

const Tick = ({ val, color = "#3B82F6" }: { val: number | null, color?: string }) => (
  val === 1 ? <Check size={14} color={color} strokeWidth={3} /> : null
);

const Cross = ({ val }: { val: number | null }) => (
  val === 0 ? <X size={14} color="#CBD5E1" strokeWidth={2} /> : null
);

export default function RecordScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<HmisRecordStoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchRecords = async () => {
        try {
          const data = await getAllHmisRecords();
          setRecords(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    }, [])
  );

  const filteredRecords = records.filter(r =>
    r.mother_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* App Header */}
      <View className="px-6 pt-14 pb-4 flex-row items-center justify-between border-b border-gray-50 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-[#1E293B]">Maternal Record</Text>
            <Text className="text-xs text-gray-400 font-medium">FCHV Maternal Health</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/dashboard/record/add-record")}
          className="border border-primary px-4 py-3 rounded-xl items-center justify-center flex-row"
        >
          <Plus size={16} color="#5993f0ff" strokeWidth={3} />
          <Text className="text-primary font-medium text-sm ml-2">New Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View className="px-6 bg-white border-b border-gray-50 my-3">
        <View className="bg-gray-50 h-18 rounded-xl flex-row items-center px-4 border border-gray-100">
          <Search size={18} color="#64748B" />
          <TextInput
            placeholder="Search mother's name..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-slate-800 font-bold text-sm"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <View className="flex-1">
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Header Hierarchy - 4 Rows Matching Official Document Precisely */}
              <View style={styles.headerStack}>
                {/* Tier 1: Main Categories */}
                <View className="flex-row h-[36px]">
                  <GridCell width={colWidths.sn} height={144} isFirstCol isFirstRow isHeader>क्र.सं.</GridCell>
                  <GridCell width={colWidths.date * 3} height={36} isFirstRow isHeader>मिति</GridCell>
                  <GridCell width={colWidths.mother + colWidths.age} height={36} isFirstRow isHeader>गर्भवती महिलाको</GridCell>
                  <GridCell width={colWidths.lmpEdd * 3} height={36} isFirstRow isHeader>अन्तिम रजस्वला भएको (LMP) (ग.म.सा.)</GridCell>
                  <GridCell width={colWidths.lmpEdd * 3} height={36} isFirstRow isHeader>प्रसूतिको अनुमानित मिति (EDD) (ग.म.सा.)</GridCell>
                  <GridCell width={colWidths.counsel * 2} height={36} isFirstRow isHeader>जीवन सुरक्षा परामर्श दिएको</GridCell>
                  <GridCell width={colWidths.anc * 9} height={36} isFirstRow isHeader>स्वास्थ्य संस्थामा गर्भ जाँच गरेको पटक (औं हप्तामा)</GridCell>
                  <GridCell width={colWidths.meds * 4} height={36} isFirstRow isHeader>आईरन चक्की*</GridCell>
                  <GridCell width={colWidths.meds * 2} height={36} isFirstRow isHeader>सुत्केरी पश्चात भिटामिन ए*</GridCell>
                  <GridCell width={colWidths.delivery * 3} height={36} isFirstRow isHeader>प्रसूति भएको स्थान*</GridCell>
                  <GridCell width={colWidths.condition * 2} height={36} isFirstRow isHeader>शशुको जन्म अवस्था*</GridCell>
                  <GridCell width={colWidths.pnc * 5} height={36} isFirstRow isHeader>सुत्केरी र शिशु जाँच*</GridCell>
                  <GridCell width={colWidths.fp * 2} height={36} isFirstRow isHeader>प.नि साधन प्रयोग*</GridCell>
                  <GridCell width={colWidths.remarks} height={144} isFirstRow isHeader>कैफियत</GridCell>
                </View>

                {/* Tier 2: Sub-Groups / Descriptions */}
                <View className="flex-row h-[36px]">
                  <View style={{ width: colWidths.sn }} />
                  <GridCell width={colWidths.date} height={72} isHeader>गते</GridCell>
                  <GridCell width={colWidths.date} height={72} isHeader>महिना</GridCell>
                  <GridCell width={colWidths.date} height={72} isHeader>साल</GridCell>
                  <GridCell width={colWidths.mother} height={72} isHeader>नाम थर</GridCell>
                  <GridCell width={colWidths.age} height={72} isHeader>उमेर</GridCell>
                  <GridCell width={colWidths.lmpEdd} height={72} isHeader>गते</GridCell>
                  <GridCell width={colWidths.lmpEdd} height={72} isHeader>महिना</GridCell>
                  <GridCell width={colWidths.lmpEdd} height={72} isHeader>साल</GridCell>
                  <GridCell width={colWidths.lmpEdd} height={72} isHeader>गते</GridCell>
                  <GridCell width={colWidths.lmpEdd} height={72} isHeader>महिना</GridCell>
                  <GridCell width={colWidths.lmpEdd} height={72} isHeader>साल</GridCell>
                  <GridCell width={colWidths.counsel} height={72} isHeader>छ</GridCell>
                  <GridCell width={colWidths.counsel} height={72} isHeader>छैन</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>१२ हप्ता</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>१६ हप्ता</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>२०-२४</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>२८ हप्ता</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>३२ हप्ता</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>३४ हप्ता</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>३६ हप्ता</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>३८-४०</GridCell>
                  <GridCell width={colWidths.anc} height={72} isHeader>अन्य</GridCell>
                  <GridCell width={colWidths.meds * 2} height={36} isHeader textStyle={{ fontSize: 7 }}>गर्भावस्थामा १८० चक्की</GridCell>
                  <GridCell width={colWidths.meds * 2} height={36} isHeader textStyle={{ fontSize: 7 }}>सुत्केरी पश्चात ४५ चक्की</GridCell>
                  <GridCell width={colWidths.meds} height={72} isHeader>पाएको</GridCell>
                  <GridCell width={colWidths.meds} height={72} isHeader>नपाएको</GridCell>
                  <GridCell width={colWidths.delivery} height={72} isHeader>घर</GridCell>
                  <GridCell width={colWidths.delivery} height={72} isHeader>संस्था</GridCell>
                  <GridCell width={colWidths.delivery} height={72} isHeader>अन्य</GridCell>
                  <GridCell width={colWidths.condition} height={72} isHeader>जीवित</GridCell>
                  <GridCell width={colWidths.condition} height={72} isHeader>मृत</GridCell>
                  <GridCell width={colWidths.pnc} height={72} isHeader textStyle={{ fontSize: 7 }}>२४ घण्टा भित्र</GridCell>
                  <GridCell width={colWidths.pnc} height={72} isHeader textStyle={{ fontSize: 7 }}>३ दिनमा</GridCell>
                  <GridCell width={colWidths.pnc} height={72} isHeader textStyle={{ fontSize: 7 }}>७-१४ दिनमा</GridCell>
                  <GridCell width={colWidths.pnc} height={72} isHeader textStyle={{ fontSize: 7 }}>४२ दिनमा</GridCell>
                  <GridCell width={colWidths.pnc} height={72} isHeader>अन्य</GridCell>
                  <GridCell width={colWidths.fp} height={72} isHeader>गरेको</GridCell>
                  <GridCell width={colWidths.fp} height={72} isHeader>नगरेको</GridCell>
                </View>

                {/* Tier 3: Specific Status Labels (Specifically for Iron) */}
                <View className="flex-row h-[36px]">
                  <View style={{ width: colWidths.sn + (colWidths.date * 3) + colWidths.mother + colWidths.age + (colWidths.lmpEdd * 6) + (colWidths.counsel * 2) + (colWidths.anc * 9) }} />
                  <GridCell width={colWidths.meds} height={36} isHeader>पाएको</GridCell>
                  <GridCell width={colWidths.meds} height={36} isHeader>नपाएको</GridCell>
                  <GridCell width={colWidths.meds} height={36} isHeader>पाएको</GridCell>
                  <GridCell width={colWidths.meds} height={36} isHeader>नपाएको</GridCell>
                </View>

                {/* Tier 4: Column Numbers */}
                <View className="flex-row h-[36px] bg-[#E5E7EB]">
                  <View style={{ width: colWidths.sn }} />
                  {/* Column numbers 2-36 */}
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, "-", 33, 34, 35, 36].map((num, i) => {
                    let width = colWidths.date;
                    if (i === 3) width = colWidths.mother;
                    if (i === 4) width = colWidths.age;
                    if (i >= 5 && i <= 10) width = colWidths.lmpEdd;
                    if (i >= 11 && i <= 12) width = colWidths.counsel;
                    if (i >= 13 && i <= 21) width = colWidths.anc;
                    if (i >= 22 && i <= 27) width = colWidths.meds;
                    if (i >= 28 && i <= 30) width = colWidths.delivery;
                    if (i >= 31 && i <= 32) width = colWidths.condition;
                    if (i >= 33 && i <= 37) width = colWidths.pnc;
                    if (i >= 38 && i <= 39) width = colWidths.fp;
                    return <GridCell key={i} width={width} height={36} textStyle={styles.colNumText}>{num}</GridCell>
                  })}
                </View>
              </View>

              {/* Data Body */}
              <ScrollView>
                {filteredRecords.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => router.push({ pathname: "/dashboard/record/profile", params: { id: item.id } } as any)}
                    activeOpacity={0.7}
                    className={`flex-row ${index % 2 === 1 ? 'bg-blue-50/10' : 'bg-white'}`}
                    style={{ height: 48 }}
                  >
                    <GridCell width={colWidths.sn} height={48} isFirstCol>{item.serial_no}</GridCell>
                    <GridCell width={colWidths.date} height={48}>{item.date_day}</GridCell>
                    <GridCell width={colWidths.date} height={48}>{item.date_month}</GridCell>
                    <GridCell width={colWidths.date} height={48}>{item.date_year}</GridCell>
                    <GridCell width={colWidths.mother} height={48} center={false} textStyle={{ fontWeight: '900', fontSize: 10 }}>{item.mother_name}</GridCell>
                    <GridCell width={colWidths.age} height={48}>{item.mother_age}</GridCell>
                    <GridCell width={colWidths.lmpEdd} height={48}>{item.lmp_day}</GridCell>
                    <GridCell width={colWidths.lmpEdd} height={48}>{item.lmp_month}</GridCell>
                    <GridCell width={colWidths.lmpEdd} height={48}>{item.lmp_year}</GridCell>
                    <GridCell width={colWidths.lmpEdd} height={48}>{item.edd_day}</GridCell>
                    <GridCell width={colWidths.lmpEdd} height={48}>{item.edd_month}</GridCell>
                    <GridCell width={colWidths.lmpEdd} height={48}>{item.edd_year}</GridCell>

                    <GridCell width={colWidths.counsel} height={48}><Tick val={item.counseling_given} color="#10B981" /></GridCell>
                    <GridCell width={colWidths.counsel} height={48}><Cross val={item.counseling_given} /></GridCell>

                    <GridCell width={colWidths.anc} height={48}>{item.checkup_12 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_16 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_20_24 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_28 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_32 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_34 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_36 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}>{item.checkup_38_40 === 1 ? <Check size={12} color="#3B82F6" /> : ""}</GridCell>
                    <GridCell width={colWidths.anc} height={48}><Text style={{ fontSize: 7 }}>{item.checkup_other}</Text></GridCell>

                    <GridCell width={colWidths.meds} height={48}><Tick val={item.iron_preg_received === 1 ? 1 : 0} /></GridCell>
                    <GridCell width={colWidths.meds} height={48}><Cross val={item.iron_preg_received === 1 ? 1 : 0} /></GridCell>
                    <GridCell width={colWidths.meds} height={48}><Tick val={item.iron_pnc_received === 1 ? 1 : 0} /></GridCell>
                    <GridCell width={colWidths.meds} height={48}><Cross val={item.iron_pnc_received === 1 ? 1 : 0} /></GridCell>
                    <GridCell width={colWidths.meds} height={48}><Tick val={item.vit_a_received === 1 ? 1 : 0} /></GridCell>
                    <GridCell width={colWidths.meds} height={48}><Cross val={item.vit_a_received === 1 ? 1 : 0} /></GridCell>

                    <GridCell width={colWidths.delivery} height={48}>{item.delivery_place === "Home" ? <Check size={12} color="#555" /> : ""}</GridCell>
                    <GridCell width={colWidths.delivery} height={48}>{item.delivery_place === "Facility" ? <Check size={12} color="#555" /> : ""}</GridCell>
                    <GridCell width={colWidths.delivery} height={48}>{item.delivery_place === "Other" ? <Check size={12} color="#555" /> : ""}</GridCell>

                    <GridCell width={colWidths.condition} height={48}>{item.newborn_condition === "Alive" ? <Check size={12} color="#10B981" /> : ""}</GridCell>
                    <GridCell width={colWidths.condition} height={48}>{item.newborn_condition === "Dead" ? <Check size={12} color="#EF4444" /> : ""}</GridCell>

                    <GridCell width={colWidths.pnc} height={48}><Tick val={item.pnc_check_24hr} /></GridCell>
                    <GridCell width={colWidths.pnc} height={48}><Tick val={item.pnc_check_3day} /></GridCell>
                    <GridCell width={colWidths.pnc} height={48}><Tick val={item.pnc_check_7_14day} /></GridCell>
                    <GridCell width={colWidths.pnc} height={48}><Tick val={item.pnc_check_42day} /></GridCell>
                    <GridCell width={colWidths.pnc} height={48}><Text style={{ fontSize: 7 }}>{item.pnc_check_other}</Text></GridCell>

                    <GridCell width={colWidths.fp} height={48}><Tick val={item.family_planning_used} /></GridCell>
                    <GridCell width={colWidths.fp} height={48}><Cross val={item.family_planning_used} /></GridCell>

                    <GridCell width={colWidths.remarks} height={48} center={false}>{item.remarks}</GridCell>
                  </TouchableOpacity>
                ))}
                <View className="h-40" />
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Primary Action */}
      {/* <TouchableOpacity
        onPress={() => router.push("/dashboard/record/add-record")}
        className="absolute bottom-10 right-8 w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-xl shadow-blue-400 border-4 border-white"
        activeOpacity={0.9}
      >
        <Plus size={28} color="white" strokeWidth={3} />
      </TouchableOpacity> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerStack: {
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
  },
  gridCell: {
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  cellText: {
    fontSize: 9,
    color: '#334155',
    textAlign: 'center',
  },
  headerText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#1F2937',
  },
  colNumText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#4B5563',
  }
});
