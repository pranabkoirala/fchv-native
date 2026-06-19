import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "react-native";
import { saveSupplement } from "../../hooks/database/models/SupplementModel";
import ConfirmActionModal from "../common/ConfirmActionModal";

interface SupplementModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
  pregnancyId: string | null;
  supplementKey:
  | "iron_pregnancy"
  | "iron_post_delivery"
  | "vitamin_a_post_delivery"
  | "calcium";
  supplementName: string;
  onSuccess: () => void;
  showToast: (msg: string) => void;
  motherName: string;
}

export default function SupplementModal({
  visible,
  onClose,
  motherId,
  motherName,
  pregnancyId,
  supplementKey,
  supplementName,
  onSuccess,
  showToast,
}: SupplementModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { mother: motherId, pregnancy_id: pregnancyId } as any;
      payload[supplementKey] = 1;

      await saveSupplement(payload);
      showToast(t("profile.alerts.save_success"));
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(t("profile.alerts.save_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmActionModal
      visible={visible}
      onClose={onClose}
      title={t("profile.supplements.add_title")}
      description={
        <Text className="text-slate-600 text-[15px] font-semibold leading-relaxed text-center">
          {t("profile.supplements.confirm_q", {
            name: supplementName,
            mother: motherName,
          })}
        </Text>
      }
      actionLabel={t("profile.supplements.give_btn")}
      onAction={handleSave}
      loading={loading}
    />
  );
}
