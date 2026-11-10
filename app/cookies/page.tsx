import { LegalPage } from '@/components/LegalPage';

export const metadata = { title: 'Cookie Policy', description: 'Which cookies daily.sale and its advertising partners use, and how to control them.' };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" intro="Cookies are small text files stored by your browser. Here is every category used on daily.sale and how to control them.">
      <table>
        <thead><tr><th>Category</th><th>Set by</th><th>Purpose</th><th>Can I refuse?</th></tr></thead>
        <tbody>
          <tr><td>Essential</td><td>daily.sale</td><td>Remembers that you dismissed the cookie notice; basic security.</td><td>Blocking may re-show the notice.</td></tr>
          <tr><td>Advertising</td><td>Google AdSense and its certified partners</td><td>Shows ads, limits repeats, measures performance, and (with consent where required) personalises ads based on your visits to this and other sites.</td><td>Yes — <a href="https://adssettings.google.com" target="_blank" rel="noopener">Google Ads Settings</a>, <a href="https://youradchoices.ca/" target="_blank" rel="noopener">youradchoices.ca</a>, or your browser settings.</td></tr>
          <tr><td>Analytics</td><td>Google Analytics / Vercel Analytics (if enabled)</td><td>Counts visits and popular pages in aggregate.</td><td>Yes — browser settings or the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google Analytics opt-out add-on</a>.</td></tr>
          <tr><td>Embedded media</td><td>YouTube (privacy-enhanced mode)</td><td>Plays embedded videos. No cookies are set until you press play.</td><td>Yes — don’t play embedded videos.</td></tr>
        </tbody>
      </table>
      <h2>Managing cookies</h2>
      <p>Most browsers let you block or delete cookies in their settings. Blocking advertising cookies does not remove ads — you will see non-personalised ads instead.</p>
      <h2>Consent for visitors outside Canada</h2>
      <p>Visitors from the EEA, UK and Switzerland are asked for consent through a Google-certified consent management platform before personalised advertising cookies are set.</p>
    </LegalPage>
  );
}
