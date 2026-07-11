import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LEGAL_DOCUMENTS, LEGAL_META } from '@/lib/legal-content';
import { legalDocTitle } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { AppIcon } from '@/components/AppIcon';
import { theme, radii } from '@/lib/theme';

export default function LegalHubScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={t('legal.hubTitle')}
        subtitle={t('legal.updated') + ` ${LEGAL_META.lastUpdated}`}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, dir === 'rtl' && styles.rtl]}>{t('legal.hubIntro')}</Text>
        {LEGAL_DOCUMENTS.map((doc) => (
          <Pressable
            key={doc.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push(`/legal/${doc.id}` as never)}
          >
            <View style={styles.cardCopy}>
              <Text style={[styles.cardTitle, dir === 'rtl' && styles.rtl]}>{legalDocTitle(doc, locale)}</Text>
              <Text style={[styles.cardSummary, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
                {doc.summary}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={18} color={theme.inkSoft} />
          </Pressable>
        ))}
        <View style={styles.contact}>
          <AppIcon name="mail" size={16} color={theme.dune} />
          <Text style={styles.contactText}>{LEGAL_META.contactEmail}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  scroll: { padding: 20, paddingBottom: 100 },
  intro: { fontSize: 15, lineHeight: 22, color: theme.inkMuted, marginBottom: 20 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardPressed: { opacity: 0.92 },
  cardCopy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: theme.ink },
  cardSummary: { fontSize: 13, color: theme.inkMuted, marginTop: 6, lineHeight: 18 },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    justifyContent: 'center',
  },
  contactText: { fontSize: 14, color: theme.dune, fontWeight: '600' },
});
