import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LegalDocumentView } from '@/components/LegalBlocks';
import { LEGAL_DOCUMENTS } from '@/lib/legal-content';
import { legalDocTitle } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme } from '@/lib/theme';

export default function LegalDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === id) ?? LEGAL_DOCUMENTS[0];
  const t = useT();
  const { locale } = useLocale();

  return (
    <View style={styles.root}>
      <ScreenHeader title={legalDocTitle(doc, locale)} backLabel={t('nav.legal')} />
      <LegalDocumentView doc={doc} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
});
