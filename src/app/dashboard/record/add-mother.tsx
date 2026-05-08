import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { User, Baby } from "lucide-react-native";
import "../../../global.css";
import CustomHeader from "../../../components/CustomHeader";
import MotherForm from "../../../components/MotherForm";
import PregnancyForm from "../../../components/PregnancyForm";
import { useLanguage } from "../../../context/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TabIndicator = ({
  step,
  setStep,
}: {
  step: number;
  setStep: (s: number) => void;
}) => {
  const { t } = useLanguage();
  const tabs = [
    { icon: User, label: t("add_mother.tabs.mother_info") },
    { icon: Baby, label: t("add_mother.tabs.pregnancy") },
  ];

  return (
    <View className="flex-row items-center justify-center bg-white px-4 py-2 gap-3">
      {tabs.map((t, i) => {
        const isActive = i === step;
        const Icon = t.icon;
        
        return (
          <TouchableOpacity 
            key={i}
            activeOpacity={0.8}
            onPress={() => setStep(i)}
            className={`flex-1 flex-row items-center justify-center py-3 ${isActive ? 'border-b border-blue-200' : 'border border-transparent'}`}
          >
            <Icon size={20} color={isActive ? "#3B82F6" : "#94A3B8"} strokeWidth={isActive ? 2.5 : 2} />
            <Text className={`ml-2 font-semibold ${isActive ? 'text-[#3B82F6]' : 'text-gray-400'}`}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function AddMotherScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id, step: initialStep } = useLocalSearchParams<{ id: string, step?: string }>();
  const [step, setStep] = useState(initialStep === "1" ? 1 : 0);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Smooth sliding animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: step === 0 ? 0 : -SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [step]);

  return (
    <SafeAreaView className="flex-1 bg-white pt-8">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <CustomHeader
        title={id ? t("add_mother.title_edit") : t("add_mother.title_new")}
        subtitle=""
        onBackPress={()=> router.back()}
      />

      {/* Tab Indicator */}
      <TabIndicator step={step} setStep={setStep} />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            flexDirection: "row",
            width: SCREEN_WIDTH * 2,
            transform: [{ translateX: slideAnim }],
          }}
        >
            <ScrollView
              className="flex-1 bg-white"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 120,
                paddingHorizontal: 17,
              }}
              keyboardShouldPersistTaps="handled" 
            >
                <MotherForm 
                key={id ? `edit-${id}` : `new-${createdId || 'init'}`}
                id={id} 
                onSuccess={(newId) => {
                  if (!id) {
                    setCreatedId(newId);
                  }
                  setStep(1);
                }}
              />
            </ScrollView>

            <ScrollView
              className="flex-1 bg-white"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 120,
                paddingHorizontal: 17,
              }}
              keyboardShouldPersistTaps="handled" 
            >
              <PregnancyForm id={id || createdId || undefined} onSwitchToMother={() => setStep(0)} />
            </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
