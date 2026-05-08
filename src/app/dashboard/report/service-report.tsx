import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Printer } from "lucide-react-native";
import CustomHeader from "@/components/CustomHeader";
import { useRouter } from "expo-router";
import { AdToBs } from "react-native-nepali-picker";
import { getDb } from "@/hooks/database/db";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Colors from "@/constants/Colors";
import "../../../global.css";

export default function ServiceReportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<Record<number, any>>({});

  const NEPALI_MONTHS = t("reports.common.nepali_months", { returnObjects: true }) as string[];

  const monthsGroup = [
    [NEPALI_MONTHS[0], NEPALI_MONTHS[1], NEPALI_MONTHS[2], NEPALI_MONTHS[3]],
    [NEPALI_MONTHS[4], NEPALI_MONTHS[5], NEPALI_MONTHS[6], NEPALI_MONTHS[7]],
    [NEPALI_MONTHS[8], NEPALI_MONTHS[9], NEPALI_MONTHS[10], NEPALI_MONTHS[11]]
  ];

  const getBsMonth = (isoDate: string) => {
    if (!isoDate) return 0;
    try {
      const bsDate = AdToBs(isoDate);
      const month = parseInt(bsDate.split("-")[1]);
      return month;
    } catch (e) {
      return 0;
    }
  };

  const fetchData = async () => {
    try {
      const db = await getDb();
      const tables = [
        { name: 'mother', key: 'mother' },
        { name: 'pregnancy', key: 'pregnancy' },
        { name: 'child_monitoring', key: 'child' },
        { name: 'hmis_maternal_death', key: 'maternal_death' },
      ];

      const counts: Record<number, any> = {};
      for (let i = 1; i <= 12; i++) {
        counts[i] = { mother: 0, pregnancy: 0, child: 0, child_death: 0, maternal_death: 0, newborn_death: 0, total: 0 };
      }

      for (const table of tables) {
        const rows: any = await db.getAllAsync(`SELECT created_at FROM ${table.name} WHERE is_deleted = 0`);
        rows.forEach((row: any) => {
          const month = getBsMonth(row.created_at);
          if (month >= 1 && month <= 12) {
            counts[month][table.key]++;
            counts[month].total++;
          }
        });
      }

      // Split hmis_newborn_death by death_age_unit
      const deathRows: any = await db.getAllAsync(
        `SELECT created_at, death_age_unit, death_age_days FROM hmis_newborn_death WHERE is_deleted = 0`
      );
      deathRows.forEach((row: any) => {
        const month = getBsMonth(row.created_at);
        if (month >= 1 && month <= 12) {
          const isNewborn = row.death_age_unit === 'days' && row.death_age_days < 28;
          if (isNewborn) {
            counts[month].newborn_death++;
          } else {
            counts[month].child_death++;
          }
          counts[month].total++;
        }
      });
      setMonthlyData(counts);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMonthData = (monthName: string) => {
    const idx = NEPALI_MONTHS.indexOf(monthName) + 1;
    return monthlyData[idx] || { mother: 0, pregnancy: 0, child: 0, child_death: 0, maternal_death: 0, newborn_death: 0, total: 0 };
  };

  const TableHeader = () => (
    <View className="flex-row border-b border-slate-300 bg-slate-50">
      <View className="w-[60px] p-2 border-r border-slate-300 items-center justify-center">
        <Text className="font-bold text-[12px] text-slate-700">{t("reports.common.month")}</Text>
      </View>
      <View className="flex-1 p-2 border-r border-slate-300 items-center justify-center">
        <Text className="font-bold text-[12px] text-slate-700">{t("reports.common.service_recipient")}</Text>
      </View>
      <View className="w-[40px] p-2 items-center justify-center">
        <Text className="font-bold text-[11px] text-slate-700">{t("reports.common.total")}</Text>
      </View>
    </View>
  );

  const TableRow = ({ month }: { month: string }) => {
    const d = getMonthData(month);
    return (
      <View className="flex-row border-b border-slate-300 min-h-[100px]">
        <View className="w-[60px] p-2 border-r border-slate-300 items-center justify-center bg-slate-50/30">
          <Text className="text-[12px] font-semibold text-slate-800 text-center">{month}</Text>
        </View>
        <View className="flex-1 p-2 border-r border-slate-300 justify-center">
          <Text className="text-[12px] text-slate-600">{t("reports.common.mother")}: {d.mother}</Text>
          <Text className="text-[12px] text-slate-600">{t("reports.common.pregnant")}: {d.pregnancy}</Text>
          <Text className="text-[12px] text-slate-600">{t("reports.common.child")}: {d.child}</Text>
          <Text className="text-[12px] text-rose-500">{t("reports.common.death")}: {d.child_death + d.maternal_death + d.newborn_death}</Text>
        </View>
        <View className="w-[40px] p-2 items-center justify-center">
          <Text className="text-[11px] font-black text-primary">{d.total || "0"}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <CustomHeader 
        title={t("reports.service_recipients.title")} 
        onBackPress={() => router.replace("/dashboard/report")}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm">
              <View className="flex-row">
                {monthsGroup.map((group, groupIdx) => (
                  <View key={groupIdx} className={`w-[260px] ${groupIdx < 2 ? 'border-r-2 border-slate-400' : ''}`}>
                    <TableHeader />
                    {group.map((month, idx) => (
                      <TableRow key={idx} month={month} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <Text className="text-slate-500 text-[11px] font-medium leading-relaxed">
              {t("reports.service_report.info_text")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

