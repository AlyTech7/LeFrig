import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { AppIcon } from '@/components/AppIcon';
import { useAuthApi } from '@/lib/useAuthApi';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type HubCamp = { user?: { camp?: { nameEs?: string } | null } };

export default function PersonalDataScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const { user, isLoaded } = useUser();
  const { authFetch, isSignedIn } = useAuthApi();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [campName, setCampName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
  }, [user]);

  useEffect(() => {
    if (!isSignedIn) return;
    authFetch<HubCamp>('/users/me/hub')
      .then((hub) => setCampName(hub?.user?.camp?.nameEs ?? null))
      .catch(() => setCampName(null));
  }, [authFetch, isSignedIn]);

  const email = user?.primaryEmailAddress?.emailAddress;
  const phone = user?.primaryPhoneNumber?.phoneNumber;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      Alert.alert(t('common.success'), t('account.saved'));
    } catch {
      Alert.alert(t('common.error'), t('account.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <AppIcon name="arrow-left" size={18} color={theme.dune} />
          <Text style={styles.backText}>{t('account.back')}</Text>
        </Pressable>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.kicker}>{t('account.section')}</Text>
            <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('account.personal')}</Text>
            <View style={styles.rule} />
            <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('account.personalLead')}</Text>

            <Text style={styles.label}>{t('account.firstName')}</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('account.firstName')}
              placeholderTextColor={theme.inkSoft}
              autoCapitalize="words"
            />

            <Text style={styles.label}>{t('account.lastName')}</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('account.lastName')}
              placeholderTextColor={theme.inkSoft}
              autoCapitalize="words"
            />

            <Text style={styles.label}>{t('account.email')}</Text>
            <View style={styles.readonly}>
              <Text style={styles.readonlyText}>{email || '—'}</Text>
            </View>

            <Text style={styles.label}>{t('account.phone')}</Text>
            <View style={styles.readonly}>
              <Text style={styles.readonlyText}>{phone || '—'}</Text>
            </View>

            <Text style={styles.label}>{t('account.camp')}</Text>
            <View style={styles.readonly}>
              <Text style={styles.readonlyText}>{campName || t('account.campEmpty')}</Text>
            </View>

            <Text style={styles.hint}>{t('account.contactReadonly')}</Text>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
            <Pressable
              style={[styles.cta, saving && styles.ctaDisabled]}
              onPress={() => void save()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={theme.pearl} />
              ) : (
                <Text style={styles.ctaText}>{t('account.save')}</Text>
              )}
            </Pressable>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.canvas },
  safe: { flex: 1 },
  flex: { flex: 1 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  body: { paddingHorizontal: space.lg, paddingBottom: 24 },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -0.7,
    color: theme.ink,
    marginTop: 4,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 12,
    marginBottom: 8,
  },
  lead: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 21, marginBottom: 8 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.dune,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 16,
    color: theme.ink,
  },
  readonly: {
    backgroundColor: theme.canvasSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  readonlyText: { fontFamily: fonts.bodyMed, fontSize: 15, color: theme.inkMuted },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    lineHeight: 18,
    marginTop: 18,
  },
  ctaBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: 'rgba(250,248,244,0.96)',
  },
  cta: {
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 54,
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
});
