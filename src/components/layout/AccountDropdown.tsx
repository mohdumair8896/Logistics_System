'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, LogOut, Radio, BookOpen } from 'lucide-react';
import { useCurrentUser, invalidateUserCache } from '@/lib/useCurrentUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';

const roleProfiles = [
  {
    role: 'Operations Director',
    email: 'admin@precisionlogistics.com',
    name: 'Alex Morgan',
    facility: 'Central Distribution Hub',
  },
  {
    role: 'Fleet Dispatcher',
    email: 'dispatch@precisionlogistics.com',
    name: 'Sam Rivera',
    facility: 'North Corridor Terminal',
  },
  {
    role: 'Compliance Officer',
    email: 'compliance@precisionlogistics.com',
    name: 'Jordan Patel',
    facility: 'West Regional Terminal',
  },
];

export function AccountDropdown() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    invalidateUserCache();
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Signed out successfully', {
      description: 'Your session has been cleared.',
      duration: 3000,
    });
    router.push('/login');
  };

  const handleSwitchAccount = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Logistics2026!' }),
      });
      if (res.ok) {
        invalidateUserCache();
        toast.success('Switched profile successfully');
        window.location.reload();
      }
    } catch {
      toast.error('Failed to switch profile');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentRole = user?.role || 'Operations Director';
  const displayName = user?.name || 'Alex Morgan';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '4px 10px 4px 6px',
          borderRadius: 10,
          background: isOpen ? 'var(--surface-2, #F3F2EF)' : 'transparent',
          border: '1px solid',
          borderColor: isOpen ? 'var(--border-mid, #D2CFC8)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
      >
        <Avatar
          size="sm"
          status="online"
          name={displayName}
        />

        <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="hidden-mobile">
          <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text-high, #141414)' }}>
            {displayName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-low, #909090)', fontWeight: 500 }}>
            {currentRole}
          </div>
        </div>

        <ChevronDown
          size={14}
          color="var(--icon, #6B7280)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 260,
              background: 'var(--surface-1, #FFFFFF)',
              border: '1px solid var(--border, #E6E4DF)',
              borderRadius: 12,
              padding: 6,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
              zIndex: 9999,
            }}
          >
            {/* Header info */}
            <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-high)' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-low)', marginTop: 2 }}>
                {user?.email || 'admin@precisionlogistics.com'}
              </div>
              <div style={{
                marginTop: 6,
                display: 'inline-block',
                padding: '2px 7px',
                borderRadius: 4,
                background: 'var(--brand-10)',
                color: 'var(--brand)',
                fontSize: 10,
                fontWeight: 700,
              }}>
                {user?.facility || 'Central Logistics Hub'}
              </div>
            </div>

            {/* Switch role section */}
            <div style={{ padding: '8px 4px 4px' }}>
              <div style={{
                padding: '4px 8px 6px',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-low)',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}>
                Switch Account / Role
              </div>

              {roleProfiles.map((profile) => {
                const isSelected = profile.role === currentRole;
                return (
                  <button
                    key={profile.role}
                    type="button"
                    onClick={async () => {
                      await handleSwitchAccount(profile.email);
                      setIsOpen(false);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 8px',
                      borderRadius: 7,
                      border: 'none',
                      background: isSelected ? 'var(--brand-10)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size="xs" name={profile.name} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-high)' }}>
                          {profile.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-low)' }}>
                          {profile.role}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={14} color="var(--brand)" />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

            {/* Quick Links */}
            <Link
              href="/tracking"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 7,
                color: 'var(--text-mid)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Radio size={14} color="var(--icon)" />
              <span>Live Telematics Stream</span>
            </Link>

            <Link
              href="/knowledge-base"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 7,
                color: 'var(--text-mid)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <BookOpen size={14} color="var(--icon)" />
              <span>SOP & Tariff Directory</span>
            </Link>

            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

            {/* Sign Out */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 7,
                border: 'none',
                background: 'transparent',
                color: 'var(--status-error, #C0392B)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--status-error-bg, rgba(192,57,43,0.08))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={14} color="var(--status-error)" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
