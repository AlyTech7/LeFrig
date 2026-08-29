import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { LOCALE_META, LOCALES, t as translate, type Locale } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { LefrigMark } from '@/components/LefrigMark';
import { setCachedUser } from '@/lib/storage';
import { useLocale } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

export default function OnboardingScreen() {
  const router = useRouter();
  const { chooseLocale, suggestedLocale, locale } = useLocale();
  const [pending, setPending] = useState<Locale>(suggestedLocale ?? locale);
  const [saving, setSaving] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (suggestedLocale) setPending(suggestedLocale);
  }, [suggestedLocale]);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 560,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const copy = (key: string) => translate(pending, key);

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await chooseLocale(pending);
      await setCachedUser({
        displayName:
          pending === 'ar' ? 'صديق' : pending === 'fr' ? 'Ami' : pending === 'en' ? 'Friend' : 'Amigo',
        preferredLanguage: pending,
        campName: pending === 'ar' ? 'الرابوني' : 'Rabouni',
      });
      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#f7f2e8', theme.canvas, '#f0ebe3']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbA} pointerEvents="none" />
      <View style={styles.orbB} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <LefrigMark size={56} />
            </View>
            <Text style={styles.brandName}>LEFRIG</Text>
            <View style={styles.brandRule} />
            <Text style={styles.langRibbon}>العربية · Español · Français · English</Text>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>{copy('onboarding.welcome')}</Text>
            <Text style={styles.subtitle}>{copy('onboarding.subtitle')}</Text>
          </View>

          <View style={styles.list}>
            {LOCALES.map((code) => {
              const meta = LOCALE_META[code];
              const selected = pending === code;
              const suggested = suggestedLocale === code;
              return (
                <Pressable
                  key={code}
                  style={({ pressed }) => [
                    styles.langRow,
                    selected && styles.langRowOn,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setPending(code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={meta.nativeName}
                >
                  <View style={[styles.langCode, selected && styles.langCodeOn]}>
                    <Text style={[styles.langCodeText, selected && styles.langCodeTextOn]}>
                      {code.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.langCopy}>
                    <Text
                      style={[
                        styles.langNative,
                        selected && styles.langNativeOn,
                        meta.dir === 'rtl' && styles.rtl,
                      ]}
                    >
                      {meta.nativeName}
                    </Text>
                    <Text style={styles.langLabel}>{meta.label}</Text>
                  </View>
                  {suggested ? (
                    <View style={styles.suggestedPill}>
                      <Text style={styles.suggestedText}>{copy('onboarding.suggested')}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.check, selected && styles.checkOn]}>
                    {selected ? <AppIcon name="check" size={14} color={theme.pearl} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.hint}>{copy('onboarding.hint')}</Text>

          <Pressable
            style={({ pressed }) => [styles.cta, (pressed || saving) && styles.ctaPressed]}
            onPress={() => void finish()}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={copy('onboarding.continue')}
          >
            {saving ? (
              <ActivityIndicator color={theme.pearl} />
            ) : (
              <>
                <Text style={styles.ctaText}>{copy('onboarding.continue')}</Text>
                <AppIcon name="arrow-right" size={18} color={theme.pearl} />
              </>
            )}
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
  orbA: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(168,132,45,0.08)',
  },
  orbB: {
    position: 'absolute',
    bottom: 80,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(45,138,98,0.06)',
  },
  content: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#08090c',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandName: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 6,
    color: theme.ink,
  },
  brandRule: {
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.dune,
    marginTop: 10,
    marginBottom: 12,
  },
  langRibbon: {
    fontFamily: fonts.bodyMed,
    fontSize: 12,
    color: theme.inkSoft,
    letterSpacing: 0.2,
  },
  copyBlock: { marginBottom: 18 },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: theme.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.inkMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  list: { gap: 10, marginBottom: 14 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  langRowOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.08)',
  },
  pressed: { opacity: 0.92 },
  langCode: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.canvasSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCodeOn: { backgroundColor: theme.dune },
  langCodeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: theme.inkMuted,
  },
  langCodeTextOn: { color: theme.pearl },
  langCopy: { flex: 1, minWidth: 0 },
  langNative: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.ink,
  },
  langNativeOn: { color: theme.ink },
  langLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 2,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  suggestedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: theme.successSoft,
  },
  suggestedText: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    color: theme.oasisDeep,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: theme.dune,
    borderColor: theme.dune,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.inkSoft,
    textAlign: 'center',
    marginBottom: 16,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    borderRadius: radii.md,
    backgroundColor: theme.ink,
    paddingHorizontal: 20,
  },
  ctaPressed: { opacity: 0.88 },
  ctaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: theme.pearl,
  },
});
