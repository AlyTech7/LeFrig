import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { LEGAL_META } from '@/lib/legal-content';
import { useLocale, useT } from '@/lib/locale';
import { theme } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';

type DocLink = {
  href: string;
  titleKey: string;
  icon: FeatherIconName;
};

const DOCS: DocLink[] = [
  { href: '/legal/privacidad', titleKey: 'account.policy', icon: 'eye-off' },
  { href: '/legal/terminos', titleKey: 'account.terms', icon: 'file-text' },
  { href: '/legal/cookies', titleKey: 'account.cookies', icon: 'info' },
  { href: '/legal', titleKey: 'account.legalHub', icon: 'book-open' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
          <AppIcon name="arrow-left" size={18} color={theme.dune} />
          <Text style={styles.backText}>{t('account.back')}</Text>
        </Pressable>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={styles.kicker}>{t('account.section')}</Text>
          <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{t('account.privacy')}</Text>
          <View style={styles.rule} />
          <Text style={[styles.lead, dir === 'rtl' && styles.rtl]}>{t('account.privacyLead')}</Text>

          <Text style={styles.sectionLabel}>{t('account.rightsTitle')}</Text>
          <Text style={styles.rightsBody}>{t('account.rightsBody')}</Text>
          <Pressable
            style={styles.rightsCta}
            onPress={() => Linking.openURL(`mailto:${LEGAL_META.dpoEmail}`)}
          >
            <AppIcon name="mail" size={16} color={theme.dune} />
            <Text style={styles.rightsCtaText}>{t('account.rightsCta')}</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>{t('account.docsTitle')}</Text>
          {DOCS.map((doc, i) => (
            <Pressable
              key={doc.href}
              style={[styles.docRow, i === DOCS.length - 1 && styles.docRowLast]}
              onPress={() => router.push(doc.href as never)}
            >
              <View style={styles.docIcon}>
                <AppIcon name={doc.icon} size={16} color={theme.dune} />
              </View>
              <Text style={styles.docTitle}>{t(doc.titleKey)}</Text>
              <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
            </Pressable>
          ))}

          <Text style={styles.footerNote}>
            {t('legal.lastReview')} {LEGAL_META.lastUpdated}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
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
  lead: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 21, marginBottom: 20 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  sectionLabel: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: theme.dune,
    marginBottom: 10,
    marginTop: 8,
  },
  rightsBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.inkMuted,
    lineHeight: 23,
    marginBottom: 14,
  },
  rightsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
    paddingVertical: 6,
  },
  rightsCtaText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  docRowLast: { borderBottomWidth: 0 },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink },
  footerNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: theme.inkSoft,
    marginTop: 28,
  },
});
