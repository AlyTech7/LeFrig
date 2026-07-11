import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/AppIcon';
import { GATE_VISUALS } from '@/lib/home-visuals';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = { onPress: (href: string) => void };

/** Solo publicar — transporte/servicios/tiendas viven en el Atlas */
export function HomeGateRow({ onPress }: Props) {
  const t = useT();
  const { dir } = useLocale();
  const publishVis = GATE_VISUALS.publish;

  return (
    <View style={styles.wrap}>
      <Pressable style={({ pressed }) => [styles.hero, pressed && styles.pressed]} onPress={() => onPress('/marketplace/create')}>
        <ImageBackground source={{ uri: publishVis.uri }} style={styles.heroBg} imageStyle={styles.heroImage}>
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroTopLine} />
          <View style={styles.heroRow}>
            <View style={styles.heroBadge}>
              <AppIcon name="tag" size={20} color={theme.duneBright} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>{t('home.publishKicker')}</Text>
              <Text style={styles.heroTitle}>{t('nav.publish')}</Text>
              <Text style={styles.heroLead}>{t('home.publishLead')}</Text>
            </View>
            <AppIcon name={dir === 'rtl' ? 'arrow-left' : 'arrow-right'} size={22} color={theme.pearl} />
          </View>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  hero: {
    borderRadius: radii.lg + 2,
    overflow: 'hidden',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  heroBg: { minHeight: 128, justifyContent: 'flex-end' },
  heroImage: { borderRadius: radii.lg + 2 },
  heroTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: theme.duneBright,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroCopy: { flex: 1, gap: 2 },
  heroKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.duneBright,
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: theme.pearl, letterSpacing: -0.5 },
  heroLead: { fontSize: 12, fontWeight: '500', color: 'rgba(250,248,244,0.82)', lineHeight: 16 },
});
