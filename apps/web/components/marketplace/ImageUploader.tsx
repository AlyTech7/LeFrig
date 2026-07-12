'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { AppIcon } from '@/components/AppIcon';
import { prepareListingImages } from '@/lib/image-prep';
import { useT } from '@/lib/locale';
import {
  GALLERY_ACCEPT,
  MAX_IMAGES,
  runPool,
  uploadListingImage,
  uploadListingImagesBatch,
  validateImageFile,
} from '@/lib/uploads';

export type PhotoItem = {
  id: string;
  preview: string;
  url: string | null;
  uploading: boolean;
  processing: boolean;
  progress: number;
  error?: string;
  name: string;
  file?: File;
};

type Props = {
  photos: PhotoItem[];
  onChange: Dispatch<SetStateAction<PhotoItem[]>>;
  getToken: () => Promise<string | null>;
  isSignedIn: boolean;
  onSignInRequired?: () => void;
  onBeforeUpload?: () => Promise<void>;
};

function newId() {
  return `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ImageUploader({
  photos,
  onChange,
  getToken,
  isSignedIn,
  onSignInRequired,
  onBeforeUpload,
}: Props) {
  const t = useT();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [banner, setBanner] = useState('');
  const [preparing, setPreparing] = useState(false);
  const syncedRef = useRef(false);

  const canAdd = photos.length < MAX_IMAGES;
  const uploadingCount = photos.filter((p) => p.uploading || p.processing).length;
  const readyCount = photos.filter((p) => p.url && !p.error).length;

  const uploadOne = useCallback(
    async (itemId: string, file: File) => {
      if (!syncedRef.current && onBeforeUpload) {
        await onBeforeUpload();
        syncedRef.current = true;
      }

      const token = await getToken();
      if (!token) {
        onChange((prev) =>
          prev.map((p) =>
            p.id === itemId ? { ...p, uploading: false, processing: false, error: t('uploader.signInToUpload') } : p,
          ),
        );
        return;
      }

      onChange((prev) =>
        prev.map((p) =>
          p.id === itemId ? { ...p, uploading: true, processing: false, progress: 0, error: undefined } : p,
        ),
      );

      try {
        const result = await uploadListingImage(file, token, (pct) => {
          onChange((prev) => prev.map((p) => (p.id === itemId ? { ...p, progress: pct } : p)));
        });
        onChange((prev) =>
          prev.map((p) =>
            p.id === itemId
              ? { ...p, url: result.url, uploading: false, progress: 100, error: undefined, file: undefined }
              : p,
          ),
        );
      } catch (err) {
        onChange((prev) =>
          prev.map((p) =>
            p.id === itemId
              ? {
                  ...p,
                  uploading: false,
                  file,
                  error: err instanceof Error ? err.message : t('uploader.uploadError'),
                }
              : p,
          ),
        );
      }
    },
    [getToken, onBeforeUpload, onChange, t],
  );

  const ingestFiles = useCallback(
    async (rawFiles: FileList | File[]) => {
      if (!isSignedIn) {
        onSignInRequired?.();
        return;
      }

      const incoming = Array.from(rawFiles).slice(0, MAX_IMAGES - photos.length);
      if (!incoming.length) {
        if (photos.length >= MAX_IMAGES) {
          setBanner(t('uploader.maxPhotos', { max: MAX_IMAGES }));
        }
        return;
      }

      const rejected: string[] = [];
      const accepted: File[] = [];
      for (const file of incoming) {
        const err = validateImageFile(file);
        if (err) rejected.push(err);
        else accepted.push(file);
      }

      if (!accepted.length) {
        setBanner(rejected.join(' · ') || t('uploader.noValidFiles'));
        return;
      }

      setPreparing(true);
      setBanner('');

      const prepared = await prepareListingImages(accepted);
      setPreparing(false);

      const failedPrep = prepared.filter((r) => !r.ok) as { ok: false; name: string; error: string }[];
      if (failedPrep.length) {
        setBanner(failedPrep.map((f) => `${f.name}: ${f.error}`).join(' · '));
      }

      const okFiles = prepared
        .filter((r): r is { ok: true; file: File } => r.ok)
        .map((r) => r.file);
      if (!okFiles.length) return;

      const newItems: PhotoItem[] = okFiles.map((file) => ({
        id: newId(),
        preview: URL.createObjectURL(file),
        url: null,
        uploading: false,
        processing: true,
        progress: 0,
        name: file.name,
        file,
      }));

      onChange((prev) => [...prev, ...newItems]);

      const token = await getToken();
      if (!token) {
        onChange((prev) =>
          prev.map((p) =>
            newItems.some((n) => n.id === p.id)
              ? { ...p, processing: false, uploading: false, error: t('uploader.signInToUpload') }
              : p,
          ),
        );
        return;
      }

      if (okFiles.length > 1) {
        onChange((prev) =>
          prev.map((p) =>
            newItems.some((n) => n.id === p.id)
              ? { ...p, processing: false, uploading: true, progress: 0 }
              : p,
          ),
        );
        try {
          const results = await uploadListingImagesBatch(okFiles, token);
          onChange((prev) =>
            prev.map((p) => {
              const idx = newItems.findIndex((n) => n.id === p.id);
              if (idx < 0) return p;
              const result = results[idx];
              if (!result) return { ...p, uploading: false, error: t('uploader.uploadError') };
              return {
                ...p,
                url: result.url,
                uploading: false,
                progress: 100,
                error: undefined,
                file: undefined,
              };
            }),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : t('uploader.uploadError');
          onChange((prev) =>
            prev.map((p) =>
              newItems.some((n) => n.id === p.id)
                ? { ...p, uploading: false, error: message }
                : p,
            ),
          );
        }
        return;
      }

      await runPool(
        newItems.map((item, i) => ({ item, file: okFiles[i]! })),
        ({ item, file }) => uploadOne(item.id, file),
      );
    },
    [isSignedIn, onSignInRequired, onChange, photos.length, uploadOne, t],
  );

  const retryPhoto = (id: string) => {
    const item = photos.find((p) => p.id === id);
    if (!item?.file) return;
    void uploadOne(id, item.file);
  };

  const removePhoto = (id: string) => {
    onChange((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    onChange((prev) => {
      const fromIdx = prev.findIndex((p) => p.id === fromId);
      const toIdx = prev.findIndex((p) => p.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved!);
      return next;
    });
  };

  const setCover = (id: string) => {
    onChange((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked!);
      return next;
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) void ingestFiles(e.dataTransfer.files);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'));
      if (files.length && canAdd) void ingestFiles(files);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [canAdd, ingestFiles]);

  return (
    <div className="pub-gallery">
      <div className="pub-gallery__head">
        <div>
          <p className="pub-subtitle pub-subtitle--inline">{t('uploader.title')}</p>
          <p className="pub-hint pub-hint--tight">
            {t('uploader.hint', { max: MAX_IMAGES })}
          </p>
        </div>
        <span className="pub-gallery__count" aria-live="polite">
          {readyCount}/{MAX_IMAGES}
        </span>
      </div>

      {banner && (
        <p className="pub-gallery__banner" role="alert">
          {banner}
          <button type="button" onClick={() => setBanner('')} aria-label={t('uploader.closeBanner')}>
            ×
          </button>
        </p>
      )}

      {photos.length > 0 && (
        <div className="pub-filmstrip" role="list" aria-label={t('uploader.filmstripAria')}>
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              role="listitem"
              className={`pub-thumb ${index === 0 ? 'pub-thumb--cover' : ''} ${dragId === photo.id ? 'pub-thumb--drag' : ''}`}
              draggable={!photo.uploading && !photo.processing}
              onDragStart={() => setDragId(photo.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) reorder(dragId, photo.id);
                setDragId(null);
              }}
            >
              <img src={photo.preview} alt={photo.name} draggable={false} />
              {index === 0 && <span className="pub-thumb__badge">{t('uploader.cover')}</span>}
              {(photo.processing || photo.uploading) && (
                <div className="pub-thumb__overlay">
                  <span className="pub-thumb__spinner" aria-hidden />
                  <span>{photo.processing ? t('uploader.preparing') : t('uploader.progress', { pct: photo.progress })}</span>
                </div>
              )}
              {photo.error && (
                <div className="pub-thumb__overlay pub-thumb__overlay--error">
                  <span>{photo.error}</span>
                  {photo.file && (
                    <button type="button" className="pub-thumb__retry" onClick={() => retryPhoto(photo.id)}>
                      {t('uploader.retry')}
                    </button>
                  )}
                </div>
              )}
              {!photo.uploading && !photo.processing && !photo.error && photo.url && (
                <span className="pub-thumb__ok" aria-label={t('uploader.uploadOk')}>
                  ✓
                </span>
              )}
              <div className="pub-thumb__actions">
                {index > 0 && (
                  <button type="button" onClick={() => setCover(photo.id)} title={t('uploader.makeCover')} aria-label={t('uploader.makeCover')}>
                    ★
                  </button>
                )}
                <button type="button" onClick={() => removePhoto(photo.id)} title={t('uploader.removePhoto')} aria-label={t('uploader.removePhoto')}>
                  ×
                </button>
              </div>
            </figure>
          ))}

          {canAdd && (
            <button
              type="button"
              className="pub-thumb pub-thumb--add"
              onClick={() => galleryRef.current?.click()}
              aria-label={t('uploader.addMore')}
            >
              <span>+</span>
              <small>{t('uploader.add')}</small>
            </button>
          )}
        </div>
      )}

      {canAdd && (
        <div
          className={`pub-drop ${dragOver ? 'pub-drop--over' : ''} ${photos.length > 0 ? 'pub-drop--compact' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <input
            ref={cameraRef}
            type="file"
            accept={GALLERY_ACCEPT}
            capture="environment"
            hidden
            onChange={(e) => {
              if (e.target.files?.length) void ingestFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept={GALLERY_ACCEPT}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) void ingestFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {photos.length === 0 && (
            <div className="pub-drop__hero">
              <div className="pub-drop__icon">
                <AppIcon name="package" size={28} color="var(--pub-gold, #a8842d)" />
              </div>
              <strong>{t('uploader.heroTitle')}</strong>
              <span>{t('uploader.heroSub')}</span>
            </div>
          )}

          <div className="pub-drop__actions">
            <button
              type="button"
              className="pub-drop__btn pub-drop__btn--camera"
              onClick={() => cameraRef.current?.click()}
              disabled={preparing || uploadingCount > 0}
            >
              <AppIcon name="camera" size={20} color="var(--pub-oasis, #2d8a62)" />
              <span>
                <strong>{t('uploader.takePhoto')}</strong>
              </span>
            </button>
            <button
              type="button"
              className="pub-drop__btn pub-drop__btn--gallery"
              onClick={() => galleryRef.current?.click()}
              disabled={preparing || uploadingCount > 0}
            >
              <AppIcon name="image" size={20} color="var(--pub-gold, #a8842d)" />
              <span>
                <strong>{t('uploader.pickGallery')}</strong>
              </span>
            </button>
          </div>

          {(preparing || uploadingCount > 0) && (
            <p className="pub-drop__status" role="status">
              {preparing ? t('uploader.optimizing') : t('uploader.uploading', { count: uploadingCount })}
            </p>
          )}
        </div>
      )}

      <p className="pub-gallery__foot">{t('uploader.footTip')}</p>
    </div>
  );
}
