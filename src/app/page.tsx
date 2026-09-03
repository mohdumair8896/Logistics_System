'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Truck, Zap, ArrowRight, Calculator, Radio, CheckCircle2,
  AlertTriangle, Layers, Sparkles, Settings, MessageSquare,
  Code, TrendingUp, CheckCircle, PhoneOff, Route, Headphones
} from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/* ─── DentaFlow Exact Color Tokens ─── */
const C = {
  bgPage:     '#EEF2F8',   // hero bg
  bgWhite:    '#FFFFFF',
  bgGray50:   '#F8FAFC',
  bgGray100:  '#F1F5F9',
  bgDark:     '#0B1120',   // pricing dark
  bgDark2:    '#111827',   // card inner
  text900:    '#0F172A',
  text700:    '#334155',
  text600:    '#475569',
  text500:    '#64748B',
  text400:    '#94A3B8',
  emerald600: '#059669',
  emerald500: '#10B981',
  emerald700: '#047857',
  emerald50:  '#ECFDF5',
  border:     '#E2E8F0',
  border300:  '#CBD5E1',
  red600:     '#DC2626',
  red50:      '#FEF2F2',
  red100:     '#FEE2E2',
};

/* full-bleed section style — padding is horizontal 5vw, no maxWidth wrapper */
const sec = (bg: string, extraStyle?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', background: bg, padding: '88px 5vw',
  boxSizing: 'border-box', ...extraStyle,
});
const secBorder = (bg: string): React.CSSProperties => ({
  ...sec(bg), borderTop: `1px solid ${C.border}`,
});

export default function LandingPage() {
  const [fleetSize, setFleetSize] = useState(25);
  const [avgKm, setAvgKm] = useState(450);
  const [deadhead, setDeadhead] = useState(22);
  const [phoneHrs, setPhoneHrs] = useState(25);
  const [timelinePct, setTimelinePct] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);
  const tlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Force browser to start at top on reload and clear any stale URL hash
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const fn = () => setNavScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const updateTimeline = () => {
      if (!tlRef.current) return;
      const r = tlRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      
      // Calculate how far through the viewport the timeline has progressed
      // Starts filling when top of timeline reaches 70% of viewport height
      // Completes 100% when bottom of timeline is above 30% of viewport height
      const startTrigger = windowH * 0.70;
      const endTrigger = windowH * 0.30;
      const totalTravel = r.height + (startTrigger - endTrigger);
      const traveled = startTrigger - r.top;
      
      const pct = Math.min(100, Math.max(0, (traveled / totalTravel) * 100));
      setTimelinePct(pct);
    };

    updateTimeline();
    window.addEventListener('scroll', updateTimeline, { passive: true });
    window.addEventListener('resize', updateTimeline, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateTimeline);
      window.removeEventListener('resize', updateTimeline);
    };
  }, []);

  const calc = useMemo(() => {
    const deadKm = fleetSize * 16 * avgKm * (deadhead / 100);
    const fuelLoss = deadKm * 24;
    const laborLoss = phoneHrs * 4 * 650;
    const total = fuelLoss + laborLoss;
    return { deadKm: Math.round(deadKm), fuelLoss: Math.round(fuelLoss), laborLoss: Math.round(laborLoss), total: Math.round(total), saved: Math.round(total * 12 * 0.72) };
  }, [fleetSize, avgKm, deadhead, phoneHrs]);

  const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const h1  = useScrollReveal(0, 0.05, true);
  const rL  = useScrollReveal(0, 0.1, false);
  const rR  = useScrollReveal(100, 0.1, false);
  const pH  = useScrollReveal(0, 0.1, false);
  const p1  = useScrollReveal(0, 0.1, false);
  const p2  = useScrollReveal(100, 0.1, false);
  const p3  = useScrollReveal(200, 0.1, false);
  const hwH = useScrollReveal(0, 0.1, false);
  const s1  = useScrollReveal(0, 0.1, false);
  const s2  = useScrollReveal(100, 0.1, false);
  const s3  = useScrollReveal(200, 0.1, false);
  const s4  = useScrollReveal(300, 0.1, false);
  const sbH = useScrollReveal(0, 0.1, false);
  const emR = useScrollReveal(0, 0.1, false);
  const prR = useScrollReveal(0, 0.1, false);
  const ctR = useScrollReveal(0, 0.1, false);

  const pains = [
    { Icon: PhoneOff,      dot:'#F97316', bg:'#FDE8DC', iconC:'#F97316', title:'Missing shipper calls?',         prob:'Shippers call after hours — loads go to competitors.', sol:'LogiFlow AI answers 24/7, captures shipper intent, logs every inquiry automatically.' },
    { Icon: MessageSquare, dot:'#F59E0B', bg:'#FEF3C7', iconC:'#D97706', title:'Repeating tracking queries?',     prob:'Dispatchers spend 25+ hrs/week answering "Where is my truck?" calls.', sol:'The AI copilot handles live telematics, ETA lookups, and corridor status — instant.' },
    { Icon: Route,         dot:'#10B981', bg:'#D1FAE5', iconC:'#059669', title:'Deadhead miles killing margin?',  prob:'Empty return trucks burn ₹24/km with zero revenue. 22% industry average.', sol:'AI backhaul matching surfaces nearby loads automatically, cutting deadhead 35%.' },
  ];

  const steps = [
    { n:'01', c:'#2563EB', Icon:Settings,      side:'L', title:'Connect your fleet data',   desc:'Add vehicles, drivers, corridors. AI onboarding in under 10 minutes.' },
    { n:'02', c:'#F43F5E', Icon:MessageSquare, side:'R', title:'Train the AI dispatcher',   desc:'Upload rate cards, lane FAQs, SLA policies. The copilot learns your operation.' },
    { n:'03', c:'#F59E0B', Icon:Code,          side:'L', title:'Embed the chat widget',     desc:'One script tag on your shipper portal. Works with any website or intranet.' },
    { n:'04', c:'#10B981', Icon:TrendingUp,    side:'R', title:'Capture leads 24/7',        desc:'Every shipper inquiry becomes a CRM lead, ready for one-click dispatch.' },
  ];
  const sRevs = [s1, s2, s3, s4];

  /* ─── shared button styles ─── */
  const btnD: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:8, background:C.text900, color:'#fff', fontWeight:700, fontSize:15, padding:'12px 24px', borderRadius:12, textDecoration:'none', boxShadow:'0 2px 10px rgba(15,23,42,0.18)', transition:'background 0.15s, transform 0.18s, box-shadow 0.18s', border:'none', cursor:'pointer' };
  const btnL: React.CSSProperties = { display:'inline-flex', alignItems:'center', gap:8, background:C.bgWhite, color:C.text700, fontWeight:600, fontSize:15, padding:'12px 24px', borderRadius:12, textDecoration:'none', border:`1.5px solid ${C.border300}`, transition:'border-color 0.15s, box-shadow 0.15s, transform 0.15s', cursor:'pointer' };

  return (
    <div style={{ minHeight:'100vh', width:'100%', background:C.bgWhite, color:C.text900, fontFamily:"'Inter','Geist',system-ui,sans-serif", overflowX:'hidden' }}>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org','@type':'SoftwareApplication', name:'Precision Logistics LMS' }) }} />

      {/* ══════════════ NAVBAR — full-width sticky ══════════════ */}
      <header style={{ position:'sticky', top:0, zIndex:100, width:'100%', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', borderBottom:`1px solid ${navScrolled ? C.border : 'rgba(226,232,240,0.5)'}`, boxShadow: navScrolled?'0 1px 12px rgba(15,23,42,0.07)':'none', transition:'box-shadow 0.3s, border-color 0.3s', boxSizing:'border-box', padding:'0 5vw' }}>
        <div style={{ height:64, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:800, color:C.text900, letterSpacing:'-0.02em' }}>Precision Logistics</div>
              <div style={{ fontSize:9.5, color:C.emerald600, fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase' }}>LogiFlow AI Copilot</div>
            </div>
          </Link>

          <nav className="hide-mobile" style={{ display:'flex', gap:28, fontSize:13.5, fontWeight:500 }}>
            {[['roi','ROI Calculator'],['sandbox','Live Sandbox'],['how','How It Works'],['integration','Embed SDK']].map(([id,l])=>(
              <a key={id} href="#" style={{ color:C.text500, textDecoration:'none', transition:'color 0.15s', cursor:'pointer' }}
                onClick={e=>{ e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior:'smooth', block:'start' }); }}
                onMouseEnter={e=>(e.currentTarget.style.color=C.text900)}
                onMouseLeave={e=>(e.currentTarget.style.color=C.text500)}>{l}</a>
            ))}
          </nav>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/login" style={{ fontSize:13.5, fontWeight:500, color:C.text700, textDecoration:'none', padding:'6px 12px' }}>Sign In</Link>
            <Link href="/login" style={{ ...btnD, fontSize:13.5, padding:'8px 18px', borderRadius:9 }}
              onMouseEnter={e=>{ e.currentTarget.style.background='#1E293B'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=C.text900; e.currentTarget.style.transform='translateY(0)'; }}>
              Start free trial <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════ HERO — 100vw, DentaFlow exact ══════════════ */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', width:'100%', background:C.bgPage, padding:'56px 5vw 72px', boxSizing:'border-box', overflow:'hidden' }}>

        {/* Radial dot grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(#CBD5E1 1px, transparent 1px)', backgroundSize:'24px 24px', opacity:0.5, pointerEvents:'none' }} />
        {/* Blue side strips */}
        <div style={{ position:'absolute', top:0, left:0, width:'18%', height:'100%', background:'linear-gradient(to right,rgba(147,197,253,0.22),transparent)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:0, right:0, width:'18%', height:'100%', background:'linear-gradient(to left,rgba(147,197,253,0.22),transparent)', pointerEvents:'none' }} />
        {/* Center glow */}
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:900, height:500, background:'radial-gradient(ellipse,rgba(148,163,184,0.2) 0%,transparent 65%)', pointerEvents:'none' }} />

        <div style={{ width:'100%', position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'clamp(32px,4vw,80px)', alignItems:'center' }}>

          {/* LEFT */}
          <div ref={h1.ref} style={h1.style}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:9999, background:C.emerald50, border:'1px solid rgba(167,243,208,0.7)', marginBottom:28 }}>
              <CheckCircle size={13} color={C.emerald600} />
              <span style={{ fontSize:12, fontWeight:600, color:'#047857' }}>Built for logistics fleets</span>
            </div>

            <h1 style={{ fontSize:'clamp(32px,4vw,58px)', fontWeight:800, lineHeight:1.06, letterSpacing:'-0.03em', color:C.text900, marginBottom:22 }}>
              Your <span style={{ color:C.emerald600 }}>AI logistics dispatcher</span> that captures every shipper lead, 24/7
            </h1>

            <p style={{ fontSize:'clamp(15px,1.6vw,18px)', color:C.text600, lineHeight:1.7, maxWidth:540, marginBottom:36 }}>
              The freight intelligence platform that lives on your shipper portal — answering tracking queries instantly, capturing cargo bookings, and triaging highway emergencies around the clock.
            </p>

            <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:40 }}>
              <a href="#" style={btnD}
                onClick={e=>{ e.preventDefault(); document.getElementById('sandbox')?.scrollIntoView({ behavior:'smooth' }); }}
                onMouseEnter={e=>{ e.currentTarget.style.background='#1E293B'; e.currentTarget.style.transform='translateY(-2px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background=C.text900; e.currentTarget.style.transform='translateY(0)'; }}>
                <Sparkles size={16} /> Test Live Sandbox
              </a>
              <a href="#" style={btnL}
                onClick={e=>{ e.preventDefault(); document.getElementById('roi')?.scrollIntoView({ behavior:'smooth' }); }}
                onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 12px rgba(15,23,42,0.08)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='translateY(0)'; }}>
                <Calculator size={16} /> Calculate My Losses
              </a>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:24, fontSize:13.5, color:C.text500 }}>
              <span style={{ display:'flex', alignItems:'center', gap:7 }}><Headphones size={14} color={C.emerald600}/>24/7 responses</span>
              <span style={{ display:'flex', alignItems:'center', gap:7 }}><Zap size={14} color={C.emerald600}/>Real-time tracking</span>
              <span style={{ display:'flex', alignItems:'center', gap:7 }}><CheckCircle2 size={14} color={C.emerald600}/>5-min setup</span>
            </div>
          </div>

          {/* RIGHT — browser mockup */}
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', right:0, top:-20, zIndex:10, background:C.emerald600, color:'#fff', fontSize:12, fontWeight:600, padding:'7px 16px', borderRadius:9999, boxShadow:'0 4px 12px rgba(5,150,105,0.35)', whiteSpace:'nowrap' }}>
              Try it live →
            </div>
            <div style={{ borderRadius:18, overflow:'hidden', border:`1px solid ${C.border}`, boxShadow:'0 20px 60px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06)', background:C.bgWhite }}>
              {/* macOS chrome */}
              <div style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 16px', background:C.bgGray50, borderBottom:`1px solid ${C.border}` }}>
                <span style={{ width:12, height:12, borderRadius:'50%', background:'#EF4444', display:'inline-block', flexShrink:0 }} />
                <span style={{ width:12, height:12, borderRadius:'50%', background:'#F59E0B', display:'inline-block', flexShrink:0 }} />
                <span style={{ width:12, height:12, borderRadius:'50%', background:'#22C55E', display:'inline-block', flexShrink:0 }} />
                <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
                  <div style={{ background:C.bgWhite, borderRadius:7, padding:'4px 14px', fontSize:11, color:C.text400, minWidth:200, textAlign:'center', border:`1px solid ${C.border}`, fontFamily:"'JetBrains Mono',monospace" }}>
                    shipper-portal.company.com
                  </div>
                </div>
                <div style={{ width:52 }} />
              </div>
              <div style={{ width:'100%', height:520, overflow:'hidden', background:C.bgGray50 }}>
                <iframe src="/widget-frame" style={{ width:'100%', height:'100%', border:'none' }} title="LogiFlow Sandbox" loading="eager" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ ROI CALCULATOR ══════════════ */}
      <section id="roi" style={secBorder(C.bgGray50)}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:48, alignItems:'center' }}>

          <div ref={rL.ref} style={rL.style}>
            <div style={{ fontSize:11, fontWeight:700, color:C.red600, textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:14 }}>THE COST OF DOING NOTHING</div>
            <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, color:C.text900, lineHeight:1.12, letterSpacing:'-0.025em', marginBottom:16 }}>
              This is what losing freight revenue looks like
            </h2>
            <p style={{ fontSize:16, color:C.text600, lineHeight:1.7, maxWidth:440, marginBottom:32 }}>
              Every day without an AI dispatcher, your fleet bleeds margin.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:22, marginBottom:32 }}>
              {[
                { label:'Active Vehicles',           v:fleetSize, u:'Trucks', min:5,   max:150, step:1,  c:C.text900, set:setFleetSize },
                { label:'Avg Corridor Haul',         v:avgKm,     u:'KM',    min:100, max:1200,step:25, c:C.text900, set:setAvgKm },
                { label:'Deadhead Empty %',          v:deadhead,  u:'%',     min:5,   max:45,  step:1,  c:C.red600,  set:setDeadhead },
                { label:'Dispatcher Phone Hrs/Week', v:phoneHrs,  u:'Hrs',   min:5,   max:60,  step:1,  c:C.text900, set:setPhoneHrs },
              ].map(({label,v,u,min,max,step,c,set})=>(
                <div key={label}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13.5, fontWeight:600, marginBottom:8, color:C.text700 }}>
                    <span>{label}</span><span style={{ color:c, fontFamily:"'JetBrains Mono',monospace" }}>{v} {u}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={v} onChange={e=>set(parseInt(e.target.value))}
                    style={{ width:'100%', accentColor:C.emerald600, cursor:'pointer' }} />
                </div>
              ))}
            </div>
            <a href="/login" style={{ ...btnD, background:C.red600 }}
              onMouseEnter={e=>{ e.currentTarget.style.background='#B91C1C'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background=C.red600; e.currentTarget.style.transform='translateY(0)'; }}>
              Stop the losses <ArrowRight size={15} />
            </a>
          </div>

          {/* Receipt card */}
          <div ref={rR.ref} style={rR.style}>
            <div style={{ position:'relative', maxWidth:420, margin:'0 auto' }}>
              <div style={{ position:'absolute', bottom:-8, left:10, right:10, height:16, background:C.border, borderRadius:'0 0 14px 14px' }} />
              <div style={{ background:C.bgWhite, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden', boxShadow:'0 4px 24px rgba(15,23,42,0.08)' }}>
                <div style={{ height:12, background:`repeating-linear-gradient(90deg,${C.bgGray50} 0,${C.bgGray50} 6px,${C.bgWhite} 6px,${C.bgWhite} 12px)` }} />
                <div style={{ padding:'22px 28px 28px' }}>
                  <div style={{ textAlign:'center', marginBottom:20 }}>
                    <div style={{ fontSize:10, fontWeight:800, color:C.text400, textTransform:'uppercase', letterSpacing:'2.5px', marginBottom:3 }}>Fleet Efficiency Statement</div>
                  </div>
                  <div style={{ borderTop:`1px dashed ${C.border300}`, marginBottom:18 }} />
                  <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:18 }}>
                    {[
                      ['Missed shipper calls ×3/day', Math.round(calc.laborLoss/30*0.5)],
                      [`Empty deadhead ×${Math.max(1,Math.round(calc.deadKm/300))}/day`, Math.round(calc.fuelLoss/30)],
                      ['Dispatcher tracking dwell', Math.round(calc.laborLoss/30*0.5)],
                      ['After-hours bookings lost', Math.round(calc.total/30*0.28)],
                    ].map(([l,v])=>(
                      <div key={l as string} style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                        <span style={{ fontSize:13.5, color:C.text600 }}>{l as string}</span>
                        <span style={{ flex:1, borderBottom:`1px dotted ${C.border}`, marginBottom:3 }} />
                        <span suppressHydrationWarning style={{ fontSize:13.5, fontWeight:700, color:C.red600, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>−₹{fmt(v as number)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop:`1px dashed ${C.border300}`, marginBottom:16 }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4 }}>
                    <span style={{ fontSize:12.5, fontWeight:700, color:C.text700, textTransform:'uppercase', letterSpacing:'0.6px' }}>Daily Total</span>
                    <span suppressHydrationWarning style={{ fontSize:22, fontWeight:800, color:C.red600, fontFamily:"'JetBrains Mono',monospace" }}>−₹{fmt(calc.total/30)}</span>
                  </div>
                  <div style={{ background:C.red100, borderRadius:12, padding:'14px 18px', textAlign:'center', marginBottom:18 }}>
                    <div style={{ fontSize:10.5, color:C.red600, textTransform:'uppercase', letterSpacing:'1.2px', marginBottom:5 }}>Projected Annual Loss</div>
                    <div suppressHydrationWarning style={{ fontSize:30, fontWeight:800, color:C.red600, fontFamily:"'JetBrains Mono',monospace" }}>₹{fmt(calc.total*12)}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                    <span style={{ fontSize:14, color:C.border300 }}>✂</span>
                    <div style={{ flex:1, borderTop:`1px dashed ${C.border300}` }} />
                    <span style={{ fontSize:14, color:C.border300, transform:'scaleX(-1)', display:'inline-block' }}>✂</span>
                  </div>
                  <div style={{ textAlign:'center', fontSize:14, color:C.text500 }}>
                    Or fix it for <span suppressHydrationWarning style={{ fontWeight:700, color:C.emerald600 }}>₹{fmt(2499)}/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ PAIN POINTS ══════════════ */}
      <section style={sec(C.bgGray100)}>
        <div ref={pH.ref} style={{ ...pH.style, textAlign:'center', marginBottom:60 }}>
          <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, color:C.text900, letterSpacing:'-0.025em', marginBottom:14 }}>Your dispatch operation has a problem</h2>
          <p style={{ fontSize:16, color:C.text600 }}>Three pain points every freight fleet knows too well</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {pains.map((p,i)=>{
            const rv=[p1,p2,p3][i]; const {Icon}=p;
            return (
              <div key={i} ref={rv.ref} style={{ ...rv.style, position:'relative' }}>
                <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', width:13, height:13, borderRadius:'50%', background:p.dot, boxShadow:`0 0 0 4px ${C.bgGray100}`, zIndex:2 }} className="hide-mobile"/>
                <div style={{ marginTop:14, background:p.bg, borderRadius:20, padding:'28px', transition:'transform 0.25s, box-shadow 0.25s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(15,23,42,0.1)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.55)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                    <Icon size={22} color={p.iconC} />
                  </div>
                  <h3 style={{ fontSize:18, fontWeight:700, color:C.text900, marginBottom:10 }}>{p.title}</h3>
                  <p style={{ fontSize:14, color:C.text600, lineHeight:1.65, marginBottom:16 }}>{p.prob}</p>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <CheckCircle size={14} color={C.emerald600} style={{ flexShrink:0, marginTop:3 }} />
                    <p style={{ fontSize:13.5, color:C.text600, lineHeight:1.6, margin:0 }}>{p.sol}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how" style={secBorder(C.bgWhite)}>
        <div ref={hwH.ref} style={{ ...hwH.style, textAlign:'center', marginBottom:60 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.emerald600, textTransform:'uppercase', letterSpacing:'1.4px', marginBottom:12 }}>LOGIFLOW</div>
          <h2 style={{ fontSize:'clamp(24px,3vw,40px)', fontWeight:800, color:C.text900, letterSpacing:'-0.025em' }}>How your AI dispatcher works</h2>
        </div>

        <div ref={tlRef} className="timeline-desktop" style={{ position:'relative', maxWidth:860, margin:'0 auto' }}>
          <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:2, background:C.border, transform:'translateX(-1px)' }} />
          <div style={{ position:'absolute', left:'50%', top:0, width:2, transform:'translateX(-1px)', zIndex:1, height:`${timelinePct}%`, background:'linear-gradient(180deg,#2563EB,#F43F5E,#F59E0B,#10B981)', transition:'height 0.1s ease-out' }} />
          <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', gap:52 }}>
            {steps.map((s,i)=>{
              const rv=sRevs[i]; const {Icon}=s; const isL=s.side==='L';
              const isPassed = timelinePct >= [10, 35, 62, 88][i];
              const card=(
                <div style={{
                  background:C.bgWhite,
                  border: isPassed ? `1.5px solid ${s.c}88` : `1px solid ${C.border}`,
                  borderRadius:16,
                  padding:'20px 24px',
                  maxWidth:320,
                  boxShadow: isPassed ? `0 8px 24px rgba(15,23,42,0.1), 0 0 0 1px ${s.c}22` : '0 2px 10px rgba(15,23,42,0.06)',
                  transform: isPassed ? 'scale(1.02)' : 'scale(1)',
                  transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                  onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 10px 28px rgba(15,23,42,0.14)'; e.currentTarget.style.transform='translateY(-2px) scale(1.02)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.boxShadow=isPassed ? `0 8px 24px rgba(15,23,42,0.1), 0 0 0 1px ${s.c}22` : '0 2px 10px rgba(15,23,42,0.06)'; e.currentTarget.style.transform=isPassed ? 'scale(1.02)' : 'scale(1)'; }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${s.c}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={19} color={s.c} />
                    </div>
                    <div>
                      <span style={{ display:'inline-block', fontSize:9.5, fontWeight:800, color:'#fff', background:s.c, padding:'2px 8px', borderRadius:5, marginBottom:5, letterSpacing:'0.4px' }}>STEP {s.n}</span>
                      <div style={{ fontSize:15, fontWeight:700, color:C.text900 }}>{s.title}</div>
                      <div style={{ fontSize:13, color:C.text500, marginTop:4, lineHeight:1.55 }}>{s.desc}</div>
                    </div>
                  </div>
                </div>
              );
              return (
                <div key={s.n} ref={rv.ref} style={{ ...rv.style, display:'flex', alignItems:'center' }}>
                  <div style={{ width:'calc(50% - 36px)', flexShrink:0, display:'flex', justifyContent:'flex-end', paddingRight:8 }}>{isL?card:null}</div>
                  <div style={{ width:72, flexShrink:0, display:'flex', justifyContent:'center' }}>
                    <div style={{
                      width:36,
                      height:36,
                      borderRadius:'50%',
                      background: isPassed ? s.c : '#E2E8F0',
                      color: isPassed ? '#fff' : '#64748B',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center',
                      fontSize:12,
                      fontWeight:800,
                      transform: isPassed ? 'scale(1.15)' : 'scale(1)',
                      transition:'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isPassed
                        ? `0 0 0 7px rgba(255,255,255,0.95), 0 0 0 11px ${s.c}40, 0 8px 18px ${s.c}30`
                        : `0 0 0 5px rgba(255,255,255,0.9), 0 0 0 7px rgba(226,232,240,0.6)`
                    }}>
                      {parseInt(s.n)}
                    </div>
                  </div>
                  <div style={{ width:'calc(50% - 36px)', flexShrink:0, paddingLeft:8 }}>{!isL?card:null}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="timeline-mobile" style={{ position:'relative' }}>
          <div style={{ position:'absolute', left:16, top:0, bottom:0, width:2, background:C.border }} />
          <div style={{ position:'absolute', left:16, top:0, width:2, height:`${timelinePct}%`, background:'linear-gradient(180deg,#2563EB,#F43F5E,#F59E0B,#10B981)', transition:'height 0.1s ease-out' }} />
          <div style={{ display:'flex', flexDirection:'column', gap:22, paddingLeft:48 }}>
            {steps.map((s, i)=>{
              const {Icon}=s;
              const isPassed = timelinePct >= [10, 35, 62, 88][i];
              return (
                <div key={s.n} style={{ position:'relative' }}>
                  <div style={{
                    position:'absolute', left:-42, top:10, width:24, height:24, borderRadius:'50%',
                    background: isPassed ? s.c : '#E2E8F0',
                    color: isPassed ? '#fff' : '#64748B',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800,
                    boxShadow: isPassed ? `0 0 0 4px ${s.c}30` : `0 0 0 3px ${C.bgWhite}`,
                    transition:'all 0.3s ease'
                  }}>
                    {parseInt(s.n)}
                  </div>
                  <div style={{
                    background:C.bgWhite,
                    border: isPassed ? `1.5px solid ${s.c}70` : `1px solid ${C.border}`,
                    borderRadius:12, padding:'14px 16px',
                    boxShadow: isPassed ? '0 4px 16px rgba(15,23,42,0.08)' : 'none',
                    transition:'all 0.3s ease'
                  }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                      <div style={{ width:28, height:28, borderRadius:7, background:`${s.c}14`, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={14} color={s.c}/></div>
                      <span style={{ fontSize:9.5, fontWeight:700, color:'#fff', background:s.c, padding:'2px 7px', borderRadius:4 }}>STEP {s.n}</span>
                    </div>
                    <div style={{ fontSize:14.5, fontWeight:700, color:C.text900, marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:13, color:C.text500, lineHeight:1.55 }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════ SANDBOX ══════════════ */}
      <section id="sandbox" style={secBorder(C.bgGray50)}>
        <div ref={sbH.ref} style={{ ...sbH.style, textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#2563EB', textTransform:'uppercase', letterSpacing:'1.4px', marginBottom:12 }}>LIVE DEMO</div>
          <h2 style={{ fontSize:'clamp(22px,3vw,36px)', fontWeight:800, color:C.text900, letterSpacing:'-0.025em' }}>Test the Live Sandbox Copilot</h2>
          <p style={{ fontSize:15, color:C.text600, maxWidth:560, margin:'12px auto 0', lineHeight:1.65 }}>Simulates a shipper looking up loads or requesting lane quotes. Try live interactions below.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:28, alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { Icon:Radio,         c:'#D97706', bg:'#FEF3C7', l:'1. Live Telematics Track & Trace', d:'Enter order ID. AI returns live speed, corridor ETA, and geofence status.' },
              { Icon:Calculator,    c:'#059669', bg:'#D1FAE5', l:'2. Instant Spot Rate Quotation',   d:'Dynamic pricing by corridor and payload with 18% GST breakdowns.' },
              { Icon:AlertTriangle, c:'#DC2626', bg:'#FEE2E2', l:'3. Emergency Bypass Protocol',     d:'Breakdowns or reefer alarms trigger high-priority roadside dispatch.' },
              { Icon:Layers,        c:'#2563EB', bg:'#DBEAFE', l:'4. 1-Click CRM Lead Allocation',   d:'Every booking syncs to Shipper Leads CRM — ready for one-click dispatch.' },
            ].map(({Icon,c,bg,l,d})=>(
              <div key={l} style={{ background:bg, borderRadius:16, padding:'18px 20px', transition:'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(15,23,42,0.1)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, color:c, fontWeight:700, fontSize:13.5, marginBottom:7 }}><Icon size={15}/>{l}</div>
                <p style={{ fontSize:13, color:C.text600, lineHeight:1.6, margin:0 }}>{d}</p>
              </div>
            ))}
          </div>
          <div style={{ background:C.bgWhite, border:`1px solid ${C.border}`, borderRadius:20, padding:14, boxShadow:'0 20px 60px rgba(15,23,42,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
              <span style={{ width:11, height:11, borderRadius:'50%', background:'#EF4444', display:'inline-block' }}/>
              <span style={{ width:11, height:11, borderRadius:'50%', background:'#F59E0B', display:'inline-block' }}/>
              <span style={{ width:11, height:11, borderRadius:'50%', background:'#22C55E', display:'inline-block' }}/>
              <div style={{ flex:1, background:C.bgGray50, borderRadius:6, padding:'4px 12px', fontSize:11, color:C.text400, textAlign:'center', fontFamily:"'JetBrains Mono',monospace", border:`1px solid ${C.border}` }}>shipper-portal.company.com/track</div>
            </div>
            <div style={{ width:'100%', height:520, borderRadius:12, overflow:'hidden', border:`1px solid ${C.border}` }}>
              <iframe src="/widget-frame" style={{ width:'100%', height:'100%', border:'none' }} title="LogiFlow Sandbox"/>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ EMBED / INTEGRATION ══════════════ */}
      <section id="integration" style={secBorder(C.bgWhite)}>
        <div ref={emR.ref} style={{ ...emR.style, textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.emerald600, textTransform:'uppercase', letterSpacing:'1.4px', marginBottom:12 }}>ZERO-CONFLICT INTEGRATION</div>
          <h2 style={{ fontSize:'clamp(22px,3vw,32px)', fontWeight:800, color:C.text900, letterSpacing:'-0.025em', marginBottom:14 }}>Embed on Any Shipper Portal in 30 Seconds</h2>
          <p style={{ fontSize:15, color:C.text600, maxWidth:560, margin:'0 auto 28px', lineHeight:1.65 }}>
            Lightweight vanilla JS loader <span style={{ fontWeight:700, color:C.text900 }}>&lt;5KB</span> — works across WordPress, SAP, Webflow without CSS pollution.
          </p>
          <div style={{ background:C.bgDark, borderRadius:16, padding:'20px 28px', textAlign:'left', fontFamily:"'JetBrains Mono',monospace", fontSize:14, color:'#7DD3FC', overflowX:'auto', maxWidth:800, margin:'0 auto', boxShadow:'0 4px 20px rgba(15,23,42,0.15)' }}>
            <code>{`<script src="http://localhost:3005/widget/loader.js" data-client-key="PL-CORP-9842" defer></script>`}</code>
          </div>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section style={sec(C.bgDark)}>
        <div ref={prR.ref} style={{ ...prR.style, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:32 }}>
          <div style={{ background:C.bgDark2, borderRadius:22, padding:'36px 32px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', color:'#34D399', fontSize:11.5, fontWeight:600, padding:'5px 13px', borderRadius:9999, marginBottom:26 }}>🎁 Professional Plan — 20-day free trial</div>
            <div style={{ fontSize:'clamp(38px,4vw,52px)', fontWeight:800, color:'#fff', lineHeight:1, marginBottom:8 }}>₹2,499<span style={{ fontSize:20, color:'#64748B', fontWeight:400 }}>/month</span></div>
            <div style={{ fontSize:14, color:'#64748B', marginBottom:32 }}>Free for 20 days, then ₹2,499/month. Cancel anytime.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {['Unlimited AI conversations','Live telematics queries','Lead capture & CRM sync','After-hours coverage','Custom branding & tone','Dashboard & analytics','Embed widget SDK','Priority support'].map(f=>(
                <div key={f} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(30,41,59,0.8)', border:'1px solid rgba(51,65,85,0.8)', borderRadius:12, padding:'11px 14px' }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:'rgba(16,185,129,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><CheckCircle size={13} color="#10B981"/></div>
                  <span style={{ fontSize:12.5, color:'#CBD5E1', lineHeight:1.3 }}>{f}</span>
                </div>
              ))}
            </div>
            <Link href="/login" style={{ marginTop:28, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'15px', borderRadius:14, background:C.emerald600, color:'#fff', fontWeight:700, fontSize:15, textDecoration:'none', boxShadow:'0 4px 18px rgba(5,150,105,0.35)', transition:'transform 0.2s, background 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.background=C.emerald700; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.background=C.emerald600; }}>
              Start your free trial <ArrowRight size={16}/>
            </Link>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div style={{ background:C.bgDark2, borderRadius:20, padding:'28px 26px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:20 }}>
                {[
                  ['Annual losses without AI', `₹${fmt(calc.total*12)}`, '#F87171', true],
                  ['LogiFlow Pro annual cost',  `₹${fmt(2499*12)}`,      '#FBBF24', false],
                  ['Your annual savings',       `₹${fmt(calc.saved)}`,   '#34D399', false],
                ].map(([l,v,c,s])=>(
                  <div key={l as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:14, color:'#94A3B8' }}>{l as string}</span>
                    <span suppressHydrationWarning style={{ fontSize:15, fontWeight:800, color:c as string, fontFamily:"'JetBrains Mono',monospace", textDecoration:(s as boolean)?'line-through':'none', opacity:(s as boolean)?0.5:1 }}>{v as string}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:'1px solid rgba(51,65,85,0.6)', paddingTop:18 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, background:'rgba(16,185,129,0.08)', borderRadius:12, padding:'14px 16px' }}>
                  <TrendingUp size={18} color="#10B981" style={{ flexShrink:0, marginTop:2 }} />
                  <div>
                    <div style={{ fontSize:14.5, fontWeight:700, color:'#fff' }}>A fraction of a dispatcher's salary</div>
                    <div style={{ fontSize:12.5, color:'#64748B', marginTop:4 }}>Compare to ₹40,000/month dispatcher cost.</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background:C.bgDark2, borderRadius:20, padding:'26px' }}>
              <div style={{ fontSize:10.5, fontWeight:800, color:'#475569', textTransform:'uppercase', letterSpacing:'1.8px', marginBottom:18 }}>HOW THE FREE TRIAL WORKS</div>
              {['All features unlocked — nothing held back','No setup fees. Works in under 5 minutes','Cancel anytime before trial ends — pay ₹0','After 20 days, just ₹2,499/month. No contracts'].map(t=>(
                <div key={t} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:14 }}>
                  <CheckCircle2 size={16} color="#10B981" style={{ flexShrink:0, marginTop:2 }} />
                  <span style={{ fontSize:14, color:'#CBD5E1', lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section style={sec(C.bgDark, { padding:'0 5vw 80px' })}>
        <div ref={ctR.ref} style={ctR.style}>
          <div style={{ position:'relative', background:C.emerald600, borderRadius:24, padding:'64px 5vw', textAlign:'center', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize:'20px 20px', pointerEvents:'none' }} />
            <div style={{ position:'relative', zIndex:1 }}>
              <h2 style={{ fontSize:'clamp(24px,3vw,38px)', fontWeight:800, color:'#fff', marginBottom:16, letterSpacing:'-0.025em' }}>Ready to automate your freight dispatch?</h2>
              <p style={{ fontSize:16, color:'rgba(255,255,255,0.82)', marginBottom:36, maxWidth:460, margin:'0 auto 36px', lineHeight:1.65 }}>Start managing shipments, drivers, and routes with an AI copilot that never sleeps.</p>
              <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:14 }}>
                <Link href="/login" style={{ padding:'13px 28px', borderRadius:12, background:'#fff', color:C.emerald700, fontWeight:700, fontSize:15, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px rgba(0,0,0,0.15)', transition:'transform 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='translateY(-2px)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='translateY(0)')}>
                  Launch LMS Portal <ArrowRight size={16}/>
                </Link>
                <a href="#sandbox" style={{ padding:'13px 28px', borderRadius:12, background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.35)', color:'#fff', fontWeight:600, fontSize:15, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, transition:'background 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.22)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.15)')}>
                  Try Sandbox First
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer style={{ width:'100%', padding:'36px 5vw', background:'#020617', borderTop:'1px solid rgba(30,41,59,0.8)', fontSize:13.5, color:'#475569', boxSizing:'border-box' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#F59E0B,#D97706)', display:'flex', alignItems:'center', justifyContent:'center' }}><Truck size={14} color="#fff"/></div>
            <span style={{ color:'#64748B' }}>© 2026 Precision Logistics System. All rights reserved.</span>
          </div>
          <div style={{ display:'flex', gap:24 }}>
            {[['Admin LMS Login','/login'],['Standalone Widget','/widget-frame']].map(([l,h])=>(
              <Link key={h} href={h} style={{ color:'#475569', textDecoration:'none', transition:'color 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#fff')}
                onMouseLeave={e=>(e.currentTarget.style.color='#475569')}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
