'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const isLoggedIn = useStore(s => s.isLoggedIn);
  useEffect(() => {
    if (isLoggedIn) router.replace('/dashboard');
    else router.replace('/login');
  }, [isLoggedIn, router]);
  return null;
}
