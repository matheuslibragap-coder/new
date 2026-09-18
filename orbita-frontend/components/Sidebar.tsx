'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { href: '/agenda', label: 'Agenda', icon: '◔' },
  { href: '/notes', label: 'Notas', icon: '✎' },
  { href: '/focus', label: 'Foco', icon: '◎' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <div className="ring" />
        <span>Órbita</span>
      </div>

      <nav className="sidenav">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`navitem${active ? ' active' : ''}`}>
              <span className="ic">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidefoot">
        {user && (
          <div className="side-user">
            <b>{user.name}</b>
            {user.email}
          </div>
        )}
        <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
          <span className="ic">↩</span>
          <span className="label">Sair</span>
        </button>
      </div>
    </aside>
  );
}
