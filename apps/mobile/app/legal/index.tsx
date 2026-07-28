import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LEGAL_DOCUMENTS, LEGAL_META } from '@/lib/legal-content';
import { legalDocTitle } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { AppIcon } from '@/components/AppIcon';
import { theme } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

export default function LegalHubScreen() {
  const router = useRouter();
  const t = useT();
  const { locale, dir } = useLocale();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <AppIcon name="arrow-left" size={18} color={theme.dune} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{t('legal.hubKicker')}</Text>
        <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('legal.hubTitle')}</Text>
        <View style={styles.rule} />
        <Text style={[styles.intro, dir === 'rtl' && styles.rtl]}>{t('legal.hubIntro')}</Text>
        <Text style={styles.updated}>
          {t('legal.updated')} {LEGAL_META.lastUpdated}
        </Text>

        {LEGAL_DOCUMENTS.map((doc, i) => (
          <Pressable
            key={doc.id}
            style={[styles.row, i === LEGAL_DOCUMENTS.length - 1 && styles.rowLast]}
            onPress={() => router.push(`/legal/${doc.id}` as never)}
          >
            <View style={styles.rowCopy}>
              <Text style={[styles.cardTitle, dir === 'rtl' && styles.rtl]}>
                {legalDocTitle(doc, locale)}
              </Text>
              <Text style={[styles.cardSummary, dir === 'rtl' && styles.rtl]} numberOfLines={2}>
                {doc.summary}
              </Text>
            </View>
            <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
          </Pressable>
        ))}

        <Pressable style={styles.contact} onPress={() => Linking.openURL(`mailto:${LEGAL_META.contactEmail}`)}>
          <AppIcon name="mail" size={15} color={theme.dune} />
          <Text style={styles.contactText}>{LEGAL_META.contactEmail}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 4,
  },
  backText: { fontFamily: fonts.bodyBold, fontSize: 13, color: theme.dune },
  scroll: { paddingHorizontal: space.lg, paddingBottom: 100, paddingTop: 8 },
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
  intro: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: theme.inkMuted,
    marginBottom: 8,
  },
  updated: {
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    color: theme.inkSoft,
    marginBottom: 20,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowCopy: { flex: 1 },
  cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: theme.ink, letterSpacing: -0.2 },
  cardSummary: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  contactText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
});
