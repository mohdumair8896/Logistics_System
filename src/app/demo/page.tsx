'use client';

import { useEffect } from 'react';
import { Truck, Sparkles } from 'lucide-react';

export default function DemoPage() {
  useEffect(() => {
    // Forward to /api/demo which sets the signed guest JWT cookie and lands on /dashboard?demo=true
    window.location.href = '/api/demo';
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 animate-pulse">
          <Truck className="w-8 h-8" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#020617] flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-slate-950" />
        </div>
      </div>
      <h1 className="text-2xl font-black tracking-tight mb-2">
        Launching Interactive Demo Sandbox...
      </h1>
      <p className="text-sm text-slate-400 max-w-md font-mono">
        Seeding live dummy fleet, active GPS journeys, real-time corridor telematics, and LogiPilot autonomous AI agents.
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full font-mono">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        No signup or credit card required
      </div>
    </div>
  );
}
