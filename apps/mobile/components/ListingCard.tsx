import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CAMPS, type ListingSummary } from '@lefrig/shared';
import { resolveImageUrl } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  item: ListingSummary;
  onPress?: () => void;
  grid?: boolean;
};

function resolveImage(url?: string): string | undefined {
  return resolveImageUrl(url, API_URL) ?? undefined;
}

function formatRelative(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 60) return locale.startsWith('ar') ? `${mins} د` : `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return locale.startsWith('ar') ? `${hrs} س` : `${hrs}h`;
  const days = Math.round(hrs / 24);
  return locale.startsWith('ar') ? `${days} ي` : `${days}d`;
}

export function ListingCard({ item, onPress, grid }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const imageUri = resolveImage(item.imageUrl);
  const camp = CAMPS.find((c) => c.slug === item.campId);
  const campLabel = camp ? pickName(locale, camp) : undefined;
  const relative = item.createdAt ? formatRelative(item.createdAt, locale) : '';
  const metaBits = [campLabel, relative].filter(Boolean);

  if (grid) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.gridWrap, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <View style={styles.media}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.mediaImage} />
          ) : (
            <LinearGradient
              colors={['rgba(168,132,45,0.10)', 'rgba(45,138,98,0.08)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mediaPlaceholder}
            >
              <AppIcon name="image" size={26} color={theme.dune} />
            </LinearGradient>
          )}
          {item.sellerVerified ? (
            <View style={styles.verifiedDot}>
              <AppIcon name="check" size={10} color={theme.pearl} strokeWidth={3} />
            </View>
          ) : null}
        </View>

        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.gridPrice}>
          {item.price.toLocaleString()}{' '}
          <Text style={styles.gridCurrency}>{item.currency}</Text>
        </Text>
        {metaBits.length > 0 ? (
          <Text style={styles.gridMeta} numberOfLines={1}>
            {metaBits.join(' · ')}
          </Text>
        ) : (
          <Text style={styles.gridMeta} numberOfLines={1}>
            {item.sellerName}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listWrap, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.listMedia}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.listImage} />
        ) : (
          <LinearGradient
            colors={['rgba(168,132,45,0.10)', 'rgba(45,138,98,0.08)']}
            style={[styles.listImage, styles.listPlaceholder]}
          >
            <AppIcon name="image" size={22} color={theme.dune} />
          </LinearGradient>
        )}
      </View>
      <View style={styles.listBody}>
        <Text style={styles.listTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.listPrice}>
          {item.price.toLocaleString()} {item.currency}
        </Text>
        <Text style={styles.listMeta} numberOfLines={1}>
          {[item.sellerName, campLabel, t('common.cash')].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridWrap: {
    width: '48%',
    marginBottom: 22,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  media: {
    width: '100%',
    aspectRatio: 0.86,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
    marginBottom: 10,
  },
  mediaImage: { width: '100%', height: '100%' },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.oasisDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: -0.2,
    color: theme.ink,
    minHeight: 38,
  },
  gridPrice: {
    fontFamily: fonts.displaySemi,
    fontSize: 17,
    letterSpacing: -0.3,
    color: theme.ink,
    marginTop: 6,
  },
  gridCurrency: {
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    color: theme.dune,
  },
  gridMeta: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: theme.inkSoft,
    marginTop: 4,
  },

  listWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  listMedia: {
    width: 78,
    height: 78,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
  },
  listImage: { width: '100%', height: '100%' },
  listPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  listBody: { flex: 1, gap: 3 },
  listTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    letterSpacing: -0.2,
    color: theme.ink,
    lineHeight: 20,
  },
  listPrice: {
    fontFamily: fonts.displaySemi,
    fontSize: 16,
    color: theme.ink,
    marginTop: 2,
  },
  listMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 2,
  },
});
