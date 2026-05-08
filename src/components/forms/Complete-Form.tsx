import React, { useState, useEffect, useMemo } from "react";
import { 
  View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, 
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, StatusBar, 
  Pressable 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, X, Save, ChevronRight, ChevronLeft, User, MapPin, Briefcase, HeartPulse, Calendar, Edit } from "lucide-react-native";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { CalendarPicker, AdToBs, BsToAd } from "react-native-nepali-picker";
import { updateMother, getMotherProfile } from "../../hooks/database/models/MotherModel";
import { useToast } from "../../context/ToastContext";
import CameraCapture from "../CameraCapture";
import { FieldLabel, BoxInput, SelectInput } from "../FormElements";
import { Button } from "../button";
import { ProfilePicker } from "../ProfilePicker";
import { 
  EDUCATION_LEVELS, 
  JATI_CODES, 
  BLOOD_GROUP_OPTIONS, 
  MONTHLY_INCOME_OPTIONS, 
  OCCUPATIONS 
} from "@/utils/data";
import municipalitiesData from "../../assets/json/municipalities.json";
import { Province } from "../../types/profile";
import CustomHeader from "../CustomHeader";
import { useLanguage } from "../../context/LanguageContext";

const provinces: Province[] = municipalitiesData as Province[];

export default function CompleteForm({ id }: { id?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Step 1: Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobAd, setDobAd] = useState("");
  const [dobBs, setDobBs] = useState("");
  const [phone, setPhone] = useState("");
  const [alias, setAlias] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // Step 2: Address
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [locality, setLocality] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  // Step 3: Socio-Economic
  const [ethnicity, setEthnicity] = useState("");
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [income, setIncome] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // Step 4: Partner & Health
  const [partnerName, setPartnerName] = useState("");
  const [partnerMobile, setPartnerMobile] = useState("");
  const [partnerAge, setPartnerAge] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [lmpDate, setLmpDate] = useState("");
  const [parity, setParity] = useState("");
  const [gravida, setGravida] = useState("");

  const [codeState, setCodeState] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showLmpPicker, setShowLmpPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Address Cascading
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

  useEffect(() => {
    if (id) {
      const fetchEditData = async () => {
        try {
          setIsLoading(true);
          const data = await getMotherProfile(id);
          if (data) {
            setFirstName(data.first_name || "");
            setLastName(data.lastName || "");
            setPhone(data.phone || "");
            setDobAd(data.dateOfBirth || "");
            if (data.dateOfBirth) {
              try { setDobBs(AdToBs(data.dateOfBirth)); } catch (e) {}
            }
            setSelectedProvince(data.addressProvince || "");
            setSelectedDistrict(data.addressDistrict || "");
            setSelectedMunicipality(data.addressMunicipality || "");
            setSelectedWard(data.addressWard || "");
            
            setPartnerName(data.partnerName || "");
            setPartnerMobile(data.partnerMobile || "");
            setPartnerAge(data.partnerAge || "");
            setEmergencyContact(data.emergencyContactNumber || "");
            setAlias(data.alias || "");
            setLocality(data.addressLocality || "");
            setHouseNumber(data.addressHouseNumber || "");
            setIncome(data.income || "");
            setOccupation(data.occupation || "");
            setBloodGroup(data.bloodGroup || "");
            
            setEthnicity(data.ethnicity || "");
            setEducation(data.education || "");
            
            if (data.gravida !== undefined && data.gravida !== null) setGravida(String(data.gravida));
            if (data.parity !== undefined && data.parity !== null) setParity(String(data.parity));
            
            setLmpDate(data.lmp || "");
            
            if (data.image && !data.image.includes("vectorified")) {
              setPhotoUrl(data.image);
            }
            setCodeState(data.code || null);
          }
        } catch (e) {
          console.error("error fetching mother profile", e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEditData();
    }
  }, [id]);

  const validateStep = (step: number) => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!firstName.trim()) e.firstName = t("mother_form.validation.first_name_req");
      if (!lastName.trim()) e.lastName = t("mother_form.validation.last_name_req");
      if (!dobAd) e.dob = t("mother_form.validation.dob_req");
      if (phone && phone.length !== 10) e.phone = t("mother_form.validation.phone_digits");
    }
    if (step === 2) {
      if (!selectedProvince) e.province = t("mother_form.validation.province_req");
      if (!selectedDistrict) e.district = t("mother_form.validation.district_req");
      if (!selectedMunicipality) e.municipality = t("mother_form.validation.municipality_req");
      if (!selectedWard) e.ward = t("mother_form.validation.ward_req");
    }
    if (step === 4) {
      const g = parseInt(gravida) || 0;
      const p = parseInt(parity) || 0;
      if (p > g) {
        e.parity = t("pregnancy_form.validation.parity_invalid");
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const save = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      if (!id || typeof id !== 'string') {
        showToast(t("complete_form.messages.missing_id"));
        setIsLoading(false);
        return;
      }

      await updateMother({
        id: id,
        code: codeState || "",
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        date_of_birth: dobAd,
        address_province: selectedProvince,
        address_district: selectedDistrict,
        address_municipality: selectedMunicipality,
        address_ward: selectedWard,
        address_locality: locality,
        address_house_number: houseNumber,
        husband_name: partnerName,
        ethnicity: ethnicity,
        education: education,
        occupation: occupation,
        income: income,
        blood_group: bloodGroup,
        photo: photoUrl ?? undefined,
        alias: alias,
        partner_name: partnerName,
        partner_mobile: partnerMobile,
        partner_age: partnerAge,
        emergency_contact_number: emergencyContact,
        lmp_date: lmpDate,
        parity: parseInt(parity) || 0,
        gravida: parseInt(gravida) || 0,
        is_synced: false,
      });

      showToast("Mother details updated successfully");
      router.replace("/dashboard/profile");
    } catch (err) {
      console.error("Error saving form:", err);
      showToast(t("complete_form.messages.save_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = () => {
    Alert.alert(
      t("complete_form.photo_options.title"),
      t("complete_form.photo_options.subtitle"),
      [
        { text: t("complete_form.photo_options.take"), onPress: () => setShowCamera(true) },
        { text: t("complete_form.photo_options.gallery"), onPress: chooseFromGallery },
        ...(photoUrl
          ? [{ text: t("complete_form.photo_options.remove"), onPress: () => { setPhotoUrl(null); showToast(t("complete_form.messages.photo_removed")); }, style: "destructive" as const }]
          : []),
        { text: t("complete_form.photo_options.cancel"), style: "cancel" as const },
      ],
      { cancelable: true }
    );
  };

  const chooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast(t("complete_form.messages.gallery_permission"));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUrl(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Gallery picker error:", err);
      showToast(t("complete_form.messages.pick_error"));
    }
  };

  const StepIndicator = () => (
    <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
      {[1, 2, 3, 4].map((step) => (
        <View key={step} className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center ${
            currentStep === step ? "bg-primary" : 
            currentStep > step ? "bg-green-500" : "bg-gray-200"
          }`}>
            {currentStep > step ? (
               <Text className="text-white text-xs font-bold">✓</Text>
            ) : (
              <Text className={`text-xs font-bold ${currentStep === step ? "text-white" : "text-gray-500"}`}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && <View className={`w-10 h-[2px] mx-1 ${currentStep > step ? "bg-green-500" : "bg-gray-200"}`} />}
        </View>
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View className="p-6">
            <Text className="text-xl font-bold text-slate-800 mb-6 flex-row items-center">
              <User size={20} color="#0056D2" />  {t("complete_form.steps.personal")}
            </Text>
            
            <TouchableOpacity onPress={handlePhotoUpload} className="items-center mb-8">
              <View className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} className="w-full h-full" />
                ) : (
                  <Camera size={32} color="#94a3b8" />
                )}
              </View>
              <Text className="text-primary font-semibold mt-2 text-sm">{t("complete_form.fields.upload_photo")}</Text>
            </TouchableOpacity>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FieldLabel label={t("complete_form.fields.first_name")} />
                <BoxInput
                  placeholder={t("complete_form.fields.first_name")}
                  value={firstName}
                  onChangeText={(t) => { setFirstName(t); setErrors({ ...errors, firstName: "" }); }}
                  error={errors.firstName}
                />
              </View>
              <View className="flex-1">
                <FieldLabel label={t("complete_form.fields.last_name")} />
                <BoxInput
                  placeholder={t("complete_form.fields.last_name")}
                  value={lastName}
                  onChangeText={(t) => { setLastName(t); setErrors({ ...errors, lastName: "" }); }}
                  error={errors.lastName}
                />
              </View>
            </View>

            <FieldLabel label={t("complete_form.fields.dob")} />
            <Pressable onPress={() => setShowDobPicker(true)} className="mb-6">
              <View className={`rounded-md px-4 h-14 border ${errors.dob ? "border-red-300" : "border-gray-300"} flex-row items-center justify-between bg-white`}>
                <Text className={`text-base ${dobBs ? "text-[#1E293B]" : "text-[#9CA3AF]"}`}>
                  {dobBs || t("complete_form.fields.dob_placeholder")}
                </Text>
                <Calendar size={18} color="#0056D2" />
              </View>
              {errors.dob && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.dob}</Text>}
            </Pressable>

            <FieldLabel label={t("complete_form.fields.phone")} />
            <BoxInput
              placeholder="98*******"
              value={phone}
              onChangeText={(t) => { setPhone(t.replace(/\D/g, "")); setErrors({ ...errors, phone: "" }); }}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />

            <FieldLabel label={t("complete_form.fields.alias")} />
            <BoxInput
              placeholder={t("complete_form.fields.alias_placeholder")}
              value={alias}
              onChangeText={setAlias}
            />
          </View>
        );
      case 2:
        return (
          <View className="p-6">
            <Text className="text-xl font-bold text-slate-800 mb-6">
              <MapPin size={20} color="#0056D2" />  {t("complete_form.steps.address")}
            </Text>

            <ProfilePicker
              label={t("complete_form.fields.province")}
              placeholder={t("complete_form.fields.province")}
              selectedValue={selectedProvince}
              onValueChange={(val) => {
                setSelectedProvince(val);
                setSelectedDistrict("");
                setSelectedMunicipality("");
                setSelectedWard("");
              }}
              options={provinces.map(p => p.id)}
              getOptionLabel={(pid) => {
                const p = provinces.find(pr => pr.id === pid);
                return p ? (language === "np" ? `${p.name_ne} (${p.name_en})` : `${p.name_en} (${p.name_ne})`) : pid;
              }}
              error={errors.province}
            />

            <ProfilePicker
              label={t("complete_form.fields.district")}
              placeholder={t("complete_form.fields.district")}
              selectedValue={selectedDistrict}
              onValueChange={(val) => {
                setSelectedDistrict(val);
                setSelectedMunicipality("");
                setSelectedWard("");
              }}
              options={districts.map(d => d.id)}
              getOptionLabel={(did) => {
                const d = districts.find(di => di.id === did);
                return d ? (language === "np" ? `${d.name_ne} (${d.name_en})` : `${d.name_en} (${d.name_ne})`) : did;
              }}
              error={errors.district}
            />

            <ProfilePicker
              label={t("complete_form.fields.municipality")}
              placeholder={t("complete_form.fields.municipality")}
              selectedValue={selectedMunicipality}
              onValueChange={(val) => {
                setSelectedMunicipality(val);
                setSelectedWard("");
              }}
              options={municipalities.map(m => m.id)}
              getOptionLabel={(mid) => {
                const m = municipalities.find(mu => mu.id === mid);
                return m ? (language === "np" ? `${m.name_ne} (${m.name_en})` : `${m.name_en} (${m.name_ne})`) : mid;
              }}
              error={errors.municipality}
            />

            <ProfilePicker
              label={t("complete_form.fields.ward")}
              placeholder={t("complete_form.fields.ward")}
              selectedValue={selectedWard}
              onValueChange={setSelectedWard}
              options={wards.map(w => w.id)}
              getOptionLabel={(wid) => {
                const w = wards.find(wa => wa.id === wid);
                return w ? (language === "np" ? `वडा ${w.number}` : `Ward ${w.number}`) : wid;
              }}
              error={errors.ward}
            />

            <FieldLabel label={t("complete_form.fields.locality")} />
            <BoxInput placeholder={t("complete_form.fields.locality_placeholder")} value={locality} onChangeText={setLocality} />

            <FieldLabel label={t("complete_form.fields.house_number")} />
            <BoxInput placeholder={t("complete_form.fields.house_number_placeholder")} value={houseNumber} onChangeText={setHouseNumber} />
          </View>
        );
      case 3:
        return (
          <View className="p-6">
            <Text className="text-xl font-bold text-slate-800 mb-6">
              <Briefcase size={20} color="#0056D2" />  {t("complete_form.steps.socio_economic")}
            </Text>

            <ProfilePicker
              label={t("complete_form.fields.ethnicity")}
              placeholder={t("complete_form.fields.ethnicity")}
              selectedValue={ethnicity}
              options={JATI_CODES.map(j => ({ value: j.code, label: j.name }))}
              onValueChange={setEthnicity}
            />

            <ProfilePicker
              label={t("complete_form.fields.education")}
              placeholder={t("complete_form.fields.education")}
              selectedValue={education}
              options={EDUCATION_LEVELS}
              onValueChange={setEducation}
            />

            <ProfilePicker
              label={t("complete_form.fields.occupation")}
              placeholder={t("complete_form.fields.occupation")}
              selectedValue={occupation}
              options={OCCUPATIONS}
              onValueChange={setOccupation}
            />

            <ProfilePicker
              label={t("complete_form.fields.income")}
              placeholder={t("complete_form.fields.income")}
              selectedValue={income}
              options={MONTHLY_INCOME_OPTIONS}
              onValueChange={setIncome}
            />

            <ProfilePicker
              label={t("complete_form.fields.blood_group")}
              placeholder={t("complete_form.fields.blood_group")}
              selectedValue={bloodGroup}
              options={BLOOD_GROUP_OPTIONS}
              onValueChange={setBloodGroup}
            />
          </View>
        );
      case 4:
        return (
          <View className="p-6">
            <Text className="text-xl font-bold text-slate-800 mb-6">
              <HeartPulse size={20} color="#0056D2" />  {t("complete_form.steps.health")}
            </Text>

            <FieldLabel label={t("complete_form.fields.partner_name")} />
            <BoxInput placeholder={t("complete_form.fields.partner_name_placeholder")} value={partnerName} onChangeText={setPartnerName} />

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FieldLabel label={t("complete_form.fields.partner_mobile")} />
                <BoxInput 
                  placeholder="98*******" 
                  value={partnerMobile} 
                  onChangeText={setPartnerMobile} 
                  keyboardType="phone-pad" 
                  maxLength={10} 
                />
              </View>
              <View className="flex-1">
                <FieldLabel label={t("complete_form.fields.partner_age")} />
                <BoxInput 
                  placeholder={t("complete_form.fields.years_placeholder")} 
                  value={partnerAge} 
                  onChangeText={setPartnerAge} 
                  keyboardType="numeric" 
                />
              </View>
            </View>

            <FieldLabel label={t("complete_form.fields.lmp")} />
            <Pressable onPress={() => setShowLmpPicker(true)} className="mb-6">
              <View className="rounded-md px-4 h-14 border border-gray-300 flex-row items-center justify-between bg-white">
                <Text className={`text-base ${lmpDate ? "text-[#1E293B]" : "text-[#9CA3AF]"}`}>
                  {lmpDate || t("complete_form.fields.lmp_placeholder")}
                </Text>
                <Calendar size={18} color="#0056D2" />
              </View>
            </Pressable>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <FieldLabel label={t("complete_form.fields.gravida")} />
                <BoxInput placeholder="0" value={gravida} onChangeText={setGravida} keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <FieldLabel label={t("complete_form.fields.parity")} />
                <BoxInput placeholder="0" value={parity} onChangeText={setParity} keyboardType="numeric" error={errors.parity} />
              </View>
            </View>

            <FieldLabel label={t("complete_form.fields.emergency_contact")} />
            <BoxInput 
              placeholder="98*******" 
              value={emergencyContact} 
              onChangeText={setEmergencyContact} 
              keyboardType="phone-pad" 
              maxLength={10} 
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white pt-8 pb-10">
      <StatusBar barStyle="dark-content" />
      <CustomHeader title={id ? t("complete_form.title_edit") : t("complete_form.title_new")} onBackPress={() => router.replace("/dashboard/profile")} />
      
      <StepIndicator />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="p-6 pb-28 flex-row gap-4 bg-white items-center">
        {currentStep > 1 && (
          <TouchableOpacity 
            onPress={handlePrev}
            className="flex-1 h-14 rounded-md bg-slate-100 items-center justify-center flex-row"
          >
            <ChevronLeft size={20} color="#64748b" />
          </TouchableOpacity>
        )}
        
        {currentStep < totalSteps ? (
          <TouchableOpacity 
            onPress={handleNext}
            className="flex-[2] h-14 rounded-md bg-primary/80 items-center justify-center flex-row"
          >
            <Text className="text-white font-bold text-base mr-2">{t("complete_form.buttons.continue")}</Text>
            <ChevronRight size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={save}
            className="flex-[2] h-14 rounded-md bg-primary/80 items-center justify-center flex-row"
          >
            {isLoading ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-bold text-base">{id ? t("complete_form.buttons.finish_update") : t("complete_form.buttons.complete_reg")}</Text>}
          </TouchableOpacity>
        )}
      </View>

      <CameraCapture
        visible={showCamera}
        onCapture={(uri) => { setPhotoUrl(uri); setShowCamera(false); }}
        onClose={() => setShowCamera(false)}
      />

      <CalendarPicker
        visible={showDobPicker}
        onClose={() => setShowDobPicker(false)}
        onDateSelect={(bsDate) => {
          setShowDobPicker(false);
          setDobBs(bsDate);
          setErrors({ ...errors, dob: "" });
          try { setDobAd(BsToAd(bsDate)); } catch (e) {}
        }}
        language={language === "np" ? "np" : "en"}
        theme="light"
        brandColor="#0056D2"
        date={dobBs || undefined}
      />

      <CalendarPicker
        visible={showLmpPicker}
        onClose={() => setShowLmpPicker(false)}
        onDateSelect={(bsDate) => {
          setShowLmpPicker(false);
          setLmpDate(bsDate);
        }}
        language={language === "np" ? "np" : "en"}
        theme="light"
        brandColor="#0056D2"
        date={lmpDate || undefined}
      />
    </SafeAreaView>
  );
}
