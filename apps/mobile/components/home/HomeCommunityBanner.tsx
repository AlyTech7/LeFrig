import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  onDiaspora: () => void;
  onCommunity: () => void;
};

export function HomeCommunityBanner({ onDiaspora, onCommunity }: Props) {
  const t = useT();
  const { dir } = useLocale();

  return (
    <LinearGradient
      colors={['#1f6b4a', '#2d8a62', '#3da87a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.pattern} pointerEvents="none" />
      <Text style={[styles.ar, dir === 'rtl' && styles.rtl]}>{t('home.communityBannerAr')}</Text>
      <Text style={styles.title}>{t('home.communityBannerTitle')}</Text>
      <Text style={styles.sub}>{t('home.communityBannerSub')}</Text>
      <View style={styles.actions}>
        <Pressable style={styles.btnPrimary} onPress={onDiaspora}>
          <AppIcon name="globe" size={16} color={theme.oasisDeep} />
          <Text style={styles.btnPrimaryText}>{t('nav.diaspora')}</Text>
        </Pressable>
        <Pressable style={styles.btnGhost} onPress={onCommunity}>
          <AppIcon name="users" size={16} color={theme.pearl} />
          <Text style={styles.btnGhostText}>{t('home.forum')}</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: theme.oasisDeep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  pattern: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ar: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.pearl,
    writingDirection: 'rtl',
    opacity: 0.95,
    marginBottom: 4,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  title: { fontSize: 15, fontWeight: '800', color: theme.pearl, lineHeight: 21 },
  sub: { fontSize: 12.5, color: 'rgba(250,248,244,0.78)', marginTop: 6, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.pearl,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  btnPrimaryText: { fontSize: 14, fontWeight: '800', color: theme.oasisDeep },
  btnGhost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(250,248,244,0.35)',
  },
  btnGhostText: { fontSize: 14, fontWeight: '800', color: theme.pearl },
});
