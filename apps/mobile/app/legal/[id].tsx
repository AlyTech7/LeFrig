import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LegalDocumentView } from '@/components/LegalBlocks';
import { findLocalizedLegalDocument } from '@/lib/legal-content';
import { useLocale, useT } from '@/lib/locale';
import { theme } from '@/lib/theme';

export default function LegalDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useT();
  const { locale } = useLocale();
  const doc =
    findLocalizedLegalDocument(id ?? '', locale) ??
    findLocalizedLegalDocument('aviso-legal', locale)!;

  return (
    <View style={styles.root}>
      <ScreenHeader title={doc.title} backLabel={t('nav.legal')} />
      <LegalDocumentView doc={doc} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
});
