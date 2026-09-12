'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck, Globe, Zap, Sparkles, Check, ArrowRight, ArrowLeft,
  Layers, Compass, Cpu, CheckCircle2, Activity
} from 'lucide-react';
import {
  ARCHETYPES, ArchetypeCode, AVAILABLE_MODULES, calculateComplexityScore,
  DEFAULT_ONBOARDING_STATE, OnboardingState, PainPoint, CurrentSystem,
  TransportMode, GeographyScope, AiAgentId, AutonomyScope, PLAN_PRICING,
  OrderIntakeChannel, DriverCommChannel
} from '@/lib/onboarding/scoring';

type WizardScreen = 'WIZARD' | 'RECOMMENDATION' | 'PROVISIONING';

export default function ConfigurePage() {
  const router = useRouter();
  const [screen, setScreen] = useState<WizardScreen>('WIZARD');
  const [currentStep, setCurrentStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [provisioningStep, setProvisioningStep] = useState(0);

  const result = calculateComplexityScore(state);

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setScreen('RECOMMENDATION');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (user?.companyName) {
          setState(prev => ({ ...prev, companyName: user.companyName }));
        }
      })
      .catch(() => {});
  }, []);

  const startProvisioning = () => {
    setScreen('PROVISIONING');
    // Save tenant profile into localStorage so the dashboard and header can immediately read it
    const activeTenant = {
      name: state.companyName || 'My Logistics Workspace',
      archetype: state.archetype,
      plan: result.recommendedPlan,
      score: result.totalScore,
      enabledModules: result.recommendedModules,
      autonomyLevel: state.autonomyLevel,
      fleetSize: state.fleetSize,
      monthlyShipments: state.monthlyShipments,
      geography: state.geography,
    };
    try {
      localStorage.setItem('logisticsedge_active_tenant', JSON.stringify(activeTenant));
    } catch {}

    // Persist to server API and update session cookie
    fetch('/api/tenants/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        archetype: state.archetype,
        complexityScore: result.totalScore,
        enabledModules: result.recommendedModules,
        autonomyLevel: state.autonomyLevel,
        companyName: state.companyName,
        activeIntegrations: state.integrations,
      }),
    }).catch(e => console.warn('[Provisioning API error]:', e));

    // Step through workspace provisioning checklist
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setProvisioningStep(step);
      if (step >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="border-b border-slate-800/80 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              Logi<span className="text-blue-500">Flow</span>
            </span>
          </Link>
          <span className="text-slate-600 text-sm hidden sm:inline">/</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 hidden sm:inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Workspace Architect
          </span>
        </div>

        {screen === 'WIZARD' && (
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400 font-mono">STEP {currentStep} OF 7</span>
            <div className="w-28 sm:w-44 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 7) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {screen === 'WIZARD' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Step Header */}
            <div className="space-y-2">
              <div className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                {currentStep === 1 && 'Stage 1: Operational Model'}
                {currentStep === 2 && 'Stage 2: Geographic Scope & Transport Modes'}
                {currentStep === 3 && 'Stage 3: Scale & Operational Dimensions'}
                {currentStep === 4 && 'Stage 4: Current Systems & Order Channels'}
                {currentStep === 5 && 'Stage 5: Operational Bottlenecks & Priorities'}
                {currentStep === 6 && 'Stage 6: AI Workforce & Autonomy Scope'}
                {currentStep === 7 && 'Stage 7: Ecosystem Integrations'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {currentStep === 1 && 'What best describes your logistics business?'}
                {currentStep === 2 && 'Where does your cargo move, and by which modes?'}
                {currentStep === 3 && 'What is the operational scale of your business?'}
                {currentStep === 4 && 'How do orders, systems, and drivers connect today?'}
                {currentStep === 5 && 'Which operational bottlenecks cost your team the most?'}
                {currentStep === 6 && 'Which AI agents would you like in your operations?'}
                {currentStep === 7 && 'Which external systems should we connect?'}
              </h1>
              <p className="text-sm text-slate-400 max-w-3xl">
                {currentStep === 1 && 'Your operating model sets your default modules, navigation blueprint, and dashboard layout.'}
                {currentStep === 2 && 'We adapt the interface so you only see tools relevant to your territory and transport legs.'}
                {currentStep === 3 && 'Helps us right-size your capacity allowances, throughput quotas, and dispatch queues.'}
                {currentStep === 4 && 'Identifies how much manual dispatch, WhatsApp messaging, and data entry we can automate.'}
                {currentStep === 5 && 'Select your top priorities. We will configure automated playbooks to target these immediately.'}
                {currentStep === 6 && 'Choose the autonomous agents you want to deploy and set their allowed operational discretion.'}
                {currentStep === 7 && 'We provide instant connectors for telematics, government portals, FASTag, and ERPs.'}
              </p>
            </div>

            {/* ── STEP 1: BUSINESS ARCHETYPE ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={state.companyName}
                    onChange={(e) => setState({ ...state, companyName: e.target.value })}
                    className="w-full sm:max-w-md h-10 px-3.5 bg-slate-900/90 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="e.g. ABC Transport & Logistics"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(Object.keys(ARCHETYPES) as ArchetypeCode[]).map((key) => {
                    const arch = ARCHETYPES[key];
                    const isSelected = state.archetype === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setState({ ...state, archetype: key })}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 text-left relative group ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                            {arch.title}
                          </span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                            isSelected ? 'bg-blue-500/20 border-blue-400/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {arch.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{arch.description}</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-2.5">
                          <span>Example: {arch.sampleCompany}</span>
                          {isSelected && (
                            <span className="text-blue-400 font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Selected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 2: GEOGRAPHY & MODES ── */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" /> Geographic Coverage
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'LOCAL', title: 'Local / City', desc: 'Intra-city metro delivery' },
                      { id: 'REGIONAL', title: 'Regional / State', desc: 'Intra-state distribution' },
                      { id: 'NATIONAL', title: 'National', desc: 'Interstate nationwide network' },
                      { id: 'INTERNATIONAL', title: 'Cross-Border', desc: 'Multi-country & global lanes' },
                    ].map((geo) => {
                      const isSelected = state.geography === geo.id;
                      return (
                        <div
                          key={geo.id}
                          onClick={() => setState({ ...state, geography: geo.id as GeographyScope })}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs mb-1">{geo.title}</div>
                          <div className="text-[11px] text-slate-400">{geo.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-400" /> Transport Modes (Select all active)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: 'ROAD', label: 'Road Freight (FTL/LTL)', icon: Truck },
                      { id: 'RAIL', label: 'Rail Cargo', icon: Layers },
                      { id: 'OCEAN', label: 'Ocean Container', icon: Globe },
                      { id: 'AIR', label: 'Air Express', icon: Zap },
                      { id: 'MULTIMODAL', label: 'Multimodal', icon: Compass },
                    ].map((mode) => {
                      const isSelected = state.modes.includes(mode.id as TransportMode);
                      return (
                        <div
                          key={mode.id}
                          onClick={() => {
                            const newModes = isSelected
                              ? state.modes.filter((m) => m !== mode.id)
                              : [...state.modes, mode.id as TransportMode];
                            setState({ ...state, modes: newModes.length ? newModes : ['ROAD'] });
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <mode.icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                          <span className="text-xs font-medium">{mode.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: SCALE DIMENSIONS ── */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Fleet Vehicles / Active Assets</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['0', '1-5', '6-25', '26-100', '101-500', '500+'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setState({ ...state, fleetSize: b })}
                        className={`h-9 text-xs rounded-lg border font-medium transition-all ${
                          state.fleetSize === b
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {b} {b === '0' ? '(Asset-light)' : 'Trucks'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Monthly Shipments / Loads</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['<100', '100-500', '500-2500', '2500-10000', '10000+'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setState({ ...state, monthlyShipments: b })}
                        className={`h-9 text-xs rounded-lg border font-medium transition-all ${
                          state.monthlyShipments === b
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {b} / mo
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Branches / Warehouses / Hubs</div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['1', '2-5', '6-20', '20+'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setState({ ...state, branches: b })}
                        className={`h-9 text-xs rounded-lg border font-medium transition-all ${
                          state.branches === b
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {b} {b === '1' ? 'Branch' : 'Branches'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">Active Drivers / Operators</div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['1-10', '11-50', '51-250', '250+'] as const).map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setState({ ...state, drivers: b })}
                        className={`h-9 text-xs rounded-lg border font-medium transition-all ${
                          state.drivers === b
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: CURRENT SYSTEMS & CHANNELS ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-3">
                    Which systems does your team operate today? (Select all that apply)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'EXCEL', label: 'Excel / Google Sheets' },
                      { id: 'WHATSAPP', label: 'WhatsApp Groups' },
                      { id: 'TMS', label: 'Existing Legacy TMS' },
                      { id: 'SAP', label: 'SAP / Oracle / ERP' },
                      { id: 'TALLY', label: 'Tally / Zoho Accounting' },
                      { id: 'GPS_VENDOR', label: 'GPS / Telematics Vendor' },
                      { id: 'EWAY_PORTAL', label: 'Govt E-Way / E-Invoice' },
                    ].map((sys) => {
                      const isSelected = state.currentSystems.includes(sys.id as CurrentSystem);
                      return (
                        <div
                          key={sys.id}
                          onClick={() => {
                            const updated = isSelected
                              ? state.currentSystems.filter((s) => s !== sys.id)
                              : [...state.currentSystems, sys.id as CurrentSystem];
                            setState({ ...state, currentSystems: updated });
                          }}
                          className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-all ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 text-white'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span>{sys.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-300">How do customer orders arrive?</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'WHATSAPP', label: 'WhatsApp Messages' },
                        { id: 'EMAIL', label: 'Customer Emails' },
                        { id: 'API_PORTAL', label: 'Portal / EDI / API' },
                        { id: 'PHONE_MANUAL', label: 'Phone / Manual Log' },
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setState({ ...state, orderChannel: ch.id as OrderIntakeChannel })}
                          className={`h-9 text-xs rounded-lg border font-medium text-left px-3 transition-all ${
                            state.orderChannel === ch.id
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="text-xs font-semibold text-slate-300">How do dispatchers coordinate with drivers?</div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'WHATSAPP', label: 'WhatsApp Chat/Voice' },
                        { id: 'PHONE', label: 'Direct Phone Calls' },
                        { id: 'DRIVER_APP', label: 'Driver Smartphone App' },
                        { id: 'NONE', label: 'No Structured System' },
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setState({ ...state, driverChannel: ch.id as DriverCommChannel })}
                          className={`h-9 text-xs rounded-lg border font-medium text-left px-3 transition-all ${
                            state.driverChannel === ch.id
                              ? 'bg-blue-600 border-blue-500 text-white'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 5: PAIN POINTS (RANK TOP 5) ── */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Selected: <strong className="text-blue-400">{state.topPainPoints.length}</strong> / 5 priorities
                  </span>
                  <span className="text-xs text-slate-500">Tap to select or deselect</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'TRACKING_BLINDSPOTS', title: 'Vehicle Tracking Blindspots', desc: 'No live telemetry; unknown delays outside corridor' },
                    { id: 'LATE_DELIVERIES', title: 'Late Deliveries & Missed SLAs', desc: 'Customers complain before dispatchers know there is a delay' },
                    { id: 'DRIVER_COORDINATION', title: 'Driver Phone Tag', desc: 'Endless calls in Hindi/English asking for location & ETA' },
                    { id: 'POD_COLLECTION', title: 'Paper POD Delays', desc: 'Billing delayed 15–30 days waiting for physical signed LR' },
                    { id: 'FREIGHT_LEAKAGE', title: 'Freight Leakage & Detention', desc: 'Overpaying transporters and disputes on detention hours' },
                    { id: 'BILLING_RECONCILIATION', title: 'Billing Discrepancies', desc: 'Manual GST math and customer invoice deductions' },
                    { id: 'COLLECTIONS_DUNNING', title: 'Slow Collections & Cash Flow', desc: 'Invoices sit unpaid without timely automated follow-ups' },
                    { id: 'WAREHOUSE_CONGESTION', title: 'Bay & Gate Congestion', desc: 'Trucks waiting hours at docks without slot schedules' },
                    { id: 'DISPERSED_DATA', title: 'Fragmented Excel & WhatsApp', desc: 'No single source of truth across team and branches' },
                  ].map((p) => {
                    const isSelected = state.topPainPoints.includes(p.id as PainPoint);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isSelected) {
                            setState({ ...state, topPainPoints: state.topPainPoints.filter((x) => x !== p.id) });
                          } else if (state.topPainPoints.length < 5) {
                            setState({ ...state, topPainPoints: [...state.topPainPoints, p.id as PainPoint] });
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-semibold text-xs">{p.title}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{p.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 6: AI WORKFORCE & AUTONOMY ── */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-3">
                    Choose the Autonomous AI Agents to activate in your workspace:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'EXCEPTION_AGENT', title: 'Operations Exception Agent', desc: 'Monitors GPS corridors & predicts delays' },
                      { id: 'DRIVER_AGENT', title: 'WhatsApp Driver Agent', desc: 'Two-way voice/text chat in Hindi & English' },
                      { id: 'DOCS_AGENT', title: 'Document & POD OCR Agent', desc: 'Instant stamp & signature verification' },
                      { id: 'BILLING_AGENT', title: 'Freight Audit Agent', desc: 'Reconciles contract rate cards & detention' },
                      { id: 'CUSTOMER_AGENT', title: 'Customer Support Agent', desc: 'Provides live ETAs and reschedules slots' },
                      { id: 'COLLECTIONS_AGENT', title: 'Collections AI Agent', desc: 'Automates overdue invoice payment follow-ups' },
                      { id: 'PROCUREMENT_AGENT', title: 'Procurement AI Agent', desc: 'Sources spot trucks and negotiates rates' },
                      { id: 'MANAGEMENT_AGENT', title: 'Executive Intelligence Agent', desc: 'Prepares daily operational summaries' },
                    ].map((agent) => {
                      const isSelected = state.desiredAgents.includes(agent.id as AiAgentId);
                      return (
                        <div
                          key={agent.id}
                          onClick={() => {
                            const updated = isSelected
                              ? state.desiredAgents.filter((a) => a !== agent.id)
                              : [...state.desiredAgents, agent.id as AiAgentId];
                            setState({ ...state, desiredAgents: updated });
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-semibold text-xs text-white mb-1">{agent.title}</div>
                          <div className="text-[11px] text-slate-400">{agent.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">How much autonomy should AI agents have?</h4>
                      <p className="text-xs text-slate-400">Controls whether agents recommend, draft, or auto-execute actions.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-xs">
                      Level {state.autonomyLevel} Autonomy
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    {[
                      { lvl: 1, title: 'Level 1: Suggestions', desc: 'AI observes & recommends actions in an approval queue.' },
                      { lvl: 2, title: 'Level 2: Draft for Approval', desc: 'AI drafts WhatsApp alerts; human clicks approve.' },
                      { lvl: 3, title: 'Level 3: Routine Autonomy', desc: 'AI auto-notifies & updates status; escalates exceptions.' },
                      { lvl: 4, title: 'Level 4: Policy Bounded', desc: 'Auto-executes rate adjustments under ₹5,000 within rules.' },
                    ].map((opt) => (
                      <div
                        key={opt.lvl}
                        onClick={() => setState({ ...state, autonomyLevel: opt.lvl as AutonomyScope })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          state.autonomyLevel === opt.lvl
                            ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500'
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs font-bold text-white mb-1">{opt.title}</div>
                        <div className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 7: INTEGRATIONS ── */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select external services you plan to connect for telematics, invoicing, and messaging:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'FASTag Toll Telematics',
                    'Vahan / Sarathi Vehicle Registry',
                    'E-Way Bill & E-Invoice Portal',
                    'WhatsApp Business Cloud API',
                    'Tally / Zoho Books Sync',
                    'SAP S/4HANA / Oracle ERP',
                    'Hardware GPS Providers (Traccar/Teltonika)',
                    'Customer Webhook Stream',
                  ].map((intg) => {
                    const isSelected = state.integrations.includes(intg);
                    return (
                      <div
                        key={intg}
                        onClick={() => {
                          const updated = isSelected
                            ? state.integrations.filter((i) => i !== intg)
                            : [...state.integrations, intg];
                          setState({ ...state, integrations: updated });
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{intg}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Bottom Controls & Complexity Bar ── */}
            <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Complexity Score: <strong className="text-white">{result.totalScore}/50</strong>
                </span>
                <span>•</span>
                <span>
                  Recommended: <strong className="text-blue-400">{result.recommendedPlan} PLAN</strong>
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="h-10 px-4 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-none h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                >
                  {currentStep === 7 ? 'Generate My Logistics OS Blueprint' : 'Continue'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCREEN 2: RECOMMENDATION BLUEPRINT ── */}
        {screen === 'RECOMMENDATION' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> Operating Model Generated
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Recommended Logistics OS for {state.companyName || 'Your Company'}
              </h1>
              <p className="text-sm text-slate-400">
                Based on your {state.archetype.replace('_', ' ').toLowerCase()} archetype, {state.monthlyShipments} monthly shipments, and automation priorities.
              </p>
            </div>

            {/* Scorecard & ROI Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Logistics Complexity</span>
                <div className="text-3xl font-extrabold text-white flex items-baseline gap-1.5">
                  {result.totalScore} <span className="text-sm text-slate-500 font-normal">/ 50</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(result.totalScore / 50) * 100}%` }} />
                </div>
                <div className="text-[11px] text-slate-400 pt-1">
                  Tier: <strong className="text-blue-400">{result.recommendedPlan} Operations</strong>
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Monthly Automated Tasks</span>
                <div className="text-3xl font-extrabold text-emerald-400">
                  ~{result.automatedTasksEliminated.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  Eliminates coordination friction across ~{result.estimatedMonthlyTasks.toLocaleString()} operational events.
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-medium">Estimated Monthly Savings</span>
                <div className="text-3xl font-extrabold text-indigo-400">
                  ₹{result.estimatedMonthlySavingsInr.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  Saves ~{result.hoursSavedMonthly} dispatcher hours per month at ₹275/hr.
                </div>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" /> Tailored Operating Modules Enabled
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_MODULES.map((mod) => {
                  const isEnabled = result.recommendedModules.includes(mod.code);
                  return (
                    <div
                      key={mod.code}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${
                        isEnabled
                          ? 'bg-blue-950/20 border-blue-500/40 text-slate-200'
                          : 'bg-slate-900/30 border-slate-800/60 text-slate-500 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-white">{mod.name}</div>
                        <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{mod.description}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isEnabled ? 'Enabled' : 'Off'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Card & CTA */}
            <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Recommended Package
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  {PLAN_PRICING[result.recommendedPlan].name}
                </div>
                <p className="text-xs text-slate-300 max-w-lg">
                  {PLAN_PRICING[result.recommendedPlan].description}
                </p>
                <div className="text-sm font-semibold text-white pt-2" suppressHydrationWarning>
                  ₹{PLAN_PRICING[result.recommendedPlan].basePriceInr.toLocaleString('en-IN')} / month
                  <span className="text-xs text-slate-400 font-normal"> · All core modules + WhatsApp + GPS included</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setScreen('WIZARD')}
                  className="h-11 px-5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors w-full sm:w-auto"
                >
                  Adjust Answers
                </button>
                <button
                  type="button"
                  onClick={startProvisioning}
                  className="h-11 px-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Sparkles className="w-4 h-4" /> Build My Logistics Workspace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCREEN 3: PROVISIONING ANIMATION ── */}
        {screen === 'PROVISIONING' && (
          <div className="max-w-xl mx-auto py-12 space-y-8 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
              <Cpu className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Assembling your Logistics OS...
              </h2>
              <p className="text-xs text-slate-400">
                Configuring tenant database isolation, dynamic navigation, and LogiPilot AI agents.
              </p>
            </div>

            {/* Checklist */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 text-left font-mono text-xs space-y-3 shadow-xl">
              {[
                'Initializing multi-tenant workspace isolation...',
                `Activating ${result.recommendedModules.length} operating modules: ${result.recommendedModules.slice(0, 4).join(', ')}...`,
                'Configuring dynamic role-based navigation & permissions...',
                `Deploying LogiPilot AI Workforce with Level ${state.autonomyLevel} autonomy...`,
                'Workspace provisioned! Redirecting to live dashboard...',
              ].map((text, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    provisioningStep >= idx ? 'opacity-100 text-slate-200' : 'opacity-30 text-slate-600'
                  }`}
                >
                  {provisioningStep > idx ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : provisioningStep === idx ? (
                    <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                  )}
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500">
              Please wait while your workspace environment is generated...
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
