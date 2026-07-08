import { Button } from "@/components/button";
import CustomHeader from "@/components/CustomHeader";
import { InputText } from "@/components/InputText";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import {
  createAdolescentIfa,
  getAdolescentIfaById,
} from "@/hooks/database/models/AdolescentIfaModel";
import * as Crypto from "expo-crypto";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdolescentRegistrationForm() {
  const { id, from, detailsFrom, detailsFromTab } = useLocalSearchParams<{ id: string; from: string; detailsFrom: string; detailsFromTab: string }>();
  const { showToast } = useToast();
  const router = useRouter();
  const { language, t } = useLanguage()

  const [name, setName] = useState("");
  const [ageGroup, setAgeGroup] = useState<"10-14" | "15-19">("10-14");
  const [remarks, setRemarks] = useState("");

  // Phase 1 Weeks (1 to 13)
  const [p1Weeks, setP1Weeks] = useState<boolean[]>(Array(13).fill(false));
  // Phase 2 Weeks (1 to 13)
  const [p2Weeks, setP2Weeks] = useState<boolean[]>(Array(13).fill(false));

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const record = await getAdolescentIfaById(id);
          if (record) {
            setName(record.name || "");
            setAgeGroup((record.age_group as any) || "10-14");
            setRemarks(record.remarks || "");

            // Set Phase 1 Weeks
            const p1 = Array(13).fill(false);
            for (let i = 1; i <= 13; i++) {
              p1[i - 1] = (record as any)[`phase1_week_${i}`] === 1;
            }
            setP1Weeks(p1);

            // Set Phase 2 Weeks
            const p2 = Array(13).fill(false);
            for (let i = 1; i <= 13; i++) {
              p2[i - 1] = (record as any)[`phase2_week_${i}`] === 1;
            }
            setP2Weeks(p2);
          }
        } catch (err) {
          console.error("Error loading record:", err);
        }
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
  }, [router]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) {
      e.name = t("adolescent_page.errors.name_required");
    }
    return e;
  };

  const handleSave = async () => {
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      // Calculate phase completion status
      const phase1Completed = p1Weeks.every((w) => w) ? 1 : 0;
      const phase2Completed = p2Weeks.every((w) => w) ? 1 : 0;

      const payload: any = {
        id: id || Crypto.randomUUID(),
        name: name,
        age_group: ageGroup,
        phase1_completed: phase1Completed,
        phase2_completed: phase2Completed,
        remarks: remarks,
      };

      // Add dynamic weekly variables
      p1Weeks.forEach((val, idx) => {
        payload[`phase1_week_${idx + 1}`] = val ? 1 : 0;
      });
      p2Weeks.forEach((val, idx) => {
        payload[`phase2_week_${idx + 1}`] = val ? 1 : 0;
      });

      await createAdolescentIfa(payload);
      showToast(t("adolescent_page.form.messages.save_success"));
      router.back();
    } catch (error) {
      console.error(error);
      showToast(t("adolescent_page.form.messages.save_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeek = (phase: 1 | 2, index: number) => {
    if (phase === 1) {
      const updated = [...p1Weeks];
      updated[index] = !updated[index];
      setP1Weeks(updated);
    } else {
      const updated = [...p2Weeks];
      updated[index] = !updated[index];
      setP2Weeks(updated);
    }
  };

  // Toggles the entire phase state based on the "Yes/No" capsule switch
  const handlePhaseCompleteToggle = (phase: 1 | 2, completed: boolean) => {
    if (phase === 1) {
      setP1Weeks(Array(13).fill(completed));
    } else {
      setP2Weeks(Array(13).fill(completed));
    }
  };

  const p1Completed = p1Weeks.every((w) => w);
  const p2Completed = p2Weeks.every((w) => w);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingBottom: 60,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader
        title={
          id
            ? t("adolescent_page.edit_title")
            : t("adolescent_page.new_title")
        }
        onBackPress={() => router.back()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
      >
        <View style={{ paddingHorizontal: 20 }}>
          {/* Adolescent Name */}
          <InputText
            label={t("adolescent_page.form.name")}
            placeholder={t("adolescent_page.form.name_placeholder")}
            value={name}
            onChangeText={setName}
            errors={errors}
            setErrors={setErrors}
            errorKey="name"
          />

          {/* Age Group Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#334155",
                fontSize: 16,
                fontWeight: "500",
                marginBottom: 8,
              }}
            >
              {t("adolescent_page.age_group")}
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAgeGroup("10-14")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 52,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: ageGroup === "10-14" ? "#475569" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: ageGroup === "10-14" ? "#475569" : "#94A3B8",
                    marginRight: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ageGroup === "10-14" && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#475569",
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#334155",
                  }}
                >
                  10 - 14 {t("adolescent_page.years")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAgeGroup("15-19")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 52,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: ageGroup === "15-19" ? "#475569" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: ageGroup === "15-19" ? "#475569" : "#94A3B8",
                    marginRight: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ageGroup === "15-19" && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#475569",
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#334155",
                  }}
                >
                  15 - 19 {t("adolescent_page.years")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phase 1 (पहिलो चरण) */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#655940", // Olive/brown tone
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              {t("adolescent_page.form.phase1")}
            </Text>

            <View style={{ height: 1, backgroundColor: "#F1F5F9", marginBottom: 15 }} />

            {/* Custom Yes/No sliding capsule for 13 Weeks Completed */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                backgroundColor: "#F4F4F5",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
              }}
            >
              <Text
                style={{ color: "#475569", fontSize: 15, fontWeight: "500" }}
              >
                {t("adolescent_page.form.phase1_total")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#E2E8F0",
                  borderRadius: 20,
                  padding: 3,
                  width: 110,
                  height: 34,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePhaseCompleteToggle(1, false)}
                  style={{
                    flex: 1,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: !p1Completed ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: !p1Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {t("adolescent_page.form.no")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePhaseCompleteToggle(1, true)}
                  style={{
                    flex: 1,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: p1Completed ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: p1Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {t("adolescent_page.form.yes")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 13 Weekly Checkboxes in a neat grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              {Array.from({ length: 13 }).map((_, idx) => {
                const isChecked = p1Weeks[idx];
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => toggleWeek(1, idx)}
                    style={{
                      width: "22.5%",
                      height: 48,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: isChecked ? "#10B981" : "#E2E8F0",
                      backgroundColor: isChecked ? "#ECFDF5" : "#FFFFFF",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isChecked ? "#047857" : "#475569",
                      }}
                    >
                      W{idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Phase 2 (दोस्रो चरण) */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#655940", // Olive/brown tone
                fontSize: 15,
                fontWeight: "600",
              }}
            >
              {t("adolescent_page.form.phase2")}
            </Text>

            <View style={{ height: 1, backgroundColor: "#F1F5F9", marginBottom: 15 }} />

            {/* Custom Yes/No toggle capsule for 26 Weeks Completed */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                backgroundColor: "#F4F4F5",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
              }}
            >
              <Text
                style={{ color: "#475569", fontSize: 15, fontWeight: "500" }}
              >
                {t("adolescent_page.form.phase2_total")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#E2E8F0",
                  borderRadius: 20,
                  padding: 3,
                  width: 110,
                  height: 34,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePhaseCompleteToggle(2, false)}
                  style={{
                    flex: 1,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: !p2Completed ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: !p2Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {t("adolescent_page.form.no")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePhaseCompleteToggle(2, true)}
                  style={{
                    flex: 1,
                    borderRadius: 17,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: p2Completed ? "#FFFFFF" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: p2Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {t("adolescent_page.form.yes")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 13 Weekly Checkboxes */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              {Array.from({ length: 13 }).map((_, idx) => {
                const isChecked = p2Weeks[idx];
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => toggleWeek(2, idx)}
                    style={{
                      width: "22.5%",
                      height: 48,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: isChecked ? "#10B981" : "#E2E8F0",
                      backgroundColor: isChecked ? "#ECFDF5" : "#FFFFFF",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: isChecked ? "#047857" : "#475569",
                      }}
                    >
                      W{idx + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Remarks */}
          <InputText
            label={t("adolescent_page.form.remarks")}
            placeholder={t("adolescent_page.form.remarks_placeholder")}
            value={remarks}
            onChangeText={setRemarks}
            errors={errors}
            setErrors={setErrors}
            errorKey="remarks"
            multiline={true}
            numberOfLines={4}
          />

          {/* Save Button */}
          <Button
            onPress={handleSave}
            isLoading={isLoading}
            title={t("adolescent_page.form.buttons.save")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
