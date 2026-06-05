import { AlertTriangle, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, View } from "react-native";
import AppButton from "./common/AppButton";
import AppText from "./common/AppText";
import ModalWithSafeArea from "./common/ModalWithSafeArea";

interface BaseProps {
  visible: boolean;
  message: string;
  setVisible: (visible: boolean) => void;
}

interface ToastProps extends BaseProps {
  variant?: "toast";
  durationMs?: number;
}

interface ConfirmProps extends BaseProps {
  variant: "confirm";
  title?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
  dismissible?: boolean;
  tone?: "default" | "danger";
}

type Props = ToastProps | ConfirmProps;

const ToastMessage: React.FC<ToastProps> = ({
  visible,
  message,
  setVisible,
  durationMs = 1000
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true
        }).start(() => {
          // hide modal AFTER fade-out
          setVisible(false);
        });
      }, durationMs);

      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [durationMs, message, opacity, setVisible, visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastPill, { opacity }]} pointerEvents="none">
      <AppText weight="600" style={styles.toastText}>
        {message}
      </AppText>
    </Animated.View>
  );
};

const ConfirmModal: React.FC<ConfirmProps> = ({
  visible,
  title = "Confirm",
  message,
  setVisible,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  error,
  dismissible = true,
  tone = "default"
}) => {
  const isDanger = tone === "danger";

  const handleCancel = () => {
    if (loading) return;
    onCancel?.();
    setVisible(false);
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  return (
    <ModalWithSafeArea
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (dismissible && !loading) {
          handleCancel();
        }
      }}
    >
      <View style={styles.confirmOverlay}>
        <View
          style={[
            styles.confirmContainer,
            isDanger && styles.confirmContainerDanger
          ]}
        >
          {dismissible && (
            <Pressable style={styles.closeButton} onPress={handleCancel}>
              <X size={20} color="#9ca3af" />
            </Pressable>
          )}
          <View style={styles.confirmContent}>
            {isDanger && (
              <View style={styles.dangerIcon}>
                <AlertTriangle size={22} color="#dc2626" />
              </View>
            )}
            <AppText
              weight="700"
              style={[
                styles.confirmTitle,
                isDanger && styles.confirmTitleDanger
              ]}
            >
              {title}
            </AppText>
            <AppText style={styles.confirmMessage}>{message}</AppText>
            {!!error && <AppText style={styles.confirmError}>{error}</AppText>}
            <View style={styles.confirmActions}>
              {dismissible && (
                <View style={styles.action}>
                  <AppButton
                    title={cancelLabel}
                    onPress={handleCancel}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  />
                </View>
              )}
              <View style={styles.action}>
                <AppButton
                  title={confirmLabel}
                  onPress={handleConfirm}
                  variant={isDanger ? "danger" : "primary"}
                  className="w-full"
                  loading={loading}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </ModalWithSafeArea>
  );
};

const ToastModal: React.FC<Props> = (props) => {
  if (props.variant === "confirm") {
    return <ConfirmModal {...props} />;
  }
  return <ToastMessage {...props} />;
};

export default ToastModal;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const styles = StyleSheet.create({
  toastPill: {
    position: "absolute",
    top: SCREEN_HEIGHT / 2 - 24,
    alignSelf: "center",
    backgroundColor: "#475569",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    elevation: 5,
    zIndex: 999
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center"
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  confirmContainer: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: "relative",
    overflow: "hidden"
  },
  confirmContainerDanger: {
    borderWidth: 1,
    borderColor: "#fecaca"
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 20
  },
  confirmContent: {
    padding: 24,
    alignItems: "center"
  },
  dangerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  confirmTitle: {
    fontSize: 20,
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8
  },
  confirmTitleDanger: {
    color: "#b91c1c"
  },
  confirmMessage: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20
  },
  confirmError: {
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 12
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8
  },
  action: {
    flex: 1
  }
});
