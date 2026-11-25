import React, {useEffect, useRef, useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import {
  lookupCarrierViaOTrucking,
  submitCarrierRegistration,
  type OTruckingLookupApiResponse,
  type PendingCarrierFile,
} from '../lib/cmsService.ts';
import {sanitizeUiError} from '../lib/firebase.ts';
import type {
  CarrierApplication,
  CarrierLookupSnapshot,
  EquipmentType,
  PageRoute,
  UploadedDocument,
} from '../types.ts';

interface RegisterPageProps {
  initialPlan?: string;
  onNavigate: (page: PageRoute) => void;
}

const EQUIPMENT_OPTIONS: EquipmentType[] = [
  'Hotshot',
  'Power Only',
  'Box Truck',
  'Dry Van',
  'Reefer',
  'Flatbed',
  'Step Deck',
];

const REGION_OPTIONS = [
  '48-State OTR',
  'Midwest',
  'Southeast',
  'Southwest',
  'Northeast',
  'West Coast',
];

const DOC_TYPES: UploadedDocument['docType'][] = [
  'W-9 Tax Form',
  'MC Authority Letter',
  'Certificate of Insurance (COI)',
  'Notice of Assignment',
];

const REQUIRED_DOC_TYPES: UploadedDocument['docType'][] = [
  'W-9 Tax Form',
  'MC Authority Letter',
  'Certificate of Insurance (COI)',
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({initialPlan, onNavigate}) => {
  const {activeContent, pricingPlans} = useCms();
  const {colors} = activeContent;

  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [dbaName, setDbaName] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [mailingAddress, setMailingAddress] = useState('');
  const [operatingStatus, setOperatingStatus] = useState('');
  const [authorityInfo, setAuthorityInfo] = useState('');
  const [safetyInfo, setSafetyInfo] = useState('');
  const [insuranceInfo, setInsuranceInfo] = useState('');
  const [fleetInfo, setFleetInfo] = useState('');

  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupModeActive, setLookupModeActive] = useState<'docket' | 'dot'>('docket');
  const [lookupError, setLookupError] = useState('');
  const [lookupResult, setLookupResult] = useState<OTruckingLookupApiResponse | null>(null);
  const [lookupSnapshot, setLookupSnapshot] = useState<CarrierLookupSnapshot | null>(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const clientLookupCacheRef = useRef<Map<string, OTruckingLookupApiResponse>>(new Map());

  const [equipmentType, setEquipmentType] = useState<EquipmentType>('Dry Van');
  const [truckCount, setTruckCount] = useState(1);
  const [operatingRegions, setOperatingRegions] = useState<string[]>(['48-State OTR']);
  const [factoringCompany, setFactoringCompany] = useState('');
  const [insuranceActive, setInsuranceActive] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(
    initialPlan || pricingPlans[0]?.name || 'Owner-Operator Standard'
  );
  const [notes, setNotes] = useState('');

  const [selectedDocType, setSelectedDocType] =
    useState<UploadedDocument['docType']>('W-9 Tax Form');
  const [documents, setDocuments] = useState<PendingCarrierFile[]>([]);
  const [docError, setDocError] = useState('');

  const companyInputRef = useRef<HTMLInputElement | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedCarrier, setSubmittedCarrier] = useState<CarrierApplication | null>(null);

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlan(initialPlan);
    } else if (pricingPlans.length > 0 && !pricingPlans.some((p) => p.name === selectedPlan)) {
      setSelectedPlan(pricingPlans[0].name);
    }
  }, [initialPlan, pricingPlans, selectedPlan]);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setRetryCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryCountdown]);

  const toggleRegion = (region: string) => {
    setOperatingRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setDocError('Empty files cannot be uploaded. Please choose a valid document.');
      e.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setDocError('Each uploaded file must be 3 MB or smaller.');
      e.target.value = '';
      return;
    }

    if (documents.length >= 6) {
      setDocError('Maximum 6 compliance documents per carrier registration.');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg'];
    if (
      (file.type && !allowedTypes.includes(file.type.toLowerCase())) ||
      (!file.type && !allowedExts.includes(ext))
    ) {
      setDocError('Compliance documents must be PDF, PNG, or JPG.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
      if (!dataUrl) {
        setDocError(`Could not read "${file.name}". Please re-attach the file.`);
        return;
      }
      const doc: PendingCarrierFile = {
        id: `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        docType: selectedDocType,
        fileName: file.name,
        sizeLabel: formatBytes(file.size),
        uploadedAt: new Date().toISOString(),
        file,
        dataUrl,
      };
      setDocuments((prev) => [...prev, doc]);
    };
    reader.onerror = () => {
      setDocError(`Failed to read "${file.name}". Please check the file and try again.`);
    };
    reader.onabort = () => {
      setDocError(`Reading "${file.name}" was interrupted. Please try again.`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const applyOTruckingLookupResult = (res: OTruckingLookupApiResponse) => {
    setLookupResult(res);

    if (!res.found) {
      setLookupError(
        res.error ||
          'Carrier lookup is temporarily unavailable. Please use manual entry below to continue registration.'
      );
      if (res.rateLimited && res.retryAfterSeconds && res.retryAfterSeconds > 0) {
        setRetryCountdown(res.retryAfterSeconds);
      }
      if (res.unavailable || res.rateLimited || res.notFound) {
        setManualEntryMode(true);
      }
      setLookupSnapshot({
        performed: true,
        lookupStatus: res.notFound ? 'not_found' : 'manual',
        source: res.rateLimited
          ? 'Manual Entry Fallback (O Trucking Rate Limit)'
          : res.unavailable
          ? 'Manual Entry Fallback (O Trucking Unavailable)'
          : 'O Trucking Public Data API (No Match / Manual Entry)',
        sourceUpdatedAt: res.sourceUpdatedAt || '',
        timestamp: res.timestamp || new Date().toISOString(),
        dbaName: dbaName.trim(),
        operatingStatus: operatingStatus.trim(),
        authorityInfo: authorityInfo.trim(),
        safetyInfo: safetyInfo.trim(),
        insuranceInfo: insuranceInfo.trim(),
        fleetInfo: fleetInfo.trim(),
        usdotNumber: dotNumber.trim(),
        legalName: companyName.trim(),
        physicalAddress: physicalAddress.trim(),
        mailingAddress: mailingAddress.trim(),
      });
      return;
    }

    if (res.mcNumber) setMcNumber(res.mcNumber);
    if (res.usdotNumber) setDotNumber(res.usdotNumber);
    if (res.legalCompanyName) setCompanyName(res.legalCompanyName);
    if (res.dbaName) setDbaName(res.dbaName);
    if (res.physicalAddress) setPhysicalAddress(res.physicalAddress);
    if (res.mailingAddress) setMailingAddress(res.mailingAddress);
    if (res.operatingStatus) setOperatingStatus(res.operatingStatus);
    if (res.authorityInfo) setAuthorityInfo(res.authorityInfo);
    if (res.safetyInfo) setSafetyInfo(res.safetyInfo);
    if (res.insuranceInfo) setInsuranceInfo(res.insuranceInfo);
    if (res.fleetInfo) setFleetInfo(res.fleetInfo);
    if (res.phone && !phone.trim()) setPhone(res.phone);
    if (res.powerUnits && truckCount === 1) {
      setTruckCount(Math.min(250, Math.max(1, res.powerUnits)));
    }

    setManualEntryMode(false);
    setLookupSnapshot({
      performed: true,
      lookupStatus: 'verified',
      source: res.source || 'O Trucking Public Data API',
      sourceUpdatedAt: res.sourceUpdatedAt || '',
      timestamp: res.timestamp || new Date().toISOString(),
      dbaName: res.dbaName || '',
      operatingStatus: res.operatingStatus || '',
      authorityInfo: res.authorityInfo || '',
      safetyInfo: res.safetyInfo || '',
      insuranceInfo: res.insuranceInfo || '',
      fleetInfo: res.fleetInfo || '',
      usdotNumber: res.usdotNumber || '',
      legalName: res.legalCompanyName || '',
      physicalAddress: res.physicalAddress || '',
      mailingAddress: res.mailingAddress || '',
    });
  };

  const handleCarrierLookup = async (preferredType?: 'docket' | 'dot') => {
    if (lookupBusy) return;
    setLookupError('');

    const trimmedMc = mcNumber.trim();
    const trimmedDot = dotNumber.trim();
    const mode: 'docket' | 'dot' =
      preferredType || (trimmedMc ? 'docket' : trimmedDot ? 'dot' : 'docket');
    const rawValue = mode === 'docket' ? trimmedMc : trimmedDot;

    setLookupModeActive(mode);

    if (!rawValue) {
      setLookupError(
        mode === 'docket'
          ? 'Enter an MC number (e.g. MC721535) before clicking Lookup Carrier.'
          : 'Enter a USDOT number (e.g. 2247289) before clicking Lookup by USDOT.'
      );
      return;
    }

    const cacheKey = `${mode}:${rawValue.toUpperCase().replace(/[\s-]+/g, '')}`;
    const cached = clientLookupCacheRef.current.get(cacheKey);
    if (cached && cached.found) {
      applyOTruckingLookupResult({...cached, cached: true});
      return;
    }

    if (retryCountdown > 0) {
      setLookupError(
        `O Trucking lookup limit reached. Please retry in ${retryCountdown}s or continue with manual entry below.`
      );
      return;
    }

    setLookupBusy(true);
    try {
      const res = await lookupCarrierViaOTrucking(mode, rawValue);
      if (res.found) {
        clientLookupCacheRef.current.set(cacheKey, res);
      }
      applyOTruckingLookupResult(res);
    } catch {
      setManualEntryMode(true);
      setLookupError(
        'O Trucking carrier lookup is temporarily unavailable. Please use manual entry below to continue registration.'
      );
    } finally {
      setLookupBusy(false);
    }
  };

  const handleManualEntryStart = () => {
    setManualEntryMode(true);
    setTimeout(() => {
      companyInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || submitting) {
      return;
    }
    setErrorMsg('');

    if (
      companyName.trim().length < 2 ||
      ownerName.trim().length < 2 ||
      phone.trim().length < 5 ||
      mcNumber.trim().length < 3 ||
      dotNumber.trim().length < 3
    ) {
      setErrorMsg(
        'Please complete all required company, owner, direct phone, MC, and USDOT fields.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    if (operatingRegions.length === 0) {
      setErrorMsg('Select at least one preferred operating region.');
      return;
    }

    const uploadedTypes = new Set(documents.map((d) => d.docType));
    const missingRequiredDocs = REQUIRED_DOC_TYPES.filter((reqType) => !uploadedTypes.has(reqType));
    if (missingRequiredDocs.length > 0) {
      setErrorMsg(
        `Please attach all required compliance documents before submitting: ${missingRequiredDocs.join(
          ', '
        )}. (Notice of Assignment is optional.)`
      );
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitStage(
      documents.length > 0 ? 'Uploading compliance documents...' : 'Saving carrier registration...'
    );

    const hasManualAuthorityFields = Boolean(
      dbaName.trim() ||
        operatingStatus.trim() ||
        authorityInfo.trim() ||
        safetyInfo.trim() ||
        insuranceInfo.trim() ||
        fleetInfo.trim()
    );

    const snapshotToSave: CarrierLookupSnapshot = lookupSnapshot
      ? {
          ...lookupSnapshot,
          dbaName: dbaName.trim() || lookupSnapshot.dbaName,
          legalName: companyName.trim() || lookupSnapshot.legalName,
          usdotNumber: dotNumber.trim() || lookupSnapshot.usdotNumber,
          physicalAddress: physicalAddress.trim() || lookupSnapshot.physicalAddress,
          mailingAddress: mailingAddress.trim() || lookupSnapshot.mailingAddress,
          operatingStatus: operatingStatus.trim() || lookupSnapshot.operatingStatus,
          authorityInfo: authorityInfo.trim() || lookupSnapshot.authorityInfo,
          safetyInfo: safetyInfo.trim() || lookupSnapshot.safetyInfo,
          insuranceInfo: insuranceInfo.trim() || lookupSnapshot.insuranceInfo,
          fleetInfo: fleetInfo.trim() || lookupSnapshot.fleetInfo,
        }
      : {
          performed: false,
          lookupStatus: manualEntryMode || hasManualAuthorityFields ? 'manual' : 'not_run',
          source:
            manualEntryMode || hasManualAuthorityFields ? 'Manual Carrier Entry' : 'Not Run',
          sourceUpdatedAt: '',
          timestamp:
            manualEntryMode || hasManualAuthorityFields ? new Date().toISOString() : '',
          dbaName: dbaName.trim(),
          operatingStatus: operatingStatus.trim(),
          authorityInfo: authorityInfo.trim(),
          safetyInfo: safetyInfo.trim(),
          insuranceInfo: insuranceInfo.trim(),
          fleetInfo: fleetInfo.trim(),
          usdotNumber: dotNumber.trim(),
          legalName: companyName.trim(),
          physicalAddress: physicalAddress.trim(),
          mailingAddress: mailingAddress.trim(),
        };

    try {
      const carrier = await submitCarrierRegistration({
        companyName,
        ownerName,
        email,
        phone,
        mcNumber,
        dotNumber,
        physicalAddress,
        mailingAddress,
        carrierLookup: snapshotToSave,
        equipmentType,
        truckCount: Math.min(250, Math.max(1, Number(truckCount) || 1)),
        operatingRegions: operatingRegions.slice(0, 10),
        factoringCompany,
        insuranceActive,
        selectedPlan,
        notes,
        pendingFiles: documents,
        onProgress: (stage) => setSubmitStage(stage),
      });
      setSubmittedCarrier(carrier);
    } catch (err) {
      setErrorMsg(
        sanitizeUiError(err, 'Unable to submit registration. Please verify your entries and try again.')
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setSubmitStage('');
    }
  };

  if (submittedCarrier) {
    return (
      <section className="bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8">
            <div role="status" className="flex items-center gap-3 text-[#16A34A]">
              <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold">
                Registration Submitted Successfully · Application &amp; Documents Received
              </span>
            </div>

            <h1
              className="mt-3 font-display text-2xl font-bold sm:text-3xl"
              style={{color: colors.deepNavy}}
            >
              Carrier Packet Queued for Dispatch Setup
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Your carrier registration for{' '}
              <span className="font-semibold" style={{color: colors.deepNavy}}>
                {submittedCarrier.companyName}
              </span>{' '}
              ({submittedCarrier.mcNumber}) has been securely saved. A senior dispatcher will reach out within 2 business hours.
            </p>

            <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-[#F8FAFC] p-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Reference Code</dt>
                <dd
                  className="mt-0.5 font-mono font-bold"
                  style={{color: colors.professionalRed}}
                >
                  {submittedCarrier.referenceCode}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Application Status</dt>
                <dd className="mt-0.5 font-semibold" style={{color: colors.deepNavy}}>
                  {submittedCarrier.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Equipment &amp; Fleet</dt>
                <dd className="mt-0.5 font-medium" style={{color: colors.deepNavy}}>
                  {submittedCarrier.equipmentType} · {submittedCarrier.truckCount}{' '}
                  {submittedCarrier.truckCount === 1 ? 'Truck' : 'Trucks'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Documents Uploaded</dt>
                <dd
                  className="mt-0.5 font-mono font-medium tabular-nums"
                  style={{color: colors.deepNavy}}
                >
                  {submittedCarrier.documents?.length || 0} files
                </dd>
              </div>
            </dl>

            {submittedCarrier.documents && submittedCarrier.documents.length > 0 && (
              <ul className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-xs">
                {submittedCarrier.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 text-slate-700">
                    <span className="truncate font-medium" style={{color: colors.deepNavy}}>
                      {doc.docType}: {doc.fileName}
                    </span>
                    <span className="shrink-0 font-mono text-slate-500">{doc.sizeLabel}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{backgroundColor: colors.deepNavy}}
              >
                <span>Back to Homepage</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedCarrier(null);
                  setCompanyName('');
                  setOwnerName('');
                  setEmail('');
                  setPhone('');
                  setMcNumber('');
                  setDotNumber('');
                  setDbaName('');
                  setPhysicalAddress('');
                  setMailingAddress('');
                  setOperatingStatus('');
                  setAuthorityInfo('');
                  setSafetyInfo('');
                  setInsuranceInfo('');
                  setFleetInfo('');
                  setLookupResult(null);
                  setLookupSnapshot(null);
                  setLookupError('');
                  setRetryCountdown(0);
                  setManualEntryMode(false);
                  setNotes('');
                  setDocuments([]);
                }}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                style={{color: colors.deepNavy}}
              >
                Register Another Carrier
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-[#F8FAFC]">
      <section className="py-12 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <span>Carrier Onboarding</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span style={{color: colors.professionalRed}}>
              Carrier Authority Verification &amp; Secure Document Upload
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Register Your Carrier Authority With {activeContent.companyName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{color: colors.silverGrey}}>
            Submit your MC/DOT details, upload compliance packet documents securely, and select your preferred freight lanes.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12">
          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-8"
            noValidate
          >
            <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
              Carrier &amp; Equipment Profile
            </h2>

            {errorMsg && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {errorMsg}
              </div>
            )}

            {/* O Trucking MC / USDOT Lookup Bar */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider" style={{color: colors.deepNavy}}>
                  Carrier Authority Lookup (O Trucking)
                </div>
                <span className="text-[11px] text-slate-500">
                  Enter an MC# or USDOT# to retrieve public FMCSA carrier data
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-4">
                  <label htmlFor="reg-mc" className="block text-xs font-semibold text-slate-700">
                    MC Number *
                  </label>
                  <input
                    id="reg-mc"
                    type="text"
                    required
                    value={mcNumber}
                    onChange={(e) => setMcNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCarrierLookup('docket');
                      }
                    }}
                    placeholder="MC721535"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="reg-dot" className="block text-xs font-semibold text-slate-700">
                    USDOT Number *
                  </label>
                  <input
                    id="reg-dot"
                    type="text"
                    required
                    value={dotNumber}
                    onChange={(e) => setDotNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCarrierLookup('dot');
                      }
                    }}
                    placeholder="2247289"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-4">
                  <button
                    type="button"
                    onClick={() => handleCarrierLookup()}
                    disabled={lookupBusy || retryCountdown > 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                    style={{backgroundColor: colors.deepNavy}}
                  >
                    {lookupBusy && lookupModeActive === 'docket' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Looking up...</span>
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" aria-hidden="true" />
                        <span>
                          {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Lookup Carrier'}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCarrierLookup('dot')}
                    disabled={lookupBusy || retryCountdown > 0 || !dotNumber.trim()}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#081B32] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {lookupBusy && lookupModeActive === 'dot' ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>Checking USDOT...</span>
                      </>
                    ) : (
                      <span>Lookup by USDOT</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Lookup Error / Rate Limit / Manual Entry Fallback */}
              {lookupError && (
                <div
                  role="alert"
                  className={`mt-3 rounded-lg border px-4 py-3 text-xs ${
                    lookupResult?.unavailable || lookupResult?.rateLimited
                      ? 'border-amber-200 bg-amber-50 text-amber-950'
                      : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{lookupError}</span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 pl-6">
                    {(lookupResult?.unavailable || lookupResult?.rateLimited) && (
                      <button
                        type="button"
                        disabled={lookupBusy || retryCountdown > 0}
                        onClick={() => handleCarrierLookup(lookupModeActive)}
                        className="rounded-md border border-current/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#081B32] hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                      >
                        {retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Retry Lookup'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleManualEntryStart}
                      className="rounded-md border border-current/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
                    >
                      Continue with Manual Entry
                    </button>
                    <span className="text-[11px] opacity-80">
                      Fill in your legal company details below and submit your packet as usual.
                    </span>
                  </div>
                </div>
              )}

              {/* Verified O Trucking Summary (shows only fields actually returned by API) */}
              {lookupResult?.found && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-950">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-[#16A34A]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Carrier Record Retrieved via O Trucking — Review Fields Below
                      </span>
                    </div>
                    {lookupResult.timestamp && (
                      <span className="font-mono text-[11px] text-slate-600">
                        Lookup Date:{' '}
                        {new Date(lookupResult.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <dl className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] text-slate-500">Data Source</dt>
                      <dd className="font-semibold text-[#081B32]">
                        {lookupResult.source || 'O Trucking Public Data API'}
                      </dd>
                    </div>
                    {lookupResult.sourceUpdatedAt && (
                      <div>
                        <dt className="text-[11px] text-slate-500">Source Data Updated</dt>
                        <dd className="font-mono font-semibold text-[#081B32]">
                          {lookupResult.sourceUpdatedAt}
                        </dd>
                      </div>
                    )}
                    {lookupResult.dbaName && (
                      <div>
                        <dt className="text-[11px] text-slate-500">DBA Name</dt>
                        <dd className="font-semibold text-[#081B32]">{lookupResult.dbaName}</dd>
                      </div>
                    )}
                    {lookupResult.operatingStatus && (
                      <div>
                        <dt className="text-[11px] text-slate-500">Operating Status</dt>
                        <dd className="font-semibold text-[#081B32]">{lookupResult.operatingStatus}</dd>
                      </div>
                    )}
                    {lookupResult.fleetInfo && (
                      <div>
                        <dt className="text-[11px] text-slate-500">Power Units &amp; Drivers</dt>
                        <dd className="font-semibold text-[#081B32]">{lookupResult.fleetInfo}</dd>
                      </div>
                    )}
                    {lookupResult.safetyInfo && (
                      <div className="sm:col-span-2">
                        <dt className="text-[11px] text-slate-500">Safety &amp; Inspection Data</dt>
                        <dd className="mt-0.5 text-slate-700">{lookupResult.safetyInfo}</dd>
                      </div>
                    )}
                    {lookupResult.authorityInfo && (
                      <div className="sm:col-span-2">
                        <dt className="text-[11px] text-slate-500">Operating Authority</dt>
                        <dd className="mt-0.5 leading-relaxed text-slate-700">
                          {lookupResult.authorityInfo}
                        </dd>
                      </div>
                    )}
                    {lookupResult.insuranceInfo && (
                      <div className="sm:col-span-2">
                        <dt className="text-[11px] text-slate-500">Insurance Information</dt>
                        <dd className="mt-0.5 leading-relaxed text-slate-700">
                          {lookupResult.insuranceInfo}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">
                    {lookupResult.disclaimer ||
                      'Carrier data provided by O Trucking from public FMCSA datasets. O Trucking is an independent data provider, not a U.S. government agency.'}{' '}
                    Review and edit any auto-filled fields below before submitting. Applications are reviewed manually by our dispatch team prior to approval.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="reg-company" className="block text-xs font-semibold text-slate-700">
                  Legal Company Name *
                </label>
                <input
                  ref={companyInputRef}
                  id="reg-company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Liberty Freightlines LLC"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-owner" className="block text-xs font-semibold text-slate-700">
                  Owner / Dispatch Contact Name *
                </label>
                <input
                  id="reg-owner"
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                  Email Address *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dispatch@carrier.com"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                  Direct Phone Number *
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(214) 555-0190"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-phy-address" className="block text-xs font-semibold text-slate-700">
                  Physical Address
                </label>
                <input
                  id="reg-phy-address"
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  placeholder="Street, City, State ZIP"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="reg-mail-address" className="block text-xs font-semibold text-slate-700">
                  Mailing Address (if available / different)
                </label>
                <input
                  id="reg-mail-address"
                  type="text"
                  value={mailingAddress}
                  onChange={(e) => setMailingAddress(e.target.value)}
                  placeholder="Mailing Street or PO Box, City, State ZIP"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              {(manualEntryMode ||
                lookupResult?.found ||
                dbaName ||
                operatingStatus ||
                authorityInfo ||
                safetyInfo ||
                insuranceInfo ||
                fleetInfo) && (
                <>
                  <div>
                    <label htmlFor="reg-dba" className="block text-xs font-semibold text-slate-700">
                      DBA Name (if applicable)
                    </label>
                    <input
                      id="reg-dba"
                      type="text"
                      value={dbaName}
                      onChange={(e) => setDbaName(e.target.value)}
                      placeholder="Doing Business As"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-fleet-info" className="block text-xs font-semibold text-slate-700">
                      Power Units &amp; Drivers
                    </label>
                    <input
                      id="reg-fleet-info"
                      type="text"
                      value={fleetInfo}
                      onChange={(e) => setFleetInfo(e.target.value)}
                      placeholder="e.g. 5 Power Units · 5 Drivers"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-op-status" className="block text-xs font-semibold text-slate-700">
                      Operating Status
                    </label>
                    <input
                      id="reg-op-status"
                      type="text"
                      value={operatingStatus}
                      onChange={(e) => setOperatingStatus(e.target.value)}
                      placeholder="e.g. Authorized for Property · Active"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-safety-info" className="block text-xs font-semibold text-slate-700">
                      Safety Information
                    </label>
                    <input
                      id="reg-safety-info"
                      type="text"
                      value={safetyInfo}
                      onChange={(e) => setSafetyInfo(e.target.value)}
                      placeholder="e.g. Inspections / Out-of-Service / Rating"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-auth-info" className="block text-xs font-semibold text-slate-700">
                      Operating Authority Information
                    </label>
                    <input
                      id="reg-auth-info"
                      type="text"
                      value={authorityInfo}
                      onChange={(e) => setAuthorityInfo(e.target.value)}
                      placeholder="e.g. Common / Contract Property Authority"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-ins-info" className="block text-xs font-semibold text-slate-700">
                      Insurance Information
                    </label>
                    <input
                      id="reg-ins-info"
                      type="text"
                      value={insuranceInfo}
                      onChange={(e) => setInsuranceInfo(e.target.value)}
                      placeholder="e.g. BIPD $750,000 On File"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="reg-equipment" className="block text-xs font-semibold text-slate-700">
                  Primary Equipment Type
                </label>
                <select
                  id="reg-equipment"
                  value={equipmentType}
                  onChange={(e) => setEquipmentType(e.target.value as EquipmentType)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none"
                >
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reg-trucks" className="block text-xs font-semibold text-slate-700">
                  Number of Power Units
                </label>
                <input
                  id="reg-trucks"
                  type="number"
                  min={1}
                  max={250}
                  value={truckCount}
                  onChange={(e) => setTruckCount(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-factoring" className="block text-xs font-semibold text-slate-700">
                  Factoring Company (if applicable)
                </label>
                <input
                  id="reg-factoring"
                  type="text"
                  value={factoringCompany}
                  onChange={(e) => setFactoringCompany(e.target.value)}
                  placeholder="e.g. RTS Financial, OTR Solutions, None"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="reg-plan" className="block text-xs font-semibold text-slate-700">
                  Selected Dispatch Plan
                </label>
                <select
                  id="reg-plan"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none"
                >
                  {pricingPlans.map((plan) => (
                    <option key={plan.id} value={plan.name}>
                      {plan.name} ({plan.rateLabel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <span className="block text-xs font-semibold text-slate-700">
                Preferred Operating Regions
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {REGION_OPTIONS.map((region) => {
                  const active = operatingRegions.includes(region);
                  return (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                      style={active ? {backgroundColor: colors.deepNavy} : undefined}
                    >
                      {region}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Secure Document Uploads */}
            <div className="mt-7 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-bold" style={{color: colors.deepNavy}}>
                  <Lock className="h-4 w-4" style={{color: colors.professionalRed}} aria-hidden="true" />
                  <span>Secure Carrier Document Uploads</span>
                </div>
                <span className="text-xs text-slate-500">PDF, PNG, or JPG · Max 3 MB per file</span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                {DOC_TYPES.map((dt) => {
                  const uploaded = documents.some((d) => d.docType === dt);
                  const isRequired = REQUIRED_DOC_TYPES.includes(dt);
                  return (
                    <div
                      key={dt}
                      className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 ${
                        uploaded
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <span className="truncate font-medium">{dt}</span>
                      <span className="ml-2 shrink-0 font-mono text-[10px]">
                        {uploaded ? 'Attached' : isRequired ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label htmlFor="doc-type" className="block text-xs font-semibold text-slate-700">
                    Document Category
                  </label>
                  <select
                    id="doc-type"
                    value={selectedDocType}
                    onChange={(e) =>
                      setSelectedDocType(e.target.value as UploadedDocument['docType'])
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium focus:outline-none"
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt} value={dt}>
                        {dt} {REQUIRED_DOC_TYPES.includes(dt) ? '(Required)' : '(Optional)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end sm:col-span-6">
                  <label className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-400 bg-white px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>Attach Compliance File</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              {docError && (
                <p className="mt-2.5 text-xs font-medium" style={{color: colors.professionalRed}}>
                  {docError}
                </p>
              )}

              {documents.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText
                          className="h-4 w-4 shrink-0"
                          style={{color: colors.professionalRed}}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold" style={{color: colors.deepNavy}}>
                            {doc.fileName}
                          </div>
                          <div className="text-slate-500">
                            {doc.docType} · <span className="font-mono">{doc.sizeLabel}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        aria-label={`Remove ${doc.fileName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6">
              <label htmlFor="reg-notes" className="block text-xs font-semibold text-slate-700">
                Lane Preferences, Home Time, or Gear Notes
              </label>
              <textarea
                id="reg-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share preferred home weekends, minimum RPM, weight limits, or trailer specs..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-start gap-2.5">
              <input
                id="reg-insurance"
                type="checkbox"
                checked={insuranceActive}
                onChange={(e) => setInsuranceActive(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer"
                style={{accentColor: colors.professionalRed}}
              />
              <label htmlFor="reg-insurance" className="text-xs leading-relaxed text-slate-600">
                I confirm my carrier authority holds active commercial auto liability ($1M+) and cargo ($100K+) insurance coverage.
              </label>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
              {errorMsg ? (
                <p role="alert" className="text-xs font-semibold text-red-700">
                  {errorMsg}
                </p>
              ) : (
                <span className="text-xs text-slate-500">
                  {submitting
                    ? submitStage || 'Submitting your carrier packet...'
                    : 'Your carrier packet and documents are stored privately.'}
                </span>
              )}
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                style={{backgroundColor: colors.professionalRed}}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>{submitStage || 'Submitting...'}</span>
                  </>
                ) : (
                  <>
                    <span>Submit Carrier Registration</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Onboarding Checklist Sidebar */}
          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div
                className="flex items-center gap-2 text-xs font-semibold"
                style={{color: colors.professionalRed}}
              >
                <FileCheck2 className="h-4 w-4" aria-hidden="true" />
                <span>What Happens Next</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-bold" style={{color: colors.deepNavy}}>
                3-Step Dispatch Activation
              </h3>
              <ol className="mt-4 space-y-4 text-sm text-slate-600">
                <li>
                  <span className="font-semibold" style={{color: colors.deepNavy}}>
                    01. Authority &amp; COI Verification
                  </span>
                  <p className="mt-0.5 text-xs">
                    We verify your carrier authority status and prepare your standard carrier packet (W-9, MC letter, COI, and optional NOA).
                  </p>
                </li>
                <li>
                  <span className="font-semibold" style={{color: colors.deepNavy}}>
                    02. Lane &amp; RPM Alignment Call
                  </span>
                  <p className="mt-0.5 text-xs">
                    Your assigned dispatcher confirms your minimum rate-per-mile, avoid zones, and home-time schedule.
                  </p>
                </li>
                <li>
                  <span className="font-semibold" style={{color: colors.deepNavy}}>
                    03. Live Rate Negotiation
                  </span>
                  <p className="mt-0.5 text-xs">
                    We pitch top-paying loads directly to you via text/WhatsApp/email for approval before signing any rate con.
                  </p>
                </li>
              </ol>
            </div>

            <div className="rounded-xl p-6 text-white" style={{backgroundColor: colors.deepNavy}}>
              <ShieldCheck
                className="h-6 w-6"
                style={{color: colors.professionalRed}}
                aria-hidden="true"
              />
              <h3 className="mt-3 font-display text-base font-bold">
                Zero Forced Dispatch Guarantee
              </h3>
              <p className="mt-2 text-xs leading-relaxed" style={{color: colors.silverGrey}}>
                You approve every shipper, rate confirmation, and destination. No dispatch fee is ever billed unless a load is successfully booked for your truck.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
