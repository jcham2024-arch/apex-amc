import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_HEIGHT = 380;
const LOUPE_SIZE = 110;
const LOUPE_MAGNIFICATION = 2.5;

export function PrecisionTargetCanvas({ imageUri, onAddShot }) {
  // Canvas Transform Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Touch / Loupe Shared Values
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const isTouching = useSharedValue(false);

  // Registered Shots in State
  const [shots, setShots] = useState([]);

  // --- Gestures ---
  
  // 1. Pinch to Zoom
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // 2. Pan Image (2-Finger Drag)
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // 3. Single-Finger Precision Tap / Drag Loupe
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onTouchesDown((e) => {
      if (e.allTouches.length === 1) {
        touchX.value = e.allTouches[0].x;
        touchY.value = e.allTouches[0].y;
        isTouching.value = true;
      }
    })
    .onTouchesUp((e) => {
      isTouching.value = false;
      const x = (e.allTouches[0].x - translateX.value) / scale.value;
      const y = (e.allTouches[0].y - translateY.value) / scale.value;
      
      runOnJS(registerShot)({ x, y });
    });

  const registerShot = (pt) => {
    const updated = [...shots, pt];
    setShots(updated);
    if (onAddShot) onAddShot(updated);
  };

  const composedGesture = Gesture.Race(
    Gesture.Simultaneous(pinchGesture, panGesture),
    tapGesture
  );

  // Animated Styles
  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const loupeStyle = useAnimatedStyle(() => {
    return {
      opacity: isTouching.value ? 1 : 0,
      transform: [
        { translateX: touchX.value - LOUPE_SIZE / 2 },
        // Offset 80px above finger so touch point isn't obscured
        { translateY: touchY.value - LOUPE_SIZE / 2 - 80 }, 
      ],
    };
  });

  const magnifiedImageStyle = useAnimatedStyle(() => ({
    width: SCREEN_WIDTH * scale.value * LOUPE_MAGNIFICATION,
    height: CANVAS_HEIGHT * scale.value * LOUPE_MAGNIFICATION,
    transform: [
      {
        translateX:
          -touchX.value * LOUPE_MAGNIFICATION + LOUPE_SIZE / 2,
      },
      {
        translateY:
          -touchY.value * LOUPE_MAGNIFICATION + LOUPE_SIZE / 2,
      },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.canvasContainer}>
          {/* Main Image View */}
          <Animated.View style={[styles.imageWrapper, canvasStyle]}>
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
            
            {/* Render Registered Shots */}
            {shots.map((s, idx) => (
              <View
                key={idx}
                style={[styles.shotMarker, { left: s.x - 8, top: s.y - 8 }]}
              >
                <Text style={styles.shotText}>{idx + 1}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Floating Loupe Lens */}
          <Animated.View style={[styles.loupe, loupeStyle]} pointerEvents="none">
            <Animated.Image
              source={{ uri: imageUri }}
              style={[styles.magnifiedImage, magnifiedImageStyle]}
              resizeMode="contain"
            />
            {/* Crosshair inside Loupe */}
            <View style={styles.loupeCrosshairH} />
            <View style={styles.loupeCrosshairV} />
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvasContainer: {
    width: SCREEN_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  imageWrapper: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  shotMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotText: { color: '#ffffff', fontSize: 8, fontWeight: '900' },
  loupe: {
    position: 'absolute',
    width: LOUPE_SIZE,
    height: LOUPE_SIZE,
    borderRadius: LOUPE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#38bdf8',
    backgroundColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  magnifiedImage: { position: 'absolute' },
  loupeCrosshairH: {
    position: 'absolute',
    top: LOUPE_SIZE / 2 - 1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.8)',
  },
  loupeCrosshairV: {
    position: 'absolute',
    left: LOUPE_SIZE / 2 - 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.8)',
  },
});