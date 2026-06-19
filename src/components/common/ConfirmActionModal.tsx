import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import ModalWithSafeArea from './ModalWithSafeArea';

interface ConfirmActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string | React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  loading?: boolean;
}

export default function ConfirmActionModal({
  visible,
  onClose,
  title,
  description,
  actionLabel,
  onAction,
  loading = false,
}: ConfirmActionModalProps) {
  return (
    <ModalWithSafeArea visible={visible} onRequestClose={onClose} animationType="fade" transparent>
      <Pressable 
        onPress={onClose}
        className="flex-1 bg-black/50 justify-center items-center px-4"
      >
        <Pressable onPress={(e) => e.stopPropagation()} className="bg-white w-full rounded-3xl p-6">
          
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-semibold text-slate-800">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-100 rounded-full">
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            {typeof description === 'string' ? (
              <Text className="text-slate-600 text-[15px] font-semibold leading-relaxed text-center">
                {description}
              </Text>
            ) : (
              description
            )}
          </View>

          <TouchableOpacity 
            onPress={onAction}
            disabled={loading}
            className={`w-full py-3 rounded-md flex-row justify-center items-center bg-primary`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-[16px]">{actionLabel}</Text>
            )}
          </TouchableOpacity>
          
        </Pressable>
      </Pressable>
    </ModalWithSafeArea>
  );
}
