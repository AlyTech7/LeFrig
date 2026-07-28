import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '@/components/AppIcon';
import { useLocale, useT } from '@/lib/locale';
import { theme } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  onCommunity: () => void;
};

export function HomeCommunityBanner({ onCommunity }: Props) {
  const t = useT();
  const { dir } = useLocale();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.ar, dir === 'rtl' && styles.rtl]}>{t('home.communityBannerAr')}</Text>
      <Text style={styles.title}>{t('home.communityBannerTitle')}</Text>
      <Text style={styles.sub}>{t('home.communityBannerSub')}</Text>
      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        onPress={onCommunity}
      >
        <Text style={styles.ctaText}>{t('home.forum')}</Text>
        <AppIcon name="arrow-right" size={15} color={theme.oasisDeep} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 22,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderStrong,
  },
  ar: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -0.4,
    color: theme.oasisDeep,
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.ink,
    lineHeight: 22,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 340,
  },
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
    color: theme.oasisDeep,
  },
  pressed: { opacity: 0.7 },
});
