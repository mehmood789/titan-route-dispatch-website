import React, {useMemo, useState} from 'react';
import {ArrowRight, Calculator, CheckCircle2} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';
import {ResilientImage} from '../components/ResilientImage.tsx';

interface ServicesPageProps {
  onNavigate: (page: PageRoute) => void;
}

const DEFAULT_PRESETS: Record<string, number> = {
  Hotshot: 2.85,
  'Power Only': 2.65,
  'Box Truck': 2.45,
  'Dry Van': 2.95,
  Reefer: 3.45,
  Flatbed: 3.75,
};

export const ServicesPage: React.FC<ServicesPageProps> = ({onNavigate}) => {
  const {activeContent, services} = useCms();
  const {colors} = activeContent;

  const equipmentNames = useMemo(() => {
    const names = services.map((s) => s.equipment);
    return names.length > 0 ? names : Object.keys(DEFAULT_PRESETS);
  }, [services]);

  const [calcEquipment, setCalcEquipment] = useState<string>(equipmentNames[0] || 'Dry Van');
  const [weeklyMiles, setWeeklyMiles] = useState(2600);
  const [targetRpm, setTargetRpm] = useState(2.95);
  const [feeRate, setFeeRate] = useState(5);

  const handleEquipmentChange = (eq: string) => {
    setCalcEquipment(eq);
    setTargetRpm(DEFAULT_PRESETS[eq] || 3.0);
  };

  const estimate = useMemo(() => {
    const gross = weeklyMiles * targetRpm;
    const dispatchFee = gross * (feeRate / 100);
    const netAfterFee = gross - dispatchFee;
    const monthlyGross = gross * 4.33;
    return {gross, dispatchFee, netAfterFee, monthlyGross};
  }, [weeklyMiles, targetRpm, feeRate]);

  return (
    <div className="bg-white">
      {/* Page Header */}
      <section className="py-14 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <strong className="font-bold text-white">{activeContent.companyName}</strong>
            <span className="mx-2" aria-hidden="true">·</span>
            <span style={{color: colors.professionalRed}}>
              {services.length} Specialized Equipment Divisions
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance max-w-3xl">
            Full-Cycle Freight Dispatch Across Every Commercial Trailer Class
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{color: colors.silverGrey}}>
            Dedicated US dispatchers negotiate every rate confirmation, vet broker credit, process carrier packets, and recover detention or layover pay.
          </p>
        </div>
      </section>

      {/* Individual Visual Service Cards Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-[#F8FAFC]"
              >
                <div>
                  <div
                    className="h-52 w-full overflow-hidden border-b border-slate-200"
                    style={{backgroundColor: colors.deepNavy}}
                  >
                    <ResilientImage
                      src={service.image}
                      alt={service.imageAlt || service.title}
                      className="h-full w-full object-cover"
                      fallbackTitle={service.title}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-semibold" style={{color: colors.professionalRed}}>
                        {service.equipment}
                      </span>
                      <span
                        className="font-mono tabular-nums font-semibold"
                        style={{color: colors.deepNavy}}
                      >
                        {service.targetRpm}
                      </span>
                    </div>

                    <h2
                      className="mt-2 font-display text-xl font-bold"
                      style={{color: colors.deepNavy}}
                    >
                      {service.title}
                    </h2>

                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                      {service.summary}
                    </p>

                    <ul className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-700">
                      {service.deliverables.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <CheckCircle2
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            style={{color: colors.professionalRed}}
                            aria-hidden="true"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
                  <div className="text-xs">
                    <span className="text-slate-500">Weekly Gross: </span>
                    <span
                      className="font-mono font-semibold tabular-nums"
                      style={{color: colors.deepNavy}}
                    >
                      {service.avgWeeklyGross}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('register')}
                    className="inline-flex items-center gap-1 text-xs font-semibold hover:opacity-80 cursor-pointer"
                    style={{color: colors.professionalRed}}
                  >
                    <span>Onboard</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Weekly Gross & Dispatch Estimator */}
      <section className="border-t border-slate-200 bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div
                className="flex items-center gap-2 text-xs font-semibold"
                style={{color: colors.professionalRed}}
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                <span>Interactive Lane Estimator</span>
              </div>
              <h2
                className="mt-2 font-display text-2xl font-bold"
                style={{color: colors.deepNavy}}
              >
                Estimate Your Weekly Gross &amp; Dispatch Cost
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Select your trailer class, weekly loaded miles, and target rate-per-mile to model weekly gross revenue.
              </p>

              <div className="mt-6 space-y-6">
                <div>
                  <span className="block text-xs font-semibold text-slate-700 mb-2">
                    Equipment Class
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {equipmentNames.map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => handleEquipmentChange(eq)}
                        className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          calcEquipment === eq
                            ? 'text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                        style={
                          calcEquipment === eq ? {backgroundColor: colors.deepNavy} : undefined
                        }
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <label htmlFor="miles-range">Weekly Loaded Miles</label>
                    <span className="font-mono tabular-nums" style={{color: colors.deepNavy}}>
                      {weeklyMiles.toLocaleString()} mi
                    </span>
                  </div>
                  <input
                    id="miles-range"
                    type="range"
                    min={1400}
                    max={3600}
                    step={100}
                    value={weeklyMiles}
                    onChange={(e) => setWeeklyMiles(Number(e.target.value))}
                    className="mt-2 w-full cursor-pointer"
                    style={{accentColor: colors.professionalRed}}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <label htmlFor="rpm-range">Target Loaded RPM</label>
                      <span className="font-mono tabular-nums" style={{color: colors.deepNavy}}>
                        ${targetRpm.toFixed(2)}/mi
                      </span>
                    </div>
                    <input
                      id="rpm-range"
                      type="range"
                      min={1.9}
                      max={4.8}
                      step={0.05}
                      value={targetRpm}
                      onChange={(e) => setTargetRpm(Number(e.target.value))}
                      className="mt-2 w-full cursor-pointer"
                      style={{accentColor: colors.professionalRed}}
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-700 mb-2">
                      Dispatch Plan Rate
                    </span>
                    <div className="flex items-center gap-2">
                      {[5, 4.5, 4].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setFeeRate(rate)}
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold font-mono tabular-nums transition-colors cursor-pointer ${
                            feeRate === rate
                              ? 'text-white'
                              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                          style={
                            feeRate === rate ? {backgroundColor: colors.professionalRed} : undefined
                          }
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="flex flex-col justify-between rounded-xl p-6 text-white lg:col-span-5"
              style={{backgroundColor: colors.deepNavy}}
            >
              <div>
                <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
                  {calcEquipment} Projection · {feeRate}% Plan
                </div>
                <div className="mt-4 border-b border-white/10 pb-4">
                  <div className="text-xs" style={{color: colors.silverGrey}}>
                    Estimated Weekly Gross
                  </div>
                  <div className="mt-1 font-mono text-3xl font-bold text-white tabular-nums">
                    ${Math.round(estimate.gross).toLocaleString()}
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt style={{color: colors.silverGrey}}>Dispatch Service Fee ({feeRate}%)</dt>
                    <dd className="font-mono tabular-nums text-slate-200">
                      −${Math.round(estimate.dispatchFee).toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt style={{color: colors.silverGrey}}>Net Before Truck Expenses</dt>
                    <dd
                      className="font-mono tabular-nums font-bold"
                      style={{color: colors.professionalRed}}
                    >
                      ${Math.round(estimate.netAfterFee).toLocaleString()} / wk
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <dt style={{color: colors.silverGrey}}>Projected Monthly Gross</dt>
                    <dd className="font-mono tabular-nums font-semibold text-white">
                      ${Math.round(estimate.monthlyGross).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                style={{backgroundColor: colors.professionalRed}}
              >
                <span>Lock In These Lanes</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
