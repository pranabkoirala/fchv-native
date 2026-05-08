import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CompleteForm from '@/components/forms/Complete-Form';

export default function CompleteProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CompleteForm id={id} />;
}
