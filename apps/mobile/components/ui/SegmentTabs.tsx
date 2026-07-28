import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { theme, radii } from '@/lib/theme';
import { type as typo, space } from '@/lib/ui';

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
};

export function SegmentTabs({ tabs, value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tabs.map((tab) => {
        const on = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, on && styles.tabOn]}
          >
            <Text style={[styles.text, on && styles.textOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type Step = { n: number; label: string };

export function StudioSteps({
  steps,
  current,
  onSelect,
}: {
  steps: Step[];
  current: number;
  onSelect?: (n: number) => void;
}) {
  return (
    <View style={styles.steps}>
      {steps.map((s) => {
        const on = s.n === current;
        const done = s.n < current;
        return (
          <Pressable
            key={s.n}
            disabled={!onSelect || s.n > current}
            onPress={() => onSelect?.(s.n)}
            style={[styles.step, on && styles.stepOn, done && styles.stepDone]}
          >
            <View style={[styles.stepN, on && styles.stepNOn, done && styles.stepNDone]}>
              <Text style={[styles.stepNText, (on || done) && styles.stepNTextOn]}>
                {done ? '✓' : s.n}
              </Text>
            </View>
            <Text style={[styles.stepLabel, on && styles.stepLabelOn]} numberOfLines={1}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    backgroundColor: theme.surface,
  },
  tabOn: {
    borderColor: theme.dune,
    backgroundColor: 'rgba(168,132,45,0.12)',
  },
  text: { ...typo.caption, fontWeight: '700', color: theme.inkMuted },
  textOn: { color: theme.dune },
  steps: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: space.md,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    opacity: 0.55,
  },
  stepOn: { opacity: 1 },
  stepDone: { opacity: 0.9 },
  stepN: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surface,
  },
  stepNOn: { borderColor: theme.dune, backgroundColor: 'rgba(168,132,45,0.15)' },
  stepNDone: { borderColor: theme.oasis, backgroundColor: 'rgba(45,138,98,0.15)' },
  stepNText: { fontSize: 12, fontWeight: '800', color: theme.inkSoft },
  stepNTextOn: { color: theme.ink },
  stepLabel: { ...typo.caption, fontSize: 11, textAlign: 'center' },
  stepLabelOn: { color: theme.dune, fontWeight: '700' },
});
