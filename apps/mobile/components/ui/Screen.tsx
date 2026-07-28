import { View, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { space } from '@/lib/ui';

type Props = ViewProps & {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  padded?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, edges = ['top'], padded, style, ...rest }: Props) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]} {...rest}>
      <View style={[styles.inner, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  inner: { flex: 1 },
  padded: { paddingHorizontal: space.lg },
});
