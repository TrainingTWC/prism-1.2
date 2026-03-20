import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { MainLayout } from '../components/layout/main-layout';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jb', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Prism Platform',
  description: 'Multi-tenant Operational Intelligence Platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} dark antialiased`} suppressHydrationWarning>
      <body className={`${jetbrainsMono.className} bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
