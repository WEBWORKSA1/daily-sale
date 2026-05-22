import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'daily.sale — Spend less on the things you buy',
  description: 'A growing collection of tools that find you the best price. Starting with grocery deals in St. Catharines.',
  openGraph: {
    title: 'daily.sale',
    description: 'Spend less on the things you buy. Weekly grocery deals, ranked by store.'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
