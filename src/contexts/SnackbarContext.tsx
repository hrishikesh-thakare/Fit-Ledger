'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SnackbarMessage {
  message: string;
  severity?: 'success' | 'error' | 'warning' | 'info';
  action?: ReactNode;
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (params: SnackbarMessage) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarState extends SnackbarMessage {
  open: boolean;
  key: number;
}

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
    key: 0,
  });

  const showSnackbar = ({ message, severity = 'info', action, duration = 4000 }: SnackbarMessage) => {
    setSnackbar({
      open: true,
      message,
      severity,
      action,
      duration,
      key: Date.now(),
    });
  };

  const handleClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <GlobalSnackbar snackbar={snackbar} onClose={handleClose} />
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within SnackbarProvider');
  }
  return context;
}

// Import GlobalSnackbar component
import GlobalSnackbar from '@/components/GlobalSnackbar';
