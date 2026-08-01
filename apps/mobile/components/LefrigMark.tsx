import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type Props = {
  size?: number;
  /** Anillo punteado (solo a partir de ~44px) */
  showOrbit?: boolean;
};

/** Rosa de los vientos Lefrig — logo oficial (paridad con web LefrigMark) */
export function LefrigMark({ size = 72, showOrbit }: Props) {
  const uid = 'lf';
  const orbit = showOrbit ?? size >= 44;

  return (
    <View style={[styles.shell, { width: size, height: size }]} accessibilityRole="image" accessibilityLabel="Lefrig">
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`${uid}-gn-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#52d492" />
            <Stop offset="100%" stopColor="#1f7a52" />
          </LinearGradient>
          <LinearGradient id={`${uid}-gn-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6ee7a8" />
            <Stop offset="100%" stopColor="#2d9a64" />
          </LinearGradient>
          <LinearGradient id={`${uid}-gd-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#c9a24d" />
            <Stop offset="100%" stopColor="#8a6b2e" />
          </LinearGradient>
          <LinearGradient id={`${uid}-gd-b`} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#f0cc7a" />
            <Stop offset="100%" stopColor="#d4a853" />
          </LinearGradient>
          <LinearGradient id={`${uid}-or-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#c45c3a" />
            <Stop offset="100%" stopColor="#8f3d24" />
          </LinearGradient>
          <LinearGradient id={`${uid}-or-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#e88a5c" />
            <Stop offset="100%" stopColor="#d4613f" />
          </LinearGradient>
          <LinearGradient id={`${uid}-pu-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#5c3f8f" />
            <Stop offset="100%" stopColor="#3d2860" />
          </LinearGradient>
          <LinearGradient id={`${uid}-pu-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#8b6fc4" />
            <Stop offset="100%" stopColor="#6b4fa0" />
          </LinearGradient>
        </Defs>

        {orbit ? (
          <Circle
            cx="50"
            cy="50"
            r="44"
            stroke="rgba(244,241,234,0.22)"
            strokeWidth="0.75"
            strokeDasharray="2 4"
            fill="none"
          />
        ) : null}

        <Path d="M58 42 L68 32 L52 48 Z" fill="#2e2e36" />
        <Path d="M58 58 L68 68 L52 52 Z" fill="#35353f" />
        <Path d="M42 58 L32 68 L48 52 Z" fill="#2e2e36" />
        <Path d="M42 42 L32 32 L48 48 Z" fill="#35353f" />

        <Path d="M50 11 L61 27 L50 35 L39 27 Z" fill={`url(#${uid}-gn-a)`} />
        <Path d="M50 11 L50 35 L39 27 Z" fill={`url(#${uid}-gn-b)`} opacity={0.92} />

        <Path d="M89 50 L73 61 L65 50 L73 39 Z" fill={`url(#${uid}-gd-a)`} />
        <Path d="M89 50 L65 50 L73 39 Z" fill={`url(#${uid}-gd-b)`} opacity={0.92} />

        <Path d="M50 89 L39 73 L50 65 L61 73 Z" fill={`url(#${uid}-or-a)`} />
        <Path d="M50 89 L50 65 L61 73 Z" fill={`url(#${uid}-or-b)`} opacity={0.92} />

        <Path d="M11 50 L27 39 L35 50 L27 61 Z" fill={`url(#${uid}-pu-a)`} />
        <Path d="M11 50 L35 50 L27 61 Z" fill={`url(#${uid}-pu-b)`} opacity={0.92} />

        <Circle cx="50" cy="50" r="11" fill="#08090c" />
        <Circle cx="50" cy="50" r="11" stroke="#c9a24d" strokeWidth="1.25" fill="none" />
        <Circle cx="50" cy="50" r="2.2" fill="#f4f1ea" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
