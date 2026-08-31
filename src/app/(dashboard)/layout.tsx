'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DemoTourBar from '@/components/layout/DemoTourBar';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Fleet Operations Dashboard', subtitle: 'Live logistics intelligence & hub status' },
  '/vehicles': { title: 'Fleet Roster & Telematics', subtitle: 'Master vehicle status, maintenance & live load' },
  '/drivers': { title: 'Driver Management & Credentials', subtitle: 'Personnel roster, licensing & verification' },
  '/orders': { title: 'Order Intake & Dispatch Queue', subtitle: 'Customer shipments and scheduling' },
  '/allocation': { title: 'Smart Vehicle Allocation', subtitle: 'AI load matching and fleet recommendation' },
  '/warehouse': { title: 'Warehouse Staging & Loading Manifest', subtitle: 'Bay assignment, barcode scan & weight distribution' },
  '/trips': { title: 'Dispatched Trips & Route Planning', subtitle: 'Active transit routes and corridor monitoring' },
  '/tracking': { title: 'Live Telematics & Geofence Tracking', subtitle: 'Real-time vehicle HUD, speed & corridor status' },
  '/delivery': { title: 'Electronic Proof of Delivery (e-POD)', subtitle: 'Digital signature capture & goods verification' },
  '/invoices': { title: 'Automated GST Billing & Invoicing', subtitle: 'Freight settlement & tax invoice generation' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router, mounted]);

  if (!mounted || !isLoggedIn) return null;

  const info = pageTitles[pathname] || { title: 'Precision Logistics System', subtitle: 'Logistics Management' };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={info.title} subtitle={info.subtitle} />
        <DemoTourBar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
