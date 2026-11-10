import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy',
  description: 'How daily.sale collects, uses and protects personal information, including Google AdSense advertising cookies and your opt-out choices.'
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" intro="daily.sale (“we”, “us”) respects your privacy. This policy explains what we collect, why, who we share it with, and the choices you have. It is written to meet Canada’s Personal Information Protection and Electronic Documents Act (PIPEDA) and Canada’s Anti-Spam Legislation (CASL).">
      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Information you give us:</strong> your email address and optional postal code when you subscribe to deal alerts; your name, email, organization and message when you use a contact, partnership, advertising, careers, contest, price-report or donation form.</li>
        <li><strong>Postal-code lookups:</strong> when you enter a postal code to see local deals, we use only the first characters to find nearby stores. We do not store it against your identity.</li>
        <li><strong>Automatically collected data:</strong> standard server logs (IP address, browser type, pages visited, referring page, date and time) and cookie identifiers, described below.</li>
      </ul>
      <p>We do not knowingly collect information from children under 13. daily.sale is a general-audience site and is not directed to children.</p>

      <h2>2. How we use information</h2>
      <ul>
        <li>To show grocery prices for your area and operate the site.</li>
        <li>To send the deal alerts you asked for (you can unsubscribe in any email).</li>
        <li>To reply to inquiries, review price reports, run contests and process donations.</li>
        <li>To measure traffic, prevent abuse and improve accuracy.</li>
        <li>To show advertising that keeps the site free (see section 4).</li>
      </ul>
      <p>We do not sell, rent or trade your personal information.</p>

      <h2>3. Cookies and similar technologies</h2>
      <p>We use a small number of first-party cookies or local-storage entries (for example, to remember that you closed the cookie notice). Third parties, including Google, also set cookies when ads or analytics load. Details are in our <Link href="/cookies">Cookie Policy</Link>.</p>

      <h2>4. Advertising — Google AdSense</h2>
      <p>We use Google AdSense to show ads. In line with Google’s requirements:</p>
      <ul>
        <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
        <li>Google’s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</li>
        <li>You may opt out of personalised advertising by visiting <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a>. You can also opt out of some third-party vendors’ use of cookies for personalised advertising at <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener">aboutads.info</a> or, in Canada, <a href="https://youradchoices.ca/" target="_blank" rel="noopener">youradchoices.ca</a>.</li>
        <li>Learn how Google uses information from sites that use its services at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</li>
      </ul>
      <p>Where required by law (for example, for visitors in the EEA, UK or Switzerland), ads are served only after consent is collected through a Google-certified consent tool; otherwise only non-personalised ads are shown.</p>

      <h2>5. Analytics</h2>
      <p>We may use privacy-friendly analytics (such as Google Analytics with IP anonymisation or Vercel Web Analytics) to understand which pages are useful. These tools receive aggregated usage data only.</p>

      <h2>6. Service providers</h2>
      <p>We use trusted processors to run the site: hosting (Vercel), source and automation (GitHub), form delivery (Formspree or FormSubmit), email delivery, and payment processors for donations (for example Stripe or PayPal). They may process data outside Canada, including in the United States, under contractual safeguards. Payment card details are handled by the payment processor and never touch our servers.</p>

      <h2>7. Email and CASL</h2>
      <p>We only send commercial emails to people who have given express consent (by subscribing) or where implied consent applies (for example, replying to your inquiry). Every alert email identifies us and includes a working unsubscribe link, honoured within 10 business days.</p>

      <h2>8. Retention</h2>
      <p>Subscriber emails are kept until you unsubscribe. Inquiry, contest and price-report submissions are kept for up to 24 months, then deleted. Server logs are kept for up to 30 days.</p>

      <h2>9. Your rights</h2>
      <p>You may ask to access, correct or delete your personal information, or withdraw consent, at any time through our <Link href="/contact">contact form</Link> (choose “Privacy request”). We respond within 30 days. If you are not satisfied, you may contact the Office of the Privacy Commissioner of Canada.</p>

      <h2>10. Security</h2>
      <p>All traffic is encrypted with HTTPS. Form submissions are delivered server-side and our contact inbox is never published on the site. No method of transmission is 100% secure, but we take reasonable safeguards appropriate to the sensitivity of the information.</p>

      <h2>11. Changes</h2>
      <p>We will post any changes on this page and update the date above. Material changes will be highlighted on the home page for 30 days.</p>
    </LegalPage>
  );
}
