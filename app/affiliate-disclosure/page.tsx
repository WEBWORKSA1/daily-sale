import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Affiliate & Advertising Disclosure', description: 'How daily.sale makes money and how that is kept separate from our price rankings.' };

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage kicker="Disclosure" title="Affiliate & Advertising Disclosure" intro="daily.sale is free to use. Here is exactly how we earn money, and the firewall that keeps it out of our rankings.">
      <h2>How we make money</h2>
      <ul>
        <li><strong>Display advertising</strong> through Google AdSense. Ads are clearly labelled and placed by Google.</li>
        <li><strong>Affiliate links</strong> to some apps and services we recommend (for example cashback or coupon apps). If you sign up through these links we may earn a commission at no extra cost to you.</li>
        <li><strong>Sponsorships</strong> from brands, always labelled “Sponsored”.</li>
        <li><strong>Reader support</strong> through voluntary <Link href="/donate">donations</Link>.</li>
      </ul>
      <h2>The ranking firewall</h2>
      <p>The cheapest-store rankings are calculated automatically from flyer prices only. No retailer, advertiser, sponsor or affiliate partner can pay to change a ranking, remove a competitor, or appear higher. We do not accept placement fees from grocers.</p>
      <h2>Competition Act</h2>
      <p>We follow the Competition Bureau of Canada’s guidance on influencer and online advertising: material connections are disclosed clearly, close to the recommendation, in plain language.</p>
      <p>Read more in our <Link href="/editorial-policy">Editorial &amp; Data Policy</Link>.</p>
    </LegalPage>
  );
}
