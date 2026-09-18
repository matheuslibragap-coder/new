'use client';

import { useEffect, useState } from 'react';

export function Topbar({ title }: { title: string }) {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    try {
      const raw = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      setDateStr(raw.charAt(0).toUpperCase() + raw.slice(1));
    } catch {
      setDateStr('');
    }
  }, []);

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="sub">{dateStr}</div>
      </div>
    </header>
  );
}
