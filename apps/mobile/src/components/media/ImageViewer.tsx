import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ImageViewerData {
  uri: string;
  prompt?: string;
  date?: string;
}

interface ImageViewerProps {
  data: ImageViewerData | null;
  visible: boolean;
  onClose: () => void;
}

export function ImageViewer({ data, visible, onClose }: ImageViewerProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetTransforms = () => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Pinch to zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        resetTransforms();
      }
    });

  // Pan (only when zoomed)
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      } else {
        // Swipe down to dismiss
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (savedScale.value > 1) {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      } else {
        // Dismiss if swiped down far enough
        if (e.translationY > 100) {
          translateY.value = withTiming(SCREEN_HEIGHT, { duration: 200 });
          runOnJS(onClose)();
        } else {
          translateY.value = withSpring(0);
        }
      }
    });

  // Double tap to zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        resetTransforms();
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture,
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleShare = async () => {
    if (!data?.uri) return;
    try {
      await Share.share({
        message: data.prompt
          ? `Check out this image I generated: ${data.prompt}`
          : 'Check out this generated image!',
        url: data.uri,
      });
    } catch {
      // cancelled
    }
  };

  const handleClose = () => {
    // Reset state for next open
    setImageLoaded(false);
    setShowInfo(false);
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onClose();
  };

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GestureHandlerRootView style={viewerStyles.container}>
        {/* Header */}
        <View style={viewerStyles.header}>
          <TouchableOpacity onPress={handleClose} style={viewerStyles.headerBtn}>
            <Text style={viewerStyles.headerBtnText}>✕</Text>
          </TouchableOpacity>
          <View style={viewerStyles.headerRight}>
            {(data.prompt || data.date) && (
              <TouchableOpacity
                onPress={() => setShowInfo(!showInfo)}
                style={viewerStyles.headerBtn}
              >
                <Text style={viewerStyles.headerBtnText}>ℹ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShare} style={viewerStyles.headerBtn}>
              <Text style={viewerStyles.headerBtnText}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View style={viewerStyles.imageContainer}>
          {!imageLoaded && (
            <ActivityIndicator
              size="large"
              color="#8B5CF6"
              style={viewerStyles.loader}
            />
          )}
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[viewerStyles.imageWrapper, animatedImageStyle]}>
              <Image
                source={{ uri: data.uri }}
                style={viewerStyles.image}
                resizeMode="contain"
                onLoad={() => setImageLoaded(true)}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Info panel */}
        {showInfo && (data.prompt || data.date) && (
          <View style={viewerStyles.infoPanel}>
            {data.prompt && (
              <View style={viewerStyles.infoSection}>
                <Text style={viewerStyles.infoLabel}>Prompt</Text>
                <View style={viewerStyles.promptBox}>
                  <Text style={viewerStyles.promptText}>{data.prompt}</Text>
                </View>
              </View>
            )}
            {data.date && (
              <View style={viewerStyles.infoSection}>
                <Text style={viewerStyles.infoLabel}>Created</Text>
                <Text style={viewerStyles.infoValue}>
                  {new Date(data.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const viewerStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    position: 'absolute',
    zIndex: 5,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  infoSection: {
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptBox: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  promptText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  infoValue: {
    fontSize: 14,
    color: '#D1D5DB',
  },
});
