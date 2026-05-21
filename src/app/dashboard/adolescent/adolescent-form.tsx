import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
} from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useToast } from "@/context/ToastContext";
import {
  createAdolescentIfa,
  getAdolescentIfaById,
} from "@/hooks/database/models/AdolescentIfaModel";
import CustomHeader from "@/components/CustomHeader";
import { useTranslation } from "react-i18next";

export default function AdolescentRegistrationForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isNp = i18n.language === "np";

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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())
      e.name = isNp ? "किशोरीको नाम आवश्यक छ" : "Name is required";
    return e;
  };

  const handleSave = async () => {
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      return;
    }

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
      showToast(
        isNp
          ? "रेकर्ड सफलतापूर्वक सुरक्षित गरियो"
          : "Record saved successfully",
      );
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(
        isNp ? "त्रुटि" : "Error",
        isNp ? "रेकर्ड सेभ गर्न असफल भयो।" : "Failed to save record.",
      );
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
        backgroundColor: "#F8FAFC",
        paddingBottom: 60,
        paddingTop: 25,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <CustomHeader
        title={
          id
            ? isNp
              ? "किशोरी विवरण सम्पादन"
              : "Edit Adolescent"
            : isNp
              ? "किशोरी लक्षित आइरन फोलिक एसिड वितरण"
              : "Adolescent IFA Form"
        }
        onBackPress={() => router.back()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          {/* Adolescent Name */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: "#334155",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 8,
              }}
            >
              {isNp ? "किशोरीको नाम" : "Adolescent's Name"}
            </Text>
            <TextInput
              style={{
                height: 52,
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: errors.name ? "#FDA4AF" : "#E2E8F0",
                paddingHorizontal: 16,
                fontSize: 15,
                color: "#1E293B",
              }}
              placeholder={isNp ? "पूरा नाम लेख्नुहोस्" : "Enter Full Name"}
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
            />
            {errors.name && (
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: 12,
                  marginTop: 4,
                  marginLeft: 2,
                }}
              >
                {errors.name}
              </Text>
            )}
          </View>

          {/* Age Group Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#334155",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 8,
              }}
            >
              {isNp ? "उमेर समूह (वर्ष)" : "Age Group (Years)"}
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
                  borderColor: ageGroup === "10-14" ? "#7C3AED" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: ageGroup === "10-14" ? 5 : 1,
                    borderColor: ageGroup === "10-14" ? "#7C3AED" : "#94A3B8",
                    marginRight: 10,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: ageGroup === "10-14" ? "#7C3AED" : "#475569",
                  }}
                >
                  10 - 14 {isNp ? "वर्ष" : "Years"}
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
                  borderColor: ageGroup === "15-19" ? "#7C3AED" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: ageGroup === "15-19" ? 5 : 1,
                    borderColor: ageGroup === "15-19" ? "#7C3AED" : "#94A3B8",
                    marginRight: 10,
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: ageGroup === "15-19" ? "#7C3AED" : "#475569",
                  }}
                >
                  15 - 19 {isNp ? "वर्ष" : "Years"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phase 1 (पहिलो चरण) */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#1C5D3A",
                fontSize: 15,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              {isNp ? "पहिलो चरण (साउन - असोज)" : "Phase 1 (Shrawan - Ashwin)"}
            </Text>

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

            {/* Custom Yes/No sliding capsule for 13 Weeks Completed */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <Text
                style={{ color: "#475569", fontSize: 14, fontWeight: "500" }}
              >
                {isNp ? "१३ हप्ता खाएको छ?" : "13 Weeks Intake Completed?"}
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
                      fontSize: 12,
                      fontWeight: "600",
                      color: !p1Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {isNp ? "छैन" : "No"}
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
                      fontSize: 12,
                      fontWeight: "600",
                      color: p1Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {isNp ? "छ" : "Yes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Phase 2 (दोस्रो चरण) */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#1C5D3A",
                fontSize: 15,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              {isNp ? "दोस्रो चरण (माघ - चैत)" : "Phase 2 (Magh - Chaitra)"}
            </Text>

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

            {/* Custom Yes/No toggle capsule for 26 Weeks Completed */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <Text
                style={{ color: "#475569", fontSize: 14, fontWeight: "500" }}
              >
                {isNp ? "२६ हप्ता पूरा खाएको छ?" : "26 Weeks Total Completed?"}
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
                      fontSize: 12,
                      fontWeight: "600",
                      color: !p2Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {isNp ? "छैन" : "No"}
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
                      fontSize: 12,
                      fontWeight: "600",
                      color: p2Completed ? "#1E293B" : "#64748B",
                    }}
                  >
                    {isNp ? "छ" : "Yes"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Remarks */}
          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                color: "#334155",
                fontSize: 14,
                fontWeight: "500",
                marginBottom: 8,
              }}
            >
              {isNp ? "Remarks" : "Remarks"}
            </Text>
            <TextInput
              style={{
                minHeight: 100,
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                paddingHorizontal: 16,
                paddingTop: 12,
                fontSize: 15,
                color: "#1E293B",
                textAlignVertical: "top",
              }}
              placeholder={isNp ? "Enter remarks here" : "Enter remarks here"}
              placeholderTextColor="#94A3B8"
              value={remarks}
              onChangeText={setRemarks}
              multiline={true}
              numberOfLines={4}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={isLoading}
            className="py-4 px-6 bg-primary/80 rounded-xl items-center justify-center"
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
              {isLoading
                ? isNp
                  ? "सुरक्षित गर्दै..."
                  : "Saving..."
                : isNp
                  ? "सेभ गर्नुहोस्"
                  : "Save Record"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
