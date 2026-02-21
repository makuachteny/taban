'use client';

import { useState, useCallback } from 'react';
import type { UserRole } from '../db-types';

interface AuthUser {
  _id: string;
  username: string;
  name: string;
  role: UserRole;
  hospitalId?: string;
  hospitalName?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username: string, password: string, hospitalId?: string): Promise<AuthUser | null> => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, hospitalId }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        return data.user;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // OK offline
    }
    setUser(null);
  }, []);

  const checkSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          return data.user;
        }
      }
    } catch {
      // OK offline
    }
    return null;
  }, []);

  return { user, loading, login, logout, checkSession, setUser };
}
