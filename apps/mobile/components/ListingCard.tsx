import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ListingSummary } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { API_URL } from '@/lib/api';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type Props = {
  item: ListingSummary;
  onPress?: () => void;
  grid?: boolean;
};

function resolveImage(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_URL.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export function ListingCard({ item, onPress, grid }: Props) {
  const t = useT();
  const imageUri = resolveImage(item.imageUrl);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [grid ? styles.gridWrap : styles.listWrap, pressed && styles.pressed]}
    >
      <View style={[styles.card, grid && styles.cardGrid]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={grid ? styles.imageGrid : styles.imageList} />
        ) : (
          <View style={[grid ? styles.imageGrid : styles.imageList, styles.placeholder]}>
            <AppIcon name="image" size={grid ? 28 : 24} color={theme.oasis} />
          </View>
        )}
        <View style={[styles.body, grid && styles.bodyGrid]}>
          <Text style={styles.title} numberOfLines={grid ? 2 : 2}>
            {item.title}
          </Text>
          {item.attributeLabels && item.attributeLabels.length > 0 ? (
            <View style={styles.chips}>
              {item.attributeLabels.slice(0, 3).map((chip) => (
                <View key={chip} style={styles.chip}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={styles.price}>
            {item.price.toLocaleString()} {item.currency}
          </Text>
          <View style={styles.meta}>
            <AppIcon name="user" size={11} color={theme.inkMuted} />
            <Text style={styles.seller} numberOfLines={1}>
              {item.sellerName}
            </Text>
            <View style={styles.cashBadge}>
              <Text style={styles.cashText}>{t('common.cash')}</Text>
            </View>
          </View>
        </View>
        {!grid ? <AppIcon name="chevron-right" size={18} color={theme.inkSoft} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listWrap: { marginBottom: 10 },
  gridWrap: { width: '48%', marginBottom: 12 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.99 }] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 2,
  },
  cardGrid: { flexDirection: 'column', alignItems: 'stretch', padding: 0, overflow: 'hidden' },
  imageList: { width: 72, height: 72, borderRadius: radii.sm },
  imageGrid: { width: '100%', height: 128, borderTopLeftRadius: radii.md, borderTopRightRadius: radii.md },
  placeholder: {
    backgroundColor: 'rgba(45,138,98,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyGrid: { padding: 10 },
  title: { fontSize: 13.5, fontWeight: '800', color: theme.ink, letterSpacing: -0.2, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(168,132,45,0.12)',
  },
  chipText: { fontSize: 9, fontWeight: '700', color: theme.dune },
  price: { fontSize: 15, fontWeight: '900', color: theme.oasisDeep, marginTop: 5 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  seller: { fontSize: 11, color: theme.inkMuted, flex: 1 },
  cashBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(45,138,98,0.1)',
  },
  cashText: { fontSize: 9, fontWeight: '800', color: theme.oasisDeep, letterSpacing: 0.3 },
});
