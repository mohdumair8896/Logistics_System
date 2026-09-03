'use client';
import { createContext, useContext, ReactNode } from 'react';
import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = (title: string, message?: string, type: ToastType = 'success') => {
    if (type === 'success') {
      sonnerToast.success(title, { description: message });
    } else if (type === 'danger') {
      sonnerToast.error(title, { description: message });
    } else if (type === 'warning') {
      sonnerToast.warning(title, { description: message });
    } else {
      sonnerToast.info(title, { description: message });
    }
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: (title: string, message?: string, type: ToastType = 'success') => {
        if (type === 'success') sonnerToast.success(title, { description: message });
        else if (type === 'danger') sonnerToast.error(title, { description: message });
        else if (type === 'warning') sonnerToast.warning(title, { description: message });
        else sonnerToast.info(title, { description: message });
      }
    };
  }
  return context;
}

export { sonnerToast };
