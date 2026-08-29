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

      <View style={styles.mosaic}>
        <AtlasMosaic departments={MARKETPLACE_DEPARTMENTS} onPressDept={onDeptPress} />
      </View>

      <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={onSeeAll}>
        <Text style={styles.ctaText}>{t('atlas.seeAllRooms', { count: roomCount })}</Text>
        <AppIcon name={dir === 'rtl' ? 'arrow-left' : 'arrow-right'} size={15} color={theme.dune} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: theme.ink,
    marginBottom: 10,
  },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  mosaic: { marginBottom: 10 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.warningSoft,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  ctaText: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: theme.dune,
  },
  pressed: { opacity: 0.9 },
});
