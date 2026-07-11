import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MARKETPLACE_DEPARTMENTS } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { AtlasMosaic } from '@/components/AtlasMosaic';
import { SectionHeader } from '@/components/SectionHeader';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  onDeptPress: (id: string) => void;
  onSeeAll: () => void;
};

export function HomeAtlas({ onDeptPress, onSeeAll }: Props) {
  const { dir } = useLocale();
  const t = useT();

  return (
    <View style={styles.wrap}>
      <View style={styles.shell}>
        <View style={styles.rim} />

        <SectionHeader
          eyebrow={t('home.atlasIntro')}
          title={t('home.atlasQuestion')}
          subtitle={t('home.atlasIntroSub')}
        />

        <AtlasMosaic departments={MARKETPLACE_DEPARTMENTS} onPressDept={onDeptPress} />

        <Pressable style={({ pressed }) => [styles.cta, pressed && styles.pressed]} onPress={onSeeAll}>
          <LinearGradient
            colors={['#f5d080', '#e8b86d', '#c9a84c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.ctaText, dir === 'rtl' && styles.rtl]}>{t('atlas.seeAllRooms')}</Text>
          <AppIcon name={dir === 'rtl' ? 'arrow-left' : 'arrow-right'} size={18} color={theme.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  shell: {
    padding: 14,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.22)',
    overflow: 'hidden',
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 3,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: theme.duneBright,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    marginTop: 12,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  ctaText: { fontSize: 13, fontWeight: '800', color: theme.ink, letterSpacing: 0.3 },
  rtl: { writingDirection: 'rtl' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
