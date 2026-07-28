import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { AppIcon } from '@/components/AppIcon';
import { clearLegacySession } from '@/lib/legacySession';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

function clerkErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as {
    errors?: Array<{ longMessage?: string; message?: string }>;
    message?: string;
  };
  const first = e.errors?.[0];
  return first?.longMessage || first?.message || e.message || fallback;
}

export default function DeleteAccountScreen() {
  const router = useRouter();
  const t = useT();
  const { dir, locale } = useLocale();
  const { user, isLoaded } = useUser();
  const [phrase, setPhrase] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const confirmWord = useMemo(() => {
    if (locale === 'ar') return 'حذف';
    if (locale === 'fr') return 'SUPPRIMER';
    if (locale === 'en') return 'DELETE';
    return 'ELIMINAR';
  }, [locale]);

  const passwordEnabled = Boolean(user?.passwordEnabled);
  const phraseOk =
    locale === 'ar'
      ? phrase.trim() === confirmWord
      : phrase.trim().toUpperCase() === confirmWord.toUpperCase();
  const canSubmit = phraseOk && (!passwordEnabled || password.length >= 1) && !busy;

  useEffect(() => {
    if (isLoaded && !user && !done) router.replace('/sign-in');
  }, [done, isLoaded, router, user]);

  const submit = async () => {
    if (!user || !canSubmit) return;
    setBusy(true);
    setError('');
    try {
      if (passwordEnabled && password) {
        const verify = (user as { verifyPassword?: (args: { password: string }) => Promise<unknown> })
          .verifyPassword;
        if (typeof verify === 'function') {
          await verify.call(user, { password });
        }
      }

      await user.delete();
      await clearLegacySession();
      setDone(true);
      setBusy(false);
    } catch (err) {
      setError(clerkErrorMessage(err, t('account.deleteError')));
      setBusy(false);
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={theme.dune} />
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.doneWrap}>
          <Text style={styles.doneAr}>وداعاً</Text>
          <Text style={styles.doneTitle}>{t('account.deleteDoneTitle')}</Text>
          <Text style={styles.doneBody}>{t('account.deleteDoneBody')}</Text>
          <Pressable style={styles.doneCta} onPress={() => router.replace('/sign-in')}>
            <Text style={styles.doneCtaText}>{t('nav.signIn')}</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8} disabled={busy}>
          <AppIcon name="arrow-left" size={18} color={theme.dune} />
          <Text style={styles.backText}>{t('account.security')}</Text>
        </Pressable>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.kicker}>{t('account.section')}</Text>
            <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>
              {t('account.deleteAccount')}
            </Text>
            <View style={styles.rule} />
            <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>
              {t('account.deleteConfirmBody')}
            </Text>

            <Text style={styles.sectionLabel}>{t('account.deleteConsequencesTitle')}</Text>
            {[
              t('account.deleteConsequence1'),
              t('account.deleteConsequence2'),
              t('account.deleteConsequence3'),
            ].map((line) => (
              <View key={line} style={styles.bulletRow}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}

            <Text style={styles.label}>
              {t('account.deleteTypePrompt', { word: confirmWord })}
            </Text>
            <TextInput
              style={[styles.input, phrase.length > 0 && !phraseOk && styles.inputBad]}
              value={phrase}
              onChangeText={setPhrase}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
              placeholder={confirmWord}
              placeholderTextColor={theme.inkSoft}
            />

            {passwordEnabled ? (
              <>
                <Text style={styles.label}>{t('account.deletePasswordPrompt')}</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!busy}
                  placeholder="••••••••"
                  placeholderTextColor={theme.inkSoft}
                  autoComplete="password"
                />
              </>
            ) : (
              <Text style={styles.hint}>{t('account.deleteOauthHint')}</Text>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
            <Pressable
              style={[styles.destroyBtn, !canSubmit && styles.destroyBtnOff]}
              onPress={() => void submit()}
              disabled={!canSubmit}
            >
              {busy ? (
                <ActivityIndicator color={theme.pearl} />
              ) : (
                <Text style={styles.destroyText}>{t('account.deleteConfirm')}</Text>
              )}
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => router.back()} disabled={busy}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
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
    color: theme.flare,
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
    backgroundColor: theme.flare,
    marginTop: 12,
    marginBottom: 8,
  },
  lead: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 21, marginBottom: 18 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
  },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.flare,
    marginTop: 7,
  },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 20 },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.dune,
    marginTop: 20,
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
  inputBad: { borderColor: 'rgba(196,92,58,0.55)' },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkSoft,
    lineHeight: 19,
    marginTop: 16,
  },
  error: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: theme.flare,
    marginTop: 16,
    lineHeight: 19,
  },
  ctaBar: {
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: 'rgba(250,248,244,0.96)',
    gap: 4,
  },
  destroyBtn: {
    backgroundColor: theme.flare,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  destroyBtnOff: { opacity: 0.4 },
  destroyText: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.pearl },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.inkMuted },

  doneWrap: {
    flex: 1,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneAr: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: 'rgba(168,132,45,0.3)',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  doneTitle: {
    fontFamily: fonts.displaySemi,
    fontSize: 26,
    letterSpacing: -0.5,
    color: theme.ink,
    textAlign: 'center',
  },
  doneBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 300,
  },
  doneCta: { marginTop: 28, paddingVertical: 12 },
  doneCtaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.dune },
});
