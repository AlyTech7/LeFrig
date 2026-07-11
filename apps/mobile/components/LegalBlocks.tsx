import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { LegalBlock, LegalDocument } from '@/lib/legal-content';
import { legalDocTitle } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'p':
      return <Text style={styles.p}>{block.text}</Text>;
    case 'h3':
      return <Text style={styles.h3}>{block.text}</Text>;
    case 'ul':
      return (
        <View style={styles.list}>
          {block.items.map((item) => (
            <View key={item.slice(0, 48)} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'ol':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={item.slice(0, 48)} style={styles.listItem}>
              <Text style={styles.bullet}>{i + 1}.</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'note':
      return (
        <View style={styles.note}>
          {block.title ? <Text style={styles.noteTitle}>{block.title}</Text> : null}
          <Text style={styles.noteText}>{block.text}</Text>
        </View>
      );
    case 'table':
      return (
        <View style={styles.tableWrap}>
          {block.caption ? <Text style={styles.tableCaption}>{block.caption}</Text> : null}
          <View style={styles.table}>
            <View style={styles.tableRowHead}>
              {block.headers.map((h) => (
                <Text key={h} style={[styles.tableCell, styles.tableHead]}>
                  {h}
                </Text>
              ))}
            </View>
            {block.rows.map((row) => (
              <View key={row.join('-').slice(0, 48)} style={styles.tableRow}>
                {row.map((cell) => (
                  <Text key={cell.slice(0, 32)} style={styles.tableCell}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      );
    default:
      return null;
  }
}

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  const t = useT();
  const { locale, dir } = useLocale();
  const title = legalDocTitle(doc, locale);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>{t('legal.docKicker')}</Text>
      <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>{title}</Text>
      <Text style={[styles.summary, dir === 'rtl' && styles.rtl]}>{doc.summary}</Text>
      {doc.blocks.map((block, i) => (
        <Block key={`${doc.id}-${i}`} block={block} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 100 },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.dune,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: { fontSize: 24, fontWeight: '800', color: theme.ink, letterSpacing: -0.4 },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  summary: { fontSize: 15, color: theme.inkMuted, marginTop: 12, marginBottom: 20, lineHeight: 22 },
  p: { fontSize: 15, lineHeight: 24, color: theme.ink, marginBottom: 14 },
  h3: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.ink,
    marginTop: 8,
    marginBottom: 10,
  },
  list: { marginBottom: 14, gap: 8 },
  listItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 14, fontWeight: '700', color: theme.dune, width: 18 },
  listText: { flex: 1, fontSize: 15, lineHeight: 22, color: theme.ink },
  note: {
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderRadius: radii.md,
    padding: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.22)',
  },
  noteTitle: { fontWeight: '800', color: theme.dune, marginBottom: 6 },
  noteText: { fontSize: 14, lineHeight: 21, color: theme.ink },
  tableWrap: { marginVertical: 12 },
  tableCaption: { fontSize: 12, color: theme.inkMuted, marginBottom: 8 },
  table: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  tableRowHead: { flexDirection: 'row', backgroundColor: theme.canvasSoft },
  tableRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.border },
  tableCell: { flex: 1, padding: 8, fontSize: 11, color: theme.ink },
  tableHead: { fontWeight: '800', color: theme.ink },
});
