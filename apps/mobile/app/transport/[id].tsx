import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppIcon } from '@/components/AppIcon';
import { useAuthApi } from '@/lib/useAuthApi';
import { useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

type TripDetail = {
  id: string;
  status: string;
  scope?: string | null;
  originLabel?: string;
  destinationLabel?: string;
  requesterName?: string;
  driverName?: string;
  contactPhone?: string | null;
  completionPin?: string;
  role?: 'requester' | 'driver' | 'other' | null;
  canConfirm?: boolean;
  canStart?: boolean;
  canCancel?: boolean;
  canClaim?: boolean;
  priceEstimate?: number | null;
};

const STEPS = ['requested', 'accepted', 'in_progress', 'completed'] as const;

export default function TransportTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { authFetch, isSignedIn } = useAuthApi();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await authFetch<TripDetail>(`/transport/${id}`);
      setTrip(data);
    } catch {
      setTrip(null);
      Alert.alert(t('common.error'), t('errors.apiUnavailable'));
    } finally {
      setLoading(false);
    }
  }, [authFetch, id, t]);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/sign-in' as never);
      return;
    }
    void load();
  }, [isSignedIn, load, router]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const active = trip ? Math.max(0, STEPS.indexOf(trip.status as (typeof STEPS)[number])) : 0;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <AppIcon name="arrow-left" size={22} color={theme.ink} />
        </Pressable>
        <Text style={styles.title}>{t('transport.trip.title')}</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        {loading || !trip ? (
          <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.route}>
              {trip.originLabel} → {trip.destinationLabel}
            </Text>
            <Text style={styles.meta}>
              {trip.scope === 'international' ? t('transport.international') : t('transport.tabLocal')}
              {trip.driverName ? ` · ${trip.driverName}` : ''}
              {trip.priceEstimate != null ? ` · ~${trip.priceEstimate}` : ''}
            </Text>

            <View style={styles.timeline}>
              {STEPS.map((s, i) => (
                <View key={s} style={[styles.step, i <= active && styles.stepOn]}>
                  <View style={styles.dot} />
                  <Text style={styles.stepLabel}>
                    {t(`transport.connect.status.${s}` as 'transport.connect.status.requested')}
                  </Text>
                </View>
              ))}
            </View>

            {trip.role === 'driver' && trip.completionPin ? (
              <View style={styles.pinBox}>
                <Text style={styles.pinTitle}>{t('transport.trip.pinTitle')}</Text>
                <Text style={styles.pinCode}>{trip.completionPin}</Text>
                <Text style={styles.meta}>{t('transport.trip.pinHint')}</Text>
              </View>
            ) : null}

            {trip.canClaim ? (
              <Pressable
                style={styles.cta}
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await authFetch(`/transport/${id}/claim`, { method: 'PATCH' });
                  })
                }
              >
                <Text style={styles.ctaText}>{t('transport.trip.claimTrip')}</Text>
              </Pressable>
            ) : null}

            {trip.canStart ? (
              <Pressable
                style={styles.cta}
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await authFetch(`/transport/${id}/start`, { method: 'PATCH' });
                  })
                }
              >
                <Text style={styles.ctaText}>{t('transport.trip.startTrip')}</Text>
              </Pressable>
            ) : null}

            {trip.canConfirm ? (
              <View style={styles.confirmRow}>
                <TextInput
                  style={styles.pinInput}
                  value={pin}
                  onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
                  placeholder={t('transport.trip.confirmPinPlaceholder')}
                  placeholderTextColor={theme.inkSoft}
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <Pressable
                  style={styles.cta}
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      if (!/^\d{4}$/.test(pin)) throw new Error(t('transport.trip.confirmPinPlaceholder'));
                      await authFetch(`/transport/${id}/complete`, {
                        method: 'PATCH',
                        body: JSON.stringify({ pin }),
                      });
                      setPin('');
                    })
                  }
                >
                  <Text style={styles.ctaText}>{t('transport.trip.confirmPin')}</Text>
                </Pressable>
              </View>
            ) : null}

            {trip.canCancel ? (
              <Pressable
                style={styles.ghost}
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await authFetch(`/transport/${id}/cancel`, { method: 'PATCH' });
                  })
                }
              >
                <Text style={styles.ghostText}>{t('transport.trip.cancelTrip')}</Text>
              </Pressable>
            ) : null}

            {trip.contactPhone ? (
              <Pressable
                style={styles.ghost}
                onPress={() =>
                  Linking.openURL(`https://wa.me/${trip.contactPhone!.replace(/\D/g, '')}`)
                }
              >
                <Text style={styles.ghostText}>WhatsApp</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  back: { marginBottom: 8, width: 36 },
  title: { fontSize: 22, fontWeight: '800', color: theme.ink },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  route: { fontSize: 20, fontWeight: '800', color: theme.ink },
  meta: { fontSize: 13, color: theme.inkMuted },
  timeline: { flexDirection: 'row', gap: 4, marginVertical: 8 },
  step: { flex: 1, alignItems: 'center', opacity: 0.35, gap: 4 },
  stepOn: { opacity: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.dune },
  stepLabel: { fontSize: 10, fontWeight: '600', color: theme.ink, textAlign: 'center' },
  pinBox: {
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 6,
  },
  pinTitle: { fontWeight: '700', color: theme.ink },
  pinCode: { fontSize: 28, fontWeight: '800', letterSpacing: 6, color: theme.ink },
  confirmRow: { gap: 8 },
  pinInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    padding: 12,
    fontSize: 18,
    letterSpacing: 4,
    backgroundColor: theme.surface,
    color: theme.ink,
  },
  cta: {
    backgroundColor: theme.ink,
    paddingVertical: 14,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  ctaText: { color: theme.pearl, fontWeight: '800', fontSize: 15 },
  ghost: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  ghostText: { color: theme.ink, fontWeight: '700' },
});
