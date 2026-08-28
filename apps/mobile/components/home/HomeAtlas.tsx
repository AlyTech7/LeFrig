import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MARKETPLACE_DEPARTMENTS, ATLAS_ROOM_COUNT } from '@lefrig/shared';
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
  const roomCount = ATLAS_ROOM_COUNT;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, dir === 'rtl' && styles.rtl]} accessibilityRole="header">
        {t('home.atlasQuestion')}
      </Text>
      <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>
        {t('home.atlasIntroSub', { count: roomCount })}
      </Text>

      <View style={styles.mosaic}>
        <AtlasMosaic departments={MARKETPLACE_DEPARTMENTS} onPressDept={onDeptPress} />
      </View>

      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={onSeeAll}>
        <Text style={styles.ctaText}>{t('atlas.seeAllRooms', { count: roomCount })}</Text>
        <AppIcon name={dir === 'rtl' ? 'arrow-left' : 'arrow-right'} size={16} color={theme.dune} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: theme.ink,
    marginBottom: 6,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.inkSoft,
    marginBottom: 16,
  },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  mosaic: { marginBottom: 14 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.warningSoft,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ctaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: theme.dune,
  },
  pressed: { opacity: 0.9 },
});
