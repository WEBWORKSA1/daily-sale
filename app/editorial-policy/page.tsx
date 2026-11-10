import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Editorial & Data Policy', description: 'How daily.sale collects flyer prices, matches products, ranks stores and corrects errors.' };

export default function EditorialPolicyPage() {
  return (
    <LegalPage kicker="Methodology" title="Editorial & Data Policy" intro="Shoppers decide where to spend real money based on our rankings, so we document exactly how they are produced.">
      <h2>1. Where prices come from</h2>
      <p>Every day an automated job reads the current digital weekly flyers that grocers publish for each tracked store, plus retailer-published online prices where available. Each price keeps its source and the flyer’s validity date.</p>
      <h2>2. Matching items</h2>
      <p>We track a fixed basket of 100 everyday grocery items (milk, eggs, bread, produce, meat, pantry and household staples). Each flyer item is matched to that list with keyword anchors and word-boundary rules. Multi-item bundles, mismatched sizes (for example a 1 L carton against a 4 L jug) and implausible prices are rejected automatically.</p>
      <h2>3. Ranking</h2>
      <p>For each item we list every nearby store with a current price, sorted lowest first. “Savings” is the difference between the highest and lowest current price in your area. Sale prices are labelled, and we show the regular price when the flyer gives one.</p>
      <h2>4. Freshness</h2>
      <p>Data refreshes daily. Expired flyer prices are removed automatically. Each page shows the date of the last update and the flyer validity date.</p>
      <h2>5. Corrections</h2>
      <p>Spotted a wrong price? <Link href="/report">Report it</Link>. Reports are reviewed within 24 hours and confirmed fixes are applied in the next refresh.</p>
      <h2>6. Independence</h2>
      <p>No one can pay to change a ranking. Advertising, sponsorships and affiliate links are labelled and kept separate from price data. See our <Link href="/affiliate-disclosure">disclosure</Link>.</p>
      <h2>7. Guides and articles</h2>
      <p>Our savings guides are written and fact-checked by people, and updated when store policies change. AI tools may assist with drafting or data processing, but every published guide is reviewed before it goes live.</p>
    </LegalPage>
  );
}
