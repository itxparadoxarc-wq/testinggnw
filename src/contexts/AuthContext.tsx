import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// Initialize auth on mount
export const AuthInit: React.FC = () => {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
};

export const useAuth = useAuthStore;
