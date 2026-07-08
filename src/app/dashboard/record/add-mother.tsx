import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Baby, User } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
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
            className={`flex-1 flex-row items-center justify-center py-3 ${isActive ? "border-b border-blue-200" : "border border-transparent"}`}
          >
            <Icon
              size={20}
              color={isActive ? "#475569" : "#7f8b9bff"}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text
              className={`ml-2 font-semibold text-md ${isActive ? "text-[#475569] text-lg" : "text-gray-500"}`}
            >
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
  const {
    id,
    step: initialStep,
    from,
    mode,
  } = useLocalSearchParams<{
    id: string;
    step?: string;
    from?: string;
    mode?: string;
  }>();
  const [step, setStep] = useState(initialStep === "1" ? 1 : 0);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Reset to the Mother tab each time the screen comes into focus,
  // unless the URL explicitly requests the pregnancy tab (step=1).
  // This fixes the issue where the previously selected pregnancy tab
  // persisted after navigating away and back (component instance reuse).
  useFocusEffect(
    useCallback(() => {
      setStep(initialStep === "1" ? 1 : 0);
    }, [initialStep]),
  );

  // Smooth sliding animation — initialize directly to avoid flash when starting at step 1
  const slideAnim = useRef(new Animated.Value(initialStep === "1" ? -SCREEN_WIDTH : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: step === 0 ? 0 : -SCREEN_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [step]);

  const handleBackPress = useCallback(() => {
    if (from === "profile" && id) {
      router.replace({
        pathname: "/dashboard/profile",
        params: { id },
      } as any);
    } else if (step === 1 && !id) {
      setStep(0);
    } else {
      router.replace("/dashboard");
    }
    return true;
  }, [from, id, step, router]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );
    return () => backHandler.remove();
  }, [handleBackPress]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <CustomHeader
        title={id ? t("add_mother.title_edit") : t("add_mother.title_new")}
        subtitle=""
        onBackPress={handleBackPress}
      />

      {/* Tab Indicator */}
      <TabIndicator step={step} setStep={setStep} />

      <View className="flex-1">
        <Animated.View
          style={{
            flex: 1,
            flexDirection: "row",
            width: SCREEN_WIDTH * 2,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <KeyboardAwareScrollView
            className="flex-1 bg-white"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={100}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingHorizontal: 17,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <MotherForm
              key={id ? `edit-${id}` : `new-${createdId || "init"}`}
              id={id}
              onSuccess={(newId) => {
                if (!id) {
                  setCreatedId(newId);
                }
                setStep(1);
              }}
            />
          </KeyboardAwareScrollView>

          <KeyboardAwareScrollView
            className="flex-1 bg-white"
            showsVerticalScrollIndicator={false}
            enableOnAndroid={true}
            extraScrollHeight={100}
            contentContainerStyle={{
              paddingBottom: 120,
              paddingHorizontal: 17,
            }}
            keyboardShouldPersistTaps="always"
          >
            <PregnancyForm
              id={id || createdId || undefined}
              from={from}
              mode={mode}
              lockMotherSelection={Boolean(id)}
              onSwitchToMother={() => setStep(0)}
            />
          </KeyboardAwareScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
