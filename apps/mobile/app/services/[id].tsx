import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useT } from '@/lib/locale';
import { fetchWithMeta } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, gradients } from '@/lib/theme';

type ServiceDetail = {
  id: string;
  title: string;
  description?: string;
  priceFrom?: number | string;
  priceTo?: number | string;
  category?: { nameEs?: string };
  provider?: { id: string; displayName: string; phone?: string; reputationScore?: number };
  camps?: { camp: { nameEs: string } }[];
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, isSignedIn, syncUser } = useAuthApi();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchWithMeta<ServiceDetail>(`/services/${id}`, {
      id,
      title: 'Servicio',
      description: '',
      camps: [{ camp: { nameEs: 'Campamento' } }],
    }).then((res) => {
      setService(res.data);
      setLoading(false);
    });
  }, [id]);

  const contact = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (!service?.provider?.id) return;
    setContacting(true);
    try {
      await syncUser();
      await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: service.provider.id,
          content: `Hola, necesito el servicio: ${service.title}`,
          refId: service.id,
          type: 'service',
        }),
      });
      router.push('/messages');
    } catch {
      Alert.alert(t('common.error'), t('messages.empty'));
    } finally {
      setContacting(false);
    }
  };

  if (loading || !service) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={theme.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const camps = service.camps?.map((c) => c.camp.nameEs).join(', ') ?? t('shops.campFallback');
  const price =
    service.priceFrom != null
      ? t('services.priceFrom', { price: Number(service.priceFrom).toLocaleString() })
      : t('jobs.salaryHint');

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.hero]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Pressable style={styles.back} onPress={() => router.back()}>
            <AppIcon name="arrow-left" size={20} color={theme.text} />
            <Text style={styles.backText}>{t('services.title')}</Text>
          </Pressable>
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.sub}>{service.category?.nameEs ?? t('services.title')} · {camps}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.desc}>{service.description ?? t('jobs.noDescription')}</Text>

        {service.provider && (
          <View style={styles.provider}>
            <AppIcon name="user" size={18} color={theme.emeraldDeep} />
            <Text style={styles.providerName}>{service.provider.displayName}</Text>
            {service.provider.reputationScore != null && (
              <Text style={styles.rating}>{Number(service.provider.reputationScore).toFixed(1)}</Text>
            )}
          </View>
        )}

        <Pressable style={styles.cta} onPress={contact} disabled={contacting}>
          {contacting ? (
            <ActivityIndicator color={theme.obsidian} />
          ) : (
            <Text style={styles.ctaText}>{t('services.contactProfessional')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.cream },
  safe: { flex: 1, backgroundColor: theme.cream },
  header: { paddingBottom: 24, paddingHorizontal: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, marginBottom: 16 },
  backText: { color: theme.textMuted, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', color: theme.text },
  sub: { fontSize: 14, color: theme.textMuted, marginTop: 6 },
  content: { padding: 20, paddingBottom: 100 },
  price: { fontSize: 22, fontWeight: '800', color: theme.emeraldDeep, marginBottom: 12 },
  desc: { fontSize: 15, lineHeight: 22, color: theme.textDarkMuted, marginBottom: 24 },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  providerName: { flex: 1, fontSize: 16, fontWeight: '600', color: theme.textDark },
  rating: { fontSize: 14, fontWeight: '700', color: theme.gold },
  cta: {
    backgroundColor: theme.gold,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    minHeight: 56,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: theme.obsidian },
});
