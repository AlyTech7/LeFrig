import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon } from './AppIcon';
import { theme, radii } from '@/lib/theme';
import { MAX_IMAGES } from '@/lib/image-prep';
import { useT } from '@/lib/locale';

export type PhotoSlot = {
  id: string;
  localUri: string;
  remoteUrl?: string;
  uploading: boolean;
  error?: string;
};

type Props = {
  photos: PhotoSlot[];
  onChange: (photos: PhotoSlot[]) => void;
  onUpload: (slot: PhotoSlot) => Promise<void>;
  disabled?: boolean;
};

export function ListingPhotoPicker({ photos, onChange, onUpload, disabled }: Props) {
  const t = useT();

  const addPhotos = async (fromCamera: boolean) => {
    if (photos.length >= MAX_IMAGES) return;

    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 1, allowsEditing: false })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 1,
          allowsMultipleSelection: true,
          selectionLimit: MAX_IMAGES - photos.length,
        });

    if (result.canceled) return;

    const assets = result.assets ?? [];
    const newSlots: PhotoSlot[] = assets.map((a) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      localUri: a.uri,
      uploading: true,
    }));

    const merged = [...photos, ...newSlots].slice(0, MAX_IMAGES);
    onChange(merged);

    for (const slot of newSlots) {
      await onUpload(slot);
    }
  };

  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('publish.photosTitle')} *</Text>
      <Text style={styles.hint}>{t('publish.photosHint')}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((p, i) => (
          <View key={p.id} style={styles.thumbWrap}>
            <Image source={{ uri: p.remoteUrl ?? p.localUri }} style={styles.thumb} />
            {p.uploading ? (
              <View style={styles.overlay}>
                <ActivityIndicator color={theme.pearl} />
              </View>
            ) : null}
            {p.error ? (
              <View style={[styles.overlay, styles.errorOverlay]}>
                <Text style={styles.errorText}>!</Text>
              </View>
            ) : null}
            {i === 0 ? (
              <View style={styles.coverBadge}>
                <Text style={styles.coverText}>{t('publish.coverPhoto')}</Text>
              </View>
            ) : null}
            <Pressable style={styles.removeBtn} onPress={() => remove(p.id)} disabled={disabled}>
              <AppIcon name="x" size={14} color={theme.pearl} />
            </Pressable>
          </View>
        ))}

        {photos.length < MAX_IMAGES ? (
          <>
            <Pressable style={styles.addBtn} onPress={() => addPhotos(true)} disabled={disabled}>
              <AppIcon name="camera" size={24} color={theme.oasisDeep} />
              <Text style={styles.addText}>{t('publish.camera')}</Text>
            </Pressable>
            <Pressable style={styles.addBtn} onPress={() => addPhotos(false)} disabled={disabled}>
              <AppIcon name="image" size={24} color={theme.oasisDeep} />
              <Text style={styles.addText}>{t('publish.gallery')}</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '800', color: theme.ink, marginBottom: 4 },
  hint: { fontSize: 13, color: theme.inkMuted, marginBottom: 12 },
  row: { gap: 10, paddingVertical: 4 },
  thumbWrap: { width: 96, height: 96, borderRadius: radii.md, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorOverlay: { backgroundColor: 'rgba(180,40,40,0.7)' },
  errorText: { color: theme.pearl, fontWeight: '800', fontSize: 20 },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: { color: theme.pearl, fontSize: 9, fontWeight: '700' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 96,
    height: 96,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.surface,
  },
  addText: { fontSize: 11, fontWeight: '700', color: theme.oasisDeep },
});
