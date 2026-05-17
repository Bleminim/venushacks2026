/**
 * AuthContext — local auth-state bridge for Expo Go development.
 *
 * @clerk/clerk-expo v2 requires ExpoCryptoAES (expo-crypto v14+), which is not
 * bundled in Expo Go SDK 54. This context mirrors the Clerk `useAuth()` surface
 * so every screen is written against the real Clerk API shape. When you switch
 * to a development build, replace:
 *
 *   const { isSignedIn, signIn, signOut } = useAppAuth();
 *
 * with the real Clerk hooks and delete this file.
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface AuthContextValue {
  isSignedIn: boolean;
  isLoaded: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        isLoaded: true,
        signIn: () => setIsSignedIn(true),
        signOut: () => setIsSignedIn(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth must be used within <AuthProvider>');
  return ctx;
}
