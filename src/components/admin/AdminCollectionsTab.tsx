import React, {useState} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {useCms} from '../../context/CmsContext.tsx';
import {
  deletePricingPlan,
  deleteService,
  deleteTestimonial,
  uploadAdminMedia,
  upsertPricingPlan,
  upsertService,
  upsertTestimonial,
} from '../../lib/cmsService.ts';
import type {PricingTier, ServiceOffering, TestimonialItem} from '../../types.ts';
import {ConfirmModal} from './ConfirmModal.tsx';

interface AdminCollectionsTabProps {
  mode: 'services' | 'pricing' | 'testimonials';
  onStatus: (msg: string) => void;
  onError: (msg: string) => void;
}

export const AdminCollectionsTab: React.FC<AdminCollectionsTabProps> = ({
  mode,
  onStatus,
  onError,
}) => {
  const {
    allServicesAdmin,
    pricingPlans,
    testimonials,
    mediaAssets,
    refreshAdminCms,
  } = useCms();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'service' | 'pricing' | 'testimonial';
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Local editable drafts initialized from context
  const [serviceDrafts, setServiceDrafts] = useState<Record<string, ServiceOffering>>({});
  const [pricingDrafts, setPricingDrafts] = useState<Record<string, PricingTier>>({});
  const [testimonialDrafts, setTestimonialDrafts] = useState<Record<string, TestimonialItem>>({});

  const getService = (s: ServiceOffering): ServiceOffering => serviceDrafts[s.id] || s;
  const setServiceField = (s: ServiceOffering, patch: Partial<ServiceOffering>) => {
    setServiceDrafts((prev) => ({...prev, [s.id]: {...getService(s), ...patch}}));
  };

  const getPlan = (p: PricingTier): PricingTier => pricingDrafts[p.id] || p;
  const setPlanField = (p: PricingTier, patch: Partial<PricingTier>) => {
    setPricingDrafts((prev) => ({...prev, [p.id]: {...getPlan(p), ...patch}}));
  };

  const getReview = (t: TestimonialItem): TestimonialItem => testimonialDrafts[t.id] || t;
  const setReviewField = (t: TestimonialItem, patch: Partial<TestimonialItem>) => {
    setTestimonialDrafts((prev) => ({...prev, [t.id]: {...getReview(t), ...patch}}));
  };

  const handleUploadServiceImage = async (svc: ServiceOffering, file: File) => {
    setBusyId(svc.id);
    try {
      const asset = await uploadAdminMedia(file, `${svc.equipment} Photo`, 'service');
      const updated = {...getService(svc), image: asset.url};
      await upsertService(updated);
      await refreshAdminCms();
      onStatus(`Updated picture for ${updated.title}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to upload service photo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveService = async (svc: ServiceOffering) => {
    const current = getService(svc);
    setBusyId(svc.id);
    try {
      await upsertService(current);
      await refreshAdminCms();
      onStatus(`Saved service "${current.title}".`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save service.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveService = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= allServicesAdmin.length) return;
    const a = getService(allServicesAdmin[index]);
    const b = getService(allServicesAdmin[targetIdx]);
    setBusyId(a.id);
    try {
      await Promise.all([
        upsertService({...a, displayOrder: b.displayOrder}),
        upsertService({...b, displayOrder: a.displayOrder}),
      ]);
      await refreshAdminCms();
      onStatus(`Updated display order for ${a.equipment}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to reorder services.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddService = async () => {
    const nextNum = String(allServicesAdmin.length + 1).padStart(2, '0');
    const newSvc: ServiceOffering = {
      id: `svc_${Date.now()}`,
      number: nextNum,
      slug: `service-${Date.now()}`,
      equipment: 'Step Deck',
      title: `${nextNum}. New Dispatch Division`,
      summary: 'Dedicated lane dispatch, broker credit vetting, and detention recovery.',
      targetRpm: '$3.00 – $3.80/mi',
      avgWeeklyGross: '$7,500 – $9,800',
      deliverables: [
        'Direct broker negotiation',
        'Carrier packet & COI administration',
        'Detention & TONU recovery',
      ],
      image: mediaAssets.find((m) => m.category === 'service')?.url || '',
      imageAlt: 'American commercial freight truck',
      displayOrder: allServicesAdmin.length + 1,
      enabled: true,
    };
    setBusyId('new');
    try {
      await upsertService(newSvc);
      await refreshAdminCms();
      onStatus('Added new service division.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to add service.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddPricingPlan = async () => {
    const newPlan: PricingTier = {
      id: `plan_${Date.now()}`,
      name: 'Dedicated Lane Plan',
      audience: 'For specialized carriers',
      rateLabel: '4.5%',
      rateSubtext: 'of gross load revenue · Zero minimums',
      truckRange: '2–5 Power Units',
      highlighted: false,
      description: 'Customized dispatch coverage with dedicated broker negotiation.',
      ctaLabel: 'Select Dedicated Lane Plan',
      displayOrder: pricingPlans.length + 1,
      limits: [
        {label: 'Power Units Covered', value: '2 to 5 trucks'},
        {label: 'Dedicated Dispatcher', value: 'Assigned lead rep'},
        {label: 'Detention & TONU Claims', value: 'Included'},
      ],
    };
    setBusyId('new');
    try {
      await upsertPricingPlan(newPlan);
      await refreshAdminCms();
      onStatus('Added new pricing plan.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to add pricing plan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSavePricingPlan = async (plan: PricingTier) => {
    const current = getPlan(plan);
    setBusyId(plan.id);
    try {
      await upsertPricingPlan(current);
      await refreshAdminCms();
      onStatus(`Saved pricing plan "${current.name}" (${current.rateLabel}).`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save pricing plan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddTestimonial = async () => {
    const newItem: TestimonialItem = {
      id: `test_${Date.now()}`,
      driverName: 'New Carrier Partner',
      role: 'Owner-Operator',
      company: 'American Freight LLC',
      mcNumber: 'MC-1600000',
      equipment: 'Dry Van',
      homeBase: 'Dallas, TX',
      beforeMetric: '$2.40/mi avg',
      afterMetric: '$3.25/mi avg',
      outcomeSummary: '+$1,400 net weekly gain',
      quote: 'Titan Route Dispatch (TRD) LLC keeps our trucks running high-paying lanes with zero paperwork headaches.',
      photoUrl: '',
      permissionGranted: false,
      displayOrder: testimonials.length + 1,
    };
    setBusyId('new');
    try {
      await upsertTestimonial(newItem);
      await refreshAdminCms();
      onStatus('Added new testimonial.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to add testimonial.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUploadTestimonialPhoto = async (item: TestimonialItem, file: File) => {
    setBusyId(item.id);
    try {
      const asset = await uploadAdminMedia(file, `${item.driverName} Photo`, 'testimonial');
      const updated = {...getReview(item), photoUrl: asset.url};
      await upsertTestimonial(updated);
      await refreshAdminCms();
      onStatus(`Uploaded customer photo for ${updated.driverName}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveTestimonial = async (item: TestimonialItem) => {
    const current = getReview(item);
    setBusyId(item.id);
    try {
      await upsertTestimonial(current);
      await refreshAdminCms();
      onStatus(`Saved testimonial from ${current.driverName}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to save testimonial.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      if (confirmTarget.type === 'service') {
        await deleteService(confirmTarget.id);
      } else if (confirmTarget.type === 'pricing') {
        await deletePricingPlan(confirmTarget.id);
      } else {
        await deleteTestimonial(confirmTarget.id);
      }
      await refreshAdminCms();
      onStatus(`Deleted "${confirmTarget.label}".`);
      setConfirmTarget(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  if (mode === 'services') {
    return (
      <div className="mt-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#081B32]">
              Dispatch Services &amp; Equipment Divisions
            </h2>
            <p className="text-xs text-slate-500">
              Add services, upload pictures, change display order, or toggle visibility.
            </p>
          </div>
          <button
            type="button"
            disabled={busyId === 'new'}
            onClick={handleAddService}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add New Service</span>
          </button>
        </div>

        <div className="space-y-4">
          {allServicesAdmin.map((raw, idx) => {
            const svc = getService(raw);
            return (
              <div
                key={svc.id}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#D52B35]">
                      #{idx + 1}
                    </span>
                    <span className="font-display font-bold text-[#081B32]">{svc.title}</span>
                    <label className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={svc.enabled}
                        onChange={(e) => setServiceField(raw, {enabled: e.target.checked})}
                        className="accent-[#D52B35]"
                      />
                      <span>{svc.enabled ? 'Enabled' : 'Hidden'}</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveService(idx, -1)}
                      className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === allServicesAdmin.length - 1}
                      onClick={() => handleMoveService(idx, 1)}
                      className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmTarget({type: 'service', id: svc.id, label: svc.title})
                      }
                      className="rounded border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      aria-label={`Delete ${svc.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-3">
                    <div className="h-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      <img
                        src={svc.image}
                        alt={svc.imageAlt || svc.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <label className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#081B32] hover:bg-slate-100 cursor-pointer">
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Upload Picture</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadServiceImage(raw, file);
                          e.target.value = '';
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-9">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Service Title
                      </label>
                      <input
                        type="text"
                        value={svc.title}
                        onChange={(e) => setServiceField(raw, {title: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Equipment Class
                      </label>
                      <input
                        type="text"
                        value={svc.equipment}
                        onChange={(e) => setServiceField(raw, {equipment: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Target RPM</label>
                      <input
                        type="text"
                        value={svc.targetRpm}
                        onChange={(e) => setServiceField(raw, {targetRpm: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Avg Weekly Gross
                      </label>
                      <input
                        type="text"
                        value={svc.avgWeeklyGross}
                        onChange={(e) => setServiceField(raw, {avgWeeklyGross: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700">Summary</label>
                      <textarea
                        rows={2}
                        value={svc.summary}
                        onChange={(e) => setServiceField(raw, {summary: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={busyId === svc.id}
                    onClick={() => handleSaveService(raw)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#081B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#050F1C] disabled:opacity-60 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{busyId === svc.id ? 'Saving...' : 'Save Service'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <ConfirmModal
          open={Boolean(confirmTarget)}
          title="Delete Service"
          description={`Permanently delete "${confirmTarget?.label || ''}"?`}
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      </div>
    );
  }

  if (mode === 'pricing') {
    return (
      <div className="mt-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#081B32]">
              Live Dispatch Pricing Plans
            </h2>
            <p className="text-xs text-slate-500">
              Change dispatch percentages, plan descriptions, button labels, or add/remove plans.
            </p>
          </div>
          <button
            type="button"
            disabled={busyId === 'new'}
            onClick={handleAddPricingPlan}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Pricing Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {pricingPlans.map((raw) => {
            const tier = getPlan(raw);
            return (
              <div
                key={tier.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tier.highlighted}
                        onChange={(e) => setPlanField(raw, {highlighted: e.target.checked})}
                        className="accent-[#D52B35]"
                      />
                      <span>Featured Dark Card</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmTarget({type: 'pricing', id: tier.id, label: tier.name})
                      }
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      aria-label={`Delete ${tier.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">Plan Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => setPlanField(raw, {name: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#081B32]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">
                        Dispatch %
                      </label>
                      <input
                        type="text"
                        value={tier.rateLabel}
                        onChange={(e) => setPlanField(raw, {rateLabel: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold text-[#D52B35]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600">
                        Truck Range
                      </label>
                      <input
                        type="text"
                        value={tier.truckRange}
                        onChange={(e) => setPlanField(raw, {truckRange: e.target.value})}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Rate Subtext
                    </label>
                    <input
                      type="text"
                      value={tier.rateSubtext}
                      onChange={(e) => setPlanField(raw, {rateSubtext: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Audience Label
                    </label>
                    <input
                      type="text"
                      value={tier.audience}
                      onChange={(e) => setPlanField(raw, {audience: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={tier.ctaLabel || ''}
                      onChange={(e) => setPlanField(raw, {ctaLabel: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Plan Description
                    </label>
                    <textarea
                      rows={3}
                      value={tier.description}
                      onChange={(e) => setPlanField(raw, {description: e.target.value})}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busyId === tier.id}
                  onClick={() => handleSavePricingPlan(raw)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#081B32] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#050F1C] disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{busyId === tier.id ? 'Saving...' : 'Save Pricing Plan'}</span>
                </button>
              </div>
            );
          })}
        </div>

        <ConfirmModal
          open={Boolean(confirmTarget)}
          title="Delete Pricing Plan"
          description={`Remove pricing plan "${confirmTarget?.label || ''}" from the website?`}
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      </div>
    );
  }

  // Testimonials Management
  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-[#081B32]">
            Customer Testimonials &amp; Photos
          </h2>
          <p className="text-xs text-slate-500">
            Add or edit carrier reviews and upload customer photos only with confirmed permission.
          </p>
        </div>
        <button
          type="button"
          disabled={busyId === 'new'}
          onClick={handleAddTestimonial}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Testimonial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {testimonials.map((raw) => {
          const item = getReview(raw);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.driverName}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#081B32]">
                      {item.driverName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-[#081B32]">{item.driverName}</div>
                    <div className="text-xs text-slate-500">{item.company}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-[#081B32] cursor-pointer">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Photo</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadTestimonialPhoto(raw, file);
                        e.target.value = '';
                      }}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmTarget({
                        type: 'testimonial',
                        id: item.id,
                        label: item.driverName,
                      })
                    }
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    aria-label={`Delete ${item.driverName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Driver Name</label>
                  <input
                    type="text"
                    value={item.driverName}
                    onChange={(e) => setReviewField(raw, {driverName: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Role</label>
                  <input
                    type="text"
                    value={item.role}
                    onChange={(e) => setReviewField(raw, {role: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Company</label>
                  <input
                    type="text"
                    value={item.company}
                    onChange={(e) => setReviewField(raw, {company: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">
                    MC Number &amp; Equipment
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.mcNumber}
                      onChange={(e) => setReviewField(raw, {mcNumber: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={item.equipment}
                      onChange={(e) => setReviewField(raw, {equipment: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">
                    Before Metric
                  </label>
                  <input
                    type="text"
                    value={item.beforeMetric}
                    onChange={(e) => setReviewField(raw, {beforeMetric: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">After Metric</label>
                  <input
                    type="text"
                    value={item.afterMetric}
                    onChange={(e) => setReviewField(raw, {afterMetric: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600">
                    Outcome Summary
                  </label>
                  <input
                    type="text"
                    value={item.outcomeSummary}
                    onChange={(e) => setReviewField(raw, {outcomeSummary: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600">Quote</label>
                  <textarea
                    rows={3}
                    value={item.quote}
                    onChange={(e) => setReviewField(raw, {quote: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.permissionGranted}
                    onChange={(e) =>
                      setReviewField(raw, {permissionGranted: e.target.checked})
                    }
                    className="h-4 w-4 accent-[#D52B35]"
                  />
                  <span>Customer photo display permission confirmed</span>
                </label>

                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleSaveTestimonial(raw)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#081B32] px-4 py-2 text-xs font-semibold text-white hover:bg-[#050F1C] disabled:opacity-60 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{busyId === item.id ? 'Saving...' : 'Save Testimonial'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title="Delete Testimonial"
        description={`Remove testimonial from "${confirmTarget?.label || ''}"?`}
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
