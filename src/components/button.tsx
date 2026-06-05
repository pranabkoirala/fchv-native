import { Save } from "lucide-react-native";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

export const Button = ({
  onPress,
  isLoading,
  title,
  icon: Icon = Save,
}: {
  onPress: () => void;
  isLoading?: boolean;
  title: string;
  icon?: any;
}) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={onPress}
    disabled={isLoading}
    className="bg-primary px-5 rounded-lg h-14 flex-row items-center justify-center mb-2"
  >
    {isLoading ? (
      <ActivityIndicator color="white" size="small" />
    ) : (
      <>
        {/* {Icon && <Icon size={19} color="white" strokeWidth={2} />} */}
        <Text className="text-white font-semibold text-lg ml-2">{title}</Text>
      </>
    )}
  </TouchableOpacity>
);
