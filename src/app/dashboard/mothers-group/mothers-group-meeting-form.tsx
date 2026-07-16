import { getFchvData } from "@/api/services/fchv";
import { Button } from "@/components/button";
import CustomHeader from "@/components/CustomHeader";
import { useLanguage } from "@/context/LanguageContext";
import {
  createMothersGroupMeeting,
  updateMothersGroupMeeting,
} from "@/hooks/database/models/MothersGroupMeetingModel";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Check, MapPin, Minus, Plus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import municipalitiesData from "@/assets/json/municipalities.json";

export default function MothersGroupMeetingForm() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{
    id?: string;
    meeting_date?: string;
    meeting_location?: string;
    ward_no?: string;
    attendees_count?: string;
    discussed_topics?: string;
    decisions?: string;
    health_worker_available?: string;
    health_worker_name?: string;
    from?: string;
  }>();

  const isEditMode = !!params.id;

  const [meetingDateBS, setMeetingDateBS] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [location, setLocation] = useState("");
  const [wardNo, setWardNo] = useState("1");
  const [attendees, setAttendees] = useState(0);

  const [totalWards, setTotalWards] = useState(15);

  const [topicInput, setTopicInput] = useState("");
  const [topics, setTopics] = useState<string[]>([]);

  const [decisionInput, setDecisionInput] = useState("");
  const [decisions, setDecisions] = useState<string[]>([]);

  const [healthWorkerAvailable, setHealthWorkerAvailable] = useState(false);
  const [healthWorkerName, setHealthWorkerName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    if (params.meeting_date) {
      setMeetingDateBS(params.meeting_date);
    }
    if (params.meeting_location) setLocation(params.meeting_location);
    if (params.ward_no) setWardNo(params.ward_no);
    if (params.attendees_count)
      setAttendees(parseInt(params.attendees_count, 10) || 0);
    if (params.discussed_topics) {
      try {
        setTopics(JSON.parse(params.discussed_topics));
      } catch {}
    }
    if (params.decisions) {
      try {
        setDecisions(JSON.parse(params.decisions));
      } catch {}
    }
    if (params.health_worker_available) {
      setHealthWorkerAvailable(params.health_worker_available === "true");
    }
    if (params.health_worker_name) {
      setHealthWorkerName(params.health_worker_name);
    }
  }, [params.id]);

  useEffect(() => {
    const backAction = () => {
      router.back();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const fchvData = await getFchvData();
        if (fchvData?.address?.municipality?.id) {
          for (const p of municipalitiesData as any[]) {
            for (const d of p.districts || []) {
              const m = (d.municipalities || []).find(
                (mu: any) => mu.id === fchvData.address.municipality.id,
              );
              if (m) {
                const count = m.wards?.length || 15;
                setTotalWards(count);
                setWardNo((prev) =>
                  parseInt(prev) > count ? String(count) : prev,
                );
                return;
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching FCHV data for ward count", e);
      }
    })();
  }, []);

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleAddDecision = () => {
    if (decisionInput.trim()) {
      setDecisions([...decisions, decisionInput.trim()]);
      setDecisionInput("");
    }
  };

  const handleRemoveDecision = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setMeetingDateBS("");
    setLocation("");
    setWardNo("1");
    setAttendees(0);
    setTopicInput("");
    setTopics([]);
    setDecisionInput("");
    setDecisions([]);
    setHealthWorkerAvailable(false);
    setHealthWorkerName("");
  };

  const onSubmit = async () => {
    if (!meetingDateBS || !location) {
      alert(t("mothers_group_meeting.form_error"));
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        meeting_date: meetingDateBS,
        meeting_location: location,
        ward_no: wardNo,
        attendees_count: attendees,
        discussed_topics: topics,
        decisions: decisions,
        health_worker_available: healthWorkerAvailable,
        health_worker_name: healthWorkerName,
      };

      if (isEditMode && params.id) {
        await updateMothersGroupMeeting(params.id, payload);
        router.back();
      } else {
        await createMothersGroupMeeting({
          ...payload,
          is_synced: false,
        });
        resetForm();
        router.push("/dashboard");
      }
    } catch (e) {
      console.error(e);
      alert(t("mothers_group_meeting.save_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <CustomHeader
        title={t("mothers_group_meeting.title")}
        onBackPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView className="" contentContainerStyle={{ paddingBottom: 80 }}>
          {/* General Information Card */}
          <View className="bg-white p-5">
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-2 text-[16px]">
                {t("mothers_group_meeting.meeting_date")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center border border-gray-200 h-14 rounded-xl px-4 bg-white"
              >
                <Text className="flex-1 text-gray-500 text-[16px]">
                  {meetingDateBS || t("mothers_group_meeting.select_date")}
                </Text>
                <Calendar color="#6b7280" size={20} />
              </TouchableOpacity>
              <CalendarPicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onDateSelect={(bsDate) => {
                  setShowDatePicker(false);
                  setMeetingDateBS(bsDate);
                }}
              />
            </View>

            {/* Health Worker Availability */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() => setHealthWorkerAvailable(!healthWorkerAvailable)}
                className="flex-row items-center"
              >
                <View
                  className={`h-6 w-6 rounded-md border-2 items-center justify-center mr-3 ${healthWorkerAvailable ? "bg-primary border-primary" : "border-gray-300"}`}
                >
                  {healthWorkerAvailable && <Check size={16} color="white" strokeWidth={3} />}
                </View>
                <Text className="text-gray-700 text-[16px] font-semibold">
                  {t("mothers_group_meeting.health_worker_available")}
                </Text>
              </TouchableOpacity>

              {healthWorkerAvailable && (
                <View className="mt-4">
                  <Text className="text-gray-700 text-[16px] font-semibold mb-2">
                    {t("mothers_group_meeting.health_worker_name")}
                  </Text>
                  <TextInput
                    value={healthWorkerName}
                    onChangeText={setHealthWorkerName}
                    placeholder={t("mothers_group_meeting.health_worker_name_placeholder")}
                    className="border border-gray-200 h-14 rounded-xl px-4 text-gray-600 text-[16px]"
                  />
                </View>
              )}
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 text-[16px] font-semibold mb-2">
                {t("mothers_group_meeting.meeting_location")}
              </Text>
              <View className="flex-row items-center bg-white border border-gray-200 h-14 rounded-xl px-4">
                <MapPin color="#6b7280" size={20} className="mr-2" />
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t("mothers_group_meeting.location_placeholder")}
                  className="flex-1 text-gray-600 text-[16px]"
                />
              </View>
            </View>

            <View className="mb-7">
              <Text className="text-gray-700 text-[16px] font-semibold mb-2">
                {t("mothers_group_meeting.ward_no")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
              >
                {[...Array(totalWards)].map((_, i) => {
                  const w = String(i + 1);
                  const isSelected = wardNo === w;
                  return (
                    <TouchableOpacity
                      key={w}
                      onPress={() => setWardNo(w)}
                      className={`h-12 w-12 rounded-xl items-center justify-center mr-2 border ${isSelected ? "bg-primary border-primary" : "bg-white border-gray-200"}`}
                    >
                      <Text
                        className={`font-semibold text-lg ${isSelected ? "text-white" : "text-gray-700"}`}
                      >
                        {w}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 font-semibold mb-2 text-[16px]">
                {t("mothers_group_meeting.attendees_count")}
              </Text>
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setAttendees((prev) => Math.max(0, prev - 1))}
                  className="bg-primary/40 h-14 w-14 rounded-xl items-center justify-center"
                >
                  <Text className="leading-none">
                    <Minus size={20} />
                  </Text>
                </TouchableOpacity>
                <TextInput
                  className="flex-1 mx-4 bg-gray-50 border border-gray-200 h-14 rounded-xl text-center text-xl font-semibold text-gray-900"
                  value={attendees === 0 ? "" : String(attendees)}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/[^0-9]/g, "");
                    setAttendees(cleanText === "" ? 0 : parseInt(cleanText));
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <TouchableOpacity
                  onPress={() => setAttendees((prev) => prev + 1)}
                  className="bg-primary/40 h-14 w-14 rounded-xl items-center justify-center"
                >
                  <Text className="font-semibold">
                    <Plus size={20} />
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Topics and Decisions Card */}
          <View className="bg-white px-5 py-2 mb-5">
            <View className="mb-6">
              <Text className="text-gray-700 font-semibold mb-3 text-[16px]">
                {t("mothers_group_meeting.discussed_topics")}
              </Text>
              {topics.map((topic, i) => (
                <View
                  key={i}
                  className="flex-row items-center bg-blue-50 py-3 px-4 rounded-xl mb-2 border border-blue-100"
                >
                  <Text className="flex-1 text-gray-800 font-medium">
                    {topic}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTopic(i)}
                    className="p-1"
                  >
                    <X size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
              <View className="flex-row items-center mt-2">
                <TextInput
                  value={topicInput}
                  onChangeText={setTopicInput}
                  placeholder={t(
                    "mothers_group_meeting.discussed_topics_placeholder",
                  )}
                  className="flex-1 border text-[15px] bg-white border-gray-200 rounded-xl px-4 py-4 mr-3"
                  onSubmitEditing={handleAddTopic}
                />
                <TouchableOpacity
                  onPress={handleAddTopic}
                  className="bg-slate-600 h-12 w-12 rounded-xl items-center justify-center"
                >
                  <Plus size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 font-semibold mb-3 text-[16px]">
                {t("mothers_group_meeting.decisions")}
              </Text>
              {decisions.map((decision, i) => (
                <View
                  key={i}
                  className="flex-row items-center bg-blue-50 py-3 px-4 rounded-xl mb-2 border border-blue-100"
                >
                  <Text className="flex-1 text-gray-800 font-medium">
                    {decision}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveDecision(i)}
                    className="p-1"
                  >
                    <X size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
              <View className="flex-row items-center mt-2 mb-7">
                <TextInput
                  value={decisionInput}
                  onChangeText={setDecisionInput}
                  placeholder={t("mothers_group_meeting.decisions_placeholder")}
                  className="flex-1 border text-[15px] bg-white border-gray-200 rounded-xl px-4 py-4 mr-3"
                  onSubmitEditing={handleAddDecision}
                />
                <TouchableOpacity
                  onPress={handleAddDecision}
                  className="bg-slate-600 h-12 w-12 rounded-xl items-center justify-center"
                >
                  <Plus size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              onPress={onSubmit}
              isLoading={isSubmitting}
              title={
                isEditMode
                  ? t("mothers_group_meeting.update_record")
                  : t("mothers_group_meeting.save_record")
              }
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
