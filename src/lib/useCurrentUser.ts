'use client';
// ─── useCurrentUser — Real authenticated user from JWT session ────────────────
// Replaces useStore().currentUser everywhere.
// Reads from /api/auth/me which decodes the session cookie server-side.
// Deduplicates concurrent calls and caches the session in memory.

import { useState, useEffect } from 'react';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'Operations Director' | 'Fleet Dispatcher' | 'Compliance Officer';
  facility: string;
  avatar: string;
}

const FALLBACK: CurrentUser = {
  id: '',
  name: '…',
  email: '',
  role: 'Operations Director',
  facility: '',
  avatar: '?',
};

let cachedUser: CurrentUser | null = null;
let inFlightPromise: Promise<CurrentUser | null> | null = null;

export function invalidateUserCache() {
  cachedUser = null;
  inFlightPromise = null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (cachedUser) return cachedUser;
  if (!inFlightPromise) {
    inFlightPromise = fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) cachedUser = data as CurrentUser;
        return cachedUser;
      })
      .catch(() => null)
      .finally(() => {
        inFlightPromise = null;
      });
  }
  return inFlightPromise;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>(cachedUser || FALLBACK);
  const [loading, setLoading] = useState(!cachedUser);

  useEffect(() => {
    let active = true;
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }

    getCurrentUser().then((userData) => {
      if (!active) return;
      if (userData) setUser(userData);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  return { user, loading };
}
