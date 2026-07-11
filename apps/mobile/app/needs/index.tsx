import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { fetchWithMeta, mapApiNeed, type NeedItem, unwrapPaginated } from '@/lib/api';
import { useT } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';
import { AppIcon } from '@/components/AppIcon';

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
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.heroTitle}>{t('needs.title')}</Text>
          <Text style={styles.heroSub}>{t('needs.offer')}</Text>
        </SafeAreaView>
      </LinearGradient>

      <Pressable style={styles.fab} onPress={() => router.push('/needs/create')}>
        <AppIcon name="plus" size={22} color={theme.obsidian} strokeWidth={2.5} />
      </Pressable>

      <FlatList
        data={needs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.gold} style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>{t('needs.empty')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/needs/${item.id}`)}>
            <View style={styles.typeRow}>
              <AppIcon name="help-circle" size={14} color={theme.emeraldDeep} />
              <Text style={styles.type}>
                {TYPE_KEYS[item.type] ? t(TYPE_KEYS[item.type]) : item.type} · {item.campName}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            <View style={styles.footer}>
              <Text style={styles.offers}>{item.offersCount}</Text>
              <AppIcon name="chevron-right" size={16} color={theme.textDarkMuted} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 20 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: theme.text, paddingHorizontal: 20, paddingTop: 8 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', paddingHorizontal: 20, marginTop: 4 },
  list: { padding: 16, paddingBottom: 100 },
  empty: { textAlign: 'center', color: theme.textDarkMuted, marginTop: 40 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  type: { fontSize: 11, fontWeight: '700', color: theme.emeraldDeep, textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '700', color: theme.textDark },
  desc: { fontSize: 14, color: theme.textDarkMuted, marginTop: 6, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  offers: { fontSize: 12, color: theme.textDarkMuted },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: theme.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
