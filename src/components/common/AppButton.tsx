import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  Pressable,
  TouchableOpacityProps,
  View,
} from "react-native";
import AppText, { FontWeight } from "./AppText";
import { cn } from "@/utils/utils";

// VARIANTS
type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "outline"
  | "ghost"
  | "floating";

// SIZES
type ButtonSize = "sm" | "md" | "lg";

// ROUNDED
type Rounded = "none" | "sm" | "md" | "lg" | "full";

interface AppButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: Rounded;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  textClassName?: ReactNode;
  icon?: ReactNode;
  loaderStyle?: ActivityIndicatorProps;
  weight?: FontWeight;
}

export default function AppButton({
  title,
  variant = "primary",
  size = "md",
  rounded = "full",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  icon,
  className,
  textClassName,
  loaderStyle,
  weight,
  ...props
}: AppButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-primary-500",
    secondary: "bg-secondary-500",
    success: "bg-success-500",
    danger: "bg-danger-500",
    outline: "border border-gray-200 bg-white",
    ghost: "bg-transparent",
    floating: "bg-primary-500",
  };

  // TEXT COLORS
  const textColor: Record<ButtonVariant, string> = {
    primary: "text-white",
    secondary: "text-white",
    success: "text-white",
    danger: "text-white",
    outline: "text-text",
    ghost: "text-text-secondary",
    floating: "text-white",
  };

  // SIZES
  const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  // ROUNDED
  const roundedStyles: Record<Rounded, string> = {
    none: "rounded-none",
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    full: "rounded-full",
  };

  // BASE STYLE
  let baseStyle = `
    flex-row items-center justify-center
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${roundedStyles[rounded]}
    ${disabled ? "opacity-50" : ""}
  `;

  // Floating variant overrides
  if (variant === "floating") {
    baseStyle = `
      absolute bottom-6 right-6
      w-16 h-16
      flex items-center justify-center
      bg-primary-500
      rounded-full
    `;
  }

  return (
    <Pressable
      android_ripple={{
        color: "rgba(0, 0, 0, 0.05)",
        borderless: false,
        foreground: true,
      }}
      disabled={disabled || loading}
      className={cn(baseStyle, className)}
      style={[{ alignSelf: "flex-start", overflow: "hidden" }, props.style]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="white" {...loaderStyle} />
      ) : variant === "floating" ? (
        icon || <AppText className="text-xl text-white">+</AppText>
      ) : icon ? (
        icon
      ) : (
        <View className="flex-row items-center gap-2">
          {leftIcon}
          {title && (
            <AppText
              className={cn(`!${textColor[variant]}`, textClassName)}
              weight={weight}
            >
              {title}
            </AppText>
          )}
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}
