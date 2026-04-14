import { createContext, useContext } from 'react';
export const TenantContext = createContext(null);
export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantContext.Provider');
  return ctx;
}
