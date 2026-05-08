import { ChevronDown } from "lucide-react-native";
import { Text, View } from "react-native";
import Dropdown from "react-native-input-select";

export const ProfilePicker = ({
  label,
  selectedValue,
  onValueChange,
  options,
  placeholder,
  getOptionLabel,
  error,
  isSearchable = false,
  disabled = false
}: {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: any[];
  placeholder: string;
  getOptionLabel?: (value: string) => string;
  error?: string;
  isSearchable?: boolean;
  disabled?: boolean;
}) => {
  return (
    <View>
      <Text className="mb-1.5 text-[14px] text-[#64748b]">
        {label}
      </Text>

      <Dropdown
        placeholder={placeholder}
        options={options.map((option) => {
          if (typeof option === 'object' && option !== null && 'value' in option) {
            return {
              label: option.label || getOptionLabel?.(option.value) || option.value,
              value: option.value
            };
          }
          return {
            label: getOptionLabel ? getOptionLabel(option) : option,
            value: option
          };
        })}
        selectedValue={selectedValue}
        onValueChange={(value) => onValueChange(String(value))}
        isSearchable={isSearchable}
        disabled={disabled}
        primaryColor="#eb6189"
        dropdownStyle={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: error ? "#fca5a5" : "#d1d5db",
          backgroundColor: "#ffffff",
          borderRadius: 5,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginBottom: 0
        }}
        dropdownIcon={<ChevronDown size={18} color="#0f172a" />}
        dropdownIconStyle={{
          top: 15,
          right: 15
        }}
        selectedItemStyle={{
          fontSize: 15,
          color: "#0f172a"
        }}
        placeholderStyle={{
          fontSize: 15,
          color: "#94a3b8"
        }}
      />
      {error ? (
        <Text className="text-red-500 text-xs mt-1 ml-1 font-medium">{error}</Text>
      ) : null}
    </View>
  );
};
