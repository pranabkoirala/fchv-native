import React, { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Calendar, Edit } from "lucide-react-native";
import { CalendarPicker, AdToBs, BsToAd } from "react-native-nepali-picker";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { createMother, getMotherProfile } from "../hooks/database/models/MotherModel";
import { useToast } from "../context/ToastContext";
import { FieldLabel, BoxInput } from "./FormElements";
import { Button } from "./button";
import { ProfilePicker } from "./ProfilePicker";
import { Province } from "../types/profile";
import municipalitiesData from "../assets/json/municipalities.json";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";

const provinces: Province[] = municipalitiesData as Province[];

const generateCustomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const getRandom = (len: number) => Array.from({ length: len }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${getRandom(2)}-${getRandom(4)}-${getRandom(2)}`;
};

export default function MotherForm({ id, onSuccess }: { id?: string, onSuccess?: (id: string) => void }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobAd, setDobAd] = useState("");
  const [dobBs, setDobBs] = useState("");
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

  // Cascading address data
  const districts = useMemo(() => {
    const prov = provinces.find(p => p.id === selectedProvince);
    return prov?.districts || [];
  }, [selectedProvince]);

  const municipalities = useMemo(() => {
    const dist = districts.find(d => d.id === selectedDistrict);
    return dist?.municipalities || [];
  }, [selectedDistrict, districts]);

  const wards = useMemo(() => {
    const muni = municipalities.find(m => m.id === selectedMunicipality);
    return muni?.wards || [];
  }, [selectedMunicipality, municipalities]);

  const toNepaliDate = (adDate: string) => {
    try { return AdToBs(adDate); } catch { return adDate; }
  };

  useEffect(() => {
    if (id) {
      const fetchEditData = async () => {
        try {
          setIsLoading(true);
          const data = await getMotherProfile(id);
          if (data) {
            const nameParts = data.first_name ? data.first_name.split(" ") : [];
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setPhoneNumber(data.phone_number || "");
            setCodeState(data.code || null);
          }
        } catch (e) {
          console.error("error fetching mother profile", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEditData();
    } else {
      setFirstName("");
      setLastName("");
      setDobAd("");
      setDobBs("");
      setPhoneNumber("");
      setSelectedProvince("");
      setSelectedDistrict("");
      setSelectedMunicipality("");
      setSelectedWard("");
      setCodeState(null);
    }
  }, [id]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = t("mother_form.validation.first_name_req");
    if (!lastName.trim()) e.lastName = t("mother_form.validation.last_name_req");
    if (!dobAd) e.dob = t("mother_form.validation.dob_req");
    if (!phoneNumber.trim()) e.phoneNumber = t("mother_form.validation.phone_req");
    else if (phoneNumber.length !== 10) e.phoneNumber = t("mother_form.validation.phone_digits");
    if (!selectedProvince) e.province = t("mother_form.validation.province_req");
    if (!selectedDistrict) e.district = t("mother_form.validation.district_req");
    if (!selectedMunicipality) e.municipality = t("mother_form.validation.municipality_req");
    if (!selectedWard) e.ward = t("mother_form.validation.ward_req");
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);
    try {
      const dbId = (id && typeof id === 'string' && id.trim().length > 0) ? id : Crypto.randomUUID();
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

      showToast(t("mother_form.messages.save_success"));
      if (onSuccess) {
        onSuccess(dbId);
      } else {
        router.back();
      }
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
            <FieldLabel label={t("mother_form.first_name")} />
            <BoxInput
              placeholder={t("mother_form.first_name")}
              value={firstName}
              onChangeText={(t) => { setFirstName(t); setErrors({ ...errors, firstName: "" }); }}
              error={errors.firstName}
            />
          </View>
          <View className="flex-1">
            <FieldLabel label={t("mother_form.last_name")} />
            <BoxInput
              placeholder={t("mother_form.last_name")}
              value={lastName}
              onChangeText={(t) => { setLastName(t); setErrors({ ...errors, lastName: "" }); }}
              error={errors.lastName}
            />
          </View>
        </View>
 
        <FieldLabel label={t("mother_form.dob")} />
        <Pressable onPress={() => setShowDobPicker(true)} className="mb-6">
          <View className={`rounded-md px-4 h-14 border ${errors.dob ? "border-red-300" : "border-gray-300"} flex-row items-center justify-between`}>
            <Text className={`text-base ${dobBs ? "text-[#1E293B]" : "text-[#b8bbbeff]"}`}>
              {dobBs || t("mother_form.dob_placeholder")}
            </Text>
            <Calendar size={18} color="#0056D2" />
          </View>
          {errors.dob ? (
            <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.dob}</Text>
          ) : null}
        </Pressable>
        <CalendarPicker
          visible={showDobPicker}
          onClose={() => setShowDobPicker(false)}
          onDateSelect={(bsDate) => {
            setShowDobPicker(false);
            setDobBs(bsDate);
            setErrors({ ...errors, dob: "" });
            try {
              const adDate = BsToAd(bsDate);
              setDobAd(adDate);
            } catch (e) {
              console.error("BS to AD conversion error:", e);
            }
          }}
          language={language === "np" ? "np" : "en"}
          theme="light"
          brandColor="#0056D2"
          date={dobBs || undefined}
          dayTextStyle={{ fontWeight: 'normal' }}
          weekTextStyle={{ fontWeight: 'normal' }}
          titleTextStyle={{ fontWeight: 'normal' }}
        />

        <FieldLabel label={t("mother_form.phone")} />
        <BoxInput
          placeholder="98*******"
          value={phoneNumber}
          onChangeText={(t) => { setPhoneNumber(t.replace(/\D/g, "")); setErrors({ ...errors, phoneNumber: "" }); }}
          keyboardType="phone-pad"
          maxLength={10}
          error={errors.phoneNumber}
        />

      {/* Address Section */}
      <View className="mt-2">
        <View>
          <ProfilePicker
            label={t("mother_form.address.province")}
            placeholder={t("mother_form.address.select_province")}
            selectedValue={selectedProvince}
            onValueChange={(val) => {
              setSelectedProvince(val);
              setSelectedDistrict("");
              setSelectedMunicipality("");
              setSelectedWard("");
              setErrors({ ...errors, province: "" });
            }}
            options={provinces.map(p => p.id)}
            getOptionLabel={(pid) => {
              const p = provinces.find(pr => pr.id === pid);
              return p ? (language === "np" ? `${p.name_ne} (${p.name_en})` : `${p.name_en} (${p.name_ne})`) : pid;
            }}
            error={errors.province}
          />
        </View>

        <View>
          <ProfilePicker
            label={t("mother_form.address.district")}
            placeholder={selectedProvince ? t("mother_form.address.select_district") : t("mother_form.address.select_province_first")}
            selectedValue={selectedDistrict}
            onValueChange={(val) => {
              setSelectedDistrict(val);
              setSelectedMunicipality("");
              setSelectedWard("");
              setErrors({ ...errors, district: "" });
            }}
            options={districts.map(d => d.id)}
            getOptionLabel={(did) => {
              const d = districts.find(di => di.id === did);
              return d ? (language === "np" ? `${d.name_ne} (${d.name_en})` : `${d.name_en} (${d.name_ne})`) : did;
            }}
            error={errors.district}
          />
        </View>

        <View>
          <ProfilePicker
            label={t("mother_form.address.municipality")}
            placeholder={selectedDistrict ? t("mother_form.address.select_municipality") : t("mother_form.address.select_district_first")}
            selectedValue={selectedMunicipality}
            onValueChange={(val) => {
              setSelectedMunicipality(val);
              setSelectedWard("");
              setErrors({ ...errors, municipality: "" });
            }}
            options={municipalities.map(m => m.id)}
            getOptionLabel={(mid) => {
              const m = municipalities.find(mu => mu.id === mid);
              return m ? (language === "np" ? `${m.name_ne} (${m.name_en})` : `${m.name_en} (${m.name_ne})`) : mid;
            }}
            error={errors.municipality}
          />
        </View>

        <View>
          <ProfilePicker
            label={t("mother_form.address.ward")}
            placeholder={selectedMunicipality ? t("mother_form.address.select_ward") : t("mother_form.address.select_municipality_first")}
            selectedValue={selectedWard}
            onValueChange={(val) => {
              setSelectedWard(val);
              setErrors({ ...errors, ward: "" });
            }}
            options={wards.map(w => w.id)}
            getOptionLabel={(wid) => {
              const w = wards.find(wa => wa.id === wid);
              return w ? (language === "np" ? `वडा ${w.number}` : `Ward ${w.number}`) : wid;
            }}
            error={errors.ward}
          />
        </View>
      </View>
      
      <Button
        onPress={save}
        isLoading={isLoading}
        title={id ? t("mother_form.buttons.update") : t("mother_form.buttons.save")}
      />
      </View>
  );
}
