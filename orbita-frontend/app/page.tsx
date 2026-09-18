'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? '/agenda' : '/login');
  }, [isLoading, user, router]);

  return <div className="center-loading">Carregando a Orbyta…</div>;
}
