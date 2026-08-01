import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LOCALE_META, type Locale } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { LefrigMark } from '@/components/LefrigMark';
import { setCachedUser } from '@/lib/storage';
import { useLocale } from '@/lib/locale';
import { theme, gradients } from '@/lib/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setLocale, t } = useLocale();
  const languages = (Object.keys(LOCALE_META) as Locale[]).map((code) => LOCALE_META[code]);

  const select = async (lang: Locale) => {
    await setLocale(lang);
    await setCachedUser({
      displayName: lang === 'ar' ? 'صديق' : lang === 'fr' ? 'Ami' : lang === 'en' ? 'Friend' : 'Amigo',
      preferredLanguage: lang,
      campName: lang === 'ar' ? 'الرابوني' : 'Rabouni',
    });
    router.replace('/');
  };

  return (
    <LinearGradient colors={[...gradients.hero]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.logoMark}>
            <LefrigMark size={64} />
          </View>
          <Text style={styles.title}>{t('onboarding.title')}</Text>
          <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

          <View style={styles.iconRow}>
            <AppIcon name="globe" size={20} color={theme.dune} />
            <Text style={styles.prompt}>{t('onboarding.prompt')}</Text>
          </View>

          <View style={styles.langGrid}>
            {languages.map((l) => (
              <Pressable key={l.code} style={styles.langBtn} onPress={() => select(l.code)}>
                <View style={styles.langCode}>
                  <Text style={styles.langCodeText}>{l.code.toUpperCase()}</Text>
                </View>
                <Text style={[styles.langLabel, l.dir === 'rtl' && styles.langLabelRtl]}>{l.nativeName}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#08090c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#08090c',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: { fontSize: 36, fontWeight: '800', color: theme.ink, letterSpacing: 4 },
  subtitle: { fontSize: 15, color: theme.inkMuted, marginBottom: 48, marginTop: 8, textAlign: 'center' },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  prompt: { fontSize: 17, color: theme.ink, fontWeight: '600' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 340 },
  langBtn: {
    backgroundColor: theme.canvas,
    borderRadius: 20,
    padding: 20,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.2)',
  },
  langCode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,132,45,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  langCodeText: { fontSize: 14, fontWeight: '800', color: theme.dune },
  langLabel: { fontSize: 16, fontWeight: '700', color: theme.ink },
  langLabelRtl: { writingDirection: 'rtl' },
});
