'use client';
/**
 * useToast - thin wrapper around sonner for consistent toast API.
 * No React Context needed: sonner's toast() works anywhere client-side.
 */
import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export function useToast() {
  return {
    toast: (title: string, message?: string, type: ToastType = 'success') => {
      if (type === 'success') sonnerToast.success(title, { description: message });
      else if (type === 'danger') sonnerToast.error(title, { description: message });
      else if (type === 'warning') sonnerToast.warning(title, { description: message });
      else sonnerToast.info(title, { description: message });
    },
  };
}

// Re-export sonner directly for callers that need advanced options
export { sonnerToast };
