import React, {useState} from 'react';
import {CheckCircle2, Image as ImageIcon, Trash2, Upload} from 'lucide-react';
import {useCms} from '../../context/CmsContext.tsx';
import {
  deleteAdminMedia,
  readFileAsDataUrl,
  uploadAdminMedia,
} from '../../lib/cmsService.ts';
import type {MediaAsset, MediaCategory} from '../../types.ts';
import {ConfirmModal} from './ConfirmModal.tsx';

interface AdminBrandingMediaTabProps {
  mode: 'logo' | 'media';
  onStatus: (msg: string) => void;
  onError: (msg: string) => void;
}

export const AdminBrandingMediaTab: React.FC<AdminBrandingMediaTabProps> = ({
  mode,
  onStatus,
  onError,
}) => {
  const {
    draftContent,
    setDraftContent,
    setHasUnsavedDraft,
    mediaAssets,
    refreshAdminCms,
  } = useCms();

  const [uploadCategory, setUploadCategory] = useState<MediaCategory>(
    mode === 'logo' ? 'logo' : 'hero'
  );
  const [uploadLabel, setUploadLabel] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const [confirmAsset, setConfirmAsset] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      onError('Image must be 4 MB or smaller.');
      e.target.value = '';
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPendingFile(file);
      setPreviewUrl(dataUrl);
      if (!uploadLabel.trim()) {
        setUploadLabel(file.name.replace(/\.[^.]+$/, ''));
      }
    } catch {
      onError('Could not preview selected image.');
    }
    e.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile) return;
    setUploading(true);
    onError('');
    try {
      const asset = await uploadAdminMedia(pendingFile, uploadLabel, uploadCategory);
      await refreshAdminCms();
      setPendingFile(null);
      setPreviewUrl('');
      setUploadLabel('');
      onStatus(`Uploaded "${asset.label}" to media library.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleAssignSlot = (
    slot: 'logoUrl' | 'welcomeLogoUrl' | 'faviconUrl' | 'heroImage' | 'operationsImage' | 'ogImage',
    url: string,
    label: string
  ) => {
    setDraftContent((prev) => {
      if (slot === 'ogImage') {
        return {...prev, seo: {...prev.seo, ogImage: url}};
      }
      return {...prev, [slot]: url};
    });
    setHasUnsavedDraft(true);
    onStatus(`Assigned "${label}" to ${slot}. Save Draft or Publish Live to apply.`);
  };

  const handleDeleteAsset = async () => {
    if (!confirmAsset) return;
    setDeleting(true);
    try {
      await deleteAdminMedia(confirmAsset);
      await refreshAdminCms();
      onStatus(`Deleted "${confirmAsset.label}".`);
      setConfirmAsset(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to delete media asset.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredAssets =
    mode === 'logo'
      ? mediaAssets.filter((a) => a.category === 'logo' || a.category === 'favicon')
      : mediaAssets.filter((a) => a.category !== 'logo' && a.category !== 'favicon');

  return (
    <div className="mt-6 space-y-6">
      {/* Current Active Slots */}
      {mode === 'logo' ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {key: 'logoUrl' as const, title: 'Header & Footer Logo', url: draftContent.logoUrl},
            {
              key: 'welcomeLogoUrl' as const,
              title: 'Welcome Animation Logo',
              url: draftContent.welcomeLogoUrl,
            },
            {key: 'faviconUrl' as const, title: 'Browser Favicon', url: draftContent.faviconUrl},
          ].map((slot) => (
            <div key={slot.key} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold text-slate-500">{slot.title}</div>
              <div className="mt-3 flex h-28 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
                <img
                  src={slot.url}
                  alt={slot.title}
                  className="max-h-20 w-auto object-contain"
                />
              </div>
              <input
                type="text"
                value={slot.url}
                onChange={(e) => handleAssignSlot(slot.key, e.target.value, 'Custom URL')}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-700"
                aria-label={`${slot.title} URL`}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            {key: 'heroImage' as const, title: 'Homepage Hero Truck Photo', url: draftContent.heroImage},
            {
              key: 'operationsImage' as const,
              title: 'Operations Center Background Photo',
              url: draftContent.operationsImage,
            },
          ].map((slot) => (
            <div key={slot.key} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs font-semibold text-slate-500">{slot.title}</div>
              <div className="mt-3 h-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img src={slot.url} alt={slot.title} className="h-full w-full object-cover" />
              </div>
              <input
                type="text"
                value={slot.url}
                onChange={(e) => handleAssignSlot(slot.key, e.target.value, 'Custom Image URL')}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-700"
                aria-label={`${slot.title} URL`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload & Preview Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-[#081B32]">
          {mode === 'logo'
            ? 'Upload New Logo or Favicon (PNG, SVG, WebP, ICO)'
            : 'Upload Truck, Hero, Service, or Background Photo'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Preview your uploaded file before saving it to the secure TRD media library.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700">Asset Label</label>
            <input
              type="text"
              value={uploadLabel}
              onChange={(e) => setUploadLabel(e.target.value)}
              placeholder={mode === 'logo' ? 'e.g. Transparent White TRD Logo' : 'e.g. Hero Freightliner'}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-xs font-semibold text-slate-700">Category</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as MediaCategory)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#081B32]"
            >
              {mode === 'logo' ? (
                <>
                  <option value="logo">Company Logo (PNG / SVG)</option>
                  <option value="favicon">Website Favicon (PNG / ICO / SVG)</option>
                </>
              ) : (
                <>
                  <option value="hero">Hero Truck Photo</option>
                  <option value="service">Service Equipment Photo</option>
                  <option value="background">Operations / Background Photo</option>
                  <option value="seo">Social Sharing OG Image</option>
                </>
              )}
            </select>
          </div>
          <div className="flex items-end sm:col-span-4">
            <label className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#081B32]/40 bg-slate-50 px-4 py-2 text-xs font-semibold text-[#081B32] hover:border-[#D52B35] hover:text-[#D52B35] cursor-pointer">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>Choose Image File</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp,.svg,.ico"
                onChange={handleSelectFile}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <img
                src={previewUrl}
                alt="Upload Preview"
                className="h-20 w-28 rounded-lg border border-slate-200 bg-white object-contain p-1"
              />
              <div>
                <div className="text-sm font-semibold text-[#081B32]">
                  Ready to save: {pendingFile?.name}
                </div>
                <div className="text-xs text-slate-500">
                  Category: {uploadCategory} · Preview verified before saving
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingFile(null);
                  setPreviewUrl('');
                }}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={handleUploadConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>{uploading ? 'Saving...' : 'Save Image to Library'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Library Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-[#081B32]">
            {mode === 'logo' ? 'Saved Logos & Favicons' : 'Saved Website Photography'}
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            {filteredAssets.length} assets
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC]"
            >
              <div>
                <div className="flex h-36 items-center justify-center border-b border-slate-200 bg-white p-2">
                  {asset.url ? (
                    <img
                      src={asset.url}
                      alt={asset.label}
                      className={`max-h-full w-full ${
                        mode === 'logo' ? 'object-contain' : 'object-cover rounded'
                      }`}
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" aria-hidden="true" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#D52B35] uppercase">
                      {asset.category}
                    </span>
                    <span className="font-mono text-slate-500">{asset.sizeLabel}</span>
                  </div>
                  <div className="mt-1 truncate font-semibold text-sm text-[#081B32]">
                    {asset.label}
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                    {asset.url}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {mode === 'logo' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAssignSlot('logoUrl', asset.url, asset.label)}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                      >
                        Use Main Logo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignSlot('welcomeLogoUrl', asset.url, asset.label)}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                      >
                        Use Intro
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignSlot('faviconUrl', asset.url, asset.label)}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                      >
                        Favicon
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAssignSlot('heroImage', asset.url, asset.label)}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                      >
                        Set Hero
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAssignSlot('operationsImage', asset.url, asset.label)}
                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                      >
                        Set Ops BG
                      </button>
                    </>
                  )}
                </div>

                {asset.id !== 'asset_trd_logo' && (
                  <button
                    type="button"
                    onClick={() => setConfirmAsset(asset)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    aria-label={`Delete ${asset.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(confirmAsset)}
        title="Delete Media Asset"
        description={`Remove "${confirmAsset?.label || ''}" from your media library? Make sure no active page slots rely on this file.`}
        busy={deleting}
        onConfirm={handleDeleteAsset}
        onCancel={() => setConfirmAsset(null)}
      />
    </div>
  );
};
