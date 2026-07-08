import municipalitiesData from "@/assets/json/municipalities.json";
import CustomHeader from "@/components/CustomHeader";
import { FieldLabel } from "@/components/FormElements";
import { ProfilePicker } from "@/components/ProfilePicker";
import TextArea from "@/components/TextArea";
import { Button } from "@/components/button";
import {
  CHILD_COUNSELING_QUESTIONS,
  CHILD_HEALTH_COUNSELLING_QUESTIONS,
  ONE_TIME_CHILD_COUNSELING_QUESTIONS,
  REGISTRATION_COUNSELING_QUESTIONS,
} from "@/constants/ChildCounselingQuestions";
import {
  CounselingQuestion,
  getQuestionById,
  getQuestionsForVisitType,
} from "@/constants/CounselingQuestions";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import {
  getChildCounselingByChild,
  getChildCounselingHistory,
  saveChildCounseling,
} from "@/hooks/database/models/ChildCounselingModel";
import {
  getCounselingReferralByMother,
  getCounselingReferralHistory,
  saveCounselingReferral,
} from "@/hooks/database/models/CounselingReferralModel";
import {
  getChildrenByPregnancy,
  getInfantMonitoringsByMother,
} from "@/hooks/database/models/InfantMonitoringModel";
import {
  getAllMothersList,
  getDeliveredMotherIds,
  getMotherProfile,
  MotherListDbItem,
} from "@/hooks/database/models/MotherModel";
import {
  createPncVisit,
  getMaxPncVisitNumberByMother,
} from "@/hooks/database/models/PncVisitModel";
import {
  getPregnancyByMotherId,
  getPregnantWomenList,
} from "@/hooks/database/models/PregnantWomenModal";
import {
  createVisit,
  getMaxVisitNumberByMother,
} from "@/hooks/database/models/VisitModel";
import { InfantMonitoringStoreType } from "@/hooks/database/types/infantMonitoringModal";
import { getCurrentNepaliDate, toNepaliNumbers } from "@/utils/dateHelper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Check, Minus, Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AdToBs, CalendarPicker } from "react-native-nepali-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const getFormattedAddress = (
  provinceId: string,
  districtId: string,
  municipalityId: string,
  wardId: string,
  locality: string,
  language: string,
  t: any,
) => {
  let municipalityName = "";
  let wardNumber = "";

  const province = (municipalitiesData as any[]).find(
    (p) => p.id === provinceId,
  );
  if (province) {
    const district = province.districts?.find((d: any) => d.id === districtId);
    if (district) {
      const municipality = district.municipalities?.find(
        (m: any) => m.id === municipalityId,
      );
      if (municipality) {
        municipalityName =
          language === "np" ? municipality.name_ne : municipality.name_en;
        const ward = municipality.wards?.find((w: any) => w.id === wardId);
        if (ward) {
          wardNumber = String(ward.number);
        }
      }
    }
  }

  const muni = municipalityName || municipalityId || "";
  const wardStr = wardNumber || wardId || "";
  const wardText = wardStr
    ? `${t("visit.address_ward_short", { defaultValue: "Ward" })}: ${wardStr}`
    : "";
  const localityText = locality
    ? `${t("visit.address_locality_short", { defaultValue: "Locality" })}: ${locality}`
    : "";

  return [muni, wardText, localityText].filter(Boolean).join(", ");
};

const ObservationItem = ({
  checked,
  onToggle,
  label,
  disabled,
  quantity,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  quantity?: number;
}) => (
  <TouchableOpacity
    activeOpacity={disabled ? 1 : 0.7}
    onPress={disabled ? undefined : onToggle}
    className={`flex-row items-center py-2 px-4 rounded-xl ${
      disabled
        ? "bg-slate-100 border-slate-200 opacity-70"
        : checked
          ? "bg-gray-50/70 border-gray-300"
          : "bg-white border-slate-100"
    }`}
  >
    <View
      className={`w-6 h-6 rounded-md border-2 mr-3.5 items-center justify-center ${
        disabled
          ? "bg-green-400 border-green-400"
          : checked
            ? "bg-primary border-primary"
            : "border-slate-300 bg-white"
      }`}
    >
      {(checked || disabled) && (
        <Check color="#fff" strokeWidth={3} size={15} />
      )}
    </View>
    <Text
      className={`text-[15px] flex-1 py-1 leading-5 ${
        disabled
          ? "text-slate-400 font-medium"
          : checked
            ? "text-slate-800 font-semibold"
            : "text-slate-600 font-normal"
      }`}
    >
      {label}
    </Text>
    {quantity !== undefined && (
      <View className="bg-gray-100 rounded-lg px-2.5 py-1 ml-2">
        <Text className="text-gray-700 font-bold text-[13px]">{quantity}</Text>
      </View>
    )}
  </TouchableOpacity>
);

/** Renders a section of questions with a title */
const QUESTION_DEPENDENCIES: Record<string, string> = {
  home_delivery_misoprostol: "home_delivery",
};

const QuestionSection = ({
  title,
  questions,
  checkedQuestions,
  onToggle,
  language,
  answeredOneTimeIds,
  questionQuantities,
}: {
  title: string;
  questions: CounselingQuestion[];
  checkedQuestions: Record<string, boolean>;
  onToggle: (id: string) => void;
  language: string;
  answeredOneTimeIds: Set<string>;
  questionQuantities?: Record<string, number>;
}) => {
  if (questions.length === 0) return null;
  return (
    <View className="border-slate-100 gap-y-3">
      <Text className="text-slate-800 font-semibold text-[17px]">{title}</Text>
      <View className="gap-y-1">
        {questions.map((q) => {
          const parentId = QUESTION_DEPENDENCIES[q.id];
          if (
            parentId &&
            !checkedQuestions[parentId] &&
            !answeredOneTimeIds.has(parentId)
          )
            return null;
          const isOneTimeAnswered =
            q.frequency === "one_time" && answeredOneTimeIds.has(q.id);
          return (
            <ObservationItem
              key={q.id}
              checked={!!checkedQuestions[q.id]}
              onToggle={() => onToggle(q.id)}
              label={language === "np" ? q.ne : q.en}
              disabled={isOneTimeAnswered}
              quantity={questionQuantities?.[q.id]}
            />
          );
        })}
      </View>
    </View>
  );
};

const StepSlider = ({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) => {
  const trackRef = useRef<View>(null);
  const trackLayout = useRef({ x: 0, width: 0 });
  const localValueRef = useRef(value);
  const [localValue, setLocalValue] = useState(value);
  const lastCommitted = useRef(value);

  useEffect(() => {
    if (value !== lastCommitted.current) {
      setLocalValue(value);
      localValueRef.current = value;
      lastCommitted.current = value;
    }
  }, [value]);

  const commitValue = useCallback(
    (v: number) => {
      if (v !== lastCommitted.current) {
        lastCommitted.current = v;
        onChange(v);
      }
    },
    [onChange],
  );

  const getValueFromX = (absoluteX: number) => {
    const { x, width } = trackLayout.current;
    if (width === 0) return localValueRef.current;
    const ratio = Math.max(0, Math.min(1, (absoluteX - x) / width));
    return Math.round(1 + ratio * 7);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        const newVal = getValueFromX(evt.nativeEvent.pageX);
        localValueRef.current = newVal;
        setLocalValue(newVal);
      },

      onPanResponderMove: (evt) => {
        const newVal = getValueFromX(evt.nativeEvent.pageX);
        if (newVal !== localValueRef.current) {
          localValueRef.current = newVal;
          setLocalValue(newVal);
        }
      },

      onPanResponderRelease: () => {
        commitValue(localValueRef.current);
      },

      onPanResponderTerminate: () => {
        commitValue(localValueRef.current);
      },
    }),
  ).current;

  const thumbPercent = ((localValue - 1) / 7) * 100;

  const measureTrack = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
    });
  };

  return (
    <View className="gap-y-2">
      {/* Label + value badge */}
      <View className="flex-row items-center justify-between">
        <Text className="text-gray-800 text-[16px]">{label}</Text>
      </View>

      {/* Controls row */}
      <View className="flex-row items-center gap-x-3">
        {/* Decrement */}
        <TouchableOpacity
          onPress={() => {
            if (localValue > 1) {
              const newVal = localValue - 1;
              setLocalValue(newVal);
              localValueRef.current = newVal;
              commitValue(newVal);
            }
          }}
          className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center active:bg-slate-200"
        >
          <Minus size={18} color="#475569" />
        </TouchableOpacity>

        {/* Track */}
        <View
          ref={trackRef}
          className="flex-1 py-3"
          onLayout={measureTrack}
          {...panResponder.panHandlers}
        >
          <View className="relative justify-center" style={{ height: 28 }}>
            {/* Background track */}
            <View
              className="absolute w-full bg-slate-200 rounded-full overflow-hidden"
              style={{ height: 5 }}
            >
              <View
                className="bg-primary rounded-full h-full"
                style={{ width: `${thumbPercent}%` }}
              />
            </View>

            {/* Value label above thumb */}
            <View
              className="absolute items-center justify-center"
              style={{
                width: 24,
                height: 24,
                left: `${thumbPercent}%`,
                marginLeft: -12,
                top: -20,
              }}
            >
              <Text className="text-primary text-[15px] font-bold">
                {localValue}
              </Text>
            </View>

            {/* Thumb circle */}
            <View
              className="absolute bg-white rounded-full border-2 border-primary"
              style={{
                width: 18,
                height: 18,
                left: `${thumbPercent}%`,
                marginLeft: -11,
              }}
            />
          </View>
        </View>

        {/* Increment */}
        <TouchableOpacity
          onPress={() => {
            if (localValue < 8) {
              const newVal = localValue + 1;
              setLocalValue(newVal);
              localValueRef.current = newVal;
              commitValue(newVal);
            }
          }}
          className="w-10 h-10 rounded-lg bg-slate-100 items-center justify-center active:bg-slate-200"
        >
          <Plus size={18} color="#475569" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const CHILD_QUANTITY_DEFAULTS: Record<string, number> = {
  ors_for_child: 1,
  zinc_for_child: 1,
};

export default function VisitScreen() {
  const router = useRouter();
  const { motherId: urlMotherId, visitType: urlVisitType } =
    useLocalSearchParams<{ motherId?: string; visitType?: string }>();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [mothers, setMothers] = useState<MotherListDbItem[]>([]);
  const [pregnantMotherIds, setPregnantMotherIds] = useState<Set<string>>(
    new Set(),
  );
  const [deliveredMotherIds, setDeliveredMotherIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMotherId, setSelectedMotherId] = useState(
    (urlMotherId as string) || "",
  );
  const [selectedMotherDetails, setSelectedMotherDetails] = useState<any>(null);
  const [pregnancyId, setPregnancyId] = useState<string | null>(null);
  const [children, setChildren] = useState<InfantMonitoringStoreType[]>([]);
  const [childCounselingAnswers, setChildCounselingAnswers] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [childOneTimeAnswered, setChildOneTimeAnswered] = useState<
    Record<string, Set<string>>
  >({});

  const [visitDateBs, setVisitDateBs] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [visitType, setVisitType] = useState<"ANC" | "PNC" | "OTHER">(
    (urlVisitType as "ANC" | "PNC" | "OTHER") || "PNC",
  );
  const [address, setAddress] = useState("");

  const [visitNumber, setVisitNumber] = useState(1);
  const [remarks, setRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [checkedQuestions, setCheckedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [answeredOneTimeIds, setAnsweredOneTimeIds] = useState<Set<string>>(
    new Set(),
  );

  const QUESTIONS_WITH_QUANTITY: Record<
    string,
    { labelEn: string; labelNp: string; max: number }
  > = {
    postnatal_iron_tablets_given: {
      labelEn: "45 Iron tablets quantity",
      labelNp: "४५ आइरन चक्कीको मात्रा",
      max: 45,
    },
    iron_tablets_followup: {
      labelEn: "Iron tablets quantity",
      labelNp: "आइरन चक्कीको मात्रा",
      max: 90,
    },
  };

  const [quantityModalQuestion, setQuantityModalQuestion] = useState<
    string | null
  >(null);
  const [quantityInputValue, setQuantityInputValue] = useState("");
  const [questionQuantities, setQuestionQuantities] = useState<
    Record<string, number>
  >({});

  // Sync URL params to state so the page works when navigated to via router.push with params
  useEffect(() => {
    if (urlMotherId) {
      setSelectedMotherId(urlMotherId);
    }
    if (urlVisitType) {
      setVisitType(urlVisitType as "ANC" | "PNC" | "OTHER");
    }
  }, [urlMotherId, urlVisitType]);

  // Get questions filtered by visit type — memoized so it only recalculates when visitType changes
  const { counselingQuestions, referralQuestions } = useMemo(
    () => getQuestionsForVisitType(visitType),
    [visitType],
  );

  // Clear checked questions and quantities when type or mother changes
  useEffect(() => {
    setCheckedQuestions({});
    setQuestionQuantities({});
    setChildCounselingAnswers({});
    setChildOneTimeAnswered({});
  }, [visitType, selectedMotherId]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allMothers, pregnantWomen, deliveredIds] = await Promise.all([
          getAllMothersList(),
          getPregnantWomenList(),
          getDeliveredMotherIds(),
        ]);
        setMothers(allMothers);
        setPregnantMotherIds(new Set(pregnantWomen.map((p) => p.mother)));
        setDeliveredMotherIds(new Set(deliveredIds));

        // Set default date to today's Nepali date
        const todayAd = new Date().toISOString().split("T")[0];
        try {
          setVisitDateBs(AdToBs(todayAd));
        } catch (e) {
          console.error("Error setting initial Nepali date", e);
        }
      } catch (err) {
        console.error("Error loading visits data:", err);
      }
    };
    fetchData();
  }, []);

  // Handle Mother selection changes
  useEffect(() => {
    if (!selectedMotherId) {
      setSelectedMotherDetails(null);
      setAddress("");
      setPregnancyId(null);
      setAnsweredOneTimeIds(new Set());
      setQuestionQuantities({});
      return;
    }

    const fetchMotherDetails = async () => {
      try {
        const details = await getMotherProfile(selectedMotherId);
        if (details) {
          setSelectedMotherDetails(details);
          setAddress(
            getFormattedAddress(
              details.addressProvince || "",
              details.addressDistrict || "",
              details.addressMunicipality || "",
              details.addressWard || "",
              details.addressLocality || "",
              language,
              t,
            ),
          );
        }

        const preg = await getPregnancyByMotherId(selectedMotherId);
        setPregnancyId(preg?.id || null);

        // Load counseling history for this pregnancy only so previous deliveries don't leak
        const history = await getCounselingReferralHistory(selectedMotherId, preg?.id);
        const answeredIds = new Set<string>();
        history.forEach((record) => {
          if (record.answers) {
            try {
              const parsed = JSON.parse(record.answers);
              Object.entries(parsed).forEach(([key, val]) => {
                if (Array.isArray(val) && val.length > 0) {
                  const q = getQuestionById(key);
                  if (q && q.frequency === "one_time") {
                    answeredIds.add(key);
                  }
                }
              });
            } catch (e) {}
          }
        });
        setAnsweredOneTimeIds(answeredIds);
      } catch (e) {
        console.error("Failed to load mother details:", e);
      }
    };
    fetchMotherDetails();
  }, [selectedMotherId, t, language]);

  // Fetch children when mother selected and visit type is PNC
  useEffect(() => {
    if (!selectedMotherId || visitType !== "PNC") {
      setChildren([]);
      return;
    }
    const fetchChildren = async () => {
      try {
        // When a pregnancy is linked (e.g. after a delivery), only fetch
        // children from this pregnancy so previous deliveries don't leak in.
        const childList = pregnancyId
          ? await getChildrenByPregnancy(pregnancyId)
          : await getInfantMonitoringsByMother(selectedMotherId);
        setChildren(childList);
      } catch (e) {
        console.error("Failed to load children:", e);
      }
    };
    fetchChildren();
  }, [selectedMotherId, visitType, pregnancyId]);

  // Seed checkedQuestions with previously answered one-time questions
  useEffect(() => {
    if (answeredOneTimeIds.size > 0) {
      setCheckedQuestions((prev) => {
        const next = { ...prev };
        answeredOneTimeIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
    }
  }, [answeredOneTimeIds]);

  // Load child counseling history for one-time question detection per child
  useEffect(() => {
    if (!selectedMotherId || visitType !== "PNC" || children.length === 0) {
      setChildOneTimeAnswered({});
      return;
    }
    const fetchChildHistory = async () => {
      const oneTimeMap: Record<string, Set<string>> = {};
      for (const child of children) {
        const answered = new Set<string>();
        try {
          const history = await getChildCounselingHistory(child.id);
          history.forEach((record) => {
            if (record.answers) {
              try {
                const parsed = JSON.parse(record.answers);
                ONE_TIME_CHILD_COUNSELING_QUESTIONS.forEach((q) => {
                  const val = parsed[q.id];
                  if (Array.isArray(val) && val.length > 0) {
                    answered.add(q.id);
                  }
                });
              } catch (e) {}
            }
          });
        } catch (e) {
          console.error("Failed to load child counseling history:", e);
        }
        oneTimeMap[child.id] = answered;
      }
      setChildOneTimeAnswered(oneTimeMap);
    };
    fetchChildHistory();
  }, [selectedMotherId, visitType, children]);

  // Auto-calculate visit number based on mother and visit type
  useEffect(() => {
    if (!selectedMotherId) {
      setVisitNumber(1);
      return;
    }
    const fetchMaxVisitNumber = async () => {
      try {
        let max = 0;
        if (visitType === "PNC") {
          max = await getMaxPncVisitNumberByMother(selectedMotherId);
        } else {
          max = await getMaxVisitNumberByMother(selectedMotherId);
        }
        setVisitNumber(max + 1);
      } catch (e) {
        console.error("Error fetching max visit number:", e);
      }
    };
    fetchMaxVisitNumber();
  }, [selectedMotherId, visitType]);

  const handleDateSelect = (bsDate: string) => {
    setShowDatePicker(false);
    setVisitDateBs(bsDate);
    if (errors.visitDate) setErrors({ ...errors, visitDate: "" });
  };

  const toggleQuestion = (id: string) => {
    if (!selectedMotherId) {
      showToast(
        t("visit.select_recipient_first", {
          defaultValue: "Please select a service recipient first",
        }),
      );
      return;
    }
    if (answeredOneTimeIds.has(id)) return;
    const isCurrentlyChecked = !!checkedQuestions[id];
    if (!isCurrentlyChecked && QUESTIONS_WITH_QUANTITY[id]) {
      setQuantityInputValue(String(questionQuantities[id] ?? 0));
      setQuantityModalQuestion(id);
      return;
    }
    setCheckedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
    if (isCurrentlyChecked && QUESTIONS_WITH_QUANTITY[id]) {
      setQuestionQuantities((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleQuantitySave = () => {
    const qId = quantityModalQuestion;
    if (!qId) return;
    const config = QUESTIONS_WITH_QUANTITY[qId];
    const parsed = parseInt(quantityInputValue, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > config.max) {
      showToast(
        t("visit.invalid_quantity", {
          defaultValue: `Please enter a valid quantity between 0 and ${config.max}`,
        }),
      );
      return;
    }
    setQuestionQuantities((prev) => ({ ...prev, [qId]: parsed }));
    setCheckedQuestions((prev) => ({ ...prev, [qId]: true }));
    setQuantityModalQuestion(null);
    setQuantityInputValue("");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!visitDateBs) {
      errs.visitDate = t("visit.validation.date_required", {
        defaultValue: "Visit date is required",
      });
    }
    if (!selectedMotherId) {
      errs.motherId = t("visit.validation.mother_required", {
        defaultValue: "Service recipient is required",
      });
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast(
        t("visit.validation.fill_required", {
          defaultValue: "Please fill all required fields",
        }),
      );
      return;
    }

    setIsLoading(true);
    try {
      const serializedPlace = JSON.stringify({ address, remarks });

      // Save PNC-specific record for PNC visits
      if (visitType === "PNC") {
        await createPncVisit({
          mother: selectedMotherId,
          name: selectedMotherDetails?.name || null,
          visit_date: visitDateBs,
          visit_place: serializedPlace,
          visit_number: visitNumber,
          visit_type: visitType,
        });
      }

      // Save general visit record
      await createVisit({
        mother: selectedMotherId,
        name: selectedMotherDetails?.name || null,
        visit_date: visitDateBs,
        visit_type: visitType,
        visit_place: serializedPlace,
        visit_number: visitNumber,
      });

      // Save counseling & referral answers
      const checkedKeys = Object.keys(checkedQuestions).filter(
        (k) => checkedQuestions[k],
      );
      if (checkedKeys.length > 0) {
        let regYear = getCurrentNepaliDate().year;
        let regMonth = getCurrentNepaliDate().month;
        if (visitDateBs) {
          const parts = visitDateBs.split("-");
          if (parts.length >= 2) {
            regYear = parseInt(parts[0], 10);
            regMonth = parseInt(parts[1], 10);
          }
        }

        let existingRecord = null;
        try {
          existingRecord = await getCounselingReferralByMother(
            selectedMotherId,
            pregnancyId,
            regYear,
            regMonth,
          );
        } catch (dbErr) {
          console.error("Error fetching existing counseling referral:", dbErr);
        }

        let existingAnswers: Record<string, any> = {};
        if (existingRecord?.answers) {
          try {
            existingAnswers = JSON.parse(existingRecord.answers);
          } catch (e) {
            console.error("Failed to parse existing answers:", e);
          }
        }

        const newAnswers = { ...existingAnswers };
        const currentTime = new Date().toISOString();

        checkedKeys.forEach((key) => {
          const logs = Array.isArray(newAnswers[key])
            ? [...newAnswers[key]]
            : [];
          const entry: Record<string, any> = { date: currentTime, value: true };
          if (questionQuantities[key] !== undefined) {
            entry.quantity = questionQuantities[key];
          }
          logs.push(entry);
          newAnswers[key] = logs;
        });

        const res = await saveCounselingReferral({
          mother: selectedMotherId,
          pregnancy: pregnancyId,
          answers: JSON.stringify(newAnswers),
          reg_year: regYear,
          reg_month: regMonth,
        });
      }

      // Save child counseling answers for PNC visits
      if (visitType === "PNC") {
        let regYear = getCurrentNepaliDate().year;
        let regMonth = getCurrentNepaliDate().month;
        if (visitDateBs) {
          const parts = visitDateBs.split("-");
          if (parts.length >= 2) {
            regYear = parseInt(parts[0], 10);
            regMonth = parseInt(parts[1], 10);
          }
        }
        const childIds = Object.keys(childCounselingAnswers);
        for (const childId of childIds) {
          const answers = childCounselingAnswers[childId];
          const checkedChildKeys = Object.keys(answers).filter(
            (k) => answers[k],
          );
          if (checkedChildKeys.length === 0) continue;

          let existingChildRecord = null;
          try {
            existingChildRecord = await getChildCounselingByChild(
              childId,
              regYear,
              regMonth,
            );
          } catch (dbErr) {
            console.error("Error fetching existing child counseling:", dbErr);
          }

          let existingChildAnswers: Record<string, any> = {};
          if (existingChildRecord?.answers) {
            try {
              existingChildAnswers = JSON.parse(existingChildRecord.answers);
            } catch (e) {
              console.error("Failed to parse child answers:", e);
            }
          }

          const newChildAnswers = { ...existingChildAnswers };
          const currentTime = new Date().toISOString();

          checkedChildKeys.forEach((key) => {
            const logs = Array.isArray(newChildAnswers[key])
              ? [...newChildAnswers[key]]
              : [];

            const entry: Record<string, any> = {
              date: currentTime,
              value: true,
            };
            if (CHILD_QUANTITY_DEFAULTS[key] !== undefined) {
              entry.value = CHILD_QUANTITY_DEFAULTS[key];
            }
            logs.push(entry);
            newChildAnswers[key] = logs;
          });

          await saveChildCounseling({
            id: existingChildRecord?.id,
            child: childId,
            answers: JSON.stringify(newChildAnswers),
            reg_year: regYear,
            reg_month: regMonth,
          });
        }
      }
      router.navigate("/dashboard");
      showToast(t("visit.messages.save_success"));
      setSelectedMotherId("");
      setSelectedMotherDetails(null);
      setPregnancyId(null);
      setAddress("");
      setRemarks("");
      setVisitNumber(1);
      setCheckedQuestions({});
      setQuestionQuantities({});
      setChildCounselingAnswers({});
      setChildOneTimeAnswered({});
      setErrors({});
    } catch (e) {
      console.error("Failed to save visit:", e);
      showToast(
        t("visit.messages.save_failed", {
          defaultValue: "Failed to save visit.",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const visitTypeOptions = [
    {
      label: t("visit.types.anc", {
        defaultValue: "Pregnant Woman - Regular Visit (ANC)",
      }),
      value: "ANC",
    },
    {
      label: t("visit.types.pnc", {
        defaultValue: "Postnatal Mother - Regular Visit (PNC)",
      }),
      value: "PNC",
    },
    {
      label: t("visit.types.other", { defaultValue: "Other Visit" }),
      value: "OTHER",
    },
  ];

  const recipientOptions = mothers
    .filter((m) => !m.is_dead)
    .filter((m) => {
      if (visitType === "ANC") return pregnantMotherIds.has(m.id);
      if (visitType === "PNC")
        return deliveredMotherIds.has(m.id) && !pregnantMotherIds.has(m.id);
      return true;
    })
    .map((m) => {
      return {
        label: `${m.name}`,
        value: m.id,
      };
    });

  const displayDate =
    language === "np" ? toNepaliNumbers(visitDateBs) : visitDateBs;

  return (
    <SafeAreaView className="flex-1 pb-10 bg-white">
      <StatusBar backgroundColor="#fff" />
      <CustomHeader
        title={t("visit.title", { defaultValue: "Visit Registration" })}
        onBackPress={() => router.back()}
      />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="bg-white px-5 pt-6 pb-6 rounded-2xl border border-slate-100 gap-y-5">
          {/* Visit Date */}
          <View className="gap-y-1.5">
            <FieldLabel
              label={t("visit.date", { defaultValue: "Visit Date (B.S.)" })}
              required
            />
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View
                className={`h-14 flex-row items-center rounded-xl px-4 border ${
                  errors.visitDate
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text
                  className={`flex-1 text-[16px] ${visitDateBs ? "text-slate-800" : "text-slate-400"}`}
                >
                  {visitDateBs
                    ? displayDate
                    : t("child_form.select_date", {
                        defaultValue: "Select Date",
                      })}
                </Text>
                <Calendar size={18} color="#475569" />
              </View>
              {errors.visitDate ? (
                <Text className="text-rose-500 text-xs mt-1.5 ml-1 font-semibold">
                  {errors.visitDate}
                </Text>
              ) : null}
            </Pressable>
          </View>

          <CalendarPicker
            visible={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onDateSelect={handleDateSelect}
            language={language === "en" ? "en" : "np"}
            theme="light"
            brandColor="#2563eb"
            date={visitDateBs || undefined}
            dayTextStyle={{ fontWeight: "normal" }}
            weekTextStyle={{ fontWeight: "normal" }}
            titleTextStyle={{ fontWeight: "normal" }}
          />

          {/* Visit Type */}
          <View className="gap-y-1.5">
            <FieldLabel
              label={t("visit.type", { defaultValue: "Visit Type" })}
            />
            <ProfilePicker
              placeholder={t("visit.type", { defaultValue: "Visit Type" })}
              options={visitTypeOptions}
              selectedValue={visitType}
              onValueChange={(val: any) => setVisitType(val)}
            />
          </View>

          {/* Service Recipient */}
          <View className="gap-y-1.5 -mt-5">
            <FieldLabel
              label={t("visit.recipient", {
                defaultValue: "Service Recipient",
              })}
              required
            />
            <ProfilePicker
              placeholder={t("visit.recipient_placeholder", {
                defaultValue: "Choose Service Recipient",
              })}
              options={recipientOptions}
              selectedValue={selectedMotherId}
              onValueChange={(val: string) => {
                setSelectedMotherId(val);
                if (errors.motherId) setErrors({ ...errors, motherId: "" });
              }}
              error={errors.motherId}
              isSearchable={true}
            />
          </View>

          {/* Address */}
          <View className="gap-y-1.5 -mt-5">
            <FieldLabel
              label={t("visit.address", { defaultValue: "Address" })}
            />
            <View className="h-14 rounded-xl px-4 border border-slate-200 bg-slate-50 justify-center">
              <Text className="text-slate-600 text-[16px]" numberOfLines={1}>
                {address ||
                  t("visit.no_address", {
                    defaultValue: "No address available",
                  })}
              </Text>
            </View>
          </View>

          {/* Visit Number */}
          <View className="gap-y-1.5">
            <StepSlider
              label={t("visit.visit_number", { defaultValue: "Visit Number" })}
              value={visitNumber}
              onChange={setVisitNumber}
            />
          </View>

          {/* Counseling Questions */}
          <QuestionSection
            title={t("visit.counseling_questions", {
              defaultValue: "Counseling Questions",
            })}
            questions={counselingQuestions}
            checkedQuestions={checkedQuestions}
            onToggle={toggleQuestion}
            language={language}
            answeredOneTimeIds={answeredOneTimeIds}
            questionQuantities={questionQuantities}
          />

          {/* Referral Questions */}
          <QuestionSection
            title={t("visit.referral_questions", {
              defaultValue: "Referral Questions",
            })}
            questions={referralQuestions}
            checkedQuestions={checkedQuestions}
            onToggle={toggleQuestion}
            language={language}
            answeredOneTimeIds={answeredOneTimeIds}
            questionQuantities={questionQuantities}
          />

          {/* Child Counseling (PNC only) */}
          {visitType === "PNC" && children.length > 0 && (
            <View className="border-t border-slate-200 pt-4">
              <Text className="text-slate-800 font-bold text-[18px]">
                {t("visit.child_counseling_title")}
              </Text>
              {children.map((child) => {
                const childAnswers = childCounselingAnswers[child.id] || {};
                const oneTimeAnswered =
                  childOneTimeAnswered[child.id] || new Set();

                const isConditionBad = !!childAnswers["good_health_condition"];
                const hasDiarrhea = !!childAnswers["has_diarrhea"];
                const hasBreathingProblems =
                  !!childAnswers["has_breathing_problems"];

                const filterHealthQuestions = (q: any) => {
                  if (q.id === "good_health_condition") return true;
                  if (!isConditionBad) return false;
                  if (
                    q.id === "diarrhea_treated_with_ors_zinc" ||
                    q.id === "ors_for_child" ||
                    q.id === "zinc_for_child"
                  ) {
                    return hasDiarrhea;
                  }
                  if (
                    q.id === "has_pneumonia" ||
                    q.id === "referred_breathing_problems" ||
                    q.id === "home_treatment_cold"
                  ) {
                    return hasBreathingProblems;
                  }
                  return true;
                };

                const sections =
                  child.status === "dead"
                    ? [
                        {
                          key: "registration",
                          title: t("visit.sections.registration_counseling", {
                            defaultValue: "Registration Counseling",
                          }),
                          questions: REGISTRATION_COUNSELING_QUESTIONS.filter(
                            (q) => q.id === "death_registration_counseling",
                          ),
                        },
                      ]
                    : [
                        {
                          key: "one_time",
                          title: t("visit.sections.one_time_counseling", {
                            defaultValue: "One-Time Counseling",
                          }),
                          questions: ONE_TIME_CHILD_COUNSELING_QUESTIONS,
                        },
                        {
                          key: "routine",
                          title: t("visit.sections.routine_counseling", {
                            defaultValue: "Routine Counseling",
                          }),
                          questions: CHILD_COUNSELING_QUESTIONS,
                        },
                        {
                          key: "health",
                          title: t("visit.sections.health_status_counseling", {
                            defaultValue: "Health Condition Counseling",
                          }),
                          questions: CHILD_HEALTH_COUNSELLING_QUESTIONS.filter(
                            filterHealthQuestions,
                          ),
                        },
                        {
                          key: "registration",
                          title: t("visit.sections.registration_counseling", {
                            defaultValue: "Registration Counseling",
                          }),
                          questions: REGISTRATION_COUNSELING_QUESTIONS.filter(
                            (q) => q.id === "birth_registration_counseling",
                          ),
                        },
                      ];

                return (
                  <View key={child.id} className="mb-5 bg-white rounded-2xl">
                    <View className="flex-row items-center justify-between mb-3">
                      {child.status === "dead" && (
                        <View className="bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                          <Text className="text-rose-600 font-bold text-[11px] uppercase tracking-wider">
                            {t("reports.status.deceased")}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="gap-y-1">
                      {sections.flatMap((section) =>
                        section.questions.map((q: any) => {
                          const isOneTime =
                            section.key === "one_time" &&
                            oneTimeAnswered.has(q.id);
                          const qty = CHILD_QUANTITY_DEFAULTS[q.id];
                          return (
                            <ObservationItem
                              key={q.id}
                              checked={!!childAnswers[q.id]}
                              onToggle={() => {
                                if (isOneTime || child.status === "dead")
                                  return;
                                setChildCounselingAnswers((prev) => {
                                  const current = { ...(prev[child.id] || {}) };
                                  if (current[q.id]) {
                                    delete current[q.id];
                                  } else {
                                    current[q.id] = true;
                                  }
                                  return { ...prev, [child.id]: current };
                                });
                              }}
                              label={language === "np" ? q.ne : q.en}
                              disabled={isOneTime || child.status === "dead"}
                              quantity={
                                childAnswers[q.id] && qty !== undefined
                                  ? qty
                                  : undefined
                              }
                            />
                          );
                        }),
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Remarks */}
          <TextArea
            label={t("visit.remarks", { defaultValue: "Remarks" })}
            placeholder={t("visit.remarks_placeholder", {
              defaultValue: "Write here...",
            })}
            value={remarks}
            onChangeText={setRemarks}
            numberOfLines={4}
          />

          {/* Save Button */}
          <Button
            onPress={handleSave}
            isLoading={isLoading}
            title={t("visit.save", { defaultValue: "Save Visit" })}
          />
        </View>
      </ScrollView>

      {/* Quantity Modal */}
      <Modal
        visible={!!quantityModalQuestion}
        transparent
        animationType="fade"
        onRequestClose={() => setQuantityModalQuestion(null)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm px-6 py-10 gap-y-5">
            {quantityModalQuestion &&
              (() => {
                const config = QUESTIONS_WITH_QUANTITY[quantityModalQuestion];
                if (!config) return null;
                return (
                  <>
                    <Text className="text-slate-800 font-bold text-[18px] text-center mb-3">
                      {language === "np" ? config.labelNp : config.labelEn}
                    </Text>

                    <View className="flex-row items-center justify-center gap-x-4">
                      <TouchableOpacity
                        onPress={() => {
                          const cur = parseInt(quantityInputValue, 10) || 0;
                          if (cur > 0) setQuantityInputValue(String(cur - 1));
                        }}
                        className="w-11 h-11 rounded-lg bg-primary items-center justify-center active:bg-slate-200"
                      >
                        <Minus color="#fff" />
                      </TouchableOpacity>
                      <View className="bg-slate-50 rounded-md border border-slate-200 w-48 justify-center">
                        <TextInput
                          className="text-slate-800 text-[20px] font-bold text-center py-2"
                          keyboardType="number-pad"
                          value={quantityInputValue}
                          onChangeText={(val) => {
                            const cleaned = val.replace(/[^0-9]/g, "");
                            setQuantityInputValue(cleaned);
                          }}
                          maxLength={3}
                          selectTextOnFocus
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const cur = parseInt(quantityInputValue, 10) || 0;
                          if (cur < config.max)
                            setQuantityInputValue(String(cur + 1));
                        }}
                        className="w-11 h-11 rounded-lg bg-primary items-center justify-center active:bg-slate-200"
                      >
                        <Plus color="#fff" />
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-x-3">
                      <TouchableOpacity
                        onPress={() => {
                          setQuantityModalQuestion(null);
                          setQuantityInputValue("");
                        }}
                        className="flex-1 h-12 rounded-xl bg-slate-100 items-center justify-center"
                      >
                        <Text className="text-slate-600 font-semibold text-[15px]">
                          {t("visit.quantity_cancel", {
                            defaultValue: "Cancel",
                          })}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleQuantitySave}
                        className="flex-1 h-12 rounded-xl bg-primary items-center justify-center"
                      >
                        <Text className="text-white font-semibold text-[15px]">
                          {t("visit.quantity_save", { defaultValue: "Save" })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
