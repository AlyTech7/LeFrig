import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  currencyLabel,
  type CurrencyCode,
} from '@lefrig/shared';
import { theme, radii } from '@/lib/theme';

type Props = {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  label?: string;
  locale?: 'es' | 'en' | 'fr' | 'ar';
};

export function CurrencySelect({ value = DEFAULT_CURRENCY, onChange, label, locale = 'es' }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {SUPPORTED_CURRENCIES.map((c) => (
          <Pressable
            key={c.code}
            style={[styles.chip, value === c.code ? styles.chipOn : null]}
            onPress={() => onChange(c.code)}
          >
            <Text style={[styles.chipText, value === c.code ? styles.chipTextOn : null]}>{c.code}</Text>
            <Text style={[styles.chipSub, value === c.code ? styles.chipTextOn : null]} numberOfLines={1}>
              {currencyLabel(c.code, locale).split(' ')[0]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { color: theme.textDark, fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 72,
    backgroundColor: theme.surface,
  },
  chipOn: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
  chipText: { fontWeight: '700', color: theme.textDark, fontSize: 13 },
  chipSub: { fontSize: 11, color: theme.textDarkMuted, marginTop: 2 },
  chipTextOn: { color: theme.primaryDark },
});
