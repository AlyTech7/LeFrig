import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ListingSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ListingCard } from '@/components/ListingCard';
import { API_URL } from '@/lib/api';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

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
          <AppIcon name="shopping-bag" size={22} color={theme.dune} />
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
            <AppIcon name="image" size={32} color={theme.oasis} />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(10,8,6,0.88)']} style={styles.heroGrad} />
        <View style={styles.heroBadge}>
          <AppIcon name="zap" size={11} color={theme.pearl} />
          <Text style={styles.heroBadgeText}>{t('common.featured')}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {hero.title}
          </Text>
          <Text style={styles.heroPrice}>
            {hero.price.toLocaleString()} {hero.currency}
          </Text>
          <View style={styles.heroMeta}>
            <AppIcon name="user" size={11} color="rgba(250,248,244,0.7)" />
            <Text style={styles.heroSeller} numberOfLines={1}>
              {hero.sellerName}
            </Text>
          </View>
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
    height: 200,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: theme.canvasSoft,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
  },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(45,138,98,0.08)' },
  heroGrad: { ...StyleSheet.absoluteFillObject },
  heroBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168,132,45,0.92)',
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800', color: theme.pearl, letterSpacing: 0.4 },
  heroCopy: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: theme.pearl, letterSpacing: -0.3 },
  heroPrice: { fontSize: 20, fontWeight: '900', color: theme.duneBright, marginTop: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  heroSeller: { fontSize: 12, color: 'rgba(250,248,244,0.75)', flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderStyle: 'dashed',
    backgroundColor: theme.surface,
    gap: 6,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: theme.ink },
  emptySub: { fontSize: 13, color: theme.inkMuted, textAlign: 'center' },
});
