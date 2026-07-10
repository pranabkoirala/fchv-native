import { getFchvData } from "@/api/services/fchv";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { AdToBs, BsToAd, CalendarPicker } from "react-native-nepali-picker";
import municipalitiesData from "../assets/json/municipalities.json";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import {
  createMother,
  getMotherProfile,
} from "../hooks/database/models/MotherModel";
import { createVisit } from "../hooks/database/models/VisitModel";
import { Province } from "../types/profile";
import { toNepaliNumbers } from "../utils/dateHelper";
import { Button } from "./button";
import { BoxInput, FieldLabel } from "./FormElements";
import MotherRegisterCounselingModal from "./forms/MotherRegisterCounselingModal";
import { ProfilePicker } from "./ProfilePicker";

const provinces: Province[] = municipalitiesData as Province[];

const generateCustomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const getRandom = (len: number) =>
    Array.from({ length: len }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  return `${getRandom(2)}-${getRandom(4)}-${getRandom(2)}`;
};

export default function MotherForm({
  id,
  onSuccess,
}: {
  id?: string;
  onSuccess?: (id: string) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobAd, setDobAd] = useState("");
  const [dobBs, setDobBs] = useState("");
  const [age, setAge] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [codeState, setCodeState] = useState<string | null>(null);

  // Address state (store IDs for DB)
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [savedMotherId, setSavedMotherId] = useState<string | null>(null);

  // Cascading address data
  const districts = useMemo(() => {
    const prov = provinces.find((p) => p.id === selectedProvince);
    return prov?.districts || [];
  }, [selectedProvince]);

  const municipalities = useMemo(() => {
    const dist = districts.find((d) => d.id === selectedDistrict);
    return dist?.municipalities || [];
  }, [selectedDistrict, districts]);

  const wards = useMemo(() => {
    const muni = municipalities.find((m) => m.id === selectedMunicipality);
    return muni?.wards || [];
  }, [selectedMunicipality, municipalities]);

  const toNepaliDate = (adDate: string) => {
    try {
      return AdToBs(adDate);
    } catch {
      return adDate;
    }
  };

  const getTodayNepaliDate = () => {
    try {
      const todayAd = new Date().toISOString().split("T")[0];
      const bsDate = AdToBs(todayAd);
      const parts = bsDate.split("-");
      return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10),
        day: parseInt(parts[2], 10),
      };
    } catch (e) {
      console.error("Error getting today's Nepali date:", e);
      return { year: 2083, month: 3, day: 1 };
    }
  };

  const calculateAgeFromBs = (bsDateStr: string): number => {
    if (!bsDateStr) return 0;
    const parts = bsDateStr.split("-");
    if (parts.length !== 3) return 0;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10);
    const birthDay = parseInt(parts[2], 10);

    const today = getTodayNepaliDate();
    let ageVal = today.year - birthYear;
    if (
      today.month < birthMonth ||
      (today.month === birthMonth && today.day < birthDay)
    ) {
      ageVal--;
    }
    return ageVal < 0 ? 0 : ageVal;
  };

  const calculateBsFromAge = (ageNum: number): string => {
    const today = getTodayNepaliDate();
    const birthYear = today.year - ageNum;
    const monthStr = today.month.toString().padStart(2, "0");
    const dayStr = today.day.toString().padStart(2, "0");
    return `${birthYear}-${monthStr}-${dayStr}`;
  };

  const handleAgeChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    setAge(cleanVal);
    setErrors({ ...errors, age: "", dob: "" });

    if (cleanVal) {
      const ageNum = parseInt(cleanVal, 10);
      if (ageNum >= 0 && ageNum <= 120) {
        const calculatedDobBs = calculateBsFromAge(ageNum);
        setDobBs(calculatedDobBs);
        try {
          const adDate = BsToAd(calculatedDobBs);
          setDobAd(adDate);
        } catch (e) {
          console.error("BS to AD conversion error:", e);
        }
      }
    } else {
      setDobBs("");
      setDobAd("");
    }
  };

  useEffect(() => {
    const initForm = async () => {
      if (id) {
        try {
          setIsLoading(true);
          const data = await getMotherProfile(id);
          if (data) {
            const nameParts = data.first_name ? data.first_name.split(" ") : [];
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");

            const dob = data.date_of_birth || "";
            setDobAd(dob);
            if (dob) {
              const nepaliDob = toNepaliDate(dob);
              setDobBs(nepaliDob);
              const calculatedAge = calculateAgeFromBs(nepaliDob);
              setAge(calculatedAge.toString());
            } else {
              setDobBs("");
              setAge("");
            }

            setPhoneNumber(data.phone_number || "");
            setSelectedProvince(data.addressProvince || "");
            setSelectedDistrict(data.addressDistrict || "");
            setSelectedMunicipality(data.addressMunicipality || "");
            setSelectedWard(data.addressWard || "");
            setCodeState(data.code || null);
          }
        } catch (e) {
          console.error("error fetching mother profile", e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setFirstName("");
        setLastName("");
        setDobAd("");
        setDobBs("");
        setAge("");
        setPhoneNumber("");
        setSelectedProvince("");
        setSelectedDistrict("");
        setSelectedMunicipality("");
        setSelectedWard("");
        setCodeState(null);

        try {
          const fchvData = await getFchvData();
          if (fchvData?.address) {
            if (fchvData.address.province?.id)
              setSelectedProvince(fchvData.address.province.id);
            if (fchvData.address.district?.id)
              setSelectedDistrict(fchvData.address.district.id);
            if (fchvData.address.municipality?.id)
              setSelectedMunicipality(fchvData.address.municipality.id);
            if (fchvData.address.ward?.id)
              setSelectedWard(fchvData.address.ward.id);
          }
        } catch (e) {
          console.error("error fetching FCHV data for pre-fill", e);
        }
      }
    };

    initForm();
  }, [id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim())
      e.firstName = t("mother_form.validation.first_name_req");
    if (!lastName.trim())
      e.lastName = t("mother_form.validation.last_name_req");
    if (!dobAd) {
      e.dob = t("mother_form.validation.dob_req");
      e.age = t("mother_form.validation.age_req");
    }
    const phoneVal = phoneNumber.trim();
    if (phoneVal) {
      if (phoneVal.length !== 10) {
        e.phoneNumber = t("mother_form.validation.phone_digits");
      } else if (!phoneVal.startsWith("98") && !phoneVal.startsWith("97")) {
        e.phoneNumber = t("mother_form.validation.phone_invalid");
      }
    }
    if (!selectedProvince)
      e.province = t("mother_form.validation.province_req");
    if (!selectedDistrict)
      e.district = t("mother_form.validation.district_req");
    if (!selectedMunicipality)
      e.municipality = t("mother_form.validation.municipality_req");
    if (!selectedWard) e.ward = t("mother_form.validation.ward_req");
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);
    try {
      const dbId =
        id && typeof id === "string" && id.trim().length > 0
          ? id
          : Crypto.randomUUID();
      const mCode = codeState || generateCustomId();

      await createMother({
        id: dbId,
        code: mCode,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dobAd,
        phone_number: phoneNumber,
        address_province: selectedProvince || undefined,
        address_district: selectedDistrict || undefined,
        address_municipality: selectedMunicipality || undefined,
        address_ward: selectedWard || undefined,
        is_synced: false,
      });

      const todayAd = new Date().toISOString().split("T")[0];
      const todayBs = AdToBs(todayAd);
      await createVisit({
        mother: dbId,
        visit_date: todayBs,
        visit_type: "OTHER",
      });

      showToast(t("mother_form.messages.save_success"));
      setSavedMotherId(dbId);
      setShowCounselingModal(true);
    } catch (err) {
      console.error("Error saving form:", err);
      showToast(t("mother_form.messages.save_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="pt-3">
      <View className="flex-row gap-4">
        <View className="flex-1">
          <FieldLabel label={t("mother_form.first_name")} required />
          <BoxInput
            placeholder={t("mother_form.first_name")}
            value={firstName}
            onChangeText={(t) => {
              setFirstName(t);
              setErrors({ ...errors, firstName: "" });
            }}
            error={errors.firstName}
          />
        </View>
        <View className="flex-1">
          <FieldLabel label={t("mother_form.last_name")} required />
          <BoxInput
            placeholder={t("mother_form.last_name")}
            value={lastName}
            onChangeText={(t) => {
              setLastName(t);
              setErrors({ ...errors, lastName: "" });
            }}
            error={errors.lastName}
          />
        </View>
      </View>

      <View className="flex-row gap-4 mb-4">
        <View className="flex-1">
          <FieldLabel label={t("mother_form.dob")} required />
          <Pressable onPress={() => setShowDobPicker(true)}>
            <View
              className={`rounded-xl px-4 mt-2 h-14 border ${errors.dob ? "border-red-300" : "border-gray-300"} flex-row items-center justify-between`}
            >
              <Text
                className={`text-base ${dobBs ? "text-[#1E293B]" : "text-[#b8bbbeff]"}`}
              >
                {dobBs
                  ? language === "np"
                    ? toNepaliNumbers(dobBs)
                    : dobBs
                  : t("mother_form.dob_placeholder")}
              </Text>
              <Calendar size={18} color="#475569" />
            </View>
            {errors.dob ? (
              <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">
                {errors.dob}
              </Text>
            ) : null}
          </Pressable>
        </View>
        <View className="flex-1">
          <FieldLabel label={t("mother_form.age")} required />
          <BoxInput
            placeholder={t("mother_form.age_placeholder")}
            value={age}
            onChangeText={handleAgeChange}
            keyboardType="number-pad"
            maxLength={3}
            error={errors.age}
          />
        </View>
      </View>

      <CalendarPicker
        visible={showDobPicker}
        onClose={() => setShowDobPicker(false)}
        onDateSelect={(bsDate) => {
          setShowDobPicker(false);
          setDobBs(bsDate);
          setErrors({ ...errors, dob: "", age: "" });
          try {
            const adDate = BsToAd(bsDate);
            setDobAd(adDate);
            const calculatedAge = calculateAgeFromBs(bsDate);
            setAge(calculatedAge.toString());
          } catch (e) {
            console.error("BS to AD conversion error:", e);
          }
        }}
        language={language === "np" ? "np" : "en"}
        theme="light"
        brandColor="#0056D2"
        date={dobBs || undefined}
        dayTextStyle={{ fontWeight: "normal" }}
        weekTextStyle={{ fontWeight: "normal" }}
        titleTextStyle={{ fontWeight: "normal" }}
      />

      <FieldLabel label={t("mother_form.phone")} />
      <BoxInput
        placeholder="98*******"
        value={phoneNumber}
        onChangeText={(t) => {
          setPhoneNumber(t.replace(/\D/g, ""));
          setErrors({ ...errors, phoneNumber: "" });
        }}
        keyboardType="phone-pad"
        maxLength={10}
        error={errors.phoneNumber}
      />

      {/* Address Section */}
      <View className="mt-2">
        <View>
          <ProfilePicker
            label={t("mother_form.address.province")}
            required
            placeholder={t("mother_form.address.select_province")}
            selectedValue={selectedProvince}
            onValueChange={(val) => {
              setSelectedProvince(val);
              setSelectedDistrict("");
              setSelectedMunicipality("");
              setSelectedWard("");
              setErrors({ ...errors, province: "" });
            }}
            options={provinces.map((p) => p.id)}
            getOptionLabel={(pid) => {
              const p = provinces.find((pr) => pr.id === pid);
              return p ? (language === "np" ? p.name_ne : p.name_en) : pid;
            }}
            error={errors.province}
          />
        </View>

        <View>
          <ProfilePicker
            label={t("mother_form.address.district")}
            required
            placeholder={
              selectedProvince
                ? t("mother_form.address.select_district")
                : t("mother_form.address.select_province_first")
            }
            selectedValue={selectedDistrict}
            onValueChange={(val) => {
              setSelectedDistrict(val);
              setSelectedMunicipality("");
              setSelectedWard("");
              setErrors({ ...errors, district: "" });
            }}
            options={districts.map((d) => d.id)}
            getOptionLabel={(did) => {
              const d = districts.find((di) => di.id === did);
              return d ? (language === "np" ? d.name_ne : d.name_en) : did;
            }}
            error={errors.district}
          />
        </View>

        <View>
          <ProfilePicker
            label={t("mother_form.address.municipality")}
            required
            placeholder={
              selectedDistrict
                ? t("mother_form.address.select_municipality")
                : t("mother_form.address.select_district_first")
            }
            selectedValue={selectedMunicipality}
            onValueChange={(val) => {
              setSelectedMunicipality(val);
              setSelectedWard("");
              setErrors({ ...errors, municipality: "" });
            }}
            options={municipalities.map((m) => m.id)}
            getOptionLabel={(mid) => {
              const m = municipalities.find((mu) => mu.id === mid);
              return m ? (language === "np" ? m.name_ne : m.name_en) : mid;
            }}
            error={errors.municipality}
          />
        </View>

        <View>
          <ProfilePicker
            label={t("mother_form.address.ward")}
            required
            placeholder={
              selectedMunicipality
                ? t("mother_form.address.select_ward")
                : t("mother_form.address.select_municipality_first")
            }
            selectedValue={selectedWard}
            onValueChange={(val) => {
              setSelectedWard(val);
              setErrors({ ...errors, ward: "" });
            }}
            options={wards.map((w) => w.id)}
            getOptionLabel={(wid) => {
              const w = wards.find((wa) => wa.id === wid);
              return w
                ? `${language === "np" ? "वडा" : "Ward"} ${w.number}`
                : wid;
            }}
            error={errors.ward}
          />
        </View>
      </View>

      <Button
        onPress={save}
        isLoading={isLoading}
        title={
          id ? t("mother_form.buttons.update") : t("mother_form.buttons.save")
        }
      />

      {savedMotherId && (
        <MotherRegisterCounselingModal
          visible={showCounselingModal}
          onClose={() => {
            setShowCounselingModal(false);
            if (onSuccess) onSuccess(savedMotherId);
            else router.back();
          }}
          motherId={savedMotherId}
        />
      )}
    </View>
  );
}
