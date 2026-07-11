import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LOCALE_META, type Locale } from '@lefrig/shared';
import { useLocale } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const codes = Object.keys(LOCALE_META) as Locale[];

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {codes.map((code) => {
        const meta = LOCALE_META[code];
        const active = code === locale;
        return (
          <Pressable
            key={code}
            style={[styles.chip, active && styles.chipOn]}
            onPress={() => setLocale(code)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.code, active && styles.codeOn]}>{code.toUpperCase()}</Text>
            {!compact && <Text style={[styles.name, active && styles.nameOn]}>{meta.nativeName}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowCompact: { gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  chipOn: { borderColor: theme.dune, backgroundColor: 'rgba(168,132,45,0.12)' },
  code: { fontSize: 11, fontWeight: '800', color: theme.inkMuted },
  codeOn: { color: theme.dune },
  name: { fontSize: 13, fontWeight: '600', color: theme.inkMuted },
  nameOn: { color: theme.ink, fontWeight: '800' },
});
