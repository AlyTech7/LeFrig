import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchApi } from '@/lib/api';
import { useLocale, useT } from '@/lib/locale';
import { theme, radii } from '@/lib/theme';
import { fonts, space } from '@/lib/ui';
import { AppIcon, type FeatherIconName } from '@/components/AppIcon';

type Hit = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string | null;
};

type SearchResponse = {
  q: string;
  total: number;
  groups: { type: string; label: string; items: Hit[] }[];
};

type ListRow =
  | { kind: 'group'; type: string; label: string }
  | { kind: 'hit'; hit: Hit }
  | { kind: 'shortcut'; href: string; labelKey: string; icon: FeatherIconName };

const TYPE_ICON: Record<string, FeatherIconName> = {
  listing: 'shopping-bag',
  shop: 'shopping-bag',
  service: 'zap',
  job: 'briefcase',
  need: 'heart',
  camp: 'map-pin',
  hub: 'truck',
  category: 'tag',
};

const SHORTCUTS: { href: string; labelKey: string; icon: FeatherIconName }[] = [
  { href: '/marketplace', labelKey: 'nav.marketplace', icon: 'shopping-bag' },
  { href: '/transport', labelKey: 'nav.transport', icon: 'truck' },
  { href: '/services', labelKey: 'nav.services', icon: 'zap' },
  { href: '/shops', labelKey: 'nav.shops', icon: 'shopping-bag' },
  { href: '/jobs', labelKey: 'nav.jobs', icon: 'briefcase' },
];

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

export default function SearchScreen() {
  const router = useRouter();
  const t = useT();
  const { dir } = useLocale();
  const params = useLocalSearchParams<{ q?: string | string[] }>();
  const initialQ = firstParam(params.q).trim();

  const [draft, setDraft] = useState(initialQ);
  const [activeQ, setActiveQ] = useState(initialQ);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const q = firstParam(params.q).trim();
    setDraft(q);
    setActiveQ(q);
  }, [params.q]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    try {
      const json = await fetchApi<SearchResponse>(
        `/search?q=${encodeURIComponent(trimmed)}&limit=12`,
      );
      if (reqId.current !== id) return;
      setData(json);
    } catch {
      if (reqId.current !== id) return;
      setData(null);
      setError(true);
    } finally {
      if (reqId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch(activeQ);
  }, [activeQ, runSearch]);

  const submit = () => {
    const trimmed = draft.trim();
    Keyboard.dismiss();
    if (trimmed === activeQ) {
      void runSearch(trimmed);
      return;
    }
    if (trimmed) {
      router.setParams({ q: trimmed });
    } else {
      router.replace('/search' as never);
    }
    setActiveQ(trimmed);
  };

  const rows: ListRow[] = useMemo(() => {
    if (!activeQ) {
      return SHORTCUTS.map((s) => ({ kind: 'shortcut' as const, ...s }));
    }
    if (loading || error || !data || data.total === 0) return [];
    const out: ListRow[] = [];
    for (const group of data.groups) {
      out.push({ kind: 'group', type: group.type, label: group.label });
      for (const hit of group.items) {
        out.push({ kind: 'hit', hit });
      }
    }
    return out;
  }, [activeQ, loading, error, data]);

  const groupTitle = (type: string, fallback: string) => {
    const key = `search.groups.${type}` as 'search.groups.listing';
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={8}>
            <AppIcon name="arrow-left" size={18} color={theme.dune} />
          </Pressable>
          <View style={styles.searchWrap}>
            <AppIcon name="search" size={17} color={theme.inkSoft} />
            <TextInput
              style={[styles.input, dir === 'rtl' && styles.rtl]}
              value={draft}
              onChangeText={setDraft}
              placeholder={t('search.placeholderAll')}
              placeholderTextColor={theme.inkSoft}
              returnKeyType="search"
              onSubmitEditing={submit}
              autoFocus={!initialQ}
              clearButtonMode="never"
            />
            {draft.length > 0 ? (
              <Pressable
                onPress={() => {
                  setDraft('');
                  setActiveQ('');
                  router.replace('/search' as never);
                }}
                hitSlop={8}
              >
                <AppIcon name="x" size={16} color={theme.inkMuted} />
              </Pressable>
            ) : null}
            <Pressable style={styles.go} onPress={submit} hitSlop={4}>
              <AppIcon name="arrow-right" size={14} color={theme.pearl} />
            </Pressable>
          </View>
        </View>

        <Text style={[styles.title, dir === 'rtl' && styles.rtl]}>
          {activeQ ? t('search.resultsTitle', { q: activeQ }) : t('search.pageTitle')}
        </Text>
        <Text style={[styles.sub, dir === 'rtl' && styles.rtl]}>
          {activeQ
            ? data
              ? t('search.resultsCount', { count: data.total })
              : t('search.pageSubtitle')
            : t('search.emptyPrompt')}
        </Text>

        {activeQ && loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.dune} />
            <Text style={styles.muted}>{t('search.searching')}</Text>
          </View>
        ) : null}

        {activeQ && !loading && error ? (
          <View style={styles.center}>
            <Text style={styles.muted}>{t('errors.apiUnavailable')}</Text>
            <Pressable style={styles.retry} onPress={() => void runSearch(activeQ)}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : null}

        {activeQ && !loading && !error && data && data.total === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.muted, dir === 'rtl' && styles.rtl]}>
              {t('search.noResults', { q: activeQ })}
            </Text>
            <View style={styles.tryRow}>
              <Pressable
                style={styles.chip}
                onPress={() =>
                  router.push(`/marketplace?q=${encodeURIComponent(activeQ)}` as never)
                }
              >
                <Text style={styles.chipText}>{t('search.tryMarket')}</Text>
              </Pressable>
              <Pressable
                style={styles.chip}
                onPress={() =>
                  router.push(`/transport?q=${encodeURIComponent(activeQ)}` as never)
                }
              >
                <Text style={styles.chipText}>{t('search.tryTransport')}</Text>
              </Pressable>
              <Pressable
                style={styles.chip}
                onPress={() =>
                  router.push(`/services?q=${encodeURIComponent(activeQ)}` as never)
                }
              >
                <Text style={styles.chipText}>{t('search.tryServices')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <FlatList
          data={rows}
          keyExtractor={(item, i) => {
            if (item.kind === 'group') return `g-${item.type}`;
            if (item.kind === 'shortcut') return `s-${item.href}`;
            return `h-${item.hit.type}-${item.hit.id}-${i}`;
          }}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            if (item.kind === 'group') {
              return (
                <View style={styles.groupHead}>
                  <AppIcon
                    name={TYPE_ICON[item.type] ?? 'search'}
                    size={15}
                    color={theme.dune}
                  />
                  <Text style={styles.groupTitle}>{groupTitle(item.type, item.label)}</Text>
                </View>
              );
            }
            if (item.kind === 'shortcut') {
              return (
                <Pressable
                  style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
                  onPress={() => router.push(item.href as never)}
                >
                  <View style={styles.hitIcon}>
                    <AppIcon name={item.icon} size={16} color={theme.dune} />
                  </View>
                  <Text style={styles.hitTitle}>{t(item.labelKey)}</Text>
                  <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
                </Pressable>
              );
            }
            return (
              <Pressable
                style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
                onPress={() => router.push(item.hit.href as never)}
              >
                <View style={styles.hitIcon}>
                  <AppIcon
                    name={TYPE_ICON[item.hit.type] ?? 'search'}
                    size={16}
                    color={theme.dune}
                  />
                </View>
                <View style={styles.hitCopy}>
                  <Text style={styles.hitTitle} numberOfLines={1}>
                    {item.hit.title}
                  </Text>
                  {item.hit.subtitle ? (
                    <Text style={styles.hitSub} numberOfLines={1}>
                      {item.hit.subtitle}
                    </Text>
                  ) : null}
                </View>
                <AppIcon name="chevron-right" size={16} color={theme.inkSoft} />
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.canvas },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingTop: 4,
    paddingBottom: 10,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,132,45,0.1)',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.borderStrong,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    color: theme.ink,
    paddingVertical: 8,
  },
  go: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: theme.dune,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -0.5,
    color: theme.ink,
    paddingHorizontal: space.lg,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: theme.inkMuted,
    lineHeight: 19,
    paddingHorizontal: space.lg,
    marginTop: 4,
    marginBottom: 12,
  },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  list: { paddingHorizontal: space.lg, paddingBottom: 120 },
  center: { paddingHorizontal: space.lg, paddingVertical: 28, gap: 12, alignItems: 'flex-start' },
  muted: { fontFamily: fonts.body, fontSize: 14, color: theme.inkMuted, lineHeight: 21 },
  retry: { paddingVertical: 6 },
  retryText: { fontFamily: fonts.bodyBold, fontSize: 14, color: theme.dune },
  tryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(168,132,45,0.12)',
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: theme.dune },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  groupTitle: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: theme.dune,
  },
  hit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  pressed: { opacity: 0.72 },
  hitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168,132,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hitCopy: { flex: 1, gap: 2 },
  hitTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: theme.ink },
  hitSub: { fontFamily: fonts.body, fontSize: 12, color: theme.inkMuted },
});
