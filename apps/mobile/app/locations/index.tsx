'use client';

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { CampSummary } from '@lefrig/shared';
import { fetchApi, fetchWithMeta } from '@/lib/api';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

type Market = { id: string; nameEs: string; description?: string };
type PickupPoint = { id: string; name: string; description?: string };
type Route = {
  id: string;
  name?: string;
  originCamp?: { nameEs: string; nameAr?: string };
  destinationCamp?: { nameEs: string; nameAr?: string };
  estimatedHours?: number;
};

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
      {camps.map((c) => (
        <Pressable
          key={c.id}
          style={[styles.chip, campId === c.id && styles.chipActive]}
          onPress={() => onSelect(c.id)}
        >
          <Text style={[styles.chipText, campId === c.id && styles.chipTextActive]}>{pickName(locale, c)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export default function LocationsScreen() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [campId, setCampId] = useState('');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [pickups, setPickups] = useState<PickupPoint[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithMeta<CampSummary[]>('/camps', []).then((res) => {
      setCamps(res.data);
      setCampId(res.data[0]?.id ?? '');
    });
  }, []);

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    const q = `campId=${campId}`;
    Promise.all([
      fetchApi<Market[]>(`/locations/markets?${q}`).catch(() => []),
      fetchApi<PickupPoint[]>(`/locations/pickup-points?${q}`).catch(() => []),
      fetchApi<Route[]>(`/locations/routes?originCampId=${campId}`).catch(() => []),
    ]).then(([m, p, r]) => {
      setMarkets(m);
      setPickups(p);
      setRoutes(r);
      setLoading(false);
    });
  }, [campId]);

  const camp = camps.find((c) => c.id === campId);
  const campName = camp ? pickName(locale, camp) : '';

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>{t('locations.title')}</Text>
          <Text style={styles.sub}>{t('locations.sub')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <ScrollChips camps={camps} campId={campId} onSelect={setCampId} locale={locale} />

        {loading ? (
          <ActivityIndicator color={theme.gold} style={{ marginTop: 24 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {t('locations.points')} · {campName}
            </Text>
            {markets.length === 0 ? (
              <Text style={styles.empty}>{t('camps.empty')}</Text>
            ) : (
              markets.map((item) => (
                <View key={item.id} style={styles.card}>
                  <AppIcon name="shopping-bag" size={20} color={theme.gold} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.nameEs}</Text>
                    <Text style={styles.cardDesc}>{item.description ?? t('shops.heroAccent')}</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>{t('locations.points')}</Text>
            {pickups.length === 0 ? (
              <Text style={styles.empty}>{t('camps.empty')}</Text>
            ) : (
              pickups.map((item) => (
                <View key={item.id} style={styles.card}>
                  <AppIcon name="map-pin" size={20} color={theme.emerald} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardDesc}>{item.description ?? t('locations.sub')}</Text>
                  </View>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>
              {t('locations.routes')} · {campName}
            </Text>
            {routes.length === 0 ? (
              <Text style={styles.empty}>{t('empty.nothingHere')}</Text>
            ) : (
              routes.map((item) => (
                <View key={item.id} style={styles.card}>
                  <AppIcon name="navigation" size={20} color={theme.gold} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>
                      {pickName(locale, {
                        nameEs: item.originCamp?.nameEs ?? campName,
                        nameAr: item.originCamp?.nameAr ?? campName,
                      })}{' '}
                      →{' '}
                      {pickName(locale, {
                        nameEs: item.destinationCamp?.nameEs ?? '—',
                        nameAr: item.destinationCamp?.nameAr ?? '—',
                      })}
                    </Text>
                    <Text style={styles.cardDesc}>
                      {item.estimatedHours ? `~${item.estimatedHours} h` : t('locations.routes')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <Pressable style={styles.link} onPress={() => router.push('/camps')}>
          <AppIcon name="home" size={18} color={theme.gold} />
          <Text style={styles.linkText}>{t('camps.title')}</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => router.push('/transport')}>
          <AppIcon name="truck" size={18} color={theme.gold} />
          <Text style={styles.linkText}>{t('camps.viewTransport')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: theme.gold, paddingHorizontal: 20, paddingTop: 8 },
  sub: { fontSize: 14, color: theme.gray400, paddingHorizontal: 20, marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  chipsScroll: { marginBottom: 16 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginRight: 8,
  },
  chipActive: { borderColor: theme.gold, backgroundColor: 'rgba(232,184,109,0.15)' },
  chipText: { color: theme.gray400, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: theme.gold },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.obsidian, marginTop: 20, marginBottom: 12 },
  empty: { color: theme.gray500, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: theme.surface,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: { flex: 1 },
  cardName: { fontWeight: '700', color: theme.obsidian, fontSize: 15 },
  cardDesc: { color: theme.gray500, fontSize: 13, marginTop: 4 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(232,184,109,0.1)',
  },
  linkText: { color: theme.gold, fontWeight: '700' },
});
