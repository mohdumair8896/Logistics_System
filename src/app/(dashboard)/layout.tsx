'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import LogiFlowChatbot from '@/components/layout/LogiFlowChatbot';
import { startLiveNotificationFeed, stopLiveNotificationFeed } from '@/lib/liveNotifications';

const emptySubscribe = () => () => {};

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Fleet Operations Dashboard', subtitle: 'Live logistics intelligence & hub status' },
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
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile drawer when route changes (React-idiomatic render-time state adjustment)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileSidebarOpen(false);
  }

  useEffect(() => {
    if (mounted && !isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router, mounted]);

  // Start live operational notification feed while dashboard is active
  useEffect(() => {
    if (mounted && isLoggedIn) {
      startLiveNotificationFeed(45000);
    }
    return () => {
      stopLiveNotificationFeed();
    };
  }, [mounted, isLoggedIn]);

  if (!mounted || !isLoggedIn) return null;

  const info = pageTitles[pathname] || { title: 'LogiFlow', subtitle: 'Logistics Management' };

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Sidebar with Drawer Support */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
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
      <LogiFlowChatbot />
    </div>
  );
}
