'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Building2, ChevronDown, Check, Sparkles, Truck, Globe, Zap, ArrowRight } from 'lucide-react';
import { getActiveTenant, setActiveTenant, PRESET_TENANTS, TenantProfile } from '@/lib/entitlements';

export function TenantSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTenant, setActiveTenantState] = useState<TenantProfile>(getActiveTenant());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTenantChange = (e: any) => {
      if (e.detail) {
        setActiveTenantState(e.detail);
      } else {
        setActiveTenantState(getActiveTenant());
      }
    };
    window.addEventListener('logiflow_tenant_changed', handleTenantChange);
    return () => window.removeEventListener('logiflow_tenant_changed', handleTenantChange);
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelectPreset = (preset: TenantProfile) => {
    setActiveTenant(preset);
    setIsOpen(false);
  };

  const getPlanBadgeStyle = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'SCALE':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'GROWTH':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-2.5 rounded-lg border border-[var(--border,#334155)] bg-[var(--surface-1,#0f172a)] hover:bg-[var(--surface-2,#1e293b)] text-xs text-[var(--text-high,#f8fafc)] transition-all shadow-sm"
        title="Switch active operating environment"
      >
        <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        <span className="font-semibold max-w-[130px] sm:max-w-[180px] truncate">
          {activeTenant.name}
        </span>
        <span
          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getPlanBadgeStyle(
            activeTenant.plan
          )}`}
        >
          {activeTenant.plan}
        </span>
        <ChevronDown className={`w-3 h-3 text-[var(--text-low,#94a3b8)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu (Floating with 8px air-gap) */}
      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-80 rounded-xl border border-[var(--border,#334155)] bg-[var(--surface-1,#0f172a)] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-[var(--border,#334155)] mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-low,#94a3b8)]">
              Active Logistics Environment
            </span>
            <span className="text-[10px] text-blue-400 font-mono">
              Score {activeTenant.score || 28}/50
            </span>
          </div>

          <div className="space-y-1">
            {/* Preset 1: ABC Transport */}
            <div
              onClick={() => handleSelectPreset(PRESET_TENANTS.ABC_TRANSPORT)}
              className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                activeTenant.id === PRESET_TENANTS.ABC_TRANSPORT.id
                  ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                  : 'hover:bg-[var(--surface-2,#1e293b)] text-[var(--text-high,#f8fafc)]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{PRESET_TENANTS.ABC_TRANSPORT.name}</div>
                  <div className="text-[10px] text-[var(--text-low,#94a3b8)]">Fleet Owner · National Transporter</div>
                  <div className="text-[9px] text-blue-400/80 mt-0.5">Fleet · Trips · Corridors · WhatsApp Dispatch</div>
                </div>
              </div>
              {activeTenant.id === PRESET_TENANTS.ABC_TRANSPORT.id && (
                <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-1" />
              )}
            </div>

            {/* Preset 2: Apex Global 3PL */}
            <div
              onClick={() => handleSelectPreset(PRESET_TENANTS.APEX_3PL)}
              className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                activeTenant.id === PRESET_TENANTS.APEX_3PL.id
                  ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                  : 'hover:bg-[var(--surface-2,#1e293b)] text-[var(--text-high,#f8fafc)]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{PRESET_TENANTS.APEX_3PL.name}</div>
                  <div className="text-[10px] text-[var(--text-low,#94a3b8)]">3PL & Freight Forwarding</div>
                  <div className="text-[9px] text-purple-400/80 mt-0.5">Control Tower · Freight Audit · CRM Portal</div>
                </div>
              </div>
              {activeTenant.id === PRESET_TENANTS.APEX_3PL.id && (
                <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-1" />
              )}
            </div>

            {/* Preset 3: SwiftCity Express */}
            <div
              onClick={() => handleSelectPreset(PRESET_TENANTS.SWIFTCITY_EXPRESS)}
              className={`p-2.5 rounded-lg cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                activeTenant.id === PRESET_TENANTS.SWIFTCITY_EXPRESS.id
                  ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                  : 'hover:bg-[var(--surface-2,#1e293b)] text-[var(--text-high,#f8fafc)]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold">{PRESET_TENANTS.SWIFTCITY_EXPRESS.name}</div>
                  <div className="text-[10px] text-[var(--text-low,#94a3b8)]">Courier & E-Commerce Express</div>
                  <div className="text-[9px] text-emerald-400/80 mt-0.5">Driver PWA · OTP e-POD · Live Drops</div>
                </div>
              </div>
              {activeTenant.id === PRESET_TENANTS.SWIFTCITY_EXPRESS.id && (
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-1" />
              )}
            </div>
          </div>

          <div className="border-t border-[var(--border,#334155)] mt-2 pt-2">
            <Link
              href="/configure"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Configure New Workspace</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
