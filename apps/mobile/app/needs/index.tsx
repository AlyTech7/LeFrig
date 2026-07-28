import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchWithMeta, mapApiNeed, type NeedItem, unwrapPaginated } from '@/lib/api';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space, ui } from '@/lib/ui';
import { AppIcon } from '@/components/AppIcon';
import { Hero, EmptyState, Button } from '@/components/ui';

const TYPE_KEYS: Record<string, string> = {
  product: 'nav.marketplace',
  service: 'nav.services',
  transport: 'nav.transport',
  job: 'nav.jobs',
  tindouf: 'transport.tindouf',
};

export default function NeedsScreen() {
  const router = useRouter();
  const t = useT();
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithMeta('/needs', { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }).then((res) => {
      setNeeds(unwrapPaginated(res.data as never).map((n) => mapApiNeed(n as Record<string, unknown>)));
      setLoading(false);
    });
  }, []);

  return (
    <View style={ui.screen}>
      <Hero
        title={t('needs.title')}
        subtitle={t('needs.offer')}
        kicker={t('nav.needs')}
        back={false}
        right={<Button label={t('needs.create')} onPress={() => router.push('/needs/create')} />}
      />
      <FlatList
        data={needs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : (
            <EmptyState
              icon="help-circle"
              title={t('needs.empty')}
              actionLabel={t('needs.create')}
              onAction={() => router.push('/needs/create')}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/needs/${item.id}`)}>
            <View style={styles.typeRow}>
              <AppIcon name="help-circle" size={14} color={theme.oasisDeep} />
              <Text style={styles.type}>
                {TYPE_KEYS[item.type] ? t(TYPE_KEYS[item.type]) : item.type} · {item.campName}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.footer}>
              <Text style={styles.offers}>{item.offersCount}</Text>
              <AppIcon name="chevron-right" size={16} color={theme.inkMuted} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingBottom: 110 },
  card: {
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 10,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  type: { fontFamily: fonts.bodySemi, fontSize: 12, color: theme.oasisDeep },
  title: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.ink },
  desc: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, marginTop: 4, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  offers: { fontFamily: fonts.body, fontSize: 12, color: theme.inkSoft },
});
