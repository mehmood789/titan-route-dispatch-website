import React, {useMemo, useState} from 'react';
import {Check, Download, FileText, Pencil, Plus, Search, Trash2, X} from 'lucide-react';
import {
  deleteCarrierAdmin,
  deleteInquiryAdmin,
  deleteLoadAdmin,
  downloadCarrierDocSecure,
  formatFirestoreDate,
  formatFirestoreDateTime,
  updateCarrierAdmin,
  updateCarrierStatusAdmin,
  updateInquiryStatusAdmin,
  updateLoadStatusAdmin,
  upsertLoadAdmin,
} from '../../lib/cmsService.ts';
import {sanitizeUiError} from '../../lib/firebase.ts';
import type {
  CarrierApplication,
  CarrierStatus,
  ContactInquiry,
  DispatchLoad,
  EquipmentType,
  InquiryStatus,
  LoadStatus,
  UploadedDocument,
} from '../../types.ts';
import {ConfirmModal} from './ConfirmModal.tsx';

interface AdminOperationsTabProps {
  mode: 'overview' | 'carriers' | 'contacts' | 'loads';
  carriers: CarrierApplication[];
  inquiries: ContactInquiry[];
  loads: DispatchLoad[];
  onReload: () => Promise<void>;
  onStatus: (msg: string) => void;
  onError: (msg: string) => void;
}

const CARRIER_STATUS_STYLES: Record<CarrierStatus, string> = {
  Approved: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
  Onboarding: 'bg-amber-50 text-[#D97706] border-amber-200',
  'Pending Review': 'bg-slate-100 text-slate-700 border-slate-300',
  Declined: 'bg-red-50 text-[#DC2626] border-red-200',
};

const INQUIRY_STATUS_STYLES: Record<InquiryStatus, string> = {
  Open: 'bg-amber-50 text-[#D97706] border-amber-200',
  Read: 'bg-slate-100 text-slate-700 border-slate-300',
  Replied: 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
};

const LOAD_STATUS_STYLES: Record<LoadStatus, string> = {
  Delivered: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
  'In Transit': 'bg-blue-50 text-blue-700 border-blue-200',
  Dispatched: 'bg-amber-50 text-[#D97706] border-amber-200',
  Booked: 'bg-slate-100 text-slate-700 border-slate-300',
};

export const AdminOperationsTab: React.FC<AdminOperationsTabProps> = ({
  mode,
  carriers,
  inquiries,
  loads,
  onReload,
  onStatus,
  onError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierStatusFilter, setCarrierStatusFilter] = useState<'All' | CarrierStatus>('All');
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [isEditingCarrier, setIsEditingCarrier] = useState(false);
  const [carrierSaving, setCarrierSaving] = useState(false);
  const [carrierEditForm, setCarrierEditForm] = useState<{
    companyName: string;
    ownerName: string;
    email: string;
    phone: string;
    mcNumber: string;
    dotNumber: string;
    physicalAddress: string;
    mailingAddress: string;
    equipmentType: EquipmentType;
    truckCount: number;
    factoringCompany: string;
    selectedPlan: string;
    notes: string;
    status: CarrierStatus;
  } | null>(null);

  const selectedCarrier = useMemo(
    () => carriers.find((c) => c.id === selectedCarrierId) || null,
    [carriers, selectedCarrierId]
  );

  const openCarrierDrawer = (carrier: CarrierApplication) => {
    setSelectedCarrierId(carrier.id);
    setIsEditingCarrier(false);
    setCarrierEditForm({
      companyName: carrier.companyName,
      ownerName: carrier.ownerName,
      email: carrier.email,
      phone: carrier.phone,
      mcNumber: carrier.mcNumber,
      dotNumber: carrier.dotNumber,
      physicalAddress: carrier.physicalAddress || '',
      mailingAddress: carrier.mailingAddress || '',
      equipmentType: carrier.equipmentType,
      truckCount: Number(carrier.truckCount) || 1,
      factoringCompany: carrier.factoringCompany || 'Direct / None',
      selectedPlan: carrier.selectedPlan,
      notes: carrier.notes || '',
      status: carrier.status,
    });
  };

  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'carrier' | 'inquiry' | 'load';
    id: string;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadForm, setLoadForm] = useState({
    carrierName: '',
    mcNumber: 'MC-1482910',
    origin: '',
    destination: '',
    equipmentType: 'Dry Van' as EquipmentType,
    miles: 750,
    grossPay: 2450,
    brokerName: '',
    pickupDate: new Date().toISOString().slice(0, 10),
  });
  const [loadSubmitting, setLoadSubmitting] = useState(false);

  const metrics = useMemo(() => {
    const totalPowerUnits = carriers.reduce((sum, c) => sum + Number(c.truckCount || 0), 0);
    const pendingCarriers = carriers.filter((c) => c.status === 'Pending Review').length;
    const totalLoadGross = loads.reduce((sum, l) => sum + Number(l.grossPay || 0), 0);
    const avgRpm =
      loads.length > 0 ? loads.reduce((sum, l) => sum + Number(l.rpm || 0), 0) / loads.length : 0;
    const openInquiries = inquiries.filter((i) => i.status === 'Open').length;
    return {
      totalCarriers: carriers.length,
      totalPowerUnits,
      pendingCarriers,
      totalLoadGross,
      avgRpm,
      openInquiries,
    };
  }, [carriers, loads, inquiries]);

  const filteredCarriers = useMemo(() => {
    return carriers.filter((c) => {
      const matchesStatus =
        carrierStatusFilter === 'All' || c.status === carrierStatusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.companyName.toLowerCase().includes(q) ||
        c.mcNumber.toLowerCase().includes(q) ||
        c.dotNumber.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.referenceCode.toLowerCase().includes(q) ||
        c.equipmentType.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [carriers, carrierStatusFilter, searchQuery]);

  const filteredLoads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return loads;
    return loads.filter(
      (l) =>
        l.loadNumber.toLowerCase().includes(q) ||
        l.carrierName.toLowerCase().includes(q) ||
        l.origin.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.brokerName.toLowerCase().includes(q)
    );
  }, [loads, searchQuery]);

  const handleCarrierStatus = async (carrier: CarrierApplication, status: CarrierStatus) => {
    try {
      await updateCarrierStatusAdmin(carrier, status);
      if (carrierEditForm && selectedCarrierId === carrier.id) {
        setCarrierEditForm({...carrierEditForm, status});
      }
      onStatus(`Updated ${carrier.companyName} to ${status}.`);
    } catch (err) {
      onError(sanitizeUiError(err, 'Unable to update carrier status.'));
    }
  };

  const handleSaveCarrierUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarrier || !carrierEditForm) return;
    setCarrierSaving(true);
    try {
      await updateCarrierAdmin(selectedCarrier.id, {
        companyName: carrierEditForm.companyName.trim(),
        ownerName: carrierEditForm.ownerName.trim(),
        email: carrierEditForm.email.trim(),
        phone: carrierEditForm.phone.trim(),
        mcNumber: carrierEditForm.mcNumber.trim(),
        dotNumber: carrierEditForm.dotNumber.trim(),
        physicalAddress: carrierEditForm.physicalAddress.trim(),
        mailingAddress: carrierEditForm.mailingAddress.trim(),
        equipmentType: carrierEditForm.equipmentType,
        truckCount: Math.max(1, Math.min(500, Number(carrierEditForm.truckCount) || 1)),
        factoringCompany: carrierEditForm.factoringCompany.trim() || 'Direct / None',
        selectedPlan: carrierEditForm.selectedPlan,
        notes: carrierEditForm.notes.trim(),
        status: carrierEditForm.status,
      });
      setIsEditingCarrier(false);
      onStatus(`Saved updates to ${carrierEditForm.companyName.trim()}.`);
    } catch (err) {
      onError(sanitizeUiError(err, 'Unable to update carrier registration.'));
    } finally {
      setCarrierSaving(false);
    }
  };

  const handleInquiryStatus = async (inq: ContactInquiry, status: InquiryStatus) => {
    try {
      await updateInquiryStatusAdmin(inq.id, status);
      await onReload();
      onStatus(`Marked message from ${inq.name} as ${status}.`);
    } catch (err) {
      onError(sanitizeUiError(err, 'Unable to update message status.'));
    }
  };

  const handleLoadStatus = async (load: DispatchLoad, status: LoadStatus) => {
    try {
      await updateLoadStatusAdmin(load.id, status);
      await onReload();
      onStatus(`Load ${load.loadNumber} updated to ${status}.`);
    } catch (err) {
      onError(sanitizeUiError(err, 'Unable to update load status.'));
    }
  };

  const handleDownloadDoc = async (docItem: UploadedDocument) => {
    try {
      await downloadCarrierDocSecure(docItem);
    } catch (err) {
      onError(sanitizeUiError(err, 'Unable to download compliance document.'));
    }
  };

  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !loadForm.carrierName.trim() ||
      !loadForm.origin.trim() ||
      !loadForm.destination.trim() ||
      !loadForm.brokerName.trim()
    ) {
      onError('Please fill in carrier, origin, destination, and broker name.');
      return;
    }

    const miles = Math.max(1, Number(loadForm.miles) || 1);
    const grossPay = Math.max(1, Number(loadForm.grossPay) || 1);
    const newLoad: DispatchLoad = {
      id: `ld_${Date.now()}`,
      loadNumber: `TRD-${Math.floor(10000 + Math.random() * 89999)}`,
      carrierName: loadForm.carrierName.trim(),
      mcNumber: loadForm.mcNumber.trim() || 'MC-0000000',
      origin: loadForm.origin.trim(),
      destination: loadForm.destination.trim(),
      equipmentType: loadForm.equipmentType,
      miles,
      grossPay,
      rpm: Number((grossPay / miles).toFixed(2)),
      brokerName: loadForm.brokerName.trim(),
      pickupDate: loadForm.pickupDate,
      status: 'Booked',
    };

    setLoadSubmitting(true);
    try {
      await upsertLoadAdmin(newLoad);
      await onReload();
      setShowLoadModal(false);
      onStatus(`Dispatched load ${newLoad.loadNumber}.`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to dispatch load.');
    } finally {
      setLoadSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      if (confirmTarget.type === 'carrier') {
        await deleteCarrierAdmin(confirmTarget.id);
        if (selectedCarrierId === confirmTarget.id) setSelectedCarrierId(null);
      } else if (confirmTarget.type === 'inquiry') {
        await deleteInquiryAdmin(confirmTarget.id);
        await onReload();
      } else {
        await deleteLoadAdmin(confirmTarget.id);
        await onReload();
      }
      onStatus(`Deleted "${confirmTarget.label}".`);
      setConfirmTarget(null);
    } catch (err) {
      onError(sanitizeUiError(err, 'Delete failed.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Registered Carriers</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#081B32]">
            {metrics.totalCarriers}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            {metrics.totalPowerUnits} power units · {metrics.pendingCarriers} pending review
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Active Dispatched Gross</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#081B32]">
            ${metrics.totalLoadGross.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            Across {loads.length} active &amp; delivered loads
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Board Avg Loaded RPM</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#D52B35]">
            ${metrics.avgRpm.toFixed(2)}/mi
          </div>
          <div className="mt-1 text-xs text-slate-600">All equipment classes</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Unread Contact Inquiries</div>
          <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#081B32]">
            {metrics.openInquiries}
          </div>
          <div className="mt-1 text-xs text-slate-600 tabular-nums">
            {inquiries.length} total inbox messages
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {(mode === 'overview' || mode === 'carriers' || mode === 'loads') && (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search carrier, MC#, DOT#, origin, or broker..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-[#081B32]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(mode === 'overview' || mode === 'carriers') && (
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1">
                {(['All', 'Pending Review', 'Onboarding', 'Approved', 'Declined'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCarrierStatusFilter(st)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        carrierStatusFilter === st
                          ? 'bg-white text-[#081B32] shadow-xs'
                          : 'text-slate-600 hover:text-[#081B32]'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            )}

            {(mode === 'overview' || mode === 'loads') && (
              <button
                type="button"
                onClick={() => setShowLoadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] whitespace-nowrap cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Dispatch New Load</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Carriers Table */}
      {(mode === 'overview' || mode === 'carriers') && (
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#081B32]">
                All Registrations
              </h2>
              <p className="text-xs text-slate-500">
                Real-time carrier submissions and private compliance documents from Firestore
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {filteredCarriers.length} registrations
            </span>
          </div>

          {filteredCarriers.length === 0 ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              {carriers.length === 0
                ? 'No carrier registrations submitted yet. New applications from the public Carrier Registration form will appear here immediately.'
                : 'No carrier registrations match the current search or status filter.'}
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Carrier / Owner</th>
                    <th className="px-4 py-3">MC / DOT</th>
                    <th className="px-4 py-3">Equipment &amp; Plan</th>
                    <th className="px-4 py-3 text-right">Trucks</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCarriers.map((carrier) => (
                    <tr key={carrier.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openCarrierDrawer(carrier)}
                          className="text-left font-semibold text-[#081B32] hover:text-[#D52B35] cursor-pointer"
                        >
                          {carrier.companyName}
                        </button>
                        <div className="text-xs text-slate-500">
                          {carrier.ownerName} · {carrier.phone}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {carrier.email} · <span className="font-mono">{carrier.referenceCode}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        <div>{carrier.mcNumber}</div>
                        <div className="text-slate-500">{carrier.dotNumber}</div>
                        {carrier.carrierLookup?.lookupStatus === 'verified' && (
                          <span className="mt-1 inline-block rounded bg-emerald-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-[#16A34A]">
                            O Trucking Verified
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium text-[#081B32]">{carrier.equipmentType}</div>
                        <div className="text-xs text-slate-500">{carrier.selectedPlan}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-[#081B32]">
                        {carrier.truckCount}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {!carrier.documents || carrier.documents.length === 0 ? (
                          <span className="text-slate-400">None</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCarrierDrawer(carrier)}
                            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs font-medium text-[#081B32] hover:border-[#D52B35] hover:text-[#D52B35] cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#D52B35]" aria-hidden="true" />
                            <span>{carrier.documents.length} files</span>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {formatFirestoreDateTime(carrier.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Status for ${carrier.companyName}`}
                          value={carrier.status}
                          onChange={(e) =>
                            handleCarrierStatus(carrier, e.target.value as CarrierStatus)
                          }
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                            CARRIER_STATUS_STYLES[carrier.status]
                          }`}
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Onboarding">Onboarding</option>
                          <option value="Approved">Approved</option>
                          <option value="Declined">Declined</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {carrier.status !== 'Approved' && (
                            <button
                              type="button"
                              onClick={() => handleCarrierStatus(carrier, 'Approved')}
                              className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-[#16A34A] hover:bg-emerald-100 cursor-pointer"
                              title={`Approve ${carrier.companyName}`}
                            >
                              <Check className="h-3 w-3" aria-hidden="true" />
                              <span>Approve</span>
                            </button>
                          )}
                          {carrier.status !== 'Declined' && (
                            <button
                              type="button"
                              onClick={() => handleCarrierStatus(carrier, 'Declined')}
                              className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-[#DC2626] hover:bg-red-100 cursor-pointer"
                              title={`Reject ${carrier.companyName}`}
                            >
                              <X className="h-3 w-3" aria-hidden="true" />
                              <span>Reject</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openCarrierDrawer(carrier)}
                            className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#081B32] hover:border-[#081B32] cursor-pointer"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmTarget({
                                type: 'carrier',
                                id: carrier.id,
                                label: carrier.companyName,
                              })
                            }
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            aria-label={`Delete ${carrier.companyName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Contact Management */}
      {(mode === 'overview' || mode === 'contacts') && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#081B32]">
              Contact Form Submissions
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">
              {inquiries.length} messages
            </span>
          </div>

          {inquiries.length === 0 ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              No contact submissions yet.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-[#081B32]">{inq.subject}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {inq.name} · {inq.email} {inq.phone ? `· ${inq.phone}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Inquiry status for ${inq.name}`}
                          value={inq.status}
                          onChange={(e) =>
                            handleInquiryStatus(inq, e.target.value as InquiryStatus)
                          }
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                            INQUIRY_STATUS_STYLES[inq.status] || INQUIRY_STATUS_STYLES.Open
                          }`}
                        >
                          <option value="Open">Unread / Open</option>
                          <option value="Read">Read</option>
                          <option value="Replied">Replied</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget({
                              type: 'inquiry',
                              id: inq.id,
                              label: `message from ${inq.name}`,
                            })
                          }
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          aria-label={`Delete message from ${inq.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{inq.message}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400 font-mono">
                    <span>Submitted {formatFirestoreDate(inq.createdAt)}</span>
                    {inq.status === 'Open' && (
                      <button
                        type="button"
                        onClick={() => handleInquiryStatus(inq, 'Read')}
                        className="font-sans font-semibold text-[#D52B35] hover:underline cursor-pointer"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Active Dispatch Loads */}
      {(mode === 'overview' || mode === 'loads') && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-[#081B32]">
              Active &amp; Recent Dispatch Loads
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">{filteredLoads.length} loads</span>
          </div>

          {filteredLoads.length === 0 ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No active dispatch loads logged.</p>
              <button
                type="button"
                onClick={() => setShowLoadModal(true)}
                className="mt-3 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Dispatch First Load
              </button>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Load ID</th>
                    <th className="px-4 py-3">Carrier</th>
                    <th className="px-4 py-3">Lane</th>
                    <th className="px-4 py-3">Broker</th>
                    <th className="px-4 py-3 text-right">Miles</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">RPM</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoads.map((load) => (
                    <tr key={load.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#081B32]">
                        {load.loadNumber}
                        <div className="font-sans font-normal text-slate-500">{load.pickupDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#081B32]">{load.carrierName}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {load.mcNumber} · {load.equipmentType}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {load.origin} → {load.destination}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{load.brokerName}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700">
                        {load.miles.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-[#081B32]">
                        ${load.grossPay.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-[#D52B35]">
                        ${load.rpm.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Load status for ${load.loadNumber}`}
                          value={load.status}
                          onChange={(e) =>
                            handleLoadStatus(load, e.target.value as LoadStatus)
                          }
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                            LOAD_STATUS_STYLES[load.status]
                          }`}
                        >
                          <option value="Booked">Booked</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="In Transit">In Transit</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget({
                              type: 'load',
                              id: load.id,
                              label: load.loadNumber,
                            })
                          }
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          aria-label={`Delete load ${load.loadNumber}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Carrier Slide-Over Drawer */}
      {selectedCarrier && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45"
          role="dialog"
          aria-modal="true"
          aria-label="Carrier Details"
        >
          <div className="flex h-full w-full max-w-lg flex-col justify-between bg-white p-6 shadow-xl overflow-y-auto">
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#D52B35]">
                    <span>{selectedCarrier.referenceCode}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">
                      {formatFirestoreDateTime(selectedCarrier.submittedAt)}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#081B32]">
                    {selectedCarrier.companyName}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingCarrier) {
                        setCarrierEditForm({
                          companyName: selectedCarrier.companyName,
                          ownerName: selectedCarrier.ownerName,
                          email: selectedCarrier.email,
                          phone: selectedCarrier.phone,
                          mcNumber: selectedCarrier.mcNumber,
                          dotNumber: selectedCarrier.dotNumber,
                          physicalAddress: selectedCarrier.physicalAddress || '',
                          mailingAddress: selectedCarrier.mailingAddress || '',
                          equipmentType: selectedCarrier.equipmentType,
                          truckCount: Number(selectedCarrier.truckCount) || 1,
                          factoringCompany: selectedCarrier.factoringCompany || 'Direct / None',
                          selectedPlan: selectedCarrier.selectedPlan,
                          notes: selectedCarrier.notes || '',
                          status: selectedCarrier.status,
                        });
                      }
                      setIsEditingCarrier(!isEditingCarrier);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isEditingCarrier ? 'Cancel Edit' : 'Update'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCarrierId(null);
                      setIsEditingCarrier(false);
                    }}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                    aria-label="Close carrier details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {isEditingCarrier && carrierEditForm ? (
                <form onSubmit={handleSaveCarrierUpdate} className="mt-5 space-y-3 text-xs">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-semibold text-slate-700">Company Name</label>
                      <input
                        type="text"
                        required
                        value={carrierEditForm.companyName}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, companyName: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Owner / Contact</label>
                      <input
                        type="text"
                        required
                        value={carrierEditForm.ownerName}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, ownerName: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Email</label>
                      <input
                        type="email"
                        required
                        value={carrierEditForm.email}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, email: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Phone</label>
                      <input
                        type="text"
                        required
                        value={carrierEditForm.phone}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, phone: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">MC Number</label>
                      <input
                        type="text"
                        required
                        value={carrierEditForm.mcNumber}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, mcNumber: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">USDOT Number</label>
                      <input
                        type="text"
                        required
                        value={carrierEditForm.dotNumber}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, dotNumber: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-[#081B32]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">Physical Address</label>
                      <input
                        type="text"
                        value={carrierEditForm.physicalAddress}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, physicalAddress: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700">Mailing Address</label>
                      <input
                        type="text"
                        value={carrierEditForm.mailingAddress}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, mailingAddress: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Equipment Type</label>
                      <input
                        type="text"
                        required
                        value={carrierEditForm.equipmentType}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, equipmentType: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Trucks</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={carrierEditForm.truckCount}
                        onChange={(e) =>
                          setCarrierEditForm({
                            ...carrierEditForm,
                            truckCount: Math.max(1, Number(e.target.value) || 1),
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Factoring</label>
                      <input
                        type="text"
                        value={carrierEditForm.factoringCompany}
                        onChange={(e) =>
                          setCarrierEditForm({
                            ...carrierEditForm,
                            factoringCompany: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700">Dispatch Plan</label>
                      <input
                        type="text"
                        value={carrierEditForm.selectedPlan}
                        onChange={(e) =>
                          setCarrierEditForm({...carrierEditForm, selectedPlan: e.target.value})
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700">Notes</label>
                    <textarea
                      rows={3}
                      value={carrierEditForm.notes}
                      onChange={(e) =>
                        setCarrierEditForm({...carrierEditForm, notes: e.target.value})
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-[#081B32]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingCarrier(false)}
                      className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={carrierSaving}
                      className="rounded-lg bg-[#081B32] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60 cursor-pointer"
                    >
                      {carrierSaving ? 'Saving...' : 'Save Updates'}
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Owner / Contact</dt>
                    <dd className="text-right font-medium text-[#081B32]">
                      {selectedCarrier.ownerName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Email</dt>
                    <dd className="text-right text-[#081B32]">{selectedCarrier.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-mono tabular-nums text-[#081B32]">
                      {selectedCarrier.phone}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">MC / DOT</dt>
                    <dd className="font-mono text-[#081B32]">
                      {selectedCarrier.mcNumber} / {selectedCarrier.dotNumber}
                    </dd>
                  </div>
                  {selectedCarrier.physicalAddress && (
                    <div>
                      <dt className="text-slate-500">Physical Address</dt>
                      <dd className="mt-0.5 text-xs font-medium text-[#081B32]">
                        {selectedCarrier.physicalAddress}
                      </dd>
                    </div>
                  )}
                  {selectedCarrier.mailingAddress && (
                    <div>
                      <dt className="text-slate-500">Mailing Address</dt>
                      <dd className="mt-0.5 text-xs font-medium text-[#081B32]">
                        {selectedCarrier.mailingAddress}
                      </dd>
                    </div>
                  )}
                  {selectedCarrier.carrierLookup && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#081B32]">
                          Carrier Verification ({selectedCarrier.carrierLookup.lookupStatus})
                        </span>
                        {selectedCarrier.carrierLookup.timestamp && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {formatFirestoreDateTime(selectedCarrier.carrierLookup.timestamp)}
                          </span>
                        )}
                      </div>
                      {selectedCarrier.carrierLookup.dbaName && (
                        <div className="mt-1.5 text-slate-700">
                          DBA: {selectedCarrier.carrierLookup.dbaName}
                        </div>
                      )}
                      {selectedCarrier.carrierLookup.operatingStatus && (
                        <div className="mt-1 font-semibold text-[#081B32]">
                          Status: {selectedCarrier.carrierLookup.operatingStatus}
                        </div>
                      )}
                      {selectedCarrier.carrierLookup.fleetInfo && (
                        <div className="mt-1 text-slate-700">
                          Fleet: {selectedCarrier.carrierLookup.fleetInfo}
                        </div>
                      )}
                      {selectedCarrier.carrierLookup.safetyInfo && (
                        <div className="mt-1 text-slate-700">
                          {selectedCarrier.carrierLookup.safetyInfo}
                        </div>
                      )}
                      {selectedCarrier.carrierLookup.authorityInfo && (
                        <div className="mt-1 text-slate-600">
                          Authority: {selectedCarrier.carrierLookup.authorityInfo}
                        </div>
                      )}
                      {selectedCarrier.carrierLookup.insuranceInfo && (
                        <div className="mt-1 text-slate-600">
                          Insurance: {selectedCarrier.carrierLookup.insuranceInfo}
                        </div>
                      )}
                      {selectedCarrier.carrierLookup.source && (
                        <div className="mt-1 text-[11px] text-slate-500">
                          Source: {selectedCarrier.carrierLookup.source}
                          {selectedCarrier.carrierLookup.sourceUpdatedAt
                            ? ` (Updated ${selectedCarrier.carrierLookup.sourceUpdatedAt})`
                            : ''}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Equipment &amp; Fleet</dt>
                    <dd className="text-right font-medium text-[#081B32]">
                      {selectedCarrier.equipmentType} ({selectedCarrier.truckCount}{' '}
                      {selectedCarrier.truckCount === 1 ? 'truck' : 'trucks'})
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Factoring</dt>
                    <dd className="text-right text-[#081B32]">
                      {selectedCarrier.factoringCompany}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Insurance Confirmed</dt>
                    <dd className="font-medium text-[#081B32]">
                      {selectedCarrier.insuranceActive ? 'Yes ($1M Auto / $100K Cargo)' : 'No'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Selected Plan</dt>
                    <dd className="text-right font-medium text-[#D52B35]">
                      {selectedCarrier.selectedPlan}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Operating Regions</dt>
                    <dd className="mt-1 text-xs font-medium text-[#081B32]">
                      {selectedCarrier.operatingRegions.join(' · ')}
                    </dd>
                  </div>
                  {selectedCarrier.notes && (
                    <div>
                      <dt className="text-slate-500">Carrier Notes</dt>
                      <dd className="mt-1 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                        {selectedCarrier.notes}
                      </dd>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-4">
                    <dt className="mb-2 text-xs font-semibold text-slate-700">
                      Private Compliance Documents ({selectedCarrier.documents?.length || 0})
                    </dt>
                    {!selectedCarrier.documents || selectedCarrier.documents.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No files attached during registration.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedCarrier.documents.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText
                                className="h-4 w-4 shrink-0 text-[#D52B35]"
                                aria-hidden="true"
                              />
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-[#081B32]">
                                  {doc.fileName}
                                </div>
                                <div className="text-slate-500">
                                  {doc.docType} · {doc.sizeLabel}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(doc)}
                              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-[#081B32] hover:border-[#D52B35] hover:text-[#D52B35] shrink-0 cursor-pointer"
                            >
                              <Download className="h-3 w-3" aria-hidden="true" />
                              <span>Download</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </dl>
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleCarrierStatus(selectedCarrier, 'Approved')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Approve Carrier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCarrierStatus(selectedCarrier, 'Declined')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reject Carrier</span>
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Application Status
                </label>
                <select
                  value={selectedCarrier.status}
                  onChange={(e) =>
                    handleCarrierStatus(selectedCarrier, e.target.value as CarrierStatus)
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#081B32]"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch New Load Modal */}
      {showLoadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Dispatch New Load"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="font-display text-lg font-bold text-[#081B32]">Dispatch New Load</h2>
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoad} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Carrier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={loadForm.carrierName}
                    onChange={(e) => setLoadForm({...loadForm, carrierName: e.target.value})}
                    placeholder="Redline Freightways LLC"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">MC Number</label>
                  <input
                    type="text"
                    value={loadForm.mcNumber}
                    onChange={(e) => setLoadForm({...loadForm, mcNumber: e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Origin *</label>
                  <input
                    type="text"
                    required
                    value={loadForm.origin}
                    onChange={(e) => setLoadForm({...loadForm, origin: e.target.value})}
                    placeholder="Dallas, TX"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={loadForm.destination}
                    onChange={(e) => setLoadForm({...loadForm, destination: e.target.value})}
                    placeholder="Atlanta, GA"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Equipment</label>
                  <select
                    value={loadForm.equipmentType}
                    onChange={(e) =>
                      setLoadForm({...loadForm, equipmentType: e.target.value as EquipmentType})
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Hotshot">Hotshot</option>
                    <option value="Power Only">Power Only</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Dry Van">Dry Van</option>
                    <option value="Reefer">Reefer</option>
                    <option value="Flatbed">Flatbed</option>
                    <option value="Step Deck">Step Deck</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Broker Name *</label>
                  <input
                    type="text"
                    required
                    value={loadForm.brokerName}
                    onChange={(e) => setLoadForm({...loadForm, brokerName: e.target.value})}
                    placeholder="TQL / CH Robinson"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Loaded Miles</label>
                  <input
                    type="number"
                    min={1}
                    value={loadForm.miles}
                    onChange={(e) => setLoadForm({...loadForm, miles: Number(e.target.value) || 1})}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Gross Pay ($)</label>
                  <input
                    type="number"
                    min={1}
                    value={loadForm.grossPay}
                    onChange={(e) =>
                      setLoadForm({...loadForm, grossPay: Number(e.target.value) || 1})
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="font-mono text-xs text-slate-600 tabular-nums">
                  Projected RPM:{' '}
                  <span className="font-bold text-[#D52B35]">
                    ${(loadForm.grossPay / Math.max(1, loadForm.miles)).toFixed(2)}/mi
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowLoadModal(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadSubmitting}
                    className="rounded-lg bg-[#D52B35] px-5 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] disabled:opacity-60 cursor-pointer"
                  >
                    {loadSubmitting ? 'Saving...' : 'Confirm Load'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title="Confirm Deletion"
        description={`Are you sure you want to permanently delete ${confirmTarget?.label || 'this record'}?`}
        busy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};
