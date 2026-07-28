import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LOCALE_META, type Locale } from '@lefrig/shared';
import { useLocale } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts } from '@/lib/ui';

type Props = {
  compact?: boolean;
  variant?: 'chips' | 'tabs';
};

export function LanguageSwitcher({ compact, variant = 'chips' }: Props) {
  const { locale, setLocale } = useLocale();
  const codes = Object.keys(LOCALE_META) as Locale[];

  if (variant === 'tabs') {
    return (
      <View style={styles.tabs}>
        {codes.map((code) => {
          const meta = LOCALE_META[code];
          const active = code === locale;
          return (
            <Pressable
              key={code}
              style={styles.tab}
              onPress={() => setLocale(code)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabCode, active && styles.tabCodeOn]}>{code.toUpperCase()}</Text>
              <Text style={[styles.tabName, active && styles.tabNameOn]} numberOfLines={1}>
                {meta.nativeName}
              </Text>
              <View style={[styles.tabRule, active && styles.tabRuleOn]} />
            </Pressable>
          );
        })}
      </View>
    );
  }

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

  tabs: { flexDirection: 'row', gap: 16 },
  tab: { flex: 1, alignItems: 'flex-start' },
  tabCode: {
    fontFamily: fonts.bodySemi,
    fontSize: 10,
    letterSpacing: 1.2,
    color: theme.inkSoft,
  },
  tabCodeOn: { color: theme.dune },
  tabName: {
    fontFamily: fonts.bodyMed,
    fontSize: 13,
    color: theme.inkSoft,
    marginTop: 2,
  },
  tabNameOn: { fontFamily: fonts.bodyBold, color: theme.ink },
  tabRule: { height: 2, width: '100%', marginTop: 8, borderRadius: 1, backgroundColor: 'transparent' },
  tabRuleOn: { backgroundColor: theme.dune },
});
