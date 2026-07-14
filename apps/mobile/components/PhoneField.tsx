import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  formatPhone,
  normalizePhoneE164,
  parsePhoneE164,
  phoneCountryLabel,
  type PhoneCountry,
} from '@lefrig/shared';
import { theme, radii } from '@/lib/theme';

type Props = {
  value: string;
  onChange: (e164: string) => void;
  label?: string;
  locale?: 'es' | 'en' | 'fr' | 'ar';
  error?: string;
};

export function PhoneField({ value, onChange, label, locale = 'es', error }: Props) {
  const parsed = useMemo(() => parsePhoneE164(value || DEFAULT_PHONE_COUNTRY.dial), [value]);
  const country = parsed?.country ?? DEFAULT_PHONE_COUNTRY;
  const local = parsed?.local ?? '';
  const [pickerOpen, setPickerOpen] = useState(false);

  const setCountry = (next: PhoneCountry) => {
    onChange(normalizePhoneE164(next.dial, local));
    setPickerOpen(false);
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <Pressable style={styles.countryBtn} onPress={() => setPickerOpen((o) => !o)}>
          <Text style={styles.countryText}>
            {country.flag} {country.dial}
          </Text>
        </Pressable>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={local}
          onChangeText={(raw) => onChange(normalizePhoneE164(country.dial, raw))}
          onBlur={() => value.trim() && onChange(formatPhone(value, country))}
          keyboardType="phone-pad"
          placeholder="555 123 456"
          placeholderTextColor={theme.textDarkMuted}
        />
      </View>
      {pickerOpen ? (
        <View style={styles.picker}>
          {PHONE_COUNTRIES.map((c) => (
            <Pressable key={c.iso} style={styles.pickerItem} onPress={() => setCountry(c)}>
              <Text style={styles.pickerText}>
                {c.flag} {c.dial} · {phoneCountryLabel(c, locale)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: theme.textDark, fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', gap: 8 },
  countryBtn: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: theme.surface,
    minHeight: 48,
  },
  countryText: { color: theme.textDark, fontWeight: '600' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    minHeight: 48,
    color: theme.textDark,
    backgroundColor: theme.surface,
  },
  inputError: { borderColor: theme.error },
  picker: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: theme.surface,
  },
  pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  pickerText: { color: theme.textDark },
  error: { color: theme.error, fontSize: 13 },
});
