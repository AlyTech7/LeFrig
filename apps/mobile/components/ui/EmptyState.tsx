import { View, Text, StyleSheet } from 'react-native';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';
import { theme, radii } from '@/lib/theme';
import { type as typo, space } from '@/lib/ui';
import { Button } from './Button';

type Props = {
  icon?: FeatherIconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = 'inbox', title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={28} color={theme.dune} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="gold" style={{ marginTop: space.md }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(168,132,45,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  title: { ...typo.title, fontSize: 18, textAlign: 'center' },
  body: { ...typo.subtitle, textAlign: 'center', marginTop: 8, maxWidth: 280 },
});
