import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { LegalBlock, LocalizedLegalDocument } from '@/lib/legal-content';
import { localizeLegalDocument } from '@/lib/legal-content';
import type { LegalDocument } from '@/lib/legal-content';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type BlockProps = {
  block: LegalBlock;
  isRtl: boolean;
};

function Block({ block, isRtl }: BlockProps) {
  const rtlText = isRtl ? styles.rtlText : undefined;
  const listRow = isRtl ? styles.listItemRtl : styles.listItem;

  switch (block.type) {
    case 'p':
      return <Text style={[styles.p, rtlText]}>{block.text}</Text>;
    case 'h3':
      return <Text style={[styles.h3, rtlText]}>{block.text}</Text>;
    case 'ul':
      return (
        <View style={styles.list}>
          {block.items.map((item) => (
            <View key={item.slice(0, 48)} style={listRow}>
              <Text style={[styles.bullet, isRtl && styles.bulletRtl]}>•</Text>
              <Text style={[styles.listText, rtlText]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'ol':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={item.slice(0, 48)} style={listRow}>
              <Text style={[styles.bullet, isRtl && styles.bulletRtl]}>{i + 1}.</Text>
              <Text style={[styles.listText, rtlText]}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case 'note':
      return (
        <View style={[styles.note, isRtl && styles.noteRtl]}>
          {block.title ? <Text style={[styles.noteTitle, rtlText]}>{block.title}</Text> : null}
          <Text style={[styles.noteText, rtlText]}>{block.text}</Text>
        </View>
      );
    case 'table':
      return (
        <View style={styles.tableWrap}>
          {block.caption ? <Text style={[styles.tableCaption, rtlText]}>{block.caption}</Text> : null}
          {block.rows.map((row, rowIndex) => (
            <View key={`${rowIndex}-${row[0]?.slice(0, 24) ?? rowIndex}`} style={styles.tableCard}>
              {block.headers.map((header, colIndex) => (
                <View
                  key={`${header}-${colIndex}`}
                  style={[styles.tableCardRow, isRtl && styles.tableCardRowRtl]}
                >
                  <Text style={[styles.tableCardLabel, rtlText]}>{header}</Text>
                  <Text style={[styles.tableCardValue, rtlText]}>{row[colIndex] ?? ''}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

type LegalDocumentViewProps = {
  doc: LegalDocument | LocalizedLegalDocument;
};

export function LegalDocumentView({ doc }: LegalDocumentViewProps) {
  const t = useT();
  const { locale, dir } = useLocale();
  const isRtl = dir === 'rtl';
  const localized = localizeLegalDocument(doc as LegalDocument, locale);

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, isRtl && styles.scrollRtl]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.kicker, isRtl && styles.rtlText]}>{t('legal.docKicker')}</Text>
      <Text style={[styles.title, isRtl && styles.rtlText]}>{localized.title}</Text>
      <Text style={[styles.summary, isRtl && styles.rtlText]}>{localized.summary}</Text>
      {localized.blocks.map((block, i) => (
        <Block key={`${localized.id}-${i}`} block={block} isRtl={isRtl} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 100 },
  scrollRtl: { direction: 'rtl' },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    fontWeight: '700',
    color: theme.dune,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '800',
    color: theme.ink,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  summary: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.inkMuted,
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 24,
  },
  p: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 26,
    color: theme.ink,
    marginBottom: 14,
  },
  h3: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    fontWeight: '800',
    color: theme.ink,
    marginTop: 12,
    marginBottom: 10,
    lineHeight: 26,
  },
  list: { marginBottom: 14, gap: 10 },
  listItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  listItemRtl: { flexDirection: 'row-reverse', gap: 10, alignItems: 'flex-start' },
  bullet: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    fontWeight: '700',
    color: theme.dune,
    width: 20,
    lineHeight: 24,
  },
  bulletRtl: { textAlign: 'right' },
  listText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 26,
    color: theme.ink,
  },
  note: {
    backgroundColor: 'rgba(168,132,45,0.1)',
    borderRadius: radii.md,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(168,132,45,0.22)',
  },
  noteRtl: { alignItems: 'flex-end' },
  noteTitle: { fontFamily: fonts.bodyBold, fontWeight: '800', color: theme.dune, marginBottom: 8 },
  noteText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: theme.ink },
  tableWrap: { marginVertical: 14, gap: 12 },
  tableCaption: {
    fontFamily: fonts.bodySemi,
    fontSize: 13,
    color: theme.inkMuted,
    marginBottom: 4,
    lineHeight: 20,
  },
  tableCard: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: theme.canvas,
  },
  tableCardRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
    gap: 4,
  },
  tableCardRowRtl: { alignItems: 'flex-end' },
  tableCardLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: theme.dune,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  tableCardValue: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    lineHeight: 24,
  },
});
