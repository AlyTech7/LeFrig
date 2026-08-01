import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

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
          <LinearGradient id={`${uid}-gn-a`} x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor="#6ee7a8" />
            <Stop offset="55%" stopColor="#2d9a64" />
            <Stop offset="100%" stopColor="#165a3a" />
          </LinearGradient>
          <LinearGradient id={`${uid}-gn-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#52d492" />
            <Stop offset="100%" stopColor="#1f7a52" />
          </LinearGradient>
          <LinearGradient id={`${uid}-gd-a`} x1="100%" y1="50%" x2="0%" y2="50%">
            <Stop offset="0%" stopColor="#f0cc7a" />
            <Stop offset="55%" stopColor="#d4a853" />
            <Stop offset="100%" stopColor="#8a6b2e" />
          </LinearGradient>
          <LinearGradient id={`${uid}-gd-b`} x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#c9a24d" />
            <Stop offset="100%" stopColor="#e8c56a" />
          </LinearGradient>
          <LinearGradient id={`${uid}-or-a`} x1="50%" y1="100%" x2="50%" y2="0%">
            <Stop offset="0%" stopColor="#e88a5c" />
            <Stop offset="55%" stopColor="#c45c3a" />
            <Stop offset="100%" stopColor="#8f3d24" />
          </LinearGradient>
          <LinearGradient id={`${uid}-or-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#d4613f" />
            <Stop offset="100%" stopColor="#a84828" />
          </LinearGradient>
          <LinearGradient id={`${uid}-pu-a`} x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor="#8b6fc4" />
            <Stop offset="55%" stopColor="#5c3f8f" />
            <Stop offset="100%" stopColor="#3d2860" />
          </LinearGradient>
          <LinearGradient id={`${uid}-pu-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6b4fa0" />
            <Stop offset="100%" stopColor="#4a3278" />
          </LinearGradient>
          <LinearGradient id={`${uid}-spk-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3a3a44" />
            <Stop offset="100%" stopColor="#222228" />
          </LinearGradient>
          <LinearGradient id={`${uid}-spk-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#404048" />
            <Stop offset="100%" stopColor="#2a2a32" />
          </LinearGradient>
          <LinearGradient id={`${uid}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f0cc7a" />
            <Stop offset="50%" stopColor="#c9a24d" />
            <Stop offset="100%" stopColor="#8a6b2e" />
          </LinearGradient>
          <RadialGradient id={`${uid}-core`} cx="50%" cy="40%" r="70%">
            <Stop offset="0%" stopColor="#1a1b22" />
            <Stop offset="100%" stopColor="#08090c" />
          </RadialGradient>
          <RadialGradient id={`${uid}-pearl`} cx="38%" cy="32%" r="65%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="45%" stopColor="#f4f1ea" />
            <Stop offset="100%" stopColor="#c9bba8" />
          </RadialGradient>
        </Defs>

        {/* Soft drop shadows under cardinals (RN has weak SVG filters) */}
        <Path d="M50 12.2 L60.2 27.2 L50 34.2 L39.8 27.2 Z" fill="rgba(0,0,0,0.28)" />
        <Path d="M87.8 50 L72.8 60.2 L65.8 50 L72.8 39.8 Z" fill="rgba(0,0,0,0.28)" />
        <Path d="M50 87.8 L39.8 72.8 L50 65.8 L60.2 72.8 Z" fill="rgba(0,0,0,0.28)" />
        <Path d="M12.2 50 L27.2 39.8 L34.2 50 L27.2 60.2 Z" fill="rgba(0,0,0,0.28)" />

        {/* Tip glow blobs */}
        <Circle cx="50" cy="12" r="5.5" fill="rgba(82,212,146,0.22)" />
        <Circle cx="88" cy="50" r="5.5" fill="rgba(212,168,83,0.22)" />
        <Circle cx="50" cy="88" r="5.5" fill="rgba(196,92,58,0.2)" />
        <Circle cx="12" cy="50" r="5.5" fill="rgba(107,79,160,0.22)" />

        <Circle cx="50" cy="50" r="46" fill="none" stroke="rgba(201,162,77,0.08)" strokeWidth="1.1" />

        {orbit ? (
          <>
            <Circle
              cx="50"
              cy="50"
              r="44"
              stroke="rgba(244,241,234,0.18)"
              strokeWidth="0.7"
              strokeDasharray="1.8 3.6"
              fill="none"
            />
            <Circle
              cx="50"
              cy="50"
              r="44"
              stroke="rgba(201,162,77,0.14)"
              strokeWidth="0.35"
              strokeDasharray="1.8 3.6"
              strokeDashoffset="2.7"
              fill="none"
            />
          </>
        ) : null}

        <Path d="M58 42 L68 32 L52 48 Z" fill={`url(#${uid}-spk-a)`} />
        <Path d="M58 58 L68 68 L52 52 Z" fill={`url(#${uid}-spk-b)`} />
        <Path d="M42 58 L32 68 L48 52 Z" fill={`url(#${uid}-spk-a)`} />
        <Path d="M42 42 L32 32 L48 48 Z" fill={`url(#${uid}-spk-b)`} />

        <Path d="M50 11 L61 27 L50 35 L39 27 Z" fill={`url(#${uid}-gn-a)`} />
        <Path d="M50 11 L50 35 L39 27 Z" fill={`url(#${uid}-gn-b)`} opacity={0.9} />
        <Path d="M50 13.5 L56.5 26 L50 31.5 L43.5 26 Z" fill="rgba(255,255,255,0.12)" />

        <Path d="M89 50 L73 61 L65 50 L73 39 Z" fill={`url(#${uid}-gd-a)`} />
        <Path d="M89 50 L65 50 L73 39 Z" fill={`url(#${uid}-gd-b)`} opacity={0.9} />
        <Path d="M86 50 L73.5 56.5 L68.5 50 L73.5 43.5 Z" fill="rgba(255,255,255,0.14)" />

        <Path d="M50 89 L39 73 L50 65 L61 73 Z" fill={`url(#${uid}-or-a)`} />
        <Path d="M50 89 L50 65 L61 73 Z" fill={`url(#${uid}-or-b)`} opacity={0.9} />
        <Path d="M50 86 L43.5 73.5 L50 68.5 L56.5 73.5 Z" fill="rgba(255,255,255,0.1)" />

        <Path d="M11 50 L27 39 L35 50 L27 61 Z" fill={`url(#${uid}-pu-a)`} />
        <Path d="M11 50 L35 50 L27 61 Z" fill={`url(#${uid}-pu-b)`} opacity={0.9} />
        <Path d="M14 50 L26.5 43.5 L31.5 50 L26.5 56.5 Z" fill="rgba(255,255,255,0.12)" />

        <Circle cx="50" cy="50" r="12" fill={`url(#${uid}-core)`} />
        <Circle cx="50" cy="50" r="12" stroke={`url(#${uid}-ring)`} strokeWidth="1.35" fill="none" />
        <Circle cx="50" cy="50" r="12" stroke="rgba(255,255,255,0.16)" strokeWidth="0.3" fill="none" />
        <Circle cx="50" cy="50" r="8.2" stroke="rgba(201,162,77,0.25)" strokeWidth="0.35" fill="none" />
        <Circle cx="50" cy="50" r="2.35" fill={`url(#${uid}-pearl)`} />
        <Circle cx="49.15" cy="49" r="0.65" fill="rgba(255,255,255,0.85)" />
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
