import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Trademark & Copyright Disclosure', description: 'Ownership, trademark and copyright notices for daily.sale, plus third-party trademark acknowledgements.' };

const RETAILERS = ['Walmart', 'No Frills', 'Food Basics', 'FreshCo', 'Sobeys', 'Zehrs', 'Giant Tiger', 'Metro', 'Loblaws', 'Real Canadian Superstore', 'PC Optimum', 'Scene+', 'Flipp'];

export default function LegalNoticePage() {
  const year = new Date().getFullYear();
  return (
    <LegalPage kicker="Trademark & copyright" title="Trademark & Copyright Disclosure">
      <h2>Copyright</h2>
      <p>© {year} daily.sale. All rights reserved. The website, including its design, layout, source code, text, savings guides, graphics, product taxonomy, price rankings and the selection and arrangement of data, is an original work protected by the Copyright Act (Canada) and international treaties. No part may be copied, republished, framed, scraped or redistributed without prior written permission, except for personal, non-commercial use and short quotations with a link back to the source page.</p>

      <h2>Trademarks</h2>
      <p>“daily.sale”™, the daily.sale wordmark, the red-dot logo and the slogan “Every grocer’s flyer. One page. Ranked cheapest.”™ are trademarks of daily.sale. Use of these marks without permission is prohibited, other than fair reference to our service.</p>

      <h2>Third-party trademarks</h2>
      <p>The following and all other retailer, brand and product names that appear on this site are trademarks or registered trademarks of their respective owners: {RETAILERS.join(', ')}. They are used for identification and comparison purposes only (nominative fair use). Their appearance does not imply any affiliation with, sponsorship by, or endorsement of daily.sale.</p>

      <h2>Flyer data</h2>
      <p>Prices are factual information taken from flyers that retailers publish publicly to advertise to consumers. We display facts (item, price, store, validity) and link to the retailer’s own flyer; we do not reproduce full flyer pages.</p>

      <h2>Licensing and permissions</h2>
      <p>To license our data, syndicate our guides, or use our marks, please use the <Link href="/contact">contact form</Link> and choose “Data licensing” or “Partnership”.</p>

      <h2>Infringement notices</h2>
      <p>If you believe content on daily.sale infringes your rights, follow our <Link href="/dmca">copyright complaint process</Link>.</p>
    </LegalPage>
  );
}
