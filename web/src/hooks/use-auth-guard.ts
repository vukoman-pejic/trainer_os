'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getRole,
  getToken,
  mustChangePassword,
  UserRole,
} from '../lib/auth';

export function useAuthGuard({
  requirePasswordChange = false,
  requiredRole,
}: {
  requirePasswordChange?: boolean;
  requiredRole?: UserRole;
} = {}) {
  const router = useRouter();
  const [authorized, setAuthorized] =
    useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace('/login');
      return;
    }

    const role = getRole();

    if (!role) {
      router.replace('/login');
      return;
    }

    const needsPasswordChange =
      mustChangePassword();

    if (
      needsPasswordChange &&
      !requirePasswordChange
    ) {
      router.replace('/change-password');
      return;
    }

    if (
      !needsPasswordChange &&
      requirePasswordChange
    ) {
      if (role === 'TRAINER') {
        router.replace('/dashboard');
      } else {
        router.replace('/client/dashboard');
      }
      return;
    }

    if (
      requiredRole &&
      role !== requiredRole
    ) {
      if (role === 'TRAINER') {
        router.replace('/dashboard');
      } else {
        router.replace('/client/dashboard');
      }
      return;
    }

    setAuthorized(true);
  }, [router, requirePasswordChange, requiredRole]);

  return authorized;
}