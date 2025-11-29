/**
 * AnimatedIcon Component
 * Wrapper for Lottie animations with predefined animation types
 */

import React, { useRef } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

// Animation sources
const ANIMATIONS = {
  success: require('../../assets/animations/success.json'),
  error: require('../../assets/animations/error.json'),
  loading: require('../../assets/animations/loading.json'),
};

export type AnimationType = keyof typeof ANIMATIONS;

export interface AnimatedIconProps {
  /** Type of animation to display */
  type: AnimationType;
  /** Width and height of the animation */
  size?: number;
  /** Whether to auto-play the animation */
  autoPlay?: boolean;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Custom style for the container */
  style?: ViewStyle;
  /** Test ID for testing */
  testID?: string;
  /** Callback when animation completes */
  onAnimationFinish?: () => void;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  type,
  size = 100,
  autoPlay = true,
  loop = false,
  style,
  testID,
  onAnimationFinish,
}) => {
  const animationRef = useRef<LottieView>(null);

  return (
    <View style={[styles.container, { width: size, height: size }, style]} testID={testID}>
      <LottieView
        ref={animationRef}
        source={ANIMATIONS[type]}
        autoPlay={autoPlay}
        loop={loop}
        style={{ width: size, height: size }}
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedIcon;
