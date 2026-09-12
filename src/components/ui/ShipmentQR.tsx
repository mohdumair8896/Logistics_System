'use client';
/**
 * ShipmentQR — inspired by watermelon.sh show-qr
 *
 * Expandable QR code widget. Collapsed = small pill button.
 * Expanded = QR code + copy-link button with animated spring transitions.
 *
 * Usage:
 *   <ShipmentQR value="https://logisticsedge.app/track/TR-001" label="Track Shipment" />
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Link, QrCode, Check } from 'lucide-react';

interface ShipmentQRProps {
  value: string;
  label?: string;
  size?: number;
}

export function ShipmentQR({ value, label = 'Show QR', size = 160 }: ShipmentQRProps) {
  const [open, setOpen]       = useState(false);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => setCopied(true));
  };

  return (
    <MotionConfig transition={{ type: 'spring', bounce: 0.22, visualDuration: 0.32 }}>
      <motion.div
        animate={{
          width:  open ? size + 40 : 148,
          height: open ? size + 100 : 40,
        }}
        style={{
          overflow: 'hidden',
          borderRadius: open ? 16 : 20,
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          boxShadow: open ? '0 8px 32px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!open ? (
            /* Collapsed pill */
            <motion.button
              key="pill"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)' }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                height: 40,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-mid)',
                padding: '0 16px',
              }}
            >
              <QrCode size={15} color="var(--brand)" />
              {label}
            </motion.button>
          ) : (
            /* Expanded QR panel */
            <motion.div
              key="qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                padding: 16,
              }}
            >
              {/* QR code */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 1.1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  width: size,
                  height: size,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: '#fff',
                  padding: 8,
                }}
              >
                <QRCodeSVG
                  value={value}
                  size={size - 24}
                  level="H"
                  fgColor="var(--text-high)"
                  bgColor="transparent"
                  style={{ width: '100%', height: '100%' }}
                />
              </motion.div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 20,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: copied ? 'var(--status-done)' : 'var(--text-mid)',
                    transition: 'color 0.2s',
                  }}
                >
                  {copied ? <Check size={13} /> : <Link size={13} />}
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={copied ? 'copied' : 'copy'}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      {copied ? 'Copied!' : 'Copy link'}
                    </motion.span>
                  </AnimatePresence>
                </button>

                <button
                  onClick={() => { setOpen(false); setCopied(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 34,
                    height: 34,
                    borderRadius: 20,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    cursor: 'pointer',
                    color: 'var(--icon)',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
