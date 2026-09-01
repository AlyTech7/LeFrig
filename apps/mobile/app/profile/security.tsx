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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { AppIcon } from '@/components/AppIcon';
import { biometricMethodLabel, canUseDeviceBiometrics } from '@/lib/biometrics';
import { clearLegacySession } from '@/lib/legacySession';
import { useLefrigLocalCredentials } from '@/lib/useLefrigLocalCredentials';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

export default function SecurityScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const { user, isLoaded } = useUser();
  const { signOut, isSignedIn } = useAuth();
  const {
    biometricType,
    userOwnsCredentials,
    setCredentials,
    clearCredentials,
  } = useLefrigLocalCredentials();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [bioPassword, setBioPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/sign-in');
  }, [isLoaded, isSignedIn, router]);

  const passwordEnabled = Boolean(user?.passwordEnabled);
  const biometricsOn = Boolean(userOwnsCredentials);
  const biometricsSupported = canUseDeviceBiometrics(biometricType);
  const method = biometricMethodLabel(biometricType, t);
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? '';

  const updatePassword = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      Alert.alert(t('common.error'), t('account.passwordShort'));
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert(t('common.error'), t('account.passwordMismatch'));
      return;
    }
    setSaving(true);
    try {
      await user.updatePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
      });
      if (userOwnsCredentials) {
        try {
          await setCredentials({ password: newPassword });
        } catch {
          /* biometría opcional */
        }
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      Alert.alert(t('common.success'), t('account.passwordUpdated'));
    } catch {
      Alert.alert(t('common.error'), t('account.passwordError'));
    } finally {
      setSaving(false);
    }
  };

  const enableBiometrics = async () => {
    if (!primaryEmail) return;
    if (bioPassword.length < 8) {
      Alert.alert(t('common.error'), t('account.biometricsPasswordHint'));
      return;
    }
    setBioBusy(true);
    try {
      await setCredentials({
        identifier: primaryEmail.trim().toLowerCase(),
        password: bioPassword,
      });
      setBioPassword('');
      Alert.alert(t('common.success'), t('account.biometricsSaved'));
    } catch {
      Alert.alert(t('common.error'), t('auth.errors.biometricsEnrollFailed'));
    } finally {
      setBioBusy(false);
    }
  };

  const disableBiometrics = async () => {
    setBioBusy(true);
    try {
      await clearCredentials();
      Alert.alert(t('common.success'), t('account.biometricsCleared'));
    } catch {
      Alert.alert(t('common.error'), t('auth.errors.biometricsEnrollFailed'));
    } finally {
      setBioBusy(false);
    }
  };

  const onToggleBiometrics = (next: boolean) => {
    if (next) {
      if (!passwordEnabled) {
        Alert.alert(t('common.error'), t('account.biometricsOauthHint'));
        return;
      }
      void enableBiometrics();
      return;
    }
    void disableBiometrics();
  };

  const doSignOut = async () => {
    await clearLegacySession();
    try {
      await signOut();
    } catch {
      /* ignore */
    }
    router.replace('/sign-in');
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
            <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('account.security')}</Text>
            <View style={styles.rule} />
            <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('account.securityLead')}</Text>

            {Platform.OS !== 'web' ? (
              <View style={styles.bioCard}>
                <View style={styles.bioHeader}>
                  <View style={styles.bioIcon}>
                    <AppIcon name="unlock" size={18} color={theme.oasisDeep} />
                  </View>
                  <View style={styles.bioCopy}>
                    <Text style={styles.bioTitle}>{t('account.biometricsTitle')}</Text>
                    <Text style={styles.bioLead}>{t('account.biometricsLead')}</Text>
                  </View>
                </View>
                {!biometricsSupported ? (
                  <Text style={styles.bioStatus}>{t('account.biometricsUnavailable')}</Text>
                ) : !passwordEnabled ? (
                  <Text style={styles.bioStatus}>{t('account.biometricsOauthHint')}</Text>
                ) : (
                  <>
                    <View style={styles.bioRow}>
                      <Text style={styles.bioStatus}>
                        {biometricsOn
                          ? t('account.biometricsEnabled')
                          : t('account.biometricsDisabled')}
                        {` · ${method}`}
                      </Text>
                      {bioBusy ? (
                        <ActivityIndicator color={theme.dune} />
                      ) : (
                        <Switch
                          value={biometricsOn}
                          onValueChange={onToggleBiometrics}
                          trackColor={{ false: theme.borderStrong, true: theme.oasis }}
                          thumbColor={theme.pearl}
                        />
                      )}
                    </View>
                    {!biometricsOn ? (
                      <>
                        <Text style={styles.label}>{t('account.biometricsPasswordHint')}</Text>
                        <TextInput
                          style={styles.input}
                          value={bioPassword}
                          onChangeText={setBioPassword}
                          secureTextEntry
                          placeholder="••••••••"
                          placeholderTextColor={theme.inkSoft}
                          autoComplete="password"
                        />
                        <Pressable
                          style={[styles.secondaryBtn, bioBusy && styles.disabled]}
                          onPress={() => void enableBiometrics()}
                          disabled={bioBusy}
                        >
                          <Text style={styles.secondaryBtnText}>
                            {t('account.biometricsEnable')} · {method}
                          </Text>
                        </Pressable>
                      </>
                    ) : null}
                  </>
                )}
              </View>
            ) : null}

            {passwordEnabled ? (
              <>
                <Text style={styles.label}>{t('account.currentPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.inkSoft}
                  autoComplete="password"
                />
                <Text style={styles.label}>{t('account.newPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.inkSoft}
                  autoComplete="new-password"
                />
                <Text style={styles.label}>{t('account.confirmPassword')}</Text>
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.inkSoft}
                  autoComplete="new-password"
                />
                <Pressable
                  style={[styles.primaryBtn, saving && styles.disabled]}
                  onPress={() => void updatePassword()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={theme.pearl} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t('account.updatePassword')}</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={styles.note}>
                <AppIcon name="shield" size={18} color={theme.dune} />
                <Text style={styles.noteText}>{t('account.oauthOnly')}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <Pressable style={styles.textAction} onPress={() => void doSignOut()}>
              <AppIcon name="log-out" size={16} color={theme.ink} />
              <Text style={styles.textActionLabel}>{t('account.signOutEverywhere')}</Text>
            </Pressable>

            <Pressable
              style={[styles.textAction, styles.dangerAction]}
              onPress={() => router.push('/profile/delete')}
            >
              <AppIcon name="trash-2" size={16} color={theme.flare} />
              <Text style={styles.dangerLabel}>{t('account.deleteAccount')}</Text>
            </Pressable>
          </ScrollView>
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
  body: { paddingHorizontal: space.lg, paddingBottom: 120 },
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
  bioCard: {
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surface,
  },
  bioHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bioIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(45, 138, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioCopy: { flex: 1 },
  bioTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.ink, marginBottom: 4 },
  bioLead: { fontFamily: fonts.body, fontSize: 13, color: theme.inkMuted, lineHeight: 19 },
  bioRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bioStatus: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 13, color: theme.inkMuted },
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
  primaryBtn: {
    marginTop: 22,
    backgroundColor: theme.ink,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.pearl },
  secondaryBtn: {
    marginTop: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.oasisDeep,
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.oasisDeep },
  disabled: { opacity: 0.7 },
  note: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 12,
    paddingVertical: 14,
  },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 21 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.borderStrong,
    marginTop: 28,
    marginBottom: 8,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  textActionLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink },
  dangerAction: { borderBottomWidth: 0 },
  dangerLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.flare },
});
