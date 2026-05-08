import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  Pill,
  Droplet,
  ChevronLeft,
} from "lucide-react-native";
import "../../../global.css";
import { getMotherProfile } from "../../../hooks/database/models/MotherModel";
import { getSupplementByMother, SupplementStoreType } from "../../../hooks/database/models/SupplementModel";
import SupplementModal from "../../../components/forms/SupplementModal";
import Colors from "../../../constants/Colors";
import CustomHeader from "../../../components/CustomHeader";
import { useToast } from "../../../context/ToastContext";
import { useTranslation } from "react-i18next";

const SectionTitle = ({ title, icon: Icon, colorClass }: any) => (
  <View className="flex-row items-center mb-4 mt-2">
    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${colorClass}`}>
      <Icon size={16} color="white" />
    </View>
    <Text className="text-slate-800 font-bold text-lg">{title}</Text>
  </View>
);

export default function SupplementsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  
  const [motherName, setMotherName] = useState("");
  const [supplementsRecord, setSupplementsRecord] = useState<SupplementStoreType | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [supplementModalVisible, setSupplementModalVisible] = useState(false);
  const [selectedSupplementKey, setSelectedSupplementKey] = useState<'iron_pregnancy' | 'iron_post_delivery' | 'vitamin_a_post_delivery'>('iron_pregnancy');
  const [selectedSupplementName, setSelectedSupplementName] = useState("");

  const loadData = async (motherId: string) => {
    try {
      const mother = await getMotherProfile(motherId);
      if (mother) {
        setMotherName(mother.name);
      }
      const suppData = await getSupplementByMother(motherId);
      setSupplementsRecord(suppData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadData(id);
      } else {
        setLoading(false);
      }
    }, [id])
  );

  if (loading) {
    return (
      <View className="bg-white p-10 rounded-xl border border-slate-100 items-center justify-center">
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text className="mt-2 text-slate-400 text-xs font-medium">{t("profile.states.loading")}</Text>
      </View>
    );
  }

  return (
   <View>
       <View>
         <View className="bg-white p-5 rounded-xl border border-slate-100">
           <SectionTitle title={t("profile.supplements.title")} icon={Pill} colorClass="bg-rose-500" />
           <View className="gap-y-3">
             {[
               { label: t("profile.supplements.iron_preg"), val: supplementsRecord?.iron_pregnancy === 1, icon: Pill, key: 'iron_pregnancy' },
               { label: t("profile.supplements.iron_pnc"), val: supplementsRecord?.iron_post_delivery === 1, icon: Pill, key: 'iron_post_delivery' },
               { label: t("profile.supplements.vit_a"), val: supplementsRecord?.vitamin_a_post_delivery === 1, icon: Droplet, key: 'vitamin_a_post_delivery' }
             ].map((item, idx) => (
               <View key={idx} className="flex-row items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100/50">
                 <View className="flex-row items-center flex-1 pr-4 gap-2">
                   <item.icon size={18} color={item.val ? "#10B981" : "#64748B"} className="mr-3" />
                   <Text className={`font-bold text-[13px] leading-snug ${item.val ? 'text-emerald-800' : 'text-slate-700'}`}>{item.label}</Text>
                 </View>
                 {item.val ? (
                   <View className="px-3 py-1.5 rounded-md bg-emerald-100 flex-row items-center">
                     <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mr-1.5">
                       {t("profile.supplements.done") || "Given"}
                     </Text>
                     <View className="w-2 h-2 rounded-full bg-emerald-500" />
                   </View>
                 ) : (
                   <TouchableOpacity
                     onPress={() => {
                       setSelectedSupplementKey(item.key as any);
                       setSelectedSupplementName(item.label);
                       setSupplementModalVisible(true);
                     }}
                     className="px-4 py-1.5 rounded-md bg-primary/80"
                   >
                     <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
                       {t("profile.supplements.add_btn")}
                     </Text>
                   </TouchableOpacity>
                 )}
               </View>
             ))}
           </View>
         </View>

       </View>

       {id && (
         <SupplementModal
           visible={supplementModalVisible}
           onClose={() => setSupplementModalVisible(false)}
           motherId={id}
           motherName={motherName}
           supplementKey={selectedSupplementKey}
           supplementName={selectedSupplementName}
           onSuccess={() => loadData(id)}
           showToast={showToast}
         />
       )}

   </View>
  );
}
