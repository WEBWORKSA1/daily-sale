import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Copyright Complaints (DMCA & Notice-and-Notice)', description: 'How to report copyright or trademark concerns about content on daily.sale.' };

export default function DmcaPage() {
  return (
    <LegalPage kicker="Copyright" title="Copyright Complaints" intro="We respect intellectual property. If you believe material on daily.sale infringes your copyright or trademark, send us a notice and we will review it promptly.">
      <h2>What to include</h2>
      <ol>
        <li>Your name, organization, mailing address and email.</li>
        <li>Identification of the work you claim is infringed.</li>
        <li>The exact URL(s) on daily.sale where the material appears.</li>
        <li>A statement that you have a good-faith belief the use is not authorized by the owner, its agent or the law.</li>
        <li>A statement, under penalty of perjury, that the information is accurate and you are the owner or authorized to act for the owner.</li>
        <li>Your physical or electronic signature.</li>
      </ol>
      <h2>How to send it</h2>
      <p>Use our <Link href="/contact">contact form</Link> and choose “Copyright / DMCA notice”. We acknowledge notices within 2 business days and remove or disable clearly infringing material without delay.</p>
      <h2>Counter-notice</h2>
      <p>If your material was removed in error, you may send a counter-notice with the same details plus consent to the jurisdiction of the courts of Ontario, Canada.</p>
      <h2>Canadian notice-and-notice regime</h2>
      <p>Where applicable, we also comply with the notice-and-notice provisions of the Copyright Act (Canada).</p>
      <h2>Repeat infringers</h2>
      <p>We block contributors who repeatedly submit infringing material.</p>
    </LegalPage>
  );
}
