import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CheapCart — Today\'s Cheapest Groceries',
  description: 'For the 100 things you actually buy, where is the cheapest store today? Postal-code-level price comparison across Canadian grocers.',
  openGraph: {
    title: 'CheapCart',
    description: 'Cheapest grocery prices, today, by postal code.'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
