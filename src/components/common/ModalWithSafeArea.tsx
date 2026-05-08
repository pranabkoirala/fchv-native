import React from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ModalProps,
  View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ModalWithSafeArea = ({ children, ...modalProps }: ModalProps) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = Dimensions.get("window");

  // If callers request "slide", do a smoother translateY animation ourselves.
  const shouldAnimateSlide = modalProps.animationType === "slide";
  const requestedVisible = !!modalProps.visible;
  const [rendered, setRendered] = React.useState(requestedVisible);
  const translateY = React.useRef(new Animated.Value(windowHeight)).current;

  React.useEffect(() => {
    if (!shouldAnimateSlide) return;

    if (requestedVisible) {
      setRendered(true);
      translateY.setValue(windowHeight);
      // Smooth spring from bottom to top that takes a bit of time to settle perfectly
      Animated.spring(translateY, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true
      }).start();
      return;
    }

    // Closing: keep mounted, slide down, then unmount.
    Animated.timing(translateY, {
      toValue: windowHeight,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [requestedVisible, shouldAnimateSlide, translateY, windowHeight]);

  return (
    <Modal
      {...modalProps}
      visible={shouldAnimateSlide ? rendered : modalProps.visible}
      animationType={shouldAnimateSlide ? "none" : modalProps.animationType}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1
          }}
        >
          {shouldAnimateSlide ? (
            <Animated.View
              style={{
                flex: 1,
                transform: [{ translateY }]
              }}
            >
              {children}
            </Animated.View>
          ) : (
            children
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default ModalWithSafeArea;
