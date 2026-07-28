import { useState } from 'react';
import { View, Image, Pressable, StyleSheet, ActivityIndicator, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon } from '@/components/AppIcon';
import { uploadListingImageFromUri } from '@/lib/uploads';
import { theme, radii } from '@/lib/theme';
import { type as typo } from '@/lib/ui';
import { useT } from '@/lib/locale';

type Props = {
  url: string | null;
  onChange: (url: string | null) => void;
  getToken: () => Promise<string | null>;
  label?: string;
};

export function SingleImagePicker({ url, onChange, getToken, label }: Props) {
  const t = useT();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error(t('uploader.signInToUpload'));
      const uploaded = await uploadListingImageFromUri(result.assets[0].uri, token);
      onChange(uploaded.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('uploader.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.box} onPress={() => void pick()} disabled={uploading}>
        {url ? (
          <Image source={{ uri: url }} style={styles.img} />
        ) : (
          <View style={styles.placeholder}>
            <AppIcon name="camera" size={22} color={theme.dune} />
            <Text style={styles.hint}>{t('publish.photosTitle')}</Text>
          </View>
        )}
        {uploading ? (
          <View style={styles.overlay}>
            <ActivityIndicator color={theme.pearl} />
          </View>
        ) : null}
      </Pressable>
      {url ? (
        <Pressable onPress={() => onChange(null)} style={styles.clear}>
          <Text style={styles.clearText}>{t('common.remove')}</Text>
        </Pressable>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  label: { ...typo.label, marginBottom: 6 },
  box: {
    height: 140,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: theme.borderStrong,
    borderStyle: 'dashed',
    overflow: 'hidden',
    backgroundColor: theme.surface,
  },
  img: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  hint: { ...typo.caption, color: theme.dune },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clear: { marginTop: 6 },
  clearText: { ...typo.caption, color: theme.flare, fontWeight: '700' },
  error: { ...typo.caption, color: theme.flare, marginTop: 4 },
});
