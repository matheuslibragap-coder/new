import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Órbita',
  description: 'Organização e produtividade para quem estuda e trabalha ao mesmo tempo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <div id="app-root">{children}</div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
