import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { CAMPS } from '@lefrig/shared';
import { fetchApi, fetchWithMeta } from '@/lib/api';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

type Market = { id: string; nameEs: string; description?: string };

export default function CampsScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [campId, setCampId] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      setCampId(res.data[0]?.id ?? '');
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!campId) return;
    fetchApi<Market[]>(`/locations/markets?campId=${campId}`)
      .then(setMarkets)
      .catch(() => setMarkets([]));
  }, [campId]);

  const selected = camps.find((c) => c.id === campId);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{t('camps.title')}</Text>
          <Text style={styles.sub}>{t('camps.sub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        ListHeaderComponent={
          <>
            <ScrollChips camps={camps} campId={campId} onSelect={setCampId} locale={locale} />
            {selected && (
              <Text style={styles.sectionTitle}>
                {t('locations.points')} · {pickName(locale, selected)}
              </Text>
            )}
          </>
        }
        data={markets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.empty}>{t('camps.empty')}</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.marketCard}>
            <AppIcon name="shopping-bag" size={20} color={theme.gold} />
            <View style={styles.marketInfo}>
              <Text style={styles.marketName}>{item.nameEs}</Text>
              <Text style={styles.marketDesc}>{item.description ?? t('shops.heroAccent')}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <>
            <Pressable style={styles.transportLink} onPress={() => router.push('/locations')}>
              <AppIcon name="navigation" size={18} color={theme.gold} />
              <Text style={styles.transportText}>{t('camps.viewMap')}</Text>
            </Pressable>
            <Pressable style={styles.transportLink} onPress={() => router.push('/transport')}>
              <AppIcon name="truck" size={18} color={theme.gold} />
              <Text style={styles.transportText}>{t('camps.viewTransport')}</Text>
            </Pressable>
          </>
        }
      />
    </View>
  );
}

function ScrollChips({
  camps,
  campId,
  onSelect,
  locale,
}: {
  camps: CampSummary[];
  campId: string;
  onSelect: (id: string) => void;
  locale: ReturnType<typeof useLocale>['locale'];
}) {
  return (
    <FlatList
      horizontal
      data={camps}
      keyExtractor={(c) => c.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      renderItem={({ item }) => {
        const meta = CAMPS.find((c) => c.slug === item.slug);
        const active = campId === item.id;
        return (
          <Pressable
            style={[styles.chip, active && styles.chipActive, meta?.isTindouf && styles.chipTindouf]}
            onPress={() => onSelect(item.id)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{pickName(locale, item)}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  sub: { fontSize: 14, color: theme.textMuted, paddingHorizontal: 20, marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  chips: { paddingHorizontal: 4, paddingBottom: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipActive: { borderColor: theme.gold, backgroundColor: 'rgba(232,184,109,0.12)' },
  chipTindouf: { borderColor: 'rgba(232,184,109,0.35)' },
  chipText: { fontWeight: '600', color: theme.textDarkMuted },
  chipTextActive: { color: theme.obsidian },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.textDark, marginBottom: 12 },
  empty: { textAlign: 'center', color: theme.textDarkMuted, marginTop: 20 },
  marketCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  marketInfo: { flex: 1 },
  marketName: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  marketDesc: { fontSize: 13, color: theme.textDarkMuted, marginTop: 2 },
  transportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,184,109,0.35)',
  },
  transportText: { color: theme.gold, fontWeight: '700' },
});
