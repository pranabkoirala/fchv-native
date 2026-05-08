import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  X,
  RotateCcw,
  Check,
  Camera as CameraIcon,
} from "lucide-react-native";

type Props = {
  visible: boolean;
  onCapture: (uri: string) => void;
  onClose: () => void;
};

export default function CameraCapture({ visible, onCapture, onClose }: Props) {
  const [facing, setFacing] = useState<"front" | "back">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isTaking, setIsTaking] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });
      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    } catch (err) {
      console.error("Failed to take picture:", err);
    } finally {
      setIsTaking(false);
    }
  };

  const confirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleClose = () => {
    setCapturedPhoto(null);
    onClose();
  };

  // ─── Render permission prompt ───
  const renderPermissionScreen = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIcon}>
          <CameraIcon size={48} color="#10B981" strokeWidth={1.5} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          We need camera access to take a photo of the mother.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          activeOpacity={0.85}
        >
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permissionCancel}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={styles.permissionCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ─── Render photo preview (after capture) ───
  const renderPreview = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={{ uri: capturedPhoto! }} style={styles.preview} />
      <View style={styles.previewOverlay}>
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retakePhoto}
            activeOpacity={0.85}
          >
            <RotateCcw size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPhoto}
            activeOpacity={0.85}
          >
            <Check size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  // ─── Render live camera ───
  const renderCamera = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Take Photo</Text>
          <TouchableOpacity
            style={styles.topButton}
            onPress={toggleFacing}
            activeOpacity={0.7}
          >
            <RotateCcw size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            activeOpacity={0.8}
            disabled={isTaking}
          >
            {isTaking ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );

  // ─── Determine what content to show inside modal ───
  const renderContent = () => {
    if (!permission || !permission.granted) {
      return renderPermissionScreen();
    }
    if (capturedPhoto) {
      return renderPreview();
    }
    return renderCamera();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
    justifyContent: "space-between",
  },
  // ─── Permission screen ───
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  permissionCancel: {
    paddingVertical: 12,
  },
  permissionCancelText: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 15,
  },
  // ─── Top bar ───
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
  // ─── Bottom bar ───
  bottomBar: {
    alignItems: "center",
    paddingBottom: 50,
    paddingTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  // ─── Preview ───
  preview: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  previewControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingBottom: 60,
    paddingTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  retakeButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    minWidth: 110,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    minWidth: 110,
  },
  controlLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
    marginTop: 4,
  },
});
