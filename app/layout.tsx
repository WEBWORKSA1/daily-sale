import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SponsorshipBar } from '@/components/SponsorshipBar';
import { CookieNotice } from '@/components/CookieNotice';

const ADSENSE_CLIENT = 'ca-pub-6620975821265271';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  metadataBase: new URL('https://daily.sale'),
  title: {
    default: 'daily.sale — This week’s best grocery deals, ranked across every store',
    template: '%s · daily.sale'
  },
  description: 'Compare this week’s flyer prices across No Frills, Walmart, Food Basics, FreshCo, Sobeys, Giant Tiger and Zehrs. Refreshed automatically every day. Free and independent — St. Catharines first, growing across Canada.',
  keywords: ['grocery flyers', 'weekly deals', 'price comparison', 'Canada grocery', 'No Frills flyer', 'Walmart flyer', 'Food Basics flyer', 'FreshCo flyer', 'Sobeys flyer', 'Giant Tiger flyer', 'Zehrs flyer', 'St. Catharines flyers', 'cheapest grocery store', 'save on groceries'],
  applicationName: 'daily.sale',
  authors: [{ name: 'daily.sale' }],
  creator: 'daily.sale',
  publisher: 'daily.sale',
  openGraph: {
    type: 'website',
    siteName: 'daily.sale',
    title: 'daily.sale — This week’s best grocery deals, ranked',
    description: 'Every grocer’s flyer prices in one place, ranked cheapest first. Refreshed daily. Free.',
    url: 'https://daily.sale',
    locale: 'en_CA'
  },
  twitter: { card: 'summary_large_image', title: 'daily.sale', description: 'This week’s grocery deals, ranked by store.' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  other: { 'google-adsense-account': ADSENSE_CLIENT },
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {})
};

export const viewport: Viewport = { themeColor: '#0f172a', width: 'device-width', initialScale: 1 };

const LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'daily.sale',
    url: 'https://daily.sale',
    logo: 'https://daily.sale/icon.svg',
    description: 'Independent grocery flyer deal aggregator covering Canadian grocers.'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'daily.sale',
    url: 'https://daily.sale',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://daily.sale/deals?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <head>
        {/* Google AdSense — plain tag so it is present in the server-rendered HTML for site verification */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
        {GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`
              }}
            />
          </>
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      </head>
      <body className="min-h-screen flex flex-col paper-texture">
        <SponsorshipBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieNotice />
      </body>
    </html>
  );
}
