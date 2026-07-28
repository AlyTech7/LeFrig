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
import { useAuth, useUser } from '@clerk/clerk-expo';
import { AppIcon } from '@/components/AppIcon';
import { clearLegacySession } from '@/lib/legacySession';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

export default function SecurityScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const { user, isLoaded } = useUser();
  const { signOut, isSignedIn } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/sign-in');
  }, [isLoaded, isSignedIn, router]);

  const passwordEnabled = Boolean(user?.passwordEnabled);

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
