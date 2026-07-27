import { View, Text, StyleSheet } from 'react-native';

type Props = {
  country?: string;
  size?: number;
};

/** Banderas dibujadas — Windows/Android a menudo muestran "EH"/"DZ" en lugar del emoji. */
export function CountryFlag({ country, size = 16 }: Props) {
  const code = (country ?? '').toUpperCase();
  const w = Math.round(size * 1.5);
  const h = size;

  if (code === 'EH') {
    return (
      <View style={[styles.frame, { width: w, height: h }]}>
        <View style={[styles.stripe, { backgroundColor: '#000', height: h / 3 }]} />
        <View style={[styles.stripe, { backgroundColor: '#fff', height: h / 3 }]} />
        <View style={[styles.stripe, { backgroundColor: '#007a3d', height: h / 3 }]} />
        <View
          style={[
            styles.triangle,
            {
              borderTopWidth: h / 2,
              borderBottomWidth: h / 2,
              borderLeftWidth: w * 0.4,
            },
          ]}
        />
      </View>
    );
  }

  if (code === 'DZ') {
    return (
      <View style={[styles.frame, { width: w, height: h, flexDirection: 'row' }]}>
        <View style={{ flex: 1, backgroundColor: '#006233', height: h }} />
        <View style={{ flex: 1, backgroundColor: '#fff', height: h }} />
        <View style={[styles.dzMark, { left: w * 0.42 }]}>
          <Text style={{ fontSize: size * 0.55, color: '#d21034', lineHeight: size }}>☪</Text>
        </View>
      </View>
    );
  }

  const emoji: Record<string, string> = {
    MR: '🇲🇷',
    ES: '🇪🇸',
    FR: '🇫🇷',
  };
  if (emoji[code]) {
    return <Text style={{ fontSize: size }}>{emoji[code]}</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  stripe: { width: '100%' },
  triangle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#c4111b',
  },
  dzMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
