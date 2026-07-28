import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ListingSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ListingCard } from '@/components/ListingCard';
import { API_URL } from '@/lib/api';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

function imageUri(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

type Props = {
  listings: ListingSummary[];
  onPress: (id: string) => void;
  onSeeAll: () => void;
};

export function HomeFeaturedListings({ listings, onPress, onSeeAll }: Props) {
  const t = useT();

  if (!listings.length) {
    return (
      <Pressable style={styles.empty} onPress={onSeeAll}>
        <View style={styles.emptyIcon}>
          <AppIcon name="shopping-bag" size={20} color={theme.dune} />
        </View>
        <Text style={styles.emptyTitle}>{t('home.emptyFeaturedTitle')}</Text>
        <Text style={styles.emptySub}>{t('home.emptyFeaturedSub')}</Text>
      </Pressable>
    );
  }

  const [hero, ...rest] = listings;
  const heroImg = imageUri(hero.imageUrl);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.hero} onPress={() => onPress(hero.id)}>
        {heroImg ? (
          <Image source={{ uri: heroImg }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <AppIcon name="image" size={28} color={theme.oasis} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(10,8,6,0.9)']} style={styles.heroGrad} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {hero.title}
          </Text>
          <Text style={styles.heroPrice}>
            {hero.price.toLocaleString()} {hero.currency}
          </Text>
          <Text style={styles.heroSeller} numberOfLines={1}>
            {hero.sellerName}
          </Text>
        </View>
      </Pressable>

      <View style={styles.grid}>
        {rest.slice(0, 4).map((item) => (
          <ListingCard key={item.id} item={item} grid onPress={() => onPress(item.id)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  hero: {
    height: 210,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45,138,98,0.08)',
  },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.4,
    color: theme.pearl,
    lineHeight: 26,
  },
  heroPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.duneBright,
    marginTop: 8,
  },
  heroSeller: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(250,248,244,0.65)',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 6,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: theme.ink,
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
});
