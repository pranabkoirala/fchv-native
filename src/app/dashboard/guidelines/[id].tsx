import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useLanguage } from "@/context/LanguageContext";
import CustomHeader from "@/components/CustomHeader";
import learnContent from "@/assets/data/learnContent.json";
import { FileText, Activity, Heart, Baby, HeartPulse, Stethoscope, Users, Droplet, Syringe, Brain, ChevronDown, ChevronUp } from "lucide-react-native";
import AppSegmentedControl from "@/components/common/AppSegmentedControl";

const SWIPE_THRESHOLD = 60;

const CONFIG: Record<string, any> = {
  maternal_health: { icon: HeartPulse, color: "#10B981", bg: "bg-emerald-100", image: require("@/assets/images/maternal_care.png") },
  first_trimester_detailed: { icon: Heart, color: "#F43F5E", bg: "bg-rose-100" },
  second_trimester_detailed: { icon: Heart, color: "#8B5CF6", bg: "bg-violet-100" },
  third_trimester_detailed: { icon: Activity, color: "#EC4899", bg: "bg-pink-100" },
  child_nutrition: { icon: FileText, color: "#3B82F6", bg: "bg-blue-100", image: require("@/assets/images/child_nutrition.png") },
  checkups: { icon: Activity, color: "#E11D48", bg: "bg-pink-100", image: require("@/assets/images/anc.png") },
  anc: { icon: Activity, color: "#EC4899", bg: "bg-pink-100", image: require("@/assets/images/anc.png") },
  pnc: { icon: Heart, color: "#8B5CF6", bg: "bg-violet-100", image: require("@/assets/images/pnc.png") },
  baby_care: { icon: Baby, color: "#06B6D4", bg: "bg-cyan-100", image: require("@/assets/images/newborn_care.png") },
  birth_prep: { icon: Stethoscope, color: "#3B82F6", bg: "bg-blue-100" },
  family_planning: { icon: Users, color: "#8B5CF6", bg: "bg-purple-100" },
  breastfeeding: { icon: Droplet, color: "#22C55E", bg: "bg-green-100" },
  vaccination: { icon: Syringe, color: "#3B82F6", bg: "bg-blue-100" },
  mental_health: { icon: Brain, color: "#8B5CF6", bg: "bg-purple-100" },
};

const TRIMESTER_COLORS = [
  { accent: "#10B981", border: "#10B981", dot: "#10B981", activeText: "#10B981", activeBg: "#10B981" },
  { accent: "#10B981", border: "#10B981", dot: "#10B981", activeText: "#10B981", activeBg: "#10B981" },
  { accent: "#10B981", border: "#10B981", dot: "#10B981", activeText: "#10B981", activeBg: "#10B981" },
];

const ExpandablePointsCard = ({ points, renderMarkdown }: any) => {
  const [expanded, setExpanded] = useState(false);

  if (!points || points.length === 0) return null;

  const firstPoint = points[0];
  const restPoints = points.slice(1);

  return (
    <View className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-2">
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)} 
        activeOpacity={0.7}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-1 mr-3">
           <Text className="text-[14px] text-gray-800 leading-6" numberOfLines={expanded ? undefined : 3}>
             {renderMarkdown(firstPoint)}
           </Text>
           {!expanded && <Text className="text-[12px] text-blue-500 mt-1 font-bold">Tap to see more details...</Text>}
        </View>
        {expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
      </TouchableOpacity>
      
      {expanded && restPoints.length > 0 && (
        <View className="px-4 pb-4 gap-3 bg-gray-50 pt-4 border-t border-gray-100">
          {restPoints.map((point: string, pIdx: number) => (
            <View key={pIdx} className="flex-row">
              <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <Text className="text-[14px] text-gray-700 ml-3 flex-1 leading-6">
                {renderMarkdown(point)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const ExpandableMethodCard = ({ title, points, renderMarkdown }: any) => {
  const [expanded, setExpanded] = useState(false);

  if (!points || points.length === 0) return null;

  const firstPoint = points[0];
  const restPoints = points.slice(1);

  return (
    <View className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-3">
      <TouchableOpacity 
        onPress={() => setExpanded(!expanded)} 
        activeOpacity={0.7}
        className="p-4 flex-row items-center justify-between"
      >
        <View className="flex-1 mr-3">
           <Text className="text-[15px] font-bold text-gray-800 leading-6">
             {title}
           </Text>
           <Text className="text-[14px] text-gray-600 mt-1 leading-6" numberOfLines={expanded ? undefined : 2}>
             {renderMarkdown(firstPoint)}
           </Text>
        </View>
        {expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
      </TouchableOpacity>
      
      {expanded && restPoints.length > 0 && (
        <View className="px-4 pb-4 gap-3 bg-gray-50 pt-4 border-t border-gray-100">
          {restPoints.map((point: string, pIdx: number) => (
            <View key={pIdx} className="flex-row">
              <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <Text className="text-[14px] text-gray-700 ml-3 flex-1 leading-6">
                {renderMarkdown(point)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function GuidelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Use a ref to track activeTab for PanResponder (avoids stale closure)
  const activeTabRef = useRef(0);

  const switchTab = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex > 2) return;
    const direction = newIndex > activeTabRef.current ? -1 : 1;

    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction * 30, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      activeTabRef.current = newIndex;
      setActiveTab(newIndex);
      slideAnim.setValue(-direction * 30);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const isMaternalHealth = id === "maternal_health";
  const isCheckups = id === "checkups";
  const isTabsView = isMaternalHealth || isCheckups;
  const maxTabs = isMaternalHealth ? 2 : (isCheckups ? 1 : 0);

  // PanResponder for swipe gestures — operates at JS level, no conflict with React Navigation
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal swipes (not vertical scrolling)
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 1.5) && Math.abs(gestureState.dx) > 15;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD && activeTabRef.current < maxTabs) {
          switchTab(activeTabRef.current + 1);
        } else if (gestureState.dx > SWIPE_THRESHOLD && activeTabRef.current > 0) {
          switchTab(activeTabRef.current - 1);
        }
      },
    })
  ).current;

  const dataPrefix = isCheckups ? null : (learnContent as any)[id as string];
  const langKey = language === "np" ? "np" : "en";
  const content: any = dataPrefix ? dataPrefix[langKey as keyof typeof dataPrefix] : null;
  const config = CONFIG[id as string] || CONFIG.maternal_health;

  if (!content && !isCheckups) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">{t("learn_details.content_not_found")}</Text>
        <TouchableOpacity onPress={() => router.push("/dashboard/guidelines")} className="mt-4 px-6 py-2 bg-blue-500 rounded-full">
          <Text className="text-white font-bold">{t("learn_details.go_back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const Icon = config.icon;

  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text key={index} className="font-bold text-gray-800">
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const tabData: any[] = isMaternalHealth
    ? [
        (learnContent as any)["first_trimester_detailed"]?.[langKey],
        (learnContent as any)["second_trimester_detailed"]?.[langKey],
        (learnContent as any)["third_trimester_detailed"]?.[langKey],
      ]
    : isCheckups
    ? [
        (learnContent as any)["anc"]?.[langKey],
        (learnContent as any)["pnc"]?.[langKey],
      ]
    : [];

  const tabTitles = isMaternalHealth
    ? [
        t("learn_details.trimesters.first"),
        t("learn_details.trimesters.second"),
        t("learn_details.trimesters.third"),
      ]
    : isCheckups
    ? [
        t("learn_page.guidelines.anc_checkup") || "ANC",
        t("learn_page.guidelines.pnc_checkup") || "PNC",
      ]
    : [];

  const activeTabData = tabData[activeTab];
  const activeColor = TRIMESTER_COLORS[activeTab] || TRIMESTER_COLORS[0];

  const pageTitle = isTabsView 
    ? activeTabData?.title || (isMaternalHealth ? t("learn_page.hero_title_np") : t("learn_page.guidelines.checkups"))
    : content?.title || t("learn_details.details");

  return (
    <View className="flex-1 bg-white pb-16">
      <CustomHeader 
        title={pageTitle}
        onBackPress={() => router.back()}
        className="pt-12 pb-4 px-5 border-b border-gray-100 bg-white"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Banner area */}
        <View className="items-center">
          {config.image ? (
            <Image source={config.image} className="w-full h-56 rounded-2xl mb-5" resizeMode="cover" />
          ) : (
            <View className={`w-20 h-20 ${config.bg} rounded-[24px] items-center justify-center mb-4`}>
              <Icon size={40} color={config.color} />
            </View>
          )}
        </View>
        
        {/* Title and Description */}
        {(!isTabsView && content?.title) && (
          <Text className="text-2xl font-bold text-gray-800 mb-2 ml-1 mt-2">
            {content.title}
          </Text>
        )}
        {(!isTabsView && content?.description) && (
          <Text className="text-[14px] text-gray-600 mb-6 ml-1 leading-6">
            {content.description}
          </Text>
        )}

        {/* Key Points */}
        {(!isTabsView && content?.key_points && content.key_points.length > 0) && (
          <>
            <Text className="text-md font-bold text-gray-800 mb-4 ml-1">
              {t("learn_details.key_points")}
            </Text>

            <View className="gap-3 mb-8">
              {content.key_points.map((point: string, index: number) => (
                <View key={index} className="flex-row bg-white border border-gray-100 p-4 rounded-xl">
                  <CheckCircle2 size={22} color="#10B981" className="mt-[2px]" />
                  <Text className="text-[14px] text-gray-700 ml-3 flex-1 leading-6">{renderMarkdown(point)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {isTabsView && tabData.length > 0 ? (
          <View>
            {isMaternalHealth && (
              <Text className="text-md font-bold text-gray-800 mb-4 ml-1">
                {t("learn_details.detailed_trimester_guide")}
              </Text>
            )}

            {/* Tab Bar */}
            <View className="mb-6 px-1">
              <AppSegmentedControl
                values={tabTitles}
                segmentIndex={activeTab}
                setSegmentIndex={switchTab}
                size="large"
              />
            </View>

            {/* Swipeable Tab Content */}
            <View {...panResponder.panHandlers}>
              {activeTabData ? (
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                  }}
                >
                  {isCheckups && activeTabData.title && (
                    <Text className="text-xl font-bold text-gray-800 mb-2 ml-1">
                      {activeTabData.title}
                    </Text>
                  )}
                  {isCheckups && activeTabData.description && (
                    <Text className="text-[14px] text-gray-600 mb-6 ml-1 leading-6">
                      {activeTabData.description}
                    </Text>
                  )}
                  {isMaternalHealth && activeTabData.title && (
                    <Text className="text-md font-bold text-gray-800 mb-2 ml-1">
                      {activeTabData.title}
                    </Text>
                  )}
                  {isMaternalHealth && activeTabData.description && (
                    <Text className="text-[13px] text-gray-600 mb-6 ml-1 leading-6">
                      {activeTabData.description}
                    </Text>
                  )}

                  {isCheckups && activeTabData.key_points && activeTabData.key_points.length > 0 && (
                    <View className="mb-6 mt-2">
                      <Text className="text-md font-bold text-gray-800 mb-3 ml-1">
                        {t("learn_details.key_points")}
                      </Text>
                      <View className="gap-3">
                        {activeTabData.key_points.map((point: string, index: number) => (
                          <View key={index} className="flex-row bg-white border border-gray-100 p-4 rounded-xl">
                            <CheckCircle2 size={22} color={activeColor.accent} className="mt-[2px]" />
                            <Text className="text-[14px] text-gray-700 ml-3 flex-1 leading-6">{renderMarkdown(point)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {activeTabData.sections?.map((section: any, idx: number) => (
                    <View key={`section-${activeTab}-${idx}`} className="mb-6">
                      <Text className="text-[15px] font-bold text-gray-800 mb-3 ml-1">
                        {(section.title || section.category || "").replace(/###\s*/g, "")}
                      </Text>
                      <View className="gap-2.5">
                        {section.points?.map((point: string, pIdx: number) => (
                          <View
                            key={`point-${activeTab}-${idx}-${pIdx}`}
                            className={`flex-row bg-white border border-gray-100 p-3.5 rounded-xl`}
                          >
                            <View className={`w-2 h-2 rounded-lg mt-2`} style={{ backgroundColor: activeColor.accent }} />
                            <Text className="text-[14px] text-gray-700 ml-3 flex-1 leading-6">
                              {renderMarkdown(point)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </Animated.View>
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-gray-400">{t("learn_details.no_content")}</Text>
                </View>
              )}
            </View>
          </View>
        ) : !isTabsView ? (
          <View>
            {content.sections?.map((section: any, idx: number) => (
              <View key={`section-${idx}`} className="mt-2 mb-6">
                <Text className="text-[15px] font-bold text-gray-800 mb-3 ml-1">
                  {(section.title || section.category || "").replace(/###\s*/g, "")}
                </Text>
                
                {section.methods ? (
                  <View className="gap-1">
                    {section.methods.map((method: any, mIdx: number) => (
                      <ExpandableMethodCard 
                        key={`method-${idx}-${mIdx}`} 
                        title={method.name} 
                        points={method.points} 
                        renderMarkdown={renderMarkdown} 
                      />
                    ))}
                  </View>
                ) : (section.title?.includes("i-Pill") || section.title?.includes("आकस्मिक")) ? (
                  <ExpandablePointsCard points={section.points} renderMarkdown={renderMarkdown} />
                ) : (
                  <View className="gap-2.5">
                    {section.points?.map((point: string, pIdx: number) => (
                      <View key={`point-${idx}-${pIdx}`} className="flex-row bg-white border border-gray-100 p-3.5 rounded-xl">
                        <View className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <Text className="text-[14px] text-gray-700 ml-3 flex-1 leading-6">
                          {renderMarkdown(point)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
