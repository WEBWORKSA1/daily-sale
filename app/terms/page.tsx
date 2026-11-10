import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Terms of Use', description: 'The terms that govern your use of daily.sale, the free Canadian grocery flyer comparison site.' };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" intro="By using daily.sale you agree to these terms. If you do not agree, please do not use the site.">
      <h2>1. What daily.sale is</h2>
      <p>daily.sale is a free information service that compiles prices from publicly available grocery flyers and ranks the lowest advertised price per item in your area. We are not a retailer, we do not sell groceries, and we are not affiliated with any store we list.</p>

      <h2>2. Price accuracy</h2>
      <p>Flyer prices are matched automatically and refreshed daily. Prices, sizes, availability, limits and validity dates are set by each retailer and can change, vary by location, or contain errors. <strong>Always confirm the price in store or in the retailer’s own flyer before you buy.</strong> daily.sale is provided “as is” without warranties of any kind, and we are not liable for any loss arising from reliance on prices shown. If you spot an error, please <Link href="/report">report it</Link>.</p>

      <h2>3. Acceptable use</h2>
      <ul>
        <li>Do not scrape, mirror or bulk-download the site, or resell our rankings, without a written data-licensing agreement.</li>
        <li>Do not interfere with the site, attempt to access non-public areas, or submit spam, false reports or malicious content through our forms.</li>
        <li>Do not click our ads artificially or encourage others to do so.</li>
      </ul>

      <h2>4. Intellectual property</h2>
      <p>The daily.sale name, logo, site design, text, guides, rankings and data compilation are owned by daily.sale and protected by Canadian and international copyright and trademark law. Retailer names and logos belong to their owners and are used for identification only. See <Link href="/legal">Trademark &amp; Copyright</Link>.</p>

      <h2>5. Submissions</h2>
      <p>When you submit a price report, comment or idea, you grant us a royalty-free, perpetual licence to use it to improve the service. Do not submit anything you do not have the right to share.</p>

      <h2>6. Contests</h2>
      <p>Contests are governed by their official rules posted on the <Link href="/contests">Contests</Link> page, which prevail over these terms for that contest.</p>

      <h2>7. Donations and sponsorships</h2>
      <p>Donations are voluntary, non-refundable except where required by law, and not tax-deductible. Sponsorships and advertising are governed by a separate written agreement.</p>

      <h2>8. Third-party links and ads</h2>
      <p>The site contains links and advertisements from third parties. We are not responsible for their content, products or privacy practices. Some links are affiliate links — see our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.</p>

      <h2>9. Limitation of liability</h2>
      <p>To the maximum extent permitted by law, daily.sale is not liable for indirect, incidental or consequential damages, and our total liability for any claim is limited to CAD $100.</p>

      <h2>10. Governing law</h2>
      <p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable there. Courts in Ontario have exclusive jurisdiction.</p>

      <h2>11. Changes</h2>
      <p>We may update these terms by posting a new version here. Continued use after changes means you accept them.</p>
    </LegalPage>
  );
}
