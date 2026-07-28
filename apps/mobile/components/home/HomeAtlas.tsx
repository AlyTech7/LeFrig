import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MARKETPLACE_DEPARTMENTS } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { AtlasMosaic } from '@/components/AtlasMosaic';
import { useLocale, useT } from '@/lib/locale';
import { theme } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  onDeptPress: (id: string) => void;
  onSeeAll: () => void;
};

export function HomeAtlas({ onDeptPress, onSeeAll }: Props) {
  const { dir } = useLocale();
  const t = useT();

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{t('home.atlasIntro')}</Text>
      <Text style={[styles.title, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
        {t('home.atlasQuestion')}
      </Text>
      <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>{t('home.atlasIntroSub')}</Text>

      <View style={styles.mosaic}>
        <AtlasMosaic departments={MARKETPLACE_DEPARTMENTS} onPressDept={onDeptPress} />
      </View>

      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={onSeeAll}>
        <Text style={styles.ctaText}>{t('atlas.seeAllRooms')}</Text>
        <AppIcon name={dir === 'rtl' ? 'arrow-left' : 'arrow-right'} size={16} color={theme.dune} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  eyebrow: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: theme.ink,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: theme.inkMuted,
    marginTop: 8,
    marginBottom: 16,
    maxWidth: 340,
  },
  mosaic: { marginHorizontal: -4 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingVertical: 8,
  },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: theme.dune,
  },
  pressed: { opacity: 0.7 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
});
