import { useLanguage } from "@/context/LanguageContext";
import { getCounselingReferralHistory } from "@/hooks/database/models/CounselingReferralModel";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Share2,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { LayoutAnimation, Text, TouchableOpacity, View } from "react-native";
import { AdToBs } from "react-native-nepali-picker";
import { getQuestionById } from "../../constants/CounselingQuestions";
import { toNepaliNumbers } from "../../utils/dateHelper";

interface CounselingReferralSectionProps {
  motherId: string;
  disabled?: boolean;
}

interface DisplayRecord {
  questionId: string;
  questionEn: string;
  questionNe: string;
  type: "referral" | "counseling";
  dates: string[];
}

export default function CounselingReferralSection({
  motherId,
}: CounselingReferralSectionProps) {
  const { language, t } = useLanguage();
  const [records, setRecords] = useState<DisplayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    referral: true,
    counseling: true,
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const history = await getCounselingReferralHistory(motherId);
        const answerMap: Record<string, string[]> = {};

        history.forEach((h) => {
          if (h.answers) {
            const parsed = JSON.parse(h.answers);
            Object.entries(parsed).forEach(([qId, val]) => {
              if (!answerMap[qId]) answerMap[qId] = [];
              const logs = Array.isArray(val)
                ? val
                : val === true
                  ? [{ date: h.updated_at }]
                  : [];
              logs.forEach((log: any) => {
                if (log.date) answerMap[qId].push(log.date);
              });
            });
          }
        });

        const displayRecords: DisplayRecord[] = Object.entries(answerMap)
          .map(([qId, dates]) => {
            const question = getQuestionById(qId);
            if (!question) return null;
            return {
              questionId: qId,
              questionEn: question.en,
              questionNe: question.ne,
              type: question.type,
              dates: dates.sort(),
            };
          })
          .filter(Boolean) as DisplayRecord[];

        setRecords(displayRecords);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [motherId]);

  const referralRecords = useMemo(
    () => records.filter((r) => r.type === "referral"),
    [records],
  );

  const counselingRecords = useMemo(
    () => records.filter((r) => r.type === "counseling"),
    [records],
  );

  const formatDate = (isoDate: string) => {
    try {
      const pureDate = isoDate.split("T")[0];
      return language === "np" ? toNepaliNumbers(AdToBs(pureDate)) : pureDate;
    } catch {
      return isoDate.split("T")[0];
    }
  };

  if (loading) return null;

  const renderSection = (
    key: string,
    title: string,
    icon: any,
    iconBg: string,
    accentColor: string,
    badgeBg: string,
    badgeText: string,
    items: DisplayRecord[],
  ) => {
    const isExpanded = expandedSections[key];
    if (items.length === 0) return null;

    return (
      <View className="bg-white rounded-xl border border-slate-100 mb-4 overflow-hidden">
        <TouchableOpacity
          onPress={() => toggleSection(key)}
          activeOpacity={0.7}
          className="flex-row items-center justify-between px-4 py-3.5"
        >
          <View className="flex-row items-center flex-1">
            <View
              className={`w-8 h-8 rounded-full ${iconBg} items-center justify-center mr-2.5`}
            >
              {icon}
            </View>
            <View className="flex-1">
              <Text className="text-slate-800 text-lg font-semibold">
                {title}
              </Text>
              <Text className="text-slate-400 text-[13px] italic mt-0.5">
                {items.length} {t("counseling_section.records")}
              </Text>
            </View>
          </View>
          <View
            className={`w-6 h-6 rounded-full ${iconBg} items-center justify-center`}
          >
            <ChevronDown
              size={14}
              color={accentColor}
              style={{
                transform: [{ rotate: isExpanded ? "0deg" : "-90deg" }],
              }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <View className="h-px bg-slate-100" />
            <View className="px-4 py-2 gap-y-1">
              {items.map((item) => {
                const cardId = `${key}-${item.questionId}`;
                const isCardExpanded = expandedCards[cardId];

                return (
                  <TouchableOpacity
                    key={item.questionId}
                    onPress={() => toggleCard(cardId)}
                    activeOpacity={0.7}
                    className={`rounded-lg ${isCardExpanded ? "bg-slate-50" : ""}`}
                  >
                    <View className="px-2 py-2.5">
                      <View className="flex-row items-center">
                        <View
                          className={`w-5 h-5 rounded-full ${badgeBg} items-center justify-center mr-2`}
                        >
                          {key === "referral" ? (
                            <Share2 size={10} color={accentColor} />
                          ) : (
                            <MessageCircle size={10} color={accentColor} />
                          )}
                        </View>
                        <View className="flex-1 mr-2">
                          <Text
                            className="text-slate-800 text-[14px] font-semibold leading-relaxed"
                            numberOfLines={isCardExpanded ? undefined : 2}
                          >
                            {language === "np"
                              ? item.questionNe
                              : item.questionEn}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                          <View
                            className={`px-2 py-0.5 rounded-full ${badgeBg}`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${badgeText}`}
                            >
                              {item.dates.length}x
                            </Text>
                          </View>
                          <ChevronRight
                            size={14}
                            color="#CBD5E1"
                            style={{
                              transform: [
                                { rotate: isCardExpanded ? "90deg" : "0deg" },
                              ],
                            }}
                          />
                        </View>
                      </View>

                      {isCardExpanded && (
                        <View className="mt-2 pt-2 border-t border-slate-200/70">
                          <View className="flex-row items-center mb-1.5">
                            <Calendar size={11} color="#94A3B8" />
                            <Text className="text-slate-400 text-[10px] font-semibold ml-1.5 uppercase tracking-wider">
                              {t("counseling_section.recorded_dates")}
                            </Text>
                          </View>
                          <View className="flex-row flex-wrap gap-1.5">
                            {item.dates.map((date, idx) => (
                              <View
                                key={idx}
                                className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg"
                              >
                                <Text className="text-slate-600 text-[11px] font-medium">
                                  {formatDate(date)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View className="gap-y-1">
      <>
        {renderSection(
          "referral",
          t("counseling_section.referral_counseling"),
          <Share2 size={14} color="#D97706" />,
          "bg-amber-100",
          "#D97706",
          "bg-amber-50",
          "text-amber-700",
          referralRecords,
        )}

        {renderSection(
          "counseling",
          t("counseling_section.general_counseling"),
          <MessageCircle size={14} color="#059669" />,
          "bg-emerald-100",
          "#059669",
          "bg-emerald-50",
          "text-emerald-700",
          counselingRecords,
        )}
      </>
    </View>
  );
}
