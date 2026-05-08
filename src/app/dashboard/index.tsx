import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Svg, Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Text as SvgText, Line, G, Rect } from 'react-native-svg';
import {
  Plus,
  Trash2,
  CheckCircle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Smile,
  Baby,
  ChevronLeft,
  Activity
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTodo } from "../../hooks/useTodo";
import { TodoItem } from "../../hooks/database/models/TodoModel";
import { useLanguage } from "../../context/LanguageContext";
import Colors from "../../constants/Colors";
import TopHeader from "@/components/layout/TopHeader";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { doSync } from "../../api/services/sync/sync";
import { getMotherCount } from "../../hooks/database/models/MotherModel";
import { getPregnancyCount } from "../../hooks/database/models/PregnantWomenModal";
import { getAllVisits, VisitListItem } from "../../hooks/database/models/VisitModel";
import { getAllHmisRecords } from "../../hooks/database/models/HmisRecordModel";
import { getTotalMaternalDeaths } from "../../hooks/database/models/MaternalDeathModel";
import { getAllNewbornDeaths } from "../../hooks/database/models/NewbornDeathModel";
import { HmisRecordStoreType } from "../../hooks/database/types/hmisRecordModal";

import "../../global.css";


const LineChart = ({ data, color, labels }: { data: number[], color: string, labels: string[] }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const height = 120;
  const [width, setWidth] = useState(300);

  const onLayout = (event: any) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const maxVal = Math.max(...data, 1);
  const stepX = (width - 40) / (data.length - 1);

  const points = data.map((val, i) => {
    const x = 20 + i * stepX;
    const y = height - (val / (maxVal * 1.5)) * height;
    return { x, y, value: val };
  });

  const d = points.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, ""
  );

  const fillD = `${d} L ${width - 20},${height} L 20,${height} Z`;

  return (
    <View className="w-full" onLayout={onLayout}>
      <Svg width={width} height={height + 30} viewBox={`0 -20 ${width} ${height + 25}`}>
        <Defs>
          <SvgGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.15" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </SvgGradient>
        </Defs>
        <Path d={fillD} fill={`url(#grad-${color})`} />
        <Path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <React.Fragment key={i}>
            <Circle 
              cx={p.x} 
              cy={p.y} 
              r="4" 
              fill="white" 
              stroke={color} 
              strokeWidth="2"
              onPressIn={() => setActiveIndex(i)}
            />
            {(activeIndex === i || i === 0 || i === data.length - 1 || data[i] > 0) && (
              <View 
                style={{ 
                  position: 'absolute', 
                  left: p.x - 15, 
                  top: p.y - 45, 
                  backgroundColor: activeIndex === i ? color : '#F8FAFC',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: activeIndex === i ? color : '#E2E8F0'
                }}
              >
                <Text style={{ fontSize: 9, color: activeIndex === i ? 'white' : '#64748B', fontWeight: '600' }}>
                  {p.value}
                </Text>
              </View>
            )}
          </React.Fragment>
        ))}
      </Svg>
      <View className="flex-row justify-between w-full mt-2 px-5">
        {labels.map((l, i) => (
          <Text key={i} className="text-[10px] font-medium text-slate-400">{l}</Text>
        ))}
      </View>
    </View>
  );
};

const PieChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  if (total === 0) return null;

  let currentAngle = 0;
  const radius = 45;
  const cx = 50;
  const cy = 50;

  return (
    <View className="flex-row items-center justify-between w-full px-4">
      <Svg width="100" height="100" viewBox="0 0 100 100">
        {data.map((slice, i) => {
          if (slice.value === 0) return null;
          const sliceAngle = (slice.value / total) * 360;
          const radCurrent = (currentAngle * Math.PI) / 180;
          const radSlice = ((currentAngle + sliceAngle) * Math.PI) / 180;

          const x1 = cx + radius * Math.cos(radCurrent);
          const y1 = cy + radius * Math.sin(radCurrent);
          const x2 = cx + radius * Math.cos(radSlice);
          const y2 = cy + radius * Math.sin(radSlice);

          currentAngle += sliceAngle;

          if (sliceAngle === 360) {
            return <Circle key={i} cx={cx} cy={cy} r={radius} fill={slice.color} stroke="#fff" strokeWidth={2} />;
          }

          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          return <Path key={i} d={pathData} fill={slice.color} stroke="#fff" strokeWidth={2} />;
        })}
        <Circle cx={cx} cy={cy} r={28} fill="#fff" />
      </Svg>
      <View className="flex-1 ml-8 gap-y-3">
        {data.map((item, i) => (
          <View key={i} className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }} />
              <Text className="text-[11px] text-slate-500 font-medium uppercase tracking-tight">{item.label}</Text>
            </View>
            <View className="bg-slate-50 px-2 py-0.5 rounded-md">
              <Text className="text-[11px] text-slate-900 font-semibold">{item.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const BarChart = ({ data, color }: { data: { label: string, value: number }[], color: string }) => {
  const height = 120;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <View className="w-full flex-row items-end justify-between h-[120px] px-1">
      {data.map((item, i) => {
        const barHeight = (item.value / maxVal) * (height - 30);
        return (
          <View key={i} className="items-center flex-1">
            {item.value > 0 && <Text className="text-[9px] text-slate-900 font-semibold mb-1">{item.value}</Text>}
            <View
              style={{ height: Math.max(barHeight, 4), backgroundColor: color }}
              className="w-1.5 rounded-full opacity-90"
            />
            <Text className="text-[8px] text-slate-400 mt-2 font-medium uppercase">{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

const MultiLineChart = ({ data, colors, labels }: { data: { label: string, male: number, female: number }[], colors: { male: string, female: string }, labels: string[] }) => {
  const [width, setWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartHeight = 150;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;
  const totalHeight = chartHeight + paddingTop + paddingBottom;

  const onLayout = (event: any) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (!data || data.length < 2) {
    return (
      <View className="h-32 items-center justify-center">
        <Text className="text-slate-400 text-xs font-medium italic">Loading chart data...</Text>
      </View>
    );
  }

  const maxDataVal = Math.max(...data.flatMap(d => [d.male, d.female]), 1);
  const roundedMax = Math.ceil(maxDataVal / 5) * 5;
  const yTicks = [0, roundedMax * 0.2, roundedMax * 0.4, roundedMax * 0.6, roundedMax * 0.8, roundedMax];
  
  const availableWidth = width - paddingLeft - paddingRight;
  const stepX = availableWidth / (data.length - 1);

  const getPoints = (key: 'male' | 'female') => {
    return data.map((val, i) => ({
      x: paddingLeft + i * stepX,
      y: paddingTop + chartHeight - (val[key] / roundedMax) * chartHeight,
      value: val[key]
    }));
  };

  const malePoints = getPoints('male');
  const femalePoints = getPoints('female');

  const getBezierPath = (points: { x: number, y: number }[]) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      d += ` C ${cp1x},${p0.y} ${cp1x},${p1.y} ${p1.x},${p1.y}`;
    }
    return d;
  };

  const malePath = getBezierPath(malePoints);
  const femalePath = getBezierPath(femalePoints);

  const maleFill = `${malePath} L ${malePoints[malePoints.length - 1].x},${paddingTop + chartHeight} L ${malePoints[0].x},${paddingTop + chartHeight} Z`;
  const femaleFill = `${femalePath} L ${femalePoints[femalePoints.length - 1].x},${paddingTop + chartHeight} L ${femalePoints[0].x},${paddingTop + chartHeight} Z`;

  return (
    <View className="w-full" onLayout={onLayout}>
      <View className="flex-row items-center justify-center mb-8 gap-x-8">
         <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.male }} />
            <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Male</Text>
         </View>
         <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colors.female }} />
            <Text className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Female</Text>
         </View>
      </View>
      
      <Svg width={width} height={totalHeight} viewBox={`0 0 ${width} ${totalHeight}`}>
        <Defs>
          <SvgGradient id="grad-male" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.male} stopOpacity="0.15" />
            <Stop offset="1" stopColor={colors.male} stopOpacity="0" />
          </SvgGradient>
          <SvgGradient id="grad-female" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.female} stopOpacity="0.15" />
            <Stop offset="1" stopColor={colors.female} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Y-Axis Ticks and Horizontal Grid */}
        {yTicks.map((tick, i) => {
          const y = paddingTop + chartHeight - (tick / roundedMax) * chartHeight;
          return (
            <React.Fragment key={i}>
              <Line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#F1F5F9" strokeWidth="1" />
              {/* @ts-ignore */}
              <SvgText x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#94A3B8" fontWeight="600">
                {Math.round(tick)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X-Axis Vertical Grid */}
        {data.map((_, i) => {
           const x = paddingLeft + i * stepX;
           return (
             <Line key={i} x1={x} y1={paddingTop} x2={x} y2={paddingTop + chartHeight} stroke="#F8FAFC" strokeWidth="1" />
           );
        })}

        <Path d={maleFill} fill="url(#grad-male)" />
        <Path d={femaleFill} fill="url(#grad-female)" />
        <Path d={malePath} fill="none" stroke={colors.male} strokeWidth="3" strokeLinecap="round" />
        <Path d={femalePath} fill="none" stroke={colors.female} strokeWidth="3" strokeLinecap="round" />

        {/* Touch Hotspots and month labels */}
        {data.map((item, i) => {
          const x = paddingLeft + i * stepX;
          return (
            <React.Fragment key={i}>
              {/* @ts-ignore */}
              <SvgText 
                x={x} y={paddingTop + chartHeight + 20} 
                textAnchor="middle" fontSize="9" fill={activeIndex === i ? "#1E293B" : "#94A3B8"} fontWeight="700"
              >
                {item.label}
              </SvgText>
              
              <Circle 
                cx={malePoints[i].x} cy={malePoints[i].y} r="4" 
                fill="white" stroke={colors.male} strokeWidth="2.5" 
                onPressIn={() => setActiveIndex(i)}
              />
              <Circle 
                cx={femalePoints[i].x} cy={femalePoints[i].y} r="4" 
                fill="white" stroke={colors.female} strokeWidth="2.5" 
                onPressIn={() => setActiveIndex(i)}
              />
              
              {/* Transparent hit area for whole vertical slice */}
              <Rect 
                x={x - 15} y={paddingTop} width="30" height={chartHeight} 
                fill="transparent" 
                onPressIn={() => setActiveIndex(i)} 
              />
            </React.Fragment>
          );
        })}

        {activeIndex !== null && (
          <G x={Math.max(paddingLeft, Math.min(width - 100, malePoints[activeIndex].x - 45))} y={Math.max(5, Math.min(malePoints[activeIndex].y, femalePoints[activeIndex].y) - 50)}>
            <Rect width="90" height="40" rx="12" fill="#1E293B" />
            {/* @ts-ignore */}
            <SvgText x="45" y="24" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
              M: {data[activeIndex].male}  F: {data[activeIndex].female}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isConnected } = useOnlineStatus();
  const [motherCount, setMotherCount] = useState(0);
  const [pregnancyCount, setPregnancyCount] = useState(0);
  const [maternalDeathCount, setMaternalDeathCount] = useState(0);
  const [newbornDeathCount, setNewbornDeathCount] = useState(0);
  const [childDeathCount, setChildDeathCount] = useState(0);

  const [newbornStats, setNewbornStats] = useState<{ label: string, value: number, color: string }[]>([]);
  const [newbornTrend, setNewbornTrend] = useState<{ label: string, male: number, female: number }[]>([]);

  const [childStats, setChildStats] = useState<{ label: string, value: number, color: string }[]>([]);
  const [childTrend, setChildTrend] = useState<{ label: string, male: number, female: number }[]>([]);

  const [recentVisits, setRecentVisits] = useState<VisitListItem[]>([]);
  const [hmisRecords, setHmisRecords] = useState<HmisRecordStoreType[]>([]);
  const [ancTrend, setAncTrend] = useState({
    w12: 0, w16: 0, w20: 0, w28: 0, w32: 0, w34: 0, w36: 0, w40: 0
  });
  const [pncTrend, setPncTrend] = useState({
    hr24: 0, day3: 0, day7_14: 0, day42: 0
  });

  const scrollRef = React.useRef<ScrollView>(null);
  const todoInputRef = React.useRef<TextInput>(null);
  const { todos, fetchTodos, addTodo, editTodo, removeTodo, toggleTodo } = useTodo();
  const [newTodo, setNewTodo] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      doSync();
    }
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          const [mCount, pCount, visits, hRecords, mdCount, allDeaths] = await Promise.all([
            getMotherCount(),
            getPregnancyCount(),
            getAllVisits(),
            getAllHmisRecords(),
            getTotalMaternalDeaths(),
            getAllNewbornDeaths()
          ]);

          // Split deaths into newborn (<28 days) vs child (>=28 days or months)
          const nDeathsList = allDeaths.filter(d =>
            d.death_age_unit === 'days' && d.death_age_days < 28
          );
          const cDeathsList = allDeaths.filter(d =>
            d.death_age_unit === 'months' || (d.death_age_unit === 'days' && d.death_age_days >= 28)
          );

          setMotherCount(mCount);
          setPregnancyCount(pCount);
          setRecentVisits(visits);
          setHmisRecords(hRecords);
          setMaternalDeathCount(mdCount);
          setNewbornDeathCount(nDeathsList.length);
          setChildDeathCount(cDeathsList.length);

          // Newborn Analysis (<28 days)
          const nCauses = { Asphyxia: 0, Infection: 0, Hypothermia: 0, Other: 0 };
          const nTrendData = Array.from({ length: 12 }, (_, i) => ({
            label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
            male: 0,
            female: 0
          }));

          nDeathsList.forEach(d => {
            if (d.cause_of_death === 'Asphyxia') nCauses.Asphyxia++;
            else if (d.cause_of_death === 'Infection') nCauses.Infection++;
            else if (d.cause_of_death === 'Hypothermia') nCauses.Hypothermia++;
            else nCauses.Other++;

            if (d.birth_month && d.birth_month >= 1 && d.birth_month <= 12) {
              if (d.gender === 'Male') nTrendData[d.birth_month - 1].male++;
              else if (d.gender === 'Female') nTrendData[d.birth_month - 1].female++;
            }
          });

          setNewbornStats([
            { label: 'Asphyxia', value: nCauses.Asphyxia, color: '#3B82F6' },
            { label: 'Infection', value: nCauses.Infection, color: '#F97316' },
            { label: 'Hypothermia', value: nCauses.Hypothermia, color: '#9333EA' },
            { label: 'Other', value: nCauses.Other, color: '#F43F5E' },
          ]);
          setNewbornTrend(nTrendData);

          // Child Analysis (>=28 days or months)
          const cCauses = { Pneumonia: 0, Diarrhea: 0, Malnutrition: 0, Other: 0 };
          const cTrendData = Array.from({ length: 12 }, (_, i) => ({
            label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
            male: 0,
            female: 0
          }));

          cDeathsList.forEach(d => {
            if (d.cause_of_death === 'Pneumonia') cCauses.Pneumonia++;
            else if (d.cause_of_death === 'Diarrhea') cCauses.Diarrhea++;
            else if (d.cause_of_death === 'Malnutrition') cCauses.Malnutrition++;
            else cCauses.Other++;

            if (d.birth_month && d.birth_month >= 1 && d.birth_month <= 12) {
              if (d.gender === 'Male') cTrendData[d.birth_month - 1].male++;
              else if (d.gender === 'Female') cTrendData[d.birth_month - 1].female++;
            }
          });

          setChildStats([
            { label: 'Pneumonia', value: cCauses.Pneumonia, color: '#6366F1' },
            { label: 'Diarrhea', value: cCauses.Diarrhea, color: '#EC4899' },
            { label: 'Malnutrition', value: cCauses.Malnutrition, color: '#F59E0B' },
            { label: 'Other', value: cCauses.Other, color: '#94A3B8' },
          ]);
          setChildTrend(cTrendData);

          // Calculate ANC Trend
          const aTrend = { w12: 0, w16: 0, w20: 0, w28: 0, w32: 0, w34: 0, w36: 0, w40: 0 };
          const pTrend = { hr24: 0, day3: 0, day7_14: 0, day42: 0 };

          hRecords.forEach(r => {
            // ANC
            if (r.checkup_12) aTrend.w12++;
            if (r.checkup_16) aTrend.w16++;
            if (r.checkup_20_24) aTrend.w20++;
            if (r.checkup_28) aTrend.w28++;
            if (r.checkup_32) aTrend.w32++;
            if (r.checkup_34) aTrend.w34++;
            if (r.checkup_36) aTrend.w36++;
            if (r.checkup_38_40) aTrend.w40++;

            // PNC
            if (r.pnc_check_24hr) pTrend.hr24++;
            if (r.pnc_check_3day) pTrend.day3++;
            if (r.pnc_check_7_14day) pTrend.day7_14++;
            if (r.pnc_check_42day) pTrend.day42++;
          });

          setAncTrend(aTrend);
          setPncTrend(pTrend);

          await fetchTodos();
        } catch (error) {
          console.error("Failed to fetch dashboard data:", error);
        }
      };

      fetchData();
    }, [])
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <TopHeader />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{
            paddingBottom: 150,
          }}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Hero Greeting Card */}
        <View className="px-5 mt-4">
          <LinearGradient
            colors={["#3B82F6", "#2563EB"]}
            style={{ borderRadius: 24 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6 shadow-sm shadow-blue-200"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-white text-xl font-semibold leading-tight">
                  Namaste,{"\n"}Laxmi Shrestha
                </Text>
                <Text className="text-white/80 text-sm mt-2 font-medium leading-5">
                  You have {todos.filter(t => !t.is_completed).length} tasks for today.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    scrollRef.current?.scrollTo({ y: 550, animated: true });
                    setTimeout(() => todoInputRef.current?.focus(), 500);
                  }}
                  className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 mt-4 self-start"
                >
                  <Text className="text-white font-semibold text-xs">+ Quick Add Task</Text>
                </TouchableOpacity>
              </View>
              <View className="bg-white/10 p-3 rounded-2xl border border-white/20">
                <Smile size={32} color="white" strokeWidth={2} />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View className="flex-row px-5 mt-6 gap-4">
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-50"
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center">
                <Baby size={20} color="#3B82F6" strokeWidth={2} />
              </View>
              <View className="bg-green-50 px-2 py-0.5 rounded-full">
                <Text className="text-emerald-600 font-semibold text-[10px]">+2</Text>
              </View>
            </View>
            <Text className="text-[#1E293B] text-3xl font-semibold leading-none">{pregnancyCount}</Text>
            <View className="mt-2">
              <Text className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">Pregnant</Text>
              <Text className="text-gray-400 font-medium text-[10px]">गर्भवती महिला</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-1 bg-white rounded-3xl p-5 shadow-sm border border-gray-50"
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-rose-50 w-10 h-10 rounded-2xl items-center justify-center">
                <Smile size={20} color="#E11D48" strokeWidth={2} />
              </View>
              <View className="bg-rose-50 px-2 py-0.5 rounded-full">
                <Text className="text-rose-600 font-semibold text-[10px]">+1</Text>
              </View>
            </View>
            <Text className="text-[#1E293B] text-3xl font-semibold leading-none">{motherCount}</Text>
            <View className="mt-2">
              <Text className="text-gray-500 font-medium text-[11px] uppercase tracking-wider">Mothers</Text>
              <Text className="text-gray-400 font-medium text-[10px]">आमाहरू</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-6">
          <TouchableOpacity
            activeOpacity={0.9}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex-row items-center justify-between"
          >
            <View className="flex-1">
              <Text className="text-gray-400 font-medium text-[11px] uppercase tracking-wider">My Incentives</Text>
              <Text className="text-gray-400 font-medium text-[10px] mb-2 uppercase">मेरो प्रोत्साहन भत्ता</Text>
              <View className="flex-row items-end">
                <Text className="text-[#1E293B] text-3xl font-semibold tracking-tighter">Rs. 1,450</Text>
              </View>
              <TouchableOpacity className="mt-4 flex-row items-center">
                <Text className="text-primary font-semibold text-xs uppercase tracking-widest">View History</Text>
                <ChevronRight size={14} color="#22C55E" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View className="bg-orange-50 w-16 h-16 rounded-3xl items-center justify-center">
              <TrendingUp size={28} color="#F97316" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-slate-800 text-lg font-semibold">ANC Visit Trends</Text>
                <Text className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Prenatal Coverage over weeks</Text>
              </View>
              <View className="bg-blue-50 w-8 h-8 rounded-xl items-center justify-center">
                <Activity size={16} color="#3B82F6" strokeWidth={2} />
              </View>
            </View>

            <View className="h-32 mb-4">
              <LineChart
                data={[ancTrend.w12, ancTrend.w16, ancTrend.w20, ancTrend.w28, ancTrend.w32, ancTrend.w34, ancTrend.w36, ancTrend.w40]}
                color="#3B82F6"
                labels={["W12", "W16", "W20", "W28", "W32", "W34", "W36", "W40"]}
              />
            </View>
          </View>
        </View>

        <View className="px-5 mt-6">
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-slate-800 text-lg font-semibold">PNC Visit Trends</Text>
                <Text className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Postnatal follow-up stats</Text>
              </View>
              <View className="bg-purple-50 w-8 h-8 rounded-xl items-center justify-center">
                <TrendingUp size={16} color="#9333EA" strokeWidth={2} />
              </View>
            </View>

            <View className="h-32 mb-4">
              <LineChart
                data={[pncTrend.hr24, pncTrend.day3, pncTrend.day7_14, pncTrend.day42]}
                color="#9333EA"
                labels={["24h", "3d", "14d", "42d"]}
              />
            </View>
          </View>
        </View>

        <View className="flex-row px-5 mt-6 gap-4">
          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-50"
          >
            <View className="bg-red-50 w-10 h-10 rounded-2xl items-center justify-center mb-4">
              <Activity size={20} color="#EF4444" strokeWidth={2} />
            </View>
            <Text className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Maternal Deaths</Text>
            <Text className="text-[#1E293B] text-2xl font-semibold mt-1">{maternalDeathCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-50"
          >
            <View className="bg-indigo-50 w-10 h-10 rounded-2xl items-center justify-center mb-4">
              <Baby size={20} color="#4F46E5" strokeWidth={2} />
            </View>
            <Text className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Newborn Deaths</Text>
            <Text className="text-[#1E293B] text-2xl font-semibold mt-1">{newbornDeathCount}</Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-4">
          <TouchableOpacity
            activeOpacity={0.9}
            className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex-row items-center"
          >
            <View className="bg-pink-50 w-12 h-12 rounded-2xl items-center justify-center mr-5">
              <Baby size={24} color="#EC4899" strokeWidth={2} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Child Deaths (28d - 59m)</Text>
              <Text className="text-[#1E293B] text-2xl font-semibold mt-1">{childDeathCount}</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View className="px-5 mt-8">
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <View className="mb-8">
              <Text className="text-slate-800 text-lg font-semibold">Newborn Mortality Analysis</Text>
              <Text className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Causes of death (within 28 days)</Text>
            </View>

            {newbornDeathCount > 0 ? (
              <View className="py-2">
                <PieChart data={newbornStats} />
              </View>
            ) : (
              <View className="py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 items-center">
                <Text className="text-slate-400 font-medium text-xs">No Data Recorded</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-5 mt-6">
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <View className="mb-8">
              <Text className="text-slate-800 text-lg font-semibold">Child Mortality Analysis</Text>
              <Text className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Child death analysis (28d - 59m)</Text>
            </View>

            {childDeathCount > 0 ? (
              <View className="py-2">
                <PieChart data={childStats} />
              </View>
            ) : (
              <View className="py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 items-center">
                <Text className="text-slate-400 font-medium text-xs">No Data Recorded</Text>
              </View>
            )}
          </View>
        </View>

        <View className="px-5 mt-6">
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-slate-800 text-lg font-semibold">Newborn Mortality Trends</Text>
                <Text className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Monthly gender-based trends</Text>
              </View>
              <View className="bg-indigo-50 w-8 h-8 rounded-xl items-center justify-center">
                <TrendingUp size={16} color="#4F46E5" strokeWidth={2} />
              </View>
            </View>

            <MultiLineChart 
              data={newbornTrend} 
              colors={{ male: '#0D9488', female: '#7C3AED' }} 
              labels={newbornTrend.map(t => t.label)} 
            />
          </View>
        </View>

        <View className="px-5 mt-6">
          <View className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-slate-800 text-lg font-semibold">Child Mortality Trends</Text>
                <Text className="text-slate-400 font-medium text-[10px] uppercase tracking-widest mt-1">Monthly gender-based trends</Text>
              </View>
              <View className="bg-pink-50 w-8 h-8 rounded-xl items-center justify-center">
                <TrendingUp size={16} color="#EC4899" strokeWidth={2} />
              </View>
            </View>

            <MultiLineChart 
              data={childTrend} 
              colors={{ male: '#0D9488', female: '#7C3AED' }} 
              labels={childTrend.map(t => t.label)} 
            />
          </View>
        </View>

        {/* To-Do List Section */}
        <View className="px-5 mt-10">
          <View className="flex-row justify-between items-center mb-6 px-1">
            <View>
              <Text className="text-[#1E293B] text-lg font-semibold">My Tasks</Text>
              <Text className="text-gray-400 font-medium text-[10px] uppercase tracking-wider mt-1">मेरो कार्य सूची</Text>
            </View>
            <View className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
              <Text className="text-emerald-600 font-semibold text-[10px] uppercase tracking-widest">
                {todos.filter(t => !t.is_completed).length} Pending
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-6 gap-3">
            <View className="flex-1 bg-white border border-gray-100 rounded-2xl h-14 px-4 flex-row items-center shadow-sm">
              <TextInput
                ref={todoInputRef}
                className="flex-1 text-[#1E293B] font-medium"
                placeholder="Add a new task..."
                placeholderTextColor="#94A3B8"
                value={newTodo}
                onChangeText={setNewTodo}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                if (newTodo.trim()) {
                  addTodo(newTodo.trim());
                  setNewTodo("");
                }
              }}
              className="bg-primary w-14 h-14 rounded-2xl items-center justify-center shadow-sm"
            >
              <Plus size={24} color="white" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {todos.map((todo) => (
            <TodoItemRow
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo(todo.id, todo.is_completed)}
              onDelete={() => removeTodo(todo.id)}
              onEdit={(text: string) => editTodo(todo.id, text)}
              isEditing={editingTodoId === todo.id}
              setEditingId={setEditingTodoId}
            />
          ))}

          {todos.length === 0 && (
            <View className="bg-white rounded-3xl p-10 items-center justify-center border border-gray-100 border-dashed">
              <Text className="text-gray-400 font-medium text-sm">No tasks added yet</Text>
            </View>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const TodoItemRow = ({ todo, onToggle, onDelete, onEdit, isEditing, setEditingId }: any) => {
  const [text, setText] = useState(todo.task);
  const [lastTap, setLastTap] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      // Double tap -> Edit
      setEditingId(todo.id);
      setLastTap(0);
    } else {
      // Single tap -> Toggle Full Info
      setLastTap(now);
      setTimeout(() => {
        // Only toggle if no double tap followed
        if (Date.now() - now >= DOUBLE_TAP_DELAY) {
          setIsExpanded(!isExpanded);
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleTap}
      className={`bg-white p-4 rounded-3xl mb-3 flex-row items-start border border-gray-100 ${todo.is_completed ? 'opacity-60' : 'shadow-sm'}`}
    >
      <TouchableOpacity
        onPress={onToggle}
        className={`w-9 h-9 rounded-xl items-center justify-center mr-4 ${todo.is_completed ? 'bg-emerald-500' : 'bg-gray-50 border border-gray-100'}`}
      >
        <CheckCircle size={18} color={todo.is_completed ? "white" : "#CBD5E1"} strokeWidth={2} />
      </TouchableOpacity>

      <View className="flex-1">
        {isEditing ? (
          <TextInput
            autoFocus
            className="text-[#1E293B] text-base font-semibold p-0"
            value={text}
            onChangeText={setText}
            onBlur={() => {
              onEdit(text);
              setEditingId(null);
            }}
            onSubmitEditing={() => {
              onEdit(text);
              setEditingId(null);
            }}
          />
        ) : (
          <Text
            className={`text-[#1E293B] text-base font-semibold leading-6 ${todo.is_completed ? 'line-through text-gray-400' : ''}`}
            numberOfLines={isExpanded ? undefined : 1}
          >
            {todo.task}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={onDelete} className="p-2 ml-2">
        <Trash2 size={16} color="#F43F5E" strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const ScheduleList = ({ data }: { data: VisitListItem[] }) => {
  const [showAll, setShowAll] = useState(false);

  if (data.length === 0) {
    return (
      <View className="bg-white rounded-3xl p-8 items-center justify-center mt-4 border border-gray-50 border-dashed">
        <Text className="text-gray-400 font-bold">No recent activities found</Text>
      </View>
    );
  }

  const visible = showAll ? data : data.slice(0, 3);

   return (
    <View className="mt-4">
      <View className="mb-4">
        <Text className="text-[#1E293B] text-lg font-semibold px-1">Recent Activities</Text>
        <Text className="text-gray-400 font-medium text-[10px] uppercase tracking-wider px-1 mt-1">हालका गतिविधिहरू</Text>
      </View>
      {visible.map((item) => {
        const dateObj = new Date(item.visit_date);
        const day = dateObj.getDate().toString();
        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.75}
            onPress={() => { }}
            className="bg-white rounded-3xl p-4 flex-row items-center mb-4 shadow-sm border border-gray-50"
          >
            <View className="bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center w-14 h-14 mr-4">
              <Text className="text-primary font-bold text-[10px] uppercase tracking-wider">{month}</Text>
              <Text className="text-[#1E293B] text-xl font-semibold leading-tight">{day}</Text>
            </View>

            <View className="flex-1">
              <Text className="text-[#1E293B] text-base font-semibold">{item.name}</Text>
              <Text className="text-gray-500 font-medium text-xs mt-0.5">
                {item.visit_type} Follow-up
              </Text>
            </View>

            <View className="p-2 rounded-xl bg-blue-50">
              <ChevronRight size={18} color="#3B82F6" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        );
      })}

      {data.length > 3 && (
        <TouchableOpacity
          onPress={() => setShowAll(!showAll)}
          className="items-center py-3 bg-white rounded-2xl mt-2 border border-gray-100"
        >
          <Text className="text-primary font-semibold text-xs uppercase tracking-widest">
            {showAll ? "Show Less" : `View ${data.length - 3} More`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
