import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Accessibility Statement', description: 'daily.sale’s commitment to WCAG 2.1 AA and the AODA, and how to report a barrier.' };

export default function AccessibilityPage() {
  return (
    <LegalPage kicker="Accessibility" title="Accessibility Statement" intro="Saving money on groceries matters to everyone. We design daily.sale to be usable by as many people as possible, including people who use screen readers, keyboard navigation, magnification or voice control.">
      <h2>Our standard</h2>
      <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and to meet Ontario’s Accessibility for Ontarians with Disabilities Act (AODA) requirements.</p>
      <h2>What we do</h2>
      <ul>
        <li>Semantic HTML with headings, landmarks and labelled form fields.</li>
        <li>High-contrast colour palette; prices are never conveyed by colour alone.</li>
        <li>Full keyboard navigation and visible focus states.</li>
        <li>Responsive layouts that reflow to 320 px wide and support 200% zoom.</li>
        <li>Plain-language guides and captions on our video content where available.</li>
      </ul>
      <h2>Known limitations</h2>
      <p>Some third-party content, such as ads and embedded videos, is outside our direct control. We choose providers that support accessibility and report issues to them.</p>
      <h2>Report a barrier</h2>
      <p>Tell us what page you were on and what happened through our <Link href="/contact">contact form</Link> (choose “Accessibility”). We respond within 5 business days and can provide information in an alternative format on request.</p>
    </LegalPage>
  );
}
