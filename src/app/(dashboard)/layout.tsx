'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogisticsEdgeChatbot from '@/components/layout/LogisticsEdgeChatbot';


import { getCurrentUser } from '@/lib/useCurrentUser';

const emptySubscribe = () => () => {};

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Fleet Operations Dashboard', subtitle: 'Live logistics intelligence & hub status' },
  '/agent-ops': { title: 'AI Operations Command Center', subtitle: 'Autonomous Multi-Agent Workforce, Monday Brief & Operational Event Graph' },
  '/vehicles': { title: 'Fleet Roster & Telematics', subtitle: 'Master vehicle status, maintenance & live load' },
  '/drivers': { title: 'Driver Management & Credentials', subtitle: 'Personnel roster, licensing & verification' },
  '/orders': { title: 'Order Intake & Dispatch Queue', subtitle: 'Customer shipments and scheduling' },
  '/allocation': { title: 'Smart Vehicle Allocation', subtitle: 'Smart load matching and fleet recommendation' },
  '/warehouse': { title: 'Warehouse Staging & Loading Manifest', subtitle: 'Bay assignment, barcode scan & weight distribution' },
  '/trips': { title: 'Dispatched Trips & Route Planning', subtitle: 'Active transit routes and corridor monitoring' },
  '/tracking': { title: 'Live Telematics & Geofence Tracking', subtitle: 'Real-time vehicle HUD, speed & corridor status' },
  '/delivery': { title: 'Electronic Proof of Delivery (e-POD)', subtitle: 'Digital signature capture & goods verification' },
  '/invoices': { title: 'Automated GST Billing & Invoicing', subtitle: 'Freight settlement & tax invoice generation' },
  '/leads': { title: 'Shipper Leads & CRM', subtitle: 'Inbound enquiries, freight quotes & lead conversion' },
  '/knowledge-base': { title: 'Knowledge Base & Config', subtitle: 'Dispatcher training data & bot response library' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Close mobile drawer when route changes (React-idiomatic render-time state adjustment)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    // Load persisted collapse state
    try {
      const saved = localStorage.getItem('logisticsedge_sidebar_collapsed');
      if (saved === 'true') setIsSidebarCollapsed(true);
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => {
          const next = !prev;
          try {
            localStorage.setItem('logisticsedge_sidebar_collapsed', String(next));
          } catch {}
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('logisticsedge_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    getCurrentUser()
      .then(user => {
        if (user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          router.replace('/login');
        }
      })
      .catch(() => { setIsLoggedIn(false); router.replace('/login'); });
  }, [router]);

  if (!mounted || isLoggedIn === null) return null; // still checking session
  if (!isLoggedIn) return null; // redirect already triggered

  const info = pageTitles[pathname] || { title: 'LogisticsEdge', subtitle: 'Logistics Management' };
 
   return (
     <div className="app-layout" data-collapsed={isSidebarCollapsed}>
       {/* Mobile Drawer Backdrop */}
       <div
         className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
         onClick={() => setIsMobileSidebarOpen(false)}
       />

       {/* Sidebar with Drawer & Collapse Support */}
       <Sidebar
         isOpen={isMobileSidebarOpen}
         onClose={() => setIsMobileSidebarOpen(false)}
         isCollapsed={isSidebarCollapsed}
         onToggleCollapse={handleToggleSidebarCollapse}
       />

       <div className="main-content">
         <Header
          title={info.title}
          subtitle={info.subtitle}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="page-content">{children}</main>
      </div>

      {/* Global AI Dispatch Copilot / Chatbot */}
      <LogisticsEdgeChatbot />
    </div>
  );
}
