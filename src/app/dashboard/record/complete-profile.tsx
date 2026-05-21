import CompleteForm from "@/components/forms/Complete-Form";
import { useLocalSearchParams } from "expo-router";

export default function CompleteProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CompleteForm id={id} />;
}
