import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import type { CampSummary, PaginatedResponse } from '@lefrig/shared';
import { AppIcon } from '@/components/AppIcon';
import { ReportButton } from '@/components/ReportButton';
import { Hero } from '@/components/ui';
import { pickName } from '@/lib/bilingual';
import { useLocale, useT } from '@/lib/locale';
import { fetchWithMeta, unwrapPaginated } from '@/lib/api';
import { useAuthApi } from '@/lib/useAuthApi';
import { theme, radii } from '@/lib/theme';
import { ui } from '@/lib/ui';

type Post = {
  id: string;
  title: string;
  content: string;
  postType: string;
  createdAt: string;
  author?: { displayName: string };
  camp?: { nameEs: string; nameAr?: string };
};

const POST_TYPE_KEYS: Record<string, string> = {
  announcement: 'community.voice',
  news: 'notifications.title',
  question: 'needs.title',
  general: 'common.all',
};

function postTypeLabel(type: string, t: (k: string) => string): string {
  const key = POST_TYPE_KEYS[type];
  return key ? t(key) : type;
}

export default function CommunityScreen() {
  const { authFetch, isSignedIn, syncUser } = useAuthApi();
  const t = useT();
  const { locale } = useLocale();
  const [posts, setPosts] = useState<Post[]>([]);
  const [camps, setCamps] = useState<CampSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', campId: '', postType: 'general' });

  const loadPosts = async () => {
    const res = await fetchWithMeta<PaginatedResponse<Post>>('/community/posts?limit=30', {
      data: [],
      meta: { total: 0, page: 1, limit: 30, totalPages: 0 },
    });
    setPosts(unwrapPaginated(res.data));
  };

  useEffect(() => {
    Promise.all([
      fetchWithMeta<CampSummary[]>('/camps', []),
      fetchWithMeta<PaginatedResponse<Post>>('/community/posts?limit=30', {
        data: [],
        meta: { total: 0, page: 1, limit: 30, totalPages: 0 },
      }),
    ]).then(([campsRes, postsRes]) => {
      setCamps(campsRes.data);
      setForm((f) => ({ ...f, campId: f.campId || campsRes.data[0]?.id || '' }));
      setPosts(unwrapPaginated(postsRes.data));
      setLoading(false);
    });
  }, []);

  const publish = async () => {
    if (!isSignedIn) {
      Alert.alert(t('nav.signIn'), t('transport.sessionError'));
      return;
    }
    if (!form.title.trim() || !form.content.trim() || !form.campId) return;
    setSubmitting(true);
    try {
      await syncUser();
      await authFetch('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          campId: form.campId,
          postType: form.postType,
        }),
      });
      setShowForm(false);
      setForm((f) => ({ ...f, title: '', content: '' }));
      await loadPosts();
    } catch {
      Alert.alert(t('common.error'), t('marketplace.publishError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={ui.screen}>
      <Hero
        title={t('community.title')}
        subtitle={t('community.voice')}
        kicker={t('nav.community')}
        back={false}
        right={
          <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
            <AppIcon name="plus" size={20} color={theme.pearl} strokeWidth={2.5} />
          </Pressable>
        }
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.dune} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyWrap}>
              <AppIcon name="users" size={32} color={theme.inkMuted} />
              <Text style={styles.empty}>{t('community.empty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardMeta}>
              <Text style={styles.type}>{postTypeLabel(item.postType, t)}</Text>
              {item.camp?.nameEs ? (
                <Text style={styles.camp}>
                  {' '}
                  · {pickName(locale, { nameEs: item.camp.nameEs, nameAr: item.camp.nameAr ?? item.camp.nameEs })}
                </Text>
              ) : null}
            </View>
            <Text style={styles.author}>{item.author?.displayName ?? t('community.title')}</Text>
            {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
            <Text style={styles.text}>{item.content}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'es-ES', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <ReportButton targetType="community_post" targetId={item.id} compact />
            </View>
          </View>
        )}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('community.newPost')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('publish.listingTitle')}
              placeholderTextColor={theme.inkMuted}
              value={form.title}
              onChangeText={(title) => setForm({ ...form, title })}
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder={t('community.postPlaceholder')}
              placeholderTextColor={theme.inkMuted}
              value={form.content}
              onChangeText={(content) => setForm({ ...form, content })}
              multiline
            />
            {camps.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>{t('community.camp')}</Text>
                <View style={styles.pickerRow}>
                  {camps.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[styles.chip, form.campId === c.id && styles.chipActive]}
                      onPress={() => setForm({ ...form, campId: c.id })}
                    >
                      <Text style={[styles.chipText, form.campId === c.id && styles.chipTextActive]}>
                        {pickName(locale, c)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.pickerRow}>
                  {Object.entries(POST_TYPE_KEYS).map(([value, labelKey]) => (
                    <Pressable
                      key={value}
                      style={[styles.chip, form.postType === value && styles.chipActive]}
                      onPress={() => setForm({ ...form, postType: value })}
                    >
                      <Text style={[styles.chipText, form.postType === value && styles.chipTextActive]}>
                        {t(labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={publish} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={theme.ink} />
                ) : (
                  <Text style={styles.submitText}>{t('community.publish')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.dune,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingBottom: 100 },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: 12 },
  empty: { textAlign: 'center', color: theme.inkMuted },
  card: {
    padding: 16,
    borderRadius: radii.md,
    backgroundColor: theme.surface,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  type: { fontSize: 11, fontWeight: '700', color: theme.oasisDeep, textTransform: 'uppercase' },
  camp: { fontSize: 11, color: theme.inkMuted },
  author: { fontSize: 15, fontWeight: '700', color: theme.oasisDeep, marginTop: 6 },
  title: { fontSize: 16, fontWeight: '700', color: theme.ink, marginTop: 6 },
  text: { fontSize: 15, lineHeight: 22, color: theme.ink, marginTop: 8 },
  time: { fontSize: 13, color: theme.inkMuted, marginTop: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(7,11,16,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: theme.ink, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: theme.inkMuted, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    color: theme.ink,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  chipActive: { backgroundColor: theme.emeraldDeep, borderColor: theme.emeraldDeep },
  chipText: { fontSize: 13, fontWeight: '600', color: theme.ink },
  chipTextActive: { color: theme.ink },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  cancelText: { fontWeight: '600', color: theme.inkMuted },
  submitBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: theme.dune,
  },
  submitText: { fontWeight: '700', color: theme.ink },
});
