import React, { useState } from 'react';
import { Text } from 'react-native';
import { saveCounseling } from '../../hooks/database/models/CounselingModel';
import ConfirmActionModal from '../common/ConfirmActionModal';
import { useTranslation } from 'react-i18next';

interface CounselingModalProps {
  visible: boolean;
  onClose: () => void;
  motherId: string;
  motherName: string;
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

export default function CounselingModal({
  visible,
  onClose,
  motherId,
  motherName,
  onSuccess,
  showToast
}: CounselingModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveCounseling({ mother_id: motherId, is_counseled: 1 });
      showToast(t("profile.alerts.save_success") || "Counseling status updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      showToast(t("profile.alerts.save_error") || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmActionModal
      visible={visible}
      onClose={onClose}
      title="Add Counseling"
      description={
        <Text className="text-slate-600 text-base font-medium leading-relaxed text-center">
          Did you provide counseling to <Text className="font-bold text-slate-800">{motherName}</Text>?
        </Text>
      }
      actionLabel="Yes, Counseled"
      onAction={handleSave}
      loading={loading}
    />
  );
}
